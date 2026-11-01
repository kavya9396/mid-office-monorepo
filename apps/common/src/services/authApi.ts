import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  fetchChangePassword,
  fetchForgotPassword,
  fetchLogin,
  fetchLogout,
  fetchResetPassword,
  type AuthActionResponse,
  type ChangePasswordRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  type LoginSuccess,
  type ResetPasswordRequest,
} from "./loginService";

type QueryResult<T> = { data: T } | { error: string };

function queryError(reason: unknown, fallback: string): { error: string } {
  const message = reason instanceof Error ? reason.message : fallback;
  return { error: message };
}

function authActionQuery<TRequest>(
  run: (request: TRequest) => Promise<AuthActionResponse>,
  fallback: string,
): (request: TRequest) => Promise<QueryResult<AuthActionResponse>> {
  return async (request) => {
    try {
      const result = await run(request);
      if (result.error) return { error: result.message };
      return { data: result };
    } catch (reason: unknown) {
      return queryError(reason, fallback);
    }
  };
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery<string>(),
  endpoints: (build) => ({
    login: build.mutation<LoginSuccess, LoginRequest>({
      async queryFn(request) {
        try {
          const result = await fetchLogin(request);
          if (result.status !== "SUCCESS") {
            // Pass through API `message` so the login UI can show it.
            return { error: result.message || "Unable to sign in." };
          }
          return { data: result };
        } catch (reason: unknown) {
          return queryError(reason, "Unable to sign in.");
        }
      },
    }),
    forgotPassword: build.mutation<AuthActionResponse, ForgotPasswordRequest>({
      queryFn: authActionQuery(fetchForgotPassword, "Unable to send the reset link."),
    }),
    resetPassword: build.mutation<AuthActionResponse, ResetPasswordRequest>({
      queryFn: authActionQuery(fetchResetPassword, "Unable to reset the password."),
    }),
    changePassword: build.mutation<AuthActionResponse, ChangePasswordRequest>({
      queryFn: authActionQuery(fetchChangePassword, "Unable to change the password."),
    }),
    logout: build.mutation<AuthActionResponse, void>({
      async queryFn() {
        try {
          const result = await fetchLogout();
          if (result.error) return { error: result.message };
          return { data: result };
        } catch (reason: unknown) {
          return queryError(reason, "Unable to log out.");
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;
