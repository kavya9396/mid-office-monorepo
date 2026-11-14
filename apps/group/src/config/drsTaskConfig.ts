export interface GroupDrsTaskConfig {
  roleType: string;
  screenType: string;
  businessType: string;
}

export const GROUP_DRS_TASK_CONFIG: Record<string, GroupDrsTaskConfig> = {
  DVT: {
    roleType: "DVT",
    screenType: "DVT_INFORMAL",
    businessType: "Group",
  },
  "DVT TASK": {
    roleType: "DVT",
    screenType: "DVT_INFORMAL",
    businessType: "Group",
  },
  DVT_POOL: {
    roleType: "DVT",
    screenType: "DVT_INFORMAL",
    businessType: "Group",
  },
  DVT_INFORMAL: {
    roleType: "DVT",
    screenType: "DVT_INFORMAL",
    businessType: "Group",
  },
  GUW: {
    roleType: "GUW",
    screenType: "GUW_INFORMAL",
    businessType: "Group",
  },
  GUW_TASK: {
    roleType: "GUW",
    screenType: "GUW_INFORMAL",
    businessType: "Group",
  },
  "GUW TASK": {
    roleType: "GUW",
    screenType: "GUW_INFORMAL",
    businessType: "Group",
  },
  DVT_TASK: {
    roleType: "DVT",
    screenType: "DVT_INFORMAL",
    businessType: "Group",
  },
  GUW_FORMAL: {
    roleType: "GUW",
    screenType: "GUW_FORMAL",
    businessType: "Group",
  },
  "MMT TASK": {
    roleType: "MMT",
    screenType: "MMT_TASK",
    businessType: "Group",
  },
  MMT_TASK: {
    roleType: "MMT",
    screenType: "MMT_TASK",
    businessType: "Group",
  },
  AMR_NON_MEDICAL: {
    roleType: "AMR",
    screenType: "AMR_NON_MEDICAL",
    businessType: "Group",
  },
  MEDICAL_TPA_ERROR: {
    roleType: "AMR",
    screenType: "MEDICAL_TPA_ERROR",
    businessType: "Group",
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
