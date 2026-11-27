import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  retailBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import retailFinancialMock from "../modules/drs/mock/retailFinancial.json";
import retailFinancialSaveMock from "../modules/drs/mock/retailFinancialSave.json";
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

export const retailFinancialApi = createApi({
  reducerPath: "retailFinancialApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getRetailFinancialDetails: build.query<FinancialSection[], FinancialFetchRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapFinancialFetchPayload(retailFinancialMock) };
        }
        const fetchUrl = retailBusinessUrls.financialFetch;
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
    saveRetailFinancial: build.mutation<FinancialSaveResponse, FinancialSaveRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: retailFinancialSaveMock as FinancialSaveResponse };
        }
        const saveUrl = retailBusinessUrls.financialSave;
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
  useGetRetailFinancialDetailsQuery,
  useLazyGetRetailFinancialDetailsQuery,
  useSaveRetailFinancialMutation,
} = retailFinancialApi;
