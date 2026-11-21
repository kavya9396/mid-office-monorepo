import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  groupBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import dvtValidationMock from "../../../../mock/drs/dvt-validation.json";
import guwValidationMock from "../../../../mock/drs/guw-validation.json";
import {
  readDvtValidationResponse,
  type DvtValidationRequest,
  type DvtValidationResult,
} from "./dvtValidationService";
import {
  fromGuwValidationResponse,
  type GuwValidationRequest,
  type GuwValidationResult,
} from "./guwService";

/**
 * Decision code that fails validation in mock mode (the example in the API contract). When any party sends it,
 * the mock file is returned as-is; otherwise no party has validations.
 */
const DVT_MOCK_FAILING_DECISION = "AMR";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to validate the decision.";
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
            const template = readDvtValidationResponse(dvtValidationMock);
            const fails = request.partyDecision.some((party) => party.decision === DVT_MOCK_FAILING_DECISION);
            return fails ? { data: template } : { data: { ...template, status: "Success", partyValidations: [] } };
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

    validateGuwDecision: build.mutation<GuwValidationResult, GuwValidationRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          try {
            // Mock = the API response as-is for every decision; edit guw-validation.json to try other outcomes
            const result = fromGuwValidationResponse(guwValidationMock);
            return { data: { ...result, applicationNo: request.applicationNo } };
          } catch (reason: unknown) {
            return { error: customError(readError(reason)) };
          }
        }

        const validationUrl = groupBusinessUrls.dvtValidation;
        if (validationUrl.length === 0) {
          return { error: customError("Group GUW validation API is not configured.") };
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
          const mapped = fromGuwValidationResponse(result.data);
          return { data: { ...mapped, applicationNo: request.applicationNo } };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useFetchDvtValidationMutation, useValidateGuwDecisionMutation } = groupDvtValidationApi;
