import type { NangoSyncJob } from "./nango-sync-job.js";
import type { NangoQueueAdapter } from "./nango-sync-runtime.js";
import { logHop } from "../observability/structured-log.js";

export type NangoCheckpointSender = (job: NangoSyncJob) => Promise<void> | void;

export function createNangoQueueAdapter(
  sendCheckpoint: NangoCheckpointSender,
): NangoQueueAdapter {
  return {
    async reenqueue(job) {
      try {
        await sendCheckpoint(job);
      } catch (error) {
        // Surface SQS / queue-bridge failures with full cause chain so
        // CloudWatch shows the underlying network/HTTP cause and not just
        // the wrapper message.
        logHop({
          hop: "reenqueue",
          outcome: "error",
          provider: job.provider,
          workspaceId: job.workspaceId,
          connectionId: job.connectionId,
          providerConfigKey: job.providerConfigKey,
          syncName: job.syncName,
          model: job.model,
          note: "sendCheckpoint",
          error,
        });
        throw error;
      }
    },
  };
}
