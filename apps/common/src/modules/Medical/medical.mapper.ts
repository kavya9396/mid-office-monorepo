/**
 * Maps the response of POST /icic-medical-service/v1/medical-data/fetch onto the View Medical
 * sections. Pure: no I/O, no React. Mapping rules follow
 * docs/spec/integrations/medical-data-fetch.md and design-reference/medical-data-fetch-mapping.yaml.
 *
 * Sections not mapped here (Special Medical, Other Medical, Decision) are returned unchanged until
 * their mapping is reviewed.
 */
import {
  createMedicalBpPulseSection,
  type MedicalCmoDecision,
  getMedicalOptions,
  MEDICAL_BP_DEFAULT_READING_IDS,
  MEDICAL_GROUPS,
  MEDICAL_SECTIONS,
  parseMedicalQuestionnaire,
  resolveMedicalControlKind,
  type MedicalControlKind,
  type MedicalFamilyRow,
  type MedicalFieldDef,
  type MedicalGroup,
  type MedicalParameterValue,
  type MedicalSection,
} from "./medical.config";
import {
  getMedicalParameterValidator,
  MEDICAL_BP_READING_LABEL,
  MEDICAL_SECTION_FIELD_OPTIONS,
} from "./medical.schema";

export interface MedicalFetchResult {
  sections: readonly MedicalSection[];
  groups: readonly MedicalGroup[];
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const rawText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const readPath = (root: JsonRecord, path: readonly string[]): JsonRecord | undefined => {
  let node: unknown = root;
  for (const key of path) {
    if (!isRecord(node)) return undefined;
    node = node[key];
  }
  return isRecord(node) ? node : undefined;
};

/* ------------------------------------------------------------------ */
/* Value normalisation                                                */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const DD_MM_YYYY = /^\d{2}\/\d{2}\/\d{4}$/;
const HH_MM = /^\d{2}:\d{2}$/;

/**
 * Converts an API value to the string the form stores for a control kind.
 * A value the control cannot show (unknown code, wrong format) becomes "" so the user
 * re-selects it, instead of the screen showing a value the control cannot hold.
 * `sectionOptions` is the section's own dropdown list; it replaces the list of the control kind.
 */
function normaliseValue(
  kind: MedicalControlKind,
  raw: unknown,
  sectionOptions?: readonly string[],
): string {
  const text = rawText(raw);
  if (text === "") return "";
  if (sectionOptions && sectionOptions.length > 0) {
    const lower = text.toLowerCase();
    return sectionOptions.find((option) => option.toLowerCase() === lower) ?? "";
  }
  switch (kind) {
    case "date": {
      if (DD_MM_YYYY.test(text)) return text;
      const iso = ISO_DATE.exec(text);
      return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : "";
    }
    case "time":
      return HH_MM.test(text) ? text : "";
    case "yesNo": {
      const upper = text.toUpperCase();
      if (upper === "Y" || upper === "YES" || upper === "TRUE") return "Yes";
      if (upper === "N" || upper === "NO" || upper === "FALSE") return "No";
      return "";
    }
    case "text":
    case "number":
      return text;
    default: {
      const options = getMedicalOptions(kind);
      if (options.length === 0) return text;
      const lower = text.toLowerCase();
      return (
        options.find(
          (option) =>
            option.value.toLowerCase() === lower || option.label.toLowerCase() === lower,
        )?.value ?? ""
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Field sections: UI label -> API key                                */
/* ------------------------------------------------------------------ */

interface FieldSource {
  sectionKey: string;
  /** Path of the API object under `data.sections`. */
  path: readonly string[];
  /** UI field label -> key in that object. Labels without an entry keep their default value. */
  keys: Readonly<Record<string, string>>;
}

const HABITS = [
  { api: "cigarettesBeedisCigar", mer: "Cigarettes/beedis/cigar", tele: "Cigarette/beedis/cigar" },
  { api: "gutkaSnuffPaan", mer: "Gutka / snuff / paan etc.", tele: "Gutka/Snuff/Paan etc." },
  // "Narrotic" is the prototype's spelling and is kept in the Tele label.
  { api: "narcoticConsumption", mer: "Narcotic Consumption", tele: "Narrotic Consumption" },
  { api: "beerWineHardLiquor", mer: "Beer/Wine/Hard liquor", tele: "Beer/Wine/Hard liquor" },
] as const;

const MER_HABIT_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  HABITS.flatMap(({ api, mer }) => [
    [mer, api],
    [`${mer} Quant`, `${api}Quant`],
    [`${mer} Year`, `${api}Year`],
  ]),
);

const TELE_HABIT_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  HABITS.flatMap(({ api, tele }) => [
    [`${tele} - Indicator`, api],
    [`${tele} - Quantity`, `${api}Quant`],
    [`${tele} - No. of Year`, `${api}Year`],
  ]),
);

/**
 * Special Medical: every test shares these header fields (mapping YAML, MENU 4).
 * `doctorRegNo` is used; the API also sends `doctorRegistrationNo` with the same value (R4).
 */
const SPECIAL_HEADER_KEYS: Readonly<Record<string, string>> = {
  "Medical Type": "medicalType",
  "Test Date": "testDate",
  "Examinee Name": "examineeName",
  "Examinee Age": "examineeAge",
  "Diagnostic Centre Name": "diagnosticCentreName",
  "Doctor Name": "doctorName",
  "Doctor Registration No": "doctorRegNo",
};

const specialSource = (
  sectionKey: string,
  apiKey: string,
  keys: Readonly<Record<string, string>>,
): FieldSource => ({
  sectionKey,
  path: [apiKey],
  keys: { ...SPECIAL_HEADER_KEYS, ...keys },
});

const STRESS_ECHO_KEYS: Readonly<Record<string, string>> = {
  Findings: "findings",
  "Ejection Fraction": "ejectionFraction",
  "Ejection Result": "ejectionResult",
  "Rejection Abnormality": "rejectionAbnormality",
  Remark: "remark",
};

const FINDINGS_REMARK_KEYS: Readonly<Record<string, string>> = { Findings: "findings", Remark: "remark" };
const FINDINGS_REMARKS_KEYS: Readonly<Record<string, string>> = { Findings: "findings", Remarks: "remarks" };

const SPECIAL_MEDICAL_SOURCES: readonly FieldSource[] = [
  specialSource("2decho", "2decho", { ...STRESS_ECHO_KEYS, Remarks: "remarks" }),
  specialSource("blood_urea_nitro", "blood_urea_and_nitro", {
    Findings: "findings",
    "Blood Urea": "bloodUrea",
    BUN: "bun",
    Result: "result",
    Remark: "remark",
  }),
  specialSource("cxr", "cxr", FINDINGS_REMARK_KEYS),
  specialSource("dobutamine_stress_echo", "dobutamine_stress_echocardiogram", STRESS_ECHO_KEYS),
  specialSource("exercise_stress_echo", "exercise_stress_echocardiogram", STRESS_ECHO_KEYS),
  specialSource("ecg", "ecg", {
    Findings: "findings",
    Axis: "axis",
    "Heart Rate": "heartRate",
    "Heart Rate Finding": "heartRateFinding",
    Remark: "remark",
  }),
  specialSource("mammogram", "mammogram", FINDINGS_REMARK_KEYS),
  specialSource("pap_smear", "pap_smear", FINDINGS_REMARKS_KEYS),
  // PFT has no Findings; its date is `date` (the API also sends `testDate`).
  specialSource("pft", "pft", {
    Date: "date",
    Inspiration: "inspiration",
    Expiration: "expiration",
    FEV1: "fev1",
    FVC: "fvc",
    "FEV1/FVC": "fev1Fvc",
    RV: "rv",
    VC: "vc",
  }),
  specialSource("stool_test", "stool_test", FINDINGS_REMARKS_KEYS),
  specialSource("tmt", "tmt", {
    Findings: "findings",
    METS: "mets",
    "Heart Rate Finding": "heartRateFinding",
    "Heart Rate Result": "heartRateResult",
    Remarks: "remarks",
  }),
  specialSource("usg", "usg", FINDINGS_REMARKS_KEYS),
  specialSource("fundoscopy_test", "fundoscopy_test", FINDINGS_REMARKS_KEYS),
];

/**
 * Other Medical, single-value tests (mapping YAML, MENU 5, shape A). The API object is at
 * `data.sections.<key>`; the result is read from the root, never from `parameters[]`.
 */
const OTHER_MEDICAL_HEADER_KEYS: Readonly<Record<string, string>> = {
  "Medical Type": "medicalType",
  "Examinee Name": "examineeName",
  "Examinee Age": "examineeAge",
  "Examinee Gender": "examineeGender",
  "Diagnostic Centre Name": "diagnosticCentreName",
  "Diagnostic Centre Address": "diagnosticCentreAddress",
  "Diagnostic Centre Pincode": "diagnosticCentrePincode",
  "Doctor Name": "doctorName",
  "Doctor Registration No": "doctorRegNo",
};

const OTHER_MEDICAL_LAB_KEYS: Readonly<Record<string, string>> = {
  "Lab Range Start": "labRangeValueStart",
  "Lab Range End": "labRangeValueEnd",
  "Unit Value": "unitsValue",
};

/** UI "Date" / "Test Date" -> API key; "Value"/"Findings" layout differs per group of tests. */
const OTHER_MEDICAL_VALUE_KEYS: Readonly<Record<string, string>> = { Value: "value", Findings: "findings" };

/** Microalbuminuria and PSA: the entered number is `Findings` in the UI and `value` in the API. */
const OTHER_MEDICAL_ENTERED_FINDINGS_KEYS: Readonly<Record<string, string>> = {
  "Test Date": "testDate",
  Findings: "value",
  Result: "findings",
};

const otherMedicalSource = (sectionKey: string, keys: Readonly<Record<string, string>>): FieldSource => ({
  sectionKey,
  path: [sectionKey],
  keys: { ...OTHER_MEDICAL_HEADER_KEYS, ...OTHER_MEDICAL_LAB_KEYS, ...keys },
});

const OTHER_MEDICAL_SOURCES: readonly FieldSource[] = [
  ...[
    "blood_sugar_random",
    "cot",
    "ghb",
    "hba1c",
    "hbsag",
    "hiv_elisa",
    "ppbs",
    "serum_cotinine",
    "fbs",
    "hiv_western_blot",
    "hcv",
  ].map((sectionKey) => otherMedicalSource(sectionKey, { ...OTHER_MEDICAL_VALUE_KEYS, Date: "date" })),
  otherMedicalSource("microalbuminuria", OTHER_MEDICAL_ENTERED_FINDINGS_KEYS),
  otherMedicalSource("psa", OTHER_MEDICAL_ENTERED_FINDINGS_KEYS),
];

/**
 * Other Medical, parameter-list tests (mapping YAML, MENU 5, shape B): the header fields come from the
 * root of the API object and the table rows from `parameters[]` (see `applyParameters`).
 */
const PARAMETER_LIST_SOURCES: readonly FieldSource[] = [
  "cbc_group",
  "lft",
  "lipids",
  "ogtt_group",
  "rua_group",
  "sma12_group",
  "tft_group",
  "s13_group",
].map((sectionKey) => ({
  sectionKey,
  path: [sectionKey],
  keys: { ...OTHER_MEDICAL_HEADER_KEYS, Date: "date" },
}));

/**
 * Special Medical tests that show a read-only "CMO decision" table (prototype `cmoDecisionRowsBySection`).
 * The rows come from `cmoDecisions[]` in the test's API object. When the key is missing or empty the
 * table is not shown, so the config's sample rows never appear next to real data.
 */
const CMO_DECISION_SECTION_KEYS: ReadonlySet<string> = new Set(["2decho", "ecg", "tmt"]);

function mapCmoDecisions(raw: JsonRecord): readonly MedicalCmoDecision[] {
  if (!Array.isArray(raw.cmoDecisions)) return [];
  return raw.cmoDecisions.filter(isRecord).map((row) => ({
    userName: rawText(row.userName),
    poolName: rawText(row.poolName),
    decision: rawText(row.decision),
    remarks: rawText(row.remarks),
    updatedOn: rawText(row.updatedOn),
  }));
}

const FIELD_SOURCES: readonly FieldSource[] = [
  ...SPECIAL_MEDICAL_SOURCES,
  ...OTHER_MEDICAL_SOURCES,
  ...PARAMETER_LIST_SOURCES,

  {
    sectionKey: "application_form_medical_lifestyle",
    path: ["application_form_medical"],
    // "Adverse", "Hazardous Occupation" and "Illness Impairment" have no API key yet
    // (mapping YAML: api_missing), so they keep their defaults.
    keys: {
      Height: "height",
      Weight: "weight",
      BMI: "bmi",
      "Family History As Per Application Form ?": "familyHistoryAsPerApplicationForm",
      Smoking: "smoking",
      Diving: "diving",
      Tobacco: "tobacco",
      Alcohol: "alcohol",
      Narcotics: "narcotics",
    },
  },
  {
    sectionKey: "mer",
    path: ["mer"],
    keys: {
      "Application No.": "applicationNo",
      "First Name": "firstName",
      "Last Name": "lastName",
      "Is MER name same as proposal name?": "isMerNameSameAsProposalName",
      "Place of Examination": "placeOfExamination",
      Gender: "gender",
      "Name of ME": "nameOfMe",
      "ME Code": "meCode",
      "Is Identity Proof and Application Photo Match": "isIdentityProofAndApplicationPhotoMatch",
      "Examinee DOB": "examineeDob",
      "Examination Time": "examTime",
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
        "anyPreviousLifeInsurancePolicyDeclinePostponeOrIssuedOnRevisedTermSd",
    },
  },
  { sectionKey: "habit_addictions", path: ["habit_and_addictions"], keys: MER_HABIT_KEYS },
  {
    sectionKey: "measurement",
    path: ["measurement"],
    keys: {
      "Height (cms)": "heightCm",
      "Height (Fts)": "heightFts",
      Inches: "inches",
      "Weight (Kgs)": "weightKg",
      "Waist (cms)": "waistCm",
      "Hips (cms)": "hipsCm",
      BMI: "bmi",
    },
  },
  {
    sectionKey: "tele_mer",
    path: ["tele_mer"],
    keys: {
      "Application No.": "applicationNo",
      "First Name": "firstName",
      "Last Name": "lastName",
      Gender: "gender",
      "Date of Birth": "dateOfBirth",
      "Telephonic MER": "telephonicMer",
      "Time of Tele call": "dateTimeOfTeleCall",
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
      "Address Including City and State": "addressInclCityState",
      "Tele Findings": "teleFindings",
      "Tele MER Final Remark": "tmerFinalRemark",
      "Tele Type": "teleType",
    },
  },
  {
    sectionKey: "tele_measurements",
    path: ["tele_mer", "measurement"],
    keys: {
      "Height (cms)": "heightCms",
      "Height (ft)": "heightFts",
      Inches: "inches",
      "Weight (kgs)": "weightKgs",
      BMI: "bmi",
    },
  },
  { sectionKey: "tele_habit_addiction", path: ["tele_mer", "habit_and_addictions"], keys: TELE_HABIT_KEYS },
  {
    sectionKey: "tele_disposition",
    path: ["tele_mer", "disposition"],
    // "Remarks2" has no API key yet (mapping YAML: api_missing), so it keeps its default.
    keys: { "TUW Status": "tuwStatus", Remark: "remark", Note: "note" },
  },
  {
    sectionKey: "bre_medical_decision",
    path: ["bre_medical_decision"],
    keys: {
      "Physical Medical Decision": "physicalMedicalDecision",
      "Tele/Video MER Decision": "teleVideoMerDecision",
      "MunichRe Medical Decision": "munichReMedicalDecision",
      "MunichRe Rating": "munichReRating",
      // No UI option list yet (open question 30), so the value is shown as the API sends it.
      "BIU Medical Status": "biuMedicalStatus",
      "Physical Medical Remark": "physicalMedicalRemark",
      "Tele/Video MER Remark": "teleVideoMerRemark",
    },
  },
  { sectionKey: "decision", path: ["decision"], keys: { "Medical Decision": "medicalDecision" } },
];

function applyFields(
  section: MedicalSection,
  source: FieldSource,
  raw: JsonRecord,
): MedicalSection {
  const fields = section.fields.map(([label, defaultValue, required]): MedicalFieldDef => {
    const apiKey = source.keys[label];
    const value =
      apiKey === undefined
        ? defaultValue
        : normaliseValue(
            resolveMedicalControlKind(section.key, label),
            raw[apiKey],
            MEDICAL_SECTION_FIELD_OPTIONS[section.key]?.[label],
          );
    return required === undefined ? [label, value] : [label, value, required];
  });
  return { ...section, fields };
}

/* ------------------------------------------------------------------ */
/* Parameter lists: parameters[] -> table rows                         */
/* ------------------------------------------------------------------ */

/**
 * Fills the section's parameter table from `parameters[]`, matching each UI row to the item with the
 * same `paramName`. A row with no item stays empty; an item with no UI row is dropped. Findings is not
 * read: the UI computes it from the value and the Normal Range. A dropdown Value outside the row's list
 * is left empty.
 */
function applyParameters(section: MedicalSection, raw: JsonRecord): MedicalSection {
  if (!section.parameters || !Array.isArray(raw.parameters)) return section;
  const items = new Map<string, JsonRecord>();
  for (const item of raw.parameters) {
    if (isRecord(item)) items.set(rawText(item.paramName), item);
  }
  const parameterValues = section.parameters.map(([name]): MedicalParameterValue => {
    const item = items.get(name);
    const dropdown = getMedicalParameterValidator(section.key, name, "value")?.options;
    return {
      value: normaliseValue("text", item?.value, dropdown?.map((option) => option.value)),
      from: rawText(item?.labRangeValueStart),
      to: rawText(item?.labRangeValueEnd),
      unit: rawText(item?.unitsValue),
    };
  });
  return { ...section, parameterValues };
}

/* ------------------------------------------------------------------ */
/* Family history: members[] -> rows                                  */
/* ------------------------------------------------------------------ */

const FAMILY_SOURCES: readonly { sectionKey: string; path: readonly string[] }[] = [
  { sectionKey: "family_history_health_status", path: ["family_history"] },
  { sectionKey: "tele_family_history", path: ["tele_mer", "family_history"] },
];

const titleCase = (text: string): string =>
  text === "" ? "" : text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

/** "A" is the only alive code in the UAT sample; the dead code is not confirmed, so it is not guessed. */
const normaliseAlive = (raw: unknown): string => {
  const text = rawText(raw);
  if (text.toUpperCase() === "A") return "Alive";
  return normaliseValue("deadOrAlive", text);
};

/** Undefined when there are no members, so the section keeps its Father / Mother starter rows. */
function mapFamilyRows(raw: JsonRecord): readonly MedicalFamilyRow[] | undefined {
  const members = Array.isArray(raw.members) ? raw.members.filter(isRecord) : [];
  if (members.length === 0) return undefined;
  return members.map((member) => {
    const age = rawText(member.memberAge);
    const alive = normaliseAlive(member.aliveStatus);
    const health = rawText(member.healthStatusDesc);
    return {
      relation: titleCase(rawText(member.relationType)),
      ...(age === "" ? {} : { age }),
      ...(alive === "" ? {} : { alive }),
      ...(health === "" ? {} : { health }),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Blood pressure: systolic[] / diastolic[] of { readingId, value }    */
/* ------------------------------------------------------------------ */

const BP_SECTION_KEY = "blood_pressure_pulse_details";

/** readingId -> value. Entries without a positive integer readingId are skipped. */
function readBpReadings(raw: unknown): ReadonlyMap<number, string> {
  const readings = new Map<number, string>();
  if (!Array.isArray(raw)) return readings;
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = item.readingId;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) continue;
    readings.set(id, normaliseValue("number", item.value));
  }
  return readings;
}

/**
 * Builds the BP & Pulse section with one slot per readingId the API returned (sorted ascending),
 * and always at least slots 1-4. Avg and Pulse Rate are plain keys.
 */
function mapBloodPressure(raw: JsonRecord): MedicalSection {
  const systolic = readBpReadings(raw.systolic);
  const diastolic = readBpReadings(raw.diastolic);
  const readingIds = [
    ...new Set([...MEDICAL_BP_DEFAULT_READING_IDS, ...systolic.keys(), ...diastolic.keys()]),
  ].sort((a, b) => a - b);

  const section = createMedicalBpPulseSection(readingIds);
  const plainKeys: Readonly<Record<string, string>> = {
    "Avg Systolic": "avgSystolic",
    "Avg Diastolic": "avgDiastolic",
    "Pulse Rate": "pulseRate",
  };
  const fields = section.fields.map(([label, defaultValue, required]): MedicalFieldDef => {
    const reading = MEDICAL_BP_READING_LABEL.exec(label);
    const plainKey = plainKeys[label];
    let value = defaultValue;
    if (reading) {
      const source = reading[1] === "Systolic" ? systolic : diastolic;
      value = source.get(Number(reading[2])) ?? defaultValue;
    } else if (plainKey !== undefined) {
      value = normaliseValue("number", raw[plainKey]);
    }
    return required === undefined ? [label, value] : [label, value, required];
  });
  return { ...section, fields };
}

/* ------------------------------------------------------------------ */
/* Question tables: questionnaire[]                                   */
/* ------------------------------------------------------------------ */

const QUESTIONNAIRE_SOURCES: readonly { sectionKey: string; path: readonly string[] }[] = [
  { sectionKey: "question_table", path: ["question_table"] },
  { sectionKey: "tele_question_table", path: ["tele_mer"] },
];

/* ------------------------------------------------------------------ */
/* Entry point                                                        */
/* ------------------------------------------------------------------ */

function mapSection(section: MedicalSection, root: JsonRecord): MedicalSection {
  if (section.key === BP_SECTION_KEY) {
    const raw = readPath(root, ["blood_pressure_and_pulse"]);
    return raw ? mapBloodPressure(raw) : section;
  }

  const fieldSource = FIELD_SOURCES.find((source) => source.sectionKey === section.key);
  if (fieldSource) {
    const raw = readPath(root, fieldSource.path);
    if (!raw) return section;
    const mapped = applyParameters(applyFields(section, fieldSource, raw), raw);
    return CMO_DECISION_SECTION_KEYS.has(section.key)
      ? { ...mapped, cmoDecisions: mapCmoDecisions(raw) }
      : mapped;
  }

  const familySource = FAMILY_SOURCES.find((source) => source.sectionKey === section.key);
  if (familySource) {
    const raw = readPath(root, familySource.path);
    const familyRows = raw ? mapFamilyRows(raw) : undefined;
    return familyRows ? { ...section, familyRows } : section;
  }

  const questionnaireSource = QUESTIONNAIRE_SOURCES.find(
    (source) => source.sectionKey === section.key,
  );
  if (questionnaireSource) {
    const raw = readPath(root, questionnaireSource.path);
    return raw && Array.isArray(raw.questionnaire)
      ? { ...section, questionnaire: parseMedicalQuestionnaire(raw.questionnaire) }
      : section;
  }

  return section;
}

/**
 * Builds the View Medical sections and groups from a fetch response.
 * Returns null when the response has no `data.sections` ("not found"); never defaults to other data.
 * Throws when a questionnaire row has an invalid shape.
 */
export function mapMedicalFetchPayload(payload: unknown): MedicalFetchResult | null {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.sections)) {
    return null;
  }
  const root = payload.data.sections;
  const sections = MEDICAL_SECTIONS.map((section) => mapSection(section, root));
  const byKey = new Map(sections.map((section) => [section.key, section]));
  const groups = MEDICAL_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.map((section) => byKey.get(section.key) ?? section),
  }));
  return { sections, groups };
}
