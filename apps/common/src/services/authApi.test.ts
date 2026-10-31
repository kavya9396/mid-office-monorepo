import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import logoutMock from "../modules/login/mock/logout.json";

const REFRESH_TOKEN = "UNySFLgYgMokV7ty3i7bK_K-0amHmAjhDqx8DXXwwis";

const authMode = vi.hoisted(() => ({
  useMock: true,
  urls: {
    login: "https://auth.test/login",
    forgotPassword: "https://auth.test/forgot-password",
    resetPassword: "https://auth.test/reset-password",
    changePassword: "https://auth.test/change-password",
    logout: "https://auth.test/logout",
  },
}));

vi.mock("@insurance-poc/utils", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/utils")>(
    "@insurance-poc/utils",
  );
  return {
    ...actual,
    get useMock() {
      return authMode.useMock;
    },
    authUrls: {
      get login() {
        return authMode.urls.login;
      },
      get forgotPassword() {
        return authMode.urls.forgotPassword;
      },
      get resetPassword() {
        return authMode.urls.resetPassword;
      },
      get changePassword() {
        return authMode.urls.changePassword;
      },
      get logout() {
        return authMode.urls.logout;
      },
    },
  };
});

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected a JSON object.");
  return value;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${key} was not a string.`);
  return value;
}

function postedRequest(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): {
  url: string;
  body: Record<string, unknown>;
  headers: Headers;
} {
  const call = fetchMock.mock.calls[0];
  if (!call) throw new Error("fetch was not called.");
  const input = call[0];
  const init = call[1];
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const rawBody = init?.body;
  if (typeof rawBody !== "string") throw new Error("Expected a JSON request body.");
  return { url, body: asRecord(parseJson(rawBody)), headers: new Headers(init?.headers) };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadAuth() {
  vi.resetModules();
  const utils = await import("@insurance-poc/utils");
  const { authApi } = await import("./authApi");
  const store = configureStore({
    reducer: { [authApi.reducerPath]: authApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
  });
  return { authApi, store, ...utils };
}

async function runMock<T>(work: () => Promise<T>): Promise<T> {
  const pending = work();
  await vi.runAllTimersAsync();
  return pending;
}

describe("logout mutation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("VITE_AUTH_BASIC_USERNAME", "apigee-user");
    vi.stubEnv("VITE_AUTH_BASIC_PASSWORD", "apigee-secret");
    authMode.useMock = true;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the mock response when mock mode is on", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const { authApi, store, setRefreshToken, setToken } = await loadAuth();
    setToken("user-jwt");
    setRefreshToken(REFRESH_TOKEN);

    const result = await runMock(() => store.dispatch(authApi.endpoints.logout.initiate()));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.data).toEqual({
      response_code: logoutMock.success.response_code,
      error: false,
      message: logoutMock.success.message,
      data: null,
    });
    expect(sessionStorage.getItem("token")).toBe("user-jwt");
    expect(sessionStorage.getItem("refreshToken")).toBe(REFRESH_TOKEN);
  });

  it("returns the mock failure message and keeps the session", async () => {
    const { authApi, store, setSessionUser, setToken } = await loadAuth();
    setToken("user-jwt");
    setSessionUser({ userId: "UW001", displayName: "Retail Underwriter" });
    const result = await runMock(() => store.dispatch(authApi.endpoints.logout.initiate()));

    expect(result.error).toBe(logoutMock.failure.message);
    expect(sessionStorage.getItem("token")).toBe("user-jwt");
    expect(sessionStorage.getItem("userId")).toBe("UW001");
    expect(sessionStorage.getItem("displayName")).toBe("Retail Underwriter");
  });

  it("posts the refresh token to the real logout API when mock mode is off", async () => {
    authMode.useMock = false;
    vi.useRealTimers();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(logoutMock.success));
    vi.stubGlobal("fetch", fetchMock);
    const { authApi, store, setRefreshToken, setToken } = await loadAuth();
    setToken("user-jwt");
    setRefreshToken(REFRESH_TOKEN);

    const result = await store.dispatch(authApi.endpoints.logout.initiate());

    expect(result.data?.message).toBe(logoutMock.success.message);
    expect(result.data?.error).toBe(false);
    expect(result.data?.data).toBeNull();
    const posted = postedRequest(fetchMock);
    expect(posted.url).toBe(authMode.urls.logout);
    expect(posted.headers.get("Authorization")).toBe("Bearer user-jwt");
    expect(readString(posted.body, "refreshToken")).toBe(REFRESH_TOKEN);
  });

  it("surfaces the real API failure message", async () => {
    authMode.useMock = false;
    vi.useRealTimers();
    const failure = {
      response_code: 401,
      error: true,
      message: "Invalid refresh token",
      data: null,
    };
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(failure, 401)));
    const { authApi, store, setRefreshToken, setToken } = await loadAuth();
    setToken("user-jwt");
    setRefreshToken(REFRESH_TOKEN);

    const result = await store.dispatch(authApi.endpoints.logout.initiate());

    expect(result.error).toBe(failure.message);
    expect(sessionStorage.getItem("token")).toBe("user-jwt");
    expect(sessionStorage.getItem("refreshToken")).toBe(REFRESH_TOKEN);
  });

  it("clears every session value after logout", async () => {
    const { setRefreshToken, setSessionUser, setToken, clearSession } = await loadAuth();
    setToken("user-jwt");
    setRefreshToken(REFRESH_TOKEN);
    setSessionUser({ userId: "UW001", displayName: "Retail Underwriter" });
    sessionStorage.setItem("masterData", "{}");

    clearSession();

    expect(sessionStorage.length).toBe(0);
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();
    expect(sessionStorage.getItem("userId")).toBeNull();
    expect(sessionStorage.getItem("displayName")).toBeNull();
    expect(sessionStorage.getItem("masterData")).toBeNull();
  });
});
