import type { DecisionHistoryRow } from "@insurance-poc/common/decision-history";
import type { DetailAttribute, DetailTable } from "@insurance-poc/common/detail-card";
import type { FieldData, LifeAssuredApplicant } from "@insurance-poc/common/life-assured";
import type { PivvDetailRow } from "@insurance-poc/common/pivv-details";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type { CvtEditApplicantValues } from "./CvtEditApplicantDialog";

/**
 * Single source of truth for the static UI-only CVT DRS data: detail cards, BRE decision, decision
 * options, requirements and life assured applicants (values from the mock payload in
 * `cvt-drs-prototype.html`). Replaced by the DRS response (through mappers) when the API is integrated.
 */

/**
 * Detail cards. Same shape as `cardDetails` in the Group DRS response (`type` is the card title;
 * `attributes` is the 4-field summary; `expandedAttributes` and `tables` fill the dialog).
 */
export type CvtCardDetail = {
  type: string;
  attributes: DetailAttribute[];
  expandedAttributes: DetailAttribute[];
  tables: DetailTable[];
};

export const CVT_CARD_DETAILS: CvtCardDetail[] = [
  {
    type: "Application Detail",
    attributes: [
      { name: "Product Name - Code", value: "ICICI PRU SUPER PROTECT CREDIT - GP1" },
      { name: "Channel", value: "" },
      { name: "Sum Assured", value: "2210000" },
      { name: "MPH Name", value: "" },
    ],
    expandedAttributes: [
      { name: "Product Name - Code", value: "ICICI PRU SUPER PROTECT CREDIT - GP1" },
      { name: "Channel", value: "" },
      { name: "Sum Assured", value: "2210000" },
      { name: "MPH Name", value: "" },
      { name: "TI Rider - SA", value: "" },
      { name: "ADBR SA", value: "100000" },
      { name: "CI Rider SA", value: "" },
      { name: "TFESA", value: "" },
      { name: "TRSA", value: "0" },
      { name: "TSA", value: "" },
      { name: "TPSA", value: "" },
      { name: "TFSA", value: "Infinity" },
      { name: "TMSA", value: "" },
    ],
    tables: [
      {
        name: "Rider Details",
        columns: ["Rider", "Rider Code", "Sum Assured"],
        rows: [{ Rider: "Rider 1", "Rider Code": "ACCIDENTAL_DEATH", "Sum Assured": "100000" }],
      },
    ],
  },
  {
    type: "Source Detail",
    attributes: [
      { name: "Call ID", value: "" },
      { name: "Policy No.", value: "" },
      { name: "Agent Name / Code", value: "01434799" },
      { name: "Customer Type", value: "" },
    ],
    expandedAttributes: [
      { name: "Call ID", value: "" },
      { name: "Policy No.", value: "" },
      { name: "Agent Name / Code", value: "01434799" },
      { name: "Customer Type", value: "" },
      { name: "Policy Type", value: "Retail New Business" },
      { name: "Premium", value: "0" },
      { name: "PT", value: "49" },
      { name: "PPT", value: "49" },
      { name: "Payment Mode", value: "" },
      { name: "Master Policy No.", value: "" },
      { name: "LAN Number", value: "LAN123456" },
      { name: "Login Date", value: "2026-11-08T00:00:00.0" },
      { name: "Bank Name", value: "" },
      { name: "Bank Branch", value: "" },
      { name: "Source", value: "25JU" },
    ],
    tables: [],
  },
  {
    type: "Risk Detail",
    attributes: [
      { name: "Accuity Risk Indicator", value: "" },
      { name: "Adverse IIB match", value: "" },
      { name: "Risk Flag", value: "" },
      { name: "High Risk Category", value: "" },
    ],
    expandedAttributes: [
      { name: "Accuity Risk Indicator", value: "" },
      { name: "Adverse IIB match", value: "" },
      { name: "Risk Flag", value: "" },
      { name: "High Risk Category", value: "" },
      { name: "Source", value: "25JU" },
    ],
    tables: [],
  },
];

/**
 * BRE decision. Same shape as Group's `latestBreDecision` section (row ids `decision` and
 * `discrepancy` drive the diff highlighting).
 */
export type CvtBreRow = {
  id: string;
  label: string;
  initial: string;
  final: string;
};

export type CvtBreDecision = {
  headers: { label: string; initial: string; final: string };
  rows: CvtBreRow[];
};

export const CVT_BRE_DECISION: CvtBreDecision = {
  headers: { label: "BRE", initial: "Initial BRE", final: "Final BRE" },
  rows: [
    { id: "status", label: "BRE Status", initial: "", final: "" },
    { id: "decision", label: "BRE Decision", initial: "STP", final: "RJ" },
    {
      id: "remarks",
      label: "BRE Remarks",
      initial:
        "ICICI Bank Limited Home Loan#HC#credit life cover with ICICI Pru only = 2210000#credit life with ICICI Pru only in last two years = 2210000#GCD Mandatory for Master Code.#GCD mandatory for Group/ MRTA login#TopCOs",
      final: "Product Non Eligible",
    },
    {
      id: "discrepancy",
      label: "BRE Discrepancy",
      initial: "ACR#ADP#IDM#AGE#KYP#PAN#OCD#GCD",
      final: "ACR#ADP#IDM#AGE#KYP#PAN#OCD#GCD",
    },
    {
      id: "timestamp",
      label: "BRE Timestamp",
      initial: "14/11/2026, 1227hrs",
      final: "16/11/2026, 1113hrs",
    },
  ],
};

/**
 * Requirement rows. Same fields as Group's `requirementManagement` rows (after `requirementId` -> `id`).
 */
export const CVT_REQUIREMENTS: RequirementItem[] = [
  {
    id: 17736,
    status: "Pending",
    ocrStatus: "",
    team: "UW",
    profile: "",
    category: "Internal",
    subCategory: "Report",
    document: "Agent report",
    reason: "Document not uploaded",
    fupCode: "ACR",
    extraRemarks: "",
    description: "ACR -Agent confidential report not uploaded",
  },
  {
    id: 17742,
    status: "Pending",
    ocrStatus: "",
    team: "COPS",
    profile: "",
    category: "KYC",
    subCategory: "Address Proof",
    document: "Driving License",
    reason: "Documents not submitted",
    fupCode: "ADP",
    extraRemarks: "",
    description:
      "ADP-Address proof of the proposer matching with application form (Passport - front & back or Aadhaar - front & back or Driving License or Voter id)",
  },
  {
    id: 17741,
    status: "Pending",
    ocrStatus: "",
    team: "COPS",
    profile: "",
    category: "KYC",
    subCategory: "ID proof",
    document: "Drving License",
    reason: "Documents not submitted",
    fupCode: "IDM",
    extraRemarks: "",
    description:
      "IDM- Upload valid ID proof of proposer (Passport - front & back or Driving License or Pan Card or Aadhaar - front & back)",
  },
  {
    id: 17740,
    status: "Pending",
    ocrStatus: "",
    team: "COPS",
    profile: "",
    category: "KYC",
    subCategory: "Ageproof",
    document: "PAN Card",
    reason: "Documents not submitted",
    fupCode: "AGE",
    extraRemarks: "",
    description:
      "AGE-Age proof of life assured (Passport - front & back or Driving License or Pan Card or Aadhaar - front & back)",
  },
];

export const requirementStatusOrder = ["Accept", "Reject", "Cancelled", "Waived", "Received", "Pending"];

export const requirementStatusVariants = {
  Pending: "Pending",
  Accept: "Accept",
  Reject: "Reject",
  Cancelled: "Cancelled",
  Waived: "Waived",
  Received: "Received",
} as const;

/**
 * Life assured applicants.
 * Field labels and order follow the fixed lists Group's `lifeAssuredData.ts` uses, and empty values
 * show as "-". PRAN / PAN / Identity Proof Number are masked to the last 4 characters, as in Group.
 * Replaced by the DRS response (through a mapper) when the API is integrated.
 */
const fields = (entries: [label: string, value?: string | number][]): FieldData[] =>
  entries.map(([label, value]) => ({
    label,
    value: value === undefined || value === "" ? "-" : value,
  }));

export const CVT_APPLICANTS: LifeAssuredApplicant[] = [
  {
    id: "lifeassured1",
    memberType: "lifeassured1",
    label: "Life Assured",
    imageRecords: [
      {
        document: "Aadhar",
        faceMatchScore: "75",
        imageQuality: "Good",
        remarks: "Good quality image found",
      },
    ],
    personalFields: fields([
      ["Applicant Name", "Rudra Prakash Sangha"],
      ["Date of Birth", "1988-08-09"],
      ["Age", "38"],
      ["Gender", "Male"],
      ["Marital Status"],
      ["Nationality", "India"],
      ["Country of Residence", "India"],
      ["Education", "Graduate"],
      ["Resident Status", "IND"],
      ["Designation", "Manager"],
      ["Disabled"],
      ["Percentage Of Impairment"],
      ["Type Of Impairment"],
      ["UDID Number", "UDID-98765"],
      ["UDS Link"],
      ["City of Resident", "THANE"],
      ["State of Resident", "Maharashtra"],
    ]),
    kycFields: fields([
      ["PRAN Number", "XXXXXXXX9012"],
      ["PRAN Number Verification", "Verified"],
      ["PAN Number", "XXXXXX677W"],
      ["PAN Flag", "Verified"],
      ["PAN Aadhar Seeding Status", "Y"],
      ["Identity Proof Type", "Aadhaar"],
      ["Identity Proof Expiry Date", "2099-12-31T00:00"],
      ["Identity Proof Number", "XXXXXX111A"],
      ["Address Proof", "Aadhaar"],
      ["Income Proof", "Aadhaar"],
      ["CKYC Number", "NA"],
      ["PEP", "No"],
      ["Criminal Proceedings", "No"],
    ]),
    communicationAddress: fields([
      ["Address Line 1", "malad"],
      ["Address Line 2", "malad"],
      ["Address Line 3"],
      ["Landmark", "prism"],
      ["City", "mumbai"],
      ["State", "maharashtra"],
      ["Country"],
      ["Pin Code", "400064"],
    ]),
    permanentAddress: fields([
      ["Address Line 1", "RFRF"],
      ["Address Line 2", "FGHJK"],
      ["Address Line 3", "FGHJKL"],
      ["Landmark"],
      ["City", "THANE"],
      ["State", "Maharashtra"],
      ["Country", "India"],
      ["Pin Code", "400709"],
    ]),
    contactDetails: fields([
      ["Mobile Number", "9878716726"],
      ["Email Id", "TRSTR@GMAIL.COM"],
      ["Alternate Mobile"],
      ["STD/ISD Code"],
      ["Land Line Number"],
      ["Email Pref", "Y"],
      ["SMS Pref", "Y"],
      ["Negative Pincode"],
    ]),
    productFields: fields([
      ["Product Code", "E36"],
      ["Product Type", "base"],
      ["Fund Source"],
      ["Partner Type"],
    ]),
    nominees: [
      {
        nomineeName: "Smit Sangha",
        nomineeDOB: "1991-03-12T00:00",
        gender: "Male",
        relationship: "",
        sharePercentage: 0,
        isLASame: "",
        relationShipWithJL: "",
        laFlag: "",
      },
    ],
    appointees: [
      {
        appointeeName: "Shivani Sangha",
        appointeeGender: "Female",
        appointeeDOB: "1991-03-12T00:00",
        appointeeRelationship: "",
      },
    ],
    lifestyleFields: fields([
      ["Height", "165.1"],
      ["Weight", "67"],
      ["Other Medical History"],
      ["Lifestyle Habits", "Non Smoker"],
    ]),
    paymentDetails: fields([
      ["Is it a Third Party payment", "No"],
      ["Payment Options"],
    ]),
    payoutDetails: fields([
      ["Account Type", "Savings"],
      ["Bank Type"],
      ["Branch", "Malad"],
      ["MICR Code", "1234"],
      ["IFSC code", "ABKV998"],
      ["Account Number", "129894543"],
    ]),
  },
];

/**
 * Edit dialog values per applicant id (prototype default E$ in cvt-drs-prototype.html; codes are
 * masterData codes: gender M, resident_status IR, id_proof_type Adhr).
 */
export const CVT_EDIT_APPLICANT_VALUES: Record<string, CvtEditApplicantValues> = {
  lifeassured1: {
    dob: "1988-08-09",
    gender: "M",
    residentialStatus: "IR",
    panNumber: "ANUJA6677W",
    panFlag: "Verified",
    pranNumber: "123456789012",
    identityProof: "ADHREK",
    ageProof: "PAN",
    addressProof: "ADHR",
    communicationPincode: "400064",
    permanentPincode: "400709",
  },
};

/** PIVV Details rows (prototype fallback data in cvt-drs-prototype.html). */
export const CVT_PIVV_DETAILS: PivvDetailRow[] = [
  {
    id: "pivv-demo-1",
    fupCode: "PIV",
    profile: "Life Assured",
    raisedDate: "9 Sep 2026",
    raisedRemark: "-",
    decisions: ["Another person spoken", "Pre-recorded video", "Customer didn’t complete the full script"],
    pivvRemark: "Customer not speaking",
  },
];

/** Decision History rows (prototype yCe in cvt-drs-prototype.html). */
export const CVT_DECISION_HISTORY: DecisionHistoryRow[] = [
  {
    date: "28 Sept 2026, 01:31:11 pm",
    userName: "Priya Sharma",
    userRole: "CVT",
    remarks: "Applicant details reviewed and forwarded for decision.",
  },
];