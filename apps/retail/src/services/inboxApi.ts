import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBusinessBaseQuery, getSessionUser, useMock } from "@insurance-poc/utils";
import retailInboxMock from "../modules/inbox/mock/retailInbox.json";
import { rememberPoolColumns, storedPoolColumns, type InboxData } from "@insurance-poc/common/inbox";
import retailColumnConfigFetchMock from "../modules/inbox/mock/columnConfigFetch.json";
import retailColumnConfigSaveMock from "../modules/inbox/mock/columnConfigSave.json";
import {
  createRetailRoleListRequest,
  mapRetailInboxPayload,
  RETAIL_POOL_COLUMNS_PATH,
  RETAIL_POOL_COLUMNS_SAVE_PATH,
  RETAIL_ROLE_LIST_PATH,
} from "./inboxService";

function retailApiUrl(): string {
  const value = import.meta.env.VITE_RETAIL_API_URL;
  return typeof value === "string" ? value.trim() : "";
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Retail inbox.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const retailInboxApi = createApi({
  reducerPath: "retailInboxApi",
  baseQuery: createBusinessBaseQuery(retailApiUrl()),
  endpoints: (build) => ({
    getRetailInbox: build.query<InboxData, void>({
      async queryFn(_request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapRetailInboxPayload(retailInboxMock) };
        }
        if (retailApiUrl().length === 0) {
          return { error: customError("Retail API URL is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before loading the Retail inbox.") };
        }

        const result = await baseQuery({
          url: RETAIL_ROLE_LIST_PATH,
          method: "POST",
          body: createRetailRoleListRequest(username),
          headers: { accept: "*/*", "Content-Type": "application/json" },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapRetailInboxPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    fetchRetailPoolColumns: build.query<string[], string>({
      async queryFn(poolKey, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: storedPoolColumns("retail", poolKey, retailColumnConfigFetchMock) };
        }
        if (retailApiUrl().length === 0) {
          return { error: customError("Retail API URL is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before loading column configuration.") };
        }
        const result = await baseQuery({
          url: RETAIL_POOL_COLUMNS_PATH,
          method: "GET",
          params: { username, poolKey },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (result.error) return { error: result.error };
        return { data: storedPoolColumns("retail", poolKey, result.data) };
      },
    }),
    saveRetailPoolColumns: build.mutation<string[], { poolKey: string; selectedFields: string[] }>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          if (retailColumnConfigSaveMock.success === false) {
            return { error: customError(retailColumnConfigSaveMock.message || "Unable to save columns.") };
          }
          rememberPoolColumns("retail", request.poolKey, request.selectedFields);
          return { data: storedPoolColumns("retail", request.poolKey, retailColumnConfigFetchMock) };
        }
        if (retailApiUrl().length === 0) {
          return { error: customError("Retail API URL is not configured.") };
        }
        const username = getSessionUser()?.userId ?? "";
        if (username.length === 0) {
          return { error: customError("Sign in before saving column configuration.") };
        }
        const saved = await baseQuery({
          url: RETAIL_POOL_COLUMNS_SAVE_PATH,
          method: "POST",
          body: { username, poolKey: request.poolKey, selectedFields: request.selectedFields },
          headers: { accept: "*/*", "Content-Type": "application/json" },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (saved.error) return { error: saved.error };
        const fetched = await baseQuery({
          url: RETAIL_POOL_COLUMNS_PATH,
          method: "GET",
          params: { username, poolKey: request.poolKey },
          encryptRequest: false,
          decryptResponse: false,
        });
        if (fetched.error) return { error: fetched.error };
        const fields = storedPoolColumns("retail", request.poolKey, fetched.data);
        return { data: fields.length > 0 ? fields : request.selectedFields };
      },
    }),
  }),
});

export const {
  useGetRetailInboxQuery,
  useLazyFetchRetailPoolColumnsQuery,
  useSaveRetailPoolColumnsMutation,
} = retailInboxApi;
