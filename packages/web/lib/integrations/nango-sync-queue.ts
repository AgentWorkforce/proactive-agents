import "server-only";

import type { NangoSyncJob } from "@cloud/core/sync/nango-sync-job.js";
import { readWorkerEnv } from "@/lib/aws/runtime";
import { enqueueNangoSyncJobViaBridge } from "@/lib/integrations/nango-sync-queue-bridge";
import { resolveRelayfileCredentialWorkspaceId } from "@/lib/integrations/relayfile-integration-push";

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");
const nangoRuntimeDiagnosticTokenSymbol = Symbol.for(
  "__nango-runtime-diagnostic-token__",
);
const nangoEnqueueDiagLoggedContexts = new WeakSet<object>();

export async function enqueueNangoSyncJob(job: NangoSyncJob): Promise<void> {
  // Single producer chokepoint (router + composio callers): resolve the
  // relayfile workspace the worker should write into. Legacy
  // workspace_integrations rows store the cloud workspace UUID; relayfile
  // mounts are keyed by the bound rw_ id, so an untranslated job writes
  // records into a UUID-named workspace nobody mounts (the /github-only
  // observer gap, second half). Best-effort: a translation failure keeps
  // today's behavior rather than failing the sync.
  if (!job.relayWorkspaceId) {
    try {
      const relayWorkspaceId = await resolveRelayfileCredentialWorkspaceId(job.workspaceId);
      if (relayWorkspaceId && relayWorkspaceId !== job.workspaceId) {
        job = { ...job, relayWorkspaceId };
      }
    } catch (error) {
      console.warn("[nango-sync-queue] relay workspace translation failed; enqueueing untranslated", {
        provider: job.provider,
        workspaceId: job.workspaceId,
        connectionId: job.connectionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const workerEnv = readWorkerEnvWithDiagnosticToken();
  logNangoEnqueueRuntimeDiagnostic(workerEnv);

  if (workerEnv) {
    // Dark launch: the CF Workflow path is gated behind an explicit flag so that
    // merely DEPLOYING the NANGO_SYNC_WORKFLOW binding does NOT auto-cutover prod
    // traffic onto the new path. Routing to the Workflow requires BOTH the flag
    // (CLOUD_NANGO_SYNC_WORKFLOW_ENABLED="true") AND the binding to be present.
    // Flip is a single, reversible switch: set the flag to enable, unset/false to
    // roll back to the SQS bridge. Do NOT pass a deterministic `id` — CF Workflows
    // dedup by id, so a fixed key would block re-running the same backfill tuple
    // after completion. Let CF auto-generate the run id instead.
    const workflow = nangoSyncWorkflowBinding(workerEnv);
    if (workflow) {
      await workflow.create({ params: job });
      return;
    }

    const bridgeUrl = readString(workerEnv, "QUEUE_BRIDGE_URL");
    const hmacSecret = readString(workerEnv, "QUEUE_BRIDGE_HMAC_SECRET");
    await enqueueNangoSyncJobViaBridge(job, { bridgeUrl, hmacSecret });
    return;
  }

  const { enqueueNangoSyncJobDirect } = await import(
    "@/lib/integrations/nango-sync-queue-aws"
  );
  await enqueueNangoSyncJobDirect(job);
}

function readString(env: Record<string, unknown>, name: string): string {
  const value = env[name];
  return typeof value === "string" ? value : "";
}

/**
 * Dark-launch gate for the CF Workflow sync path. Returns the workflow binding
 * only when BOTH the explicit enable flag is set AND the binding is present, so
 * deploying the binding alone never reroutes prod traffic. Flip by setting
 * `CLOUD_NANGO_SYNC_WORKFLOW_ENABLED="true"` on the cloud-web worker; unset or
 * any non-"true" value rolls back to the SQS bridge.
 */
function isNangoSyncWorkflowEnabled(
  workerEnv: Record<string, unknown> | undefined,
): boolean {
  return (
    String(workerEnv?.CLOUD_NANGO_SYNC_WORKFLOW_ENABLED ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

function nangoSyncWorkflowBinding(
  workerEnv: Record<string, unknown> | undefined,
):
  | { create(o: { id?: string; params?: unknown }): Promise<unknown> }
  | undefined {
  if (!workerEnv || !isNangoSyncWorkflowEnabled(workerEnv)) {
    return undefined;
  }
  const binding = workerEnv.NANGO_SYNC_WORKFLOW;
  if (typeof binding === "object" && binding !== null) {
    return binding as {
      create(o: { id?: string; params?: unknown }): Promise<unknown>;
    };
  }
  return undefined;
}

function readWorkerEnvWithDiagnosticToken(): Record<string, unknown> | undefined {
  const globalRecord = globalThis as Record<symbol, unknown>;
  const previousToken = globalRecord[nangoRuntimeDiagnosticTokenSymbol];
  globalRecord[nangoRuntimeDiagnosticTokenSymbol] = {};
  try {
    return readWorkerEnv();
  } finally {
    if (previousToken === undefined) {
      delete globalRecord[nangoRuntimeDiagnosticTokenSymbol];
    } else {
      globalRecord[nangoRuntimeDiagnosticTokenSymbol] = previousToken;
    }
  }
}

// TEMP DIAGNOSTIC (diag/nango-worker-runtime) -- REVERT after root-cause.
function logNangoEnqueueRuntimeDiagnostic(
  workerEnv: Record<string, unknown> | undefined,
): void {
  try {
    const context = (globalThis as Record<symbol, unknown>)[
      cloudflareContextSymbol
    ];
    if (context && typeof context === "object") {
      if (nangoEnqueueDiagLoggedContexts.has(context)) {
        return;
      }
      nangoEnqueueDiagLoggedContexts.add(context);
    }

    const hasNangoSyncWorkflow =
      typeof workerEnv?.NANGO_SYNC_WORKFLOW === "object" &&
      workerEnv.NANGO_SYNC_WORKFLOW !== null;
    const nangoSyncWorkflowEnabled = isNangoSyncWorkflowEnabled(workerEnv);
    const chosenBranch = workerEnv
      ? hasNangoSyncWorkflow && nangoSyncWorkflowEnabled
        ? "workflow"
        : "bridge"
      : "direct-sqs";
    console.info("[diag/nango-worker-runtime]", {
      area: "diag/nango-worker-runtime",
      tag: "nango-sync-queue-chooser",
      navigatorUserAgent: readNavigatorUserAgent(),
      cloudflareContextType: typeof context,
      cloudflareContextHasEnv: hasObjectEnv(context),
      cloudflareContextEnvKeys: countContextEnvKeys(context),
      workerEnvKeys: workerEnv ? Object.keys(workerEnv).length : 0,
      readWorkerEnvDefined: workerEnv !== undefined,
      chosenBranch,
      hasNangoSyncWorkflow,
      nangoSyncWorkflowEnabled,
      hasQueueBridgeUrl: typeof workerEnv?.QUEUE_BRIDGE_URL === "string",
      hasQueueBridgeHmacSecret:
        typeof workerEnv?.QUEUE_BRIDGE_HMAC_SECRET === "string",
      processHasQueueBridgeUrl:
        typeof process.env.QUEUE_BRIDGE_URL === "string" &&
        process.env.QUEUE_BRIDGE_URL.length > 0,
      processHasQueueBridgeHmacSecret:
        typeof process.env.QUEUE_BRIDGE_HMAC_SECRET === "string" &&
        process.env.QUEUE_BRIDGE_HMAC_SECRET.length > 0,
      nextRuntime: process.env.NEXT_RUNTIME ?? null,
      sstStage: process.env.NEXT_PUBLIC_SST_STAGE ?? null,
    });
  } catch {
    // Diagnostic logging must never affect webhook handling.
  }
}

function readNavigatorUserAgent(): string | null {
  const navigatorLike = (globalThis as { navigator?: { userAgent?: unknown } })
    .navigator;
  return typeof navigatorLike?.userAgent === "string"
    ? navigatorLike.userAgent
    : null;
}

function hasObjectEnv(context: unknown): boolean {
  return (
    !!context &&
    typeof context === "object" &&
    !!(context as { env?: unknown }).env &&
    typeof (context as { env?: unknown }).env === "object"
  );
}

function countContextEnvKeys(context: unknown): number {
  if (!hasObjectEnv(context)) {
    return 0;
  }
  return Object.keys((context as { env: Record<string, unknown> }).env).length;
}
