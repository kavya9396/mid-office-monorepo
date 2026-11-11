import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  nsdlUrls,
  useMock,
} from "@insurance-poc/utils";
import nsdlPanValidateMock from "../../../../mock/nsdl-pan-validate/nsdl-pan-validate.v1.3.0.mock.json";
import {
  readNsdlPanValidateResponse,
  type NsdlPanValidateRequest,
  type NsdlPanValidateResult,
} from "./nsdlService";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to validate the PAN.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupNsdlApi = createApi({
  reducerPath: "groupNsdlApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    validateNsdlPan: build.mutation<NsdlPanValidateResult, NsdlPanValidateRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        if (useMock) {
          try {
            return { data: readNsdlPanValidateResponse(nsdlPanValidateMock) };
          } catch (reason: unknown) {
            return { error: customError(readError(reason)) };
          }
        }
        const panValidateUrl = nsdlUrls.panValidate;
        if (panValidateUrl.length === 0) {
          return { error: customError("NSDL PAN validate API is not configured.") };
        }

        // Plain JSON both ways, no payload encryption (nsdl-pan-validate.md, add-on #11).
        const result = await baseQuery({
          url: panValidateUrl,
          method: "POST",
          body: request,
          encryptRequest: false,
          decryptResponse: false,
        });
        if (result.error) return { error: result.error };

        try {
          return { data: readNsdlPanValidateResponse(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useValidateNsdlPanMutation } = groupNsdlApi;
