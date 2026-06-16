import type {
  GeneratedNangoProviderModel,
  GeneratedNangoProviderModelEntry,
} from "./nango-provider-registry.generated.js";
import { GENERATED_NANGO_PROVIDER_MODEL_REGISTRY } from "./nango-provider-registry.generated.js";

export type NangoProviderParityClassification =
  | "enabled"
  | "deferred"
  | "smoke-deferred";

export type NangoProviderParityEntry = GeneratedNangoProviderModelEntry & {
  enabled: boolean;
  classification: NangoProviderParityClassification;
  reason: string;
};

export const REPO_DECLARED_NANGO_PROVIDER_MODELS = [
  { key: "github-relay:fetch-repos:Repo", provider: "github-relay", sync: "fetch-repos", model: "Repo", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "github-relay:fetch-open-prs:PullRequest", provider: "github-relay", sync: "fetch-open-prs", model: "PullRequest", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "github-relay:fetch-open-issues:Issue", provider: "github-relay", sync: "fetch-open-issues", model: "Issue", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "slack-relay:fetch-channel-history:SlackMessage", provider: "slack-relay", sync: "fetch-channel-history", model: "SlackMessage", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "slack-relay:fetch-users:SlackUser", provider: "slack-relay", sync: "fetch-users", model: "SlackUser", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "slack-relay:fetch-channels:SlackChannel", provider: "slack-relay", sync: "fetch-channels", model: "SlackChannel", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "notion-relay:fetch-pages:NotionPage", provider: "notion-relay", sync: "fetch-pages", model: "NotionPage", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "notion-relay:fetch-pages:NotionPageContent", provider: "notion-relay", sync: "fetch-pages", model: "NotionPageContent", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "notion-relay:fetch-databases:NotionDatabase", provider: "notion-relay", sync: "fetch-databases", model: "NotionDatabase", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "notion-relay:fetch-users:NotionUser", provider: "notion-relay", sync: "fetch-users", model: "NotionUser", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-active-issues:LinearIssue", provider: "linear-relay", sync: "fetch-active-issues", model: "LinearIssue", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-comments:LinearComment", provider: "linear-relay", sync: "fetch-comments", model: "LinearComment", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-users:LinearUser", provider: "linear-relay", sync: "fetch-users", model: "LinearUser", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-teams:LinearTeam", provider: "linear-relay", sync: "fetch-teams", model: "LinearTeam", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-projects:LinearProject", provider: "linear-relay", sync: "fetch-projects", model: "LinearProject", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-milestones:LinearMilestone", provider: "linear-relay", sync: "fetch-milestones", model: "LinearMilestone", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-roadmaps:LinearRoadmap", provider: "linear-relay", sync: "fetch-roadmaps", model: "LinearRoadmap", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:fetch-cycles:LinearCycle", provider: "linear-relay", sync: "fetch-cycles", model: "LinearCycle", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "linear-relay:states:LinearState", provider: "linear-relay", sync: "states", model: "LinearState", enabled: true, classification: "enabled", reason: "adapter-linear@0.3.14 added state path mapping and emit support" },
  { key: "confluence-relay:fetch-spaces:ConfluenceSpace", provider: "confluence-relay", sync: "fetch-spaces", model: "ConfluenceSpace", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "confluence-relay:fetch-pages:ConfluencePage", provider: "confluence-relay", sync: "fetch-pages", model: "ConfluencePage", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "jira-relay:fetch-projects:JiraProject", provider: "jira-relay", sync: "fetch-projects", model: "JiraProject", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "jira-relay:fetch-issues:JiraIssue", provider: "jira-relay", sync: "fetch-issues", model: "JiraIssue", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "jira-relay:fetch-sprints:JiraSprint", provider: "jira-relay", sync: "fetch-sprints", model: "JiraSprint", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-projects:GitLabProject", provider: "gitlab-relay", sync: "fetch-projects", model: "GitLabProject", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-merge-requests:GitLabMergeRequest", provider: "gitlab-relay", sync: "fetch-merge-requests", model: "GitLabMergeRequest", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-issues:GitLabIssue", provider: "gitlab-relay", sync: "fetch-issues", model: "GitLabIssue", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-commits:GitLabCommit", provider: "gitlab-relay", sync: "fetch-commits", model: "GitLabCommit", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-pipelines:GitLabPipeline", provider: "gitlab-relay", sync: "fetch-pipelines", model: "GitLabPipeline", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-pipelines:GitLabPipelineJob", provider: "gitlab-relay", sync: "fetch-pipelines", model: "GitLabPipelineJob", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-deployments:GitLabDeployment", provider: "gitlab-relay", sync: "fetch-deployments", model: "GitLabDeployment", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "gitlab-relay:fetch-tags:GitLabTag", provider: "gitlab-relay", sync: "fetch-tags", model: "GitLabTag", enabled: true, classification: "smoke-deferred", reason: "Tier-2 smoke parity proof pending enable PR" },
  { key: "x-relay:fetch-searches:XSearchBundle", provider: "x-relay", sync: "fetch-searches", model: "XSearchBundle", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-mail-relay:fetch-labels:GoogleMailLabel", provider: "google-mail-relay", sync: "fetch-labels", model: "GoogleMailLabel", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-mail-relay:fetch-filters:GoogleMailFilter", provider: "google-mail-relay", sync: "fetch-filters", model: "GoogleMailFilter", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-mail-relay:fetch-send-as-aliases:GoogleMailSendAsAlias", provider: "google-mail-relay", sync: "fetch-send-as-aliases", model: "GoogleMailSendAsAlias", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-mail-relay:fetch-messages:GoogleMailMessage", provider: "google-mail-relay", sync: "fetch-messages", model: "GoogleMailMessage", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-mail-relay:fetch-threads:GoogleMailThread", provider: "google-mail-relay", sync: "fetch-threads", model: "GoogleMailThread", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-mail-relay:renew-watch:GoogleMailWatchRenewal", provider: "google-mail-relay", sync: "renew-watch", model: "GoogleMailWatchRenewal", enabled: true, classification: "enabled", reason: "Housekeeping watch-renewal sync consciously deferred until non-record sync semantics are parity-proven" },
  { key: "google-calendar-relay:fetch-calendars:GoogleCalendar", provider: "google-calendar-relay", sync: "fetch-calendars", model: "GoogleCalendar", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-calendar-relay:fetch-events:GoogleCalendarEvent", provider: "google-calendar-relay", sync: "fetch-events", model: "GoogleCalendarEvent", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-calendar-relay:fetch-settings:GoogleCalendarSetting", provider: "google-calendar-relay", sync: "fetch-settings", model: "GoogleCalendarSetting", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-calendar-relay:fetch-acls:GoogleCalendarAcl", provider: "google-calendar-relay", sync: "fetch-acls", model: "GoogleCalendarAcl", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-calendar-relay:fetch-colors:GoogleCalendarColor", provider: "google-calendar-relay", sync: "fetch-colors", model: "GoogleCalendarColor", enabled: true, classification: "enabled", reason: "B1 provider parity proof pending" },
  { key: "google-calendar-relay:renew-watch:GoogleCalendarWatchRenewal", provider: "google-calendar-relay", sync: "renew-watch", model: "GoogleCalendarWatchRenewal", enabled: true, classification: "enabled", reason: "Housekeeping watch-renewal sync consciously deferred until non-record sync semantics are parity-proven" },
  { key: "granola-relay:fetch-notes:GranolaNote", provider: "granola-relay", sync: "fetch-notes", model: "GranolaNote", enabled: true, classification: "enabled", reason: "Granola notes have Relayfile adapter resources and record-writer coverage" },
  { key: "granola-relay:fetch-folders:GranolaFolder", provider: "granola-relay", sync: "fetch-folders", model: "GranolaFolder", enabled: true, classification: "enabled", reason: "Granola folders have Relayfile adapter resources and record-writer coverage" },
  { key: "recall-relay:fetch-recordings:RecallRecording", provider: "recall-relay", sync: "fetch-recordings", model: "RecallRecording", enabled: true, classification: "enabled", reason: "Recall recordings materialize to /recall/recordings/{id}.json for meeting-actions" },
  { key: "recall-relay:fetch-transcripts:RecallTranscript", provider: "recall-relay", sync: "fetch-transcripts", model: "RecallTranscript", enabled: true, classification: "enabled", reason: "Recall transcript payloads share the recording path and carry transcript_text" },
  { key: "daytona-relay:fetch-usage:DaytonaUsage", provider: "daytona-relay", sync: "fetch-usage", model: "DaytonaUsage", enabled: false, classification: "deferred", reason: "Daytona usage is a FinOps poll record with no Relayfile adapter resource yet" },
  { key: "hubspot-relay:fetch-companies:Company", provider: "hubspot-relay", sync: "fetch-companies", model: "Company", enabled: true, classification: "smoke-deferred", reason: "HubSpot CRM writable object parity proof pending enable PR" },
  { key: "hubspot-relay:fetch-contacts:Contact", provider: "hubspot-relay", sync: "fetch-contacts", model: "Contact", enabled: true, classification: "smoke-deferred", reason: "HubSpot CRM writable object parity proof pending enable PR" },
  { key: "hubspot-relay:fetch-deals:Deal", provider: "hubspot-relay", sync: "fetch-deals", model: "Deal", enabled: true, classification: "smoke-deferred", reason: "HubSpot CRM writable object parity proof pending enable PR" },
  { key: "hubspot-relay:fetch-orders:Order", provider: "hubspot-relay", sync: "fetch-orders", model: "Order", enabled: false, classification: "deferred", reason: "HubSpot orders have no Relayfile adapter resource yet" },
  { key: "hubspot-relay:fetch-products:Product", provider: "hubspot-relay", sync: "fetch-products", model: "Product", enabled: false, classification: "deferred", reason: "HubSpot products have no Relayfile adapter resource yet" },
  { key: "hubspot-relay:fetch-users:User", provider: "hubspot-relay", sync: "fetch-users", model: "User", enabled: false, classification: "deferred", reason: "HubSpot users have no Relayfile adapter resource yet" },
  { key: "hubspot-relay:fetch-tickets:Ticket", provider: "hubspot-relay", sync: "fetch-tickets", model: "Ticket", enabled: true, classification: "smoke-deferred", reason: "HubSpot CRM writable object parity proof pending enable PR" },
  { key: "docker_hub-composio-relay:fetch-repositories:DockerHubRepository", provider: "docker_hub-composio-relay", sync: "fetch-repositories", model: "DockerHubRepository", enabled: true, classification: "enabled", reason: "Docker Hub repositories have Relayfile materialization, discovery, and index coverage" },
  { key: "docker_hub-composio-relay:fetch-tags:DockerHubTag", provider: "docker_hub-composio-relay", sync: "fetch-tags", model: "DockerHubTag", enabled: true, classification: "enabled", reason: "Docker Hub tags have Relayfile materialization, discovery, and index coverage" },
  { key: "docker_hub-composio-relay:fetch-webhooks:DockerHubWebhook", provider: "docker_hub-composio-relay", sync: "fetch-webhooks", model: "DockerHubWebhook", enabled: true, classification: "enabled", reason: "Docker Hub webhooks have Relayfile materialization, discovery, and index coverage" },
  { key: "reddit-composio-relay:fetch-subreddits:RedditTrackedSubreddit", provider: "reddit-composio-relay", sync: "fetch-subreddits", model: "RedditTrackedSubreddit", enabled: true, classification: "enabled", reason: "Reddit tracked subreddits are materialized with Relayfile canonical paths, by-id aliases, and discovery schema coverage" },
  { key: "reddit-composio-relay:fetch-posts:RedditPost", provider: "reddit-composio-relay", sync: "fetch-posts", model: "RedditPost", enabled: true, classification: "enabled", reason: "Reddit posts are materialized with terminal-state preservation, status aliases, and digest visibility through Relayfile adapter coverage" },
  { key: "reddit-composio-relay:fetch-hot-posts:RedditHotPost", provider: "reddit-composio-relay", sync: "fetch-hot-posts", model: "RedditHotPost", enabled: true, classification: "enabled", reason: "Reddit hot listing posts are materialized with the same Relayfile canonical mapping and digest coverage as base Reddit posts" },
  { key: "reddit-composio-relay:fetch-rising-posts:RedditRisingPost", provider: "reddit-composio-relay", sync: "fetch-rising-posts", model: "RedditRisingPost", enabled: true, classification: "enabled", reason: "Reddit rising listing posts are materialized with the same Relayfile canonical mapping and digest coverage as base Reddit posts" },
  { key: "reddit-composio-relay:fetch-top-posts:RedditTopPost", provider: "reddit-composio-relay", sync: "fetch-top-posts", model: "RedditTopPost", enabled: true, classification: "enabled", reason: "Reddit top listing posts are materialized with the same Relayfile canonical mapping and digest coverage as base Reddit posts" },
  { key: "reddit-composio-relay:fetch-best-posts:RedditBestPost", provider: "reddit-composio-relay", sync: "fetch-best-posts", model: "RedditBestPost", enabled: true, classification: "enabled", reason: "Reddit best listing posts are materialized with the same Relayfile canonical mapping and digest coverage as base Reddit posts" },
  { key: "dropbox-relay:fetch-files:DropboxFile", provider: "dropbox-relay", sync: "fetch-files", model: "DropboxFile", enabled: true, classification: "enabled", reason: "Dropbox file metadata records are materialized with auxiliary aliases, discovery schemas, and digest coverage" },
  { key: "dropbox-relay:fetch-folders:DropboxFolder", provider: "dropbox-relay", sync: "fetch-folders", model: "DropboxFolder", enabled: true, classification: "enabled", reason: "Dropbox folder metadata records are materialized with auxiliary aliases, discovery schemas, and digest coverage" },
  { key: "dropbox-relay:fetch-shared-folders:DropboxSharedFolder", provider: "dropbox-relay", sync: "fetch-shared-folders", model: "DropboxSharedFolder", enabled: true, classification: "enabled", reason: "Dropbox shared-folder metadata is materialized with discovery sampling and digest visibility" },
  { key: "dropbox-relay:fetch-shared-links:DropboxSharedLink", provider: "dropbox-relay", sync: "fetch-shared-links", model: "DropboxSharedLink", enabled: true, classification: "enabled", reason: "Dropbox shared-link metadata is materialized with by-id aliases, discovery schemas, and digest visibility" },
  { key: "fathom-relay:fetch-meetings:FathomMeeting", provider: "fathom-relay", sync: "fetch-meetings", model: "FathomMeeting", enabled: true, classification: "enabled", reason: "Fathom meetings are materialized to Relayfile with adapter discovery and digest coverage" },
  { key: "fathom-relay:fetch-recording-summaries:FathomRecordingSummary", provider: "fathom-relay", sync: "fetch-recording-summaries", model: "FathomRecordingSummary", enabled: true, classification: "enabled", reason: "Fathom recording summaries are materialized to Relayfile with adapter discovery and digest coverage" },
  { key: "fathom-relay:fetch-recording-transcripts:FathomRecordingTranscript", provider: "fathom-relay", sync: "fetch-recording-transcripts", model: "FathomRecordingTranscript", enabled: true, classification: "enabled", reason: "Fathom recording transcripts are materialized to Relayfile with adapter discovery and digest coverage" },
  { key: "fathom-relay:fetch-teams:FathomTeam", provider: "fathom-relay", sync: "fetch-teams", model: "FathomTeam", enabled: true, classification: "enabled", reason: "Fathom teams are materialized to Relayfile with adapter discovery and digest coverage" },
  { key: "fathom-relay:fetch-team-members:FathomTeamMember", provider: "fathom-relay", sync: "fetch-team-members", model: "FathomTeamMember", enabled: true, classification: "enabled", reason: "Fathom team members are materialized to Relayfile with adapter discovery and digest coverage" },
] as const satisfies readonly NangoProviderParityEntry[];

export type RepoDeclaredNangoProviderModel =
  (typeof REPO_DECLARED_NANGO_PROVIDER_MODELS)[number]["key"];

export const ENABLED_NANGO_PROVIDER_MODEL_KEYS = new Set<GeneratedNangoProviderModel>(
  REPO_DECLARED_NANGO_PROVIDER_MODELS
    .filter((entry) => entry.enabled)
    .map((entry) => entry.key),
);

export const GENERATED_NANGO_PROVIDER_MODEL_KEYS = new Set<GeneratedNangoProviderModel>(
  GENERATED_NANGO_PROVIDER_MODEL_REGISTRY.map((entry) => entry.key),
);

export function nangoProviderModelKey(input: {
  providerConfigKey: string;
  syncName: string;
  model: string;
}): GeneratedNangoProviderModel {
  return `${input.providerConfigKey}:${input.syncName}:${input.model}` as GeneratedNangoProviderModel;
}

export function isGeneratedNangoProviderModel(input: {
  providerConfigKey: string;
  syncName: string;
  model: string;
}): boolean {
  return GENERATED_NANGO_PROVIDER_MODEL_KEYS.has(nangoProviderModelKey(input));
}

export function enabledGeneratedNangoProviderModelsForProviderConfigKey(
  providerConfigKey: string | null | undefined,
): readonly NangoProviderParityEntry[] {
  const provider = providerConfigKey?.trim();
  if (!provider) {
    return [];
  }
  const declaredByKey = new Map(
    REPO_DECLARED_NANGO_PROVIDER_MODELS.map((entry) => [entry.key, entry]),
  );
  return GENERATED_NANGO_PROVIDER_MODEL_REGISTRY.flatMap((entry) => {
    if (entry.provider !== provider) {
      return [];
    }
    const declared = declaredByKey.get(entry.key);
    return declared?.enabled ? [declared] : [];
  });
}
