import "server-only";

import { SendMessageCommand } from "@aws-sdk/client-sqs";
import type { NangoSyncJob } from "@cloud/core/sync/nango-sync-job.js";
import { Resource } from "sst";
import { getSqsClientForQueueUrl } from "@/lib/aws/sqs-client";

export async function enqueueNangoSyncJobDirect(job: NangoSyncJob): Promise<void> {
  const queueUrl = Resource.NangoSyncQueue.url;
  const sqs = getSqsClientForQueueUrl(queueUrl);
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(job),
    }),
  );
}
