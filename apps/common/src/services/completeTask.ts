import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { BusinessRequest } from "@insurance-poc/utils";
import {
  getDrsTaskIds,
  getSessionUser,
  hasDrsTaskIds,
  isApiFailureBody,
  readApiErrorMessage,
  readApiMessageFromBody,
  toCustomQueryError,
  useMock,
} from "@insurance-poc/utils";
import completeTaskMock from "./mock/completeTask.json";

export type CompleteTaskRequestContext = {
  appNo: string;
  userId: string;
  taskId: string;
  instanceId: string;
  decision: string;
  remarks: string;
};

export type CompleteTaskRequestBody = {
  requestContext: CompleteTaskRequestContext;
};

export type CompleteTaskInput = {
  appNo: string;
  decision: string;
  remarks: string;
};

export type CompleteTaskResult = {
  message: string;
};

export type CompleteTaskBaseQuery = (
  args: string | BusinessRequest,
) => Promise<{ data: unknown } | { error: FetchBaseQueryError }>;

function customError(message: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: message };
}

export function buildCompleteTaskRequestBody(
  context: CompleteTaskRequestContext,
): CompleteTaskRequestBody {
  return { requestContext: context };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCompleteTaskSuccessMessage(value: unknown): string {
  const message = readApiMessageFromBody(value);
  if (message.length > 0) return message;
  if (isRecord(value) && isRecord(value.data)) {
    return readApiMessageFromBody(value.data);
  }
  return "";
}

export function resolveCompleteTaskContext(
  input: CompleteTaskInput,
): CompleteTaskRequestContext | { error: string } {
  const appNo = input.appNo.trim();
  if (appNo.length === 0) {
    return { error: "Application number is required to complete the task." };
  }
  const userId = getSessionUser()?.username?.trim() ?? "";
  if (userId.length === 0) {
    return { error: "Sign in before completing the task." };
  }
  if (!hasDrsTaskIds()) {
    return { error: "Task details are missing. Open the case from the inbox and try again." };
  }
  const { taskId, instanceId } = getDrsTaskIds();
  const decision = input.decision.trim();
  const remarks = input.remarks.trim();
  if (decision.length === 0) {
    return { error: "Select a decision before submitting." };
  }
  return {
    appNo,
    userId,
    taskId,
    instanceId,
    decision,
    remarks,
  };
}

export async function mutateCompleteTask(
  baseQuery: CompleteTaskBaseQuery,
  completeTaskUrl: string,
  input: CompleteTaskInput,
): Promise<{ data: CompleteTaskResult } | { error: FetchBaseQueryError }> {
  const resolved = resolveCompleteTaskContext(input);
  if ("error" in resolved) {
    return { error: customError(resolved.error) };
  }

  if (useMock) {
    return { data: { message: completeTaskMock.success.message } };
  }

  if (completeTaskUrl.length === 0) {
    return { error: customError("Complete task API is not configured.") };
  }

  const result = await baseQuery({
    url: completeTaskUrl,
    method: "POST",
    body: buildCompleteTaskRequestBody(resolved),
    headers: { accept: "*/*", "Content-Type": "application/json" },
    encryptRequest: false,
    decryptResponse: false,
  });

  if ("error" in result) {
    return { error: toCustomQueryError(result.error) };
  }

  if (isApiFailureBody(result.data)) {
    return { error: customError(readApiErrorMessage(result.data)) };
  }

  const successMessage = readCompleteTaskSuccessMessage(result.data);
  return { data: { message: successMessage.length > 0 ? successMessage : "Task completed successfully." } };
}
