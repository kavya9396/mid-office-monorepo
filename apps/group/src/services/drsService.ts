import type { BannerRowDetail } from "@insurance-poc/common/applicant-banner";
import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import {
  grievanceColumns,
  type GrievanceHistoryRow,
} from "@insurance-poc/common/grievance-history";
import type { LifeAssuredApplicant, RiderEditRow } from "@insurance-poc/common/life-assured";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { Column } from "@insurance-poc/ui";
import { formatDateTime } from "@insurance-poc/utils";
import { mapApplicants } from "../modules/drs/lifeAssuredData";
import { mapMembersQuickLinks, type QuickLinksSubSections } from "../modules/drs/quickLinksData";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";
import type { MmtGrievanceMemberContext } from "./mmtGrievanceService";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
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

/** Finds an entry by name inside the data.sections array. */
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
  if (!Array.isArray(members)) throw invalidResponse();
  return members;
}

function readMemberTypes(membersDetails: unknown): string[] {
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
  return readText(fields?.find((field) => field.name === name)?.value).trim();
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
