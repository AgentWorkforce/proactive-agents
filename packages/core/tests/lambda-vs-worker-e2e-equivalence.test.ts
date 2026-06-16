import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { Nango } from "@nangohq/node";
import { RelayFileClient } from "@relayfile/sdk";
import { Resource } from "sst";
import type { SQSRecord } from "aws-lambda";
import { setDbForTesting } from "../src/db/client.js";
import type { NangoSyncJob } from "../src/sync/nango-sync-job.js";
import { processNangoSyncJob } from "../src/sync/nango-sync-runtime.js";
import { providerModelKey } from "../src/sync/provider-write-planner.js";
import {
  writeBatchToRelayfile,
  type RelayfileWriteClient,
} from "../src/sync/record-writer.js";
import {
  processWebhookQueueMessage,
  type WebhookProcessor,
} from "../../webhook-worker/src/queue-consumer.js";
import type { NangoSyncQueueMessage } from "../../webhook-worker/src/types.js";
import type {
  DedupeClaimInput,
  DedupeClaimResult,
  DedupeKey,
  NangoSyncDedupStore,
} from "../../webhook-worker/src/dedup.js";

type CapturedOp = {
  op: "write" | "delete";
  path: string;
  contents?: string;
  contentType?: string;
  baseRevision?: string;
  semantics?: unknown;
};

type ProviderCase = {
  name: string;
  job: NangoSyncJob;
  records: {
    create: Record<string, unknown>;
    update: Record<string, unknown>;
    delete?: Record<string, unknown>;
  };
};

type ActiveNangoPages = {
  pages: Record<string, { records: Record<string, unknown>[]; next_cursor: string | null }>;
  calls: string[];
};

const fixedDeletedAt = "2026-05-20T00:00:00.000Z";
const induceWorkerDivergence = process.env.GATE11_INDUCE_WORKER_DIVERGENCE === "1";
let activeNangoPages: ActiveNangoPages | null = null;
let activeRelayfileClient: CapturingRelayfileClient | null = null;
let globalsPatched = false;

class CapturingRelayfileClient implements RelayfileWriteClient {
  readonly ops: CapturedOp[] = [];
  readonly files = new Map<string, string>();
  readonly revisions = new Map<string, string>();

  constructor(seed: Record<string, string> = {}) {
    for (const [path, contents] of Object.entries(seed)) {
      this.files.set(path, contents);
      this.revisions.set(path, `rev:${path}`);
    }
  }

  async writeFile(input: {
    path: string;
    content: string;
    contentType: string;
    baseRevision?: string;
    semantics?: unknown;
  }): Promise<void> {
    this.ops.push({
      op: "write",
      path: input.path,
      contents: input.content,
      contentType: input.contentType,
      ...(input.baseRevision ? { baseRevision: input.baseRevision } : {}),
      ...(input.semantics ? { semantics: input.semantics } : {}),
    });
    this.files.set(input.path, input.content);
    this.revisions.set(input.path, `rev:${input.path}`);
  }

  async deleteFile(input: { path: string }): Promise<void> {
    this.ops.push({ op: "delete", path: input.path });
    this.files.delete(input.path);
    this.revisions.delete(input.path);
  }

  async readFile(
    _workspaceId: string,
    path: string,
  ): Promise<{ content?: string; revision?: string }> {
    if (!this.files.has(path)) {
      const error = new Error("not found") as Error & { status: number };
      error.status = 404;
      throw error;
    }
    return {
      content: this.files.get(path),
      revision: this.revisions.get(path) ?? `rev:${path}`,
    };
  }
}

class AlwaysClaimDedupStore implements NangoSyncDedupStore {
  async claim(input: DedupeClaimInput): Promise<DedupeClaimResult> {
    return {
      type: "claimed",
      key: { surface: input.surface, dedupeId: input.dedupeId },
      attemptCount: 1,
      leaseExpiresAt: new Date("2026-05-20T00:01:00.000Z"),
    };
  }

  async complete(_key: DedupeKey): Promise<void> {}

  async fail(_key: DedupeKey): Promise<void> {}
}

function patchGlobals(): void {
  if (globalsPatched) return;
  process.env.SST_RESOURCE_App = JSON.stringify({ name: "cloud", stage: "test" });
  process.env.SST_RESOURCE_NangoSecretKey = JSON.stringify({ value: "test_nango_secret" });
  process.env.SST_RESOURCE_NangoSyncQueue = JSON.stringify({ url: "https://sqs.test/nango-sync" });
  process.env.NANGO_SYNC_RELAYAUTH_API_KEY = "test_relayauth_key";
  Object.assign(Resource as unknown as Record<string, unknown>, {
    App: { name: "cloud", stage: "test" },
    NangoSecretKey: { value: "test_nango_secret" },
    NangoSyncQueue: { url: "https://sqs.test/nango-sync" },
  });

  const nangoPrototype = Nango.prototype as unknown as {
    listRecords: (config: { cursor?: string | null }) => Promise<unknown>;
  };
  nangoPrototype.listRecords = async (config: { cursor?: string | null }) => {
    assert.ok(activeNangoPages, "Nango listRecords called without active fixture pages");
    const cursor = config.cursor?.trim() || "first";
    activeNangoPages.calls.push(cursor);
    const page = activeNangoPages.pages[cursor];
    assert.ok(page, `missing fake Nango page for cursor ${cursor}`);
    return page;
  };

  const relayfilePrototype = RelayFileClient.prototype as unknown as RelayfileWriteClient;
  relayfilePrototype.writeFile = async (input) => {
    assert.ok(activeRelayfileClient, "Relayfile writeFile called without active client");
    await activeRelayfileClient.writeFile(input);
  };
  relayfilePrototype.deleteFile = async (input) => {
    assert.ok(activeRelayfileClient, "Relayfile deleteFile called without active client");
    await activeRelayfileClient.deleteFile(input);
  };
  relayfilePrototype.readFile = async (workspaceId, path) => {
    assert.ok(activeRelayfileClient, "Relayfile readFile called without active client");
    return activeRelayfileClient.readFile(workspaceId, path);
  };

  setDbForTesting({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                async limit() {
                  return [];
                },
              };
            },
          };
        },
      };
    },
  } as never);
  globalsPatched = true;
}

function readBatchSaveRecord<T extends Record<string, unknown>>(
  path: string,
  model: string,
  index = 0,
): T {
  const fixture = JSON.parse(readFileSync(path, "utf8")) as {
    nango?: { batchSave?: Record<string, T[]> };
  };
  const record = fixture.nango?.batchSave?.[model]?.[index];
  assert.ok(record, `missing ${model}[${index}] in ${path}`);
  return record;
}

function cloneRecord<T extends Record<string, unknown>>(record: T): T {
  return JSON.parse(JSON.stringify(record)) as T;
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonKeys(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJsonKeys(child)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJsonKeys(value));
}

function tombstone(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...cloneRecord(record),
    _nango_metadata: {
      last_action: "deleted",
      deleted_at: fixedDeletedAt,
    },
  };
}

function pagesFor(records: ProviderCase["records"]): ActiveNangoPages {
  const updateNextCursor = records.delete ? "delete" : null;
  return {
    calls: [],
    pages: {
      first: { records: [records.create], next_cursor: "update" },
      update: { records: [records.update], next_cursor: updateNextCursor },
      ...(records.delete ? { delete: { records: [records.delete], next_cursor: null } } : {}),
    },
  };
}

function sqsEventFor(job: NangoSyncJob): { Records: SQSRecord[] } {
  return {
    Records: [{
      messageId: `lambda-${providerModelKey(job)}`,
      receiptHandle: "receipt-1",
      body: JSON.stringify(job),
      attributes: {} as SQSRecord["attributes"],
      messageAttributes: {},
      md5OfBody: "md5",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:us-east-1:000000000000:nango-sync",
      awsRegion: "us-east-1",
    }],
  };
}

function workerQueueMessageFor(job: NangoSyncJob): {
  id: string;
  timestamp: Date;
  attempts: number;
  body: NangoSyncQueueMessage;
  ackCalls: number;
  retryCalls: number;
  ack(): void;
  retry(): void;
} {
  const body = JSON.stringify(job);
  return {
    id: `worker-${providerModelKey(job)}`,
    timestamp: new Date("2026-05-20T00:00:00.000Z"),
    attempts: 1,
    ackCalls: 0,
    retryCalls: 0,
    body: {
      version: 2,
      provider: "nango",
      ingress: "nango-sync",
      requestId: `req-${providerModelKey(job)}`,
      receivedAt: "2026-05-20T00:00:00.000Z",
      headers: {},
      payload: {
        storage: "inline",
        body,
        sizeBytes: Buffer.byteLength(body),
        sha256: createHash("sha256").update(body).digest("hex"),
      },
      nango: {
        connectionId: job.connectionId,
        providerConfigKey: job.providerConfigKey,
        syncName: job.syncName,
        model: job.model,
        queryTimeStamp: job.modifiedAfter,
        cursor: job.cursor ?? undefined,
      },
      dedupe: {
        kind: "nango-sync",
        connectionId: job.connectionId,
        syncName: job.syncName,
        model: job.model,
        windowKey: job.modifiedAfter,
        cursorKey: job.cursor ?? "first",
      },
    },
    ack() {
      this.ackCalls += 1;
    },
    retry() {
      this.retryCalls += 1;
    },
  };
}

async function runLambdaPath(testCase: ProviderCase): Promise<CapturedOp[]> {
  patchGlobals();
  activeNangoPages = pagesFor(testCase.records);
  activeRelayfileClient = new CapturingRelayfileClient();
  const { handler } = await import("../src/sync/nango-sync-worker.js");
  await handler(
    sqsEventFor(testCase.job),
    { getRemainingTimeInMillis: () => 15 * 60 * 1000 } as never,
    () => undefined,
  );
  assert.deepEqual(
    activeNangoPages.calls,
    testCase.records.delete ? ["first", "update", "delete"] : ["first", "update"],
  );
  return activeRelayfileClient.ops;
}

async function withoutConsoleErrors<T>(
  label: string,
  action: () => Promise<T>,
): Promise<T> {
  const originalError = console.error;
  const errors: unknown[][] = [];
  console.error = ((...args: unknown[]) => {
    errors.push(args);
    originalError(...args);
  }) as Console["error"];
  try {
    const result = await action();
    assert.deepEqual(
      errors,
      [],
      `${label} should not log write-path errors`,
    );
    return result;
  } finally {
    console.error = originalError;
  }
}

async function runWorkerPath(testCase: ProviderCase): Promise<CapturedOp[]> {
  patchGlobals();
  activeNangoPages = pagesFor(testCase.records);
  const client = new CapturingRelayfileClient();
  activeRelayfileClient = client;

  const processor: WebhookProcessor = async (_message, body) => {
    assert.equal(body.ingress, "nango-sync");
    const job = JSON.parse(body.payload.body) as NangoSyncJob;
    const result = await processNangoSyncJob(job, Number.POSITIVE_INFINITY, {
      nango: {
        async listRecords(config) {
          assert.ok(activeNangoPages, "Worker Nango client called without active pages");
          const cursor = config.cursor?.trim() || "first";
          activeNangoPages.calls.push(cursor);
          const page = activeNangoPages.pages[cursor];
          assert.ok(page, `missing fake Worker Nango page for cursor ${cursor}`);
          return page;
        },
      },
      queue: {
        async reenqueue() {
          assert.fail("equivalence fixture should not checkpoint");
        },
      },
      relayfile: {
        async writeBatch(records, syncJob) {
          return writeBatchToRelayfile(client, records, syncJob);
        },
      },
      readiness: {
        async markRunning() {},
        async markComplete() {},
      },
      enabledProviderModels: new Set([providerModelKey(job)]),
      logger: { info() {} },
    });
    assert.equal(result.status, "completed");
    assert.equal(result.errors, 0);
    return "ack";
  };

  const message = workerQueueMessageFor(testCase.job);
  await processWebhookQueueMessage(
    message as never,
    { NANGO_SYNC_DEDUP: {} } as never,
    {} as never,
    { dedupStore: new AlwaysClaimDedupStore(), processor },
  );
  assert.equal(message.ackCalls, 0, "processor seam does not ack the message directly");
  assert.equal(message.retryCalls, 0);
  assert.deepEqual(
    activeNangoPages.calls,
    testCase.records.delete ? ["first", "update", "delete"] : ["first", "update"],
  );
  const ops = client.ops;
  if (induceWorkerDivergence) {
    const firstWrite = ops.find((op) => op.op === "write");
    assert.ok(firstWrite, "induced divergence requires at least one worker write");
    firstWrite.path = `${firstWrite.path}.induced-divergence`;
  }
  return ops;
}

function mutateTitleFields(record: Record<string, unknown>, suffix: string): Record<string, unknown> {
  const next = cloneRecord(record);
  if (typeof next.summary === "string") next.summary = `${next.summary} ${suffix}`;
  if (typeof next.title === "string") next.title = `${next.title} ${suffix}`;
  if (typeof next.name === "string") next.name = `${next.name} ${suffix}`;
  if (typeof next.snippet === "string") next.snippet = `${next.snippet} ${suffix}`;
  const fields = next.fields;
  if (fields && typeof fields === "object" && !Array.isArray(fields)) {
    const mutableFields = fields as Record<string, unknown>;
    if (typeof mutableFields.summary === "string") {
      mutableFields.summary = `${mutableFields.summary} ${suffix}`;
    }
  }
  const run = next.run;
  if (run && typeof run === "object" && !Array.isArray(run)) {
    const mutableRun = run as Record<string, unknown>;
    if (typeof mutableRun.title === "string") {
      mutableRun.title = `${mutableRun.title} ${suffix}`;
    }
  }
  return next;
}

const jiraIssue = readBatchSaveRecord(
  "nango-integrations/jira-relay/tests/fetch-issues.test.json",
  "JiraIssue",
);
const googleMailMessage = readBatchSaveRecord(
  "nango-integrations/google-mail-relay/tests/fetch-messages.test.json",
  "GoogleMailMessage",
);
const googleCalendarEvent = readBatchSaveRecord(
  "nango-integrations/google-calendar-relay/tests/fetch-events.test.json",
  "GoogleCalendarEvent",
);

const gitlabIssue = {
  id: "3001",
  iid: "17",
  project_id: "20",
  project_path: "acme/api",
  title: "Fix webhook fanout",
  state: "opened",
  updated_at: "2026-05-15T10:30:00.000Z",
  web_url: "https://gitlab.com/acme/api/-/issues/17",
};

// x-relay and gitlab-relay currently do not ship *.test.json sync fixtures in
// nango-integrations, so these use the existing tier-2 smoke samples as the
// representative records for the E2E path proof.
const xSearchBundle = {
  id: "search-1",
  run: {
    id: "search-1",
    title: "Agent Relay",
    query: "agent relay",
    mode: "recent",
    requestedAt: "2026-05-17T10:00:00.000Z",
    resultCount: 1,
    costEstimate: {
      posts: 1,
      users: 1,
      postReadUnitUsd: 0.005,
      userReadUnitUsd: 0.01,
      estimatedUsd: 0.015,
      cappedByBudget: false,
      cappedByMaxResults: false,
    },
    source: {
      provider: "x",
      endpoint: "/2/tweets/search/recent",
      docs: "https://docs.x.com/x-api/posts/search/introduction",
    },
  },
  posts: [{
    id: "post-1",
    text: "Relayfile social search",
    author_id: "user-1",
    conversation_id: "conversation-1",
    created_at: "2026-05-17T10:00:00.000Z",
  }],
  users: [{ id: "user-1", username: "agentrelay", name: "Agent Relay" }],
  results: [{
    id: "search-1:post-1",
    searchId: "search-1",
    postId: "post-1",
    rank: 1,
    matchedAt: "2026-05-17T10:00:00.000Z",
    canonicalPath: "/x/posts/relayfile-social-search__post-1.json",
    query: "agent relay",
  }],
  rawResponses: [],
};

const providerCases: ProviderCase[] = [
  {
    name: "jira",
    job: {
      type: "nango_sync",
      workspaceId: "rw_gate11",
      provider: "jira",
      providerConfigKey: "jira-relay",
      connectionId: "conn_jira",
      syncName: "fetch-issues",
      model: "JiraIssue",
      modifiedAfter: "1970-01-01T00:00:00.000Z",
      cursor: null,
    },
    records: {
      create: jiraIssue,
      update: mutateTitleFields(jiraIssue, "updated"),
      delete: tombstone(mutateTitleFields(jiraIssue, "updated")),
    },
  },
  {
    name: "gitlab",
    job: {
      type: "nango_sync",
      workspaceId: "rw_gate11",
      provider: "gitlab",
      providerConfigKey: "gitlab-relay",
      connectionId: "conn_gitlab",
      syncName: "fetch-issues",
      model: "GitLabIssue",
      modifiedAfter: "1970-01-01T00:00:00.000Z",
      cursor: null,
    },
    records: {
      create: gitlabIssue,
      update: mutateTitleFields(gitlabIssue, "updated"),
      delete: tombstone(mutateTitleFields(gitlabIssue, "updated")),
    },
  },
  {
    name: "x",
    job: {
      type: "nango_sync",
      workspaceId: "rw_gate11",
      provider: "x",
      providerConfigKey: "x-relay",
      connectionId: "conn_x",
      syncName: "fetch-searches",
      model: "XSearchBundle",
      modifiedAfter: "1970-01-01T00:00:00.000Z",
      cursor: null,
    },
    records: {
      create: xSearchBundle,
      update: mutateTitleFields(xSearchBundle, "updated"),
    },
  },
  {
    name: "google-mail",
    job: {
      type: "nango_sync",
      workspaceId: "rw_gate11",
      provider: "google-mail",
      providerConfigKey: "google-mail-relay",
      connectionId: "conn_google_mail",
      syncName: "fetch-messages",
      model: "GoogleMailMessage",
      modifiedAfter: "1970-01-01T00:00:00.000Z",
      cursor: null,
    },
    records: {
      create: googleMailMessage,
      update: mutateTitleFields(googleMailMessage, "updated"),
      delete: tombstone(mutateTitleFields(googleMailMessage, "updated")),
    },
  },
  {
    name: "google-calendar",
    job: {
      type: "nango_sync",
      workspaceId: "rw_gate11",
      provider: "google-calendar",
      providerConfigKey: "google-calendar-relay",
      connectionId: "conn_google_calendar",
      syncName: "fetch-events",
      model: "GoogleCalendarEvent",
      modifiedAfter: "1970-01-01T00:00:00.000Z",
      cursor: null,
    },
    records: {
      create: googleCalendarEvent,
      update: mutateTitleFields(googleCalendarEvent, "updated"),
      delete: tombstone(mutateTitleFields(googleCalendarEvent, "updated")),
    },
  },
];

describe("Gate 11 Lambda-vs-Worker E2E equivalence", () => {
  for (const testCase of providerCases) {
    it(`${testCase.name} emits byte-identical Relayfile operations`, async () => {
      const lambdaOps = await withoutConsoleErrors(
        `${testCase.name} Lambda path`,
        () => runLambdaPath(testCase),
      );
      const workerOps = await withoutConsoleErrors(
        `${testCase.name} Worker path`,
        () => runWorkerPath(testCase),
      );

      assert.ok(lambdaOps.length > 0, `${testCase.name} must emit writes`);
      if (testCase.records.delete) {
        assert.ok(
          lambdaOps.some((op) => op.op === "delete"),
          `${testCase.name} fixture must exercise terminal delete state`,
        );
      }
      const canonicalLambdaOps = canonicalJson(lambdaOps);
      const canonicalWorkerOps = canonicalJson(workerOps);
      assert.equal(
        canonicalWorkerOps,
        canonicalLambdaOps,
        `${testCase.name} Lambda and Worker Relayfile ops diverged`,
      );
    });
  }
});
