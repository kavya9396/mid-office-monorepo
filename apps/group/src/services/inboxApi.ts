import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  getSessionUser,
  landingUrls,
  mustChangePassword,
  useMock,
} from "@insurance-poc/utils";
import groupInboxMock from "../modules/inbox/mock/groupInbox.json";
import { rememberPoolColumns, storedPoolColumns, type InboxData } from "@insurance-poc/common/inbox";
import groupColumnConfigFetchMock from "../modules/inbox/mock/columnConfigFetch.json";
import groupColumnConfigSaveMock from "../modules/inbox/mock/columnConfigSave.json";
import { createGroupRoleListRequest, mapGroupInboxPayload } from "./inboxService";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Group inbox.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupInboxApi = createApi({
  reducerPath: "groupInboxApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getGroupInbox: build.query<InboxData, void>({
      async queryFn(_request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapGroupInboxPayload(groupInboxMock) };
        }
        if (landingUrls.groupRoleList.length === 0) {
          return { error: customError("VITE_GROUP_ROLE_LIST_API is not configured.") };
        }
        if (mustChangePassword()) {
          return { error: customError("Change your password before loading the Group inbox.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before loading the Group inbox.") };
        }

        const result = await baseQuery({
          url: landingUrls.groupRoleList,
          method: "POST",
          body: createGroupRoleListRequest(),
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
        if (landingUrls.groupPoolColumns.length === 0) {
          return { error: customError("VITE_GROUP_POOL_COLUMNS_API is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before loading column configuration.") };
        }
        const result = await baseQuery({
          url: landingUrls.groupPoolColumns,
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
        if (
          landingUrls.groupPoolColumnsSave.length === 0 ||
          landingUrls.groupPoolColumns.length === 0
        ) {
          return {
            error: customError(
              "VITE_GROUP_POOL_COLUMNS_SAVE_API or VITE_GROUP_POOL_COLUMNS_API is not configured.",
            ),
          };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before saving column configuration.") };
        }
        const saved = await baseQuery({
          url: landingUrls.groupPoolColumnsSave,
          method: "POST",
          body: { username, poolKey: request.poolKey, selectedFields: request.selectedFields },
          headers: { accept: "*/*", "Content-Type": "application/json" },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (saved.error) return { error: saved.error };
        const fetched = await baseQuery({
          url: landingUrls.groupPoolColumns,
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
