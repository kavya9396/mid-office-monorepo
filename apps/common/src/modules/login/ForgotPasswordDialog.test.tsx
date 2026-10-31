import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderUi } from "../../test/renderUi";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

const auth = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
}));

vi.mock("../../services/authApi", () => ({
  useForgotPasswordMutation: () => [auth.forgotPassword],
}));

describe("ForgotPasswordDialog", () => {
  const onClose = vi.fn();
  const onNotify = vi.fn();

  beforeEach(() => {
    auth.forgotPassword.mockReset();
    onClose.mockReset();
    onNotify.mockReset();
  });

  it("prefills the user ID and keeps Send reset link disabled until the field is valid", async () => {
    const user = userEvent.setup();
    renderUi(
      <ForgotPasswordDialog
        open
        initialUserId=""
        onClose={onClose}
        onNotify={onNotify}
      />,
    );

    expect(screen.getByText("Forgot password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Enter your user ID or email"), "not-valid");
    await user.tab();
    expect(await screen.findByText("Enter a valid user ID or email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDisabled();

    await user.clear(screen.getByPlaceholderText("Enter your user ID or email"));
    await user.type(screen.getByPlaceholderText("Enter your user ID or email"), "UW001");
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeEnabled();
  });

  it("sends a reset link, notifies success, and closes the dialog", async () => {
    const user = userEvent.setup();
    auth.forgotPassword.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          error: false,
          message: "Reset password link sent successfully.",
        }),
    });

    renderUi(
      <ForgotPasswordDialog
        open
        initialUserId="UW001"
        onClose={onClose}
        onNotify={onNotify}
      />,
    );

    expect(screen.getByPlaceholderText("Enter your user ID or email")).toHaveValue("UW001");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(auth.forgotPassword).toHaveBeenCalledWith({ userId: "UW001" });
      expect(onNotify).toHaveBeenCalledWith(
        "Reset password link sent successfully.",
        "success",
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("notifies an error and leaves the dialog open when send fails", async () => {
    const user = userEvent.setup();
    auth.forgotPassword.mockReturnValue({
      unwrap: () => Promise.reject("Unable to send the reset link."),
    });

    renderUi(
      <ForgotPasswordDialog
        open
        initialUserId="UW001"
        onClose={onClose}
        onNotify={onNotify}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith("Unable to send the reset link.", "error");
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Forgot password")).toBeInTheDocument();
  });
});
