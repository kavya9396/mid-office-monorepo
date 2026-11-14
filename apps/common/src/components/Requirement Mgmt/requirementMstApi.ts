import {
  applyBusinessApiAuthHeaders,
  getToken,
  masterUrls,
  useMock,
} from "@insurance-poc/utils";
import type { RequirementMstLevelResult, RequirementMstRequest } from "./requirementMstTypes";
import cascadeMock from "./mock/requirementMstCascade.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseRequirementMstPayload(payload: unknown): RequirementMstLevelResult {
  const root = isRecord(payload) ? payload : {};
  const data = isRecord(root.data) ? root.data : root;
  const mst = isRecord(data.requirement_mst) ? data.requirement_mst : {};
  const level = typeof mst.level === "string" ? mst.level.trim().toLowerCase() : "";

  if (level === "category") {
    return { level: "category", options: readStringList(mst.categories) };
  }
  if (level === "subcategory") {
    return { level: "subCategory", options: readStringList(mst.subCategories) };
  }
  if (level === "document") {
    return { level: "document", options: readStringList(mst.documents) };
  }
  if (level === "reason") {
    return { level: "reason", options: readStringList(mst.reasons) };
  }
  if (level === "fupcode") {
    return { level: "fupCode", options: readStringList(mst.fupCodes) };
  }

  const requirements = Array.isArray(mst.requirements) ? mst.requirements : [];
  const first = requirements.find(isRecord);
  const description =
    first && typeof first.description === "string" ? first.description.trim() : "";
  const ocrRaw = first && typeof first.ocrReq === "string" ? first.ocrReq.trim() : "";
  return {
    level: "requirement",
    description,
    ocrStatus: ocrRaw.length > 0 ? ocrRaw : "-",
  };
}

function mockLookup(request: RequirementMstRequest): RequirementMstLevelResult {
  const mst = request.requirementMst;
  const team = mst.team?.trim() ?? "";
  const category = mst.category?.trim() ?? "";
  const subCategory = mst.subCategory?.trim() ?? "";
  const document = mst.document?.trim() ?? "";
  const reason = mst.reason?.trim() ?? "";
  const fupCode = mst.fupCode?.trim() ?? "";

  const byTeam = cascadeMock.byTeam as Record<string, { categories: string[] }>;
  const byCategory = cascadeMock.byCategory as Record<string, { subCategories: string[] }>;
  const bySubCategory = cascadeMock.bySubCategory as Record<string, { documents: string[] }>;
  const byDocument = cascadeMock.byDocument as Record<string, { reasons: string[] }>;
  const byReason = cascadeMock.byReason as Record<string, { fupCodes: string[] }>;
  const byFupCode = cascadeMock.byFupCode as Record<
    string,
    { requirements: Array<{ description: string; ocrReq?: string }> }
  >;

  if (fupCode.length > 0) {
    const key = `${team}|${category}|${subCategory}|${document}|${reason}|${fupCode}`;
    const req = byFupCode[key]?.requirements?.[0];
    return {
      level: "requirement",
      description: req?.description ?? "",
      ocrStatus: req?.ocrReq?.trim() || "-",
    };
  }
  if (reason.length > 0) {
    const key = `${team}|${category}|${subCategory}|${document}|${reason}`;
    return { level: "fupCode", options: byReason[key]?.fupCodes ?? [] };
  }
  if (document.length > 0) {
    const key = `${team}|${category}|${subCategory}|${document}`;
    return { level: "reason", options: byDocument[key]?.reasons ?? [] };
  }
  if (subCategory.length > 0) {
    const key = `${team}|${category}|${subCategory}`;
    return { level: "document", options: bySubCategory[key]?.documents ?? [] };
  }
  if (category.length > 0) {
    const key = `${team}|${category}`;
    return { level: "subCategory", options: byCategory[key]?.subCategories ?? [] };
  }
  if (team.length > 0) {
    return { level: "category", options: byTeam[team]?.categories ?? [] };
  }
  return { level: "category", options: [] };
}

export function buildRequirementMstRequest(
  selection: RequirementMstRequest["requirementMst"],
): RequirementMstRequest {
  return {
    types: ["requirement_mst"],
    requirementMst: { ...selection },
  };
}

const WIRE_PROFILES = ["Life Assured", "Payer", "Proposer"];

/** Dev-only wire JSON shaped like the masters POST API (for mock console parity). */
function formatRequirementMstWireResponse(
  result: RequirementMstLevelResult,
  request: RequirementMstRequest,
): unknown {
  if (result.level === "requirement") {
    const mst = request.requirementMst;
    const team = mst.team?.trim() ?? "";
    const category = mst.category?.trim() ?? "";
    const subCategory = mst.subCategory?.trim() ?? "";
    const document = mst.document?.trim() ?? "";
    const reason = mst.reason?.trim() ?? "";
    const fupCode = mst.fupCode?.trim() ?? "";
    const byFupCode = cascadeMock.byFupCode as Record<
      string,
      { requirements: Array<Record<string, unknown>> }
    >;
    const key = `${team}|${category}|${subCategory}|${document}|${reason}|${fupCode}`;
    const requirements = byFupCode[key]?.requirements ?? [
      {
        code: fupCode,
        description: result.description,
        isActive: "Y",
        team,
        document,
        reason,
        ocrReq: "N",
      },
    ];

    return {
      data: {
        requirement_mst: {
          level: "requirement",
          requirements,
        },
      },
      unknownTypes: [],
    };
  }

  const requirementMst: Record<string, unknown> = {
    profiles: WIRE_PROFILES,
  };

  switch (result.level) {
    case "category":
      requirementMst.level = "category";
      requirementMst.categories = result.options;
      break;
    case "subCategory":
      requirementMst.level = "subCategory";
      requirementMst.subCategories = result.options;
      break;
    case "document":
      requirementMst.level = "document";
      requirementMst.documents = result.options;
      break;
    case "reason":
      requirementMst.level = "reason";
      requirementMst.reasons = result.options;
      break;
    case "fupCode":
      requirementMst.level = "fupCode";
      requirementMst.fupCodes = result.options;
      break;
  }

  return {
    data: { requirement_mst: requirementMst },
    unknownTypes: [],
  };
}

function logRequirementMstTrace(
  mode: "mock" | "api",
  request: RequirementMstRequest,
  wireResponse: unknown,
): void {
  if (!import.meta.env.DEV) return;
  console.info(`[RequirementMgmt] masters POST (${mode})`);
  console.info("[RequirementMgmt] request", request);
  console.info("[RequirementMgmt] response", wireResponse);
}

/** POST `VITE_MASTERS_API` — Requirement Management cascade (login GET flow unchanged). */
export async function fetchRequirementMstLevel(
  request: RequirementMstRequest,
): Promise<RequirementMstLevelResult> {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const result = mockLookup(request);
    logRequirementMstTrace("mock", request, formatRequirementMstWireResponse(result, request));
    return result;
  }

  const url = masterUrls.masters;
  if (url.length === 0) {
    throw new Error("VITE_MASTERS_API is not configured.");
  }
  const token = getToken()?.trim() ?? "";
  if (token.length === 0) {
    throw new Error("Sign in before loading requirement masters.");
  }

  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  applyBusinessApiAuthHeaders(headers);

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(request),
    headers,
  });
  const text = await response.text();
  if (!response.ok) {
    const message = text.trim().length > 0 ? text.trim() : `Masters request failed (${response.status}).`;
    throw new Error(message);
  }

  let payload: unknown;
  try {
    payload = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error("Masters response is not valid JSON.");
  }

  const result = parseRequirementMstPayload(payload);
  logRequirementMstTrace("api", request, payload);
  return result;
}