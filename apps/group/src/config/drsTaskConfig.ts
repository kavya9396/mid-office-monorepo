export interface GroupDrsTaskConfig {
  roleType: string;
  screenType: string;
  businessType: string;
  /**
   * Stable id for the React screen and the mock DRS file.
   * `roleType` and `screenType` are the DRS request body and can be renamed
   * without moving the page or the mock. Inbox `roleType` must match this `roleType`.
   */
  screenId?: string;
}

export const GROUP_DRS_TASK_CONFIG: Record<string, GroupDrsTaskConfig> = {
  GUW_TASK: {
    roleType: "GUW_TASK",
    screenType: "GUW_INFORMAL",
    businessType: "GROUP",
  },
  DVT_TASK: {
    roleType: "DVT_TASK",
    screenType: "DVT_INFORMAL",
    businessType: "GROUP",
  },
  MMT_TASK: {
    roleType: "MMT_TASK",
    screenType: "MMT",
    businessType: "GROUP",
  },
  REF_CMO_TASK: {
    roleType: "REF_CMO_TASK",
    screenType: "RF_CMO",
    businessType: "GROUP",
    screenId: "refCmo",
  },
  HO_CMO_SPECIAL_TASK: {
    roleType: "HO_CMO_SPECIAL_TASK",
    screenType: "HO_CMO_SPECIAL",
    businessType: "GROUP",
    screenId: "hoCmoSpecial",
  },
  HO_CMO_REFERRAL_TASK: {
    roleType: "HO_CMO_REFERRAL_TASK",
    screenType: "HO_CMO_REFERRAL",
    businessType: "GROUP",
    screenId: "hoCmoReferral",
  },
  VENDOR_CMO_ECG_TASK: {
    roleType: "VENDOR_CMO_ECG_TASK",
    screenType: "VENDOR_CMO_ECG",
    businessType: "GROUP",
    screenId: "vendorCmoEcg",
  },
  VENDOR_CMO_TMT_TASK: {
    roleType: "VENDOR_CMO_TMT_TASK",
    screenType: "VENDOR_CMO_TMT",
    businessType: "GROUP",
    screenId: "vendorCmoTmt",
  },
};

export const DEFAULT_GROUP_DRS_TASK_CONFIG: GroupDrsTaskConfig = {
  roleType: "DVT",
  screenType: "DVT_INFORMAL",
  businessType: "Group",
};

export function getGroupDrsTaskConfig(roleOrTaskType?: string): GroupDrsTaskConfig {
  if (!roleOrTaskType) return DEFAULT_GROUP_DRS_TASK_CONFIG;
  const key = roleOrTaskType.trim().toUpperCase();
  const direct = GROUP_DRS_TASK_CONFIG[key];
  if (direct) return direct;
  const byRoleType = Object.values(GROUP_DRS_TASK_CONFIG).find(
    (config) => config.roleType.trim().toUpperCase() === key,
  );
  return byRoleType ?? DEFAULT_GROUP_DRS_TASK_CONFIG;
}
