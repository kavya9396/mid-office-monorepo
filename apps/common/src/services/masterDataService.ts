import {
  applyBusinessApiAuthHeaders,
  getToken,
  masterUrls,
  setMasterData,
  useMock,
} from "@insurance-poc/utils";
import { buildMastersRequestUrl } from "./masterData/buildMasterQuery";
import type { MasterDataPayload, MasterListEntry } from "./masterData/masterDataTypes";
import { MASTER_DATA_TYPES } from "./masterData/masterTypesConfig";
import mastersMock from "./masterData/mock/masters.json";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMasterEntry(value: unknown): MasterListEntry | null {
  if (!isRecord(value)) return null;
  const code = typeof value.code === "string" ? value.code : "";
  const description = typeof value.description === "string" ? value.description : "";
  const isActive = typeof value.isActive === "string" ? value.isActive : "";
  const rawValue = value.value;
  let entryValue: string | null = null;
  if (rawValue === null) {
    entryValue = null;
  } else if (typeof rawValue === "string") {
    entryValue = rawValue;
  }
  const rowType = typeof value.type === "string" ? value.type.trim() : "";
  if (code.length === 0 && description.length === 0) return null;
  return {
    code,
    description,
    value: entryValue,
    isActive,
    ...(rowType.length > 0 ? { type: rowType } : {}),
  };
}

export function parseMasterDataResponse(value: unknown): MasterDataPayload {
  const root = isRecord(value) && isRecord(value.data) ? value : null;
  const dataRoot = root?.data ?? (isRecord(value) ? value : null);
  if (!dataRoot || !isRecord(dataRoot)) {
    throw new Error("Master data response is not in the expected format.");
  }

  const data: Record<string, MasterListEntry[]> = {};
  for (const [typeKey, list] of Object.entries(dataRoot)) {
    if (!Array.isArray(list)) {
      data[typeKey] = [];
      continue;
    }
    data[typeKey] = list
      .map((item) => readMasterEntry(item))
      .filter((item): item is MasterListEntry => item !== null);
  }

  const unknownRaw = root?.unknownTypes;
  const unknownTypes = Array.isArray(unknownRaw)
    ? unknownRaw.filter((item): item is string => typeof item === "string")
    : [];

  return { data, unknownTypes };
}

async function mockFetchMasterData(): Promise<MasterDataPayload> {
  await wait(200);
  return parseMasterDataResponse(mastersMock);
}

async function realFetchMasterData(): Promise<MasterDataPayload> {
  const url = masterUrls.masters;
  if (url.length === 0) {
    throw new Error("VITE_MASTERS_API is not configured.");
  }
  const token = getToken()?.trim() ?? "";
  if (token.length === 0) {
    throw new Error("Sign in before loading master data.");
  }

  const requestUrl = buildMastersRequestUrl(url, MASTER_DATA_TYPES);
  const headers = new Headers();
  headers.set("Accept", "application/json");
  applyBusinessApiAuthHeaders(headers);

  let response: Response;
  try {
    response = await fetch(requestUrl, { method: "GET", headers });
  } catch (reason: unknown) {
    const detail = reason instanceof Error ? reason.message : "Network error";
    throw new Error(`Unable to reach the master data API (${detail}).`);
  }

  const text = await response.text();
  if (!response.ok) {
    const message = text.trim().length > 0 ? text.trim() : `Master data request failed (${response.status}).`;
    throw new Error(message);
  }

  let payload: unknown;
  try {
    payload = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error("Master data response is not valid JSON.");
  }

  return parseMasterDataResponse(payload);
}

/** Loads master data (mock or real) and does not persist — use `fetchAndStoreMasterData` after login. */
export async function fetchMasterData(): Promise<MasterDataPayload> {
  return useMock ? mockFetchMasterData() : realFetchMasterData();
}

/** After successful login: fetch masters, then store in sessionStorage (shared Retail/Group). */
export async function fetchAndStoreMasterData(): Promise<MasterDataPayload> {
  const payload = await fetchMasterData();
  setMasterData(payload);
  return payload;
}
