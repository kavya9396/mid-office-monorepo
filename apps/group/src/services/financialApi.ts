import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  groupBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import groupFinancialMock from "../modules/drs/mock/groupFinancial.json";
import groupFinancialSaveMock from "../modules/drs/mock/groupFinancialSave.json";
import {
  mapFinancialFetchPayload,
  type FinancialFetchRequest,
} from "./financialService";
import type {
  FinancialSaveRequest,
  FinancialSaveResponse,
  FinancialSection,
} from "@insurance-poc/common/financial";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the financial details.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupFinancialApi = createApi({
  reducerPath: "groupFinancialApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getGroupFinancialDetails: build.query<FinancialSection[], FinancialFetchRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapFinancialFetchPayload(groupFinancialMock) };
        }
        const fetchUrl = groupBusinessUrls.financialFetch;
        if (fetchUrl.length === 0) {
          return { error: customError("Financial fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
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
    saveGroupFinancial: build.mutation<FinancialSaveResponse, FinancialSaveRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: groupFinancialSaveMock as FinancialSaveResponse };
        }
        const saveUrl = groupBusinessUrls.financialSave;
        if (saveUrl.length === 0) {
          return { error: customError("Financial save API is not configured.") };
        }

        const result = await baseQuery({
          url: saveUrl,
          method: "POST",
          body: request,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: result.data as FinancialSaveResponse };
      },
    }),
  }),
});

export const {
  useGetGroupFinancialDetailsQuery,
  useLazyGetGroupFinancialDetailsQuery,
  useSaveGroupFinancialMutation,
} = groupFinancialApi;
