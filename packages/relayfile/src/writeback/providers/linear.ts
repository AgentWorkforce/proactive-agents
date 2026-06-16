import {
  resolveDeleteRequest as resolveLinearDeleteRequest,
  resolveWritebackRequest as resolveLinearWritebackRequest,
} from "@relayfile/adapter-linear/writeback";
import type { LinearWritebackRequest } from "@relayfile/adapter-linear/types";
import { nangoProxy } from "../nango.js";
import type {
  DispatchMetadata,
  DispatchResult,
  IntegrationCredential,
  ProviderDispatchOptions,
  WritebackEnv,
  WritebackInput,
} from "../types.js";
import {
  extractExternalId,
  isRecord,
  isRetryableStatus,
  permanentFailure,
  readMessageFromPayload,
  retryableFailure,
  success,
} from "./common.js";

export async function dispatch(
  input: WritebackInput,
  cred: IntegrationCredential,
  env: WritebackEnv,
  options: ProviderDispatchOptions = {},
): Promise<DispatchResult> {
  let request: LinearWritebackRequest;
  try {
    request =
      input.action === "file_delete"
        ? resolveLinearDeleteRequest(input.path)
        : resolveLinearWritebackRequest(input.path, input.content);
  } catch (error) {
    return permanentFailure(error, { provider: "linear" });
  }

  const metadata: DispatchMetadata = {
    provider: "linear",
    action: request.action,
    method: request.method,
    endpoint: request.endpoint,
  };

  try {
    const response = await nangoProxy<Record<string, unknown>>(
      cred,
      {
        method: request.method,
        endpoint: request.endpoint,
        data: request.body,
      },
      env,
      options,
    );
    const externalId = extractLinearExternalId(response.data, request.action);
    const linearErrors = extractLinearGraphQLErrors(response.data);
    const mutationOutcome = extractLinearMutationOutcome(
      response.data,
      request.action,
    );
    const responseMetadata = {
      ...metadata,
      status: response.status,
      ...(externalId ? { externalId } : {}),
    };
    if (response.ok && !linearErrors && mutationOutcome.success !== false) {
      return success(responseMetadata, externalId);
    }
    const message =
      linearErrors ??
      mutationOutcome.message ??
      readMessageFromPayload(
        response.data,
        `Linear writeback failed with status ${response.status}`,
      );
    return isRetryableStatus(response.status)
      ? retryableFailure(message, responseMetadata)
      : permanentFailure(message, responseMetadata);
  } catch (error) {
    return retryableFailure(error, metadata);
  }
}

function extractLinearExternalId(
  payload: unknown,
  action: LinearWritebackRequest["action"],
): string | undefined {
  if (!isRecord(payload)) return undefined;
  const data = payload.data;
  if (!isRecord(data)) return extractExternalId(payload);
  const mutationKey = linearMutationKey(action);
  if (!mutationKey) return extractExternalId(payload);
  const mutation = data[mutationKey];
  if (!isRecord(mutation)) return undefined;
  const target =
    action === "create_comment"
      ? mutation.comment
      : action === "create_agent_activity"
        ? mutation.agentActivity
        : mutation.issue;
  return extractExternalId(target);
}

function extractLinearMutationOutcome(
  payload: unknown,
  action: LinearWritebackRequest["action"],
): { success: boolean | undefined; message: string | undefined } {
  if (!isRecord(payload)) return { success: undefined, message: undefined };
  const data = payload.data;
  if (!isRecord(data)) return { success: undefined, message: undefined };
  const mutationKey = linearMutationKey(action);
  if (!mutationKey) return { success: undefined, message: undefined };
  const mutation = data[mutationKey];
  if (!isRecord(mutation)) return { success: undefined, message: undefined };
  const success =
    typeof mutation.success === "boolean" ? mutation.success : undefined;
  return {
    success,
    message:
      success === false
        ? `Linear ${mutationKey} returned success: false`
        : undefined,
  };
}

function linearMutationKey(action: LinearWritebackRequest["action"]): string | undefined {
  switch (action) {
    case "create_agent_activity":
      return "agentActivityCreate";
    case "create_comment":
      return "commentCreate";
    case "create_issue":
      return "issueCreate";
    case "delete_issue":
      return "issueDelete";
    case "update_issue":
      return "issueUpdate";
    default:
      return undefined;
  }
}

function extractLinearGraphQLErrors(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const errors = payload.errors;
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  const messages = errors
    .map((entry) =>
      isRecord(entry) && typeof entry.message === "string"
        ? entry.message
        : null,
    )
    .filter((entry): entry is string => Boolean(entry));
  return messages.length > 0 ? messages.join("; ") : undefined;
}
