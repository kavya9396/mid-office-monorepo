import { useEffect, type ReactNode } from "react";
import { businessInboxUrl, commonPaths, replaceUrl } from "@insurance-poc/routes";
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
  const shouldRedirect = hasSession() && (firstLoginFlow || Boolean(destination));

  useEffect(() => {
    if (!hasSession()) return;
    if (firstLoginFlow) {
      replaceUrl(commonPaths.changePassword);
      return;
    }
    if (destination) replaceUrl(destination);
  }, [firstLoginFlow, destination]);

  if (shouldRedirect) return null;

  return children;
}

/**
 * Strict change-password (case A):
 * - Allowed only when login returned `firstLogin: true` and `mustChangePassword: true`.
 * - Refresh, manual URL, or missing gate → clear session and send to login.
 */
export function RequirePasswordChange({ children }: { children: ReactNode }) {
  const allowed = hasSession() && isFirstLoginChangePending();

  useEffect(() => {
    if (allowed) return;
    clearSession();
    replaceUrl(commonPaths.login);
  }, [allowed]);

  if (!allowed) return null;

  return children;
}
