export type InboxFieldValue = string | number | boolean | null;

/** Known pool keys for default column hints in `inboxFormat` (sidebar may show any API pool key). */
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
  "MMT_TASK",
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
  /** Pool key from role-list `poolData` (preserves API string). */
  poolName: string;
  applicationNo: string;
  fields: Record<string, InboxFieldValue>;
}

export interface InboxData {
  username: string;
  /** Only pools present on the role-list response; insertion order preserved for “first key”. */
  poolData: Record<string, InboxCase[]>;
}

export type ColumnConfigSaveResponse = {
  success?: boolean;
  message?: string;
};

/** Normalized GET /pool-columns (and POST save echo) body. */
export type PoolColumnsWire = {
  username: string;
  poolKey: string;
  selectedFields: string[];
};

const savedPoolColumns = new Map<string, string[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSelectedFields(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const selected = Array.isArray(value.selectedFields) ? value.selectedFields : value.availableFields;
  if (!Array.isArray(selected)) return [];
  return selected.filter((field): field is string => typeof field === "string" && field.length > 0);
}

/** Parses pool-columns API JSON; invalid shapes yield empty selectedFields. */
export function parsePoolColumnsResponse(value: unknown): PoolColumnsWire {
  if (!isRecord(value)) {
    return { username: "", poolKey: "", selectedFields: [] };
  }
  return {
    username: typeof value.username === "string" ? value.username.trim() : "",
    poolKey: typeof value.poolKey === "string" ? value.poolKey.trim() : "",
    selectedFields: readSelectedFields(value),
  };
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

/** Role-list uses session Bearer only; request body is empty. */
export type RoleListRequest = Record<string, never>;

function readField(value: unknown): InboxFieldValue | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return value === null ? null : undefined;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapCase(value: unknown, poolName: string, index: number): InboxCase | null {
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

/**
 * Normalizes the role-list response while retaining every primitive pool field for the table.
 * Pool keys and key order match the API object exactly.
 */
export function mapRoleListPayload(value: unknown): InboxData {
  if (!isRecord(value) || !isRecord(value.poolData)) {
    throw new Error("Role-list response is not in the expected format.");
  }

  const poolData: Record<string, InboxCase[]> = {};
  for (const poolName of Object.keys(value.poolData)) {
    const cases = value.poolData[poolName];
    poolData[poolName] = Array.isArray(cases)
      ? cases.flatMap((item, index) => {
        const inboxCase = mapCase(item, poolName, index);
        return inboxCase ? [inboxCase] : [];
      })
      : [];
  }

  const username =
    readText(value.username).length > 0 ? readText(value.username) : readText(value.userId);

  return { username, poolData };
}

/** Pool keys in API response order (sidebar). */
export function poolKeysInOrder(data: InboxData): string[] {
  return Object.keys(data.poolData);
}

export function firstPoolKey(data: InboxData): string | null {
  const keys = poolKeysInOrder(data);
  return keys.length > 0 ? keys[0]! : null;
}

export function casesForTask(data: InboxData, taskKey: string): InboxCase[] {
  if (taskKey === "ALL_CASES") {
    return poolKeysInOrder(data).flatMap((poolName) => data.poolData[poolName] ?? []);
  }
  return data.poolData[taskKey] ?? [];
}

export function hasPool(data: InboxData, poolKey: string): boolean {
  return Object.hasOwn(data.poolData, poolKey);
}

/** Union of field keys across rows for one pool (for configure-columns “available”). */
export function fieldKeysForPool(data: InboxData, poolKey: string): string[] {
  const cases = data.poolData[poolKey];
  if (!cases || cases.length === 0) return [];
  const keys = new Set<string>();
  for (const item of cases) {
    for (const key of Object.keys(item.fields)) {
      keys.add(key);
    }
  }
  return [...keys];
}
