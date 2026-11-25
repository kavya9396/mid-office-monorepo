import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  isApiFailureBody,
  preIssuanceDvtUrls,
  readApiErrorMessage,
  readApiMessageFromBody,
  useMock,
} from "@insurance-poc/utils";
import preIssuanceCvtDrsMock from "../modules/drs/mock/preIssuanceCvtDrs.json";
import {
  mapPreIssuanceCvtDrsPayload,
  type PreIssuanceCvtDecisionRequest,
  type PreIssuanceCvtDecisionResult,
  type PreIssuanceCvtDrsData,
  type PreIssuanceCvtDrsQueryArg,
} from "./preIssuanceCvtService";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Pre Issuance CVT DRS.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

/** Pre Issuance CVT Task DRS: `GET` with query params `applicationNo` and `callId`; `data` is `null` when not found. */
export const retailPreIssuanceCvtApi = createApi({
  reducerPath: "retailPreIssuanceCvtApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getPreIssuanceCvtDrs: build.query<PreIssuanceCvtDrsData | null, PreIssuanceCvtDrsQueryArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapPreIssuanceCvtDrsPayload(preIssuanceCvtDrsMock) };
        }
        const fetchUrl = preIssuanceDvtUrls.fetch;
        if (fetchUrl.length === 0) {
          return { error: customError("Pre Issuance CVT fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "GET",
          params: {
            applicationNo: arg.applicationNo,
            ...(arg.callId ? { callId: arg.callId } : {}),
          },
          headers: { accept: "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapPreIssuanceCvtDrsPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    /** Confirm Accept / Confirm Reject: `POST` to `VITE_PRE_ISSUANCE_SERVICE_SAVE` with the decision request body. */
    savePreIssuanceCvtDecision: build.mutation<
      PreIssuanceCvtDecisionResult,
      PreIssuanceCvtDecisionRequest
    >({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: { message: "Decision saved successfully." } };
        }
        const saveUrl = preIssuanceDvtUrls.save;
        if (saveUrl.length === 0) {
          return { error: customError("Pre Issuance CVT save API is not configured.") };
        }

        const result = await baseQuery({
          url: saveUrl,
          method: "POST",
          body: {
            callId: arg.callId,
            applicationNo: arg.applicationNo,
            decision: arg.decision,
            userId: arg.userId,
            rejectionRemarks: arg.rejectionRemarks,
          },
          headers: { accept: "application/json", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        if (isApiFailureBody(result.data)) {
          return { error: customError(readApiErrorMessage(result.data)) };
        }
        const message = readApiMessageFromBody(result.data);
        return { data: { message: message.length > 0 ? message : "Decision saved successfully." } };
      },
    }),
  }),
});

export const { useGetPreIssuanceCvtDrsQuery, useSavePreIssuanceCvtDecisionMutation } =
  retailPreIssuanceCvtApi;
