import { useEffect, type ReactNode } from "react";
import { businessInboxUrl, replaceUrl } from "@insurance-poc/routes";
import {
  getSessionBusinessType,
  hasSession,
} from "@insurance-poc/utils";

export function RedirectIfSession({ children }: { children: ReactNode }) {
  const businessType = getSessionBusinessType();
  const destination = businessType ? businessInboxUrl(businessType) : null;
  const shouldRedirect = hasSession() && Boolean(destination);

  useEffect(() => {
    if (shouldRedirect && destination) replaceUrl(destination);
  }, [destination, shouldRedirect]);

  if (shouldRedirect) return null;

  return children;
}
