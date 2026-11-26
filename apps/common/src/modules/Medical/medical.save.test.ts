import { describe, expect, it } from "vitest";
import medicalDataFetchMock from "../../../../../mock/medical/medical-data-fetch-merged.json";
import medicalDataFetchV4Mock from "../../../../../mock/medical/medical-data-fetch.json";
import medicalDataSaveMock from "../../../../../mock/medical/medical-data-save.json";
import { mapMedicalFetchPayload } from "./medical.mapper";
import { buildMedicalSaveRequest, formatMedicalSaveMessage, readMedicalSaveSections } from "./medical.save";
import { parseMedicalQuestionnaire, type MedicalSection } from "./medical.config";

const mapped = mapMedicalFetchPayload(medicalDataFetchMock);

const sectionOf = (key: string): MedicalSection => {
  const section = mapped?.sections.find((item) => item.key === key);
  if (!section) throw new Error(`Section ${key} not mapped`);
  return section;
};

/** The store ids a freshly fetched section starts with (same ids the screen uses). */
const initialValues = (section: MedicalSection): Record<string, string> => {
  const values: Record<string, string> = {};
  section.fields.forEach(([, value], index) => {
    values[`${section.key}-${index}`] = value;
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
  section.questionnaire?.forEach((question) => {
    values[`${section.key}-q-${question.id}-response`] = question.response ?? "";
    values[`${section.key}-q-${question.id}-remarks`] = question.remarks ?? "";
  });
  if (section.layout === "familyHistory") {
    const rows = section.familyRows ?? [];
    values[`${section.key}-rows`] = rows.map((_, i) => String(i + 1)).join(",");
    rows.forEach((row, i) => {
      const prefix = `${section.key}-row-${i + 1}`;
      values[`${prefix}-relation`] = row.relation;
      if (row.age !== undefined) values[`${prefix}-age`] = row.age;
      if (row.alive !== undefined) values[`${prefix}-alive`] = row.alive;
      if (row.health !== undefined) values[`${prefix}-health`] = row.health;
    });
  }
  return values;
};

const build = (keys: readonly string[], overrides: Record<string, string> = {}) => {
  const sections = keys.map(sectionOf);
  const values = Object.assign({}, ...sections.map(initialValues), overrides) as Record<string, string>;
  return buildMedicalSaveRequest({
    applicationNumber: "OS90377743",
    partyId: "party-1",
    createdBy: "UW002",
    sections,
    values,
  });
};

const fieldIndex = (section: MedicalSection, label: string): number =>
  section.fields.findIndex(([fieldLabel]) => fieldLabel === label);

describe("buildMedicalSaveRequest", () => {
  it("sends only the edited section, not the whole screen", () => {
    const request = build(["2decho"]);
    expect(request.applicationNumber).toBe("OS90377743");
    expect(request.partyId).toBe("party-1");
    expect(request.createdBy).toBe("UW002");
    expect(Object.keys(request.sections)).toEqual(["2decho"]);
  });

  it("sends a combined MER unit as one nested mer object", () => {
    const request = build(["mer", "habit_addictions", "measurement", "family_history_health_status"]);
    expect(Object.keys(request.sections)).toEqual(["mer"]);
    const mer = request.sections.mer as Record<string, unknown>;
    expect(Object.keys(mer).sort()).toEqual(
      ["details", "family_history", "habit_and_addictions", "measurement"].sort(),
    );
  });

  it("echoes testDtlId and fieldIds so the API updates the stored test", () => {
    const section = sectionOf("2decho");
    const request = build(["2decho"]);
    const body = request.sections["2decho"] as Record<string, unknown>;
    expect(body.testDtlId).toBe(section.testDtlId);
    expect(body.fieldIds).toEqual(section.fieldIds);
  });

  it("sends the value the user changed, with the date as YYYY-MM-DD", () => {
    const section = sectionOf("2decho");
    const remarkIndex = fieldIndex(section, "Remarks");
    const dateIndex = fieldIndex(section, "Test Date");
    const request = build(["2decho"], {
      [`2decho-${remarkIndex}`]: "Edited remark",
      [`2decho-${dateIndex}`]: "05/03/2026",
    });
    const body = request.sections["2decho"] as Record<string, unknown>;
    expect(body.remarks).toBe("Edited remark");
    expect(body.testDate).toBe("2026-03-05");
  });

  it("sends an emptied field as null", () => {
    const section = sectionOf("2decho");
    const remarkIndex = fieldIndex(section, "Remarks");
    const request = build(["2decho"], { [`2decho-${remarkIndex}`]: "" });
    expect((request.sections["2decho"] as Record<string, unknown>).remarks).toBeNull();
  });

  it("sends habit indicators as Y / N and years as numbers", () => {
    const section = sectionOf("habit_addictions");
    const indicator = fieldIndex(section, "Cigarettes/beedis/cigar - Indicator");
    const year = fieldIndex(section, "Cigarettes/beedis/cigar - No. of Year");
    const request = build(["habit_addictions"], {
      [`habit_addictions-${indicator}`]: "Yes",
      [`habit_addictions-${year}`]: "7",
    });
    const habits = (request.sections.mer as { habit_and_addictions: Record<string, unknown> })
      .habit_and_addictions;
    expect(habits.cigarettesBeedisCigar).toBe("Y");
    expect(habits.cigarettesBeedisCigarYear).toBe(7);
  });

  it("sends Tele habits as a value[] array with the fetched habitId", () => {
    const teleMapped = mapMedicalFetchPayload(medicalDataFetchV4Mock);
    const section = teleMapped?.sections.find((item) => item.key === "tele_habit_addiction");
    if (!section) throw new Error("tele_habit_addiction not mapped");
    const indicator = fieldIndex(section, "Cigarette/beedis/cigar - Indicator");
    const year = fieldIndex(section, "Cigarette/beedis/cigar - No. of Year");
    const quantity = fieldIndex(section, "Cigarette/beedis/cigar - Quantity");
    const request = buildMedicalSaveRequest({
      applicationNumber: "OS90377743",
      partyId: "party-1",
      createdBy: "UW002",
      sections: [section],
      values: {
        ...initialValues(section),
        [`tele_habit_addiction-${indicator}`]: "Yes",
        [`tele_habit_addiction-${quantity}`]: "6",
        [`tele_habit_addiction-${year}`]: "3",
      },
    });
    const habits = (request.sections.tele_mer as { habit_and_addictions: { value: Record<string, unknown>[] } })
      .habit_and_addictions.value;
    expect(habits).toHaveLength(4);
    expect(habits[0]).toEqual({
      habit: "Cigarette/beedis/cigar",
      habitId: 166,
      indicator: "Y",
      quantity: "6",
      year: 3,
    });
    expect(habits.map((habit) => habit.habitId)).toEqual([166, 234, 235, 236]);
  });

  it("sends family members with their memberId and an upper-case deadOrAlive", () => {
    const section = sectionOf("family_history_health_status");
    const request = build(["family_history_health_status"]);
    const members = (request.sections.mer as { family_history: { members: Record<string, unknown>[] } })
      .family_history.members;
    expect(members).toHaveLength(section.familyRows?.length ?? 0);
    expect(members[0].memberId).toBe(section.familyRows?.[0].memberId ?? null);
    members.forEach((member) => {
      if (member.deadOrAlive !== null) expect(member.deadOrAlive).toBe(String(member.deadOrAlive).toUpperCase());
    });
  });

  it("sends isActive Y on every kept family member and N on a fetched member that was removed", () => {
    const section = sectionOf("family_history_health_status");
    const rows = section.familyRows ?? [];
    const removable = rows.findIndex((row) => row.memberId !== undefined);
    if (removable < 0) throw new Error("no fetched family member in the mock");
    const removedId = rows[removable].memberId;
    const keptRowIds = rows.map((_, i) => String(i + 1)).filter((id) => id !== String(removable + 1));
    const request = build(["family_history_health_status"], {
      "family_history_health_status-rows": keptRowIds.join(","),
    });
    const members = (request.sections.mer as { family_history: { members: Record<string, unknown>[] } })
      .family_history.members;
    const removed = members.filter((member) => member.isActive === "N");
    expect(removed).toHaveLength(1);
    expect(removed[0].memberId).toBe(removedId);
    expect(removed[0].relationType).toBe(rows[removable].relation);
    expect(members.filter((member) => member.isActive === "Y")).toHaveLength(keptRowIds.length);
  });

  it("sends isActive Y on every member when nothing was removed", () => {
    const section = sectionOf("family_history_health_status");
    const request = build(["family_history_health_status"]);
    const members = (request.sections.mer as { family_history: { members: Record<string, unknown>[] } })
      .family_history.members;
    expect(members).toHaveLength(section.familyRows?.length ?? 0);
    expect(members.every((member) => member.isActive === "Y")).toBe(true);
  });

  it("sends a family row added on the screen with memberId null and isActive Y", () => {
    const section = sectionOf("family_history_health_status");
    const count = section.familyRows?.length ?? 0;
    const newId = String(count + 1);
    const prefix = `family_history_health_status-row-${newId}`;
    const request = build(["family_history_health_status"], {
      "family_history_health_status-rows": Array.from({ length: count + 1 }, (_, i) => String(i + 1)).join(","),
      [`${prefix}-relation`]: "Brother",
      [`${prefix}-age`]: "41",
      [`${prefix}-alive`]: "Alive",
      [`${prefix}-health`]: "Healthy",
    });
    const members = (request.sections.mer as { family_history: { members: Record<string, unknown>[] } })
      .family_history.members;
    expect(members).toHaveLength(count + 1);
    expect(members[count]).toEqual({
      memberId: null,
      relationType: "Brother",
      age: 41,
      deadOrAlive: "ALIVE",
      healthStatus: "Healthy",
      isActive: "Y",
    });
    expect(members.slice(0, count).every((member) => member.isActive === "Y")).toBe(true);
  });

  it("sends questionnaire answers keyed by question id with the stored responseId", () => {
    const section = sectionOf("question_table");
    const first = section.questionnaire?.find((question) => question.parentId === null);
    if (!first) throw new Error("no top level question in the mock");
    const request = build(["question_table"], {
      [`question_table-q-${first.id}-response`]: "NO",
      [`question_table-q-${first.id}-remarks`]: "",
    });
    const questions = (request.sections.mer as { question_table: { questions: Record<string, unknown>[] } })
      .question_table.questions;
    const sent = questions.find((question) => question.id === first.id);
    expect(sent?.response).toBe("NO");
    expect(sent?.remarks).toBeNull();
    expect(sent?.responseId).toBe(first.responseId ?? null);
  });

  it("sends Place of Examination as the API code, as fetched and as edited", () => {
    const section = sectionOf("mer");
    const place = fieldIndex(section, "Place of Examination");
    expect(section.fields[place][1]).toBe("CLINIC");
    const unchanged = (build(["mer"]).sections.mer as { details: Record<string, unknown> }).details;
    expect(unchanged.placeOfExamination).toBe("CLINIC");
    const edited = (build(["mer"], { [`mer-${place}`]: "RES_OFFICE" }).sections.mer as {
      details: Record<string, unknown>;
    }).details;
    expect(edited.placeOfExamination).toBe("RES_OFFICE");
  });

  it("sends a multi-select answer with the option keys joined by #", () => {
    const section = sectionOf("tele_question_table");
    const multi = section.questionnaire?.find(
      (question) => question.questionType === "MULTISELECT" && (question.answerType?.length ?? 0) >= 2,
    );
    if (!multi?.answerType) throw new Error("no multi-select question in the mock");
    const [a, b] = multi.answerType;
    const request = build(["tele_question_table"], {
      [`tele_question_table-q-${multi.id}-response`]: `${a.key},${b.key}`,
    });
    const questions = (request.sections.tele_mer as { question_table: { questions: Record<string, unknown>[] } })
      .question_table.questions;
    expect(questions.find((question) => question.id === multi.id)?.response).toBe(`${a.key}#${b.key}`);
  });

  it("reads a stored #-joined multi-select answer back as separate selections", () => {
    const raw = [
      {
        id: "9",
        questionDesc: "Symptoms",
        questionType: "MULTISELECT",
        answerType: [
          { key: "Chest Pain", label: "Chest Pain" },
          { key: "Palpitations", label: "Palpitations" },
        ],
        section: "tele",
        response: "Chest Pain#Palpitations",
      },
    ];
    expect(parseMedicalQuestionnaire(raw)[0].response).toBe("Chest Pain,Palpitations");
  });

  it("sends parameter rows with computed findings", () => {
    const section = sectionOf("cbc_group");
    const request = build(["cbc_group"], {
      "cbc_group-param-0-value": "99",
      "cbc_group-param-0-from": "10",
      "cbc_group-param-0-to": "20",
    });
    const parameters = (request.sections.cbc_group as { parameters: Record<string, unknown>[] }).parameters;
    expect(parameters).toHaveLength(section.parameters?.length ?? 0);
    expect(parameters[0].value).toBe("99");
    expect(parameters[0].findings).toBe("ABNORMAL");
  });

  it("matches the section keys of the documented save sample", () => {
    const sample = (medicalDataSaveMock as { request: { sections: Record<string, unknown> } }).request.sections;
    expect(Object.keys(build(["2decho"]).sections)).toEqual(["2decho"].filter((key) => key in sample));
    expect(Object.keys(build(["blood_sugar_random"]).sections)).toEqual(
      ["blood_sugar_random"].filter((key) => key in sample),
    );
  });
});

describe("formatMedicalSaveMessage", () => {
  const failure = (data?: unknown, message = "Validation failed") => ({
    response_code: 400,
    error: true,
    message,
    data,
  });

  it("shows only the top-level message on success, even when data carries other fields", () => {
    const success = {
      response_code: 200,
      error: false,
      message: "Medical details saved successfully.",
      data: { errors: ["ignored"] },
    };
    expect(formatMedicalSaveMessage(success, "fallback")).toBe("Medical details saved successfully.");
  });

  it("uses the fallback when a success has no message", () => {
    expect(formatMedicalSaveMessage({ response_code: 200, error: false, message: "" }, "Saved")).toBe("Saved");
  });

  it("appends field errors given as an array of { field, message }", () => {
    const data = {
      errors: [
        { field: "firstName", message: "is required" },
        { field: "gender", message: "Gender is invalid" },
      ],
    };
    expect(formatMedicalSaveMessage(failure(data), "fallback")).toBe(
      "Validation failed: firstName: is required; Gender is invalid",
    );
  });

  it("appends field errors given as an array of strings", () => {
    const data = { errors: ["First Name is required", "Gender is invalid"] };
    expect(formatMedicalSaveMessage(failure(data), "fallback")).toBe(
      "Validation failed: First Name is required; Gender is invalid",
    );
  });

  it("appends field errors given as a field -> message object under fieldErrors", () => {
    const data = { fieldErrors: { firstName: "First Name is required", gender: "Gender is invalid" } };
    expect(formatMedicalSaveMessage(failure(data), "fallback")).toBe(
      "Validation failed: firstName: First Name is required; gender: Gender is invalid",
    );
  });

  it("does not repeat a trailing colon or full stop of the message", () => {
    expect(formatMedicalSaveMessage(failure({ errors: ["A"] }, "Validation failed."), "fallback")).toBe(
      "Validation failed: A",
    );
  });

  it("shows the message alone when there are no field errors", () => {
    expect(formatMedicalSaveMessage(failure({ errors: [] }), "fallback")).toBe("Validation failed");
    expect(formatMedicalSaveMessage(failure(undefined), "fallback")).toBe("Validation failed");
  });

  it("falls back, then lists the field errors, when a failure has no message", () => {
    expect(formatMedicalSaveMessage(failure({ errors: ["A"] }, ""), "Unable to save")).toBe("Unable to save: A");
    expect(formatMedicalSaveMessage(failure(undefined, ""), "Unable to save")).toBe("Unable to save");
  });

  it("skips blank or unreadable field errors", () => {
    const data = { errors: ["", "  ", 5, { field: "x" }, "Real error"] };
    expect(formatMedicalSaveMessage(failure(data), "fallback")).toBe("Validation failed: Real error");
  });
});
describe("readMedicalSaveSections", () => {
  /** A save response that echoes the fetch structure for the whole mock (the API returns the saved sections). */
  const echo = (data: unknown) => ({ response_code: 200, error: false, message: "saved", data });
  const fetchData = (medicalDataFetchMock as { data: unknown }).data;

  it("maps the echoed sections like a fetch, with the stored memberIds", () => {
    const [family] = readMedicalSaveSections(echo(fetchData), ["family_history_health_status"]);
    expect(family.key).toBe("family_history_health_status");
    const stored = sectionOf("family_history_health_status").familyRows ?? [];
    expect(stored.length).toBeGreaterThan(0);
    expect(family.familyRows?.map((row) => row.memberId)).toEqual(stored.map((row) => row.memberId));
  });

  it("returns only the sections of the saved unit", () => {
    const keys = readMedicalSaveSections(echo(fetchData), ["2decho", "family_history_health_status"]).map(
      (section) => section.key,
    );
    expect(keys.sort()).toEqual(["2decho", "family_history_health_status"]);
  });

  it("never returns a section the user fills in (Decision) or one the save does not send", () => {
    expect(readMedicalSaveSections(echo(fetchData), ["decision", "application_form_medical"])).toEqual([]);
  });

  it("gives a newly inserted family member the memberId the API assigned", () => {
    const data = JSON.parse(JSON.stringify(fetchData)) as {
      sections: { family_history: { members: Record<string, unknown>[] } };
    };
    data.sections.family_history.members.push({
      memberId: 9001,
      relationType: "SISTER",
      age: 30,
      deadOrAlive: "ALIVE",
      healthStatus: "Healthy",
      isActive: "Y",
    });
    const [family] = readMedicalSaveSections(echo(data), ["family_history_health_status"]);
    expect(family.familyRows?.at(-1)).toMatchObject({ relation: "Sister", memberId: 9001 });
  });

  it("drops a family member the API deactivated", () => {
    const data = JSON.parse(JSON.stringify(fetchData)) as {
      sections: { family_history: { members: Record<string, unknown>[] } };
    };
    const before = data.sections.family_history.members.length;
    data.sections.family_history.members[0].isActive = "N";
    const [family] = readMedicalSaveSections(echo(data), ["family_history_health_status"]);
    expect(family.familyRows).toHaveLength(before - 1);
  });

  it("returns nothing for a response that is not a fetch-shaped body, so the screen keeps what was entered", () => {
    expect(readMedicalSaveSections(echo(undefined), ["2decho"])).toEqual([]);
    expect(readMedicalSaveSections(echo({ sections: [] }), ["2decho"])).toEqual([]);
    expect(readMedicalSaveSections(echo("ok"), ["2decho"])).toEqual([]);
  });

  it("returns nothing when the response cannot be mapped (invalid questionnaire row)", () => {
    const bad = { sections: { question_table: { questionnaire: [{ id: 1 }] } } };
    expect(readMedicalSaveSections(echo(bad), ["question_table"])).toEqual([]);
  });
});