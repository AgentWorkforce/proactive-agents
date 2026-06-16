export interface NangoSyncJob {
  type: "nango_sync";
  provider: string;
  connectionId: string;
  providerConfigKey: string;
  syncName: string;
  model: string;
  modifiedAfter: string;
  cursor: string | null;
  // Offset within the current Nango page identified by `cursor`.
  // Optional so in-flight jobs queued before mid-page checkpointing remain
  // valid; absent means start at the beginning of the page.
  recordOffset?: number;
  workspaceId: string;
  // Relayfile workspace (rw_<hex>) the sync records should be written into.
  // Legacy workspace_integrations rows store the cloud workspace UUID in
  // workspaceId; relayfile mounts are keyed by the bound rw_ id, so without
  // this the worker writes into a UUID-named workspace nobody mounts.
  // Optional for backward compatibility with in-flight jobs; the worker
  // falls back to workspaceId when absent.
  relayWorkspaceId?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: keyof NangoSyncJob,
): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Invalid Nango sync job: ${String(key)} must be a string`);
  }
  return value;
}

export function parseNangoSyncJob(value: unknown): NangoSyncJob {
  if (!isObject(value)) {
    throw new Error("Invalid Nango sync job: message body must be an object");
  }

  if (value.type !== "nango_sync") {
    throw new Error("Invalid Nango sync job: unsupported type");
  }

  const cursor = value.cursor;
  if (cursor !== null && typeof cursor !== "string") {
    throw new Error("Invalid Nango sync job: cursor must be a string or null");
  }

  const relayWorkspaceId = value.relayWorkspaceId;
  if (relayWorkspaceId !== undefined && typeof relayWorkspaceId !== "string") {
    throw new Error("Invalid Nango sync job: relayWorkspaceId must be a string");
  }

  const recordOffset = value.recordOffset;
  if (
    recordOffset !== undefined &&
    (typeof recordOffset !== "number" ||
      !Number.isInteger(recordOffset) ||
      recordOffset < 0)
  ) {
    throw new Error("Invalid Nango sync job: recordOffset must be a non-negative integer");
  }

  return {
    type: "nango_sync",
    provider: requireString(value, "provider"),
    connectionId: requireString(value, "connectionId"),
    providerConfigKey: requireString(value, "providerConfigKey"),
    syncName: requireString(value, "syncName"),
    model: requireString(value, "model"),
    modifiedAfter: requireString(value, "modifiedAfter"),
    cursor,
    ...(recordOffset !== undefined ? { recordOffset } : {}),
    workspaceId: requireString(value, "workspaceId"),
    // Reconstructing parse: every hop that round-trips through this function
    // drops unknown fields, so the relay workspace MUST be carried here or
    // the bridge/SQS hops silently strip it.
    ...(relayWorkspaceId !== undefined ? { relayWorkspaceId } : {}),
  };
}
