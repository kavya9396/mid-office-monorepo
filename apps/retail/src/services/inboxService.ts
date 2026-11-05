import type {
  InboxCase,
  InboxData,
  InboxFieldValue,
} from "@insurance-poc/common/inbox";

export function createRetailRoleListRequest(): RoleListRequest {
  return {};
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
