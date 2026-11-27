import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { GrievanceHistoryRow } from "@insurance-poc/common/grievance-history";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  mmtGrievanceUrls,
  useMock,
} from "@insurance-poc/utils";
import mmtGrievanceFetchMock from "../modules/drs/mock/mmt-grievance-fetch.json";
import {
  buildMmtGrievanceFetchRequest,
  buildMmtGrievanceSaveRequest,
  isGrievanceApiFailure,
  mapMmtGrievanceFetchPayload,
  readGrievanceApiMessage,
  type MmtGrievanceMemberContext,
  type MmtGrievanceSaveRequest,
  type MmtGrievanceTables,
} from "./mmtGrievanceService";

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load MMT grievance details.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export type MmtGrievanceSaveResult = {
  message: string;
};

export type MmtGrievanceSaveArg = {
  context: MmtGrievanceMemberContext;
  rows: GrievanceHistoryRow[];
};

/** Grievance fetch and save. The MMT screen loads its DRS shell from `groupDrsApi`. */
export const mmtGrievanceApi = createApi({
  reducerPath: "mmtGrievanceApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getMmtGrievances: build.query<MmtGrievanceTables, MmtGrievanceMemberContext>({
      async queryFn(context, _api, _extra, baseQuery) {
        const request = buildMmtGrievanceFetchRequest(context);
        if (useMock) {
          try {
            return { data: mapMmtGrievanceFetchPayload(mmtGrievanceFetchMock) };
          } catch (reason: unknown) {
            return { error: customError(readError(reason)) };
          }
        }

        const fetchUrl = mmtGrievanceUrls.fetch;
        if (fetchUrl.length === 0) {
          return { error: customError("MMT grievance fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "POST",
          body: request,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        if (isGrievanceApiFailure(result.data)) {
          return { error: customError(readGrievanceApiMessage(result.data)) };
        }

        try {
          return { data: mapMmtGrievanceFetchPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    saveMmtGrievances: build.mutation<MmtGrievanceSaveResult, MmtGrievanceSaveArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const body: MmtGrievanceSaveRequest = buildMmtGrievanceSaveRequest(arg.context, arg.rows);

        if (useMock) {
          return { data: { message: "Grievances saved successfully." } };
        }

        const saveUrl = mmtGrievanceUrls.save;
        if (saveUrl.length === 0) {
          return { error: customError("MMT grievance save API is not configured.") };
        }

        const result = await baseQuery({
          url: saveUrl,
          method: "POST",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        if (isGrievanceApiFailure(result.data)) {
          return { error: customError(readGrievanceApiMessage(result.data)) };
        }

        return {
          data: {
            message: readGrievanceApiMessage(result.data) || "Grievances saved successfully.",
          },
        };
      },
    }),
  }),
});

export const {
  useGetMmtGrievancesQuery,
  useLazyGetMmtGrievancesQuery,
  useSaveMmtGrievancesMutation,
} = mmtGrievanceApi;
