import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  fetchChangePassword,
  fetchForgotPassword,
  fetchLogin,
  fetchResetPassword,
  type ChangePasswordRequest,
  type ChangePasswordResponse,
  type ForgotPasswordRequest,
  type ForgotPasswordResponse,
  type LoginRequest,
  type LoginSuccess,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from "./loginService";

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
    forgotPassword: build.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      async queryFn(request) {
        try {
          const result = await fetchForgotPassword(request);
          if (result.error) {
            return { error: result.message };
          }
          return { data: result };
        } catch (reason: unknown) {
          const message =
            reason instanceof Error ? reason.message : "Unable to send the reset link.";
          return { error: message };
        }
      },
    }),
    resetPassword: build.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      async queryFn(request) {
        try {
          const result = await fetchResetPassword(request);
          if (result.error) {
            return { error: result.message };
          }
          return { data: result };
        } catch (reason: unknown) {
          const message =
            reason instanceof Error ? reason.message : "Unable to reset the password.";
          return { error: message };
        }
      },
    }),
    changePassword: build.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      async queryFn(request) {
        try {
          const result = await fetchChangePassword(request);
          if (result.error) {
            return { error: result.message };
          }
          return { data: result };
        } catch (reason: unknown) {
          const message =
            reason instanceof Error ? reason.message : "Unable to change the password.";
          return { error: message };
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
} = authApi;
