import type { Bindings } from "../env.js";

export type WritebackProvider =
  | "confluence"
  | "github"
  | "google-mail"
  | "jira"
  | "linear"
  | "notion"
  | "slack";

export type WritebackInput = {
  opId: string;
  workspaceId: string;
  path: string;
  revision: string;
  correlationId: string;
  action: "file_upsert" | "file_delete";
  content: string;
  contentType?: string;
  encoding?: string;
  provider: WritebackProvider;
};

export type IntegrationCredential = {
  provider: WritebackProvider;
  providerConfigKey: string;
  connectionId: string;
  aliasFields: Record<string, unknown>;
  writebackDispatchVia: "bridge" | "cf";
  updatedAt: string;
};

export type DispatchMetadata = {
  provider: WritebackProvider;
  action?: string;
  method?: string;
  endpoint?: string;
  status?: number;
  externalId?: string;
  slackError?: string;
  idempotencyKey?: string;
  idempotencyDuplicate?: boolean;
};

export type DispatchResult =
  | {
      outcome: "success";
      providerObjectId?: string;
      metadata?: DispatchMetadata;
    }
  | {
      outcome: "retryable_failure";
      error: string;
      metadata?: DispatchMetadata;
    }
  | {
      outcome: "permanent_failure";
      error: string;
      metadata?: DispatchMetadata;
    };

export type WritebackEnv = Pick<
  Bindings,
  "NANGO_SECRET_KEY" | "NANGO_BASE_URL" | "AUDIT_QUEUE"
> &
  Pick<
    Partial<Bindings>,
    "DB" | "RELAYFILE_SLACK_WRITEBACK_IDEMPOTENCY_TTL_SECONDS"
  >;

export type ProviderDispatchOptions = {
  fetchImpl?: typeof fetch;
};
