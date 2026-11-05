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
  "MMT",
  "MR",
  "NMR",
  "PIVV",
  "RI",
  "SR",
  "SUW",
  "TMT",
  "UW",
]);

export const DASHBOARD_TASK_KEYS = new Set([
  "AMR_MEDICAL_TASK",
  "AMR_NON_MEDICAL_TASK",
  "ACCUITY_TASK",
  "RISK_TASK",
  "IIFL_TASK",
  "PAYATS_TASK",
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

const MAX_VISIBLE_COLUMNS = 8;

export function toDisplayLabel(value: string): string {
  return value
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
  return `${taskKey.split("_").join(" ")} Details`;
}

export function formatColumnName(key: string): string {
  let spaced = "";
  for (const char of key) {
    const isUpper = char >= "A" && char <= "Z";
    if (isUpper && spaced.length > 0 && spaced.charAt(spaced.length - 1) !== " ") {
      spaced += " ";
    }
    spaced += char === "_" ? " " : char;
  }

  return spaced
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => {
      const lower = part.toLowerCase();
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
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
  const normalized = column.split("_").join("").split(" ").join("").toLowerCase();
  return normalized === "applicationno" || normalized === "applicationnumber";
}

export function defaultVisibleColumns(columns: string[]): string[] {
  const applicationColumn = columns.find(isApplicationColumn);
  const rest = columns.filter((column) => column !== applicationColumn);
  const ordered = applicationColumn ? [applicationColumn, ...rest] : rest;
  return ordered.slice(0, MAX_VISIBLE_COLUMNS);
}

export function formatLastLogin(value: Date): string {
  const day = value.getDate();
  const teen = day % 100;
  let suffix = "th";
  if (teen < 11 || teen > 13) {
    if (day % 10 === 1) suffix = "st";
    if (day % 10 === 2) suffix = "nd";
    if (day % 10 === 3) suffix = "rd";
  }
  const month = value.toLocaleString("en-US", { month: "long" });
  const year = value.getFullYear().toString().slice(-2);
  const time = value
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
  return `Last login: ${day}${suffix} ${month} '${year} ; ${time}`;
}
