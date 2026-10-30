import type { DetailAttribute } from "@insurance-poc/common/detail-card";
import guwDrsMock from "../../../../mock/drs/guw-informal-drs.json";

export interface GuwBannerLine {
  text: string;
  emphasis?: boolean;
}

/** Matches the DVT CardDetail shape — API returns pre-shaped {name, value} arrays. */
export interface GuwRiskCard {
  type: string;
  title: string;
  accentColor: string;
  valueColor: string;
  attributes: DetailAttribute[];
  expandedAttributes: DetailAttribute[];
}

export interface GuwSdtRow {
  financialDecision: string;
  medicalDecision: string;
  grievanceHistoryCount: number;
  claimAuditCount: number;
  uwGuidelinesCount: number;
}

export interface GuwBreStatusChip {
  label: string;
  count: number;
}

export interface GuwBreData {
  breCode: string;
  initialDiscrepancy: string[];
  finalDiscrepancy: string[];
  statusChips: GuwBreStatusChip[];
}

export interface GuwSubmittedField {
  label: string;
  value: string;
  wide?: boolean;
}

export interface GuwSubmittedCounterOfferRow {
  id: string;
  productName: string;
  isRider: boolean;
  type: string;
  bstdCode: string;
  sa: string;
  changedSa: string;
  pt: string;
  changedPt: string;
  loadingClass: string;
  loadingReason: string;
}

export interface GuwSubmittedGuideline {
  reason: string;
  remark: string;
  systemAction: string;
  justificationReason: string;
  justificationRemark: string;
}

/** Previously submitted Case UW decision, shown read-only via the eye icon. */
export interface GuwSubmittedDecision {
  decisionCode: string;
  remarks: string;
  fields: GuwSubmittedField[];
  reconsiderationFields: GuwSubmittedField[];
  counterOfferRows: GuwSubmittedCounterOfferRow[];
  showBstdColumn: boolean;
  reinsurerRows: { code: string; systemName: string; uwName: string }[];
  documentRows: { name: string; assigned: boolean[] }[];
  guidelines: GuwSubmittedGuideline[];
}

export interface GuwUwData {
  breOverallDecision: string;
  breOverallRemarks: string;
  submittedDecision?: GuwSubmittedDecision;
}

export interface GuwDrsRecord {
  applicationNo: string;
  applicantName: string;
  applicationLabel: string;
  lines: GuwBannerLine[];
  riskCards: GuwRiskCard[];
  sdtRow: GuwSdtRow;
  breData: GuwBreData;
  uwData?: GuwUwData;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchGuwDrs(
  applicationNo: string,
): Promise<GuwDrsRecord | null> {
  await wait(250);
  const record = (
    guwDrsMock.records as unknown as GuwDrsRecord[]
  ).find((item) => item.applicationNo === applicationNo);
  return record ?? null;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export const MASTER_DECISION_OPTIONS: DropdownOption[] = [
  { value: "STD", label: "Standard" },
  { value: "BOR_STD", label: "Borderline Standard" },
  { value: "REJ", label: "Reject" },
  { value: "DC", label: "Decline" },
  { value: "POSTP", label: "Postpone" },
  { value: "CO", label: "Counter Offer" },
  { value: "EP", label: "Extra Premium" },
  { value: "HOLD", label: "Hold" },
  { value: "REFERRAL", label: "Refer To" },
  { value: "AMR", label: "Raise Requirement" },
  { value: "APPROVER", label: "Refer to Approver" },
];

export const MASTER_REFERRAL_TYPE_OPTIONS: DropdownOption[] = [
  { value: "REF_IT", label: "IT" },
  { value: "REF_REINS", label: "Reinsurer" },
  { value: "REF_CMO", label: "HO CMO" },
  { value: "REF_CMO_LOCAL", label: "CMO" },
  { value: "REF_RISK", label: "Risk" },
  { value: "REF_ACU", label: "Accuity" },
  { value: "REF_CUW_CLM", label: "CUW Claim" },
];

export const MASTER_REFERRAL_REASON_OPTIONS: Record<string, string[]> = {
  REF_IT: ["System issue", "Data correction", "Other"],
  REF_REINS: ["High sum assured", "Medical risk", "Other"],
  REF_CMO: ["Medical review", "Specialist opinion", "Other"],
  REF_CMO_LOCAL: ["Medical review", "Specialist opinion", "Other"],
  REF_RISK: ["Risk assessment", "Policy exception", "Other"],
  REF_ACU: ["Screening review", "Match review", "Other"],
  REF_CUW_CLM: ["Claim history", "Investigation", "Other"],
};

export const MASTER_LOADING_CLASS_OPTIONS: Record<string, string[]> = {
  "Medical Loading": ["ML001 - Substandard", "ML002 - Rated Up", "ML003 - Extra Mortality", "ML004 - Occupational Hazard"],
  "FE Loading": ["FE001 - Financial Extra", "FE002 - Income Mismatch", "FE003 - High SA"],
  "Smoker Loading": ["SL001 - Smoker", "SL002 - Tobacco User", "SL003 - Ex-Smoker"],
};

export const MASTER_LOADING_REASON_OPTIONS: Record<string, string[]> = {
  "Medical Loading": ["Medical history", "BMI deviation", "Pre-existing condition", "Hazardous occupation"],
  "FE Loading": ["Income proof inadequate", "SA exceeds eligibility", "Financial inconsistency"],
  "Smoker Loading": ["Active smoker", "Tobacco chewer", "Recent cessation"],
};

export const MASTER_REINSURER_UW_OPTIONS: string[] = ["Swiss Re", "Munich Re", "Scor Re", "Gen Re", "RGA Re", "Hannover Re"];
export const MASTER_REFERRAL_DOCUMENTS: string[] = ["Application Form", "PhotoId Proof", "Address Proof"];

export async function fetchCaseDecisionOptions(): Promise<DropdownOption[]> {
  await wait(100);
  return MASTER_DECISION_OPTIONS;
}

export async function fetchReferralTypeOptions(): Promise<DropdownOption[]> {
  await wait(100);
  return MASTER_REFERRAL_TYPE_OPTIONS;
}

export async function fetchReferralReasonOptions(): Promise<Record<string, string[]>> {
  await wait(100);
  return MASTER_REFERRAL_REASON_OPTIONS;
}

export async function fetchLoadingClassOptions(): Promise<Record<string, string[]>> {
  await wait(100);
  return MASTER_LOADING_CLASS_OPTIONS;
}

export async function fetchLoadingReasonOptions(): Promise<Record<string, string[]>> {
  await wait(100);
  return MASTER_LOADING_REASON_OPTIONS;
}

export async function fetchReinsurerUwOptions(): Promise<string[]> {
  await wait(100);
  return MASTER_REINSURER_UW_OPTIONS;
}

export async function fetchReferralDocuments(): Promise<string[]> {
  await wait(100);
  return MASTER_REFERRAL_DOCUMENTS;
}
