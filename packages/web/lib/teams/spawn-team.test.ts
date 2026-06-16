import { describe, expect, it, vi } from "vitest";
import {
  memberWritePath,
  pathScope,
  readPathScope,
} from "@cloud/core/proactive-runtime/member-token-scope.js";

const mocks = vi.hoisted(() => ({
  mintWorkspacePathScopedRelayfileToken: vi.fn(),
}));

vi.mock("@cloud/core/relayfile/client.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@cloud/core/relayfile/client.js")>()),
  mintWorkspacePathScopedRelayfileToken: mocks.mintWorkspacePathScopedRelayfileToken,
}));

import {
  assignedRootForTeamMember,
  localRootForAssignedRoot,
  mintTeamMemberRelayfileToken,
  parseSpawnBody,
  SpawnTeamError,
  validateTeamMemberToken,
} from "./spawn-team";

function body(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    task: "refactor auth",
    members: [{ name: "impl", persona: "code-implementer", task: "auth/session.ts" }],
    ...over,
  };
}

function relayPaToken(scopes: string[], ttlSeconds = 120): string {
  const now = 1_800_000_000;
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    scopes,
    iat: now,
    exp: now + ttlSeconds,
  })).toString("base64url");
  return `relay_pa_${header}.${payload}.signature`;
}

describe("parseSpawnBody", () => {
  it("accepts a minimal valid body and defaults ttl", () => {
    const parsed = parseSpawnBody(body());
    expect(parsed.task).toBe("refactor auth");
    expect(parsed.ttlSeconds).toBe(3600);
    expect(parsed.members).toHaveLength(1);
    expect(parsed.members[0]).toMatchObject({ name: "impl", role: "worker", task: "auth/session.ts" });
  });

  it("rejects a missing task", () => {
    expect(() => parseSpawnBody(body({ task: "   " }))).toThrow(/task is required/);
  });

  it("rejects an empty members array", () => {
    expect(() => parseSpawnBody(body({ members: [] }))).toThrow(/members must be a non-empty array/);
  });

  it("clamps ttlSeconds to the max", () => {
    expect(parseSpawnBody(body({ ttlSeconds: 999999 })).ttlSeconds).toBe(21600);
  });

  it("rejects a non-positive ttl", () => {
    expect(() => parseSpawnBody(body({ ttlSeconds: 0 }))).toThrow(/ttlSeconds must be a positive/);
  });

  it("rejects more than one orchestrator", () => {
    expect(() =>
      parseSpawnBody(
        body({
          members: [
            { name: "a", persona: "p", role: "orchestrator" },
            { name: "b", persona: "p", role: "orchestrator" },
          ],
        }),
      ),
    ).toThrow(/at most one orchestrator/);
  });

  it("rejects duplicate member names", () => {
    expect(() =>
      parseSpawnBody(
        body({
          members: [
            { name: "dup", persona: "p", task: "x" },
            { name: "dup", persona: "q", task: "y" },
          ],
        }),
      ),
    ).toThrow(/duplicate member name/);
  });

  it("rejects an invalid role", () => {
    expect(() =>
      parseSpawnBody(body({ members: [{ name: "a", persona: "p", role: "boss" }] })),
    ).toThrow(/role is invalid/);
  });

  it("injects a synthetic relay-orchestrator lead when a worker is unassigned and no orchestrator exists", () => {
    const parsed = parseSpawnBody(
      body({ members: [{ name: "impl", persona: "code-implementer" }] }),
    );
    expect(parsed.members).toHaveLength(2);
    expect(parsed.members[0]).toMatchObject({
      name: "lead",
      persona: "relay-orchestrator",
      role: "orchestrator",
    });
    expect(parsed.members[1]).toMatchObject({ name: "impl", role: "worker" });
  });

  it("does NOT inject a lead when every worker has an explicit task", () => {
    const parsed = parseSpawnBody(
      body({
        members: [
          { name: "a", persona: "p", task: "x" },
          { name: "b", persona: "q", task: "y" },
        ],
      }),
    );
    expect(parsed.members).toHaveLength(2);
    expect(parsed.members.some((m) => m.persona === "relay-orchestrator")).toBe(false);
  });

  it("does NOT inject a lead when an orchestrator is already declared", () => {
    const parsed = parseSpawnBody(
      body({
        members: [
          { name: "lead", persona: "custom-lead", role: "orchestrator" },
          { name: "impl", persona: "code-implementer" },
        ],
      }),
    );
    expect(parsed.members).toHaveLength(2);
    expect(parsed.members.filter((m) => m.role === "orchestrator")).toHaveLength(1);
    expect(parsed.members[0].persona).toBe("custom-lead");
  });

  it("enforces teamSolve maxMembers=4 by default and as a hard cap", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ name: `m${i}`, persona: "p", task: "t" }));
    expect(() => parseSpawnBody(body({ members: five }))).toThrow(/exceeds maxMembers/);
    expect(() => parseSpawnBody(body({ members: five, maxMembers: 8 }))).toThrow(/exceeds maxMembers/);
  });

  it("throws SpawnTeamError with a 422 status for validation failures", () => {
    try {
      parseSpawnBody(body({ task: "" }));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SpawnTeamError);
      expect((err as SpawnTeamError).status).toBe(422);
    }
  });
});

describe("team member relayfile scope", () => {
  it("derives concrete, disjoint per-member assigned roots under the team subtree", () => {
    const implRoot = assignedRootForTeamMember("team_123", "impl/one");
    const reviewRoot = assignedRootForTeamMember("team_123", "reviewer");

    expect(implRoot).toBe("/teams/team_123/members/impl-one");
    expect(reviewRoot).toBe("/teams/team_123/members/reviewer");
    expect(pathScope(implRoot)).toBe("relayfile:fs:write:/teams/team_123/members/impl-one/*");
    expect(pathScope(reviewRoot)).toBe("relayfile:fs:write:/teams/team_123/members/reviewer/*");
    expect(localRootForAssignedRoot(implRoot)).toBe(
      "/home/daytona/workspace/teams/team_123/members/impl-one",
    );
  });

  it("rejects relay_ws_ member tokens before launch", () => {
    expect(() =>
      validateTeamMemberToken({
        token: "relay_ws_workspace",
        assignedRoot: "/teams/team_123/members/impl",
        memberName: "impl",
      }),
    ).toThrow(/direct relay_pa_/);
  });

  it("byte-matches a member token to exactly one non-empty pathScope assignedRoot", () => {
    const assignedRoot = "/teams/team_123/members/impl";
    const expectedScope = pathScope(assignedRoot);

    expect(validateTeamMemberToken({
      token: relayPaToken([readPathScope(assignedRoot), expectedScope]),
      assignedRoot,
      memberName: "impl",
    })).toEqual([expectedScope]);

    expect(() =>
      validateTeamMemberToken({
        token: relayPaToken([pathScope("/teams/team_123/members/reviewer")]),
        assignedRoot,
        memberName: "impl",
      }),
    ).toThrow(/Invalid member write scope|byte-match/);
  });

  it("mints direct workspace-path relay_pa_ tokens with the exact assignedRoot scope and short TTL", async () => {
    const assignedRoot = "/teams/team_123/members/impl";
    const expectedScope = pathScope(assignedRoot);
    const token = relayPaToken([expectedScope], 120);
    mocks.mintWorkspacePathScopedRelayfileToken.mockResolvedValue(token);

    await expect(mintTeamMemberRelayfileToken({
      workspaceId: "workspace-1",
      relayAuthUrl: "https://relayauth.example",
      relayAuthApiKey: "org-api-key",
      teamId: "team_123",
      memberName: "impl",
      agentId: "agent-1",
      assignedRoot,
    })).resolves.toBe(token);

    expect(mocks.mintWorkspacePathScopedRelayfileToken).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      relayAuthUrl: "https://relayauth.example",
      relayAuthApiKey: "org-api-key",
      agentName: "impl",
      agentId: "agent-1",
      paths: [memberWritePath(assignedRoot)],
      scopes: [expectedScope],
      ttlSeconds: 120,
    });
    expect(JSON.stringify(mocks.mintWorkspacePathScopedRelayfileToken.mock.calls)).not.toContain("relay_ws_");
  });
});
