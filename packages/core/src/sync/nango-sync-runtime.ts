import type { NangoSyncJob } from "./nango-sync-job.js";
import {
  planProviderRecordWrites,
  type ProviderModelKey,
} from "./provider-write-planner.js";
import { logHop } from "../observability/structured-log.js";

export const NANGO_SYNC_CHECKPOINT_BUFFER_MS = 60_000;
export const NANGO_SYNC_DEFAULT_PAGE_SIZE = 100;

export type NangoRecordPage<T extends Record<string, unknown> = Record<string, unknown>> = {
  records: T[];
  next_cursor: string | null;
};

export interface NangoRecordsClient {
  listRecords<T extends Record<string, unknown> = Record<string, unknown>>(config: {
    providerConfigKey: string;
    connectionId: string;
    model: string;
    modifiedAfter?: string;
    limit?: number;
    cursor?: string | null;
  }): Promise<NangoRecordPage<T>>;
}

export interface NangoQueueAdapter {
  reenqueue(job: NangoSyncJob): Promise<void>;
}

export interface RelayfileBatchWriter {
  writeBatch(
    records: readonly Record<string, unknown>[],
    job: NangoSyncJob,
    options?: {
      startOffset?: number;
      shouldCheckpoint?: (nextOffset: number) => boolean;
    },
  ): Promise<{
    written: number;
    deleted: number;
    errors: number;
    checkpointOffset?: number;
  }>;
}

export interface ProviderReadinessAdapter {
  markRunning(input: NangoSyncJob): Promise<void>;
  markComplete(input: NangoSyncJob): Promise<void>;
  markFailed?(input: NangoSyncJob, error: unknown): Promise<void>;
}

export type NangoSyncRuntimeDeps = {
  nango: NangoRecordsClient;
  queue: NangoQueueAdapter;
  relayfile: RelayfileBatchWriter;
  readiness: ProviderReadinessAdapter;
  enabledProviderModels?: ReadonlySet<ProviderModelKey>;
  pageSize?: number;
  now?: () => number;
  logger?: Pick<Console, "info">;
};

export type NangoSyncRuntimeResult = {
  status: "completed" | "checkpointed";
  cursor: string | null;
  recordOffset?: number;
  written: number;
  deleted: number;
  errors: number;
};

function normalizeCursor(value: string | null | undefined): string | null {
  const cursor = value?.trim();
  return cursor ? cursor : null;
}

function normalizeRecordOffset(value: number | undefined): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

function checkpointJob(
  job: NangoSyncJob,
  cursor: string | null,
  recordOffset: number,
): NangoSyncJob {
  const { recordOffset: _previousOffset, ...rest } = job;
  return recordOffset > 0
    ? { ...rest, cursor, recordOffset }
    : { ...rest, cursor };
}

function validateCheckpointOffset(
  value: number,
  currentOffset: number,
  pageLength: number,
): number {
  if (
    !Number.isInteger(value) ||
    value <= currentOffset ||
    value > pageLength
  ) {
    throw new Error(
      `Invalid Nango sync checkpointOffset ${value}; expected an integer > ${currentOffset} and <= ${pageLength}`,
    );
  }
  return value;
}

export async function processNangoSyncJob(
  job: NangoSyncJob,
  deadline: number,
  deps: NangoSyncRuntimeDeps,
): Promise<NangoSyncRuntimeResult> {
  let cursor = normalizeCursor(job.cursor);
  let recordOffset = normalizeRecordOffset(job.recordOffset);
  let totalWritten = 0;
  let totalDeleted = 0;
  let totalErrors = 0;
  const now = deps.now ?? Date.now;
  const pageSize = deps.pageSize ?? NANGO_SYNC_DEFAULT_PAGE_SIZE;

  const baseHopFields = {
    provider: job.provider,
    workspaceId: job.workspaceId,
    connectionId: job.connectionId,
    providerConfigKey: job.providerConfigKey,
    syncName: job.syncName,
    model: job.model,
  } as const;

  try {
    planProviderRecordWrites(job, [], deps.enabledProviderModels);
  } catch (error) {
    // Surface PG/drizzle code if a registry lookup ever falls through to db.
    // Today this is a static set lookup, but we keep the hop log so any
    // future evolution of the planner gets free observability.
    logHop({
      ...baseHopFields,
      hop: "plan",
      outcome: "error",
      note: "parity-precheck",
      error,
    });
    throw error;
  }

  try {
    await deps.readiness.markRunning(job);
  } catch (error) {
    logHop({
      ...baseHopFields,
      hop: "write",
      outcome: "error",
      note: "readiness.markRunning",
      error,
    });
    throw error;
  }

  do {
    if (now() > deadline) {
      try {
        await deps.queue.reenqueue(checkpointJob(job, cursor, recordOffset));
      } catch (error) {
        logHop({
          ...baseHopFields,
          hop: "reenqueue",
          outcome: "error",
          note: "checkpoint",
          written: totalWritten,
          deleted: totalDeleted,
          errors: totalErrors,
          error,
        });
        throw error;
      }
      logHop({
        ...baseHopFields,
        hop: "reenqueue",
        outcome: "ok",
        note: "checkpoint",
        written: totalWritten,
        deleted: totalDeleted,
        errors: totalErrors,
      });
      deps.logger?.info("Nango sync checkpointed and re-enqueued", {
        area: "nango-sync-consumer",
        provider: job.provider,
        workspaceId: job.workspaceId,
        connectionId: job.connectionId,
        syncName: job.syncName,
        model: job.model,
        cursor,
        recordOffset,
        written: totalWritten,
        deleted: totalDeleted,
        errors: totalErrors,
      });
      return {
        status: "checkpointed",
        cursor,
        ...(recordOffset > 0 ? { recordOffset } : {}),
        written: totalWritten,
        deleted: totalDeleted,
        errors: totalErrors,
      };
    }

    const pageStart = now();
    let page: NangoRecordPage;
    try {
      page = await deps.nango.listRecords({
        providerConfigKey: job.providerConfigKey,
        connectionId: job.connectionId,
        model: job.model,
        ...(job.modifiedAfter ? { modifiedAfter: job.modifiedAfter } : {}),
        limit: pageSize,
        ...(cursor ? { cursor } : {}),
      });
    } catch (error) {
      logHop({
        ...baseHopFields,
        hop: "consume",
        outcome: "error",
        note: "nango.listRecords",
        durationMs: now() - pageStart,
        error,
      });
      throw error;
    }

    logHop({
      ...baseHopFields,
      hop: "consume",
      outcome: "ok",
      note: "nango.listRecords",
      batchSize: page.records.length,
      durationMs: now() - pageStart,
    });

    try {
      const plan = planProviderRecordWrites(
        job,
        page.records,
        deps.enabledProviderModels,
      );
      void plan;
    } catch (error) {
      logHop({
        ...baseHopFields,
        hop: "plan",
        outcome: "error",
        batchSize: page.records.length,
        error,
      });
      throw error;
    }

    const writeStart = now();
    let result: {
      written: number;
      deleted: number;
      errors: number;
      checkpointOffset?: number;
    };
    let checkpointOffset: number | undefined;
    try {
      // Relayfile writes target the relay workspace; legacy rows carry the
      // cloud UUID in workspaceId (see NangoSyncJob.relayWorkspaceId).
      result = await deps.relayfile.writeBatch(page.records, {
        ...job,
        cursor,
        ...(recordOffset > 0 ? { recordOffset } : {}),
        workspaceId: job.relayWorkspaceId?.trim() || job.workspaceId,
      }, {
        startOffset: recordOffset,
        shouldCheckpoint: (nextOffset) => now() > deadline && nextOffset > recordOffset,
      });
      checkpointOffset = result.checkpointOffset;
    } catch (error) {
      logHop({
        ...baseHopFields,
        hop: "write",
        outcome: "error",
        batchSize: page.records.length,
        durationMs: now() - writeStart,
        error,
      });
      throw error;
    }

    logHop({
      ...baseHopFields,
      hop: "write",
      outcome: result.errors > 0 ? "error" : "ok",
      batchSize: page.records.length,
      written: result.written,
      deleted: result.deleted,
      errors: result.errors,
      errorCode: result.errors > 0 ? "batch_partial_errors" : undefined,
      durationMs: now() - writeStart,
    });

    totalWritten += result.written;
    totalDeleted += result.deleted;
    totalErrors += result.errors;

    if (checkpointOffset !== undefined) {
      const normalizedCheckpointOffset = validateCheckpointOffset(
        checkpointOffset,
        recordOffset,
        page.records.length,
      );
      try {
        await deps.queue.reenqueue(
          checkpointJob(job, cursor, normalizedCheckpointOffset),
        );
      } catch (error) {
        logHop({
          ...baseHopFields,
          hop: "reenqueue",
          outcome: "error",
          note: "mid-page-checkpoint",
          written: totalWritten,
          deleted: totalDeleted,
          errors: totalErrors,
          error,
        });
        throw error;
      }
      logHop({
        ...baseHopFields,
        hop: "reenqueue",
        outcome: "ok",
        note: "mid-page-checkpoint",
        written: totalWritten,
        deleted: totalDeleted,
        errors: totalErrors,
      });
      deps.logger?.info("Nango sync checkpointed mid-page and re-enqueued", {
        area: "nango-sync-consumer",
        provider: job.provider,
        workspaceId: job.workspaceId,
        connectionId: job.connectionId,
        syncName: job.syncName,
        model: job.model,
        cursor,
        recordOffset: normalizedCheckpointOffset,
        written: totalWritten,
        deleted: totalDeleted,
        errors: totalErrors,
      });
      return {
        status: "checkpointed",
        cursor,
        recordOffset: normalizedCheckpointOffset,
        written: totalWritten,
        deleted: totalDeleted,
        errors: totalErrors,
      };
    }

    cursor = normalizeCursor(page.next_cursor);
    recordOffset = 0;
  } while (cursor);

  deps.logger?.info("Nango sync completed", {
    area: "nango-sync-consumer",
    provider: job.provider,
    workspaceId: job.workspaceId,
    connectionId: job.connectionId,
    syncName: job.syncName,
    model: job.model,
    written: totalWritten,
    deleted: totalDeleted,
    errors: totalErrors,
  });
  try {
    await deps.readiness.markComplete(job);
  } catch (error) {
    logHop({
      ...baseHopFields,
      hop: "write",
      outcome: "error",
      note: "readiness.markComplete",
      written: totalWritten,
      deleted: totalDeleted,
      errors: totalErrors,
      error,
    });
    throw error;
  }

  return {
    status: "completed",
    cursor,
    written: totalWritten,
    deleted: totalDeleted,
    errors: totalErrors,
  };
}

// ---------------------------------------------------------------------------
// Single-page extraction — used by the CF Workflows path.
// No deadline / checkpoint logic: Workflows handle retries at the step level.
// ---------------------------------------------------------------------------

export type NangoSyncPageDeps = Pick<
  NangoSyncRuntimeDeps,
  "nango" | "relayfile" | "enabledProviderModels" | "pageSize"
>;

export type NangoSyncPageResult = {
  nextCursor: string | null;
  written: number;
  deleted: number;
  /** Non-empty when writeBatch reports partial failures. */
  errors: string[];
};

export async function processNangoSyncPage(
  job: NangoSyncJob,
  state: { cursor: string | null; recordOffset: number },
  deps: NangoSyncPageDeps,
): Promise<NangoSyncPageResult> {
  const { cursor, recordOffset } = state;
  const pageSize = deps.pageSize ?? NANGO_SYNC_DEFAULT_PAGE_SIZE;

  const page = await deps.nango.listRecords({
    providerConfigKey: job.providerConfigKey,
    connectionId: job.connectionId,
    model: job.model,
    ...(job.modifiedAfter ? { modifiedAfter: job.modifiedAfter } : {}),
    limit: pageSize,
    ...(cursor ? { cursor } : {}),
  });

  // Validates parity enablement and plans writes (result intentionally unused —
  // writeBatchToRelayfile re-plans internally; this call is for early rejection).
  planProviderRecordWrites(job, page.records, deps.enabledProviderModels);

  const writeJob: NangoSyncJob = {
    ...job,
    cursor,
    ...(recordOffset > 0 ? { recordOffset } : {}),
    workspaceId: job.relayWorkspaceId?.trim() || job.workspaceId,
  };
  const result = await deps.relayfile.writeBatch(page.records, writeJob, {
    startOffset: recordOffset,
    // No shouldCheckpoint: Workflows checkpoint at step boundaries.
  });

  return {
    nextCursor: normalizeCursor(page.next_cursor),
    written: result.written,
    deleted: result.deleted,
    errors: result.errors > 0 ? [`batch_partial_errors:${result.errors}`] : [],
  };
}
