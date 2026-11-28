import type { CmoRemarksHistoryEntry, DecisionHistoryRow } from "@insurance-poc/common/cmo";

/** `membersDetails[].sections[hoCmoMedicalDecision]` title and column labels. */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type CmoDecisionSection = {
  title: string;
  columns: string[];
};

export function readCmoDecisionSection(membersDetails: unknown): CmoDecisionSection {
  if (!Array.isArray(membersDetails)) return { title: "", columns: [] };
  for (const member of membersDetails) {
    if (!isRecord(member) || !Array.isArray(member.sections)) continue;
    for (const section of member.sections) {
      if (!isRecord(section) || section.name !== "hoCmoMedicalDecision") continue;
      const value = isRecord(section.value) ? section.value : {};
      const columns = Array.isArray(value.columns)
        ? value.columns.flatMap((column) => {
            const label = isRecord(column) && typeof column.label === "string" ? column.label.trim() : "";
            return label.length > 0 ? [label] : [];
          })
        : [];
      return {
        title: typeof section.label === "string" ? section.label : "",
        columns,
      };
    }
  }
  return { title: "", columns: [] };
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function parsedBody(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const payload = value.trim();
  if (!payload.startsWith("{") && !payload.startsWith("[")) return value;
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return value;
  }
}

function mapHistory(value: unknown): CmoRemarksHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    return [{
      role: text(entry.poolName),
      name: text(entry.userName),
      ntid: text(entry.ntid),
      date: text(entry.updatedOn),
      decision: text(entry.decision),
      remarks: text(entry.remarks),
    }];
  });
}

/** Fetch `specialTests[]` fields, keyed the same way as a DRS column label (`medicalType`, `cmoRemarks`). */
function fieldsFromTest(test: Record<string, unknown>): Record<string, string> {
  const current = isRecord(test.currentDecision) ? test.currentDecision : {};
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(test)) {
    if (key === "currentDecision" || key === "history") continue;
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      fields[key] = text(value);
    }
  }
  fields.cmoRemarks = text(current.cmoRemarks);
  fields.cmoDecision = text(current.cmoDecision);
  return fields;
}

/** `data.specialTests[]` into decision-table rows. Null, empty, or partial tests become blank cells. */
export function mapCmoDecisionRows(payload: unknown): DecisionHistoryRow[] {
  try {
    const root = parsedBody(payload);
    const data = isRecord(root) && isRecord(root.data) ? root.data : isRecord(root) ? root : {};
    const tests = data.specialTests;
    if (!Array.isArray(tests)) return [];
    return tests.flatMap((test, index) => {
      if (!isRecord(test)) return [];
      return [{
        id: text(test.testDtlId) || String(index + 1),
        fields: fieldsFromTest(test),
        remarksHistory: mapHistory(test.history),
      }];
    });
  } catch {
    return [];
  }
}
