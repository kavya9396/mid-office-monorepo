import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAuth, renderUi } from "../../test/renderUi";
import { LoginPage } from "./LoginPage";

const routes = vi.hoisted(() => ({ assignUrl: vi.fn() }));
const auth = vi.hoisted(() => ({
  login: vi.fn(),
  forgotPassword: vi.fn(),
}));

vi.mock("@insurance-poc/routes", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/routes")>("@insurance-poc/routes");
  return { ...actual, assignUrl: routes.assignUrl };
});

vi.mock("../../services/authApi", () => ({
  useLoginMutation: () => [auth.login],
  useForgotPasswordMutation: () => [auth.forgotPassword],
}));

const successUser = {
  userId: "UW001",
  displayName: "Retail Underwriter",
  authorizedBusinessTypes: ["RETAIL"] as const,
  roles: ["CVT_POOL"],
};

function loginSuccess(overrides: Record<string, unknown> = {}) {
  return {
    unwrap: () =>
      Promise.resolve({
        status: "SUCCESS",
        message: "Logged in",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        firstLogin: false,
        mustChangePassword: false,
        lastLoginAt: "2026-10-06T14:10:20",
        businessType: "RETAIL",
        user: successUser,
        ...overrides,
      }),
  };
}

async function fillValidLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Enter your User ID"), "UW001");
  await user.type(screen.getByPlaceholderText("Enter your Password"), "NewerPass@1234");
  return user;
}

describe("LoginPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    auth.login.mockReset();
    auth.forgotPassword.mockReset();
    routes.assignUrl.mockReset();
  });

  it("renders the login form, business tabs and legal links", () => {
    renderAuth(<LoginPage />);

    expect(screen.getByText("Log in to access your account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Group" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log In" })).toBeDisabled();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms and Conditions")).toBeInTheDocument();
  });

  it("shows client-side validation and enables Log In only for a valid form", async () => {
    const user = userEvent.setup();
    renderAuth(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Enter your User ID"), "user-1");
    await user.tab();
    expect(await screen.findByText("User ID must be letters followed by numbers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log In" })).toBeDisabled();

    await user.clear(screen.getByPlaceholderText("Enter your User ID"));
    await fillValidLogin();
    expect(screen.getByRole("button", { name: "Log In" })).toBeEnabled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderAuth(<LoginPage />);
    const password = screen.getByPlaceholderText("Enter your Password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByLabelText("Show password"));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByLabelText("Hide password"));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits the selected business and opens the inbox after a successful login", async () => {
    auth.login.mockReturnValue(loginSuccess());
    renderAuth(<LoginPage />);
    const user = await fillValidLogin();
    await user.click(screen.getByRole("button", { name: "Group" }));
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith({
        userId: "UW001",
        password: "NewerPass@1234",
        businessType: "GROUP",
      });
      expect(routes.assignUrl).toHaveBeenCalledWith("/group/inbox");
    });
  });

  it("sends a first-login user to change password", async () => {
    auth.login.mockReturnValue(loginSuccess({ firstLogin: true, mustChangePassword: true }));
    renderUi(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<div>Change password screen</div>} />
        </Routes>
      </MemoryRouter>,
    );
    const user = await fillValidLogin();
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("Change password screen")).toBeInTheDocument();
    expect(routes.assignUrl).not.toHaveBeenCalled();
  });

  it("shows the API error and keeps the user on login after a failed sign-in", async () => {
    auth.login.mockReturnValue({
      unwrap: () => Promise.reject("Invalid credentials"),
    });
    renderAuth(<LoginPage />);
    const user = await fillValidLogin();
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(routes.assignUrl).not.toHaveBeenCalled();
  });

  it("opens forgot password from the login form", async () => {
    const user = userEvent.setup();
    renderAuth(<LoginPage />);
    await user.type(screen.getByPlaceholderText("Enter your User ID"), "UW001");
    await user.click(screen.getByRole("button", { name: "Forgot password?" }));

    expect(await screen.findByText("Forgot password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your user ID or email")).toHaveValue("UW001");
  });

  it("shows a reset success message passed from the reset page", async () => {
    renderAuth(<LoginPage />, { state: { resetMessage: "Password reset" } });
    expect(await screen.findByText("Password reset")).toBeInTheDocument();
  });
});
