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

const SHARED_DEFAULT_COLUMNS = [
  "channelCode",
  "channel",
  "product",
  "sumAssured",
  "premium",
  "clientType",
  "caseType",
];

const POOL_DEFAULT_COLUMNS: Partial<Record<string, string[]>> = {
  CPT_POOL: ["medicalReceivedDate", "financialReceivedDate", "poolTAT"],
  PIVV_POOL: ["pivvRaisedDate"],
  EXCEPTIONAL_POOL: ["lastPool"],
  SYSTEM_WAIT_POOL_NON_MEDICAL: ["lastPool", "requirementRaisedDate", "userId"],
  AMR_NON_MEDICAL: ["lastPool", "requirementRaisedDate", "userId"],
  RECONSIDERATION_POOL: ["lastPool", "userId", "uwDecisionDate", "poolTAT"],
  CUW: [
    "appliedSa",
    "annualPremium",
    "productType",
    "drc",
    "hniFlag",
    "isMedical",
    "munichReMedicalDecision",
    "ptlr",
  ],
  PRE_LOGIN: ["poolTAT"],
  POST_ISSUANCE_SERVICING: ["ct", "st", "source", "outliers"],
  REINSTATEMENT: ["ct", "st", "source", "outliers"],
  MMT: [
    "nameOfProposer",
    "nameOfLifeAssured",
    "productOpted",
    "plan",
    "medicalRaisedDate",
  ],
  GRIEVANCE: ["nameOfProposer", "nameOfLifeAssured", "grievanceRaisedDate"],
  GUW: [
    "productCode",
    "masterPlanNo",
    "poolTAT",
    "productType",
    "typeOfGroupBusiness",
    "caseReceivedDate",
  ],
  DVT_POOL: [
    "productCode",
    "masterPlanNo",
    "poolTAT",
    "productType",
    "typeOfGroupBusiness",
    "caseReceivedDate",
  ],
  GOPS_DVT: [
    "productCode",
    "masterPlanNo",
    "poolTAT",
    "productType",
    "typeOfGroupBusiness",
    "caseReceivedDate",
  ],
  DVT_FORMAL: ["policyNo", "productCode", "memberName", "poolTAT", "appliedCover"],
  GUW_FORMAL: ["policyNo", "productCode", "memberName", "poolTAT", "appliedCover"],
};

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
  return `${taskKey.replaceAll("_", " ")} Details`;
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

/** Column order follows fields that are actually present on the pool rows. */
export function columnsForPool(columns: string[], poolKey?: string): string[] {
  const applicationColumn = columns.find(isApplicationColumn);
  const poolColumns = (POOL_DEFAULT_COLUMNS[poolKey ?? ""] ?? []).filter(
    (column) => columns.includes(column) && column !== applicationColumn,
  );
  const rest = columns.filter((column) => column !== applicationColumn && !poolColumns.includes(column));
  return [...new Set([...(applicationColumn ? [applicationColumn] : []), ...poolColumns, ...rest])];
}

export function defaultVisibleColumns(columns: string[], poolKey?: string): string[] {
  const ordered = columnsForPool(columns, poolKey);
  const applicationColumn = ordered.find(isApplicationColumn);
  const poolColumns = (POOL_DEFAULT_COLUMNS[poolKey ?? ""] ?? []).filter(
    (column) => ordered.includes(column) && column !== applicationColumn,
  );
  const shared = SHARED_DEFAULT_COLUMNS.filter(
    (column) => ordered.includes(column) && column !== applicationColumn && !poolColumns.includes(column),
  );
  const rest = ordered.filter(
    (column) => column !== applicationColumn && !poolColumns.includes(column) && !shared.includes(column),
  );
  const unique = [...poolColumns, ...shared, ...rest];
  return applicationColumn
    ? [applicationColumn, ...unique].slice(0, MAX_VISIBLE_COLUMNS)
    : unique.slice(0, MAX_VISIBLE_COLUMNS);
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
