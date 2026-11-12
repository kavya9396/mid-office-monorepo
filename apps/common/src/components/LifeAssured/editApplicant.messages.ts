/**
 * Every user-facing message of the Edit Applicant dialog (validation and NSDL PAN validation).
 * Change wording here only; nothing else in the dialog hard-codes message text.
 * Decided wording: design-reference/Integration/nsdl-pan-validate.md, open question 11.
 */

/** Template for a mandatory field, for example `requiredMessage("PAN No")` -> "PAN No is required". */
export const requiredMessage = (label: string) => `${label} is required`;

/** Save was clicked while the PAN is not validated (`isPanValid` is not YES). */
export const PAN_NOT_VALIDATED_MESSAGE = "Please validate PAN with NSDL before saving";

/** Added after the API `message` when the API errors and there is no pending PAN pendcode. */
export const RAISE_PAN_PENDCODE_MESSAGE = "Please raise a PAN pendcode.";

/** Save was clicked with a blank nominee row. */
export const BLANK_NOMINEE_MESSAGE = "Blank nominee values cannot be added. Please complete or delete the nominee row.";

/** Save was clicked with a blank rider row. */
export const BLANK_RIDER_MESSAGE = "Blank rider values cannot be added. Please complete or delete the rider row.";

/** Saving an edited rider row that is blank. */
export const FILL_ALL_RIDER_FIELDS_MESSAGE = "Please fill all rider fields before saving";

/** Saving an edited nominee row that is blank. */
export const FILL_ALL_NOMINEE_FIELDS_MESSAGE = "Please fill all nominee fields before saving";


/**
 * Shown when an NSDL call fails or the PAN is not confirmed and the API sent no text of its own.
 * Proposed wording, not supplied by the user (nsdl-pan-validate.md, open question 11).
 */
export const PAN_VALIDATION_FAILED_MESSAGE = "PAN validation failed";

/** Case submission is refused because NSDL found the PAN invalid. Shown on the Group DRS screen. */
export const PAN_INVALID_SUBMIT_BLOCKED_MESSAGE =
  "We couldn't verify the PAN with NSDL. Please correct the PAN details and validate them again before submitting this case.";
