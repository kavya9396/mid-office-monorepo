/* ------------------------------------------------------------------ */
/* Reinsurer Referral Sheet - form model, mapper and request builder   */
/* Source: the reinsurer-referral API response (header, previous        */
/* policies, LA / proposer, referralSheet). Only fields the response    */
/* carries are modelled.                                                */
/* ------------------------------------------------------------------ */

export interface ReferralSheetPartyForm {
  name: string;
  partyId: string;
}

export interface ReferralSheetPolicyRow {
  policyOrApplicationId: string;
  name: string;
  product: string;
  sumAssured: string;
  premium: string;
  proposalStatus: string;
  fundValue: string;
  rcd: string;
  paidToDate: string;
}

export interface ReferralSheetForm {
  applicationNumber: string;
  scope: string;
  partyId: string;
  uwName: string;
  product: string;
  reinsuranceRefNo: string;
  currentApplicationSa: string;
  currentPremium: string;
  totalSumAssured: string;
  reasonForReferral: string;
  natureOfDuty: string;
  applicationType: string;
  lifeAssured: ReferralSheetPartyForm;
  proposer: ReferralSheetPartyForm;
  previousPolicies: ReferralSheetPolicyRow[];
  socialCheck: string;
  financials: string;
  medical: string;
  caseFacts: string;
  ourRecommendation: string;
}

/** Request body of the referral-sheet save API: the whole form, in the shape of the reinsurer-referral response. */
export interface ReferralSheetRequest {
  applicationNumber: string;
  scope: string;
  partyId: string;
  uwName: string;
  product: string;
  currentApplicationSa: string;
  currentPremium: string;
  totalSumAssured: string;
  natureOfDuty: string;
  applicationType: string;
  reinsuranceRefNo: string;
  reasonForReferral: string;
  lifeAssured: ReferralSheetPartyForm;
  proposer: ReferralSheetPartyForm;
  previousPolicies: ReferralSheetPolicyRow[];
  referralSheet: {
    socialCheck: string;
    financials: string;
    medical: string;
    caseFacts: string;
    ourRecommendation: string;
    reinsuranceRefNo: string;
    reasonForReferral: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function mapParty(value: unknown): ReferralSheetPartyForm {
  const record = isRecord(value) ? value : {};
  return { name: text(record.name), partyId: text(record.partyId) };
}

/** Maps the reinsurer-referral response to the editable sheet; `null` when the payload carries no application. */
export function mapReferralSheetForm(payload: unknown): ReferralSheetForm | null {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(root)) return null;
  const applicationNumber = text(root.applicationNumber);
  if (!applicationNumber) return null;
  const sheet = isRecord(root.referralSheet) ? root.referralSheet : {};
  const policies = Array.isArray(root.previousPolicies) ? root.previousPolicies : [];

  return {
    applicationNumber,
    scope: text(root.scope),
    partyId: text(root.partyId),
    uwName: text(root.uwName),
    product: text(root.product),
    reinsuranceRefNo: text(sheet.reinsuranceRefNo) || text(root.reinsuranceRefNo),
    currentApplicationSa: text(root.currentApplicationSa),
    currentPremium: text(root.currentPremium),
    totalSumAssured: text(root.totalSumAssured),
    reasonForReferral: text(sheet.reasonForReferral) || text(root.reasonForReferral),
    natureOfDuty: text(root.natureOfDuty),
    applicationType: text(root.applicationType),
    lifeAssured: mapParty(root.lifeAssured),
    proposer: mapParty(root.proposer),
    previousPolicies: policies.flatMap((row): ReferralSheetPolicyRow[] => {
      if (!isRecord(row)) return [];
      return [
        {
          policyOrApplicationId: text(row.policyOrApplicationId),
          name: text(row.name),
          product: text(row.product),
          sumAssured: text(row.sumAssured),
          premium: text(row.premium),
          proposalStatus: text(row.proposalStatus),
          fundValue: text(row.fundValue),
          rcd: text(row.rcd),
          paidToDate: text(row.paidToDate),
        },
      ];
    }),
    socialCheck: text(sheet.socialCheck) || text(root.socialCheck),
    financials: text(sheet.financials) || text(root.financialsReferral) || text(root.financialsOriginal),
    medical: text(sheet.medical) || text(root.medicalReferral) || text(root.medicalOriginal),
    caseFacts: text(sheet.caseFacts) || text(root.caseFacts),
    ourRecommendation: text(sheet.ourRecommendation) || text(root.ourRecommendation),
  };
}

/** Builds the save request from the (edited) form: the whole form, nothing dropped. */
export function toReferralSheetRequest(form: ReferralSheetForm): ReferralSheetRequest {
  return {
    applicationNumber: form.applicationNumber,
    scope: form.scope,
    partyId: form.partyId,
    uwName: form.uwName,
    product: form.product,
    currentApplicationSa: form.currentApplicationSa,
    currentPremium: form.currentPremium,
    totalSumAssured: form.totalSumAssured,
    natureOfDuty: form.natureOfDuty,
    applicationType: form.applicationType,
    reinsuranceRefNo: form.reinsuranceRefNo,
    reasonForReferral: form.reasonForReferral,
    lifeAssured: { ...form.lifeAssured },
    proposer: { ...form.proposer },
    previousPolicies: form.previousPolicies.map((row) => ({ ...row })),
    referralSheet: {
      socialCheck: form.socialCheck,
      financials: form.financials,
      medical: form.medical,
      caseFacts: form.caseFacts,
      ourRecommendation: form.ourRecommendation,
      reinsuranceRefNo: form.reinsuranceRefNo,
      reasonForReferral: form.reasonForReferral,
    },
  };
}
