import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseNangoSyncJob,
  type NangoSyncJob,
} from "../src/sync/nango-sync-job.js";
import {
  processNangoSyncJob,
  type NangoSyncRuntimeDeps,
} from "../src/sync/nango-sync-runtime.js";
import {
  ProviderNotParityEnabledError,
  providerModelKey,
} from "../src/sync/provider-write-planner.js";

function job(overrides: Partial<NangoSyncJob> = {}): NangoSyncJob {
  return {
    type: "nango_sync",
    provider: "confluence",
    providerConfigKey: "confluence-relay",
    connectionId: "conn_1",
    syncName: "fetch-spaces",
    model: "ConfluenceSpace",
    modifiedAfter: "2026-05-19T00:00:00.000Z",
    cursor: null,
    workspaceId: "rw_test",
    ...overrides,
  };
}

function deps(input: Partial<NangoSyncRuntimeDeps> = {}): NangoSyncRuntimeDeps & {
  calls: string[];
  reenqueueJobs: NangoSyncJob[];
} {
  const calls: string[] = [];
  const reenqueueJobs: NangoSyncJob[] = [];
  return {
    calls,
    reenqueueJobs,
    nango: {
      async listRecords(config) {
        calls.push(`list:${config.cursor ?? "first"}`);
        return {
          records: [{ id: config.cursor ?? "first" }],
          next_cursor: config.cursor ? null : "next",
        };
      },
    },
    queue: {
      async reenqueue(nextJob) {
        calls.push("reenqueue");
        reenqueueJobs.push(nextJob);
      },
    },
    relayfile: {
      async writeBatch(records) {
        calls.push(`write:${records.length}`);
        return { written: records.length, deleted: 0, errors: 0 };
      },
    },
    readiness: {
      async markRunning() {
        calls.push("running");
      },
      async markComplete() {
        calls.push("complete");
      },
    },
    now: () => 0,
    ...input,
  };
}

describe("processNangoSyncJob", () => {
  it("parses recordOffset as optional, validates it, and preserves valid offsets", () => {
    const legacy = parseNangoSyncJob(job());
    assert.equal("recordOffset" in legacy, false);

    const resumed = parseNangoSyncJob(job({ recordOffset: 2 }));
    assert.equal(resumed.recordOffset, 2);

    assert.throws(
      () => parseNangoSyncJob(job({ recordOffset: -1 })),
      /recordOffset must be a non-negative integer/,
    );
    assert.throws(
      () => parseNangoSyncJob({ ...job(), recordOffset: 1.5 }),
      /recordOffset must be a non-negative integer/,
    );
  });

  it("fails closed before touching Nango or Relayfile when parity is not enabled", async () => {
    const unsupported = job({
      provider: "unsupported",
      providerConfigKey: "unsupported-relay",
      syncName: "fetch-unknown",
      model: "UnknownModel",
    });
    const runtimeDeps = deps();

    await assert.rejects(
      () => processNangoSyncJob(unsupported, Number.POSITIVE_INFINITY, runtimeDeps),
      ProviderNotParityEnabledError,
    );
    assert.deepEqual(runtimeDeps.calls, []);
  });

  it("processes pages through injected clients when a provider/model is explicitly enabled", async () => {
    const input = job();
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
    });

    const result = await processNangoSyncJob(input, Number.POSITIVE_INFINITY, runtimeDeps);

    assert.deepEqual(runtimeDeps.calls, [
      "running",
      "list:first",
      "write:1",
      "list:next",
      "write:1",
      "complete",
    ]);
    assert.deepEqual(result, {
      status: "completed",
      cursor: null,
      written: 2,
      deleted: 0,
      errors: 0,
    });
  });

  it("re-enqueues a checkpoint before crossing the consumer deadline", async () => {
    const input = job({ cursor: "cursor-1" });
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
      now: () => 10,
    });

    const result = await processNangoSyncJob(input, 1, runtimeDeps);

    assert.deepEqual(runtimeDeps.calls, ["running", "reenqueue"]);
    assert.equal(runtimeDeps.reenqueueJobs[0]?.cursor, "cursor-1");
    assert.equal(result.status, "checkpointed");
  });

  it("passes recordOffset to the writer and clears it after advancing cursor", async () => {
    const input = job({ cursor: "cursor-1", recordOffset: 2 });
    const writeCalls: Array<{
      ids: string[];
      startOffset: number | undefined;
    }> = [];
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
      nango: {
        async listRecords(config) {
          if (config.cursor === "cursor-1") {
            return {
              records: [
                { id: "skip-0" },
                { id: "skip-1" },
                { id: "write-2" },
              ],
              next_cursor: "cursor-2",
            };
          }
          assert.equal(config.cursor, "cursor-2");
          return {
            records: [{ id: "write-next-page" }],
            next_cursor: null,
          };
        },
      },
      relayfile: {
        async writeBatch(records, _writeJob, options) {
          writeCalls.push({
            ids: records.map((record) => String(record.id)),
            startOffset: options?.startOffset,
          });
          return { written: records.length, deleted: 0, errors: 0 };
        },
      },
    });

    const result = await processNangoSyncJob(
      input,
      Number.POSITIVE_INFINITY,
      runtimeDeps,
    );

    assert.equal(result.status, "completed");
    assert.equal("recordOffset" in result, false);
    assert.deepEqual(writeCalls, [
      {
        ids: ["skip-0", "skip-1", "write-2"],
        startOffset: 2,
      },
      {
        ids: ["write-next-page"],
        startOffset: 0,
      },
    ]);
    assert.deepEqual(runtimeDeps.reenqueueJobs, []);
  });

  it("re-enqueues a cursor-relative recordOffset when the writer checkpoints mid-page", async () => {
    const input = job({ cursor: "cursor-1" });
    let shouldCheckpointResult: boolean | undefined;
    let now = 0;
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
      now: () => now,
      nango: {
        async listRecords() {
          return {
            records: [{ id: "one" }, { id: "two" }, { id: "three" }],
            next_cursor: "cursor-2",
          };
        },
      },
      relayfile: {
        async writeBatch(_records, _writeJob, options) {
          now = 10;
          shouldCheckpointResult = options?.shouldCheckpoint?.(2);
          return { written: 2, deleted: 0, errors: 0, checkpointOffset: 2 };
        },
      },
    });

    const result = await processNangoSyncJob(input, 1, runtimeDeps);

    assert.equal(shouldCheckpointResult, true);
    assert.equal(result.status, "checkpointed");
    assert.equal(result.cursor, "cursor-1");
    assert.equal(result.recordOffset, 2);
    assert.deepEqual(runtimeDeps.reenqueueJobs, [
      { ...input, cursor: "cursor-1", recordOffset: 2 },
    ]);
    assert.deepEqual(runtimeDeps.calls, ["running", "reenqueue"]);
  });

  it("propagates workspace_busy without self re-enqueueing so SQS DLQ owns bounded retries", async () => {
    const input = job();
    const workspaceBusy = Object.assign(new Error("workspace busy"), {
      status: 429,
      code: "workspace_busy",
    });
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
      relayfile: {
        async writeBatch() {
          throw workspaceBusy;
        },
      },
    });

    await assert.rejects(
      () => processNangoSyncJob(input, Number.POSITIVE_INFINITY, runtimeDeps),
      workspaceBusy,
    );

    assert.deepEqual(runtimeDeps.reenqueueJobs, []);
    assert.deepEqual(runtimeDeps.calls, ["running", "list:first"]);
  });

  it("surfaces drizzle cause + PG code from a relayfile write error in the per-hop log (#743 regression guard)", async () => {
    const logs: Array<{ level: string; payload: unknown }> = [];
    const consoleSpy = {
      info: (_label: string, payload: unknown) =>
        logs.push({ level: "info", payload }),
      warn: (_label: string, payload: unknown) =>
        logs.push({ level: "warn", payload }),
      error: (_label: string, payload: unknown) =>
        logs.push({ level: "error", payload }),
    };
    const originalConsole = {
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    console.info = consoleSpy.info as unknown as Console["info"];
    console.warn = consoleSpy.warn as unknown as Console["warn"];
    console.error = consoleSpy.error as unknown as Console["error"];

    try {
      const input = job();
      // Simulate the exact #743 shape: drizzle wrapper with a PG cause
      // carrying the actionable `code` ("08006" connection_failure).
      const pgError = new Error("connection terminated unexpectedly");
      Object.assign(pgError, {
        name: "PostgresError",
        code: "08006",
        severity: "FATAL",
      });
      const drizzleErr = new Error("Failed query: select 1", { cause: pgError });

      const runtimeDeps = deps({
        enabledProviderModels: new Set([providerModelKey(input)]),
        relayfile: {
          async writeBatch() {
            throw drizzleErr;
          },
        },
      });

      await assert.rejects(
        () => processNangoSyncJob(input, Number.POSITIVE_INFINITY, runtimeDeps),
        drizzleErr,
      );

      const errorLogs = logs.filter((l) => l.level === "error");
      assert.ok(errorLogs.length >= 1, "expected at least one error log");
      const payload = errorLogs[0].payload as Record<string, unknown>;
      assert.equal(payload.area, "nango-webhook-path");
      assert.equal(payload.hop, "write");
      assert.equal(payload.outcome, "error");
      // Non-vacuous gate: PG code from the deeper cause MUST be surfaced.
      assert.equal(payload.errorCode, "08006");
      assert.equal(payload.errorMessage, "Failed query: select 1");
      const chain = payload.errorCauseChain as Array<Record<string, unknown>>;
      assert.equal(chain.length, 2);
      assert.equal(chain[1].code, "08006");
      assert.equal(chain[1].severity, "FATAL");
    } finally {
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  });

  it("sets a non-empty errorCode when a batch write reports partial errors", async () => {
    const logs: Array<{ level: string; payload: unknown }> = [];
    const consoleSpy = {
      info: (_label: string, payload: unknown) =>
        logs.push({ level: "info", payload }),
      warn: (_label: string, payload: unknown) =>
        logs.push({ level: "warn", payload }),
      error: (_label: string, payload: unknown) =>
        logs.push({ level: "error", payload }),
    };
    const originalConsole = {
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    console.info = consoleSpy.info as unknown as Console["info"];
    console.warn = consoleSpy.warn as unknown as Console["warn"];
    console.error = consoleSpy.error as unknown as Console["error"];

    try {
      const input = job();
      const runtimeDeps = deps({
        enabledProviderModels: new Set([providerModelKey(input)]),
        nango: {
          async listRecords() {
            return { records: [{ id: "partial" }], next_cursor: null };
          },
        },
        relayfile: {
          async writeBatch() {
            return { written: 0, deleted: 0, errors: 1 };
          },
        },
      });

      await processNangoSyncJob(input, Number.POSITIVE_INFINITY, runtimeDeps);

      const writeErrorLog = logs
        .filter((l) => l.level === "error")
        .map((l) => l.payload as Record<string, unknown>)
        .find((payload) => payload.hop === "write");
      assert.ok(writeErrorLog, "expected write error log");
      assert.equal(writeErrorLog.outcome, "error");
      assert.equal(writeErrorLog.errorCode, "batch_partial_errors");
      assert.equal(typeof writeErrorLog.errorCode === "string", true);
      assert.ok((writeErrorLog.errorCode as string).length > 0);
    } finally {
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  });
});

describe("relayWorkspaceId translation", () => {
  it("writes batches against the relay workspace while keeping the job identity", async () => {
    const input = job({
      workspaceId: "34690534-24ab-4487-937c-10928921f104",
      relayWorkspaceId: "rw_7ccfea89",
    });
    const seen: string[] = [];
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
      relayfile: {
        async writeBatch(records, writeJob) {
          seen.push(writeJob.workspaceId);
          return { written: records.length, deleted: 0, errors: 0 };
        },
      },
    });

    await processNangoSyncJob(input, Number.POSITIVE_INFINITY, runtimeDeps);

    assert.deepEqual(seen, ["rw_7ccfea89", "rw_7ccfea89"]);
  });

  it("falls back to workspaceId when relayWorkspaceId is absent (in-flight legacy jobs)", async () => {
    const input = job();
    const seen: string[] = [];
    const runtimeDeps = deps({
      enabledProviderModels: new Set([providerModelKey(input)]),
      relayfile: {
        async writeBatch(records, writeJob) {
          seen.push(writeJob.workspaceId);
          return { written: records.length, deleted: 0, errors: 0 };
        },
      },
    });

    await processNangoSyncJob(input, Number.POSITIVE_INFINITY, runtimeDeps);

    assert.deepEqual(seen, ["rw_test", "rw_test"]);
  });
});
