import { WorkflowEntrypoint } from "cloudflare:workers";
import type { WorkflowEvent, WorkflowStep, WorkflowStepConfig } from "cloudflare:workers";
import { Nango } from "@nangohq/node";
import { RelayFileClient } from "@relayfile/sdk";
import { Resource } from "sst";
import { parseNangoSyncJob, type NangoSyncJob } from "./nango-sync-job.js";
import {
  processNangoSyncPage,
  NANGO_SYNC_DEFAULT_PAGE_SIZE,
  type NangoSyncPageDeps,
} from "./nango-sync-runtime.js";
import { planProviderRecordWrites } from "./provider-write-planner.js";
import { writeBatchToRelayfile, WRITE_CONCURRENCY } from "./record-writer.js";
import { mintRelayfileToken } from "../relayfile/client.js";
import {
  markProviderInitialSyncRunning,
  markProviderInitialSyncComplete,
  markProviderInitialSyncFailed,
} from "../provider-readiness-worker.js";

const DEFAULT_NANGO_HOST = "https://api.nango.dev";
const DEFAULT_RELAYFILE_URL = "https://api.relayfile.dev";
const DEFAULT_RELAYAUTH_URL = "https://api.relayauth.dev";

// Maximum page steps before spawning a continuation Workflow instance.
// CF Workflows cap replay journal size; 900 gives headroom below that limit.
const MAX_PAGE_STEPS = 900;

const PAGE_STEP_CONFIG: WorkflowStepConfig = {
  retries: { limit: 5, delay: "10 seconds", backoff: "exponential" },
  timeout: "5 minutes",
};

const READINESS_STEP_CONFIG: WorkflowStepConfig = {
  retries: { limit: 3, delay: "5 seconds" },
};

// Workflow binding type for the continuation self-trigger
type WorkflowBinding = {
  create(opts?: { id?: string; params?: NangoSyncJob }): Promise<unknown>;
};

export type NangoSyncWorkflowEnv = {
  NANGO_SYNC_WORKFLOW: WorkflowBinding;
  // Raw env-var fallbacks for when Resource.X.value doesn't resolve inside
  // WorkflowEntrypoint (unverified at time of writing — play it safe).
  NANGO_SECRET_KEY?: string;
  WEB_RELAYAUTH_API_KEY?: string;
  RELAYFILE_URL?: string;
  NANGO_SYNC_RELAYAUTH_URL?: string;
  NANGO_HOST?: string;
};

// ---------------------------------------------------------------------------
// Secret resolution helpers — Resource first, env fallback
// ---------------------------------------------------------------------------

function resolveNangoSecretKey(env: NangoSyncWorkflowEnv): string {
  try {
    const val = Resource.NangoSecretKey?.value?.trim();
    if (val) return val;
  } catch {
    // Resource.X.value may not bind inside WorkflowEntrypoint — fall through
  }
  const via_env = env.NANGO_SECRET_KEY?.trim();
  if (via_env) return via_env;
  throw new Error("Nango secret key is not configured.");
}

function resolveRelayAuthApiKey(env: NangoSyncWorkflowEnv): string {
  try {
    const resources = Resource as unknown as {
      WebRelayauthApiKey?: { value?: string };
    };
    const val = resources.WebRelayauthApiKey?.value?.trim();
    if (val) return val;
  } catch {
    // fall through to env fallback
  }
  const via_env = env.WEB_RELAYAUTH_API_KEY?.trim();
  if (via_env) return via_env;
  throw new Error("NANGO_SYNC_RELAYAUTH_API_KEY is not configured.");
}

function resolveNangoHost(env: NangoSyncWorkflowEnv): string {
  return (env.NANGO_HOST?.trim() || DEFAULT_NANGO_HOST).replace(/\/+$/, "");
}

function resolveRelayfileUrl(env: NangoSyncWorkflowEnv): string {
  return env.RELAYFILE_URL?.trim() || DEFAULT_RELAYFILE_URL;
}

function resolveRelayAuthUrl(env: NangoSyncWorkflowEnv): string {
  return env.NANGO_SYNC_RELAYAUTH_URL?.trim() || DEFAULT_RELAYAUTH_URL;
}

// ---------------------------------------------------------------------------
// Client factories
// ---------------------------------------------------------------------------

function buildNangoClient(env: NangoSyncWorkflowEnv) {
  return new Nango({
    secretKey: resolveNangoSecretKey(env),
    host: resolveNangoHost(env),
  }) as unknown as NangoSyncPageDeps["nango"];
}

function buildRelayfileClient(
  workspaceId: string,
  env: NangoSyncWorkflowEnv,
): RelayFileClient {
  const relayAuthUrl = resolveRelayAuthUrl(env);
  const relayAuthApiKey = resolveRelayAuthApiKey(env);
  return new RelayFileClient({
    baseUrl: resolveRelayfileUrl(env),
    token: () =>
      mintRelayfileToken({
        workspaceId,
        relayAuthUrl,
        relayAuthApiKey,
        agentName: "nango-sync-workflow",
      }),
  });
}

function buildPageDeps(job: NangoSyncJob, env: NangoSyncWorkflowEnv): NangoSyncPageDeps {
  const relayfileWorkspaceId = job.relayWorkspaceId?.trim() || job.workspaceId;
  const relayfileClient = buildRelayfileClient(relayfileWorkspaceId, env);
  return {
    nango: buildNangoClient(env),
    relayfile: {
      writeBatch(records, writeJob, options) {
        return writeBatchToRelayfile(relayfileClient, records, writeJob, {
          concurrency: WRITE_CONCURRENCY,
          ...options,
        });
      },
    },
    pageSize: NANGO_SYNC_DEFAULT_PAGE_SIZE,
  };
}

// A continuation child whose deterministic id already exists is the intended,
// idempotent outcome of a step replay — distinguish it from real failures.
function isInstanceAlreadyExistsError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /already exist|duplicate|exists/i.test(message);
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export class NangoSyncWorkflow extends WorkflowEntrypoint<
  NangoSyncWorkflowEnv,
  NangoSyncJob
> {
  async run(
    event: WorkflowEvent<NangoSyncJob>,
    step: WorkflowStep,
  ): Promise<void> {
    const job = parseNangoSyncJob(event.payload as unknown);

    // Fail fast before any side effects — runs on every Workflow replay.
    planProviderRecordWrites(job, [], undefined);

    let cursor: string | null =
      typeof job.cursor === "string" && job.cursor.trim()
        ? job.cursor.trim()
        : null;
    let pageIndex = 0;

    try {
      await step.do("mark-running", READINESS_STEP_CONFIG, async () => {
        await markProviderInitialSyncRunning({
          workspaceId: job.workspaceId,
          provider: job.provider,
          providerConfigKey: job.providerConfigKey,
          syncName: job.syncName,
          model: job.model,
          modifiedAfter: job.modifiedAfter,
        });
        return null;
      });

      while (true) {
        // Near the step-count safety threshold: spawn a continuation instance
        // rather than adding more steps to the current replay journal.
        if (pageIndex >= MAX_PAGE_STEPS) {
          // Deterministic continuation id so a retry/replay of THIS step never
          // spawns a second child for the same cursor. step.do is at-least-once
          // and create() is a non-idempotent side effect, so without a pinned id
          // a replay (child created but step result not yet durably recorded)
          // would start a duplicate continuation — racing readiness and double-
          // writing Relayfile. Same parent instance + page boundary => same id
          // => Cloudflare dedups. (The INITIAL enqueue stays id-less so backfills
          // remain re-runnable; only continuations are pinned.)
          const continuationId = `${event.instanceId}-c${pageIndex}`;
          const continuationCursor = cursor;
          await step.do("continue", READINESS_STEP_CONFIG, async () => {
            try {
              await this.env.NANGO_SYNC_WORKFLOW.create({
                id: continuationId,
                params: { ...job, cursor: continuationCursor },
              });
            } catch (error) {
              // A replay may re-attempt creation of an already-created
              // continuation. CF rejects duplicate instance ids; that means the
              // child already exists — the intended outcome — so treat as success.
              if (!isInstanceAlreadyExistsError(error)) {
                throw error;
              }
            }
            return null;
          });
          return;
        }

        const stepName = `page-${pageIndex}`;
        // Capture cursor for use inside the step callback (closed over below).
        const stepCursor = cursor;
        const result = await step.do(
          stepName,
          PAGE_STEP_CONFIG,
          async () => {
            // globalThis.fetch is used by underlying HTTP clients per Workers rule.
            return processNangoSyncPage(
              job,
              { cursor: stepCursor, recordOffset: 0 },
              buildPageDeps(job, this.env),
            );
          },
        );

        pageIndex++;
        cursor = result.nextCursor;
        if (!cursor) break;
      }

      await step.do("mark-complete", READINESS_STEP_CONFIG, async () => {
        await markProviderInitialSyncComplete({
          workspaceId: job.workspaceId,
          provider: job.provider,
          providerConfigKey: job.providerConfigKey,
          syncName: job.syncName,
          model: job.model,
          modifiedAfter: job.modifiedAfter,
        });
        return null;
      });
    } catch (error) {
      await step.do("mark-failed", READINESS_STEP_CONFIG, async () => {
        await markProviderInitialSyncFailed({
          workspaceId: job.workspaceId,
          provider: job.provider,
          error: error instanceof Error ? error.message : String(error),
          providerConfigKey: job.providerConfigKey,
          syncName: job.syncName,
          model: job.model,
          modifiedAfter: job.modifiedAfter,
        });
        return null;
      });
      throw error;
    }
  }
}

// Workers entrypoint requirement — Workflow modules must export a fetch handler.
export default {
  fetch(_request: Request, _env: NangoSyncWorkflowEnv): Response {
    return new Response("NangoSyncWorkflow — not a fetch endpoint", {
      status: 404,
    });
  },
};
