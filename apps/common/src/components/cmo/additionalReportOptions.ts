import { getMasterList, type MasterListEntry } from "@insurance-poc/utils";

const ADDITIONAL_REPORT_MASTER = "misc";
const ADDITIONAL_REPORT_TYPE = "CMO_PERS_REP";

function isActive(entry: MasterListEntry): boolean {
  return entry.isActive.trim().toUpperCase() === "Y";
}

/** Additional Report dropdown. Rows come from master `misc` / `CMO_PERS_REP`. */
export function getAdditionalReportOptions(): { label: string; value: string }[] {
  return getMasterList(ADDITIONAL_REPORT_MASTER, ADDITIONAL_REPORT_TYPE)
    .filter((entry) => isActive(entry) && entry.description.trim().length > 0)
    .map((entry) => ({ label: entry.description, value: entry.description }));
}

/** Stand-in fields until the DRS API supplies the Additional Report form. */
export const ADDITIONAL_REPORT_FIELDS = [
  { key: "reportName", label: "Report Name", required: true, type: "text" },
  { key: "reportDate", label: "Report Date", required: false, type: "date" },
  { key: "findings", label: "Findings", required: false, type: "text" },
  { key: "remarks", label: "Remarks", required: false, type: "text" },
] as const;

export type AdditionalReportValues = Record<(typeof ADDITIONAL_REPORT_FIELDS)[number]["key"], string>;

export const EMPTY_ADDITIONAL_REPORT: AdditionalReportValues = {
  reportName: "",
  reportDate: "",
  findings: "",
  remarks: "",
};
