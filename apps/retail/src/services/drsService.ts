import type { BannerRowDetail } from "@insurance-poc/common/applicant-banner";
import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import {
  grievanceColumns,
  type GrievanceHistoryRow,
} from "@insurance-poc/common/grievance-history";
import type { LifeAssuredApplicant } from "@insurance-poc/common/life-assured";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { Column } from "@insurance-poc/ui";
import { formatDateTime } from "@insurance-poc/utils";
import retailMock from "../../../../mock/drs/retail-drs.json";
import { mapCvtApplicants } from "../modules/drs/cvtApplicantData";
import type { CvtEditApplicantValues } from "../modules/drs/CvtEditApplicantDialog";
import type { MmtGrievanceMemberContext } from "./mmtGrievanceService";

export interface DrsRecord {
  applicationNo: string;
  taskId: string;
  customerName: string;
  productName: string;
  businessType: string;
  appliedSa?: number | string | null;
  annualPremium?: number | string | null;
  policyTerm?: number;
  premiumPayingTerm?: number;
  status?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchRetailDrsRecord(
  applicationNo: string,
): Promise<DrsRecord | undefined> {
  await wait(250);

  return retailMock.records.find(
    (record) => record.applicationNo === applicationNo,
  );
}

export type CardDetail = {
  /** Card title as sent by the API (e.g. "Application Detail"). */
  type: string;
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

/** Applicant profile values the MMT banner reads from `membersDetails[].subSections`. */
export type RetailMmtSubSection = {
  partyId: string;
  lifeNumber: string;
};

export type RetailDrsData = {
  applicationNo: string;
  cardDetails: CardDetail[];
  breDecision: BreDecision;
  requirements: RequirementItem[];
  applicants: LifeAssuredApplicant[];
  /** Edit Applicant dialog initial values per applicant id. */
  editValues: Record<string, CvtEditApplicantValues>;
  /** Banner rows from the primary member (`membersDetails[].rowDetails`). */
  rowDetails: BannerRowDetail[];
  applicantName: string;
  grievanceHistoryTitle: string;
  tpaGrievanceTitle: string;
  grievanceHistoryColumns: Column<GrievanceHistoryRow>[];
  tpaGrievanceColumns: Column<GrievanceHistoryRow>[];
  grievanceHistory: GrievanceHistoryRow[];
  tpaGrievanceDetails: GrievanceHistoryRow[];
  subSections: RetailMmtSubSection;
  /** Party context sent to the MMT grievance fetch and save APIs. */
  memberContext: MmtGrievanceMemberContext;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function invalidResponse(): Error {
  return new Error("Retail DRS response is not in the expected format.");
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
    const columns: string[] = item.columns;
    if (!Array.isArray(item.rows)) return { name: item.name, columns, rows: [] };

    const rows = item.rows.map((row) => {
      if (!isRecord(row)) return {};
      const cells: Record<string, string> = {};
      for (const column of columns) cells[column] = readText(row[column]).trim();
      return cells;
    });
    return { name: item.name, columns, rows };
  });
}

function readCards(value: unknown): CardDetail[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((item) =>
    typeof item.type === "string"
      ? [
          {
            type: item.type,
            attributes: readAttributes(item.attributes),
            expandedAttributes: readAttributes(item.expandedAttributes),
            tables: readTables(item.tables),
          },
        ]
      : [],
  );
}

/** Finds an entry by name inside `commonSection`. */
function findSection(sections: unknown, name: string): Record<string, unknown> | null {
  if (!Array.isArray(sections)) throw invalidResponse();
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
  if (!isRecord(value) || !Array.isArray(value.rows)) throw invalidResponse();

  const rows = value.rows.map((row): BreRow => {
    if (!isRecord(row)) throw invalidResponse();
    return {
      id: readText(row.id),
      label: readText(row.label),
      initial: readBreText(row.initial),
      final: readBreText(row.final),
    };
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

const normaliseStatus = (status: string): string => {
  const value = status.trim().toUpperCase();
  if (value === "PENDING") return "Pending";
  if (value === "WAIVE" || value === "WAIVED") return "Waived";
  if (value === "ACCEPT" || value === "ACCEPTED") return "Accept";
  if (value === "REJECT" || value === "REJECTED") return "Reject";
  if (value === "CANCELLED" || value === "CANCEL") return "Cancelled";
  if (value === "RECEIVED") return "Received";
  const trimmed = status.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
};

function extractRequirementRows(rowsOrSection: unknown): unknown[] {
  if (Array.isArray(rowsOrSection)) return rowsOrSection;
  if (isRecord(rowsOrSection)) {
    if (Array.isArray(rowsOrSection.rows)) return rowsOrSection.rows;
    if (Array.isArray(rowsOrSection.requirementManagement)) return rowsOrSection.requirementManagement;
  }
  return [];
}

/** Requirement rows parser handling either an array or an object with `.rows`. */
export function mapRawRequirementRows(rowsOrSection: unknown): RequirementItem[] {
  return extractRequirementRows(rowsOrSection).map((row, index) => {
    const source = isRecord(row) ? row : {};
    return {
      id: typeof source.requirementId === "number" ? source.requirementId : index + 1,
      status: normaliseStatus(readText(source.status)),
      ocrStatus: readText(source.ocrStatus),
      team: readText(source.team),
      profile: readText(source.profile),
      category: readText(source.category),
      subCategory: readText(source.subCategory),
      document: readText(source.document),
      reason: readText(source.reason),
      fupCode: readText(source.fupCode),
      extraRemarks: readText(source.extraRemarks),
      description: readText(source.description),
    };
  });
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
  userName: ["userName", "user", "raisedBy", "User Name"],
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

function headerText(column: unknown): string {
  return isRecord(column) ? readText(column.label) : readText(column);
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
    if (key in row) return readText(row[key]);
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
    updatedBy: rowField(row, GRIEVANCE_ROW_ALIASES.updatedBy),
  }));
}

function mapRowDetails(rowDetails: unknown): BannerRowDetail[] {
  if (!Array.isArray(rowDetails)) return [];
  return rowDetails.filter(isRecord).map((row, index) => ({
    id: typeof row.id === "number" || typeof row.id === "string" ? row.id : index,
    fields: Array.isArray(row.fields)
      ? row.fields
          .filter(isRecord)
          .map((field) => ({ name: readText(field.name), value: readText(field.value) }))
      : [],
  }));
}

function fieldValue(fields: BannerRowDetail["fields"] | undefined, name: string): string {
  return readText(fields?.find((field) => field.name === name)?.value);
}

function mapApplicantSubSection(member: Record<string, unknown> | null): RetailMmtSubSection {
  const subSections = member?.subSections;
  const profileSection = Array.isArray(subSections)
    ? subSections.filter(isRecord).find((entry) => entry.name === "applicantProfile")
    : null;
  const value = isRecord(profileSection?.value) ? profileSection.value : null;
  return {
    partyId: readText(value?.partyId),
    lifeNumber: readText(value?.lifeNumber),
  };
}

export function mapRetailDrsPayload(value: unknown): RetailDrsData {
  if (!isRecord(value)) throw invalidResponse();
  const data = isRecord(value.data) ? value.data : value;

  const applicationNo = readText(data.applicationNo).trim();
  if (applicationNo.length === 0) throw invalidResponse();

  const membersDetails = Array.isArray(data.membersDetails) ? data.membersDetails : [];
  const primaryMember = membersDetails.find(isRecord) ?? null;
  const { applicants, editValues } = mapCvtApplicants(membersDetails);
  const rowDetails = mapRowDetails(primaryMember?.rowDetails);
  const nameRow = rowDetails.find((row) => row.id === 0);
  const historySection = findNamedSection(data.commonSection, "grievanceHistory");
  const tpaSection = findNamedSection(data.commonSection, "tpaGrievanceDetails");
  const subSections = mapApplicantSubSection(primaryMember);
  const partyId = subSections.partyId.trim();
  const lifeNumber = subSections.lifeNumber.trim();

  return {
    applicationNo,
    cardDetails: readCards(primaryMember?.cardDetails ?? data.cardDetails),
    breDecision: readBre(findSection(data.commonSection, "latestBreDecision")),
    requirements: mapRawRequirementRows(findSection(data.commonSection, "requirementManagement")),
    applicants,
    editValues,
    rowDetails,
    applicantName: fieldValue(nameRow?.fields, "Name"),
    grievanceHistoryTitle: readText(historySection?.label) || "Grievance History",
    tpaGrievanceTitle: readText(tpaSection?.label) || "TPA Grievance Details",
    grievanceHistoryColumns: buildGrievanceColumns(historySection?.value),
    tpaGrievanceColumns: buildGrievanceColumns(tpaSection?.value),
    grievanceHistory: mapGrievanceRows(historySection),
    tpaGrievanceDetails: mapGrievanceRows(tpaSection),
    subSections,
    memberContext: {
      applicationNo,
      partyId: partyId.length > 0 ? partyId : undefined,
      lifeNumber: lifeNumber.length > 0 ? lifeNumber : undefined,
      transactionId: readText(data.transactionId).trim() || null,
    },
  };
}
