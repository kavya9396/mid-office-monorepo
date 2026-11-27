import type { RequirementMstCascadeKey } from "./requirementMstTypes";

const STORAGE_KEY = "requirementMgmtMstContext";

export type RequirementMstRowSession = {
  options: Partial<Record<RequirementMstCascadeKey, string[]>>;
  enabled: Partial<Record<RequirementMstCascadeKey, boolean>>;
};

type RequirementMstSessionRoot = {
  applicationKey: string;
  rows: Record<string, RequirementMstRowSession>;
};

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function emptyRowSession(): RequirementMstRowSession {
  return { options: {}, enabled: {} };
}

function normalizeRowSession(value: Record<string, unknown>): RequirementMstRowSession {
  const optionsRaw = value.options;
  const enabledRaw = value.enabled;
  const options: Partial<Record<RequirementMstCascadeKey, string[]>> = {};
  const enabled: Partial<Record<RequirementMstCascadeKey, boolean>> = {};

  if (isRecord(optionsRaw)) {
    for (const key of ["category", "subCategory", "document", "reason", "fupCode"] as const) {
      const list = readStringArray(optionsRaw[key]);
      if (list.length > 0) options[key] = list;
    }
  }
  if (isRecord(enabledRaw)) {
    for (const key of ["category", "subCategory", "document", "reason", "fupCode"] as const) {
      if (enabledRaw[key] === true) enabled[key] = true;
    }
  }
  return { options, enabled };
}

function readRoot(): RequirementMstSessionRoot {
  const raw = readStorage()?.getItem(STORAGE_KEY);
  if (!raw) return { applicationKey: "", rows: {} };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { applicationKey: "", rows: {} };
    const applicationKey = typeof parsed.applicationKey === "string" ? parsed.applicationKey : "";
    const rows: Record<string, RequirementMstRowSession> = {};
    if (isRecord(parsed.rows)) {
      for (const [rowId, value] of Object.entries(parsed.rows)) {
        if (isRecord(value)) rows[rowId] = normalizeRowSession(value);
      }
    }
    return { applicationKey, rows };
  } catch {
    return { applicationKey: "", rows: {} };
  }
}

function writeRoot(root: RequirementMstSessionRoot): void {
  readStorage()?.setItem(STORAGE_KEY, JSON.stringify(root));
}

export function clearRequirementMstContext(): void {
  readStorage()?.removeItem(STORAGE_KEY);
}

export function ensureRequirementMstApplicationKey(applicationKey: string): void {
  const trimmed = applicationKey.trim();
  if (trimmed.length === 0) return;
  const root = readRoot();
  if (root.applicationKey === trimmed) return;
  writeRoot({ applicationKey: trimmed, rows: {} });
}

export function getRequirementMstRowSession(rowId: string): RequirementMstRowSession {
  return readRoot().rows[rowId] ?? emptyRowSession();
}

export function setRequirementMstRowSession(rowId: string, session: RequirementMstRowSession): void {
  const root = readRoot();
  root.rows[rowId] = session;
  writeRoot(root);
}

export function removeRequirementMstRowSession(rowId: string): void {
  const root = readRoot();
  if (!root.rows[rowId]) return;
  delete root.rows[rowId];
  writeRoot(root);
}