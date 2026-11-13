/**
 * Configuration for the View Medical section (DVT / Group).
 * Structure, field definitions, dropdown options, and validation rules mirror
 * the "View Medical" module of design-reference/ui-prototypes/Group/DVT Informal/dvt-drs.html.
 */
import {
  MEDICAL_SCHEMA_EDUCATION,
  MEDICAL_SCHEMA_GENDER,
  MEDICAL_SCHEMA_OCCUPATION,
} from "./medical.schema";

/** [label, value, required?] */
export type MedicalFieldDef = readonly [
  label: string,
  value: string,
  required?: boolean,
];

export interface MedicalCmoDecision {
  userName: string;
  poolName: string;
  decision: string;
  remarks: string;
  updatedOn: string;
}

export interface MedicalFamilyRow {
  relation: string;
  age?: string;
  alive?: string;
  health?: string;
}

/**
 * [parameter, unit, required?, options?]
 * When `options` is given the Value is a dropdown of those options, otherwise a number input.
 */
export type MedicalParameterDef = readonly [
  name: string,
  unit: string,
  required?: boolean,
  options?: readonly MedicalOption[],
];

export interface MedicalSection {
  key: string;
  groupKey: string;
  title: string;
  /**
   * Test-parameter table shown below the field grid. Each row has a Value, a
   * Normal Range (from - to) and a computed Findings (Normal / Abnormal).
   */
  parameters?: readonly MedicalParameterDef[];
  /** Heading shown above the `parameters` table. */
  parametersTitle?: string;
  /**
   * Renders a dedicated body instead of the default field grid.
   * `habitAddiction` expects `fields` in groups of three per habit: Indicator, Quantity, No. of Year.
   */
  layout?: "familyHistory" | "habitAddiction";
  /**
   * Labels of `fields` shown together as a one-row table below the field grid
   * (e.g. lab Value / Range / Unit / Findings), using the labels as column headers.
   */
  tableFieldLabels?: readonly string[];
  /** Labels of `tableFieldLabels` shown as plain text instead of a (read-only) input box. */
  plainTextTableFieldLabels?: readonly string[];
  /** Starter rows for a `familyHistory` layout (defaults to Father, Mother and one blank row). */
  familyRows?: readonly MedicalFamilyRow[];
  /** Read-only "CMO decision" table rendered above the section's fields. */
  cmoDecisions?: readonly MedicalCmoDecision[];
  /** Always editable: no Edit / Reset toggle, only a Save button. */
  alwaysEditable?: boolean;
  /** Placeholder shown by the section's dropdown fields (default "Select"). */
  selectPlaceholder?: string;
  /** Number of columns for the field grid (default 3). */
  cols: number;
  fields: readonly MedicalFieldDef[];
}

export interface MedicalGroup {
  key: string;
  name: string;
  sections: readonly MedicalSection[];
}

export type MedicalControlKind =
  | "text"
  | "number"
  | "yesNo"
  | "gender"
  | "placeOfExamination"
  | "education"
  | "occupation"
  | "deadOrAlive"
  | "familyRelation"
  | "build"
  | "decision"
  | "findings"
  | "medicalType"
  | "mets"
  | "negativePositive"
  | "date";

export interface MedicalOption {
  label: string;
  value: string;
}

export interface MedicalApplicantTab {
  key: string;
  label: string;
}

/** One past record of a section: `values` use the same ids as `MedicalSubmitPayload.values`. */
export interface MedicalHistoryEntry {
  id: string;
  label: string;
  values: Readonly<Record<string, string>>;
}

export type MedicalSubmitPayload = {
  applicantKey: string;
  values: Readonly<Record<string, string>>;
  reviews: Readonly<Record<string, "agree" | "disagree">>;
};

export const MEDICAL_YES_NO_OPTIONS: MedicalOption[] = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const toMedicalOptions = (values: readonly string[]): MedicalOption[] =>
  values.map((value) => ({ label: value, value }));

export const MEDICAL_GENDER_OPTIONS: MedicalOption[] =
  toMedicalOptions(MEDICAL_SCHEMA_GENDER);

export const MEDICAL_PLACE_OF_EXAMINATION_OPTIONS: MedicalOption[] = [
  { label: "Clinic", value: "Clinic" },
  { label: "Res/Office", value: "Res/Office" },
];

export const MEDICAL_EDUCATION_OPTIONS: MedicalOption[] =
  toMedicalOptions(MEDICAL_SCHEMA_EDUCATION);

export const MEDICAL_OCCUPATION_OPTIONS: MedicalOption[] =
  toMedicalOptions(MEDICAL_SCHEMA_OCCUPATION);

export const MEDICAL_DEAD_OR_ALIVE_OPTIONS: MedicalOption[] = [
  { label: "Alive", value: "Alive" },
  { label: "Dead", value: "Dead" },
];

export const MEDICAL_FAMILY_RELATION_OPTIONS: MedicalOption[] = [
  // { label: "Father", value: "Father" },
  // { label: "Mother", value: "Mother" },
  { label: "Brother", value: "Brother" },
  { label: "Sister", value: "Sister" },
  { label: "Spouse", value: "Spouse" },
  // { label: "Son", value: "Son" },
  // { label: "Daughter", value: "Daughter" },
  // { label: "Grandfather", value: "Grandfather" },
  // { label: "Grandmother", value: "Grandmother" },
  // { label: "Other", value: "Other" },  
];

export const MEDICAL_BUILD_OPTIONS: MedicalOption[] = [
  { label: "Normal", value: "Normal" },
  { label: "Thin", value: "Thin" },
  { label: "Muscular", value: "Muscular" },
  { label: "Obese", value: "Obese" },
  { label: "Stocky", value: "Stocky" },
];

export const MEDICAL_DECISION_OPTIONS: MedicalOption[] = [
  { label: "Standard", value: "Standard" },
  { label: "Non-Standard", value: "Non-Standard" },
];

export const MEDICAL_FINDINGS_OPTIONS: MedicalOption[] = [
  { label: "Normal", value: "Normal" },
  { label: "Abnormal", value: "Abnormal" },
  { label: "Borderline", value: "Borderline" },
];

export const MEDICAL_NEGATIVE_POSITIVE_OPTIONS: MedicalOption[] = [
  { label: "Negative", value: "Negative" },
  { label: "Positive", value: "Positive" },
];

export const MEDICAL_METS_OPTIONS: MedicalOption[] = [
  { label: "Good (\u2265 10 METS)", value: "Good (\u2265 10 METS)" },
];

export const MEDICAL_TYPE_OPTIONS: MedicalOption[] = [
  { label: "Diagnostic", value: "Diagnostic" },
  { label: "Pathology", value: "Pathology" },
  { label: "Radiology", value: "Radiology" },
  { label: "Special", value: "Special" },
];

/* ------------------------------------------------------------------ */
/* 1. OVERVIEW                                                        */
/* ------------------------------------------------------------------ */

export const MEDICAL_APPLICATION_FORM_LIFESTYLE_FIELDS: readonly MedicalFieldDef[] = [
  ["Height", "", false],
  ["Weight", "", false],
  ["BMI", "", false],
  ["Family History As Per Application Form ?", "", false],
  ["Smoking", "", false],
  ["Diving", "", false],
  ["Tobacco", "", false],
  ["Alcohol", "", false],
  ["Narcotics", "", false],
  ["Adverse", "", false],
  ["Hazardous Occupation", "", false],
  ["Illness Impairment", "", false],
];

export const MEDICAL_APPLICATION_FORM_LIFESTYLE_SECTION: MedicalSection = {
  key: "application_form_medical_lifestyle",
  groupKey: "overview",
  title: "Application Form Medical & Lifestyle Details",
  cols: 3,
  fields: MEDICAL_APPLICATION_FORM_LIFESTYLE_FIELDS,
};

/* ------------------------------------------------------------------ */
/* 2. MER GROUP SECTIONS                                              */
/* ------------------------------------------------------------------ */

export const MEDICAL_MER_FIELDS: readonly MedicalFieldDef[] = [
  ["Application No.", "", false],
  ["First Name", "", true],
  ["Last Name", "", false],
  ["Is MER name same as proposal name?", "", true],
  ["Place of Examination", "", true],
  ["Gender", "", true],
  ["Name of ME", "", true],
  ["ME Code", "", true],
  ["Is Identity Proof and Application Photo Match", "", false],
  ["Examinee DOB", "", true],
  ["Examination Time", "", false],
  ["Examinee Education SD", "", false],
  ["Examinee Occupation SD", "", false],
  ["Examinee Income SD", "", false],
  ["Examinee Photo ID Proof", "", true],
  ["Examinee Contact No", "", false],
  ["Face match Score", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Diagnostic Centre Address", "", false],
  ["Diagnostic Centre Pincode", "", false],
  ["Date of Examination", "", true],
  [
    "Any previous life Insurance policy decline/Postpone/issued on revised term SD",
    "",
    false,
  ],
];

export const MEDICAL_MER_SECTION: MedicalSection = {
  key: "mer",
  groupKey: "mer",
  title: "MER",
  cols: 3,
  selectPlaceholder: "--Select--",
  fields: MEDICAL_MER_FIELDS,
};

export const MEDICAL_HABIT_ADDICTIONS_FIELDS: readonly MedicalFieldDef[] = [
  ["Cigarettes/beedis/cigar", "", true],
  ["Cigarettes/beedis/cigar Quant", "", false],
  ["Cigarettes/beedis/cigar Year", "", false],
  ["Gutka / snuff / paan etc.", "", true],
  ["Gutka / snuff / paan etc. Quant", "", false],
  ["Gutka / snuff / paan etc. Year", "", false],
  ["Narcotic Consumption", "", true],
  ["Narcotic Consumption Quant", "", false],
  ["Narcotic Consumption Year", "", false],
  ["Beer/Wine/Hard liquor", "", true],
  ["Beer/Wine/Hard liquor Quant", "", false],
  ["Beer/Wine/Hard liquor Year", "", false],
];

export const MEDICAL_HABIT_ADDICTIONS_SECTION: MedicalSection = {
  key: "habit_addictions",
  groupKey: "mer",
  title: "Habit and Addictions",
  cols: 3,
  selectPlaceholder: "--Select--",
  fields: MEDICAL_HABIT_ADDICTIONS_FIELDS,
};

export const MEDICAL_MEASUREMENT_FIELDS: readonly MedicalFieldDef[] = [
  ["Height (cms)", "", true],
  ["Height (Fts)", "", false],
  ["Inches", "", false],
  ["Weight (Kgs)", "", true],
  ["Waist (cms)", "", true],
  ["Hips (cms)", "", true],
  ["BMI", "", false],
];

export const MEDICAL_MEASUREMENT_SECTION: MedicalSection = {
  key: "measurement",
  groupKey: "mer",
  title: "Measurement",
  cols: 3,
  fields: MEDICAL_MEASUREMENT_FIELDS,
};

/** Family members are added as table rows at runtime, so the section has no fixed fields. */
export const MEDICAL_FAMILY_HISTORY_SECTION: MedicalSection = {
  key: "family_history_health_status",
  groupKey: "mer",
  title: "Family history and health status",
  layout: "familyHistory",
  cols: 4,
  fields: [],
};

export const MEDICAL_BP_PULSE_FIELDS: readonly MedicalFieldDef[] = [
  // 5-column grid: row 1 = Systolic 1-4 + Avg, row 2 = Diastolic 1-4 + Avg, row 3 = Pulse Rate.
  ["Systolic 1", "", true],
  ["Systolic 2", "", false],
  ["Systolic 3", "", false],
  ["Systolic 4", "", false],
  ["Avg Systolic", "", false],
  ["Diastolic 1", "", true],
  ["Diastolic 2", "", false],
  ["Diastolic 3", "", false],
  ["Diastolic 4", "", false],
  ["Avg Diastolic", "", false],
  ["Pulse Rate", "", true],
];

export const MEDICAL_BP_PULSE_SECTION: MedicalSection = {
  key: "blood_pressure_pulse_details",
  groupKey: "mer",
  title: "Blood pressure and Pulse details",
  cols: 5,
  fields: MEDICAL_BP_PULSE_FIELDS,
};

export const MEDICAL_QUESTION_TABLE_FIELDS: readonly MedicalFieldDef[] = [
  ["Are you the examinees medical attendant?", "", true],
  ["Is there any abnormality in general appearance?", "", true],
  ["Describe Build", "", true],
  ["Has there been any significant weight gain or weight loss?", "", true],
  ["Has been hospitalized for accident/Medical treatment/Surgery?", "", true],
  ["Any history of Cardiovascular disease / Hypertension / Diabetes?", "", true],
  ["Any Respiratory / Asthma / TB / Lungs disorder?", "", true],
  ["Any Gastrointestinal / Liver / Kidney disorder?", "", true],
  ["Any Neurological / Psychiatric disorder / Epilepsy?", "", true],
];

export const MEDICAL_QUESTION_TABLE_SECTION: MedicalSection = {
  key: "question_table",
  groupKey: "mer",
  title: "Question Table",
  cols: 3,
  fields: MEDICAL_QUESTION_TABLE_FIELDS,
};

/* ------------------------------------------------------------------ */
/* 3. TELE-VIDEO MER GROUP SECTIONS                                   */
/* ------------------------------------------------------------------ */

export const MEDICAL_TELE_MER_FIELDS: readonly MedicalFieldDef[] = [
  ["Application No.", ""],
  ["First Name", ""],
  ["Last Name", ""],
  ["Gender", ""],
  ["Date of Birth", ""],
  ["Telephonic MER", ""],
  ["Time of Tele call", ""],
  ["Education", ""],
  ["Occupation", ""],
  ["Disclosure", ""],
  ["Adversity", ""],
  ["Annual Income", ""],
  ["Examiner Name", ""],
  ["Registration ID", ""],
  ["MER Detail", ""],
  ["Previous Insurance Declined", ""],
  ["Medical Treatment", ""],
  ["Address Including City and State", ""],
  ["Tele Findings", ""],
  ["Tele MER Final Remark", ""],
  ["Tele Type", ""],
];

export const MEDICAL_TELE_MER_SECTION: MedicalSection = {
  key: "tele_mer",
  groupKey: "tele_video_mer",
  title: "Tele/Video MER",
  cols: 3,
  selectPlaceholder: "--Select--",
  fields: MEDICAL_TELE_MER_FIELDS,
};

export const MEDICAL_TELE_MEASUREMENT_FIELDS: readonly MedicalFieldDef[] = [
  ["Height (cms)", ""],
  ["Height (ft)", ""],
  ["Inches", ""],
  ["Weight (kgs)", ""],
  ["BMI", ""],
];

export const MEDICAL_TELE_MEASUREMENT_SECTION: MedicalSection = {
  key: "tele_measurements",
  groupKey: "tele_video_mer",
  title: "Measurements",
  cols: 3,
  fields: MEDICAL_TELE_MEASUREMENT_FIELDS,
};

/** Control kinds for the Tele/Video MER section; labels here must not fall through to the generic label rules. */
const MEDICAL_TELE_MER_CONTROL_KINDS: Readonly<Record<string, MedicalControlKind>> = {
  Gender: "gender",
  "Date of Birth": "date",
  "Telephonic MER": "yesNo",
  Education: "education",
  Occupation: "occupation",
  "Annual Income": "number",
  "Previous Insurance Declined": "yesNo",
  "Medical Treatment": "yesNo",
};

export const MEDICAL_TELE_FAMILY_HISTORY_SECTION: MedicalSection = {
  key: "tele_family_history",
  groupKey: "tele_video_mer",
  title: "Family History",
  layout: "familyHistory",
  cols: 4,
  fields: [],
};

export const MEDICAL_TELE_HABIT_ADDICTION_FIELDS: readonly MedicalFieldDef[] = [
  ["Cigarette/beedis/cigar - Indicator", ""],
  ["Cigarette/beedis/cigar - Quantity", ""],
  ["Cigarette/beedis/cigar - No. of Year", ""],
  ["Gutka/Snuff/Paan etc. - Indicator", ""],
  ["Gutka/Snuff/Paan etc. - Quantity", ""],
  ["Gutka/Snuff/Paan etc. - No. of Year", ""],
  ["Narrotic Consumption - Indicator", ""],
  ["Narrotic Consumption - Quantity", ""],
  ["Narrotic Consumption - No. of Year", ""],
  ["Beer/Wine/Hard liquor - Indicator", ""],
  ["Beer/Wine/Hard liquor - Quantity", ""],
  ["Beer/Wine/Hard liquor - No. of Year", ""],
];

export const MEDICAL_TELE_HABIT_ADDICTION_SECTION: MedicalSection = {
  key: "tele_habit_addiction",
  groupKey: "tele_video_mer",
  title: "Habit and Addiction",
  layout: "habitAddiction",
  cols: 3,
  selectPlaceholder: "--Select--",
  fields: MEDICAL_TELE_HABIT_ADDICTION_FIELDS,
};

export const MEDICAL_TELE_QUESTION_TABLE_FIELDS: readonly MedicalFieldDef[] = [
  ["Are you the examinees medical attendant?", "", true],
  ["Is there any abnormality in general appearance?", "", true],
  ["Describe Build", "", true],
  ["Has there been any significant weight gain or loss?", "", true],
  ["Any history of serious illness or surgery?", "", true],
  ["Any chronic medical condition?", "", true],
];

export const MEDICAL_TELE_QUESTION_TABLE_SECTION: MedicalSection = {
  key: "tele_question_table",
  groupKey: "tele_video_mer",
  title: "Question Table",
  cols: 3,
  fields: MEDICAL_TELE_QUESTION_TABLE_FIELDS,
};

export const MEDICAL_TELE_DISPOSITION_FIELDS: readonly MedicalFieldDef[] = [
  ["TUW Status", ""],
  ["Remark", ""],
  ["Note", ""],
  ["Remarks2", ""],
];

export const MEDICAL_TELE_DISPOSITION_SECTION: MedicalSection = {
  key: "tele_disposition",
  groupKey: "tele_video_mer",
  title: "Disposition Details",
  cols: 3,
  fields: MEDICAL_TELE_DISPOSITION_FIELDS,
};

/* ------------------------------------------------------------------ */
/* 4. SPECIAL MEDICAL GROUP SECTIONS                                  */
/* ------------------------------------------------------------------ */

export const MEDICAL_2DECHO_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Ejection Fraction", "", true],
  ["Ejection Result", "", false],
  ["Rejection Abnormality", "", false],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remarks", "", false],
];

export const MEDICAL_2DECHO_SECTION: MedicalSection = {
  key: "2decho",
  groupKey: "special_medical",
  title: "2DECHO",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_2DECHO_FIELDS,
};

export const MEDICAL_BLOOD_UREA_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Blood Urea", "", false],
  ["BUN", "", false],
  ["Result", "", false],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remark", "", false],
];

export const MEDICAL_BLOOD_UREA_SECTION: MedicalSection = {
  key: "blood_urea_nitro",
  groupKey: "special_medical",
  title: "BLOOD UREA and NITRO",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_BLOOD_UREA_FIELDS,
};

export const MEDICAL_CXR_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remark", "", false],
];

export const MEDICAL_CXR_SECTION: MedicalSection = {
  key: "cxr",
  groupKey: "special_medical",
  title: "CXR",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_CXR_FIELDS,
};

const MEDICAL_STRESS_ECHO_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Ejection Fraction", "", true],
  ["Ejection Result", "", false],
  ["Rejection Abnormality", "", true],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remark", "", false],
];

export const MEDICAL_DOBUTAMINE_STRESS_ECHO_SECTION: MedicalSection = {
  key: "dobutamine_stress_echo",
  groupKey: "special_medical",
  title: "DOBUTAMINE STRESS ECHOCARDIOGRAM",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_STRESS_ECHO_FIELDS,
};

export const MEDICAL_EXERCISE_STRESS_ECHO_SECTION: MedicalSection = {
  key: "exercise_stress_echo",
  groupKey: "special_medical",
  title: "EXERCISE STRESS ECHOCARDIOGRAM",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_STRESS_ECHO_FIELDS,
};

export const MEDICAL_ECG_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Axis", "", false],
  ["Heart Rate", "", true],
  ["Heart Rate Finding", "", false],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remark", "", false],
];

export const MEDICAL_ECG_SECTION: MedicalSection = {
  key: "ecg",
  groupKey: "special_medical",
  title: "ECG",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  cmoDecisions: [
    {
      userName: "Dr. Arvind Shah",
      poolName: "Special Medical CMO",
      decision: "Accepted",
      remarks: "ECG reviewed with normal sinus rhythm.",
      updatedOn: "2026-09-19 07:12:30",
    },
    {
      userName: "Dr. Kavita Menon",
      poolName: "Cardiac Review Pool",
      decision: "No further requirement",
      remarks: "Heart rate and axis are acceptable.",
      updatedOn: "2026-09-21 07:12:30",
    },
  ],
  fields: MEDICAL_ECG_FIELDS,
};

export const MEDICAL_MAMMOGRAM_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remark", "", false],
];

export const MEDICAL_MAMMOGRAM_SECTION: MedicalSection = {
  key: "mammogram",
  groupKey: "special_medical",
  title: "MAMMOGRAM",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_MAMMOGRAM_FIELDS,
};

export const MEDICAL_PAP_SMEAR_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Test Date", "", true],
  ["Findings", "", true],
  ["Examinee Name", "", false],
  ["Examinee Age", "", false],
  ["Diagnostic Centre Name", "", false],
  ["Doctor Name", "", false],
  ["Doctor Registration No", "", false],
  ["Remarks", "", false],
];

export const MEDICAL_PAP_SMEAR_SECTION: MedicalSection = {
  key: "pap_smear",
  groupKey: "special_medical",
  title: "PAP SMEAR",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_PAP_SMEAR_FIELDS,
};

export const MEDICAL_PFT_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", "", true],
  ["Date", ""],
  ["Examinee Name", ""],
  ["Examinee Age", ""],
  ["Diagnostic Centre Name", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Inspiration", ""],
  ["Expiration", ""],
  ["FEV1", "", true],
  ["FVC", "", true],
  ["FEV1/FVC", "", true],
  ["RV", ""],
  ["VC", ""],
];

export const MEDICAL_PFT_SECTION: MedicalSection = {
  key: "pft",
  groupKey: "special_medical",
  title: "PFT",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_PFT_FIELDS,
};

export const MEDICAL_STOOL_TEST_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Test Date", ""],
  ["Findings", "", true],
  ["Examinee Name", ""],
  ["Examinee Age", ""],
  ["Diagnostic Centre Name", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Remarks", ""],
];

export const MEDICAL_STOOL_TEST_SECTION: MedicalSection = {
  key: "stool_test",
  groupKey: "special_medical",
  title: "STOOL TEST",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_STOOL_TEST_FIELDS,
};

export const MEDICAL_TMT_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Test Date", ""],
  ["Findings", "", true],
  ["METS", "", true],
  ["Heart Rate Finding", ""],
  ["Heart Rate Result", ""],
  ["Examinee Name", ""],
  ["Examinee Age", ""],
  ["Diagnostic Centre Name", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Remarks", ""],
];

export const MEDICAL_TMT_SECTION: MedicalSection = {
  key: "tmt",
  groupKey: "special_medical",
  title: "TMT",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  cmoDecisions: [
    {
      userName: "Dr. Rakesh Kulkarni",
      poolName: "Special Medical CMO",
      decision: "Accepted",
      remarks: "TMT is negative for inducible ischemia.",
      updatedOn: "2026-09-20 07:12:30 pm",
    },
    {
      userName: "Dr. Priya Nair",
      poolName: "Cardiac Review Pool",
      decision: "No further requirement",
      remarks: "Exercise tolerance and recovery are satisfactory.",
      updatedOn: "2026-09-22 07:12:30",
    },
  ],
  fields: MEDICAL_TMT_FIELDS,
};

export const MEDICAL_USG_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Test Date", ""],
  ["Findings", "", true],
  ["Examinee Name", ""],
  ["Examinee Age", ""],
  ["Diagnostic Centre Name", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Remarks", ""],
];

export const MEDICAL_USG_SECTION: MedicalSection = {
  key: "usg",
  groupKey: "special_medical",
  title: "USG",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_USG_FIELDS,
};

export const MEDICAL_FUNDOSCOPY_TEST_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Test Date", ""],
  ["Findings", "", true],
  ["Examinee Name", ""],
  ["Examinee Age", ""],
  ["Diagnostic Centre Name", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Remarks", ""],
];

export const MEDICAL_FUNDOSCOPY_TEST_SECTION: MedicalSection = {
  key: "fundoscopy_test",
  groupKey: "special_medical",
  title: "Fundoscopy Test",
  cols: 3,
  selectPlaceholder: "---SELECT---",
  fields: MEDICAL_FUNDOSCOPY_TEST_FIELDS,
};

/* ------------------------------------------------------------------ */
/* 5. OTHER MEDICAL GROUP SECTIONS                                    */
/* ------------------------------------------------------------------ */

export const MEDICAL_BLOOD_SUGAR_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Date", ""],
  ["Examinee Name", "", true],
  ["Examinee Age", ""],
  ["Examinee Gender", ""],
  ["Diagnostic Centre Name", ""],
  ["Diagnostic Centre Address", ""],
  ["Diagnostic Centre Pincode", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Value", "", true],
  ["Lab Range Start", ""],
  ["Lab Range End", ""],
  ["Unit Value", ""],
  ["Findings", ""],
];

export const MEDICAL_BLOOD_SUGAR_SECTION: MedicalSection = {
  key: "blood_sugar_random",
  groupKey: "other_medical",
  title: "Blood Sugar Random",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_BLOOD_SUGAR_FIELDS,
};

export const MEDICAL_CBC_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Date", ""],
  ["Examinee Name", "", true],
  ["Examinee Age", ""],
  ["Examinee Gender", ""],
  ["Diagnostic Centre Name", ""],
  ["Diagnostic Centre Address", ""],
  ["Diagnostic Centre Pincode", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
];

/** [parameter, unit, required?] */
export const MEDICAL_CBC_PARAMETERS: readonly MedicalParameterDef[] = [
  ["Hemoglobin(Hb)", "", true],
  ["RBC", "", true],
  ["WBC", "", true],
  ["Platelets", "", true],
  ["PCV", "", true],
  ["MCV", "", true],
  ["Differential_Neutrophil", ""],
  ["Differential_Lymphocyte", ""],
  ["Differential_Eosinophil", ""],
  ["Differential_Monocyte", ""],
  ["Differential_Basophil", ""],
  ["Esr", "", true],
  ["Absolute_Neutrophil", ""],
  ["Absolute_Lymphocyte", ""],
  ["Absolute_Eosinophil", ""],
  ["Absolute_Monocyte", ""],
  ["Absolute_Basophil", ""],
  ["MPV", ""],
  ["PDW", ""],
  ["MCH", ""],
  ["MCHC", ""],
  ["RDW", ""],
  ["RBC_Morphology", ""],
  ["WBC_Morphology", ""],
  ["Platelet_Morphology", ""],
];

export const MEDICAL_CBC_SECTION: MedicalSection = {
  key: "cbc_group",
  groupKey: "other_medical",
  title: "CBC Group",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "CBC Test Parameters",
  parameters: MEDICAL_CBC_PARAMETERS,
  fields: MEDICAL_CBC_FIELDS,
};

export const MEDICAL_COT_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Date", ""],
  ["Examinee Name", "", true],
  ["Examinee Age", ""],
  ["Examinee Gender", ""],
  ["Diagnostic Centre Name", ""],
  ["Diagnostic Centre Address", ""],
  ["Diagnostic Centre Pincode", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Value", "", true],
  ["Lab Range Start", ""],
  ["Lab Range End", ""],
  ["Unit Value", ""],
  ["Findings", ""],
];

export const MEDICAL_COT_SECTION: MedicalSection = {
  key: "cot",
  groupKey: "other_medical",
  title: "COT",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_COT_FIELDS,
};

export const MEDICAL_GHB_SECTION: MedicalSection = {
  key: "ghb",
  groupKey: "other_medical",
  title: "GHB",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_BLOOD_SUGAR_FIELDS,
};

export const MEDICAL_HBA1C_SECTION: MedicalSection = {
  key: "hba1c",
  groupKey: "other_medical",
  title: "HBA1C",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_BLOOD_SUGAR_FIELDS,
};

export const MEDICAL_HBSAG_SECTION: MedicalSection = {
  key: "hbsag",
  groupKey: "other_medical",
  title: "HBSAG",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_COT_FIELDS,
};

export const MEDICAL_HIV_ELISA_SECTION: MedicalSection = {
  key: "hiv_elisa",
  groupKey: "other_medical",
  title: "HIV Elisa",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_COT_FIELDS,
};

export const MEDICAL_LFT_FIELDS: readonly MedicalFieldDef[] = MEDICAL_CBC_FIELDS;

/** [parameter, unit, required?] */
export const MEDICAL_LFT_PARAMETERS: readonly MedicalParameterDef[] = [
  ["SGPT/ALT", "", true],
  ["SGOT/AST", "", true],
  ["GGT", "", true],
  ["Serum Bilirubin-Total", "", true],
  ["Direct", "", true],
  ["Indirect", "", true],
  ["Serum Protein- Total", "", true],
  ["Albumin", "", true],
  ["Globulin=(Total-Albumin)", "", true],
  ["Alkaline Phosphate", "", true],
  ["Albumin/Globulin_Ratio", "", true],
];

export const MEDICAL_LFT_SECTION: MedicalSection = {
  key: "lft",
  groupKey: "other_medical",
  title: "LFT",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "LFT Test Parameters",
  parameters: MEDICAL_LFT_PARAMETERS,
  fields: MEDICAL_LFT_FIELDS,
};

export const MEDICAL_LIPIDS_FIELDS: readonly MedicalFieldDef[] = MEDICAL_CBC_FIELDS;

/** [parameter, unit, required?] */
export const MEDICAL_LIPIDS_PARAMETERS: readonly MedicalParameterDef[] = [
  ["Total Cholesterol: TC", "", true],
  ["Triglycerides: TG", "", true],
  ["HDL", "", true],
  ["LDL", "", true],
  ["VLDL", ""],
  ["TC/HDL Ratio", "", true],
];

export const MEDICAL_LIPIDS_SECTION: MedicalSection = {
  key: "lipids",
  groupKey: "other_medical",
  title: "LIPIDS",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "LIPIDS Test Parameters",
  parameters: MEDICAL_LIPIDS_PARAMETERS,
  fields: MEDICAL_LIPIDS_FIELDS,
};

/** [parameter, unit, required?] */
export const MEDICAL_OGTT_PARAMETERS: readonly MedicalParameterDef[] = [
  ["OGTT1", "", true],
  ["OGTT2", "", true],
  ["OGTT3", "", true],
];

export const MEDICAL_OGTT_SECTION: MedicalSection = {
  key: "ogtt_group",
  groupKey: "other_medical",
  title: "OGTT Group",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "OGTT Test Parameters",
  parameters: MEDICAL_OGTT_PARAMETERS,
  fields: MEDICAL_CBC_FIELDS,
};

export const MEDICAL_PPBS_SECTION: MedicalSection = {
  key: "ppbs",
  groupKey: "other_medical",
  title: "PPBS",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_BLOOD_SUGAR_FIELDS,
};

/**
 * [parameter, unit, required?]
 * Dropdown options for the dropdown-valued parameters come from the schema
 * (`MEDICAL_SECTION_PARAMETER_RULES` in medical.schema.ts).
 */
export const MEDICAL_RUA_PARAMETERS: readonly MedicalParameterDef[] = [
  ["Sugar/Glycosuria", "", true],
  ["Albumin/Proteinuria", "", true],
  ["RBC/Haematuria", "", true],
  ["WBC/PUS/Pyuria", "", true],
  ["Epithelial Cells", "", true],
  ["Gravity", "", true],
  ["Ketone Bodies", "", true],
  ["Urine_Colour", ""],
  ["Urine_PH", ""],
  ["Urine_Quantity", ""],
  ["Urine_Appearance", ""],
  ["Urine_Blood", ""],
  ["Urine_Nitrite", ""],
  ["Urine_Bile_Salts", ""],
  ["Urine_Bile_Pigment", ""],
  ["Urine_Bilirubin", ""],
  ["Urine_Urobilinogen", ""],
  ["Urine_Bacteria", ""],
  ["Urine_Casts", ""],
  ["Urine_Crystal", ""],
  ["Urine_Deposit", ""],
];

export const MEDICAL_SERUM_COTININE_SECTION: MedicalSection = {
  key: "serum_cotinine",
  groupKey: "other_medical",
  title: "SERUM COTININE",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_COT_FIELDS,
};

/** [parameter, unit, required?] */
export const MEDICAL_SMA12_PARAMETERS: readonly MedicalParameterDef[] = [
  ["SGPT/ALT", "", true],
  ["SGOT/AST", "", true],
  ["GGT", "", true],
  ["Serum Bilirubin-Total", "", true],
  ["Direct", "", true],
  ["Indirect=(Total-Direct)", "", true],
  ["Serum Protein-Total", "", true],
  ["Albumin", "", true],
  ["Globulin=(Total-Albumin)", "", true],
  ["Albumin/Globulin_Ratio", "", true],
  ["Alkaline Phosphate", "", true],
  ["Serum Creatinine", "", true],
  ["Serum Calcium", ""],
  ["Serum Uric Acid", ""],
  ["RBS", ""],
  ["FBS", ""],
  ["Total Cholesterol: TC", "", true],
  ["Triglycerides: TG", "", true],
  ["HDL", "", true],
  ["LDL", "", true],
  ["VLDL", ""],
  ["TC/HDL Ratio", "", true],
];

export const MEDICAL_SMA12_SECTION: MedicalSection = {
  key: "sma12_group",
  groupKey: "other_medical",
  title: "SMA12 Group",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "SMA12 Test Parameters",
  parameters: MEDICAL_SMA12_PARAMETERS,
  fields: MEDICAL_CBC_FIELDS,
};

/** [parameter, unit, required?] */
export const MEDICAL_TFT_PARAMETERS: readonly MedicalParameterDef[] = [
  ["Triiodothyronine-T3", "", true],
  ["Thyroxin-T4", "", true],
  ["Thyroid Stimulating - Tsh Harmones", "", true],
];

export const MEDICAL_TFT_SECTION: MedicalSection = {
  key: "tft_group",
  groupKey: "other_medical",
  title: "TFT Group",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "TFT Test Parameters",
  parameters: MEDICAL_TFT_PARAMETERS,
  fields: MEDICAL_CBC_FIELDS,
};

export const MEDICAL_S13_SECTION: MedicalSection = {
  key: "s13_group",
  groupKey: "other_medical",
  title: "S13 Group",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "S13 Test Parameters",
  parameters: MEDICAL_SMA12_PARAMETERS,
  fields: MEDICAL_CBC_FIELDS,
};

/** Microalbuminuria and PSA: Findings is the entered numeric value, Result is auto populated. */
export const MEDICAL_TEST_DATE_LAB_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Type", ""],
  ["Test Date", ""],
  ["Examinee Name", "", true],
  ["Examinee Age", ""],
  ["Examinee Gender", ""],
  ["Diagnostic Centre Name", ""],
  ["Diagnostic Centre Address", ""],
  ["Diagnostic Centre Pincode", ""],
  ["Doctor Name", ""],
  ["Doctor Registration No", ""],
  ["Findings", "", true],
  ["Lab Range Start", ""],
  ["Lab Range End", ""],
  ["Unit Value", ""],
  ["Result", ""],
];

export const MEDICAL_MICROALBUMINURIA_SECTION: MedicalSection = {
  key: "microalbuminuria",
  groupKey: "other_medical",
  title: "MICROALBUMINURIA",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Findings", "Lab Range Start", "Lab Range End", "Unit Value", "Result"],
  plainTextTableFieldLabels: ["Result"],
  fields: MEDICAL_TEST_DATE_LAB_FIELDS,
};

export const MEDICAL_PSA_SECTION: MedicalSection = {
  key: "psa",
  groupKey: "other_medical",
  title: "PSA",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Findings", "Lab Range Start", "Lab Range End", "Unit Value", "Result"],
  plainTextTableFieldLabels: ["Result"],
  fields: MEDICAL_TEST_DATE_LAB_FIELDS,
};

export const MEDICAL_HIV_WESTERN_BLOT_SECTION: MedicalSection = {
  key: "hiv_western_blot",
  groupKey: "other_medical",
  title: "HIV Western Blot",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_COT_FIELDS,
};

export const MEDICAL_HCV_SECTION: MedicalSection = {
  key: "hcv",
  groupKey: "other_medical",
  title: "HCV",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_COT_FIELDS,
};

export const MEDICAL_FBS_SECTION: MedicalSection = {
  key: "fbs",
  groupKey: "other_medical",
  title: "FBS",
  cols: 3,
  selectPlaceholder: "--Select--",
  tableFieldLabels: ["Value", "Lab Range Start", "Lab Range End", "Unit Value", "Findings"],
  plainTextTableFieldLabels: ["Findings"],
  fields: MEDICAL_BLOOD_SUGAR_FIELDS,
};

export const MEDICAL_RUA_SECTION: MedicalSection = {
  key: "rua_group",
  groupKey: "other_medical",
  title: "RUA Group",
  cols: 3,
  selectPlaceholder: "--Select--",
  parametersTitle: "RUA Test Parameters",
  parameters: MEDICAL_RUA_PARAMETERS,
  fields: MEDICAL_CBC_FIELDS,
};

/* ------------------------------------------------------------------ */
/* 6. DECISION GROUP SECTIONS                                         */
/* ------------------------------------------------------------------ */

export const MEDICAL_BRE_DECISION_FIELDS: readonly MedicalFieldDef[] = [
  ["Physical Medical Decision", ""],
  ["Tele/Video MER Decision", ""],
  ["MunichRe Medical Decision", ""],
  ["MunichRe Rating", ""],
  ["BIU Medical Status", ""],
  ["Physical Medical Remark", ""],
  ["Tele/Video MER Remark", ""],
];

export const MEDICAL_BRE_DECISION_SECTION: MedicalSection = {
  key: "bre_medical_decision",
  groupKey: "decision",
  title: "BRE Medical Decision",
  cols: 3,
  fields: MEDICAL_BRE_DECISION_FIELDS,
};

export const MEDICAL_DECISION_FIELDS: readonly MedicalFieldDef[] = [
  ["Medical Decision", ""],
];

export const MEDICAL_DECISION_SECTION: MedicalSection = {
  key: "decision",
  groupKey: "decision",
  title: "Decision",
  alwaysEditable: true,
  selectPlaceholder: "Select medical decision",
  cols: 3,
  fields: MEDICAL_DECISION_FIELDS,
};

/* ------------------------------------------------------------------ */
/* Groups & Sections Aggregations                                     */
/* ------------------------------------------------------------------ */

export const MEDICAL_SECTIONS: readonly MedicalSection[] = [
  // 1. Overview
  MEDICAL_APPLICATION_FORM_LIFESTYLE_SECTION,
  // 2. MER
  MEDICAL_MER_SECTION,
  MEDICAL_HABIT_ADDICTIONS_SECTION,
  MEDICAL_MEASUREMENT_SECTION,
  MEDICAL_FAMILY_HISTORY_SECTION,
  MEDICAL_BP_PULSE_SECTION,
  MEDICAL_QUESTION_TABLE_SECTION,
  // 3. Tele-Video MER
  MEDICAL_TELE_MER_SECTION,
  MEDICAL_TELE_MEASUREMENT_SECTION,
  MEDICAL_TELE_FAMILY_HISTORY_SECTION,
  MEDICAL_TELE_HABIT_ADDICTION_SECTION,
  MEDICAL_TELE_QUESTION_TABLE_SECTION,
  MEDICAL_TELE_DISPOSITION_SECTION,
  // 4. Special Medical
  MEDICAL_2DECHO_SECTION,
  MEDICAL_BLOOD_UREA_SECTION,
  MEDICAL_CXR_SECTION,
  MEDICAL_DOBUTAMINE_STRESS_ECHO_SECTION,
  MEDICAL_EXERCISE_STRESS_ECHO_SECTION,
  MEDICAL_ECG_SECTION,
  MEDICAL_MAMMOGRAM_SECTION,
  MEDICAL_PAP_SMEAR_SECTION,
  MEDICAL_PFT_SECTION,
  MEDICAL_STOOL_TEST_SECTION,
  MEDICAL_TMT_SECTION,
  MEDICAL_USG_SECTION,
  MEDICAL_FUNDOSCOPY_TEST_SECTION,
  // 5. Other Medical
  MEDICAL_BLOOD_SUGAR_SECTION,
  MEDICAL_CBC_SECTION,
  MEDICAL_COT_SECTION,
  MEDICAL_GHB_SECTION,
  MEDICAL_HBA1C_SECTION,
  MEDICAL_HBSAG_SECTION,
  MEDICAL_HIV_ELISA_SECTION,
  MEDICAL_LFT_SECTION,
  MEDICAL_LIPIDS_SECTION,
  MEDICAL_OGTT_SECTION,
  MEDICAL_PPBS_SECTION,
  MEDICAL_RUA_SECTION,
  MEDICAL_SERUM_COTININE_SECTION,
  MEDICAL_SMA12_SECTION,
  MEDICAL_TFT_SECTION,
  MEDICAL_FBS_SECTION,
  MEDICAL_S13_SECTION,
  MEDICAL_HIV_WESTERN_BLOT_SECTION,
  MEDICAL_HCV_SECTION,
  MEDICAL_MICROALBUMINURIA_SECTION,
  MEDICAL_PSA_SECTION,
  // 6. Decision
  MEDICAL_BRE_DECISION_SECTION,
  MEDICAL_DECISION_SECTION,
];

export const MEDICAL_GROUPS: readonly MedicalGroup[] = [
  {
    key: "overview",
    name: "Overview",
    sections: [MEDICAL_APPLICATION_FORM_LIFESTYLE_SECTION],
  },
  {
    key: "mer",
    name: "MER",
    sections: [
      MEDICAL_MER_SECTION,
      MEDICAL_HABIT_ADDICTIONS_SECTION,
      MEDICAL_MEASUREMENT_SECTION,
      MEDICAL_FAMILY_HISTORY_SECTION,
      MEDICAL_BP_PULSE_SECTION,
      MEDICAL_QUESTION_TABLE_SECTION,
    ],
  },
  {
    key: "tele_video_mer",
    name: "TELE-VIDEO MER",
    sections: [
      MEDICAL_TELE_MER_SECTION,
      MEDICAL_TELE_MEASUREMENT_SECTION,
      MEDICAL_TELE_FAMILY_HISTORY_SECTION,
      MEDICAL_TELE_HABIT_ADDICTION_SECTION,
      MEDICAL_TELE_QUESTION_TABLE_SECTION,
      MEDICAL_TELE_DISPOSITION_SECTION,
    ],
  },
  {
    key: "special_medical",
    name: "SPECIAL MEDICAL",
    sections: [
      MEDICAL_2DECHO_SECTION,
      MEDICAL_BLOOD_UREA_SECTION,
      MEDICAL_CXR_SECTION,
      MEDICAL_DOBUTAMINE_STRESS_ECHO_SECTION,
      MEDICAL_EXERCISE_STRESS_ECHO_SECTION,
      MEDICAL_ECG_SECTION,
      MEDICAL_MAMMOGRAM_SECTION,
      MEDICAL_PAP_SMEAR_SECTION,
      MEDICAL_PFT_SECTION,
      MEDICAL_STOOL_TEST_SECTION,
      MEDICAL_TMT_SECTION,
      MEDICAL_USG_SECTION,
      MEDICAL_FUNDOSCOPY_TEST_SECTION,
    ],
  },
  {
    key: "other_medical",
    name: "OTHER MEDICAL",
    sections: [
      MEDICAL_BLOOD_SUGAR_SECTION,
      MEDICAL_CBC_SECTION,
      MEDICAL_COT_SECTION,
      MEDICAL_GHB_SECTION,
      MEDICAL_HBA1C_SECTION,
      MEDICAL_HBSAG_SECTION,
      MEDICAL_HIV_ELISA_SECTION,
      MEDICAL_LFT_SECTION,
      MEDICAL_LIPIDS_SECTION,
      MEDICAL_OGTT_SECTION,
      MEDICAL_PPBS_SECTION,
      MEDICAL_RUA_SECTION,
      MEDICAL_SERUM_COTININE_SECTION,
      MEDICAL_SMA12_SECTION,
      MEDICAL_TFT_SECTION,
      MEDICAL_FBS_SECTION,
      MEDICAL_S13_SECTION,
      MEDICAL_HIV_WESTERN_BLOT_SECTION,
      MEDICAL_HCV_SECTION,
      MEDICAL_MICROALBUMINURIA_SECTION,
      MEDICAL_PSA_SECTION,
    ],
  },
  {
    key: "decision",
    name: "Decision",
    sections: [MEDICAL_BRE_DECISION_SECTION, MEDICAL_DECISION_SECTION],
  },
];

/** Sections that are display-only: no Edit / Save / Reset buttons and not offered in the document dropdown. */
export const MEDICAL_NON_EDITABLE_SECTION_KEYS: readonly string[] = [
  MEDICAL_APPLICATION_FORM_LIFESTYLE_SECTION.key,
  MEDICAL_BRE_DECISION_SECTION.key,
  MEDICAL_DECISION_SECTION.key,
];

export const MEDICAL_LOCKED_FIELDS: ReadonlySet<string> = new Set<string>([
  "Application No.",
  "Height (Fts)",
  "Inches",
  "BMI",
  "Avg Systolic",
  "Avg Diastolic",
  "Ejection Result",
  "ecg:Heart Rate Finding",
  "Heart Rate Result",
  "Physical Medical Decision",
  "Tele/Video MER Decision",
  "MunichRe Medical Decision",
  "MunichRe Rating",
  "BIU Medical Status",
  "Physical Medical Remark",
  "Tele/Video MER Remark",
  "blood_sugar_random:Findings",
  "cot:Findings",
  "ghb:Findings",
  "hba1c:Findings",
  "hbsag:Findings",
  "hiv_elisa:Findings",
  "ppbs:Findings",
  "serum_cotinine:Findings",
  "fbs:Findings",
  "hiv_western_blot:Findings",
  "hcv:Findings",
  "Result",
  "Decision Date",
  "Underwriter Name",
  "tele_measurements:Height (ft)",
]);

export const MEDICAL_DEFAULT_APPLICANTS: readonly MedicalApplicantTab[] = [
  { key: "life", label: "Life Assured 1" },
  { key: "proposer", label: "Proposer" },
];

export const MEDICAL_DATE_FORMAT = "DD/MM/YYYY";

export const MEDICAL_MESSAGES = {
  documents: "Medical documents are available in the source application.",
  submitted: "Medical details submitted successfully.",
  sectionSaved: (title: string) => `${title} saved successfully.`,
  sectionNotFound: "No medical section found.",
  validationFailed: "Please correct the highlighted fields.",
  noHistory: "No history available for this section.",
} as const;

const MEDICAL_FREE_TEXT_LAB_RANGE_SECTION_KEYS: ReadonlySet<string> = new Set([
  MEDICAL_BLOOD_SUGAR_SECTION.key,
  MEDICAL_COT_SECTION.key,
  MEDICAL_GHB_SECTION.key,
  MEDICAL_HBA1C_SECTION.key,
  MEDICAL_HBSAG_SECTION.key,
  MEDICAL_HIV_ELISA_SECTION.key,
  MEDICAL_PPBS_SECTION.key,
  MEDICAL_SERUM_COTININE_SECTION.key,
  MEDICAL_FBS_SECTION.key,
  MEDICAL_HIV_WESTERN_BLOT_SECTION.key,
  MEDICAL_HCV_SECTION.key,
  MEDICAL_MICROALBUMINURIA_SECTION.key,
  MEDICAL_PSA_SECTION.key,
]);

/** Labels that contain any of these terms hold numeric values (split to keep each regex simple). */
const MEDICAL_NUMERIC_LABEL_PATTERNS: readonly RegExp[] = [
  /Income|Pincode|Height\s*\(|Weight\s*\(|Waist|Hips|Systolic|Diastolic|Pulse|Duration|Heart Rate|Age|Quant|Year/i,
  /METS|FEV1|FVC|Blood Urea|BUN|Value|Count|Cholesterol|Triglycerides|Bilirubin|SGOT|SGPT|Platelet|Hemoglobin|Lab Range/i,
  /^(Inspiration|Expiration|RV|VC)$/i,
];

type MedicalLabelRule = readonly [RegExp, MedicalControlKind];

/** First rule whose pattern matches the label wins. */
function matchLabelRule(
  rules: readonly MedicalLabelRule[],
  label: string,
): MedicalControlKind | undefined {
  return rules.find(([pattern]) => pattern.test(label))?.[1];
}

const MEDICAL_IDENTITY_LABEL_RULES: readonly MedicalLabelRule[] = [
  [/^(Examinee )?Gender$/i, "gender"],
  [/^Unit Value$/i, "text"],
  [/^Place of Examination$/i, "placeOfExamination"],
  [/Medical Decision|^STP Decision$/i, "decision"],
];

const MEDICAL_RESULT_LABEL_RULES: readonly MedicalLabelRule[] = [
  [/Findings|Result|Rejection Abnormality/i, "findings"],
  [/Medical Type/i, "medicalType"],
  [/^METS$/i, "mets"],
];

const MEDICAL_GENERAL_LABEL_RULES: readonly MedicalLabelRule[] = [
  // Habit & Addictions: "<habit> Quant" / "<habit> Year" are numeric; the habit itself is Yes/No.
  [/ (Quant|Year)$/i, "number"],
  [/^Narcotic Consumption$/i, "yesNo"],
  [/Dead or Alive/i, "deadOrAlive"],
  [/^Relation Type$/i, "familyRelation"],
  [/Describe Build/i, "build"],
  [
    /^(Is\b|Tele-Video MER Conducted|Verified|Smoking|Diving|Tobacco|Alcohol|Narcotics|Adverse|Hazardous|Illness|Any\b|Cigarettes|Gutka|Beer)/i,
    "yesNo",
  ],
  [/Examinee Education/i, "education"],
  [/Examinee Occupation/i, "occupation"],
  [/(DOB|Date of Examination|Date of Tele-Video|\bDate\b|Test Date)/i, "date"],
  ...MEDICAL_NUMERIC_LABEL_PATTERNS.map(
    (pattern): MedicalLabelRule => [pattern, "number"],
  ),
];

/** Blood Urea, Microalbuminuria, PSA: Findings is a numeric value; Result is auto populated. */
const MEDICAL_NUMERIC_FINDINGS_SECTION_KEYS: ReadonlySet<string> = new Set([
  MEDICAL_BLOOD_UREA_SECTION.key,
  MEDICAL_MICROALBUMINURIA_SECTION.key,
  MEDICAL_PSA_SECTION.key,
]);

const MEDICAL_NEGATIVE_POSITIVE_VALUE_SECTION_KEYS: ReadonlySet<string> =
  new Set([
    MEDICAL_COT_SECTION.key,
    MEDICAL_HBSAG_SECTION.key,
    MEDICAL_HIV_ELISA_SECTION.key,
    MEDICAL_SERUM_COTININE_SECTION.key,
    MEDICAL_HIV_WESTERN_BLOT_SECTION.key,
    MEDICAL_HCV_SECTION.key,
  ]);

/** Rules that depend on the section as well as the label; undefined when none apply. */
function resolveSectionLabelKind(
  sectionKey: string,
  label: string,
): MedicalControlKind | undefined {
  if (MEDICAL_NUMERIC_FINDINGS_SECTION_KEYS.has(sectionKey) && label === "Findings") {
    return "number";
  }
  // Blood Sugar Random, COT, GHB, HBA1C: the lab range is free text.
  if (
    MEDICAL_FREE_TEXT_LAB_RANGE_SECTION_KEYS.has(sectionKey) &&
    /^Lab Range (Start|End)$/i.test(label)
  ) {
    return "text";
  }
  return undefined;
}

export function resolveMedicalControlKind(
  sectionKey: string,
  label: string,
): MedicalControlKind {
  if (sectionKey === MEDICAL_TELE_MER_SECTION.key) {
    return MEDICAL_TELE_MER_CONTROL_KINDS[label] ?? "text";
  }
  if (sectionKey === MEDICAL_TELE_HABIT_ADDICTION_SECTION.key) {
    return label.endsWith(" - Indicator") ? "yesNo" : "number";
  }

  const identityKind = matchLabelRule(MEDICAL_IDENTITY_LABEL_RULES, label);
  if (identityKind) return identityKind;

  const sectionKind = resolveSectionLabelKind(sectionKey, label);
  if (sectionKind) return sectionKind;

  const resultKind = matchLabelRule(MEDICAL_RESULT_LABEL_RULES, label);
  if (resultKind) return resultKind;

  if (MEDICAL_NEGATIVE_POSITIVE_VALUE_SECTION_KEYS.has(sectionKey) && label === "Value") {
    return "negativePositive";
  }

  return matchLabelRule(MEDICAL_GENERAL_LABEL_RULES, label) ?? "text";
}

export function getMedicalOptions(
  kind: MedicalControlKind,
): MedicalOption[] {
  switch (kind) {
    case "yesNo":
      return MEDICAL_YES_NO_OPTIONS;
    case "gender":
      return MEDICAL_GENDER_OPTIONS;
    case "placeOfExamination":
      return MEDICAL_PLACE_OF_EXAMINATION_OPTIONS;
    case "education":
      return MEDICAL_EDUCATION_OPTIONS;
    case "occupation":
      return MEDICAL_OCCUPATION_OPTIONS;
    case "deadOrAlive":
      return MEDICAL_DEAD_OR_ALIVE_OPTIONS;
    case "familyRelation":
      return MEDICAL_FAMILY_RELATION_OPTIONS;
    case "build":
      return MEDICAL_BUILD_OPTIONS;
    case "decision":
      return MEDICAL_DECISION_OPTIONS;
    case "findings":
      return MEDICAL_FINDINGS_OPTIONS;
    case "medicalType":
      return MEDICAL_TYPE_OPTIONS;
    case "mets":
      return MEDICAL_METS_OPTIONS;
    case "negativePositive":
      return MEDICAL_NEGATIVE_POSITIVE_OPTIONS;
    default:
      return [];
  }
}