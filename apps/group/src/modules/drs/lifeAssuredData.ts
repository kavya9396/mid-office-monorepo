import { getMasterList } from "@insurance-poc/utils";
import type {
  AppointeeRow,
  EditApplicantOptions,
  EditApplicantValues,
  FieldData,
  ImageDetailRecord,
  LifeAssuredApplicant,
  LoanEditValues,
  NomineeEditRow,
  NomineeRow,
  RiderEditRow,
} from "@insurance-poc/common/life-assured";

type JsonRecord = Record<string, unknown>;

export type LifeAssuredSource = {
  /** Raw `sections.applicantProfile.value` entries. */
  members: unknown[];
  /** Rider rows read from the Application Detail card's "Rider Details" table. */
  riders: RiderEditRow[];
};

// KYC values the prototype masks (everything except the last 4 characters)
const MASKED_KYC_LABELS = new Set(["PRAN Number", "PAN Number", "Identity Proof Number"]);

// base_and_loan_details label -> LoanEditValues key (case-insensitive)
const LOAN_KEYS: Record<string, keyof LoanEditValues> = {
  "base sum assured": "baseSumAssured",
  "base summ assured": "baseSumAssured",
  "loan amount": "loanAmount",
  "date of loan disbursement": "loanDisbursementDate",
  "share of loan": "loanShare",
  "loan term": "loanTerm",
  "policy term": "policyTerm",
  "master code": "masterCode",
  "loan account number": "loanAccountNumber",
};

const EMPTY_LOAN: LoanEditValues = {
  baseSumAssured: "",
  loanAmount: "",
  loanDisbursementDate: "",
  loanShare: "",
  loanTerm: "",
  policyTerm: "",
  masterCode: "",
  loanAccountNumber: "",
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

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? value : undefined);

const str = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : "");

const optionalText = (value: unknown) => {
  const result = str(value);
  return result === "" ? undefined : result;
};

/** [{ label, value }] -> FieldData[] */
const readFields = (value: unknown): FieldData[] =>
  asArray(value)
    .filter(isRecord)
    .map((item) => {
      const rawVal = text(item.value);
      const strVal = typeof rawVal === "string" ? rawVal.trim() : typeof rawVal === "number" ? String(rawVal) : "";
      return {
        label: str(item.label),
        value: strVal.length > 0 ? strVal : "-",
      };
    });

/** Finds an entry of a [{ label, ... }] list by label (case-insensitive). */
const findByLabel = (entries: unknown, label: string): JsonRecord | undefined =>
  asArray(entries)
    .filter(isRecord)
    .find((entry) => str(entry.label).trim().toLowerCase() === label.toLowerCase());

const maskKycField = (field: FieldData): FieldData =>
  MASKED_KYC_LABELS.has(field.label)
    ? { label: field.label, value: maskValue(typeof field.value === "string" ? field.value : undefined) }
    : field;

const splitName = (name: string) => {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
};

const toShare = (value: unknown) => {
  const raw = str(value).trim();
  const parsed = Number(raw);
  return raw !== "" && Number.isFinite(parsed) ? parsed : 0;
};

const readNomineeRows = (nominee: unknown, label: string): JsonRecord[] =>
  asArray(findByLabel(asRecord(nominee).value, label)?.rows).filter(isRecord);

const readLoan = (baseAndLoan: unknown): LoanEditValues => {
  const loan: LoanEditValues = { ...EMPTY_LOAN };
  for (const item of asArray(asRecord(baseAndLoan).value).filter(isRecord)) {
    const key = LOAN_KEYS[(str(item.name) || str(item.label)).trim().toLowerCase()];
    if (key) loan[key] = str(item.value);
  }
  return loan;
};

/** Finds a field value by label (case-insensitive) in a [{ label, value }] list. */
const fieldValue = (fields: FieldData[], label: string): string =>
  str(fields.find((field) => field.label.trim().toLowerCase() === label.toLowerCase())?.value);

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "09 Aug 1988" | "1988-08-09" -> "1988-08-09" (the format the Birthdate picker expects). */
const toIsoDate = (value: string): string => {
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = /^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/.exec(text);
  if (!match) return "";
  const month = MONTHS.indexOf(match[2].toLowerCase());
  if (month < 0) return "";
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
};

const toMasterOptions = (masterType: string, type?: string) =>
  getMasterList(masterType, type)
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.description, value: entry.code }));

/** Dropdown options for the Edit dialog, read from the post-login master data. */
export const readEditOptions = (): Partial<EditApplicantOptions> => ({
  gender: toMasterOptions("gender"),
  yesNo: toMasterOptions("misc", "YESNO"),
  dobDocument: toMasterOptions("misc", "AGE"),
  genderDocument: toMasterOptions("misc", "IDENTITY"),
  pincodeDocument: toMasterOptions("misc", "ADDRESS"),
  residentStatus: toMasterOptions("resident_status"),
});

/** Maps a displayed value (description / value / code) to the master code used as the select value. */
const toMasterCode = (masterType: string, displayed: string): string => {
  const target = displayed.trim().toLowerCase();
  if (!target) return "";
  const entry = getMasterList(masterType).find(
    (item) =>
      item.description.trim().toLowerCase() === target ||
      item.value?.trim().toLowerCase() === target ||
      item.code.trim().toLowerCase() === target,
  );
  return entry?.code ?? "";
};

/** "Yes" | "Seeded" -> "Y", "No" | "Not Seeded" -> "N" (the YESNO master codes), anything else -> "". */
const toYesNo = (value: string): string => {
  const text = value.trim().toLowerCase();
  if (["yes", "y", "true", "seeded", "matched", "valid"].includes(text)) return "Y";
  if (["no", "n", "false", "not seeded", "not matched", "invalid"].includes(text)) return "N";
  return "";
};

type EditValuesSource = {
  personal: FieldData[];
  kyc: FieldData[];
  communicationAddress: FieldData[];
  contactDetails: FieldData[];
  financialAndProfession: FieldData[];
  health: FieldData[];
  lifestyleHabits: string;
};

const readEditValues = (source: EditValuesSource): Partial<EditApplicantValues> => ({
  dob: toIsoDate(fieldValue(source.personal, "Date of Birth")),
  gender: toMasterCode("gender", fieldValue(source.personal, "Gender")),
  zipCode: fieldValue(source.communicationAddress, "Pin Code"),
  mobileNo: fieldValue(source.contactDetails, "Mobile Number"),
  immigrationStatus: toMasterCode("resident_status", fieldValue(source.personal, "Resident Status")),
  panNumber: fieldValue(source.kyc, "PAN Number"),
  isPanValid: toYesNo(fieldValue(source.kyc, "PAN Flag")),
  aadharSeedingStatus: toYesNo(fieldValue(source.kyc, "PAN Aadhar Seeding Status")),
  emailId: fieldValue(source.contactDetails, "Email Id"),
  height: fieldValue(source.health, "Height"),
  weight: fieldValue(source.health, "Weight"),
  lifestyleHabits: source.lifestyleHabits,
  annualIncome: fieldValue(source.financialAndProfession, "Annual Income"),
});

// product_details row key + default label, in column order. The row keys keep the API's own
// spelling (`foundSource`, `partnertype`); labels come from `columns` by position when present.
const PRODUCT_COLUMNS = [
  { key: "productCode", label: "Product Code" },
  { key: "productType", label: "Product Type" },
  { key: "foundSource", label: "Fund Source" },
  { key: "partnertype", label: "Partner Type" },
] as const;

/**
 * product_details table -> FieldData[] (one field per column). An applicant has one product, so only
 * the first row is used; the field card keys fields by label, so extra rows would repeat the labels.
 */
const readProductFields = (productDetails: unknown): FieldData[] => {
  const value = asRecord(asRecord(productDetails).value);
  const columns = asArray(value.columns);
  const row = asArray(value.rows).find(isRecord);
  if (!row) return [];
  return PRODUCT_COLUMNS.map(({ key, label }, index) => ({
    label: optionalText(asRecord(columns[index]).label) ?? label,
    value: text(row[key]),
  }));
};

const readImageRecords = (imageDetails: unknown): ImageDetailRecord[] =>
  asArray(asRecord(asRecord(imageDetails).value).rows)
    .filter(isRecord)
    .map((row) => ({
      document: optionalText(row.document),
      faceMatchScore: optionalText(row.faceMatchScore),
      imageQuality: optionalText(row.imageQuality),
      remarks: optionalText(row.remarks),
    }));

const toApplicant = (member: JsonRecord, total: number, riders: RiderEditRow[]): LifeAssuredApplicant => {
  const memberType = str(member.memberType);
  const groups = asArray(asRecord(member.personal_kyc).groups);

  const contactAndAddress = asRecord(member.contact_and_address).value;
  const healthInformation = findByLabel(asRecord(member.medical_and_lifestyle).value, "Health Information");
  const lifestyleHabits = findByLabel(asRecord(member.medical_and_lifestyle).value, "Lifestyle Habits");

  const nomineeRows = readNomineeRows(member.nominee, "Nominee Details");
  const appointeeRows = readNomineeRows(member.nominee, "Appointee Details");

  const nominees: NomineeRow[] = nomineeRows.map((row) => ({
    nomineeName: str(row.name) || "-",
    nomineeDOB: str(row.dob) || "-",
    gender: str(row.gender) || "-",
    relationship: str(row.relationship) || "-",
    sharePercentage: toShare(row.share),
    isLASame: "-",
    relationShipWithJL: "-",
    laFlag: "-",
  }));

  const appointees: AppointeeRow[] = appointeeRows.map((row) => ({
    appointeeName: str(row.name) || "-",
    appointeeGender: str(row.gender) || "-",
    appointeeDOB: str(row.dob) || "-",
    appointeeRelationship: str(row.relationship) || "-",
  }));

  const editNominees: NomineeEditRow[] = nomineeRows.map((row) => ({
    ...splitName(str(row.name)),
    dob: str(row.dob).slice(0, 10),
    gender: str(row.gender),
    proposerNomineeRelation: str(row.relationship),
    percentage: str(row.share),
    accountNumber: "",
    ifsc: "",
  }));

  const personalFields = readFields(groups[0]);
  const rawKycFields = readFields(groups[1]);
  const communicationAddress = readFields(findByLabel(contactAndAddress, "Communication Address")?.value);
  const contactDetails = readFields(findByLabel(contactAndAddress, "Contact Details")?.value);

  return {
    id: memberType,
    partyId: optionalText(member.partyId),
    memberType,
    label: memberLabel(memberType, total),
    profileImage: undefined,
    imageRecords: readImageRecords(member.image_details),
    personalFields,
    kycFields: rawKycFields.map(maskKycField),
    communicationAddress,
    permanentAddress: readFields(findByLabel(contactAndAddress, "Permanent Address")?.value),
    contactDetails,
    productFields: readProductFields(member.product_details),
    nominees,
    appointees,
    editValues: readEditValues({
      personal: personalFields,
      kyc: rawKycFields,
      communicationAddress,
      contactDetails,
      financialAndProfession: readFields(asRecord(member.financial_and_profession).value),
      health: readFields(healthInformation?.value),
      lifestyleHabits: str(lifestyleHabits?.value),
    }),
    editNominees,
    editRiders: riders,
    editLoan: readLoan(member.base_and_loan_details),
    lifestyleFields: [
      ...readFields(healthInformation?.value),
      { label: "Lifestyle Habits", value: text(lifestyleHabits?.value) },
    ],
  };
};

export function mapApplicants(source: LifeAssuredSource): LifeAssuredApplicant[] {
  const rawMembers = source.members.filter(isRecord);
  const members = rawMembers.map((rawMember) => {
    const sections = asArray(rawMember.sections).filter(isRecord);
    const profileSection = sections.find((s) => str(s.name) === "applicantProfile");
    if (profileSection && isRecord(profileSection.value)) {
      return profileSection.value;
    }
    return rawMember;
  });
  return members.map((member) => toApplicant(member, members.length, source.riders));
}
