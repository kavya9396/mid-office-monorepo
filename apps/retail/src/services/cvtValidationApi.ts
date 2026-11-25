import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  retailBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import cvtValidationMock from "../modules/drs/mock/retailCvtValidation.json";
import cuwValidationMock from "../../../../mock/drs/cuw-validation.json";
import {
  readCvtValidationResponse,
  type CvtValidationRequest,
  type CvtValidationResult,
} from "./cvtValidationService";
import {
  fromCuwValidationResponse,
  type CuwValidationRequest,
  type CuwValidationResult,
} from "./drsService";

/**
 * Decision code that fails validation in mock mode (CVT "Raise Requirements"). When any party sends it,
 * the mock file is returned as-is; otherwise no party has validations.
 */
const CVT_MOCK_FAILING_DECISION = "AMR";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to validate the decision.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const retailCvtValidationApi = createApi({
  reducerPath: "retailCvtValidationApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    fetchCvtValidation: build.mutation<CvtValidationResult, CvtValidationRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          try {
            const template = readCvtValidationResponse(cvtValidationMock);
            const fails = request.partyDecision.some((party) => party.decision === CVT_MOCK_FAILING_DECISION);
            return fails ? { data: template } : { data: { ...template, status: "Success", partyValidations: [] } };
          } catch (reason: unknown) {
            return { error: customError(readError(reason)) };
          }
        }
        const validationUrl = retailBusinessUrls.cvtValidation;
        if (validationUrl.length === 0) {
          return { error: customError("Retail CVT validation API is not configured.") };
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
          return { data: readCvtValidationResponse(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),

    validateCuwDecision: build.mutation<CuwValidationResult, CuwValidationRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          try {
            // Mock = the API response as-is for every decision; edit cuw-validation.json to try other outcomes
            const result = fromCuwValidationResponse(cuwValidationMock);
            return { data: { ...result, applicationNo: request.applicationNo } };
          } catch (reason: unknown) {
            return { error: customError(readError(reason)) };
          }
        }

        const validationUrl = retailBusinessUrls.cvtValidation;
        if (validationUrl.length === 0) {
          return { error: customError("Retail CUW validation API is not configured.") };
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
          const mapped = fromCuwValidationResponse(result.data);
          return { data: { ...mapped, applicationNo: request.applicationNo } };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useFetchCvtValidationMutation, useValidateCuwDecisionMutation } = retailCvtValidationApi;
