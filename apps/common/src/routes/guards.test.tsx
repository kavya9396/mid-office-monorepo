import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setFirstLoginChangePending,
  setSessionUser,
  setToken,
} from "@insurance-poc/utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RedirectIfSession, RequirePasswordChange } from "./guards";

const navigation = vi.hoisted(() => ({ replaceUrl: vi.fn() }));

vi.mock("@insurance-poc/routes", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/routes")>(
    "@insurance-poc/routes",
  );
  return { ...actual, replaceUrl: navigation.replaceUrl };
});

describe("RedirectIfSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
    navigation.replaceUrl.mockReset();
  });

  it("clears session and shows login when a first-login user opens /login manually", async () => {
    setFirstLoginChangePending(true);
    setToken("first-login-jwt");
    setSessionUser({ username: "LDAP12345", displayName: "LDAP12345" });
    sessionStorage.setItem("businessType", "RETAIL");

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfSession>
                <div>Login form</div>
              </RedirectIfSession>
            }
          />
          <Route path="/change-password" element={<div>Change password form</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login form")).toBeInTheDocument();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("firstLoginChangePending")).toBeNull();
    expect(navigation.replaceUrl).not.toHaveBeenCalled();
  });
});

describe("RequirePasswordChange (strict case A)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    navigation.replaceUrl.mockReset();
  });

  it("clears session and redirects to login when the first-login gate is not set", async () => {
    setToken("first-login-jwt");
    setSessionUser({ username: "LDAP12345", displayName: "LDAP12345" });
    setFirstLoginChangePending(false);

    render(
      <RequirePasswordChange>
        <div>Change password form</div>
      </RequirePasswordChange>,
    );

    await waitFor(() => {
      expect(navigation.replaceUrl).toHaveBeenCalledWith("/login");
    });
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("allows change-password after a full reload when the gate was persisted at login", async () => {
    setToken("first-login-jwt");
    setSessionUser({ username: "LDAP12345", displayName: "LDAP12345" });
    setFirstLoginChangePending(true);
    setFirstLoginChangePending(false);
    sessionStorage.setItem("firstLoginChangePending", "true");

    render(
      <RequirePasswordChange>
        <div>Change password form</div>
      </RequirePasswordChange>,
    );

    expect(await screen.findByText("Change password form")).toBeInTheDocument();
    expect(navigation.replaceUrl).not.toHaveBeenCalled();
  });
});
