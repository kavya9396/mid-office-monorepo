import { getMasterList, type MasterListEntry } from "@insurance-poc/utils";

const SPECIAL_MEDICAL_MASTER = "misc";
const SPECIAL_MEDICAL_TYPE = "CMO_SPEC_MED";

export const SPECIAL_MEDICAL_MASTER_EMPTY_MESSAGE = "Need to add data in master";
export const SPECIAL_MEDICAL_FIELDS_MISSING_MESSAGE = "Need to add fields in medical config";

function isActive(entry: MasterListEntry): boolean {
  return entry.isActive.trim().toUpperCase() === "Y";
}

/** Special Medical dropdown. Rows come from master `misc` / `CMO_SPEC_MED` (mock now, the same type in real mode). */
export function getSpecialMedicalOptions(): { label: string; value: string }[] {
  return getMasterList(SPECIAL_MEDICAL_MASTER, SPECIAL_MEDICAL_TYPE)
    .filter((entry) => isActive(entry) && entry.description.trim().length > 0)
    .map((entry) => ({ label: entry.description, value: entry.description }));
}
