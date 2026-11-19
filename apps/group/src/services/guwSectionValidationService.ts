import { getSessionUser } from "@insurance-poc/utils";

/**
 * Claim Audit / Special Remarks "Validate" clicks. There is no validation API: the clicks are kept in the browser
 * session, per logged-in user, application (or member) and section. Main Submit requires every row to be validated.
 */

export type GuwValidationSection = "claimAudit" | "specialRemarks";

export interface GuwRequiredValidations {
  /** Ids of the Claim Audit rows that must be validated (empty = nothing to validate). */
  claimAuditRowIds: string[];
  /** Ids of the Special Remarks rows that must be validated (empty = nothing to validate). */
  specialRemarksRowIds: string[];
}

const SECTION_LABELS: Record<GuwValidationSection, string> = {
  claimAudit: "Claim Audit",
  specialRemarks: "Special Remarks",
};

const storageKeyOf = (key: string, section: GuwValidationSection) =>
  `guwSectionValidation:${getSessionUser()?.username ?? ""}:${key}:${section}`;

export function loadValidatedRowIds(key: string, section: GuwValidationSection): string[] {
  if (!key || typeof window === "undefined") return [];
  const raw = window.sessionStorage.getItem(storageKeyOf(key, section));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Records one validated row and returns the updated list of validated ids. */
export function markRowValidated(key: string, section: GuwValidationSection, rowId: string): string[] {
  const ids = loadValidatedRowIds(key, section);
  if (ids.includes(rowId)) return ids;
  const next = [...ids, rowId];
  if (key && typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKeyOf(key, section), JSON.stringify(next));
  }
  return next;
}

/** Error message for the first section that still has rows not validated, or null when all are validated. */
export function findPendingValidationMessage(
  key: string,
  required: GuwRequiredValidations | undefined,
): string | null {
  if (!required) return null;
  const checks: [GuwValidationSection, string[]][] = [
    ["claimAudit", required.claimAuditRowIds],
    ["specialRemarks", required.specialRemarksRowIds],
  ];
  for (const [section, rowIds] of checks) {
    if (rowIds.length === 0) continue;
    const validated = loadValidatedRowIds(key, section);
    if (rowIds.some((id) => !validated.includes(id))) {
      return `Please validate all ${SECTION_LABELS[section]} records before submitting`;
    }
  }
  return null;
}
