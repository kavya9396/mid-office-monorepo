import {
  encodeBase64,
  getSessionUser,
  getToken,
  hasChangedPassword,
  markPasswordChanged,
  useMock,
} from "@insurance-poc/utils";
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
  firstLogin: boolean;
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

/** Wire shape shared by mock JSON and the real Apigee login API. */
export type LoginApiEnvelope = {
  response_code: number;
  error: boolean;
  message: string;
  data: {
    token: string;
    expiresIn?: number;
    refreshToken?: string | null;
    refreshExpiresIn?: number;
    username: string;
    displayName?: string;
    firstLogin?: boolean;
    firstLoginAt?: string | null;
    lastLoginAt?: string | null;
    mustChangePassword?: boolean;
    roles?: string[];
    authorizedBusinessTypes?: BusinessType[];
  } | null;
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

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

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

function unauthorized(message: string): LoginResult {
  return { status: "UNAUTHORIZED", message, user: null };
}

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charAt(end - 1) === "/") {
    end -= 1;
  }
  return value.slice(0, end);
}

/** Uses VITE_BASE_URL as-is (same host/path you set in .env / Postman). */
function authUrl(path: string): string {
  const baseUrl = stripTrailingSlashes(readEnv(import.meta.env.VITE_BASE_URL));
  if (baseUrl.length === 0) {
    throw new Error("VITE_BASE_URL is not configured.");
  }
  return `${baseUrl}${path}`;
}

/** Builds `Basic base64(username:password)` from env for Apigee. */
function basicAuthorization(): string {
  const username = readEnv(import.meta.env.VITE_AUTH_BASIC_USERNAME);
  const password = readEnv(import.meta.env.VITE_AUTH_BASIC_PASSWORD);
  if (username.length === 0 || password.length === 0) {
    throw new Error("Auth credentials are not configured.");
  }
  const credentials = `${username}:${password}`;
  return `Basic ${btoa(credentials)}`;
}

/**
 * Apigee login/forgot/reset use X-Apigee-Authorization with Basic.
 * Change-password uses Authorization with Bearer (user JWT).
 */
function authRequestHeaders(authorization: string): HeadersInit {
  const isBasic = authorization.startsWith("Basic ");
  return {
    accept: "*/*",
    "Content-Type": "application/json",
    ...(isBasic
      ? { "X-Apigee-Authorization": authorization }
      : { Authorization: authorization }),
  };
}

function messageFromPayload(value: unknown): string {
  if (!isRecord(value)) return "";

  const direct = [value.message, value.errorMessage, value.error_description, value.error]
    .map(readText)
    .find((item) => item.length > 0);
  if (direct) return direct;

  if (isRecord(value.error)) {
    const nested = messageFromPayload(value.error);
    if (nested.length > 0) return nested;
  }
  if (isRecord(value.data)) return messageFromPayload(value.data);
  if (isRecord(value.fault)) return readText(value.fault.faultstring);
  return "";
}

function isFailedAuthEnvelope(error: unknown, responseCode: number): boolean {
  if (error === true) return true;
  if (responseCode === 0) return false;
  return responseCode < 200 || responseCode >= 300;
}

function readStringRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((role): role is string => typeof role === "string");
}

function readAuthorizedBusinessTypes(
  value: unknown,
  fallback: BusinessType,
): BusinessType[] {
  if (!Array.isArray(value)) return [fallback];
  const fromApi = value.filter(
    (item): item is BusinessType => typeof item === "string" && isBusinessType(item),
  );
  return fromApi.length > 0 ? fromApi : [fallback];
}

function buildLoginSuccess(
  data: Record<string, unknown>,
  message: string,
  businessType: BusinessType,
): LoginResult {
  const accessToken = readText(data.token);
  const username = readText(data.username);
  if (accessToken.length === 0 || username.length === 0) {
    throw new Error("Authentication token was not returned.");
  }

  const authorizedBusinessTypes = readAuthorizedBusinessTypes(
    data.authorizedBusinessTypes,
    businessType,
  );
  if (!authorizedBusinessTypes.includes(businessType)) {
    return unauthorized(
      `You are not authorized for ${businessType}. Choose a business you can access.`,
    );
  }

  return {
    status: "SUCCESS",
    message: message.length > 0 ? message : "Login successful",
    accessToken,
    refreshToken: readText(data.refreshToken),
    firstLogin: data.firstLogin === true,
    mustChangePassword: data.mustChangePassword === true,
    businessType,
    user: {
      userId: username,
      displayName: readText(data.displayName) || username,
      authorizedBusinessTypes,
      roles: readStringRoles(data.roles),
    },
  };
}

/**
 * Single parser for mock and real login responses.
 * Expected wire shape:
 * { response_code, error, message, data: { token, username, refreshToken?, mustChangePassword?, roles?, ... } }
 */
function readLoginResponse(value: unknown, businessType: BusinessType): LoginResult {
  if (!isRecord(value)) {
    throw new Error("Login response is not in the expected format.");
  }

  const message = readText(value.message);
  const responseCode = typeof value.response_code === "number" ? value.response_code : 0;
  if (isFailedAuthEnvelope(value.error, responseCode)) {
    return failure(message.length > 0 ? message : "Unable to sign in.");
  }

  if (!isRecord(value.data)) {
    throw new Error("Login response is not in the expected format.");
  }

  return buildLoginSuccess(value.data, message, businessType);
}

function hasLoginEnvelopeShape(payload: unknown): payload is Record<string, unknown> {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.message === "string" ||
    typeof payload.error === "boolean" ||
    typeof payload.response_code === "number"
  );
}

function parseLoginPayload(
  payload: unknown,
  businessType: BusinessType,
  responseOk: boolean,
): LoginResult {
  if (!hasLoginEnvelopeShape(payload)) {
    if (!responseOk) {
      const message = messageFromPayload(payload);
      return failure(message.length > 0 ? message : "Unable to sign in.");
    }
    return readLoginResponse(payload, businessType);
  }

  try {
    return readLoginResponse(payload, businessType);
  } catch (reason: unknown) {
    const fromApi = messageFromPayload(payload);
    if (fromApi.length > 0) return failure(fromApi);
    if (!responseOk) return failure("Unable to sign in.");
    throw reason;
  }
}

/** Builds the same envelope the real API returns so mock/real share one parser. */
function buildMockLoginEnvelope(userId: string): LoginApiEnvelope {
  const mockUser = loginMock.users.find((user) => user.userId === userId);
  if (!mockUser) {
    return {
      response_code: 401,
      error: true,
      message: "Login failed. Check the user ID and try again.",
      data: null,
    };
  }

  const passwordAlreadyChanged = hasChangedPassword(userId);
  const firstLogin = mockUser.firstLogin === true && !passwordAlreadyChanged;
  const mustChangePassword =
    (mockUser.mustChangePassword === true || firstLogin) && !passwordAlreadyChanged;
  const forcePasswordChange = firstLogin || mustChangePassword;
  const token = (forcePasswordChange ? loginMock.token.restricted : loginMock.token.access).trim();

  if (token.length === 0) {
    return {
      response_code: 500,
      error: true,
      message: "Authentication token was not returned.",
      data: null,
    };
  }

  return {
    response_code: 200,
    error: false,
    message: "Login successful",
    data: {
      token,
      expiresIn: forcePasswordChange ? 600 : 1200,
      refreshToken: forcePasswordChange ? null : loginMock.token.refresh.trim(),
      refreshExpiresIn: forcePasswordChange ? 0 : 300,
      username: mockUser.userId,
      displayName: mockUser.displayName,
      firstLogin,
      firstLoginAt: mockUser.firstLoginAt ?? null,
      lastLoginAt: forcePasswordChange ? null : (mockUser.lastLoginAt ?? "2026-10-06T14:10:20"),
      mustChangePassword,
      roles: mockUser.roles,
      authorizedBusinessTypes: mockUser.authorizedBusinessTypes.filter(isBusinessType),
    },
  };
}

function mockLogin(userId: string, businessType: BusinessType): LoginResult {
  return readLoginResponse(buildMockLoginEnvelope(userId), businessType);
}

async function realLogin(request: LoginRequest): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch(authUrl(LOGIN_PATH), {
      method: "POST",
      headers: authRequestHeaders(basicAuthorization()),
      body: JSON.stringify({
        username: encodeBase64(request.userId),
        password: encodeBase64(request.password),
      }),
    });
  } catch (reason: unknown) {
    const detail = reason instanceof Error ? reason.message : "Network error";
    return failure(
      `Unable to reach the login API (${detail}). Check VPN/DNS and VITE_BASE_URL.`,
    );
  }

  const text = (await response.text()).trim();
  if (text.length === 0) return failure("Unable to sign in.");

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return failure(text);
  }

  return parseLoginPayload(payload, request.businessType, response.ok);
}

function mockForgotPassword(userId: string): AuthActionResponse {
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

  const failed = value.error === true || isFailedAuthEnvelope(false, value.response_code);
  return {
    response_code: value.response_code,
    error: failed,
    message,
    data: null,
  };
}

function toAuthActionError(status: number, message: string): AuthActionResponse {
  return {
    response_code: status,
    error: true,
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
    headers: authRequestHeaders(authorization),
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
    return toAuthActionError(response.status, text);
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
  if (message.length > 0) return toAuthActionError(response.status, message);

  throw new Error(`${action} response is not in the expected format.`);
}

export async function fetchForgotPassword(
  request: ForgotPasswordRequest,
): Promise<AuthActionResponse> {
  const userId = request.userId.trim();
  if (useMock) {
    await wait(200);
    return mockForgotPassword(userId);
  }
  return postAuthAction(FORGOT_PASSWORD_PATH, { userId }, "Forgot password");
}

function mockResetPassword(token: string): AuthActionResponse {
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
): Promise<AuthActionResponse> {
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

function mockChangePassword(request: ChangePasswordRequest): AuthActionResponse {
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
): Promise<AuthActionResponse> {
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

/**
 * Retail/Group guards re-check access for the target business.
 * Mock: same login envelope/parser as login.
 * Real: no separate authorize API yet — trust the session established by login.
 */
export async function authorizeBusiness(
  userId: string,
  businessType: BusinessType,
): Promise<LoginResult> {
  await wait(200);

  if (useMock) {
    return mockLogin(userId, businessType);
  }

  const token = getToken()?.trim() ?? "";
  const user = getSessionUser();
  if (token.length === 0 || user?.userId !== userId) {
    return failure("Session expired. Please sign in again.");
  }

  return {
    status: "SUCCESS",
    message: "Authorized",
    accessToken: token,
    refreshToken: "",
    firstLogin: false,
    mustChangePassword: false,
    businessType,
    user: {
      userId: user.userId,
      displayName: user.displayName,
      authorizedBusinessTypes: [businessType],
      roles: [],
    },
  };
}
