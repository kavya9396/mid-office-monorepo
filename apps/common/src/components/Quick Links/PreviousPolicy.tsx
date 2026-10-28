import { useState } from "react";
import {
  appTheme,
  CustomAccordion,
  CustomButton,
  CustomDialog,
  CustomTable,
  EyeIcon,
  type Column,
} from "@insurance-poc/ui";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Row = Record<string, string | number>;

type Policy = {
  policyNumber: string;
  productName: string;
  appliedSumAssured: number;
  fundValue: number;
  riders: Row[];
};

export type PreviousPolicyProps = {
  /** Same role switch as the prototype: DVT_FORMAL_TASK hides "Details as per application form". */
  roleType?: string;
};

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

const { text, divider, grey, background } = appTheme.palette;

/* -------------------------------------------------------------------------- */
/* Static data (copied from design-reference/.../CUW/previous-policy.html)    */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 3;

const MEMBERS = [
  { key: "lifeAssured1", label: "Lifeassured1" },
  { key: "lifeAssured2", label: "Lifeassured2" },
  { key: "proposer", label: "Proposer" },
];

const POLICIES: Policy[] = [
  {
    policyNumber: "DEMO-IPRU-001",
    productName: "Sample Term Plan",
    appliedSumAssured: 5000000,
    fundValue: 0,
    riders: [
      { riderCode: "DEMO-R001", riderName: "Accidental Death Benefit", riderSubType: "Accidental Death", faceValue: 500000, mortalityClass: "Standard", uwMortalityClassBase: "Standard", sumAssured: 500000, rating: "Standard", sarConsideration: "Yes" },
    ],
  },
  {
    policyNumber: "DEMO-IPRU-002",
    productName: "Sample Savings Plan",
    appliedSumAssured: 2000000,
    fundValue: 0,
    riders: [
      { riderCode: "DEMO-R002", riderName: "Critical Illness Benefit", riderSubType: "Critical Illness", faceValue: 300000, mortalityClass: "Substandard", uwMortalityClassBase: "Standard", sumAssured: 300000, rating: "+25%", sarConsideration: "Yes" },
    ],
  },
  {
    policyNumber: "DEMO-IPRU-003",
    productName: "Sample ULIP Plan",
    appliedSumAssured: 3000000,
    fundValue: 350000,
    riders: [
      { riderCode: "DEMO-R003", riderName: "Waiver of Premium", riderSubType: "Premium Waiver", faceValue: 200000, mortalityClass: "Standard", uwMortalityClassBase: "Standard", sumAssured: 200000, rating: "Standard", sarConsideration: "Yes" },
    ],
  },
  {
    policyNumber: "DEMO-IPRU-004",
    productName: "Sample Whole Life Plan",
    appliedSumAssured: 4000000,
    fundValue: 0,
    riders: [
      { riderCode: "DEMO-R004", riderName: "Accidental Disability Benefit", riderSubType: "Permanent Disability", faceValue: 400000, mortalityClass: "Substandard", uwMortalityClassBase: "Standard", sumAssured: 400000, rating: "+50%", sarConsideration: "Yes" },
    ],
  },
  {
    policyNumber: "DEMO-IPRU-005",
    productName: "Sample Endowment Plan",
    appliedSumAssured: 5000000,
    fundValue: 0,
    riders: [
      { riderCode: "DEMO-R005", riderName: "Income Benefit", riderSubType: "Monthly Income", faceValue: 600000, mortalityClass: "Standard", uwMortalityClassBase: "Standard", sumAssured: 600000, rating: "Standard", sarConsideration: "Yes" },
    ],
  },
];

const DEDUPE_POSIDEX: Row[] = [
  { clientId: "CID-100284", firstName: "Aarav", surname: "Shah", state: "Maharashtra", city: "Mumbai", dob: "1988-07-14", mobileNo: "98765 43210", landlineNo: "022-2845 6102", recordType: "Existing Customer", matchPercentage: "96%", riskIndicator: "Low" },
  { clientId: "CID-100917", firstName: "Aarav", surname: "Shah", state: "Maharashtra", city: "Thane", dob: "1988-07-14", mobileNo: "98765 43210", landlineNo: "022-2580 4231", recordType: "Prospect", matchPercentage: "89%", riskIndicator: "Medium" },
  { clientId: "CID-101436", firstName: "Aarav", surname: "Saha", state: "Gujarat", city: "Ahmedabad", dob: "1987-07-14", mobileNo: "98765 43219", landlineNo: "079-2643 2280", recordType: "Historical Record", matchPercentage: "72%", riskIndicator: "Review" },
];

const IIB_NON_IPRU: Row[] = [
  { questDbNo: "DEMO-QUEST-001", questSumAssured: 2500000, questPolicyStatus: "In Force", questCompanyNumber: "DEMO-INS-01", matchingParameter: "Name, DOB and PAN", questDopDoc: "2023-06-15", questDateOfDeath: "Not applicable", questCauseOfDeath: "Not applicable", questRecordLastUpdated: "2026-09-01", questEntityCautionStatus: "Clear", intermediaryCautionStatus: "Clear" },
  { questDbNo: "DEMO-QUEST-002", questSumAssured: 2000000, questPolicyStatus: "In Force", questCompanyNumber: "DEMO-INS-02", matchingParameter: "Name and DOB", questDopDoc: "2023-02-15", questDateOfDeath: "Not applicable", questCauseOfDeath: "Not applicable", questRecordLastUpdated: "2026-09-01", questEntityCautionStatus: "Clear", intermediaryCautionStatus: "Clear" },
  { questDbNo: "DEMO-QUEST-003", questSumAssured: 3000000, questPolicyStatus: "Lapsed", questCompanyNumber: "DEMO-INS-03", matchingParameter: "PAN", questDopDoc: "2023-03-15", questDateOfDeath: "Not applicable", questCauseOfDeath: "Not applicable", questRecordLastUpdated: "2026-09-01", questEntityCautionStatus: "Clear", intermediaryCautionStatus: "Clear" },
  { questDbNo: "DEMO-QUEST-004", questSumAssured: 4000000, questPolicyStatus: "Paid Up", questCompanyNumber: "DEMO-INS-04", matchingParameter: "Name and mobile", questDopDoc: "2023-04-15", questDateOfDeath: "Not applicable", questCauseOfDeath: "Not applicable", questRecordLastUpdated: "2026-09-01", questEntityCautionStatus: "Clear", intermediaryCautionStatus: "Clear" },
  { questDbNo: "DEMO-QUEST-005", questSumAssured: 5000000, questPolicyStatus: "In Force", questCompanyNumber: "DEMO-INS-05", matchingParameter: "Name, DOB and PAN", questDopDoc: "2023-05-15", questDateOfDeath: "Not applicable", questCauseOfDeath: "Not applicable", questRecordLastUpdated: "2026-09-01", questEntityCautionStatus: "Clear", intermediaryCautionStatus: "Clear" },
];

const NEGATIVE_MATCH: Row[] = [
  { questDbNo: "DEMO-QUEST-001", isNegativeMatch: "Yes", whetherStandardLife: "No", medicalNonmedical: "Medical", reasonForDecline: "Adverse medical findings (dummy)", reasonForPostpone: "Not applicable", reasonForRepudiation: "Not applicable", linkedNonLinked: "Non-linked", productType: "Term", remarks: "Fictional record for UI preview", broadReason: "Medical", granularReason1: "Cardiac history", granularReason2: "Abnormal investigation" },
  { questDbNo: "DEMO-QUEST-002", isNegativeMatch: "No", whetherStandardLife: "Yes", medicalNonmedical: "Medical", reasonForDecline: "Not applicable", reasonForPostpone: "Not applicable", reasonForRepudiation: "Not applicable", linkedNonLinked: "Non-linked", productType: "Savings", remarks: "Fictional review record 2", broadReason: "No adverse match", granularReason1: "Not applicable", granularReason2: "Not applicable" },
  { questDbNo: "DEMO-QUEST-003", isNegativeMatch: "Yes", whetherStandardLife: "No", medicalNonmedical: "Medical", reasonForDecline: "Adverse medical findings (dummy)", reasonForPostpone: "Not applicable", reasonForRepudiation: "Not applicable", linkedNonLinked: "Non-linked", productType: "Term", remarks: "Fictional review record 3", broadReason: "Medical", granularReason1: "Cardiac history", granularReason2: "Abnormal investigation" },
  { questDbNo: "DEMO-QUEST-004", isNegativeMatch: "No", whetherStandardLife: "Yes", medicalNonmedical: "Medical", reasonForDecline: "Not applicable", reasonForPostpone: "Not applicable", reasonForRepudiation: "Not applicable", linkedNonLinked: "Non-linked", productType: "Whole Life", remarks: "Fictional review record 4", broadReason: "No adverse match", granularReason1: "Not applicable", granularReason2: "Not applicable" },
  { questDbNo: "DEMO-QUEST-005", isNegativeMatch: "Yes", whetherStandardLife: "No", medicalNonmedical: "Medical", reasonForDecline: "Adverse medical findings (dummy)", reasonForPostpone: "Not applicable", reasonForRepudiation: "Not applicable", linkedNonLinked: "Non-linked", productType: "Endowment", remarks: "Fictional review record 5", broadReason: "Medical", granularReason1: "Cardiac history", granularReason2: "Abnormal investigation" },
];

// Rows are matched by questDbNo, as in the prototype's combineMatchRows().
const IIB_COMBINED: Row[] = IIB_NON_IPRU.map((row) => ({
  ...row,
  ...NEGATIVE_MATCH.find((n) => n.questDbNo === row.questDbNo),
}));

const APPLICATION_FORM: Row[] = [
  { companyName: "Sample Life Insurance", policyNumber: "AF-2023-001245", baseSumAssured: 2500000, proposalDate: "2023-06-01", policyDecision: "Standard" },
  { companyName: "Sample Insurer 2", policyNumber: "AF-2023-001684", baseSumAssured: 2000000, proposalDate: "2023-02-02", policyDecision: "Standard" },
  { companyName: "Sample Insurer 3", policyNumber: "AF-2023-002118", baseSumAssured: 3000000, proposalDate: "2023-03-03", policyDecision: "Standard" },
  { companyName: "Sample Insurer 4", policyNumber: "AF-2023-002564", baseSumAssured: 4000000, proposalDate: "2023-04-04", policyDecision: "Standard" },
  { companyName: "Sample Insurer 5", policyNumber: "AF-2023-002971", baseSumAssured: 5000000, proposalDate: "2023-05-05", policyDecision: "Standard" },
];

const FAMILY_POLICIES: Row[] = [
  { type: "Declared", relationWithLifeAssured: "Father", insuranceCompany: "Sample Life Insurance A", sumAssured: 2500000, annualIncome: 900000, policyStatus: "In Force" },
  { type: "Verified", relationWithLifeAssured: "Husband", insuranceCompany: "Sample Life Insurance B", sumAssured: 5000000, annualIncome: 1500000, policyStatus: "In Force" },
];

const ipruRows = (memberKey: string): Row[] =>
  POLICIES.map((policy, index) => ({
    clientId: `CID-${102841 + index * 73}`,
    applicationNo: `APP-2026-${String(10421 + index).padStart(5, "0")}`,
    policyNumber: policy.policyNumber,
    productName: policy.productName,
    appliedSumAssured: policy.appliedSumAssured,
    policyStatus: index === 2 ? "Lapsed" : "In Force",
    uwDecision: "Standard",
    applicationDate: `202${index % 2 ? 3 : 4}-${String(index + 2).padStart(2, "0")}-10`,
    claimsFlag: index === 1 ? "Yes" : "No",
    mortalityClass: String(policy.riders[0]?.mortalityClass ?? "Standard"),
    installmentPremium: 24000 + index * 4500,
    clientRole: memberKey === "proposer" ? "Proposer" : "Life Assured",
    companyName: "ICICI Prudential Life Insurance",
    yearOfIssueApplication: `FY ${index % 2 ? "2023-24" : "2024-25"}`,
    fundValue: policy.fundValue,
  }));

/* -------------------------------------------------------------------------- */
/* Formatters                                                                 */
/* -------------------------------------------------------------------------- */

const displayValue = (raw: unknown): string => String(raw ?? "").trim() || "-";

function formatCurrency(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "" || raw === "-") return "-";
  return Number.isNaN(Number(raw))
    ? String(raw)
    : `₹ ${Number(raw).toLocaleString("en-IN")}`;
}

function formatDateOnly(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "" || raw === "-") return "-";
  const value = String(raw);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const local = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value);
  const parts = iso
    ? [iso[1], iso[2], iso[3]]
    : local
      ? [local[3], local[2], local[1]]
      : null;
  if (!parts) return "-";
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/* -------------------------------------------------------------------------- */
/* Columns (labels copied exactly from the prototype)                         */
/* -------------------------------------------------------------------------- */

const col = (
  key: string,
  header: string,
  format: (raw: unknown) => string = displayValue,
): Column<Row> => ({ key, header, render: (value) => format(value) });

const DEDUPE_COLUMNS: Column<Row>[] = [
  col("clientId", "Client Id"),
  col("firstName", "First Name"),
  col("surname", "Surname"),
  col("state", "State"),
  col("city", "City"),
  col("dob", "DOB", formatDateOnly),
  col("mobileNo", "Mobile No"),
  col("landlineNo", "Landline No"),
  col("recordType", "Record Type"),
  col("matchPercentage", "% Match"),
  col("riskIndicator", "Risk Indicator"),
];

const IPRU_COLUMNS = (onShowRiders: (policyNumber: string) => void): Column<Row>[] => [
  {
    key: "riders",
    header: "Riders",
    width: "60px",
    render: (_value, row) => (
      <CustomButton
        variant="outlined"
        aria-label="Show rider details"
        title="Show all rider details"
        onClick={() => onShowRiders(String(row.policyNumber))}
        sx={{ width: 30, minHeight: 28, p: 0.5, borderRadius: "6px" }}
      >
        <EyeIcon />
      </CustomButton>
    ),
  },
  col("clientId", "Client Id"),
  col("applicationNo", "Application No"),
  col("policyNumber", "Policy No"),
  col("productName", "Product"),
  col("appliedSumAssured", "Sum Assured", formatCurrency),
  col("policyStatus", "Policy Status"),
  col("uwDecision", "Decision"),
  col("applicationDate", "Application Date", formatDateOnly),
  col("claimsFlag", "Claims Flag"),
  col("mortalityClass", "Mortality Class"),
  col("installmentPremium", "Installment Premium", formatCurrency),
  col("clientRole", "Client Role"),
  col("companyName", "Company Name"),
  col("yearOfIssueApplication", "Year of Issue/Application"),
  col("fundValue", "Fund Value", formatCurrency),
];

const IPRU_DETAIL_COLUMNS: Column<Row>[] = [
  col("policyNumber", "Policy Number"),
  col("riderCode", "Rider Code"),
  col("riderName", "Rider Name"),
  col("riderSubType", "Rider Sub type"),
  col("faceValue", "Face Value", formatCurrency),
  col("mortalityClass", "Mortality Class"),
  col("uwMortalityClassBase", "UW_Mortality Class-Base"),
  col("sumAssured", "Sum assured", formatCurrency),
  col("rating", "Rating"),
  col("sarConsideration", "SAR Consideration"),
  col("clientRole", "Client Role"),
];

const IIB_COLUMNS: Column<Row>[] = [
  col("questDbNo", "QUESTDBNO"),
  col("questSumAssured", "Quest Sum Assured", formatCurrency),
  col("questPolicyStatus", "Quest Policy Status"),
  col("questCompanyNumber", "Quest Company Number"),
  col("matchingParameter", "Matching Parameter"),
  col("questDopDoc", "Quest DOP DOC", formatDateOnly),
  col("questDateOfDeath", "Quest Date Of Death", formatDateOnly),
  col("questCauseOfDeath", "Quest Cause Of Death"),
  col("questRecordLastUpdated", "Quest Record Last Updated", formatDateOnly),
  col("questEntityCautionStatus", "Quest Entity Caution Status"),
  col("intermediaryCautionStatus", "Intermediary Caution Status"),
  col("isNegativeMatch", "Is Negative Match"),
  col("whetherStandardLife", "Whether Standard Life"),
  col("medicalNonmedical", "Medical Nonmedical"),
  col("reasonForDecline", "Reason For Decline"),
  col("reasonForPostpone", "Reason For Postpone"),
  col("reasonForRepudiation", "Reason For Repudiaton"),
  col("linkedNonLinked", "Linked NonLinked"),
  col("productType", "Product Type"),
  col("remarks", "Remarks"),
  col("broadReason", "Broad Reason"),
  col("granularReason1", "Granular Reason 1"),
  col("granularReason2", "Granular Reason 2"),
];

const APPLICATION_FORM_COLUMNS: Column<Row>[] = [
  col("companyName", "Company Name"),
  col("policyNumber", "Policy Number"),
  col("baseSumAssured", "Base Sum Assured(In Rs)", formatCurrency),
  col("proposalDate", "Proposal Date", formatDateOnly),
  col("policyDecision", "Policy Decision"),
];

const FAMILY_COLUMNS: Column<Row>[] = [
  col("type", "Type(Verified/Declared)"),
  col("relationWithLifeAssured", "Relation With LA"),
  col("insuranceCompany", "Insurance Company"),
  col("sumAssured", "Sum Assured", formatCurrency),
  col("annualIncome", "Annual Income", formatCurrency),
  col("policyStatus", "Policy Status"),
];

/* -------------------------------------------------------------------------- */
/* Paged table (CustomTable + pagination footer)                              */
/* -------------------------------------------------------------------------- */

const COMPACT_COLUMN_WIDTH = 138;

type PagedTableProps = {
  title: string;
  columns: Column<Row>[];
  rows: Row[];
  /** Horizontal scroll with a minimum width per column, as the prototype does for the IIB table. */
  wide?: boolean;
};

const PagedTable = ({ title, columns, rows, wide = false }: Readonly<PagedTableProps>) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const table = <CustomTable<Row> title={title} columns={columns} data={visibleRows} />;

  return (
    <div style={{ minWidth: 0 }}>
      {wide ? (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: columns.length * COMPACT_COLUMN_WIDTH }}>{table}</div>
        </div>
      ) : (
        table
      )}

      <nav
        aria-label={`${title} pagination`}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          minHeight: 34,
          // padding: 8,
          backgroundColor: grey[100],
        }}
      >
        <CustomButton
          variant="text"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          sx={{ minWidth: 20, height: 20, color: text.secondary }}
        >
          ‹
        </CustomButton>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
          <CustomButton
            key={p}
            variant={p === currentPage ? "contained" : "text"}
            aria-label={String(p)}
            onClick={() => setPage(p)}
            sx={{
              minWidth: 20,
              height: 20,
              ...(p === currentPage ? {} : { color: text.secondary }),
            }}
          >
            {p}
          </CustomButton>
        ))}
        <CustomButton
          variant="text"
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
          sx={{ minWidth: 20, height: 20, color: text.secondary }}
        >
          ›
        </CustomButton>
      </nav>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function PreviousPolicy({ roleType = "CUW_TASK" }: Readonly<PreviousPolicyProps>) {
  const [riderView, setRiderView] = useState<{ title: string; rows: Row[] } | null>(null);
  const showApplicationForm = roleType.trim().toUpperCase() !== "DVT_FORMAL_TASK";

  const openRiders = (memberKey: string, memberLabel: string, policyNumber: string) => {
    const clientRole = memberKey === "proposer" ? "Proposer" : "Life Assured";
    const policy = POLICIES.find((p) => p.policyNumber === policyNumber);
    setRiderView({
      title: `Rider Details - ${memberLabel}`,
      rows: (policy?.riders ?? []).map((rider) => ({ ...rider, policyNumber, clientRole })),
    });
  };

  return (
    <div style={{ width: "100%", padding: "8px 0 32px", backgroundColor: background.default }}>
      {MEMBERS.map((member) => (
        <div key={member.key} style={{ marginBottom: 16 }}>
          <CustomAccordion
            title={`Previous Policies - ${member.label}`}
            titleFontSize={12}
            defaultExpanded={member.key === "lifeAssured1"}
          >
            <PagedTable title="Dedupe - Posidex" columns={DEDUPE_COLUMNS} rows={DEDUPE_POSIDEX} />

            <div style={{ marginTop: 20 }}>
              <PagedTable
                title="IPRU"
                columns={IPRU_COLUMNS((policyNumber) =>
                  openRiders(member.key, member.label, policyNumber),
                )}
                rows={ipruRows(member.key)}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <PagedTable
                title="IIB / Non IPRU and Negative Match Details"
                columns={IIB_COLUMNS}
                rows={IIB_COMBINED}
                wide
              />
            </div>

            {showApplicationForm && (
              <div style={{ marginTop: 20 }}>
                <PagedTable
                  title="Details as per application form"
                  columns={APPLICATION_FORM_COLUMNS}
                  rows={APPLICATION_FORM}
                />
              </div>
            )}
          </CustomAccordion>
        </div>
      ))}

      <div style={{ marginTop: 16, marginLeft: 5, minWidth: 0 }}>
        <PagedTable
          title="Parents / Husbands / Siblings"
          columns={FAMILY_COLUMNS}
          rows={FAMILY_POLICIES}
        />
      </div>

      {riderView && (
        <CustomDialog
          open
          onClose={() => setRiderView(null)}
          title={riderView.title}
          maxWidth="xl"
          paperSx={{ borderRadius: "8px", border: `1px solid ${divider}` }}
        >
          <PagedTable
            title="Riders"
            columns={IPRU_DETAIL_COLUMNS}
            rows={riderView.rows}
            wide
          />
        </CustomDialog>
      )}
    </div>
  );
}

export default PreviousPolicy;
