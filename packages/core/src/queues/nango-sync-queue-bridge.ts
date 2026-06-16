import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { verifyRequest } from "@cloud/sts-broker/hmac-node.js";
import { parseNangoSyncJob, type NangoSyncJob } from "../sync/nango-sync-job.js";
import type { EnqueueWorkflowLaunchJobPayload } from "../workflow-launch/job.js";

export const NANGO_SYNC_QUEUE_BRIDGE_PATH = "/internal/queues/nango-sync/send";
export const WORKFLOW_LAUNCH_QUEUE_BRIDGE_PATH = "/internal/queues/workflow-launch/send";

type SupportedQueue = "nango-sync" | "workflow-launch";

type EnvSnapshot = {
  hmacSecret: string;
  queueUrl: string;
};

interface SqsSender {
  send(command: SendMessageCommand): Promise<unknown>;
}

let sqsClientOverride: SqsSender | null = null;
let cachedSqsClient: SQSClient | null = null;

export function setSqsClientForTesting(client: SqsSender | null): void {
  sqsClientOverride = client;
}

export function resetSqsClientForTesting(): void {
  cachedSqsClient = null;
  sqsClientOverride = null;
}

function getSqsClient(): SqsSender {
  if (sqsClientOverride) {
    return sqsClientOverride;
  }
  if (!cachedSqsClient) {
    cachedSqsClient = new SQSClient({});
  }
  return cachedSqsClient;
}

function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function readEnv(queue: SupportedQueue): EnvSnapshot | { error: string } {
  const hmacSecret =
    process.env.QUEUE_BRIDGE_HMAC_SECRET ?? process.env.BROKER_HMAC_SECRET;
  const queueEnv =
    queue === "nango-sync"
      ? {
          name: "NANGO_SYNC_QUEUE_URL",
          value: process.env.NANGO_SYNC_QUEUE_URL,
        }
      : {
          name: "WORKFLOW_LAUNCH_QUEUE_URL",
          value: process.env.WORKFLOW_LAUNCH_QUEUE_URL,
        };

  if (!hmacSecret) {
    return { error: "QUEUE_BRIDGE_HMAC_SECRET is not configured" };
  }
  if (!queueEnv.value) {
    return { error: `${queueEnv.name} is not configured` };
  }
  return {
    hmacSecret,
    queueUrl: queueEnv.value,
  };
}

function requestPath(event: APIGatewayProxyEventV2): string {
  return event.rawPath || "/";
}

function queueForPath(path: string): SupportedQueue | null {
  if (path === NANGO_SYNC_QUEUE_BRIDGE_PATH) return "nango-sync";
  if (path === WORKFLOW_LAUNCH_QUEUE_BRIDGE_PATH) return "workflow-launch";
  return null;
}

function parseWorkflowLaunchJob(
  value: unknown,
): EnqueueWorkflowLaunchJobPayload | { error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Workflow launch job must be an object" };
  }
  const record = value as Record<string, unknown>;
  if (typeof record.jobId !== "string" || record.jobId.trim().length === 0) {
    return { error: "Workflow launch job requires jobId" };
  }
  if (typeof record.runId !== "string" || record.runId.trim().length === 0) {
    return { error: "Workflow launch job requires runId" };
  }
  return {
    jobId: record.jobId,
    runId: record.runId,
  };
}

function parseRequestBody(
  rawBody: string | undefined,
  queue: SupportedQueue,
): NangoSyncJob | EnqueueWorkflowLaunchJobPayload | { error: string } {
  if (!rawBody) {
    return { error: "Request body is required" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { error: "Request body is not valid JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: "Request body must be a JSON object" };
  }

  const body = parsed as { job?: unknown };
  if (queue === "workflow-launch") {
    return parseWorkflowLaunchJob(body.job);
  }

  try {
    return parseNangoSyncJob(body.job);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid Nango sync job",
    };
  }
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const path = requestPath(event);
  const queue = queueForPath(path);
  if (event.requestContext.http.method !== "POST" || !queue) {
    return jsonResponse(404, { error: "not_found" });
  }

  const env = readEnv(queue);
  if ("error" in env) {
    console.error("Queue bridge misconfigured", {
      area: "queue-bridge",
      queue,
      error: env.error,
    });
    return jsonResponse(500, { error: "bridge_misconfigured" });
  }

  const rawBody = event.isBase64Encoded && event.body
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body ?? "";
  const verification = verifyRequest({
    method: "POST",
    path,
    body: rawBody,
    headers: event.headers ?? {},
    secret: env.hmacSecret,
  });
  if (!verification.ok) {
    console.warn("Queue bridge rejected request", {
      area: "queue-bridge",
      queue,
      reason: verification.reason,
    });
    return jsonResponse(403, { error: "forbidden" });
  }

  const job = parseRequestBody(rawBody, queue);
  if ("error" in job) {
    return jsonResponse(400, { error: job.error });
  }

  try {
    await getSqsClient().send(
      new SendMessageCommand({
        QueueUrl: env.queueUrl,
        MessageBody: JSON.stringify(job),
      }),
    );
  } catch (error) {
    console.error("Queue bridge failed to enqueue job", {
      area: "queue-bridge",
      queue,
      ...logFieldsForJob(queue, job),
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(503, { error: "queue_send_failed" });
  }

  console.info("Queue bridge enqueued job", {
    area: "queue-bridge",
    queue,
    ...logFieldsForJob(queue, job),
  });

  return jsonResponse(202, { accepted: true });
}

function logFieldsForJob(
  queue: SupportedQueue,
  job: NangoSyncJob | EnqueueWorkflowLaunchJobPayload,
): Record<string, string | null> {
  if (queue === "workflow-launch") {
    const workflowJob = job as EnqueueWorkflowLaunchJobPayload;
    return {
      jobId: workflowJob.jobId,
      runId: workflowJob.runId,
    };
  }
  const nangoJob = job as NangoSyncJob;
  return {
    provider: nangoJob.provider,
    workspaceId: nangoJob.workspaceId,
    connectionId: nangoJob.connectionId,
    syncName: nangoJob.syncName,
    model: nangoJob.model,
  };
}
