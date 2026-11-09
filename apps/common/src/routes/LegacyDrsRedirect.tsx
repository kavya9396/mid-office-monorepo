import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { drsRoutePath } from "@insurance-poc/routes";

/** Redirects legacy `/drs?applicationNo=` bookmarks to `/app/{appNo}/drs`. */
export function LegacyDrsRedirect({ inboxPath = "/inbox" }: Readonly<{ inboxPath?: string }>) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const applicationNo = params.get("applicationNo")?.trim() ?? "";
    if (applicationNo.length === 0) {
      navigate(inboxPath, { replace: true });
      return;
    }

    navigate(drsRoutePath(applicationNo), { replace: true });
  }, [inboxPath, navigate, params]);

  return null;
}
