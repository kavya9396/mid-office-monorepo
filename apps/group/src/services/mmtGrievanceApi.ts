import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { GrievanceHistoryRow } from "@insurance-poc/common/grievance-history";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  getDrsRoleType,
  groupBusinessUrls,
  mmtGrievanceUrls,
  useMock,
} from "@insurance-poc/utils";
import { getGroupDrsTaskConfig } from "../config/drsTaskConfig";
import mmtDrsMock from "../modules/drs/mock/mmt-drs.json";
import mmtGrievanceFetchMock from "../modules/drs/mock/mmt-grievance-fetch.json";
import type { GroupDrsQueryArg } from "./drsApi";
import {
  buildMmtGrievanceFetchRequest,
  buildMmtGrievanceSaveRequest,
  isGrievanceApiFailure,
  mapMmtDrsShell,
  mapMmtGrievanceFetchPayload,
  readGrievanceApiMessage,
  type MmtDrsShell,
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

/** MMT-only APIs. DRS POST uses the same body shape as `groupDrsApi.getGroupDrs` (see DvtUser). */
export const mmtGrievanceApi = createApi({
  reducerPath: "mmtGrievanceApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getMmtDrs: build.query<MmtDrsShell, GroupDrsQueryArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const applicationNo = typeof arg === "string" ? arg : arg.applicationNo;
        const taskType =
          typeof arg === "string" ? getDrsRoleType() : (arg.taskType ?? arg.roleType ?? getDrsRoleType());
        const taskConfig = getGroupDrsTaskConfig(taskType);

        if (useMock) {
          const shell = mapMmtDrsShell(mmtDrsMock, applicationNo);
          if (!shell) return { error: customError("MMT DRS mock is not available.") };
          return { data: shell };
        }

        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const body = {
          applicationNo,
          roleType: (typeof arg !== "string" && arg.roleType) || taskConfig.roleType,
          screenType: (typeof arg !== "string" && arg.screenType) || taskConfig.screenType,
          businessType: (typeof arg !== "string" && arg.businessType) || taskConfig.businessType,
        };

        const result = await baseQuery({
          url: drsDataUrl,
          method: "POST",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          const shell = mapMmtDrsShell(result.data, applicationNo);
          if (!shell) {
            return { error: customError("MMT DRS response is not in the expected format.") };
          }
          return { data: shell };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
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
  useGetMmtDrsQuery,
  useGetMmtGrievancesQuery,
  useSaveMmtGrievancesMutation,
} = mmtGrievanceApi;
