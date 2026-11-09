import { createApi } from "@reduxjs/toolkit/query/react";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  landingUrls,
} from "@insurance-poc/utils";
import {
  mutateCompleteTask,
  type CompleteTaskBaseQuery,
  type CompleteTaskInput,
  type CompleteTaskResult,
} from "@insurance-poc/common/complete-task";
export const groupCompleteTaskApi = createApi({
  reducerPath: "groupCompleteTaskApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    completeGroupTask: build.mutation<CompleteTaskResult, CompleteTaskInput>({
      async queryFn(input, _api, _extra, baseQuery) {
        return await mutateCompleteTask(
          baseQuery as CompleteTaskBaseQuery,
          landingUrls.groupCompleteTask,
          input,
        );
      },
    }),
  }),
});

export const { useCompleteGroupTaskMutation } = groupCompleteTaskApi;
