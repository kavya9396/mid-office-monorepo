import { getMasterList } from "@insurance-poc/utils";
import type { AppointeeRow, FieldData, ImageDetailRecord, LifeAssuredApplicant, NomineeRow } from "@insurance-poc/common/life-assured";
import type { CvtEditApplicantValues } from "./CvtEditApplicantDialog";

type JsonRecord = Record<string, unknown>;

/** A `[{ key?, label, value }]` entry of the DRS response. */
type RawField = { key: string; label: string; value: string };

export type CvtApplicantsResult = {
  applicants: LifeAssuredApplicant[];
  /** Edit dialog initial values per applicant id (master codes). */
  editValues: Record<string, CvtEditApplicantValues>;
};

// KYC values the prototype masks (everything except the last 4 characters)
const MASKED_KYC_LABELS = new Set(["PRAN Number", "PAN Number", "Identity Proof Number"]);

// `key` of the response entries read back into the Edit dialog
const RESPONSE_KEYS = {
  dob: "proposerSummary.dob",
  gender: "proposerSummary.gender",
  residentStatus: "proposerSummary.residentStatus",
  panNumber: "kycDetails.panNumber",
  panFlag: "kycDetails.isPanValid",
  pranNumber: "kycDetails.pranNo",
  ageProof: "kycDetails.dobDocument",
  identityProof: "kycDetails.genderDocument",
  addressProof: "kycDetails.pincodeDocument",
  communicationPincode: "address.communication.pinCode",
  permanentPincode: "address.permanent.pinCode",
} as const;

const PERSONAL_LABELS = [
  "Applicant Name",
  "Date of Birth",
  "Age",
  "Gender",
  "Marital Status",
  "Nationality",
  "Country of Residence",
  "Education",
  "Resident Status",
  "Designation",
  "Disabled",
  "Percentage Of Impairment",
  "Type Of Impairment",
  "UDID Number",
  "UDS Link",
  "City of Resident",
  "State of Resident",
] as const;

const KYC_LABELS = [
  "PRAN Number",
  "PRAN Number Verification",
  "PAN Number",
  "PAN Flag",
  "PAN Aadhar Seeding Status",
  "Identity Proof Type",
  "Identity Proof Expiry Date",
  "Identity Proof Number",
  "Address Proof",
  "Income Proof",
  "CKYC Number",
  "PEP",
  "Criminal Proceedings",
] as const;

const ADDRESS_LABELS = [
  "Address Line 1",
  "Address Line 2",
  "Address Line 3",
  "Landmark",
  "City",
  "State",
  "Country",
  "Pin Code",
] as const;

const CONTACT_LABELS = [
  "Mobile Number",
  "Email Id",
  "Alternate Mobile",
  "STD/ISD Code",
  "Land Line Number",
  "Email Pref",
  "SMS Pref",
  "Negative Pincode",
] as const;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : "");

const optionalText = (value: unknown) => {
  const result = str(value);
  return result === "" ? undefined : result;
};

const normalizeLabel = (label: string) => label.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isLabelMatch = (a: string, b: string) => normalizeLabel(a) === normalizeLabel(b);

/** Prototype masks everything except the last 4 characters. */
const maskValue = (value: string) => {
  const text = value.trim();
  if (!text) return "";
  return text.length <= 4 ? "X".repeat(text.length) : `${"X".repeat(text.length - 4)}${text.slice(-4)}`;
};

const readRawFields = (value: unknown): RawField[] =>
  asArray(value)
    .filter(isRecord)
    .map((item) => ({ key: str(item.key), label: str(item.label), value: str(item.value).trim() }));

/** One field per expected label, in that order; a missing or empty value shows as "-". */
const readFixedFields = (value: unknown, labels: readonly string[]): FieldData[] => {
  const received = readRawFields(value);
  return labels.map((label) => ({
    label,
    value: received.find((field) => isLabelMatch(field.label, label))?.value || "-",
  }));
};

const findByLabel = (entries: unknown, label: string): JsonRecord | undefined =>
  asArray(entries)
    .filter(isRecord)
    .find((entry) => isLabelMatch(str(entry.label), label));

const maskKycField = (field: FieldData): FieldData =>
  MASKED_KYC_LABELS.has(field.label)
    ? { label: field.label, value: maskValue(typeof field.value === "string" ? field.value : "") }
    : field;

const readValueByKey = (fields: RawField[], key: string): string =>
  fields.find((field) => field.key === key)?.value ?? "";

const toIsoDate = (value: string): string => (/^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "");

/** Maps a displayed value (description / value / code) to the master code used as the select value. */
const toMasterCode = (masterType: string, displayed: string, type?: string): string => {
  const target = displayed.trim().toLowerCase();
  if (!target) return "";
  const entry = getMasterList(masterType, type).find(
    (item) =>
      item.description.trim().toLowerCase() === target ||
      item.value?.trim().toLowerCase() === target ||
      item.code.trim().toLowerCase() === target,
  );
  return entry?.code ?? "";
};

const readImageRecords = (imageDetails: unknown): ImageDetailRecord[] =>
  asArray(asRecord(asRecord(imageDetails).value).rows)
    .filter(isRecord)
    .map((row) => ({
      imageType: optionalText(row.imageType),
      document: optionalText(row.document),
      faceMatchScore: optionalText(row.faceMatchScore),
      imageQuality: optionalText(row.imageQuality),
      remarks: optionalText(row.remarks),
    }));

const memberLabel = (memberType: string, total: number) => {
  const name = memberType.trim();
  if (total === 1 && name.toLowerCase().startsWith("lifeassured")) return "Life Assured";
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : "";
};

const toEditValues = (
  rawPersonalKyc: RawField[],
  communicationEntries: unknown,
  permanentEntries: unknown,
): CvtEditApplicantValues => ({
  dob: toIsoDate(readValueByKey(rawPersonalKyc, RESPONSE_KEYS.dob)),
  gender: toMasterCode("gender", readValueByKey(rawPersonalKyc, RESPONSE_KEYS.gender)),
  residentialStatus: toMasterCode("resident_status", readValueByKey(rawPersonalKyc, RESPONSE_KEYS.residentStatus)),
  panNumber: readValueByKey(rawPersonalKyc, RESPONSE_KEYS.panNumber),
  panFlag: readValueByKey(rawPersonalKyc, RESPONSE_KEYS.panFlag),
  pranNumber: readValueByKey(rawPersonalKyc, RESPONSE_KEYS.pranNumber),
  identityProof: toMasterCode("misc", readValueByKey(rawPersonalKyc, RESPONSE_KEYS.identityProof), "IDENTITY"),
  ageProof: toMasterCode("misc", readValueByKey(rawPersonalKyc, RESPONSE_KEYS.ageProof), "AGE"),
  addressProof: toMasterCode("misc", readValueByKey(rawPersonalKyc, RESPONSE_KEYS.addressProof), "ADDRESS"),
  communicationPincode: readValueByKey(readRawFields(communicationEntries), RESPONSE_KEYS.communicationPincode),
  permanentPincode: readValueByKey(readRawFields(permanentEntries), RESPONSE_KEYS.permanentPincode),
});

const toApplicant = (
  member: JsonRecord,
  total: number,
): { applicant: LifeAssuredApplicant; editValues: CvtEditApplicantValues } => {
  const memberType = str(member.memberType);
  const groups = asArray(asRecord(member.personal_kyc).groups);
  const contactAndAddress = asRecord(member.contact_and_address).value;
  const communicationEntries = findByLabel(contactAndAddress, "Communication Address")?.value;
  const permanentEntries = findByLabel(contactAndAddress, "Permanent Address")?.value;
  const payment = asRecord(member.payment_and_payout).value;

  const nominees: NomineeRow[] = [];
  const appointees: AppointeeRow[] = [];

  const applicant: LifeAssuredApplicant = {
    id: memberType,
    partyId: optionalText(member.partyId),
    memberType,
    label: memberLabel(memberType, total),
    imageRecords: readImageRecords(member.image_details),
    personalFields: readFixedFields(groups[0], PERSONAL_LABELS),
    kycFields: readFixedFields(groups[1], KYC_LABELS).map(maskKycField),
    communicationAddress: readFixedFields(communicationEntries, ADDRESS_LABELS),
    permanentAddress: readFixedFields(permanentEntries, ADDRESS_LABELS),
    contactDetails: readFixedFields(findByLabel(contactAndAddress, "Contact Details")?.value, CONTACT_LABELS),
    productFields: [],
    nominees,
    appointees,
    lifestyleFields: [],
    paymentDetails: readFixedFields(findByLabel(payment, "Payment Details")?.value, [
      "Is it a Third Party payment",
      "Payment Options",
    ]),
    payoutDetails: readFixedFields(findByLabel(payment, "Payout Details")?.value, [
      "Account Type",
      "Bank Type",
      "Branch",
      "MICR Code",
      "IFSC code",
      "Account Number",
    ]),
  };

  const rawPersonalKyc = [...readRawFields(groups[0]), ...readRawFields(groups[1])];
  return { applicant, editValues: toEditValues(rawPersonalKyc, communicationEntries, permanentEntries) };
};

/** Maps the `membersDetails` of the CVT DRS response (each member's `applicantProfile` section). */
export function mapCvtApplicants(membersDetails: unknown): CvtApplicantsResult {
  const rawMembers = asArray(membersDetails).filter(isRecord);
  const members = rawMembers.map((rawMember) => {
    const profileSection = asArray(rawMember.sections)
      .filter(isRecord)
      .find((section) => str(section.name) === "applicantProfile");
    return profileSection && isRecord(profileSection.value) ? profileSection.value : rawMember;
  });

  const applicants: LifeAssuredApplicant[] = [];
  const editValues: Record<string, CvtEditApplicantValues> = {};
  for (const member of members) {
    const mapped = toApplicant(member, members.length);
    applicants.push(mapped.applicant);
    editValues[mapped.applicant.id] = mapped.editValues;
  }
  return { applicants, editValues };
}
