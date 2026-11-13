import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  getDrsRoleType,
  getSessionUser,
  groupBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import { getGroupDrsTaskConfig } from "../config/drsTaskConfig";
import groupDrsMock from "../modules/drs/mock/groupDrs.json";
import groupDrsSaveMock from "../modules/drs/mock/groupDrsSave.json";
import { mapGroupDrsPayload, mapRawRequirementRows, type GroupDrsData } from "./drsService";

export type GroupDrsQueryArg =
  | string
  | {
      applicationNo: string;
      roleType?: string;
      screenType?: string;
      businessType?: string;
      taskType?: string;
    };

export type SaveGroupDrsRequirementsArg = {
  applicationNo: string;
  requirements: RequirementItem[];
  roleType?: string;
  lob?: string;
  userId?: string;
  queryArg?: GroupDrsQueryArg;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Group DRS.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const toRequirementRequestItem = (item: RequirementItem) => {
  const isNumericId =
    typeof item.id === "number" ||
    (typeof item.id === "string" && !item.id.startsWith("req-") && Number.isFinite(Number(item.id)) && Number(item.id) > 0);

  const payload: Record<string, unknown> = {
    status: item.status || "Pending",
    profile: item.profile || "",
    fupCode: item.fupCode || "",
    category: item.category || "",
    subCategory: item.subCategory || "",
    document: item.document || "",
    extraRemarks: item.extraRemarks || "",
  };

  if (isNumericId) {
    payload.requirementId = Number(item.id);
  }
  if (item.team) payload.team = item.team;
  if (item.reason) payload.reason = item.reason;
  if (item.description) payload.description = item.description;
  if (item.ocrStatus) payload.ocrStatus = item.ocrStatus;

  return payload;
};

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
    saveGroupDrsRequirements: build.mutation<RequirementItem[], SaveGroupDrsRequirementsArg>({
      async queryFn(arg, api, _extra, baseQuery) {
        const sessionUser = getSessionUser();
        const userId = arg.userId ?? sessionUser?.username ?? "uw.user";
        const taskType = arg.roleType ?? getDrsRoleType();
        const taskConfig = getGroupDrsTaskConfig(taskType);
        const roleType = arg.roleType ?? taskConfig.roleType ?? "DVT_TASK";
        const lob = arg.lob ?? "G";

        const body = {
          applicationNo: arg.applicationNo,
          lob,
          userId,
          roleType,
          sections: ["requirementManagement"],
          data: {
            requirementManagement: arg.requirements.map(toRequirementRequestItem),
          },
        };

        console.log("[saveGroupDrsRequirements] PUT payload to send:", body);

        if (useMock) {
          const savedMockRows = groupDrsSaveMock.data?.requirementManagement;
          const mockMapped =
            Array.isArray(savedMockRows) && savedMockRows.length > 0
              ? mapRawRequirementRows(savedMockRows)
              : arg.requirements.map((item, idx) => ({
                  ...item,
                  id: typeof item.id === "number" ? item.id : 17630 + idx,
                  status: item.status || "Pending",
                }));

          if (arg.queryArg) {
            api.dispatch(
              groupDrsApi.util.updateQueryData("getGroupDrs", arg.queryArg, (draft) => {
                draft.requirements = mockMapped;
              }),
            );
          }
          api.dispatch(
            groupDrsApi.util.updateQueryData("getGroupDrs", arg.applicationNo, (draft) => {
              draft.requirements = mockMapped;
            }),
          );
          return { data: mockMapped };
        }

        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "PUT",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });

        if (result.error) return { error: result.error };

        try {
          const resp = result.data as Record<string, unknown> | null;
          const respData = isRecord(resp?.data) ? resp.data : resp;
          const reqRows = respData?.requirementManagement;
          const updatedRequirements = mapRawRequirementRows(reqRows);

          if (arg.queryArg) {
            api.dispatch(
              groupDrsApi.util.updateQueryData("getGroupDrs", arg.queryArg, (draft) => {
                draft.requirements = updatedRequirements;
              }),
            );
          }
          api.dispatch(
            groupDrsApi.util.updateQueryData("getGroupDrs", arg.applicationNo, (draft) => {
              draft.requirements = updatedRequirements;
            }),
          );

          return { data: updatedRequirements };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const { useGetGroupDrsQuery, useSaveGroupDrsRequirementsMutation } = groupDrsApi;
