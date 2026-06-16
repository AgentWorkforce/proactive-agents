import type { Context, SQSHandler, SQSRecord } from "aws-lambda";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Nango } from "@nangohq/node";
import { RelayFileClient } from "@relayfile/sdk";
import { Resource } from "sst";
import { mintRelayfileToken } from "../relayfile/client.js";
import {
  markProviderInitialSyncComplete,
  markProviderInitialSyncFailed,
  markProviderInitialSyncRunning,
} from "../provider-readiness.js";
import { parseNangoSyncJob, type NangoSyncJob } from "./nango-sync-job.js";
import {
  WRITE_CONCURRENCY,
  writeBatchToRelayfile,
} from "./record-writer.js";
import {
  NANGO_SYNC_DEFAULT_PAGE_SIZE,
  processNangoSyncJob,
  type NangoSyncRuntimeDeps,
} from "./nango-sync-runtime.js";
import { logHop } from "../observability/structured-log.js";
import { errorLogFields } from "../observability/error-cause.js";

const CHECKPOINT_BUFFER_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 14 * 60 * 1000;
const DEFAULT_NANGO_HOST = "https://api.nango.dev";
const DEFAULT_RELAYFILE_URL = "https://api.relayfile.dev";
const DEFAULT_RELAYAUTH_URL = "https://api.relayauth.dev";

const sqs = new SQSClient({});

interface NangoClient {
  listRecords<T extends Record<string, unknown> = Record<string, unknown>>(config: {
    providerConfigKey: string;
    connectionId: string;
    model: string;
    modifiedAfter?: string;
    limit?: number;
    cursor?: string | null;
  }): Promise<{
    records: T[];
    next_cursor: string | null;
  }>;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getNangoHost(): string {
  return trimTrailingSlash(process.env.NANGO_HOST?.trim() || DEFAULT_NANGO_HOST);
}

function getNangoSecretKey(): string {
  const secretKey = Resource.NangoSecretKey.value?.trim();
  if (!secretKey) {
    throw new Error("Nango secret key is not configured.");
  }
  return secretKey;
}

function getNangoRelayAuthApiKey(): string {
  const envValue = process.env.NANGO_SYNC_RELAYAUTH_API_KEY?.trim();
  if (envValue) {
    return envValue;
  }

  const resources = Resource as unknown as {
    WebRelayauthApiKey?: { value?: string };
  };
  const linkedValue = resources.WebRelayauthApiKey?.value?.trim();
  if (!linkedValue) {
    throw new Error("NANGO_SYNC_RELAYAUTH_API_KEY is not configured.");
  }
  return linkedValue;
}

export function createWorkerRelayfileClient(workspaceId: string): RelayFileClient {
  return new RelayFileClient({
    baseUrl: process.env.RELAYFILE_URL?.trim() || DEFAULT_RELAYFILE_URL,
    token: () => mintRelayfileToken({
      workspaceId,
      relayAuthUrl: process.env.NANGO_SYNC_RELAYAUTH_URL?.trim() || DEFAULT_RELAYAUTH_URL,
      relayAuthApiKey: getNangoRelayAuthApiKey(),
      agentName: "nango-sync-worker",
    }),
  });
}

function createNangoSyncClient(): NangoClient {
  return new Nango({
    secretKey: getNangoSecretKey(),
    host: getNangoHost(),
  }) as unknown as NangoClient;
}

async function reenqueue(job: NangoSyncJob): Promise<void> {
  try {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: Resource.NangoSyncQueue.url,
        MessageBody: JSON.stringify(job),
      }),
    );
  } catch (error) {
    logHop({
      hop: "reenqueue",
      outcome: "error",
      provider: job.provider,
      workspaceId: job.workspaceId,
      connectionId: job.connectionId,
      providerConfigKey: job.providerConfigKey,
      syncName: job.syncName,
      model: job.model,
      note: "sqs.send",
      error,
    });
    throw error;
  }
}

function parseRecord(record: SQSRecord): NangoSyncJob {
  return parseNangoSyncJob(JSON.parse(record.body) as unknown);
}

export async function processRecord(
  record: SQSRecord,
  deadline: number,
): Promise<void> {
  const job = parseRecord(record);
  // All relayfile-side operations (token mint + every record/index write in
  // writeBatchToRelayfile) target the relay workspace; DB-side readiness
  // updates stay keyed by the workspace_integrations row's workspaceId.
  const relayfileWorkspaceId = job.relayWorkspaceId?.trim() || job.workspaceId;
  const relayfileClient = createWorkerRelayfileClient(relayfileWorkspaceId);
  const nangoSyncClient = createNangoSyncClient();

  const deps: NangoSyncRuntimeDeps = {
    nango: nangoSyncClient,
    queue: { reenqueue },
    relayfile: {
      writeBatch(records, writeJob, options) {
        return writeBatchToRelayfile(relayfileClient, records, writeJob, {
          concurrency: WRITE_CONCURRENCY,
          ...options,
        });
      },
    },
    readiness: {
      markRunning(input) {
        return markProviderInitialSyncRunning({
          workspaceId: input.workspaceId,
          provider: input.provider,
          providerConfigKey: input.providerConfigKey,
          syncName: input.syncName,
          model: input.model,
          modifiedAfter: input.modifiedAfter,
        });
      },
      markComplete(input) {
        return markProviderInitialSyncComplete({
          workspaceId: input.workspaceId,
          provider: input.provider,
          providerConfigKey: input.providerConfigKey,
          syncName: input.syncName,
          model: input.model,
          modifiedAfter: input.modifiedAfter,
        });
      },
    },
    pageSize: NANGO_SYNC_DEFAULT_PAGE_SIZE,
    logger: console,
  };

  const result = await processNangoSyncJob(job, deadline, deps);
  if (result.status === "checkpointed") {
    console.info("Nango sync checkpointed and re-enqueued", {
      area: "nango-sync-worker",
      provider: job.provider,
      workspaceId: job.workspaceId,
      relayWorkspaceId: relayfileWorkspaceId,
      connectionId: job.connectionId,
      syncName: job.syncName,
      model: job.model,
      cursor: result.cursor,
      recordOffset: result.recordOffset,
      written: result.written,
      deleted: result.deleted,
      errors: result.errors,
    });
  }
}

function computeDeadline(context: Context): number {
  const remainingMs =
    typeof context.getRemainingTimeInMillis === "function"
      ? context.getRemainingTimeInMillis()
      : DEFAULT_TIMEOUT_MS;
  return Date.now() + remainingMs - CHECKPOINT_BUFFER_MS;
}

export const handler: SQSHandler = async (event, context) => {
  const deadline = computeDeadline(context);

  for (const record of event.Records) {
    try {
      await processRecord(record, deadline);
    } catch (error) {
      try {
        const job = parseRecord(record);
        // Surface the full error chain (drizzle wrapper + PG `code`) on the
        // Lambda path too. `markProviderInitialSyncFailed` itself still gets
        // the short `error` string for the persisted user-facing column;
        // the new log carries the full diagnostic surface for ops.
        logHop({
          hop: "write",
          outcome: "error",
          provider: job.provider,
          workspaceId: job.workspaceId,
          connectionId: job.connectionId,
          providerConfigKey: job.providerConfigKey,
          syncName: job.syncName,
          model: job.model,
          note: "lambda-handler",
          error,
        });
        await markProviderInitialSyncFailed({
          workspaceId: job.workspaceId,
          provider: job.provider,
          error: error instanceof Error ? error.message : String(error),
          providerConfigKey: job.providerConfigKey,
          syncName: job.syncName,
          model: job.model,
          modifiedAfter: job.modifiedAfter,
        });
      } catch (markError) {
        // Best effort only; preserve the original worker failure but log
        // the marker error's surfaced cause too.
        console.error("[nango-sync-worker] markProviderInitialSyncFailed failed", {
          area: "nango-webhook-path",
          stack: markError instanceof Error ? markError.stack : undefined,
          ...errorLogFields(markError),
        });
      }
      throw error;
    }
  }
};
