export interface RetailDrsTaskConfig {
  roleType: string;
  screenType: string;
  businessType: string;
}

export const RETAIL_DRS_TASK_CONFIG: Record<string, RetailDrsTaskConfig> = {
  CVT_TASK: {
    roleType: "CVT_TASK",
    screenType: "CVT",
    businessType: "RETAIL",
  },
  CPT_DATA_ENTRY_NMR_TASK: {
    roleType: "CPT_DATA_ENTRY_NMR_TASK",
    screenType: "CPT_NMR",
    businessType: "RETAIL",
  },
  CPT_DATA_ENTRY_MR_TASK: {
    roleType: "CPT_DATA_ENTRY_MR_TASK",
    screenType: "CPT_MR",
    businessType: "RETAIL",
  },
};

export const DEFAULT_RETAIL_DRS_TASK_CONFIG: RetailDrsTaskConfig = RETAIL_DRS_TASK_CONFIG.CVT_TASK;

export function getRetailDrsTaskConfig(roleOrTaskType?: string): RetailDrsTaskConfig {
  if (!roleOrTaskType) return DEFAULT_RETAIL_DRS_TASK_CONFIG;
  const key = roleOrTaskType.trim().toUpperCase();
  return RETAIL_DRS_TASK_CONFIG[key] ?? DEFAULT_RETAIL_DRS_TASK_CONFIG;
}
