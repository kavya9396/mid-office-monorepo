import type { FieldData, LifeAssuredApplicant } from "@insurance-poc/common/life-assured";

type Address = {
  type: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
  residingCountry: string;
};

type SummaryMember = {
  memberType: string;
  proposerSummary: Record<string, string | number | boolean | { years: number; days?: number } | null>;
  kycDetails: Record<string, string>;
  address: Address[];
  contactDetails: Record<string, string>;
  healthDetail: { height: string; weight: string; bmi: string };
  nominee: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    percentage: number;
    proposerNomineeRelation?: string;
    accountNumber?: string;
    ifsc?: string;
  }[];
  appointee: { firstName: string; lastName: string; dob: string; gender: string }[];
};

type ProductDetail = { code: string; productType: string };

type RiderDetail = { riderName: string; sumAssured: number; riderTerm: number };

export type LoanDetail = {
  baseSumAssured: string;
  loanAmount: string;
  loanDisbursementDate: string;
  loanShare: string;
  loanTerm: string;
  policyTerm: string;
  masterCode: string;
  loanAccountNumber: string;
};

export type LifeAssuredSource = {
  summary: unknown[];
  productDetail: ProductDetail;
  riderDetails: RiderDetail[];
  loan: LoanDetail;
  imageRecords: never[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "1988-08-09T00:00" -> "9 Aug 1988" (same output as the prototype)
const formatDate = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value?.trim() ?? "");
  if (!match) return "";
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
};

// Prototype masks everything except the last 4 characters
const maskValue = (value?: string) => {
  const text = value?.trim();
  if (!text) return "-";
  return text.length <= 4 ? "X".repeat(text.length) : `${"X".repeat(text.length - 4)}${text.slice(-4)}`;
};

// Prototype: one applicant keeps the raw member type, several get the first letter capitalised
const memberLabel = (memberType: string, total: number) => {
  const name = memberType.trim();
  if (total === 1 && name.toLowerCase().startsWith("lifeassured")) return "Life Assured";
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : "";
};

const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? value : undefined);

const addressFields = (address?: Address): FieldData[] => [
  { label: "Address Line 1", value: address?.addressLine1 },
  { label: "Address Line 2", value: address?.addressLine2 },
  { label: "Address Line 3", value: address?.addressLine3 },
  { label: "Landmark", value: address?.landmark },
  { label: "City", value: address?.city },
  { label: "State", value: address?.state },
  { label: "Country", value: address?.residingCountry },
  { label: "Pincode", value: address?.pinCode },
];

const fullName = (first: string, last: string) => [first, last].filter(Boolean).join(" ") || "-";

// Summary values are loosely typed; only non-empty strings are valid name parts
const joinNameParts = (...parts: unknown[]) =>
  parts.filter((part): part is string => typeof part === "string" && part !== "").join(" ");

const toApplicant = (
  member: SummaryMember,
  total: number,
  productDetail: ProductDetail,
  riders: RiderDetail[],
  loan: LoanDetail,
): LifeAssuredApplicant => {
  const summary = member.proposerSummary;
  const kyc = member.kycDetails;
  const contact = member.contactDetails;
  const years = (summary.age as { years: number } | null)?.years;

  return {
    id: member.memberType,
    label: memberLabel(member.memberType, total),
    profileImage: text(summary.profileImage) as string | undefined,
    imageRecords: [],
    personalFields: [
      {
        label: "Applicant Name",
        value: joinNameParts(summary.firstName, summary.middleName, summary.lastName),
      },
      { label: "Date of Birth", value: formatDate(summary.dob as string) },
      { label: "Age", value: years == null ? "-" : `${years} Years` },
      { label: "Gender", value: text(summary.gender) },
      { label: "Marital Status", value: text(summary.maritalStatus) },
      { label: "Nationality", value: text(summary.nationality) },
      { label: "Country of Residence", value: text(summary.countryOfResidence) },
      { label: "Education", value: text(summary.education) },
      { label: "Resident Status", value: text(summary.residentStatus) },
      { label: "Designation", value: text(summary.designation) },
      { label: "Disabled", value: text(summary.disabled) },
      { label: "UDID Number", value: text(summary.udidNumber) },
      { label: "City of Resident", value: "-" },
      { label: "State of Resident", value: "-" },
    ],
    kycFields: [
      { label: "PRAN Number", value: maskValue(kyc.pranNo) },
      { label: "PRAN Number Verification", value: kyc.pranNoVerification },
      { label: "PAN Number", value: maskValue(kyc.panNumber) },
      { label: "PAN Flag", value: kyc.panFlag },
      { label: "PAN Aadhar Seeding Status", value: kyc.panAadharSeedingStatus },
      { label: "Identity Proof Type", value: kyc.identityProofType },
      { label: "Identity Proof Expiry Date", value: formatDate(kyc.identityProofExpiryDate) },
      { label: "Identity Proof Number", value: maskValue(kyc.identityProofNumber) },
      { label: "Address Proof", value: kyc.addressProof },
      { label: "Income Proof", value: kyc.incomeProof },
      { label: "CKYC Number", value: kyc.existingCkycNumber },
      { label: "PEP", value: kyc.pep },
      { label: "Criminal Proceedings", value: kyc.criminalProceedings },
    ],
    communicationAddress: addressFields(
      member.address.find((a) => a.type.trim().toLowerCase() === "communication"),
    ),
    permanentAddress: addressFields(
      member.address.find((a) => a.type.trim().toLowerCase() === "permanent"),
    ),
    contactDetails: [
      { label: "Mobile No.", value: contact.mobileNo },
      { label: "Email ID", value: contact.emailId },
      { label: "Alternate Mobile", value: contact.alternateMobileNo },
      { label: "STD/ISD Code", value: contact.std },
      { label: "Landline Number", value: contact.landlineNo },
      { label: "Email Pref", value: contact.emailPref },
      { label: "SMS Pref", value: contact.smsPref },
      { label: "Negative Pincode", value: undefined },
    ],
    productFields: [
      { label: "Product Code", value: productDetail.code },
      { label: "Product Type", value: productDetail.productType },
      { label: "Fund Source", value: undefined },
      { label: "Partner Type", value: undefined },
    ],
    nominees: member.nominee.map((n) => ({
      nomineeName: fullName(n.firstName, n.lastName),
      nomineeDOB: formatDate(n.dob) || "-",
      gender: n.gender || "-",
      relationship: "-",
      sharePercentage: n.percentage,
      isLASame: "-",
      relationShipWithJL: "-",
      laFlag: "-",
    })),
    appointees: member.appointee.map((a) => ({
      appointeeName: fullName(a.firstName, a.lastName),
      appointeeGender: a.gender || "-",
      appointeeDOB: formatDate(a.dob) || "-",
      appointeeRelationship: "-",
    })),
    editNominees: member.nominee.map((n) => ({
      firstName: n.firstName,
      lastName: n.lastName,
      dob: n.dob.slice(0, 10),
      gender: n.gender,
      proposerNomineeRelation: "",
      percentage: String(n.percentage),
      accountNumber: "",
      ifsc: "",
    })),
    editRiders: riders.map((r) => ({
      riderName: r.riderName,
      sumAssured: String(r.sumAssured),
      riderTerm: String(r.riderTerm),
    })),
    editLoan: loan,
    lifestyleFields: [
      { label: "Height", value: member.healthDetail.height },
      { label: "Weight", value: member.healthDetail.weight },
      { label: "BMI", value: member.healthDetail.bmi },
      { label: "Smoker", value: undefined },
      { label: "Alcohol", value: undefined },
      { label: "Any Narcotics Question ticked Positive", value: undefined },
      { label: "Any Medical Question ticked Positive", value: undefined },
      { label: "Is Occupation Hazardous?", value: undefined },
      { label: "Illness Impairment", value: undefined },
      { label: "Is Family Medical History? if yes please provide details", value: undefined },
    ],
  };
};

export function mapApplicants(source: LifeAssuredSource): LifeAssuredApplicant[] {
  return (source.summary as SummaryMember[]).map((member) =>
    toApplicant(
      member,
      source.summary.length,
      source.productDetail,
      source.riderDetails,
      source.loan,
    ),
  );
}
