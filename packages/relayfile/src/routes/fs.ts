import { Hono } from "hono";
import type { AppContext, AppEnv } from "../env.js";
import {
  authorizeBearer,
  authorizeWebSocketToken,
  authorizeWebSocketTokenCapability,
  forwardToWorkspaceDO,
  jsonError,
  requireBearerCapabilityScope,
  requireBearerScopeForPath,
  requireCorrelationId,
  scopeMatchesPath,
} from "../middleware/auth.js";
import { fetchWorkspaceDOWithBackpressure } from "../workspace-do-backpressure.js";
import { withWorkspaceWriteAdmission } from "../middleware/workspace-write-admission.js";
import { emitMetric } from "../durable-objects/metrics.js";
import {
  resolveVfsPlaneRoute,
  vfsPlaneLogLabels,
} from "../durable-objects/vfs-plane.js";
import {
  handleExportFromWorker,
  loadBodyFromR2,
  metadataToFileReadResponse,
  type WorkerFileReadMetadata,
} from "./export.js";
import { getWorkspaceStubForPath } from "./shard-routing.js";
import {
  WriteBodyOverflowError,
  effectiveWriteLimitFromConfig,
  readJsonWithLimit,
  rejectJsonWriteContentLength,
} from "../write-body-size-guard.js";

export const fsRoutes = new Hono<AppEnv>();

function normalizeRoutePath(path: string | undefined): string {
  const trimmed = path?.trim() ?? "";
  return trimmed || "/";
}

function optionalQueryPath(c: AppContext): string | undefined {
  const rawPath = c.req.query("path") ?? c.req.query("pathPrefix");
  const normalized = normalizeRoutePath(rawPath);
  return normalized === "/" ? undefined : normalized;
}

function exportPath(c: AppContext): string {
  return normalizeRoutePath(c.req.query("pathPrefix") || c.req.query("path"));
}

function serializeAuthClaims(
  claims: Awaited<ReturnType<typeof authorizeBearer>>,
): AppEnv["Variables"]["authClaims"] {
  return {
    workspaceId: claims.workspaceId,
    agentName: claims.agentName,
    scopes: [...claims.scopes],
    exp: claims.exp,
  };
}

async function readRouteSizeCappedJson<T>(
  c: AppContext,
  request: Request,
): Promise<{ body: T } | { response: Response }> {
  const limit = effectiveWriteLimitFromConfig(c.env.RELAYFILE_MAX_WRITE_BYTES);
  const rejection = rejectJsonWriteContentLength(request, limit);
  if (rejection) {
    return {
      response: jsonError(
        c,
        rejection.status,
        rejection.code,
        rejection.message,
      ),
    };
  }

  try {
    return { body: await readJsonWithLimit<T>(request, limit) };
  } catch (error) {
    if (error instanceof WriteBodyOverflowError) {
      return {
        response: jsonError(c, 413, "payload_too_large", error.message),
      };
    }
    return {
      response: jsonError(c, 400, "bad_request", "invalid json body"),
    };
  }
}

async function bulkWritePaths(
  c: AppContext,
): Promise<{ paths: string[] } | { response: Response }> {
  const guarded = await readRouteSizeCappedJson<unknown>(
    c,
    c.req.raw.clone() as unknown as Request,
  );
  if ("response" in guarded) {
    return guarded;
  }
  const body = guarded.body;
  if (
    body === null ||
    typeof body !== "object" ||
    !Array.isArray((body as { files?: unknown }).files)
  ) {
    return { paths: [] };
  }
  return {
    paths: (body as { files: Array<{ path?: unknown }> }).files.map((file) =>
      typeof file?.path === "string" ? normalizeRoutePath(file.path) : "/",
    ),
  };
}

function requireBearerScopeForBulkFiles(requiredScope: string) {
  return async (c: AppContext, next: () => Promise<void>) => {
    try {
      const claims = await authorizeBearer(
        c.req.header("Authorization"),
        c.env,
        c.req.param("workspaceId") ?? "",
        "",
      );
      let authorized = scopeMatchesPath(claims, requiredScope, "");
      if (!authorized) {
        const pathsResult = await bulkWritePaths(c);
        if ("response" in pathsResult) {
          return pathsResult.response;
        }
        const paths = pathsResult.paths;
        authorized =
          paths.length > 0 &&
          paths.every((path) => scopeMatchesPath(claims, requiredScope, path));
      }
      if (!authorized) {
        return jsonError(
          c,
          403,
          "forbidden",
          `missing required scope: ${requiredScope}`,
        );
      }
      c.set("authClaims", serializeAuthClaims(claims));
      await next();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return jsonError(c, 400, "bad_request", "invalid json body");
      }
      const authError = error as {
        status?: number;
        code?: string;
        message?: string;
      };
      if (typeof authError.status !== "number") {
        return jsonError(
          c,
          500,
          "internal_error",
          authError.message ?? "bulk authorization failed",
        );
      }
      return jsonError(
        c,
        authError.status,
        authError.code ?? "forbidden",
        authError.message ?? `missing required scope: ${requiredScope}`,
      );
    }
  };
}

function requireBearerScopeForOptionalPath(
  requiredScope: string,
  pathForRequest: (c: AppContext) => string | undefined,
) {
  return async (c: AppContext, next: () => Promise<void>) => {
    const path = pathForRequest(c);
    const middleware =
      path === undefined
        ? requireBearerCapabilityScope(requiredScope)
        : requireBearerScopeForPath(requiredScope, () => path);
    return middleware(c, next);
  };
}

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/tree",
  requireBearerScopeForOptionalPath("fs:read", optionalQueryPath),
  requireCorrelationId(),
  async (c) => forwardToWorkspaceDO(c, c.req.param("workspaceId")),
);

fsRoutes.get("/v1/workspaces/:workspaceId/fs/ws", async (c) => {
  const upgrade = c.req.header("Upgrade")?.toLowerCase();
  if (upgrade !== "websocket") {
    return c.text("Expected WebSocket upgrade", 426);
  }

  try {
    const paths = (c.req.queries("path") ?? []).map((path) =>
      normalizeRoutePath(path),
    );
    const firstPath = paths[0] ?? "/";
    const claims =
      firstPath === "/"
        ? await authorizeWebSocketTokenCapability(
            c,
            c.req.param("workspaceId"),
            "fs:read",
          )
        : await authorizeWebSocketToken(
            c,
            c.req.param("workspaceId"),
            "fs:read",
            firstPath,
          );
    for (const path of paths.slice(1)) {
      if (path === "/") {
        continue;
      }
      if (!scopeMatchesPath(claims, "fs:read", path)) {
        return jsonError(
          c,
          403,
          "forbidden",
          "missing required scope: fs:read",
          "",
        );
      }
    }
  } catch (error) {
    const authError = error as {
      status: number;
      code: string;
      message: string;
    };
    return jsonError(
      c,
      authError.status,
      authError.code,
      authError.message,
      "",
    );
  }

  return forwardToWorkspaceDO(c, c.req.param("workspaceId"), "/ws");
});

fsRoutes.post(
  "/v1/workspaces/:workspaceId/fs/bulk",
  requireBearerScopeForBulkFiles("fs:write"),
  requireCorrelationId(),
  async (c) => {
    const workspaceId = c.req.param("workspaceId");
    return withWorkspaceWriteAdmission(c, workspaceId, "fs_bulk", () =>
      forwardToWorkspaceDO(c, workspaceId),
    );
  },
);

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/export",
  requireBearerScopeForPath("fs:read", exportPath),
  requireCorrelationId(),
  // Hardening item 1: export is served by the parent Worker, NOT the DO.
  // The DO returns metadata-only manifest pages; the Worker streams R2
  // bodies directly so the DO heap never holds a file body during export.
  async (c) => handleExportFromWorker(c, c.req.param("workspaceId")),
);

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/file",
  requireBearerScopeForPath(
    "fs:read",
    (c) => c.req.query("path")?.trim() ?? "",
  ),
  requireCorrelationId(),
  async (c) => handleReadFileFromWorker(c, c.req.param("workspaceId")),
);

fsRoutes.put(
  "/v1/workspaces/:workspaceId/fs/file",
  requireBearerScopeForPath(
    "fs:write",
    (c) => c.req.query("path")?.trim() ?? "",
  ),
  requireCorrelationId(),
  async (c) => {
    const workspaceId = c.req.param("workspaceId");
    return withWorkspaceWriteAdmission(c, workspaceId, "fs_file_put", () =>
      forwardToWorkspaceDO(c, workspaceId),
    );
  },
);

fsRoutes.delete(
  "/v1/workspaces/:workspaceId/fs/file",
  requireBearerScopeForPath(
    "fs:write",
    (c) => c.req.query("path")?.trim() ?? "",
  ),
  requireCorrelationId(),
  async (c) => {
    const workspaceId = c.req.param("workspaceId");
    return withWorkspaceWriteAdmission(c, workspaceId, "fs_file_delete", () =>
      forwardToWorkspaceDO(c, workspaceId),
    );
  },
);

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/events",
  requireBearerCapabilityScope("fs:read"),
  requireCorrelationId(),
  async (c) => forwardToWorkspaceDO(c, c.req.param("workspaceId")),
);

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/changes",
  requireBearerCapabilityScope("fs:read"),
  requireCorrelationId(),
  async (c) => forwardToWorkspaceDO(c, c.req.param("workspaceId")),
);

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/changes/resource",
  requireBearerCapabilityScope("fs:read"),
  requireCorrelationId(),
  async (c) => forwardToWorkspaceDO(c, c.req.param("workspaceId")),
);

fsRoutes.get(
  "/v1/workspaces/:workspaceId/fs/query",
  requireBearerScopeForOptionalPath("fs:read", optionalQueryPath),
  requireCorrelationId(),
  async (c) => forwardToWorkspaceDO(c, c.req.param("workspaceId")),
);

async function handleReadFileFromWorker(
  c: Parameters<typeof handleExportFromWorker>[0],
  workspaceId: string,
): Promise<Response> {
  const path = c.req.query("path") ?? "";
  if (!path.trim()) {
    return jsonError(c, 400, "bad_request", "missing path");
  }
  emitWorkerVfsPlaneResolvedMetric(workspaceId, path, "file_read_worker");

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("X-Workspace-Id", workspaceId);
  const incomingAuth = c.req.raw.headers.get("Authorization");
  if (incomingAuth) headers.set("Authorization", incomingAuth);
  const correlationId = c.req.raw.headers.get("X-Correlation-Id");
  if (correlationId) headers.set("X-Correlation-Id", correlationId);
  const authClaims = c.get("authClaims");
  if (authClaims?.workspaceId) {
    headers.set("X-Auth-Workspace-Id", authClaims.workspaceId);
  }

  const url = new URL(c.req.url);
  url.pathname = "/internal/read-file-metadata";
  url.search = "";

  const { stub } = await getWorkspaceStubForPath(c, workspaceId, path);
  const metadataResponse = await fetchWorkspaceDOWithBackpressure(
    stub,
    new Request(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId, path }),
    }),
    {
      reason: "durable_object_overloaded",
      retryAfterSeconds: c.env.RELAYFILE_DO_RETRY_AFTER_SECONDS
        ? Number.parseInt(c.env.RELAYFILE_DO_RETRY_AFTER_SECONDS, 10)
        : undefined,
    },
  );
  if (!metadataResponse.ok) {
    return metadataResponse;
  }

  const metadata = (await metadataResponse.json()) as WorkerFileReadMetadata;
  const content = await loadBodyFromR2(c, metadata);
  return c.json(metadataToFileReadResponse(metadata, content), 200, {
    ETag: metadata.revision,
  });
}

function emitWorkerVfsPlaneResolvedMetric(
  workspaceId: string,
  path: unknown,
  operation: string,
): void {
  const route = resolveVfsPlaneRoute(workspaceId, path);
  emitMetric("relayfile_vfs_plane_resolved_total", 1, {
    workspace_id: workspaceId,
    operation,
    ...vfsPlaneLogLabels(route),
  });
}
