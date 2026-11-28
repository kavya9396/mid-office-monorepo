export type CmoRemarksHistoryEntry = {
  role: string;
  name: string;
  ntid: string;
  date: string;
  decision: string;
  remarks: string;
};

/** One decision-table row. `fields` are keyed by `cmoDecisionFieldKey(columnLabel)`. */
export type DecisionHistoryRow = {
  id: string;
  fields: Record<string, string>;
  remarksHistory: CmoRemarksHistoryEntry[];
};

/** DRS column label to the fetch-row field. "Medical Type" -> "medicalType". */
export function cmoDecisionFieldKey(label: string): string {
  const words = label.trim().split(/[^A-Za-z0-9]+/).filter((word) => word.length > 0);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}
