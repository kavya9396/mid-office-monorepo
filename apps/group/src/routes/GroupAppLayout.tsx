import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { Header } from "@insurance-poc/common/header";
import { drsRoutePath, parseDrsApplicationNo } from "@insurance-poc/routes";
import { referralConfigForRoleType } from "../services/referralUwService";

const INBOX_PATH = "/inbox";
const REFERRAL_DRS_PATH = "/referral/drs";

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
  const [params] = useSearchParams();
  const normalizedPath = stripTrailingSlashes(location.pathname);
  const isInbox = normalizedPath.toLowerCase() === INBOX_PATH;
  const role = isInbox ? undefined : readQueryValue(params.get("role"));
  const applicationNo = isInbox
    ? undefined
    : parseDrsApplicationNo(normalizedPath) ?? readQueryValue(params.get("applicationNo"));
  const drsPath = applicationNo ? drsRoutePath(applicationNo) : undefined;

  const roleType = readQueryValue(params.get("roleType"))?.toUpperCase() ?? "";
  const memberCount = parseMemberCount(params.get("memberCount"));
  const isMemberDrs = isMemberDrsRoute(isInbox, memberCount, roleType, normalizedPath);
  const isDrsSection = isDrsSectionPath(normalizedPath);

  const memberSelectionBackPath = buildMemberSelectionBackPath({
    isDrsSection,
    drsPath,
    locationSearch: location.search,
    isMemberDrs,
    roleType,
    applicationNo: params.get("applicationNo"),
    role: params.get("role"),
    inboxRoleType: params.get("roleType"),
  });

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
