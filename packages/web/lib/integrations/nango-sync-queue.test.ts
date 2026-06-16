import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyRequest } from "@cloud/sts-broker/hmac-node.js";
import {
  REQUEST_SIGNATURE_HEADER,
  REQUEST_TIMESTAMP_HEADER,
} from "@cloud/sts-broker/hmac.js";
import type { NangoSyncJob } from "@cloud/core/sync/nango-sync-job.js";

const mocks = vi.hoisted(() => ({
  enqueueDirect: vi.fn(),
  resolveRelayWorkspace: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/integrations/nango-sync-queue-aws", () => ({
  enqueueNangoSyncJobDirect: mocks.enqueueDirect,
}));

vi.mock("@/lib/integrations/relayfile-integration-push", () => ({
  resolveRelayfileCredentialWorkspaceId: mocks.resolveRelayWorkspace,
}));

const cfSymbol = Symbol.for("__cloudflare-context__");
const SECRET = "queue-bridge-worker-secret";

const job: NangoSyncJob = {
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

function setWorkerEnv(env: Record<string, unknown>): void {
  (globalThis as Record<symbol, unknown>)[cfSymbol] = { env };
}

function clearWorkerEnv(): void {
  delete (globalThis as Record<symbol, unknown>)[cfSymbol];
}

beforeEach(() => {
  vi.resetAllMocks();
  clearWorkerEnv();
  mocks.resolveRelayWorkspace.mockResolvedValue("rw_test1234");
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearWorkerEnv();
});

describe("enqueueNangoSyncJob", () => {
  it("uses direct SQS enqueue outside the Worker runtime", async () => {
    mocks.enqueueDirect.mockResolvedValue(undefined);
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    // The chokepoint resolves the relayfile workspace for legacy UUID rows
    // before any transport — both transports must carry it.
    expect(mocks.enqueueDirect).toHaveBeenCalledWith({
      ...job,
      relayWorkspaceId: "rw_test1234",
    });
  });

  it("leaves the job untranslated when the helper returns the same id", async () => {
    mocks.resolveRelayWorkspace.mockResolvedValue(job.workspaceId);
    mocks.enqueueDirect.mockResolvedValue(undefined);
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    expect(mocks.enqueueDirect).toHaveBeenCalledWith(job);
  });

  it("does not recompute when the producer already set relayWorkspaceId", async () => {
    mocks.enqueueDirect.mockResolvedValue(undefined);
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob({ ...job, relayWorkspaceId: "rw_preset999" });

    expect(mocks.resolveRelayWorkspace).not.toHaveBeenCalled();
    expect(mocks.enqueueDirect).toHaveBeenCalledWith({
      ...job,
      relayWorkspaceId: "rw_preset999",
    });
  });

  it("enqueues untranslated with a warn when translation fails (best-effort)", async () => {
    mocks.resolveRelayWorkspace.mockRejectedValue(new Error("db unavailable"));
    mocks.enqueueDirect.mockResolvedValue(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

      await enqueueNangoSyncJob(job);

      expect(mocks.enqueueDirect).toHaveBeenCalledWith(job);
      expect(warn).toHaveBeenCalledWith(
        "[nango-sync-queue] relay workspace translation failed; enqueueing untranslated",
        expect.objectContaining({ workspaceId: job.workspaceId }),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("calls workflow.create with job params when bound AND the enable flag is set", async () => {
    const createFn = vi.fn().mockResolvedValue(undefined);
    setWorkerEnv({
      NANGO_SYNC_WORKFLOW: { create: createFn },
      CLOUD_NANGO_SYNC_WORKFLOW_ENABLED: "true",
    });
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    expect(createFn).toHaveBeenCalledOnce();
    // params must be byte-identical to the NangoSyncJob (including resolved relayWorkspaceId)
    expect(createFn).toHaveBeenCalledWith({
      params: { ...job, relayWorkspaceId: "rw_test1234" },
    });
    // SQS bridge must not fire
    expect(mocks.enqueueDirect).not.toHaveBeenCalled();
  });

  it("DARK LAUNCH: binding present but flag unset → routes to the SQS bridge, NOT the workflow", async () => {
    const createFn = vi.fn().mockResolvedValue(undefined);
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ accepted: true }), { status: 202 });
    }));
    setWorkerEnv({
      NANGO_SYNC_WORKFLOW: { create: createFn },
      // CLOUD_NANGO_SYNC_WORKFLOW_ENABLED intentionally absent (dark) — deploying
      // the binding must NOT auto-cutover prod onto the unproven Workflow path.
      QUEUE_BRIDGE_URL: "https://queue-bridge.example.test",
      QUEUE_BRIDGE_HMAC_SECRET: SECRET,
    });
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    // The flag gate holds: workflow.create must NOT fire; the SQS bridge handles it.
    expect(createFn).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://queue-bridge.example.test/internal/queues/nango-sync/send",
    );
  });

  it("flag set to a non-\"true\" value keeps the SQS bridge (only \"true\" flips)", async () => {
    const createFn = vi.fn().mockResolvedValue(undefined);
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ accepted: true }), { status: 202 });
    }));
    setWorkerEnv({
      NANGO_SYNC_WORKFLOW: { create: createFn },
      CLOUD_NANGO_SYNC_WORKFLOW_ENABLED: "1",
      QUEUE_BRIDGE_URL: "https://queue-bridge.example.test",
      QUEUE_BRIDGE_HMAC_SECRET: SECRET,
    });
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    expect(createFn).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
  });

  it("falls back to bridge when Worker env has no NANGO_SYNC_WORKFLOW binding", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ accepted: true }), { status: 202 });
    }));
    setWorkerEnv({
      QUEUE_BRIDGE_URL: "https://queue-bridge.example.test",
      QUEUE_BRIDGE_HMAC_SECRET: SECRET,
      // NANGO_SYNC_WORKFLOW intentionally absent
    });
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    expect(mocks.enqueueDirect).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://queue-bridge.example.test/internal/queues/nango-sync/send",
    );
    // workflow.create must not be called (no binding)
    const body = JSON.parse(String(requests[0].init?.body ?? "{}"));
    expect(body.job).toEqual({ ...job, relayWorkspaceId: "rw_test1234" });
  });

  it("posts a signed job to the queue bridge in the Worker runtime", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ accepted: true }), { status: 202 });
    }));
    setWorkerEnv({
      QUEUE_BRIDGE_URL: "https://queue-bridge.example.test",
      QUEUE_BRIDGE_HMAC_SECRET: SECRET,
    });
    const { enqueueNangoSyncJob } = await import("./nango-sync-queue");

    await enqueueNangoSyncJob(job);

    expect(mocks.enqueueDirect).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://queue-bridge.example.test/internal/queues/nango-sync/send",
    );
    expect(requests[0].init?.method).toBe("POST");
    const body = String(requests[0].init?.body ?? "");
    expect(JSON.parse(body)).toEqual({ job: { ...job, relayWorkspaceId: "rw_test1234" } });
    const headers = requests[0].init?.headers as Record<string, string>;
    expect(verifyRequest({
      method: "POST",
      path: "/internal/queues/nango-sync/send",
      body,
      headers: {
        [REQUEST_SIGNATURE_HEADER]: headers[REQUEST_SIGNATURE_HEADER],
        [REQUEST_TIMESTAMP_HEADER]: headers[REQUEST_TIMESTAMP_HEADER],
      },
      secret: SECRET,
    })).toEqual({ ok: true });
  });
});

describe("enqueueNangoSyncJobViaBridge", () => {
  it("retries 5xx responses and succeeds", async () => {
    let callCount = 0;
    const sleeps: number[] = [];
    const { enqueueNangoSyncJobViaBridge } = await import("./nango-sync-queue-bridge");

    await enqueueNangoSyncJobViaBridge(job, {
      bridgeUrl: "https://queue-bridge.example.test",
      hmacSecret: SECRET,
      fetchImpl: vi.fn(async () => {
        callCount += 1;
        return new Response(callCount < 3 ? "try again" : "ok", {
          status: callCount < 3 ? 503 : 202,
        });
      }) as unknown as typeof fetch,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });

    expect(callCount).toBe(3);
    expect(sleeps).toEqual([500, 1000]);
  });

  it("does not retry 4xx responses", async () => {
    let callCount = 0;
    const { enqueueNangoSyncJobViaBridge, NangoSyncQueueBridgeError } = await import(
      "./nango-sync-queue-bridge"
    );

    await expect(enqueueNangoSyncJobViaBridge(job, {
      bridgeUrl: "https://queue-bridge.example.test",
      hmacSecret: SECRET,
      fetchImpl: vi.fn(async () => {
        callCount += 1;
        return new Response("forbidden", { status: 403 });
      }) as unknown as typeof fetch,
      sleep: async () => {
        throw new Error("should not sleep");
      },
    })).rejects.toBeInstanceOf(NangoSyncQueueBridgeError);

    expect(callCount).toBe(1);
  });

  it("throws a clear missing-config error", async () => {
    const { enqueueNangoSyncJobViaBridge } = await import("./nango-sync-queue-bridge");

    await expect(enqueueNangoSyncJobViaBridge(job, {
      bridgeUrl: "",
      hmacSecret: "",
    })).rejects.toThrow("QUEUE_BRIDGE_URL or QUEUE_BRIDGE_HMAC_SECRET missing");
  });
});
