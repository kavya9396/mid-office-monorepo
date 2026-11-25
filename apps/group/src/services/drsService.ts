import {
  applyBusinessApiAuthHeaders,
  formatDateTime,
  formatIndianCurrency,
  getDrsRoleType,
  getDrsTaskIds,
  getMasterList,
  getSessionUser,
  getToken,
  masterUrls,
  useMock,
} from "@insurance-poc/utils";
import type { Column } from "@insurance-poc/ui";
import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import { grievanceColumns } from "@insurance-poc/common/grievance-history";
import type { LifeAssuredApplicant, RiderEditRow } from "@insurance-poc/common/life-assured";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { RiskCardData, RiskCardField } from "@insurance-poc/common/risk-cards";
import type { ComparisonRow } from "@insurance-poc/common/decision-bar";
import { store } from "../app/store";
import { groupDrsApi } from "./drsApi";
import { mapApplicants } from "../modules/drs/lifeAssuredData";
import {
  mapMembersQuickLinks,
  mapRaiseGrievance,
  type QuickLinksSubSections,
} from "../modules/drs/quickLinksData";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";
import type { MmtGrievanceMemberContext } from "./mmtGrievanceService";
import { formatBreTimestamp, splitDiscrepancies } from "../modules/drs/breFormat";
import { readDvtValidationResponse } from "./dvtValidationService";
import guwValidationMock from "../../../../mock/drs/guw-validation.json";
import uwDecisionMappingMock from "../../../../mock/drs/guw-uw-decision-mapping.json";

export type CardType = "APPLICATION" | "SOURCE" | "GROUP" | "RISK";

export type CardDetail = {
  type: CardType;
  attributes: DetailAttribute[];
  expandedAttributes: DetailAttribute[];
  tables: DetailTable[];
};

export type BreRow = {
  id: string;
  label: string;
  initial: string;
  final: string;
};

export type BreDecision = {
  /** Column headers of the BRE comparison table. */
  headers: { label: string; initial: string; final: string };
  rows: BreRow[];
  /** Values of the "decision" row, shown in the BRE decision bar. */
  initialDecision: string;
  decision: string;
};

export type DvtDecision = {
  remarks: string;
  decision: string;
  decisionCode: string;
  decisionOptions: string[];
};

export type GroupDrsData = {
  applicationNo: string;
  cardDetails: CardDetail[];
  breDecision: BreDecision;
  dvtDecision: DvtDecision;
  requirements: RequirementItem[];
  applicants: LifeAssuredApplicant[];
  memberTypes: string[];
  /** Quick Link pages (previous policy, open tasks, audit trail, risk details). */
  quickLinks: QuickLinksSubSections;
  /** Banner rows from the primary member (`membersDetails[].rowDetails`). */
  rowDetails: BannerRowDetail[];
  applicantName: string;
  grievanceHistoryTitle: string;
  tpaGrievanceTitle: string;
  grievanceHistoryColumns: Column<GrievanceHistoryRow>[];
  tpaGrievanceColumns: Column<GrievanceHistoryRow>[];
  grievanceHistory: GrievanceHistoryRow[];
  tpaGrievanceDetails: GrievanceHistoryRow[];
  /** `membersDetails[].subSections` applicant profile, with member-level fallback. */
  subSections: { partyId: string; lifeNumber: string };
  /** Party context sent to the MMT grievance fetch and save APIs. */
  memberContext: MmtGrievanceMemberContext;
};

// `cardDetails[].type` as sent by the API -> internal card type
const CARD_TYPE_BY_NAME: Record<string, CardType> = {
  "Application Detail": "APPLICATION",
  "Source Detail": "SOURCE",
  "Group Policy Detail": "GROUP",
  "Risk Detail": "RISK",
};

const RIDER_TABLE_NAME = "Rider Details";

// Rider Details table column -> key in the API row. "Rider" is numbered by row position instead.
const RIDER_COLUMN_KEYS: Record<string, string | undefined> = {
  "Rider Code": "name",
  "Sum Assured": "sumAssured",
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function invalidResponse(): Error {
  return new Error("Group DRS response is not in the expected format.");
}

function readCardType(value: string): CardType {
  const cardType = CARD_TYPE_BY_NAME[value];
  if (!cardType) throw invalidResponse();
  return cardType;
}

function readAttributes(value: unknown): DetailAttribute[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!isRecord(item) || typeof item.name !== "string") return { name: "", value: "-" };
    const val = readText(item.value).trim();
    return { name: item.name, value: val.length > 0 ? val : "-" };
  });
}

function readTables(value: unknown): DetailTable[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!isRecord(item) || typeof item.name !== "string" || !Array.isArray(item.columns)) {
      return { name: "", columns: [], rows: [] };
    }
    if (!item.columns.every((column) => typeof column === "string")) return { name: "", columns: [], rows: [] };
    if (!Array.isArray(item.rows)) return { name: item.name, columns: item.columns, rows: [] };

    const columns: string[] = item.columns;
    const isRiderTable = item.name === RIDER_TABLE_NAME;

    const rows = item.rows.map((row, index) => {
      if (!isRecord(row)) return {};
      const cells: Record<string, string> = {};
      for (const column of columns) {
        if (isRiderTable && column === "Rider") {
          cells[column] = `Rider ${index + 1}`;
          continue;
        }
        const key = isRiderTable ? RIDER_COLUMN_KEYS[column] : column;
        const cellValue = key ? readText(row[key]).trim() : "";
        cells[column] = cellValue;
      }
      return cells;
    });

    return { name: item.name, columns, rows };
  });
}

function readCards(value: unknown): CardDetail[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => isRecord(item) && typeof item.type === "string" && Boolean(CARD_TYPE_BY_NAME[item.type]))
    .map((item) => ({
      type: readCardType(item.type as string),
      attributes: readAttributes(item.attributes),
      expandedAttributes: readAttributes(item.expandedAttributes),
      tables: readTables(item.tables),
    }));
}

/** Finds an entry by name. A missing section list means that section was not sent. */
function findSection(sections: unknown, name: string): Record<string, unknown> | null {
  if (!Array.isArray(sections)) return null;
  return sections.find((s): s is Record<string, unknown> => isRecord(s) && s.name === name) ?? null;
}

const BRE_DECISION_ROW_ID = "decision";

/** BRE cell values are strings, except "decision" which is a list of codes. */
function readBreText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map(readText)
      .filter((item) => item !== "")
      .join(", ");
  }
  return readText(value);
}

function readBreHeader(columns: unknown, key: string, fallback: string): string {
  if (!Array.isArray(columns)) return fallback;
  const column = columns.find((item) => isRecord(item) && item.key === key);
  return isRecord(column) && typeof column.header === "string" ? column.header : fallback;
}

function readBre(section: Record<string, unknown> | null): BreDecision {
  const value = section?.value;
  if (!isRecord(value) || !Array.isArray(value.rows)) {
    return {
      headers: { label: "BRE", initial: "Initial BRE", final: "Final BRE" },
      rows: [],
      initialDecision: "",
      decision: "",
    };
  }

  const rows = value.rows.flatMap((row): BreRow[] => {
    if (!isRecord(row)) return [];
    return [{
      id: readText(row.id),
      label: readText(row.label),
      initial: readBreText(row.initial),
      final: readBreText(row.final),
    }];
  });
  const decisionRow = rows.find((row) => row.id === BRE_DECISION_ROW_ID);

  return {
    headers: {
      label: readBreHeader(value.columns, "label", "BRE"),
      initial: readBreHeader(value.columns, "initial", "Initial BRE"),
      final: readBreHeader(value.columns, "final", "Final BRE"),
    },
    rows,
    initialDecision: decisionRow?.initial ?? "",
    decision: decisionRow?.final ?? "",
  };
}

function readDvtDecision(section: Record<string, unknown> | null): DvtDecision {
  const value = isRecord(section?.value) ? section.value : {};
  const options = Array.isArray(value.decisionOptions)
    ? value.decisionOptions.filter((option): option is string => typeof option === "string")
    : [];
  return {
    remarks: readText(value.dvtRemarks),
    decision: readText(value.dvtDecision),
    decisionCode: readText(value.decisionCode),
    decisionOptions: options,
  };
}

function extractRequirementRows(rowsOrSection: unknown): unknown[] {
  if (Array.isArray(rowsOrSection)) return rowsOrSection;
  if (isRecord(rowsOrSection)) {
    if (Array.isArray(rowsOrSection.rows)) return rowsOrSection.rows;
    if (Array.isArray(rowsOrSection.requirementManagement)) return rowsOrSection.requirementManagement;
    // GUW / HOD / Sr UW payloads keep the rows under the section's `value` (same as the GUW fetch mapper).
    if (isRecord(rowsOrSection.value) && Array.isArray(rowsOrSection.value.rows)) return rowsOrSection.value.rows;
  }
  return [];
}

/** Requirement rows parser handling either an array or an object with `.rows`. */
export function mapRawRequirementRows(rowsOrSection: unknown): RequirementItem[] {
  const rows = extractRequirementRows(rowsOrSection);

  const rawList: RawRequirement[] = rows.map((row, index) => {
    if (!isRecord(row)) {
      return {
        requirementId: index + 1,
        status: "",
        ocrStatus: "",
        team: "",
        profile: "",
        category: "",
        subCategory: "",
        document: "",
        reason: "",
        fupCode: "",
        extraRemarks: "",
        description: "",
      };
    }
    return {
      requirementId: typeof row.requirementId === "number" ? row.requirementId : index + 1,
      status: readText(row.status),
      ocrStatus: readText(row.ocrStatus),
      team: readText(row.team),
      profile: readText(row.profile),
      category: readText(row.category),
      subCategory: readText(row.subCategory),
      document: readText(row.document),
      reason: readText(row.reason),
      fupCode: readText(row.fupCode),
      extraRemarks: readText(row.extraRemarks),
      description: readText(row.description),
    };
  });

  return mapRequirements(rawList);
}

/** Rider rows of the Application Detail card's "Rider Details" table (name + sum assured only). */
function readRiders(cardDetails: unknown): RiderEditRow[] {
  if (!Array.isArray(cardDetails)) return [];
  const card = cardDetails.find(
    (item): item is Record<string, unknown> => isRecord(item) && item.type === "Application Detail",
  );
  if (!card || !Array.isArray(card.tables)) return [];
  const table = card.tables.find(
    (item): item is Record<string, unknown> => isRecord(item) && item.name === RIDER_TABLE_NAME,
  );
  if (!table || !Array.isArray(table.rows)) return [];
  return table.rows
    .filter(isRecord)
    .map((row) => ({
      riderName: readText(row["Rider Code"]) || readText(row.name) || readText(row.riderName) || readText(row["Rider Name"]),
      sumAssured: readText(row["Sum Assured"]) || readText(row.sumAssured),
      riderTerm: readText(row.term) || readText(row.riderTerm) || readText(row["Rider Term"]),
    }))
    .filter((r) => Boolean(r.riderName.trim() || r.sumAssured.trim() || r.riderTerm.trim()));
}

function readApplicantMembers(section: Record<string, unknown> | null): unknown[] {
  const members = section?.value;
  return Array.isArray(members) ? members : [];
}

export function readMemberTypes(membersDetails: unknown): string[] {
  if (!Array.isArray(membersDetails)) return [];
  return Array.from(
    new Set(
      membersDetails
        .map((m) => (isRecord(m) && typeof m.memberType === "string" ? m.memberType.trim() : ""))
        .filter((val): val is string => val.length > 0),
    ),
  );
}

const GRIEVANCE_ROW_KEYS: (keyof GrievanceHistoryRow)[] = [
  "userName",
  "fupCode",
  "profile",
  "grievanceRemarks",
  "tpaRemark",
  "raisedDate",
  "updatedDate",
  "raisedBy",
  "updatedBy",
];

const GRIEVANCE_ROW_ALIASES: Record<keyof GrievanceHistoryRow, string[]> = {
  userName: ["userName", "user", "raisedBy", "raisedRole", "User Name"],
  fupCode: ["fupCode", "FUP Code"],
  profile: ["profile", "Profile"],
  grievanceRemarks: ["grievanceRemarks", "userRemarks", "grievanceRaisedRemark", "Grievance Raised Remark"],
  tpaRemark: ["tpaRemark", "tpaRemarks", "TPA Remarks"],
  raisedDate: ["raisedDate", "grievanceRaisedDate", "Grievance Raised Date"],
  updatedDate: ["updatedDate", "Updated Date"],
  raisedBy: ["raisedBy", "Raised by"],
  updatedBy: ["updatedBy", "Updated by"],
};

function findNamedSection(sections: unknown, name: string): Record<string, unknown> | null {
  if (!Array.isArray(sections)) return null;
  return sections.find((section): section is Record<string, unknown> => isRecord(section) && section.name === name) ?? null;
}

function buildGrievanceColumns(sectionValue: unknown): Column<GrievanceHistoryRow>[] {
  const section = isRecord(sectionValue) ? sectionValue : {};
  const labels = Array.isArray(section.columns) ? section.columns.map((column) => headerText(column)) : [];
  const defaults = new Map(grievanceColumns.map((column) => [column.key, column]));
  return GRIEVANCE_ROW_KEYS.map((key, index) => {
    const fallback = defaults.get(key);
    return {
      key,
      header: labels[index] || fallback?.header || key,
      width: fallback?.width,
    };
  });
}

function rowField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    if (key in row && readText(row[key]).trim().length > 0) return readText(row[key]).trim();
  }
  return "";
}

function formatGrievanceDate(value: string): string {
  if (value.length === 0) return "";
  const formatted = formatDateTime(value);
  return formatted.length > 0 ? formatted : value;
}

function mapGrievanceRows(section: Record<string, unknown> | null): GrievanceHistoryRow[] {
  const value = section?.value;
  const rows = isRecord(value) && Array.isArray(value.rows) ? value.rows : [];
  return rows.filter(isRecord).map((row) => ({
    userName: rowField(row, GRIEVANCE_ROW_ALIASES.userName),
    fupCode: rowField(row, GRIEVANCE_ROW_ALIASES.fupCode),
    profile: rowField(row, GRIEVANCE_ROW_ALIASES.profile),
    grievanceRemarks: rowField(row, GRIEVANCE_ROW_ALIASES.grievanceRemarks),
    tpaRemark: rowField(row, GRIEVANCE_ROW_ALIASES.tpaRemark),
    raisedDate: formatGrievanceDate(rowField(row, GRIEVANCE_ROW_ALIASES.raisedDate)),
    updatedDate: formatGrievanceDate(rowField(row, GRIEVANCE_ROW_ALIASES.updatedDate)),
    raisedBy: rowField(row, GRIEVANCE_ROW_ALIASES.raisedBy),
    updatedBy: rowField(row, GRIEVANCE_ROW_ALIASES.updatedBy) || "-",
  }));
}

function mapApplicantSubSection(member: Record<string, unknown> | null): { partyId: string; lifeNumber: string } {
  const subSections = member?.subSections;
  const profileSection = Array.isArray(subSections)
    ? subSections.filter(isRecord).find((entry) => entry.name === "applicantProfile")
    : null;
  const value = isRecord(profileSection?.value) ? profileSection.value : null;
  return {
    partyId: readText(value?.partyId).trim() || readText(member?.partyId).trim(),
    lifeNumber: readText(value?.lifeNumber).trim() || readText(member?.lifeNumber).trim(),
  };
}

export function mapGroupDrsPayload(value: unknown): GroupDrsData {
  if (!isRecord(value)) throw invalidResponse();
  const data = isRecord(value.data) ? value.data : value;

  const applicationNo = readText(data.applicationNo).trim();
  if (applicationNo.length === 0) throw invalidResponse();

  const sections = Array.isArray(data.commonSection) ? data.commonSection : data.sections;
  const membersDetails = Array.isArray(data.membersDetails) ? data.membersDetails : [];
  const primaryMember = membersDetails.find(isRecord) ?? null;
  const cardDetailsRaw = primaryMember?.cardDetails ?? data.cardDetails;
  const rowDetails = mapRowDetails(primaryMember?.rowDetails);
  const nameRow = rowDetails.find((row) => row.id === 0);
  const historySection = findNamedSection(sections, "grievanceHistory");
  const tpaSection = findNamedSection(sections, "tpaGrievanceDetails");
  const subSections = mapApplicantSubSection(primaryMember);

  return {
    applicationNo,
    cardDetails: readCards(cardDetailsRaw),
    breDecision: readBre(findSection(sections, "latestBreDecision")),
    dvtDecision: readDvtDecision(findSection(sections, "dvtDecision")),
    requirements: mapRawRequirementRows(findSection(sections, "requirementManagement")),
    applicants: mapApplicants({
      members: readApplicantMembers(
        Array.isArray(data.membersDetails)
          ? { value: data.membersDetails }
          : findSection(sections, "applicantProfile")
      ),
      riders: readRiders(cardDetailsRaw),
    }),
    memberTypes: readMemberTypes(data.membersDetails),
    quickLinks: mapMembersQuickLinks(data.membersDetails),
    rowDetails,
    applicantName: fieldValue(nameRow?.fields, "Name"),
    grievanceHistoryTitle: readText(historySection?.label).trim() || "Grievance History",
    tpaGrievanceTitle: readText(tpaSection?.label).trim() || "TPA Grievance Details",
    grievanceHistoryColumns: buildGrievanceColumns(historySection?.value),
    tpaGrievanceColumns: buildGrievanceColumns(tpaSection?.value),
    grievanceHistory: mapGrievanceRows(historySection),
    tpaGrievanceDetails: mapGrievanceRows(tpaSection),
    subSections,
    memberContext: {
      applicationNo,
      partyId: subSections.partyId.length > 0 ? subSections.partyId : undefined,
      lifeNumber: subSections.lifeNumber.length > 0 ? subSections.lifeNumber : undefined,
      transactionId: readText(data.transactionId).trim() || null,
    },
  };
}

/* ------------------------------------------------------------------ */
/* GUW: UW decision / parallel decision requests                        */
/* ------------------------------------------------------------------ */

/** Line of business sent as `lob` on the GUW `uw-decision` and `parallel-decision` requests (Group = "G"). */
export const GUW_LOB = "G";


/** Form values the `uw-decision` request is built from (see `buildGuwUwDecisionRequest`). */
export interface GuwDecisionRowInput {
  productName: string;
  productCode: string;
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

/** One selected Raise Referral row (Refer To / Reason / Remarks / Assigned To). */
export interface GuwReferralRowInput {
  /** Referral row code, e.g. REF_HOD. Sent as `referTo`. */
  target: string;
  reason: string;
  remarks: string;
  /** Selected user's full name; sent as `assignedTo.name` in the `parallel-decision` request. */
  assignedTo: string;
  /** Selected user's NTID; sent as `assignedTo.value` in the `parallel-decision` request. */
  assignedToNtid?: string;
}

export interface GuwDecisionFormInput {
  applicationNo: string;
  partyId: string;
  roleType: string;
  screenType: string;
  userId?: string;
  createdBy: string;
  taskId?: string;
  instanceId?: string;
  /** Decision code sent as `decision` and `decisionCode` (STD, BOR_STD, REJ, DC, POSTP, CO, EP, HOLD, APPROVER ...). */
  decision: string;
  /** Decision Code picked from the `uw_decision_mapping` master; sent as `decisionCode` (falls back to `decision`). */
  decisionCode?: string;
  uwRemarks: string;
  /** Multi-select Reasons of Borderline Standard / Reject / Decline / Postpone / Counter Offer / Extra Premium. */
  reasons: string[];
  holdReason: string;
  postponePeriod: string;
  reconsiderPossible: string;
  reconsiderAfter: string;
  reconsiderReqType: string;
  reconsiderReqDetails: string;
  /** Counter Sign fields, set when the Counter Sign form is part of this submit. */
  approver?: { reason: string; referTo: string; assignedTo: string };
  rows: GuwDecisionRowInput[];
}

/** One Decision Details table row sent with Borderline Standard / Counter Offer / Extra Premium. */
export interface GuwUwDecisionProduct {
  productLineId: number;
  partyId: string;
  applicationNumber: string;
  productCode: string;
  productName: string;
  lineType: "BASE" | "RIDER";
  deciType: string;
  bstdCode: string | null;
  sa: string | null;
  changedSa: string | null;
  pt: string | null;
  changedPt: string | null;
  ppt: string | null;
  changedPpt: string | null;
  loadingClass: string | null;
  loadingReason: string | null;
  createdBy: string;
  updatedBy: string;
}

/**
 * Request of the GUW `uw-decision` API (`/api/v1/drs/uw-decision`), sent when the member decision is submitted.
 * The optional fields depend on the decision: Borderline Standard / Counter Offer / Extra Premium carry
 * `products`; Reject / Decline / Postpone carry the reconsideration fields; Hold carries `reasons`;
 * Counter Sign (APPROVER) carries `reason`, `referTo` and `assignedTo`.
 */
export interface GuwUwDecisionRequest {
  applicationNo: string;
  partyId: string;
  roleType: string;
  lob: typeof GUW_LOB;
  level: "member";
  screenType: string;
  decision: string;
  decisionCode: string;
  uwRemarks: string;
  userId?: string;
  taskId?: string;
  instanceId?: string;
  reasons?: string | string[];
  recAllowed?: string;
  reconsiderAfter?: string;
  requirementType?: string;
  requirementDetails?: string;
  postponePeriod?: string;
  reason?: string;
  referTo?: string;
  assignedTo?: string;
  products?: GuwUwDecisionProduct[];
  createdBy: string;
}

/** Saved decision returned by the `uw-decision` API. */
export interface GuwUwDecisionResult {
  uwDecisionId: string;
  level: string;
  screenType: string;
  applicationNumber: string;
  partyId: string;
  roleType: string;
  caseUwDecision: string;
  decision: string;
  decisionCode: string;
  uwRemarks: string;
  reasons: string;
  outlier: string;
  smokerStatus: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/** "â‚¹50,00,000" -> "5000000"; a blank or dash value -> null. */
function toAmount(value: string): string | null {
  const digits = value.replace(/[^\d.]/g, "");
  return digits.length > 0 ? digits : null;
}

function orNull(value: string): string | null {
  const text = value.trim();
  return text.length > 0 ? text : null;
}

const RECONSIDER_DECISIONS = ["REJ", "DC", "POSTP"];
const PRODUCT_DECISIONS = ["BOR_STD", "CO", "EP"];

/** Decision Details table rows -> `products` entries (shared by `uw-decision` and the validation request). */
export function buildGuwUwDecisionProducts(
  applicationNo: string,
  partyId: string,
  createdBy: string,
  rows: GuwDecisionRowInput[],
): GuwUwDecisionProduct[] {
  return rows.map((row, index) => ({
    productLineId: index + 1,
    partyId,
    applicationNumber: applicationNo,
    productCode: row.productCode,
    productName: row.productName,
    lineType: row.isRider ? "RIDER" : "BASE",
    deciType: row.type,
    bstdCode: orNull(row.bstdCode),
    sa: toAmount(row.sa),
    changedSa: toAmount(row.changedSa),
    pt: toAmount(row.pt),
    changedPt: toAmount(row.changedPt),
    ppt: null,
    changedPpt: null,
    loadingClass: orNull(row.loadingClass),
    loadingReason: orNull(row.loadingReason),
    createdBy,
    updatedBy: createdBy,
  }));
}

/** Decisions that carry the Decision Details table (Borderline Standard / Counter Offer / Extra Premium). */
export function hasGuwDecisionProducts(decision: string): boolean {
  return PRODUCT_DECISIONS.includes(decision);
}

/**
 * Domain -> `uw-decision` DTO. Which fields are sent depends on the decision:
 * STD: base fields only. BOR_STD / CO / EP: reasons + products. REJ / DC / POSTP: reasons, recAllowed,
 * requirementDetails, reconsiderAfter + requirementType (only when reconsideration is allowed), postponePeriod (POSTP).
 * HOLD: reasons. APPROVER: reason, referTo, assignedTo.
 */
export function buildGuwUwDecisionRequest(input: GuwDecisionFormInput): GuwUwDecisionRequest {
  const { decision } = input;
  const taskIds = getDrsTaskIds();
  const taskId = input.taskId?.trim() || taskIds.taskId;
  const instanceId = input.instanceId?.trim() || taskIds.instanceId;
  const userId = input.userId?.trim() || input.createdBy?.trim() || getSessionUser()?.username || "";
  const request: GuwUwDecisionRequest = {
    applicationNo: input.applicationNo,
    partyId: input.partyId,
    roleType: input.roleType,
    lob: GUW_LOB,
    level: "member",
    screenType: input.screenType,
    decision,
    decisionCode: input.decisionCode?.trim() || decision,
    uwRemarks: input.uwRemarks,
    userId,
    createdBy: input.createdBy,
    ...(taskId ? { taskId } : {}),
    ...(instanceId ? { instanceId } : {}),
  };

  if (PRODUCT_DECISIONS.includes(decision) || RECONSIDER_DECISIONS.includes(decision)) {
    // Always sent as a list, even when only one reason is selected
    if (input.reasons.length > 0) request.reasons = input.reasons;
  }

  if (PRODUCT_DECISIONS.includes(decision)) {
    request.products = buildGuwUwDecisionProducts(input.applicationNo, input.partyId, input.createdBy, input.rows);
  }

  if (RECONSIDER_DECISIONS.includes(decision)) {
    if (decision === "POSTP") request.postponePeriod = input.postponePeriod;
    request.recAllowed = input.reconsiderPossible;
    if (input.reconsiderPossible === "Yes") {
      request.reconsiderAfter = input.reconsiderAfter;
      request.requirementType = input.reconsiderReqType;
    }
    request.requirementDetails = input.reconsiderReqDetails;
  }

  if (decision === "HOLD") request.reasons = input.holdReason;

  if (input.approver) {
    request.reason = input.approver.reason;
    request.referTo = input.approver.referTo;
    request.assignedTo = input.approver.assignedTo;
  }

  return request;
}

/** Base fields shared by every referral request (the per-row fields are added by the caller). */
export type GuwReferralBaseInput = Pick<
  GuwDecisionFormInput,
  "applicationNo" | "partyId" | "roleType" | "screenType" | "createdBy" | "taskId" | "instanceId"
> & {
  userId?: string;
};

/**
 * Raise Referral: one `uw-decision` request per selected referral row, sent together as an array.
 * Each item carries `reason`, `referTo`, `uwRemarks` and (when entered) `assignedTo`.
 */
export function buildGuwUwReferralRequests(
  base: GuwReferralBaseInput,
  rows: GuwReferralRowInput[],
): GuwUwDecisionRequest[] {
  const taskIds = getDrsTaskIds();
  const taskId = base.taskId?.trim() || taskIds.taskId;
  const instanceId = base.instanceId?.trim() || taskIds.instanceId;
  const userId = base.userId?.trim() || base.createdBy?.trim() || getSessionUser()?.username || "";
  return rows.map((row) => {
    const request: GuwUwDecisionRequest = {
      applicationNo: base.applicationNo,
      partyId: base.partyId,
      roleType: base.roleType,
      lob: GUW_LOB,
      level: "member",
      screenType: base.screenType,
      decision: "REFERRAL",
      decisionCode: "REFERRAL",
      uwRemarks: row.remarks.trim(),
      reason: row.reason,
      referTo: row.target,
      userId,
      createdBy: base.createdBy,
      ...(taskId ? { taskId } : {}),
      ...(instanceId ? { instanceId } : {}),
    };
    const assignedTo = row.assignedTo.trim();
    if (assignedTo) request.assignedTo = assignedTo;
    return request;
  });
}

/** Action sent as `action` to the `parallel-decision` API. */
export type GuwParallelDecisionAction = "OPINION" | "COUNTER_SIGN" | "RAISE_REFERRAL";

/** One `parallelDecision` item: who the case is referred to and (optionally) who it is assigned to. */
export interface GuwParallelDecisionItem {
  referTo: {
    referValue: string;
    description: string;
    referName: string;
    remarks: string;
    reason: string;
  };
  assignedTo?: {
    name: string;
    description: string;
    value: string;
  };
}

/** Request of the GUW `parallel-decision` API (`/api/v1/drs/parallel-decision`). */
export interface GuwParallelDecisionRequest {
  screenType: string;
  lob: typeof GUW_LOB;
  parallelDecision: GuwParallelDecisionItem[];
  appNo: string;
  partyId: string;
  action: GuwParallelDecisionAction;
  /** Always sent, always an empty string. */
  decision: "";
  /** Always sent, always a single space. */
  remarks: " ";
  userId: string;
  taskId?: string;
  instanceId?: string;
  // Extra top-level object, not sent. Raise Referral only: the Refer To values (master GUW_REF_TO) of the selected rows.
  // refer_to?: string[];
}

export type GuwParallelDecisionBaseInput = Pick<GuwDecisionFormInput, "applicationNo" | "partyId" | "screenType"> & {
  userId: string;
  taskId?: string;
  instanceId?: string;
};

/** Master `GUW_REF_TO` value (lower case) of the Sr UW Opinion referral. */
export const SR_UW_OPINION_MASTER_VALUE = "sr uw opinion";

/**
 * Referral code of Sr UW Opinion, read from the master `misc` type GUW_REF_TO (the entry whose value is
 * "SR UW Opinion" and whose code is a `REF_` code, e.g. REF_SRUW). "" when the master has none.
 * Read at call time because the master data is only in session after login.
 */
export function guwSrUwReferralCode(): string {
  const entry = getMasterList("misc", "GUW_REF_TO").find(
    (item) =>
      item.isActive === "Y" &&
      (item.value ?? item.description).trim().toLowerCase() === SR_UW_OPINION_MASTER_VALUE &&
      item.code.toUpperCase().startsWith("REF_"),
  );
  return entry?.code ?? "";
}

export function isGuwSrUwReferral(target: string): boolean {
  const code = guwSrUwReferralCode();
  return code !== "" && target === code;
}

/** Referral rows whose Refer To is an opinion (Sr UW Opinion / HOD Opinion); every other row is a plain referral. */
const isOpinionReferral = (target: string) => isGuwSrUwReferral(target) || target === "REF_HOD";

function toParallelDecisionRequest(
  base: GuwParallelDecisionBaseInput,
  action: GuwParallelDecisionAction,
  parallelDecision: GuwParallelDecisionItem[],
  // referTo?: string[],
): GuwParallelDecisionRequest {
  const taskIds = getDrsTaskIds();
  const taskId = base.taskId?.trim() || taskIds.taskId;
  const instanceId = base.instanceId?.trim() || taskIds.instanceId;
  const userId = base.userId?.trim() || getSessionUser()?.username || "";
  return {
    screenType: base.screenType,
    lob: GUW_LOB,
    parallelDecision,
    appNo: base.applicationNo,
    partyId: base.partyId,
    action,
    decision: "",
    remarks: " ",
    userId,
    ...(taskId ? { taskId } : {}),
    ...(instanceId ? { instanceId } : {}),
    // ...(referTo ? { refer_to: referTo } : {}),
  };
}

// const referToOf = (items: GuwParallelDecisionItem[]) => items.map((item) => item.referTo.referName);

/**
 * Raise Referral: selected rows -> `parallel-decision` requests. `action` is one value per request, so
 * Sr UW / HOD Opinion rows are sent as OPINION and the other rows as RAISE_REFERRAL (one request each, when present).
 */
export function buildGuwReferralParallelDecisionRequests(
  base: GuwParallelDecisionBaseInput,
  rows: (GuwReferralRowInput & { label: string })[],
): GuwParallelDecisionRequest[] {
  const toItem = (row: GuwReferralRowInput & { label: string }): GuwParallelDecisionItem => {
    const assignedTo = row.assignedTo.trim();
    const ntid = row.assignedToNtid?.trim() ?? "";
    return {
      referTo: {
        referValue: row.target,
        description: row.label,
        referName: row.label,
        remarks: row.remarks.trim(),
        reason: row.reason,
      },
      ...(assignedTo ? { assignedTo: { name: assignedTo, description: assignedTo, value: ntid } } : {}),
    };
  };
  const opinions = rows.filter((row) => isOpinionReferral(row.target)).map(toItem);
  const referrals = rows.filter((row) => !isOpinionReferral(row.target)).map(toItem);
  const requests: GuwParallelDecisionRequest[] = [];
  if (opinions.length > 0) requests.push(toParallelDecisionRequest(base, "OPINION", opinions));
  if (referrals.length > 0) {
    requests.push(toParallelDecisionRequest(base, "RAISE_REFERRAL", referrals));
  }
  return requests;
}

/** Counter Sign: Reason / Refer To / Assigned To / UW Remarks -> one `parallel-decision` request. */
export function buildGuwCounterSignParallelDecisionRequest(
  base: GuwParallelDecisionBaseInput,
  input: { reason: string; referTo: string; assignedTo: string; assignedToNtid?: string; remarks: string },
): GuwParallelDecisionRequest {
  return toParallelDecisionRequest(base, "COUNTER_SIGN", [
    {
      referTo: {
        referValue: input.referTo,
        description: input.referTo,
        referName: input.referTo,
        remarks: input.remarks.trim(),
        reason: input.reason,
      },
      assignedTo: { name: input.assignedTo, description: input.assignedTo, value: input.assignedToNtid?.trim() ?? "" },
    },
  ]);
}

/** Fixed request value for the GUW screen. */
export const GUW_UW_DECISION_SCREEN_TYPE = "GUW";


/**
 * DTO -> domain list. Accepts a bare object, an array, or either one wrapped in `{ data }`
 * (Raise Referral returns one saved decision per referral); throws when it is none of these.
 */
export function mapGuwUwDecisions(payload: unknown): GuwUwDecisionResult[] {
  const root = isRecord(payload) && "data" in payload ? payload.data : payload;
  if (Array.isArray(root)) return root.map((item) => mapGuwUwDecision(item));
  return [mapGuwUwDecision(root)];
}

/** DTO -> domain. Accepts the bare object or one wrapped in `{ data }`; throws when it is neither. */
export function mapGuwUwDecision(payload: unknown): GuwUwDecisionResult {
  const root = isRecord(payload) ? payload : null;
  const dto = root && isRecord(root.data) ? root.data : root;
  if (!dto) throw new Error("GUW UW decision response is not in the expected format.");
  return {
    uwDecisionId: readText(dto.uwDecisionId),
    level: readText(dto.level),
    screenType: readText(dto.screenType),
    applicationNumber: readText(dto.applicationNumber),
    partyId: readText(dto.partyId),
    roleType: readText(dto.roleType),
    caseUwDecision: readText(dto.caseUwDecision),
    decision: readText(dto.decision),
    decisionCode: readText(dto.decisionCode),
    uwRemarks: readText(dto.uwRemarks),
    reasons: readText(dto.reasons),
    outlier: readText(dto.outlier),
    smokerStatus: readText(dto.smokerStatus),
    createdAt: readText(dto.createdAt),
    createdBy: readText(dto.createdBy),
    updatedAt: readText(dto.updatedAt),
    updatedBy: readText(dto.updatedBy),
  };
}

/* ------------------------------------------------------------------ */
/* GUW: assignee users                                                  */
/* ------------------------------------------------------------------ */

/**
 * "Assigned To" users for Raise Referral / Counter Sign. The users-by-role API returns the people of one role
 * (HOD or Sr UW); the dropdown shows each user's `fullName`.
 */

export interface GuwAssigneeOption {
  value: string;
  label: string;
  /** The user's NTID (`users[].ntid`); sent as `assignedTo.value` in the `parallel-decision` request. */
  ntid: string;
}

/** `roleName` path value sent to the users-by-role API. */
export const GUW_ASSIGNEE_ROLE = {
  HOD: "HOD",
  SR_UW: "SRUW",
} as const;

/** Role whose users are listed for a Counter Sign "Refer To" value ("HOD" / "Sr UW"); "" when none. */
export function assigneeRoleForReferTo(referTo: string): string {
  const key = referTo.trim().toLowerCase().replace(/[\s_.-]+/g, " ");
  if (key === "hod" || key === "ref hod") return GUW_ASSIGNEE_ROLE.HOD;
  if (key === "sr uw" || key === "sruw" || key === "sr_uw" || key === "senior uw" || key === "ref sruw" || key === "ref sr uw") return GUW_ASSIGNEE_ROLE.SR_UW;
  return "";
}

/** Role whose users are listed for a Raise Referral row code; "" when the row is not assignable. */
export function assigneeRoleForReferralRow(target: string): string {
  const key = target.trim().toLowerCase().replace(/[\s_.-]+/g, " ");
  if (key === "ref_hod" || key === "ref hod" || key === "hod opinion") return GUW_ASSIGNEE_ROLE.HOD;
  if (isGuwSrUwReferral(target) || key === "sr uw opinion") return GUW_ASSIGNEE_ROLE.SR_UW;
  return "";
}

/** Maps the users-by-role response (`data.users[].fullName` / `ntid`) to dropdown options. */
export function mapUsersByRole(payload: unknown): GuwAssigneeOption[] {
  if (!isRecord(payload)) return [];
  const root = isRecord(payload.data) ? payload.data : payload;
  const users = Array.isArray(root.users)
    ? root.users
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(root.data)
        ? root.data
        : [];
  return users.flatMap((user) => {
    if (!isRecord(user)) return [];
    const fullName =
      (typeof user.fullName === "string" && user.fullName.trim()) ||
      (typeof user.name === "string" && user.name.trim()) ||
      (typeof user.userName === "string" && user.userName.trim()) ||
      (typeof user.userFullName === "string" && user.userFullName.trim()) ||
      (typeof user.username === "string" && user.username.trim()) ||
      "";
    const ntid =
      (typeof user.ntid === "string" && user.ntid.trim()) ||
      (typeof user.userId === "string" && user.userId.trim()) ||
      (typeof user.id === "string" && user.id.trim()) ||
      (typeof user.username === "string" && user.username.trim()) ||
      "";
    return fullName ? [{ value: fullName, label: fullName, ntid }] : [];
  });
}

/* ------------------------------------------------------------------ */
/* GUW: DRS record, members, submitted decision, validation, masters    */
/* ------------------------------------------------------------------ */

/* ---- Types ---- */

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
  specialRemarksCount: number;
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

/** One party-level validation failure (`partyValidations[].validations[]`), shown in the Validations modal. */
export interface GuwPartyValidationRow {
  memberType: string;
  reason: string;
  remarks: string;
}

export interface GuwValidationResult {
  applicationNo: string;
  correlationId: string;
  success: boolean;
  referralRequired: boolean;
  counterSignRequired: boolean;
  mandatoryReferTo?: string;
  /** Justification rows first, then checklist, hard alerts and soft alerts. */
  rows: GuwValidationRow[];
  /** Party-level failures (same shape as the DVT validation API); any entry stops the submit. */
  partyValidations: GuwPartyValidationRow[];
}

/** A validation row together with what the user saved for it. */
export interface GuwSavedValidationRow extends GuwValidationRow {
  selectedReasonCode: string;
  justificationRemark: string;
}

export interface GuwValidationPartyDecision {
  partyId: string;
  decision: string;
  /** Raise Referral only: the Refer To values (master GUW_REF_TO) of the selected rows, e.g. ["IT", "HOD"]. */
  refer_to?: string[];
  /** Decision Details table; only for Borderline Standard / Counter Offer / Extra Premium. */
  products?: GuwUwDecisionProduct[];
}

export interface GuwValidationRequest {
  userId: string;
  role: string;
  applicationNo: string;
  partyDecision: GuwValidationPartyDecision[];
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
  referralRows?: {
    target: string;
    label: string;
    selected: boolean;
    reason: string;
    remarks: string;
    assignedTo: string;
  }[];
}

export interface GuwUwData {
  breOverallDecision: string;
  breOverallRemarks: string;
  submittedDecision?: GuwSubmittedDecision;
}

/** One `product_details.value.rows[]` entry of the member's applicant profile (Decision Details products). */
export interface GuwProductDetail {
  /** `productCode`, sent as `productCode` in the validation / `uw-decision` requests. */
  code: string;
  /** `productName` */
  name: string;
  /** `productType` other than "base" */
  isRider: boolean;
  /** `sumAssured`, formatted for display ("—" when absent). */
  sa: string;
  /** `term`, "—" when absent. */
  pt: string;
}

export interface GuwDrsRecord {
  applicationNo: string;
  /** `partyId` of the member (`subSections[applicantProfile]`); "" when the payload has none. */
  partyId: string;
  /** `subSections[applicantProfile].lifeNumber` of the member; "" when absent. */
  lifeNumber: string;
  /** Envelope `transactionId`; "" when absent. */
  transactionId: string;
  /** `data.caseType` of the DRS payload (e.g. "Medical"); sent as `dataEntry` to the `uw_decision_mapping` master. "" when absent. */
  caseType: string;

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
  /** `data.commonSection` / `data.membersDetails` exactly as returned; sent back when requirements are saved. */
  drsData: { commonSection: unknown; membersDetails: unknown };
  /** Distinct `membersDetails[].memberType` values; options for the requirement "Profile" field. */
  memberTypes: string[];
  /** `data.subSections[]` mapped for the Quick Links dialogs. */
  quickLinks: QuickLinksSubSections;
  /** `subSections[applicantProfile].product_details.value.rows[]` of the member. */
  products: GuwProductDetail[];
}

/* ------------------------------------------------------------------ */
/* Mapper helpers                                                        */
/* ------------------------------------------------------------------ */

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

/** The named entry of a `sections[]` / `commonSection[]` list. */
function findSectionEntry(sections: unknown, name: string): Record<string, unknown> | null {
  if (!Array.isArray(sections)) return null;
  return sections.filter(isRecord).find((s) => s.name === name) ?? null;
}

/** `value` of a named section from `membersDetails[].sections[]`. */
function findSectionValue(sections: unknown, name: string): unknown {
  return findSectionEntry(sections, name)?.value ?? null;
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

/**
 * GUW rows: id 0 = member line (Name, App No., Member, demographics), 1 = product, 2 = riders, 3 = sum at risk.
 * Some payloads send Name / App No. as their own row and the member fields as the next row; fold that
 * into row 0 and renumber the rest so the product and rider rows keep their expected ids.
 */
function mapGuwRowDetails(rowDetails: unknown): BannerRowDetail[] {
  const rows = mapRowDetails(rowDetails);
  const hasField = (row: BannerRowDetail | undefined, name: string) =>
    row?.fields.some((f) => f.name === name) ?? false;
  const [first, second, ...rest] = rows;
  if (!first || !second || !hasField(first, "Name") || hasField(first, "Member") || !hasField(second, "Member")) {
    return rows;
  }
  return [{ ...first, fields: [...first.fields, ...second.fields] }, ...rest].map((row, index) => ({
    ...row,
    id: index,
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
    rows: recordList(section.rows).filter(hasValues).map((r) => ({
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

/** A claim-audit row is empty when the API sends the placeholder row with blank values only. */
const hasValues = (row: Record<string, unknown>) => Object.values(row).some((v) => str(v) !== "");

function mapClaimAuditSection(value: unknown): GuwClaimAuditSection {
  const section = recordOf(value);
  return {
    title: str(section.title) || "Claim Audit",
    columnHeaders: headersByKey(CLAIM_AUDIT_COLUMN_KEYS, section.columns),
    rows: recordList(section.rows)
      .filter(hasValues)
      .map((r, index) => ({
        id: str(r.id) || str(r.claimId) || String(index + 1),
        policyNo: str(r.policyNumber),
        productCode: str(r.productCode),
        claimKey: str(r.claimKey),
        canonicalId: str(r.canonicalId),
        patientName: str(r.patientName),
        ailment: str(r.ailmentForCommunication),
        claimType: str(r.claimType),
        subType: str(r.subtype),
        intimationDate: str(r.intimationDate),
        doa: str(r.doa),
        dod: str(r.dod),
        status: str(r.decisionStatus),
      })),
  };
}

/**
 * Rows of the claim-audit list API, using the same row keys as the DRS `claimAudit.rows`.
 * Accepts `{ data: { rows } }`, `{ data: [...] }`, `{ rows }` or a bare array; titles / headers stay from `fallback`.
 */
export function mapClaimAuditListPayload(
  payload: unknown,
  fallback: GuwClaimAuditSection,
): GuwClaimAuditSection {
  const root = recordOf(payload);
  const body = root.data ?? payload;
  const list = Array.isArray(body) ? body : recordOf(body).rows;
  return { ...fallback, rows: mapClaimAuditSection({ rows: list }).rows };
}

/** Column order of `specialRemarks.columns`. */
const SPECIAL_REMARKS_COLUMN_KEYS = ["comments", "updatedDate", "updatedBy"] as const;

function mapSpecialRemarksSection(value: unknown): GuwSpecialRemarksSection {
  const section = recordOf(value);
  return {
    title: str(section.title) || "Special Remarks",
    columnHeaders: headersByKey(SPECIAL_REMARKS_COLUMN_KEYS, section.columns),
    rows: recordList(section.rows).filter(hasValues).map((r, index) => ({
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
    rows: recordList(section.reasons).filter(hasValues).map((r) => ({
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
    specialRemarksCount: dialogs.specialRemarks.rows.length,
  };
}

/* ------------------------------------------------------------------ */
/* Member list (one entry per object in `data.membersDetails[]`)         */
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

/** `data` of the payload (the response envelope's `data`, or the bare payload). */
function payloadData(payload: unknown): Record<string, unknown> {
  const root = recordOf(payload);
  return isRecord(root.data) ? root.data : root;
}

/** The per-member objects of the payload (`data.membersDetails[]`). */
function memberRecords(payload: unknown): Record<string, unknown>[] {
  return recordList(payloadData(payload).membersDetails);
}

/** Member id of one `membersDetails[]` object: the "Member" field of `rowDetails` id 0 (e.g. "Life Assured 1"). */
function memberIdOf(member: Record<string, unknown>, index: number): string {
  const memberFields = mapGuwRowDetails(member.rowDetails).find((r) => r.id === 0)?.fields;
  return fieldValue(memberFields, "Member") || `Life Assured ${index + 1}`;
}

/** Member rows for the member selection screen, from `rowDetails` id 0 (name, member and demographics). */
export function mapGuwMembers(payload: unknown): GuwMemberSummary[] {
  return memberRecords(payload).map((data, index) => {
    const rows = mapGuwRowDetails(data.rowDetails);
    const memberFields = rows.find((r) => r.id === 0)?.fields;
    const detail = (name: string) => fieldValue(memberFields, name);
    const age = fieldValue(memberFields, "Age");
    const caseDecisionFields = recordOf(findSectionValue(data.sections, "caseUwDecision")).fields;
    return {
      memberId: memberIdOf(data, index),
      name: fieldValue(memberFields, "Name"),
      demographics: [
        age ? `${age} yrs` : "",
        detail("Gender"),
        detail("Education"),
        detail("Occupation"),
        detail("City, State"),
      ]
        .filter(Boolean)
        .join(" / "),
      uwDecision: fieldValue(caseDecisionFields, "Case UW Decision"),
    };
  });
}

/**
 * Loads the GUW DRS payload through `groupDrsApi` (same POST body as DVT: `applicationNo`, `roleType`,
 * `screenType`, `businessType`; the last three come from `drsTaskConfig` for the task's `roleType`,
 * e.g. GUW_TASK -> GUW_INFORMAL). Returns `null` on error. In mock mode the API serves the mock file.
 */
async function loadGuwPayload(applicationNo: string, roleType?: string): Promise<unknown> {
  const taskType = roleType?.trim() || getDrsRoleType() || "GUW";
  const request = store.dispatch(
    groupDrsApi.endpoints.getGuwDrsPayload.initiate({ applicationNo, taskType }),
  );
  try {
    const result = await request;
    return result.error ? null : (result.data ?? null);
  } finally {
    request.unsubscribe();
  }
}

export async function fetchGuwMembers(applicationNo: string, roleType?: string): Promise<GuwMemberSummary[]> {
  if (!applicationNo) return [];
  const payload = await loadGuwPayload(applicationNo, roleType);
  return payload ? mapGuwMembers(payload) : [];
}

/** Product (id 1) and rider (id 2) rows of the first `membersDetails[]` object, for the member selection banner. */
export function mapGuwProductRowDetails(payload: unknown): BannerRowDetail[] {
  const firstMember = memberRecords(payload)[0];
  return mapGuwRowDetails(firstMember?.rowDetails).filter((row) => row.id === 1 || row.id === 2);
}

export async function fetchGuwProductRowDetails(applicationNo: string, roleType?: string): Promise<BannerRowDetail[]> {
  if (!applicationNo) return [];
  const payload = await loadGuwPayload(applicationNo, roleType);
  return payload ? mapGuwProductRowDetails(payload) : [];
}

/* ------------------------------------------------------------------ */
/* Public mapper                                                         */
/* ------------------------------------------------------------------ */

/**
 * Maps one member of `data.membersDetails[]` together with the case-level `data.commonSection[]`
 * (requirements and BRE decision). `memberId` (e.g. "Life Assured 2") picks the member; when it is
 * omitted or matches nothing, the first member is used.
 */
export function mapGuwDrsPayload(payload: unknown, memberId?: string): GuwDrsRecord {
  const root = payloadData(payload);
  const records = memberRecords(payload);
  const data =
    (memberId ? records.find((r, i) => memberIdOf(r, i) === memberId) : undefined) ?? records[0] ?? {};

  const applicationNo = str(root.applicationNo);
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const commonSection = root.commonSection;

  // Requirements: `commonSection` rows (shared by all members)
  const requirementSection = findSectionEntry(commonSection, "requirementManagement");
  const requirementValue = requirementSection?.value;
  // Rows may sit on the section, on `value.rows` (as in the DVT payload) or be `value` itself.
  const rawReqs = recordList(
    requirementSection?.rows ??
      (isRecord(requirementValue) ? requirementValue.rows : requirementValue),
  );
  const requirements: RequirementItem[] = mapRawRequirementRows(rawReqs);

  const rowDetails = mapGuwRowDetails(data.rowDetails);
  const applicantName = fieldValue(rowDetails[0]?.fields, "Name");

  const riskCards: RiskCardData[] = Array.isArray(data.cardDetails)
    ? data.cardDetails.map(mapCard).filter((c): c is RiskCardData => c !== null)
    : [];

  const dialogSections: GuwDialogSections = {
    grievanceHistory: mapGrievanceSection(findSectionValue(sections, "grievanceHistory")),
    claimAudit: mapClaimAuditSection(findSectionValue(sections, "claimAudit")),
    specialRemarks: mapSpecialRemarksSection(findSectionValue(sections, "specialRemarks")),
    uwGuidelines: mapUwGuidelinesSection(findSectionValue(sections, "uwGuidelines")),
  };

  const caseDecisionFields = recordOf(findSectionValue(sections, "caseUwDecision")).fields;
  const caseDecisionVal =
    fieldValue(caseDecisionFields, "Case UW Decision") ||
    fieldValue(caseDecisionFields, "Decision");
  const caseRemarksVal =
    fieldValue(caseDecisionFields, "Case UW Remarks") ||
    fieldValue(caseDecisionFields, "Remarks");

  const applicantProfile = recordOf(
    recordList(data.subSections).find((s) => s.name === "applicantProfile")?.value,
  );
  const baseProducts: GuwProductDetail[] = recordList(
    recordOf(recordOf(applicantProfile.product_details).value).rows,
  ).map((r) => {
    const amount = str(r.sumAssured).trim();
    const term = str(r.term).trim();
    return {
      code: str(r.productCode),
      name: str(r.productName),
      isRider: str(r.productType).trim().toLowerCase() !== "base",
      sa: amount ? formatIndianCurrency(amount) : "—",
      pt: term || "—",
    };
  });
  // Riders: `previousPolicies.members[].ipru[].riderDetails[]` (members is an object or a list)
  const previousPolicies = recordOf(
    recordList(data.subSections).find((s) => s.name === "previousPolicies")?.value,
  );
  const policyMembers = Array.isArray(previousPolicies.members)
    ? recordList(previousPolicies.members)
    : [recordOf(previousPolicies.members)];
  const riderProducts: GuwProductDetail[] = policyMembers
    .flatMap((member) => recordList(member.ipru))
    .flatMap((policy) => recordList(policy.riderDetails))
    .filter((r) => str(r.riderName).trim() !== "")
    .map((r) => {
      const amount = str(r.sumAssured).trim();
      return {
        code: str(r.riderCode),
        name: str(r.riderName).trim(),
        isRider: true,
        sa: amount ? formatIndianCurrency(amount) : "—",
        pt: "—",
      };
    });
  const products: GuwProductDetail[] = [
    ...baseProducts,
    ...riderProducts.filter((rider) => !baseProducts.some((base) => base.name === rider.name)),
  ];

  return {
    applicationNo,
    partyId: str(applicantProfile.partyId),
    lifeNumber: str(applicantProfile.lifeNumber),
    transactionId: str(root.transactionId),
    caseType: str(root.caseType),
    applicantName,
    applicationLabel: `App No. - ${applicationNo}`,
    rowDetails,
    riskCards,
    sdtRow: mapSdtRow(findSectionValue(sections, "sdtDecision"), dialogSections),
    breData: mapBreData(findSectionValue(commonSection, "latestBreDecision"), rawReqs),
    sections: dialogSections,
    requirements,
    drsData: { commonSection: root.commonSection, membersDetails: root.membersDetails },
    memberTypes: readMemberTypes(root.membersDetails),
    quickLinks: {
      ...mapMembersQuickLinks(root.membersDetails),
      raiseGrievance: mapRaiseGrievance(data.subSections),
    },
    products,
    uwData: {
      breOverallDecision: fieldValue(caseDecisionFields, "BRE Overall Decision"),
      breOverallRemarks: fieldValue(caseDecisionFields, "BRE Overall Remarks"),
      ...(caseDecisionVal
        ? {
            submittedDecision: {
              decisionCode: guwDecisionCodeOfLabel(caseDecisionVal),
              remarks: caseRemarksVal,
              fields: [
                { label: "Case UW Decision", value: caseDecisionVal },
                ...(caseRemarksVal ? [{ label: "Remarks", value: caseRemarksVal, wide: true }] : []),
              ],
              reconsiderationFields: [],
              counterOfferRows: [],
              showBstdColumn: false,
              reinsurerRows: [],
              documentRows: [],
              guidelines: [],
              validationRows: dialogSections.uwGuidelines.rows.map((r, i) => ({
                validationId: String(i + 1),
                category: "justification" as const,
                reason: r.reason,
                remark: r.remark,
                systemAction: r.systemAction,
                selectedReasonCode: r.justificationReason,
                justificationRemark: r.justificationRemark,
                justificationOptions: (
                  dialogSections.uwGuidelines.justificationReasons ?? DEFAULT_JUSTIFICATION_REASONS
                ).map((t) => ({ code: t, text: t })),
              })),
            },
          }
        : {}),
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

/** Drops every held decision (all applications / members); used when a case is opened afresh from the inbox. */
export function clearAllGuwSubmittedDecisions(): void {
  if (typeof window === "undefined") return;
  const prefix = submittedDecisionKey("");
  const keys: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  keys.forEach((key) => window.sessionStorage.removeItem(key));
}

/** DRS record of one member (`memberId`, e.g. "Life Assured 2"); the first member when omitted. */
export async function fetchGuwDrs(
  applicationNo: string,
  memberId?: string,
  roleType?: string,
): Promise<GuwDrsRecord | null> {
  const payload = await loadGuwPayload(applicationNo, roleType);
  if (!payload) return null;
  const record = mapGuwDrsPayload(payload, memberId);
  const sessionDecision = loadGuwSubmittedDecision(applicationNo) ?? undefined;
  const submittedDecision = sessionDecision ?? record.uwData?.submittedDecision ?? undefined;
  const resolvedAppNo = record.applicationNo || applicationNo;

  let updatedDialogSections = record.sections;
  let updatedSdtRow = record.sdtRow;
  if (submittedDecision?.validationRows && submittedDecision.validationRows.length > 0) {
    if (updatedDialogSections.uwGuidelines.rows.length === 0) {
      updatedDialogSections = {
        ...updatedDialogSections,
        uwGuidelines: {
          ...updatedDialogSections.uwGuidelines,
          rows: submittedDecision.validationRows.map((r) => ({
            reason: r.reason,
            remark: r.remark,
            systemAction: r.systemAction,
            justificationReason: r.selectedReasonCode || "",
            justificationRemark: r.justificationRemark || "",
          })),
        },
      };
      updatedSdtRow = {
        ...updatedSdtRow,
        uwGuidelinesCount: submittedDecision.validationRows.length,
      };
    }
  }

  return {
    ...record,
    applicationNo: resolvedAppNo,
    applicationLabel: `App No. - ${resolvedAppNo}`,
    sections: updatedDialogSections,
    sdtRow: updatedSdtRow,
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

/** Role sent with the GUW decision-validation request. */
const VALIDATION_ROLE = "GUW";

/** Order in which categories appear in the UW Guidelines table. */
const CATEGORY_ORDER: GuwGuidelineCategory[] = ["justification", "checklist", "hardAlert", "softAlert"];

export function toGuwValidationRequest(
  applicationNo: string,
  partyDecision: GuwValidationPartyDecision,
): GuwValidationRequest {
  return {
    userId: getSessionUser()?.username ?? "",
    role: VALIDATION_ROLE,
    applicationNo,
    partyDecision: [partyDecision],
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

const DEFAULT_JUSTIFICATION_REASONS = [
  "Requirement waived",
  "Document pending",
  "Financial assessment",
  "Medical assessment",
  "Counter signing",
  "Other",
];

const GUW_DECISION_CODE_BY_LABEL: Record<string, string> = {
  standard: "STD",
  "counter offer": "CO",
  decline: "DC",
  reject: "REJ",
  postpone: "POSTP",
  hold: "HOLD",
  "extra premium": "EP",
  "borderline standard": "BOR_STD",
  "refer to hod": "REF_HOD",
  "refer to ho cmo": "REF_CMO",
  "refer to cmo": "REF_CMO",
  "refer to reinsurer": "REF_REINS",
  "refer to it": "REF_IT",
  "refer to risk": "REF_RISK",
  "refer to accuity": "REF_ACU",
  "refer to cuw claim audit": "REF_CUW_CLM",
  "refer to tele mer": "REF_TELE_MER",
  "refer to video mer": "REF_VIDEO_MER",
  "refer to dvt": "REF_DVT",
  "counter sign": "APPROVER",
  "raise referral": "REFERRAL",
};

/** Decision code of a submitted Case UW Decision label; "Refer to Sr.UW" resolves to the master's Sr UW code. */
function guwDecisionCodeOfLabel(label: string): string {
  const key = label.toLowerCase();
  if (key === "refer to sr.uw") return guwSrUwReferralCode() || label;
  return GUW_DECISION_CODE_BY_LABEL[key] ?? label;
}

/** DTO -> domain. Unknown fields are dropped; missing lists become empty. */
export function fromGuwValidationResponse(dto: unknown): GuwValidationResult {
  const src = isRecord(dto) ? dto : {};

  // Extract guidelines and mandatory referral from `partyValidations`
  const partyGuidelineRows: GuwValidationRow[] = [];
  const partyValidationsRaw = recordList(src.partyValidations);
  let mandatoryReferTo: string | undefined = undefined;

  for (const party of partyValidationsRaw) {
    const refTo = str(party.referTo);
    if (refTo && !mandatoryReferTo) {
      mandatoryReferTo = refTo;
    }
    const partyValidationsList = recordList(party.validations);
    for (const item of partyValidationsList) {
      const action = str(item.action);
      partyGuidelineRows.push({
        validationId: str(item.validationId),
        category: "justification",
        reason: str(item.reason),
        remark: str(item.remarks),
        systemAction: action,
        justificationOptions: DEFAULT_JUSTIFICATION_REASONS.map((text) => ({
          code: text,
          text,
        })),
      });
      if (action.startsWith("REF_") && !mandatoryReferTo) {
        mandatoryReferTo = action;
      }
    }
  }

  const rows = [
    ...partyGuidelineRows,
    ...mapOptionRows(src.justifications, "justification"),
    ...mapOptionRows(src.checklist, "checklist"),
    ...mapAlertRows(src.HardAlert, "hardAlert"),
    ...mapAlertRows(src.SoftAlert, "softAlert"),
  ].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const hasReferralAction =
    Boolean(mandatoryReferTo) ||
    rows.some((r) => r.systemAction.startsWith("REF_") || /^refer to /i.test(r.systemAction));
  const hasCounterSignAction =
    mandatoryReferTo === "REFER_TO_CS" ||
    rows.some((r) => r.systemAction === "REFER_TO_CS" || /counter sign/i.test(r.systemAction));

  // Same `partyValidations` contract and reader as the DVT validation API
  const partyValidations = readDvtValidationResponse(src).partyValidations.flatMap((party) =>
    party.validations.map((item) => ({
      memberType: party.memberType,
      reason: item.reason,
      remarks: item.remarks,
    })),
  );

  return {
    applicationNo: str(src.applicationNo),
    correlationId: str(src.correlationId),
    success: str(src.status).toUpperCase() === "SUCCESS",
    referralRequired: src.referralReqd === "Y" || hasReferralAction,
    counterSignRequired: src.counterSignReqd === "Y" || hasCounterSignAction,
    mandatoryReferTo,
    rows,
    partyValidations,
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

/* ------------------------------------------------------------------ */
/* GUW: Decision Code options (uw_decision_mapping master) */
/* ------------------------------------------------------------------ */

/** Request of the masters POST API for the `uw_decision_mapping` type. */
export interface GuwUwDecisionMappingRequest {
  types: ["uw_decision_mapping"];
  uwDecisionMapping: {
    decisionTypeCode: string;
    dataEntry: string;
  };
}

/** One Decision Code dropdown option (`value` is the `decisionCode` sent to the `uw-decision` API). */
export interface GuwDecisionCodeOption {
  value: string;
  label: string;
}

/**
 * Case UW Decision dropdown code -> `decisionTypeCode` of the `uw_decision_mapping` master.
 * Codes not listed (HOLD, APPROVER, REFERRAL ...) have no Decision Code list.
 */
const DECISION_TYPE_CODE_BY_CASE_DECISION: Readonly<Record<string, string | undefined>> = {
  STD: "STD",
  BOR_STD: "BOR_STD",
  REJ: "REJECT",
  DC: "DEC",
  POSTP: "POST",
  CO: "COFF",
  EP: "XRT",
};

interface DecisionMappingRow {
  decisionCode: string;
  decisionDescriptionCode: string;
  displayOrder: number;
}

function readTrimmedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Domain request for a Case UW Decision code; `dataEntry` is the DRS `caseType`.
 * `null` when that decision has no Decision Code list or the DRS has no `caseType`.
 */
export function buildGuwUwDecisionMappingRequest(
  caseDecision: string,
  caseType: string,
): GuwUwDecisionMappingRequest | null {
  const decisionTypeCode = DECISION_TYPE_CODE_BY_CASE_DECISION[caseDecision];
  const dataEntry = caseType.trim();
  if (!decisionTypeCode || dataEntry.length === 0) return null;
  return {
    types: ["uw_decision_mapping"],
    uwDecisionMapping: { decisionTypeCode, dataEntry },
  };
}

/** DTO -> dropdown options: active rows only, ordered by `displayOrder`. */
export function mapGuwDecisionCodeOptions(payload: unknown): GuwDecisionCodeOption[] {
  const root = isRecord(payload) ? payload : null;
  const data = root && isRecord(root.data) ? root.data : root;
  const list = data?.uw_decision_mapping;
  if (!Array.isArray(list)) return [];

  const rows: DecisionMappingRow[] = [];
  for (const item of list) {
    if (!isRecord(item) || item.isActive !== "Y") continue;
    const decisionCode = readTrimmedText(item.decisionCode);
    if (decisionCode.length === 0) continue;
    rows.push({
      decisionCode,
      decisionDescriptionCode: readTrimmedText(item.decisionDescriptionCode),
      displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : Number.MAX_SAFE_INTEGER,
    });
  }

  return rows
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((row) => ({
      value: row.decisionCode,
      label:
        row.decisionDescriptionCode.length > 0
          ? `${row.decisionCode} - ${row.decisionDescriptionCode}`
          : row.decisionCode,
    }));
}

function mockResponse(request: GuwUwDecisionMappingRequest): unknown {
  const { decisionTypeCode, dataEntry } = request.uwDecisionMapping;
  const rows = uwDecisionMappingMock.data.uw_decision_mapping.filter(
    (row) => row.decisionTypeCode === decisionTypeCode && row.dataEntry === dataEntry,
  );
  return { data: { uw_decision_mapping: rows }, unknownTypes: [] };
}

/**
 * POST `VITE_MASTERS_API` for the Decision Code options of a Case UW Decision.
 * Returns `[]` (no call) when the decision has no Decision Code list.
 */
export async function fetchGuwDecisionCodeOptions(
  caseDecision: string,
  caseType: string,
): Promise<GuwDecisionCodeOption[]> {
  const request = buildGuwUwDecisionMappingRequest(caseDecision, caseType);
  if (!request) return [];
  console.log("[guwDecisionMapping] request payload:", request);

  if (useMock) {
    const response = mockResponse(request);
    console.log("[guwDecisionMapping] response (mock):", response);
    return mapGuwDecisionCodeOptions(response);
  }

  const url = masterUrls.masters;
  if (url.length === 0) throw new Error("VITE_MASTERS_API is not configured.");
  if ((getToken()?.trim() ?? "").length === 0) throw new Error("Sign in before loading decision codes.");

  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  applyBusinessApiAuthHeaders(headers);

  const response = await fetch(url, { method: "POST", body: JSON.stringify(request), headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text.trim().length > 0 ? text.trim() : `Masters request failed (${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error("Masters response is not valid JSON.");
  }
  console.log("[guwDecisionMapping] response:", payload);
  return mapGuwDecisionCodeOptions(payload);
}

/* ------------------------------------------------------------------ */
/* GUW: Case UW Decision derived from the member decisions */
/* ------------------------------------------------------------------ */

/**
 * Derives the case-level "Case UW Decision" (member selection / summary page) from the individual
 * member decisions.
 *
 * This file is the single place for that logic. To move to an API later, replace the body of
 * `deriveCaseUwDecision` with the service call; the signature (async, members in, decision code out)
 * and its only caller (`GuwMemberSelection`) stay as they are.
 *
 * The business grid is data (`DECISION_GRID`). The grid combines two decisions; for any number of
 * members the decisions are folded left to right (LA1 + LA2 -> result, result + LA3 -> result, ...),
 * so adding members needs no code change.
 */

/** One member's decision as saved on the member DRS page. `decisionCode` is "" when none is saved yet. */
export interface GuwMemberDecisionInput {
  memberId: string;
  /** Case UW Decision code, e.g. STD, BOR_STD, REJ, DC, POSTP, CO, EP */
  decisionCode: string;
}

/** Decision groups used by the grid. */
type DecisionGroup = "STD" | "BSTD" | "DECLINE_POSTPONE" | "CO" | "XRT";

/** Case UW Decision codes the grid can return (same codes as the Case UW Decision dropdown). */
type FinalDecisionCode = "STD" | "BOR_STD" | "REJ" | "CO" | "EP";

/** Decision code (member decision or grid result) -> grid group. Codes not listed cannot be derived. */
const GROUP_OF_CODE: Readonly<Record<string, DecisionGroup>> = {
  STD: "STD",
  BOR_STD: "BSTD",
  REJ: "DECLINE_POSTPONE",
  DC: "DECLINE_POSTPONE",
  POSTP: "DECLINE_POSTPONE",
  CO: "CO",
  EP: "XRT",
};

/** Grid row: [first decision (LA1 / running result), next decision (LA2 / Proposer with WOP), final decision]. */
type GridRow = readonly [DecisionGroup, DecisionGroup, FinalDecisionCode];

const DECISION_GRID: readonly GridRow[] = [
  ["STD", "STD", "STD"],
  ["STD", "BSTD", "BOR_STD"],
  ["STD", "DECLINE_POSTPONE", "REJ"],
  ["STD", "CO", "CO"],
  ["STD", "XRT", "EP"],

  ["DECLINE_POSTPONE", "STD", "REJ"],
  ["DECLINE_POSTPONE", "BSTD", "REJ"],
  ["DECLINE_POSTPONE", "DECLINE_POSTPONE", "REJ"],
  ["DECLINE_POSTPONE", "CO", "REJ"],
  ["DECLINE_POSTPONE", "XRT", "REJ"],

  ["CO", "STD", "CO"],
  ["CO", "BSTD", "CO"],
  ["CO", "DECLINE_POSTPONE", "REJ"],
  ["CO", "CO", "CO"],
  ["CO", "XRT", "EP"],

  ["XRT", "STD", "EP"],
  ["XRT", "BSTD", "EP"],
  ["XRT", "DECLINE_POSTPONE", "REJ"],
  ["XRT", "CO", "EP"],
  ["XRT", "XRT", "EP"],

  ["BSTD", "STD", "BOR_STD"],
  ["BSTD", "BSTD", "BOR_STD"],
  ["BSTD", "DECLINE_POSTPONE", "REJ"],
  ["BSTD", "CO", "CO"],
  ["BSTD", "XRT", "EP"],
];

/**
 * When true, no case decision is derived until every member has a decision.
 * Set to false if the grid should also work on partial member decisions.
 */
const REQUIRE_ALL_MEMBERS_DECIDED = true;

function lookup(first: DecisionGroup, next: DecisionGroup): FinalDecisionCode | "" {
  return DECISION_GRID.find(([a, b]) => a === first && b === next)?.[2] ?? "";
}

/**
 * Case UW Decision code for the given member decisions, or "" when none can be derived
 * (no members, a member still undecided, a decision the grid does not cover, e.g. Referral / Hold).
 * Members are taken in the given order (LA1 first).
 */
export async function deriveCaseUwDecision(
  members: readonly GuwMemberDecisionInput[],
): Promise<string> {
  if (members.length === 0) return "";
  const decided = members.filter((m) => m.decisionCode);
  if (decided.length === 0) return "";
  if (REQUIRE_ALL_MEMBERS_DECIDED && decided.length !== members.length) return "";

  const groups: DecisionGroup[] = [];
  for (const m of decided) {
    const group = GROUP_OF_CODE[m.decisionCode];
    if (!group) return "";
    groups.push(group);
  }

  // A single member combines with itself (grid diagonal); more members fold left to right
  let result = lookup(groups[0], groups[0]);
  for (let i = 1; i < groups.length && result; i += 1) {
    const running = GROUP_OF_CODE[result];
    result = running ? lookup(running, groups[i]) : "";
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* GUW: Claim Audit / Special Remarks section validation */
/* ------------------------------------------------------------------ */

/**
 * Claim Audit / Special Remarks "Validate" clicks. There is no validation API: the clicks are kept in the browser
 * session, per logged-in user, application (or member) and section. Main Submit requires every row to be validated.
 */

export type GuwValidationSection = "claimAudit" | "specialRemarks";

export interface GuwRequiredValidations {
  /** Ids of the Claim Audit rows that must be validated (empty = nothing to validate). */
  claimAuditRowIds: string[];
  /** Ids of the Special Remarks rows that must be validated (empty = nothing to validate). */
  specialRemarksRowIds: string[];
}

const SECTION_LABELS: Record<GuwValidationSection, string> = {
  claimAudit: "Claim Audit",
  specialRemarks: "Special Remarks",
};

const STORAGE_PREFIX = "guwSectionValidation:";

const storageKeyOf = (key: string, section: GuwValidationSection) =>
  `${STORAGE_PREFIX}${getSessionUser()?.username ?? ""}:${key}:${section}`;

export function loadValidatedRowIds(key: string, section: GuwValidationSection): string[] {
  if (!key || typeof window === "undefined") return [];
  const raw = window.sessionStorage.getItem(storageKeyOf(key, section));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Drops every held Validate click (all applications / members / sections); a DRS opened from the inbox or member selection starts unvalidated. */
export function clearAllValidatedRows(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => window.sessionStorage.removeItem(key));
}

/** Records one validated row and returns the updated list of validated ids. */
export function markRowValidated(key: string, section: GuwValidationSection, rowId: string): string[] {
  const ids = loadValidatedRowIds(key, section);
  if (ids.includes(rowId)) return ids;
  const next = [...ids, rowId];
  if (key && typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKeyOf(key, section), JSON.stringify(next));
  }
  return next;
}

/** Error message for the first section that still has rows not validated, or null when all are validated. */
export function findPendingValidationMessage(
  key: string,
  required: GuwRequiredValidations | undefined,
): string | null {
  if (!required) return null;
  const checks: [GuwValidationSection, string[]][] = [
    ["claimAudit", required.claimAuditRowIds],
    ["specialRemarks", required.specialRemarksRowIds],
  ];
  for (const [section, rowIds] of checks) {
    if (rowIds.length === 0) continue;
    const validated = loadValidatedRowIds(key, section);
    if (rowIds.some((id) => !validated.includes(id))) {
      return `Please validate all ${SECTION_LABELS[section]} records before submitting`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Referral UW (HOD / Sr UW) */
/* ------------------------------------------------------------------ */


export type ReferralRole = "HOD" | "SR_UW";

export interface ReferralRoleConfig {
  role: ReferralRole;
  /** Prefix of the decision card labels: "<label> Remarks" / "<label> Decision". */
  label: string;
  /** `roleType` values (upper-case) the inbox sends for this role. */
  roleTypes: string[];
  /** Master `misc` type holding the decision dropdown options of this role. */
  decisionMasterType: string;
  /** Used only when the master data has no active entries for `decisionMasterType`. */
  decisionOptions: string[];
}

/** Decision dropdown options of a role from the post-login master data (`misc` list); falls back to the static list. */
export function readReferralDecisionOptions(
  config: ReferralRoleConfig,
): { label: string; value: string }[] {
  const fromMaster = getMasterList("misc", config.decisionMasterType)
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.value ?? entry.description, value: entry.code }));
  return fromMaster.length > 0
    ? fromMaster
    : config.decisionOptions.map((option) => ({ label: option, value: option }));
}

export const HOD_CONFIG: ReferralRoleConfig = {
  role: "HOD",
  label: "HOD",
  roleTypes: ["HOD", "HOD_TASK"],
  decisionMasterType: "HOD_TERM_DEC",
  decisionOptions: ["Agree", "Disagree", "Refer to HO CMO", "Refer back to last UW", "Refer to IT"],
};

export const SR_UW_CONFIG: ReferralRoleConfig = {
  role: "SR_UW",
  label: "Sr UW",
  roleTypes: ["SR_UW", "SR_UW_TASK"],
  decisionMasterType: "SRUW_TERM_DEC",
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

/** First non-empty text among the given response fields. */
function firstText(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const text = readText(source[key]).trim();
    if (text) return text;
  }
  return "";
}

/**
 * `uw-decision/fetch` response -> Underwriting Decision History rows. Accepts a bare list, `{ data: [...] }`
 * or `{ data: { ... } }` (one decision). Rows with no values at all are dropped.
 */
export function mapReferralDecisionHistory(payload: unknown): ReferralDecisionHistoryRow[] {
  const root = isRecord(payload) && "data" in payload ? payload.data : payload;
  const list = Array.isArray(root) ? root : isRecord(root) ? [root] : [];
  return list
    .filter(isRecord)
    .map((row) => ({
      userName: firstText(row, ["userName", "createdBy", "updatedBy"]),
      userRole: firstText(row, ["userRole", "roleType"]),
      firstUwDecision: firstText(row, ["decision", "caseUwDecision"]),
      firstUwRemarks: firstText(row, ["uwRemarks", "remarks"]),
      date: formatDateTime(firstText(row, ["createdAt", "updatedAt", "date"])),
      financialDecision: firstText(row, ["financialDecision"]),
      medicalDecision: firstText(row, ["medicalDecision"]),
      smokerStatus: firstText(row, ["smokerStatus"]),
      referralReason: firstText(row, ["referralReason", "reasons"]),
      referralRemarks: firstText(row, ["referralRemarks"]),
    }))
    .filter((row) => Object.values(row).some((value) => value !== ""));
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
