import { getSessionUser } from "@insurance-poc/utils";
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
  month: string | null;
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
  month: string | null;
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
  month: string | null;
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
  month: string | null;
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
  month: string | null;
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
  month: string | null;
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
  month: string | null;
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

type FieldValues = Readonly<Record<string, string>>;

const DDMMYYYY_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function yesNoToYN(value: string): string | null {
  const str = value.trim();
  if (str === "Yes" || str === "Y") return "Y";
  if (str === "No" || str === "N") return "N";
  return str.length > 0 ? str : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value !== "string") return null;
  const str = value.replaceAll(",", "").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isNaN(num) ? null : num;
}

function formatDateToISO(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const str = value.trim();
  if (!str) return null;
  const ddmmyyyy = DDMMYYYY_PATTERN.exec(str);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, "0");
    const m = ddmmyyyy[2].padStart(2, "0");
    return `${ddmmyyyy[3]}-${m}-${d}`;
  }
  return str;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readList(raw: Record<string, unknown>, key: string): unknown[] {
  const value = raw[key];
  return Array.isArray(value) ? value : [];
}

function readMetricIds<T>(rawEntry: Record<string, unknown>): T | undefined {
  return isRecord(rawEntry.metricIds) ? (rawEntry.metricIds as T) : undefined;
}

/** Stored value of the field at `index`, falling back to the field's configured default. */
function readFieldValue(
  values: FieldValues,
  section: FinancialSection,
  index: number,
): string {
  if (index < 0) return "";
  const stored = values[`${section.key}-${index}`];
  if (stored !== undefined && stored !== "") return stored;
  return section.fields[index][1] ?? "";
}

/**
 * First non-empty value for the given labels. Per label: exact match, then case-insensitive
 * match, then a direct `<section>-<label>` key lookup.
 */
function getVal(
  values: FieldValues,
  section: FinancialSection,
  ...labels: string[]
): string {
  for (const label of labels) {
    const trimmed = label.trim();
    const lower = trimmed.toLowerCase();
    const candidates = [
      section.fields.findIndex((f) => f[0] === trimmed),
      section.fields.findIndex((f) => f[0].trim().toLowerCase() === lower),
    ];
    for (const index of candidates) {
      const found = readFieldValue(values, section, index);
      if (found !== "") return found;
    }
    const direct = values[`${section.key}-${trimmed}`];
    if (direct) return direct;
  }
  return "";
}

/** Month dropdown value stored beside a field (`<section>-<field index>-month`); null when unset. */
function getFieldMonth(
  values: FieldValues,
  section: FinancialSection,
  label: string,
): string | null {
  const index = section.fields.findIndex((f) => f[0] === label);
  if (index < 0) return null;
  return values[`${section.key}-${index}-month`] || null;
}

function extractOptionalId<K extends string>(
  raw: Record<string, unknown>,
  key: K,
): { [P in K]?: number } {
  const val = raw[key];
  if (typeof val === "number" && !Number.isNaN(val)) {
    return { [key]: val } as { [P in K]?: number };
  }
  if (typeof val === "string" && val.trim().length > 0) {
    const num = Number(val.trim());
    if (!Number.isNaN(num)) {
      return { [key]: num } as { [P in K]?: number };
    }
  }
  return {};
}

/* ------------------------------------------------------------------ */
/* Build context                                                      */
/* ------------------------------------------------------------------ */

/** Everything a document builder needs to read form values for one section. */
interface BuildContext {
  /** Raw document returned by the fetch API (carries the `*DtlId` identifiers). */
  readonly raw: Record<string, unknown>;
  /** First non-empty value for the labels, or "". */
  readonly val: (...labels: string[]) => string;
  /** Value for the labels, or null when empty. */
  readonly text: (...labels: string[]) => string | null;
  /** Value for the labels parsed as a number, or null. */
  readonly num: (...labels: string[]) => number | null;
  /** Value for the labels mapped to "Y" / "N", or null. */
  readonly yn: (...labels: string[]) => string | null;
  /** Value stored under an arbitrary store key (not a section field), or "". */
  readonly extra: (key: string) => string;
  /** Month dropdown stored beside the field with this label, or null. */
  readonly fieldMonth: (label: string) => string | null;
}

type DocumentBuilder = (ctx: BuildContext) => unknown;

function createContext(
  section: FinancialSection,
  values: FieldValues,
): BuildContext {
  const val = (...labels: string[]) => getVal(values, section, ...labels);
  return {
    raw: asRecord(section.rawDocument),
    val,
    text: (...labels) => val(...labels) || null,
    num: (...labels) => parseNumber(val(...labels)),
    yn: (...labels) => yesNoToYN(val(...labels)),
    extra: (key) => values[key] ?? "",
    fieldMonth: (label) => getFieldMonth(values, section, label),
  };
}

/** Builds `count` entries, handing each its 1-based position and the matching raw entry. */
function buildEntries<T>(
  ctx: BuildContext,
  listKey: "months" | "years",
  count: number,
  build: (position: number, rawEntry: Record<string, unknown>) => T,
): T[] {
  const list = readList(ctx.raw, listKey);
  return Array.from({ length: count }, (_, i) =>
    build(i + 1, asRecord(list[i])),
  );
}

/* ------------------------------------------------------------------ */
/* Shared labels and year helpers                                     */
/* ------------------------------------------------------------------ */

const LABEL = {
  assessmentYear: "Assessment Year",
  incomeEarned: "Income Earned",
  lifeAssuredName: "Life Assured Name",
  isLifeAssuredNameSame: "Is Life Assured Name Same?",
  isLaNameMatch: "Is LA Name Match with Doc Name?",
  isLaDefaulter: "Is LA Defaulter in the Payment",
  statementPeriod: "Statement Period",
  openingBalance: "Opening Balance",
  grossSalaryPa: "Gross Salary PA",
  purchasePrice: "Purchase Price",
  organisationFirm: "Name of Organisation/Firm",
  permanentAccountNumber: "Permanent Account Number",
  itrAckNumber: "ITR Acknowledgement Number",
  itrFilingDate: "Date of Filling ITR",
  panBarcodeMatch: "Pan Number Matched with Barcode Number",
  shortTermCapitalGains: "Short term & Capital Gains",
  incomeFromOtherSources: "Income from Other Sources",
  incomeFromHouseProperty: "Income from House Property",
  agriculturalIncome: "Agricultural Income",
  latestOrganizationName: "Latest Organization Name",
  isOrganizationNameSame: "Is Organization Name Same?",
} as const;

/** SIP monthly amount field labels, in month order (the month dropdown sits beside each). */
const SIP_AMOUNT_LABELS = [
  "SIP Per Month 1",
  "SIP Per Month2",
  "SIP Per Month 3",
  "SIP Per Month4",
  "SIP Per Month 5",
  "SIP Per Month 6",
] as const;

const MONTHS_PER_HALF_YEAR = 6;
const FORM_J_MONTHS = 3;
const FORM_J_RECEIPTS_PER_MONTH = 6;
const ASSESSMENT_YEARS = 3;
const GST_ASSESSMENT_YEARS = 4;

/** Label suffix for the 2nd and 3rd year columns: "", " Year 2", " Year 3". */
function yearSuffix(year: number): string {
  return year === 1 ? "" : ` Year ${year}`;
}

/** Fallback assessment year, e.g. position 1 and first year 23 -> "AY 23-24". */
function defaultAssessmentYear(position: number, firstYear: number): string {
  const start = firstYear + position - 1;
  return `AY ${start}-${start + 1}`;
}

function buildYears<T>(
  ctx: BuildContext,
  count: number,
  build: (year: number, suffix: string, rawEntry: Record<string, unknown>) => T,
): T[] {
  return buildEntries(ctx, "years", count, (year, rawEntry) =>
    build(year, yearSuffix(year), rawEntry),
  );
}

/* ------------------------------------------------------------------ */
/* Document builders                                                  */
/* ------------------------------------------------------------------ */

function buildAppointmentLetter(ctx: BuildContext): AppointmentLetterSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "apptDtlId"),
    grossSalaryPa: ctx.num(LABEL.grossSalaryPa, "CTC"),
    companyName: ctx.text("Name of the Company"),
    partyName: ctx.text("Name of the Employee"),
    joiningDt: formatDateToISO(ctx.val("Joining Date")),
  };
}

function buildCommissionStatement(ctx: BuildContext): CommissionStatementSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    MONTHS_PER_HALF_YEAR,
    (p, rawM): CommissionStatementMonthEntry => ({
      periodMonth: p,
      month: ctx.extra(`commission_statement-entry-month-${p}`) || null,
      ...extractOptionalId(rawM, "commissionDtlId"),
      commissionAmount: parseNumber(
        ctx.extra(`commission_statement-entry-income-${p}`) ||
          ctx.val(`Income for Month ${p}`, `Month ${p}`),
      ),
    }),
  );
  return { months };
}

function buildComputationOfIncome(ctx: BuildContext): ComputationOfIncomeSavePayload {
  const years = buildYears(
    ctx,
    ASSESSMENT_YEARS,
    (y, suffix, rawY): ComputationOfIncomeYearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`) ||
        defaultAssessmentYear(y, 23),
      metricIds: readMetricIds<ComputationOfIncomeYearEntry["metricIds"]>(rawY),
      incomeFromSalary: ctx.num(`Income from Salary(A)${suffix}`),
      incomeFromBusiness: ctx.num(`Income from Business or Profession (B)${suffix}`),
      shortTermCapitalGains: ctx.num(`${LABEL.shortTermCapitalGains}${suffix}`),
      incomeFromOtherSources: ctx.num(`${LABEL.incomeFromOtherSources}${suffix}`),
      agriculturalIncome: ctx.num(`${LABEL.agriculturalIncome}${suffix}`),
      incomeFromHouseProperty: ctx.num(`${LABEL.incomeFromHouseProperty}${suffix}`),
      exemptIncome: ctx.num(`Exempt Income(C)${suffix}`),
    }),
  );
  return { years };
}

function buildCreditCard(ctx: BuildContext): CreditCardSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "ccDtlId"),
    nameMatchInd: ctx.yn(
      "Is Credit card statement in the name of LA",
      "Credit card statement in the name of LA",
    ),
    isDefaulter: ctx.yn(LABEL.isLaDefaulter, "LA Defaulter in the Payment"),
    cardType: ctx.text("Type of Card"),
    creditLimit: ctx.num("Credit Limit"),
    incomeEarned: ctx.num(LABEL.incomeEarned),
    pointsEarned: ctx.num("Points Earned"),
  };
}

function buildFixedDepositReceipt(ctx: BuildContext): FixedDepositReceiptSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "fdDtlId"),
    nameMatchInd: ctx.yn("Is Fixed Deposit Receipt in the name of LA"),
    isMatured: ctx.yn("Is Fixed Deposit Receipts matured"),
    amountInvested: ctx.num("Amount Invested"),
    incomeEarned: ctx.num(LABEL.incomeEarned),
  };
}

function buildForm16(ctx: BuildContext): Form16SavePayload {
  const years = buildYears(
    ctx,
    ASSESSMENT_YEARS,
    (y, suffix, rawY): Form16YearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`, `Assessment${suffix}`) ||
        defaultAssessmentYear(y, 23),
      ...extractOptionalId(rawY, "form16DtlId"),
      grossSalaryPa: ctx.num(`${LABEL.grossSalaryPa}${suffix}`),
      companyName: ctx.text(`Company Name${suffix}`),
      panNumber: ctx.text(
        `Life Assured Pan No${suffix}`,
        `Life Assured PAN No${suffix}`,
        `Pan Number${suffix}`,
        `PAN Number${suffix}`,
      ),
      partyName: ctx.text(`${LABEL.lifeAssuredName}${suffix}`),
    }),
  );
  return {
    nameMatchInd: ctx.yn("Is Life Assured Name Same With Doc Name?"),
    years,
  };
}

function buildForm16a(ctx: BuildContext): Form16aSavePayload {
  const years = buildYears(
    ctx,
    ASSESSMENT_YEARS,
    (y, suffix, rawY): Form16aYearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`) ||
        defaultAssessmentYear(y, 23),
      ...extractOptionalId(rawY, "form16aDtlId"),
      netReceiptPa: ctx.num(`Net Receipt pa${suffix}`),
    }),
  );
  return { years };
}

function buildFormJ(ctx: BuildContext): FormJSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    FORM_J_MONTHS,
    (m, rawM): FormJMonthEntry => ({
      periodMonth: m,
      month: ctx.extra(`form_j-month-Month${m}`) || null,
      ...extractOptionalId(rawM, "formJDtlId"),
      receipts: Array.from(
        { length: FORM_J_RECEIPTS_PER_MONTH },
        (_, i): FormJReceiptEntry => ({
          index: i + 1,
          amount: ctx.num(`Month${m} Receipt${i + 1}`),
        }),
      ),
    }),
  );
  return {
    nameMatchInd: ctx.yn("Is Form J in the name of LA"),
    months,
  };
}

function buildGovtBonds(ctx: BuildContext): GovtBondsSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "govtBondDtlId"),
    nameMatchInd: ctx.yn("Is Bond Certification in the name of LA"),
    isMatured: ctx.yn("Is Bond Certificate matured"),
    amountInvested: ctx.num("Amount Invested or Maturity Value"),
    incomeEarned: ctx.num(LABEL.incomeEarned),
  };
}

function buildItrNonIndividual(ctx: BuildContext): ItrNonIndividualSavePayload {
  const years = buildYears(
    ctx,
    ASSESSMENT_YEARS,
    (y, suffix, rawY): ItrNonIndividualYearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`) ||
        defaultAssessmentYear(y, 23),
      metricIds: readMetricIds<ItrNonIndividualYearEntry["metricIds"]>(rawY),
      ackNumber: ctx.text(`${LABEL.itrAckNumber}${suffix}`),
      itrFilingDt: formatDateToISO(
        ctx.val(`${LABEL.itrFilingDate}${suffix}`) || readString(rawY.itrFilingDt),
      ),
      pfDeduction: parseNumber(rawY.pfDeduction ?? 0),
      panBarcodeMatchInd: ctx.yn(`${LABEL.panBarcodeMatch}${suffix}`),
      incomeFromSalary: ctx.num(`Income from Salary${suffix}`),
      incomeFromHouseProperty: ctx.num(`${LABEL.incomeFromHouseProperty}${suffix}`),
      incomeFromBusiness: ctx.num(`Income from Business or Profession${suffix}`),
      shortTermCapitalGains: ctx.num(`${LABEL.shortTermCapitalGains}${suffix}`),
      incomeFromOtherSources: ctx.num(`${LABEL.incomeFromOtherSources}${suffix}`),
      agriculturalIncome: ctx.num(`${LABEL.agriculturalIncome}${suffix}`),
      exemptIncome: ctx.num(`Exempt Income${suffix}`),
    }),
  );
  return {
    ...extractOptionalId(ctx.raw, "itrDtlId"),
    orgName: ctx.text(LABEL.organisationFirm),
    panNumber: ctx.text(LABEL.permanentAccountNumber),
    years,
  };
}

function buildItrIndividual(ctx: BuildContext): ItrIndividualSavePayload {
  const years = buildYears(
    ctx,
    ASSESSMENT_YEARS,
    (y, suffix, rawY): ItrIndividualYearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`) ||
        defaultAssessmentYear(y, 23),
      metricIds: readMetricIds<ItrIndividualYearEntry["metricIds"]>(rawY),
      partyName: ctx.text(`${LABEL.lifeAssuredName}${suffix}`),
      ackNumber: ctx.text(`${LABEL.itrAckNumber}${suffix}`),
      itrFilingDt: formatDateToISO(
        ctx.val(`${LABEL.itrFilingDate}${suffix}`) || readString(rawY.itrFilingDt),
      ),
      pfDeduction: ctx.num(`PF deduction - Salaried customers${suffix}`),
      panBarcodeMatchInd: ctx.yn(`${LABEL.panBarcodeMatch}${suffix}`),
      incomeFromSalary: ctx.num(`Income from Salary(A)${suffix}`),
      incomeFromHouseProperty: ctx.num(`${LABEL.incomeFromHouseProperty}${suffix}`),
      incomeFromBusiness: ctx.num(`Income from Business or Profession(B)${suffix}`),
      shortTermCapitalGains: ctx.num(`${LABEL.shortTermCapitalGains}${suffix}`),
      incomeFromOtherSources: ctx.num(`${LABEL.incomeFromOtherSources}${suffix}`),
      agriculturalIncome: ctx.num(`${LABEL.agriculturalIncome}${suffix}`),
      exemptIncome: ctx.num(`Exempt Income(C)${suffix}`),
    }),
  );
  return {
    ...extractOptionalId(ctx.raw, "itrDtlId"),
    orgName: ctx.text(LABEL.organisationFirm),
    panNumber: ctx.text(LABEL.permanentAccountNumber),
    nameMatchInd: ctx.yn(LABEL.isLifeAssuredNameSame),
    years,
  };
}

function buildLoanStatement(ctx: BuildContext): LoanStatementSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "loanStmtDtlId"),
    nameMatchInd: ctx.yn(
      "Is Loan Statements in the name of LA",
      "Loan Statements in the name of LA",
    ),
    isDefaulter: ctx.yn(LABEL.isLaDefaulter, "LA Defaulter in the Payment"),
    monthlyEmi: ctx.num("Monthly EMI as per Schedule"),
    incomeEarned: ctx.num(LABEL.incomeEarned),
  };
}

function buildMutualFund(ctx: BuildContext): MutualFundSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "mfDtlId"),
    nameMatchInd: ctx.yn("Is Mutual Fund Statement in the name of LA"),
    latestMarketValue: ctx.num("Latest Market Value (as per NAV) in Statement"),
    incomeEarned: ctx.num(LABEL.incomeEarned),
  };
}

function buildPensionStatement(ctx: BuildContext): PensionStatementSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "pensionDtlId"),
    totalMonthlyPension: ctx.num("Total Monthly Pension"),
  };
}

function buildProfitAndLoss(ctx: BuildContext): ProfitAndLossSavePayload {
  const years = buildYears(
    ctx,
    ASSESSMENT_YEARS,
    (y, suffix, rawY): ProfitAndLossYearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`) ||
        defaultAssessmentYear(y, 23),
      metricIds: readMetricIds<ProfitAndLossYearEntry["metricIds"]>(rawY),
      totalShareholdersFunds: ctx.text(
        `Total Shareholders Funds or Partner's Fund${suffix}`,
      ),
      shareCapital: ctx.num(`Share Capital or Fixed/Fluctuating Capital${suffix}`),
      reservesSurplus: ctx.num(`Reserves & Surplus${suffix}`),
      pbdt: ctx.num(`Profit Before Depreciation & Tax (PBDT)${suffix}`),
      depreciation: ctx.num(`Less : Depreciation${suffix}`),
      pbt: ctx.num(`Profit Before Tax (PBT)${suffix}`),
      tax: ctx.num(`Tax${suffix}`),
      profitAfterTax: ctx.num(`Profit After Tax (PAT)${suffix}`),
      sales: ctx.num(`Sales${suffix}`),
    }),
  );
  return {
    ...extractOptionalId(ctx.raw, "pnlDtlId"),
    orgName: ctx.text("Name of Organization/Firm"),
    years,
  };
}

function buildPropertyPurchase(ctx: BuildContext): PropertyPurchaseSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "propPurchDtlId"),
    isPurchasedByLa: ctx.yn("Is Property purchased by LA"),
    purchasePrice: ctx.num(LABEL.purchasePrice),
    financialYearOfPurchase: ctx.text("Financial Year of Purchase"),
    estimatedMarketValue: ctx.num("Estimated Market Value of Property"),
  };
}

function buildPropertyValuation(ctx: BuildContext): PropertyValuationSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "propValDtlId"),
    nameMatchInd: ctx.yn("Is Property Valuation Report in the name of LA"),
    estimatedMarketValue: ctx.num("Estimated Market Value of Property (as per report)"),
  };
}

function buildSalaryCertificate(ctx: BuildContext): SalaryCertificateSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "salCertDtlId"),
    grossSalaryPa: ctx.num(LABEL.grossSalaryPa),
  };
}

function buildSalaryRevisionLetter(ctx: BuildContext): SalaryRevisionLetterSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "salRevDtlId"),
    grossSalaryPa: ctx.num(LABEL.grossSalaryPa),
  };
}

function buildSalarySlips(ctx: BuildContext): SalarySlipsSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    MONTHS_PER_HALF_YEAR,
    (m, rawM): SalarySlipsMonthEntry => ({
      periodMonth: m,
      month: ctx.fieldMonth(`Gross Salary Pm${m}`),
      ...extractOptionalId(rawM, "salarySlipDtlId"),
      monthlyGrossSalary: ctx.num(`Gross Salary Pm${m}`, `Gross Salary Pm ${m}`),
    }),
  );
  return {
    companyName: ctx.text("Company Name"),
    partyName: ctx.text(LABEL.lifeAssuredName),
    pfUan: ctx.text("PF / UAN No"),
    nameMatchInd: ctx.yn(LABEL.isLifeAssuredNameSame),
    annualBonus: ctx.num("Annual Bonus/Incentive/Reimbursement"),
    months,
  };
}

function buildBankStatement(ctx: BuildContext): BankStatementSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    MONTHS_PER_HALF_YEAR,
    (m, rawM): BankStatementMonthEntry => ({
      periodMonth: m,
      month: ctx.fieldMonth(`Monthly Closing Bal ${m}`),
      ...extractOptionalId(rawM, "bankStmtDtlId"),
      closingBalance: ctx.num(`Monthly Closing Bal ${m}`),
    }),
  );
  return {
    fullName: ctx.text(LABEL.lifeAssuredName),
    nameMatchInd: ctx.yn(LABEL.isLaNameMatch),
    statementPeriod: ctx.text(LABEL.statementPeriod),
    openingBalance: ctx.num(LABEL.openingBalance),
    liPremiumDeductionInd: ctx.yn("Life Insurance Premium Deduction Entry"),
    wineBeerEntriesInd: ctx.yn("Wine Beer_Entries"),
    medEntryInd: ctx.yn("Med Entry"),
    latest6MonthsInd: ctx.yn("Latest 6 months statements given"),
    overdraftInd: ctx.yn("Any Overdraft(Negative/Debit) Balances"),
    months,
  };
}

function buildStockHolding(ctx: BuildContext): StockHoldingSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "stockDtlId"),
    nameMatchInd: ctx.yn("Is Stock Holding Stmt in name of LA/his Business"),
    estimatedMarketValue: ctx.num("Gross Total Market Value as per the Stmt"),
    incomeEarned: ctx.num(LABEL.incomeEarned),
  };
}

function buildVehicleOwnership(ctx: BuildContext): VehicleOwnershipSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "vehicleDtlId"),
    isRegNameLa: ctx.yn("Is Registration Papers in the name of LA"),
    isInvoiceNameLa: ctx.yn("Is Purchase invoices in the name of LA"),
    purchasePrice: ctx.num(LABEL.purchasePrice),
    vehicleRcNumber: ctx.text("Vehicle RC Number"),
  };
}

function buildVahan(ctx: BuildContext): VahanSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "vahanDtlId"),
    isRegNameLa: ctx.yn("Is Registration Papers in the Name of LA"),
    isInvoiceNameLa: ctx.yn("Is Purchase Invoices in the Name of LA"),
    carRcNumber: ctx.text("Car RC Number"),
    idv: ctx.num("IDV"),
  };
}

function buildSipStatement(ctx: BuildContext): SipStatementSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    MONTHS_PER_HALF_YEAR,
    (m, rawM): SipStatementMonthEntry => ({
      periodMonth: m,
      month: ctx.fieldMonth(SIP_AMOUNT_LABELS[m - 1]),
      ...extractOptionalId(rawM, "sipDtlId"),
      sipAmount: ctx.num(SIP_AMOUNT_LABELS[m - 1]),
    }),
  );
  return {
    isLaNameSame: ctx.yn("Is SIP Statements in the Name of LA"),
    latest6MonthsInd: ctx.yn("Latest 6 Months SIP Statements Given"),
    months,
  };
}

function buildGstIncome(ctx: BuildContext): GstIncomeSavePayload {
  const years = buildYears(
    ctx,
    GST_ASSESSMENT_YEARS,
    (y, suffix, rawY): GstIncomeYearEntry => ({
      assessmentYear:
        ctx.val(`${LABEL.assessmentYear}${suffix}`) ||
        defaultAssessmentYear(y, 22),
      ...extractOptionalId(rawY, "gstIncomeDtlId"),
      grossSales: ctx.num(`Gross Sales${suffix}`),
      grossPurchases: ctx.num(`Gross Purchases${suffix}`),
      profitAfterGst: ctx.num(`Profit After GST${suffix}`),
    }),
  );
  return { years };
}

function buildBankStatementSalaryCredit(
  ctx: BuildContext,
): BankStatementSalaryCreditSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    MONTHS_PER_HALF_YEAR,
    (m, rawM): BankStatementSalaryCreditMonthEntry => ({
      periodMonth: m,
      month: ctx.extra(`bank_statement_salary_credit-entry-month-${m}`) || null,
      ...extractOptionalId(rawM, "bankSalCrDtlId"),
      netSalaryCredited: parseNumber(
        ctx.extra(`bank_statement_salary_credit-entry-income-${m}`) ||
          ctx.val(`Net Salary Credited PM${m}`, `Net Salary Credited PM ${m}`),
      ),
    }),
  );
  return {
    fullName: ctx.text(LABEL.lifeAssuredName),
    nameMatchInd: ctx.yn(LABEL.isLaNameMatch),
    salaryCreditedInd: ctx.yn("Salary Credited"),
    annualBonus: ctx.num("Annual Bonus /Incentive /Reimbursement"),
    openingBalance: ctx.num(LABEL.openingBalance),
    closingBalance: ctx.num("Closing Balance"),
    statementPeriod: ctx.text(LABEL.statementPeriod),
    months,
  };
}

function buildEpfBasic(ctx: BuildContext): EpfBasicSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "epfDtlId"),
    orgName: ctx.text(LABEL.latestOrganizationName),
    isOrgNameSame: ctx.yn(LABEL.isOrganizationNameSame),
    income: ctx.num("Income"),
  };
}

function buildEpfAdvanced(ctx: BuildContext): EpfAdvancedSavePayload {
  const months = buildEntries(
    ctx,
    "months",
    MONTHS_PER_HALF_YEAR,
    (m, rawM): EpfAdvancedMonthEntry => ({
      periodMonth: m,
      month: ctx.extra(`epf_advanced-entry-month-${m}`) || null,
      ...extractOptionalId(rawM, "epfDtlId"),
      pfContribution: parseNumber(
        ctx.extra(`epf_advanced-entry-income-${m}`) || ctx.val(`Month ${m}`),
      ),
    }),
  );
  return {
    orgName: ctx.text(LABEL.latestOrganizationName),
    isOrgNameSame: ctx.yn(LABEL.isOrganizationNameSame),
    months,
  };
}

function buildEmployeeIdCard(ctx: BuildContext): EmployeeIdCardSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "empIdCardDtlId"),
    companyName: ctx.text("Name of the company"),
    employeeName: ctx.text("Name of the employee"),
    employeeNumber: ctx.text("Employee number"),
    photoAvailableInd: ctx.yn("Photo available"),
  };
}

function buildDecision(ctx: BuildContext): DecisionSavePayload {
  return {
    ...extractOptionalId(ctx.raw, "decisionDtlId"),
    verifiedIncomeDoc: readString(ctx.raw.verifiedIncomeDoc) ?? "salary_slips",
    verifiedIncome: ctx.num("Verified Income"),
    justification:
      readString(ctx.raw.justification) ?? "Income verified from submitted documents",
    decisionCode:
      ctx.val("Financial Decision") ||
      readString(ctx.raw.decisionCode) ||
      "financially eligible",
  };
}

function buildFinancialProfession(ctx: BuildContext): FinancialProfessionSavePayload {
  return {
    occupation: ctx.text("Occupation"),
    annualIncome: ctx.num("Annual Income"),
    gstin: ctx.text("GSTIN"),
    industryType: ctx.text("Industry Type"),
    employmentType: ctx.text("Employment Type"),
    educationType: ctx.text("Education Type"),
    organisationType: ctx.text("Organisation Type"),
    organisationName: ctx.text("Organisation Name"),
    designation: ctx.text("Designation"),
  };
}

function buildCreditBureauDetails(ctx: BuildContext): CreditBureauDetailsSavePayload {
  return {
    experianIncome: ctx.num("Experian Income"),
    experianScore: ctx.num("Experian Score"),
    crifIncome: ctx.num("Crif Income"),
    crifScore: ctx.num("Crif Score"),
    cibilIncome: ctx.num("Cibil Income"),
    cibilScore: ctx.num("Cibil Score"),
    imputedIncome: ctx.num("Imputed Income"),
    digitalIncome: ctx.num("Digital Income"),
    payuIncome: ctx.num("PayU Income"),
    averageIncome: ctx.num("Average Income"),
  };
}

/** Sections without a dedicated builder send every field keyed by its label. */
function buildGenericDocument(
  section: FinancialSection,
  values: FieldValues,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [label] of section.fields) {
    result[label] = getVal(values, section, label);
  }
  return result;
}

const DOCUMENT_BUILDERS = new Map<string, DocumentBuilder>([
  ["appointment_letter", buildAppointmentLetter],
  ["commission_statement", buildCommissionStatement],
  ["computation_of_income", buildComputationOfIncome],
  ["credit_card", buildCreditCard],
  ["fixed_deposit_receipt", buildFixedDepositReceipt],
  ["form16", buildForm16],
  ["form16a", buildForm16a],
  ["form_j", buildFormJ],
  ["govt_bonds", buildGovtBonds],
  ["itr_non_individual", buildItrNonIndividual],
  ["itr_individual", buildItrIndividual],
  ["loan_statement", buildLoanStatement],
  ["mutual_fund", buildMutualFund],
  ["pension_statement", buildPensionStatement],
  ["profit_and_loss", buildProfitAndLoss],
  ["property_purchase", buildPropertyPurchase],
  ["property_valuation", buildPropertyValuation],
  ["salary_certificate", buildSalaryCertificate],
  ["salary_revision_letter", buildSalaryRevisionLetter],
  ["salary_slips", buildSalarySlips],
  ["bank_statement", buildBankStatement],
  ["stock_holding", buildStockHolding],
  ["vehicle_ownership", buildVehicleOwnership],
  ["vahan", buildVahan],
  ["sip_statement", buildSipStatement],
  ["gst_income", buildGstIncome],
  ["bank_statement_salary_credit", buildBankStatementSalaryCredit],
  ["epf_basic", buildEpfBasic],
  ["epf_advanced", buildEpfAdvanced],
  ["employee_id_card", buildEmployeeIdCard],
  ["decision", buildDecision],
  ["bre_financial_decision", buildDecision],
  ["financial_profession", buildFinancialProfession],
  ["credit_bureau_details", buildCreditBureauDetails],
]);

export function buildDocumentPayload(
  sectionKey: string,
  section: FinancialSection,
  values: FieldValues,
): unknown {
  const builder = DOCUMENT_BUILDERS.get(sectionKey);
  if (!builder) return buildGenericDocument(section, values);
  return builder(createContext(section, values));
}

export interface BuildFinancialSaveRequestOptions {
  applicationNumber: string;
  partyId: string;
  createdBy?: string;
  updatedBy?: string;
  section: FinancialSection;
  values: FieldValues;
}

/**
 * Creates the individual document Save API request payload and logs it to the console.
 */
export function buildFinancialSaveRequest({
  applicationNumber,
  partyId,
  createdBy,
  updatedBy,
  section,
  values,
}: BuildFinancialSaveRequestOptions): FinancialSaveRequest {
  const sessionUsername = getSessionUser()?.username?.trim() || "";
  const docPayload = buildDocumentPayload(section.key, section, values);

  const request: FinancialSaveRequest = {
    applicationNumber,
    partyId,
    createdBy: createdBy ?? sessionUsername,
    updatedBy: updatedBy ?? sessionUsername,
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
