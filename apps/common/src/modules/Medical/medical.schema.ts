/**
 * Zod schemas for the View Medical module — one schema per section, used for
 * field-level validation. A field is mandatory when its schema rejects an empty
 * value (see `isMedicalFieldRequired`); there is no separate "required" flag.
 *
 * Form values are strings (empty string = nothing entered / "--Select--").
 */
import { z } from "zod";
import { getMasterList, RegexPatterns } from "@insurance-poc/utils";

/* ------------------------------------------------------------------ */
/* Shared field builders                                              */
/* ------------------------------------------------------------------ */

const isValidDdMmYyyy = (value: string): boolean => {
  const match = RegexPatterns.dateDDMMYYYY.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/** Free text — any value accepted. */
const optionalText = z.string().trim();
const mandatoryText = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const mandatoryNumeric = (label: string) =>
  mandatoryText(label).regex(RegexPatterns.numeric, `${label} must be numeric`);

/** Alphabets only. */
const optionalAlphabets = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || RegexPatterns.alphabets.test(v), {
      message: `${label} must contain alphabets only`,
    });
const mandatoryAlphabets = (label: string) =>
  mandatoryText(label).regex(
    RegexPatterns.alphabets,
    `${label} must contain alphabets only`,
  );

/** Numerical only. */
const optionalNumeric = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || RegexPatterns.numeric.test(v), {
      message: `${label} must be numeric`,
    });

/** Date in DD/MM/YYYY. */
const mandatoryDate = (label: string) =>
  mandatoryText(label).refine(isValidDdMmYyyy, {
    message: `${label} must be a valid date (DD/MM/YYYY)`,
  });

/** Optional date in DD/MM/YYYY. */
const optionalDate = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || isValidDdMmYyyy(v), {
      message: `${label} must be a valid date (DD/MM/YYYY)`,
    });

/* ------------------------------------------------------------------ */
/* Dropdown option values                                             */
/* ------------------------------------------------------------------ */

/**
 * Active entries of a post-login master list as dropdown options: the value is the master `code` (what
 * the API sends and expects on save) and the label is its `description`. Duplicate descriptions keep the
 * first entry. `type` narrows a list such as `misc` to one row type (e.g. `YESNO`). Empty when the
 * master is not loaded or has no active entries.
 */
export const getMedicalMasterEntries = (
  masterType: string,
  type?: string,
): { label: string; value: string }[] => {
  const seen = new Set<string>();
  return getMasterList(masterType, type)
    .filter((entry) => entry.isActive === "Y")
    .flatMap((entry) => {
      const label = entry.description.trim();
      const key = label.toLowerCase();
      if (entry.code === "" || label === "" || seen.has(key)) return [];
      seen.add(key);
      return [{ label, value: entry.code }];
    });
};

/** Dropdown whose valid values are the master codes, read when it is validated (the master loads after login). */
const masterDropdown = (label: string, masterType: string, required: boolean, type?: string) =>
  (required ? mandatoryText(label) : z.string().trim()).refine(
    (value) =>
      value === "" || getMedicalMasterEntries(masterType, type).some((option) => option.value === value),
    { message: `${label} has an invalid selection` },
  );

/** `misc` master rows of type `YESNO`. */
const miscYesNoDropdown = (label: string, required: boolean) =>
  masterDropdown(label, "misc", required, "YESNO");

/** `misc` master rows of type `MEDICAL_TYPE`. */
const medicalTypeDropdown = (required: boolean) =>
  masterDropdown("Medical Type", "misc", required, "MEDICAL_TYPE");

/* ------------------------------------------------------------------ */
/* Section: MER                                                       */
/* ------------------------------------------------------------------ */

export const medicalMerSchema = z.object({
  /** Disabled field — value is system supplied, not validated. */
  applicationNo: optionalText,
  firstName: mandatoryAlphabets("First Name"),
  lastName: optionalAlphabets("Last Name"),
  isMerNameSameAsProposalName: miscYesNoDropdown(
    "Is MER name same as proposal name?",
    true,
  ),
  placeOfExamination: masterDropdown(
    "Place of Examination",
    "misc",
    true,
    "EXAM_PL",
  ),
  gender: masterDropdown("Gender", "gender", true),
  nameOfMe: mandatoryAlphabets("Name Of ME"),
  meCode: mandatoryText("ME Code"),
  isIdentityProofAndApplicationPhotoMatch: miscYesNoDropdown(
    "Is Identity Proof and Application Photo Match",
    false,
  ),
  examineeDob: mandatoryDate("Examinee DOB"),
  examineeEducationSd: masterDropdown("Examinee Education SD", "misc", false, "EDUCATION"),
  examineeOccupationSd: masterDropdown("Examinee Occupation SD", "misc", false, "OCCUPATION"),
  examineeIncomeSd: optionalNumeric("Examinee Income SD"),
  previousPolicyDeclinedPostponedOrRevisedTermSd: miscYesNoDropdown(
    "Any previous life Insurance policy decline/Postpone/or issued on revised term SD",
    false,
  ),
  examineePhotoIdProof: mandatoryText("Examinee Photo ID Proof"),
  examineeContactNo: optionalNumeric("Examinee Contact No"),
  faceMatchScore: optionalText,
  diagnosticCentreName: optionalText,
  diagnosticCentreAddress: optionalText,
  diagnosticCentrePincode: optionalNumeric("Diagnostic Centre Pincode"),
  dateOfExamination: mandatoryDate("Date of Examination"),
});

export type MedicalMerValues = z.input<typeof medicalMerSchema>;

/* ------------------------------------------------------------------ */
/* Section: Habit and Addictions                                      */
/* ------------------------------------------------------------------ */

/** True when the value is the master (misc YESNO) entry described as Yes. */
const isYesAnswer = (value: string | undefined): boolean =>
  getMedicalMasterEntries("misc", "YESNO").some(
    (option) => option.value === value && option.label.toLowerCase() === "yes",
  );

/** Quantity / Year are mandatory only when the habit's indicator is Yes. */
const habitDetail = (label: string, indicator: string | undefined) =>
  isYesAnswer(indicator) ? mandatoryNumeric(label) : optionalNumeric(label);

/**
 * Built per call because Quantity / Year depend on the habit's indicator.
 * `values` holds the current indicator values keyed by schema key.
 */
export const createMedicalHabitAddictionsSchema = (
  values: Readonly<Record<string, string>> = {},
) =>
  z.object({
    cigarettes: miscYesNoDropdown("Cigarettes/beedis/cigar", true),
    cigarettesQuant: habitDetail(
      "Cigarettes/beedis/cigar Quant",
      values.cigarettes,
    ),
    cigarettesYear: habitDetail(
      "Cigarettes/beedis/cigar Year",
      values.cigarettes,
    ),
    gutka: miscYesNoDropdown("Gutka / snuff / paan etc.", true),
    gutkaQuant: habitDetail("Gutka / snuff / paan etc. Quant", values.gutka),
    gutkaYear: habitDetail("Gutka / snuff / paan etc. Year", values.gutka),
    narcotic: miscYesNoDropdown("Narcotic Consumption", true),
    narcoticQuant: habitDetail("Narcotic Consumption Quant", values.narcotic),
    narcoticYear: habitDetail("Narcotic Consumption Year", values.narcotic),
    alcohol: miscYesNoDropdown("Beer/Wine/Hard liquor", true),
    alcoholQuant: habitDetail("Beer/Wine/Hard liquor Quant", values.alcohol),
    alcoholYear: habitDetail("Beer/Wine/Hard liquor Year", values.alcohol),
  });

export type MedicalHabitAddictionsValues = z.input<
  ReturnType<typeof createMedicalHabitAddictionsSchema>
>;

/* ------------------------------------------------------------------ */
/* Section: Measurement                                               */
/* ------------------------------------------------------------------ */

export const medicalMeasurementSchema = z.object({
  heightCms: mandatoryNumeric("Height (cms)"),
  /** Disabled — auto calculated from Height (cms). */
  heightFts: optionalText,
  /** Disabled — auto calculated from Height (cms). */
  inches: optionalText,
  weightKgs: mandatoryNumeric("Weight (Kgs)"),
  waistCms: mandatoryNumeric("Waist (cms)"),
  hipsCms: mandatoryNumeric("Hips (cms)"),
  /** Disabled — auto calculated from Height (cms) and Weight (Kgs). */
  bmi: optionalText,
});

export type MedicalMeasurementValues = z.input<typeof medicalMeasurementSchema>;

export interface MedicalMeasurementDerived {
  heightFts: string;
  inches: string;
  bmi: string;
}

/**
 * Auto-calculated, disabled Measurement fields. Returns empty strings for any
 * value that cannot be calculated from the (possibly invalid) inputs.
 */
export const calculateMedicalMeasurements = (
  heightCms: string,
  weightKgs: string,
): MedicalMeasurementDerived => {
  const height = RegexPatterns.numeric.test(heightCms.trim())
    ? Number(heightCms)
    : 0;
  const weight = RegexPatterns.numeric.test(weightKgs.trim())
    ? Number(weightKgs)
    : 0;

  let heightFts = "";
  let inches = "";
  if (height > 0) {
    const totalInches = height / 2.54;
    heightFts = String(Math.floor(totalInches / 12));
    inches = (totalInches % 12).toFixed(2);
  }
  const bmi =
    height > 0 && weight > 0
      ? (weight / (height / 100) ** 2).toFixed(2)
      : "";
  return { heightFts, inches, bmi };
};

/* ------------------------------------------------------------------ */
/* Section: Blood pressure and Pulse details                          */
/* ------------------------------------------------------------------ */

/**
 * Label of one BP reading, e.g. "Systolic 3". The number is the API `readingId`.
 * The API can return more than four readings, so reading fields are not listed in the schema:
 * `getMedicalFieldValidator` validates them by label (Systolic 1 / Diastolic 1 required, rest optional).
 */
export const MEDICAL_BP_READING_LABEL = /^(Systolic|Diastolic) (\d+)$/;

export const medicalBloodPressurePulseSchema = z.object({
  /** Auto populated — average of the entered Systolic readings. */
  avgSystolic: optionalText,
  /** Auto populated — average of the entered Diastolic readings. */
  avgDiastolic: optionalText,
  pulseRate: mandatoryNumeric("Pulse Rate"),
});

export type MedicalBloodPressurePulseValues = z.input<
  typeof medicalBloodPressurePulseSchema
>;

/**
 * Average of the readings that hold a valid number, rounded to a whole number.
 * Returns "" when no reading has been entered.
 */
export const calculateMedicalAverage = (
  readings: readonly string[],
): string => {
  const numbers = readings
    .map((reading) => reading.trim())
    .filter((reading) => RegexPatterns.numeric.test(reading))
    .map(Number);
  if (numbers.length === 0) return "";
  const total = numbers.reduce((sum, n) => sum + n, 0);
  return String(Math.round(total / numbers.length));
};

/* ------------------------------------------------------------------ */
/* Section: Special Medical - 2DECHO                                  */
/* ------------------------------------------------------------------ */

export const medical2DEchoSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  findings: masterDropdown("Findings", "misc", true, "FINDINGS"),
  ejectionFraction: mandatoryNumeric("Ejection Fraction"),
  /** Disabled — auto populated. */
  ejectionResult: optionalText,
  rejectionAbnormality: masterDropdown("Rejection Abnormality", "misc", true, "SM_FINDINGS"),
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  remarks: optionalText,
});

export type Medical2DEchoValues = z.input<typeof medical2DEchoSchema>;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - DOBUTAMINE STRESS ECHOCARDIOGRAM        */
/* ------------------------------------------------------------------ */

export const medicalDobutamineStressEchoSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  findings: masterDropdown("Findings", "misc", true, "FINDINGS"),
  ejectionFraction: mandatoryNumeric("Ejection Fraction"),
  /** Disabled — auto populated. */
  ejectionResult: optionalText,
  rejectionAbnormality: masterDropdown("Rejection Abnormality", "misc", true, "SM_FINDINGS"),
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  remark: optionalText,
});

export type MedicalDobutamineStressEchoValues = z.input<
  typeof medicalDobutamineStressEchoSchema
>;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - EXERCISE STRESS ECHOCARDIOGRAM          */
/* Same fields and rules as DOBUTAMINE STRESS ECHOCARDIOGRAM.         */
/* ------------------------------------------------------------------ */

export const medicalExerciseStressEchoSchema =
  medicalDobutamineStressEchoSchema;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - ECG                                     */
/* ------------------------------------------------------------------ */

export const medicalEcgSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  findings: masterDropdown("Findings", "misc", true, "FINDINGS"),
  axis: masterDropdown("Axis", "misc", false, "AXIS"),
  heartRate: mandatoryNumeric("Heart Rate"),
  /** Disabled — auto populated. */
  heartRateFinding: optionalText,
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  remark: optionalText,
});

export type MedicalEcgValues = z.input<typeof medicalEcgSchema>;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - BLOOD UREA and NITRO                    */
/* ------------------------------------------------------------------ */

export const medicalBloodUreaSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  findings: mandatoryNumeric("Findings"),
  /** Disabled — auto populated. */
  result: optionalText,
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  remark: optionalText,
});

export type MedicalBloodUreaValues = z.input<typeof medicalBloodUreaSchema>;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - CXR                                     */
/* ------------------------------------------------------------------ */

export const medicalCxrSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  findings: masterDropdown("Findings", "misc", true, "SM_FINDINGS"),
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  remark: optionalText,
});

export type MedicalCxrValues = z.input<typeof medicalCxrSchema>;

/* ------------------------------------------------------------------ */
/* Sections: Special Medical - MAMMOGRAM and PAP SMEAR                */
/* Same fields and rules as CXR.                                      */
/* ------------------------------------------------------------------ */

export const medicalMammogramSchema = medicalCxrSchema;
export const medicalPapSmearSchema = medicalCxrSchema;

/** STOOL TEST uses the same fields and rules as CXR. */
export const medicalStoolTestSchema = medicalCxrSchema;

/** USG and Fundoscopy Test use the same fields and rules as CXR. */
export const medicalUsgSchema = medicalCxrSchema;
export const medicalFundoscopyTestSchema = medicalCxrSchema;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - TMT                                     */
/* ------------------------------------------------------------------ */

export const medicalTmtSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  findings: masterDropdown("Findings", "misc", true, "FINDINGS"),
  mets: masterDropdown("METS", "misc", true, "METS"),
  heartRateFinding: optionalNumeric("Heart Rate Finding"),
  /** Disabled — auto populated. */
  heartRateResult: optionalText,
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  remark: optionalText,
});

export type MedicalTmtValues = z.input<typeof medicalTmtSchema>;

/* ------------------------------------------------------------------ */
/* Section: Special Medical - PFT                                     */
/* ------------------------------------------------------------------ */

export const medicalPftSchema = z.object({
  medicalType: medicalTypeDropdown(true),
  date: optionalDate("Date"),
  examineeName: optionalText,
  examineeAge: optionalNumeric("Examinee Age"),
  diagnosticCentreName: optionalText,
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  inspiration: optionalNumeric("Inspiration"),
  expiration: optionalNumeric("Expiration"),
  fev1: mandatoryNumeric("FEV1"),
  fvc: mandatoryNumeric("FVC"),
  fev1Fvc: mandatoryNumeric("FEV1/FVC"),
  rv: optionalNumeric("RV"),
  vc: optionalNumeric("VC"),
});

export type MedicalPftValues = z.input<typeof medicalPftSchema>;

/* ------------------------------------------------------------------ */
/* Section: Other Medical - Blood Sugar Random                        */
/* ------------------------------------------------------------------ */

export const medicalBloodSugarRandomSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  date: optionalDate("Date"),
  examineeName: mandatoryText("Examinee Name"),
  examineeAge: optionalNumeric("Examinee Age"),
  examineeGender: masterDropdown("Examinee Gender", "gender", false),
  diagnosticCentreName: optionalText,
  diagnosticCentreAddress: optionalText,
  diagnosticCentrePincode: optionalNumeric("Diagnostic Centre Pincode"),
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  value: mandatoryNumeric("Value"),
  labRangeStart: optionalText,
  labRangeEnd: optionalText,
  unitValue: optionalText,
  /** Disabled — auto populated (Normal / Abnormal). */
  findings: optionalText,
});

/* ------------------------------------------------------------------ */
/* Section: Other Medical - CBC Group (header fields)                 */
/* The parameter table rules live in `MEDICAL_SECTION_PARAMETER_RULES`. */
/* ------------------------------------------------------------------ */

export const medicalCbcSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  date: optionalDate("Date"),
  examineeName: mandatoryText("Examinee Name"),
  examineeAge: optionalNumeric("Examinee Age"),
  examineeGender: masterDropdown("Examinee Gender", "gender", false),
  diagnosticCentreName: optionalText,
  diagnosticCentreAddress: optionalText,
  diagnosticCentrePincode: optionalNumeric("Diagnostic Centre Pincode"),
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
});

export type MedicalCbcValues = z.input<typeof medicalCbcSchema>;

/** Config label -> schema key for sections whose fields are the CBC header fields. */
const MEDICAL_CBC_FIELD_KEYS: Readonly<Record<string, string>> = {
  "Medical Type": "medicalType",
  Date: "date",
  "Examinee Name": "examineeName",
  "Examinee Age": "examineeAge",
  "Examinee Gender": "examineeGender",
  "Diagnostic Centre Name": "diagnosticCentreName",
  "Diagnostic Centre Address": "diagnosticCentreAddress",
  "Diagnostic Centre Pincode": "diagnosticCentrePincode",
  "Doctor Name": "doctorName",
  "Doctor Registration No": "doctorRegistrationNo",
};

export type MedicalBloodSugarRandomValues = z.input<
  typeof medicalBloodSugarRandomSchema
>;

/* ------------------------------------------------------------------ */
/* Sections: Other Medical - COT, GHB, HBA1C                          */
/* Same layout as Blood Sugar Random (header fields + lab result row).*/
/* ------------------------------------------------------------------ */

/** Config label -> schema key for sections that use the lab result row. */
const MEDICAL_LAB_RESULT_FIELD_KEYS: Readonly<Record<string, string>> = {
  "Medical Type": "medicalType",
  Date: "date",
  "Examinee Name": "examineeName",
  "Examinee Age": "examineeAge",
  "Examinee Gender": "examineeGender",
  "Diagnostic Centre Name": "diagnosticCentreName",
  "Diagnostic Centre Address": "diagnosticCentreAddress",
  "Diagnostic Centre Pincode": "diagnosticCentrePincode",
  "Doctor Name": "doctorName",
  "Doctor Registration No": "doctorRegistrationNo",
  Value: "value",
  "Lab Range Start": "labRangeStart",
  "Lab Range End": "labRangeEnd",
  "Unit Value": "unitValue",
  Findings: "findings",
};

/** COT, HBSAG, HIV Elisa, HIV Western Blot, HCV: Value is a `misc` VALUE dropdown (Negative / Positive). */
export const medicalCotSchema = z.object({
  ...medicalBloodSugarRandomSchema.shape,
  value: masterDropdown("Value", "misc", true, "VALUE"),
});

/** SERUM COTININE: Value is a `misc` KETONE_BODIES dropdown (Present / Nil/Absent). */
export const medicalSerumCotinineSchema = z.object({
  ...medicalBloodSugarRandomSchema.shape,
  value: masterDropdown("Value", "misc", true, "KETONE_BODIES"),
});

/** GHB and HBA1C: Value is numeric — identical to Blood Sugar Random. */
export const medicalGhbSchema = medicalBloodSugarRandomSchema;

export type MedicalCotValues = z.input<typeof medicalCotSchema>;
export type MedicalGhbValues = z.input<typeof medicalGhbSchema>;

/* ------------------------------------------------------------------ */
/* Sections: Other Medical - Microalbuminuria, PSA                    */
/* Findings is the entered numeric value; Result is auto populated.   */
/* ------------------------------------------------------------------ */

export const medicalMicroalbuminuriaSchema = z.object({
  medicalType: medicalTypeDropdown(false),
  testDate: optionalDate("Test Date"),
  examineeName: mandatoryText("Examinee Name"),
  examineeAge: optionalNumeric("Examinee Age"),
  examineeGender: masterDropdown("Examinee Gender", "gender", false),
  diagnosticCentreName: optionalText,
  diagnosticCentreAddress: optionalText,
  diagnosticCentrePincode: optionalNumeric("Diagnostic Centre Pincode"),
  doctorName: optionalText,
  doctorRegistrationNo: optionalText,
  findings: mandatoryNumeric("Findings"),
  labRangeStart: optionalText,
  labRangeEnd: optionalText,
  unitValue: optionalText,
  /** Disabled — auto populated. */
  result: optionalText,
});

export type MedicalMicroalbuminuriaValues = z.input<
  typeof medicalMicroalbuminuriaSchema
>;

/** Config label -> schema key for Microalbuminuria and PSA. */
const MEDICAL_TEST_DATE_LAB_FIELD_KEYS: Readonly<Record<string, string>> = {
  "Medical Type": "medicalType",
  "Test Date": "testDate",
  "Examinee Name": "examineeName",
  "Examinee Age": "examineeAge",
  "Examinee Gender": "examineeGender",
  "Diagnostic Centre Name": "diagnosticCentreName",
  "Diagnostic Centre Address": "diagnosticCentreAddress",
  "Diagnostic Centre Pincode": "diagnosticCentrePincode",
  "Doctor Name": "doctorName",
  "Doctor Registration No": "doctorRegistrationNo",
  Findings: "findings",
  "Lab Range Start": "labRangeStart",
  "Lab Range End": "labRangeEnd",
  "Unit Value": "unitValue",
  Result: "result",
};

/* ------------------------------------------------------------------ */
/* Section: Tele/Video Measurements                                   */
/* ------------------------------------------------------------------ */

export const medicalTeleMeasurementSchema = z.object({
  heightCms: mandatoryNumeric("Height (cms)"),
  /** Disabled — auto calculated from Height (cms). */
  heightFt: optionalText,
  /** Disabled — auto calculated from Height (cms). */
  inches: optionalText,
  weightKgs: mandatoryNumeric("Weight (kgs)"),
  /** Disabled — auto calculated from Height (cms) and Weight (kgs). */
  bmi: optionalText,
});

export type MedicalTeleMeasurementValues = z.input<
  typeof medicalTeleMeasurementSchema
>;

/* ------------------------------------------------------------------ */
/* Section: Tele/Video MER                                            */
/* ------------------------------------------------------------------ */

/** Time in 12-hour form, e.g. `04:26 PM`. */
export const MEDICAL_TIME_12H = /^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;

const mandatoryTime = (label: string) =>
  mandatoryText(label).regex(
    MEDICAL_TIME_12H,
    `${label} must be a valid time (hh:mm AM/PM)`,
  );

export const medicalTeleMerSchema = z.object({
  /** Disabled field — value is system supplied, not validated. */
  applicationNo: optionalText,
  firstName: mandatoryAlphabets("First Name"),
  lastName: optionalAlphabets("Last Name"),
  gender: masterDropdown("Gender", "gender", true),
  dateOfBirth: mandatoryDate("Date of Birth"),
  telephonicMer: miscYesNoDropdown("Telephonic MER", true),
  timeOfTeleCall: mandatoryTime("Time of Tele call"),
  education: masterDropdown("Education", "misc", false, "EDUCATION"),
  occupation: masterDropdown("Occupation", "misc", false, "OCCUPATION"),
  disclosure: masterDropdown("Disclosure", "misc", false, "MED_TELE_DISCLOSURE"),
  adversity: masterDropdown("Adversity", "misc", false, "MED_TELE_ADV"),
  annualIncome: optionalNumeric("Annual Income"),
  examinerName: mandatoryAlphabets("Examiner Name"),
  registrationId: mandatoryText("Registration ID"),
  merDetail: masterDropdown("MER Detail", "misc", false, "MED_TELE_MER_DETAIL"),
  previousInsuranceDeclined: miscYesNoDropdown("Previous Insurance Declined", false),
  medicalTreatment: miscYesNoDropdown("Medical Treatment", false),
  address: optionalText,
  teleFindings: optionalText,
  teleMerFinalRemark: optionalText,
  /** Read only; no master list. */
  teleType: optionalText,
});

export type MedicalTeleMerValues = z.input<typeof medicalTeleMerSchema>;

/* ------------------------------------------------------------------ */
/* Section layout: Family history (one schema applied to every row)   */
/* ------------------------------------------------------------------ */

export const medicalFamilyHistoryRowSchema = z.object({
  relation: mandatoryText("Relation Type"),
  age: mandatoryNumeric("Age"),
  alive: optionalText,
  health: optionalText,
});

export type MedicalFamilyHistoryRowValues = z.input<
  typeof medicalFamilyHistoryRowSchema
>;

export type MedicalFamilyHistoryColumn =
  keyof typeof medicalFamilyHistoryRowSchema.shape;

/* ------------------------------------------------------------------ */
/* Registry + field-level helpers                                     */
/* ------------------------------------------------------------------ */

type MedicalSectionSchema = z.ZodObject<Readonly<Record<string, z.ZodType>>>;

/**
 * Section schemas keyed by `MedicalSection.key`. Each entry receives the current
 * values of the fields it depends on (keyed by schema key) so conditional rules
 * can be expressed in the schema. Add new sections here.
 */
export const MEDICAL_SECTION_SCHEMAS: Readonly<
  Record<
    string,
    (values: Readonly<Record<string, string>>) => MedicalSectionSchema
  >
> = {
  mer: () => medicalMerSchema,
  habit_and_addictions: createMedicalHabitAddictionsSchema,
  tele_habit_addiction: createMedicalHabitAddictionsSchema,
  measurement: () => medicalMeasurementSchema,
  blood_pressure_and_pulse: () => medicalBloodPressurePulseSchema,
  tele_mer: () => medicalTeleMerSchema,
  tele_measurements: () => medicalTeleMeasurementSchema,
  "2decho": () => medical2DEchoSchema,
  dobutamine_stress_echocardiogram: () => medicalDobutamineStressEchoSchema,
  exercise_stress_echocardiogram: () => medicalDobutamineStressEchoSchema,
  ecg: () => medicalEcgSchema,
  blood_urea_and_nitro: () => medicalBloodUreaSchema,
  cxr: () => medicalCxrSchema,
  mammogram: () => medicalCxrSchema,
  pap_smear: () => medicalCxrSchema,
  stool_test: () => medicalCxrSchema,
  usg: () => medicalCxrSchema,
  fundoscopy_test: () => medicalCxrSchema,
  pft: () => medicalPftSchema,
  tmt: () => medicalTmtSchema,
  blood_sugar_random: () => medicalBloodSugarRandomSchema,
  hbsag: () => medicalCotSchema,
  hiv_elisa: () => medicalCotSchema,
  cot: () => medicalCotSchema,
  ghb: () => medicalGhbSchema,
  hba1c: () => medicalGhbSchema,
  ppbs: () => medicalBloodSugarRandomSchema,
  serum_cotinine: () => medicalSerumCotinineSchema,
  fbs: () => medicalBloodSugarRandomSchema,
  hiv_western_blot: () => medicalCotSchema,
  hcv: () => medicalCotSchema,
  microalbuminuria: () => medicalMicroalbuminuriaSchema,
  psa: () => medicalMicroalbuminuriaSchema,
  cbc_group: () => medicalCbcSchema,
  lft: () => medicalCbcSchema,
  lipids: () => medicalCbcSchema,
  ogtt_group: () => medicalCbcSchema,
  rua_group: () => medicalCbcSchema,
  sma12_group: () => medicalCbcSchema,
  s13_group: () => medicalCbcSchema,
  tft_group: () => medicalCbcSchema,
};

/**
 * Fields whose rules depend on another field of the same section:
 * section key -> config label -> config label of the field it depends on.
 */
export const MEDICAL_SECTION_FIELD_DEPENDENCIES: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  habit_and_addictions: {
    "Cigarettes/beedis/cigar - Quantity": "Cigarettes/beedis/cigar - Indicator",
    "Cigarettes/beedis/cigar - No. of Year": "Cigarettes/beedis/cigar - Indicator",
    "Gutka / snuff / paan etc. - Quantity": "Gutka / snuff / paan etc. - Indicator",
    "Gutka / snuff / paan etc. - No. of Year": "Gutka / snuff / paan etc. - Indicator",
    "Narcotic Consumption - Quantity": "Narcotic Consumption - Indicator",
    "Narcotic Consumption - No. of Year": "Narcotic Consumption - Indicator",
    "Beer/Wine/Hard liquor - Quantity": "Beer/Wine/Hard liquor - Indicator",
    "Beer/Wine/Hard liquor - No. of Year": "Beer/Wine/Hard liquor - Indicator",
  },
  tele_habit_addiction: {
    "Cigarette/beedis/cigar - Quantity": "Cigarette/beedis/cigar - Indicator",
    "Cigarette/beedis/cigar - No. of Year": "Cigarette/beedis/cigar - Indicator",
    "Gutka/Snuff/Paan etc. - Quantity": "Gutka/Snuff/Paan etc. - Indicator",
    "Gutka/Snuff/Paan etc. - No. of Year": "Gutka/Snuff/Paan etc. - Indicator",
    "Narrotic Consumption - Quantity": "Narrotic Consumption - Indicator",
    "Narrotic Consumption - No. of Year": "Narrotic Consumption - Indicator",
    "Beer/Wine/Hard liquor - Quantity": "Beer/Wine/Hard liquor - Indicator",
    "Beer/Wine/Hard liquor - No. of Year": "Beer/Wine/Hard liquor - Indicator",
  },
};

/**
 * Maps the field label used in `medical.config.ts` to the key in the section's
 * schema, keyed by `MedicalSection.key`. Config fields without an entry here are
 * not validated.
 */
export const MEDICAL_SECTION_FIELD_KEYS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  mer: {
    "Application No.": "applicationNo",
    "First Name": "firstName",
    "Last Name": "lastName",
    "Is MER name same as proposal name?": "isMerNameSameAsProposalName",
    "Place of Examination": "placeOfExamination",
    Gender: "gender",
    "Name of ME": "nameOfMe",
    "ME Code": "meCode",
    "Is Identity Proof and Application Photo Match":
      "isIdentityProofAndApplicationPhotoMatch",
    "Examinee DOB": "examineeDob",
    "Examinee Education SD": "examineeEducationSd",
    "Examinee Occupation SD": "examineeOccupationSd",
    "Examinee Income SD": "examineeIncomeSd",
    "Examinee Photo ID Proof": "examineePhotoIdProof",
    "Examinee Contact No": "examineeContactNo",
    "Face match Score": "faceMatchScore",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Diagnostic Centre Address": "diagnosticCentreAddress",
    "Diagnostic Centre Pincode": "diagnosticCentrePincode",
    "Date of Examination": "dateOfExamination",
    "Any previous life Insurance policy decline/Postpone/issued on revised term SD":
      "previousPolicyDeclinedPostponedOrRevisedTermSd",
  },
  habit_and_addictions: {
    "Cigarettes/beedis/cigar - Indicator": "cigarettes",
    "Cigarettes/beedis/cigar - Quantity": "cigarettesQuant",
    "Cigarettes/beedis/cigar - No. of Year": "cigarettesYear",
    "Gutka / snuff / paan etc. - Indicator": "gutka",
    "Gutka / snuff / paan etc. - Quantity": "gutkaQuant",
    "Gutka / snuff / paan etc. - No. of Year": "gutkaYear",
    "Narcotic Consumption - Indicator": "narcotic",
    "Narcotic Consumption - Quantity": "narcoticQuant",
    "Narcotic Consumption - No. of Year": "narcoticYear",
    "Beer/Wine/Hard liquor - Indicator": "alcohol",
    "Beer/Wine/Hard liquor - Quantity": "alcoholQuant",
    "Beer/Wine/Hard liquor - No. of Year": "alcoholYear",
  },
  tele_habit_addiction: {
    "Cigarette/beedis/cigar - Indicator": "cigarettes",
    "Cigarette/beedis/cigar - Quantity": "cigarettesQuant",
    "Cigarette/beedis/cigar - No. of Year": "cigarettesYear",
    "Gutka/Snuff/Paan etc. - Indicator": "gutka",
    "Gutka/Snuff/Paan etc. - Quantity": "gutkaQuant",
    "Gutka/Snuff/Paan etc. - No. of Year": "gutkaYear",
    "Narrotic Consumption - Indicator": "narcotic",
    "Narrotic Consumption - Quantity": "narcoticQuant",
    "Narrotic Consumption - No. of Year": "narcoticYear",
    "Beer/Wine/Hard liquor - Indicator": "alcohol",
    "Beer/Wine/Hard liquor - Quantity": "alcoholQuant",
    "Beer/Wine/Hard liquor - No. of Year": "alcoholYear",
  },
  "2decho": {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Ejection Fraction": "ejectionFraction",
    "Ejection Result": "ejectionResult",
    "Rejection Abnormality": "rejectionAbnormality",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remarks: "remarks",
  },
  dobutamine_stress_echocardiogram: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Ejection Fraction": "ejectionFraction",
    "Ejection Result": "ejectionResult",
    "Rejection Abnormality": "rejectionAbnormality",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remark: "remark",
  },
  exercise_stress_echocardiogram: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Ejection Fraction": "ejectionFraction",
    "Ejection Result": "ejectionResult",
    "Rejection Abnormality": "rejectionAbnormality",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remark: "remark",
  },
  ecg: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    Axis: "axis",
    "Heart Rate": "heartRate",
    "Heart Rate Finding": "heartRateFinding",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remark: "remark",
  },
  blood_urea_and_nitro: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    Result: "result",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remark: "remark",
  },
  cxr: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remark: "remark",
  },
  mammogram: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remark: "remark",
  },
  usg: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remarks: "remark",
  },
  fundoscopy_test: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remarks: "remark",
  },
  stool_test: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remarks: "remark",
  },
  pap_smear: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remarks: "remark",
  },
  tmt: {
    "Medical Type": "medicalType",
    "Test Date": "testDate",
    Findings: "findings",
    METS: "mets",
    "Heart Rate Finding": "heartRateFinding",
    "Heart Rate Result": "heartRateResult",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Remarks: "remark",
  },
  lipids: MEDICAL_CBC_FIELD_KEYS,
  ogtt_group: MEDICAL_CBC_FIELD_KEYS,
  lft: MEDICAL_CBC_FIELD_KEYS,
  cbc_group: MEDICAL_CBC_FIELD_KEYS,
  rua_group: MEDICAL_CBC_FIELD_KEYS,
  sma12_group: MEDICAL_CBC_FIELD_KEYS,
  s13_group: MEDICAL_CBC_FIELD_KEYS,
  tft_group: MEDICAL_CBC_FIELD_KEYS,
  blood_sugar_random: MEDICAL_LAB_RESULT_FIELD_KEYS,
  hbsag: MEDICAL_LAB_RESULT_FIELD_KEYS,
  hiv_elisa: MEDICAL_LAB_RESULT_FIELD_KEYS,
  cot: MEDICAL_LAB_RESULT_FIELD_KEYS,
  ghb: MEDICAL_LAB_RESULT_FIELD_KEYS,
  hba1c: MEDICAL_LAB_RESULT_FIELD_KEYS,
  ppbs: MEDICAL_LAB_RESULT_FIELD_KEYS,
  serum_cotinine: MEDICAL_LAB_RESULT_FIELD_KEYS,
  fbs: MEDICAL_LAB_RESULT_FIELD_KEYS,
  hiv_western_blot: MEDICAL_LAB_RESULT_FIELD_KEYS,
  hcv: MEDICAL_LAB_RESULT_FIELD_KEYS,
  microalbuminuria: MEDICAL_TEST_DATE_LAB_FIELD_KEYS,
  psa: MEDICAL_TEST_DATE_LAB_FIELD_KEYS,
  pft: {
    "Medical Type": "medicalType",
    Date: "date",
    "Examinee Name": "examineeName",
    "Examinee Age": "examineeAge",
    "Diagnostic Centre Name": "diagnosticCentreName",
    "Doctor Name": "doctorName",
    "Doctor Registration No": "doctorRegistrationNo",
    Inspiration: "inspiration",
    Expiration: "expiration",
    FEV1: "fev1",
    FVC: "fvc",
    "FEV1/FVC": "fev1Fvc",
    RV: "rv",
    VC: "vc",
  },
  tele_measurements: {
    "Height (cms)": "heightCms",
    "Height (ft)": "heightFt",
    Inches: "inches",
    "Weight (kgs)": "weightKgs",
    BMI: "bmi",
  },
  tele_mer: {
    "Application No.": "applicationNo",
    "First Name": "firstName",
    "Last Name": "lastName",
    Gender: "gender",
    "Date of Birth": "dateOfBirth",
    "Telephonic MER": "telephonicMer",
    "Time of Tele call": "timeOfTeleCall",
    Education: "education",
    Occupation: "occupation",
    Disclosure: "disclosure",
    Adversity: "adversity",
    "Annual Income": "annualIncome",
    "Examiner Name": "examinerName",
    "Registration ID": "registrationId",
    "MER Detail": "merDetail",
    "Previous Insurance Declined": "previousInsuranceDeclined",
    "Medical Treatment": "medicalTreatment",
    "Address Including City and State": "address",
    "Tele Findings": "teleFindings",
    "Tele MER Final Remark": "teleMerFinalRemark",
    "Tele Type": "teleType",
  },
  blood_pressure_and_pulse: {
    "Avg Systolic": "avgSystolic",
    "Avg Diastolic": "avgDiastolic",
    "Pulse Rate": "pulseRate",
  },
  measurement: {
    "Height (cms)": "heightCms",
    "Height (Fts)": "heightFts",
    Inches: "inches",
    "Weight (Kgs)": "weightKgs",
    "Waist (cms)": "waistCms",
    "Hips (cms)": "hipsCms",
    BMI: "bmi",
  },
};

/** Sections whose only master dropdown is Medical Type. */
const MEDICAL_TYPE_ONLY_SECTIONS = [
  "blood_urea_and_nitro",
  "pft",
  "hbsag",
  "hiv_elisa",
  "cot",
  "ghb",
  "hba1c",
  "lipids",
  "ogtt_group",
  "lft",
  "cbc_group",
  "blood_sugar_random",
  "tft_group",
  "s13_group",
  "sma12_group",
  "rua_group",
  "ppbs",
  "serum_cotinine",
  "fbs",
  "hiv_western_blot",
  "hcv",
  "microalbuminuria",
  "psa",
] as const;

/** Sections whose Findings is the `SM_FINDINGS` list (Normal / Abnormal). */
const SM_FINDINGS_SECTIONS = [
  "cxr",
  "mammogram",
  "pap_smear",
  "usg",
  "fundoscopy_test",
  "stool_test",
] as const;

/** Sections with Findings (`FINDINGS`) and Rejection Abnormality (`SM_FINDINGS`). */
const STRESS_ECHO_SECTIONS = ["2decho", "dobutamine_stress_echocardiogram", "exercise_stress_echocardiogram"] as const;

/**
 * Dropdowns read from the post-login `misc` master: section key -> config label -> `misc` row type.
 * Resolved when used (see `getMedicalSectionFieldOptions`), because the master loads after login.
 */
export const MEDICAL_SECTION_MASTER_FIELD_OPTIONS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  ...Object.fromEntries(MEDICAL_TYPE_ONLY_SECTIONS.map((key) => [key, { "Medical Type": "MEDICAL_TYPE" }])),
  ...Object.fromEntries(
    STRESS_ECHO_SECTIONS.map((key) => [
      key,
      { "Medical Type": "MEDICAL_TYPE", Findings: "FINDINGS", "Rejection Abnormality": "SM_FINDINGS" },
    ]),
  ),
  ...Object.fromEntries(
    SM_FINDINGS_SECTIONS.map((key) => [key, { "Medical Type": "MEDICAL_TYPE", Findings: "SM_FINDINGS" }]),
  ),
  ecg: { "Medical Type": "MEDICAL_TYPE", Findings: "FINDINGS", Axis: "AXIS" },
  tmt: { "Medical Type": "MEDICAL_TYPE", Findings: "FINDINGS", METS: "METS" },
};

/** `misc` row type of the Value dropdown of the Other Medical sections that have one. */
const MEDICAL_VALUE_TYPES: Readonly<Record<string, string>> = {
  cot: "VALUE",
  hbsag: "VALUE",
  hiv_elisa: "VALUE",
  hiv_western_blot: "VALUE",
  hcv: "VALUE",
  serum_cotinine: "KETONE_BODIES",
};

/**
 * Dropdown options of a section field, read from the post-login `misc` master (empty while it is not
 * loaded). `undefined` when the field is not a master dropdown.
 */
export const getMedicalSectionFieldOptions = (
  sectionKey: string,
  label: string,
): { label: string; value: string }[] | undefined => {
  const type =
    MEDICAL_SECTION_MASTER_FIELD_OPTIONS[sectionKey]?.[label] ??
    (label === "Value" ? MEDICAL_VALUE_TYPES[sectionKey] : undefined);
  return type === undefined ? undefined : getMedicalMasterEntries("misc", type);
};

export interface MedicalFieldValidator {
  /** Dropdown options from the schema, when this section defines its own list. */
  options?: readonly { label: string; value: string }[];
  /**
   * Config label of the field this one depends on, if any. Pass that field's
   * current value as `dependencyValue` to `isRequired` / `validate`.
   */
  dependsOn?: string;
  /** True when the schema rejects an empty value. */
  isRequired: (dependencyValue?: string) => boolean;
  /** First error message for `value`, or `undefined` when valid. */
  validate: (value: string, dependencyValue?: string) => string | undefined;
}

/** BP readings: Systolic 1 / Diastolic 1 are required, every further reading is optional. */
const getMedicalBpReadingValidator = (
  label: string,
): MedicalFieldValidator | undefined => {
  const match = MEDICAL_BP_READING_LABEL.exec(label);
  if (!match) return undefined;
  const fieldSchema =
    match[2] === "1" ? mandatoryNumeric(label) : optionalNumeric(label);
  return {
    isRequired: () => !fieldSchema.safeParse("").success,
    validate: (value) => {
      const result = fieldSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  };
};

/**
 * Field-level validator for a config field, or `undefined` when the section or
 * field has no schema.
 */
export const getMedicalFieldValidator = (
  sectionKey: string,
  label: string,
): MedicalFieldValidator | undefined => {
  if (sectionKey === "blood_pressure_and_pulse") {
    const readingValidator = getMedicalBpReadingValidator(label);
    if (readingValidator) return readingValidator;
  }
  const fieldKeys = MEDICAL_SECTION_FIELD_KEYS[sectionKey];
  const fieldKey = fieldKeys?.[label];
  const createSchema = MEDICAL_SECTION_SCHEMAS[sectionKey];
  if (!fieldKeys || !fieldKey || !createSchema) return undefined;

  const dependsOn = MEDICAL_SECTION_FIELD_DEPENDENCIES[sectionKey]?.[label];
  const dependencyKey = dependsOn ? fieldKeys[dependsOn] : undefined;
  const fieldSchema = (dependencyValue?: string) =>
    createSchema(
      dependencyKey && dependencyValue !== undefined
        ? { [dependencyKey]: dependencyValue }
        : {},
    ).shape[fieldKey];

  return {
    dependsOn,
    options: getMedicalSectionFieldOptions(sectionKey, label),
    isRequired: (dependencyValue) =>
      !fieldSchema(dependencyValue)?.safeParse("").success,
    validate: (value, dependencyValue) => {
      const result = fieldSchema(dependencyValue)?.safeParse(value);
      return !result || result.success
        ? undefined
        : result.error.issues[0]?.message;
    },
  };
};

/** Validator for one column of a family history row. */
export const getMedicalFamilyRowValidator = (
  column: MedicalFamilyHistoryColumn,
): MedicalFieldValidator => {
  const fieldSchema = medicalFamilyHistoryRowSchema.shape[column];
  return {
    isRequired: () => !fieldSchema.safeParse("").success,
    validate: (value) => {
      const result = fieldSchema.safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  };
};

/* ------------------------------------------------------------------ */
/* Parameter tables (Parameter / Value / Lab Range / Unit)            */
/* ------------------------------------------------------------------ */

/** Editable columns of a parameter row that carry validation. */
export type MedicalParameterColumn = "value" | "from" | "to";
export const MEDICAL_PARAMETER_COLUMNS: readonly MedicalParameterColumn[] = [
  "value",
  "from",
  "to",
];

interface MedicalParameterRules {
  /** Parameters whose Value is always mandatory. */
  mandatory: readonly string[];
  /** Pairs where at least one of the two Values must be entered. */
  eitherOf: readonly (readonly [string, string])[];
  /** Parameters whose Value is a `misc` master dropdown (else numeric): parameter -> `misc` row type. */
  dropdowns?: Readonly<Record<string, string>>;
}

/** SMA12 Group and S13 Group share the same parameters and rules. */
const MEDICAL_SMA12_PARAMETER_RULES: MedicalParameterRules = {
  // Serum Calcium, Serum Uric Acid and VLDL are not listed, so they stay optional.
  mandatory: [
    "SGPT/ALT",
    "SGOT/AST",
    "GGT",
    "Serum Bilirubin-Total",
    "Direct",
    "Indirect=(Total-Direct)",
    "Serum Protein-Total",
    "Albumin",
    "Globulin=(Total-Albumin)",
    "Albumin/Globulin_Ratio",
    "Alkaline Phosphate",
    "Serum Creatinine",
    "Total Cholesterol: TC",
    "Triglycerides: TG",
    "HDL",
    "LDL",
    "TC/HDL Ratio",
  ],
  // Either FBS or RBS — any one is mandatory.
  eitherOf: [["RBS", "FBS"]],
};

const MEDICAL_SECTION_PARAMETER_RULES: Readonly<
  Record<string, MedicalParameterRules>
> = {
  lipids: {
    // VLDL is not listed, so it stays optional (still numeric).
    mandatory: [
      "Total Cholesterol: TC",
      "Triglycerides: TG",
      "HDL",
      "LDL",
      "TC/HDL Ratio",
    ],
    eitherOf: [],
  },
  ogtt_group: {
    mandatory: ["OGTT1", "OGTT2", "OGTT3"],
    eitherOf: [],
  },
  lft: {
    mandatory: [
      "SGPT/ALT",
      "SGOT/AST",
      "GGT",
      "Serum Bilirubin-Total",
      "Direct",
      "Indirect",
      "Serum Protein- Total",
      "Albumin",
      "Globulin=(Total-Albumin)",
      "Alkaline Phosphate",
      "Albumin/Globulin_Ratio",
    ],
    eitherOf: [],
  },
  cbc_group: {
    mandatory: [
      "Hemoglobin(Hb)",
      "RBC",
      "WBC",
      "Platelets",
      "PCV",
      "MCV",
      "Esr",
    ],
    // Differential or Absolute count — any one of each pair is mandatory.
    eitherOf: [
      ["Differential_Neutrophil", "Absolute_Neutrophil"],
      ["Differential_Lymphocyte", "Absolute_Lymphocyte"],
      ["Differential_Eosinophil", "Absolute_Eosinophil"],
      ["Differential_Monocyte", "Absolute_Monocyte"],
      ["Differential_Basophil", "Absolute_Basophil"],
    ],
  },
  tft_group: {
    mandatory: [
      "Triiodothyronine-T3",
      "Thyroxin-T4",
      "Thyroid Stimulating - Tsh Harmones",
    ],
    eitherOf: [],
  },
  sma12_group: MEDICAL_SMA12_PARAMETER_RULES,
  s13_group: MEDICAL_SMA12_PARAMETER_RULES,
  rua_group: {
    mandatory: [
      "Sugar/Glycosuria",
      "Albumin/Proteinuria",
      "RBC/Haematuria",
      "WBC/PUS/Pyuria",
      "Epithelial Cells",
      "Gravity",
      "Ketone Bodies",
    ],
    eitherOf: [],
    // Parameters not listed here take a numeric Value.
    dropdowns: {
      "Sugar/Glycosuria": "SUGAR_GLYCOSURIA",
      "Albumin/Proteinuria": "ALBUMIN_PROTEINURIA",
      "RBC/Haematuria": "RBC_HAEMATURIA",
      "Ketone Bodies": "KETONE_BODIES",
      Urine_Colour: "URINE_COLOUR",
      Urine_Appearance: "URINE_APPEARANCE",
      Urine_Blood: "VALUE",
      Urine_Nitrite: "VALUE",
      Urine_Bile_Salts: "VALUE",
      Urine_Bile_Pigment: "VALUE",
      Urine_Bilirubin: "VALUE",
      Urine_Urobilinogen: "KETONE_BODIES",
      Urine_Bacteria: "KETONE_BODIES",
      Urine_Casts: "KETONE_BODIES",
      Urine_Crystal: "KETONE_BODIES",
      Urine_Deposit: "KETONE_BODIES",
    },
  },
};

const findParameterPartner = (
  rules: MedicalParameterRules,
  name: string,
): string | undefined => {
  for (const [first, second] of rules.eitherOf) {
    if (first === name) return second;
    if (second === name) return first;
  }
  return undefined;
};

/**
 * Validator for one column of a parameter-table row, or `undefined` when the
 * section has no parameter rules. For a paired parameter, `dependsOn` is the
 * partner's name and the partner's Value is passed as `dependencyValue`.
 * For a dropdown parameter, `options` carries the allowed Values.
 */
export const getMedicalParameterValidator = (
  sectionKey: string,
  name: string,
  column: MedicalParameterColumn,
): MedicalFieldValidator | undefined => {
  const rules = MEDICAL_SECTION_PARAMETER_RULES[sectionKey];
  if (!rules) return undefined;
  const dropdownSource = rules.dropdowns?.[name];

  if (column !== "value") {
    const rangeSchema = optionalNumeric(`${name} lab range`);
    return {
      isRequired: () => false,
      validate: (value) => {
        const result = rangeSchema.safeParse(value);
        return result.success ? undefined : result.error.issues[0]?.message;
      },
    };
  }

  const partner = findParameterPartner(rules, name);
  const valueSchema = (partnerValue?: string) => {
    if (dropdownSource) {
      return masterDropdown(name, "misc", rules.mandatory.includes(name), dropdownSource);
    }
    if (rules.mandatory.includes(name)) return mandatoryNumeric(name);
    if (partner && (partnerValue ?? "").trim() === "") {
      return mandatoryText(`${name} or ${partner}`)
        .regex(RegexPatterns.numeric, `${name} must be numeric`);
    }
    return optionalNumeric(name);
  };

  return {
    dependsOn: partner,
    options: dropdownSource ? getMedicalMasterEntries("misc", dropdownSource) : undefined,
    isRequired: (partnerValue) => !valueSchema(partnerValue).safeParse("").success,
    validate: (value, partnerValue) => {
      const result = valueSchema(partnerValue).safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  };
};