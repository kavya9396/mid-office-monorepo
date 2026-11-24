import { getMasterList, type MasterListEntry } from "@insurance-poc/utils";

const CMO_DECISION_MASTER = "misc";
const CMO_DECISION_TYPE = "CMO_DEC";

export const CMO_DECISION_MASTER_EMPTY_MESSAGE = "Need to add data in master";

function isActive(entry: MasterListEntry): boolean {
  return entry.isActive.trim().toUpperCase() === "Y";
}

/** CMO Decision dropdown. Rows come from master `misc` / `CMO_DEC`. */
export function getCmoDecisionOptions(): { label: string; value: string }[] {
  return getMasterList(CMO_DECISION_MASTER, CMO_DECISION_TYPE)
    .filter((entry) => isActive(entry) && entry.description.trim().length > 0)
    .map((entry) => ({ label: entry.description, value: entry.description }));
}
