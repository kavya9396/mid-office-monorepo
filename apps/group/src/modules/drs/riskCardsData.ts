import type { RiskCardData, RiskCardField } from "@insurance-poc/common/risk-cards";

type Source = Record<string, unknown>;
type FieldDef = readonly [key: string, label: string];

function isRecord(value: unknown): value is Source {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Same display rule as the prototype's displayValue().
function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function pick(source: Source, defs: readonly FieldDef[]): RiskCardField[] {
  return defs.map(([key, label]) => ({ name: label, value: toText(source[key]) }));
}

// Field lists copied from the CUW DRS prototype (financialRiskFields / medicalRiskFields / otherRiskFields).
const FINANCIAL_CARD: readonly FieldDef[] = [
  ["breFinancialDecision", "Financial Decision"],
  ["financialEligibility", "Financial Eligibility"],
  ["derivedIncome", "Derived Income"],
  ["verifiedIncome", "Verified Income"],
  ["biuFinancialStatus", "BIU Financial Status"],
];
const FINANCIAL_DETAILS: readonly FieldDef[] = [
  ["breFinancialDecision", "Financial Decision"],
  ["financialEligibility", "Financial Eligibility"],
  ["derivedIncome", "Derived Income"],
  ["verifiedIncome", "Verified Income"],
  ["counterOfferValue", "Counter Offer Value"],
  ["additionalSA", "Additional SA"],
  ["biuFinancialStatus", "BIU Financial Status"],
  ["finalBureauIncome", "Final Bureau Income"],
  ["reinsurerCase", "Reinsurer Case"],
];
const FINANCIAL_REMARKS: readonly FieldDef[] = [["financialRemark", "Financial Remark"]];

const MEDICAL_CARD: readonly FieldDef[] = [
  ["brePhysicalMedicalDecision", "Physical Medical Decision"],
  ["munichReMedicalDecision", "MunichRe Medical Decision"],
  ["biuMedicalStatus", "BIU Medical Status"],
];
const MEDICAL_DETAILS: readonly FieldDef[] = [
  ["brePhysicalMedicalDecision", "Physical Medical Decision"],
  ["breTeleVideoMerDecision", "Tele/Video MER Decision"],
  ["munichReMedicalDecision", "MunichRe Medical Decision"],
  ["munichReRating", "MunichRe Rating"],
  ["biuMedicalStatus", "BIU Medical Status"],
];
const MEDICAL_REMARKS: readonly FieldDef[] = [
  ["breTeleVideoMerRemark", "Tele/Video MER Remark"],
  ["brePhysicalMedicalRemark", "Physical Medical Remark"],
];

const OTHER_CARD: readonly FieldDef[] = [
  ["drcResponse", "DRC Response"],
  ["criminalQuestionResponseLA", "Criminal Question Response LA"],
  ["pepQuestionResponseLA", "PEP Question Response LA"],
];
const OTHER_DETAILS: readonly FieldDef[] = [
  ["ptlrResponse", "PTLR Response"],
  ["drcResponse", "DRC Response"],
  ["adverseIIB", "Adverse IIB"],
  ["criminalQuestionResponseLA", "Criminal Question Response LA"],
  ["pepQuestionResponseLA", "PEP Question Response LA"],
  ["criminalQuestionResponsePR", "Criminal Question Response PR"],
  ["pepQuestionResponsePR", "PEP Question Response PR"],
  ["previousPolicySubstandard", "Previous Policy Substandard"],
  ["avocationRelatedDisclosure", "Avocation Related Disclosure"],
  ["healthQuestionPositive", "Health Question Positive"],
  ["employmentInRiskyIndustry", "Employment In Risky Industry"],
  ["fatfOfacCountryLogin", "FATF/OFAC Country Login"],
  ["hazardousOccupation", "Hazardous Occupation"],
  ["eddFlag", "EDD Flag"],
  ["claimRiskIndicator", "Claim Risk Indicator"],
  ["faceMatchScore", "Face Match Score"],
  ["tobacco", "Tobacco"],
  ["narcotics", "Narcotics"],
  ["thirdPartyPayment", "Third Party Payment"],
  ["pbRiskResponse", "Policy Bazar Risk Response"],
  ["adverseACRrange", "Adverse ACR"],
  ["acceptable", "Distance < acceptable range"],
  ["adverseOID", "Adverse App OID"],
  ["nagativePincode", "Negative Pincode"],
  ["nomineeOtherThanBloodRelative", "Nominee Other than Blood relative"],
];

/** Returns the first riskAnalytics entry found in the DRS `summary` section. */
function findRiskAnalytics(summary: unknown): Source | null {
  if (!Array.isArray(summary)) return null;
  for (const member of summary) {
    if (!isRecord(member) || !Array.isArray(member.riskAnalytics)) continue;
    const first: unknown = member.riskAnalytics[0];
    if (isRecord(first)) return first;
  }
  return null;
}

/**
 * Builds the Financial / Medical / Risk Parameters cards from `summary[].riskAnalytics`
 * (financialRisk, medicalRisk, otherRisk). A block is skipped when it is absent or its
 * flag (isFinancial / isMedical / isOthers) is explicitly false.
 */
export function mapRiskCards(summary: unknown): RiskCardData[] {
  const analytics = findRiskAnalytics(summary);
  if (!analytics) return [];

  const cards: RiskCardData[] = [];
  const { financialRisk, medicalRisk, otherRisk } = analytics;

  if (isRecord(financialRisk) && financialRisk.isFinancial !== false) {
    cards.push({
      id: "financial",
      title: "Financial",
      tone: "danger",
      viewLabel: "View Financial",
      fields: pick(financialRisk, FINANCIAL_CARD),
      details: {
        title: "Financial Details",
        fields: pick(financialRisk, FINANCIAL_DETAILS),
        remarks: pick(financialRisk, FINANCIAL_REMARKS),
      },
    });
  }

  if (isRecord(medicalRisk) && medicalRisk.isMedical !== false) {
    cards.push({
      id: "medical",
      title: "Medical",
      tone: "success",
      viewLabel: "View Medical",
      fields: pick(medicalRisk, MEDICAL_CARD),
      details: {
        title: "Medical Details",
        fields: pick(medicalRisk, MEDICAL_DETAILS),
        remarks: pick(medicalRisk, MEDICAL_REMARKS),
      },
    });
  }

  if (isRecord(otherRisk) && otherRisk.isOthers !== false) {
    cards.push({
      id: "other",
      title: "Risk Parameters",
      tone: "danger",
      fields: pick(otherRisk, OTHER_CARD),
      details: {
        title: "Other Risk Details",
        fields: pick(otherRisk, OTHER_DETAILS),
      },
    });
  }

  return cards;
}
