import type {
  InboxCase,
  InboxData,
  InboxFieldValue,
} from "@insurance-poc/common/inbox";

export function createGroupRoleListRequest(): RoleListRequest {
  return {};
}

export function mapGroupInboxPayload(value: unknown): InboxData {
  if (!isRecord(value) || !isRecord(value.poolData)) {
    throw new Error("Group inbox response is not in the expected format.");
  }

  const poolData: Record<string, InboxCase[]> = {};
  for (const [poolName, cases] of Object.entries(value.poolData)) {
    if (!Array.isArray(cases)) continue;
    poolData[poolName] = cases.flatMap((item, index) => {
      const inboxCase = mapGroupCase(item, poolName, index);
      return inboxCase ? [inboxCase] : [];
    });
  }

  return {
    userId: readText(value.userId),
    poolData,
  };
}
