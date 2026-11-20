/**
 * "Assigned To" users for Raise Referral / Counter Sign. The users-by-role API returns the people of one role
 * (HOD or Sr UW); the dropdown shows each user's `fullName`.
 */

export interface GuwAssigneeOption {
  value: string;
  label: string;
}

/** `roleName` path value sent to the users-by-role API. */
export const GUW_ASSIGNEE_ROLE = {
  HOD: "HOD",
  SR_UW: "SRUW",
} as const;

/** Role whose users are listed for a Counter Sign "Refer To" value ("HOD" / "Sr UW"); "" when none. */
export function assigneeRoleForReferTo(referTo: string): string {
  const key = referTo.trim().toLowerCase();
  if (key === "hod") return GUW_ASSIGNEE_ROLE.HOD;
  if (key === "sr uw") return GUW_ASSIGNEE_ROLE.SR_UW;
  return "";
}

/** Role whose users are listed for a Raise Referral row code; "" when the row is not assignable. */
export function assigneeRoleForReferralRow(target: string): string {
  if (target === "REF_HOD") return GUW_ASSIGNEE_ROLE.HOD;
  if (target === "REF_SR_UW") return GUW_ASSIGNEE_ROLE.SR_UW;
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Maps the users-by-role response (`data.users[].fullName`) to dropdown options. */
export function mapUsersByRole(payload: unknown): GuwAssigneeOption[] {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : null;
  const users = Array.isArray(data?.users) ? data.users : [];
  return users.flatMap((user) => {
    const fullName = isRecord(user) && typeof user.fullName === "string" ? user.fullName.trim() : "";
    return fullName ? [{ value: fullName, label: fullName }] : [];
  });
}

