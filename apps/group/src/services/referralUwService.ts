/* ------------------------------------------------------------------ */
/* Referral UW (HOD / Sr UW) DRS — decision history, options, members   */
/* Source: design-reference/ui-prototypes/Group/Ref Screens/            */
/*         hod-drs-prototype.html, sr-uw-drs-prototype.html             */
/* ------------------------------------------------------------------ */

export type ReferralRole = "HOD" | "SR_UW";

export interface ReferralRoleConfig {
  role: ReferralRole;
  /** Prefix of the decision card labels: "<label> Remarks" / "<label> Decision". */
  label: string;
  /** `roleType` values (upper-case) the inbox sends for this role. */
  roleTypes: string[];
  decisionOptions: string[];
}

export const HOD_CONFIG: ReferralRoleConfig = {
  role: "HOD",
  label: "HOD",
  roleTypes: ["HOD", "HOD_TASK"],
  decisionOptions: ["Agree", "Disagree", "Refer to HO CMO", "Refer back to last UW", "Refer to IT"],
};

export const SR_UW_CONFIG: ReferralRoleConfig = {
  role: "SR_UW",
  label: "Sr UW",
  roleTypes: ["SR_UW", "SR_UW_TASK"],
  decisionOptions: [
    "Agree",
    "Disagree",
    "Refer to HO CMO",
    "Refer back to last UW",
    "Refer to HOD",
    "Refer to IT",
  ],
};

export function referralConfigForRoleType(roleType: string): ReferralRoleConfig | null {
  const upper = roleType.trim().toUpperCase();
  return [HOD_CONFIG, SR_UW_CONFIG].find((c) => c.roleTypes.includes(upper)) ?? null;
}

export function isReferralRoleType(roleType: string): boolean {
  return referralConfigForRoleType(roleType) !== null;
}

/* ---------------------------- Decision history --------------------- */

export interface ReferralDecisionHistoryRow {
  userName: string;
  userRole: string;
  firstUwDecision: string;
  firstUwRemarks: string;
  date: string;
  financialDecision: string;
  medicalDecision: string;
  smokerStatus: string;
  referralReason: string;
  referralRemarks: string;
}

// Mock rows until the real endpoint is available.
const DECISION_HISTORY_MOCK: ReferralDecisionHistoryRow[] = [
  {
    userName: "Ananya Sharma",
    userRole: "Sr. UW",
    firstUwDecision: "Standard",
    firstUwRemarks: "Case referred for HOD review due to the overall risk assessment.",
    date: "08 Sep 2026, 11:15:48 am",
    financialDecision: "Standard",
    medicalDecision: "Standard",
    smokerStatus: "Non-Smoker",
    referralReason: "Overall risk assessment",
    referralRemarks: "Referred for HOD review.",
  },
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchReferralDecisionHistory(
  _applicationNo: string,
): Promise<ReferralDecisionHistoryRow[]> {
  await wait(150);
  return DECISION_HISTORY_MOCK.map((row) => ({ ...row }));
}

/* ------------------------------ Members ---------------------------- */

export interface ReferralMemberDetail {
  label: string;
  value: string;
}

export interface ReferralMember {
  /** e.g. "Life Assured 1" — also the `memberId` query param. */
  memberType: string;
  /** Display index starting from 1 — controls the life pill colour. */
  toneIndex: number;
  name: string;
  demographics: string;
  /** UW decision shown in the pill. */
  uwDecision: string;
  /** Rows shown in the eye-icon dialog. */
  details: ReferralMemberDetail[];
}

const MEMBERS_MOCK: ReferralMember[] = [
  {
    memberType: "Life Assured 1",
    toneIndex: 1,
    name: "GANESH CHAVAN",
    demographics: "31 yrs / Male / Graduate / PROF / CHENNAI",
    uwDecision: "Refer to HOD",
    details: [
      { label: "Case UW Decision", value: "Refer to HOD" },
      { label: "Outlier", value: "Medical history requires senior underwriting review" },
      { label: "Name of HoD", value: "Amit Shah (Demo HOD)" },
      { label: "Decision Type", value: "Counter Sign" },
      { label: "HOD Reasons", value: "Approval required beyond the underwriter's authority limit" },
      { label: "1st UW Decision", value: "Standard" },
      { label: "1st UW Decision Code", value: "STD" },
      { label: "1st UW Smoker Status", value: "Non Smoker" },
    ],
  },
  {
    memberType: "Life Assured 2",
    toneIndex: 2,
    name: "PRIYA CHAVAN",
    demographics: "29 yrs / Female / Graduate / SPVT / CHENNAI",
    uwDecision: "Decline",
    details: [
      { label: "Case UW Decision", value: "Decline" },
      { label: "Outlier", value: "Elevated HbA1c" },
      { label: "Decision Code", value: "XXR" },
      {
        label: "Decline Reason",
        value: "High than normal level of sugar as per Hemoglobin A1c test",
      },
    ],
  },
];

export async function fetchReferralMembers(_applicationNo: string): Promise<ReferralMember[]> {
  await wait(150);
  return MEMBERS_MOCK.map((m) => ({ ...m, details: m.details.map((d) => ({ ...d })) }));
}

export type ReferralDecisionTone = "decline" | "standard" | "refer" | "default";

/** Same keyword rules as the prototype's decision pill. */
export function referralDecisionTone(decision: string): ReferralDecisionTone {
  const upper = decision.toUpperCase();
  if (/(NON[- ]?STP|DECLIN|REJECT|DC)/.test(upper)) return "decline";
  if (/(STP|STANDARD|APPROV|ACCEPT)/.test(upper)) return "standard";
  if (/(REFER|REVIEW|PENDING|TUW|RM)/.test(upper)) return "refer";
  return "default";
}
