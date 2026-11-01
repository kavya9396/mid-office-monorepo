import { useEffect, type ReactNode } from "react";
import { businessInboxUrl, commonPaths, replaceUrl } from "@insurance-poc/routes";
import {
  getSessionBusinessType,
  hasSession,
  mustChangePassword,
} from "@insurance-poc/utils";

export function RedirectIfSession({ children }: { children: ReactNode }) {
  const businessType = getSessionBusinessType();
  const destination = businessType ? businessInboxUrl(businessType) : null;
  const changingPassword = mustChangePassword();
  const shouldRedirect = hasSession() && (changingPassword || Boolean(destination));

  useEffect(() => {
    if (!hasSession()) return;
    if (changingPassword) {
      replaceUrl(commonPaths.changePassword);
      return;
    }
    if (destination) replaceUrl(destination);
  }, [changingPassword, destination]);

  if (shouldRedirect) return null;

  return children;
}
