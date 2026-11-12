import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { businessInboxUrl, commonPaths, replaceUrl } from "@insurance-poc/routes";
import { CustomLoader } from "@insurance-poc/ui";
import {
  clearSession,
  getSessionBusinessType,
  hasSession,
  isFirstLoginChangePending,
} from "@insurance-poc/utils";

export function RedirectIfSession({ children }: { children: ReactNode }) {
  const businessType = getSessionBusinessType();
  const destination = businessType ? businessInboxUrl(businessType) : null;
  const firstLoginFlow = isFirstLoginChangePending();
  const hasCredentials = hasSession();

  useEffect(() => {
    if (!hasCredentials || firstLoginFlow) return;
    if (destination) replaceUrl(destination);
  }, [hasCredentials, firstLoginFlow, destination]);

  if (!hasCredentials) return children;

  if (firstLoginFlow) {
    return <Navigate to={commonPaths.changePassword} replace />;
  }

  if (destination) {
    return <CustomLoader message="Opening inbox" fullScreen />;
  }

  return children;
}

/**
 * Strict change-password (case A):
 * - Allowed only when login returned `mustChangePassword: true`.
 * - Refresh, manual URL, or missing gate → clear session and send to login.
 */
export function RequirePasswordChange({ children }: { children: ReactNode }) {
  const allowed = hasSession() && isFirstLoginChangePending();

  useEffect(() => {
    if (allowed) return;
    clearSession();
    replaceUrl(commonPaths.login);
  }, [allowed]);

  if (!allowed) {
    return <CustomLoader message="Loading" />;
  }

  return children;
}
