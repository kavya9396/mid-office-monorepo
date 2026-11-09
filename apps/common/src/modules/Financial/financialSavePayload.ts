import type { FinancialSection } from "./financial.config";

/**
 * Top-level Save API Request payload structure.
 */
export interface FinancialSaveRequest<TDocKey extends string = string, TDocPayload = unknown> {
  applicationNumber: string;
  partyId: string;
  createdBy: string;
  updatedBy: string;
  documents: {
    [K in TDocKey]?: TDocPayload;
  };
}

/**
 * Save API response envelope. `message` is shown to the user as-is.
 */
export interface FinancialSaveResponse {
  response_code: number;
  error: boolean;
  message: string;
  data?: unknown;
}

/* ------------------------------------------------------------------ */
/* Individual document save payload interfaces                        */
/* ------------------------------------------------------------------ */

export interface AppointmentLetterSavePayload {
  apptDtlId?: number | null;
  grossSalaryPa: number | null;
  companyName: string | null;
  partyName: string | null;
  joiningDt: string | null;
}

export interface CommissionStatementMonthEntry {
  periodMonth: number;
  commissionDtlId?: number | null;
  commissionAmount: number | null;
}

export interface CommissionStatementSavePayload {
  months: CommissionStatementMonthEntry[];
}

export interface ComputationOfIncomeYearEntry {
  assessmentYear: string;
  metricIds?: {
    incomeFromSalary?: number;
    incomeFromBusiness?: number;
    shortTermCapitalGains?: number;
    incomeFromOtherSources?: number;
    agriculturalIncome?: number;
    incomeFromHouseProperty?: number;
    exemptIncome?: number;
  };
  incomeFromSalary: number | null;
  incomeFromBusiness: number | null;
  shortTermCapitalGains: number | null;
  incomeFromOtherSources: number | null;
  agriculturalIncome: number | null;
  incomeFromHouseProperty: number | null;
  exemptIncome: number | null;
}

export interface ComputationOfIncomeSavePayload {
  years: ComputationOfIncomeYearEntry[];
}

export interface CreditCardSavePayload {
  ccDtlId?: number | null;
  nameMatchInd: string | null;
  isDefaulter: string | null;
  cardType: string | null;
  creditLimit: number | null;
  incomeEarned: number | null;
  pointsEarned: number | null;
}

export interface FixedDepositReceiptSavePayload {
  fdDtlId?: number | null;
  nameMatchInd: string | null;
  isMatured: string | null;
  amountInvested: number | null;
  incomeEarned: number | null;
}

export interface Form16YearEntry {
  assessmentYear: string;
  form16DtlId?: number | null;
  grossSalaryPa: number | null;
  companyName: string | null;
  panNumber: string | null;
  partyName: string | null;
}

export interface Form16SavePayload {
  nameMatchInd: string | null;
  years: Form16YearEntry[];
}

export interface Form16aYearEntry {
  assessmentYear: string;
  form16aDtlId?: number | null;
  netReceiptPa: number | null;
}

export interface Form16aSavePayload {
  years: Form16aYearEntry[];
}

export interface FormJReceiptEntry {
  index: number;
  amount: number | null;
}

export interface FormJMonthEntry {
  periodMonth: number;
  formJDtlId?: number | null;
  receipts: FormJReceiptEntry[];
}

export interface FormJSavePayload {
  nameMatchInd: string | null;
  months: FormJMonthEntry[];
}

export interface GovtBondsSavePayload {
  govtBondDtlId?: number | null;
  nameMatchInd: string | null;
  isMatured: string | null;
  amountInvested: number | null;
  incomeEarned: number | null;
}

export interface ItrNonIndividualYearEntry {
  assessmentYear: string;
  metricIds?: {
    ackNumber?: number;
    itrFilingDt?: number;
    pfDeduction?: number;
    panBarcodeMatchInd?: number;
    incomeFromSalary?: number;
    incomeFromHouseProperty?: number;
    incomeFromBusiness?: number;
    shortTermCapitalGains?: number;
    incomeFromOtherSources?: number;
    agriculturalIncome?: number;
    exemptIncome?: number;
  };
  ackNumber: string | null;
  itrFilingDt: string | null;
  pfDeduction: number | null;
  panBarcodeMatchInd: string | null;
  incomeFromSalary: number | null;
  incomeFromHouseProperty: number | null;
  incomeFromBusiness: number | null;
  shortTermCapitalGains: number | null;
  incomeFromOtherSources: number | null;
  agriculturalIncome: number | null;
  exemptIncome: number | null;
}

export interface ItrNonIndividualSavePayload {
  itrDtlId?: number | null;
  orgName: string | null;
  panNumber: string | null;
  years: ItrNonIndividualYearEntry[];
}

export interface ItrIndividualYearEntry {
  assessmentYear: string;
  metricIds?: {
    partyName?: number;
    ackNumber?: number;
    itrFilingDt?: number;
    pfDeduction?: number;
    panBarcodeMatchInd?: number;
    incomeFromSalary?: number;
    incomeFromHouseProperty?: number;
    incomeFromBusiness?: number;
    shortTermCapitalGains?: number;
    incomeFromOtherSources?: number;
    agriculturalIncome?: number;
    exemptIncome?: number;
  };
  partyName: string | null;
  ackNumber: string | null;
  itrFilingDt: string | null;
  pfDeduction: number | null;
  panBarcodeMatchInd: string | null;
  incomeFromSalary: number | null;
  incomeFromHouseProperty: number | null;
  incomeFromBusiness: number | null;
  shortTermCapitalGains: number | null;
  incomeFromOtherSources: number | null;
  agriculturalIncome: number | null;
  exemptIncome: number | null;
}

export interface ItrIndividualSavePayload {
  itrDtlId?: number | null;
  orgName: string | null;
  panNumber: string | null;
  nameMatchInd: string | null;
  years: ItrIndividualYearEntry[];
}

export interface LoanStatementSavePayload {
  loanStmtDtlId?: number | null;
  nameMatchInd: string | null;
  isDefaulter: string | null;
  monthlyEmi: number | null;
  incomeEarned: number | null;
}

export interface MutualFundSavePayload {
  mfDtlId?: number | null;
  nameMatchInd: string | null;
  latestMarketValue: number | null;
  incomeEarned: number | null;
}

export interface PensionStatementSavePayload {
  pensionDtlId?: number | null;
  totalMonthlyPension: number | null;
}

export interface ProfitAndLossYearEntry {
  assessmentYear: string;
  metricIds?: {
    totalShareholdersFunds?: number;
    shareCapital?: number;
    reservesSurplus?: number;
    pbdt?: number;
    depreciation?: number;
    pbt?: number;
    tax?: number;
    profitAfterTax?: number;
    sales?: number;
  };
  totalShareholdersFunds: string | number | null;
  shareCapital: number | null;
  reservesSurplus: number | null;
  pbdt: number | null;
  depreciation: number | null;
  pbt: number | null;
  tax: number | null;
  profitAfterTax: number | null;
  sales: number | null;
}

export interface ProfitAndLossSavePayload {
  pnlDtlId?: number | null;
  orgName: string | null;
  years: ProfitAndLossYearEntry[];
}

export interface PropertyPurchaseSavePayload {
  propPurchDtlId?: number | null;
  isPurchasedByLa: string | null;
  purchasePrice: number | null;
  financialYearOfPurchase: string | null;
  estimatedMarketValue: number | null;
}

export interface PropertyValuationSavePayload {
  propValDtlId?: number | null;
  nameMatchInd: string | null;
  estimatedMarketValue: number | null;
}

export interface SalaryCertificateSavePayload {
  salCertDtlId?: number | null;
  grossSalaryPa: number | null;
}

export interface SalaryRevisionLetterSavePayload {
  salRevDtlId?: number | null;
  grossSalaryPa: number | null;
}

export interface SalarySlipsMonthEntry {
  periodMonth: number;
  salarySlipDtlId?: number | null;
  monthlyGrossSalary: number | null;
}

export interface SalarySlipsSavePayload {
  companyName: string | null;
  partyName: string | null;
  pfUan: string | null;
  nameMatchInd: string | null;
  annualBonus: number | null;
  months: SalarySlipsMonthEntry[];
}

export interface BankStatementMonthEntry {
  periodMonth: number;
  bankStmtDtlId?: number | null;
  closingBalance: number | null;
}

export interface BankStatementSavePayload {
  fullName: string | null;
  nameMatchInd: string | null;
  statementPeriod: string | null;
  openingBalance: number | null;
  liPremiumDeductionInd: string | null;
  wineBeerEntriesInd: string | null;
  medEntryInd: string | null;
  latest6MonthsInd: string | null;
  overdraftInd: string | null;
  months: BankStatementMonthEntry[];
}

export interface StockHoldingSavePayload {
  stockDtlId?: number | null;
  nameMatchInd: string | null;
  estimatedMarketValue: number | null;
  incomeEarned: number | null;
}

export interface VehicleOwnershipSavePayload {
  vehicleDtlId?: number | null;
  isRegNameLa: string | null;
  isInvoiceNameLa: string | null;
  purchasePrice: number | null;
  vehicleRcNumber: string | null;
}

export interface VahanSavePayload {
  vahanDtlId?: number | null;
  isRegNameLa: string | null;
  isInvoiceNameLa: string | null;
  carRcNumber: string | null;
  idv: number | null;
}

export interface SipStatementMonthEntry {
  periodMonth: number;
  sipDtlId?: number | null;
  sipAmount: number | null;
}

export interface SipStatementSavePayload {
  isLaNameSame: string | null;
  latest6MonthsInd: string | null;
  months: SipStatementMonthEntry[];
}

export interface GstIncomeYearEntry {
  assessmentYear: string;
  gstIncomeDtlId?: number | null;
  grossSales: number | null;
  grossPurchases: number | null;
  profitAfterGst: number | null;
}

export interface GstIncomeSavePayload {
  years: GstIncomeYearEntry[];
}

export interface BankStatementSalaryCreditMonthEntry {
  periodMonth: number;
  bankSalCrDtlId?: number | null;
  netSalaryCredited: number | null;
}

export interface BankStatementSalaryCreditSavePayload {
  fullName: string | null;
  nameMatchInd: string | null;
  salaryCreditedInd: string | null;
  annualBonus: number | null;
  openingBalance: number | null;
  closingBalance: number | null;
  statementPeriod: string | null;
  months: BankStatementSalaryCreditMonthEntry[];
}

export interface EpfBasicSavePayload {
  epfDtlId?: number | null;
  orgName: string | null;
  isOrgNameSame: string | null;
  income: number | null;
}

export interface EpfAdvancedMonthEntry {
  periodMonth: number;
  epfDtlId?: number | null;
  pfContribution: number | null;
}

export interface EpfAdvancedSavePayload {
  orgName: string | null;
  isOrgNameSame: string | null;
  months: EpfAdvancedMonthEntry[];
}

export interface EmployeeIdCardSavePayload {
  empIdCardDtlId?: number | null;
  companyName: string | null;
  employeeName: string | null;
  employeeNumber: string | number | null;
  photoAvailableInd: string | null;
}

export interface DecisionSavePayload {
  decisionDtlId?: number | null;
  verifiedIncomeDoc?: string | null;
  verifiedIncome?: number | null;
  justification?: string | null;
  decisionCode?: string | null;
}

export interface FinancialProfessionSavePayload {
  occupation?: string | null;
  annualIncome?: number | null;
  gstin?: string | null;
  industryType?: string | null;
  employmentType?: string | null;
  educationType?: string | null;
  organisationType?: string | null;
  organisationName?: string | null;
  designation?: string | null;
}

export interface CreditBureauDetailsSavePayload {
  experianIncome?: number | null;
  experianScore?: number | null;
  crifIncome?: number | null;
  crifScore?: number | null;
  cibilIncome?: number | null;
  cibilScore?: number | null;
  imputedIncome?: number | null;
  digitalIncome?: number | null;
  payuIncome?: number | null;
  averageIncome?: number | null;
}

/* ------------------------------------------------------------------ */
/* Transformation helpers                                             */
/* ------------------------------------------------------------------ */

function yesNoToYN(value: unknown): "Y" | "N" | string | null {
  if (value == null) return null;
  const str = String(value).trim();
  if (str === "Yes" || str === "Y") return "Y";
  if (str === "No" || str === "N") return "N";
  return str.length > 0 ? str : null;
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null;
  const str = String(value).replace(/,/g, "").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isNaN(num) ? null : num;
}

function formatDateToISO(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, "0");
    const m = ddmmyyyy[2].padStart(2, "0");
    return `${ddmmyyyy[3]}-${m}-${d}`;
  }
  return str;
}

function getVal(
  values: Readonly<Record<string, string>>,
  section: FinancialSection,
  ...labels: string[]
): string {
  for (const label of labels) {
    const trimmed = label.trim();
    // 1. Exact match on field label
    const exactIndex = section.fields.findIndex((f) => f[0] === trimmed);
    if (exactIndex >= 0) {
      const val = values[`${section.key}-${exactIndex}`];
      if (val !== undefined && val !== "") return val;
      const def = section.fields[exactIndex][1] ?? "";
      if (def !== "") return def;
    }

    // 2. Case-insensitive match on field label
    const lowerIndex = section.fields.findIndex(
      (f) => f[0].trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (lowerIndex >= 0) {
      const val = values[`${section.key}-${lowerIndex}`];
      if (val !== undefined && val !== "") return val;
      const def = section.fields[lowerIndex][1] ?? "";
      if (def !== "") return def;
    }

    // 3. Direct key lookup by label name
    const directVal = values[`${section.key}-${trimmed}`];
    if (directVal !== undefined && directVal !== "") return directVal;
  }
  return "";
}

function getExtra(
  values: Readonly<Record<string, string>>,
  key: string,
): string {
  return values[key] ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/* ------------------------------------------------------------------ */
/* Document builder logic                                             */
/* ------------------------------------------------------------------ */

export function buildDocumentPayload(
  sectionKey: string,
  section: FinancialSection,
  values: Readonly<Record<string, string>>,
): unknown {
  const raw = isRecord(section.rawDocument) ? section.rawDocument : {};

  switch (sectionKey) {
    case "appointment_letter": {
      return {
        apptDtlId: (raw.apptDtlId as number | undefined) ?? 4,
        grossSalaryPa: parseNumber(getVal(values, section, "Gross Salary PA") || getVal(values, section, "CTC")),
        companyName: getVal(values, section, "Name of the Company") || null,
        partyName: getVal(values, section, "Name of the Employee") || null,
        joiningDt: formatDateToISO(getVal(values, section, "Joining Date")),
      } satisfies AppointmentLetterSavePayload;
    }

    case "commission_statement": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: CommissionStatementMonthEntry[] = [1, 2, 3, 4, 5, 6].map((p) => {
        const rawM = isRecord(rawMonths[p - 1]) ? rawMonths[p - 1] : {};
        const amountStr =
          getExtra(values, `commission_statement-entry-income-${p}`) ||
          getVal(values, section, `Income for Month ${p}`) ||
          getVal(values, section, `Month ${p}`);
        return {
          periodMonth: p,
          commissionDtlId: (rawM.commissionDtlId as number | undefined) ?? (p === 1 ? 10 : p === 2 ? 11 : p === 3 ? 12 : p === 4 ? 23 : p === 5 ? 24 : 25),
          commissionAmount: parseNumber(amountStr),
        };
      });
      return { months } satisfies CommissionStatementSavePayload;
    }

    case "computation_of_income": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: ComputationOfIncomeYearEntry[] = [1, 2, 3].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        const ay = getVal(values, section, `Assessment Year${suffix}`) || (y === 1 ? "AY 23-24" : y === 2 ? "AY 24-25" : "AY 25-26");
        return {
          assessmentYear: ay,
          metricIds: isRecord(rawY.metricIds) ? (rawY.metricIds as ComputationOfIncomeYearEntry["metricIds"]) : undefined,
          incomeFromSalary: parseNumber(getVal(values, section, `Income from Salary(A)${suffix}`)),
          incomeFromBusiness: parseNumber(getVal(values, section, `Income from Business or Profession (B)${suffix}`)),
          shortTermCapitalGains: parseNumber(getVal(values, section, `Short term & Capital Gains${suffix}`)),
          incomeFromOtherSources: parseNumber(getVal(values, section, `Income from Other Sources${suffix}`)),
          agriculturalIncome: parseNumber(getVal(values, section, `Agricultural Income${suffix}`)),
          incomeFromHouseProperty: parseNumber(getVal(values, section, `Income from House Property${suffix}`)),
          exemptIncome: parseNumber(getVal(values, section, `Exempt Income(C)${suffix}`)),
        };
      });
      return { years } satisfies ComputationOfIncomeSavePayload;
    }

    case "credit_card": {
      return {
        ccDtlId: (raw.ccDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Credit card statement in the name of LA", "Credit card statement in the name of LA")),
        isDefaulter: yesNoToYN(getVal(values, section, "Is LA Defaulter in the Payment", "LA Defaulter in the Payment")),
        cardType: getVal(values, section, "Type of Card") || null,
        creditLimit: parseNumber(getVal(values, section, "Credit Limit")),
        incomeEarned: parseNumber(getVal(values, section, "Income Earned")),
        pointsEarned: parseNumber(getVal(values, section, "Points Earned")),
      } satisfies CreditCardSavePayload;
    }

    case "fixed_deposit_receipt": {
      return {
        fdDtlId: (raw.fdDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Fixed Deposit Receipt in the name of LA")),
        isMatured: yesNoToYN(getVal(values, section, "Is Fixed Deposit Receipts matured")),
        amountInvested: parseNumber(getVal(values, section, "Amount Invested")),
        incomeEarned: parseNumber(getVal(values, section, "Income Earned")),
      } satisfies FixedDepositReceiptSavePayload;
    }

    case "form16": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: Form16YearEntry[] = [1, 2, 3].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        return {
          assessmentYear: getVal(values, section, `Assessment Year${suffix}`) || getVal(values, section, `Assessment${suffix}`) || (y === 1 ? "AY 23-24" : y === 2 ? "AY 24-25" : "AY 25-26"),
          form16DtlId: (rawY.form16DtlId as number | undefined) ?? (y === 1 ? 12 : y === 2 ? 13 : 14),
          grossSalaryPa: parseNumber(getVal(values, section, `Gross Salary PA${suffix}`)),
          companyName: getVal(values, section, `Company Name${suffix}`) || null,
          panNumber: getVal(values, section, `Life Assured Pan No${suffix}`, `Life Assured PAN No${suffix}`, `Pan Number${suffix}`, `PAN Number${suffix}`) || null,
          partyName: getVal(values, section, `Life Assured Name${suffix}`) || null,
        };
      });
      return {
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Life Assured Name Same With Doc Name?")),
        years,
      } satisfies Form16SavePayload;
    }

    case "form16a": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: Form16aYearEntry[] = [1, 2, 3].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        return {
          assessmentYear: getVal(values, section, `Assessment Year${suffix}`) || (y === 1 ? "AY 23-24" : y === 2 ? "AY 24-25" : "AY 25-26"),
          form16aDtlId: (rawY.form16aDtlId as number | undefined) ?? (y === 1 ? 20 : y === 2 ? 7 : 8),
          netReceiptPa: parseNumber(getVal(values, section, `Net Receipt pa${suffix}`)),
        };
      });
      return { years } satisfies Form16aSavePayload;
    }

    case "form_j": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: FormJMonthEntry[] = [1, 2, 3].map((m) => {
        const rawM = isRecord(rawMonths[m - 1]) ? rawMonths[m - 1] : {};
        const receipts: FormJReceiptEntry[] = [1, 2, 3, 4, 5, 6].map((r) => ({
          index: r,
          amount: parseNumber(getVal(values, section, `Month${m} Receipt${r}`)),
        }));
        return {
          periodMonth: m,
          formJDtlId: (rawM.formJDtlId as number | undefined) ?? (m === 1 ? 10 : m === 2 ? 11 : 12),
          receipts,
        };
      });
      return {
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Form J in the name of LA")),
        months,
      } satisfies FormJSavePayload;
    }

    case "govt_bonds": {
      return {
        govtBondDtlId: (raw.govtBondDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Bond Certification in the name of LA")),
        isMatured: yesNoToYN(getVal(values, section, "Is Bond Certificate matured")),
        amountInvested: parseNumber(getVal(values, section, "Amount Invested or Maturity Value")),
        incomeEarned: parseNumber(getVal(values, section, "Income Earned")),
      } satisfies GovtBondsSavePayload;
    }

    case "itr_non_individual": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: ItrNonIndividualYearEntry[] = [1, 2, 3].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        return {
          assessmentYear: getVal(values, section, `Assessment Year${suffix}`) || (y === 1 ? "AY 23-24" : y === 2 ? "AY 24-25" : "AY 25-26"),
          metricIds: isRecord(rawY.metricIds) ? (rawY.metricIds as ItrNonIndividualYearEntry["metricIds"]) : undefined,
          ackNumber: getVal(values, section, `ITR Acknowledgement Number${suffix}`) || null,
          itrFilingDt: formatDateToISO((rawY.itrFilingDt as string | undefined) ?? (y === 1 ? "2024-09-30" : y === 2 ? "2025-09-30" : "2026-06-20")),
          pfDeduction: parseNumber(rawY.pfDeduction ?? 0),
          panBarcodeMatchInd: yesNoToYN(getVal(values, section, `Pan Number Matched with Barcode Number${suffix}`)),
          incomeFromSalary: parseNumber(getVal(values, section, `Income from Salary${suffix}`)),
          incomeFromHouseProperty: parseNumber(getVal(values, section, `Income from House Property${suffix}`)),
          incomeFromBusiness: parseNumber(getVal(values, section, `Income from Business or Profession${suffix}`)),
          shortTermCapitalGains: parseNumber(getVal(values, section, `Short term & Capital Gains${suffix}`)),
          incomeFromOtherSources: parseNumber(getVal(values, section, `Income from Other Sources${suffix}`)),
          agriculturalIncome: parseNumber(getVal(values, section, `Agricultural Income${suffix}`)),
          exemptIncome: parseNumber(getVal(values, section, `Exempt Income${suffix}`)),
        };
      });
      return {
        itrDtlId: (raw.itrDtlId as number | undefined) ?? 9,
        orgName: getVal(values, section, "Name of Organisation/Firm") || null,
        panNumber: getVal(values, section, "Permanent Account Number") || null,
        years,
      } satisfies ItrNonIndividualSavePayload;
    }

    case "itr_individual": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: ItrIndividualYearEntry[] = [1, 2, 3].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        return {
          assessmentYear: getVal(values, section, `Assessment Year${suffix}`) || (y === 1 ? "AY 23-24" : y === 2 ? "AY 24-25" : "AY 25-26"),
          metricIds: isRecord(rawY.metricIds) ? (rawY.metricIds as ItrIndividualYearEntry["metricIds"]) : undefined,
          partyName: getVal(values, section, `Life Assured Name${suffix}`) || null,
          ackNumber: getVal(values, section, `ITR Acknowledgement Number${suffix}`) || null,
          itrFilingDt: formatDateToISO(getVal(values, section, `Date of Filling ITR${suffix}`) || (rawY.itrFilingDt as string | undefined)),
          pfDeduction: parseNumber(getVal(values, section, `PF deduction - Salaried customers${suffix}`)),
          panBarcodeMatchInd: yesNoToYN(getVal(values, section, `Pan Number Matched with Barcode Number${suffix}`)),
          incomeFromSalary: parseNumber(getVal(values, section, `Income from Salary(A)${suffix}`)),
          incomeFromHouseProperty: parseNumber(getVal(values, section, `Income from House Property${suffix}`)),
          incomeFromBusiness: parseNumber(getVal(values, section, `Income from Business or Profession(B)${suffix}`)),
          shortTermCapitalGains: parseNumber(getVal(values, section, `Short term & Capital Gains${suffix}`)),
          incomeFromOtherSources: parseNumber(getVal(values, section, `Income from Other Sources${suffix}`)),
          agriculturalIncome: parseNumber(getVal(values, section, `Agricultural Income${suffix}`)),
          exemptIncome: parseNumber(getVal(values, section, `Exempt Income(C)${suffix}`)),
        };
      });
      return {
        itrDtlId: (raw.itrDtlId as number | undefined) ?? 8,
        orgName: getVal(values, section, "Name of Organisation/Firm") || null,
        panNumber: getVal(values, section, "Permanent Account Number") || null,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Life Assured Name Same?")),
        years,
      } satisfies ItrIndividualSavePayload;
    }

    case "loan_statement": {
      return {
        loanStmtDtlId: (raw.loanStmtDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Loan Statements in the name of LA", "Loan Statements in the name of LA")),
        isDefaulter: yesNoToYN(getVal(values, section, "Is LA Defaulter in the Payment", "LA Defaulter in the Payment")),
        monthlyEmi: parseNumber(getVal(values, section, "Monthly EMI as per Schedule")),
        incomeEarned: parseNumber(getVal(values, section, "Income Earned")),
      } satisfies LoanStatementSavePayload;
    }

    case "mutual_fund": {
      return {
        mfDtlId: (raw.mfDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Mutual Fund Statement in the name of LA")),
        latestMarketValue: parseNumber(getVal(values, section, "Latest Market Value (as per NAV) in Statement")),
        incomeEarned: parseNumber(getVal(values, section, "Income Earned")),
      } satisfies MutualFundSavePayload;
    }

    case "pension_statement": {
      return {
        pensionDtlId: (raw.pensionDtlId as number | undefined) ?? 4,
        totalMonthlyPension: parseNumber(getVal(values, section, "Total Monthly Pension")),
      } satisfies PensionStatementSavePayload;
    }

    case "profit_and_loss": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: ProfitAndLossYearEntry[] = [1, 2, 3].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        return {
          assessmentYear: getVal(values, section, `Assessment Year${suffix}`) || (y === 1 ? "AY 23-24" : y === 2 ? "AY 24-25" : "AY 25-26"),
          metricIds: isRecord(rawY.metricIds) ? (rawY.metricIds as ProfitAndLossYearEntry["metricIds"]) : undefined,
          totalShareholdersFunds: getVal(values, section, `Total Shareholders Funds or Partner's Fund${suffix}`) || null,
          shareCapital: parseNumber(getVal(values, section, `Share Capital or Fixed/Fluctuating Capital${suffix}`)),
          reservesSurplus: parseNumber(getVal(values, section, `Reserves & Surplus${suffix}`)),
          pbdt: parseNumber(getVal(values, section, `Profit Before Depreciation & Tax (PBDT)${suffix}`)),
          depreciation: parseNumber(getVal(values, section, `Less : Depreciation${suffix}`)),
          pbt: parseNumber(getVal(values, section, `Profit Before Tax (PBT)${suffix}`)),
          tax: parseNumber(getVal(values, section, `Tax${suffix}`)),
          profitAfterTax: parseNumber(getVal(values, section, `Profit After Tax (PAT)${suffix}`)),
          sales: parseNumber(getVal(values, section, `Sales${suffix}`)),
        };
      });
      return {
        pnlDtlId: (raw.pnlDtlId as number | undefined) ?? 4,
        orgName: getVal(values, section, "Name of Organization/Firm") || null,
        years,
      } satisfies ProfitAndLossSavePayload;
    }

    case "property_purchase": {
      return {
        propPurchDtlId: (raw.propPurchDtlId as number | undefined) ?? 4,
        isPurchasedByLa: yesNoToYN(getVal(values, section, "Is Property purchased by LA")),
        purchasePrice: parseNumber(getVal(values, section, "Purchase Price")),
        financialYearOfPurchase: getVal(values, section, "Financial Year of Purchase") || null,
        estimatedMarketValue: parseNumber(getVal(values, section, "Estimated Market Value of Property")),
      } satisfies PropertyPurchaseSavePayload;
    }

    case "property_valuation": {
      return {
        propValDtlId: (raw.propValDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Property Valuation Report in the name of LA")),
        estimatedMarketValue: parseNumber(getVal(values, section, "Estimated Market Value of Property (as per report)")),
      } satisfies PropertyValuationSavePayload;
    }

    case "salary_certificate": {
      return {
        salCertDtlId: (raw.salCertDtlId as number | undefined) ?? 4,
        grossSalaryPa: parseNumber(getVal(values, section, "Gross Salary PA")),
      } satisfies SalaryCertificateSavePayload;
    }

    case "salary_revision_letter": {
      return {
        salRevDtlId: (raw.salRevDtlId as number | undefined) ?? 4,
        grossSalaryPa: parseNumber(getVal(values, section, "Gross Salary PA")),
      } satisfies SalaryRevisionLetterSavePayload;
    }

    case "salary_slips": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: SalarySlipsMonthEntry[] = [1, 2, 3, 4, 5, 6].map((m) => {
        const rawM = isRecord(rawMonths[m - 1]) ? rawMonths[m - 1] : {};
        const salaryVal = getVal(values, section, `Gross Salary Pm${m}`) || getVal(values, section, `Gross Salary Pm ${m}`);
        return {
          periodMonth: m,
          salarySlipDtlId: (rawM.salarySlipDtlId as number | undefined) ?? (m === 1 ? 10 : m === 2 ? 11 : m === 3 ? 12 : m === 4 ? 24 : m === 5 ? 25 : 26),
          monthlyGrossSalary: parseNumber(salaryVal),
        };
      });
      return {
        companyName: getVal(values, section, "Company Name") || null,
        partyName: getVal(values, section, "Life Assured Name") || null,
        pfUan: getVal(values, section, "PF / UAN No") || null,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Life Assured Name Same?")),
        annualBonus: parseNumber(getVal(values, section, "Annual Bonus/Incentive/Reimbursement")),
        months,
      } satisfies SalarySlipsSavePayload;
    }

    case "bank_statement": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: BankStatementMonthEntry[] = [1, 2, 3, 4, 5, 6].map((m) => {
        const rawM = isRecord(rawMonths[m - 1]) ? rawMonths[m - 1] : {};
        return {
          periodMonth: m,
          bankStmtDtlId: (rawM.bankStmtDtlId as number | undefined) ?? (18 + m),
          closingBalance: parseNumber(getVal(values, section, `Monthly Closing Bal ${m}`)),
        };
      });
      return {
        fullName: getVal(values, section, "Life Assured Name") || null,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is LA Name Match with Doc Name?")),
        statementPeriod: getVal(values, section, "Statement Period") || null,
        openingBalance: parseNumber(getVal(values, section, "Opening Balance")),
        liPremiumDeductionInd: yesNoToYN(getVal(values, section, "Life Insurance Premium Deduction Entry")),
        wineBeerEntriesInd: yesNoToYN(getVal(values, section, "Wine Beer_Entries")),
        medEntryInd: yesNoToYN(getVal(values, section, "Med Entry")),
        latest6MonthsInd: yesNoToYN(getVal(values, section, "Latest 6 months statements given")),
        overdraftInd: yesNoToYN(getVal(values, section, "Any Overdraft(Negative/Debit) Balances")),
        months,
      } satisfies BankStatementSavePayload;
    }

    case "stock_holding": {
      return {
        stockDtlId: (raw.stockDtlId as number | undefined) ?? 4,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is Stock Holding Stmt in name of LA/his Business")),
        estimatedMarketValue: parseNumber(getVal(values, section, "Gross Total Market Value as per the Stmt")),
        incomeEarned: parseNumber(getVal(values, section, "Income Earned")),
      } satisfies StockHoldingSavePayload;
    }

    case "vehicle_ownership": {
      return {
        vehicleDtlId: (raw.vehicleDtlId as number | undefined) ?? 4,
        isRegNameLa: yesNoToYN(getVal(values, section, "Is Registration Papers in the name of LA")),
        isInvoiceNameLa: yesNoToYN(getVal(values, section, "Is Purchase invoices in the name of LA")),
        purchasePrice: parseNumber(getVal(values, section, "Purchase Price")),
        vehicleRcNumber: getVal(values, section, "Vehicle RC Number") || null,
      } satisfies VehicleOwnershipSavePayload;
    }

    case "vahan": {
      return {
        vahanDtlId: (raw.vahanDtlId as number | undefined) ?? 4,
        isRegNameLa: yesNoToYN(getVal(values, section, "Is Registration Papers in the Name of LA")),
        isInvoiceNameLa: yesNoToYN(getVal(values, section, "Is Purchase Invoices in the Name of LA")),
        carRcNumber: getVal(values, section, "Car RC Number") || null,
        idv: parseNumber(getVal(values, section, "IDV")),
      } satisfies VahanSavePayload;
    }

    case "sip_statement": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: SipStatementMonthEntry[] = [1, 2, 3, 4, 5, 6].map((m) => {
        const rawM = isRecord(rawMonths[m - 1]) ? rawMonths[m - 1] : {};
        return {
          periodMonth: m,
          sipDtlId: (rawM.sipDtlId as number | undefined) ?? (18 + m),
          sipAmount: parseNumber(getVal(values, section, `SIP of Month ${m}`)),
        };
      });
      return {
        isLaNameSame: yesNoToYN(getVal(values, section, "Is SIP Statements in the Name of LA")),
        latest6MonthsInd: yesNoToYN(getVal(values, section, "Latest 6 Months SIP Statements Given")),
        months,
      } satisfies SipStatementSavePayload;
    }

    case "gst_income": {
      const rawYears = Array.isArray(raw.years) ? raw.years : [];
      const years: GstIncomeYearEntry[] = [1, 2, 3, 4].map((y) => {
        const rawY = isRecord(rawYears[y - 1]) ? rawYears[y - 1] : {};
        const suffix = y === 1 ? "" : ` Year ${y}`;
        return {
          assessmentYear: getVal(values, section, `Assessment Year${suffix}`) || (y === 1 ? "AY 22-23" : y === 2 ? "AY 23-24" : y === 3 ? "AY 24-25" : "AY 25-26"),
          gstIncomeDtlId: (rawY.gstIncomeDtlId as number | undefined) ?? (15 + y),
          grossSales: parseNumber(getVal(values, section, `Gross Sales${suffix}`)),
          grossPurchases: parseNumber(getVal(values, section, `Gross Purchases${suffix}`)),
          profitAfterGst: parseNumber(getVal(values, section, `Profit After GST${suffix}`)),
        };
      });
      return { years } satisfies GstIncomeSavePayload;
    }

    case "bank_statement_salary_credit": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: BankStatementSalaryCreditMonthEntry[] = [1, 2, 3, 4, 5, 6].map((m) => {
        const rawM = isRecord(rawMonths[m - 1]) ? rawMonths[m - 1] : {};
        const netSal =
          getExtra(values, `bank_statement_salary_credit-entry-income-${m}`) ||
          getVal(values, section, `Net Salary Credited PM${m}`) ||
          getVal(values, section, `Net Salary Credited PM ${m}`);
        return {
          periodMonth: m,
          bankSalCrDtlId: (rawM.bankSalCrDtlId as number | undefined) ?? (18 + m),
          netSalaryCredited: parseNumber(netSal),
        };
      });
      return {
        fullName: getVal(values, section, "Life Assured Name") || null,
        nameMatchInd: yesNoToYN(getVal(values, section, "Is LA Name Match with Doc Name?")),
        salaryCreditedInd: yesNoToYN(getVal(values, section, "Salary Credited")),
        annualBonus: parseNumber(getVal(values, section, "Annual Bonus /Incentive /Reimbursement")),
        openingBalance: parseNumber(getVal(values, section, "Opening Balance")),
        closingBalance: parseNumber(getVal(values, section, "Closing Balance")),
        statementPeriod: getVal(values, section, "Statement Period") || null,
        months,
      } satisfies BankStatementSalaryCreditSavePayload;
    }

    case "epf_basic": {
      return {
        epfDtlId: (raw.epfDtlId as number | undefined) ?? 28,
        orgName: getVal(values, section, "Latest Organization Name") || null,
        isOrgNameSame: yesNoToYN(getVal(values, section, "Is Organization Name Same?")),
        income: parseNumber(getVal(values, section, "Income")),
      } satisfies EpfBasicSavePayload;
    }

    case "epf_advanced": {
      const rawMonths = Array.isArray(raw.months) ? raw.months : [];
      const months: EpfAdvancedMonthEntry[] = [1, 2, 3, 4, 5, 6].map((m) => {
        const rawM = isRecord(rawMonths[m - 1]) ? rawMonths[m - 1] : {};
        const contrib =
          getExtra(values, `epf_advanced-entry-income-${m}`) ||
          getVal(values, section, `Month ${m}`);
        return {
          periodMonth: m,
          epfDtlId: (rawM.epfDtlId as number | undefined) ?? (21 + m),
          pfContribution: parseNumber(contrib),
        };
      });
      return {
        orgName: getVal(values, section, "Latest Organization Name") || null,
        isOrgNameSame: yesNoToYN(getVal(values, section, "Is Organization Name Same?")),
        months,
      } satisfies EpfAdvancedSavePayload;
    }

    case "employee_id_card": {
      return {
        empIdCardDtlId: (raw.empIdCardDtlId as number | undefined) ?? 1,
        companyName: getVal(values, section, "Name of the company") || null,
        employeeName: getVal(values, section, "Name of the employee") || null,
        employeeNumber: getVal(values, section, "Employee number") || null,
        photoAvailableInd: yesNoToYN(getVal(values, section, "Photo available")),
      } satisfies EmployeeIdCardSavePayload;
    }

    case "decision":
    case "bre_financial_decision": {
      return {
        decisionDtlId: (raw.decisionDtlId as number | undefined) ?? 1,
        verifiedIncomeDoc: (raw.verifiedIncomeDoc as string | undefined) ?? "salary_slips",
        verifiedIncome: parseNumber(getVal(values, section, "Verified Income")),
        justification: (raw.justification as string | undefined) ?? "Income verified from submitted documents",
        decisionCode: getVal(values, section, "Financial Decision") || (raw.decisionCode as string | undefined) || "financially eligible",
      } satisfies DecisionSavePayload;
    }

    case "financial_profession": {
      return {
        occupation: getVal(values, section, "Occupation") || null,
        annualIncome: parseNumber(getVal(values, section, "Annual Income")),
        gstin: getVal(values, section, "GSTIN") || null,
        industryType: getVal(values, section, "Industry Type") || null,
        employmentType: getVal(values, section, "Employment Type") || null,
        educationType: getVal(values, section, "Education Type") || null,
        organisationType: getVal(values, section, "Organisation Type") || null,
        organisationName: getVal(values, section, "Organisation Name") || null,
        designation: getVal(values, section, "Designation") || null,
      } satisfies FinancialProfessionSavePayload;
    }

    case "credit_bureau_details": {
      return {
        experianIncome: parseNumber(getVal(values, section, "Experian Income")),
        experianScore: parseNumber(getVal(values, section, "Experian Score")),
        crifIncome: parseNumber(getVal(values, section, "Crif Income")),
        crifScore: parseNumber(getVal(values, section, "Crif Score")),
        cibilIncome: parseNumber(getVal(values, section, "Cibil Income")),
        cibilScore: parseNumber(getVal(values, section, "Cibil Score")),
        imputedIncome: parseNumber(getVal(values, section, "Imputed Income")),
        digitalIncome: parseNumber(getVal(values, section, "Digital Income")),
        payuIncome: parseNumber(getVal(values, section, "PayU Income")),
        averageIncome: parseNumber(getVal(values, section, "Average Income")),
      } satisfies CreditBureauDetailsSavePayload;
    }

    default: {
      const result: Record<string, unknown> = {};
      section.fields.forEach(([label]) => {
        result[label] = getVal(values, section, label);
      });
      return result;
    }
  }
}

export interface BuildFinancialSaveRequestOptions {
  applicationNumber: string;
  partyId: string;
  createdBy?: string;
  updatedBy?: string;
  section: FinancialSection;
  values: Readonly<Record<string, string>>;
}

/**
 * Creates the individual document Save API request payload and logs it to the console.
 */
export function buildFinancialSaveRequest({
  applicationNumber,
  partyId,
  createdBy = "ui-user",
  updatedBy = "ui-user-2",
  section,
  values,
}: BuildFinancialSaveRequestOptions): FinancialSaveRequest {
  const docPayload = buildDocumentPayload(section.key, section, values);

  const request: FinancialSaveRequest = {
    applicationNumber,
    partyId,
    createdBy,
    updatedBy,
    documents: {
      [section.key]: docPayload,
    },
  };

  console.log(
    `[Financial Save API Payload - ${section.key}]:`,
    JSON.stringify(request, null, 2),
  );

  return request;
}
