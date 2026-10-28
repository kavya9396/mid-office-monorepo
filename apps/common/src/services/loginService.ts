import { encodeBase64, getSessionUser, getToken, hasChangedPassword, markPasswordChanged, useMock } from "@insurance-poc/utils";
import changePasswordMock from "../modules/login/mock/changePassword.json";
import forgotPasswordMock from "../modules/login/mock/forgotPassword.json";
import loginMock from "../modules/login/mock/login.json";
import resetPasswordMock from "../modules/login/mock/resetPassword.json";

export type BusinessType = "RETAIL" | "GROUP";

export interface AuthenticatedUser {
  userId: string;
  displayName: string;
  authorizedBusinessTypes: BusinessType[];
  roles: string[];
}

export type LoginSuccess = {
  status: "SUCCESS";
  message: string;
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  businessType: BusinessType;
  user: AuthenticatedUser;
};

export type LoginResult =
  | LoginSuccess
  | {
      status: "FAILURE" | "UNAUTHORIZED";
      message: string;
      user: null;
    };

export type LoginRequest = {
  userId: string;
  password: string;
  businessType: BusinessType;
};

const LOGIN_PATH = "/v1/auth/login";
const CHANGE_PASSWORD_PATH = "/v1/auth/change-password";
const FORGOT_PASSWORD_PATH = "/v1/auth/forgot-password";
const RESET_PASSWORD_PATH = "/v1/auth/reset-password";

export type AuthActionResponse = {
  response_code: number;
  error: boolean;
  message: string;
  data: null;
};

export type ForgotPasswordRequest = {
  userId: string;
};

export type ForgotPasswordResponse = AuthActionResponse;

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ResetPasswordResponse = AuthActionResponse;

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = AuthActionResponse;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isBusinessType(value: string): value is BusinessType {
  return value === "RETAIL" || value === "GROUP";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readEnv(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function failure(message: string): LoginResult {
  return { status: "FAILURE", message, user: null };
}

function mockLogin(userId: string, businessType: BusinessType): LoginResult {
  const mockUser = loginMock.users.find((user) => user.userId === userId);
  if (!mockUser) {
    return failure("Login failed. Check the user ID and try again.");
  }

  const authorizedBusinessTypes = mockUser.authorizedBusinessTypes.filter(isBusinessType);
  const mustChangePassword = mockUser.mustChangePassword === true && !hasChangedPassword(userId);
  const accessToken = (mustChangePassword ? loginMock.restrictedToken : loginMock.accessToken).trim();
  const refreshToken = mustChangePassword ? "" : loginMock.refreshToken.trim();
  if (accessToken.length === 0) {
    return failure("Authentication token was not returned.");
  }

  return {
    status: "SUCCESS",
    message: "Login successful",
    accessToken,
    refreshToken,
    mustChangePassword,
    businessType,
    user: {
      userId: mockUser.userId,
      displayName: mockUser.displayName,
      authorizedBusinessTypes,
      roles: mockUser.roles,
    },
  };
}

function authUrl(path: string): string {
  const baseUrl = readEnv(import.meta.env.VITE_AUTH_API_URL).replace(/\/+$/, "");
  if (baseUrl.length === 0) {
    throw new Error("Auth API URL is not configured.");
  }
  return `${baseUrl}${path}`;
}

function basicAuthorization(): string {
  const username = readEnv(import.meta.env.VITE_AUTH_BASIC_USERNAME);
  const password = readEnv(import.meta.env.VITE_AUTH_BASIC_PASSWORD);
  if (username.length === 0 || password.length === 0) {
    throw new Error("Auth credentials are not configured.");
  }
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function messageFromPayload(value: unknown): string {
  if (!isRecord(value)) return "";

  const direct = [
    value.message,
    value.errorMessage,
    value.error_description,
    value.error,
  ].map(readText).find((item) => item.length > 0);
  if (direct) return direct;

  if (isRecord(value.error)) {
    const nested = messageFromPayload(value.error);
    if (nested.length > 0) return nested;
  }
  if (isRecord(value.data)) {
    return messageFromPayload(value.data);
  }
  if (isRecord(value.fault)) {
    return readText(value.fault.faultstring);
  }
  return "";
}

function readLoginResponse(value: unknown, businessType: BusinessType): LoginResult {
  if (!isRecord(value)) {
    throw new Error("Login response is not in the expected format.");
  }

  const message = readText(value.message);
  const responseCode = typeof value.response_code === "number" ? value.response_code : 0;
  const failed = value.error === true || (responseCode !== 0 && (responseCode < 200 || responseCode >= 300));
  if (failed) {
    return failure(message.length > 0 ? message : "Unable to sign in.");
  }

  if (!isRecord(value.data)) {
    throw new Error("Login response is not in the expected format.");
  }

  const accessToken = readText(value.data.token);
  const username = readText(value.data.username);
  if (accessToken.length === 0 || username.length === 0) {
    throw new Error("Authentication token was not returned.");
  }

  const roles = Array.isArray(value.data.roles)
    ? value.data.roles.filter((role): role is string => typeof role === "string")
    : [];

  return {
    status: "SUCCESS",
    message: message.length > 0 ? message : "Login successful",
    accessToken,
    refreshToken: readText(value.data.refreshToken),
    mustChangePassword: value.data.mustChangePassword === true,
    businessType,
    user: {
      userId: username,
      displayName: username,
      authorizedBusinessTypes: [businessType],
      roles,
    },
  };
}

async function realLogin(request: LoginRequest): Promise<LoginResult> {
  const response = await fetch(authUrl(LOGIN_PATH), {
    method: "POST",
    headers: {
      Authorization: basicAuthorization(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: encodeBase64(request.userId),
      password: encodeBase64(request.password),
    }),
  });

  const text = (await response.text()).trim();
  if (text.length === 0) return failure("Unable to sign in.");

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return failure(text);
  }

  if (!response.ok) {
    const message = messageFromPayload(payload);
    return failure(message.length > 0 ? message : "Unable to sign in.");
  }

  return readLoginResponse(payload, request.businessType);
}

function mockForgotPassword(userId: string): ForgotPasswordResponse {
  const known = forgotPasswordMock.knownUserIds.some(
    (id) => id.toLowerCase() === userId.toLowerCase(),
  );
  const payload = known ? forgotPasswordMock.success : forgotPasswordMock.failure;
  return {
    response_code: payload.response_code,
    error: payload.error,
    message: payload.message,
    data: null,
  };
}

function readAuthActionResponse(value: unknown, action: string): AuthActionResponse {
  if (
    !isRecord(value) ||
    typeof value.response_code !== "number" ||
    typeof value.error !== "boolean"
  ) {
    throw new Error(`${action} response is not in the expected format.`);
  }

  const message = readText(value.message);
  if (message.length === 0) {
    throw new Error(`${action} response did not include a message.`);
  }

  const failed = value.error || value.response_code < 200 || value.response_code >= 300;
  return {
    response_code: value.response_code,
    error: failed,
    message,
    data: null,
  };
}

async function postAuthAction(
  path: string,
  body: unknown,
  action: string,
  authorization = basicAuthorization(),
): Promise<AuthActionResponse> {
  const response = await fetch(authUrl(path), {
    method: "POST",
    headers: {
      Authorization: authorization,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = (await response.text()).trim();
  if (text.length === 0) {
    throw new Error(`${action} response did not include a message.`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return {
      response_code: response.status,
      error: true,
      message: text,
      data: null,
    };
  }

  if (
    isRecord(payload) &&
    typeof payload.response_code === "number" &&
    typeof payload.error === "boolean"
  ) {
    const result = readAuthActionResponse(payload, action);
    return response.ok ? result : { ...result, error: true };
  }

  const message = messageFromPayload(payload);
  if (message.length > 0) {
    return {
      response_code: response.status,
      error: true,
      message,
      data: null,
    };
  }

  throw new Error(`${action} response is not in the expected format.`);
}

async function realForgotPassword(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return postAuthAction(FORGOT_PASSWORD_PATH, { userId: request.userId }, "Forgot password");
}

export async function fetchForgotPassword(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const userId = request.userId.trim();
  if (useMock) {
    await wait(200);
    return mockForgotPassword(userId);
  }
  return realForgotPassword({ userId });
}

function mockResetPassword(token: string): ResetPasswordResponse {
  const known = resetPasswordMock.knownTokens.includes(token);
  const payload = known ? resetPasswordMock.success : resetPasswordMock.failure;
  return {
    response_code: payload.response_code,
    error: payload.error,
    message: payload.message,
    data: null,
  };
}

export async function fetchResetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const token = request.token.trim();
  if (useMock) {
    await wait(200);
    return mockResetPassword(token);
  }
  return postAuthAction(
    RESET_PASSWORD_PATH,
    { token, newPassword: request.newPassword },
    "Reset password",
  );
}

function mockChangePassword(request: ChangePasswordRequest): ChangePasswordResponse {
  if (request.newPassword.trim().length < 8) {
    return {
      response_code: changePasswordMock.policyFailure.response_code,
      error: changePasswordMock.policyFailure.error,
      message: changePasswordMock.policyFailure.message,
      data: null,
    };
  }

  return {
    response_code: changePasswordMock.success.response_code,
    error: changePasswordMock.success.error,
    message: changePasswordMock.success.message,
    data: null,
  };
}

export async function fetchChangePassword(
  request: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  if (useMock) {
    await wait(200);
    const result = mockChangePassword(request);
    if (!result.error) {
      const userId = getSessionUser()?.userId;
      if (userId) markPasswordChanged(userId);
    }
    return result;
  }

  const token = getToken()?.trim() ?? "";
  if (token.length === 0) {
    throw new Error("Sign in before changing your password.");
  }

  return postAuthAction(
    CHANGE_PASSWORD_PATH,
    { oldPassword: request.oldPassword, newPassword: request.newPassword },
    "Change password",
    `Bearer ${token}`,
  );
}

export async function fetchLogin(request: LoginRequest): Promise<LoginResult> {
  if (useMock) {
    await wait(200);
    return mockLogin(request.userId, request.businessType);
  }
  return realLogin(request);
}

export async function authorizeBusiness(
  userId: string,
  businessType: BusinessType,
): Promise<LoginResult> {
  await wait(200);
  return mockLogin(userId, businessType);
}
