/**
 * Master `types` query values requested from the master-data service.
 * Add or remove entries here; URL query params are built from this list.
 */
export const MASTER_DATA_TYPES = [
  "gender",
  "resident_status",
  "nationality",
  "marital_status",
  "education",
  "occupation",
  "industry_type",
  "organization_type",
  "id_proof_type",
  "impairement_type",
  "insurance_repository",
  "product",
  "rider",
  "annuity_option",
  "fund",
  "portfolio_strategy",
  "payment_mode",
  "source_of_fund",
  "proposal_status",
  "country",
  "state",
  "policy_decision",
  "agent_mst",
  "health_question",
  "requirement_mst",
  "bre",
  "ntu_retail",
  "pre_post_insurance",
  "uw_decision",
  "uw_decision_mapping",
  "app_status",
  "misc",
  "reason",
  "sales_channel",
] as const;

export type MasterDataType = (typeof MASTER_DATA_TYPES)[number];
