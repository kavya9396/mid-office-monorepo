import type { ComparisonRow } from "@insurance-poc/common/decision-bar";
import type { BreDecision } from "../../services/drsService";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "14/08/2026, 1108hrs" -> "14 Aug 2026, 11:08:00 am" (same output as the prototype)
export const formatBreTimestamp = (value?: string) => {
  const match = value?.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2})(\d{2})hrs$/i);
  if (!match) return "";
  const [, day, month, year, hours, minutes] = match;
  const hour12 = Number(hours) % 12 || 12;
  const meridiem = Number(hours) < 12 ? "am" : "pm";
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${String(hour12).padStart(2, "0")}:${minutes}:00 ${meridiem}`;
};

export const buildBreRows = (initial: BreDecision, final: BreDecision): ComparisonRow[] => [
  {
    label: "BRE Status",
    initial: initial.decision ? "Success" : "-",
    final: final.decision ? "Success" : "-",
  },
  { label: "BRE Decision", initial: initial.decision, final: final.decision, diff: "value" },
  { label: "BRE Remarks", initial: initial.remarks, final: final.remarks },
  {
    label: "BRE Discrepancy",
    initial: initial.discrepancy,
    final: final.discrepancy,
    diff: "tokens",
  },
  {
    label: "BRE Timestamp",
    initial: formatBreTimestamp(initial.timestamp),
    final: formatBreTimestamp(final.timestamp),
  },
];

// "ACR#OCD#PAN" -> ["ACR", "OCD", "PAN"]
export const splitDiscrepancies = (value: string) =>
  value
    .split("#")
    .map((token) => token.trim())
    .filter(Boolean);
