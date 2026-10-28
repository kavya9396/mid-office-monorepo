import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import type { LifeAssuredApplicant } from "@insurance-poc/common/life-assured";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import { mapApplicants, type LifeAssuredSource } from "../modules/drs/lifeAssuredData";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";

export const GROUP_DRS_PATH = "/drs";

export type CardType = "APPLICATION" | "SOURCE" | "GROUP" | "RISK";

export type CardDetail = {
  type: CardType;
  attributes: DetailAttribute[];
  expandedAttributes: DetailAttribute[];
  tables: DetailTable[];
};

export type BreDecision = {
  decision: string;
  remarks: string;
  discrepancy: string;
  action: string;
  timestamp: string;
  reTriggerCount: number;
};

export type GroupDrsData = {
  applicationNo: string;
  cardDetails: CardDetail[];
  breDecision: BreDecision;
  latestBreDecision: BreDecision;
  requirements: RequirementItem[];
  applicants: LifeAssuredApplicant[];
};

const CARD_TYPES: readonly CardType[] = ["APPLICATION", "SOURCE", "GROUP", "RISK"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function invalidResponse(): Error {
  return new Error("Group DRS response is not in the expected format.");
}

function isCardType(value: string): value is CardType {
  return CARD_TYPES.includes(value as CardType);
}

function readAttributes(value: unknown): DetailAttribute[] {
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.name !== "string") throw invalidResponse();
    const attributeValue = item.value;
    const text =
      typeof attributeValue === "string"
        ? attributeValue
        : attributeValue == null
          ? ""
          : String(attributeValue);
    return { name: item.name, value: text };
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

    const rows = item.rows.map((row) => {
      if (!isRecord(row)) throw invalidResponse();
      const cells: Record<string, string> = {};
      for (const [key, cell] of Object.entries(row)) {
        cells[key] = typeof cell === "string" ? cell : cell == null ? "" : String(cell);
      }
      return cells;
    });

    return { name: item.name, columns: item.columns, rows };
  });
}

function readCards(value: unknown): CardDetail[] {
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.type !== "string" || !isCardType(item.type)) {
      throw invalidResponse();
    }
    return {
      type: item.type,
      attributes: readAttributes(item.attributes),
      expandedAttributes: readAttributes(item.expandedAttributes),
      tables: readTables(item.tables),
    };
  });
}

function readBre(value: unknown): BreDecision {
  if (!isRecord(value)) throw invalidResponse();
  const reTriggerCount = value.reTriggerCount;
  if (typeof reTriggerCount !== "number") throw invalidResponse();
  return {
    decision: readText(value.decision),
    remarks: readText(value.remarks),
    discrepancy: readText(value.discrepancy),
    action: readText(value.action),
    timestamp: readText(value.timestamp),
    reTriggerCount,
  };
}

function readRequirements(value: unknown): RawRequirement[] {
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.requirementId !== "number") throw invalidResponse();
    return {
      requirementId: item.requirementId,
      status: readText(item.status),
      ocrStatus: readText(item.ocrStatus),
      team: readText(item.team),
      category: readText(item.category),
      subCategory: readText(item.subCategory),
      document: readText(item.document),
      reason: readText(item.reason),
      fupCode: readText(item.fupCode),
      description: readText(item.description),
    };
  });
}

function readLifeAssured(value: unknown): LifeAssuredSource {
  if (
    !isRecord(value) ||
    !Array.isArray(value.summary) ||
    !isRecord(value.productDetail) ||
    !Array.isArray(value.riderDetails) ||
    !isRecord(value.loan) ||
    !Array.isArray(value.imageRecords)
  ) {
    throw invalidResponse();
  }
  return value as LifeAssuredSource;
}

export function mapGroupDrsPayload(value: unknown): GroupDrsData {
  if (!isRecord(value)) throw invalidResponse();
  const data = isRecord(value.data) ? value.data : value;

  const applicationNo = readText(data.applicationNo).trim();
  if (applicationNo.length === 0) throw invalidResponse();

  return {
    applicationNo,
    cardDetails: readCards(data.cardDetails),
    breDecision: readBre(data.breDecision),
    latestBreDecision: readBre(data.latestBreDecision),
    requirements: mapRequirements(readRequirements(data.requirementManagement)),
    applicants: mapApplicants(readLifeAssured(data.lifeAssured)),
  };
}
