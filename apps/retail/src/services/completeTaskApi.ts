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
export const retailCompleteTaskApi = createApi({
  reducerPath: "retailCompleteTaskApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    completeRetailTask: build.mutation<CompleteTaskResult, CompleteTaskInput>({
      async queryFn(input, _api, _extra, baseQuery) {
        return await mutateCompleteTask(
          baseQuery as CompleteTaskBaseQuery,
          landingUrls.retailCompleteTask,
          input,
        );
      },
    }),
  }),
});

export const { useCompleteRetailTaskMutation } = retailCompleteTaskApi;
