/**
 * Detect whether the current request is being served by the OpenNext
 * Cloudflare Worker runtime vs the AWS Lambda runtime. Used by the AWS
 * factory functions (`createWorkflowStorageS3Client`, broker mint paths)
 * to choose between direct STS calls (Lambda — has IAM) and
 * broker-mediated STS calls (Worker — no IAM, must call out to the
 * Lambda STS broker).
 *
 * The detection mirrors the DB factory pattern in
 * `@cloud/core/db/factory.ts`: OpenNext-CF populates a context object on
 * `globalThis[Symbol.for("__cloudflare-context__")]` with the worker
 * `env` bindings. If the symbol is present, we're on the Worker. If not,
 * we're on Lambda (or local Node — same code path either way, since
 * Lambda's IAM credentials are picked up by the AWS SDK default chain).
 */

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");
const nangoRuntimeDiagnosticTokenSymbol = Symbol.for(
  "__nango-runtime-diagnostic-token__",
);
const nangoRuntimeDiagLoggedContexts = new WeakSet<object>();
const nangoRuntimeDiagLoggedTokens = new WeakSet<object>();

export type WorkerEnv = Record<string, unknown>;

export function readWorkerEnv(): WorkerEnv | undefined {
  const context = (globalThis as Record<symbol, unknown>)[cloudflareContextSymbol];
  if (context && typeof context === "object") {
    const env = (context as { env?: unknown }).env;
    if (env && typeof env === "object") {
      logNangoRuntimeDiagnostic("readWorkerEnv", context, env as WorkerEnv, true);
      return env as WorkerEnv;
    }
  }
  logNangoRuntimeDiagnostic("readWorkerEnv", context, undefined, false);
  return undefined;
}

export function isWorkerRuntime(): boolean {
  return readWorkerEnv() !== undefined;
}

function readString(env: WorkerEnv | undefined, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = env?.[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Resolve broker config from the Worker env. Returns `undefined` on Lambda
 * (broker is Worker-only). Throws on Worker if either binding is missing —
 * the route handler should surface that as a 500 / boot-time alarm.
 */
export function readBrokerConfig(): { brokerUrl: string; hmacSecret: string } | undefined {
  const env = readWorkerEnv();
  if (!env) {
    return undefined;
  }
  const brokerUrl = readString(env, "BROKER_URL");
  const hmacSecret = readString(env, "BROKER_HMAC_SECRET");
  if (!brokerUrl || !hmacSecret) {
    throw new Error(
      "[aws/runtime] STS broker is not configured on this Worker (BROKER_URL or BROKER_HMAC_SECRET missing)",
    );
  }
  return { brokerUrl, hmacSecret };
}

// TEMP DIAGNOSTIC (diag/nango-worker-runtime) -- REVERT after root-cause.
function logNangoRuntimeDiagnostic(
  tag: string,
  context: unknown,
  env: WorkerEnv | undefined,
  readWorkerEnvDefined: boolean,
): void {
  try {
    const token = (globalThis as Record<symbol, unknown>)[
      nangoRuntimeDiagnosticTokenSymbol
    ];
    if (!token || typeof token !== "object") {
      return;
    }
    if (nangoRuntimeDiagLoggedTokens.has(token)) {
      return;
    }
    nangoRuntimeDiagLoggedTokens.add(token);

    if (context && typeof context === "object") {
      if (nangoRuntimeDiagLoggedContexts.has(context)) {
        return;
      }
      nangoRuntimeDiagLoggedContexts.add(context);
    }

    console.info("[diag/nango-worker-runtime]", {
      area: "diag/nango-worker-runtime",
      tag,
      navigatorUserAgent: readNavigatorUserAgent(),
      cloudflareContextType: typeof context,
      cloudflareContextHasEnv: hasObjectEnv(context),
      cloudflareContextEnvKeys: countContextEnvKeys(context),
      workerEnvKeys: env ? Object.keys(env).length : 0,
      readWorkerEnvDefined,
      hasQueueBridgeUrl: typeof env?.QUEUE_BRIDGE_URL === "string",
      hasQueueBridgeHmacSecret:
        typeof env?.QUEUE_BRIDGE_HMAC_SECRET === "string",
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
