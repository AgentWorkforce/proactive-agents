/**
 * Cloudflare-runtime Context. Implements the spec Context interface against
 * GitHub (for files persistence — log + dedup state) and stubs out messages
 * + schedule + once for now (weekly-digest only needs files + logger).
 *
 * When @agent-relay/agent ships and the cloud runtime takes over, this file
 * disappears — the SDK provides Context and we delete this whole module.
 */
import type { Context, Logger } from "../sdk";
import { getOctokit, readRepoJson, writeRepoJson, type GithubEnv, type AppOctokit } from "../github-app";

export type CfEnv = GithubEnv & {
  BRAVE_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  CRON_WEBHOOK_SECRET: string;
};

const REPO_OWNER = "AgentWorkforce";
const REPO_NAME = "proactive-agents";
const REPO_BRANCH = "main";

/**
 * Maps the abstract VFS path the agent writes to onto a concrete repo path.
 *   /_meta/<x>          → content/<x>             (visible meta, e.g. agent-log.json)
 *   /_internal/<a>/<x>  → .agent-state/<a>/<x>    (hidden agent dedup state)
 */
function vfsToRepoPath(vfs: string): string {
  if (vfs.startsWith("/_meta/")) return `content/${vfs.slice("/_meta/".length)}`;
  if (vfs.startsWith("/_internal/")) return `.agent-state/${vfs.slice("/_internal/".length)}`;
  // Fallback — store under .agent-state with the cleaned path
  return `.agent-state${vfs}`;
}

export async function makeCloudflareContext(args: {
  env: CfEnv;
  agentId: string;
  workspace: string;
  signal: AbortSignal;
}): Promise<Context> {
  const { env, agentId, workspace, signal } = args;
  const octokit = await getOctokit(env);

  const logger: Logger = {
    info(msg, meta) {
      console.log(`[${agentId}] ${msg}`, meta ?? "");
    },
    warn(msg, meta) {
      console.warn(`[${agentId}] ${msg}`, meta ?? "");
    },
    error(msg, meta) {
      console.error(`[${agentId}] ${msg}`, meta ?? "");
    },
  };

  return {
    workspace,
    agentId,
    logger,
    signal,

    files: {
      async read(path) {
        const repoPath = vfsToRepoPath(path);
        const result = await readRepoJson(octokit, {
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: repoPath,
          ref: REPO_BRANCH,
        });
        return result ? { body: result.data, meta: { sha: result.sha } } : null;
      },
      async write(path, body, meta) {
        const repoPath = vfsToRepoPath(path);
        const message =
          (meta as { message?: string } | undefined)?.message ?? `[${agentId}] write ${path}`;
        await writeRepoJson(octokit, {
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: repoPath,
          branch: REPO_BRANCH,
          data: body,
          message,
        });
      },
      async delete(path) {
        const repoPath = vfsToRepoPath(path);
        const existing = await readRepoJson(octokit, {
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: repoPath,
          ref: REPO_BRANCH,
        });
        if (!existing) return;
        await octokit.rest.repos.deleteFile({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: repoPath,
          branch: REPO_BRANCH,
          sha: existing.sha,
          message: `[${agentId}] delete ${path}`,
        });
      },
      async list() {
        // Not needed yet for any agent; throw loudly so we notice if one
        // starts depending on it.
        throw new Error("ctx.files.list not implemented in cloudflare-context");
      },
    },

    messages: {
      async post() {
        throw new Error("ctx.messages.post not implemented (Slack agent comes later)");
      },
      async reply() {
        throw new Error("ctx.messages.reply not implemented (Slack agent comes later)");
      },
      async dm() {
        throw new Error("ctx.messages.dm not implemented (Slack agent comes later)");
      },
    },

    schedule: {
      async at() {
        throw new Error("ctx.schedule.at not implemented (use relaycron register-schedules.ts)");
      },
      async every() {
        throw new Error("ctx.schedule.every not implemented (use relaycron register-schedules.ts)");
      },
      async cancel() {
        throw new Error("ctx.schedule.cancel not implemented");
      },
    },

    /**
     * Idempotency cache. For weekly cadence we get away with no real backend —
     * the natural dedup is the weekly digest issue itself; if relaycron fires
     * twice in the same week, the upsertDigestIssue lookup finds the existing
     * issue and edits it. No-op `once` is correct here.
     */
    async once<T>(_key: string, fn: () => Promise<T>): Promise<T> {
      return fn();
    },
  };
}

/**
 * Helper for handlers that need the raw Octokit (e.g. weekly-digest's
 * upsertDigestIssue) without going through ctx.files.
 */
export async function octokitFor(env: CfEnv): Promise<AppOctokit> {
  return getOctokit(env);
}

export const REPO = { owner: REPO_OWNER, name: REPO_NAME, branch: REPO_BRANCH };
