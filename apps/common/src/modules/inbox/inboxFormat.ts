const LABEL_ACRONYMS = new Set([
  "ACCUITY",
  "AMR",
  "CMO",
  "COPS",
  "CPT",
  "CUW",
  "CVT",
  "DVT",
  "ECG",
  "GOPS",
  "GUW",
  "HO",
  "HOD",
  "IIFL",
  "IT",
  "MMT_TASK",
  "MR",
  "NMR",
  "PIVV",
  "RI",
  "SR",
  "SUW",
  "TMT",
  "UW",
]);

export const HIDDEN_COLUMNS = new Set([
  "id",
  "taskId",
  "roleType",
  "instanceId",
  "createdBy",
  "updatedBy",
  "role",
  "businessType",
  "startTime",
  "atRiskTime",
  "poolName",
  "poolKey",
]);

export const MAX_VISIBLE_COLUMNS = 8;

/** Full UI labels for pool keys (sidebar, table title, DRS role, tooltips). */
const POOL_DISPLAY_LABELS: Readonly<Record<string, string>> = {
  MMT_TASK: "MMT Task",
};

export function toDisplayLabel(value: string): string {
  const trimmed = value.trim();
  const override = POOL_DISPLAY_LABELS[trimmed];
  if (override !== undefined) return override;

  return trimmed
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => {
      const upper = part.toUpperCase();
      if (LABEL_ACRONYMS.has(upper)) return upper;
      const lower = part.toLowerCase();
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

export function taskDetailsTitle(taskKey: string): string {
  const trimmed = taskKey.trim();
  const override = POOL_DISPLAY_LABELS[trimmed];
  const base = override ?? trimmed.replaceAll("_", " ");
  return `${base} Details`;
}

const COLUMN_LABELS: Record<string, string> = {
  isMedical: "Medical",
  appliedSa: "Applied SA",
  drc: "DRC",
  hniFlag: "HNI Flags",
  ptlr: "PTLR",
};

function splitCamelCase(value: string): string {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const current = value.charAt(index);
    const previous = value.charAt(index - 1);
    const needsSpace = previous >= "a" && previous <= "z" && current >= "A" && current <= "Z";
    result += needsSpace ? ` ${current}` : current;
  }
  return result;
}

export function formatColumnName(key: string): string {
  const mapped = COLUMN_LABELS[key];
  if (mapped) return mapped;
  const spaced = splitCamelCase(key.replaceAll("_", " "));
  return spaced
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function initials(value: string): string {
  const words = toDisplayLabel(value).split(" ").filter((word) => word.length > 0);
  const first = words[0] ?? "";
  const second = words[1];
  if (second) return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  if (first.length === 0) return "--";
  const letters = first.slice(0, 2);
  return letters.length === 1 ? `${letters}${letters}`.toUpperCase() : letters.toUpperCase();
}

export function isApplicationColumn(column: string): boolean {
  const normalized = column.replaceAll("_", "").replaceAll(" ", "").toLowerCase();
  return normalized === "applicationno" || normalized === "applicationnumber";
}

/**
 * Catalog / configure-columns field order: role-list keys minus hidden fields,
 * application number first when present.
 */
export function columnsForPool(columns: string[]): string[] {
  const withoutHidden = columns.filter((key) => !HIDDEN_COLUMNS.has(key));
  const applicationColumn = withoutHidden.find(isApplicationColumn);
  const rest = withoutHidden.filter((column) => column !== applicationColumn);
  return applicationColumn ? [applicationColumn, ...rest] : withoutHidden;
}

/**
 * Default visible table columns when pool-columns `selectedFields` is empty:
 * first {@link MAX_VISIBLE_COLUMNS} role-list fields (pool order), hidden fields omitted,
 * application number first.
 */
export function defaultVisibleColumns(roleListFieldKeys: string[]): string[] {
  return orderedVisibleFromSelectedFields(
    roleListFieldKeys.filter((key) => !HIDDEN_COLUMNS.has(key)),
  );
}

/**
 * Table columns from GET /pool-columns `selectedFields`: preserve API order, cap at {@link MAX_VISIBLE_COLUMNS},
 * and always place the application number column first (per landing spec).
 */
export function orderedVisibleFromSelectedFields(selectedFields: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const field of selectedFields) {
    if (typeof field !== "string" || field.length === 0) continue;
    if (seen.has(field)) continue;
    seen.add(field);
    unique.push(field);
  }
  const applicationFromApi = unique.find(isApplicationColumn);
  const rest = unique.filter((column) => !isApplicationColumn(column));
  const applicationColumn = applicationFromApi ?? "applicationNo";
  const withoutDupApp = rest.filter((column) => column !== applicationColumn);
  return [applicationColumn, ...withoutDupApp].slice(0, MAX_VISIBLE_COLUMNS);
}

export function formatLastLogin(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = parsed.getDate();
  const teen = day % 100;
  let suffix = "th";
  if (teen < 11 || teen > 13) {
    if (day % 10 === 1) suffix = "st";
    if (day % 10 === 2) suffix = "nd";
    if (day % 10 === 3) suffix = "rd";
  }
  const month = parsed.toLocaleString("en-US", { month: "long" });
  const year = parsed.getFullYear().toString().slice(-2);
  const time = parsed
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
  return `Last login: ${day}${suffix} ${month} '${year} ; ${time}`;
}
