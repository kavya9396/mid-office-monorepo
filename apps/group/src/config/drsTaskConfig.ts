export interface GroupDrsTaskConfig {
  roleType: string;
  screenType: string;
  businessType: string;
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
    screenType: "REF_CMO",
    businessType: "GROUP",
  },
  HO_CMO_TASK: {
    roleType: "HO_CMO_TASK",
    screenType: "HO_CMO",
    businessType: "GROUP",
  },
  VENDOR_CMO_TASK: {
    roleType: "VENDOR_CMO_TASK",
    screenType: "VENDOR_CMO",
    businessType: "GROUP",
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
  return GROUP_DRS_TASK_CONFIG[key] ?? DEFAULT_GROUP_DRS_TASK_CONFIG;
}
