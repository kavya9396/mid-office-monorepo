import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import changePasswordMock from "../modules/login/mock/changePassword.json";
import forgotPasswordMock from "../modules/login/mock/forgotPassword.json";
import loginMock from "../modules/login/mock/login.json";
import logoutMock from "../modules/login/mock/logout.json";
import resetPasswordMock from "../modules/login/mock/resetPassword.json";
import type { LoginResult, LoginSuccess } from "./loginService";

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

const BASIC_USER = "apigee-user";
const BASIC_PASSWORD = "apigee-secret";

function expectSuccess(result: LoginResult): asserts result is LoginSuccess {
  expect(result.status).toBe("SUCCESS");
  if (result.status !== "SUCCESS") {
    throw new Error(result.message);
  }
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error("Expected a JSON object.");
  }
  return value;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`${key} was not a string.`);
  }
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

async function loadLogin() {
  vi.resetModules();
  return import("./loginService");
}

async function runMock<T>(work: () => Promise<T>): Promise<T> {
  const pending = work();
  await vi.runAllTimersAsync();
  return pending;
}

describe("login module", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("VITE_AUTH_BASIC_USERNAME", BASIC_USER);
    vi.stubEnv("VITE_AUTH_BASIC_PASSWORD", BASIC_PASSWORD);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  describe("login", () => {
    beforeEach(() => {
      authMode.useMock = true;
      vi.useFakeTimers();
    });

    it("signs in any mock user that reached the service", async () => {
      const { fetchLogin } = await loadLogin();
      const result = await runMock(() =>
        fetchLogin({ userId: "LDAP99999", password: "NewerPass@1234", businessType: "RETAIL" }),
      );

      expectSuccess(result);
      expect(result.user.userId).toBe("LDAP99999");
      expect(result.businessType).toBe("RETAIL");
      expect(result.lastLoginAt).toBe("2026-10-06T14:10:20");
    });

    it("signs in a retail user", async () => {
      const { fetchLogin } = await loadLogin();
      const result = await runMock(() =>
        fetchLogin({ userId: "UW001", password: "secret", businessType: "RETAIL" }),
      );

      expectSuccess(result);
      expect(result.accessToken).toBe(loginMock.token.access);
      expect(result.refreshToken).toBe(loginMock.token.refresh);
      expect(result.firstLogin).toBe(false);
      expect(result.mustChangePassword).toBe(false);
      expect(result.businessType).toBe("RETAIL");
      expect(result.lastLoginAt).toBe(loginMock.users[1]?.lastLoginAt);
      expect(result.user).toMatchObject({
        userId: "UW001",
        displayName: "Retail Underwriter",
        authorizedBusinessTypes: ["RETAIL"],
      });
    });

    it("opens the business selected on the login form", async () => {
      const { fetchLogin } = await loadLogin();
      const result = await runMock(() =>
        fetchLogin({ userId: "UW001", password: "NewerPass@1234", businessType: "GROUP" }),
      );

      expectSuccess(result);
      expect(result.businessType).toBe("GROUP");
      expect(result.user.authorizedBusinessTypes).toContain("GROUP");
    });

    it("requires a password change on first login, then allows a normal login", async () => {
      const { fetchLogin, fetchChangePassword } = await loadLogin();
      const { setSessionUser } = await import("@insurance-poc/utils");

      const first = await runMock(() =>
        fetchLogin({ userId: "LDAP12345", password: "NewerPass@1234", businessType: "RETAIL" }),
      );
      expectSuccess(first);
      expect(first.firstLogin).toBe(true);
      expect(first.mustChangePassword).toBe(true);
      expect(first.accessToken).toBe(loginMock.token.restricted);
      expect(first.refreshToken).toBe("");
      expect(first.lastLoginAt).toBe("");

      setSessionUser({ userId: "LDAP12345", displayName: "LDAP12345" });
      const changed = await runMock(() =>
        fetchChangePassword({ oldPassword: "old-password", newPassword: "new-password" }),
      );
      expect(changed.error).toBe(false);

      const second = await runMock(() =>
        fetchLogin({ userId: "LDAP12345", password: "NewerPass@1234", businessType: "RETAIL" }),
      );
      expectSuccess(second);
      expect(second.firstLogin).toBe(false);
      expect(second.mustChangePassword).toBe(false);
      expect(second.accessToken).toBe(loginMock.token.access);
    });

    it("posts Base64 credentials and reads a successful API login", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          response_code: 200,
          error: false,
          message: "Login successful",
          data: {
            token: "access-token",
            refreshToken: "refresh-token",
            username: "UW001",
            displayName: "Retail Underwriter",
            firstLogin: false,
            mustChangePassword: false,
            lastLoginAt: "2026-10-06T14:10:20",
            roles: ["CVT_POOL"],
            authorizedBusinessTypes: ["RETAIL"],
          },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { fetchLogin } = await loadLogin();
      const { encodeBase64 } = await import("@insurance-poc/utils");

      const result = await fetchLogin({
        userId: "UW001",
        password: "secret",
        businessType: "RETAIL",
      });

      expectSuccess(result);
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.lastLoginAt).toBe("2026-10-06T14:10:20");
      const posted = postedRequest(fetchMock);
      expect(posted.url).toBe(authMode.urls.login);
      expect(posted.headers.get("X-Apigee-Authorization")).toBe(
        `Basic ${btoa(`${BASIC_USER}:${BASIC_PASSWORD}`)}`,
      );
      expect(posted.headers.get("Authorization")).toBeNull();
      expect(readString(posted.body, "username")).toBe(encodeBase64("UW001"));
      expect(readString(posted.body, "password")).toBe(encodeBase64("secret"));
    });

    it("returns the API failure message", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockResolvedValue(
          jsonResponse(
            {
              response_code: 401,
              error: true,
              message: "Invalid credentials",
              data: null,
            },
            401,
          ),
        ),
      );
      const { fetchLogin } = await loadLogin();

      const result = await fetchLogin({
        userId: "UW001",
        password: "wrong",
        businessType: "RETAIL",
      });

      expect(result).toEqual({
        status: "FAILURE",
        message: "Invalid credentials",
        user: null,
      });
    });

    it("reports a network failure without throwing", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockRejectedValue(new Error("Failed to fetch")),
      );
      const { fetchLogin } = await loadLogin();

      const result = await fetchLogin({
        userId: "UW001",
        password: "secret",
        businessType: "RETAIL",
      });

      expect(result.status).toBe("FAILURE");
      if (result.status === "SUCCESS") throw new Error("expected failure");
      expect(result.message).toContain("Failed to fetch");
      expect(result.message).toContain("VITE_BASE_URL");
    });
  });

  describe("authorize business", () => {
    beforeEach(() => {
      authMode.useMock = true;
      vi.useFakeTimers();
    });

    it("keeps the selected business after a successful login session", async () => {
      const { authorizeBusiness } = await loadLogin();
      const { setSessionUser, setToken } = await import("@insurance-poc/utils");
      setToken("mock-jwt-token");
      setSessionUser({ userId: "UW001", displayName: "Retail Underwriter" });

      const result = await runMock(() => authorizeBusiness("UW001", "RETAIL"));

      expectSuccess(result);
      expect(result.businessType).toBe("RETAIL");
      expect(result.user.userId).toBe("UW001");
    });

    it("rejects a missing session", async () => {
      const { authorizeBusiness } = await loadLogin();
      const result = await runMock(() => authorizeBusiness("UW001", "RETAIL"));

      expect(result).toEqual({
        status: "FAILURE",
        message: "Session expired. Please sign in again.",
        user: null,
      });
    });
  });

  describe("forgot password", () => {
    beforeEach(() => {
      authMode.useMock = true;
      vi.useFakeTimers();
    });

    it("sends a reset link for a known user", async () => {
      const { fetchForgotPassword } = await loadLogin();
      const result = await runMock(() => fetchForgotPassword({ userId: "  uw001  " }));

      expect(result).toEqual({
        response_code: forgotPasswordMock.success.response_code,
        error: false,
        message: forgotPasswordMock.success.message,
        data: null,
      });
    });

    it("returns the mock failure for an unknown user", async () => {
      const { fetchForgotPassword } = await loadLogin();
      const result = await runMock(() => fetchForgotPassword({ userId: "nobody@example.com" }));

      expect(result).toEqual({
        response_code: forgotPasswordMock.failure.response_code,
        error: true,
        message: forgotPasswordMock.failure.message,
        data: null,
      });
    });

    it("posts the trimmed user id to the forgot-password API", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(forgotPasswordMock.success),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { fetchForgotPassword } = await loadLogin();

      const result = await fetchForgotPassword({ userId: "  UW001  " });

      expect(result.error).toBe(false);
      expect(result.message).toBe(forgotPasswordMock.success.message);
      const posted = postedRequest(fetchMock);
      expect(posted.url).toBe(authMode.urls.forgotPassword);
      expect(posted.headers.get("X-Apigee-Authorization")).toContain("Basic ");
      expect(readString(posted.body, "userId")).toBe("UW001");
    });
  });

  describe("reset password", () => {
    beforeEach(() => {
      authMode.useMock = true;
      vi.useFakeTimers();
    });

    it("resets a password for a known token", async () => {
      const token = resetPasswordMock.knownTokens[0];
      if (!token) throw new Error("Reset fixture is missing a token.");
      const { fetchResetPassword } = await loadLogin();
      const result = await runMock(() =>
        fetchResetPassword({ token: `  ${token}  `, newPassword: "new-password" }),
      );

      expect(result).toEqual({
        response_code: resetPasswordMock.success.response_code,
        error: false,
        message: resetPasswordMock.success.message,
        data: null,
      });
    });

    it("rejects an unknown token", async () => {
      const { fetchResetPassword } = await loadLogin();
      const result = await runMock(() =>
        fetchResetPassword({ token: "missing-token", newPassword: "new-password" }),
      );

      expect(result).toEqual({
        response_code: resetPasswordMock.failure.response_code,
        error: true,
        message: resetPasswordMock.failure.message,
        data: null,
      });
    });

    it("posts the token and new password to the reset-password API", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(resetPasswordMock.success),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { fetchResetPassword } = await loadLogin();

      const result = await fetchResetPassword({
        token: " reset-token ",
        newPassword: "new-password",
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe(resetPasswordMock.success.message);
      const posted = postedRequest(fetchMock);
      expect(posted.url).toBe(authMode.urls.resetPassword);
      expect(readString(posted.body, "token")).toBe("reset-token");
      expect(readString(posted.body, "newPassword")).toBe("new-password");
    });
  });

  describe("change password", () => {
    beforeEach(() => {
      authMode.useMock = true;
      vi.useFakeTimers();
    });

    it("rejects a new password that is too short", async () => {
      const { fetchChangePassword } = await loadLogin();
      const result = await runMock(() =>
        fetchChangePassword({ oldPassword: "old-password", newPassword: "short" }),
      );

      expect(result).toEqual({
        response_code: changePasswordMock.policyFailure.response_code,
        error: true,
        message: changePasswordMock.policyFailure.message,
        data: null,
      });
    });

    it("accepts a new password that meets the policy", async () => {
      const { fetchChangePassword } = await loadLogin();
      const result = await runMock(() =>
        fetchChangePassword({ oldPassword: "old-password", newPassword: "long-enough" }),
      );

      expect(result).toEqual({
        response_code: changePasswordMock.success.response_code,
        error: false,
        message: changePasswordMock.success.message,
        data: null,
      });
    });

    it("requires a signed-in session before calling the API", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>();
      vi.stubGlobal("fetch", fetchMock);
      const { fetchChangePassword } = await loadLogin();

      await expect(
        fetchChangePassword({ oldPassword: "old-password", newPassword: "new-password" }),
      ).rejects.toThrow("Sign in before changing your password.");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("posts the current and new password with the user bearer token", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(changePasswordMock.success),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { fetchChangePassword } = await loadLogin();
      const { setToken } = await import("@insurance-poc/utils");
      setToken("user-jwt");

      const result = await fetchChangePassword({
        oldPassword: "old-password",
        newPassword: "new-password",
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe(changePasswordMock.success.message);
      const posted = postedRequest(fetchMock);
      expect(posted.url).toBe(authMode.urls.changePassword);
      expect(posted.headers.get("Authorization")).toBe("Bearer user-jwt");
      expect(posted.headers.get("X-Apigee-Authorization")).toBeNull();
      expect(readString(posted.body, "oldPassword")).toBe("old-password");
      expect(readString(posted.body, "newPassword")).toBe("new-password");
    });
  });

  describe("logout", () => {
    beforeEach(() => {
      authMode.useMock = true;
      vi.useFakeTimers();
    });

    it("returns the logged-out response when a refresh token is present", async () => {
      const { fetchLogout } = await loadLogin();
      const { setRefreshToken } = await import("@insurance-poc/utils");
      setRefreshToken("UNySFLgYgMokV7ty3i7bK_K-0amHmAjhDqx8DXXwwis");

      const result = await runMock(() => fetchLogout());

      expect(result).toEqual({
        response_code: logoutMock.success.response_code,
        error: false,
        message: logoutMock.success.message,
        data: null,
      });
    });

    it("rejects logout when the refresh token is missing", async () => {
      const { fetchLogout } = await loadLogin();
      const result = await runMock(() => fetchLogout());

      expect(result).toEqual({
        response_code: logoutMock.failure.response_code,
        error: true,
        message: logoutMock.failure.message,
        data: null,
      });
    });

    it("requires a signed-in session before calling the API", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>();
      vi.stubGlobal("fetch", fetchMock);
      const { fetchLogout } = await loadLogin();

      await expect(fetchLogout()).rejects.toThrow("Sign in before logging out.");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("posts the refresh token with the user bearer token", async () => {
      authMode.useMock = false;
      vi.useRealTimers();
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(logoutMock.success),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { fetchLogout } = await loadLogin();
      const { setRefreshToken, setToken } = await import("@insurance-poc/utils");
      setToken("user-jwt");
      setRefreshToken("UNySFLgYgMokV7ty3i7bK_K-0amHmAjhDqx8DXXwwis");

      const result = await fetchLogout();

      expect(result.error).toBe(false);
      expect(result.message).toBe(logoutMock.success.message);
      const posted = postedRequest(fetchMock);
      expect(posted.url).toBe(authMode.urls.logout);
      expect(posted.headers.get("Authorization")).toBe("Bearer user-jwt");
      expect(posted.headers.get("accept")).toBe("*/*");
      expect(posted.headers.get("Content-Type")).toBe("application/json");
      expect(readString(posted.body, "refreshToken")).toBe(
        "UNySFLgYgMokV7ty3i7bK_K-0amHmAjhDqx8DXXwwis",
      );
    });
  });
});
