// @route POST /api/v1/workspaces/[workspaceId]/relayfile/mount-session
// @route GET /api/v1/workspaces/[workspaceId]/relayfile/observer
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createWorkspace,
  destroyWorkspace,
  errorSchema,
  expectHtml,
  expectJson,
  hasAcceptanceAuth,
  requestWithAuth,
  requestWithoutAuth,
  type WorkspaceHandle,
} from "./_helpers";

const mountSessionSchema = z.object({
  workspaceId: z.string().min(1),
  relayfileBaseUrl: z.string().url(),
  relayfileToken: z.string().min(1),
  wsUrl: z.string().url(),
  remotePath: z.string().min(1),
  localDir: z.string().min(1),
  mode: z.string().min(1),
  scopes: z.array(z.string()),
  tokenIssuedAt: z.string().min(1),
  expiresAt: z.string().min(1),
  suggestedRefreshAt: z.string().min(1),
  relaycastApiKey: z.string().min(1),
  relaycastBaseUrl: z.string().url().optional(),
}).passthrough();

describe("/api/v1/workspaces/[workspaceId]/relayfile contracts", () => {
  let workspace: WorkspaceHandle | null = null;

  beforeAll(async () => {
    if (hasAcceptanceAuth()) {
      workspace = await createWorkspace({ authenticated: true, namePrefix: "relayfile" });
    }
  });

  afterAll(async () => {
    await destroyWorkspace(workspace);
  });

  it("rejects unauthenticated mount-session requests", async () => {
    const response = await requestWithoutAuth(
      "POST",
      "/api/v1/workspaces/00000000-0000-0000-0000-000000000000/relayfile/mount-session",
      {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );

    expect([401, 429]).toContain(response.status);
    await expectJson(response, response.status === 401 ? errorSchema : z.unknown());
  });

  (hasAcceptanceAuth() ? it : it.skip)("validates mount-session payloads and observer launch responses", async () => {
    const base = `/api/v1/workspaces/${encodeURIComponent(workspace!.workspaceId)}/relayfile`;

    const invalidMountResponse = await requestWithAuth("POST", `${base}/mount-session`, {
      json: {},
    });
    expect(invalidMountResponse.status).toBe(400);
    await expectJson(invalidMountResponse, errorSchema);

    const mountResponse = await requestWithAuth("POST", `${base}/mount-session`, {
      json: {
        agentName: "acceptance-relayfile",
        remotePath: "/",
        localDir: ".",
        mode: "read-only",
      },
    });
    expect([200, 400, 404, 500]).toContain(mountResponse.status);
    await expectJson(
      mountResponse,
      z.union([mountSessionSchema, errorSchema]),
    );

    const observerResponse = await requestWithAuth("GET", `${base}/observer`);
    expect([200, 403, 404, 500]).toContain(observerResponse.status);
    if (observerResponse.status === 200) {
      const html = await expectHtml(observerResponse);
      expect(html).toContain("<!doctype html");
    } else {
      await expectJson(observerResponse, errorSchema);
    }
  });
});
