import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  retailBusinessUrls,
  isApiFailureBody,
  readApiErrorMessage,
  useMock,
} from "@insurance-poc/utils";
import {
  mapMedicalFetchPayload,
  type MedicalFetchResult,
  type MedicalSaveRequest,
  type MedicalSaveResponse,
} from "@insurance-poc/common/medical";
import medicalDataFetchMock from "../../../../mock/medical/medical-data-fetch.json";

export interface MedicalFetchRequest {
  applicationNumber: string;
  partyId: string;
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
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

type SaveResult = { data: MedicalSaveResponse } | { error: FetchBaseQueryError };

const SAVE_FAILED_MESSAGE = "Unable to save the medical details.";

/**
 * An HTTP error (e.g. 400 validation) carries the API envelope in its body: keep it, so the screen can
 * show the message and the field-level errors in `data`.
 */
function mapSaveHttpError(error: FetchBaseQueryError): SaveResult {
  const message = readApiErrorMessage(error, SAVE_FAILED_MESSAGE);
  const body: unknown = "data" in error ? error.data : undefined;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: customError(message) };
  }
  return {
    data: {
      response_code: typeof error.status === "number" ? error.status : 400,
      error: true,
      message,
      data: "data" in body ? body.data : undefined,
    },
  };
}

/**
 * A 200 whose body says error / response_code >= 400 is a validation failure: keep the envelope
 * so the screen shows the API's message and stays in edit mode.
 */
function mapSaveFailureBody(body: unknown): MedicalSaveResponse {
  const failure = body as Partial<MedicalSaveResponse>;
  return {
    response_code: typeof failure.response_code === "number" ? failure.response_code : 400,
    error: true,
    message: readApiErrorMessage(body, SAVE_FAILED_MESSAGE),
    data: failure.data,
  };
}

export const retailMedicalApi = createApi({
  reducerPath: "retailMedicalApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getRetailMedicalDetails: build.query<MedicalFetchResult | null, MedicalFetchRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          return mapBody(medicalDataFetchMock);
        }
        const fetchUrl = retailBusinessUrls.medicalFetch;
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
    saveRetailMedical: build.mutation<MedicalSaveResponse, MedicalSaveRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          // Same envelope as `response_example_shape` in mock/medical/medical-data-save.json.
          return {
            data: {
              response_code: 200,
              error: false,
              message: "Medical details saved successfully.",
              data: {
                applicationNumber: request.applicationNumber,
                partyId: request.partyId,
                sections: request.sections,
              },
            },
          };
        }
        const saveUrl = retailBusinessUrls.medicalSave;
        if (saveUrl.length === 0) {
          return { error: customError("Medical save API is not configured.") };
        }

        const result = await baseQuery({
          url: saveUrl,
          method: "POST",
          body: request,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return mapSaveHttpError(result.error);
        if (isApiFailureBody(result.data)) return { data: mapSaveFailureBody(result.data) };
        return { data: result.data as MedicalSaveResponse };
      },
    }),
  }),
});

export const { useGetRetailMedicalDetailsQuery, useSaveRetailMedicalMutation } = retailMedicalApi;
