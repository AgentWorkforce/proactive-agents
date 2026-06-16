import * as z from 'zod';

// Nango's compiler restricts package imports to: url, node:url, crypto,
// node:crypto, nango, zod, unzipper, soap, botbuilder. Anything else (e.g.
// `@relayfile/adapter-linear`) is rejected at build time. We mirror the
// types and GraphQL constants we need from the adapter here so syncs can
// import everything via this relative module. Keep these in sync with
// `@relayfile/adapter-linear/dist/queries.d.ts` if the adapter changes.

export const INITIAL_UPDATED_AFTER = '1970-01-01T00:00:00.000Z';

const LinearCheckpointSchemaWithPageCursor = z.object({
    updatedAtCursor: z.string(),
    // Nango checkpoint payloads accept primitive values; clear this cursor by
    // omitting the field instead of persisting `null`.
    pageCursor: z.string().optional(),
});

// Nango's SDK type for `checkpoint` only accepts primitive fields even though
// the persisted checkpoint payload can include nullable optional values.
export const LinearCheckpointSchema = LinearCheckpointSchemaWithPageCursor as unknown as z.ZodObject<{
    updatedAtCursor: z.ZodString;
}>;

export type LinearCheckpoint = z.infer<typeof LinearCheckpointSchemaWithPageCursor>;

export interface LinearPageInfo {
    hasNextPage?: boolean;
    endCursor?: string | null;
}

export interface LinearConnection<TNode> {
    nodes?: TNode[];
    pageInfo?: LinearPageInfo;
}

export interface LinearGraphqlResponse<T> {
    data?: T;
    errors?: Array<{
        message?: string;
        path?: string[];
    }>;
}

export interface LinearIssueStateNode {
    id?: string | null;
    name?: string | null;
    type?: string | null;
    color?: string | null;
}

export interface LinearUserReferenceNode {
    id?: string | null;
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    url?: string | null;
}

export interface LinearTeamReferenceNode {
    id?: string | null;
    key?: string | null;
    name?: string | null;
}

export interface LinearProjectReferenceNode {
    id?: string | null;
    name?: string | null;
    state?: string | null;
    url?: string | null;
}

export const LinearProjectStateSchema = z.enum(['planned', 'started', 'paused', 'completed', 'canceled']);

export const LinearProjectStatusSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: LinearProjectStateSchema.nullable().optional(),
    color: z.string().nullable().optional()
});

export const LinearProjectRecordSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    description: z.string().nullable(),
    team_ids: z.array(z.string()),
    created_at: z.string(),
    updated_at: z.string()
});

export const LinearProjectFullSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    description: z.string().nullable(),
    teamIds: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    state: LinearProjectStateSchema.nullable().optional(),
    progress: z.number().nullable().optional(),
    startDate: z.string().nullable().optional(),
    targetDate: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    leadId: z.string().nullable().optional(),
    status: LinearProjectStatusSchema.nullable().optional()
});

export type LinearProjectRecord = z.infer<typeof LinearProjectRecordSchema>;
export type LinearProjectFull = z.infer<typeof LinearProjectFullSchema>;

export interface LinearProjectNode {
    id: string;
    name?: string | null;
    url?: string | null;
    description?: string | null;
    state?: string | null;
    progress?: number | null;
    startDate?: string | null;
    targetDate?: string | null;
    color?: string | null;
    icon?: string | null;
    lead?: LinearUserReferenceNode | null;
    status?: {
        id?: string | null;
        name?: string | null;
        type?: string | null;
        color?: string | null;
    } | null;
    teams?: LinearConnection<LinearIdNode> | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface LinearCycleReferenceNode {
    id?: string | null;
    number?: number | null;
    name?: string | null;
}

export interface LinearLabelReferenceNode {
    id?: string | null;
    name?: string | null;
    color?: string | null;
}

export interface LinearIssueNode {
    id: string;
    identifier?: string | null;
    title?: string | null;
    description?: string | null;
    state?: LinearIssueStateNode | null;
    priority?: number | null;
    estimate?: number | null;
    dueDate?: string | null;
    assignee?: LinearUserReferenceNode | null;
    creator?: LinearUserReferenceNode | null;
    team?: LinearTeamReferenceNode | null;
    project?: LinearProjectReferenceNode | null;
    cycle?: LinearCycleReferenceNode | null;
    labels?: {
        nodes?: Array<LinearLabelReferenceNode>;
    } | null;
    url?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface LinearCommentNode {
    id: string;
    body?: string | null;
    issue?: {
        id?: string | null;
        identifier?: string | null;
        title?: string | null;
        url?: string | null;
    } | null;
    user?: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        displayName?: string | null;
    } | null;
    url?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface LinearIdNode {
    id?: string | null;
}

// GraphQL field-set fragments. Keep verbatim with adapter-linear/queries.

export const LINEAR_USER_FIELDS = `
        id
        name
        displayName
        email
        admin
        active
        avatarUrl
        createdAt
        updatedAt
`;

export const LINEAR_TEAM_FIELDS = `
        id
        name
        key
        description
        color
        icon
        private
        createdAt
        updatedAt
        archivedAt
`;

export const LINEAR_PROJECT_FIELDS = `
        id
        name
        description
        state
        progress
        startDate
        targetDate
        color
        icon
        url
        createdAt
        updatedAt
        lead {
          id
          name
          email
        }
        status {
          id
          name
          type
          color
        }
        teams(first: 20) {
          nodes {
            id
            key
            name
          }
        }
`;

export const LINEAR_COMMENT_FIELDS = `
        id
        body
        url
        issue {
          id
          identifier
          title
          url
        }
        user {
          id
          name
          displayName
          email
        }
        createdAt
        updatedAt
`;

const LINEAR_ISSUE_FIELDS = `
        id
        identifier
        title
        description
        url
        priority
        estimate
        dueDate
        createdAt
        updatedAt
        state {
          id
          name
          type
          color
        }
        assignee {
          id
          name
          displayName
          email
          avatarUrl
          url
        }
        creator {
          id
          name
          displayName
          email
          avatarUrl
          url
        }
        team {
          id
          key
          name
        }
        project {
          id
          name
          state
          url
        }
        cycle {
          id
          number
          name
        }
        labels(first: 20) {
          nodes {
            id
            name
            color
          }
        }
`;

export const LINEAR_GET_ISSUE_QUERY = `
  query GetIssue($id: String!) {
    issue(id: $id) {
${LINEAR_ISSUE_FIELDS}
    }
  }
`;

export const LINEAR_LIST_ROADMAPS_QUERY = `
  query ListRoadmaps($first: Int, $after: String, $orderBy: PaginationOrderBy) {
    roadmaps(first: $first, after: $after, orderBy: $orderBy) {
      nodes {
        id
        name
        description
        updatedAt
        createdAt
        archivedAt
        color
        slugId
        sortOrder
        url
        creator {
          id
        }
        owner {
          id
        }
        projects(first: 25) {
          nodes {
            id
            teams(first: 10) {
              nodes {
                id
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function requireLinearConnection<TData, TConnection>(
    response: LinearGraphqlResponse<TData> | undefined,
    readConnection: (data: TData) => TConnection | undefined,
    label: string
): TConnection {
    if (response?.errors && response.errors.length > 0) {
        const message = response.errors[0]?.message ?? 'Unknown GraphQL error';
        throw new Error(`Linear GraphQL error while fetching ${label}: ${message}`);
    }

    if (!response?.data) {
        throw new Error(`Linear GraphQL response did not include ${label} data.`);
    }

    const connection = readConnection(response.data);
    if (!connection) {
        throw new Error(`Linear GraphQL response did not include ${label} connection.`);
    }

    return connection;
}

export function toIsoString(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return new Date(value).toISOString();
}

export function toNullableIsoString(value: string | null | undefined): string | null {
    return value ? new Date(value).toISOString() : null;
}

export function nodeIds(connection: { nodes?: LinearIdNode[] } | null | undefined): string[] {
    return (connection?.nodes ?? [])
        .map((node) => node.id ?? '')
        .filter((id): id is string => Boolean(id));
}

export function toLinearProjectRecord(project: LinearProjectNode): LinearProjectRecord {
    return LinearProjectRecordSchema.parse({
        id: project.id,
        name: project.name ?? '',
        url: project.url ?? '',
        description: project.description ?? null,
        team_ids: nodeIds(project.teams),
        created_at: toIsoString(project.createdAt),
        updated_at: toIsoString(project.updatedAt)
    });
}

export function toLinearProjectFull(project: LinearProjectNode): LinearProjectFull {
    const record = toLinearProjectRecord(project);
    const state = parseProjectState(project.status?.type ?? project.state);
    const status =
        project.status?.id && project.status?.name
            ? {
                  id: project.status.id,
                  name: project.status.name,
                  type: parseProjectState(project.status.type),
                  ...(project.status.color ? { color: project.status.color } : {})
              }
            : null;

    return LinearProjectFullSchema.parse({
        id: record.id,
        name: record.name,
        url: record.url,
        description: record.description,
        teamIds: record.team_ids,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        state,
        progress: project.progress ?? null,
        startDate: project.startDate ?? null,
        targetDate: project.targetDate ?? null,
        color: project.color ?? null,
        icon: project.icon ?? null,
        leadId: project.lead?.id ?? null,
        status
    });
}

function parseProjectState(value: string | null | undefined): z.infer<typeof LinearProjectStateSchema> | null {
    const parsed = LinearProjectStateSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

export function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
