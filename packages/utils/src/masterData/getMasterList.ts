import { getMasterData, type MasterListEntry } from "./session";

function normalizeKey(value: string): string {
  return value.trim();
}

function readRowType(entry: MasterListEntry): string {
  const type = entry.type;
  if (typeof type === "string") {
    const trimmed = type.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return "";
}

function typesMatch(rowType: string, filterType: string): boolean {
  return rowType.toUpperCase() === filterType.toUpperCase();
}

/**
 * Reads master lists from session storage (post-login `masterData`).
 *
 * @param masterType API master key, e.g. `gender`, `misc`, `occupation`
 * @param type Optional row `type` filter (e.g. `SES_TIMEOUT` within `misc`)
 */
export function getMasterList(masterType: string, type?: string): MasterListEntry[] {
  const key = normalizeKey(masterType);
  if (key.length === 0) return [];

  const payload = getMasterData();
  if (!payload) return [];

  const rawEntry = (payload.data as Record<string, unknown>)[key];
  let list: MasterListEntry[] = [];
  if (Array.isArray(rawEntry)) {
    list = rawEntry;
  } else if (typeof rawEntry === "object" && rawEntry !== null) {
    const record = rawEntry as Record<string, unknown>;
    if (Array.isArray(record.teams)) {
      list = record.teams.map((team) => ({
        code: String(team),
        description: String(team),
        value: String(team),
        isActive: "Y",
        type: typeof record.level === "string" ? record.level : "team",
      }));
    }
  }

  if (list.length === 0) return [];

  const filterType = type === undefined ? "" : normalizeKey(type);
  if (filterType.length === 0) return [...list];

  return list.filter((entry) => {
    const rowType = readRowType(entry);
    return rowType.length > 0 && typesMatch(rowType, filterType);
  });
}
