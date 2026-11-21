import { applyBusinessApiAuthHeaders, getToken, masterUrls, useMock } from "@insurance-poc/utils";
import uwDecisionMappingMock from "../../../../mock/drs/guw-uw-decision-mapping.json";

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
  BOR_STD: "STD",
  REJ: "POST_DEC_REJECT",
  DC: "POST_DEC_REJECT",
  POSTP: "POST_DEC_REJECT",
  CO: "COFF",
  EP: "XRT",
};

interface DecisionMappingRow {
  decisionCode: string;
  decisionDescriptionCode: string;
  displayOrder: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
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
    const decisionCode = readText(item.decisionCode);
    if (decisionCode.length === 0) continue;
    rows.push({
      decisionCode,
      decisionDescriptionCode: readText(item.decisionDescriptionCode),
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
