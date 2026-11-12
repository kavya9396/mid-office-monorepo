import { getSessionUser } from "@insurance-poc/utils";
import type { Column } from "@insurance-poc/ui";
import type { RiskCardData, RiskCardField } from "@insurance-poc/common/risk-cards";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { ComparisonRow } from "@insurance-poc/common/decision-bar";
import { mapQuickLinksSubSections, type QuickLinksSubSections } from "../modules/drs/quickLinksData";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";
import { formatBreTimestamp, splitDiscrepancies } from "../modules/drs/breFormat";
import guwDrsMock from "../../../../mock/drs/guw-informal-drs.json";
import guwValidationMock from "../../../../mock/drs/guw-validation.json";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface BannerRowDetail {
  id: string | number;
  fields: { name: string; value: string }[];
}

export interface GrievanceHistoryRow {
  userName: string;
  profile: string;
  fupCode: string;
  grievanceRemarks: string;
  tpaRemark: string;
  raisedDate: string;
  updatedDate: string;
  raisedBy: string;
  updatedBy: string;
}

export interface ClaimAuditRow {
  id: string;
  policyNo: string;
  productCode: string;
  claimKey: string;
  canonicalId: string;
  patientName: string;
  ailment: string;
  claimType: string;
  subType: string;
  intimationDate: string;
  doa: string;
  dod: string;
  status: string;
}

export interface SpecialRemarksRow {
  id: string;
  comments: string;
  updatedDate: string;
  updatedBy: string;
}

export interface UwGuidelineRow {
  reason: string;
  remark: string;
  systemAction: string;
  justificationReason: string;
  justificationRemark: string;
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
  /** Headers of the "View Detail" comparison table (`latestBreDecision.columns`). */
  detailHeaders: { label: string; initial: string; final: string };
  /** Initial vs Final rows for the "View Detail" dialog (`latestBreDecision.rows`). */
  detailRows: ComparisonRow[];
}

/** Sections shown in the DRS dialogs; each one is driven by its `data.sections[]` entry. */
export interface GuwGrievanceSection {
  title: string;
  columns: Column<GrievanceHistoryRow>[];
  rows: GrievanceHistoryRow[];
}

export interface GuwClaimAuditSection {
  title: string;
  columnHeaders: Partial<Record<keyof ClaimAuditRow, string>>;
  rows: ClaimAuditRow[];
}

export interface GuwSpecialRemarksSection {
  title: string;
  columnHeaders: Partial<Record<keyof SpecialRemarksRow, string>>;
  rows: SpecialRemarksRow[];
}

export interface GuwUwGuidelinesSection {
  title: string;
  rows: UwGuidelineRow[];
  /** `uwGuidelines.justificationChoices`; undefined = component default. */
  justificationReasons?: string[];
}

export interface GuwDialogSections {
  grievanceHistory: GuwGrievanceSection;
  claimAudit: GuwClaimAuditSection;
  specialRemarks: GuwSpecialRemarksSection;
  uwGuidelines: GuwUwGuidelinesSection;
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
  /** Data for the Grievance / Claim Audit / Special Remarks / UW Guidelines dialogs. */
  sections: GuwDialogSections;
  uwData?: GuwUwData;
  requirements: RequirementItem[];
  /** `data.subSections[]` mapped for the Quick Links dialogs. */
  quickLinks: QuickLinksSubSections;
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

/** Display text of a mock cell that may be a string or a list of strings. */
function textOf(v: unknown): string {
  return Array.isArray(v) ? v.map(str).join(", ") : str(v);
}

function recordOf(v: unknown): Record<string, unknown> {
  return isRecord(v) ? v : {};
}

/** Value of the `{ name, value }` entry called `name`. */
function fieldValue(fields: unknown, name: string): string {
  const hit = recordList(fields).find((f) => str(f.name) === name);
  return str(hit?.value);
}

/** Header text of one `columns[]` entry: either a plain string or `{ label }`. */
function headerText(column: unknown): string {
  return isRecord(column) ? str(column.label) : str(column);
}

/** Zips positional header labels (`columns: (string | { label })[]`) onto the keys they describe. */
function headersByKey<K extends string>(
  keys: readonly K[],
  headers: unknown,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  if (!Array.isArray(headers)) return out;
  keys.forEach((key, index) => {
    const text = headerText(headers[index]);
    if (text) out[key] = text;
  });
  return out;
}

/* ---- Risk cards ---- */

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
/** Attributes shown on the card face; the rest appear only in the details dialog. */
const CARD_SUMMARY_FIELDS: Record<string, string[]> = {
  FINANCIAL: [
    "BRE Financial decision",
    "Financial Eligibility",
    "Derived Income",
    "BIU Financial status (Match/Mismatch)",
  ],
  MEDICAL: [
    "BRE Physical Medical Decision",
    "MunichRe Medical decision",
    "BIU Medical status (Match/Mismatch)",
  ],
  RISK_PARAMETERS: [
    "PEP Question Response (LA)",
    "FATF/OFAC Country Login",
    "Health Question Positive",
  ],
};
const CARD_SUMMARY_FALLBACK_COUNT = 3;

function mapCardFields(arr: unknown): RiskCardField[] {
  return recordList(arr).map((a) => ({ name: str(a.name), value: str(a.value) }));
}

/** Map a single `cardDetails[]` entry to the common `RiskCardData`. */
function mapCard(raw: unknown): RiskCardData | null {
  if (!isRecord(raw)) return null;
  const type = str(raw.type);
  const title = str(raw.label) || type;
  const expanded = mapCardFields(raw.expandedAttributes);
  const explicit = mapCardFields(raw.attributes);
  const summaryNames = CARD_SUMMARY_FIELDS[type];
  const fields =
    explicit.length > 0
      ? explicit
      : summaryNames
        ? summaryNames
            .map((name) => expanded.find((f) => f.name === name))
            .filter((f): f is RiskCardField => f !== undefined)
        : expanded.slice(0, CARD_SUMMARY_FALLBACK_COUNT);

  return {
    id: type,
    title,
    tone: CARD_TONES[type] ?? "success",
    viewLabel: CARD_VIEW_LABELS[type],
    fields,
    details: expanded.length > 0 ? { title: `${title} Details`, fields: expanded } : undefined,
  };
}

/* ---- BRE ---- */

const BRE_ROW_DIFF: Record<string, ComparisonRow["diff"]> = {
  decision: "value",
  discrepancy: "tokens",
};

/**
 * Map `sections.latestBreDecision` — `code`, `columns` (table headers) and `rows`
 * (BRE Status / Decision / Remarks / Discrepancy / Timestamp, each with initial + final).
 */
function mapBreData(latestSection: unknown, requirements: unknown[]): GuwBreData {
  const latest = recordOf(latestSection);
  const columns = recordList(latest.columns);
  const rows = recordList(latest.rows);
  const header = (key: string, fallback: string) =>
    str(columns.find((c) => str(c.key) === key)?.header) || fallback;
  const discrepancy = rows.find((r) => str(r.id) === "discrepancy");
  // Final BRE decision of the latest BRE section; `code` is only a fallback when the row is empty.
  const finalDecision = textOf(rows.find((r) => str(r.id) === "decision")?.final);

  // Status chips from the requirements array
  const statuses = ["Pending", "Received", "Accept", "Cancelled", "Reject", "Waived"];
  const reqs = requirements.filter(isRecord);
  const chips: GuwBreStatusChip[] = [
    { label: "All", count: reqs.length },
    ...statuses.map((label) => ({
      label,
      count: reqs.filter((r) => str(r.status).toLowerCase() === label.toLowerCase()).length,
    })),
  ];

  return {
    breCode: finalDecision || str(latest.code),
    initialDiscrepancy: splitDiscrepancies(textOf(discrepancy?.initial)),
    finalDiscrepancy: splitDiscrepancies(textOf(discrepancy?.final)),
    statusChips: chips,
    detailHeaders: {
      label: header("label", "BRE"),
      initial: header("initial", "Initial BRE"),
      final: header("final", "Final BRE"),
    },
    detailRows: rows.map((r) => {
      const id = str(r.id);
      const format = id === "timestamp" ? formatBreTimestamp : (s: string) => s;
      return {
        label: str(r.label),
        initial: format(textOf(r.initial)),
        final: format(textOf(r.final)),
        diff: BRE_ROW_DIFF[id],
      };
    }),
  };
}

/* ---- Dialog sections ---- */

/** Column order of `grievanceHistory.columns` (headers are positional in the API). */
const GRIEVANCE_COLUMN_KEYS = [
  "userName",
  "profile",
  "fupCode",
  "grievanceRemarks",
  "raisedDate",
  "tpaRemark",
] as const;

const GRIEVANCE_DEFAULT_HEADERS: Record<string, string> = {
  userName: "User Name",
  profile: "Profile",
  fupCode: "FUP Code",
  grievanceRemarks: "Grievance Raised Remark",
  raisedDate: "Grievance Raised Date",
  tpaRemark: "TPA Remarks",
};

/** Row field -> API row key. */
const GRIEVANCE_SOURCE_KEYS: Record<keyof GrievanceHistoryRow, string> = {
  userName: "userName",
  profile: "userRole",
  fupCode: "fupCode",
  grievanceRemarks: "grievanceRaisedRemark",
  tpaRemark: "tpaRemarks",
  raisedDate: "grievanceRaisedDate",
  updatedDate: "updatedDate",
  raisedBy: "raisedBy",
  updatedBy: "updatedBy",
};

function mapGrievanceSection(value: unknown): GuwGrievanceSection {
  const section = recordOf(value);
  const headers = headersByKey(GRIEVANCE_COLUMN_KEYS, section.columns);
  const text = (row: Record<string, unknown>, key: keyof GrievanceHistoryRow) =>
    str(row[GRIEVANCE_SOURCE_KEYS[key]]);
  return {
    title: str(section.title) || "Grievance History",
    columns: GRIEVANCE_COLUMN_KEYS.map((key) => ({
      key,
      header: headers[key] ?? GRIEVANCE_DEFAULT_HEADERS[key] ?? key,
    })),
    rows: recordList(section.rows).map((r) => ({
      userName: text(r, "userName"),
      fupCode: text(r, "fupCode"),
      profile: text(r, "profile"),
      grievanceRemarks: text(r, "grievanceRemarks"),
      tpaRemark: text(r, "tpaRemark"),
      raisedDate: text(r, "raisedDate"),
      updatedDate: text(r, "updatedDate"),
      raisedBy: text(r, "raisedBy"),
      updatedBy: text(r, "updatedBy"),
    })),
  };
}

/** Column order of `claimAudit.columns`. */
const CLAIM_AUDIT_COLUMN_KEYS = [
  "policyNo",
  "productCode",
  "claimKey",
  "canonicalId",
  "patientName",
  "ailment",
  "claimType",
  "subType",
  "intimationDate",
  "doa",
  "dod",
  "status",
] as const;

function mapClaimAuditSection(value: unknown): GuwClaimAuditSection {
  const section = recordOf(value);
  return {
    title: str(section.title) || "Claim Audit",
    columnHeaders: headersByKey(CLAIM_AUDIT_COLUMN_KEYS, section.columns),
    rows: recordList(section.rows).map((r, index) => ({
      id: str(r.id) || String(index + 1),
      policyNo: str(r.policyNo),
      productCode: str(r.productCode),
      claimKey: str(r.claimKey),
      canonicalId: str(r.canonicalId),
      patientName: str(r.patientName),
      ailment: str(r.ailment),
      claimType: str(r.claimType),
      subType: str(r.subType),
      intimationDate: str(r.intimationDate),
      doa: str(r.doa),
      dod: str(r.dod),
      status: str(r.status),
    })),
  };
}

/** Column order of `specialRemarks.columns`. */
const SPECIAL_REMARKS_COLUMN_KEYS = ["comments", "updatedDate", "updatedBy"] as const;

function mapSpecialRemarksSection(value: unknown): GuwSpecialRemarksSection {
  const section = recordOf(value);
  return {
    title: str(section.title) || "Special Remarks",
    columnHeaders: headersByKey(SPECIAL_REMARKS_COLUMN_KEYS, section.columns),
    rows: recordList(section.rows).map((r, index) => ({
      id: str(r.id) || String(index + 1),
      comments: str(r.comments),
      updatedDate: str(r.updatedDate),
      updatedBy: str(r.updatedBy),
    })),
  };
}

function mapUwGuidelinesSection(value: unknown): GuwUwGuidelinesSection {
  const section = recordOf(value);
  const choices = Array.isArray(section.justificationChoices)
    ? section.justificationChoices.map(str).filter(Boolean)
    : [];
  return {
    title: str(section.title) || "UW Guidelines",
    rows: recordList(section.reasons).map((r) => ({
      reason: str(r.reason),
      remark: str(r.remark),
      systemAction: str(r.systemAction),
      justificationReason: str(r.justificationReason),
      justificationRemark: str(r.justificationRemarks ?? r.justificationRemark),
    })),
    justificationReasons: choices.length > 0 ? choices : undefined,
  };
}

/** `sections.sdtDecision.fields` + the dialog row counts. */
function mapSdtRow(sdtSection: unknown, dialogs: GuwDialogSections): GuwSdtRow {
  const fields = recordOf(sdtSection).fields;
  return {
    financialDecision: fieldValue(fields, "Financial Decision"),
    medicalDecision: fieldValue(fields, "Medical Decision"),
    lumiqDecision: fieldValue(fields, "LumiQ Decision"),
    grievanceHistoryCount: dialogs.grievanceHistory.rows.length,
    claimAuditCount: dialogs.claimAudit.rows.length,
    uwGuidelinesCount: dialogs.uwGuidelines.rows.length,
  };
}

/* ------------------------------------------------------------------ */
/* Member list (one entry per object in `data[]`)                        */
/* ------------------------------------------------------------------ */

export interface GuwMemberSummary {
  /** e.g. "Life Assured 1" — also the member id used in the DRS url and decision storage key */
  memberId: string;
  name: string;
  /** e.g. "31 yrs / Male / Graduate / PROF / CHENNAI" */
  demographics: string;
  /** `sections.caseUwDecision` "Case UW Decision" value ("" when none yet) */
  uwDecision: string;
}

/** The per-member objects of the payload (`data[]`, or the single `data` object / bare payload). */
function memberRecords(payload: unknown): Record<string, unknown>[] {
  const root = recordOf(payload);
  return Array.isArray(root.data) ? root.data.filter(isRecord) : [isRecord(root.data) ? root.data : root];
}

/** Member id of one `data[]` object: the "Member" field of `rowDetails` id 1 (e.g. "Life Assured 1"). */
function memberIdOf(data: Record<string, unknown>, index: number): string {
  const memberFields = mapRowDetails(data.rowDetails).find((r) => r.id === 1)?.fields;
  return fieldValue(memberFields, "Member") || str(data.memberType) || `Life Assured ${index + 1}`;
}

/** Member rows for the member selection screen, from `rowDetails` id 0 (name) and id 1 (member / demographics). */
export function mapGuwMembers(payload: unknown): GuwMemberSummary[] {
  return memberRecords(payload).map((data, index) => {
    const rows = mapRowDetails(data.rowDetails);
    const nameFields = rows.find((r) => r.id === 0)?.fields;
    const memberFields = rows.find((r) => r.id === 1)?.fields;
    const detail = (name: string) => fieldValue(memberFields, name) || "-";
    const age = fieldValue(memberFields, "Age");
    const caseDecisionFields = recordOf(findSection(data.sections, "caseUwDecision")).fields;
    return {
      memberId: memberIdOf(data, index),
      name: fieldValue(nameFields, "Name") || "-",
      demographics: [
        age ? `${age} yrs` : "-",
        detail("Gender"),
        detail("Education"),
        detail("Occupation"),
        detail("City, State"),
      ].join(" / "),
      uwDecision: fieldValue(caseDecisionFields, "Case UW Decision"),
    };
  });
}

export async function fetchGuwMembers(applicationNo: string): Promise<GuwMemberSummary[]> {
  await wait(250);
  // The mock is served for any applicationNo to allow local dev with any inbox task.
  return applicationNo ? mapGuwMembers(guwDrsMock as unknown) : [];
}

/* ------------------------------------------------------------------ */
/* Public mapper                                                         */
/* ------------------------------------------------------------------ */

/**
 * Maps one member's `data[]` object. `memberId` (e.g. "Life Assured 2") picks the member; when it is
 * omitted or matches nothing, the first member is used.
 */
export function mapGuwDrsPayload(payload: unknown, memberId?: string): GuwDrsRecord {
  const records = memberRecords(payload);
  const data =
    (memberId ? records.find((r, i) => memberIdOf(r, i) === memberId) : undefined) ?? records[0] ?? {};

  const applicationNo = str(data.applicationNo);
  const sections = Array.isArray(data.sections) ? data.sections : [];

  // Map raw requirements to RequirementItem[]
  const requirementSection = findSection(sections, "requirementManagement");
  const rawReqs = Array.isArray(requirementSection) ? requirementSection : [];
  const requirements: RequirementItem[] = mapRequirements(
    rawReqs.filter(isRecord).map((r) => ({
      requirementId: typeof r.requirementId === "number" ? r.requirementId : 0,
      status: str(r.status),
      ocrStatus: str(r.ocrStatus),
      team: str(r.team),
      profile: str(r.profile),
      category: str(r.category),
      subCategory: str(r.subCategory),
      document: str(r.document),
      reason: str(r.reason),
      fupCode: str(r.fupCode),
      extraRemarks: str(r.extraRemarks),
      description: str(r.description),
    } satisfies RawRequirement)),
  );

  const rowDetails = mapRowDetails(data.rowDetails);
  const applicantName = fieldValue(rowDetails[0]?.fields, "Name");

  const riskCards: RiskCardData[] = Array.isArray(data.cardDetails)
    ? data.cardDetails.map(mapCard).filter((c): c is RiskCardData => c !== null)
    : [];

  const dialogSections: GuwDialogSections = {
    grievanceHistory: mapGrievanceSection(findSection(sections, "grievanceHistory")),
    claimAudit: mapClaimAuditSection(findSection(sections, "claimAudit")),
    specialRemarks: mapSpecialRemarksSection(findSection(sections, "specialRemarks")),
    uwGuidelines: mapUwGuidelinesSection(findSection(sections, "uwGuidelines")),
  };

  const caseDecisionFields = recordOf(findSection(sections, "caseUwDecision")).fields;

  return {
    applicationNo,
    applicantName,
    applicationLabel: `App No. - ${applicationNo}`,
    rowDetails,
    riskCards,
    sdtRow: mapSdtRow(findSection(sections, "sdtDecision"), dialogSections),
    breData: mapBreData(findSection(sections, "latestBreDecision"), rawReqs),
    sections: dialogSections,
    requirements,
    quickLinks: mapQuickLinksSubSections(data.subSections),
    uwData: {
      breOverallDecision: fieldValue(caseDecisionFields, "BRE Overall Decision"),
      breOverallRemarks: fieldValue(caseDecisionFields, "BRE Overall Remarks"),
    },
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

function getSessionValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

function setSessionValue(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, value);
}

function removeSessionValue(key: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

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

/** DRS record of one member (`memberId`, e.g. "Life Assured 2"); the first member when omitted. */
export async function fetchGuwDrs(applicationNo: string, memberId?: string): Promise<GuwDrsRecord | null> {
  await wait(250);
  // The mock file holds one `data[]` object per member.
  // We serve it for any applicationNo to allow local dev with any inbox task.
  const payload = guwDrsMock as unknown;
  const record = mapGuwDrsPayload(payload, memberId);
  const submittedDecision = loadGuwSubmittedDecision(applicationNo) ?? undefined;
  const resolvedAppNo = record.applicationNo || applicationNo;
  return {
    ...record,
    applicationNo: resolvedAppNo,
    applicationLabel: `App No. - ${resolvedAppNo}`,
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
    userId: getSessionUser()?.username ?? "",
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
