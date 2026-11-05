import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setFirstLoginChangePending,
  setSessionUser,
  setToken,
} from "@insurance-poc/utils";
import { RequirePasswordChange } from "./guards";

const navigation = vi.hoisted(() => ({ replaceUrl: vi.fn() }));

vi.mock("@insurance-poc/routes", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/routes")>(
    "@insurance-poc/routes",
  );
  return { ...actual, replaceUrl: navigation.replaceUrl };
});

describe("RequirePasswordChange (strict case A)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    navigation.replaceUrl.mockReset();
  });

  it("clears session and redirects to login when the in-memory gate is lost (e.g. refresh)", async () => {
    setToken("first-login-jwt");
    setSessionUser({ userId: "LDAP12345", displayName: "LDAP12345" });
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
});
