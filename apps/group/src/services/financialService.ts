import {
  FINANCIAL_SECTIONS,
  type FinancialSection,
} from "@insurance-poc/common/financial";

export type FinancialFetchRequest = {
  applicationNumber: string;
  partyId: string;
};

export type TableOfFinanceDocument = {
  code: string;
  description: string;
  value: string;
};

export type FinancialDocumentsPayload = {
  applicationNumber: string;
  partyId: string;
  clientType: string;
  table_of_finance_documents: TableOfFinanceDocument[];
  documents: Record<string, unknown>;
};

export type FinancialFetchResponse = {
  response_code: number;
  error: boolean;
  message: string;
  data: FinancialDocumentsPayload;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function formatFinancialDate(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, "0");
    const m = ddmmyyyy[2].padStart(2, "0");
    return `${d}/${m}/${ddmmyyyy[3]}`;
  }
  const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (yyyymmdd) {
    const d = yyyymmdd[3].padStart(2, "0");
    const m = yyyymmdd[2].padStart(2, "0");
    return `${d}/${m}/${yyyymmdd[1]}`;
  }
  return text;
}

function toYearEntry(years: unknown, index: number): Record<string, unknown> {
  if (!Array.isArray(years) || !isRecord(years[index])) return {};
  return years[index] as Record<string, unknown>;
}

function toMonthEntry(months: unknown, index: number): Record<string, unknown> {
  if (!Array.isArray(months) || !isRecord(months[index])) return {};
  return months[index] as Record<string, unknown>;
}

function toReceiptEntry(receipts: unknown, index: number): Record<string, unknown> {
  if (!Array.isArray(receipts) || !isRecord(receipts[index])) return {};
  return receipts[index] as Record<string, unknown>;
}

/**
 * Maps raw backend `documents` object to standard `FinancialSection[]` fields.
 */
export function mapFinancialDocumentsToSections(
  documentsRaw: unknown,
  baseSections: readonly FinancialSection[] = FINANCIAL_SECTIONS,
  tableOfDocs?: TableOfFinanceDocument[] | null,
): FinancialSection[] {
  if (!isRecord(documentsRaw) && (!tableOfDocs || tableOfDocs.length === 0)) {
    return [...baseSections];
  }

  const docs = documentsRaw as Record<string, Record<string, unknown>>;

  const fp = isRecord(docs.financial_profession) ? docs.financial_profession : {};
  const cb = isRecord(docs.credit_bureau_details) ? docs.credit_bureau_details : {};
  const al = isRecord(docs.appointment_letter) ? docs.appointment_letter : {};
  const cs = isRecord(docs.commission_statement) ? docs.commission_statement : {};
  const coi = isRecord(docs.computation_of_income) ? docs.computation_of_income : {};
  const cc = isRecord(docs.credit_card) ? docs.credit_card : {};
  const fd = isRecord(docs.fixed_deposit_receipt) ? docs.fixed_deposit_receipt : {};
  const f16 = isRecord(docs.form16) ? docs.form16 : {};
  const f16a = isRecord(docs.form16a) ? docs.form16a : {};
  const fj = isRecord(docs.form_j) ? docs.form_j : {};
  const gb = isRecord(docs.govt_bonds) ? docs.govt_bonds : {};
  const itrNon = isRecord(docs.itr_non_individual) ? docs.itr_non_individual : {};
  const itrInd = isRecord(docs.itr_individual) ? docs.itr_individual : {};
  const ls = isRecord(docs.loan_statement) ? docs.loan_statement : {};
  const mf = isRecord(docs.mutual_fund) ? docs.mutual_fund : {};
  const ps = isRecord(docs.pension_statement) ? docs.pension_statement : {};
  const pnl = isRecord(docs.profit_and_loss) ? docs.profit_and_loss : {};
  const pp = isRecord(docs.property_purchase) ? docs.property_purchase : {};
  const pv = isRecord(docs.property_valuation) ? docs.property_valuation : {};
  const sc = isRecord(docs.salary_certificate) ? docs.salary_certificate : {};
  const srl = isRecord(docs.salary_revision_letter) ? docs.salary_revision_letter : {};
  const ss = isRecord(docs.salary_slips) ? docs.salary_slips : {};
  const bs = isRecord(docs.bank_statement) ? docs.bank_statement : {};
  const sh = isRecord(docs.stock_holding) ? docs.stock_holding : {};
  const vo = isRecord(docs.vehicle_ownership) ? docs.vehicle_ownership : {};
  const vahan = isRecord(docs.vahan) ? docs.vahan : {};
  const sip = isRecord(docs.sip_statement) ? docs.sip_statement : {};
  const gst = isRecord(docs.gst_income) ? docs.gst_income : {};
  const bssc = isRecord(docs.bank_statement_salary_credit) ? docs.bank_statement_salary_credit : {};
  const epfB = isRecord(docs.epf_basic) ? docs.epf_basic : {};
  const epfA = isRecord(docs.epf_advanced) ? docs.epf_advanced : {};
  const empId = isRecord(docs.employee_id_card) ? docs.employee_id_card : {};
  const bre = isRecord(docs.bre_financial_decision) ? docs.bre_financial_decision : {};

  // Pre-extract array helpers
  const csMonths = Array.isArray(cs.months) ? cs.months : [];
  const coiYears = Array.isArray(coi.years) ? coi.years : [];
  const f16Years = Array.isArray(f16.years) ? f16.years : [];
  const f16aYears = Array.isArray(f16a.years) ? f16a.years : [];
  const fjMonths = Array.isArray(fj.months) ? fj.months : [];
  const itrNonYears = Array.isArray(itrNon.years) ? itrNon.years : [];
  const itrIndYears = Array.isArray(itrInd.years) ? itrInd.years : [];
  const pnlYears = Array.isArray(pnl.years) ? pnl.years : [];
  const ssMonths = Array.isArray(ss.months) ? ss.months : [];
  const bsMonths = Array.isArray(bs.months) ? bs.months : [];
  const sipMonths = Array.isArray(sip.months) ? sip.months : [];
  const gstYears = Array.isArray(gst.years) ? gst.years : [];
  const bsscMonths = Array.isArray(bssc.months) ? bssc.months : [];
  const epfAMonths = Array.isArray(epfA.months) ? epfA.months : [];

  const valuesMap: Record<string, Record<string, string>> = {
    financial_profession: {
      Occupation: str(fp.occupation),
      "Annual Income": str(fp.annualIncome),
      GSTIN: str(fp.gstin),
      "Industry Type": str(fp.industryType),
      "Employment Type": str(fp.employmentType),
      "Education Type": str(fp.educationType),
      "Organisation Type": str(fp.organisationType),
      "Organisation Name": str(fp.organisationName),
      Designation: str(fp.designation),
    },
    credit_bureau_details: {
      "Experian Income": str(cb.experianIncome),
      "Experian Score": str(cb.experianScore),
      "Crif Income": str(cb.crifIncome),
      "Crif Score": str(cb.crifScore),
      "Cibil Income": str(cb.cibilIncome),
      "Cibil Score": str(cb.cibilScore),
      "Imputed Income": str(cb.imputedIncome),
      "Digital Income": str(cb.digitalIncome),
      "PayU Income": str(cb.payuIncome),
      "Average Bureau Income": str(cb.averageIncome),
    },
    appointment_letter: {
      "Name of the company": str(al.companyName),
      "Name of the employee": str(al.partyName),
      "Joining Date": formatFinancialDate(al.joiningDt),
      CTC: str(al.grossSalaryPa),
    },
    commission_statement: {
      "Month 1": str(toMonthEntry(csMonths, 0).commissionAmount),
      "Month 2": str(toMonthEntry(csMonths, 1).commissionAmount),
      "Month 3": str(toMonthEntry(csMonths, 2).commissionAmount),
      "Month 4": str(toMonthEntry(csMonths, 3).commissionAmount),
      "Month 5": str(toMonthEntry(csMonths, 4).commissionAmount),
      "Month 6": str(toMonthEntry(csMonths, 5).commissionAmount),
      "Average commission pm": str(cs.avgCommissionPmCalculated),
      "Average Annual Income": str(cs.avgAnnualIncomeCalculated),
    },
    computation_of_income: {
      "Assessment Year": str(toYearEntry(coiYears, 0).assessmentYear),
      "Assessment Year Year 2": str(toYearEntry(coiYears, 1).assessmentYear),
      "Assessment Year Year 3": str(toYearEntry(coiYears, 2).assessmentYear),
      "Income from Salary(A)": str(toYearEntry(coiYears, 0).incomeFromSalary),
      "Income from Salary(A) Year 2": str(toYearEntry(coiYears, 1).incomeFromSalary),
      "Income from Salary(A) Year 3": str(toYearEntry(coiYears, 2).incomeFromSalary),
      "Income from House Property": str(toYearEntry(coiYears, 0).incomeFromHouseProperty),
      "Income from House Property Year 2": str(toYearEntry(coiYears, 1).incomeFromHouseProperty),
      "Income from House Property Year 3": str(toYearEntry(coiYears, 2).incomeFromHouseProperty),
      "Income from Business or Profession (B)": str(toYearEntry(coiYears, 0).incomeFromBusiness),
      "Income from Business or Profession (B) Year 2": str(toYearEntry(coiYears, 1).incomeFromBusiness),
      "Income from Business or Profession (B) Year 3": str(toYearEntry(coiYears, 2).incomeFromBusiness),
      "Short term & Capital Gains": str(toYearEntry(coiYears, 0).shortTermCapitalGains),
      "Short term & Capital Gains Year 2": str(toYearEntry(coiYears, 1).shortTermCapitalGains),
      "Short term & Capital Gains Year 3": str(toYearEntry(coiYears, 2).shortTermCapitalGains),
      "Income from Other Sources": str(toYearEntry(coiYears, 0).incomeFromOtherSources),
      "Income from Other Sources Year 2": str(toYearEntry(coiYears, 1).incomeFromOtherSources),
      "Income from Other Sources Year 3": str(toYearEntry(coiYears, 2).incomeFromOtherSources),
      "Agricultural Income": str(toYearEntry(coiYears, 0).agriculturalIncome),
      "Agricultural Income Year 2": str(toYearEntry(coiYears, 1).agriculturalIncome),
      "Agricultural Income Year 3": str(toYearEntry(coiYears, 2).agriculturalIncome),
      "Exempt Income(C)": str(toYearEntry(coiYears, 0).exemptIncome),
      "Exempt Income(C) Year 2": str(toYearEntry(coiYears, 1).exemptIncome),
      "Exempt Income(C) Year 3": str(toYearEntry(coiYears, 2).exemptIncome),
      "Gross Total Income": str(toYearEntry(coiYears, 0).grossTotalIncomeCalculated),
      "Gross Total Income Year 2": str(toYearEntry(coiYears, 1).grossTotalIncomeCalculated),
      "Gross Total Income Year 3": str(toYearEntry(coiYears, 2).grossTotalIncomeCalculated),
      "Total Gross Total Income": str(coi.totalGrossTotalIncomeCalculated),
      "Average Gross Total Income": str(coi.avgGrossTotalIncomeCalculated),
    },
    credit_card: {
      "Is Credit card statement in the name of LA": str(cc.nameMatchInd),
      "Is LA Defaulter in the Payment": str(cc.isDefaulter),
      "Type of Card": str(cc.cardType),
      "Credit Limit": str(cc.creditLimit),
      "Points Earned": str(cc.pointsEarned),
      "Income Earned": str(cc.incomeEarned),
      "Derived Income": str(cc.derivedIncomeCalculated),
      "Average Income": str(cc.avgIncomeCalculated),
    },
    fixed_deposit_receipt: {
      "Is Fixed Deposit Receipt in the name of LA": str(fd.nameMatchInd),
      "Is Fixed Deposit Receipts matured": str(fd.isMatured),
      "Amount Invested": str(fd.amountInvested),
      "Income Earned": str(fd.incomeEarned),
      "Derived Income": str(fd.derivedIncomeCalculated),
      "Average Income": str(fd.avgIncomeCalculated),
    },
    form16: {
      ASSESSMENT: str(toYearEntry(f16Years, 0).assessmentYear),
      "ASSESSMENT Year 2": str(toYearEntry(f16Years, 1).assessmentYear),
      "ASSESSMENT Year 3": str(toYearEntry(f16Years, 2).assessmentYear),
      "Gross Salary PA": str(toYearEntry(f16Years, 0).grossSalaryPa),
      "Gross Salary PA Year 2": str(toYearEntry(f16Years, 1).grossSalaryPa),
      "Gross Salary PA Year 3": str(toYearEntry(f16Years, 2).grossSalaryPa),
      "Average Annual Income": str(f16.avgAnnualIncomeCalculated),
      "Life Assured Pan No": str(toYearEntry(f16Years, 0).panNumber),
      "Life Assured Pan No Year 2": str(toYearEntry(f16Years, 1).panNumber),
      "Life Assured Pan No Year 3": str(toYearEntry(f16Years, 2).panNumber),
      "Life Assured Name": str(toYearEntry(f16Years, 0).partyName),
      "Life Assured Name Year 2": str(toYearEntry(f16Years, 1).partyName),
      "Life Assured Name Year 3": str(toYearEntry(f16Years, 2).partyName),
      "Company Name": str(toYearEntry(f16Years, 0).companyName),
      "Company Name Year 2": str(toYearEntry(f16Years, 1).companyName),
      "Company Name Year 3": str(toYearEntry(f16Years, 2).companyName),
      "Is Life Assured Name Same With Doc Name?": str(f16.nameMatchInd),
    },
    form16a: {
      "Assessment Year": str(toYearEntry(f16aYears, 0).assessmentYear),
      "Assessment Year Year 2": str(toYearEntry(f16aYears, 1).assessmentYear),
      "Assessment Year Year 3": str(toYearEntry(f16aYears, 2).assessmentYear),
      "Net Receipt pa": str(toYearEntry(f16aYears, 0).netReceiptPa),
      "Net Receipt pa Year 2": str(toYearEntry(f16aYears, 1).netReceiptPa),
      "Net Receipt pa Year 3": str(toYearEntry(f16aYears, 2).netReceiptPa),
      "Average Annual Income": str(f16a.avgAnnualIncomeCalculated),
    },
    form_j: {
      "Is Form J in the name of LA": str(fj.nameMatchInd),
      "Month1 Receipt1": str(toReceiptEntry(toMonthEntry(fjMonths, 0).receipts, 0).amount),
      "Month1 Receipt2": str(toReceiptEntry(toMonthEntry(fjMonths, 0).receipts, 1).amount),
      "Month1 Receipt3": str(toReceiptEntry(toMonthEntry(fjMonths, 0).receipts, 2).amount),
      "Month1 Receipt4": str(toReceiptEntry(toMonthEntry(fjMonths, 0).receipts, 3).amount),
      "Month1 Receipt5": str(toReceiptEntry(toMonthEntry(fjMonths, 0).receipts, 4).amount),
      "Month1 Receipt6": str(toReceiptEntry(toMonthEntry(fjMonths, 0).receipts, 5).amount),
      "Month2 Receipt1": str(toReceiptEntry(toMonthEntry(fjMonths, 1).receipts, 0).amount),
      "Month2 Receipt2": str(toReceiptEntry(toMonthEntry(fjMonths, 1).receipts, 1).amount),
      "Month2 Receipt3": str(toReceiptEntry(toMonthEntry(fjMonths, 1).receipts, 2).amount),
      "Month2 Receipt4": str(toReceiptEntry(toMonthEntry(fjMonths, 1).receipts, 3).amount),
      "Month2 Receipt5": str(toReceiptEntry(toMonthEntry(fjMonths, 1).receipts, 4).amount),
      "Month2 Receipt6": str(toReceiptEntry(toMonthEntry(fjMonths, 1).receipts, 5).amount),
      "Month3 Receipt1": str(toReceiptEntry(toMonthEntry(fjMonths, 2).receipts, 0).amount),
      "Month3 Receipt2": str(toReceiptEntry(toMonthEntry(fjMonths, 2).receipts, 1).amount),
      "Month3 Receipt3": str(toReceiptEntry(toMonthEntry(fjMonths, 2).receipts, 2).amount),
      "Month3 Receipt4": str(toReceiptEntry(toMonthEntry(fjMonths, 2).receipts, 3).amount),
      "Month3 Receipt5": str(toReceiptEntry(toMonthEntry(fjMonths, 2).receipts, 4).amount),
      "Month3 Receipt6": str(toReceiptEntry(toMonthEntry(fjMonths, 2).receipts, 5).amount),
      "Total Receipts Receipt1": str(fj.totalReceiptsCalculated),
      "Average Monthly Receipts Receipt1": str(fj.avgMonthlyReceiptsCalculated),
      "Annual Receipts Receipt1": str(fj.annualReceiptsCalculated),
      "Derived Income Receipt1": str(fj.derivedIncomeCalculated),
    },
    govt_bonds: {
      "Is Bond Certification in the name of LA": str(gb.nameMatchInd),
      "Is Bond Certificate matured": str(gb.isMatured),
      "Amount Invested or Maturity Value, whichever higher": str(gb.amountInvested),
      "Income Earned": str(gb.incomeEarned),
      "Derived Income": str(gb.derivedIncomeCalculated),
      "Average Income": str(gb.avgIncomeCalculated),
    },
    itr_non_individual: {
      "Name of Organisation/Firm": str(itrNon.orgName),
      "Permanent Account Number": str(itrNon.panNumber),
      "Assessment Year": str(toYearEntry(itrNonYears, 0).assessmentYear),
      "Assessment Year Year 2": str(toYearEntry(itrNonYears, 1).assessmentYear),
      "Assessment Year Year 3": str(toYearEntry(itrNonYears, 2).assessmentYear),
      "ITR Acknowledgement Number": str(toYearEntry(itrNonYears, 0).ackNumber),
      "ITR Acknowledgement Number Year 2": str(toYearEntry(itrNonYears, 1).ackNumber),
      "ITR Acknowledgement Number Year 3": str(toYearEntry(itrNonYears, 2).ackNumber),
      "Income from Salary": str(toYearEntry(itrNonYears, 0).incomeFromSalary),
      "Income from Salary Year 2": str(toYearEntry(itrNonYears, 1).incomeFromSalary),
      "Income from Salary Year 3": str(toYearEntry(itrNonYears, 2).incomeFromSalary),
      "Pan Number Matched with Barcode Number": str(toYearEntry(itrNonYears, 0).panBarcodeMatchInd),
      "Pan Number Matched with Barcode Number Year 2": str(toYearEntry(itrNonYears, 1).panBarcodeMatchInd),
      "Pan Number Matched with Barcode Number Year 3": str(toYearEntry(itrNonYears, 2).panBarcodeMatchInd),
      "Income from House Property": str(toYearEntry(itrNonYears, 0).incomeFromHouseProperty),
      "Income from House Property Year 2": str(toYearEntry(itrNonYears, 1).incomeFromHouseProperty),
      "Income from House Property Year 3": str(toYearEntry(itrNonYears, 2).incomeFromHouseProperty),
      "Income from Business or Profession": str(toYearEntry(itrNonYears, 0).incomeFromBusiness),
      "Income from Business or Profession Year 2": str(toYearEntry(itrNonYears, 1).incomeFromBusiness),
      "Income from Business or Profession Year 3": str(toYearEntry(itrNonYears, 2).incomeFromBusiness),
      "Short term & Capital Gains": str(toYearEntry(itrNonYears, 0).shortTermCapitalGains),
      "Short term & Capital Gains Year 2": str(toYearEntry(itrNonYears, 1).shortTermCapitalGains),
      "Short term & Capital Gains Year 3": str(toYearEntry(itrNonYears, 2).shortTermCapitalGains),
      "Income from Other Sources": str(toYearEntry(itrNonYears, 0).incomeFromOtherSources),
      "Income from Other Sources Year 2": str(toYearEntry(itrNonYears, 1).incomeFromOtherSources),
      "Income from Other Sources Year 3": str(toYearEntry(itrNonYears, 2).incomeFromOtherSources),
      "Agricultural Income": str(toYearEntry(itrNonYears, 0).agriculturalIncome),
      "Agricultural Income Year 2": str(toYearEntry(itrNonYears, 1).agriculturalIncome),
      "Agricultural Income Year 3": str(toYearEntry(itrNonYears, 2).agriculturalIncome),
      "Exempt Income": str(toYearEntry(itrNonYears, 0).exemptIncome),
      "Exempt Income Year 2": str(toYearEntry(itrNonYears, 1).exemptIncome),
      "Exempt Income Year 3": str(toYearEntry(itrNonYears, 2).exemptIncome),
      "Gross Total Income": str(toYearEntry(itrNonYears, 0).grossTotalIncomeCalculated),
      "Gross Total Income Year 2": str(toYearEntry(itrNonYears, 1).grossTotalIncomeCalculated),
      "Gross Total Income Year 3": str(toYearEntry(itrNonYears, 2).grossTotalIncomeCalculated),
      "Total Gross Total Income": str(itrNon.totalGrossTotalIncomeCalculated),
      "Average Gross Total Income": str(itrNon.avgGrossTotalIncomeCalculated),
    },
    itr_individual: {
      "Name of Organisation/Firm": str(itrInd.orgName),
      "Permanent Account Number": str(itrInd.panNumber),
      "Assessment Year": str(toYearEntry(itrIndYears, 0).assessmentYear),
      "Assessment Year Year 2": str(toYearEntry(itrIndYears, 1).assessmentYear),
      "Assessment Year Year 3": str(toYearEntry(itrIndYears, 2).assessmentYear),
      "ITR Acknowledgement Number": str(toYearEntry(itrIndYears, 0).ackNumber),
      "ITR Acknowledgement Number Year 2": str(toYearEntry(itrIndYears, 1).ackNumber),
      "ITR Acknowledgement Number Year 3": str(toYearEntry(itrIndYears, 2).ackNumber),
      "Pan Number Matched with Barcode Number": str(toYearEntry(itrIndYears, 0).panBarcodeMatchInd),
      "Pan Number Matched with Barcode Number Year 2": str(toYearEntry(itrIndYears, 1).panBarcodeMatchInd),
      "Pan Number Matched with Barcode Number Year 3": str(toYearEntry(itrIndYears, 2).panBarcodeMatchInd),
      "Date of Filling ITR": formatFinancialDate(toYearEntry(itrIndYears, 0).itrFilingDt),
      "Date of Filling ITR Year 2": formatFinancialDate(toYearEntry(itrIndYears, 1).itrFilingDt),
      "Date of Filling ITR Year 3": formatFinancialDate(toYearEntry(itrIndYears, 2).itrFilingDt),
      "Income from Salary(A)": str(toYearEntry(itrIndYears, 0).incomeFromSalary),
      "Income from Salary(A) Year 2": str(toYearEntry(itrIndYears, 1).incomeFromSalary),
      "Income from Salary(A) Year 3": str(toYearEntry(itrIndYears, 2).incomeFromSalary),
      "Income from House Property": str(toYearEntry(itrIndYears, 0).incomeFromHouseProperty),
      "Income from House Property Year 2": str(toYearEntry(itrIndYears, 1).incomeFromHouseProperty),
      "Income from House Property Year 3": str(toYearEntry(itrIndYears, 2).incomeFromHouseProperty),
      "Income from Business or Profession(B)": str(toYearEntry(itrIndYears, 0).incomeFromBusiness),
      "Income from Business or Profession(B) Year 2": str(toYearEntry(itrIndYears, 1).incomeFromBusiness),
      "Income from Business or Profession(B) Year 3": str(toYearEntry(itrIndYears, 2).incomeFromBusiness),
      "Short term & Capital Gains": str(toYearEntry(itrIndYears, 0).shortTermCapitalGains),
      "Short term & Capital Gains Year 2": str(toYearEntry(itrIndYears, 1).shortTermCapitalGains),
      "Short term & Capital Gains Year 3": str(toYearEntry(itrIndYears, 2).shortTermCapitalGains),
      "Income from Other Sources": str(toYearEntry(itrIndYears, 0).incomeFromOtherSources),
      "Income from Other Sources Year 2": str(toYearEntry(itrIndYears, 1).incomeFromOtherSources),
      "Income from Other Sources Year 3": str(toYearEntry(itrIndYears, 2).incomeFromOtherSources),
      "Agricultural Income": str(toYearEntry(itrIndYears, 0).agriculturalIncome),
      "Agricultural Income Year 2": str(toYearEntry(itrIndYears, 1).agriculturalIncome),
      "Agricultural Income Year 3": str(toYearEntry(itrIndYears, 2).agriculturalIncome),
      "Exempt Income(C)": str(toYearEntry(itrIndYears, 0).exemptIncome),
      "Exempt Income(C) Year 2": str(toYearEntry(itrIndYears, 1).exemptIncome),
      "Exempt Income(C) Year 3": str(toYearEntry(itrIndYears, 2).exemptIncome),
      "Gross Total Income(A+B+C)": str(toYearEntry(itrIndYears, 0).grossTotalIncomeCalculated),
      "Gross Total Income(A+B+C) Year 2": str(toYearEntry(itrIndYears, 1).grossTotalIncomeCalculated),
      "Gross Total Income(A+B+C) Year 3": str(toYearEntry(itrIndYears, 2).grossTotalIncomeCalculated),
      "Total Gross Total Income": str(itrInd.totalGrossTotalIncomeCalculated),
      "Average Gross Total Income": str(itrInd.avgGrossTotalIncomeCalculated),
      "PF deduction - Salaried customers": str(toYearEntry(itrIndYears, 0).pfDeduction),
      "PF deduction - Salaried customers Year 2": str(toYearEntry(itrIndYears, 1).pfDeduction),
      "PF deduction - Salaried customers Year 3": str(toYearEntry(itrIndYears, 2).pfDeduction),
      "Life Assured Name": str(toYearEntry(itrIndYears, 0).partyName),
      "Life Assured Name Year 2": str(toYearEntry(itrIndYears, 1).partyName),
      "Life Assured Name Year 3": str(toYearEntry(itrIndYears, 2).partyName),
      "Is Life Assured Name Same?": str(itrInd.nameMatchInd),
    },
    loan_statement: {
      "Is Loan Statements in the name of LA": str(ls.nameMatchInd),
      "Is LA Defaulter in the Payment": str(ls.isDefaulter),
      "Monthly EMI as per Schedule": str(ls.monthlyEmi),
      "Income Earned": str(ls.incomeEarned),
      "Derived Income": str(ls.derivedIncomeCalculated),
      "Average Income": str(ls.avgIncomeCalculated),
    },
    mutual_fund: {
      "Is Mutual Fund Statement in the name of LA": str(mf.nameMatchInd),
      "Latest Market Value (as per NAV) in Statement": str(mf.latestMarketValue),
      "Income Earned": str(mf.incomeEarned),
      "Derived Income": str(mf.derivedIncomeCalculated),
      "Average Income": str(mf.avgIncomeCalculated),
    },
    pension_statement: {
      "Total Monthly Pension": str(ps.totalMonthlyPension),
      "Pension Received pa": str(ps.pensionReceivedPaCalculated),
    },
    profit_and_loss: {
      "Name of Organization/Firm": str(pnl.orgName),
      "Assessment Year": str(toYearEntry(pnlYears, 0).assessmentYear),
      "Assessment Year Year 2": str(toYearEntry(pnlYears, 1).assessmentYear),
      "Assessment Year Year 3": str(toYearEntry(pnlYears, 2).assessmentYear),
      "Shareholders Funds / Partners Capital": str(toYearEntry(pnlYears, 0).totalShareholdersFunds),
      "Shareholders Funds / Partners Capital Year 2": str(toYearEntry(pnlYears, 1).totalShareholdersFunds),
      "Shareholders Funds / Partners Capital Year 3": str(toYearEntry(pnlYears, 2).totalShareholdersFunds),
      "Share Capital or Fixed/Fluctuating Capital": str(toYearEntry(pnlYears, 0).shareCapital),
      "Share Capital or Fixed/Fluctuating Capital Year 2": str(toYearEntry(pnlYears, 1).shareCapital),
      "Share Capital or Fixed/Fluctuating Capital Year 3": str(toYearEntry(pnlYears, 2).shareCapital),
      "Reserves & Surplus": str(toYearEntry(pnlYears, 0).reservesSurplus),
      "Reserves & Surplus Year 2": str(toYearEntry(pnlYears, 1).reservesSurplus),
      "Reserves & Surplus Year 3": str(toYearEntry(pnlYears, 2).reservesSurplus),
      "Total Shareholders Funds or Partner's Fund": str(toYearEntry(pnlYears, 0).totalShareholdersFunds),
      "Total Shareholders Funds or Partner's Fund Year 2": str(toYearEntry(pnlYears, 1).totalShareholdersFunds),
      "Total Shareholders Funds or Partner's Fund Year 3": str(toYearEntry(pnlYears, 2).totalShareholdersFunds),
      "Profit Calculation": "",
      "Profit Calculation Year 2": "",
      "Profit Calculation Year 3": "",
      "Profit Before Depreciation & Tax (PBDT)": str(toYearEntry(pnlYears, 0).pbdt),
      "Profit Before Depreciation & Tax (PBDT) Year 2": str(toYearEntry(pnlYears, 1).pbdt),
      "Profit Before Depreciation & Tax (PBDT) Year 3": str(toYearEntry(pnlYears, 2).pbdt),
      "Less : Depreciation": str(toYearEntry(pnlYears, 0).depreciation),
      "Less : Depreciation Year 2": str(toYearEntry(pnlYears, 1).depreciation),
      "Less : Depreciation Year 3": str(toYearEntry(pnlYears, 2).depreciation),
      "Profit Before Tax (PBT)": str(toYearEntry(pnlYears, 0).pbt),
      "Profit Before Tax (PBT) Year 2": str(toYearEntry(pnlYears, 1).pbt),
      "Profit Before Tax (PBT) Year 3": str(toYearEntry(pnlYears, 2).pbt),
      Tax: str(toYearEntry(pnlYears, 0).tax),
      "Tax Year 2": str(toYearEntry(pnlYears, 1).tax),
      "Tax Year 3": str(toYearEntry(pnlYears, 2).tax),
      "Profit After Tax (PAT)": str(toYearEntry(pnlYears, 0).profitAfterTax),
      "Profit After Tax (PAT) Year 2": str(toYearEntry(pnlYears, 1).profitAfterTax),
      "Profit After Tax (PAT) Year 3": str(toYearEntry(pnlYears, 2).profitAfterTax),
      "Profit After Tax of Last Year": str(toYearEntry(pnlYears, 0).profitAfterTaxOfLastYearCalculated),
      "Profit After Tax of Last Year Year 2": str(toYearEntry(pnlYears, 1).profitAfterTaxOfLastYearCalculated),
      "Profit After Tax of Last Year Year 3": str(toYearEntry(pnlYears, 2).profitAfterTaxOfLastYearCalculated),
      "Rise In Profit as compared to Last Year": str(toYearEntry(pnlYears, 0).riseInProfitCalculated),
      "Rise In Profit as compared to Last Year Year 2": str(toYearEntry(pnlYears, 1).riseInProfitCalculated),
      "Rise In Profit as compared to Last Year Year 3": str(toYearEntry(pnlYears, 2).riseInProfitCalculated),
      "% Rise In Profit as compared to Last Year": str(toYearEntry(pnlYears, 0).riseInProfitPctCalculated),
      "% Rise In Profit as compared to Last Year Year 2": str(toYearEntry(pnlYears, 1).riseInProfitPctCalculated),
      "% Rise In Profit as compared to Last Year Year 3": str(toYearEntry(pnlYears, 2).riseInProfitPctCalculated),
      "Income Calculation": "",
      "Income Calculation Year 2": "",
      "Income Calculation Year 3": "",
      Sales: str(toYearEntry(pnlYears, 0).sales),
      "Sales Year 2": str(toYearEntry(pnlYears, 1).sales),
      "Sales Year 3": str(toYearEntry(pnlYears, 2).sales),
      "Sales of Last Year": str(toYearEntry(pnlYears, 0).salesOfLastYearCalculated),
      "Sales of Last Year Year 2": str(toYearEntry(pnlYears, 1).salesOfLastYearCalculated),
      "Sales of Last Year Year 3": str(toYearEntry(pnlYears, 2).salesOfLastYearCalculated),
      "Rise In Sales as compared to Last Year": str(toYearEntry(pnlYears, 0).riseInSalesCalculated),
      "Rise In Sales as compared to Last Year Year 2": str(toYearEntry(pnlYears, 1).riseInSalesCalculated),
      "Rise In Sales as compared to Last Year Year 3": str(toYearEntry(pnlYears, 2).riseInSalesCalculated),
      "% Rise In Sales as compared to Last Year": str(toYearEntry(pnlYears, 0).riseInSalesPctCalculated),
      "% Rise In Sales as compared to Last Year Year 2": str(toYearEntry(pnlYears, 1).riseInSalesPctCalculated),
      "% Rise In Sales as compared to Last Year Year 3": str(toYearEntry(pnlYears, 2).riseInSalesPctCalculated),
      "Average Gross Income": str(pnl.avgGrossIncomeCalculated),
      "Average Profit Before Tax": str(pnl.avgProfitBeforeTaxCalculated),
      "Average Profit After Tax": str(pnl.avgProfitAfterTaxCalculated),
    },
    property_purchase: {
      "Is Property purchased by LA": str(pp.isPurchasedByLa),
      "Purchase Price": str(pp.purchasePrice),
      "Financial Year of Purchase": str(pp.financialYearOfPurchase),
      "Estimated Market Value of Property": str(pp.estimatedMarketValue),
      "Derived Income": str(pp.derivedIncomeCalculated),
    },
    property_valuation: {
      "Is Property Valuation Report in the name of LA": str(pv.nameMatchInd),
      "Estimated Market Value of Property(as per report)": str(pv.estimatedMarketValue),
      "Derived Income": str(pv.derivedIncomeCalculated),
    },
    salary_certificate: {
      "Gross Salary PA": str(sc.grossSalaryPa),
      "Derived Income": str(sc.derivedIncomeCalculated),
    },
    salary_revision_letter: {
      "Gross Salary PA": str(srl.grossSalaryPa),
      "Derived Income": str(srl.derivedIncomeCalculated),
    },
    salary_slips: {
      "Gross Salary Pm1": str(toMonthEntry(ssMonths, 0).monthlyGrossSalary),
      "Gross Salary Pm2": str(toMonthEntry(ssMonths, 1).monthlyGrossSalary),
      "Gross Salary Pm3": str(toMonthEntry(ssMonths, 2).monthlyGrossSalary),
      "Gross Salary Pm4": str(toMonthEntry(ssMonths, 3).monthlyGrossSalary),
      "Gross Salary Pm5": str(toMonthEntry(ssMonths, 4).monthlyGrossSalary),
      "Gross Salary Pm6": str(toMonthEntry(ssMonths, 5).monthlyGrossSalary),
      "Average Salary pm": str(ss.avgSalaryPmCalculated),
      "Gross Salary pa": str(ss.grossSalaryPaCalculated),
      "Annual Bonus/Incentive/Reimbursement": str(ss.annualBonus),
      "Average Annual Income": str(ss.avgAnnualIncomeCalculated),
      "Company Name": str(ss.companyName),
      "Life Assured Name": str(ss.partyName),
      "Is Life Assured Name Same?": str(ss.nameMatchInd),
      "PF / UAN No": str(ss.pfUan),
    },
    bank_statement: {
      "Is Bank Statement in the name of LA/his Business": str(bs.nameMatchInd),
      "Latest 6 months statements given": str(bs.latest6MonthsInd),
      "Any Overdraft(Negative/Debit) Balances": str(bs.overdraftInd),
      "Monthly Closing Bal 1": str(toMonthEntry(bsMonths, 0).closingBalance),
      "Monthly Closing Bal 2": str(toMonthEntry(bsMonths, 1).closingBalance),
      "Monthly Closing Bal 3": str(toMonthEntry(bsMonths, 2).closingBalance),
      "Monthly Closing Bal 4": str(toMonthEntry(bsMonths, 3).closingBalance),
      "Monthly Closing Bal 5": str(toMonthEntry(bsMonths, 4).closingBalance),
      "Monthly Closing Bal 6": str(toMonthEntry(bsMonths, 5).closingBalance),
      "Average Bank Balance": str(bs.avgBankBalanceCalculated),
      "Average Annual income": str(bs.avgAnnualIncomeCalculated),
      "Opening Balance": str(bs.openingBalance),
      "Statement Period": str(bs.statementPeriod),
      "Life Assured Name": str(bs.fullName),
      "Is LA Name Match with Doc Name?": str(bs.nameMatchInd),
      "Life Insurance Premium Deduction Entry": str(bs.liPremiumDeductionInd),
      "Wine Beer_Entries": str(bs.wineBeerEntriesInd),
      "Med Entry": str(bs.medEntryInd),
    },
    stock_holding: {
      "Is Stock Holding Stmt in name of LA/his Business": str(sh.nameMatchInd),
      "Gross Total Market Value as per the Stmt": str(sh.estimatedMarketValue),
      "Income Earned": str(sh.incomeEarned),
      "Derived Income": str(sh.derivedIncomeCalculated),
      "Average Income": str(sh.avgIncomeCalculated),
    },
    vehicle_ownership: {
      "Is Registration Papers in the name of LA": str(vo.isRegNameLa),
      "Is Purchase invoices in the name of LA": str(vo.isInvoiceNameLa),
      "Purchase Price": str(vo.purchasePrice),
      "Vehicle RC Number": str(vo.vehicleRcNumber),
      "Derived Income": str(vo.derivedIncomeCalculated),
    },
    vahan: {
      "Is Registration Papers in the Name of LA": str(vahan.isRegNameLa),
      "Is Purchase Invoices in the Name of LA": str(vahan.isInvoiceNameLa),
      "Car RC Number": str(vahan.carRcNumber),
      IDV: str(vahan.idv),
      "Average Annual Income": str(vahan.avgAnnualIncomeCalculated),
    },
    sip_statement: {
      "Latest 6 Months SIP Statements Given": str(sip.latest6MonthsInd),
      "Is SIP Statements in the Name of LA": str(sip.isLaNameSame),
      "SIP of Month1": str(toMonthEntry(sipMonths, 0).month),
      "SIP Per Month 1": str(toMonthEntry(sipMonths, 0).sipAmount),
      "SIP of Month2": str(toMonthEntry(sipMonths, 1).month),
      "SIP Per Month2": str(toMonthEntry(sipMonths, 1).sipAmount),
      "SIP of Month 3": str(toMonthEntry(sipMonths, 2).month),
      "SIP Per Month 3": str(toMonthEntry(sipMonths, 2).sipAmount),
      "SIP of Month 4": str(toMonthEntry(sipMonths, 3).month),
      "SIP Per Month4": str(toMonthEntry(sipMonths, 3).sipAmount),
      "SIP of Month5": str(toMonthEntry(sipMonths, 4).month),
      "SIP Per Month 5": str(toMonthEntry(sipMonths, 4).sipAmount),
      "SIP of Month 6": str(toMonthEntry(sipMonths, 5).month),
      "SIP Per Month 6": str(toMonthEntry(sipMonths, 5).sipAmount),
      "Average Monthly SIP": str(sip.avgMonthlySipCalculated),
      "Average Annual Income": str(sip.avgAnnualIncomeCalculated),
    },
    gst_income: {
      "Assessment Year": str(toYearEntry(gstYears, 0).assessmentYear),
      "Assessment Year Year 2": str(toYearEntry(gstYears, 1).assessmentYear),
      "Assessment Year Year 3": str(toYearEntry(gstYears, 2).assessmentYear),
      "Assessment Year Year 4": str(toYearEntry(gstYears, 3).assessmentYear),
      "Gross Sales": str(toYearEntry(gstYears, 0).grossSales),
      "Gross Sales Year 2": str(toYearEntry(gstYears, 1).grossSales),
      "Gross Sales Year 3": str(toYearEntry(gstYears, 2).grossSales),
      "Gross Sales Year 4": str(toYearEntry(gstYears, 3).grossSales),
      "Gross Purchases": str(toYearEntry(gstYears, 0).grossPurchases),
      "Gross Purchases Year 2": str(toYearEntry(gstYears, 1).grossPurchases),
      "Gross Purchases Year 3": str(toYearEntry(gstYears, 2).grossPurchases),
      "Gross Purchases Year 4": str(toYearEntry(gstYears, 3).grossPurchases),
      "Profit After GST": str(toYearEntry(gstYears, 0).profitAfterGst),
      "Profit After GST Year 2": str(toYearEntry(gstYears, 1).profitAfterGst),
      "Profit After GST Year 3": str(toYearEntry(gstYears, 2).profitAfterGst),
      "Profit After GST Year 4": str(toYearEntry(gstYears, 3).profitAfterGst),
      "Total of Gross Sales": str(gst.totalGrossSalesCalculated),
      "Average Gross Sales": str(gst.avgGrossSalesCalculated),
      "Average Annual Income": str(gst.avgAnnualIncomeCalculated),
    },
    bank_statement_salary_credit: {
      "Is Bank Statement in the Name of LA": str(bssc.nameMatchInd),
      "Net Salary Month1": str(toMonthEntry(bsscMonths, 0).month),
      "Net Salary Credited PM1": str(toMonthEntry(bsscMonths, 0).netSalaryCredited),
      "Net Salary Month 2": str(toMonthEntry(bsscMonths, 1).month),
      "Net Salary Credited PM2": str(toMonthEntry(bsscMonths, 1).netSalaryCredited),
      "Net Salary Month 3": str(toMonthEntry(bsscMonths, 2).month),
      "Net Salary Credited PM3": str(toMonthEntry(bsscMonths, 2).netSalaryCredited),
      "Net Salary Month 4": str(toMonthEntry(bsscMonths, 3).month),
      "Net Salary Credited PM4": str(toMonthEntry(bsscMonths, 3).netSalaryCredited),
      "Net Salary Month 5": str(toMonthEntry(bsscMonths, 4).month),
      "Net Salary Credited PM 5": str(toMonthEntry(bsscMonths, 4).netSalaryCredited),
      "Net Salary Month 6": str(toMonthEntry(bsscMonths, 5).month),
      "Net Salary Credited PM 6": str(toMonthEntry(bsscMonths, 5).netSalaryCredited),
      "Average Net Salary Credited PM": str(bssc.avgNetSalaryCreditedPmCalculated),
      "Net Salary Credited PA": str(bssc.netSalaryCreditedPaCalculated),
      "Annual Bonus /Incentive /Reimbursement": str(bssc.annualBonus),
      "Average Annual Income": str(bssc.avgAnnualIncomeCalculated),
      "Salary Credited": str(bssc.salaryCreditedInd),
      "Opening Balance": str(bssc.openingBalance),
      "Closing Balance": str(bssc.closingBalance),
      "Statement Period": str(bssc.statementPeriod),
      "Life Assured Name": str(bssc.fullName),
      "Is LA Name Match with Doc Name?": str(bssc.nameMatchInd),
    },
    epf_basic: {
      "Latest Organization Name": str(epfB.orgName),
      "Is Organization Name Same?": str(epfB.isOrgNameSame),
      Income: str(epfB.income),
    },
    epf_advanced: {
      "Latest Organization Name": str(epfA.orgName),
      "Is Organization Name Same?": str(epfA.isOrgNameSame),
      "Annual Income": str(epfA.annualIncomeCalculated),
      "Month 1": str(toMonthEntry(epfAMonths, 0).pfContribution),
      "Month 2": str(toMonthEntry(epfAMonths, 1).pfContribution),
      "Month 3": str(toMonthEntry(epfAMonths, 2).pfContribution),
      "Month 4": str(toMonthEntry(epfAMonths, 3).pfContribution),
      "Month 5": str(toMonthEntry(epfAMonths, 4).pfContribution),
      "Month 6": str(toMonthEntry(epfAMonths, 5).pfContribution),
    },
    employee_id_card: {
      "Name of the company": str(empId.companyName),
      "Name of the employee": str(empId.employeeName),
      "Employee number": str(empId.employeeNumber),
      "Photo available": str(empId.photoAvailableInd),
    },
    bre_financial_decision: {
      "Financial Decision": str(bre.financialDecision),
      "Financial Eligibility": str(bre.financialEligibility),
      "Derived Income": str(bre.derivedIncome),
      "Verified Income": str(bre.verifiedIncome),
      "Counter Offer Value": str(bre.counterOfferValue),
      "Additional SA": str(bre.additionalSa),
      "BIU Financial Status": str(bre.biuFinancialStatus),
      "Final Bureau Income": str(bre.finalBureauIncome),
      "Reinsurer Case": str(bre.reinsurerCase),
      "Financial Remark": str(bre.financialRemark),
    },
  };

  const extraValuesMap: Record<string, Record<string, string>> = {
    commission_statement: {
      "commission_statement-entry-month-1": str(toMonthEntry(csMonths, 0).month),
      "commission_statement-entry-income-1": str(toMonthEntry(csMonths, 0).commissionAmount),
      "commission_statement-entry-month-2": str(toMonthEntry(csMonths, 1).month),
      "commission_statement-entry-income-2": str(toMonthEntry(csMonths, 1).commissionAmount),
      "commission_statement-entry-month-3": str(toMonthEntry(csMonths, 2).month),
      "commission_statement-entry-income-3": str(toMonthEntry(csMonths, 2).commissionAmount),
      "commission_statement-entry-month-4": str(toMonthEntry(csMonths, 3).month),
      "commission_statement-entry-income-4": str(toMonthEntry(csMonths, 3).commissionAmount),
      "commission_statement-entry-month-5": str(toMonthEntry(csMonths, 4).month),
      "commission_statement-entry-income-5": str(toMonthEntry(csMonths, 4).commissionAmount),
      "commission_statement-entry-month-6": str(toMonthEntry(csMonths, 5).month),
      "commission_statement-entry-income-6": str(toMonthEntry(csMonths, 5).commissionAmount),
    },
    bank_statement_salary_credit: {
      "bank_statement_salary_credit-entry-month-1": str(toMonthEntry(bsscMonths, 0).month),
      "bank_statement_salary_credit-entry-income-1": str(toMonthEntry(bsscMonths, 0).netSalaryCredited),
      "bank_statement_salary_credit-entry-month-2": str(toMonthEntry(bsscMonths, 1).month),
      "bank_statement_salary_credit-entry-income-2": str(toMonthEntry(bsscMonths, 1).netSalaryCredited),
      "bank_statement_salary_credit-entry-month-3": str(toMonthEntry(bsscMonths, 2).month),
      "bank_statement_salary_credit-entry-income-3": str(toMonthEntry(bsscMonths, 2).netSalaryCredited),
      "bank_statement_salary_credit-entry-month-4": str(toMonthEntry(bsscMonths, 3).month),
      "bank_statement_salary_credit-entry-income-4": str(toMonthEntry(bsscMonths, 3).netSalaryCredited),
      "bank_statement_salary_credit-entry-month-5": str(toMonthEntry(bsscMonths, 4).month),
      "bank_statement_salary_credit-entry-income-5": str(toMonthEntry(bsscMonths, 4).netSalaryCredited),
      "bank_statement_salary_credit-entry-month-6": str(toMonthEntry(bsscMonths, 5).month),
      "bank_statement_salary_credit-entry-income-6": str(toMonthEntry(bsscMonths, 5).netSalaryCredited),
    },
    epf_advanced: {
      "epf_advanced-entry-month-1": str(toMonthEntry(epfAMonths, 0).month),
      "epf_advanced-entry-income-1": str(toMonthEntry(epfAMonths, 0).pfContribution),
      "epf_advanced-entry-month-2": str(toMonthEntry(epfAMonths, 1).month),
      "epf_advanced-entry-income-2": str(toMonthEntry(epfAMonths, 1).pfContribution),
      "epf_advanced-entry-month-3": str(toMonthEntry(epfAMonths, 2).month),
      "epf_advanced-entry-income-3": str(toMonthEntry(epfAMonths, 2).pfContribution),
      "epf_advanced-entry-month-4": str(toMonthEntry(epfAMonths, 3).month),
      "epf_advanced-entry-income-4": str(toMonthEntry(epfAMonths, 3).pfContribution),
      "epf_advanced-entry-month-5": str(toMonthEntry(epfAMonths, 4).month),
      "epf_advanced-entry-income-5": str(toMonthEntry(epfAMonths, 4).pfContribution),
      "epf_advanced-entry-month-6": str(toMonthEntry(epfAMonths, 5).month),
      "epf_advanced-entry-income-6": str(toMonthEntry(epfAMonths, 5).pfContribution),
    },
    form_j: {
      "form_j-month-Month1": str(toMonthEntry(fjMonths, 0).month),
      "form_j-month-Month2": str(toMonthEntry(fjMonths, 1).month),
      "form_j-month-Month3": str(toMonthEntry(fjMonths, 2).month),
    },
    salary_slips: {
      "salary_slips-0-month": str(toMonthEntry(ssMonths, 0).month),
      "salary_slips-1-month": str(toMonthEntry(ssMonths, 1).month),
      "salary_slips-2-month": str(toMonthEntry(ssMonths, 2).month),
      "salary_slips-3-month": str(toMonthEntry(ssMonths, 3).month),
      "salary_slips-4-month": str(toMonthEntry(ssMonths, 4).month),
      "salary_slips-5-month": str(toMonthEntry(ssMonths, 5).month),
    },
    bank_statement: {
      "bank_statement-3-month": str(toMonthEntry(bsMonths, 0).month),
      "bank_statement-4-month": str(toMonthEntry(bsMonths, 1).month),
      "bank_statement-5-month": str(toMonthEntry(bsMonths, 2).month),
      "bank_statement-6-month": str(toMonthEntry(bsMonths, 3).month),
      "bank_statement-7-month": str(toMonthEntry(bsMonths, 4).month),
      "bank_statement-8-month": str(toMonthEntry(bsMonths, 5).month),
    },
    sip_statement: {
      "sip_statement-3-month": str(toMonthEntry(sipMonths, 0).month),
      "sip_statement-5-month": str(toMonthEntry(sipMonths, 1).month),
      "sip_statement-7-month": str(toMonthEntry(sipMonths, 2).month),
      "sip_statement-9-month": str(toMonthEntry(sipMonths, 3).month),
      "sip_statement-11-month": str(toMonthEntry(sipMonths, 4).month),
      "sip_statement-13-month": str(toMonthEntry(sipMonths, 5).month),
    },
  };

  const templateMap = new Map<string, FinancialSection>();
  for (const s of baseSections) {
    templateMap.set(s.key, s);
  }

  const sectionsToMap: FinancialSection[] =
    tableOfDocs && tableOfDocs.length > 0
      ? tableOfDocs.map((docItem) => {
          const key = docItem.value;
          const template = templateMap.get(key);
          const title = docItem.description?.trim() || template?.title || key;

          if (template) {
            return {
              ...template,
              title,
            };
          }

          return {
            key,
            title,
            cols: 3,
            fields: [],
          };
        })
      : [...baseSections];

  return sectionsToMap.map((section) => {
    const sectionValues = valuesMap[section.key];
    const extraValues = extraValuesMap[section.key];
    const rawDoc = isRecord(docs[section.key]) ? docs[section.key] : undefined;
    if (!sectionValues && !extraValues) {
      return rawDoc ? { ...section, rawDocument: rawDoc } : section;
    }

    const fields = section.fields.map(([label, defaultValue, required]) => {
      const mappedValue = sectionValues?.[label];
      const nextValue = mappedValue !== undefined ? mappedValue : defaultValue;
      return [label, nextValue, required] as const;
    });

    return {
      ...section,
      fields,
      ...(extraValues ? { extraValues } : {}),
      ...(rawDoc ? { rawDocument: rawDoc } : {}),
    };
  });
}

/**
 * Top-level mapper for the Financial Fetch response payload.
 */
export function mapFinancialFetchPayload(
  payload: unknown,
  baseSections: readonly FinancialSection[] = FINANCIAL_SECTIONS,
): FinancialSection[] {
  if (!isRecord(payload)) return [...baseSections];
  const data = isRecord(payload.data) ? payload.data : payload;
  const docs = isRecord(data.documents) ? data.documents : data;
  const tableOfDocs = Array.isArray(data.table_of_finance_documents)
    ? (data.table_of_finance_documents as TableOfFinanceDocument[])
    : null;

  return mapFinancialDocumentsToSections(docs, baseSections, tableOfDocs);
}
