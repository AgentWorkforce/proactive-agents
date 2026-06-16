import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { signRequest } from "@cloud/sts-broker/hmac-node.js";
import {
  handler,
  NANGO_SYNC_QUEUE_BRIDGE_PATH,
  resetSqsClientForTesting,
  setSqsClientForTesting,
  WORKFLOW_LAUNCH_QUEUE_BRIDGE_PATH,
} from "../src/queues/nango-sync-queue-bridge.js";

const SECRET = "queue-bridge-test-secret";
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123/NangoSyncQueue";
const WORKFLOW_LAUNCH_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123/WorkflowLaunchQueue";

const job = {
  type: "nango_sync",
  provider: "github",
  connectionId: "conn-github-1",
  providerConfigKey: "github-relay",
  syncName: "fetch-open-prs",
  model: "PullRequest",
  modifiedAfter: "2026-05-18T19:52:17.576Z",
  cursor: null,
  workspaceId: "55555555-5555-4555-8555-555555555555",
};

function event(input: {
  body?: string;
  path?: string;
  method?: string;
  headers?: Record<string, string>;
}): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: input.path ?? NANGO_SYNC_QUEUE_BRIDGE_PATH,
    rawQueryString: "",
    headers: input.headers ?? {},
    requestContext: {
      accountId: "123",
      apiId: "function-url",
      domainName: "queue-bridge.test",
      domainPrefix: "queue-bridge",
      http: {
        method: input.method ?? "POST",
        path: input.path ?? NANGO_SYNC_QUEUE_BRIDGE_PATH,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "node-test",
      },
      requestId: "req-1",
      routeKey: "$default",
      stage: "$default",
      time: "18/May/2026:20:00:00 +0000",
      timeEpoch: 1779134400000,
    },
    body: input.body,
    isBase64Encoded: false,
  };
}

function signedHeaders(body: string, path = NANGO_SYNC_QUEUE_BRIDGE_PATH): Record<string, string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return {
    "x-request-timestamp": timestamp,
    "x-request-signature": signRequest({
      method: "POST",
      path,
      body,
      timestamp,
      secret: SECRET,
    }),
  };
}

beforeEach(() => {
  process.env.QUEUE_BRIDGE_HMAC_SECRET = SECRET;
  process.env.NANGO_SYNC_QUEUE_URL = QUEUE_URL;
  resetSqsClientForTesting();
});

afterEach(() => {
  delete process.env.QUEUE_BRIDGE_HMAC_SECRET;
  delete process.env.NANGO_SYNC_QUEUE_URL;
  delete process.env.WORKFLOW_LAUNCH_QUEUE_URL;
  resetSqsClientForTesting();
});

describe("nango sync queue bridge", () => {
  it("accepts a signed job and sends one SQS message", async () => {
    const sent: unknown[] = [];
    setSqsClientForTesting({
      async send(command) {
        sent.push(command);
        return {};
      },
    });
    const body = JSON.stringify({ job });

    const response = await handler(event({
      body,
      headers: signedHeaders(body),
    }));

    assert.equal(response.statusCode, 202);
    assert.equal(sent.length, 1);
    assert.deepEqual((sent[0] as { input: unknown }).input, {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(job),
    });
  });

  it("preserves relayWorkspaceId through the reconstructing parse (legacy-row translation)", async () => {
    // The bridge re-parses the job before the SQS send; parseNangoSyncJob
    // RECONSTRUCTS the object, so any field it does not carry is silently
    // stripped at this hop — exactly how the relay workspace would get lost.
    const sent: unknown[] = [];
    setSqsClientForTesting({
      async send(command) {
        sent.push(command);
        return {};
      },
    });
    const translated = { ...job, relayWorkspaceId: "rw_7ccfea89" };
    const body = JSON.stringify({ job: translated });

    const response = await handler(event({
      body,
      headers: signedHeaders(body),
    }));

    assert.equal(response.statusCode, 202);
    assert.deepEqual((sent[0] as { input: unknown }).input, {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(translated),
    });
  });

  it("decodes base64 Function URL bodies before verifying and parsing", async () => {
    const sent: unknown[] = [];
    setSqsClientForTesting({
      async send(command) {
        sent.push(command);
        return {};
      },
    });
    const body = JSON.stringify({ job });

    const response = await handler({
      ...event({
        body: Buffer.from(body, "utf8").toString("base64"),
        headers: signedHeaders(body),
      }),
      isBase64Encoded: true,
    });

    assert.equal(response.statusCode, 202);
    assert.equal(sent.length, 1);
    assert.deepEqual((sent[0] as { input: unknown }).input, {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(job),
    });
  });

  it("rejects bad signatures", async () => {
    const body = JSON.stringify({ job });
    const response = await handler(event({
      body,
      headers: {
        "x-request-timestamp": String(Math.floor(Date.now() / 1000)),
        "x-request-signature": "bad",
      },
    }));

    assert.equal(response.statusCode, 403);
  });

  it("rejects invalid jobs", async () => {
    const body = JSON.stringify({ job: { ...job, connectionId: null } });
    const response = await handler(event({
      body,
      headers: signedHeaders(body),
    }));

    assert.equal(response.statusCode, 400);
  });

  it("maps SQS send failures to 503", async () => {
    setSqsClientForTesting({
      async send() {
        throw new Error("sqs unavailable");
      },
    });
    const body = JSON.stringify({ job });

    const response = await handler(event({
      body,
      headers: signedHeaders(body),
    }));

    assert.equal(response.statusCode, 503);
  });

  it("accepts a signed workflow launch job and sends one SQS message", async () => {
    process.env.WORKFLOW_LAUNCH_QUEUE_URL = WORKFLOW_LAUNCH_QUEUE_URL;
    const sent: unknown[] = [];
    setSqsClientForTesting({
      async send(command) {
        sent.push(command);
        return {};
      },
    });
    const workflowJob = { jobId: "launch-job-1", runId: "run-1" };
    const body = JSON.stringify({ job: workflowJob });

    const response = await handler(event({
      path: WORKFLOW_LAUNCH_QUEUE_BRIDGE_PATH,
      body,
      headers: signedHeaders(body, WORKFLOW_LAUNCH_QUEUE_BRIDGE_PATH),
    }));

    assert.equal(response.statusCode, 202);
    assert.equal(sent.length, 1);
    assert.deepEqual((sent[0] as { input: unknown }).input, {
      QueueUrl: WORKFLOW_LAUNCH_QUEUE_URL,
      MessageBody: JSON.stringify(workflowJob),
    });
  });
});
