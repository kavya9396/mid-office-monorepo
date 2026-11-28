import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMasterData, setMasterData } from "@insurance-poc/utils";
import medicalDataFetchMock from "../../../../../mock/medical/medical-data-fetch.json";
import type { MedicalSection } from "./medical.config";
import { getMedicalOptions, resolveMedicalControlKind } from "./medical.config";
import { mapMedicalFetchPayload } from "./medical.mapper";
import { buildMedicalSaveRequest } from "./medical.save";
import {
  getMedicalFieldValidator,
  getMedicalMasterEntries,
  getMedicalParameterValidator,
} from "./medical.schema";

const entry = (code: string, description: string, isActive = "Y", type?: string) => ({
  code,
  description,
  value: null,
  isActive,
  ...(type ? { type } : {}),
});

/** The shape of the post-login master data for the lists the Medical screen reads (incl. `misc` rows by type). */
const loadMasters = () =>
  setMasterData({
    data: {
      gender: [entry("F", "Female"), entry("M", "Male"), entry("TG", "Transgender")],
      education: [entry("GRAD", "Graduate"), entry("PG", "Post Graduate")],
      occupation: [
        entry("SAL", "Salaried"),
        entry("Salaried", "Salaried"),
        entry("OLD", "Retired", "N"),
      ],
      misc: [
        entry("Y", "Yes", "Y", "YESNO"),
        entry("N", "No", "Y", "YESNO"),
        entry("CLN", "Clinic", "Y", "EXAM_PL"),
        entry("RES_OFF", "Res/Office", "Y", "EXAM_PL"),
        entry("SAL", "Salaried", "Y", "OCCUPATION"),
        entry("AGRI", "Agriculturalist", "Y", "OCCUPATION"),
        entry("GRAD", "Graduate", "Y", "EDUCATION"),
        entry("PG", "Post Graduate", "Y", "EDUCATION"),
        entry("1", "Material", "Y", "MED_TELE_DISCLOSURE"),
        entry("2", "Non-Material", "Y", "MED_TELE_DISCLOSURE"),
        entry("1", "Video MER", "Y", "MED_TELE_MER_DETAIL"),
        entry("2", "Tele MER", "Y", "MED_TELE_MER_DETAIL"),
        entry("1", "single", "Y", "MED_TELE_ADV"),
        entry("3", "No adversity", "Y", "MED_TELE_ADV"),
        entry("BRO", "BROTHER", "Y", "RELATION"),
        entry("SIS", "SISTER", "Y", "RELATION"),
        entry("DEAD", "DEAD", "Y", "DEAD_ALIVE"),
        entry("ALIVE", "ALIVE", "Y", "DEAD_ALIVE"),
        entry("PAST_MED", "PAST MEDICAL", "Y", "MEDICAL_TYPE"),
        entry("REG_MED", "REGULAR MEDICAL", "Y", "MEDICAL_TYPE"),
        entry("NORMAL", "Normal", "Y", "FINDINGS"),
        entry("MILD_CHG", "Mild Changes", "Y", "FINDINGS"),
        entry("NORMAL", "Normal", "Y", "SM_FINDINGS"),
        entry("ABNORMAL", "Abnormal", "Y", "SM_FINDINGS"),
        entry("LAD", "LAD", "Y", "AXIS"),
        entry("NORMAL", "Normal", "Y", "AXIS"),
        entry("9", "9", "Y", "METS"),
        entry("10", "10", "Y", "METS"),
        entry("NEG_NR", "Negative/Non Reactive", "Y", "VALUE"),
        entry("POS_R", "Positive/Reactive", "Y", "VALUE"),
        entry("PRESENT", "Present", "Y", "KETONE_BODIES"),
        entry("NIL_ABS", "Nil/Absent", "Y", "KETONE_BODIES"),
        entry("NIL_ABS", "Nil/Absent", "Y", "SUGAR_GLYCOSURIA"),
        entry("PLUS_1", "+", "Y", "SUGAR_GLYCOSURIA"),
        entry("NIL_ABS", "Nil/Absent", "Y", "ALBUMIN_PROTEINURIA"),
        entry("NIL_OCC", "Nil/Absent/Occ", "Y", "RBC_HAEMATURIA"),
        entry("CLEAR", "Clear", "Y", "URINE_COLOUR"),
        entry("CLEAR", "Clear", "Y", "URINE_APPEARANCE"),
        entry("TURBID", "Turbid", "Y", "URINE_APPEARANCE"),
      ],
    },
    unknownTypes: [],
  });

const sectionOf = (key: string): MedicalSection => {
  const section = mapMedicalFetchPayload(medicalDataFetchMock)?.sections.find((item) => item.key === key);
  if (!section) throw new Error(`Section ${key} not mapped`);
  return section;
};

const valueOf = (section: MedicalSection, label: string): string =>
  section.fields.find(([fieldLabel]) => fieldLabel === label)?.[1] ?? "";

const storeValues = (section: MedicalSection): Record<string, string> =>
  Object.fromEntries(section.fields.map(([, value], index) => [`${section.key}-${index}`, value]));

describe("Medical coded dropdowns read from the master", () => {
  beforeEach(() => {
    clearMasterData();
  });
  afterEach(() => {
    clearMasterData();
  });

  it("offers no options while the master is not loaded (nothing is hardcoded)", () => {
    expect(getMedicalOptions("gender")).toEqual([]);
    expect(getMedicalOptions("miscYesNo")).toEqual([]);
    expect(getMedicalOptions("placeOfExamination")).toEqual([]);
    expect(getMedicalOptions("miscOccupation")).toEqual([]);
    expect(getMedicalOptions("teleDisclosure")).toEqual([]);
    expect(getMedicalOptions("familyRelation")).toEqual([]);
    expect(getMedicalOptions("deadOrAlive")).toEqual([]);
    expect(getMedicalOptions("healthStatus")).toEqual([]);
    expect(getMedicalFieldValidator("2decho", "Medical Type")?.options).toEqual([]);
    expect(getMedicalFieldValidator("cot", "Value")?.options).toEqual([]);
    expect(getMedicalParameterValidator("rua_group", "Urine_Blood", "value")?.options).toEqual([]);
    expect(getMedicalFieldValidator("2decho", "Findings")?.validate("NORMAL")).toBe("Findings has an invalid selection");
  });

  it("uses the master code as the value and the description as the label", () => {
    loadMasters();
    expect(getMedicalOptions("gender")).toEqual([
      { label: "Female", value: "F" },
      { label: "Male", value: "M" },
      { label: "Transgender", value: "TG" },
    ]);
  });

  it("skips inactive entries and repeated descriptions", () => {
    loadMasters();
    expect(getMedicalMasterEntries("occupation")).toEqual([{ label: "Salaried", value: "SAL" }]);
  });

  it("shows the fetched code, so MER gender 'M' and occupation 'SAL' are kept", () => {
    loadMasters();
    const mer = sectionOf("mer");
    expect(valueOf(mer, "Gender")).toBe("M");
    expect(valueOf(mer, "Examinee Education SD")).toBe("GRAD");
    expect(valueOf(mer, "Examinee Occupation SD")).toBe("SAL");
    const tele = sectionOf("tele_mer");
    expect(valueOf(tele, "Gender")).toBe("F");
    expect(valueOf(tele, "Education")).toBe("PG");
  });

  it("sends the master code on save", () => {
    loadMasters();
    const mer = sectionOf("mer");
    const request = buildMedicalSaveRequest({
      applicationNumber: "OS90377743",
      partyId: "party-1",
      createdBy: "UW002",
      sections: [mer],
      values: storeValues(mer),
    });
    const details = (request.sections.mer as { details: Record<string, unknown> }).details;
    expect(details.gender).toBe("M");
    expect(details.examineeEducationSd).toBe("GRAD");
    expect(details.examineeOccupationSd).toBe("SAL");
  });

  it("sends the code of a value the user picked, for Examinee Gender on an Other Medical test", () => {
    loadMasters();
    const fbs = sectionOf("fbs");
    const index = fbs.fields.findIndex(([label]) => label === "Examinee Gender");
    const request = buildMedicalSaveRequest({
      applicationNumber: "OS90377743",
      partyId: "party-1",
      createdBy: "UW002",
      sections: [fbs],
      values: { ...storeValues(fbs), [`fbs-${index}`]: "F" },
    });
    expect((request.sections.fbs as Record<string, unknown>).examineeGender).toBe("F");
  });

  it("reads the MER Yes/No, Place of Examination and Occupation dropdowns from the misc master", () => {
    loadMasters();
    expect(getMedicalOptions("miscYesNo")).toEqual([
      { label: "Yes", value: "Y" },
      { label: "No", value: "N" },
    ]);
    expect(getMedicalOptions("placeOfExamination")).toEqual([
      { label: "Clinic", value: "CLN" },
      { label: "Res/Office", value: "RES_OFF" },
    ]);
    expect(getMedicalOptions("miscOccupation").map((option) => option.value)).toEqual(["SAL", "AGRI"]);
  });

  it("validates the MER misc dropdowns against the misc master codes", () => {
    loadMasters();
    const yesNo = getMedicalFieldValidator("mer", "Is MER name same as proposal name?");
    expect(yesNo?.validate("Y")).toBeUndefined();
    expect(yesNo?.validate("Yes")).toBe("Is MER name same as proposal name? has an invalid selection");
    const place = getMedicalFieldValidator("mer", "Place of Examination");
    expect(place?.validate("CLN")).toBeUndefined();
    expect(place?.validate("CLINIC")).toBe("Place of Examination has an invalid selection");
  });

  it("reads Relation and Dead or alive from the misc master", () => {
    loadMasters();
    expect(getMedicalOptions("familyRelation")).toEqual([
      { label: "BROTHER", value: "BRO" },
      { label: "SISTER", value: "SIS" },
    ]);
    expect(getMedicalOptions("deadOrAlive")).toEqual([
      { label: "DEAD", value: "DEAD" },
      { label: "ALIVE", value: "ALIVE" },
    ]);
  });

  it("shows the fetched family members with the master relation code and sends it back", () => {
    loadMasters();
    const family = sectionOf("family_history");
    const rows = family.familyRows ?? [];
    expect(rows.find((row) => row.relation === "BRO")?.alive).toBe("ALIVE");
    const request = buildMedicalSaveRequest({
      applicationNumber: "OS90377743",
      partyId: "party-1",
      createdBy: "UW002",
      sections: [family],
      values: {
        [`${family.key}-rows`]: rows.map((_, i) => String(i + 1)).join(","),
        ...Object.fromEntries(
          rows.flatMap((row, i) => [
            [`${family.key}-row-${i + 1}-relation`, row.relation],
            [`${family.key}-row-${i + 1}-alive`, row.alive ?? ""],
          ]),
        ),
      },
    });
    const members = (request.sections.mer as { family_history: { members: Record<string, unknown>[] } })
      .family_history.members;
    expect(members.some((member) => member.relationType === "BRO" && member.deadOrAlive === "ALIVE")).toBe(true);
  });

  it("uses the misc YESNO master for the habit indicator and sends its code", () => {
    loadMasters();
    expect(getMedicalOptions("miscYesNo").map((option) => option.value)).toEqual(["Y", "N"]);
    const habit = sectionOf("habit_and_addictions");
    expect(valueOf(habit, "Cigarettes/beedis/cigar - Indicator")).toBe("Y");
    const body = (
      buildMedicalSaveRequest({
        applicationNumber: "OS90377743",
        partyId: "party-1",
        createdBy: "UW002",
        sections: [habit],
        values: storeValues(habit),
      }).sections.mer as { habit_and_addictions: Record<string, unknown> }
    ).habit_and_addictions;
    expect(body.cigarettesBeedisCigar).toBe("Y");
    const validator = getMedicalFieldValidator("habit_and_addictions", "Cigarettes/beedis/cigar - Quantity");
    expect(validator?.validate("", "Y")).toBe("Cigarettes/beedis/cigar Quant is required");
    expect(validator?.validate("", "N")).toBeUndefined();
  });

  it("wires every Yes / No question of the Question Table to the misc YESNO master", () => {
    loadMasters();
    const questions = sectionOf("question_table").questionnaire ?? [];
    const yesNo = questions.filter((question) => (question.answerType?.length ?? 0) === 2);
    expect(yesNo.length).toBeGreaterThan(0);
    yesNo.forEach((question) => {
      expect(question.answerType?.map((option) => option.key)).toEqual(["Y", "N"]);
      expect(question.answerType?.map((option) => option.label)).toEqual(["Yes", "No"]);
    });
    expect(questions.find((question) => question.id === "2.a")?.response).toBe("N");
    expect(questions.find((question) => question.id === "2.b")?.response).toBe("Y");
  });

  it("reads every Tele/Video MER dropdown from the misc master", () => {
    loadMasters();
    expect(getMedicalOptions("miscEducation").map((option) => option.value)).toEqual(["GRAD", "PG"]);
    expect(getMedicalOptions("miscOccupation").map((option) => option.value)).toEqual(["SAL", "AGRI"]);
    expect(getMedicalOptions("teleDisclosure")).toEqual([
      { label: "Material", value: "1" },
      { label: "Non-Material", value: "2" },
    ]);
    expect(getMedicalOptions("teleMerDetail")).toEqual([
      { label: "Video MER", value: "1" },
      { label: "Tele MER", value: "2" },
    ]);
    expect(getMedicalOptions("teleAdversity").map((option) => option.label)).toEqual(["single", "No adversity"]);
    ["Telephonic MER", "Previous Insurance Declined", "Medical Treatment"].forEach((label) => {
      expect(resolveMedicalControlKind("tele_mer", label)).toBe("miscYesNo");
    });
  });

  it("shows the fetched Tele/Video MER values as master codes and sends them back", () => {
    loadMasters();
    const tele = sectionOf("tele_mer");
    expect(valueOf(tele, "Education")).toBe("PG");
    expect(valueOf(tele, "Occupation")).toBe("SAL");
    expect(valueOf(tele, "Disclosure")).toBe("1");
    expect(valueOf(tele, "MER Detail")).toBe("1");
    const details = (
      buildMedicalSaveRequest({
        applicationNumber: "OS90377743",
        partyId: "party-1",
        createdBy: "UW002",
        sections: [tele],
        values: storeValues(tele),
      }).sections.tele_mer as { details: Record<string, unknown> }
    ).details;
    expect(details.disclosure).toBe("1");
    expect(details.merDetail).toBe("1");
    expect(details.education).toBe("PG");
  });

  it("validates the Tele/Video MER misc dropdowns against the master codes", () => {
    loadMasters();
    const disclosure = getMedicalFieldValidator("tele_mer", "Disclosure");
    expect(disclosure?.validate("1")).toBeUndefined();
    expect(disclosure?.validate("Material")).toBe("Disclosure has an invalid selection");
    const yesNo = getMedicalFieldValidator("tele_mer", "Telephonic MER");
    expect(yesNo?.validate("Y")).toBeUndefined();
    expect(yesNo?.validate("")).toBe("Telephonic MER is required");
  });
  it("reads the Special Medical dropdowns from the misc master by row type", () => {
    loadMasters();
    const values = (section: string, label: string) =>
      getMedicalFieldValidator(section, label)?.options?.map((option) => option.value);
    expect(values("2decho", "Medical Type")).toEqual(["PAST_MED", "REG_MED"]);
    expect(values("2decho", "Findings")).toEqual(["NORMAL", "MILD_CHG"]);
    expect(values("2decho", "Rejection Abnormality")).toEqual(["NORMAL", "ABNORMAL"]);
    expect(values("exercise_stress_echocardiogram", "Findings")).toEqual(["NORMAL", "MILD_CHG"]);
    expect(values("ecg", "Axis")).toEqual(["LAD", "NORMAL"]);
    expect(values("tmt", "METS")).toEqual(["9", "10"]);
    expect(values("tmt", "Findings")).toEqual(["NORMAL", "MILD_CHG"]);
    expect(values("pft", "Medical Type")).toEqual(["PAST_MED", "REG_MED"]);
    expect(values("blood_urea_and_nitro", "Medical Type")).toEqual(["PAST_MED", "REG_MED"]);
    ["cxr", "mammogram", "pap_smear", "stool_test", "usg", "fundoscopy_test"].forEach((section) => {
      expect(values(section, "Findings")).toEqual(["NORMAL", "ABNORMAL"]);
    });
  });

  it("shows the fetched Special Medical values as master codes and sends them back", () => {
    loadMasters();
    const tmt = sectionOf("tmt");
    expect(valueOf(tmt, "Medical Type")).toBe("REG_MED");
    expect(valueOf(tmt, "METS")).toBe("10");
    const ecg = sectionOf("ecg");
    expect(valueOf(ecg, "Findings")).toBe("NORMAL");
    expect(valueOf(ecg, "Axis")).toBe("NORMAL");
    const fields = (
      buildMedicalSaveRequest({
        applicationNumber: "OS90377743",
        partyId: "party-1",
        createdBy: "UW002",
        sections: [ecg],
        values: storeValues(ecg),
      }).sections.ecg as { fields?: Record<string, unknown> } & Record<string, unknown>
    );
    expect(JSON.stringify(fields)).toContain("REG_MED");
  });

  it("validates the Special Medical dropdowns against the master codes", () => {
    loadMasters();
    const findings = getMedicalFieldValidator("2decho", "Findings");
    expect(findings?.validate("MILD_CHG")).toBeUndefined();
    expect(findings?.validate("Mild Changes")).toBe("Findings has an invalid selection");
    expect(findings?.validate("")).toBe("Findings is required");
    expect(getMedicalFieldValidator("pft", "Medical Type")?.validate("REG_MED")).toBeUndefined();
    expect(getMedicalFieldValidator("pft", "Medical Type")?.validate("")).toBe("Medical Type is required");
    expect(getMedicalFieldValidator("ecg", "Axis")?.validate("LAD")).toBeUndefined();
  });

  it("reads the Other Medical Value dropdowns from the misc master", () => {
    loadMasters();
    const values = (section: string, label: string) =>
      getMedicalFieldValidator(section, label)?.options?.map((option) => option.value);
    ["cot", "hbsag", "hiv_elisa", "hiv_western_blot", "hcv"].forEach((section) => {
      expect(values(section, "Value")).toEqual(["NEG_NR", "POS_R"]);
      expect(values(section, "Medical Type")).toEqual(["PAST_MED", "REG_MED"]);
    });
    expect(values("serum_cotinine", "Value")).toEqual(["PRESENT", "NIL_ABS"]);
    expect(values("fbs", "Value")).toBeUndefined();
    expect(getMedicalFieldValidator("cot", "Value")?.validate("POS_R")).toBeUndefined();
    expect(getMedicalFieldValidator("cot", "Value")?.validate("Positive/Reactive")).toBe(
      "Value has an invalid selection",
    );
    expect(getMedicalFieldValidator("serum_cotinine", "Value")?.validate("PRESENT")).toBeUndefined();
    expect(getMedicalFieldValidator("cot", "Value")?.validate("")).toBe("Value is required");
  });

  it("reads the RUA Group parameter dropdowns from the misc master", () => {
    loadMasters();
    const options = (name: string) =>
      getMedicalParameterValidator("rua_group", name, "value")?.options?.map((option) => option.value);
    expect(options("Sugar/Glycosuria")).toEqual(["NIL_ABS", "PLUS_1"]);
    expect(options("Albumin/Proteinuria")).toEqual(["NIL_ABS"]);
    expect(options("RBC/Haematuria")).toEqual(["NIL_OCC"]);
    expect(options("Ketone Bodies")).toEqual(["PRESENT", "NIL_ABS"]);
    expect(options("Urine_Colour")).toEqual(["CLEAR"]);
    expect(options("Urine_Appearance")).toEqual(["CLEAR", "TURBID"]);
    ["Urine_Blood", "Urine_Nitrite", "Urine_Bile_Salts", "Urine_Bile_Pigment", "Urine_Bilirubin"].forEach((name) => {
      expect(options(name)).toEqual(["NEG_NR", "POS_R"]);
    });
    ["Urine_Urobilinogen", "Urine_Bacteria", "Urine_Casts", "Urine_Crystal", "Urine_Deposit"].forEach((name) => {
      expect(options(name)).toEqual(["PRESENT", "NIL_ABS"]);
    });
    expect(options("Gravity")).toBeUndefined();
    const sugar = getMedicalParameterValidator("rua_group", "Sugar/Glycosuria", "value");
    expect(sugar?.validate("PLUS_1")).toBeUndefined();
    expect(sugar?.validate("+")).toBe("Sugar/Glycosuria has an invalid selection");
    expect(sugar?.validate("")).toBe("Sugar/Glycosuria is required");
    expect(getMedicalParameterValidator("rua_group", "Urine_Colour", "value")?.validate("")).toBeUndefined();
  });

  it("validates against the master codes, not the descriptions", () => {
    loadMasters();
    const validator = getMedicalFieldValidator("mer", "Gender");
    expect(validator?.validate("M")).toBeUndefined();
    expect(validator?.validate("Male")).toBe("Gender has an invalid selection");
    expect(validator?.validate("")).toBe("Gender is required");
  });
});
