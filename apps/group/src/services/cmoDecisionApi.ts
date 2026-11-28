import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { DecisionHistoryRow } from "@insurance-poc/common/cmo";
import {
  absoluteApiBaseUrl,
  cmoDecisionUrls,
  createBusinessBaseQuery,
  isApiFailureBody,
  readApiErrorMessage,
  readApiMessageFromBody,
  useMock,
} from "@insurance-poc/utils";
import { mapCmoDecisionRows } from "../modules/drs/cmoDecisionSection";
import cmoDecisionFetchMock from "../modules/drs/mock/cmo-decision-fetch.json";

export type CmoDecisionFetchRequest = {
  applicationNumber: string;
  partyId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsedBody(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const payload = value.trim();
  if (!payload.startsWith("{") && !payload.startsWith("[")) return value;
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return value;
  }
}

/** API `message` only. Parses a text body from the business query. */
function apiMessage(value: unknown): string {
  const direct = readApiMessageFromBody(parsedBody(value));
  if (direct.length > 0) return direct;
  if (isRecord(value) && "data" in value) {
    return readApiMessageFromBody(parsedBody(value.data));
  }
  return "";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

function failureFrom(value: unknown): FetchBaseQueryError {
  const message = apiMessage(value);
  if (message.length > 0) return customError(message);
  const fallback = readApiErrorMessage(value, "");
  return customError(fallback.length > 0 ? fallback : "Unable to load the CMO decision.");
}

/** HO CMO and Vendor CMO decision table. Body is applicationNumber and partyId from the DRS response. */
export const cmoDecisionApi = createApi({
  reducerPath: "cmoDecisionApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getCmoDecision: build.query<DecisionHistoryRow[], CmoDecisionFetchRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapCmoDecisionRows(cmoDecisionFetchMock) };
        }

        const fetchUrl = cmoDecisionUrls.fetch;
        if (fetchUrl.length === 0) {
          return { error: customError("CMO decision fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "POST",
          body: {
            applicationNumber: arg.applicationNumber,
            partyId: arg.partyId,
          },
          headers: { accept: "application/json", "Content-Type": "application/json" },
        });
        if (result.error) return { error: failureFrom(result.error) };

        const body = parsedBody(result.data);
        if (isApiFailureBody(body)) return { error: failureFrom(body) };
        try {
          return { data: mapCmoDecisionRows(body) };
        } catch {
          return { data: [] };
        }
      },
    }),
  }),
});

export const { useGetCmoDecisionQuery } = cmoDecisionApi;
