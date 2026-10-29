/**
 * Configuration for the View Financial section (DVT / Group).
 * Section order, field order, layouts and locked fields mirror the
 * "View Financial" screen of design-reference/ui-prototypes/Group/DVT Informal/dvt-drs.html.
 */

/** [label, value, required?] */
export type FinancialFieldDef = readonly [label: string, value: string, required?: boolean];

export interface FinancialSection {
  key: string;
  title: string;
  /** Number of columns of the default field grid. */
  cols: number;
  fields: readonly FinancialFieldDef[];
}

/** A label shown in the UI, optionally mapped to a differently named field. */
export type FinancialLabelRef = string | { readonly label: string; readonly fieldLabel?: string };

export type FinancialTableKind = "year3" | "year4" | "receipts";

export interface FinancialTableLayout {
  kind: FinancialTableKind;
  title?: string;
  top?: readonly string[];
  rows: readonly string[];
  bottom?: readonly FinancialLabelRef[];
}

export interface FinancialMonthlyIncomeLayout {
  top: readonly string[];
  average: readonly string[];
  /** Number of "Month / Income" entry rows. */
  entries: number;
}

export interface FinancialStatementLayout {
  top?: readonly string[];
  monthly: readonly FinancialLabelRef[];
  calculated?: readonly string[];
  trailing?: readonly string[];
}

export type FinancialControlKind = "text" | "yesNo" | "decision" | "date" | "month";

export interface FinancialOption {
  label: string;
  value: string;
}

export interface FinancialApplicantTab {
  key: string;
  label: string;
}

export type FinancialSubmitPayload = {
  applicantKey: string;
  values: Readonly<Record<string, string>>;
  reviews: Readonly<Record<string, "agree" | "disagree">>;
};

export const FINANCIAL_SECTIONS: readonly FinancialSection[] = [
  {
    key: "financial_profession",
    title: "Application Form Financial & Professional Details",
    cols: 3,
    fields: [
      ["Occupation", "SPVT"],
      ["Annual Income", "₹ 50,00,000"],
      ["GSTIN", "-"],
      ["Industry Type", "-"],
      ["Employment Type", "-"],
      ["Education Type", "-"],
      ["Organisation Type", "PVT"],
      ["Organisation Name", "3I INFOTECH"],
      ["Designation", "-"],
    ],
  },
  {
    key: "credit_bureau_details",
    title: "Credit Bureau Details",
    cols: 3,
    fields: [
      ["Experian Income", ""],
      ["Experian Score", ""],
      ["Crif Income", ""],
      ["Crif Score", ""],
      ["Cibil Income", ""],
      ["Cibil Score", ""],
      ["Imputed Income", ""],
      ["Digital Income", ""],
      ["PayU Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "appointment_letter",
    title: "Appointment Letter / Contract of Employer",
    cols: 3,
    fields: [
      ["Name of the company", "3I INFOTECH"],
      ["Name of the employee", "Rudra Prakash Sangha"],
      ["Joining Date", "15/06/2018", true],
      ["CTC", "₹ 12,00,000", true],
    ],
  },
  {
    key: "commission_statement",
    title: "Commission Statement",
    cols: 4,
    fields: [
      ["Month 1", "", true],
      ["Month 2", ""],
      ["Month 3", ""],
      ["Month 4", ""],
      ["Month 5", ""],
      ["Month 6", ""],
      ["Average commission pm", ""],
      ["Average Annual Income", ""],
    ],
  },
  {
    key: "computation_of_income",
    title: "Computation Of Income",
    cols: 3,
    fields: [
      ["Assessment Year", "2025-26", true],
      ["Assessment Year Year 2", "2024-25", true],
      ["Assessment Year Year 3", "2023-24"],
      ["Income from Salary(A)", "₹ 12,00,000", true],
      ["Income from Salary(A) Year 2", "₹ 11,00,000", true],
      ["Income from Salary(A) Year 3", "₹ 10,00,000"],
      ["Income from House Property", "₹ 0"],
      ["Income from House Property Year 2", ""],
      ["Income from House Property Year 3", ""],
      ["Income from Business or Profession (B)", "₹ 0", true],
      ["Income from Business or Profession (B) Year 2", "", true],
      ["Income from Business or Profession (B) Year 3", ""],
      ["Short term & Capital Gains", "₹ 0"],
      ["Short term & Capital Gains Year 2", ""],
      ["Short term & Capital Gains Year 3", ""],
      ["Income from Other Sources", "₹ 50,000"],
      ["Income from Other Sources Year 2", ""],
      ["Income from Other Sources Year 3", ""],
      ["Agricultural Income", "₹ 0"],
      ["Agricultural Income Year 2", ""],
      ["Agricultural Income Year 3", ""],
      ["Exempt Income(C)", "₹ 0", true],
      ["Exempt Income(C) Year 2", "", true],
      ["Exempt Income(C) Year 3", ""],
      ["Gross Total Income", "₹ 12,50,000"],
      ["Gross Total Income Year 2", ""],
      ["Gross Total Income Year 3", ""],
      ["Total Gross Total Income", "₹ 33,50,000"],
      ["Average Gross Total Income", "₹ 11,16,667"],
    ],
  },
  {
    key: "credit_card",
    title: "Credit Cards",
    cols: 3,
    fields: [
      ["Is Credit card statement in the name of LA", ""],
      ["Is LA Defaulter in the Payment", ""],
      ["Type of Card", ""],
      ["Credit Limit", "", true],
      ["Points Earned", ""],
      ["Income Earned", ""],
      ["Derived Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "fixed_deposit_receipt",
    title: "Fixed Deposit Receipt",
    cols: 3,
    fields: [
      ["Is Fixed Deposit Receipt in the name of LA", ""],
      ["Is Fixed Deposit Receipts matured", ""],
      ["Amount Invested", "", true],
      ["Income Earned", ""],
      ["Derived Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "form16",
    title: "FORM16/FORM 130",
    cols: 3,
    fields: [
      ["ASSESSMENT", "2025-26", true],
      ["ASSESSMENT Year 2", "2024-25"],
      ["ASSESSMENT Year 3", "2023-24"],
      ["Gross Salary PA", "₹ 12,00,000", true],
      ["Gross Salary PA Year 2", "₹ 11,00,000"],
      ["Gross Salary PA Year 3", "₹ 10,00,000"],
      ["Average Annual Income", "₹ 11,00,000"],
      ["Life Assured Pan No", "ABCDE1234F", true],
      ["Life Assured Pan No Year 2", ""],
      ["Life Assured Pan No Year 3", ""],
      ["Life Assured Name", "Rudra Prakash Sangha", true],
      ["Life Assured Name Year 2", ""],
      ["Life Assured Name Year 3", ""],
      ["Company Name", "3I INFOTECH", true],
      ["Company Name Year 2", ""],
      ["Company Name Year 3", ""],
      ["Is Life Assured Name Same With Doc Name?", "Y"],
      ["Is Life Assured Name Same With Doc Name? Year 2", ""],
      ["Is Life Assured Name Same With Doc Name? Year 3", ""],
    ],
  },
  {
    key: "form16a",
    title: "FORM 16A/FORM 131",
    cols: 3,
    fields: [
      ["Assessment Year", "", true],
      ["Assessment Year Year 2", ""],
      ["Assessment Year Year 3", ""],
      ["Net Receipt pa", "", true],
      ["Net Receipt pa Year 2", ""],
      ["Net Receipt pa Year 3", ""],
      ["Average Annual Income", ""],
    ],
  },
  {
    key: "form_j",
    title: "FORM J",
    cols: 3,
    fields: [
      ["Is Form J in the name of LA", "", true],
      ["Month1 Receipt1", "", true],
      ["Month1 Receipt2", ""],
      ["Month1 Receipt3", ""],
      ["Month1 Receipt4", ""],
      ["Month1 Receipt5", ""],
      ["Month1 Receipt6", ""],
      ["Month2 Receipt1", ""],
      ["Month2 Receipt2", ""],
      ["Month2 Receipt3", ""],
      ["Month2 Receipt4", ""],
      ["Month2 Receipt5", ""],
      ["Month2 Receipt6", ""],
      ["Month3 Receipt1", ""],
      ["Month3 Receipt2", ""],
      ["Month3 Receipt3", ""],
      ["Month3 Receipt4", ""],
      ["Month3 Receipt5", ""],
      ["Month3 Receipt6", ""],
      ["Total Receipts Receipt1", ""],
      ["Average Monthly Receipts Receipt1", ""],
      ["Annual Receipts Receipt1", ""],
      ["Derived Income Receipt1", ""],
    ],
  },
  {
    key: "govt_bonds",
    title: "Govt. Of India Bonds",
    cols: 3,
    fields: [
      ["Is Bond Certification in the name of LA", ""],
      ["Is Bond Certificate matured", ""],
      ["Amount Invested or Maturity Value, whichever higher", "", true],
      ["Income Earned", ""],
      ["Derived Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "itr_non_individual",
    title: "Income Tax Return (Non-Individual)",
    cols: 3,
    fields: [
      ["Name of Organisation/Firm", ""],
      ["Permanent Account Number", ""],
      ["Assessment Year", "", true],
      ["Assessment Year Year 2", "", true],
      ["Assessment Year Year 3", ""],
      ["ITR Acknowledgement Number", ""],
      ["ITR Acknowledgement Number Year 2", ""],
      ["ITR Acknowledgement Number Year 3", ""],
      ["Income from Salary", "", true],
      ["Income from Salary Year 2", "", true],
      ["Income from Salary Year 3", ""],
      ["Pan Number Matched with Barcode Number", ""],
      ["Pan Number Matched with Barcode Number Year 2", ""],
      ["Pan Number Matched with Barcode Number Year 3", ""],
      ["Income from House Property", ""],
      ["Income from House Property Year 2", ""],
      ["Income from House Property Year 3", ""],
      ["Income from Business or Profession", "", true],
      ["Income from Business or Profession Year 2", "", true],
      ["Income from Business or Profession Year 3", ""],
      ["Short term & Capital Gains", ""],
      ["Short term & Capital Gains Year 2", ""],
      ["Short term & Capital Gains Year 3", ""],
      ["Income from Other Sources", ""],
      ["Income from Other Sources Year 2", ""],
      ["Income from Other Sources Year 3", ""],
      ["Agricultural Income", ""],
      ["Agricultural Income Year 2", ""],
      ["Agricultural Income Year 3", ""],
      ["Exempt Income", "", true],
      ["Exempt Income Year 2", "", true],
      ["Exempt Income Year 3", ""],
      ["Gross Total Income", ""],
      ["Gross Total Income Year 2", ""],
      ["Gross Total Income Year 3", ""],
      ["Total Gross Total Income", ""],
      ["Average Gross Total Income", ""],
    ],
  },
  {
    key: "itr_individual",
    title: "Income Tax Return (Individual)",
    cols: 3,
    fields: [
      ["Name of Organisation/Firm", ""],
      ["Permanent Account Number", ""],
      ["Assessment Year", "", true],
      ["Assessment Year Year 2", "", true],
      ["Assessment Year Year 3", ""],
      ["ITR Acknowledgement Number", ""],
      ["ITR Acknowledgement Number Year 2", ""],
      ["ITR Acknowledgement Number Year 3", ""],
      ["Pan Number Matched with Barcode Number", ""],
      ["Pan Number Matched with Barcode Number Year 2", ""],
      ["Pan Number Matched with Barcode Number Year 3", ""],
      ["Date of Filling ITR", "", true],
      ["Date of Filling ITR Year 2", "", true],
      ["Date of Filling ITR Year 3", ""],
      ["Income from Salary(A)", "", true],
      ["Income from Salary(A) Year 2", "", true],
      ["Income from Salary(A) Year 3", ""],
      ["Income from House Property", ""],
      ["Income from House Property Year 2", ""],
      ["Income from House Property Year 3", ""],
      ["Income from Business or Profession(B)", "", true],
      ["Income from Business or Profession(B) Year 2", "", true],
      ["Income from Business or Profession(B) Year 3", ""],
      ["Short term & Capital Gains", ""],
      ["Short term & Capital Gains Year 2", ""],
      ["Short term & Capital Gains Year 3", ""],
      ["Income from Other Sources", ""],
      ["Income from Other Sources Year 2", ""],
      ["Income from Other Sources Year 3", ""],
      ["Agricultural Income", ""],
      ["Agricultural Income Year 2", ""],
      ["Agricultural Income Year 3", ""],
      ["Exempt Income(C)", "", true],
      ["Exempt Income(C) Year 2", "", true],
      ["Exempt Income(C) Year 3", ""],
      ["Gross Total Income(A+B+C)", ""],
      ["Gross Total Income(A+B+C) Year 2", ""],
      ["Gross Total Income(A+B+C) Year 3", ""],
      ["Total Gross Total Income", ""],
      ["Average Gross Total Income", ""],
      ["PF deduction - Salaried customers", ""],
      ["PF deduction - Salaried customers Year 2", ""],
      ["PF deduction - Salaried customers Year 3", ""],
      ["Life Assured Name", "", true],
      ["Life Assured Name Year 2", ""],
      ["Life Assured Name Year 3", ""],
      ["Is Life Assured Name Same?", "", true],
      ["Is Life Assured Name Same? Year 2", "", true],
      ["Is Life Assured Name Same? Year 3", ""],
    ],
  },
  {
    key: "loan_statement",
    title: "Loan Statements",
    cols: 3,
    fields: [
      ["Is Loan Statements in the name of LA", ""],
      ["Is LA Defaulter in the Payment", ""],
      ["Monthly EMI as per Schedule", "", true],
      ["Income Earned", ""],
      ["Derived Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "mutual_fund",
    title: "Mutual Fund A/C Statement",
    cols: 3,
    fields: [
      ["Is Mutual Fund Statement in the name of LA", ""],
      ["Latest Market Value (as per NAV) in Statement", "", true],
      ["Income Earned", ""],
      ["Derived Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "pension_statement",
    title: "PENSION STATEMENT",
    cols: 3,
    fields: [
      ["Total Monthly Pension", "", true],
      ["Pension Received pa", ""],
    ],
  },
  {
    key: "profit_and_loss",
    title: "Profit & Loss A/C",
    cols: 3,
    fields: [
      ["Name of Organization/Firm", "", true],
      ["Assessment Year", "", true],
      ["Assessment Year Year 2", "", true],
      ["Assessment Year Year 3", "", true],
      ["Shareholders Funds / Partners Capital", ""],
      ["Shareholders Funds / Partners Capital Year 2", ""],
      ["Shareholders Funds / Partners Capital Year 3", ""],
      ["Share Capital or Fixed/Fluctuating Capital", ""],
      ["Share Capital or Fixed/Fluctuating Capital Year 2", ""],
      ["Share Capital or Fixed/Fluctuating Capital Year 3", ""],
      ["Reserves & Surplus", ""],
      ["Reserves & Surplus Year 2", ""],
      ["Reserves & Surplus Year 3", ""],
      ["Total Shareholders Funds or Partner's Fund", ""],
      ["Total Shareholders Funds or Partner's Fund Year 2", ""],
      ["Total Shareholders Funds or Partner's Fund Year 3", ""],
      ["Profit Calculation", ""],
      ["Profit Calculation Year 2", ""],
      ["Profit Calculation Year 3", ""],
      ["Profit Before Depreciation & Tax (PBDT)", ""],
      ["Profit Before Depreciation & Tax (PBDT) Year 2", ""],
      ["Profit Before Depreciation & Tax (PBDT) Year 3", ""],
      ["Less : Depreciation", ""],
      ["Less : Depreciation Year 2", ""],
      ["Less : Depreciation Year 3", ""],
      ["Profit Before Tax (PBT)", ""],
      ["Profit Before Tax (PBT) Year 2", ""],
      ["Profit Before Tax (PBT) Year 3", ""],
      ["Tax", ""],
      ["Tax Year 2", ""],
      ["Tax Year 3", ""],
      ["Profit After Tax (PAT)", "", true],
      ["Profit After Tax (PAT) Year 2", "", true],
      ["Profit After Tax (PAT) Year 3", "", true],
      ["Profit After Tax of Last Year", ""],
      ["Profit After Tax of Last Year Year 2", ""],
      ["Profit After Tax of Last Year Year 3", ""],
      ["Rise In Profit as compared to Last Year", ""],
      ["Rise In Profit as compared to Last Year Year 2", ""],
      ["Rise In Profit as compared to Last Year Year 3", ""],
      ["% Rise In Profit as compared to Last Year", ""],
      ["% Rise In Profit as compared to Last Year Year 2", ""],
      ["% Rise In Profit as compared to Last Year Year 3", ""],
      ["Income Calculation", ""],
      ["Income Calculation Year 2", ""],
      ["Income Calculation Year 3", ""],
      ["Sales", ""],
      ["Sales Year 2", ""],
      ["Sales Year 3", ""],
      ["Sales of Last Year", ""],
      ["Sales of Last Year Year 2", ""],
      ["Sales of Last Year Year 3", ""],
      ["Rise In Sales as compared to Last Year", ""],
      ["Rise In Sales as compared to Last Year Year 2", ""],
      ["Rise In Sales as compared to Last Year Year 3", ""],
      ["% Rise In Sales as compared to Last Year", ""],
      ["% Rise In Sales as compared to Last Year Year 2", ""],
      ["% Rise In Sales as compared to Last Year Year 3", ""],
      ["Average Gross Income", ""],
      ["Average Profit Before Tax", ""],
      ["Average Profit After Tax", ""],
    ],
  },
  {
    key: "property_purchase",
    title: "Property Purchase Documents",
    cols: 3,
    fields: [
      ["Is Property purchased by LA", ""],
      ["Purchase Price", "", true],
      ["Financial Year of Purchase", ""],
      ["Estimated Market Value of Property", ""],
      ["Derived Income", ""],
    ],
  },
  {
    key: "property_valuation",
    title: "Property Valuation Report",
    cols: 3,
    fields: [
      ["Is Property Valuation Report in the name of LA", ""],
      ["Estimated Market Value of Property(as per report)", "", true],
      ["Derived Income", ""],
    ],
  },
  {
    key: "salary_certificate",
    title: "Salary Certificate",
    cols: 3,
    fields: [
      ["Gross Salary PA", "", true],
      ["Derived Income", ""],
    ],
  },
  {
    key: "salary_revision_letter",
    title: "Salary Revision Letter",
    cols: 3,
    fields: [
      ["Gross Salary PA", "", true],
      ["Derived Income", ""],
    ],
  },
  {
    key: "salary_slips",
    title: "SALARY SLIPS",
    cols: 3,
    fields: [
      ["Gross Salary Pm1", "₹ 1,00,000", true],
      ["Gross Salary Pm2", "₹ 1,00,000", true],
      ["Gross Salary Pm3", "₹ 1,00,000", true],
      ["Gross Salary Pm4", ""],
      ["Gross Salary Pm5", ""],
      ["Gross Salary Pm6", ""],
      ["Average Salary pm", "₹ 1,00,000"],
      ["Gross Salary pa", "₹ 12,00,000"],
      ["Annual Bonus/Incentive/Reimbursement", ""],
      ["Average Annual Income", "₹ 12,00,000"],
      ["Company Name", "3I INFOTECH", true],
      ["Life Assured Name", "Rudra Prakash Sangha", true],
      ["Is Life Assured Name Same?", "Y", true],
      ["PF / UAN No", ""],
    ],
  },
  {
    key: "bank_statement",
    title: "Savings A/C & Current A/C Bank Statements",
    cols: 3,
    fields: [
      ["Is Bank Statement in the name of LA/his Business", "", true],
      ["Latest 6 months statements given", "", true],
      ["Any Overdraft(Negative/Debit) Balances", "", true],
      ["Monthly Closing Bal 1", "", true],
      ["Monthly Closing Bal 2", "", true],
      ["Monthly Closing Bal 3", "", true],
      ["Monthly Closing Bal 4", "", true],
      ["Monthly Closing Bal 5", "", true],
      ["Monthly Closing Bal 6", "", true],
      ["Average Bank Balance", ""],
      ["Average Annual income", ""],
      ["Opening Balance", "", true],
      ["Statement Period", "", true],
      ["Life Assured Name", "", true],
      ["Is LA Name Match with Doc Name?", "", true],
      ["Life Insurance Premium Deduction Entry", ""],
      ["Wine Beer_Entries", ""],
      ["Med Entry", ""],
    ],
  },
  {
    key: "stock_holding",
    title: "Stock Holding Statement",
    cols: 3,
    fields: [
      ["Is Stock Holding Stmt in name of LA/his Business", ""],
      ["Gross Total Market Value as per the Stmt", "", true],
      ["Income Earned", ""],
      ["Derived Income", ""],
      ["Average Income", ""],
    ],
  },
  {
    key: "vehicle_ownership",
    title: "Vehicle Ownership Papers",
    cols: 3,
    fields: [
      ["Is Registration Papers in the name of LA", ""],
      ["Is Purchase invoices in the name of LA", ""],
      ["Purchase Price", "", true],
      ["Vehicle RC Number", ""],
      ["Derived Income", ""],
    ],
  },
  {
    key: "vahan",
    title: "Vahan",
    cols: 3,
    fields: [
      ["Is Registration Papers in the Name of LA", "", true],
      ["Is Purchase Invoices in the Name of LA", "", true],
      ["Car RC Number", ""],
      ["IDV", "", true],
      ["Average Annual Income", ""],
    ],
  },
  {
    key: "sip_statement",
    title: "SIP Statement",
    cols: 3,
    fields: [
      ["Latest 6 Months SIP Statements Given", "", true],
      ["Is SIP Statements in the Name of LA", "", true],
      ["SIP of Month1", "", true],
      ["SIP Per Month 1", "", true],
      ["SIP of Month2", "", true],
      ["SIP Per Month2", "", true],
      ["SIP of Month 3", "", true],
      ["SIP Per Month 3", "", true],
      ["SIP of Month 4", "", true],
      ["SIP Per Month4", "", true],
      ["SIP of Month5", "", true],
      ["SIP Per Month 5", "", true],
      ["SIP of Month 6", "", true],
      ["SIP Per Month 6", "", true],
      ["Average Monthly SIP", ""],
      ["Average Annual Income", ""],
    ],
  },
  {
    key: "gst_income",
    title: "GST Income",
    cols: 3,
    fields: [
      ["Assessment Year", "", true],
      ["Assessment Year Year 2", ""],
      ["Assessment Year Year 3", ""],
      ["Assessment Year Year 4", ""],
      ["Gross Sales", "", true],
      ["Gross Sales Year 2", ""],
      ["Gross Sales Year 3", ""],
      ["Gross Sales Year 4", ""],
      ["Gross Purchases", ""],
      ["Gross Purchases Year 2", ""],
      ["Gross Purchases Year 3", ""],
      ["Gross Purchases Year 4", ""],
      ["Profit After GST", ""],
      ["Profit After GST Year 2", ""],
      ["Profit After GST Year 3", ""],
      ["Profit After GST Year 4", ""],
      ["Total of Gross Sales", ""],
      ["Average Gross Sales", ""],
      ["Average Annual Income", ""],
    ],
  },
  {
    key: "bank_statement_salary_credit",
    title: "Bank Statement with Salary Credit Details",
    cols: 3,
    fields: [
      ["Is Bank Statement in the Name of LA", "", true],
      ["Net Salary Month1", "", true],
      ["Net Salary Credited PM1", "", true],
      ["Net Salary Month 2", "", true],
      ["Net Salary Credited PM2", "", true],
      ["Net Salary Month 3", "", true],
      ["Net Salary Credited PM3", "", true],
      ["Net Salary Month 4", ""],
      ["Net Salary Credited PM4", ""],
      ["Net Salary Month 5", ""],
      ["Net Salary Credited PM 5", ""],
      ["Net Salary Month 6", ""],
      ["Net Salary Credited PM 6", ""],
      ["Average Net Salary Credited PM", ""],
      ["Net Salary Credited PA", ""],
      ["Annual Bonus /Incentive /Reimbursement", ""],
      ["Average Annual Income", ""],
      ["Salary Credited", ""],
      ["Opening Balance", "", true],
      ["Closing Balance", ""],
      ["Statement Period", "", true],
      ["Life Assured Name", "", true],
      ["Is LA Name Match with Doc Name?", "", true],
    ],
  },
  {
    key: "epf_basic",
    title: "EMPLOYEE PROVIDENT FUND - BASIC",
    cols: 3,
    fields: [
      ["Latest Organization Name", "", true],
      ["Is Organization Name Same?", "", true],
      ["Income", "", true],
    ],
  },
  {
    key: "epf_advanced",
    title: "EMPLOYEE PROVIDENT FUND - ADVANCED",
    cols: 3,
    fields: [
      ["Latest Organization Name", "", true],
      ["Is Organization Name Same?", "", true],
      ["PF Contribution M1", "", true],
      ["PF Contribution M2", "", true],
      ["PF Contribution M3", "", true],
      ["PF Contribution M4", "", true],
      ["PF Contribution M5", "", true],
      ["PF Contribution M6", "", true],
      ["Annual Income", ""],
    ],
  },
  {
    key: "employee_id_card",
    title: "Employee ID Card",
    cols: 3,
    fields: [
      ["Name of the company", "", true],
      ["Name of the employee", "", true],
      ["Employee number", "", true],
      ["Photo available", "", true],
    ],
  },
  {
    key: "decision",
    title: "Decision",
    cols: 3,
    fields: [
      ["Verified Income Doc", "Salary Slips", true],
      ["Verified Income", "₹ 12,00,000", true],
      ["Justification", "Income verified from submitted documents"],
      ["Financial Decision", "financially eligible"],
    ],
  },
];

export const FINANCIAL_TABLE_LAYOUTS: Readonly<Partial<Record<string, FinancialTableLayout>>> = {
  form16: {
    kind: "year3",
    title: "Form 16",
    rows: ["ASSESSMENT","Gross Salary PA","Life Assured Pan No","Life Assured Name","Is Life Assured Name Same With Doc Name?","Company Name"],
    bottom: [{"label":"Average Annual Income"}],
  },
  form16a: {
    kind: "year3",
    rows: ["Assessment Year","Net Receipt pa"],
    bottom: [{"label":"Average Annual Income"}],
  },
  computation_of_income: {
    kind: "year3",
    rows: ["Assessment Year","Income from Salary(A)","Income from House Property","Income from Business or Profession (B)","Short term & Capital Gains","Income from Other Sources","Agricultural Income","Exempt Income(C)","Gross Total Income"],
    bottom: [{"label":"Total Gross Total Income"},{"label":"Average Gross Total Income"}],
  },
  itr_non_individual: {
    kind: "year3",
    top: ["Name of Organisation/Firm","Permanent Account Number"],
    rows: ["Assessment Year","ITR Acknowledgement Number","Income from Salary","Income from House Property","Income from Business or Profession","Short term & Capital Gains","Income from Other Sources","Agricultural Income","Exempt Income","Gross Total Income","Pan Number Matched with Barcode Number"],
    bottom: [{"label":"Total Gross Total Income"},{"label":"Average Gross Total Income"}],
  },
  itr_individual: {
    kind: "year3",
    top: ["Name of Organisation/Firm","Permanent Account Number"],
    rows: ["Assessment Year","ITR Acknowledgement Number","Date of Filling ITR","Income from Salary(A)","Income from House Property","Income from Business or Profession(B)","Short term & Capital Gains","Income from Other Sources","Agricultural Income","Exempt Income(C)","Gross Total Income(A+B+C)","PF deduction - Salaried customers","Life Assured Name","Is Life Assured Name Same?","Pan Number Matched with Barcode Number"],
    bottom: [{"label":"Total Gross Total Income"},{"label":"Average Gross Total Income"}],
  },
  profit_and_loss: {
    kind: "year3",
    top: ["Name of Organization/Firm"],
    rows: ["Assessment Year","Shareholders Funds / Partners Capital","Share Capital or Fixed/Fluctuating Capital","Reserves & Surplus","Total Shareholders Funds or Partner's Fund","Profit Calculation","Profit Before Depreciation & Tax (PBDT)","Less : Depreciation","Profit Before Tax (PBT)","Tax","Profit After Tax (PAT)","Profit After Tax of Last Year","Rise In Profit as compared to Last Year","% Rise In Profit as compared to Last Year","Income Calculation","Sales","Sales of Last Year","Rise In Sales as compared to Last Year","% Rise In Sales as compared to Last Year"],
    bottom: [{"label":"Average Gross Income"},{"label":"Average Profit Before Tax"},{"label":"Average Profit After Tax"}],
  },
  gst_income: {
    kind: "year4",
    rows: ["Assessment Year","Gross Sales","Gross Purchases","Profit After GST"],
    bottom: [{"label":"Total of Gross Sales"},{"label":"Average Gross Sales"},{"label":"Average Annual Income"}],
  },
  form_j: {
    kind: "receipts",
    title: "FORM J",
    top: ["Is Form J in the name of LA"],
    rows: ["Month1","Month2","Month3"],
    bottom: [{"label":"Total Receipts","fieldLabel":"Total Receipts Receipt1"},{"label":"Average Monthly Receipts","fieldLabel":"Average Monthly Receipts Receipt1"},{"label":"Annual Receipt","fieldLabel":"Annual Receipts Receipt1"},{"label":"Derived Income","fieldLabel":"Derived Income Receipt1"}],
  },
};

export const FINANCIAL_MONTHLY_INCOME_LAYOUTS: Readonly<Partial<Record<string, FinancialMonthlyIncomeLayout>>> = {
  commission_statement: {
    top: [],
    average: ["Average commission pm", "Average Annual Income"],
    entries: 6,
  },
  bank_statement_salary_credit: {
    top: ["Is Bank Statement in the Name of LA"],
    average: [
      "Average Net Salary Credited PM",
      "Net Salary Credited PA",
      "Annual Bonus /Incentive /Reimbursement",
      "Average Annual Income",
    ],
    entries: 6,
  },
};

export const FINANCIAL_STATEMENT_LAYOUTS: Readonly<Partial<Record<string, FinancialStatementLayout>>> = {
  salary_slips: {
    monthly: [
      "Gross Salary Pm1",
      "Gross Salary Pm2",
      "Gross Salary Pm3",
      "Gross Salary Pm4",
      "Gross Salary Pm5",
      "Gross Salary Pm6",
    ],
    calculated: ["Average Salary pm", "Gross Salary pa", "Annual Bonus/Incentive/Reimbursement", "Average Annual Income"],
    trailing: ["Company Name", "Life Assured Name", "Is Life Assured Name Same?", "PF / UAN No"],
  },
  bank_statement: {
    top: [
      "Is Bank Statement in the name of LA/his Business",
      "Latest 6 months statements given",
      "Any Overdraft(Negative/Debit) Balances",
    ],
    monthly: [
      "Monthly Closing Bal 1",
      "Monthly Closing Bal 2",
      "Monthly Closing Bal 3",
      "Monthly Closing Bal 4",
      "Monthly Closing Bal 5",
      "Monthly Closing Bal 6",
    ],
    calculated: ["Average Bank Balance", "Average Annual income"],
    trailing: [
      "Opening Balance",
      "Statement Period",
      "Life Assured Name",
      "Is LA Name Match with Doc Name?",
      "Life Insurance Premium Deduction Entry",
      "Wine Beer_Entries",
      "Med Entry",
    ],
  },
  sip_statement: {
    top: ["Latest 6 Months SIP Statements Given", "Is SIP Statements in the Name of LA"],
    monthly: [
      { label: "SIP of Month 1", fieldLabel: "SIP Per Month 1" },
      { label: "SIP of Month 2", fieldLabel: "SIP Per Month2" },
      { label: "SIP of Month 3", fieldLabel: "SIP Per Month 3" },
      { label: "SIP of Month 4", fieldLabel: "SIP Per Month4" },
      { label: "SIP of Month 5", fieldLabel: "SIP Per Month 5" },
      { label: "SIP of Month 6", fieldLabel: "SIP Per Month 6" },
    ],
    calculated: ["Average Monthly SIP", "Average Annual Income"],
  },
};

/** Derived / calculated fields ("<sectionKey>:<label>") that stay read-only even while a section is edited. */
export const FINANCIAL_LOCKED_FIELDS: ReadonlySet<string> = new Set<string>([
  "commission_statement:Average commission pm",
  "commission_statement:Average Annual Income",
  "computation_of_income:Gross Total Income",
  "computation_of_income:Gross Total Income Year 2",
  "computation_of_income:Gross Total Income Year 3",
  "computation_of_income:Total Gross Total Income",
  "computation_of_income:Average Gross Total Income",
  "credit_card:Derived Income",
  "credit_card:Average Income",
  "fixed_deposit_receipt:Derived Income",
  "fixed_deposit_receipt:Average Income",
  "form16:Average Annual Income",
  "form16a:Average Annual Income",
  "form_j:Total Receipts Receipt1",
  "form_j:Average Monthly Receipts Receipt1",
  "form_j:Annual Receipts Receipt1",
  "form_j:Derived Income Receipt1",
  "govt_bonds:Derived Income",
  "govt_bonds:Average Income",
  "itr_non_individual:Gross Total Income",
  "itr_non_individual:Gross Total Income Year 2",
  "itr_non_individual:Gross Total Income Year 3",
  "itr_non_individual:Total Gross Total Income",
  "itr_non_individual:Average Gross Total Income",
  "itr_individual:Gross Total Income(A+B+C)",
  "itr_individual:Gross Total Income(A+B+C) Year 2",
  "itr_individual:Gross Total Income(A+B+C) Year 3",
  "itr_individual:Total Gross Total Income",
  "itr_individual:Average Gross Total Income",
  "loan_statement:Derived Income",
  "loan_statement:Average Income",
  "mutual_fund:Derived Income",
  "mutual_fund:Average Income",
  "pension_statement:Pension Received pa",
  "profit_and_loss:Average Gross Income",
  "profit_and_loss:Average Profit Before Tax",
  "profit_and_loss:Average Profit After Tax",
  "property_purchase:Derived Income",
  "property_valuation:Derived Income",
  "salary_certificate:Derived Income",
  "salary_revision_letter:Derived Income",
  "salary_slips:Average Salary pm",
  "salary_slips:Gross Salary pa",
  "salary_slips:Average Annual Income",
  "bank_statement:Average Bank Balance",
  "bank_statement:Average Annual income",
  "stock_holding:Derived Income",
  "stock_holding:Average Income",
  "vehicle_ownership:Derived Income",
  "vahan:Average Annual Income",
  "sip_statement:Average Monthly SIP",
  "sip_statement:Average Annual Income",
  "gst_income:Total of Gross Sales",
  "gst_income:Average Gross Sales",
  "gst_income:Average Annual Income",
  "bank_statement_salary_credit:Average Net Salary Credited PM",
  "bank_statement_salary_credit:Net Salary Credited PA",
  "bank_statement_salary_credit:Average Annual Income",
  "epf_advanced:Annual Income",
]);

/** Sections that have no Agree / Disagree review actions and are never editable as a whole. */
export const FINANCIAL_NON_REVIEWABLE_SECTION_KEYS: readonly string[] = [
  "financial_profession",
  "credit_bureau_details",
  "decision",
];

export const FINANCIAL_MONTH_OPTIONS: FinancialOption[] = [
  { label: "Select month", value: "" },
  ...[
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].map((month) => ({ label: month, value: month })),
];

export const FINANCIAL_DECISION_OPTIONS: FinancialOption[] = [
  { label: "Select financial decision", value: "" },
  { label: "financially eligible", value: "financially eligible" },
  { label: "counter offer", value: "counter offer" },
  { label: "reject", value: "reject" },
];

export const FINANCIAL_DEFAULT_APPLICANTS: readonly FinancialApplicantTab[] = [
  { key: "lifeAssured1", label: "Life Assured1" },
  { key: "Proposer", label: "Proposer" },
];

export const FINANCIAL_DATE_FORMAT = "DD/MM/YYYY";

export const FINANCIAL_MESSAGES = {
  sectionNotFound: "No financial section found.",
  documents: "Financial documents are available in the source application.",
  submitted: "Financial details submitted successfully.",
  sectionSaved: (title: string) => `${title} saved successfully.`,
} as const;

const YES_NO_LABEL = /^(Is\b|Photo available\b|Latest 6 months.*statements given\b|Any Overdraft)/i;
const DATE_LABEL = /^(Joining Date|Date of Filling ITR)/i;

export function resolveFinancialControlKind(sectionKey: string, label: string): FinancialControlKind {
  if (sectionKey === "decision" && label === "Financial Decision") return "decision";
  if (YES_NO_LABEL.test(label)) return "yesNo";
  if (DATE_LABEL.test(label)) return "date";
  return "text";
}

/** Yes / No options; an unexpected existing value is kept as an extra option. */
export function buildFinancialYesNoOptions(value: string): FinancialOption[] {
  const options: FinancialOption[] = [
    { label: "Select", value: "" },
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ];
  if (value && !options.some((option) => option.value === value)) {
    options.splice(1, 0, { label: value, value });
  }
  return options;
}
