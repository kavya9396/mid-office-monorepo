import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  landingUrls,
  useMock,
} from "@insurance-poc/utils";
import groupInboxMock from "../modules/inbox/mock/groupInbox.json";
import type { InboxData } from "@insurance-poc/common/inbox";
import groupColumnConfigFetchMock from "../modules/inbox/mock/columnConfigFetch.json";
import groupColumnConfigSaveMock from "../modules/inbox/mock/columnConfigSave.json";
import groupClaimTaskMock from "../modules/inbox/mock/claimTask.json";
import {
  mockClaimTask,
  mockFetchPoolColumns,
  mockSavePoolColumns,
  mutateLandingClaimTask,
  mutateLandingSavePoolColumns,
  queryLandingPoolColumns,
  queryLandingRoleList,
  type ClaimTaskRequest,
  type ClaimTaskResponse,
  type LandingBaseQuery,
} from "@insurance-poc/common/landing-inbox-queries";
import { mapGroupInboxPayload } from "./inboxService";

const groupPoolColumnsMockConfig = {
  scope: "group" as const,
  columnConfigFetchMock: groupColumnConfigFetchMock,
  columnConfigSaveMock: groupColumnConfigSaveMock,
};

export const groupInboxApi = createApi({
  reducerPath: "groupInboxApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getGroupInbox: build.query<InboxData, void>({
      async queryFn(_request, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        return await queryLandingRoleList(bq, {
          roleListUrl: landingUrls.groupRoleList,
          mapInboxPayload: mapGroupInboxPayload,
          mockData: groupInboxMock as unknown as InboxData,
          businessLabel: "Group",
        });
      },
    }),
    fetchGroupPoolColumns: build.query<string[], string>({
      async queryFn(poolKey, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        if (useMock) {
          return mockFetchPoolColumns(poolKey, groupPoolColumnsMockConfig);
        }
        return await queryLandingPoolColumns(poolKey, bq, {
          scope: "group",
          poolColumnsUrl: landingUrls.groupPoolColumns,
        });
      },
    }),
    saveGroupPoolColumns: build.mutation<string[], { poolKey: string; selectedFields: string[] }>({
      async queryFn(request, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        if (useMock) {
          return mockSavePoolColumns(request, groupPoolColumnsMockConfig);
        }
        return await mutateLandingSavePoolColumns(request, bq, {
          scope: "group",
          poolColumnsUrl: landingUrls.groupPoolColumns,
          poolColumnsSaveUrl: landingUrls.groupPoolColumnsSave,
        });
      },
    }),
    claimGroupTask: build.mutation<ClaimTaskResponse, ClaimTaskRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        if (useMock) {
          return mockClaimTask(request, { claimTaskMock: groupClaimTaskMock });
        }
        return await mutateLandingClaimTask(request, bq, {
          claimTaskUrl: landingUrls.claimTask,
          businessLabel: "Group",
        });
      },
    }),
  }),
});

export const {
  useGetGroupInboxQuery,
  useLazyFetchGroupPoolColumnsQuery,
  useSaveGroupPoolColumnsMutation,
  useClaimGroupTaskMutation,
} = groupInboxApi;
