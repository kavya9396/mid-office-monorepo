import type { ComparisonRow } from "@insurance-poc/common/decision-bar";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "14/08/2026, 1108hrs" or "2026-08-14T11:08:00+05:30" -> "14 Aug 2026, 11:08:00 am" (prototype output)
export const formatBreTimestamp = (value?: string) => {
  const text = value?.trim() ?? "";
  const legacy = text.match(/^(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2})(\d{2})hrs$/i);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  const parts = legacy
    ? { day: legacy[1], month: legacy[2], year: legacy[3], hours: legacy[4], minutes: legacy[5] }
    : iso
      ? { day: iso[3], month: iso[2], year: iso[1], hours: iso[4], minutes: iso[5] }
      : null;
  if (!parts) return "";
  const { day, month, year, hours, minutes } = parts;
  const hour12 = Number(hours) % 12 || 12;
  const meridiem = Number(hours) < 12 ? "am" : "pm";
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${String(hour12).padStart(2, "0")}:${minutes}:00 ${meridiem}`;
};

/** The BRE fields shown in the comparison table. */
export interface BreRowSource {
  decision: string;
  remarks: string;
  discrepancy: string;
  timestamp: string;
}

export const buildBreRows = (initial: BreRowSource, final: BreRowSource): ComparisonRow[] => [
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

// "ACR#OCD#PAN" -> ["ACR", "OCD", "PAN"]; a lone "-" means no discrepancy.
export const splitDiscrepancies = (value: string) =>
  value
    .split("#")
    .map((token) => token.trim())
    .filter((token) => token !== "" && token !== "-");
