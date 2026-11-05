import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchLogin, type LoginRequest, type LoginSuccess } from "./loginService";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery<string>(),
  endpoints: (build) => ({
    login: build.mutation<LoginSuccess, LoginRequest>({
      async queryFn(request) {
        try {
          const result = await fetchLogin(request);
          if (result.status !== "SUCCESS") {
            return { error: result.message };
          }
          return { data: result };
        } catch (reason: unknown) {
          const message = reason instanceof Error ? reason.message : "Unable to sign in.";
          return { error: message };
        }
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;
