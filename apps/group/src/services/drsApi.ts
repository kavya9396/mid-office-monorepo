import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  groupBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import groupDrsMock from "../../../../mock/drs/group-drs.json";
import { mapGroupDrsPayload, type GroupDrsData } from "./drsService";

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
    getGroupDrs: build.query<GroupDrsData, string>({
      async queryFn(applicationNo, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapGroupDrsPayload(groupDrsMock) };
        }
        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
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
