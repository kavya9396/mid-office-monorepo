import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  groupBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import dvtValidationMock from "../../../../mock/drs/dvt-validation.json";
import {
  readDvtValidationResponse,
  type DvtValidationRequest,
  type DvtValidationResult,
} from "./dvtValidationService";

/** Decision code that fails validation in mock mode (the example in the API contract). Any other code passes. */
const MOCK_FAILING_DECISION = "AMR";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to validate the DVT decision.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupDvtValidationApi = createApi({
  reducerPath: "groupDvtValidationApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    fetchDvtValidation: build.mutation<DvtValidationResult, DvtValidationRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          try {
            const mock =
              request.dvtDecision === MOCK_FAILING_DECISION
                ? dvtValidationMock
                : { ...dvtValidationMock, validations: [] };
            return { data: readDvtValidationResponse(mock) };
          } catch (reason: unknown) {
            return { error: customError(readError(reason)) };
          }
        }
        const validationUrl = groupBusinessUrls.dvtValidation;
        if (validationUrl.length === 0) {
          return { error: customError("Group DVT validation API is not configured.") };
        }

        const result = await baseQuery({
          url: validationUrl,
          method: "POST",
          body: request,
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            "X-Correlation-Id": crypto.randomUUID(),
          },
        });
        if (result.error) return { error: result.error };

        try {
          return { data: readDvtValidationResponse(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useFetchDvtValidationMutation } = groupDvtValidationApi;
