import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBusinessBaseQuery, getSessionUser, useMock } from "@insurance-poc/utils";
import groupInboxMock from "../modules/inbox/mock/groupInbox.json";
import { rememberPoolColumns, storedPoolColumns, type InboxData } from "@insurance-poc/common/inbox";
import groupColumnConfigFetchMock from "../modules/inbox/mock/columnConfigFetch.json";
import groupColumnConfigSaveMock from "../modules/inbox/mock/columnConfigSave.json";
import {
  createGroupRoleListRequest,
  GROUP_POOL_COLUMNS_PATH,
  GROUP_POOL_COLUMNS_SAVE_PATH,
  GROUP_ROLE_LIST_PATH,
  mapGroupInboxPayload,
} from "./inboxService";

function groupApiUrl(): string {
  const value = import.meta.env.VITE_GROUP_API_URL;
  return typeof value === "string" ? value.trim() : "";
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Group inbox.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupInboxApi = createApi({
  reducerPath: "groupInboxApi",
  baseQuery: createBusinessBaseQuery(groupApiUrl()),
  endpoints: (build) => ({
    getGroupInbox: build.query<InboxData, void>({
      async queryFn(_request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapGroupInboxPayload(groupInboxMock) };
        }
        if (groupApiUrl().length === 0) {
          return { error: customError("Group API URL is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before loading the Group inbox.") };
        }

        const result = await baseQuery({
          url: GROUP_ROLE_LIST_PATH,
          method: "POST",
          body: createGroupRoleListRequest(username),
          headers: { accept: "*/*", "Content-Type": "application/json" },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapGroupInboxPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    fetchGroupPoolColumns: build.query<string[], string>({
      async queryFn(poolKey, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: storedPoolColumns("group", poolKey, groupColumnConfigFetchMock) };
        }
        if (groupApiUrl().length === 0) {
          return { error: customError("Group API URL is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before loading column configuration.") };
        }
        const result = await baseQuery({
          url: GROUP_POOL_COLUMNS_PATH,
          method: "GET",
          params: { username, poolKey },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (result.error) return { error: result.error };
        return { data: storedPoolColumns("group", poolKey, result.data) };
      },
    }),
    saveGroupPoolColumns: build.mutation<string[], { poolKey: string; selectedFields: string[] }>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          if (groupColumnConfigSaveMock.success === false) {
            return { error: customError(groupColumnConfigSaveMock.message || "Unable to save columns.") };
          }
          rememberPoolColumns("group", request.poolKey, request.selectedFields);
          return { data: storedPoolColumns("group", request.poolKey, groupColumnConfigFetchMock) };
        }
        if (groupApiUrl().length === 0) {
          return { error: customError("Group API URL is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before saving column configuration.") };
        }
        const saved = await baseQuery({
          url: GROUP_POOL_COLUMNS_SAVE_PATH,
          method: "POST",
          body: { username, poolKey: request.poolKey, selectedFields: request.selectedFields },
          headers: { accept: "*/*", "Content-Type": "application/json" },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (saved.error) return { error: saved.error };
        const fetched = await baseQuery({
          url: GROUP_POOL_COLUMNS_PATH,
          method: "GET",
          params: { username, poolKey: request.poolKey },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (fetched.error) return { error: fetched.error };
        const fields = storedPoolColumns("group", request.poolKey, fetched.data);
        return { data: fields.length > 0 ? fields : request.selectedFields };
      },
    }),
  }),
});

export const {
  useGetGroupInboxQuery,
  useLazyFetchGroupPoolColumnsQuery,
  useSaveGroupPoolColumnsMutation,
} = groupInboxApi;
