export type InboxFieldValue = string | number | boolean | null;

export interface InboxCase {
  rowId: string;
  poolName: string;
  applicationNo: string;
  fields: Record<string, InboxFieldValue>;
}

export interface InboxData {
  userId: string;
  poolData: Record<string, InboxCase[]>;
}

export function casesForTask(data: InboxData, taskKey: string): InboxCase[] {
  if (taskKey === "ALL_CASES") {
    return Object.entries(data.poolData).flatMap(([poolName, cases]) =>
      cases.map((item) => ({ ...item, poolName })),
    );
  }
  return data.poolData[taskKey] ?? [];
}
