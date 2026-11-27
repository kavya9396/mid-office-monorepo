import { useEffect, type ReactNode } from "react";
import { businessInboxUrl, commonPaths, replaceUrl } from "@insurance-poc/routes";
import { CustomLoader } from "@insurance-poc/ui";
import {
  clearSession,
  getSessionBusinessType,
  hasSession,
  isFirstLoginChangePending,
} from "@insurance-poc/utils";

type GuardLayoutProps = Readonly<{ children: ReactNode }>;

export function RedirectIfSession({ children }: GuardLayoutProps) {
  const businessType = getSessionBusinessType();
  const destination = businessType ? businessInboxUrl(businessType) : null;
  const firstLoginFlow = isFirstLoginChangePending();
  const hasCredentials = hasSession();

  useEffect(() => {
    if (!hasCredentials || firstLoginFlow) return;
    if (destination) replaceUrl(destination);
  }, [hasCredentials, firstLoginFlow, destination]);

  if (!hasCredentials) return children;

  /** Explicit `/login`: start fresh (e.g. switch user) even during mandatory change-password. */
  if (firstLoginFlow) {
    clearSession();
    return children;
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
export function RequirePasswordChange({ children }: GuardLayoutProps) {
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
