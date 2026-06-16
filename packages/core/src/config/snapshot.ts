// Note: @aws-sdk/client-ssm is NOT a static import. This module is bundled
// into orchestrator-lib.tar.gz and uploaded to Daytona sandboxes, which do
// not have @aws-sdk/client-ssm installed. A static top-level import would
// fail with ERR_MODULE_NOT_FOUND at module load time when the sandbox
// bootstrap imports getSnapshotName. The SSM client is only needed on AWS
// Lambda (guarded by process.env.AWS_LAMBDA_FUNCTION_NAME below), so we
// lazy-import it inside that branch via dynamic import().

export const DEFAULT_SNAPSHOT = 'relay-orchestrator-sdk-8.7.2-relayfile-v0.8.23-runtime-4.0.1';
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: string;
  fetchedAt: number;
}

let cached: CacheEntry | null = null;

function parameterPath(): string {
  // Stage resolution for the SSM parameter key.
  //
  // On Lambda, SST does NOT inject `SST_STAGE` or `STAGE` into the process
  // env — the only stage-related var is `NEXT_PUBLIC_SST_STAGE`, set via
  // `infra/web.ts`. Check all three so the helper works across local
  // dev, CI test harnesses, and deployed Lambda alike.
  const stage =
    process.env.SST_STAGE ??
    process.env.NEXT_PUBLIC_SST_STAGE ??
    process.env.STAGE ??
    'dev';
  return `/cloud/${stage}/relay-sandbox-snapshot`;
}

export async function getSnapshotName(): Promise<string> {
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.value;
  }

  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      // Dynamic import: @aws-sdk/client-ssm is only a dep of the cloud app
      // Lambda bundle, not of the orchestrator-lib bundle that ships inside
      // Daytona sandboxes. Resolving it lazily means the sandbox never
      // touches the import and only Lambda cold starts pay the cost.
      const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm');
      const client = new SSMClient({});
      const resp = await client.send(new GetParameterCommand({ Name: parameterPath() }));
      if (resp.Parameter?.Value) {
        cached = { value: resp.Parameter.Value, fetchedAt: Date.now() };
        return resp.Parameter.Value;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[snapshot] SSM read failed, falling back: ' + message);
    }
  }

  const envValue = process.env.RELAY_SANDBOX_SNAPSHOT;
  if (envValue) {
    cached = { value: envValue, fetchedAt: Date.now() };
    return envValue;
  }

  console.warn(
    '[snapshot] Using DEFAULT_SNAPSHOT fallback — set SSM parameter ' +
      parameterPath() +
      ' or RELAY_SANDBOX_SNAPSHOT env var to suppress this warning',
  );
  cached = { value: DEFAULT_SNAPSHOT, fetchedAt: Date.now() };
  return DEFAULT_SNAPSHOT;
}

/** Test-only: reset the in-module cache between tests. */
export function __resetSnapshotCache(): void {
  cached = null;
}
