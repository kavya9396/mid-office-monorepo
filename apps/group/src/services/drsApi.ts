import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBusinessBaseQuery, useMock } from "@insurance-poc/utils";
import groupDrsMock from "../modules/drs/mock/groupDrs.json";
import { GROUP_DRS_PATH, mapGroupDrsPayload, type GroupDrsData } from "./drsService";

function groupApiUrl(): string {
  const value = import.meta.env.VITE_GROUP_API_URL;
  return typeof value === "string" ? value.trim() : "";
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Group DRS.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

export const groupDrsApi = createApi({
  reducerPath: "groupDrsApi",
  baseQuery: createBusinessBaseQuery(groupApiUrl()),
  endpoints: (build) => ({
    getGroupDrs: build.query<GroupDrsData, string>({
      async queryFn(applicationNo, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapGroupDrsPayload(groupDrsMock) };
        }
        if (groupApiUrl().length === 0) {
          return { error: customError("Group API URL is not configured.") };
        }

        const result = await baseQuery({
          url: GROUP_DRS_PATH,
          method: "GET",
          params: { applicationNo },
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
