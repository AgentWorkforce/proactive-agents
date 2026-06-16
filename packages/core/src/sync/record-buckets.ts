// Provider-specific record bucketing for the Phase 3 aux-emitter dispatchers.
//
// `bucketByModel` takes a flat list of Nango sync records plus the Nango
// `(model, provider)` tuple and returns the typed bucket shape that the
// matching `@relayfile/adapter-X` package's `emitXAuxiliaryFiles` accepts.
//
// Why a separate file? Cloud's old `writeXAuxiliaryFiles` functions each had
// their own ad-hoc model dispatch (often duplicated across record/aux paths).
// Centralizing the routing here keeps the dispatcher in `record-writer.ts`
// at ~15 lines per provider and makes the routing testable in isolation.
//
// Tombstone handling: records carrying Nango's deletion envelope arrive here
// in raw form (the dispatcher hands us the array verbatim, after
// `stripNangoMetadata`). We detect them via `isDeletedNangoRecord` and
// rewrite them into the adapter's `{ id, _deleted: true }` (+ scope) shape
// before they cross the bucket boundary.
//
// Unknown models fall through to an empty bucket — the dispatcher emits a
// no-op result so the canonical record write still proceeds.

import {
  normalizeNangoGitHubModel,
} from "@relayfile/adapter-github/path-mapper";
import {
  normalizeNangoLinearModel,
} from "@relayfile/adapter-linear/path-mapper";
import {
  normalizeJiraObjectType,
} from "@relayfile/adapter-jira/path-mapper";
import {
  normalizeNangoConfluenceModel,
} from "@relayfile/adapter-confluence";
import {
  normalizeNangoNotionModel,
} from "@relayfile/adapter-notion";
import {
  normalizeNangoHubSpotModel,
} from "@relayfile/adapter-hubspot/path-mapper";
import {
  tryNormalizeXObjectType,
} from "@relayfile/adapter-x/path-mapper";
import {
  normalizeDockerHubObjectType,
  type DockerHubPathObjectType,
} from "@relayfile/adapter-docker-hub/path-mapper";
import { normalizeNangoRedditModel } from "@relayfile/adapter-reddit/path-mapper";
import { normalizeNangoDaytonaModel } from "@relayfile/adapter-daytona/path-mapper";

import { isDeletedNangoRecord, stripNangoMetadata } from "./record-writer.js";

// ---------------------------------------------------------------------------
// Bucket shapes — one per provider. Each mirrors the corresponding adapter's
// `EmitXAuxiliaryFilesInput` minus `workspaceId`/`connectionId` (those are
// stamped on by the dispatcher).
// ---------------------------------------------------------------------------

export interface ConfluenceBuckets {
  pages?: Record<string, unknown>[];
  spaces?: Record<string, unknown>[];
}

export interface SlackBuckets {
  channels?: Record<string, unknown>[];
  users?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
  threads?: Record<string, unknown>[];
  threadReplies?: Record<string, unknown>[];
}

export interface JiraBuckets {
  issues?: Record<string, unknown>[];
  projects?: Record<string, unknown>[];
  sprints?: Record<string, unknown>[];
  comments?: Record<string, unknown>[];
}

export interface NotionBuckets {
  pages?: Record<string, unknown>[];
  databases?: Record<string, unknown>[];
  users?: Record<string, unknown>[];
}

export interface HubSpotBuckets {
  contacts?: Record<string, unknown>[];
  companies?: Record<string, unknown>[];
  deals?: Record<string, unknown>[];
  tickets?: Record<string, unknown>[];
}

export interface LinearBuckets {
  issues?: Record<string, unknown>[];
  comments?: Record<string, unknown>[];
  users?: Record<string, unknown>[];
  teams?: Record<string, unknown>[];
  projects?: Record<string, unknown>[];
  states?: Record<string, unknown>[];
  cycles?: Record<string, unknown>[];
  milestones?: Record<string, unknown>[];
  roadmaps?: Record<string, unknown>[];
}

export interface GitHubBuckets {
  pullRequests?: Record<string, unknown>[];
  issues?: Record<string, unknown>[];
  repositories?: Record<string, unknown>[];
  reviews?: Record<string, unknown>[];
  reviewComments?: Record<string, unknown>[];
  checkRuns?: Record<string, unknown>[];
  commits?: Record<string, unknown>[];
}

export interface GitLabBuckets {
  projects?: Record<string, unknown>[];
  mergeRequests?: Record<string, unknown>[];
  issues?: Record<string, unknown>[];
  commits?: Record<string, unknown>[];
  pipelines?: Record<string, unknown>[];
  deployments?: Record<string, unknown>[];
  tags?: Record<string, unknown>[];
}

export interface XBuckets {
  bundles?: Record<string, unknown>[];
  searches?: Record<string, unknown>[];
  posts?: Record<string, unknown>[];
  users?: Record<string, unknown>[];
  results?: Record<string, unknown>[];
}

export interface GoogleMailBuckets {
  labels?: Record<string, unknown>[];
  filters?: Record<string, unknown>[];
  "send-as"?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
  threads?: Record<string, unknown>[];
  "watch-renewals"?: Record<string, unknown>[];
}

export interface GoogleCalendarBuckets {
  calendars?: Record<string, unknown>[];
  settings?: Record<string, unknown>[];
  colors?: Record<string, unknown>[];
  events?: Record<string, unknown>[];
  acls?: Record<string, unknown>[];
  "watch-renewals"?: Record<string, unknown>[];
}

export interface GranolaBuckets {
  notes?: Record<string, unknown>[];
  folders?: Record<string, unknown>[];
}

export interface RecallBuckets {
  recordings?: Record<string, unknown>[];
}

export interface FathomBuckets {
  meetings?: Record<string, unknown>[];
  recordingSummaries?: Record<string, unknown>[];
  recordingTranscripts?: Record<string, unknown>[];
  teams?: Record<string, unknown>[];
  teamMembers?: Record<string, unknown>[];
}

export interface DockerHubBuckets {
  repositories?: Record<string, unknown>[];
  tags?: Record<string, unknown>[];
  webhooks?: Record<string, unknown>[];
}

export interface DropboxBuckets {
  files?: Record<string, unknown>[];
  folders?: Record<string, unknown>[];
  sharedFolders?: Record<string, unknown>[];
  sharedLinks?: Record<string, unknown>[];
}

export interface RedditBuckets {
  subreddits?: Record<string, unknown>[];
  posts?: Record<string, unknown>[];
}

export interface DaytonaBuckets {
  usage?: Record<string, unknown>[];
}

export type ProviderBuckets =
  | { provider: "confluence"; buckets: ConfluenceBuckets }
  | { provider: "slack"; buckets: SlackBuckets }
  | { provider: "jira"; buckets: JiraBuckets }
  | { provider: "notion"; buckets: NotionBuckets }
  | { provider: "hubspot"; buckets: HubSpotBuckets }
  | { provider: "linear"; buckets: LinearBuckets }
  | { provider: "github"; buckets: GitHubBuckets }
  | { provider: "gitlab"; buckets: GitLabBuckets }
  | { provider: "x"; buckets: XBuckets }
  | { provider: "google-mail"; buckets: GoogleMailBuckets }
  | { provider: "google-calendar"; buckets: GoogleCalendarBuckets }
  | { provider: "granola"; buckets: GranolaBuckets }
  | { provider: "recall"; buckets: RecallBuckets }
  | { provider: "fathom"; buckets: FathomBuckets }
  | { provider: "docker-hub"; buckets: DockerHubBuckets }
  | { provider: "reddit"; buckets: RedditBuckets }
  | { provider: "dropbox"; buckets: DropboxBuckets }
  | { provider: "daytona"; buckets: DaytonaBuckets }
  | { provider: "unknown"; buckets: {} };

// ---------------------------------------------------------------------------
// Shared helpers.
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = record[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function readId(record: Record<string, unknown>, key = "id"): string | null {
  const v = record[key];
  if (typeof v === "string" && v.length > 0) return v;
  if (typeof v === "number") return String(v);
  return null;
}

/** Returns the unscoped tombstone `{ id, _deleted: true }`. */
function basicTombstone(id: string): Record<string, unknown> {
  return { id, _deleted: true };
}

/**
 * Map a Nango record to either a "fresh" cleaned record (`stripNangoMetadata`
 * already applied) or `null` if the record is a delete and the caller wants
 * to handle it in a separate code path.
 */
function clean(record: Record<string, unknown>): Record<string, unknown> {
  return stripNangoMetadata(record);
}

function safeNormalize<T>(fn: (m: string) => T, model: string): T | null {
  try {
    return fn(model);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Per-provider bucketers.
// ---------------------------------------------------------------------------

function bucketConfluence(
  records: readonly Record<string, unknown>[],
  model: string,
): ConfluenceBuckets {
  const type = safeNormalize(normalizeNangoConfluenceModel, model);
  if (type === "page") {
    return { pages: mapToBucket(records, basicTombstone) };
  }
  if (type === "space") {
    return { spaces: mapToBucket(records, basicTombstone) };
  }
  return {};
}

function bucketLinear(
  records: readonly Record<string, unknown>[],
  model: string,
): LinearBuckets {
  const type = safeNormalize(normalizeNangoLinearModel, model);
  if (!type) return {};
  const mapped = mapToBucket(records, basicTombstone).map((record) =>
    type === "issue" ? normalizeLinearIssueForAuxiliaryEmit(record) : record,
  );
  switch (type) {
    case "issue":
      return { issues: mapped };
    case "comment":
      return { comments: mapped };
    case "user":
      return { users: mapped };
    case "team":
      return { teams: mapped };
    case "project":
      return { projects: mapped };
    case "state":
      return { states: mapped };
    case "cycle":
      return { cycles: mapped };
    case "milestone":
      return { milestones: mapped };
    case "roadmap":
      return { roadmaps: mapped };
    default:
      return {};
  }
}

function normalizeLinearIssueForAuxiliaryEmit(
  record: Record<string, unknown>,
): Record<string, unknown> {
  if (record._deleted === true) return record;
  if (isObject(record.state)) return record;
  const stateName = readString(record, "state_name");
  if (!stateName) return record;
  return {
    ...record,
    state: { name: stateName },
  };
}

function bucketJira(
  records: readonly Record<string, unknown>[],
  model: string,
): JiraBuckets {
  const type = safeNormalize(normalizeJiraObjectType, model);
  if (!type) return {};
  const mapped = mapToBucket(records, basicTombstone);
  switch (type) {
    case "issue":
      return { issues: mapped };
    case "project":
      return { projects: mapped };
    case "sprint":
      return { sprints: mapped };
    case "comment":
      return { comments: mapped };
    default:
      return {};
  }
}

function bucketNotion(
  records: readonly Record<string, unknown>[],
  model: string,
): NotionBuckets {
  // adapter-notion's `normalizeNangoNotionModel` throws on `NotionUser`
  // (it only handles page/database/page-content), so we resolve the user
  // case explicitly to mirror cloud's existing `resolveNotionObjectType`.
  const trimmed = model.trim();
  if (trimmed === "NotionUser" || trimmed.toLowerCase() === "notionuser") {
    return { users: mapToBucket(records, basicTombstone) };
  }

  const type = safeNormalize(normalizeNangoNotionModel, model);
  if (type === "page") {
    return { pages: mapToBucket(records, basicTombstone) };
  }
  if (type === "database") {
    return { databases: mapToBucket(records, basicTombstone) };
  }
  // `page_content` and any other notion model has no aux-file emission.
  return {};
}

function bucketHubSpot(
  records: readonly Record<string, unknown>[],
  model: string,
): HubSpotBuckets {
  // `normalizeNangoHubSpotModel` throws on models without a writeback surface
  // (Order/Product/User). Those sync as canonical records via the generic
  // write path but have no adapter resource, so they fall through to an empty
  // bucket here — no aux emission, identical to any non-writable model.
  const type = safeNormalize(normalizeNangoHubSpotModel, model);
  if (!type) return {};
  const mapped = mapToBucket(records, basicTombstone);
  switch (type) {
    case "contact":
      return { contacts: mapped };
    case "company":
      return { companies: mapped };
    case "deal":
      return { deals: mapped };
    case "ticket":
      return { tickets: mapped };
    default:
      return {};
  }
}

function bucketSlack(
  records: readonly Record<string, unknown>[],
  model: string,
): SlackBuckets {
  const normalized = model.trim().toLowerCase();

  if (normalized === "slackchannel" || normalized === "channel") {
    return { channels: mapToBucket(records, basicTombstone) };
  }
  if (normalized === "slackuser" || normalized === "user") {
    return { users: mapToBucket(records, basicTombstone) };
  }
  if (normalized !== "slackmessage" && normalized !== "message") {
    return {};
  }

  // Messages split into 3 buckets based on `thread_ts` vs `ts`:
  //   - reply (`thread_ts && thread_ts !== ts`)            → threadReplies
  //   - thread root (`thread_ts === ts || reply_count>0`)  → threads
  //   - lone message                                       → messages
  // Mirrors `computeSlackRecordPath` in record-writer.ts.
  const messages: Record<string, unknown>[] = [];
  const threads: Record<string, unknown>[] = [];
  const threadReplies: Record<string, unknown>[] = [];

  for (const raw of records) {
    if (isDeletedNangoRecord(raw)) {
      const cleaned = clean(raw);
      const channelId = readId(cleaned, "channel") ?? readId(cleaned, "channelId");
      const ts = readId(cleaned, "ts");
      const threadTs = readId(cleaned, "thread_ts") ?? readId(cleaned, "threadTs");
      const replyCount =
        typeof cleaned.reply_count === "number"
          ? cleaned.reply_count
          : typeof cleaned.replyCount === "number"
            ? cleaned.replyCount
            : 0;
      const id = readId(cleaned, "id") ?? ts ?? "";
      if (!id) continue;
      const tombstone: Record<string, unknown> = {
        id,
        _deleted: true,
      };
      if (channelId) tombstone.channelId = channelId;
      if (ts) tombstone.ts = ts;

      if (threadTs && ts && threadTs !== ts) {
        tombstone.threadTs = threadTs;
        tombstone.replyTs = ts;
        threadReplies.push(tombstone);
      } else if ((threadTs && ts && threadTs === ts) || replyCount > 0) {
        tombstone.threadTs = threadTs ?? ts;
        threads.push(tombstone);
      } else {
        messages.push(tombstone);
      }
      continue;
    }

    const cleaned = clean(raw);
    const ts = readId(cleaned, "ts");
    // Mirror the deleted-record path above: tolerate both snake_case (Nango's
    // canonical) and camelCase (some adapter callbacks normalize before bucketing).
    const threadTs = readId(cleaned, "thread_ts") ?? readId(cleaned, "threadTs");
    const replyCount =
      typeof cleaned.reply_count === "number"
        ? cleaned.reply_count
        : typeof cleaned.replyCount === "number"
          ? cleaned.replyCount
          : 0;

    // Surface channelId on cleaned record (the canonical field name in the
    // adapter contract is `channelId`; Nango payloads use `channel`).
    if (cleaned.channelId === undefined && cleaned.channel) {
      cleaned.channelId = cleaned.channel;
    }

    if (threadTs && ts && threadTs !== ts) {
      // Reply.
      if (cleaned.threadTs === undefined) cleaned.threadTs = threadTs;
      if (cleaned.replyTs === undefined) cleaned.replyTs = ts;
      threadReplies.push(cleaned);
    } else if ((threadTs && ts && threadTs === ts) || replyCount > 0) {
      // Thread root.
      if (cleaned.threadTs === undefined) cleaned.threadTs = threadTs ?? ts;
      threads.push(cleaned);
    } else {
      messages.push(cleaned);
    }
  }

  const out: SlackBuckets = {};
  if (messages.length > 0) out.messages = messages;
  if (threads.length > 0) out.threads = threads;
  if (threadReplies.length > 0) out.threadReplies = threadReplies;
  return out;
}

function bucketGitHub(
  records: readonly Record<string, unknown>[],
  model: string,
): GitHubBuckets {
  const type = safeNormalize(normalizeNangoGitHubModel, model);
  if (!type) return {};

  // GitHub records need owner/repo scoping. The adapter accepts them as
  // `owner`/`repo` (or falls back to `full_name`/`url`/`html_url`). We
  // pass records through verbatim so the adapter's `parseGitHubRepoFromRecord`
  // equivalent extracts what it needs. For tombstones we surface owner/repo
  // when the legacy record carried them so the adapter can scope the delete.
  const mapped: Record<string, unknown>[] = [];
  for (const raw of records) {
    if (isDeletedNangoRecord(raw)) {
      const cleaned = clean(raw);
      const id =
        type === "issue" || type === "pull_request"
          ? readId(cleaned, "number") ?? readId(cleaned, "id")
          : readId(cleaned, "id") ?? readId(cleaned, "number");
      if (!id) continue;
      const tombstone: Record<string, unknown> = { id, _deleted: true };
      const owner = readString(cleaned, "owner");
      const repo = readString(cleaned, "repo");
      const fullName = readString(cleaned, "full_name");
      if (owner) tombstone.owner = owner;
      if (repo) tombstone.repo = repo;
      if (fullName) tombstone.full_name = fullName;
      mapped.push(tombstone);
      continue;
    }
    mapped.push(clean(raw));
  }

  switch (type) {
    case "pull_request":
      return { pullRequests: mapped };
    case "issue":
      return { issues: mapped };
    case "repository":
      return { repositories: mapped };
    case "review":
      return { reviews: mapped };
    case "review_comment":
      return { reviewComments: mapped };
    case "check_run":
      return { checkRuns: mapped };
    case "commit":
      return { commits: mapped };
    default:
      return {};
  }
}

function normalizeGitLabModel(model: string):
  | "project"
  | "merge_requests"
  | "issues"
  | "commits"
  | "pipelines"
  | "deployments"
  | "tags"
  | "pipeline_jobs"
  | null {
  const normalized = model.trim().toLowerCase();
  switch (normalized) {
    case "gitlabproject":
    case "project":
      return "project";
    case "gitlabmergerequest":
    case "mergerequest":
    case "merge_request":
    case "merge_requests":
      return "merge_requests";
    case "gitlabissue":
    case "issue":
    case "issues":
      return "issues";
    case "gitlabcommit":
    case "commit":
    case "commits":
      return "commits";
    case "gitlabpipeline":
    case "pipeline":
    case "pipelines":
      return "pipelines";
    case "gitlabdeployment":
    case "deployment":
    case "deployments":
      return "deployments";
    case "gitlabtag":
    case "tag":
    case "tags":
      return "tags";
    case "gitlabpipelinejob":
    case "pipelinejob":
    case "pipeline_job":
    case "pipeline_jobs":
    case "job":
    case "jobs":
      return "pipeline_jobs";
    default:
      return null;
  }
}

function bucketGitLab(
  records: readonly Record<string, unknown>[],
  model: string,
): GitLabBuckets {
  const type = normalizeGitLabModel(model);
  if (!type) return {};
  if (type === "project") return { projects: mapToBucket(records, basicTombstone) };

  const mapped: Record<string, unknown>[] = [];
  for (const raw of records) {
    if (!isDeletedNangoRecord(raw)) {
      mapped.push(clean(raw));
      continue;
    }

    const cleaned = clean(raw);
    if (type === "commits") {
      const sha = readId(cleaned, "sha") ?? readId(cleaned, "id");
      if (sha) {
        mapped.push(gitLabTombstoneWithScope(cleaned, "sha", sha));
      }
      continue;
    }

    if (type === "tags") {
      const ref = readId(cleaned, "ref") ?? readId(cleaned, "name") ?? readId(cleaned, "id");
      if (ref) {
        mapped.push(gitLabTombstoneWithScope(cleaned, "ref", ref));
      }
      continue;
    }

    if (type === "pipeline_jobs") {
      mapped.push(cleaned);
      continue;
    }

    const id = type === "pipelines" || type === "deployments"
      ? readId(cleaned, "id") ?? readId(cleaned, "iid")
      : readId(cleaned, "iid") ?? readId(cleaned, "id");
    if (id) {
      mapped.push(gitLabTombstoneWithScope(cleaned, type === "pipelines" || type === "deployments" ? "id" : "iid", id));
    }
  }

  switch (type) {
    case "merge_requests":
      return { mergeRequests: mapped };
    case "issues":
      return { issues: mapped };
    case "commits":
      return { commits: mapped };
    case "pipelines":
      return { pipelines: mapped };
    case "deployments":
      return { deployments: mapped };
    case "tags":
      return { tags: mapped };
    default:
      return {};
  }
}

function gitLabTombstoneWithScope(
  record: Record<string, unknown>,
  idKey: "id" | "iid" | "ref" | "sha",
  id: string,
): Record<string, unknown> {
  const tombstone: Record<string, unknown> = { [idKey]: id, _deleted: true };
  for (const key of [
    "project_path",
    "projectPath",
    "path_with_namespace",
    "project_id",
    "web_url",
    "url",
    "title",
    "name",
    "state",
    "status",
    "ref",
    "sha",
    "target",
    "environment_name",
    "environment",
    "pipeline_id",
    "assignees",
    "author",
    "labels",
    "priority",
  ]) {
    if (record[key] !== undefined) {
      tombstone[key] = record[key];
    }
  }
  if (isObject(record.project)) {
    tombstone.project = record.project;
  }
  return tombstone;
}

function bucketX(
  records: readonly Record<string, unknown>[],
  model: string,
): XBuckets {
  const normalized = model.trim().toLowerCase();
  const type = normalized === "xsearchbundle" || normalized === "searchbundle"
    ? "bundle"
    : normalized === "xsearchresult" || normalized === "searchresult"
    ? "result"
    : tryNormalizeXObjectType(model.replace(/^X/u, ""));
  const mapped = mapToBucket(records, basicTombstone);

  switch (type) {
    case "bundle":
      return { bundles: mapped };
    case "search":
      return { searches: mapped };
    case "post":
      return { posts: mapped };
    case "user":
      return { users: mapped };
    case "result":
      return { results: mapped };
    default:
      return {};
  }
}

function bucketGoogleMail(
  records: readonly Record<string, unknown>[],
  model: string,
): GoogleMailBuckets {
  const normalized = model.trim().toLowerCase();
  const mapped = mapToBucket(records, basicTombstone);

  switch (normalized) {
    case "googlemaillabel":
    case "label":
      return { labels: mapped };
    case "googlemailfilter":
    case "filter":
      return { filters: mapped };
    case "googlemailsendasalias":
    case "sendasalias":
    case "send-as":
    case "sendas":
      return { "send-as": mapped };
    case "googlemailmessage":
    case "message":
      return { messages: mapped };
    case "googlemailthread":
    case "thread":
      return { threads: mapped };
    case "googlemailwatchrenewal":
    case "watchrenewal":
    case "watch-renewal":
      return { "watch-renewals": mapped };
    default:
      return {};
  }
}

function bucketGoogleCalendar(
  records: readonly Record<string, unknown>[],
  model: string,
): GoogleCalendarBuckets {
  const normalized = model.trim().toLowerCase();
  const mapped = mapToBucket(records, basicTombstone);

  switch (normalized) {
    case "googlecalendar":
    case "calendar":
      return { calendars: mapped };
    case "googlecalendarsetting":
    case "calendarsetting":
    case "setting":
      return { settings: mapped };
    case "googlecalendarcolor":
    case "calendarcolor":
    case "color":
      return { colors: mapped };
    case "googlecalendarevent":
    case "calendarevent":
    case "event":
      return { events: mapped };
    case "googlecalendaracl":
    case "calendaracl":
    case "acl":
      return { acls: mapped };
    case "googlecalendarwatchrenewal":
    case "calendarwatchrenewal":
    case "watchrenewal":
    case "watch-renewal":
      return { "watch-renewals": mapped };
    default:
      return {};
  }
}

function bucketGranola(
  records: readonly Record<string, unknown>[],
  model: string,
): GranolaBuckets {
  const normalized = model.trim().toLowerCase();
  const mapped = mapToBucket(records, basicTombstone);

  switch (normalized) {
    case "granolanote":
    case "note":
      return { notes: mapped };
    case "granolafolder":
    case "folder":
      return { folders: mapped };
    default:
      return {};
  }
}

function bucketRecall(
  records: readonly Record<string, unknown>[],
  model: string,
): RecallBuckets {
  const normalized = model.trim().toLowerCase();
  const mapped = mapToBucket(records, basicTombstone);

  switch (normalized) {
    case "recallrecording":
    case "recording":
    case "recalltranscript":
    case "transcript":
      return { recordings: mapped };
    default:
      return {};
  }
}

function bucketDockerHub(
  records: readonly Record<string, unknown>[],
  model: string,
): DockerHubBuckets {
  const type = safeNormalize(normalizeDockerHubObjectType, model);
  if (!type) return {};
  const mapped = mapToBucket(records, dockerHubTombstone(type));

  switch (type) {
    case "repository":
      return { repositories: mapped };
    case "tag":
      return { tags: mapped };
    case "webhook":
      return { webhooks: mapped };
    default:
      return {};
  }
}

function dockerHubTombstone(
  objectType: DockerHubPathObjectType,
): (id: string) => Record<string, unknown> {
  return (id: string) => ({ id, _deleted: true, objectType });
}

function bucketFathom(
  records: readonly Record<string, unknown>[],
  model: string,
): FathomBuckets {
  const normalized = model.trim().toLowerCase();
  const mapped = mapToBucket(records, basicTombstone);

  switch (normalized) {
    case "fathommeeting":
    case "meeting":
      return { meetings: mapped };
    case "fathomrecordingsummary":
    case "recordingsummary":
    case "recording-summary":
      return { recordingSummaries: mapped };
    case "fathomrecordingtranscript":
    case "recordingtranscript":
    case "recording-transcript":
      return { recordingTranscripts: mapped };
    case "fathomteam":
    case "team":
      return { teams: mapped };
    case "fathomteammember":
    case "teammember":
    case "team-member":
      return { teamMembers: mapped };
    default:
      return {};
  }
}

function bucketDropbox(
  records: readonly Record<string, unknown>[],
  model: string,
): DropboxBuckets {
  const normalized = model.trim().toLowerCase();
  const mapped = mapDropboxRecords(records);

  switch (normalized) {
    case "dropboxfile":
    case "file":
      return { files: mapped };
    case "dropboxfolder":
    case "folder":
      return { folders: mapped };
    case "dropboxsharedfolder":
    case "sharedfolder":
    case "shared-folder":
      return { sharedFolders: mapped };
    case "dropboxsharedlink":
    case "sharedlink":
    case "shared-link":
      return { sharedLinks: mapped };
    default:
      return {};
  }
}

function bucketReddit(
  records: readonly Record<string, unknown>[],
  model: string,
): RedditBuckets {
  const type = safeNormalize(normalizeNangoRedditModel, model);
  if (type === "subreddit") {
    return {
      subreddits: mapToBucket(records, (id) => ({ id, _deleted: true, objectType: "subreddit" })),
    };
  }
  if (type === "post") {
    return {
      posts: mapToBucket(records, (id) => ({ id, _deleted: true, objectType: "post" })),
    };
  }
  return {};
}

function bucketDaytona(
  records: readonly Record<string, unknown>[],
  model: string,
): DaytonaBuckets {
  const type = safeNormalize(normalizeNangoDaytonaModel, model);
  if (type === "usage") {
    return { usage: mapToBucket(records, basicTombstone) };
  }
  return {};
}

function mapDropboxRecords(
  records: readonly Record<string, unknown>[],
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const raw of records) {
    if (!isDeletedNangoRecord(raw)) {
      out.push(clean(raw));
      continue;
    }
    const cleaned = clean(raw);
    const id = readId(cleaned, "id");
    if (!id) {
      continue;
    }
    const tombstone: Record<string, unknown> = { id, _deleted: true };
    const pathLower = readString(cleaned, "path_lower");
    const dropboxId = readString(cleaned, "dropbox_id");
    if (pathLower) tombstone.path_lower = pathLower;
    if (dropboxId) tombstone.dropbox_id = dropboxId;
    out.push(tombstone);
  }
  return out;
}

/**
 * Generic map for buckets that don't need extra scoping fields on tombstones.
 * Confluence/Linear/Jira/Notion all use `{ id, _deleted: true }` for deletes
 * and don't carry extra scope fields. Slack and GitHub override this.
 */
function mapToBucket(
  records: readonly Record<string, unknown>[],
  buildTombstone: (id: string) => Record<string, unknown>,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const raw of records) {
    if (isDeletedNangoRecord(raw)) {
      const id = readId(raw, "id");
      if (!id) continue;
      out.push(buildTombstone(id));
      continue;
    }
    out.push(clean(raw));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public entry point.
// ---------------------------------------------------------------------------

export function bucketByModel(
  records: readonly unknown[],
  model: string,
  provider: string,
): ProviderBuckets {
  const objects = records.filter(isObject);
  const p = provider.trim().toLowerCase();

  if (p === "confluence") {
    return { provider: "confluence", buckets: bucketConfluence(objects, model) };
  }
  if (p === "linear") {
    return { provider: "linear", buckets: bucketLinear(objects, model) };
  }
  if (p === "jira") {
    return { provider: "jira", buckets: bucketJira(objects, model) };
  }
  if (p === "notion") {
    return { provider: "notion", buckets: bucketNotion(objects, model) };
  }
  if (p === "hubspot") {
    return { provider: "hubspot", buckets: bucketHubSpot(objects, model) };
  }
  if (p === "github") {
    return { provider: "github", buckets: bucketGitHub(objects, model) };
  }
  if (p === "gitlab") {
    return { provider: "gitlab", buckets: bucketGitLab(objects, model) };
  }
  if (p === "x" || p === "twitter") {
    return { provider: "x", buckets: bucketX(objects, model) };
  }
  if (p === "slack" || p.startsWith("slack-")) {
    return { provider: "slack", buckets: bucketSlack(objects, model) };
  }
  if (p === "google-mail" || p === "google-mail-relay") {
    return { provider: "google-mail", buckets: bucketGoogleMail(objects, model) };
  }
  if (p === "google-calendar" || p === "google-calendar-relay") {
    return {
      provider: "google-calendar",
      buckets: bucketGoogleCalendar(objects, model),
    };
  }
  if (p === "granola" || p === "granola-relay") {
    return {
      provider: "granola",
      buckets: bucketGranola(objects, model),
    };
  }
  if (p === "recall" || p === "recall-relay") {
    return {
      provider: "recall",
      buckets: bucketRecall(objects, model),
    };
  }
  if (p === "fathom" || p === "fathom-relay" || p === "fathom-oauth") {
    return {
      provider: "fathom",
      buckets: bucketFathom(objects, model),
    };
  }
  if (
    p === "docker-hub" ||
    p === "docker-hub-composio-relay" ||
    p === "docker_hub-composio-relay"
  ) {
    return {
      provider: "docker-hub",
      buckets: bucketDockerHub(objects, model),
    };
  }
  if (p === "reddit" || p === "reddit-composio-relay") {
    return {
      provider: "reddit",
      buckets: bucketReddit(objects, model),
    };
  }
  if (p === "dropbox" || p === "dropbox-relay") {
    return {
      provider: "dropbox",
      buckets: bucketDropbox(objects, model),
    };
  }
  if (p === "daytona") {
    return {
      provider: "daytona",
      buckets: bucketDaytona(objects, model),
    };
  }
  // Unknown provider, return an empty bucket without claiming a known
  // provider so downstream dispatch stays a benign no-op.
  return { provider: "unknown", buckets: {} };
}
