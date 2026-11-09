import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import type { LifeAssuredApplicant, RiderEditRow } from "@insurance-poc/common/life-assured";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import { mapApplicants } from "../modules/drs/lifeAssuredData";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";

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
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.name !== "string") throw invalidResponse();
    return { name: item.name, value: readText(item.value) };
  });
}

function readTables(value: unknown): DetailTable[] {
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.name !== "string" || !Array.isArray(item.columns)) {
      throw invalidResponse();
    }
    if (!item.columns.every((column) => typeof column === "string")) throw invalidResponse();
    if (!Array.isArray(item.rows)) throw invalidResponse();

    const columns: string[] = item.columns;
    const isRiderTable = item.name === RIDER_TABLE_NAME;

    const rows = item.rows.map((row, index) => {
      if (!isRecord(row)) throw invalidResponse();
      const cells: Record<string, string> = {};
      for (const column of columns) {
        if (isRiderTable && column === "Rider") {
          cells[column] = `Rider ${index + 1}`;
          continue;
        }
        const key = isRiderTable ? RIDER_COLUMN_KEYS[column] : column;
        cells[column] = key ? readText(row[key]) : "";
      }
      return cells;
    });

    return { name: item.name, columns, rows };
  });
}

function readCards(value: unknown): CardDetail[] {
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.type !== "string") throw invalidResponse();
    return {
      type: readCardType(item.type),
      attributes: readAttributes(item.attributes),
      expandedAttributes: readAttributes(item.expandedAttributes),
      tables: readTables(item.tables),
    };
  });
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

/** Requirement rows sit directly on the section and carry no id, so the row index is used. */
function readRequirements(section: Record<string, unknown> | null): RawRequirement[] {
  const rows = section?.rows;
  if (!Array.isArray(rows)) throw invalidResponse();
  return rows.map((row, index) => {
    if (!isRecord(row)) throw invalidResponse();
    return {
      requirementId: typeof row.requirementId === "number" ? row.requirementId : index,
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
  return table.rows.filter(isRecord).map((row) => ({
    riderName: readText(row.name),
    sumAssured: readText(row.sumAssured),
    riderTerm: "",
  }));
}

function readApplicantMembers(section: Record<string, unknown> | null): unknown[] {
  const members = section?.value;
  if (!Array.isArray(members)) throw invalidResponse();
  return members;
}

export function mapGroupDrsPayload(value: unknown): GroupDrsData {
  if (!isRecord(value)) throw invalidResponse();
  const data = isRecord(value.data) ? value.data : value;

  const applicationNo = readText(data.applicationNo).trim();
  if (applicationNo.length === 0) throw invalidResponse();

  const sections = data.sections;

  return {
    applicationNo,
    cardDetails: readCards(data.cardDetails),
    breDecision: readBre(findSection(sections, "latestBreDecision")),
    dvtDecision: readDvtDecision(findSection(sections, "dvtDecision")),
    requirements: mapRequirements(readRequirements(findSection(sections, "requirementManagement"))),
    applicants: mapApplicants({
      members: readApplicantMembers(findSection(sections, "applicantProfile")),
      riders: readRiders(data.cardDetails),
    }),
  };
}
