import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAuth, renderUi } from "../../test/renderUi";
import { ResetPasswordPage } from "./ResetPasswordPage";

const auth = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock("../../services/authApi", () => ({
  useResetPasswordMutation: () => [auth.resetPassword],
}));

function renderResetPassword(route = "/reset-password?token=reset-token") {
  return renderUi(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login after reset</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillResetPassword(
  user: ReturnType<typeof userEvent.setup>,
  confirmPassword = "NewerPass@1234",
) {
  await user.type(screen.getByPlaceholderText("Enter your new password"), "NewerPass@1234");
  await user.type(screen.getByPlaceholderText("Re-enter your new password"), confirmPassword);
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    auth.resetPassword.mockReset();
  });

  it("shows an alert when the reset link is missing a token", () => {
    renderAuth(<ResetPasswordPage />, { route: "/reset-password" });
    expect(screen.getByText("Choose a new password")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This reset link is missing a token. Request a new link from the login page.",
    );
  });

  it("links back to login from the reset form", () => {
    renderResetPassword();
    expect(screen.getByRole("link", { name: "Back to login" })).toHaveAttribute("href", "/login");
  });

  it("keeps Reset password disabled when the confirmation does not match", async () => {
    const user = userEvent.setup();
    renderResetPassword();

    await fillResetPassword(user, "Mismatch@1234");
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeDisabled();
  });

  it("resets the password and returns to login with the success message", async () => {
    const user = userEvent.setup();
    auth.resetPassword.mockReturnValue({
      unwrap: () => Promise.resolve({ error: false, message: "Password reset" }),
    });
    renderResetPassword();

    await fillResetPassword(user);
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Password reset")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(auth.resetPassword).toHaveBeenCalledWith({
          token: "reset-token",
          newPassword: "NewerPass@1234",
        });
        expect(screen.getByText("Login after reset")).toBeInTheDocument();
      },
      { timeout: 2500 },
    );
  });

  it("shows the API error and stays on the form after a failed reset", async () => {
    const user = userEvent.setup();
    auth.resetPassword.mockReturnValue({
      unwrap: () => Promise.reject("Unable to reset the password."),
    });
    renderResetPassword();

    await fillResetPassword(user);
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Unable to reset the password.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
  });
});
