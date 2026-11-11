/* ------------------------------------------------------------------ */
/* Referral UW (HOD / Sr UW) DRS â€” decision history, options, members   */
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

export type ReferralDecisionTone = "decline" | "standard" | "refer" | "default";

/** Same keyword rules as the prototype's decision pill. */
export function referralDecisionTone(decision: string): ReferralDecisionTone {
  const upper = decision.toUpperCase();
  if (/(NON[- ]?STP|DECLIN|REJECT|DC)/.test(upper)) return "decline";
  if (/(STP|STANDARD|APPROV|ACCEPT)/.test(upper)) return "standard";
  if (/(REFER|REVIEW|PENDING|TUW|RM)/.test(upper)) return "refer";
  return "default";
}
