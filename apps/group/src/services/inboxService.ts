import {
  mapRoleListPayload,
  type InboxCase,
  type InboxData,
  type RoleListRequest,
} from "@insurance-poc/common/inbox";

export function createGroupRoleListRequest(): RoleListRequest {
  return {};
}

/** Sidebar name by `role`. The role-list `roleType` on the row is left as returned. */
const SIDEBAR_TASK_BY_ROLE: Record<string, Record<string, string>> = {
  VENDOR_CMO_TASK: {
    GROUP_VENDORCMOECG_USER: "VENDOR_CMO_ECG_TASK",
    GROUP_VENDORCMOTMT_USER: "VENDOR_CMO_TMT_TASK",
  },
  HO_CMO_TASK: {
    GROUP_HOCMOSPECIAL_USER: "HO_CMO_SPECIAL_TASK",
    GROUP_HOCMOREF_USER: "HO_CMO_REFERRAL_TASK",
  },
};

function sidebarTask(poolName: string, item: InboxCase): string | undefined {
  const role = item.fields.role;
  if (typeof role !== "string") return undefined;
  return SIDEBAR_TASK_BY_ROLE[poolName]?.[role.trim().toUpperCase()];
}

/** Split HO CMO and Vendor CMO rows into sidebar tasks by `role`. Other pools are unchanged. */
function splitCmoPools(data: InboxData): InboxData {
  const poolData: InboxData["poolData"] = {};
  for (const [poolName, cases] of Object.entries(data.poolData)) {
    if (!SIDEBAR_TASK_BY_ROLE[poolName]) {
      poolData[poolName] = cases;
      continue;
    }
    for (const item of cases) {
      const taskKey = sidebarTask(poolName, item) ?? poolName;
      const moved = taskKey === poolName ? item : { ...item, poolName: taskKey };
      const existing = poolData[taskKey];
      poolData[taskKey] = existing ? [...existing, moved] : [moved];
    }
  }
  return { ...data, poolData };
}

export function mapGroupInboxPayload(value: unknown): InboxData {
  return splitCmoPools(mapRoleListPayload(value));
}
