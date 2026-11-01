import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@insurance-poc/utils";
import { renderAuth, renderUi } from "../../test/renderUi";
import { ChangePasswordPage } from "./ChangePasswordPage";

const auth = vi.hoisted(() => ({
  changePassword: vi.fn(),
}));

vi.mock("../../services/authApi", () => ({
  useChangePasswordMutation: () => [auth.changePassword],
}));

function renderChangePassword() {
  return renderUi(
    <MemoryRouter initialEntries={["/change-password"]}>
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/login" element={<div>Login after change</div>} />
      </Routes>
    </MemoryRouter>,
  );
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
  });

  it("asks the user to sign in when no session token is present", () => {
    renderAuth(<ChangePasswordPage />, { route: "/change-password" });
    expect(screen.getByText("Change your password")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign in before changing your password.",
    );
  });

  it("keeps Change password disabled when the confirmation does not match", async () => {
    setToken("access-token");
    const user = userEvent.setup();
    renderChangePassword();

    await fillChangePassword(user, "Mismatch@1234");
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeDisabled();
  });

  it("changes the password and returns to login after success", async () => {
    setToken("access-token");
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
          oldPassword: "OlderPass@1234",
          newPassword: "NewerPass@1234",
        });
        expect(screen.getByText("Login after change")).toBeInTheDocument();
        expect(sessionStorage.getItem("token")).toBeNull();
      },
      { timeout: 2500 },
    );
  });

  it("shows the API error and stays on the form after a failed change", async () => {
    setToken("access-token");
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
