import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBusinessBaseQuery, useMock } from "@insurance-poc/utils";
import groupFinancialMock from "../modules/drs/mock/groupFinancial.json";
import {
  GROUP_FINANCIAL_PATH,
  mapFinancialFetchPayload,
  type FinancialFetchRequest,
} from "./financialService";
import type { FinancialSection } from "@insurance-poc/common/financial";

function groupApiUrl(): string {
  const value = import.meta.env.VITE_GROUP_API_URL;
  return typeof value === "string" ? value.trim() : "";
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the financial details.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupFinancialApi = createApi({
  reducerPath: "groupFinancialApi",
  baseQuery: createBusinessBaseQuery(groupApiUrl()),
  endpoints: (build) => ({
    getGroupFinancialDetails: build.query<FinancialSection[], FinancialFetchRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapFinancialFetchPayload(groupFinancialMock) };
        }
        if (groupApiUrl().length === 0) {
          return { error: customError("Group API URL is not configured.") };
        }

        const result = await baseQuery({
          url: GROUP_FINANCIAL_PATH,
          method: "POST",
          body: {
            applicationNumber: request.applicationNumber,
            partyId: request.partyId,
          },
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapFinancialFetchPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const {
  useGetGroupFinancialDetailsQuery,
  useLazyGetGroupFinancialDetailsQuery,
} = groupFinancialApi;
