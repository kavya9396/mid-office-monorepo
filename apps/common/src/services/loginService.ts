import { useMock } from "@insurance-poc/utils";
import loginMock from "../modules/login/mock/login.json";

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

  const accessToken = loginMock.accessToken.trim();
  const refreshToken = loginMock.refreshToken.trim();
  if (accessToken.length === 0) {
    return failure("Authentication token was not returned.");
  }

  return {
    status: "SUCCESS",
    message: "Login successful.",
    accessToken,
    refreshToken,
    businessType,
    user: {
      ...mockUser,
      authorizedBusinessTypes,
    },
  };
}

function loginUrl(): string {
  const baseUrl = readEnv(import.meta.env.VITE_AUTH_API_URL).replace(/\/+$/, "");
  if (baseUrl.length === 0) {
    throw new Error("Auth API URL is not configured.");
  }
  return `${baseUrl}${LOGIN_PATH}`;
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

async function readApiFailure(response: Response): Promise<LoginResult> {
  const fallback = "Unable to sign in.";
  try {
    const text = (await response.text()).trim();
    if (text.length === 0) return failure(fallback);
    if (!text.startsWith("{") && !text.startsWith("[")) return failure(text);

    const payload: unknown = JSON.parse(text);
    const message = messageFromPayload(payload);
    return failure(message.length > 0 ? message : fallback);
  } catch {
    return failure(fallback);
  }
}

function readLoginResponse(value: unknown, businessType: BusinessType): LoginSuccess {
  if (!isRecord(value)) {
    throw new Error("Login response is not in the expected format.");
  }

  const accessToken = readText(value.accessToken);
  const refreshToken = readText(value.refreshToken);
  const userId = readText(value.userId);
  if (accessToken.length === 0 || userId.length === 0) {
    throw new Error("Authentication token was not returned.");
  }

  const displayName = readText(value.displayName);
  return {
    status: "SUCCESS",
    message: "Login successful.",
    accessToken,
    refreshToken,
    businessType,
    user: {
      userId,
      displayName: displayName.length > 0 ? displayName : userId,
      authorizedBusinessTypes: [businessType],
      roles: [],
    },
  };
}

async function realLogin(request: LoginRequest): Promise<LoginResult> {
  const response = await fetch(loginUrl(), {
    method: "POST",
    headers: {
      Authorization: basicAuthorization(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: request.userId,
      password: request.password,
      businessType: request.businessType,
    }),
  });

  if (!response.ok) {
    return readApiFailure(response);
  }

  const payload: unknown = await response.json();
  return readLoginResponse(payload, request.businessType);
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
