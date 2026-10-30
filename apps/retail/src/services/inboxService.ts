import type {
  InboxCase,
  InboxData,
  InboxFieldValue,
} from "@insurance-poc/common/inbox";

export const RETAIL_INBOX_PATH = "/inbox";

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

function mapRetailCase(value: unknown, poolName: string, index: number): InboxCase | null {
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

export function mapRetailInboxPayload(value: unknown): InboxData {
  if (!isRecord(value) || !isRecord(value.poolData)) {
    throw new Error("Retail inbox response is not in the expected format.");
  }

  const poolData: Record<string, InboxCase[]> = {};
  for (const [poolName, cases] of Object.entries(value.poolData)) {
    if (!Array.isArray(cases)) continue;
    poolData[poolName] = cases.flatMap((item, index) => {
      const inboxCase = mapRetailCase(item, poolName, index);
      return inboxCase ? [inboxCase] : [];
    });
  }

  return {
    userId: readText(value.userId),
    poolData,
  };
}

