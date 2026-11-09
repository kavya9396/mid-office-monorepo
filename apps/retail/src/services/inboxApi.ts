import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  landingUrls,
  useMock,
} from "@insurance-poc/utils";
import retailInboxMock from "../modules/inbox/mock/retailInbox.json";
import {
  type InboxData,
} from "@insurance-poc/common/inbox";
import retailColumnConfigFetchMock from "../modules/inbox/mock/columnConfigFetch.json";
import retailColumnConfigSaveMock from "../modules/inbox/mock/columnConfigSave.json";
import retailClaimTaskMock from "../modules/inbox/mock/claimTask.json";
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
import { mapRetailInboxPayload } from "./inboxService";

const retailPoolColumnsMockConfig = {
  scope: "retail" as const,
  columnConfigFetchMock: retailColumnConfigFetchMock,
  columnConfigSaveMock: retailColumnConfigSaveMock,
};

export const retailInboxApi = createApi({
  reducerPath: "retailInboxApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getRetailInbox: build.query<InboxData, void>({
      async queryFn(_request, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        return await queryLandingRoleList(bq, {
          roleListUrl: landingUrls.retailRoleList,
          mapInboxPayload: mapRetailInboxPayload,
          mockData: retailInboxMock as unknown as InboxData,
          businessLabel: "Retail",
        });
      },
    }),
    fetchRetailPoolColumns: build.query<string[], string>({
      async queryFn(poolKey, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        if (useMock) {
          return mockFetchPoolColumns(poolKey, retailPoolColumnsMockConfig);
        }
        return await queryLandingPoolColumns(poolKey, bq, {
          scope: "retail",
          poolColumnsUrl: landingUrls.retailPoolColumns,
        });
      },
    }),
    saveRetailPoolColumns: build.mutation<string[], { poolKey: string; selectedFields: string[] }>({
      async queryFn(request, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        if (useMock) {
          return mockSavePoolColumns(request, retailPoolColumnsMockConfig);
        }
        return await mutateLandingSavePoolColumns(request, bq, {
          scope: "retail",
          poolColumnsUrl: landingUrls.retailPoolColumns,
          poolColumnsSaveUrl: landingUrls.retailPoolColumnsSave,
        });
      },
    }),
    claimRetailTask: build.mutation<ClaimTaskResponse, ClaimTaskRequest>({
      async queryFn(request, _api, _extra, baseQuery) {
        const bq = baseQuery as LandingBaseQuery;
        if (useMock) {
          return mockClaimTask(request, { claimTaskMock: retailClaimTaskMock });
        }
        return await mutateLandingClaimTask(request, bq, {
          claimTaskUrl: landingUrls.claimTask,
          businessLabel: "Retail",
        });
      },
    }),
  }),
});

export const {
  useGetRetailInboxQuery,
  useLazyFetchRetailPoolColumnsQuery,
  useSaveRetailPoolColumnsMutation,
  useClaimRetailTaskMutation,
} = retailInboxApi;
