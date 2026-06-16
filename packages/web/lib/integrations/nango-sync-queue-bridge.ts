import type { NangoSyncJob } from "@cloud/core/sync/nango-sync-job.js";
import {
  enqueueViaSignedQueueBridge,
  type SignedQueueBridgeConfig,
} from "@/lib/queue-bridge/signed-queue-bridge";

const QUEUE_BRIDGE_PATH = "/internal/queues/nango-sync/send";
const ERROR_PREFIX = "[nango-sync-queue]";

export class NangoSyncQueueBridgeError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NangoSyncQueueBridgeError";
    this.status = status;
  }
}

export async function enqueueNangoSyncJobViaBridge(
  job: NangoSyncJob,
  config: SignedQueueBridgeConfig,
): Promise<void> {
  const body = JSON.stringify({ job });
  await enqueueViaSignedQueueBridge({
    path: QUEUE_BRIDGE_PATH,
    body,
    config,
    errorPrefix: ERROR_PREFIX,
    createError: (message, status) => new NangoSyncQueueBridgeError(message, status),
  });
}
