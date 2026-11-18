import { describe, expect, it } from "vitest";
import medicalDataFetchMock from "../../../../../mock/medical/medical-data-fetch.json";
import {
  MEDICAL_FAMILY_HISTORY_SECTION,
  MEDICAL_SECTIONS,
  type MedicalSection,
} from "./medical.config";
import { mapMedicalFetchPayload } from "./medical.mapper";

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

  it("keeps every section and group, in order", () => {
    expect(mapped?.sections.map((section) => section.key)).toEqual(
      MEDICAL_SECTIONS.map((section) => section.key),
    );
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
    expect(valueOf("mer", "First Name")).toBe("Virat Kohli");
    expect(valueOf("mer", "Examinee DOB")).toBe("01/01/1900");
  });

  it("leaves a value empty when the control cannot hold it (gender code U)", () => {
    expect(valueOf("mer", "Gender")).toBe("");
  });

  it("keeps the default for a null API value", () => {
    expect(valueOf("mer", "Name of ME")).toBe("");
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

  it("maps Tele disposition and leaves Remarks2 unmapped", () => {
    const source = {
      data: { sections: { tele_mer: { disposition: { tuwStatus: "X", remark: "OK", note: "N1" } } } },
    };
    const result = mapMedicalFetchPayload(source);
    const disposition = result?.sections.find((section) => section.key === "tele_disposition");
    const get = (label: string) => disposition?.fields.find(([l]) => l === label)?.[1];
    expect(get("TUW Status")).toBe("X");
    expect(get("Remark")).toBe("OK");
    expect(get("Note")).toBe("N1");
    expect(get("Remarks2")).toBe("");
  });

  it("maps members[] to family rows, one per member", () => {
    const rows = sectionOf("family_history_health_status").familyRows;
    expect(rows?.map((row) => row.relation)).toEqual(["Father", "Mother", "Brother", "Sister"]);
    expect(rows?.[0]).toEqual({ relation: "Father", age: "58", alive: "Alive" });
    expect(rows?.[1]).toEqual({
      relation: "Mother",
      age: "53",
      alive: "Alive",
      health: "Angioplasty done in 2022",
    });
  });

  it("omits null member values instead of writing empty strings", () => {
    const brother = sectionOf("family_history_health_status").familyRows?.[2];
    expect(brother).toEqual({ relation: "Brother" });
  });

  it("maps Tele family history members", () => {
    const rows = sectionOf("tele_family_history").familyRows;
    expect(rows).toEqual([
      { relation: "Father", age: "55", alive: "Alive", health: "GOOD" },
      { relation: "Mother", age: "51", alive: "Alive", health: "GOOD" },
    ]);
  });

  it("keeps the starter rows when members is empty", () => {
    const source = { data: { sections: { family_history: { members: [] } } } };
    const result = mapMedicalFetchPayload(source);
    const section = result?.sections.find((item) => item.key === MEDICAL_FAMILY_HISTORY_SECTION.key);
    expect(section?.familyRows).toBeUndefined();
  });

  it("fills the MER and Tele questionnaires from the response", () => {
    expect(sectionOf("question_table").questionnaire?.length).toBe(47);
    expect(sectionOf("tele_question_table").questionnaire?.length).toBe(256);
    expect(sectionOf("question_table").questionnaire?.[0]?.id).toBe("1.a");
  });

  it("throws on an invalid questionnaire row instead of showing wrong data", () => {
    const source = { data: { sections: { question_table: { questionnaire: [{ id: 1 }] } } } };
    expect(() => mapMedicalFetchPayload(source)).toThrow(/Questionnaire row 0/);
  });

  it("maps Special Medical header fields from ECG (date converted, option matched)", () => {
    expect(valueOf("ecg", "Medical Type")).toBe("REGULAR MEDICAL");
    expect(valueOf("ecg", "Test Date")).toBe("01/01/2026");
    expect(valueOf("ecg", "Doctor Name")).toBe("DR. SHASHI KANT MISHRA");
    expect(valueOf("ecg", "Doctor Registration No")).toBe("HMC-004521");
    expect(valueOf("ecg", "Diagnostic Centre Name")).toBe("ARROW Hosp: CE");
  });

  it("maps cmoDecisions[] to the CMO decision table for 2DECHO, ECG and TMT", () => {
    const ecg = sectionOf("ecg").cmoDecisions;
    expect(ecg).toHaveLength(2);
    expect(ecg?.[0]).toEqual({
      userName: "Dr. Arvind Shah",
      poolName: "Special Medical CMO",
      decision: "Accepted",
      remarks: "ECG reviewed with normal sinus rhythm.",
      updatedOn: "2026-09-19 07:12:30",
    });
    expect(sectionOf("2decho").cmoDecisions).toHaveLength(2);
    expect(sectionOf("tmt").cmoDecisions).toHaveLength(2);
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
    expect(valueOf("cxr", "Findings")).toBe("");
    expect(valueOf("tmt", "METS")).toBe("");
    expect(valueOf("pft", "FEV1")).toBe("");
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
    expect(value("blood_urea_nitro", "Findings")).toBe("20");
    expect(value("blood_urea_nitro", "BUN")).toBe("9");
    expect(value("blood_urea_nitro", "Remark")).toBe("ok");
    expect(value("dobutamine_stress_echo", "Ejection Fraction")).toBe("60");
    expect(value("dobutamine_stress_echo", "Remark")).toBe("r1");
    expect(value("exercise_stress_echo", "Findings")).toBe("Abnormal");
    expect(value("pap_smear", "Remarks")).toBe("r3");
    expect(value("pft", "Date")).toBe("03/02/2026");
    expect(value("pft", "FEV1/FVC")).toBe("80");
    expect(value("tmt", "METS")).toBe("10");
    expect(value("tmt", "Heart Rate Result")).toBe("Normal");
    expect(value("tmt", "Remarks")).toBe("r4");
    expect(value("2decho", "Remarks")).toBe("r5");
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
    const labels = sectionOf("blood_pressure_pulse_details").fields.map(([label]) => label);
    expect(labels).toEqual([
      "Systolic 1", "Systolic 2", "Systolic 3", "Systolic 4", "Avg Systolic",
      "Diastolic 1", "Diastolic 2", "Diastolic 3", "Diastolic 4", "Avg Diastolic",
      "Pulse Rate",
    ]);
    expect(sectionOf("blood_pressure_pulse_details").cols).toBe(5);
    expect(valueOf("blood_pressure_pulse_details", "Systolic 1")).toBe("");
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
      (item) => item.key === "blood_pressure_pulse_details",
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
      (item) => item.key === "blood_pressure_pulse_details",
    );
    expect(section?.fields.every(([, value]) => value === "")).toBe(true);
    expect(section?.cols).toBe(5);
  });

  it("maps Overview values and normalises Y/N to Yes/No", () => {
    const key = "application_form_medical_lifestyle";
    expect(valueOf(key, "Height")).toBe("170");
    expect(valueOf(key, "BMI")).toBe("27.2");
    expect(valueOf(key, "Family History As Per Application Form ?")).toBe("Yes");
    expect(valueOf(key, "Smoking")).toBe("Yes");
    expect(valueOf(key, "Tobacco")).toBe("No");
  });

  it("keeps Overview defaults for fields the API does not return", () => {
    const key = "application_form_medical_lifestyle";
    expect(valueOf(key, "Adverse")).toBe("");
    expect(valueOf(key, "Hazardous Occupation")).toBe("");
    expect(valueOf(key, "Illness Impairment")).toBe("");
  });

  it("maps a single-value Other Medical test from the root of its API object", () => {
    expect(valueOf("fbs", "Medical Type")).toBe("REGULAR MEDICAL");
    expect(valueOf("fbs", "Date")).toBe("02/01/2026");
    expect(valueOf("fbs", "Examinee Name")).toBe("ASHOK KUMAR");
    expect(valueOf("fbs", "Examinee Gender")).toBe("MALE");
    expect(valueOf("fbs", "Diagnostic Centre Address")).toBe("2578, basement, opposite");
    expect(valueOf("fbs", "Diagnostic Centre Pincode")).toBe("400001");
    expect(valueOf("fbs", "Doctor Registration No")).toBe("0");
    expect(valueOf("fbs", "Value")).toBe("92");
    expect(valueOf("fbs", "Lab Range Start")).toBe("70");
    expect(valueOf("fbs", "Lab Range End")).toBe("100");
    expect(valueOf("fbs", "Unit Value")).toBe("mg/dL");
    expect(valueOf("fbs", "Findings")).toBe("Normal");
  });

  it("maps Microalbuminuria and PSA: Findings reads value, Result reads findings", () => {
    expect(valueOf("psa", "Test Date")).toBe("02/01/2026");
    expect(valueOf("psa", "Findings")).toBe("2.8");
    expect(valueOf("psa", "Result")).toBe("Normal");
    expect(valueOf("psa", "Unit Value")).toBe("ng/mL");
    expect(valueOf("microalbuminuria", "Findings")).toBe("");
  });

  it("does not read HBsAg's result from parameters[]; the root value is null", () => {
    expect(valueOf("hbsag", "Value")).toBe("");
    expect(valueOf("hbsag", "Date")).toBe("01/01/2026");
    expect(valueOf("hbsag", "Diagnostic Centre Name")).toBe("AI Healthcare");
    expect(valueOf("hbsag", "Doctor Registration No")).toBe("0");
  });

  it("keeps defaults for Other Medical tests that are empty in the response", () => {
    expect(valueOf("cot", "Value")).toBe("");
    expect(valueOf("ghb", "Examinee Name")).toBe("");
  });

  it("maps CBC header fields and fills each parameter row by paramName", () => {
    expect(valueOf("cbc_group", "Date")).toBe("01/01/2026");
    expect(valueOf("cbc_group", "Medical Type")).toBe("REGULAR MEDICAL");
    const section = sectionOf("cbc_group");
    expect(section.parameterValues).toHaveLength(section.parameters?.length ?? -1);
    expect(section.parameterValues?.[0]).toEqual({
      value: "16.90",
      from: "13.0",
      to: "17.0",
      unit: "gm/dL",
    });
  });

  it("fills every parameter-list test with one entry per UI row, in UI order", () => {
    for (const key of ["cbc_group", "lft", "lipids", "ogtt_group", "rua_group", "sma12_group", "tft_group", "s13_group"]) {
      const section = sectionOf(key);
      expect(section.parameterValues, key).toHaveLength(section.parameters?.length ?? -1);
      const names = section.parameters?.map(([name]) => name) ?? [];
      const apiRoot = (medicalDataFetchMock.data.sections as unknown as Record<string, { parameters: { paramName: string; value: string | null }[] }>)[key];
      names.forEach((name, index) => {
        const item = apiRoot?.parameters.find((entry) => entry.paramName === name);
        expect(item, `${key}: ${name}`).toBeDefined();
        const dropdownValue = section.parameterValues?.[index]?.value ?? "";
        // A dropdown value outside the row's list is left empty, so only compare when it was kept.
        if (dropdownValue !== "") expect(dropdownValue).toBe(item?.value);
      });
    }
  });

  it("does not copy Findings from the API: the UI computes it from the range", () => {
    expect(Object.keys(sectionOf("cbc_group").parameterValues?.[0] ?? {}).sort()).toEqual(["from", "to", "unit", "value"]);
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

  it("keeps a section unchanged when the response has no object for it", () => {
    const result = mapMedicalFetchPayload({ data: { sections: {} } });
    const decision = result?.sections.find((section) => section.key === "decision");
    expect(decision).toBe(MEDICAL_SECTIONS.find((section) => section.key === "decision"));
  });
});
