import { z } from "zod";
import { RegexPatterns } from "@insurance-poc/utils";

/**
 * Field-level validation schemas for the Financial module, one per section.
 * Section keys match `FINANCIAL_SECTIONS[].key` in `financial.config.ts`.
 *
 * Mandatory fields reject an empty string; optional fields accept it.
 * The UI binds to these schemas through `validateFinancialField` and
 * `isFinancialFieldRequired`.
 */

/** Free text: alpha, numeric and special characters. */
const freeText = z.string();

const requiredDate = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required.`)
    .refine(
      (value) => value === "" || RegexPatterns.dateDDMMYYYY.test(value),
      `${fieldName} must be in DD/MM/YYYY format.`,
    )
    .refine((value) => {
      const match = RegexPatterns.dateDDMMYYYY.exec(value);
      if (!match) return true; // reported by the format check above
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    }, `${fieldName} is not a valid date.`)
    .refine((value) => {
      const match = RegexPatterns.dateDDMMYYYY.exec(value);
      if (!match) return true; // reported by the format check above
      const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today;
    }, `${fieldName} cannot be a future date.`);

/** Optional date: blank is accepted, anything entered must pass the same checks as `requiredDate`. */
const optionalDate = (fieldName: string) => {
  const required = requiredDate(fieldName);
  return z
    .string()
    .superRefine((value, ctx) => {
      if (value === "") return;
      const result = z.safeParse(required, value);
      if (!result.success) {
        ctx.addIssue({ code: "custom", message: result.error.issues[0]?.message ?? `${fieldName} is not valid.` });
      }
    })
    .optional();
};

const requiredNumeric = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required.`)
    .regex(RegexPatterns.numeric, `${fieldName} must contain numbers only.`);

/** Optional numeric: blank is accepted, anything entered must be numeric. */
const optionalNumeric = (fieldName: string) =>
  z
    .string()
    .refine((value) => value === "" || RegexPatterns.numeric.test(value), `${fieldName} must contain numbers only.`)
    .optional();

/** Optional alphanumeric (letters and digits, no spaces): blank is accepted. */
const optionalAlphanumeric = (fieldName: string) =>
  z
    .string()
    .refine(
      (value) => value === "" || RegexPatterns.alphanumeric.test(value),
      `${fieldName} must contain letters and numbers only.`,
    )
    .optional();

/** Optional year (YYYY): blank is accepted, anything entered must be a 4-digit year. */
const optionalYear = (fieldName: string) =>
  z
    .string()
    .refine((value) => value === "" || RegexPatterns.year.test(value), `${fieldName} must be a 4-digit year (YYYY).`)
    .optional();

/** Required year (YYYY). */
const requiredYear = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required. Please enter a 4-digit year (YYYY).`)
    .regex(RegexPatterns.year, `${fieldName} must be a 4-digit year (YYYY).`);

/** Optional Yes/No dropdown: blank, "Yes" or "No". */
const optionalYesNo = (fieldName: string) =>
  z
    .string()
    .refine((value) => value === "" || value === "Yes" || value === "No", `${fieldName} must be Yes or No.`)
    .optional();

/** Required Yes/No dropdown. */
const requiredYesNo = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required. Please select Yes or No.`)
    .refine((value) => value === "" || value === "Yes" || value === "No", `${fieldName} must be Yes or No.`);

/** Required text that may contain letters (and single spaces between words) only. */
const requiredAlphabets = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required.`)
    .regex(RegexPatterns.alphabets, `${fieldName} must contain alphabets only.`);

/** Required free text (any characters). */
const requiredFreeText = (fieldName: string) => z.string().min(1, `${fieldName} is required.`);

/** Required assessment year range, "XXXX-XX". */
const requiredAssessmentYear = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required. Please enter it in the format XXXX-XX.`)
    .regex(RegexPatterns.assessmentYear, `${fieldName} must be in the format XXXX-XX (for example, 2025-26).`);

/** Optional assessment year range: blank is accepted, anything entered must be "XXXX-XX". */
const optionalAssessmentYear = (fieldName: string) =>
  z
    .string()
    .refine(
      (value) => value === "" || RegexPatterns.assessmentYear.test(value),
      `${fieldName} must be in the format XXXX-XX (for example, 2025-26).`,
    )
    .optional();

/** Required alphanumeric (letters and digits, no spaces). */
const requiredAlphanumeric = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required.`)
    .regex(RegexPatterns.alphanumeric, `${fieldName} must contain letters and numbers only.`);

/** Required PAN (ABCDE1234F). */
const requiredPan = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required.`)
    .regex(RegexPatterns.pan, `${fieldName} must be a valid PAN (5 capital letters, 4 digits, 1 capital letter, e.g. ABCDE1234F).`);

/** Optional PAN: blank is accepted, anything entered must be a valid PAN. */
const optionalPan = (fieldName: string) =>
  z
    .string()
    .refine(
      (value) => value === "" || RegexPatterns.pan.test(value),
      `${fieldName} must be a valid PAN (5 capital letters, 4 digits, 1 capital letter, e.g. ABCDE1234F).`,
    )
    .optional();

/** Optional alphabets (letters and single spaces): blank is accepted. */
const optionalAlphabets = (fieldName: string) =>
  z
    .string()
    .refine((value) => value === "" || RegexPatterns.alphabets.test(value), `${fieldName} must contain alphabets only.`)
    .optional();

/** Dropdown that must have a selection. */
const requiredSelect = (fieldName: string) => z.string().min(1, `${fieldName} is required. Please select a value.`);

/** Appointment Letter / Contract of Employer */
export const appointmentLetterSchema = z.object({
  nameOfTheCompany: freeText.optional(),
  nameOfTheEmployee: freeText.optional(),
  joiningDate: requiredDate("Joining date"),
  ctc: requiredNumeric("CTC"),
});

export type AppointmentLetterValues = z.infer<typeof appointmentLetterSchema>;

/** Commission Statement */
export const commissionStatementSchema = z.object({
  month1: requiredSelect("Month 1"),
  month2: freeText.optional(),
  month3: freeText.optional(),
  month4: freeText.optional(),
  month5: freeText.optional(),
  month6: freeText.optional(),
  incomeForMonth1: requiredNumeric("Income for Month 1"),
  incomeForMonth2: freeText.optional(),
  incomeForMonth3: freeText.optional(),
  incomeForMonth4: freeText.optional(),
  incomeForMonth5: freeText.optional(),
  incomeForMonth6: freeText.optional(),
  averageCommissionPm: freeText.optional(),
  averageAnnualIncome: freeText.optional(),
});

export type CommissionStatementValues = z.infer<typeof commissionStatementSchema>;

/** Credit Cards ("Derived Income" and "Average Income" are locked, auto-calculated fields). */
export const creditCardSchema = z.object({
  statementInNameOfLa: optionalYesNo("Credit card statement in the name of LA"),
  laDefaulterInPayment: optionalYesNo("LA Defaulter in the Payment"),
  typeOfCard: freeText.optional(),
  creditLimit: requiredNumeric("Credit Limit"),
  pointsEarned: optionalNumeric("Points Earned"),
  incomeEarned: optionalNumeric("Income Earned"),
  derivedIncome: freeText.optional(),
  averageIncome: freeText.optional(),
});

export type CreditCardValues = z.infer<typeof creditCardSchema>;

/** Fixed Deposit Receipt ("Derived Income" and "Average Income" are locked, auto-calculated fields). */
export const fixedDepositReceiptSchema = z.object({
  receiptInNameOfLa: optionalYesNo("Fixed Deposit Receipt in the name of LA"),
  receiptsMatured: optionalYesNo("Fixed Deposit Receipts matured"),
  amountInvested: requiredNumeric("Amount Invested"),
  incomeEarned: optionalNumeric("Income Earned"),
  derivedIncome: freeText.optional(),
  averageIncome: freeText.optional(),
});

export type FixedDepositReceiptValues = z.infer<typeof fixedDepositReceiptSchema>;

/**
 * FORM J. "Month1" to "Month3" are the month dropdowns of the receipts table; the receipt
 * cells are "MonthN ReceiptM". The four summary fields are locked, auto-calculated fields.
 */
export const formJSchema = z.object({
  inNameOfLa: optionalYesNo("Form J in the name of LA"),
  month1: requiredSelect("Month 1"),
  month2: freeText.optional(),
  month3: freeText.optional(),
  month1Receipt1: requiredNumeric("Month 1 Receipt 1"),
  month1Receipt2: optionalNumeric("Month 1 Receipt 2"),
  month1Receipt3: optionalNumeric("Month 1 Receipt 3"),
  month1Receipt4: optionalNumeric("Month 1 Receipt 4"),
  month1Receipt5: optionalNumeric("Month 1 Receipt 5"),
  month1Receipt6: optionalNumeric("Month 1 Receipt 6"),
  month2Receipt1: optionalNumeric("Month 2 Receipt 1"),
  month2Receipt2: optionalNumeric("Month 2 Receipt 2"),
  month2Receipt3: optionalNumeric("Month 2 Receipt 3"),
  month2Receipt4: optionalNumeric("Month 2 Receipt 4"),
  month2Receipt5: optionalNumeric("Month 2 Receipt 5"),
  month2Receipt6: optionalNumeric("Month 2 Receipt 6"),
  month3Receipt1: optionalNumeric("Month 3 Receipt 1"),
  month3Receipt2: optionalNumeric("Month 3 Receipt 2"),
  month3Receipt3: optionalNumeric("Month 3 Receipt 3"),
  month3Receipt4: optionalNumeric("Month 3 Receipt 4"),
  month3Receipt5: optionalNumeric("Month 3 Receipt 5"),
  month3Receipt6: optionalNumeric("Month 3 Receipt 6"),
  totalReceipts: freeText.optional(),
  averageMonthlyReceipts: freeText.optional(),
  annualReceipts: freeText.optional(),
  derivedIncome: freeText.optional(),
});

export type FormJValues = z.infer<typeof formJSchema>;

/** Govt. Of India Bonds ("Derived Income" and "Average Income" are locked, auto-calculated fields). */
export const govtBondsSchema = z.object({
  certificationInNameOfLa: optionalYesNo("Bond Certification in the name of LA"),
  certificateMatured: optionalYesNo("Bond Certificate matured"),
  amountInvestedOrMaturityValue: requiredNumeric("Amount Invested or Maturity Value"),
  incomeEarned: optionalNumeric("Income Earned"),
  derivedIncome: freeText.optional(),
  averageIncome: freeText.optional(),
});

export type GovtBondsValues = z.infer<typeof govtBondsSchema>;

/** Loan Statements ("Derived Income" and "Average Income" are locked, auto-calculated fields). */
export const loanStatementSchema = z.object({
  statementInNameOfLa: optionalYesNo("Loan Statements in the name of LA"),
  laDefaulterInPayment: optionalYesNo("LA Defaulter in the Payment"),
  monthlyEmiAsPerSchedule: requiredNumeric("Monthly EMI as per Schedule"),
  incomeEarned: optionalNumeric("Income Earned"),
  derivedIncome: freeText.optional(),
  averageIncome: freeText.optional(),
});

export type LoanStatementValues = z.infer<typeof loanStatementSchema>;

/** Mutual Fund A/C Statement ("Derived Income" and "Average Income" are locked, auto-calculated fields). */
export const mutualFundSchema = z.object({
  statementInNameOfLa: optionalYesNo("Mutual Fund Statement in the name of LA"),
  latestMarketValue: requiredNumeric("Latest Market Value (as per NAV) in Statement"),
  incomeEarned: optionalNumeric("Income Earned"),
  derivedIncome: freeText.optional(),
  averageIncome: freeText.optional(),
});

export type MutualFundValues = z.infer<typeof mutualFundSchema>;

/** Pension Statement ("Pension Received pa" is a locked, auto-calculated field). */
export const pensionStatementSchema = z.object({
  totalMonthlyPension: requiredNumeric("Total Monthly Pension"),
  pensionReceivedPa: freeText.optional(),
});

export type PensionStatementValues = z.infer<typeof pensionStatementSchema>;

/** Property Purchase Documents ("Derived Income" is a locked, auto-calculated field). */
export const propertyPurchaseSchema = z.object({
  purchasedByLa: optionalYesNo("Property purchased by LA"),
  purchasePrice: requiredNumeric("Purchase Price"),
  financialYearOfPurchase: optionalYear("Financial Year of Purchase"),
  estimatedMarketValue: optionalNumeric("Estimated Market Value of Property"),
  derivedIncome: freeText.optional(),
});

export type PropertyPurchaseValues = z.infer<typeof propertyPurchaseSchema>;

/** Property Valuation Report ("Derived Income" is a locked, auto-calculated field). */
export const propertyValuationSchema = z.object({
  reportInNameOfLa: optionalYesNo("Property Valuation Report in the name of LA"),
  estimatedMarketValue: requiredNumeric("Estimated Market Value of Property (as per report)"),
  derivedIncome: freeText.optional(),
});

export type PropertyValuationValues = z.infer<typeof propertyValuationSchema>;

/** Salary Certificate ("Derived Income" is a locked, auto-calculated field). */
export const salaryCertificateSchema = z.object({
  grossSalaryPa: requiredNumeric("Gross Salary PA"),
  derivedIncome: freeText.optional(),
});

export type SalaryCertificateValues = z.infer<typeof salaryCertificateSchema>;

/** Salary Revision Letter ("Derived Income" is a locked, auto-calculated field). */
export const salaryRevisionLetterSchema = z.object({
  grossSalaryPa: requiredNumeric("Gross Salary PA"),
  derivedIncome: freeText.optional(),
});

export type SalaryRevisionLetterValues = z.infer<typeof salaryRevisionLetterSchema>;

/**
 * Salary Slips. The "Month N" dropdown next to each gross salary field is stored as
 * `<field id>-month`; month 1 to 3 are mandatory and month 4 to 6 are optional.
 * "Average Salary pm", "Gross Salary pa" and "Average Annual Income" are locked, auto-calculated fields.
 */
export const salarySlipsSchema = z.object({
  month1: requiredSelect("Month 1"),
  month2: requiredSelect("Month 2"),
  month3: requiredSelect("Month 3"),
  month4: freeText.optional(),
  month5: freeText.optional(),
  month6: freeText.optional(),
  grossSalaryPm1: requiredNumeric("Gross Salary Pm1"),
  grossSalaryPm2: requiredNumeric("Gross Salary Pm2"),
  grossSalaryPm3: requiredNumeric("Gross Salary Pm3"),
  grossSalaryPm4: optionalNumeric("Gross Salary Pm4"),
  grossSalaryPm5: optionalNumeric("Gross Salary Pm5"),
  grossSalaryPm6: optionalNumeric("Gross Salary Pm6"),
  averageSalaryPm: freeText.optional(),
  grossSalaryPa: freeText.optional(),
  annualBonus: optionalNumeric("Annual Bonus/Incentive/Reimbursement"),
  averageAnnualIncome: freeText.optional(),
  companyName: requiredAlphabets("Company Name"),
  lifeAssuredName: requiredAlphabets("Life Assured Name"),
  lifeAssuredNameSame: requiredYesNo("Is Life Assured Name Same?"),
  pfUanNo: optionalNumeric("PF / UAN No"),
});

export type SalarySlipsValues = z.infer<typeof salarySlipsSchema>;

/**
 * Savings A/C & Current A/C Bank Statements. The "Month N" dropdown next to each
 * "Monthly Closing Bal N" field is stored as `<field id>-month`. "Average Bank Balance" and
 * "Average Annual income" are locked, auto-calculated fields.
 */
export const bankStatementSchema = z.object({
  inNameOfLaOrBusiness: requiredYesNo("Is Bank Statement in the name of LA/his Business"),
  latestSixMonthsGiven: requiredYesNo("Latest 6 months statements given"),
  anyOverdraftBalances: requiredYesNo("Any Overdraft(Negative/Debit) Balances"),
  month1: requiredSelect("Month 1"),
  month2: requiredSelect("Month 2"),
  month3: requiredSelect("Month 3"),
  month4: requiredSelect("Month 4"),
  month5: requiredSelect("Month 5"),
  month6: requiredSelect("Month 6"),
  monthlyClosingBal1: requiredNumeric("Monthly Closing Bal 1"),
  monthlyClosingBal2: requiredNumeric("Monthly Closing Bal 2"),
  monthlyClosingBal3: requiredNumeric("Monthly Closing Bal 3"),
  monthlyClosingBal4: requiredNumeric("Monthly Closing Bal 4"),
  monthlyClosingBal5: requiredNumeric("Monthly Closing Bal 5"),
  monthlyClosingBal6: requiredNumeric("Monthly Closing Bal 6"),
  averageBankBalance: freeText.optional(),
  averageAnnualIncome: freeText.optional(),
  openingBalance: requiredNumeric("Opening Balance"),
  statementPeriod: requiredDate("Statement Period"),
  lifeAssuredName: requiredAlphabets("Life Assured Name"),
  laNameMatchesDocName: requiredYesNo("Is LA Name Match with Doc Name?"),
  lifeInsurancePremiumDeduction: optionalNumeric("Life Insurance Premium Deduction Entry"),
  wineBeerEntries: optionalNumeric("Wine Beer_Entries"),
  medEntry: optionalNumeric("Med Entry"),
});

export type BankStatementValues = z.infer<typeof bankStatementSchema>;

/** Stock Holding Statement ("Derived Income" and "Average Income" are locked, auto-calculated fields). */
export const stockHoldingSchema = z.object({
  inNameOfLaOrBusiness: optionalYesNo("Stock Holding Statement in name of LA/his Business"),
  grossTotalMarketValue: requiredNumeric("Gross Total Market Value as per the Stmt"),
  incomeEarned: optionalNumeric("Income Earned"),
  derivedIncome: freeText.optional(),
  averageIncome: freeText.optional(),
});

export type StockHoldingValues = z.infer<typeof stockHoldingSchema>;

/** Vehicle Ownership Papers ("Derived Income" is a locked, auto-calculated field). */
export const vehicleOwnershipSchema = z.object({
  registrationPapersInNameOfLa: optionalYesNo("Registration Papers in the name of LA"),
  purchaseInvoicesInNameOfLa: optionalYesNo("Purchase invoices in the name of LA"),
  purchasePrice: requiredNumeric("Purchase Price"),
  vehicleRcNumber: optionalAlphanumeric("Vehicle RC Number"),
  derivedIncome: freeText.optional(),
});

export type VehicleOwnershipValues = z.infer<typeof vehicleOwnershipSchema>;

/** Vahan ("Average Annual Income" is a locked, auto-calculated field). */
export const vahanSchema = z.object({
  registrationPapersInNameOfLa: requiredYesNo("Registration Papers in the Name of LA"),
  purchaseInvoicesInNameOfLa: requiredYesNo("Purchase Invoices in the Name of LA"),
  carRcNumber: optionalAlphanumeric("Car RC Number"),
  idv: requiredNumeric("IDV"),
  averageAnnualIncome: freeText.optional(),
});

export type VahanValues = z.infer<typeof vahanSchema>;

/**
 * SIP Statement. The "Month N" dropdown next to each "SIP Per Month N" field is stored as
 * `<field id>-month`. The "SIP of MonthN" labels in the section config are display labels only
 * (they hold no value), so they are intentionally not mapped. "Average Monthly SIP" and
 * "Average Annual Income" are locked, auto-calculated fields.
 */
export const sipStatementSchema = z.object({
  latestSixMonthsGiven: requiredYesNo("Latest 6 Months SIP Statements Given"),
  inNameOfLa: requiredYesNo("Is SIP Statements in the Name of LA"),
  month1: requiredSelect("Month 1"),
  month2: requiredSelect("Month 2"),
  month3: requiredSelect("Month 3"),
  month4: requiredSelect("Month 4"),
  month5: requiredSelect("Month 5"),
  month6: requiredSelect("Month 6"),
  sipPerMonth1: requiredNumeric("SIP of Month 1"),
  sipPerMonth2: requiredNumeric("SIP of Month 2"),
  sipPerMonth3: requiredNumeric("SIP of Month 3"),
  sipPerMonth4: requiredNumeric("SIP of Month 4"),
  sipPerMonth5: requiredNumeric("SIP of Month 5"),
  sipPerMonth6: requiredNumeric("SIP of Month 6"),
  averageMonthlySip: freeText.optional(),
  averageAnnualIncome: freeText.optional(),
});

export type SipStatementValues = z.infer<typeof sipStatementSchema>;

/**
 * Bank Statement with Salary Credit Details. The month/amount rows are rendered as a table, so
 * they are keyed "Month N" and "Income for Month N" (the section's "Net Salary Month N" and
 * "Net Salary Credited PM N" fields are not rendered as fields and are intentionally not mapped).
 * "Average Net Salary Credited PM", "Net Salary Credited PA" and "Average Annual Income" are
 * locked, auto-calculated fields.
 */
export const bankStatementSalaryCreditSchema = z.object({
  inNameOfLa: requiredYesNo("Is Bank Statement in the Name of LA"),
  month1: requiredSelect("Net Salary Month 1"),
  month2: requiredSelect("Net Salary Month 2"),
  month3: requiredSelect("Net Salary Month 3"),
  month4: freeText.optional(),
  month5: freeText.optional(),
  month6: freeText.optional(),
  incomeForMonth1: requiredNumeric("Net Salary Credited PM1"),
  incomeForMonth2: requiredNumeric("Net Salary Credited PM2"),
  incomeForMonth3: requiredNumeric("Net Salary Credited PM3"),
  incomeForMonth4: optionalNumeric("Net Salary Credited PM4"),
  incomeForMonth5: optionalNumeric("Net Salary Credited PM5"),
  incomeForMonth6: optionalNumeric("Net Salary Credited PM6"),
  averageNetSalaryCreditedPm: freeText.optional(),
  netSalaryCreditedPa: freeText.optional(),
  averageAnnualIncome: freeText.optional(),
  annualBonus: optionalNumeric("Annual Bonus /Incentive /Reimbursement"),
  salaryCredited: optionalNumeric("Salary Credited"),
  closingBalance: optionalNumeric("Closing Balance"),
  lifeAssuredName: requiredAlphabets("Life Assured Name"),
  openingBalance: requiredNumeric("Opening Balance"),
  statementPeriod: requiredYear("Statement Period"),
  laNameMatchesDocName: requiredYesNo("Is LA Name Match with Doc Name?"),
});

export type BankStatementSalaryCreditValues = z.infer<typeof bankStatementSalaryCreditSchema>;

/** Employee Provident Fund - Basic. */
export const epfBasicSchema = z.object({
  latestOrganizationName: requiredAlphabets("Latest Organization Name"),
  organizationNameSame: requiredYesNo("Is Organization Name Same?"),
  income: requiredNumeric("Income"),
});

export type EpfBasicValues = z.infer<typeof epfBasicSchema>;

/** Employee Provident Fund - Advanced ("Annual Income" is a locked, auto-calculated field). */
export const epfAdvancedSchema = z.object({
  latestOrganizationName: requiredAlphabets("Latest Organization Name"),
  organizationNameSame: requiredYesNo("Is Organization Name Same?"),
  pfContributionM1: requiredNumeric("PF Contribution M1"),
  pfContributionM2: requiredNumeric("PF Contribution M2"),
  pfContributionM3: requiredNumeric("PF Contribution M3"),
  pfContributionM4: requiredNumeric("PF Contribution M4"),
  pfContributionM5: requiredNumeric("PF Contribution M5"),
  pfContributionM6: requiredNumeric("PF Contribution M6"),
  annualIncome: freeText.optional(),
});

export type EpfAdvancedValues = z.infer<typeof epfAdvancedSchema>;

/** Employee ID Card. */
export const employeeIdCardSchema = z.object({
  nameOfTheCompany: requiredFreeText("Name of the company"),
  nameOfTheEmployee: requiredFreeText("Name of the employee"),
  employeeNumber: requiredAlphanumeric("Employee number"),
  photoAvailable: requiredYesNo("Photo available"),
});

export type EmployeeIdCardValues = z.infer<typeof employeeIdCardSchema>;

/**
 * Computation Of Income. Each row has three years; Year 1 and Year 2 are mandatory (where the
 * row is mandatory) and Year 3 is optional. The "Gross Total Income" rows and the two totals are
 * locked, auto-calculated fields.
 */
export const computationOfIncomeSchema = z.object({
  assessmentYear1: requiredAssessmentYear("Assessment Year (Year 1)"),
  assessmentYear2: requiredAssessmentYear("Assessment Year (Year 2)"),
  assessmentYear3: optionalAssessmentYear("Assessment Year (Year 3)"),
  incomeFromSalary1: requiredNumeric("Income from Salary(A) (Year 1)"),
  incomeFromSalary2: requiredNumeric("Income from Salary(A) (Year 2)"),
  incomeFromSalary3: optionalNumeric("Income from Salary(A) (Year 3)"),
  incomeFromHouseProperty1: optionalNumeric("Income from House Property (Year 1)"),
  incomeFromHouseProperty2: optionalNumeric("Income from House Property (Year 2)"),
  incomeFromHouseProperty3: optionalNumeric("Income from House Property (Year 3)"),
  incomeFromBusiness1: requiredNumeric("Income from Business or Profession (B) (Year 1)"),
  incomeFromBusiness2: requiredNumeric("Income from Business or Profession (B) (Year 2)"),
  incomeFromBusiness3: optionalNumeric("Income from Business or Profession (B) (Year 3)"),
  capitalGains1: optionalNumeric("Short term & Capital Gains (Year 1)"),
  capitalGains2: optionalNumeric("Short term & Capital Gains (Year 2)"),
  capitalGains3: optionalNumeric("Short term & Capital Gains (Year 3)"),
  incomeFromOtherSources1: optionalNumeric("Income from Other Sources (Year 1)"),
  incomeFromOtherSources2: optionalNumeric("Income from Other Sources (Year 2)"),
  incomeFromOtherSources3: optionalNumeric("Income from Other Sources (Year 3)"),
  agriculturalIncome1: optionalNumeric("Agricultural Income (Year 1)"),
  agriculturalIncome2: optionalNumeric("Agricultural Income (Year 2)"),
  agriculturalIncome3: optionalNumeric("Agricultural Income (Year 3)"),
  exemptIncome1: requiredNumeric("Exempt Income(C) (Year 1)"),
  exemptIncome2: requiredNumeric("Exempt Income(C) (Year 2)"),
  exemptIncome3: optionalNumeric("Exempt Income(C) (Year 3)"),
  grossTotalIncome1: freeText.optional(),
  grossTotalIncome2: freeText.optional(),
  grossTotalIncome3: freeText.optional(),
  totalGrossTotalIncome: freeText.optional(),
  averageGrossTotalIncome: freeText.optional(),
});

export type ComputationOfIncomeValues = z.infer<typeof computationOfIncomeSchema>;

/**
 * Form 16 / Form 130. Year 1 is mandatory (except the Yes/No dropdown); Year 2 and Year 3 are optional.
 * "Average Annual Income" is a locked, auto-calculated field.
 */
const form16Schema = z.object({
  assessment1: requiredAssessmentYear("Assessment"),
  assessment2: optionalAssessmentYear("Assessment (Year 2)"),
  assessment3: optionalAssessmentYear("Assessment (Year 3)"),
  grossSalaryPa1: requiredNumeric("Gross Salary PA"),
  grossSalaryPa2: optionalNumeric("Gross Salary PA (Year 2)"),
  grossSalaryPa3: optionalNumeric("Gross Salary PA (Year 3)"),
  averageAnnualIncome: freeText.optional(),
  lifeAssuredPanNo1: requiredPan("Life Assured PAN No"),
  lifeAssuredPanNo2: optionalPan("Life Assured PAN No (Year 2)"),
  lifeAssuredPanNo3: optionalPan("Life Assured PAN No (Year 3)"),
  lifeAssuredName1: requiredAlphabets("Life Assured Name"),
  lifeAssuredName2: optionalAlphabets("Life Assured Name (Year 2)"),
  lifeAssuredName3: optionalAlphabets("Life Assured Name (Year 3)"),
  companyName1: requiredAlphabets("Company Name"),
  companyName2: optionalAlphabets("Company Name (Year 2)"),
  companyName3: optionalAlphabets("Company Name (Year 3)"),
  nameSameWithDocName1: optionalYesNo("Is Life Assured Name Same With Doc Name?"),
  nameSameWithDocName2: optionalYesNo("Is Life Assured Name Same With Doc Name? (Year 2)"),
  nameSameWithDocName3: optionalYesNo("Is Life Assured Name Same With Doc Name? (Year 3)"),
});

export type Form16Values = z.infer<typeof form16Schema>;

/**
 * Form 16A / Form 131. Year 1 is mandatory; Year 2 and Year 3 are optional.
 * "Average Annual Income" is a locked, auto-calculated field.
 */
const form16aSchema = z.object({
  assessmentYear1: requiredAssessmentYear("Assessment Year"),
  assessmentYear2: optionalAssessmentYear("Assessment Year (Year 2)"),
  assessmentYear3: optionalAssessmentYear("Assessment Year (Year 3)"),
  netReceiptPa1: requiredNumeric("Net Receipt pa"),
  netReceiptPa2: optionalNumeric("Net Receipt pa (Year 2)"),
  netReceiptPa3: optionalNumeric("Net Receipt pa (Year 3)"),
  averageAnnualIncome: freeText.optional(),
});

export type Form16aValues = z.infer<typeof form16aSchema>;

/**
 * Income Tax Return (Non-Individual). Year 1 and Year 2 are mandatory for Assessment Year, Income from Salary,
 * Income from Business or Profession and Exempt Income; Year 3 is optional.
 * The three Gross Total Income fields are locked, auto-calculated fields.
 */
const itrNonIndividualSchema = z.object({
  nameOfOrganisation: optionalAlphabets("Name of Organisation/Firm"),
  permanentAccountNumber: optionalPan("Permanent Account Number"),
  assessmentYear1: requiredAssessmentYear("Assessment Year (Year 1)"),
  assessmentYear2: requiredAssessmentYear("Assessment Year (Year 2)"),
  assessmentYear3: optionalAssessmentYear("Assessment Year (Year 3)"),
  itrAcknowledgementNumber1: optionalAlphanumeric("ITR Acknowledgement Number (Year 1)"),
  itrAcknowledgementNumber2: optionalAlphanumeric("ITR Acknowledgement Number (Year 2)"),
  itrAcknowledgementNumber3: optionalAlphanumeric("ITR Acknowledgement Number (Year 3)"),
  incomeFromSalary1: requiredNumeric("Income from Salary (Year 1)"),
  incomeFromSalary2: requiredNumeric("Income from Salary (Year 2)"),
  incomeFromSalary3: optionalNumeric("Income from Salary (Year 3)"),
  panMatchedWithBarcode1: optionalPan("Pan Number Matched with Barcode Number (Year 1)"),
  panMatchedWithBarcode2: optionalPan("Pan Number Matched with Barcode Number (Year 2)"),
  panMatchedWithBarcode3: optionalPan("Pan Number Matched with Barcode Number (Year 3)"),
  incomeFromHouseProperty1: optionalNumeric("Income from House Property (Year 1)"),
  incomeFromHouseProperty2: optionalNumeric("Income from House Property (Year 2)"),
  incomeFromHouseProperty3: optionalNumeric("Income from House Property (Year 3)"),
  incomeFromBusiness1: requiredNumeric("Income from Business or Profession (Year 1)"),
  incomeFromBusiness2: requiredNumeric("Income from Business or Profession (Year 2)"),
  incomeFromBusiness3: optionalNumeric("Income from Business or Profession (Year 3)"),
  capitalGains1: optionalNumeric("Short term & Capital Gains (Year 1)"),
  capitalGains2: optionalNumeric("Short term & Capital Gains (Year 2)"),
  capitalGains3: optionalNumeric("Short term & Capital Gains (Year 3)"),
  incomeFromOtherSources1: optionalNumeric("Income from Other Sources (Year 1)"),
  incomeFromOtherSources2: optionalNumeric("Income from Other Sources (Year 2)"),
  incomeFromOtherSources3: optionalNumeric("Income from Other Sources (Year 3)"),
  agriculturalIncome1: optionalNumeric("Agricultural Income (Year 1)"),
  agriculturalIncome2: optionalNumeric("Agricultural Income (Year 2)"),
  agriculturalIncome3: optionalNumeric("Agricultural Income (Year 3)"),
  exemptIncome1: requiredNumeric("Exempt Income (Year 1)"),
  exemptIncome2: requiredNumeric("Exempt Income (Year 2)"),
  exemptIncome3: optionalNumeric("Exempt Income (Year 3)"),
  grossTotalIncome1: freeText.optional(),
  grossTotalIncome2: freeText.optional(),
  grossTotalIncome3: freeText.optional(),
  totalGrossTotalIncome: freeText.optional(),
  averageGrossTotalIncome: freeText.optional(),
});

export type ItrNonIndividualValues = z.infer<typeof itrNonIndividualSchema>;

/**
 * Income Tax Return (Individual). Year 1 and Year 2 are mandatory for Assessment Year, Date of Filling ITR,
 * Income from Salary(A), Income from Business or Profession(B), Exempt Income(C), Life Assured Name and
 * Is Life Assured Name Same?; Year 3 is optional.
 * The three Gross Total Income(A+B+C) fields are locked, auto-calculated fields.
 */
const itrIndividualSchema = z.object({
  nameOfOrganisation: optionalAlphabets("Name of Organisation/Firm"),
  permanentAccountNumber: optionalPan("Permanent Account Number"),
  assessmentYear1: requiredAssessmentYear("Assessment Year (Year 1)"),
  assessmentYear2: requiredAssessmentYear("Assessment Year (Year 2)"),
  assessmentYear3: optionalAssessmentYear("Assessment Year (Year 3)"),
  itrAcknowledgementNumber1: optionalAlphanumeric("ITR Acknowledgement Number (Year 1)"),
  itrAcknowledgementNumber2: optionalAlphanumeric("ITR Acknowledgement Number (Year 2)"),
  itrAcknowledgementNumber3: optionalAlphanumeric("ITR Acknowledgement Number (Year 3)"),
  panMatchedWithBarcode1: optionalPan("Pan Number Matched with Barcode Number (Year 1)"),
  panMatchedWithBarcode2: optionalPan("Pan Number Matched with Barcode Number (Year 2)"),
  panMatchedWithBarcode3: optionalPan("Pan Number Matched with Barcode Number (Year 3)"),
  dateOfFillingItr1: requiredDate("Date of Filling ITR (Year 1)"),
  dateOfFillingItr2: requiredDate("Date of Filling ITR (Year 2)"),
  dateOfFillingItr3: optionalDate("Date of Filling ITR (Year 3)"),
  incomeFromSalary1: requiredNumeric("Income from Salary(A) (Year 1)"),
  incomeFromSalary2: requiredNumeric("Income from Salary(A) (Year 2)"),
  incomeFromSalary3: optionalNumeric("Income from Salary(A) (Year 3)"),
  incomeFromHouseProperty1: optionalNumeric("Income from House Property (Year 1)"),
  incomeFromHouseProperty2: optionalNumeric("Income from House Property (Year 2)"),
  incomeFromHouseProperty3: optionalNumeric("Income from House Property (Year 3)"),
  incomeFromBusiness1: requiredNumeric("Income from Business or Profession(B) (Year 1)"),
  incomeFromBusiness2: requiredNumeric("Income from Business or Profession(B) (Year 2)"),
  incomeFromBusiness3: optionalNumeric("Income from Business or Profession(B) (Year 3)"),
  capitalGains1: optionalNumeric("Short term & Capital Gains (Year 1)"),
  capitalGains2: optionalNumeric("Short term & Capital Gains (Year 2)"),
  capitalGains3: optionalNumeric("Short term & Capital Gains (Year 3)"),
  incomeFromOtherSources1: optionalNumeric("Income from Other Sources (Year 1)"),
  incomeFromOtherSources2: optionalNumeric("Income from Other Sources (Year 2)"),
  incomeFromOtherSources3: optionalNumeric("Income from Other Sources (Year 3)"),
  agriculturalIncome1: optionalNumeric("Agricultural Income (Year 1)"),
  agriculturalIncome2: optionalNumeric("Agricultural Income (Year 2)"),
  agriculturalIncome3: optionalNumeric("Agricultural Income (Year 3)"),
  exemptIncome1: requiredNumeric("Exempt Income(C) (Year 1)"),
  exemptIncome2: requiredNumeric("Exempt Income(C) (Year 2)"),
  exemptIncome3: optionalNumeric("Exempt Income(C) (Year 3)"),
  grossTotalIncome1: freeText.optional(),
  grossTotalIncome2: freeText.optional(),
  grossTotalIncome3: freeText.optional(),
  totalGrossTotalIncome: freeText.optional(),
  averageGrossTotalIncome: freeText.optional(),
  pfDeduction1: optionalNumeric("PF deduction - Salaried customers (Year 1)"),
  pfDeduction2: optionalNumeric("PF deduction - Salaried customers (Year 2)"),
  pfDeduction3: optionalNumeric("PF deduction - Salaried customers (Year 3)"),
  lifeAssuredName1: requiredAlphabets("Life Assured Name (Year 1)"),
  lifeAssuredName2: requiredAlphabets("Life Assured Name (Year 2)"),
  lifeAssuredName3: optionalAlphabets("Life Assured Name (Year 3)"),
  nameSame1: requiredYesNo("Is Life Assured Name Same? (Year 1)"),
  nameSame2: requiredYesNo("Is Life Assured Name Same? (Year 2)"),
  nameSame3: optionalYesNo("Is Life Assured Name Same? (Year 3)"),
});

export type ItrIndividualValues = z.infer<typeof itrIndividualSchema>;

/**
 * Profit & Loss A/C. Name of Organization/Firm is mandatory; Assessment Year and Profit After Tax (PAT) are
 * mandatory for all three years. Every other row is numeric when entered.
 * The three "Average …" fields are locked, auto-calculated fields.
 */
const profitAndLossSchema = z.object({
  nameOfOrganization: requiredAlphabets("Name of Organization/Firm"),
  assessmentYear1: requiredAssessmentYear("Assessment Year (Year 1)"),
  assessmentYear2: requiredAssessmentYear("Assessment Year (Year 2)"),
  assessmentYear3: requiredAssessmentYear("Assessment Year (Year 3)"),
  shareholdersFunds1: optionalNumeric("Shareholders Funds / Partners Capital (Year 1)"),
  shareholdersFunds2: optionalNumeric("Shareholders Funds / Partners Capital (Year 2)"),
  shareholdersFunds3: optionalNumeric("Shareholders Funds / Partners Capital (Year 3)"),
  shareCapital1: optionalNumeric("Share Capital or Fixed/Fluctuating Capital (Year 1)"),
  shareCapital2: optionalNumeric("Share Capital or Fixed/Fluctuating Capital (Year 2)"),
  shareCapital3: optionalNumeric("Share Capital or Fixed/Fluctuating Capital (Year 3)"),
  reservesAndSurplus1: optionalNumeric("Reserves & Surplus (Year 1)"),
  reservesAndSurplus2: optionalNumeric("Reserves & Surplus (Year 2)"),
  reservesAndSurplus3: optionalNumeric("Reserves & Surplus (Year 3)"),
  totalShareholdersFunds1: optionalNumeric("Total Shareholders Funds or Partner's Fund (Year 1)"),
  totalShareholdersFunds2: optionalNumeric("Total Shareholders Funds or Partner's Fund (Year 2)"),
  totalShareholdersFunds3: optionalNumeric("Total Shareholders Funds or Partner's Fund (Year 3)"),
  profitCalculation1: optionalNumeric("Profit Calculation (Year 1)"),
  profitCalculation2: optionalNumeric("Profit Calculation (Year 2)"),
  profitCalculation3: optionalNumeric("Profit Calculation (Year 3)"),
  pbdt1: optionalNumeric("Profit Before Depreciation & Tax (PBDT) (Year 1)"),
  pbdt2: optionalNumeric("Profit Before Depreciation & Tax (PBDT) (Year 2)"),
  pbdt3: optionalNumeric("Profit Before Depreciation & Tax (PBDT) (Year 3)"),
  depreciation1: optionalNumeric("Less : Depreciation (Year 1)"),
  depreciation2: optionalNumeric("Less : Depreciation (Year 2)"),
  depreciation3: optionalNumeric("Less : Depreciation (Year 3)"),
  pbt1: optionalNumeric("Profit Before Tax (PBT) (Year 1)"),
  pbt2: optionalNumeric("Profit Before Tax (PBT) (Year 2)"),
  pbt3: optionalNumeric("Profit Before Tax (PBT) (Year 3)"),
  tax1: optionalNumeric("Tax (Year 1)"),
  tax2: optionalNumeric("Tax (Year 2)"),
  tax3: optionalNumeric("Tax (Year 3)"),
  pat1: requiredNumeric("Profit After Tax (PAT) (Year 1)"),
  pat2: requiredNumeric("Profit After Tax (PAT) (Year 2)"),
  pat3: requiredNumeric("Profit After Tax (PAT) (Year 3)"),
  patLastYear1: optionalNumeric("Profit After Tax of Last Year (Year 1)"),
  patLastYear2: optionalNumeric("Profit After Tax of Last Year (Year 2)"),
  patLastYear3: optionalNumeric("Profit After Tax of Last Year (Year 3)"),
  riseInProfit1: optionalNumeric("Rise In Profit as compared to Last Year (Year 1)"),
  riseInProfit2: optionalNumeric("Rise In Profit as compared to Last Year (Year 2)"),
  riseInProfit3: optionalNumeric("Rise In Profit as compared to Last Year (Year 3)"),
  percentRiseInProfit1: optionalNumeric("% Rise In Profit as compared to Last Year (Year 1)"),
  percentRiseInProfit2: optionalNumeric("% Rise In Profit as compared to Last Year (Year 2)"),
  percentRiseInProfit3: optionalNumeric("% Rise In Profit as compared to Last Year (Year 3)"),
  incomeCalculation1: optionalNumeric("Income Calculation (Year 1)"),
  incomeCalculation2: optionalNumeric("Income Calculation (Year 2)"),
  incomeCalculation3: optionalNumeric("Income Calculation (Year 3)"),
  sales1: optionalNumeric("Sales (Year 1)"),
  sales2: optionalNumeric("Sales (Year 2)"),
  sales3: optionalNumeric("Sales (Year 3)"),
  salesLastYear1: optionalNumeric("Sales of Last Year (Year 1)"),
  salesLastYear2: optionalNumeric("Sales of Last Year (Year 2)"),
  salesLastYear3: optionalNumeric("Sales of Last Year (Year 3)"),
  riseInSales1: optionalNumeric("Rise In Sales as compared to Last Year (Year 1)"),
  riseInSales2: optionalNumeric("Rise In Sales as compared to Last Year (Year 2)"),
  riseInSales3: optionalNumeric("Rise In Sales as compared to Last Year (Year 3)"),
  percentRiseInSales1: optionalNumeric("% Rise In Sales as compared to Last Year (Year 1)"),
  percentRiseInSales2: optionalNumeric("% Rise In Sales as compared to Last Year (Year 2)"),
  percentRiseInSales3: optionalNumeric("% Rise In Sales as compared to Last Year (Year 3)"),
  averageGrossIncome: freeText.optional(),
  averageProfitBeforeTax: freeText.optional(),
  averageProfitAfterTax: freeText.optional(),
});

export type ProfitAndLossValues = z.infer<typeof profitAndLossSchema>;

/**
 * GST Income. Year 1 is mandatory for Assessment Year and Gross Sales; Years 2 to 4 are optional.
 * "Total of Gross Sales", "Average Gross Sales" and "Average Annual Income" are locked, auto-calculated fields.
 */
const gstIncomeSchema = z.object({
  assessmentYear1: requiredAssessmentYear("Assessment Year (Year 1)"),
  assessmentYear2: optionalAssessmentYear("Assessment Year (Year 2)"),
  assessmentYear3: optionalAssessmentYear("Assessment Year (Year 3)"),
  assessmentYear4: optionalAssessmentYear("Assessment Year (Year 4)"),
  grossSales1: requiredNumeric("Gross Sales (Year 1)"),
  grossSales2: optionalNumeric("Gross Sales (Year 2)"),
  grossSales3: optionalNumeric("Gross Sales (Year 3)"),
  grossSales4: optionalNumeric("Gross Sales (Year 4)"),
  grossPurchases1: optionalNumeric("Gross Purchases (Year 1)"),
  grossPurchases2: optionalNumeric("Gross Purchases (Year 2)"),
  grossPurchases3: optionalNumeric("Gross Purchases (Year 3)"),
  grossPurchases4: optionalNumeric("Gross Purchases (Year 4)"),
  profitAfterGst1: optionalNumeric("Profit After GST (Year 1)"),
  profitAfterGst2: optionalNumeric("Profit After GST (Year 2)"),
  profitAfterGst3: optionalNumeric("Profit After GST (Year 3)"),
  profitAfterGst4: optionalNumeric("Profit After GST (Year 4)"),
  totalOfGrossSales: freeText.optional(),
  averageGrossSales: freeText.optional(),
  averageAnnualIncome: freeText.optional(),
});

export type GstIncomeValues = z.infer<typeof gstIncomeSchema>;

/** Credit Bureau Details: every field is optional, and anything entered must be numeric. */
export const creditBureauDetailsSchema = z.object({
  experianIncome: optionalNumeric("Experian Income"),
  experianScore: optionalNumeric("Experian Score"),
  crifIncome: optionalNumeric("Crif Income"),
  crifScore: optionalNumeric("Crif Score"),
  cibilIncome: optionalNumeric("Cibil Income"),
  cibilScore: optionalNumeric("Cibil Score"),
  imputedIncome: optionalNumeric("Imputed Income"),
  digitalIncome: optionalNumeric("Digital Income"),
  payuIncome: optionalNumeric("PayU Income"),
  averageBureauIncome: optionalNumeric("Average Bureau Income"),
});

export type CreditBureauDetailsValues = z.infer<typeof creditBureauDetailsSchema>;

/** Section key (see `FINANCIAL_SECTIONS`) → section schema. */
export const FINANCIAL_SECTION_SCHEMAS: Readonly<Record<string, z.ZodObject<z.ZodRawShape>>> = {
  credit_bureau_details: creditBureauDetailsSchema,
  appointment_letter: appointmentLetterSchema,
  commission_statement: commissionStatementSchema,
  credit_card: creditCardSchema,
  fixed_deposit_receipt: fixedDepositReceiptSchema,
  form_j: formJSchema,
  govt_bonds: govtBondsSchema,
  loan_statement: loanStatementSchema,
  mutual_fund: mutualFundSchema,
  pension_statement: pensionStatementSchema,
  property_purchase: propertyPurchaseSchema,
  property_valuation: propertyValuationSchema,
  salary_certificate: salaryCertificateSchema,
  salary_revision_letter: salaryRevisionLetterSchema,
  salary_slips: salarySlipsSchema,
  bank_statement: bankStatementSchema,
  stock_holding: stockHoldingSchema,
  vehicle_ownership: vehicleOwnershipSchema,
  vahan: vahanSchema,
  sip_statement: sipStatementSchema,
  bank_statement_salary_credit: bankStatementSalaryCreditSchema,
  epf_basic: epfBasicSchema,
  epf_advanced: epfAdvancedSchema,
  employee_id_card: employeeIdCardSchema,
  computation_of_income: computationOfIncomeSchema,
  form16: form16Schema,
  form16a: form16aSchema,
  itr_non_individual: itrNonIndividualSchema,
  itr_individual: itrIndividualSchema,
  profit_and_loss: profitAndLossSchema,
  gst_income: gstIncomeSchema,
};

/** Section key → field label (as in `FINANCIAL_SECTIONS`) → schema property name. */
export const FINANCIAL_FIELD_KEYS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  credit_bureau_details: {
    "Experian Income": "experianIncome",
    "Experian Score": "experianScore",
    "Crif Income": "crifIncome",
    "Crif Score": "crifScore",
    "Cibil Income": "cibilIncome",
    "Cibil Score": "cibilScore",
    "Imputed Income": "imputedIncome",
    "Digital Income": "digitalIncome",
    "PayU Income": "payuIncome",
    "Average Bureau Income": "averageBureauIncome",
  },
  appointment_letter: {
    "Name of the company": "nameOfTheCompany",
    "Name of the employee": "nameOfTheEmployee",
    "Joining Date": "joiningDate",
    CTC: "ctc",
  },
  commission_statement: {
    "Month 1": "month1",
    "Month 2": "month2",
    "Month 3": "month3",
    "Month 4": "month4",
    "Month 5": "month5",
    "Month 6": "month6",
    "Income for Month 1": "incomeForMonth1",
    "Income for Month 2": "incomeForMonth2",
    "Income for Month 3": "incomeForMonth3",
    "Income for Month 4": "incomeForMonth4",
    "Income for Month 5": "incomeForMonth5",
    "Income for Month 6": "incomeForMonth6",
    "Average commission pm": "averageCommissionPm",
    "Average Annual Income": "averageAnnualIncome",
  },
  credit_card: {
    "Is Credit card statement in the name of LA": "statementInNameOfLa",
    "Is LA Defaulter in the Payment": "laDefaulterInPayment",
    "Type of Card": "typeOfCard",
    "Credit Limit": "creditLimit",
    "Points Earned": "pointsEarned",
    "Income Earned": "incomeEarned",
    "Derived Income": "derivedIncome",
    "Average Income": "averageIncome",
  },
  fixed_deposit_receipt: {
    "Is Fixed Deposit Receipt in the name of LA": "receiptInNameOfLa",
    "Is Fixed Deposit Receipts matured": "receiptsMatured",
    "Amount Invested": "amountInvested",
    "Income Earned": "incomeEarned",
    "Derived Income": "derivedIncome",
    "Average Income": "averageIncome",
  },
  form_j: {
    "Is Form J in the name of LA": "inNameOfLa",
    Month1: "month1",
    Month2: "month2",
    Month3: "month3",
    "Month1 Receipt1": "month1Receipt1",
    "Month1 Receipt2": "month1Receipt2",
    "Month1 Receipt3": "month1Receipt3",
    "Month1 Receipt4": "month1Receipt4",
    "Month1 Receipt5": "month1Receipt5",
    "Month1 Receipt6": "month1Receipt6",
    "Month2 Receipt1": "month2Receipt1",
    "Month2 Receipt2": "month2Receipt2",
    "Month2 Receipt3": "month2Receipt3",
    "Month2 Receipt4": "month2Receipt4",
    "Month2 Receipt5": "month2Receipt5",
    "Month2 Receipt6": "month2Receipt6",
    "Month3 Receipt1": "month3Receipt1",
    "Month3 Receipt2": "month3Receipt2",
    "Month3 Receipt3": "month3Receipt3",
    "Month3 Receipt4": "month3Receipt4",
    "Month3 Receipt5": "month3Receipt5",
    "Month3 Receipt6": "month3Receipt6",
    "Total Receipts Receipt1": "totalReceipts",
    "Average Monthly Receipts Receipt1": "averageMonthlyReceipts",
    "Annual Receipts Receipt1": "annualReceipts",
    "Derived Income Receipt1": "derivedIncome",
  },
  govt_bonds: {
    "Is Bond Certification in the name of LA": "certificationInNameOfLa",
    "Is Bond Certificate matured": "certificateMatured",
    "Amount Invested or Maturity Value, whichever higher": "amountInvestedOrMaturityValue",
    "Income Earned": "incomeEarned",
    "Derived Income": "derivedIncome",
    "Average Income": "averageIncome",
  },
  loan_statement: {
    "Is Loan Statements in the name of LA": "statementInNameOfLa",
    "Is LA Defaulter in the Payment": "laDefaulterInPayment",
    "Monthly EMI as per Schedule": "monthlyEmiAsPerSchedule",
    "Income Earned": "incomeEarned",
    "Derived Income": "derivedIncome",
    "Average Income": "averageIncome",
  },
  mutual_fund: {
    "Is Mutual Fund Statement in the name of LA": "statementInNameOfLa",
    "Latest Market Value (as per NAV) in Statement": "latestMarketValue",
    "Income Earned": "incomeEarned",
    "Derived Income": "derivedIncome",
    "Average Income": "averageIncome",
  },
  pension_statement: {
    "Total Monthly Pension": "totalMonthlyPension",
    "Pension Received pa": "pensionReceivedPa",
  },
  property_purchase: {
    "Is Property purchased by LA": "purchasedByLa",
    "Purchase Price": "purchasePrice",
    "Financial Year of Purchase": "financialYearOfPurchase",
    "Estimated Market Value of Property": "estimatedMarketValue",
    "Derived Income": "derivedIncome",
  },
  property_valuation: {
    "Is Property Valuation Report in the name of LA": "reportInNameOfLa",
    "Estimated Market Value of Property(as per report)": "estimatedMarketValue",
    "Derived Income": "derivedIncome",
  },
  salary_certificate: {
    "Gross Salary PA": "grossSalaryPa",
    "Derived Income": "derivedIncome",
  },
  salary_revision_letter: {
    "Gross Salary PA": "grossSalaryPa",
    "Derived Income": "derivedIncome",
  },
  salary_slips: {
    "Month 1": "month1",
    "Month 2": "month2",
    "Month 3": "month3",
    "Month 4": "month4",
    "Month 5": "month5",
    "Month 6": "month6",
    "Gross Salary Pm1": "grossSalaryPm1",
    "Gross Salary Pm2": "grossSalaryPm2",
    "Gross Salary Pm3": "grossSalaryPm3",
    "Gross Salary Pm4": "grossSalaryPm4",
    "Gross Salary Pm5": "grossSalaryPm5",
    "Gross Salary Pm6": "grossSalaryPm6",
    "Average Salary pm": "averageSalaryPm",
    "Gross Salary pa": "grossSalaryPa",
    "Annual Bonus/Incentive/Reimbursement": "annualBonus",
    "Average Annual Income": "averageAnnualIncome",
    "Company Name": "companyName",
    "Life Assured Name": "lifeAssuredName",
    "Is Life Assured Name Same?": "lifeAssuredNameSame",
    "PF / UAN No": "pfUanNo",
  },
  bank_statement: {
    "Is Bank Statement in the name of LA/his Business": "inNameOfLaOrBusiness",
    "Latest 6 months statements given": "latestSixMonthsGiven",
    "Any Overdraft(Negative/Debit) Balances": "anyOverdraftBalances",
    "Month 1": "month1",
    "Month 2": "month2",
    "Month 3": "month3",
    "Month 4": "month4",
    "Month 5": "month5",
    "Month 6": "month6",
    "Monthly Closing Bal 1": "monthlyClosingBal1",
    "Monthly Closing Bal 2": "monthlyClosingBal2",
    "Monthly Closing Bal 3": "monthlyClosingBal3",
    "Monthly Closing Bal 4": "monthlyClosingBal4",
    "Monthly Closing Bal 5": "monthlyClosingBal5",
    "Monthly Closing Bal 6": "monthlyClosingBal6",
    "Average Bank Balance": "averageBankBalance",
    "Average Annual income": "averageAnnualIncome",
    "Opening Balance": "openingBalance",
    "Statement Period": "statementPeriod",
    "Life Assured Name": "lifeAssuredName",
    "Is LA Name Match with Doc Name?": "laNameMatchesDocName",
    "Life Insurance Premium Deduction Entry": "lifeInsurancePremiumDeduction",
    "Wine Beer_Entries": "wineBeerEntries",
    "Med Entry": "medEntry",
  },
  stock_holding: {
    "Is Stock Holding Stmt in name of LA/his Business": "inNameOfLaOrBusiness",
    "Gross Total Market Value as per the Stmt": "grossTotalMarketValue",
    "Income Earned": "incomeEarned",
    "Derived Income": "derivedIncome",
    "Average Income": "averageIncome",
  },
  vehicle_ownership: {
    "Is Registration Papers in the name of LA": "registrationPapersInNameOfLa",
    "Is Purchase invoices in the name of LA": "purchaseInvoicesInNameOfLa",
    "Purchase Price": "purchasePrice",
    "Vehicle RC Number": "vehicleRcNumber",
    "Derived Income": "derivedIncome",
  },
  vahan: {
    "Is Registration Papers in the Name of LA": "registrationPapersInNameOfLa",
    "Is Purchase Invoices in the Name of LA": "purchaseInvoicesInNameOfLa",
    "Car RC Number": "carRcNumber",
    IDV: "idv",
    "Average Annual Income": "averageAnnualIncome",
  },
  sip_statement: {
    "Latest 6 Months SIP Statements Given": "latestSixMonthsGiven",
    "Is SIP Statements in the Name of LA": "inNameOfLa",
    "Month 1": "month1",
    "Month 2": "month2",
    "Month 3": "month3",
    "Month 4": "month4",
    "Month 5": "month5",
    "Month 6": "month6",
    "SIP Per Month 1": "sipPerMonth1",
    "SIP Per Month2": "sipPerMonth2",
    "SIP Per Month 3": "sipPerMonth3",
    "SIP Per Month4": "sipPerMonth4",
    "SIP Per Month 5": "sipPerMonth5",
    "SIP Per Month 6": "sipPerMonth6",
    "Average Monthly SIP": "averageMonthlySip",
    "Average Annual Income": "averageAnnualIncome",
  },
  bank_statement_salary_credit: {
    "Is Bank Statement in the Name of LA": "inNameOfLa",
    "Month 1": "month1",
    "Month 2": "month2",
    "Month 3": "month3",
    "Month 4": "month4",
    "Month 5": "month5",
    "Month 6": "month6",
    "Income for Month 1": "incomeForMonth1",
    "Income for Month 2": "incomeForMonth2",
    "Income for Month 3": "incomeForMonth3",
    "Income for Month 4": "incomeForMonth4",
    "Income for Month 5": "incomeForMonth5",
    "Income for Month 6": "incomeForMonth6",
    "Average Net Salary Credited PM": "averageNetSalaryCreditedPm",
    "Net Salary Credited PA": "netSalaryCreditedPa",
    "Average Annual Income": "averageAnnualIncome",
    "Annual Bonus /Incentive /Reimbursement": "annualBonus",
    "Salary Credited": "salaryCredited",
    "Closing Balance": "closingBalance",
    "Life Assured Name": "lifeAssuredName",
    "Opening Balance": "openingBalance",
    "Statement Period": "statementPeriod",
    "Is LA Name Match with Doc Name?": "laNameMatchesDocName",
  },
  epf_basic: {
    "Latest Organization Name": "latestOrganizationName",
    "Is Organization Name Same?": "organizationNameSame",
    Income: "income",
  },
  epf_advanced: {
    "Latest Organization Name": "latestOrganizationName",
    "Is Organization Name Same?": "organizationNameSame",
    "PF Contribution M1": "pfContributionM1",
    "PF Contribution M2": "pfContributionM2",
    "PF Contribution M3": "pfContributionM3",
    "PF Contribution M4": "pfContributionM4",
    "PF Contribution M5": "pfContributionM5",
    "PF Contribution M6": "pfContributionM6",
    "Annual Income": "annualIncome",
  },
  employee_id_card: {
    "Name of the company": "nameOfTheCompany",
    "Name of the employee": "nameOfTheEmployee",
    "Employee number": "employeeNumber",
    "Photo available": "photoAvailable",
  },
  computation_of_income: {
    "Assessment Year": "assessmentYear1",
    "Assessment Year Year 2": "assessmentYear2",
    "Assessment Year Year 3": "assessmentYear3",
    "Income from Salary(A)": "incomeFromSalary1",
    "Income from Salary(A) Year 2": "incomeFromSalary2",
    "Income from Salary(A) Year 3": "incomeFromSalary3",
    "Income from House Property": "incomeFromHouseProperty1",
    "Income from House Property Year 2": "incomeFromHouseProperty2",
    "Income from House Property Year 3": "incomeFromHouseProperty3",
    "Income from Business or Profession (B)": "incomeFromBusiness1",
    "Income from Business or Profession (B) Year 2": "incomeFromBusiness2",
    "Income from Business or Profession (B) Year 3": "incomeFromBusiness3",
    "Short term & Capital Gains": "capitalGains1",
    "Short term & Capital Gains Year 2": "capitalGains2",
    "Short term & Capital Gains Year 3": "capitalGains3",
    "Income from Other Sources": "incomeFromOtherSources1",
    "Income from Other Sources Year 2": "incomeFromOtherSources2",
    "Income from Other Sources Year 3": "incomeFromOtherSources3",
    "Agricultural Income": "agriculturalIncome1",
    "Agricultural Income Year 2": "agriculturalIncome2",
    "Agricultural Income Year 3": "agriculturalIncome3",
    "Exempt Income(C)": "exemptIncome1",
    "Exempt Income(C) Year 2": "exemptIncome2",
    "Exempt Income(C) Year 3": "exemptIncome3",
    "Gross Total Income": "grossTotalIncome1",
    "Gross Total Income Year 2": "grossTotalIncome2",
    "Gross Total Income Year 3": "grossTotalIncome3",
    "Total Gross Total Income": "totalGrossTotalIncome",
    "Average Gross Total Income": "averageGrossTotalIncome",
  },
  form16: {
    ASSESSMENT: "assessment1",
    "ASSESSMENT Year 2": "assessment2",
    "ASSESSMENT Year 3": "assessment3",
    "Gross Salary PA": "grossSalaryPa1",
    "Gross Salary PA Year 2": "grossSalaryPa2",
    "Gross Salary PA Year 3": "grossSalaryPa3",
    "Average Annual Income": "averageAnnualIncome",
    "Life Assured Pan No": "lifeAssuredPanNo1",
    "Life Assured Pan No Year 2": "lifeAssuredPanNo2",
    "Life Assured Pan No Year 3": "lifeAssuredPanNo3",
    "Life Assured Name": "lifeAssuredName1",
    "Life Assured Name Year 2": "lifeAssuredName2",
    "Life Assured Name Year 3": "lifeAssuredName3",
    "Company Name": "companyName1",
    "Company Name Year 2": "companyName2",
    "Company Name Year 3": "companyName3",
    "Is Life Assured Name Same With Doc Name?": "nameSameWithDocName1",
    "Is Life Assured Name Same With Doc Name? Year 2": "nameSameWithDocName2",
    "Is Life Assured Name Same With Doc Name? Year 3": "nameSameWithDocName3",
  },
  form16a: {
    "Assessment Year": "assessmentYear1",
    "Assessment Year Year 2": "assessmentYear2",
    "Assessment Year Year 3": "assessmentYear3",
    "Net Receipt pa": "netReceiptPa1",
    "Net Receipt pa Year 2": "netReceiptPa2",
    "Net Receipt pa Year 3": "netReceiptPa3",
    "Average Annual Income": "averageAnnualIncome",
  },
  itr_non_individual: {
    "Name of Organisation/Firm": "nameOfOrganisation",
    "Permanent Account Number": "permanentAccountNumber",
    "Assessment Year": "assessmentYear1",
    "Assessment Year Year 2": "assessmentYear2",
    "Assessment Year Year 3": "assessmentYear3",
    "ITR Acknowledgement Number": "itrAcknowledgementNumber1",
    "ITR Acknowledgement Number Year 2": "itrAcknowledgementNumber2",
    "ITR Acknowledgement Number Year 3": "itrAcknowledgementNumber3",
    "Income from Salary": "incomeFromSalary1",
    "Income from Salary Year 2": "incomeFromSalary2",
    "Income from Salary Year 3": "incomeFromSalary3",
    "Pan Number Matched with Barcode Number": "panMatchedWithBarcode1",
    "Pan Number Matched with Barcode Number Year 2": "panMatchedWithBarcode2",
    "Pan Number Matched with Barcode Number Year 3": "panMatchedWithBarcode3",
    "Income from House Property": "incomeFromHouseProperty1",
    "Income from House Property Year 2": "incomeFromHouseProperty2",
    "Income from House Property Year 3": "incomeFromHouseProperty3",
    "Income from Business or Profession": "incomeFromBusiness1",
    "Income from Business or Profession Year 2": "incomeFromBusiness2",
    "Income from Business or Profession Year 3": "incomeFromBusiness3",
    "Short term & Capital Gains": "capitalGains1",
    "Short term & Capital Gains Year 2": "capitalGains2",
    "Short term & Capital Gains Year 3": "capitalGains3",
    "Income from Other Sources": "incomeFromOtherSources1",
    "Income from Other Sources Year 2": "incomeFromOtherSources2",
    "Income from Other Sources Year 3": "incomeFromOtherSources3",
    "Agricultural Income": "agriculturalIncome1",
    "Agricultural Income Year 2": "agriculturalIncome2",
    "Agricultural Income Year 3": "agriculturalIncome3",
    "Exempt Income": "exemptIncome1",
    "Exempt Income Year 2": "exemptIncome2",
    "Exempt Income Year 3": "exemptIncome3",
    "Gross Total Income": "grossTotalIncome1",
    "Gross Total Income Year 2": "grossTotalIncome2",
    "Gross Total Income Year 3": "grossTotalIncome3",
    "Total Gross Total Income": "totalGrossTotalIncome",
    "Average Gross Total Income": "averageGrossTotalIncome",
  },
  itr_individual: {
    "Name of Organisation/Firm": "nameOfOrganisation",
    "Permanent Account Number": "permanentAccountNumber",
    "Assessment Year": "assessmentYear1",
    "Assessment Year Year 2": "assessmentYear2",
    "Assessment Year Year 3": "assessmentYear3",
    "ITR Acknowledgement Number": "itrAcknowledgementNumber1",
    "ITR Acknowledgement Number Year 2": "itrAcknowledgementNumber2",
    "ITR Acknowledgement Number Year 3": "itrAcknowledgementNumber3",
    "Pan Number Matched with Barcode Number": "panMatchedWithBarcode1",
    "Pan Number Matched with Barcode Number Year 2": "panMatchedWithBarcode2",
    "Pan Number Matched with Barcode Number Year 3": "panMatchedWithBarcode3",
    "Date of Filling ITR": "dateOfFillingItr1",
    "Date of Filling ITR Year 2": "dateOfFillingItr2",
    "Date of Filling ITR Year 3": "dateOfFillingItr3",
    "Income from Salary(A)": "incomeFromSalary1",
    "Income from Salary(A) Year 2": "incomeFromSalary2",
    "Income from Salary(A) Year 3": "incomeFromSalary3",
    "Income from House Property": "incomeFromHouseProperty1",
    "Income from House Property Year 2": "incomeFromHouseProperty2",
    "Income from House Property Year 3": "incomeFromHouseProperty3",
    "Income from Business or Profession(B)": "incomeFromBusiness1",
    "Income from Business or Profession(B) Year 2": "incomeFromBusiness2",
    "Income from Business or Profession(B) Year 3": "incomeFromBusiness3",
    "Short term & Capital Gains": "capitalGains1",
    "Short term & Capital Gains Year 2": "capitalGains2",
    "Short term & Capital Gains Year 3": "capitalGains3",
    "Income from Other Sources": "incomeFromOtherSources1",
    "Income from Other Sources Year 2": "incomeFromOtherSources2",
    "Income from Other Sources Year 3": "incomeFromOtherSources3",
    "Agricultural Income": "agriculturalIncome1",
    "Agricultural Income Year 2": "agriculturalIncome2",
    "Agricultural Income Year 3": "agriculturalIncome3",
    "Exempt Income(C)": "exemptIncome1",
    "Exempt Income(C) Year 2": "exemptIncome2",
    "Exempt Income(C) Year 3": "exemptIncome3",
    "Gross Total Income(A+B+C)": "grossTotalIncome1",
    "Gross Total Income(A+B+C) Year 2": "grossTotalIncome2",
    "Gross Total Income(A+B+C) Year 3": "grossTotalIncome3",
    "Total Gross Total Income": "totalGrossTotalIncome",
    "Average Gross Total Income": "averageGrossTotalIncome",
    "PF deduction - Salaried customers": "pfDeduction1",
    "PF deduction - Salaried customers Year 2": "pfDeduction2",
    "PF deduction - Salaried customers Year 3": "pfDeduction3",
    "Life Assured Name": "lifeAssuredName1",
    "Life Assured Name Year 2": "lifeAssuredName2",
    "Life Assured Name Year 3": "lifeAssuredName3",
    "Is Life Assured Name Same?": "nameSame1",
    "Is Life Assured Name Same? Year 2": "nameSame2",
    "Is Life Assured Name Same? Year 3": "nameSame3",
  },
  profit_and_loss: {
    "Name of Organization/Firm": "nameOfOrganization",
    "Assessment Year": "assessmentYear1",
    "Assessment Year Year 2": "assessmentYear2",
    "Assessment Year Year 3": "assessmentYear3",
    "Shareholders Funds / Partners Capital": "shareholdersFunds1",
    "Shareholders Funds / Partners Capital Year 2": "shareholdersFunds2",
    "Shareholders Funds / Partners Capital Year 3": "shareholdersFunds3",
    "Share Capital or Fixed/Fluctuating Capital": "shareCapital1",
    "Share Capital or Fixed/Fluctuating Capital Year 2": "shareCapital2",
    "Share Capital or Fixed/Fluctuating Capital Year 3": "shareCapital3",
    "Reserves & Surplus": "reservesAndSurplus1",
    "Reserves & Surplus Year 2": "reservesAndSurplus2",
    "Reserves & Surplus Year 3": "reservesAndSurplus3",
    "Total Shareholders Funds or Partner's Fund": "totalShareholdersFunds1",
    "Total Shareholders Funds or Partner's Fund Year 2": "totalShareholdersFunds2",
    "Total Shareholders Funds or Partner's Fund Year 3": "totalShareholdersFunds3",
    "Profit Calculation": "profitCalculation1",
    "Profit Calculation Year 2": "profitCalculation2",
    "Profit Calculation Year 3": "profitCalculation3",
    "Profit Before Depreciation & Tax (PBDT)": "pbdt1",
    "Profit Before Depreciation & Tax (PBDT) Year 2": "pbdt2",
    "Profit Before Depreciation & Tax (PBDT) Year 3": "pbdt3",
    "Less : Depreciation": "depreciation1",
    "Less : Depreciation Year 2": "depreciation2",
    "Less : Depreciation Year 3": "depreciation3",
    "Profit Before Tax (PBT)": "pbt1",
    "Profit Before Tax (PBT) Year 2": "pbt2",
    "Profit Before Tax (PBT) Year 3": "pbt3",
    Tax: "tax1",
    "Tax Year 2": "tax2",
    "Tax Year 3": "tax3",
    "Profit After Tax (PAT)": "pat1",
    "Profit After Tax (PAT) Year 2": "pat2",
    "Profit After Tax (PAT) Year 3": "pat3",
    "Profit After Tax of Last Year": "patLastYear1",
    "Profit After Tax of Last Year Year 2": "patLastYear2",
    "Profit After Tax of Last Year Year 3": "patLastYear3",
    "Rise In Profit as compared to Last Year": "riseInProfit1",
    "Rise In Profit as compared to Last Year Year 2": "riseInProfit2",
    "Rise In Profit as compared to Last Year Year 3": "riseInProfit3",
    "% Rise In Profit as compared to Last Year": "percentRiseInProfit1",
    "% Rise In Profit as compared to Last Year Year 2": "percentRiseInProfit2",
    "% Rise In Profit as compared to Last Year Year 3": "percentRiseInProfit3",
    "Income Calculation": "incomeCalculation1",
    "Income Calculation Year 2": "incomeCalculation2",
    "Income Calculation Year 3": "incomeCalculation3",
    Sales: "sales1",
    "Sales Year 2": "sales2",
    "Sales Year 3": "sales3",
    "Sales of Last Year": "salesLastYear1",
    "Sales of Last Year Year 2": "salesLastYear2",
    "Sales of Last Year Year 3": "salesLastYear3",
    "Rise In Sales as compared to Last Year": "riseInSales1",
    "Rise In Sales as compared to Last Year Year 2": "riseInSales2",
    "Rise In Sales as compared to Last Year Year 3": "riseInSales3",
    "% Rise In Sales as compared to Last Year": "percentRiseInSales1",
    "% Rise In Sales as compared to Last Year Year 2": "percentRiseInSales2",
    "% Rise In Sales as compared to Last Year Year 3": "percentRiseInSales3",
    "Average Gross Income": "averageGrossIncome",
    "Average Profit Before Tax": "averageProfitBeforeTax",
    "Average Profit After Tax": "averageProfitAfterTax",
  },
  gst_income: {
    "Assessment Year": "assessmentYear1",
    "Assessment Year Year 2": "assessmentYear2",
    "Assessment Year Year 3": "assessmentYear3",
    "Assessment Year Year 4": "assessmentYear4",
    "Gross Sales": "grossSales1",
    "Gross Sales Year 2": "grossSales2",
    "Gross Sales Year 3": "grossSales3",
    "Gross Sales Year 4": "grossSales4",
    "Gross Purchases": "grossPurchases1",
    "Gross Purchases Year 2": "grossPurchases2",
    "Gross Purchases Year 3": "grossPurchases3",
    "Gross Purchases Year 4": "grossPurchases4",
    "Profit After GST": "profitAfterGst1",
    "Profit After GST Year 2": "profitAfterGst2",
    "Profit After GST Year 3": "profitAfterGst3",
    "Profit After GST Year 4": "profitAfterGst4",
    "Total of Gross Sales": "totalOfGrossSales",
    "Average Gross Sales": "averageGrossSales",
    "Average Annual Income": "averageAnnualIncome",
  },
};

const getFieldSchema = (sectionKey: string, label: string): z.core.$ZodType | undefined => {
  const schemaKey = FINANCIAL_FIELD_KEYS[sectionKey]?.[label];
  return schemaKey === undefined ? undefined : FINANCIAL_SECTION_SCHEMAS[sectionKey]?.shape[schemaKey];
};

/** True/false when a schema covers the field; `undefined` when it has no schema. */
export function isFinancialFieldRequired(sectionKey: string, label: string): boolean | undefined {
  const schema = getFieldSchema(sectionKey, label);
  return schema === undefined ? undefined : !z.safeParse(schema, undefined).success;
}

/** Error message for the value, or `undefined` when valid (or when the field has no schema). */
export function validateFinancialField(sectionKey: string, label: string, value: string): string | undefined {
  const schema = getFieldSchema(sectionKey, label);
  if (schema === undefined) return undefined;
  const result = z.safeParse(schema, value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
