import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMasterData, setMasterData } from "@insurance-poc/utils";
import { RedirectIfSession, RequirePasswordChange } from "../../routes/guards";
import { renderUi } from "../../test/renderUi";
import { ChangePasswordPage } from "./ChangePasswordPage";
import { LoginPage } from "./LoginPage";

const routes = vi.hoisted(() => ({ assignUrl: vi.fn() }));
const auth = vi.hoisted(() => ({
  login: vi.fn(),
  changePassword: vi.fn(),
}));
const masters = vi.hoisted(() => ({
  fetchAndStoreMasterData: vi.fn(),
}));

vi.mock("@insurance-poc/routes", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/routes")>("@insurance-poc/routes");
  return { ...actual, assignUrl: routes.assignUrl };
});

vi.mock("../../services/authApi", () => ({
  useLoginMutation: () => [auth.login],
  useChangePasswordMutation: () => [auth.changePassword],
  useForgotPasswordMutation: () => [vi.fn()],
}));

vi.mock("../../services/masterDataService", () => ({
  fetchAndStoreMasterData: masters.fetchAndStoreMasterData,
}));

const firstLoginUser = {
  username: "LDAP12345",
  displayName: "LDAP12345",
  authorizedBusinessTypes: ["RETAIL"] as const,
  roles: [] as string[],
};

function firstLoginSuccess() {
  return {
    unwrap: () =>
      Promise.resolve({
        status: "SUCCESS",
        message: "Logged in",
        accessToken: "restricted-token",
        refreshToken: "",
        sessionId: "session-1",
        firstLogin: true,
        mustChangePassword: true,
        lastLoginAt: "",
        businessType: "RETAIL",
        user: firstLoginUser,
      }),
  };
}

function secondLoginSuccess() {
  return {
    unwrap: () =>
      Promise.resolve({
        status: "SUCCESS",
        message: "Logged in",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        sessionId: "session-2",
        firstLogin: false,
        mustChangePassword: false,
        lastLoginAt: "2026-10-06T14:10:20",
        businessType: "RETAIL",
        user: firstLoginUser,
      }),
  };
}

function renderAuthRoutes() {
  return renderUi(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfSession>
              <LoginPage />
            </RedirectIfSession>
          }
        />
        <Route
          path="/change-password"
          element={
            <RequirePasswordChange>
              <ChangePasswordPage />
            </RequirePasswordChange>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

async function loginAs(user: ReturnType<typeof userEvent.setup>, password: string) {
  await user.type(screen.getByPlaceholderText("Enter your User ID"), "LDAP12345");
  await user.type(screen.getByPlaceholderText("Enter your Password"), password);
  await user.click(screen.getByRole("button", { name: "Log In" }));
}

describe("first login → change password → login again → inbox", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    auth.login.mockReset();
    auth.changePassword.mockReset();
    routes.assignUrl.mockReset();
    masters.fetchAndStoreMasterData.mockReset();
    masters.fetchAndStoreMasterData.mockImplementation(async () => {
      const payload = {
        data: {
          gender: [{ code: "M", description: "Male", value: "Male", isActive: "Y" }],
        },
        unknownTypes: [] as string[],
      };
      setMasterData(payload);
      return payload;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the full happy path without inbox navigation before password change", async () => {
    const user = userEvent.setup();
    auth.login.mockReturnValueOnce(firstLoginSuccess());
    auth.login.mockReturnValueOnce(secondLoginSuccess());
    auth.changePassword.mockReturnValue({
      unwrap: () => Promise.resolve({ error: false, message: "Password changed" }),
    });

    renderAuthRoutes();

    await loginAs(user, "OlderPass@1234");

    expect(await screen.findByText("Change your password")).toBeInTheDocument();
    expect(masters.fetchAndStoreMasterData).not.toHaveBeenCalled();
    expect(routes.assignUrl).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("firstLoginChangePending")).toBe("true");
    expect(sessionStorage.getItem("token")).toBe("restricted-token");

    await user.type(screen.getByPlaceholderText("Enter your current password"), "OlderPass@1234");
    await user.type(screen.getByPlaceholderText("Enter your new password"), "NewerPass@1234");
    await user.type(screen.getByPlaceholderText("Re-enter your new password"), "NewerPass@1234");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1800);

    await waitFor(() => {
      expect(screen.getByText("Log in to access your account")).toBeInTheDocument();
    });
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("firstLoginChangePending")).toBeNull();

    await loginAs(user, "NewerPass@1234");

    await waitFor(() => {
      expect(masters.fetchAndStoreMasterData).toHaveBeenCalledTimes(1);
      expect(routes.assignUrl).toHaveBeenCalledWith("/retail/inbox");
    });
    expect(sessionStorage.getItem("firstLoginChangePending")).toBeNull();
    expect(getMasterData()?.data.gender).toHaveLength(1);
  });
});
