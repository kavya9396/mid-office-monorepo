/** `misc` master list `type` values for Medical TPA DRS dropdowns (post-login master data). */
export const TPA_MISC_MASTER_TYPE = {
  SERVICE_PROVIDER_NAME: "MMT_SER_PRONM",
  REALIGN_REASON: "MMT_REALIGN_RSN",
} as const;

export type TpaMiscMasterType =
  (typeof TPA_MISC_MASTER_TYPE)[keyof typeof TPA_MISC_MASTER_TYPE];
