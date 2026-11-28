import { afterEach, describe, expect, it } from "vitest";
import { clearMasterData, setMasterData } from "@insurance-poc/utils";
import {
  buildMedicalDocumentOptions,
  getMedicalDocumentSectionKeys,
  MEDICAL_GROUPS,
  MEDICAL_NON_EDITABLE_SECTION_KEYS,
  MEDICAL_SECTIONS,
  medicalModeCanEdit,
  medicalModeCanReview,
  omitHiddenMedicalSections,
  resolveMedicalActionMode,
  type MedicalDocument,
} from "./medical.config";
import { mapMedicalFetchPayload } from "./medical.mapper";

const doc = (code: string, description: string, value: string): MedicalDocument => ({
  code,
  description,
  value,
});

/** A trimmed `table_of_medical_documents`: MER (parent + document), Special medical (parent + 2), Tele/Video MER, Decision. */
const DOCUMENTS: MedicalDocument[] = [
  doc("010", "MER", "mer"),
  doc("010.01", "MER", "mer"),
  doc("010.02", "Habit and Addictions", "habit_and_addictions"),
  doc("020", "Special medical", "special_medical"),
  doc("020.03", "CXR", "cxr"),
  doc("020.06", "ECG", "ecg"),
  doc("040", "Tele/Video MER", "tele_mer"),
  doc("050", "Decision", "decision"),
];

const masterEntry = (code: string, description: string, value: string, isActive = "Y") => ({
  code,
  description,
  value,
  isActive,
  type: "MED_DOC_TABLE",
});

const loadDocumentMaster = () =>
  setMasterData({
    data: {
      misc: [
        masterEntry("010", "MER", "mer"),
        masterEntry("010.01", "MER", "mer"),
        masterEntry("010.02", "Habit and Addictions", "habit_and_addictions"),
        masterEntry("020", "Special medical", "special_medical"),
        masterEntry("020.03", "CXR", "cxr"),
        masterEntry("020.06", "ECG", "ecg"),
        masterEntry("020.09", "PFT", "pft"),
        masterEntry("020.10", "STOOL TEST", "stool_test", "N"),
        masterEntry("040", "Tele/Video MER", "tele_mer"),
        masterEntry("050", "Decision", "decision"),
      ],
    },
    unknownTypes: [],
  });

afterEach(() => clearMasterData());

describe("getMedicalDocumentSectionKeys", () => {
  it("skips an accordion title that has documents under it, keeps the document of the same name", () => {
    const keys = getMedicalDocumentSectionKeys(DOCUMENTS);
    expect(keys.has("mer")).toBe(true);
    expect(keys.has("special_medical")).toBe(false);
    expect(keys.has("cxr")).toBe(true);
    expect(keys.has("habit_and_addictions")).toBe(true);
  });

  it("lists Tele/Video MER as one document that brings its sub sections", () => {
    const keys = getMedicalDocumentSectionKeys(DOCUMENTS);
    expect(keys.has("tele_mer")).toBe(true);
    expect(keys.has("tele_family_history")).toBe(true);
    expect(keys.has("tele_disposition")).toBe(true);
  });
});

describe("mapMedicalFetchPayload with table_of_medical_documents", () => {
  const payload = (documents: MedicalDocument[] | undefined) => ({
    data: {
      ...(documents ? { table_of_medical_documents: documents } : {}),
      sections: {
        mer: { details: { firstName: "Ravi" } },
        cxr: { findings: "Normal" },
        pft: { remarks: "r" },
      },
    },
  });

  it("shows exactly the listed documents, as empty sections when the API sent no data for them", () => {
    const result = mapMedicalFetchPayload(payload(DOCUMENTS));
    const keys = result?.sections.map((section) => section.key);
    expect(keys).toContain("mer");
    expect(keys).toContain("cxr");
    expect(keys).toContain("ecg");
    expect(keys).toContain("habit_and_addictions");
    expect(keys).toContain("tele_mer");
    expect(keys).toContain("decision");
  });

  it("hides a section the API sent but the table does not list", () => {
    const result = mapMedicalFetchPayload(payload(DOCUMENTS));
    expect(result?.sections.map((section) => section.key)).not.toContain("pft");
  });

  it("builds the left groups from the listed documents only", () => {
    const result = mapMedicalFetchPayload(payload(DOCUMENTS));
    expect(result?.groups.map((group) => group.key)).toEqual(["mer", "tele_video_mer", "special_medical", "decision"].filter(
      (key) => result?.groups.some((group) => group.key === key),
    ));
    expect(result?.groups.find((group) => group.key === "special_medical")?.sections.map((s) => s.key)).toEqual([
      "cxr",
      "ecg",
    ]);
    expect(result?.groups.some((group) => group.key === "other_medical")).toBe(false);
  });

  it("keeps the old behaviour (only the sections the API sent) when the response has no table", () => {
    const result = mapMedicalFetchPayload(payload(undefined));
    expect(result?.sections.map((section) => section.key)).toEqual(["mer", "cxr", "pft", "decision"]);
  });
});

describe("buildMedicalDocumentOptions", () => {
  const offerable = new Set(
    MEDICAL_SECTIONS.map((section) => section.key).filter((key) => !MEDICAL_NON_EDITABLE_SECTION_KEYS.includes(key)),
  );

  it("is undefined while the master is not loaded, so the caller falls back to the built-in catalog", () => {
    expect(buildMedicalDocumentOptions(new Set(), offerable)).toBeUndefined();
  });

  it("lists the master documents that are not shown yet, by section key", () => {
    loadDocumentMaster();
    const options = buildMedicalDocumentOptions(new Set(["mer", "cxr"]), offerable);
    expect(options).toEqual([
      { label: "Habit and Addictions", value: "habit_and_addictions" },
      { label: "ECG", value: "ecg" },
      { label: "PFT", value: "pft" },
      { label: "Tele/Video MER", value: "tele_mer" },
    ]);
  });

  it("does not offer accordion titles, inactive documents, display-only documents or duplicates", () => {
    loadDocumentMaster();
    const values = (buildMedicalDocumentOptions(new Set(), offerable) ?? []).map((option) => option.value);
    expect(values).not.toContain("special_medical");
    expect(values).not.toContain("stool_test");
    expect(values).not.toContain("decision");
    expect(values.filter((value) => value === "mer")).toHaveLength(1);
  });

  it("is empty once every document is shown", () => {
    loadDocumentMaster();
    const all = new Set(["mer", "habit_and_addictions", "cxr", "ecg", "pft", "tele_mer"]);
    expect(buildMedicalDocumentOptions(all, offerable)).toEqual([]);
  });
});

describe("omitHiddenMedicalSections", () => {
  it("returns the same lists when nothing is hidden", () => {
    const result = omitHiddenMedicalSections(MEDICAL_SECTIONS, MEDICAL_GROUPS, undefined);
    expect(result.sections).toBe(MEDICAL_SECTIONS);
    expect(result.groups).toBe(MEDICAL_GROUPS);
    expect(omitHiddenMedicalSections(MEDICAL_SECTIONS, MEDICAL_GROUPS, []).sections).toBe(MEDICAL_SECTIONS);
  });

  it("drops the hidden sections and the groups left empty", () => {
    const hidden = ["bre_medical_decision", "decision"];
    const result = omitHiddenMedicalSections(MEDICAL_SECTIONS, MEDICAL_GROUPS, hidden);
    expect(result.sections.some((section) => hidden.includes(section.key))).toBe(false);
    expect(result.groups.flatMap((group) => group.sections).some((s) => hidden.includes(s.key))).toBe(false);
    expect(result.groups.every((group) => group.sections.length > 0)).toBe(true);
    expect(result.sections.length).toBe(MEDICAL_SECTIONS.length - 2);
  });
});

describe("resolveMedicalActionMode", () => {
  const ecg = { key: "ecg" };
  const decision = { key: "decision", alwaysEditable: true };

  it("keeps the built-in behaviour without a config", () => {
    expect(resolveMedicalActionMode(ecg)).toBe("edit");
    expect(resolveMedicalActionMode({ key: "application_form_medical" })).toBe("readOnly");
    expect(resolveMedicalActionMode({ key: "bre_medical_decision" })).toBe("readOnly");
    expect(resolveMedicalActionMode(decision)).toBe("edit");
  });

  it("applies defaultMode, and a per-section mode wins over it", () => {
    const actions = { defaultMode: "readOnly", sectionModes: { ecg: "editAndReview" } } as const;
    expect(resolveMedicalActionMode({ key: "cxr" }, actions)).toBe("readOnly");
    expect(resolveMedicalActionMode(ecg, actions)).toBe("editAndReview");
  });

  it("keeps display-only sections read-only whatever the default is", () => {
    expect(resolveMedicalActionMode({ key: "application_form_medical" }, { defaultMode: "edit" })).toBe("readOnly");
  });

  it("maps modes to the buttons they show", () => {
    expect([medicalModeCanEdit("edit"), medicalModeCanReview("edit")]).toEqual([true, false]);
    expect([medicalModeCanEdit("review"), medicalModeCanReview("review")]).toEqual([false, true]);
    expect([medicalModeCanEdit("editAndReview"), medicalModeCanReview("editAndReview")]).toEqual([true, true]);
    expect([medicalModeCanEdit("readOnly"), medicalModeCanReview("readOnly")]).toEqual([false, false]);
  });
});
