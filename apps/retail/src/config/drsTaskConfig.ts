export interface RetailDrsTaskConfig {
  roleType: string;
  screenType: string;
  businessType: string;
}

const HOD_TASK_CONFIG: RetailDrsTaskConfig = {
  roleType: "HOD_TASK",
  screenType: "CUW",
  businessType: "RETAIL",
};

const SR_UW_TASK_CONFIG: RetailDrsTaskConfig = {
  roleType: "SR_UW_TASK",
  screenType: "CUW",
  businessType: "RETAIL",
};

export const RETAIL_DRS_TASK_CONFIG: Record<string, RetailDrsTaskConfig> = {
  CUW_TASK: {
    roleType: "CUW_TASK",
    screenType: "CUW",
    businessType: "RETAIL",
  },
  // HOD / Sr UW return the same DRS response as CUW.
  HOD_TASK: HOD_TASK_CONFIG,
  HOD: HOD_TASK_CONFIG,
  SR_UW_TASK: SR_UW_TASK_CONFIG,
  SR_UW: SR_UW_TASK_CONFIG,
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
  PIVV_TASK: {
    roleType: "PIVV_TASK",
    screenType: "PIVV",
    businessType: "RETAIL",
  },
  MMT_TASK: {
    roleType: "MMT_TASK",
    screenType: "MMT",
    businessType: "RETAIL",
  },
  PRE_ISSUANCE_CVT_TASK: {
    roleType: "PRE_ISSUANCE_CVT_TASK",
    screenType: "PRE_ISSUANCE_CVT",
    businessType: "RETAIL,
  },
  // Medical TPA tasks open the TPA screen, which loads its own record (no DRS task config needed).
  AMR_NON_MEDICAL: {
    roleType: "AMR_NON_MEDICAL",
    screenType: "TPA",
    businessType: "RETAIL",
  },
  MEDICAL_TPA_ERROR: {
    roleType: "MEDICAL_TPA_ERROR",
    screenType: "TPA",
    businessType: "RETAIL",
  },
};

export const DEFAULT_RETAIL_DRS_TASK_CONFIG: RetailDrsTaskConfig = RETAIL_DRS_TASK_CONFIG.CVT_TASK;

/** Config of the `roleType` the role-list API returned; `undefined` when that role has no config entry. */
export function findRetailDrsTaskConfig(roleType?: string): RetailDrsTaskConfig | undefined {
  const key = roleType?.trim().toUpperCase() ?? "";
  return key === "" ? undefined : RETAIL_DRS_TASK_CONFIG[key];
}

export function getRetailDrsTaskConfig(roleOrTaskType?: string): RetailDrsTaskConfig {
  if (!roleOrTaskType) return DEFAULT_RETAIL_DRS_TASK_CONFIG;
  const key = roleOrTaskType.trim().toUpperCase();
  return RETAIL_DRS_TASK_CONFIG[key] ?? DEFAULT_RETAIL_DRS_TASK_CONFIG;
}
