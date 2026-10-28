import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBusinessBaseQuery, useMock } from "@insurance-poc/utils";
import groupInboxMock from "../modules/inbox/mock/groupInbox.json";
import type { InboxData } from "@insurance-poc/common/inbox";
import { GROUP_INBOX_PATH, mapGroupInboxPayload } from "./inboxService";

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

        const result = await baseQuery({ url: GROUP_INBOX_PATH, method: "GET" });
        if (result.error) return { error: result.error };

        try {
          return { data: mapGroupInboxPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useGetGroupInboxQuery } = groupInboxApi;
