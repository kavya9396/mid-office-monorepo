export type InboxFieldValue = string | number | boolean | null;

export const ROLE_POOL_KEYS = [
  "CVT_POOL",
  "CPT_POOL",
  "PIVV_POOL",
  "PRE_ISSUANCE_SERVICING_POOL",
  "EXCEPTIONAL_POOL",
  "SYSTEM_WAIT_POOL_NON_MEDICAL",
  "AMR_NON_MEDICAL",
  "RECONSIDERATION_POOL",
  "CUW",
  "PRE_LOGIN",
  "POST_ISSUANCE_SERVICING",
  "REINSTATEMENT",
  "MMT",
  "GRIEVANCE",
  "GUW",
  "DVT_POOL",
  "GOPS_DVT",
  "DVT_FORMAL",
  "GUW_FORMAL",
] as const;

export type RolePoolKey = (typeof ROLE_POOL_KEYS)[number];

export interface InboxCase {
  rowId: string;
  poolName: RolePoolKey;
  applicationNo: string;
  fields: Record<string, InboxFieldValue>;
}

export interface InboxData {
  userId: string;
  poolData: Partial<Record<RolePoolKey, InboxCase[]>>;
}

export type ColumnConfigSaveResponse = {
  success?: boolean;
  message?: string;
};

const savedPoolColumns = new Map<string, string[]>();

export function readSelectedFields(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const selected = Array.isArray(value.selectedFields) ? value.selectedFields : value.availableFields;
  if (!Array.isArray(selected)) return [];
  return selected.filter((field): field is string => typeof field === "string" && field.length > 0);
}

/** Session mock store so a save changes the next fetch until the page reloads. */
export function rememberPoolColumns(
  scope: string,
  poolKey: string,
  selectedFields: string[],
): ColumnConfigSaveResponse {
  savedPoolColumns.set(`${scope}:${poolKey}`, [...selectedFields]);
  return { success: true, message: "Column sequence saved" };
}

export function storedPoolColumns(scope: string, poolKey: string, baseline: unknown): string[] {
  const key = `${scope}:${poolKey}`;
  if (savedPoolColumns.has(key)) return savedPoolColumns.get(key) ?? [];
  return readSelectedFields(baseline);
}

export type RoleListRequest = {
  username: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readField(value: unknown): InboxFieldValue | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return value === null ? null : undefined;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapCase(value: unknown, poolName: RolePoolKey, index: number): InboxCase | null {
  if (!isRecord(value)) return null;

  const fields: Record<string, InboxFieldValue> = {};
  for (const [key, field] of Object.entries(value)) {
    const parsed = readField(field);
    if (parsed !== undefined) fields[key] = parsed;
  }

  const applicationNo = readText(fields.applicationNo);
  const taskId = readText(fields.taskId);
  const id = fields.id === undefined || fields.id === null ? "" : String(fields.id);
  return {
    rowId: `${poolName}-${id}-${taskId}-${index}`,
    poolName,
    applicationNo,
    fields,
  };
}

/** Normalizes the role-list response while retaining every primitive pool field for the table. */
export function mapRoleListPayload(value: unknown): InboxData {
  if (!isRecord(value) || !isRecord(value.poolData)) {
    throw new Error("Role-list response is not in the expected format.");
  }

  const poolData: Partial<Record<RolePoolKey, InboxCase[]>> = {};
  for (const poolName of ROLE_POOL_KEYS) {
    if (!Object.hasOwn(value.poolData, poolName)) continue;
    const cases = value.poolData[poolName];
    poolData[poolName] = Array.isArray(cases)
      ? cases.flatMap((item, index) => {
        const inboxCase = mapCase(item, poolName, index);
        return inboxCase ? [inboxCase] : [];
      })
      : [];
  }

  return { userId: readText(value.userId), poolData };
}

export function casesForTask(data: InboxData, taskKey: string): InboxCase[] {
  if (taskKey === "ALL_CASES") {
    return ROLE_POOL_KEYS.flatMap((poolName) => data.poolData[poolName] ?? []);
  }
  return ROLE_POOL_KEYS.includes(taskKey as RolePoolKey)
    ? data.poolData[taskKey as RolePoolKey] ?? []
    : [];
}
