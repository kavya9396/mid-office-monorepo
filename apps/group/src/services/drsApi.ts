import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  getDrsRoleType,
  groupBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import { getGroupDrsTaskConfig } from "../config/drsTaskConfig";
import groupDrsMock from "../modules/drs/mock/groupDrs.json";
import { mapGroupDrsPayload, type GroupDrsData } from "./drsService";

export type GroupDrsQueryArg =
  | string
  | {
      applicationNo: string;
      roleType?: string;
      screenType?: string;
      businessType?: string;
      taskType?: string;
    };

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Group DRS.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupDrsApi = createApi({
  reducerPath: "groupDrsApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getGroupDrs: build.query<GroupDrsData, GroupDrsQueryArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapGroupDrsPayload(groupDrsMock) };
        }
        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const applicationNo = typeof arg === "string" ? arg : arg.applicationNo;
        const taskType = typeof arg === "string" ? getDrsRoleType() : (arg.taskType ?? arg.roleType ?? getDrsRoleType());
        const taskConfig = getGroupDrsTaskConfig(taskType);

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
          return { data: mapGroupDrsPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useGetGroupDrsQuery } = groupDrsApi;
