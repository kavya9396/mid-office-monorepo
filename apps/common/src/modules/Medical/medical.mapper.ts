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
  type MedicalHistoryEntry,
  type MedicalParameterValue,
  type MedicalSection,
} from "./medical.config";
import {
  getMedicalParameterValidator,
  MEDICAL_BP_READING_LABEL,
  MEDICAL_SCHEMA_TELE_HEALTH_STATUS,
  MEDICAL_SECTION_FIELD_OPTIONS,
} from "./medical.schema";

export interface MedicalFetchResult {
  sections: readonly MedicalSection[];
  groups: readonly MedicalGroup[];
  examId?: number;
  medAppDtlId?: number;
  history?: Readonly<Record<string, readonly MedicalHistoryEntry[]>>;
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

/** Like `readFirstPath`, but also returns an array node. */
const readFirstNode = (
  root: JsonRecord,
  paths: readonly (readonly string[])[],
): JsonRecord | readonly unknown[] | undefined => {
  for (const path of paths) {
    let node: unknown = root;
    for (const key of path) {
      if (!isRecord(node)) {
        node = undefined;
        break;
      }
      node = node[key];
    }
    if (Array.isArray(node) || isRecord(node)) return node;
  }
  return undefined;
};

const readFirstPath = (
  root: JsonRecord,
  paths: readonly (readonly string[])[],
): JsonRecord | undefined => {
  for (const path of paths) {
    const found = readPath(root, path);
    if (found !== undefined) return found;
  }
  return undefined;
};

/* ------------------------------------------------------------------ */
/* Value normalisation                                                */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const DD_MM_YYYY = /^\d{2}\/\d{2}\/\d{4}$/;
const HH_MM_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HH_MM_12H = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;

/** Returns `hh:mm AM/PM` for a 12-hour or 24-hour time, or "" when it is neither. */
function toTime12h(text: string): string {
  const twelve = HH_MM_12H.exec(text);
  if (twelve) return `${twelve[1].padStart(2, "0")}:${twelve[2]} ${twelve[3].toUpperCase()}`;
  const twentyFour = HH_MM_24H.exec(text);
  if (!twentyFour) return "";
  const hours = Number(twentyFour[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, "0")}:${twentyFour[2]} ${suffix}`;
}

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
      return toTime12h(text);
    case "yesNo": {
      const upper = text.toUpperCase();
      if (upper === "Y" || upper === "YES" || upper === "TRUE") return "Yes";
      if (upper === "N" || upper === "NO" || upper === "FALSE") return "No";
      return "";
    }
    case "text":
    case "number":
    case "currency":
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

export interface FieldSource {
  sectionKey: string;
  /** Candidate paths of the API object under `data.sections`; the first one that exists is used. */
  paths: readonly (readonly string[])[];
  /**
   * UI field label -> key in that object. Several keys are tried in order and the first non-null value
   * wins. Labels without an entry keep their default value.
   */
  keys: Readonly<Record<string, string | readonly string[]>>;
}

export const HABITS = [
  { api: "cigarettesBeedisCigar", habit: "Cigarette/beedis/cigar", mer: "Cigarettes/beedis/cigar", tele: "Cigarette/beedis/cigar" },
  { api: "gutkaSnuffPaan", habit: "Gutka/Snuff/Paan etc.", mer: "Gutka / snuff / paan etc.", tele: "Gutka/Snuff/Paan etc." },
  // "Narrotic" is the prototype's spelling and is kept in the Tele label. `habit` is the API's own name.
  { api: "narcoticConsumption", habit: "Narcotic Consumption", mer: "Narcotic Consumption", tele: "Narrotic Consumption" },
  { api: "beerWineHardLiquor", habit: "Beer/Wine/Hard liquor", mer: "Beer/Wine/Hard liquor", tele: "Beer/Wine/Hard liquor" },
] as const;

export const MER_HABIT_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  HABITS.flatMap(({ api, mer }) => [
    [`${mer} - Indicator`, api],
    [`${mer} - Quantity`, `${api}Quant`],
    [`${mer} - No. of Year`, `${api}Year`],
  ]),
);

export const TELE_HABIT_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  HABITS.flatMap(({ api, tele }) => [
    [`${tele} - Indicator`, api],
    [`${tele} - Quantity`, `${api}Quant`],
    [`${tele} - No. of Year`, `${api}Year`],
  ]),
);

/**
 * Special Medical: every test shares these header fields (mapping YAML, MENU 4).
 * API keys are read as the API sends them (V3): `testDate` and `doctorRegistrationNo`. `remark` and
 * `remarks` differ per test and are mapped per test below (open question 19).
 */
const SPECIAL_HEADER_KEYS: Readonly<Record<string, string>> = {
  "Medical Type": "medicalType",
  "Test Date": "testDate",
  "Examinee Name": "examineeName",
  "Examinee Age": "examineeAge",
  "Diagnostic Centre Name": "diagnosticCentreName",
  "Doctor Name": "doctorName",
  "Doctor Registration No": "doctorRegistrationNo",
};

const specialSource = (
  sectionKey: string,
  apiKey: string,
  keys: Readonly<Record<string, string>>,
): FieldSource => ({
  sectionKey,
  paths: [[apiKey]],
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
  "Doctor Registration No": "doctorRegistrationNo",
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
  paths: [[sectionKey]],
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
  paths: [[sectionKey]],
  keys: { ...OTHER_MEDICAL_HEADER_KEYS, Date: "date" },
}));

/**
 * Special Medical tests that show a read-only "CMO decision" table (prototype `cmoDecisionRowsBySection`).
 * The rows come from `cmo_decision.history[]` or `cmoDecisions[]` in the test's API object.
 */
const CMO_DECISION_SECTION_KEYS: ReadonlySet<string> = new Set(["2decho", "ecg", "tmt"]);

function mapCmoDecisions(raw: JsonRecord): readonly MedicalCmoDecision[] {
  const historyList =
    isRecord(raw.cmo_decision) && Array.isArray(raw.cmo_decision.history)
      ? raw.cmo_decision.history
      : Array.isArray(raw.cmoDecisions)
        ? raw.cmoDecisions
        : undefined;

  if (!historyList) return [];
  return historyList.filter(isRecord).map((row) => ({
    userName: rawText(row.userName),
    poolName: rawText(row.poolName),
    decision: rawText(row.decision),
    remarks: rawText(row.remarks),
    updatedOn: rawText(row.updatedOn),
  }));
}

export const FIELD_SOURCES: readonly FieldSource[] = [
  ...SPECIAL_MEDICAL_SOURCES,
  ...OTHER_MEDICAL_SOURCES,
  ...PARAMETER_LIST_SOURCES,

  {
    sectionKey: "application_form_medical_lifestyle",
    paths: [["application_form_medical"]],
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
      "Hazardous Occupation": "hazardousOccupation",
      "Illness Impairment": "illnessImpairment",
      Adverse: "adverse",
    },
  },
  {
    sectionKey: "mer",
    paths: [["mer", "details"], ["mer"]],
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
  {
    sectionKey: "measurement",
    paths: [["mer", "measurement"], ["measurement"]],
    keys: {
      "Height (cms)": ["heightCms", "heightCm"],
      "Height (Fts)": "heightFts",
      Inches: "inches",
      "Weight (Kgs)": ["weightKgs", "weightKg"],
      "Waist (cms)": ["waistCms", "waistCm"],
      "Hips (cms)": ["hipsCms", "hipsCm"],
      BMI: "bmi",
    },
  },
  {
    sectionKey: "tele_mer",
    paths: [["tele_mer", "details"], ["tele_mer"]],
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
    paths: [["tele_mer", "measurement"], ["tele_measurement"]],
    keys: {
      "Height (cms)": "heightCms",
      "Height (ft)": "heightFts",
      Inches: "inches",
      "Weight (kgs)": "weightKgs",
      BMI: "bmi",
    },
  },
  {
    sectionKey: "tele_disposition",
    paths: [["tele_mer", "disposition"], ["disposition"]],
    keys: { "TUW Status": "tuwStatus", Remark: "remark", Note: "note", Remarks2: "remarks2" },
  },
  {
    sectionKey: "bre_medical_decision",
    paths: [["bre_medical_decision"]],
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
  { sectionKey: "decision", paths: [["decision"]], keys: { "Medical Decision": "medicalDecision" } },
];

function applyFields(
  section: MedicalSection,
  source: FieldSource,
  raw: JsonRecord,
): MedicalSection {
  const fields = section.fields.map(([label, defaultValue, required]): MedicalFieldDef => {
    const apiKeyOrKeys = source.keys[label];
    let rawVal: unknown = undefined;
    if (typeof apiKeyOrKeys === "object") {
      for (const k of apiKeyOrKeys) {
        if (raw[k] !== undefined && raw[k] !== null) {
          rawVal = raw[k];
          break;
        }
      }
    } else if (typeof apiKeyOrKeys === "string") {
      rawVal = raw[apiKeyOrKeys];
    }

    const value =
      apiKeyOrKeys === undefined || rawVal === undefined
        ? defaultValue
        : normaliseValue(
            resolveMedicalControlKind(section.key, label),
            rawVal,
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
    if (isRecord(item)) {
      const name = rawText(item.parameter || item.paramName);
      if (name) items.set(name, item);
    }
  }
  const parameterValues = section.parameters.map(([name]): MedicalParameterValue => {
    const item = items.get(name);
    const dropdown = getMedicalParameterValidator(section.key, name, "value")?.options;
    const paramId = typeof item?.paramId === "number" ? item.paramId : undefined;
    const id = typeof item?.id === "string" ? item.id : undefined;
    return {
      value: normaliseValue("text", item?.value, dropdown?.map((option) => option.value)),
      from: rawText(item?.labRangeStart ?? item?.labRangeValueStart),
      to: rawText(item?.labRangeEnd ?? item?.labRangeValueEnd),
      unit: rawText(item?.unit ?? item?.unitsValue),
      ...(paramId !== undefined ? { paramId } : {}),
      ...(id !== undefined ? { id } : {}),
    };
  });
  return { ...section, parameterValues };
}

/* ------------------------------------------------------------------ */
/* Family history: members[] -> rows                                  */
/* ------------------------------------------------------------------ */

export const FAMILY_SOURCES: readonly { sectionKey: string; paths: readonly (readonly string[])[] }[] = [
  { sectionKey: "family_history_health_status", paths: [["mer", "family_history"], ["family_history"]] },
  { sectionKey: "tele_family_history", paths: [["tele_mer", "family_history"], ["tele_family_history"]] },
];

const titleCase = (text: string): string =>
  text === "" ? "" : text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

/** Normalises dead or alive status from V3 "ALIVE" / "DEAD" values. */
const normaliseAlive = (raw: unknown): string => {
  const text = rawText(raw);
  if (text.toUpperCase() === "ALIVE" || text.toUpperCase() === "A") return "Alive";
  if (text.toUpperCase() === "DEAD" || text.toUpperCase() === "D") return "Dead";
  return normaliseValue("deadOrAlive", text);
};

/** Maps V3 family members array into MedicalFamilyRow items. */
function mapFamilyRows(raw: JsonRecord, sectionKey: string): readonly MedicalFamilyRow[] | undefined {
  // A member the API deactivated (`isActive: "N"`) is no longer part of the family history.
  const members = Array.isArray(raw.members)
    ? raw.members.filter(isRecord).filter((member) => rawText(member.isActive).toUpperCase() !== "N")
    : [];
  if (members.length === 0) return undefined;
  return members.map((member) => {
    const age = rawText(member.age);
    const alive = normaliseAlive(member.deadOrAlive);
    // Tele Health Status is a dropdown (open question 14): a value outside the list is left empty.
    // MER Health Status is free text and is shown as sent.
    const health =
      sectionKey === "tele_family_history"
        ? normaliseValue("text", member.healthStatus, MEDICAL_SCHEMA_TELE_HEALTH_STATUS)
        : rawText(member.healthStatus);
    const memberId = typeof member.memberId === "number" ? member.memberId : undefined;
    return {
      relation: titleCase(rawText(member.relationType)),
      ...(age === "" ? {} : { age }),
      ...(alive === "" ? {} : { alive }),
      ...(health === "" ? {} : { health }),
      ...(memberId !== undefined ? { memberId } : {}),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Habit and Addictions: array of { habit, indicator, quantity, year } or flat object */
/* ------------------------------------------------------------------ */

export const HABIT_SOURCES: readonly { sectionKey: string; paths: readonly (readonly string[])[] }[] = [
  { sectionKey: "habit_addictions", paths: [["mer", "habit_and_addictions"], ["habit_and_addictions"]] },
  { sectionKey: "tele_habit_addiction", paths: [["tele_mer", "habit_and_addictions"], ["tele_habit_and_addictions"]] },
];

const NUMERIC_TEXT = /^\d+(\.\d+)?$/;

/** Habit Quantity is a number. Free text such as "5/day" cannot be held by the control, so it is left empty. */
function habitQuantity(raw: unknown): string {
  const text = rawText(raw);
  return NUMERIC_TEXT.test(text) ? text : "";
}

/** The array item of a habit, matched by name the way the labels have always been matched. */
function findHabitItem(items: readonly Record<string, unknown>[], baseName: string) {
  return items.find((entry) => {
    const h = rawText(entry.habit).toLowerCase();
    return (
      h.includes(baseName) ||
      baseName.includes(h) ||
      (baseName.includes("narcotic") && h.includes("narcotic")) ||
      (baseName.includes("narrotic") && h.includes("narcotic")) ||
      (baseName.includes("cigarette") && h.includes("cigarette")) ||
      (baseName.includes("gutka") && h.includes("gutka")) ||
      (baseName.includes("beer") && h.includes("beer"))
    );
  });
}

function mapHabits(section: MedicalSection, raw: unknown): MedicalSection {
  const rawArray = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.value)
      ? raw.value
      : undefined;

  if (rawArray) {
    const items = rawArray.filter(isRecord);
    const fields = section.fields.map(([label, defaultValue, required]): MedicalFieldDef => {
      const isInd = label.endsWith(" - Indicator");
      const isQuant = label.endsWith(" - Quantity");
      const isYear = label.endsWith(" - No. of Year");
      const baseName = label.replace(/ - (Indicator|Quantity|No\. of Year)$/, "").toLowerCase();

      const item = findHabitItem(items, baseName);

      let value = defaultValue;
      if (item) {
        if (isInd) value = normaliseValue("yesNo", item.indicator);
        else if (isQuant) value = habitQuantity(item.quantity);
        else if (isYear) value = normaliseValue("number", item.year);
      }
      return required === undefined ? [label, value] : [label, value, required];
    });
    // Kept so the save sends each habit back with the id it was fetched with.
    const habitIds: Record<string, number> = {};
    HABITS.forEach(({ api, tele }) => {
      const item = findHabitItem(items, tele.toLowerCase());
      if (item && typeof item.habitId === "number") habitIds[api] = item.habitId;
    });
    return { ...section, fields, ...(Object.keys(habitIds).length > 0 ? { habitIds } : {}) };
  } else if (isRecord(raw)) {
    const keys = section.key === "habit_addictions" ? MER_HABIT_KEYS : TELE_HABIT_KEYS;
    const mapped = applyFields(section, { sectionKey: section.key, paths: [[]], keys }, raw);
    return {
      ...mapped,
      fields: mapped.fields.map(([label, value, required]): MedicalFieldDef => {
        const fixed = label.endsWith(" - Quantity") ? habitQuantity(value) : value;
        return required === undefined ? [label, fixed] : [label, fixed, required];
      }),
    };
  }
  return section;
}

/* ------------------------------------------------------------------ */
/* Blood pressure: readings[] of { readingSeq, systolic, diastolic }  */
/* ------------------------------------------------------------------ */

export const BP_SECTION_KEY = "blood_pressure_pulse_details";

/**
 * Builds the BP & Pulse section with one slot per readingSeq (or readingId),
 * always showing at least slots 1-4. Avg Systolic, Avg Diastolic, and Pulse Rate
 * are populated directly from the API response root.
 */
function mapBloodPressure(raw: JsonRecord): MedicalSection {
  const systolic = new Map<number, string>();
  const diastolic = new Map<number, string>();
  const apiReadingIds: Record<string, number> = {};

  if (Array.isArray(raw.readings)) {
    // V3 format: readings[] of { readingId, readingSeq, systolic, diastolic }
    raw.readings.forEach((item, index) => {
      if (!isRecord(item)) return;
      const seq =
        typeof item.readingSeq === "number" && item.readingSeq >= 1
          ? item.readingSeq
          : index + 1;
      if (typeof item.readingId === "number") apiReadingIds[String(seq)] = item.readingId;
      if (item.systolic !== null && item.systolic !== undefined) {
        systolic.set(seq, normaliseValue("number", item.systolic));
      }
      if (item.diastolic !== null && item.diastolic !== undefined) {
        diastolic.set(seq, normaliseValue("number", item.diastolic));
      }
    });
  } else {
    // Fallback for legacy split arrays: systolic[] / diastolic[]
    if (Array.isArray(raw.systolic)) {
      for (const item of raw.systolic) {
        if (!isRecord(item)) continue;
        const id = item.readingId;
        if (typeof id === "number" && Number.isInteger(id) && id >= 1) {
          systolic.set(id, normaliseValue("number", item.value));
        }
      }
    }
    if (Array.isArray(raw.diastolic)) {
      for (const item of raw.diastolic) {
        if (!isRecord(item)) continue;
        const id = item.readingId;
        if (typeof id === "number" && Number.isInteger(id) && id >= 1) {
          diastolic.set(id, normaliseValue("number", item.value));
        }
      }
    }
  }

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
  return { ...section, fields, ...(Object.keys(apiReadingIds).length > 0 ? { readingIds: apiReadingIds } : {}) };
}

/* ------------------------------------------------------------------ */
/* Question tables: questionnaire[]                                   */
/* ------------------------------------------------------------------ */

export const QUESTIONNAIRE_SOURCES: readonly { sectionKey: string; paths: readonly (readonly string[])[] }[] = [
  { sectionKey: "question_table", paths: [["mer", "question_table"], ["question_table"]] },
  { sectionKey: "tele_question_table", paths: [["tele_mer", "question_table"], ["tele_question_table"], ["tele_mer"]] },
];

/* ------------------------------------------------------------------ */
/* Entry point                                                        */
/* ------------------------------------------------------------------ */

/**
 * Maps one section. Returns `undefined` when the API did not return that section, so the screen
 * shows only the sections the API sent. A section that is returned but empty (`{}`) is kept.
 * Sections the user fills in themselves (`alwaysEditable`, e.g. Decision) are kept regardless.
 */
function mapSection(section: MedicalSection, root: JsonRecord): MedicalSection | undefined {
  const absent = section.alwaysEditable ? section : undefined;

  if (section.key === BP_SECTION_KEY) {
    const raw = readFirstPath(root, [["mer", "blood_pressure_and_pulse"], ["blood_pressure_and_pulse"]]);
    return raw ? mapBloodPressure(raw) : absent;
  }

  const fieldSource = FIELD_SOURCES.find((source) => source.sectionKey === section.key);
  if (fieldSource) {
    let raw = readFirstPath(root, fieldSource.paths);
    if (section.key === "bre_medical_decision") {
      const stp = readFirstPath(root, [["tele_mer", "stp_details"], ["tele_stp_details"]]);
      if (stp) {
        raw = {
          ...(raw ?? {}),
          teleVideoMerDecision: stp.stpDecision ?? raw?.teleVideoMerDecision,
          teleVideoMerRemark: stp.stpRemarks ?? raw?.teleVideoMerRemark,
        };
      }
    }
    if (!raw) return absent;
    const testDtlId = typeof raw.testDtlId === "number" ? raw.testDtlId : undefined;
    const medAppDtlId = typeof raw.medAppDtlId === "number" ? raw.medAppDtlId : undefined;
    const paramId = typeof raw.paramId === "number" ? raw.paramId : undefined;
    const fieldIds = isRecord(raw.fieldIds) ? (raw.fieldIds as Readonly<Record<string, number | null>>) : undefined;
    const withMetadata: MedicalSection = {
      ...section,
      ...(testDtlId !== undefined ? { testDtlId } : {}),
      ...(medAppDtlId !== undefined ? { medAppDtlId } : {}),
      ...(paramId !== undefined ? { paramId } : {}),
      ...(fieldIds !== undefined ? { fieldIds } : {}),
    };
    const mapped = applyParameters(applyFields(withMetadata, fieldSource, raw), raw);
    return CMO_DECISION_SECTION_KEYS.has(section.key)
      ? { ...mapped, cmoDecisions: mapCmoDecisions(raw) }
      : mapped;
  }

  const habitSource = HABIT_SOURCES.find((source) => source.sectionKey === section.key);
  if (habitSource) {
    // Habits may be a flat object (V3, V4) or an array of { habit, indicator, quantity, year } (v2).
    const raw = readFirstNode(root, habitSource.paths);
    return raw ? mapHabits(section, raw) : absent;
  }

  const familySource = FAMILY_SOURCES.find((source) => source.sectionKey === section.key);
  if (familySource) {
    const raw = readFirstPath(root, familySource.paths);
    if (!raw) return absent;
    const familyRows = mapFamilyRows(raw, section.key);
    return familyRows ? { ...section, familyRows } : section;
  }

  const questionnaireSource = QUESTIONNAIRE_SOURCES.find(
    (source) => source.sectionKey === section.key,
  );
  if (questionnaireSource) {
    const raw = readFirstPath(root, questionnaireSource.paths);
    const rawList =
      raw && Array.isArray(raw.questions)
        ? raw.questions
        : raw && Array.isArray(raw.answers)
          ? raw.answers
          : raw && Array.isArray(raw.questionnaire)
            ? raw.questionnaire
            : undefined;
    return rawList
      ? { ...section, questionnaire: parseMedicalQuestionnaire(rawList) }
      : absent;
  }

  return section;
}

function extractSectionValues(section: MedicalSection): Record<string, string> {
  const values: Record<string, string> = {};
  section.fields.forEach(([, value], index) => {
    values[`${section.key}-${index}`] = value;
  });
  section.questionnaire?.forEach((question) => {
    values[`${section.key}-q-${question.id}-response`] = question.response ?? "";
    values[`${section.key}-q-${question.id}-remarks`] = question.remarks ?? "";
  });
  section.parameters?.forEach(([, unit], index) => {
    const fetched = section.parameterValues?.[index];
    values[`${section.key}-param-${index}-unit`] = fetched?.unit || unit;
    if (fetched) {
      values[`${section.key}-param-${index}-value`] = fetched.value;
      values[`${section.key}-param-${index}-from`] = fetched.from;
      values[`${section.key}-param-${index}-to`] = fetched.to;
    }
  });
  if (section.layout === "familyHistory") {
    const familyRows = section.familyRows ?? [];
    values[`${section.key}-rows`] = familyRows.map((_, i) => String(i + 1)).join(",");
    familyRows.forEach((row, i) => {
      const prefix = `${section.key}-row-${i + 1}`;
      values[`${prefix}-relation`] = row.relation;
      if (row.age !== undefined) values[`${prefix}-age`] = row.age;
      if (row.alive !== undefined) values[`${prefix}-alive`] = row.alive;
      if (row.health !== undefined) values[`${prefix}-health`] = row.health;
    });
  }
  return values;
}

function extractSectionHistory(
  section: MedicalSection,
  rawNode: unknown,
): readonly MedicalHistoryEntry[] | undefined {
  if (!isRecord(rawNode) || !Array.isArray(rawNode.history) || rawNode.history.length === 0) {
    return undefined;
  }
  const entries: MedicalHistoryEntry[] = [];
  rawNode.history.forEach((snapshot, index) => {
    if (!isRecord(snapshot) && !Array.isArray(snapshot)) return;
    const snapRecord: JsonRecord = isRecord(snapshot) ? snapshot : { value: snapshot };
    const date =
      rawText(snapRecord.dateOfExamination) ||
      rawText(snapRecord.testDate) ||
      rawText(snapRecord.date) ||
      rawText(snapRecord.dateTimeOfTeleCall) ||
      "";

    const label = date
      ? `Report Received: ${date}`
      : `Attempt ${index + 1}`;

    const id = rawText(snapRecord.testDtlId) || `hist-${section.key}-${index + 1}`;

    let mapped = section;
    const fieldSource = FIELD_SOURCES.find((s) => s.sectionKey === section.key);
    if (fieldSource) {
      mapped = applyParameters(applyFields(mapped, fieldSource, snapRecord), snapRecord);
    } else if (section.layout === "familyHistory") {
      const familyRows = mapFamilyRows(snapRecord, section.key);
      if (familyRows) mapped = { ...mapped, familyRows };
    } else if (section.layout === "habitAddiction") {
      mapped = mapHabits(mapped, snapRecord);
    } else if (section.layout === "questionnaire") {
      const qList = Array.isArray(snapRecord.questions)
        ? snapRecord.questions
        : Array.isArray(snapRecord.answers)
          ? snapRecord.answers
          : Array.isArray(snapshot)
            ? snapshot
            : undefined;
      if (qList) mapped = { ...mapped, questionnaire: parseMedicalQuestionnaire(qList) };
    } else if (section.key === BP_SECTION_KEY) {
      mapped = mapBloodPressure(snapRecord);
    }

    const values = extractSectionValues(mapped);
    entries.push({ id, label, values });
  });

  return entries.length > 0 ? entries : undefined;
}

/**
 * MER and Tele MER keep one `history[]` on the parent node (`sections.mer.history`,
 * `sections.tele_mer.history`). Each snapshot has the parent's own shape (`details`, `measurement`,
 * `family_history` ...), so it is mapped with the same section mappers as the live data. Every
 * snapshot becomes one record, with the same id in each sub section, so the History popup can
 * switch all sub sections together.
 */
const PARENT_HISTORY_SOURCES: readonly { groupKey: string; parentKey: string }[] = [
  { groupKey: "mer", parentKey: "mer" },
  { groupKey: "tele_video_mer", parentKey: "tele_mer" },
];

function extractParentHistory(
  parentKey: string,
  groupSections: readonly MedicalSection[],
  root: JsonRecord,
): Record<string, MedicalHistoryEntry[]> | undefined {
  const parent = root[parentKey];
  if (!isRecord(parent) || !Array.isArray(parent.history) || parent.history.length === 0) {
    return undefined;
  }
  const result: Record<string, MedicalHistoryEntry[]> = {};
  parent.history.forEach((snapshot, index) => {
    if (!isRecord(snapshot)) return;
    const details = isRecord(snapshot.details) ? snapshot.details : snapshot;
    const date =
      rawText(details.dateOfExamination) ||
      rawText(details.dateTimeOfTeleCall) ||
      rawText(details.testDate) ||
      rawText(details.date);
    const label = date ? `Report Received: ${date}` : `Attempt ${index + 1}`;
    const id = `hist-${parentKey}-${index + 1}`;
    const snapshotRoot: JsonRecord = { [parentKey]: snapshot };
    groupSections.forEach((section) => {
      const mapped = mapSection(section, snapshotRoot);
      if (!mapped) return;
      (result[section.key] ??= []).push({ id, label, values: extractSectionValues(mapped) });
    });
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Builds the View Medical sections and groups from a fetch response.
 * Returns null when the response has no `data.sections` ("not found"); never defaults to other data.
 * Throws when a questionnaire row has an invalid shape.
 */
export function mapMedicalFetchPayload(payload: unknown): MedicalFetchResult | null {
  if (!isRecord(payload)) return null;

  const payloadData =
    isRecord(payload.response) && isRecord(payload.response.data)
      ? payload.response.data
      : isRecord(payload.data)
        ? payload.data
        : null;

  if (!isRecord(payloadData) || !isRecord(payloadData.sections)) {
    return null;
  }
  const root = payloadData.sections;
  const examId = typeof payloadData.examId === "number" ? payloadData.examId : undefined;
  const medAppDtlId = typeof payloadData.medAppDtlId === "number" ? payloadData.medAppDtlId : undefined;
  const sections = MEDICAL_SECTIONS.flatMap((section) => {
    const mapped = mapSection(section, root);
    return mapped ? [mapped] : [];
  });
  const byKey = new Map(sections.map((section) => [section.key, section]));
  const groups = MEDICAL_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.flatMap((section) => {
      const mapped = byKey.get(section.key);
      return mapped ? [mapped] : [];
    }),
  })).filter((group) => group.sections.length > 0);

  const historyMap: Record<string, readonly MedicalHistoryEntry[]> = {};
  // MER / Tele MER: history lives on the parent node and covers all of its sub sections.
  const parentHistoryKeys = new Set<string>();
  PARENT_HISTORY_SOURCES.forEach(({ groupKey, parentKey }) => {
    const group = groups.find((item) => item.key === groupKey);
    if (!group) return;
    const parentHistory = extractParentHistory(parentKey, group.sections, root);
    if (!parentHistory) return;
    Object.assign(historyMap, parentHistory);
    group.sections.forEach((section) => parentHistoryKeys.add(section.key));
  });
  sections.forEach((section) => {
    if (parentHistoryKeys.has(section.key)) return;
    let rawNode: unknown = undefined;
    if (section.key === BP_SECTION_KEY) {
      rawNode = readFirstPath(root, [["mer", "blood_pressure_and_pulse"], ["blood_pressure_and_pulse"]]);
    } else {
      const fieldSource = FIELD_SOURCES.find((s) => s.sectionKey === section.key);
      if (fieldSource) rawNode = readFirstPath(root, fieldSource.paths);
      else {
        const habitSource = HABIT_SOURCES.find((s) => s.sectionKey === section.key);
        if (habitSource) rawNode = readFirstPath(root, habitSource.paths);
        else {
          const familySource = FAMILY_SOURCES.find((s) => s.sectionKey === section.key);
          if (familySource) rawNode = readFirstPath(root, familySource.paths);
          else {
            const qSource = QUESTIONNAIRE_SOURCES.find((s) => s.sectionKey === section.key);
            if (qSource) rawNode = readFirstPath(root, qSource.paths);
          }
        }
      }
    }
    const entries = extractSectionHistory(section, rawNode);
    if (entries) historyMap[section.key] = entries;
  });

  return {
    sections,
    groups,
    ...(examId !== undefined ? { examId } : {}),
    ...(medAppDtlId !== undefined ? { medAppDtlId } : {}),
    ...(Object.keys(historyMap).length > 0 ? { history: historyMap } : {}),
  };
}
