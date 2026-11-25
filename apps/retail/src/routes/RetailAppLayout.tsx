import { useEffect } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { Header } from "@insurance-poc/common/header";
import { drsRoutePath, parseDrsApplicationNo } from "@insurance-poc/routes";
import {
  absorbDrsQueryFromSearch,
  getDrsApplicationNo,
  getDrsMemberCount,
  getDrsRoleLabel,
  getDrsRoleType,
} from "@insurance-poc/utils";
import { referralConfigForRoleType } from "../services/drsService";

const INBOX_PATH = "/inbox";

function readQueryValue(value: string | null): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function stripTrailingSlashes(pathname: string): string {
  let end = pathname.length;
  while (end > 0 && pathname.charAt(end - 1) === "/") {
    end -= 1;
  }
  const stripped = pathname.slice(0, end);
  return stripped.length > 0 ? stripped : "/";
}

export function RetailAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const normalizedPath = stripTrailingSlashes(location.pathname);
  const isInbox = normalizedPath.toLowerCase() === INBOX_PATH;
  const sessionAppNo = getDrsApplicationNo();
  const sessionApplicationNo = sessionAppNo.length > 0 ? sessionAppNo : undefined;
  const sessionRole = getDrsRoleLabel();
  const role = isInbox ? undefined : readQueryValue(params.get("role")) ?? (sessionRole || undefined);
  const applicationNo = isInbox
    ? undefined
    : parseDrsApplicationNo(normalizedPath) ??
      readQueryValue(params.get("applicationNo")) ??
      sessionApplicationNo;
  const drsPath = applicationNo ? drsRoutePath(applicationNo) : undefined;
  const pathApplicationNo = parseDrsApplicationNo(normalizedPath);

  useEffect(() => {
    if (params.toString().length === 0) return;
    const onDrs = pathApplicationNo !== null || /\/drs(?:\/|$)/i.test(normalizedPath);
    const onMemberSelection = normalizedPath.toLowerCase().endsWith("/member-selection");
    if (!onDrs && !onMemberSelection) return;
    if (absorbDrsQueryFromSearch(params)) {
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, normalizedPath, params, pathApplicationNo]);

  /**
   * On a CUW / referral member DRS page opened from member selection (memberCount > 1), the back
   * button returns to the member selection page; otherwise it goes back to the inbox (default).
   */
  const roleType = getDrsRoleType().toUpperCase();
  const memberCount = getDrsMemberCount();
  const isMemberDrs =
    !isInbox &&
    memberCount > 1 &&
    (roleType.includes("CUW") || referralConfigForRoleType(roleType) !== null) &&
    (pathApplicationNo !== null || normalizedPath.toLowerCase() === "/referral/drs");
  /** On the DRS financial / medical sub-pages, back returns to that application's DRS page. */
  const isDrsSection = /\/drs\/(financial|medical)$/i.test(normalizedPath);
  const backPath: string | undefined = (() => {
    if (isDrsSection && drsPath) return drsPath;
    if (!isMemberDrs) return undefined;
    return roleType.includes("CUW") ? "/cuw/member-selection" : "/referral/member-selection";
  })();

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: isInbox ? "hidden" : "auto",
      }}
    >
      <Header
        inboxPath={INBOX_PATH}
        drsPath={drsPath}
        role={role}
        applicationNo={applicationNo}
        backPath={backPath}
      />
      <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: isInbox ? "hidden" : "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
