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
import { referralConfigForRoleType } from "../services/referralUwService";

const INBOX_PATH = "/inbox";
const REFERRAL_DRS_PATH = "/referral/drs";

function stripTrailingSlashes(pathname: string): string {
  let end = pathname.length;
  while (end > 0 && pathname.charAt(end - 1) === "/") {
    end -= 1;
  }
  const stripped = pathname.slice(0, end);
  return stripped.length > 0 ? stripped : "/";
}

function parseMemberCount(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isDrsSectionPath(pathname: string): boolean {
  return /\/drs\/(financial|medical)$/i.test(pathname);
}

function isGuwOrReferralRole(roleType: string): boolean {
  return roleType === "GUW" || referralConfigForRoleType(roleType) !== null;
}

function isMemberDrsRoute(
  isInbox: boolean,
  memberCount: number,
  roleType: string,
  normalizedPath: string,
): boolean {
  if (isInbox || memberCount <= 1) return false;
  if (!isGuwOrReferralRole(roleType)) return false;
  const lowerPath = normalizedPath.toLowerCase();
  return parseDrsApplicationNo(normalizedPath) !== null || lowerPath === REFERRAL_DRS_PATH;
}

function buildMemberSelectionBackPath(input: {
  isDrsSection: boolean;
  drsPath: string | undefined;
  locationSearch: string;
  isMemberDrs: boolean;
  roleType: string;
  applicationNo: string | null;
  role: string | null;
  inboxRoleType: string | null;
}): string | undefined {
  const { isDrsSection, drsPath, locationSearch, isMemberDrs, roleType } = input;
  if (isDrsSection && drsPath) {
    return `${drsPath}${locationSearch}`;
  }
  if (!isMemberDrs) {
    return undefined;
  }

  const backParams = new URLSearchParams({
    applicationNo: input.applicationNo ?? "",
    roleType: input.inboxRoleType ?? "",
  });
  const roleVal = input.role ?? "";
  if (roleVal.length > 0) {
    backParams.set("role", roleVal);
  }

  const memberSelectionPath =
    roleType === "GUW" ? "/guw/member-selection" : "/referral/member-selection";
  return `${memberSelectionPath}?${backParams.toString()}`;
}

export function GroupAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const normalizedPath = stripTrailingSlashes(location.pathname);
  const isInbox = normalizedPath.toLowerCase() === INBOX_PATH;
  const pathApplicationNo = parseDrsApplicationNo(normalizedPath);
  const sessionApplicationNo = getDrsApplicationNo();
  const applicationNo = isInbox
    ? undefined
    : pathApplicationNo ?? (sessionApplicationNo.length > 0 ? sessionApplicationNo : undefined);
  const drsPath = applicationNo ? drsRoutePath(applicationNo) : undefined;
  const role = isInbox ? undefined : getDrsRoleLabel() || undefined;

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
   * On a GUW / referral member DRS page opened from member selection (memberCount > 1), the back
   * button returns to the member selection page; otherwise it goes back to the inbox (default).
   */
  const roleType = getDrsRoleType().toUpperCase();
  const memberCount = getDrsMemberCount();
  const isMemberDrs =
    !isInbox &&
    memberCount > 1 &&
    (roleType.includes("GUW") || referralConfigForRoleType(roleType) !== null) &&
    (pathApplicationNo !== null || normalizedPath.toLowerCase() === "/referral/drs");
  /** On the DRS financial / medical sub-pages, back returns to that application's DRS page. */
  const isDrsSection = /\/drs\/(financial|medical)$/i.test(normalizedPath);
  const memberSelectionBackPath: string | undefined = (() => {
    if (isDrsSection && drsPath) return drsPath;
    if (!isMemberDrs) return undefined;
    return roleType.includes("GUW") ? "/guw/member-selection" : "/referral/member-selection";
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
