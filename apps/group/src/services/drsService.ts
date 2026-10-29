import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import type { LifeAssuredApplicant } from "@insurance-poc/common/life-assured";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { RiskCardData } from "@insurance-poc/common/risk-cards";
import { mapApplicants, type LifeAssuredSource } from "../modules/drs/lifeAssuredData";
import { mapRequirements, type RawRequirement } from "../modules/drs/requirementData";
import { mapRiskCards } from "../modules/drs/riskCardsData";

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
  initialDecision: string;
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
  latestBreDecision?: BreDecision;
  requirements: RequirementItem[];
  applicants: LifeAssuredApplicant[];
  riskCards: RiskCardData[];
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

/** Finds a section by name inside data.sections array and returns its value. */
function findSection(sections: unknown, name: string): unknown {
  if (!Array.isArray(sections)) throw invalidResponse();
  const entry = sections.find(
    (s) => isRecord(s) && s.name === name,
  ) as Record<string, unknown> | undefined;
  return entry?.value ?? null;
}

function readBre(value: unknown): BreDecision {
  if (!isRecord(value)) throw invalidResponse();
  const reTriggerCount = value.reTriggerCount;
  if (typeof reTriggerCount !== "number") throw invalidResponse();
  return {
    decision: readText(value.decision),
    initialDecision: readText(value.initialDecision),
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

/**
 * Reads the product detail from applicationOverview.productDetail (array).
 * Falls back to empty strings if absent.
 */
function readProductDetail(appOverview: unknown): { code: string; productType: string } {
  if (!isRecord(appOverview)) return { code: "", productType: "" };
  const products = appOverview.productDetail;
  if (!Array.isArray(products) || products.length === 0) return { code: "", productType: "" };
  const first = products[0];
  if (!isRecord(first)) return { code: "", productType: "" };
  return {
    code: readText(first.code),
    productType: readText(first.productType),
  };
}

/**
 * Reads rider details from applicationOverview.riderDetails (array).
 */
function readRiderDetails(appOverview: unknown): { riderName: string; sumAssured: number; riderTerm: number }[] {
  if (!isRecord(appOverview) || !Array.isArray(appOverview.riderDetails)) return [];
  return appOverview.riderDetails
    .filter(isRecord)
    .map((r) => ({
      riderName: readText(r.riderName),
      sumAssured: typeof r.sumAssured === "number" ? r.sumAssured : 0,
      riderTerm: typeof r.riderTerm === "number" ? r.riderTerm : 0,
    }));
}

/**
 * Reads loan/group details from applicationOverview.groupDetails.
 */
function readLoanDetail(appOverview: unknown): Record<string, string> {
  if (!isRecord(appOverview) || !isRecord(appOverview.groupDetails)) return {};
  const g = appOverview.groupDetails;
  return {
    baseSumAssured: "",
    loanAmount: g.loanAmount != null ? String(g.loanAmount) : "",
    loanDisbursementDate: readText(g.dateOfLoanDisbursement),
    loanShare: g.shareOfLoan != null ? String(g.shareOfLoan) : "",
    loanTerm: g.loanTerm != null ? String(g.loanTerm) : "",
    policyTerm: "",
    masterCode: "",
    loanAccountNumber: "",
  };
}

function readLifeAssured(
  summaryValue: unknown,
  appOverview: unknown,
): LifeAssuredSource {
  if (!Array.isArray(summaryValue)) throw invalidResponse();

  const productDetail = readProductDetail(appOverview);
  const riderDetails = readRiderDetails(appOverview);
  const loan = readLoanDetail(appOverview);

  return {
    summary: summaryValue,
    productDetail,
    riderDetails,
    loan: loan as LifeAssuredSource["loan"],
    imageRecords: [],
  };
}

export function mapGroupDrsPayload(value: unknown): GroupDrsData {
  if (!isRecord(value)) throw invalidResponse();
  const data = isRecord(value.data) ? value.data : value;

  const applicationNo = readText(data.applicationNo).trim();
  if (applicationNo.length === 0) throw invalidResponse();

  const sections = data.sections;
  const breSection = findSection(sections, "breDecision");
  const latestBreSection = findSection(sections, "latestBreDecision");
  const summarySection = findSection(sections, "summary");
  const requirementSection = findSection(sections, "requirementManagement");
  const appOverviewSection = findSection(sections, "applicationOverview");

  return {
    applicationNo,
    cardDetails: readCards(data.cardDetails),
    breDecision: readBre(breSection),
    latestBreDecision: latestBreSection != null ? readBre(latestBreSection) : undefined,
    requirements: mapRequirements(readRequirements(requirementSection)),
    applicants: mapApplicants(readLifeAssured(summarySection, appOverviewSection)),
    riskCards: mapRiskCards(summarySection),
  };
}
