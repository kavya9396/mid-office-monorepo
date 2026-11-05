import { getSessionValue, removeSessionValue, setSessionValue } from "@insurance-poc/utils";
import type { DetailAttribute } from "@insurance-poc/common/detail-card";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";
import guwDrsMock from "../../../../mock/drs/guw-informal-drs.json";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface GuwBannerLine {
  text: string;
  emphasis?: boolean;
}

export interface GuwRiskCard {
  type: string;
  title: string;
  accentColor: string;
  valueColor: string;
  attributes: DetailAttribute[];
  expandedAttributes: DetailAttribute[];
}

export interface GuwSdtRow {
  financialDecision: string;
  medicalDecision: string;
  lumiqDecision: string;
  grievanceHistoryCount: number;
  claimAuditCount: number;
  uwGuidelinesCount: number;
}

export interface GuwBreStatusChip {
  label: string;
  count: number;
}

export interface GuwBreData {
  breCode: string;
  initialDiscrepancy: string[];
  finalDiscrepancy: string[];
  statusChips: GuwBreStatusChip[];
}

export interface GuwSubmittedField {
  label: string;
  value: string;
  wide?: boolean;
}

export interface GuwSubmittedCounterOfferRow {
  id: string;
  productName: string;
  isRider: boolean;
  type: string;
  bstdCode: string;
  sa: string;
  changedSa: string;
  pt: string;
  changedPt: string;
  loadingClass: string;
  loadingReason: string;
}

export interface GuwSubmittedGuideline {
  reason: string;
  remark: string;
  systemAction: string;
  justificationReason: string;
  justificationRemark: string;
}

export interface GuwSubmittedDecision {
  decisionCode: string;
  remarks: string;
  fields: GuwSubmittedField[];
  reconsiderationFields: GuwSubmittedField[];
  counterOfferRows: GuwSubmittedCounterOfferRow[];
  showBstdColumn: boolean;
  reinsurerRows: { code: string; systemName: string; uwName: string }[];
  documentRows: { name: string; assigned: boolean[] }[];
  guidelines: GuwSubmittedGuideline[];
}

export interface GuwUwData {
  breOverallDecision: string;
  breOverallRemarks: string;
  submittedDecision?: GuwSubmittedDecision;
}

export interface GuwDrsRecord {
  applicationNo: string;
  applicantName: string;
  applicationLabel: string;
  lines: GuwBannerLine[];
  riskCards: GuwRiskCard[];
  sdtRow: GuwSdtRow;
  breData: GuwBreData;
  uwData?: GuwUwData;
  requirements: RequirementItem[];
}

/* ------------------------------------------------------------------ */
/* Mapper helpers                                                        */
/* ------------------------------------------------------------------ */

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Pick a named section from `data.sections[]`. */
function findSection(sections: unknown, name: string): unknown {
  if (!Array.isArray(sections)) return null;
  const entry = sections.find((s) => isRecord(s) && s.name === name) as
    | Record<string, unknown>
    | undefined;
  return entry?.value ?? null;
}

/** Build banner lines from `data.rowDetails[]`.
 *
 *  rowDetails structure:
 *    id 0 → { Name, "App No." }          (skip — name shown in photo/header)
 *    id 1 → life-assured fields
 *    id 2 → product fields               (emphasis)
 *    id 3 → rider fields
 *    id 4 → sum-at-risk fields
 */
function mapBannerLines(rowDetails: unknown): GuwBannerLine[] {
  if (!Array.isArray(rowDetails)) return [];

  return rowDetails
    .filter((row) => isRecord(row) && typeof row.id === "number" && row.id >= 1)
    .map((row) => {
      const r = row as Record<string, unknown>;
      const fields = Array.isArray(r.fields) ? (r.fields as Record<string, unknown>[]) : [];
      const parts = fields
        .map((f) => {
          const name = str(f.name);
          const value = str(f.value);
          return value ? `${name} - ${value}` : `${name} -`;
        })
        .filter(Boolean);
      return {
        text: parts.join(" / "),
        emphasis: (r.id as number) === 2,
      } satisfies GuwBannerLine;
    })
    .filter((l) => l.text.length > 0);
}

/** Map a single cardDetails entry to a GuwRiskCard. */
function mapCard(raw: unknown): GuwRiskCard | null {
  if (!isRecord(raw)) return null;
  const type = str(raw.type);

  const accentMap: Record<string, string> = {
    FINANCIAL: "#b3262e",
    MEDICAL: "#28743c",
    RISK_PARAMETERS: "#b3262e",
  };
  const titleMap: Record<string, string> = {
    FINANCIAL: "Financial",
    MEDICAL: "Medical",
    RISK_PARAMETERS: "Risk Parameters",
  };

  const mapAttrs = (arr: unknown): DetailAttribute[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(isRecord)
      .map((a) => ({ name: str(a.name), value: str(a.value) }));
  };

  return {
    type,
    title: titleMap[type] ?? type,
    accentColor: accentMap[type] ?? "#e45f14",
    valueColor: accentMap[type] ?? "#302a27",
    attributes: mapAttrs(raw.attributes),
    expandedAttributes: mapAttrs(raw.expandedAttributes),
  };
}

/** Extract BRE discrepancy codes from a "#"-separated string. */
function splitDiscrepancy(raw: string): string[] {
  return raw
    .split("#")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Map `sections.breDecision` to GuwBreData. */
function mapBreData(breSection: unknown, requirements: unknown[]): GuwBreData {
  const bre = isRecord(breSection) ? breSection : {};
  const rawDiscrepancy = str(bre.discrepancy);
  const allCodes = splitDiscrepancy(rawDiscrepancy);

  // Build status chips from requirements array
  const statuses = ["Pending", "Received", "Accept", "Cancelled", "Reject", "Waived"];
  const reqs = requirements.filter(isRecord);
  const chips: GuwBreStatusChip[] = [
    { label: "All", count: reqs.length },
    ...statuses.map((label) => ({
      label,
      count: reqs.filter(
        (r) => str(r.status).toLowerCase() === label.toLowerCase(),
      ).length,
    })),
  ];

  return {
    breCode: str(bre.decision),
    initialDiscrepancy: allCodes,
    finalDiscrepancy: [], // final BRE not available in this payload
    statusChips: chips,
  };
}

/** Extract financial and medical decisions from `sections.summary[0].riskAnalytics[0]`. */
function mapSdtRow(summary: unknown): GuwSdtRow {
  const defaultRow: GuwSdtRow = {
    financialDecision: "",
    medicalDecision: "",
    lumiqDecision: "",
    grievanceHistoryCount: 0,
    claimAuditCount: 0,
    uwGuidelinesCount: 0,
  };
  if (!Array.isArray(summary) || summary.length === 0) return defaultRow;
  const first = summary[0];
  if (!isRecord(first)) return defaultRow;
  const analytics = Array.isArray(first.riskAnalytics) ? first.riskAnalytics : [];
  const analytic = isRecord(analytics[0]) ? (analytics[0] as Record<string, unknown>) : {};
  const financial = isRecord(analytic.financialRisk)
    ? (analytic.financialRisk as Record<string, unknown>)
    : {};
  const medical = isRecord(analytic.medicalRisk)
    ? (analytic.medicalRisk as Record<string, unknown>)
    : {};
  return {
    financialDecision: str(financial.breFinancialDecision),
    medicalDecision: str(medical.brePhysicalMedicalDecision),
    lumiqDecision: str(analytic.lumiqDecision ?? analytic.breLumiqDecision ?? ""),
    grievanceHistoryCount: 0,
    claimAuditCount: 0,
    uwGuidelinesCount: 0,
  };
}

/** Build applicant name from summary[0].proposerSummary. */
function mapApplicantName(summary: unknown): string {
  if (!Array.isArray(summary) || summary.length === 0) return "";
  const first = summary[0];
  if (!isRecord(first)) return "";
  const ps = isRecord(first.proposerSummary) ? (first.proposerSummary as Record<string, unknown>) : {};
  const fn = str(ps.firstName);
  const mn = str(ps.middleName);
  const ln = str(ps.lastName);
  return [fn, mn, ln].filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Public mapper                                                         */
/* ------------------------------------------------------------------ */

export function mapGuwDrsPayload(payload: unknown): GuwDrsRecord {
  const root = isRecord(payload) ? payload : {};
  // Support both wrapped { success, data } and bare data shapes
  const data = isRecord(root.data) ? (root.data as Record<string, unknown>) : root;

  const applicationNo = str(data.applicationNo);
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const summary = findSection(sections, "summary");
  const breSection = findSection(sections, "breDecision");

  // Map raw requirements to RequirementItem[]
  const rawReqs = Array.isArray(findSection(sections, "requirementManagement"))
    ? (findSection(sections, "requirementManagement") as unknown[])
    : [];
  const requirements: RequirementItem[] = mapRequirements(
    rawReqs.filter(isRecord).map((r) => ({
      requirementId: typeof r.requirementId === "number" ? r.requirementId : 0,
      status: str(r.status),
      ocrStatus: str(r.ocrStatus),
      team: str(r.team),
      category: str(r.category),
      subCategory: str(r.subCategory),
      document: str(r.document),
      reason: str(r.reason),
      fupCode: str(r.fupCode),
      description: str(r.description),
    } satisfies RawRequirement)),
  );

  const applicantName = mapApplicantName(summary);
  const lines = mapBannerLines(data.rowDetails);

  const riskCards: GuwRiskCard[] = Array.isArray(data.cardDetails)
    ? (data.cardDetails as unknown[]).map(mapCard).filter((c): c is GuwRiskCard => c !== null)
    : [];

  const sdtRow = mapSdtRow(summary);
  const breData = mapBreData(breSection, rawReqs);

  return {
    applicationNo,
    applicantName,
    applicationLabel: `App No. - ${applicationNo}`,
    lines,
    riskCards,
    sdtRow,
    breData,
    requirements,
    uwData: undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Service                                                               */
/* ------------------------------------------------------------------ */

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/* Submitted decision kept in the browser session (per application)      */
/* ------------------------------------------------------------------ */

const submittedDecisionKey = (applicationNo: string) => `guwSubmittedDecision:${applicationNo}`;

function isSubmittedDecision(v: unknown): v is GuwSubmittedDecision {
  return (
    isRecord(v) &&
    typeof v.decisionCode === "string" &&
    typeof v.remarks === "string" &&
    Array.isArray(v.fields) &&
    Array.isArray(v.guidelines)
  );
}

export function loadGuwSubmittedDecision(applicationNo: string): GuwSubmittedDecision | null {
  if (!applicationNo) return null;
  const raw = getSessionValue(submittedDecisionKey(applicationNo));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSubmittedDecision(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveGuwSubmittedDecision(
  applicationNo: string,
  decision: GuwSubmittedDecision,
): void {
  if (!applicationNo) return;
  setSessionValue(submittedDecisionKey(applicationNo), JSON.stringify(decision));
}

export function clearGuwSubmittedDecision(applicationNo: string): void {
  if (!applicationNo) return;
  removeSessionValue(submittedDecisionKey(applicationNo));
}

export async function fetchGuwDrs(applicationNo: string): Promise<GuwDrsRecord | null> {
  await wait(250);
  // The mock file is now a single API response object (not a records array).
  // We serve it for any applicationNo to allow local dev with any inbox task.
  const payload = guwDrsMock as unknown;
  const record = mapGuwDrsPayload(payload);
  const submittedDecision = loadGuwSubmittedDecision(applicationNo) ?? undefined;
  // Patch the applicationNo to match what was requested so the banner is correct.
  return {
    ...record,
    applicationNo,
    applicationLabel: `App No. - ${applicationNo}`,
    uwData: submittedDecision
      ? {
          breOverallDecision: record.uwData?.breOverallDecision ?? "",
          breOverallRemarks: record.uwData?.breOverallRemarks ?? "",
          submittedDecision,
        }
      : record.uwData,
  };
}

/* ------------------------------------------------------------------ */
/* Dropdown option types & constants (used by GuwUwPanel)               */
/* ------------------------------------------------------------------ */

export interface DropdownOption {
  value: string;
  label: string;
}

export const MASTER_DECISION_OPTIONS: DropdownOption[] = [
  { value: "STD", label: "Standard" },
  { value: "BOR_STD", label: "Borderline Standard" },
  { value: "REJ", label: "Reject" },
  { value: "DC", label: "Decline" },
  { value: "POSTP", label: "Postpone" },
  { value: "CO", label: "Counter Offer" },
  { value: "EP", label: "Extra Premium" },
  { value: "HOLD", label: "Hold" },
  { value: "REFERRAL", label: "Refer To" },
  { value: "AMR", label: "Raise Requirement" },
  { value: "APPROVER", label: "Refer to Approver" },
];

export const MASTER_REFERRAL_TYPE_OPTIONS: DropdownOption[] = [
  { value: "REF_IT", label: "IT" },
  { value: "REF_REINS", label: "Reinsurer" },
  { value: "REF_CMO", label: "HO CMO" },
  { value: "REF_CMO_LOCAL", label: "CMO" },
  { value: "REF_RISK", label: "Risk" },
  { value: "REF_ACU", label: "Accuity" },
  { value: "REF_CUW_CLM", label: "CUW Claim" },
];

export const MASTER_REFERRAL_REASON_OPTIONS: Record<string, string[]> = {
  REF_IT: ["System issue", "Data correction", "Other"],
  REF_REINS: ["High sum assured", "Medical risk", "Other"],
  REF_CMO: ["Medical review", "Specialist opinion", "Other"],
  REF_CMO_LOCAL: ["Medical review", "Specialist opinion", "Other"],
  REF_RISK: ["Risk assessment", "Policy exception", "Other"],
  REF_ACU: ["Screening review", "Match review", "Other"],
  REF_CUW_CLM: ["Claim history", "Investigation", "Other"],
};

export const MASTER_LOADING_CLASS_OPTIONS: Record<string, string[]> = {
  "Medical Loading": ["ML001 - Substandard", "ML002 - Rated Up", "ML003 - Extra Mortality", "ML004 - Occupational Hazard"],
  "FE Loading": ["FE001 - Financial Extra", "FE002 - Income Mismatch", "FE003 - High SA"],
  "Smoker Loading": ["SL001 - Smoker", "SL002 - Tobacco User", "SL003 - Ex-Smoker"],
};

export const MASTER_LOADING_REASON_OPTIONS: Record<string, string[]> = {
  "Medical Loading": ["Medical history", "BMI deviation", "Pre-existing condition", "Hazardous occupation"],
  "FE Loading": ["Income proof inadequate", "SA exceeds eligibility", "Financial inconsistency"],
  "Smoker Loading": ["Active smoker", "Tobacco chewer", "Recent cessation"],
};

export const MASTER_REINSURER_UW_OPTIONS: string[] = ["Swiss Re", "Munich Re", "Scor Re", "Gen Re", "RGA Re", "Hannover Re"];
export const MASTER_REFERRAL_DOCUMENTS: string[] = ["Application Form", "PhotoId Proof", "Address Proof"];

export async function fetchCaseDecisionOptions(): Promise<DropdownOption[]> {
  await wait(100);
  return MASTER_DECISION_OPTIONS;
}
export async function fetchReferralTypeOptions(): Promise<DropdownOption[]> {
  await wait(100);
  return MASTER_REFERRAL_TYPE_OPTIONS;
}
export async function fetchReferralReasonOptions(): Promise<Record<string, string[]>> {
  await wait(100);
  return MASTER_REFERRAL_REASON_OPTIONS;
}
export async function fetchLoadingClassOptions(): Promise<Record<string, string[]>> {
  await wait(100);
  return MASTER_LOADING_CLASS_OPTIONS;
}
export async function fetchLoadingReasonOptions(): Promise<Record<string, string[]>> {
  await wait(100);
  return MASTER_LOADING_REASON_OPTIONS;
}
export async function fetchReinsurerUwOptions(): Promise<string[]> {
  await wait(100);
  return MASTER_REINSURER_UW_OPTIONS;
}
export async function fetchReferralDocuments(): Promise<string[]> {
  await wait(100);
  return MASTER_REFERRAL_DOCUMENTS;
}
