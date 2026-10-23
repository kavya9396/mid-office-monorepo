import { useEffect, useState, type ReactNode } from "react";
import { authorizeBusiness } from "@insurance-poc/common/auth";
import {
  businessInboxUrl,
  commonPaths,
  replaceUrl,
} from "@insurance-poc/routes";
import {
  clearToken,
  getSessionBusinessType,
  getSessionUser,
  hasSession,
  setSessionBusinessType,
} from "@insurance-poc/util";

export function RequireSession({ children }: { children: ReactNode }) {
  const userId = getSessionUser()?.userId ?? null;
  const hasCredentials = hasSession() && Boolean(userId);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!hasCredentials || !userId) {
      replaceUrl(commonPaths.login);
      return;
    }

    let active = true;

    authorizeBusiness(userId, "RETAIL").then((result) => {
      if (!active) return;

      if (result.status === "SUCCESS") {
        setSessionBusinessType("RETAIL");
        setAllowed(true);
        return;
      }

      const currentBusiness = getSessionBusinessType();
      const fallback = currentBusiness
        ? businessInboxUrl(currentBusiness)
        : null;

      if (fallback && currentBusiness !== "RETAIL") {
        replaceUrl(fallback);
      } else {
        clearToken();
        replaceUrl(commonPaths.login);
      }
    });

    return () => {
      active = false;
    };
  }, [hasCredentials, userId]);

  if (!allowed) return null;
  return children;
}
