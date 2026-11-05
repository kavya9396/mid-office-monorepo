import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setFirstLoginChangePending,
  setSessionUser,
  setToken,
} from "@insurance-poc/utils";
import { renderUi } from "../../test/renderUi";
import { RequirePasswordChange } from "../../routes/guards";
import { ChangePasswordPage } from "./ChangePasswordPage";

const auth = vi.hoisted(() => ({
  changePassword: vi.fn(),
}));
const navigation = vi.hoisted(() => ({ replaceUrl: vi.fn() }));

vi.mock("@insurance-poc/routes", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/routes")>(
    "@insurance-poc/routes",
  );
  return { ...actual, replaceUrl: navigation.replaceUrl };
});

vi.mock("../../services/authApi", () => ({
  useChangePasswordMutation: () => [auth.changePassword],
}));

function renderChangePassword() {
  return renderUi(
    <MemoryRouter initialEntries={["/change-password"]}>
      <Routes>
        <Route
          path="/change-password"
          element={
            <RequirePasswordChange>
              <ChangePasswordPage />
            </RequirePasswordChange>
          }
        />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function seedPasswordChangeSession(userId = "LDAP12345") {
  setToken("access-token");
  setSessionUser({ userId, displayName: userId });
  setFirstLoginChangePending(true);
}

async function fillChangePassword(
  user: ReturnType<typeof userEvent.setup>,
  confirmPassword = "NewerPass@1234",
) {
  await user.type(screen.getByPlaceholderText("Enter your current password"), "OlderPass@1234");
  await user.type(screen.getByPlaceholderText("Enter your new password"), "NewerPass@1234");
  await user.type(screen.getByPlaceholderText("Re-enter your new password"), confirmPassword);
}

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    auth.changePassword.mockReset();
    navigation.replaceUrl.mockReset();
  });

  it("redirects to login when change-password was not opened from a first-login response", async () => {
    setToken("access-token");
    setSessionUser({ userId: "UW001", displayName: "Retail Underwriter" });
    renderChangePassword();
    await waitFor(() => {
      expect(navigation.replaceUrl).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Change your password")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("prefills the username from session and keeps it read-only", () => {
    seedPasswordChangeSession("NL123456");
    renderChangePassword();
    const usernameField = screen.getByDisplayValue("NL123456");
    expect(usernameField).toHaveValue("NL123456");
    expect(usernameField).toBeDisabled();
  });

  it("keeps Change password disabled when the confirmation does not match", async () => {
    seedPasswordChangeSession();
    const user = userEvent.setup();
    renderChangePassword();

    await fillChangePassword(user, "Mismatch@1234");
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeDisabled();
  });

  it("changes the password and returns to login after success", async () => {
    seedPasswordChangeSession();
    const user = userEvent.setup();
    auth.changePassword.mockReturnValue({
      unwrap: () => Promise.resolve({ error: false, message: "Password changed" }),
    });
    renderChangePassword();

    await fillChangePassword(user);
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(auth.changePassword).toHaveBeenCalledWith({
          username: "LDAP12345",
          oldPassword: "OlderPass@1234",
          newPassword: "NewerPass@1234",
        });
        expect(screen.getByText("Login screen")).toBeInTheDocument();
        expect(sessionStorage.getItem("token")).toBeNull();
      },
      { timeout: 2500 },
    );
  });

  it("shows the API error and stays on the form after a failed change", async () => {
    seedPasswordChangeSession();
    const user = userEvent.setup();
    auth.changePassword.mockReturnValue({
      unwrap: () => Promise.reject("Unable to change the password."),
    });
    renderChangePassword();

    await fillChangePassword(user);
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Unable to change the password.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
    expect(sessionStorage.getItem("token")).toBe("access-token");
  });
});
