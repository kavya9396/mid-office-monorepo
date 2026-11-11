import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  breUrls,
  createBusinessBaseQuery,
  getSessionBusinessType,
} from "@insurance-poc/utils";
import {
  mutateBreRetrigger,
  type BreRetriggerBaseQuery,
  type BreRetriggerMappedFinal,
} from "@insurance-poc/common/bre-retrigger";

export type BreRetriggerInput = {
  applicationNumber: string;
};

export const groupBreRetriggerApi = createApi({
  reducerPath: "groupBreRetriggerApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    retriggerGroupBre: build.mutation<BreRetriggerMappedFinal, BreRetriggerInput>({
      async queryFn({ applicationNumber }, _api, _extra, baseQuery) {
        const businessType = getSessionBusinessType() ?? "GROUP";
        return await mutateBreRetrigger(
          baseQuery as BreRetriggerBaseQuery,
          breUrls.retrigger,
          applicationNumber,
          businessType,
        );
      },
    }),
  }),
});

export const { useRetriggerGroupBreMutation } = groupBreRetriggerApi;
