const MASTER_DATA_KEY = "masterData";

export type MasterListEntry = {
  code: string;
  description: string;
  value: string | null;
  isActive: string;
  /** Sub-type on some masters (e.g. `misc` → `SES_TIMEOUT`). */
  type?: string | null;
};

export type MasterDataPayload = {
  data: Record<string, MasterListEntry[]>;
  unknownTypes: string[];
};

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function setMasterData(payload: MasterDataPayload): void {
  const storage = readStorage();
  if (!storage) return;
  storage.setItem(MASTER_DATA_KEY, JSON.stringify(payload));
}

export function getMasterData(): MasterDataPayload | null {
  const raw = readStorage()?.getItem(MASTER_DATA_KEY);
  if (raw === undefined || raw === null || raw.trim().length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.data !== "object" || record.data === null) return null;
    const unknownTypes = Array.isArray(record.unknownTypes)
      ? record.unknownTypes.filter((item): item is string => typeof item === "string")
      : [];
    return {
      data: record.data as Record<string, MasterListEntry[]>,
      unknownTypes,
    };
  } catch {
    return null;
  }
}

export function clearMasterData(): void {
  readStorage()?.removeItem(MASTER_DATA_KEY);
}
