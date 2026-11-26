import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMasterData, setMasterData } from "@insurance-poc/utils";
import medicalDataFetchV4Mock from "../../../../../mock/medical/medical-data-fetch.json";
import type { MedicalSection } from "./medical.config";
import { getMedicalOptions } from "./medical.config";
import { mapMedicalFetchPayload } from "./medical.mapper";
import { buildMedicalSaveRequest } from "./medical.save";
import { getMedicalFieldValidator, getMedicalMasterOptions, MEDICAL_SCHEMA_GENDER } from "./medical.schema";

const entry = (code: string, description: string, isActive = "Y") => ({
  code,
  description,
  value: null,
  isActive,
});

/** The shape of the post-login master data for the three lists the Medical screen reads. */
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
    },
    unknownTypes: [],
  });

const sectionOf = (key: string): MedicalSection => {
  const section = mapMedicalFetchPayload(medicalDataFetchV4Mock)?.sections.find((item) => item.key === key);
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

  it("falls back to the hardcoded labels while no master is loaded", () => {
    expect(getMedicalMasterOptions("gender", MEDICAL_SCHEMA_GENDER).map((option) => option.value)).toEqual([
      "MALE",
      "FEMALE",
      "TRANSGENDER",
    ]);
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
    expect(getMedicalOptions("occupation")).toEqual([{ label: "Salaried", value: "SAL" }]);
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

  it("validates against the master codes, not the descriptions", () => {
    loadMasters();
    const validator = getMedicalFieldValidator("mer", "Gender");
    expect(validator?.validate("M")).toBeUndefined();
    expect(validator?.validate("Male")).toBe("Gender has an invalid selection");
    expect(validator?.validate("")).toBe("Gender is required");
  });
});
