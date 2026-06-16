import { randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import type {
  LaunchMemberOptions,
  LaunchMemberResult,
} from "@cloud/core/bootstrap/launch-member.js";
import {
  launchMember as defaultLaunchMember,
  scopesFromRelayfileAccessToken,
} from "@cloud/core/bootstrap/launch-member.js";
import {
  assertPairwiseDisjointScopes,
  assertSafeMemberWritePath,
  memberWritePath,
  pathScope,
  validateMemberRelayfileAccessScopes,
} from "@cloud/core/proactive-runtime/member-token-scope.js";
import { mintWorkspacePathScopedRelayfileToken } from "@cloud/core/relayfile/client.js";
import { getDb } from "@/lib/db";
import {
  agents,
  personas,
  teamEvents,
  teamMembers,
  teams,
} from "@/lib/db/schema";
import { resolveRelayfileConfig } from "@/lib/relayfile";
import { createRelaycastChannel } from "@/lib/relaycast/channels";
import { countActiveTeamMembers } from "@/lib/teams/reaper";

/**
 * ctx.team spawn orchestration (spec §6.1/§9/§11/§12).
 *
 * This owns the durable side of a team spawn: validate the request, resolve
 * member personas, create the team + member + agent rows, provision the
 * relaycast channel, mint a direct short-lived relay_pa_ token per member, and
 * pass that scoped token/root to the launch boundary.
 */

export class SpawnTeamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

const DEFAULT_TTL_SECONDS = 3_600;
const MAX_TTL_SECONDS = 21_600;
const MEMBER_TOKEN_TTL_SECONDS = 120;
const DEFAULT_MAX_MEMBERS = 4;
const HARD_MAX_MEMBERS = 4;
const MEMBER_LOCAL_ROOT = "/home/daytona/workspace";
const SYNTHETIC_LEAD_PERSONA = "relay-orchestrator";

// Workspace-wide concurrency cap across all active teams (spec §14).
// Override via WORKFORCE_MAX_CONCURRENT_TEAM_MEMBERS.
function maxConcurrentTeamMembers(): number {
  const raw = Number(process.env.WORKFORCE_MAX_CONCURRENT_TEAM_MEMBERS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 16;
}

type MemberRole = "orchestrator" | "worker" | "reviewer";

interface MemberInput {
  name: string;
  persona: string;
  role: MemberRole;
  task?: string;
}

export interface LaunchMemberArgs {
  workspaceId: string;
  teamId: string;
  memberName: string;
  role: MemberRole;
  personaId: string;
  agentId: string;
  assignedRoot: string;
  localRoot: string;
  writeScopes: string[];
  assignedTask?: string;
  teamPrompt?: string;
  channel: string;
  launchOptions: LaunchMemberOptions;
}

export interface SpawnTeamDeps {
  createChannel: (args: {
    workspaceId: string;
    name: string;
    topic?: string;
  }) => Promise<{ channel: string }>;
  mintMemberToken: (args: {
    workspaceId: string;
    teamId: string;
    memberName: string;
    agentId: string;
    assignedRoot: string;
  }) => Promise<string>;
  buildLaunchOptions: (
    args: LaunchMemberArgs,
  ) => LaunchMemberOptions | Promise<LaunchMemberOptions>;
  launchMember: (args: LaunchMemberOptions) => Promise<LaunchMemberResult>;
}

export interface SpawnTeamInput {
  workspaceId: string;
  parentAgentId: string;
  deployerUserId: string;
  organizationId: string;
  body: unknown;
}

export interface SpawnTeamResult {
  teamId: string;
  channel: string;
  sharedMountRoot: string;
  status: "starting";
  members: Array<{
    name: string;
    agentId: string;
    personaId: string;
    role: MemberRole;
    sandboxId: string | null;
    status: string;
    assignedRoot: string;
    writeScopes: string[];
  }>;
}

export function defaultSpawnTeamDeps(): SpawnTeamDeps {
  return {
    createChannel: (args) => createRelaycastChannel(args),
    async mintMemberToken(args) {
      const relayfile = resolveRelayfileConfig();
      if (!relayfile.relayAuthApiKey) {
        throw new SpawnTeamError(
          "RelayAuth API key is not configured for team member token mint",
          503,
          "relayfile_token_unavailable",
        );
      }
      return mintTeamMemberRelayfileToken({
        workspaceId: args.workspaceId,
        relayAuthUrl: relayfile.relayAuthUrl,
        relayAuthApiKey: relayfile.relayAuthApiKey,
        teamId: args.teamId,
        memberName: args.memberName,
        agentId: args.agentId,
        assignedRoot: args.assignedRoot,
      });
    },
    buildLaunchOptions: (args) => args.launchOptions,
    launchMember: (args) => defaultLaunchMember(args),
  };
}

export async function spawnTeam(
  input: SpawnTeamInput,
  deps: SpawnTeamDeps = defaultSpawnTeamDeps(),
): Promise<SpawnTeamResult> {
  const db = getDb();
  const parsed = parseSpawnBody(input.body);

  // Parent ownership: the parent agent must live in this workspace.
  const [parent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(
        eq(agents.id, input.parentAgentId),
        eq(agents.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);
  if (!parent) {
    throw new SpawnTeamError(
      "Parent agent not found in workspace",
      404,
      "parent_not_found",
    );
  }

  const members = await resolveMembers(parsed.members, input.deployerUserId);

  // Workspace concurrency quota (§14): reject if this team would push the
  // workspace's active team-member count over the cap.
  const cap = maxConcurrentTeamMembers();
  const active = await countActiveTeamMembers(input.workspaceId);
  if (active + members.length > cap) {
    throw new SpawnTeamError(
      `team would exceed the workspace concurrency cap (${active} active + ${members.length} new > ${cap})`,
      429,
      "team_member_quota_exceeded",
    );
  }

  const teamId = `team_${randomUUID()}`;
  const channelName = `team-${teamId}`;
  const sharedMountRoot = `/teams/${teamId}`;
  const expiresAt = new Date(Date.now() + parsed.ttlSeconds * 1000);
  const assignments = members.map((member) => ({
    memberName: member.name,
    assignedPaths: [assignedRootForTeamMember(teamId, member.name)],
  }));
  assertPairwiseDisjointScopes(assignments);

  await db.insert(teams).values({
    id: teamId,
    workspaceId: input.workspaceId,
    parentAgentId: input.parentAgentId,
    status: "starting",
    task: parsed.task,
    ...(parsed.teamPrompt ? { teamPrompt: parsed.teamPrompt } : {}),
    sharedMountRoot,
    channel: channelName,
    ttlSeconds: parsed.ttlSeconds,
    expiresAt,
  });

  const { channel } = await deps.createChannel({
    workspaceId: input.workspaceId,
    name: channelName,
    topic: parsed.task.slice(0, 250),
  });

  const memberViews: SpawnTeamResult["members"] = [];
  for (const member of members) {
    const agentId = randomUUID();
    await db.insert(agents).values({
      id: agentId,
      workspaceId: input.workspaceId,
      personaId: member.personaId,
      deployedName: `${teamId}:${member.name}`,
      deployedByUserId: input.deployerUserId,
      inputValues: {},
      specHashAtDeploy: member.specHash,
      status: "active",
      spawnedByAgentId: input.parentAgentId,
      watchGlobs: [],
      scheduleIds: [],
    });

    const assignedRoot = assignedRootForTeamMember(teamId, member.name);
    const localRoot = localRootForAssignedRoot(assignedRoot);
    const memberToken = await deps.mintMemberToken({
      workspaceId: input.workspaceId,
      teamId,
      memberName: member.name,
      agentId,
      assignedRoot,
    });
    const writeScopes = validateTeamMemberToken({
      token: memberToken,
      assignedRoot,
      memberName: member.name,
    });

    const launchOptions = buildDefaultLaunchMemberOptions({
      workspaceId: input.workspaceId,
      teamId,
      memberName: member.name,
      role: member.role,
      agentId,
      assignedRoot,
      localRoot,
      channel,
      memberToken,
    });
    const launched = await deps.launchMember(
      await deps.buildLaunchOptions({
        workspaceId: input.workspaceId,
        teamId,
        memberName: member.name,
        role: member.role,
        personaId: member.personaId,
        agentId,
        assignedRoot,
        localRoot,
        writeScopes,
        ...(member.task ? { assignedTask: member.task } : {}),
        ...(parsed.teamPrompt ? { teamPrompt: parsed.teamPrompt } : {}),
        channel,
        launchOptions,
      }),
    );

    const memberRowId = `team_member_${randomUUID()}`;
    await db.insert(teamMembers).values({
      id: memberRowId,
      teamId,
      name: member.name,
      agentId,
      personaId: member.personaId,
      role: member.role,
      ...(launched.sandboxId ? { sandboxId: launched.sandboxId } : {}),
      ...(member.task ? { assignedTask: member.task } : {}),
      status: "starting",
    });

    await db.insert(teamEvents).values({
      id: `tev_${randomUUID()}`,
      teamId,
      memberName: member.name,
      kind: launched.sandboxId ? "member_launched" : "member_launch_pending",
      payload: {
        agentId,
        role: member.role,
        personaId: member.personaId,
        assignedRoot,
        writeScopes,
      },
    });

    memberViews.push({
      name: member.name,
      agentId,
      personaId: member.personaId,
      role: member.role,
      sandboxId: launched.sandboxId,
      status: "starting",
      assignedRoot,
      writeScopes,
    });
  }

  await db.insert(teamEvents).values({
    id: `tev_${randomUUID()}`,
    teamId,
    kind: "team_spawned",
    payload: { memberCount: memberViews.length, channel },
  });

  return {
    teamId,
    channel,
    sharedMountRoot,
    status: "starting",
    members: memberViews,
  };
}

interface ParsedBody {
  task: string;
  teamPrompt?: string;
  members: MemberInput[];
  ttlSeconds: number;
}

export function parseSpawnBody(body: unknown): ParsedBody {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new SpawnTeamError(
      "Request body must be an object",
      400,
      "invalid_body",
    );
  }
  const record = body as Record<string, unknown>;

  const task = typeof record.task === "string" ? record.task.trim() : "";
  if (!task) {
    throw new SpawnTeamError("task is required", 422, "task_required");
  }

  const teamPrompt =
    typeof record.teamPrompt === "string" && record.teamPrompt.trim()
      ? record.teamPrompt.trim()
      : undefined;

  const ttlRaw = record.ttlSeconds;
  let ttlSeconds = DEFAULT_TTL_SECONDS;
  if (ttlRaw !== undefined) {
    if (typeof ttlRaw !== "number" || !Number.isFinite(ttlRaw) || ttlRaw <= 0) {
      throw new SpawnTeamError(
        "ttlSeconds must be a positive number",
        422,
        "invalid_ttl",
      );
    }
    ttlSeconds = Math.min(Math.floor(ttlRaw), MAX_TTL_SECONDS);
  }

  let maxMembers = DEFAULT_MAX_MEMBERS;
  if (record.maxMembers !== undefined) {
    if (typeof record.maxMembers !== "number" || record.maxMembers <= 0) {
      throw new SpawnTeamError(
        "maxMembers must be a positive number",
        422,
        "invalid_max_members",
      );
    }
    maxMembers = Math.min(Math.floor(record.maxMembers), HARD_MAX_MEMBERS);
  }

  if (!Array.isArray(record.members) || record.members.length === 0) {
    throw new SpawnTeamError(
      "members must be a non-empty array",
      422,
      "members_required",
    );
  }
  if (record.members.length > maxMembers) {
    throw new SpawnTeamError(
      `members exceeds maxMembers (${record.members.length} > ${maxMembers})`,
      422,
      "too_many_members",
    );
  }

  const seenNames = new Set<string>();
  let orchestratorCount = 0;
  let anyUnassigned = false;
  const members: MemberInput[] = record.members.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new SpawnTeamError(
        `members[${index}] must be an object`,
        422,
        "invalid_member",
      );
    }
    const m = raw as Record<string, unknown>;
    const name = typeof m.name === "string" ? m.name.trim() : "";
    const persona = typeof m.persona === "string" ? m.persona.trim() : "";
    if (!name)
      throw new SpawnTeamError(
        `members[${index}].name is required`,
        422,
        "invalid_member",
      );
    if (!persona)
      throw new SpawnTeamError(
        `members[${index}].persona is required`,
        422,
        "invalid_member",
      );
    if (seenNames.has(name)) {
      throw new SpawnTeamError(
        `duplicate member name "${name}"`,
        422,
        "duplicate_member",
      );
    }
    seenNames.add(name);

    const role = (m.role ?? "worker") as MemberRole;
    if (role !== "orchestrator" && role !== "worker" && role !== "reviewer") {
      throw new SpawnTeamError(
        `members[${index}].role is invalid`,
        422,
        "invalid_role",
      );
    }
    if (role === "orchestrator") orchestratorCount += 1;

    const task =
      typeof m.task === "string" && m.task.trim() ? m.task.trim() : undefined;
    if (!task && role !== "orchestrator") anyUnassigned = true;

    return { name, persona, role, ...(task ? { task } : {}) };
  });

  if (orchestratorCount > 1) {
    throw new SpawnTeamError(
      "at most one orchestrator member is allowed",
      422,
      "multiple_orchestrators",
    );
  }

  // Synthetic lead fallback (spec §6.1/E): unassigned members with no
  // orchestrator -> inject a relay-orchestrator lead to divvy the work.
  if (anyUnassigned && orchestratorCount === 0) {
    if (members.length >= maxMembers) {
      throw new SpawnTeamError(
        "no orchestrator and adding a synthetic lead would exceed maxMembers",
        422,
        "synthetic_lead_over_cap",
      );
    }
    members.unshift({
      name: "lead",
      persona: SYNTHETIC_LEAD_PERSONA,
      role: "orchestrator",
    });
  }

  return { task, members, ttlSeconds, ...(teamPrompt ? { teamPrompt } : {}) };
}

interface ResolvedMember extends MemberInput {
  personaId: string;
  specHash: string;
}

async function resolveMembers(
  members: MemberInput[],
  deployerUserId: string,
): Promise<ResolvedMember[]> {
  const db = getDb();
  const resolved: ResolvedMember[] = [];
  for (const member of members) {
    // Resolve by persona UUID id, or by slug owned by the deploying user.
    const [row] = await db
      .select({ id: personas.id, specHash: personas.specHash })
      .from(personas)
      .where(
        or(
          eq(personas.id, member.persona),
          and(
            eq(personas.slug, member.persona),
            eq(personas.ownerUserId, deployerUserId),
          ),
        ),
      )
      .limit(1);
    if (!row) {
      throw new SpawnTeamError(
        `member "${member.name}" persona "${member.persona}" not found`,
        422,
        "persona_unresolved",
      );
    }
    resolved.push({ ...member, personaId: row.id, specHash: row.specHash });
  }
  return resolved;
}

export function assignedRootForTeamMember(
  teamId: string,
  memberName: string,
): string {
  const safeMemberName = memberName
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safeMemberName) {
    throw new SpawnTeamError(
      "member name must include at least one path-safe character",
      422,
      "invalid_member",
    );
  }
  return assertSafeMemberWritePath(
    `/teams/${teamId}/members/${safeMemberName}`,
  );
}

export function localRootForAssignedRoot(assignedRoot: string): string {
  return `${MEMBER_LOCAL_ROOT}${assertSafeMemberWritePath(assignedRoot)}`;
}

export async function mintTeamMemberRelayfileToken(input: {
  workspaceId: string;
  relayAuthUrl: string;
  relayAuthApiKey: string;
  teamId: string;
  memberName: string;
  agentId: string;
  assignedRoot: string;
}): Promise<string> {
  const assignedRoot = assertSafeMemberWritePath(input.assignedRoot);
  const expectedWriteScope = pathScope(assignedRoot);
  const token = await mintWorkspacePathScopedRelayfileToken({
    workspaceId: input.workspaceId,
    relayAuthUrl: input.relayAuthUrl,
    relayAuthApiKey: input.relayAuthApiKey,
    agentName: input.memberName,
    agentId: input.agentId,
    paths: [memberWritePath(assignedRoot)],
    scopes: [expectedWriteScope],
    ttlSeconds: MEMBER_TOKEN_TTL_SECONDS,
  });
  validateTeamMemberToken({
    token,
    assignedRoot,
    memberName: input.memberName,
  });
  return token;
}

export function validateTeamMemberToken(input: {
  token: string;
  assignedRoot: string;
  memberName: string;
}): string[] {
  if (input.token.startsWith("relay_ws_")) {
    throw new SpawnTeamError(
      `member "${input.memberName}" relayfile token must be a direct relay_pa_ token`,
      500,
      "invalid_member_token",
    );
  }
  const assignedRoot = assertSafeMemberWritePath(input.assignedRoot);
  const expectedWriteScope = pathScope(assignedRoot);
  const scopes = scopesFromRelayfileAccessToken(input.token);
  const writeScopes = validateMemberRelayfileAccessScopes(scopes, [
    assignedRoot,
  ]);
  if (writeScopes.length !== 1 || writeScopes[0] !== expectedWriteScope) {
    throw new SpawnTeamError(
      `member "${input.memberName}" relayfile token scope must byte-match ${expectedWriteScope}`,
      500,
      "invalid_member_token_scope",
    );
  }
  return [expectedWriteScope];
}

function buildDefaultLaunchMemberOptions(input: {
  workspaceId: string;
  teamId: string;
  memberName: string;
  role: MemberRole;
  agentId: string;
  assignedRoot: string;
  localRoot: string;
  channel: string;
  memberToken: string;
}): LaunchMemberOptions {
  const relayfile = resolveRelayfileConfig();
  return {
    memberName: input.memberName,
    role: input.role,
    channel: input.channel,
    assignedRoot: input.assignedRoot,
    localRoot: input.localRoot,
    workspaceId: input.workspaceId,
    relayfileUrl: relayfile.relayfileUrl,
    relayAuthUrl: relayfile.relayAuthUrl,
    relayAuthApiKey: relayfile.relayAuthApiKey,
    relayfileToken: input.memberToken,
    runId: `${input.teamId}:${input.memberName}`,
    credentialBundle: {
      s3Credentials: {
        accessKeyId: "",
        secretAccessKey: "",
        sessionToken: "",
        bucket: "",
        prefix: "",
      },
      cliCredentials: "{}",
      workspaceId: input.workspaceId,
      relayApiKey: "",
      relayBaseUrl: "",
      runId: `${input.teamId}:${input.memberName}`,
      userId: input.agentId,
    },
    fileType: "typescript",
  };
}
