/**
 * GitHub App auth → Octokit. Works in Cloudflare Workers via @octokit/app
 * (uses Web Crypto under the hood, no Node deps).
 *
 * Reads the three GITHUB_APP_* env vars. The PRIVATE_KEY may have escaped
 * newlines if it was set via dashboard text input — we normalise.
 */
import { App } from "@octokit/app";
import { Octokit } from "octokit";

/** Octokit with REST + paginate plugins, configured via App auth. */
export type AppOctokit = Octokit;

export type GithubEnv = {
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_INSTALLATION_ID: string;
};

let cached: { installationId: number; octokit: AppOctokit } | null = null;

export async function getOctokit(env: GithubEnv): Promise<AppOctokit> {
  const installationId = Number(env.GITHUB_APP_INSTALLATION_ID);
  if (cached?.installationId === installationId) return cached.octokit;

  const privateKey = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");

  // Pass the umbrella `Octokit` class so installation instances inherit
  // .rest (the REST methods we use) and .paginate.
  const app = new App({
    appId: env.GITHUB_APP_ID,
    privateKey,
    Octokit,
  });
  const octokit = (await app.getInstallationOctokit(installationId)) as unknown as AppOctokit;
  cached = { installationId, octokit };
  return octokit;
}

/**
 * Read a JSON file from the repo, return null if missing.
 * Returns the file's content + sha (sha is required to update it).
 */
export async function readRepoJson<T = unknown>(
  octokit: AppOctokit,
  args: { owner: string; repo: string; path: string; ref?: string },
): Promise<{ data: T; sha: string } | null> {
  try {
    const res = await octokit.rest.repos.getContent({
      owner: args.owner,
      repo: args.repo,
      path: args.path,
      ref: args.ref,
    });
    if (Array.isArray(res.data) || res.data.type !== "file") return null;
    // Properly decode UTF-8: atob() returns Latin-1-interpreted bytes,
    // which mangles multi-byte chars (em-dash, smart quotes, etc.) on
    // round-trip. TextDecoder is the correct primitive.
    const bytes = Uint8Array.from(atob(res.data.content.replace(/\n/g, "")), (c) =>
      c.charCodeAt(0),
    );
    const text = new TextDecoder("utf-8").decode(bytes);
    return { data: JSON.parse(text) as T, sha: res.data.sha };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    throw err;
  }
}

/**
 * Idempotent JSON write. If the file exists, updates with the prior sha;
 * if not, creates. Commit message includes the agent name + summary so the
 * git log doubles as a coarser activity feed.
 */
export async function writeRepoJson(
  octokit: AppOctokit,
  args: {
    owner: string;
    repo: string;
    path: string;
    branch?: string;
    data: unknown;
    message: string;
  },
): Promise<void> {
  const existing = await readRepoJson(octokit, {
    owner: args.owner,
    repo: args.repo,
    path: args.path,
    ref: args.branch,
  });
  // Encode UTF-8 → bytes → base64. The classic
  // `btoa(unescape(encodeURIComponent(s)))` trick relies on deprecated APIs;
  // TextEncoder is the modern equivalent.
  const json = JSON.stringify(args.data, null, 2) + "\n";
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const content = btoa(binary);

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: args.owner,
    repo: args.repo,
    path: args.path,
    branch: args.branch,
    message: args.message,
    content,
    sha: existing?.sha,
  });
}
