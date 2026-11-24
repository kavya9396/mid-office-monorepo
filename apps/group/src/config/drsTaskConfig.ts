export interface GroupDrsTaskConfig {
  roleType: string;
  screenType: string;
  businessType: string;
}

const HOD_TASK_CONFIG: GroupDrsTaskConfig = {
  roleType: "HOD_TASK",
  screenType: "GUW_INFORMAL",
  businessType: "GROUP",
};

const SR_UW_TASK_CONFIG: GroupDrsTaskConfig = {
  roleType: "SR_UW_TASK",
  screenType: "GUW_INFORMAL",
  businessType: "GROUP",
};

export const GROUP_DRS_TASK_CONFIG: Record<string, GroupDrsTaskConfig> = {
  GUW_TASK: {
    roleType: "GUW_TASK",
    screenType: "GUW_INFORMAL",
    businessType: "GROUP",
  },
  // HOD / Sr UW return the same DRS response as GUW.
  HOD_TASK: HOD_TASK_CONFIG,
  HOD: HOD_TASK_CONFIG,
  SR_UW_TASK: SR_UW_TASK_CONFIG,
  SR_UW: SR_UW_TASK_CONFIG,
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
  GROUP_DATA_ENTRY_NMR_TASK: {
    roleType: "GROUP_DATA_ENTRY_NMR_TASK",
    screenType: "CPT_NMR",
    businessType: "GROUP",
  },
  GROUP_DATA_ENTRY_MR_TASK: {
    roleType: "GROUP_DATA_ENTRY_MR_TASK",
    screenType: "CPT_MR",
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
