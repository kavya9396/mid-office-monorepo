import { getSessionValue, removeSessionValue, setSessionValue } from "@insurance-poc/utils";
import {
  getSessionUser,
  getSessionValue,
  removeSessionValue,
  setSessionValue,
} from "@insurance-poc/utils";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { ComparisonRow } from "@insurance-poc/common/decision-bar";
import type { RiskCardData, RiskCardField } from "@insurance-poc/common/risk-cards";
import type { BannerRowDetail } from "@insurance-poc/common/applicant-banner";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";
import { buildBreRows } from "../modules/drs/breFormat";
import guwDrsMock from "../../../../mock/drs/guw-informal-drs.json";
import guwValidationMock from "../../../../mock/drs/guw-validation.json";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

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
  /** Initial (`breDecision`) vs Final (`latestBreDecision`) rows for the "View Detail" dialog. */
  detailRows: ComparisonRow[];
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

/* ---- Decision-validation (UW Guidelines) domain types ---- */

export type GuwGuidelineCategory = "justification" | "checklist" | "hardAlert" | "softAlert";

export interface GuwJustificationOption {
  code: string;
  text: string;
}

/** One UW Guidelines table row, produced by the validation mapper. */
export interface GuwValidationRow {
  validationId: string;
  category: GuwGuidelineCategory;
  reason: string;
  remark: string;
  /** Hard alert / justification action; empty when the API sends none. */
  systemAction: string;
  /** Dropdown options; only populated for the justification and checklist categories. */
  justificationOptions: GuwJustificationOption[];
}

export interface GuwValidationResult {
  applicationNo: string;
  correlationId: string;
  success: boolean;
  referralRequired: boolean;
  counterSignRequired: boolean;
  /** Justification rows first, then checklist, hard alerts and soft alerts. */
  rows: GuwValidationRow[];
}

/** A validation row together with what the user saved for it. */
export interface GuwSavedValidationRow extends GuwValidationRow {
  selectedReasonCode: string;
  justificationRemark: string;
}

export interface GuwValidationRequest {
  userId: string;
  role: string;
  applicationNo: string;
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
  /** UW Guidelines rows from the validation API with saved justifications (absent on older snapshots). */
  validationRows?: GuwSavedValidationRow[];
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
  /** `data.rowDetails[]` exactly as returned by the API; rendered by ApplicantBanner. */
  rowDetails: BannerRowDetail[];
  /** `data.cardDetails[]` mapped for the common `RiskCards` component. */
  riskCards: RiskCardData[];
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

/** Pass `data.rowDetails[]` through unchanged (normalising only name/value to strings). */
function mapRowDetails(rowDetails: unknown): BannerRowDetail[] {
  if (!Array.isArray(rowDetails)) return [];
  return rowDetails.filter(isRecord).map((row, index) => ({
    id: typeof row.id === "number" || typeof row.id === "string" ? row.id : index,
    fields: Array.isArray(row.fields)
      ? row.fields.filter(isRecord).map((f) => ({ name: str(f.name), value: str(f.value) }))
      : [],
  }));
}

const CARD_TITLES: Record<string, string> = {
  FINANCIAL: "Financial",
  MEDICAL: "Medical",
  RISK_PARAMETERS: "Risk Parameters",
};
const CARD_TONES: Record<string, RiskCardData["tone"]> = {
  FINANCIAL: "danger",
  MEDICAL: "success",
  RISK_PARAMETERS: "danger",
};
// Only Financial / Medical show the "View …" pill (Risk Parameters has the arrow only).
const CARD_VIEW_LABELS: Record<string, string> = {
  FINANCIAL: "View Financial",
  MEDICAL: "View Medical",
};

function mapCardFields(arr: unknown): RiskCardField[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(isRecord).map((a) => ({ name: str(a.name), value: str(a.value) }));
}

/** Map a single `cardDetails[]` entry to the common `RiskCardData`. */
function mapCard(raw: unknown): RiskCardData | null {
  if (!isRecord(raw)) return null;
  const type = str(raw.type);
  const title = CARD_TITLES[type] ?? type;
  const expanded = mapCardFields(raw.expandedAttributes);

  return {
    id: type,
    title,
    tone: CARD_TONES[type] ?? "success",
    viewLabel: CARD_VIEW_LABELS[type],
    fields: mapCardFields(raw.attributes),
    details: expanded.length > 0 ? { title: `${title} Details`, fields: expanded } : undefined,
  };
}

/** Extract BRE discrepancy codes from a "#"-separated string. */
function splitDiscrepancy(raw: string): string[] {
  return raw
    .split("#")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Map `sections.breDecision` (initial) and `sections.latestBreDecision` (final) to GuwBreData.
 * The headline decision is the latest one, falling back to the initial one.
 */
function mapBreData(
  initialSection: unknown,
  latestSection: unknown,
  requirements: unknown[],
): GuwBreData {
  const initial = isRecord(initialSection) ? initialSection : {};
  const latest = isRecord(latestSection) ? latestSection : {};

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
    breCode: str(latest.decision) || str(initial.decision),
    initialDiscrepancy: splitDiscrepancy(str(initial.discrepancy)),
    finalDiscrepancy: splitDiscrepancy(str(latest.discrepancy)),
    statusChips: chips,
    detailRows: buildBreRows(
      {
        decision: str(initial.decision),
        remarks: str(initial.remarks),
        discrepancy: str(initial.discrepancy),
        timestamp: str(initial.timestamp),
      },
      {
        decision: str(latest.decision),
        remarks: str(latest.remarks),
        discrepancy: str(latest.discrepancy),
        timestamp: str(latest.timestamp),
      },
    ),
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
  const latestBreSection = findSection(sections, "latestBreDecision");

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
  const rowDetails = mapRowDetails(data.rowDetails);

  const riskCards: RiskCardData[] = Array.isArray(data.cardDetails)
    ? (data.cardDetails as unknown[]).map(mapCard).filter((c): c is RiskCardData => c !== null)
    : [];

  const sdtRow = mapSdtRow(summary);
  const breData = mapBreData(breSection, latestBreSection, rawReqs);

  return {
    applicationNo,
    applicantName,
    applicationLabel: `App No. - ${applicationNo}`,
    rowDetails,
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

/** Fired on `window` whenever a held decision is saved or cleared, so open pages can refresh. */
export const GUW_DECISION_CHANGED_EVENT = "guw-decision-changed";

function notifyDecisionChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(GUW_DECISION_CHANGED_EVENT));
}

export function saveGuwSubmittedDecision(
  applicationNo: string,
  decision: GuwSubmittedDecision,
): void {
  if (!applicationNo) return;
  setSessionValue(submittedDecisionKey(applicationNo), JSON.stringify(decision));
  notifyDecisionChanged();
}

/** Session key of one member's decision; the summary page and the member DRS page must agree on it. */
export function guwMemberDecisionKey(applicationNo: string, memberId: string): string {
  return `${applicationNo}:${memberId}`;
}

export function clearGuwSubmittedDecision(applicationNo: string): void {
  if (!applicationNo) return;
  removeSessionValue(submittedDecisionKey(applicationNo));
  notifyDecisionChanged();
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
/* Decision validation (mock until the real endpoint is available)       */
/* ------------------------------------------------------------------ */

/** Role sent with the validation request; replace once a role source is defined. */
const VALIDATION_ROLE = "CUW";

/** Order in which categories appear in the UW Guidelines table. */
const CATEGORY_ORDER: GuwGuidelineCategory[] = ["justification", "checklist", "hardAlert", "softAlert"];

export function toGuwValidationRequest(applicationNo: string): GuwValidationRequest {
  return {
    userId: getSessionUser()?.userId ?? "",
    role: VALIDATION_ROLE,
    applicationNo,
  };
}

function recordList(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.filter(isRecord) : [];
}

function mapOptionRows(v: unknown, category: "justification" | "checklist"): GuwValidationRow[] {
  return recordList(v).map((j) => ({
    validationId: str(j.validationId),
    category,
    reason: str(j.justificationReason),
    remark: str(j.justificationRemarks),
    systemAction: str(j.action),
    justificationOptions: recordList(j.reason).map((o) => ({
      code: str(o.reasonCode),
      text: str(o.reasonText),
    })),
  }));
}

function mapAlertRows(v: unknown, category: "hardAlert" | "softAlert"): GuwValidationRow[] {
  return recordList(v).map((a) => ({
    validationId: str(a.validationId),
    category,
    reason: str(a.reason),
    remark: str(a.remarks),
    systemAction: str(a.action),
    justificationOptions: [],
  }));
}

/** DTO -> domain. Unknown fields are dropped; missing lists become empty. */
export function fromGuwValidationResponse(dto: unknown): GuwValidationResult {
  const src = isRecord(dto) ? dto : {};
  const rows = [
    ...mapOptionRows(src.justifications, "justification"),
    ...mapOptionRows(src.checklist, "checklist"),
    ...mapAlertRows(src.HardAlert, "hardAlert"),
    ...mapAlertRows(src.SoftAlert, "softAlert"),
  ].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  return {
    applicationNo: str(src.applicationNo),
    correlationId: str(src.correlationId),
    success: src.status === "SUCCESS",
    referralRequired: src.referralReqd === "Y",
    counterSignRequired: src.counterSignReqd === "Y",
    rows,
  };
}

/**
 * Validates the chosen Case UW Decision.
 * `mockDecisionCode` only selects a mock scenario and is NOT part of the request;
 * drop it when the real endpoint replaces this function.
 */
export async function validateGuwDecision(
  request: GuwValidationRequest,
  mockDecisionCode: string,
): Promise<GuwValidationResult> {
  await wait(250);
  const fixtures: unknown = guwValidationMock;
  const table = isRecord(fixtures) ? fixtures : {};
  const dto = table[mockDecisionCode] ?? table.default;
  const result = fromGuwValidationResponse(dto);
  return { ...result, applicationNo: request.applicationNo };
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
