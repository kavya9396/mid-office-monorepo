import { useState } from "react";
import { Outlet } from "react-router-dom";
import { authorizeBusiness, type BusinessType } from "@insurance-poc/common/auth";
import {
  assignUrl,
  businessInboxUrl,
  commonPaths,
  replaceUrl,
} from "@insurance-poc/routes";
import { AppHeader, AppSnackbar } from "@insurance-poc/ui";
import {
  clearToken,
  getSessionUser,
  setSessionBusinessType,
} from "@insurance-poc/util";

export function GroupAppLayout() {
  const user = getSessionUser();
  const [switching, setSwitching] = useState(false);
  const [authorizationError, setAuthorizationError] = useState("");

  async function switchBusiness(nextBusinessType: BusinessType) {
    if (nextBusinessType === "GROUP" || switching) return;

    if (!user) {
      clearToken();
      replaceUrl(commonPaths.login);
      return;
    }

    setSwitching(true);
    setAuthorizationError("");

    try {
      const result = await authorizeBusiness(user.userId, nextBusinessType);

      if (result.status !== "SUCCESS") {
        setAuthorizationError(result.message);
        return;
      }

      const destination = businessInboxUrl(nextBusinessType);
      if (!destination) throw new Error("Business Inbox is not configured.");

      setSessionBusinessType(nextBusinessType);
      assignUrl(destination);
    } catch (reason) {
      setAuthorizationError(
        reason instanceof Error
          ? reason.message
          : "Unable to verify business authorization.",
      );
    } finally {
      setSwitching(false);
    }
  }

  function logout() {
    clearToken();
    replaceUrl(commonPaths.login);
  }

  return (
    <>
      <AppHeader
        title="Insurance POC"
        subtitle={`${user?.displayName ?? "User"} · Group`}
        businessType="GROUP"
        switchingBusiness={switching}
        onBusinessTypeChange={switchBusiness}
        onLogout={logout}
      />
      <Outlet />
      <AppSnackbar
        open={Boolean(authorizationError)}
        message={authorizationError}
        onClose={() => setAuthorizationError("")}
      />
    </>
  );
}
