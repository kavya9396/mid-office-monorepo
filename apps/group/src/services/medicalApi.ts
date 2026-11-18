import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  groupBusinessUrls,
  isApiFailureBody,
  readApiErrorMessage,
  useMock,
} from "@insurance-poc/utils";
import { mapMedicalFetchPayload, type MedicalFetchResult } from "@insurance-poc/common/medical";
import medicalDataFetchMock from "../../../../mock/medical/medical-data-fetch.json";

const MOCK_MEDICAL_DELAY_MS = 100;

export interface MedicalFetchRequest {
  applicationNumber: string;
  partyId: string;
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the medical details.";
}

/** Maps a response body; "not found" (no `data.sections`) is a `null` result, never another record. */
function mapBody(body: unknown): { data: MedicalFetchResult | null } | { error: FetchBaseQueryError } {
  try {
    return { data: mapMedicalFetchPayload(body) };
  } catch (reason: unknown) {
    return { error: customError(readError(reason)) };
  }
}

export const groupMedicalApi = createApi({
  reducerPath: "groupMedicalApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getGroupMedicalDetails: build.query<MedicalFetchResult | null, MedicalFetchRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          await waitMs(MOCK_MEDICAL_DELAY_MS);
          return mapBody(medicalDataFetchMock);
        }
        const fetchUrl = groupBusinessUrls.medicalFetch;
        if (fetchUrl.length === 0) {
          return { error: customError("Medical fetch API is not configured.") };
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
        if (isApiFailureBody(result.data)) {
          return { error: customError(readApiErrorMessage(result.data, "Unable to load the medical details.")) };
        }
        return mapBody(result.data);
      },
    }),
  }),
});

export const { useGetGroupMedicalDetailsQuery } = groupMedicalApi;
