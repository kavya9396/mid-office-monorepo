import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { Header } from "@insurance-poc/common/header";
import { drsRoutePath, parseDrsApplicationNo } from "@insurance-poc/routes";
import { referralConfigForRoleType } from "../services/referralUwService";

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

export function GroupAppLayout() {
  const location = useLocation();
  const [params] = useSearchParams();
  const normalizedPath = stripTrailingSlashes(location.pathname);
  const isInbox = normalizedPath.toLowerCase() === INBOX_PATH;
  const role = isInbox ? undefined : readQueryValue(params.get("role"));
  const applicationNo = isInbox
    ? undefined
    : parseDrsApplicationNo(normalizedPath) ?? readQueryValue(params.get("applicationNo"));
  const drsPath = applicationNo ? drsRoutePath(applicationNo) : undefined;

  /**
   * On a GUW / referral member DRS page opened from member selection (memberCount > 1), the back
   * button returns to the member selection page; otherwise it goes back to the inbox (default).
   */
  const roleType = readQueryValue(params.get("roleType"))?.toUpperCase() ?? "";
  const memberCount = parseInt(params.get("memberCount") ?? "0", 10);
  const isMemberDrs =
    !isInbox &&
    memberCount > 1 &&
    (roleType === "GUW" || referralConfigForRoleType(roleType) !== null) &&
    (parseDrsApplicationNo(normalizedPath) !== null || normalizedPath.toLowerCase() === "/referral/drs");
  const memberSelectionBackPath: string | undefined = (() => {
    if (!isMemberDrs) return undefined;
    const backParams = new URLSearchParams({
      applicationNo: params.get("applicationNo") ?? "",
      roleType: params.get("roleType") ?? "",
    });
    const roleVal = params.get("role") ?? "";
    if (roleVal) backParams.set("role", roleVal);
    const memberSelectionPath =
      roleType === "GUW" ? "/guw/member-selection" : "/referral/member-selection";
    return `${memberSelectionPath}?${backParams.toString()}`;
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
        backPath={memberSelectionBackPath}
      />
      <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: isInbox ? "hidden" : "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
}