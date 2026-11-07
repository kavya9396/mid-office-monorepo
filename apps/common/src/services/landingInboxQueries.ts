import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { BusinessRequest } from "@insurance-poc/utils";
import { getSessionUser, isFirstLoginChangePending, useMock } from "@insurance-poc/utils";
import {
  parsePoolColumnsResponse,
  rememberPoolColumns,
  storedPoolColumns,
  type InboxData,
} from "../modules/inbox/inboxApi";

export type LandingInboxScope = "retail" | "group";

/** RTK base query from `createBusinessBaseQuery` (minimal surface for type safety). */
export type LandingBaseQuery = (
  args: string | BusinessRequest,
) => Promise<{ data: unknown } | { error: FetchBaseQueryError }>;

function customError(message: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: message };
}

export type RoleListQueryConfig = {
  roleListUrl: string;
  mapInboxPayload: (value: unknown) => InboxData;
  mockData: InboxData;
  businessLabel: string;
};

export async function queryLandingRoleList(
  baseQuery: LandingBaseQuery,
  config: RoleListQueryConfig,
): Promise<{ data: InboxData } | { error: FetchBaseQueryError }> {
  if (useMock) {
    return { data: config.mapInboxPayload(config.mockData) };
  }
  if (config.roleListUrl.length === 0) {
    return {
      error: customError(`Landing role-list URL is not configured for ${config.businessLabel}.`),
    };
  }
  if (isFirstLoginChangePending()) {
    return {
      error: customError(`Change your password before loading the ${config.businessLabel} inbox.`),
    };
  }
  const username = getSessionUser()?.username?.trim() ?? "";
  if (username.length === 0) {
    return { error: customError(`Sign in before loading the ${config.businessLabel} inbox.`) };
  }

  const result = await baseQuery({
    url: config.roleListUrl,
    method: "POST",
    body: {},
    headers: { accept: "*/*", "Content-Type": "application/json" },
    encryptRequest: false,
    decryptResponse: false,
  });
  if ("error" in result) return result;

  try {
    return { data: config.mapInboxPayload(result.data) };
  } catch (reason: unknown) {
    const message =
      reason instanceof Error ? reason.message : `Unable to load the ${config.businessLabel} inbox.`;
    return { error: customError(message) };
  }
}

export type PoolColumnsQueryConfig = {
  scope: LandingInboxScope;
  poolColumnsUrl: string;
};

export async function queryLandingPoolColumns(
  poolKey: string,
  baseQuery: LandingBaseQuery,
  config: PoolColumnsQueryConfig,
): Promise<{ data: string[] } | { error: FetchBaseQueryError }> {
  if (config.poolColumnsUrl.length === 0) {
    return { error: customError("Pool columns API is not configured.") };
  }
  const username = getSessionUser()?.username?.trim() ?? "";
  if (username.length === 0) {
    return { error: customError("Sign in before loading column configuration.") };
  }
  const result = await baseQuery({
    url: config.poolColumnsUrl,
    method: "GET",
    params: { username, poolKey },
    encryptRequest: false,
    decryptResponse: false,
  });
  if ("error" in result) return result;
  const parsed = parsePoolColumnsResponse(result.data);
  const fields = storedPoolColumns(config.scope, poolKey, {
    username: parsed.username,
    poolKey: parsed.poolKey,
    selectedFields: parsed.selectedFields,
  });
  return { data: fields };
}

export type SavePoolColumnsConfig = {
  scope: LandingInboxScope;
  poolColumnsUrl: string;
  poolColumnsSaveUrl: string;
};

export async function mutateLandingSavePoolColumns(
  request: { poolKey: string; selectedFields: string[] },
  baseQuery: LandingBaseQuery,
  config: SavePoolColumnsConfig,
): Promise<{ data: string[] } | { error: FetchBaseQueryError }> {
  if (config.poolColumnsSaveUrl.length === 0 || config.poolColumnsUrl.length === 0) {
    return {
      error: customError("Pool columns save or fetch API is not configured."),
    };
  }
  const username = getSessionUser()?.username?.trim() ?? "";
  if (username.length === 0) {
    return { error: customError("Sign in before saving column configuration.") };
  }
  const saved = await baseQuery({
    url: config.poolColumnsSaveUrl,
    method: "POST",
    body: { username, poolKey: request.poolKey, selectedFields: request.selectedFields },
    headers: { accept: "*/*", "Content-Type": "application/json" },
    encryptRequest: false,
    decryptResponse: false,
  });
  if ("error" in saved) return saved;
  const fetched = await baseQuery({
    url: config.poolColumnsUrl,
    method: "GET",
    params: { username, poolKey: request.poolKey },
    encryptRequest: false,
    decryptResponse: false,
  });
  if ("error" in fetched) return fetched;
  const parsed = parsePoolColumnsResponse(fetched.data);
  const fields = storedPoolColumns(config.scope, request.poolKey, {
    username: parsed.username,
    poolKey: parsed.poolKey,
    selectedFields: parsed.selectedFields,
  });
  return { data: fields.length > 0 ? fields : request.selectedFields };
}

export type MockPoolColumnsConfig = {
  scope: LandingInboxScope;
  columnConfigFetchMock: unknown;
  columnConfigSaveMock: { success?: boolean; message?: string };
};

export function mockFetchPoolColumns(poolKey: string, config: MockPoolColumnsConfig): { data: string[] } {
  return { data: storedPoolColumns(config.scope, poolKey, config.columnConfigFetchMock) };
}

export function mockSavePoolColumns(
  request: { poolKey: string; selectedFields: string[] },
  config: MockPoolColumnsConfig,
): { data: string[] } | { error: FetchBaseQueryError } {
  if (config.columnConfigSaveMock.success === false) {
    return {
      error: customError(config.columnConfigSaveMock.message || "Unable to save columns."),
    };
  }
  rememberPoolColumns(config.scope, request.poolKey, request.selectedFields);
  return { data: storedPoolColumns(config.scope, request.poolKey, config.columnConfigFetchMock) };
}
