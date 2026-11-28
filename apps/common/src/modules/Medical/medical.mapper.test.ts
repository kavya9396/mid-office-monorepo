import { describe, expect, it } from "vitest";
import { formatIndianCurrency } from "@insurance-poc/utils";
import medicalDataFetchMock from "../../../../../mock/medical/medical-data-fetch.json";
import {
  MEDICAL_FAMILY_HISTORY_SECTION,
  MEDICAL_SECTIONS,
  parseMedicalQuestionnaire,
  resolveMedicalControlKind,
  TELEMER_GROUPS,
  TELEMER_SECTIONS,
  type MedicalSection,
} from "./medical.config";
import { mapMedicalFetchPayload } from "./medical.mapper";
import { MEDICAL_TIME_12H } from "./medical.schema";

const mapped = mapMedicalFetchPayload(medicalDataFetchMock);

const sectionOf = (key: string): MedicalSection => {
  const section = mapped?.sections.find((item) => item.key === key);
  if (!section) throw new Error(`Section ${key} not mapped`);
  return section;
};

const valueOf = (sectionKey: string, label: string): string | undefined =>
  sectionOf(sectionKey).fields.find(([fieldLabel]) => fieldLabel === label)?.[1];

describe("mapMedicalFetchPayload", () => {
  it("returns null when the response has no data.sections", () => {
    expect(mapMedicalFetchPayload(null)).toBeNull();
    expect(mapMedicalFetchPayload({ data: {} })).toBeNull();
    expect(mapMedicalFetchPayload({ data: { sections: [] } })).toBeNull();
  });

  it("keeps the returned sections in config order", () => {
    const order = MEDICAL_SECTIONS.map((section) => section.key);
    const keys = mapped?.sections.map((section) => section.key) ?? [];
    expect(keys).toEqual(order.filter((key) => keys.includes(key)));
    const groupedKeys = mapped?.groups.flatMap((group) => group.sections.map((s) => s.key));
    expect(groupedKeys).toContain("tele_family_history");
  });

  it("groups point at the mapped sections", () => {
    const fromGroup = mapped?.groups
      .flatMap((group) => group.sections)
      .find((section) => section.key === "question_table");
    expect(fromGroup?.questionnaire?.length).toBe(47);
  });

  it("maps MER fields and converts the ISO date to DD/MM/YYYY", () => {
    expect(valueOf("mer", "First Name")).toBe("Ravi");
    expect(valueOf("mer", "Name of ME")).toBe("Dr Mehta");
    expect(valueOf("mer", "Examinee DOB")).toBe("12/05/1990");
  });

  it("leaves a value empty when the control cannot hold it (gender code M)", () => {
    expect(valueOf("mer", "Gender")).toBe("");
  });

  it("keeps the default for a null API value", () => {
    const result = mapMedicalFetchPayload({ data: { sections: { mer: { nameOfMe: null } } } });
    const mer = result?.sections.find((s) => s.key === "mer");
    expect(mer?.fields.find(([l]) => l === "Name of ME")?.[1]).toBe("");
  });

  it("keeps the field's required flag", () => {
    const first = sectionOf("mer").fields.find(([label]) => label === "First Name");
    expect(first?.[2]).toBe(true);
  });

  it("maps Tele habit indicators and quantities using the Tele labels", () => {
    const source = {
      data: {
        sections: {
          tele_mer: {
            habit_and_addictions: {
              cigarettesBeedisCigar: "YES",
              cigarettesBeedisCigarQuant: 2,
              cigarettesBeedisCigarYear: 10,
              narcoticConsumption: "N",
            },
          },
        },
      },
    };
    const result = mapMedicalFetchPayload(source);
    const habits = result?.sections.find((section) => section.key === "tele_habit_addiction");
    const get = (label: string) => habits?.fields.find(([l]) => l === label)?.[1];
    expect(get("Cigarette/beedis/cigar - Indicator")).toBe("Yes");
    expect(get("Cigarette/beedis/cigar - Quantity")).toBe("2");
    expect(get("Cigarette/beedis/cigar - No. of Year")).toBe("10");
    expect(get("Narrotic Consumption - Indicator")).toBe("No");
  });

  it("maps Tele habit from v2 array structure", () => {
    const source = {
      data: {
        sections: {
          tele_mer: {
            habit_and_addictions: [
              { habit: "Cigarette/beedis/cigar", indicator: "Y", quantity: "5", year: 8 },
              { habit: "Beer/Wine/Hard liquor", indicator: "N", quantity: null, year: null },
            ],
          },
        },
      },
    };
    const result = mapMedicalFetchPayload(source);
    const habits = result?.sections.find((section) => section.key === "tele_habit_addiction");
    const get = (label: string) => habits?.fields.find(([l]) => l === label)?.[1];
    expect(get("Cigarette/beedis/cigar - Indicator")).toBe("Yes");
    expect(get("Cigarette/beedis/cigar - Quantity")).toBe("5");
    expect(get("Cigarette/beedis/cigar - No. of Year")).toBe("8");
    expect(get("Beer/Wine/Hard liquor - Indicator")).toBe("No");
  });
  it("keeps a numeric habit Quantity and leaves free text empty (MER and Tele)", () => {
    const source = {
      data: {
        sections: {
          mer: {
            habit_and_addictions: {
              cigarettesBeedisCigarQuant: "5/day",
              gutkaSnuffPaanQuant: "0",
              beerWineHardLiquorQuant: 2,
            },
          },
          tele_mer: {
            habit_and_addictions: { value: [{ habit: "Beer/Wine/Hard liquor", indicator: "Y", quantity: "4 pegs", year: 3 }] },
          },
        },
      },
    };
    const result = mapMedicalFetchPayload(source);
    const get = (key: string, label: string) =>
      result?.sections.find((s) => s.key === key)?.fields.find(([l]) => l === label)?.[1];
    expect(get("habit_and_addictions", "Cigarettes/beedis/cigar - Quantity")).toBe("");
    expect(get("habit_and_addictions", "Gutka / snuff / paan etc. - Quantity")).toBe("0");
    expect(get("habit_and_addictions", "Beer/Wine/Hard liquor - Quantity")).toBe("2");
    expect(get("tele_habit_addiction", "Beer/Wine/Hard liquor - Quantity")).toBe("");
  });



  it("maps Tele disposition including Remarks2", () => {
    const source = {
      data: { sections: { tele_mer: { disposition: { tuwStatus: "X", remark: "OK", note: "N1", remarks2: "R2" } } } },
    };
    const result = mapMedicalFetchPayload(source);
    const disposition = result?.sections.find((section) => section.key === "tele_disposition");
    const get = (label: string) => disposition?.fields.find(([l]) => l === label)?.[1];
    expect(get("TUW Status")).toBe("X");
    expect(get("Remark")).toBe("OK");
    expect(get("Note")).toBe("N1");
    expect(get("Remarks2")).toBe("R2");
  });

  it("maps members[] to family rows, one per member, in the order the API sends them", () => {
    const rows = sectionOf("family_history").familyRows;
    expect(rows?.map((row) => row.relation)).toEqual([
      "Mother", "Brother", "Sister", "Father", "Father", "Mother", "Brother", "Spouse",
    ]);
    expect(rows?.[0]).toMatchObject({
      relation: "Mother",
      age: "53",
      alive: "Alive",
      health: "Angioplasty done in 2022",
    });
    expect(rows?.[3]).toMatchObject({ relation: "Father", age: "58", alive: "Alive" });
    expect(rows?.[3]).not.toHaveProperty("health");
  });

  it("omits null member values instead of writing empty strings", () => {
    const brother = sectionOf("family_history").familyRows?.[1];
    expect(brother).toEqual({ relation: "Brother", memberId: expect.any(Number) });
  });

  it("maps Tele family history members from the root-level tele_family_history", () => {
    const rows = sectionOf("tele_family_history").familyRows;
    expect(rows).toHaveLength(10);
    expect(rows?.slice(0, 2)).toEqual([
      { relation: "Father", age: "55", alive: "Alive", health: "Good" },
      { relation: "Mother", age: "51", alive: "Alive", health: "Good" },
    ]);
  });

  it("matches Tele Health Status to the dropdown list ignoring case, and leaves other values empty", () => {
    const source = {
      data: {
        sections: {
          tele_mer: {
            family_history: {
              members: [
                { relationType: "Father", age: 50, healthStatus: "HEALTHY" },
                { relationType: "Mother", age: 48, healthStatus: "Unlisted" },
              ],
            },
          },
          family_history: { members: [{ relationType: "Father", age: 50, healthStatus: "Unlisted" }] },
        },
      },
    };
    const result = mapMedicalFetchPayload(source);
    const tele = result?.sections.find((s) => s.key === "tele_family_history")?.familyRows;
    expect(tele?.[0]?.health).toBe("Healthy");
    expect(tele?.[1]).not.toHaveProperty("health");
    // MER Health Status is free text and is shown as sent.
    const mer = result?.sections.find((s) => s.key === "family_history")?.familyRows;
    expect(mer?.[0]?.health).toBe("Unlisted");
  });

  it("maps the Tele MER Disclosure, MER Detail and Tele Type dropdowns from the API value", () => {
    const source = {
      data: {
        sections: {
          tele_mer: { details: { disclosure: "MATERIAL", merDetail: "Video MER", teleType: "Unlisted" } },
        },
      },
    };
    const tele = mapMedicalFetchPayload(source)?.sections.find((s) => s.key === "tele_mer");
    const get = (label: string) => tele?.fields.find(([l]) => l === label)?.[1];
    expect(get("Disclosure")).toBe("Material");
    expect(get("MER Detail")).toBe("Video MER");
    expect(get("Tele Type")).toBe("");
  });

  it("keeps the starter rows when members is empty", () => {
    const source = { data: { sections: { family_history: { members: [] } } } };
    const result = mapMedicalFetchPayload(source);
    const section = result?.sections.find((item) => item.key === MEDICAL_FAMILY_HISTORY_SECTION.key);
    expect(section?.familyRows).toBeUndefined();
  });

  it("fills the MER and Tele questionnaires from the response", () => {
    expect(sectionOf("question_table").questionnaire?.length).toBe(47);
    expect(sectionOf("tele_question_table").questionnaire?.length).toBe(210);
    expect(sectionOf("question_table").questionnaire?.[0]?.id).toBe("1.a");
  });

  it("throws on an invalid questionnaire row instead of showing wrong data", () => {
    const source = { data: { sections: { question_table: { questionnaire: [{ id: 1 }] } } } };
    expect(() => mapMedicalFetchPayload(source)).toThrow(/Questionnaire row 0/);
  });

  it("maps Special Medical header fields from ECG (date converted, option matched)", () => {
    expect(valueOf("ecg", "Medical Type")).toBe("REGULAR MEDICAL");
    expect(valueOf("ecg", "Test Date")).toBe("22/07/2026");
    expect(valueOf("ecg", "Doctor Name")).toBe("Dr Sharma");
    expect(valueOf("ecg", "Doctor Registration No")).toBe("MMC12345");
    expect(valueOf("ecg", "Diagnostic Centre Name")).toBe("SRL Diagnostics");
  });

  it("maps cmoDecisions[] to the CMO decision table for 2DECHO, ECG and TMT", () => {
    const row = {
      userName: "Dr. Arvind Shah",
      poolName: "Special Medical CMO",
      decision: "Accepted",
      remarks: "ECG reviewed with normal sinus rhythm.",
      updatedOn: "2026-09-19 07:12:30",
    };
    const source = {
      data: { sections: { ecg: { cmoDecisions: [row, row] }, "2decho": { cmoDecisions: [row, row] }, tmt: { cmoDecisions: [row, row] } } },
    };
    const result = mapMedicalFetchPayload(source);
    const cmo = (key: string) => result?.sections.find((s) => s.key === key)?.cmoDecisions;
    expect(cmo("ecg")).toHaveLength(2);
    expect(cmo("ecg")?.[0]).toEqual(row);
    expect(cmo("2decho")).toHaveLength(2);
    expect(cmo("tmt")).toHaveLength(2);
  });

  it("shows no CMO decision table for the V3 mock, which has no cmoDecisions[] (open question 20)", () => {
    expect(sectionOf("ecg").cmoDecisions).toEqual([]);
    expect(sectionOf("2decho").cmoDecisions).toEqual([]);
    expect(sectionOf("tmt").cmoDecisions).toEqual([]);
  });

  it("hides the CMO decision table when the API sends none, instead of the config sample rows", () => {
    const source = { data: { sections: { ecg: { findings: "Normal" }, tmt: { cmoDecisions: [] } } } };
    const result = mapMedicalFetchPayload(source);
    expect(result?.sections.find((s) => s.key === "ecg")?.cmoDecisions).toEqual([]);
    expect(result?.sections.find((s) => s.key === "tmt")?.cmoDecisions).toEqual([]);
  });

  it("does not add cmoDecisions to tests that have no CMO table", () => {
    expect(sectionOf("cxr").cmoDecisions).toBeUndefined();
  });

  it("keeps defaults for Special Medical tests that are empty in the response", () => {
    const result = mapMedicalFetchPayload({ data: { sections: { cxr: {}, tmt: {}, pft: {} } } });
    const value = (key: string, label: string) =>
      result?.sections.find((s) => s.key === key)?.fields.find(([l]) => l === label)?.[1];
    expect(value("cxr", "Findings")).toBe("");
    expect(value("tmt", "METS")).toBe("");
    expect(value("pft", "FEV1")).toBe("");
  });

  it("maps each Special Medical test to its own API key and remark spelling", () => {
    const source = {
      data: {
        sections: {
          blood_urea_and_nitro: { findings: 20, bun: "9", result: "Normal", remark: "ok" },
          dobutamine_stress_echocardiogram: { findings: "Normal", ejectionFraction: 60, remark: "r1" },
          exercise_stress_echocardiogram: { findings: "abnormal", rejectionAbnormality: "Normal", remark: "r2" },
          pap_smear: { findings: "Normal", remarks: "r3" },
          pft: { date: "2026-02-03", fev1: 3, fev1Fvc: "80" },
          tmt: { findings: "Negative", mets: "10", heartRateResult: "Normal", remarks: "r4" },
          "2decho": { findings: "Mild Changes", ejectionFraction: "55", remarks: "r5" },
        },
      },
    };
    const result = mapMedicalFetchPayload(source);
    const value = (key: string, label: string) =>
      result?.sections.find((s) => s.key === key)?.fields.find(([l]) => l === label)?.[1];
    expect(value("blood_urea_and_nitro", "Findings")).toBe("20");
    expect(value("blood_urea_and_nitro", "BUN")).toBe("9");
    expect(value("blood_urea_and_nitro", "Remark")).toBe("ok");
    expect(value("dobutamine_stress_echocardiogram", "Ejection Fraction")).toBe("60");
    expect(value("dobutamine_stress_echocardiogram", "Remark")).toBe("r1");
    expect(value("exercise_stress_echocardiogram", "Findings")).toBe("Abnormal");
    expect(value("pap_smear", "Remarks")).toBe("r3");
    expect(value("pft", "Date")).toBe("03/02/2026");
    expect(value("pft", "FEV1/FVC")).toBe("80");
    expect(value("tmt", "METS")).toBe("10");
    expect(value("tmt", "Heart Rate Result")).toBe("Normal");
    expect(value("tmt", "Remarks")).toBe("r4");
    expect(value("2decho", "Remarks")).toBe("r5");
  });

  it("shows TMT METS from the API as a number or a string, and leaves values outside 1-18 empty", () => {
    const metsOf = (mets: unknown) =>
      mapMedicalFetchPayload({ data: { sections: { tmt: { mets } } } })
        ?.sections.find((s) => s.key === "tmt")
        ?.fields.find(([l]) => l === "METS")?.[1];
    expect(metsOf("10")).toBe("10");
    expect(metsOf(10)).toBe("10");
    expect(metsOf(18)).toBe("18");
    expect(metsOf(19)).toBe("");
    expect(metsOf(10.5)).toBe("");
    expect(metsOf(null)).toBe("");
  });

  it("leaves a dropdown empty when the value is not in the section's list", () => {
    const source = {
      data: { sections: { cxr: { findings: "Mild Changes", medicalType: "SOMETHING ELSE" } } },
    };
    const section = mapMedicalFetchPayload(source)?.sections.find((s) => s.key === "cxr");
    expect(section?.fields.find(([l]) => l === "Findings")?.[1]).toBe("");
    expect(section?.fields.find(([l]) => l === "Medical Type")?.[1]).toBe("");
  });

  it("maps BP readings by readingId and keeps slots 1-4 when values are null", () => {
    const labels = sectionOf("blood_pressure_and_pulse").fields.map(([label]) => label);
    expect(labels).toEqual([
      "Systolic 1", "Systolic 2", "Systolic 3", "Systolic 4", "Avg Systolic",
      "Diastolic 1", "Diastolic 2", "Diastolic 3", "Diastolic 4", "Avg Diastolic",
      "Pulse Rate",
    ]);
    expect(sectionOf("blood_pressure_and_pulse").cols).toBe(5);
    // V3 sends readings[] with readingSeq 1-3, so slots 1-3 are filled and slot 4 stays empty.
    expect(valueOf("blood_pressure_and_pulse", "Systolic 1")).toBe("120");
    expect(valueOf("blood_pressure_and_pulse", "Diastolic 3")).toBe("82");
    expect(valueOf("blood_pressure_and_pulse", "Systolic 4")).toBe("");
  });

  it("adds a slot for every extra readingId, sorted, and maps by id not position", () => {
    const source = {
      data: {
        sections: {
          blood_pressure_and_pulse: {
            pulseRate: 72,
            avgSystolic: "121",
            systolic: [
              { readingId: 6, value: 126 },
              { readingId: 2, value: "118" },
              { readingId: 1, value: 120 },
              { readingId: 5, value: null },
            ],
            diastolic: [{ readingId: 1, value: 80 }, { readingId: 7, value: 82 }],
          },
        },
      },
    };
    const section = mapMedicalFetchPayload(source)?.sections.find(
      (item) => item.key === "blood_pressure_and_pulse",
    );
    const labels = section?.fields.map(([label]) => label);
    expect(labels).toEqual([
      "Systolic 1", "Systolic 2", "Systolic 3", "Systolic 4", "Systolic 5", "Systolic 6",
      "Systolic 7", "Avg Systolic",
      "Diastolic 1", "Diastolic 2", "Diastolic 3", "Diastolic 4", "Diastolic 5", "Diastolic 6",
      "Diastolic 7", "Avg Diastolic",
      "Pulse Rate",
    ]);
    expect(section?.cols).toBe(8);
    const get = (label: string) => section?.fields.find(([l]) => l === label)?.[1];
    expect(get("Systolic 1")).toBe("120");
    expect(get("Systolic 2")).toBe("118");
    expect(get("Systolic 5")).toBe("");
    expect(get("Systolic 6")).toBe("126");
    expect(get("Diastolic 7")).toBe("82");
    expect(get("Avg Systolic")).toBe("121");
    expect(get("Pulse Rate")).toBe("72");
  });

  it("ignores BP entries without a valid readingId", () => {
    const source = {
      data: {
        sections: {
          blood_pressure_and_pulse: {
            systolic: [{ value: 1 }, { readingId: 0, value: 2 }, { readingId: "3", value: 3 }, null],
          },
        },
      },
    };
    const section = mapMedicalFetchPayload(source)?.sections.find(
      (item) => item.key === "blood_pressure_and_pulse",
    );
    expect(section?.fields.every(([, value]) => value === "")).toBe(true);
    expect(section?.cols).toBe(5);
  });

  it("maps Overview values and normalises Y/N to Yes/No", () => {
    const key = "application_form_medical";
    expect(valueOf(key, "Height")).toBe("170");
    expect(valueOf(key, "BMI")).toBe("24.0");
    expect(valueOf(key, "Family History As Per Application Form ?")).toBe("Yes");
    expect(valueOf(key, "Smoking")).toBe("Yes");
    expect(valueOf(key, "Tobacco")).toBe("No");
  });

  it("keeps Overview defaults for fields the API does not return", () => {
    const key = "application_form_medical";
    expect(valueOf(key, "Adverse")).toBe("");
    expect(valueOf(key, "Hazardous Occupation")).toBe("");
    expect(valueOf(key, "Illness Impairment")).toBe("");
  });

  it("maps a single-value Other Medical test from the root of its API object", () => {
    expect(valueOf("fbs", "Medical Type")).toBe("REGULAR MEDICAL");
    expect(valueOf("fbs", "Date")).toBe("22/07/2026");
    expect(valueOf("fbs", "Examinee Name")).toBe("ASHOK KUMAR");
    expect(valueOf("fbs", "Examinee Gender")).toBe("MALE");
    expect(valueOf("fbs", "Diagnostic Centre Address")).toBe("Andheri East, Mumbai");
    expect(valueOf("fbs", "Diagnostic Centre Pincode")).toBe("400069");
    expect(valueOf("fbs", "Doctor Registration No")).toBe("MMC12345");
    expect(valueOf("fbs", "Value")).toBe("92");
    expect(valueOf("fbs", "Lab Range Start")).toBe("70");
    expect(valueOf("fbs", "Lab Range End")).toBe("100");
    expect(valueOf("fbs", "Unit Value")).toBe("mg/dL");
    expect(valueOf("fbs", "Findings")).toBe("Normal");
  });

  it("maps Microalbuminuria and PSA: Findings reads value, Result reads findings", () => {
    expect(valueOf("psa", "Test Date")).toBe("22/07/2026");
    expect(valueOf("psa", "Findings")).toBe("1.2");
    expect(valueOf("psa", "Result")).toBe("Normal");
    expect(valueOf("psa", "Unit Value")).toBe("ng/mL");
    expect(valueOf("microalbuminuria", "Findings")).toBe("12");
  });

  it("leaves HBsAg Value empty when the root value is not in the UI list (non_reactive)", () => {
    expect(valueOf("hbsag", "Value")).toBe("");
    expect(valueOf("hbsag", "Date")).toBe("22/07/2026");
    expect(valueOf("hbsag", "Diagnostic Centre Name")).toBe("SRL Diagnostics");
    expect(valueOf("hbsag", "Doctor Registration No")).toBe("MMC12345");
  });

  it("matches a reactive value to the UI list ignoring case, and keeps defaults for null values", () => {
    expect(valueOf("cot", "Value")).toBe("Negative/Non Reactive");
    expect(valueOf("ghb", "Examinee Name")).toBe("");
  });

  it("maps CBC header fields and fills each parameter row by paramName", () => {
    expect(valueOf("cbc_group", "Date")).toBe("22/07/2026");
    expect(valueOf("cbc_group", "Medical Type")).toBe("REGULAR MEDICAL");
    const section = sectionOf("cbc_group");
    expect(section.parameterValues).toHaveLength(section.parameters?.length ?? -1);
    expect(section.parameterValues?.[0]).toEqual({
      value: "16.90",
      from: "13.0",
      to: "17.0",
      unit: "gm/dL",
      paramId: 448,
      id: "hemoglobin",
    });
  });

  it("fills every parameter-list test with one entry per UI row, in UI order", () => {
    for (const key of ["cbc_group", "lft", "lipids", "ogtt_group", "rua_group", "sma12_group", "tft_group", "s13_group"]) {
      const section = sectionOf(key);
      expect(section.parameterValues, key).toHaveLength(section.parameters?.length ?? -1);
      const names = section.parameters?.map(([name]) => name) ?? [];
      const apiRoot = (medicalDataFetchMock.response.data.sections as unknown as Record<string, { parameters: { parameter: string; value: string | null }[] }>)[key];
      names.forEach((name, index) => {
        const item = apiRoot?.parameters.find((entry) => entry.parameter === name);
        expect(item, `${key}: ${name}`).toBeDefined();
        const dropdownValue = section.parameterValues?.[index]?.value ?? "";
        // A dropdown value outside the row's list is left empty, so only compare when it was kept.
        if (dropdownValue !== "") expect(dropdownValue).toBe(item?.value);
      });
    }
  });

  it("does not copy Findings from the API: the UI computes it from the range", () => {
    expect(Object.keys(sectionOf("cbc_group").parameterValues?.[0] ?? {}).sort()).toEqual([
      "from",
      "id",
      "paramId",
      "to",
      "unit",
      "value",
    ]);
  });

  it("keeps a dropdown parameter value when it is in the row's list", () => {
    expect(sectionOf("rua_group").parameterValues?.[0]?.value).toBe("Nil/Absent");
    expect(sectionOf("rua_group").parameterValues?.[0]?.from).toBe("");
  });

  it("leaves a row empty when the API sends no item for it, and ignores items with no UI row", () => {
    const payload = {
      data: {
        sections: {
          lipids: {
            parameters: [
              { paramName: "HDL", value: "45", labRangeValueStart: "40", labRangeValueEnd: "60", unitsValue: "mg/dL" },
              { paramName: "Not In UI", value: "9" },
            ],
          },
        },
      },
    };
    const lipids = mapMedicalFetchPayload(payload)?.sections.find((section) => section.key === "lipids");
    const names = lipids?.parameters?.map(([name]) => name) ?? [];
    expect(lipids?.parameterValues).toHaveLength(names.length);
    expect(lipids?.parameterValues?.[names.indexOf("HDL")]).toEqual({ value: "45", from: "40", to: "60", unit: "mg/dL" });
    expect(lipids?.parameterValues?.[names.indexOf("LDL")]).toEqual({ value: "", from: "", to: "", unit: "" });
  });

  it("leaves a dropdown parameter empty when the value is not in the row's list", () => {
    const payload = {
      data: { sections: { rua_group: { parameters: [{ paramName: "Ketone Bodies", value: "weird" }] } } },
    };
    const rua = mapMedicalFetchPayload(payload)?.sections.find((section) => section.key === "rua_group");
    const index = rua?.parameters?.findIndex(([name]) => name === "Ketone Bodies") ?? -1;
    expect(rua?.parameterValues?.[index]?.value).toBe("");
  });

  it("maps v2 parameters shape (parameter, labRangeStart, labRangeEnd, unit, paramId, id)", () => {
    const payload = {
      data: {
        examId: 58,
        medAppDtlId: 118,
        sections: {
          cbc_group: {
            testDtlId: 167,
            parameters: [
              {
                paramId: 448,
                id: "hemoglobin",
                parameter: "Hemoglobin(Hb)",
                value: "16.90",
                labRangeStart: "13.0",
                labRangeEnd: "17.0",
                unit: "gm/dL",
                findings: "NORMAL",
              },
            ],
          },
        },
      },
    };
    const result = mapMedicalFetchPayload(payload);
    expect(result?.examId).toBe(58);
    expect(result?.medAppDtlId).toBe(118);
    const cbc = result?.sections.find((s) => s.key === "cbc_group");
    expect(cbc?.testDtlId).toBe(167);
    expect(cbc?.parameterValues?.[0]).toEqual({
      value: "16.90",
      from: "13.0",
      to: "17.0",
      unit: "gm/dL",
      paramId: 448,
      id: "hemoglobin",
    });
  });

  it("maps the BRE Medical Decision fields; BIU Medical Status is shown as sent", () => {
    const key = "bre_medical_decision";
    expect(valueOf(key, "Physical Medical Decision")).toBe("Standard");
    expect(valueOf(key, "Tele/Video MER Decision")).toBe("Standard");
    expect(valueOf(key, "MunichRe Medical Decision")).toBe("Non-Standard");
    expect(valueOf(key, "MunichRe Rating")).toBe("150");
    expect(valueOf(key, "BIU Medical Status")).toBe("N");
    expect(valueOf(key, "Physical Medical Remark")).toBe("Physical medical reviewed, no adverse finding.");
    expect(valueOf(key, "Tele/Video MER Remark")).toBe("Tele MER reviewed, no adverse finding.");
  });

  it("maps the Medical Decision dropdown and leaves a value outside its list empty", () => {
    expect(valueOf("decision", "Medical Decision")).toBe("Standard");
    const payload = { data: { sections: { decision: { medicalDecision: "Maybe" } } } };
    const decision = mapMedicalFetchPayload(payload)?.sections.find((section) => section.key === "decision");
    expect(decision?.fields[0]?.[1]).toBe("");
  });

  it("returns only the sections the API sent; the always-editable Decision is kept", () => {
    const result = mapMedicalFetchPayload({ data: { sections: {} } });
    expect(result?.sections.map((section) => section.key)).toEqual(["decision"]);
    expect(result?.sections[0]).toBe(MEDICAL_SECTIONS.find((section) => section.key === "decision"));
    expect(result?.groups.map((group) => group.key)).toEqual(["decision"]);
  });

  it("omits a section the API did not send and the group that has none left", () => {
    const source = { data: { sections: { cxr: { findings: "Normal" }, mer: { details: { firstName: "Ravi" } } } } };
    const result = mapMedicalFetchPayload(source);
    const keys = result?.sections.map((section) => section.key);
    expect(keys).toEqual(["mer", "cxr", "decision"]);
    expect(result?.groups.map((group) => group.key)).toEqual(["mer", "special_medical", "decision"]);
    expect(result?.groups.find((group) => group.key === "special_medical")?.sections.map((s) => s.key)).toEqual([
      "cxr",
    ]);
  });

  it("keeps a section the API sent as an empty object", () => {
    const result = mapMedicalFetchPayload({ data: { sections: { tmt: {} } } });
    expect(result?.sections.map((section) => section.key)).toContain("tmt");
  });

  it("unwraps V4 envelope and extracts history entries with Report Received date", () => {
    const payload = {
      endpoint: "POST /icic-medical-service/v1/medical-data/fetch",
      request: { applicationNumber: "APP1", partyId: "P1" },
      response: {
        response_code: 200,
        data: {
          examId: 58,
          medAppDtlId: 118,
          sections: {
            mer: {
              details: {
                applicationNo: "APP1",
                firstName: "John",
                history: [
                  {
                    applicationNo: "APP1",
                    firstName: "John",
                    dateOfExamination: "2026-01-01",
                  },
                ],
              },
            },
            ecg: {
              findings: "NORMAL",
              history: [
                {
                  findings: "NORMAL",
                  testDate: "2026-01-01",
                },
              ],
              cmo_decision: {
                current: null,
                history: [
                  {
                    userName: "IPRU84213",
                    poolName: "Vendor CMO",
                    decision: "Refer",
                    remarks: "Reviewed",
                    updatedOn: "2026-11-25T07:25:51",
                  },
                ],
              },
            },
          },
        },
      },
    };
    const result = mapMedicalFetchPayload(payload);
    expect(result?.examId).toBe(58);
    expect(result?.history?.mer?.[0]?.label).toBe("Report Received: 2026-01-01");
    expect(result?.history?.ecg?.[0]?.label).toBe("Report Received: 2026-01-01");
    const ecg = result?.sections.find((s) => s.key === "ecg");
    expect(ecg?.cmoDecisions?.[0]?.decision).toBe("Refer");
  });

  it("maps MER / Tele MER history from the parent node to every sub section with the same record id", () => {
    const snapshot = (date: string, age: number, tele: boolean) =>
      tele
        ? {
            details: { applicationNo: "APP1", dateTimeOfTeleCall: date },
            family_history: { members: [{ relationType: "Father", age, healthStatus: "Healthy" }] },
          }
        : {
            details: { applicationNo: "APP1", dateOfExamination: date },
            measurement: { heightCms: age },
            family_history: { members: [{ relationType: "Father", age, healthStatus: "Healthy" }] },
          };
    const result = mapMedicalFetchPayload({
      data: {
        sections: {
          mer: {
            details: { applicationNo: "APP1" },
            measurement: { heightCms: 170 },
            family_history: { members: [] },
            history: [snapshot("2026-01-01", 60, false), snapshot("2026-02-02", 61, false)],
          },
          tele_mer: {
            details: { applicationNo: "APP1" },
            family_history: { members: [] },
            history: [snapshot("2026-03-03", 62, true)],
          },
        },
      },
    });
    expect(result?.history?.mer?.map((entry) => entry.id)).toEqual(["hist-mer-1", "hist-mer-2"]);
    expect(result?.history?.mer?.[1]?.label).toBe("Report Received: 2026-02-02");
    expect(result?.history?.measurement?.map((entry) => entry.id)).toEqual([
      "hist-mer-1",
      "hist-mer-2",
    ]);
    expect(result?.history?.family_history).toHaveLength(2);
    expect(result?.history?.tele_mer?.map((entry) => entry.id)).toEqual(["hist-tele_mer-1"]);
    expect(result?.history?.tele_family_history).toHaveLength(1);
    expect(result?.history?.tele_measurements).toBeUndefined();
  });

  it("exports TELEMER_GROUPS with only overview and tele_video_mer groups", () => {
    expect(TELEMER_GROUPS.map((g) => g.key)).toEqual(["overview", "tele_video_mer"]);
    expect(TELEMER_SECTIONS.map((s) => s.key)).toEqual([
      "application_form_medical",
      "tele_mer",
      "tele_measurements",
      "tele_family_history",
      "tele_habit_addiction",
      "tele_question_table",
      "tele_disposition",
    ]);
  });

  it("maps tele_question_table questionnaire and subquestion structure from mock", () => {
    const teleQuest = mapped?.sections.find((s) => s.key === "tele_question_table");
    expect(teleQuest).toBeDefined();
    expect(teleQuest?.questionnaire?.length).toBeGreaterThan(0);
    const parentQ = teleQuest?.questionnaire?.find((q) => q.id === "1");
    expect(parentQ).toBeDefined();
    expect(parentQ?.answerType?.[0]?.subQuestionIds).toContain("1.1");
    const childQ = teleQuest?.questionnaire?.find((q) => q.id === "1.1");
    expect(childQ?.parentId).toBe("1");
  });
});

describe("questionnaire remarks-mandatory option flag", () => {
  const question = (answerType: readonly Record<string, unknown>[]) => ({
    id: "1",
    questionDesc: "Q",
    questionType: "SINGLESELECT",
    section: "TELE",
    answerType,
  });

  it("reads the V4 boolean remarkMandatory and the earlier remarksMandatory 'Y'", () => {
    const [parsed] = parseMedicalQuestionnaire([
      question([
        { key: "YES", label: "Yes", subQuestionIds: [], remarkMandatory: true },
        { key: "NO", label: "No", subQuestionIds: [], remarkMandatory: false },
        { key: "MAYBE", label: "Maybe", subQuestionIds: [], remarksMandatory: "Y" },
      ]),
    ]);
    const flags = parsed?.answerType?.map((option) => option.remarksMandatory);
    expect(flags).toEqual(["Y", undefined, "Y"]);
  });
});

describe("Time of Tele call (12-hour)", () => {
  const timeOf = (raw: unknown) => {
    const result = mapMedicalFetchPayload({ data: { sections: { tele_mer: { details: { dateTimeOfTeleCall: raw } } } } });
    return result?.sections.find((s) => s.key === "tele_mer")?.fields.find(([l]) => l === "Time of Tele call")?.[1];
  };

  it("shows 12-hour times as hh:mm AM/PM and converts 24-hour times", () => {
    expect(timeOf("04:26 PM")).toBe("04:26 PM");
    expect(timeOf("4:26 pm")).toBe("04:26 PM");
    expect(timeOf("16:26")).toBe("04:26 PM");
    expect(timeOf("00:05")).toBe("12:05 AM");
    expect(timeOf("12:00")).toBe("12:00 PM");
  });

  it("leaves a value that is not a time empty, including a date with a time", () => {
    expect(timeOf("17-07-2026 04:26 PM")).toBe("");
    expect(timeOf("25:00")).toBe("");
    expect(timeOf(null)).toBe("");
  });

  it("accepts only hh:mm AM/PM in the schema", () => {
    expect(MEDICAL_TIME_12H.test("04:26 PM")).toBe(true);
    expect(MEDICAL_TIME_12H.test("16:26")).toBe(false);
    expect(MEDICAL_TIME_12H.test("13:00 PM")).toBe(false);
  });
});

describe("Annual Income (Indian currency display)", () => {
  const incomeOf = (raw: unknown) => {
    const result = mapMedicalFetchPayload({ data: { sections: { tele_mer: { details: { annualIncome: raw } } } } });
    return result?.sections.find((s) => s.key === "tele_mer")?.fields.find(([l]) => l === "Annual Income")?.[1];
  };

  it("is a currency control, and the stored value stays the plain number", () => {
    expect(resolveMedicalControlKind("tele_mer", "Annual Income")).toBe("currency");
    expect(incomeOf(2000000)).toBe("2000000");
    expect(incomeOf("2000000")).toBe("2000000");
    expect(incomeOf(null)).toBe("");
  });

  it("is formatted with Indian digit grouping for display", () => {
    expect(formatIndianCurrency("2000000")).toBe("₹ 20,00,000");
  });
});
