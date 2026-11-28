/**
 * Builds the request of POST /icic-medical-service/v1/medical-data/save (see
 * mock/medical/medical-data-save.json). It is the inverse of `mapMedicalFetchPayload`: only the
 * sections of the unit being saved are put in `sections`, each in the shape the fetch returns.
 * Pure: no I/O, no React.
 */
import {
  getVisibleMedicalQuestions,
  resolveMedicalControlKind,
  type MedicalSection,
} from "./medical.config";
import {
  BP_SECTION_KEY,
  FAMILY_SOURCES,
  FIELD_SOURCES,
  HABIT_SOURCES,
  HABITS,
  mapMedicalFetchPayload,
  MER_HABIT_KEYS,
  QUESTIONNAIRE_SOURCES,
} from "./medical.mapper";
import { MEDICAL_BP_READING_LABEL } from "./medical.schema";

export interface MedicalSaveRequest {
  applicationNumber: string;
  partyId: string;
  createdBy: string;
  /** Only the sections that were edited, nested the same way as `data.sections` of the fetch. */
  sections: Record<string, unknown>;
}

/**
 * Save API response envelope. `error: true` (or a `response_code` other than 200) is a validation
 * or failure result; `message` is shown to the user as-is.
 */
export interface MedicalSaveResponse {
  response_code: number;
  error: boolean;
  message: string;
  data?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const textOf = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** One field-level error: a string, or an object with a `message` (and optionally the `field` it belongs to). */
const fieldErrorText = (item: unknown): string => {
  if (typeof item === "string") return item.trim();
  if (!isRecord(item)) return "";
  const message = textOf(item.message);
  const field = textOf(item.field);
  if (message === "") return "";
  return field === "" || message.toLowerCase().includes(field.toLowerCase())
    ? message
    : `${field}: ${message}`;
};

/**
 * Field-level errors of a failed save, read from `data.errors` or `data.fieldErrors`:
 * an array of strings, an array of `{ field, message }`, or an object of `field -> message`.
 */
export function readMedicalSaveFieldErrors(data: unknown): string[] {
  if (!isRecord(data)) return [];
  const source = data.errors ?? data.fieldErrors;
  let entries: string[] = [];
  if (Array.isArray(source)) {
    entries = source.map(fieldErrorText);
  } else if (isRecord(source)) {
    entries = Object.entries(source).map(([field, message]) => {
      const text = textOf(message);
      return text === "" ? "" : `${field}: ${text}`;
    });
  }
  return entries.filter((entry) => entry !== "");
}

/**
 * Text the screen shows for a save result. A success shows the API's top-level `message` only.
 * A failure shows that message with every field-level error joined after it, e.g.
 * `Validation failed: firstName: First Name is required; gender: Gender is invalid`.
 * `fallback` is used when the API sent no message.
 */
export function formatMedicalSaveMessage(response: MedicalSaveResponse, fallback: string): string {
  const message = textOf(response.message);
  const failed = response.error || response.response_code !== 200;
  if (!failed) return message || fallback;
  const fieldErrors = readMedicalSaveFieldErrors(response.data);
  if (fieldErrors.length === 0) return message || fallback;
  const head = message === "" ? fallback : message;
  let end = head.length;
  while (end > 0 && /[.:\s]/.test(head.charAt(end - 1))) end--;
  return `${head.slice(0, end)}: ${fieldErrors.join("; ")}`;
}

/**
 * Re-reads the saved sections from a successful save response. The response echoes the fetch structure
 * (`data.sections`, with the real `memberId`, `habitId`, `readingId`, `responseId` and the stored values), so it
 * is mapped with the fetch mapper. Only the sections of the saved unit are returned, and only those the response
 * actually carries; sections the user fills in themselves (`alwaysEditable`, e.g. Decision) are left as typed.
 * An unreadable response returns `[]`, so the screen keeps what the user entered.
 */
export function readMedicalSaveSections(
  response: MedicalSaveResponse,
  sectionKeys: readonly string[],
): readonly MedicalSection[] {
  // A section without a fetch source is returned by the mapper as the unchanged config, which would overwrite
  // the fetched values: only sections the save sends (and so the response echoes) are refreshed.
  const hasSaveTarget = (key: string): boolean =>
    key === BP_SECTION_KEY ||
    [QUESTIONNAIRE_SOURCES, HABIT_SOURCES, FAMILY_SOURCES, FIELD_SOURCES].some((sources) =>
      sources.some((source) => source.sectionKey === key),
    );
  try {
    const mapped = mapMedicalFetchPayload({ data: response.data });
    return (mapped?.sections ?? []).filter(
      (section) =>
        sectionKeys.includes(section.key) && section.alwaysEditable !== true && hasSaveTarget(section.key),
    );
  } catch {
    return [];
  }
}

export interface BuildMedicalSaveRequestOptions {
  applicationNumber: string;
  partyId: string;
  /** Logged-in user id, the same value the header profile shows (`getSessionUser().username`). */
  createdBy: string;
  /** The sections of the edit unit being saved. */
  sections: readonly MedicalSection[];
  /** `store.snapshot()` of the form. */
  values: Readonly<Record<string, string>>;
}

type Json = Record<string, unknown>;

/** Sections whose numeric fields are sent as JSON numbers (the save sample sends them as numbers). */
const NUMERIC_FIELD_SECTION_KEYS: ReadonlySet<string> = new Set(["measurement", "tele_measurements"]);

const DD_MM_YYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** "" becomes null so the API clears the value instead of storing an empty string. */
const orNull = (value: string): string | null => (value === "" ? null : value);

const toNumberOrNull = (value: string): number | null => {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** DD/MM/YYYY (form) to YYYY-MM-DD (API). Any other text is sent unchanged. */
const toIsoDate = (value: string): string => {
  const match = DD_MM_YYYY.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const setAtPath = (root: Json, path: readonly string[], value: unknown): void => {
  let node = root;
  path.slice(0, -1).forEach((key) => {
    const existing = node[key];
    if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
      node = existing as Json;
      return;
    }
    const created: Json = {};
    node[key] = created;
    node = created;
  });
  const last = path.at(-1);
  if (last !== undefined) node[last] = value;
};

const fieldValueId = (sectionKey: string, index: number) => `${sectionKey}-${index}`;

/** Fields of a section: `{ apiKey: value }` for every label the fetch maps. */
function buildFields(section: MedicalSection, values: Readonly<Record<string, string>>): Json {
  const source = FIELD_SOURCES.find((item) => item.sectionKey === section.key);
  const body: Json = {};
  if (!source) return body;
  section.fields.forEach(([label], index) => {
    const mapped = source.keys[label];
    const apiKey = typeof mapped === "string" ? mapped : mapped?.[0];
    if (!apiKey) return;
    const value = values[fieldValueId(section.key, index)] ?? "";
    if (NUMERIC_FIELD_SECTION_KEYS.has(section.key)) {
      body[apiKey] = toNumberOrNull(value);
    } else if (resolveMedicalControlKind(section.key, label) === "date") {
      body[apiKey] = orNull(toIsoDate(value));
    } else {
      body[apiKey] = orNull(value);
    }
  });
  return body;
}

/** Findings of a parameter row, computed the way the screen shows it (non numeric values are Normal). */
const parameterFindings = (value: string, from: string, to: string): string | null => {
  if (value === "" || from === "" || to === "") return null;
  const current = Number(value);
  const abnormal = !Number.isNaN(current) && (current < Number(from) || current > Number(to));
  return abnormal ? "ABNORMAL" : "NORMAL";
};

/** Habit indicator as the API code: the master (misc YESNO) code is sent as is. */
const toIndicatorCode = (value: string): string | null => orNull(value);

function buildParameters(section: MedicalSection, values: Readonly<Record<string, string>>): Json[] {
  return (section.parameters ?? []).map(([name, defaultUnit], index) => {
    const prefix = `${section.key}-param-${index}`;
    const fetched = section.parameterValues?.[index];
    const value = values[`${prefix}-value`] ?? "";
    const from = values[`${prefix}-from`] ?? "";
    const to = values[`${prefix}-to`] ?? "";
    return {
      ...(fetched?.paramId !== undefined ? { paramId: fetched.paramId } : {}),
      ...(fetched?.id !== undefined ? { id: fetched.id } : {}),
      parameter: name,
      value: orNull(value),
      labRangeStart: orNull(from),
      labRangeEnd: orNull(to),
      unit: orNull(values[`${prefix}-unit`] ?? defaultUnit),
      findings: parameterFindings(value, from, to),
    };
  });
}

/**
 * Tele habits are an array `{ value: [{ habit, habitId, indicator, quantity, year }] }`, the same shape
 * the fetch returns and the save sample sends. MER habits stay flat keys.
 */
function buildTeleHabits(section: MedicalSection, values: Readonly<Record<string, string>>): Json {
  const valueOf = (label: string): string => {
    const index = section.fields.findIndex(([fieldLabel]) => fieldLabel === label);
    return index < 0 ? "" : (values[fieldValueId(section.key, index)] ?? "");
  };
  return {
    value: HABITS.map(({ api, habit, tele }) => {
      const indicator = valueOf(`${tele} - Indicator`);
      const habitId = section.habitIds?.[api];
      return {
        habit,
        ...(habitId !== undefined ? { habitId } : {}),
        indicator: toIndicatorCode(indicator),
        quantity: orNull(valueOf(`${tele} - Quantity`)),
        year: toNumberOrNull(valueOf(`${tele} - No. of Year`)),
      };
    }),
  };
}

function buildHabits(section: MedicalSection, values: Readonly<Record<string, string>>): Json {
  if (section.key !== "habit_and_addictions") return buildTeleHabits(section, values);
  const keys = MER_HABIT_KEYS;
  const body: Json = {};
  section.fields.forEach(([label], index) => {
    const apiKey = keys[label];
    if (!apiKey) return;
    const value = values[fieldValueId(section.key, index)] ?? "";
    if (label.endsWith(" - Indicator")) {
      body[apiKey] = toIndicatorCode(value);
    } else if (label.endsWith(" - No. of Year")) {
      body[apiKey] = toNumberOrNull(value);
    } else {
      body[apiKey] = orNull(value);
    }
  });
  return body;
}

/**
 * Family members. Every member that stays is sent with `isActive: "Y"`. A member that came from the fetch
 * and was removed on the screen is sent once more, with the values it was fetched with and `isActive: "N"`,
 * so the API deactivates it. A row that was added and removed before saving never existed, so it is not sent.
 */
function buildFamily(section: MedicalSection, values: Readonly<Record<string, string>>): Json {
  const rowIds = (values[`${section.key}-rows`] ?? "").split(",").filter((id) => id !== "");
  const members = rowIds.map((rowId) => {
    const prefix = `${section.key}-row-${rowId}`;
    const alive = values[`${prefix}-alive`] ?? "";
    // Rows that came from the fetch are numbered 1..n in fetch order, so they keep their memberId.
    const memberId = section.familyRows?.[Number(rowId) - 1]?.memberId;
    return {
      memberId: memberId ?? null,
      relationType: orNull(values[`${prefix}-relation`] ?? ""),
      age: toNumberOrNull(values[`${prefix}-age`] ?? ""),
      deadOrAlive: orNull(alive),
      healthStatus: orNull(values[`${prefix}-health`] ?? ""),
      isActive: "Y",
    };
  });
  const removed = (section.familyRows ?? []).flatMap((row, index) =>
    row.memberId === undefined || rowIds.includes(String(index + 1))
      ? []
      : [
          {
            memberId: row.memberId,
            relationType: orNull(row.relation),
            age: toNumberOrNull(row.age ?? ""),
            deadOrAlive: orNull(row.alive ?? ""),
            healthStatus: orNull(row.health ?? ""),
            isActive: "N",
          },
        ],
  );
  return { members: [...members, ...removed] };
}

function buildBloodPressure(section: MedicalSection, values: Readonly<Record<string, string>>): Json {
  const bySeq = new Map<number, { systolic: number | null; diastolic: number | null }>();
  const plain: Record<string, number | null> = {};
  section.fields.forEach(([label], index) => {
    const value = values[fieldValueId(section.key, index)] ?? "";
    const reading = MEDICAL_BP_READING_LABEL.exec(label);
    if (reading) {
      const seq = Number(reading[2]);
      const entry = bySeq.get(seq) ?? { systolic: null, diastolic: null };
      if (reading[1] === "Systolic") entry.systolic = toNumberOrNull(value);
      else entry.diastolic = toNumberOrNull(value);
      bySeq.set(seq, entry);
    } else if (label === "Avg Systolic") plain.avgSystolic = toNumberOrNull(value);
    else if (label === "Avg Diastolic") plain.avgDiastolic = toNumberOrNull(value);
    else if (label === "Pulse Rate") plain.pulseRate = toNumberOrNull(value);
  });
  const readings = [...bySeq.entries()]
    .sort(([a], [b]) => a - b)
    .map(([seq, entry]) => ({
      ...(section.readingIds?.[String(seq)] !== undefined
        ? { readingId: section.readingIds[String(seq)] }
        : {}),
      readingSeq: seq,
      ...entry,
    }));
  return { readings, ...plain };
}

function buildQuestions(section: MedicalSection, values: Readonly<Record<string, string>>): Json {
  const questions = section.questionnaire ?? [];
  const responseOf = (id: string) => values[`${section.key}-q-${id}-response`] ?? "";
  const visibleIds = new Set(getVisibleMedicalQuestions(questions, responseOf).map((q) => q.id));
  return {
    questions: questions.map((question) => {
      // An answer to a question that is no longer shown (its parent answer changed) is cleared.
      const visible = visibleIds.has(question.id);
      return {
        id: question.id,
        parentId: question.parentId,
        section: question.section,
        responseId: question.responseId ?? null,
        response: visible ? orNull(responseOf(question.id)) : null,
        remarks: visible ? orNull(values[`${section.key}-q-${question.id}-remarks`] ?? "") : null,
      };
    }),
  };
}

/** Body of one section, or `undefined` when the section has no save target. */
function buildSectionBody(
  section: MedicalSection,
  values: Readonly<Record<string, string>>,
): { path: readonly string[]; body: Json } | undefined {
  if (section.key === BP_SECTION_KEY) {
    return {
      path: ["mer", "blood_pressure_and_pulse"],
      body: buildBloodPressure(section, values),
    };
  }
  const questionnaire = QUESTIONNAIRE_SOURCES.find((item) => item.sectionKey === section.key);
  if (questionnaire) {
    return { path: questionnaire.paths[0], body: buildQuestions(section, values) };
  }
  const habit = HABIT_SOURCES.find((item) => item.sectionKey === section.key);
  if (habit) return { path: habit.paths[0], body: buildHabits(section, values) };
  const family = FAMILY_SOURCES.find((item) => item.sectionKey === section.key);
  if (family) return { path: family.paths[0], body: buildFamily(section, values) };
  const fieldSource = FIELD_SOURCES.find((item) => item.sectionKey === section.key);
  if (!fieldSource) return undefined;

  const body: Json = {
    ...(section.testDtlId !== undefined ? { testDtlId: section.testDtlId } : {}),
    ...(section.medAppDtlId !== undefined ? { medAppDtlId: section.medAppDtlId } : {}),
    ...buildFields(section, values),
  };
  if (section.parameters) body.parameters = buildParameters(section, values);
  if (section.paramId !== undefined) body.paramId = section.paramId;
  if (section.fieldIds !== undefined) body.fieldIds = section.fieldIds;
  if (section.testDtlId !== undefined) body.isActive = "Y";
  return { path: fieldSource.paths[0], body };
}

/** Creates the Save request for the sections of the edited unit. */
export function buildMedicalSaveRequest({
  applicationNumber,
  partyId,
  createdBy,
  sections,
  values,
}: BuildMedicalSaveRequestOptions): MedicalSaveRequest {
  const body: Json = {};
  sections.forEach((section) => {
    const built = buildSectionBody(section, values);
    if (built) setAtPath(body, built.path, built.body);
  });
  return { applicationNumber, partyId, createdBy, sections: body };
}
