import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBusinessBaseQuery, useMock } from "@insurance-poc/utils";
import retailInboxMock from "../modules/inbox/mock/retailInbox.json";
import type { InboxData } from "@insurance-poc/common/inbox";
import { mapRetailInboxPayload, RETAIL_INBOX_PATH } from "./inboxService";

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

        const result = await baseQuery({ url: RETAIL_INBOX_PATH, method: "GET" });
        if (result.error) return { error: result.error };

        try {
          return { data: mapRetailInboxPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useGetRetailInboxQuery } = retailInboxApi;
