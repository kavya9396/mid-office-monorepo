import { z } from "zod";
import { loanSchema } from "./LoanDetails";
import { RAISE_PAN_PENDCODE_MESSAGE, requiredMessage } from "./editApplicant.messages";

/**
 * Every validation rule of the Edit Applicant dialog lives in this file
 * (NSDL PAN validation add-on #6, design-reference/Integration/nsdl-pan-validate.md).
 * Message text lives in `editApplicant.messages.ts`.
 */

const required = (label: string) => z.string().trim().min(1, requiredMessage(label));

// Required rules / messages copied from the DVT branch of the prototype validator (vhe)
export const editApplicantSchema = z.object({
  dobDocument: required("DOB Document"),
  genderDocument: required("Gender Document"),
  pincodeDocument: required("Pincode Document"),
  dob: required("Birthdate"),
  gender: required("Gender"),
  zipCode: required("Zip Code"),
  mobileNo: required("Mobile No"),
  immigrationStatus: required("Immigration Status"),
  panNumber: required("PAN No"),
  isPanValid: required("Is PAN Valid"),
  aadharSeedingStatus: required("Aadhar Seeding Status"),
  nsdlNameMatching: required("Is NSDL Name Matching"),
  nsdlDobMatching: required("Is NSDL DOB Matching"),
  nsdlTab: z.string(),
  // All Edit Profile fields are mandatory
  emailId: required("Email ID"),
  height: required("Height"),
  weight: required("Weight"),
  lifestyleHabits: required("Lifestyle Habits"),
  annualIncome: required("Annual Income"),
  applicantStatus: required("Applicant Status"),
});

// Base & Loan Details live in the same form under `loan`
export const editFormSchema = editApplicantSchema.extend({ loan: loanSchema });

export type EditApplicantValues = z.infer<typeof editApplicantSchema>;
export type EditFormValues = z.infer<typeof editFormSchema>;

/** Value of `isPanValid` once NSDL confirmed the PAN (the select uses YES / NO). */
export const PAN_VALID_YES = "YES";
export const PAN_VALID_NO = "NO";

/**
 * The PAN flag is YES only when NSDL returned `pan_validation = true`; every other result is NO
 * (nsdl-pan-validate.md, open question 9).
 */
export function panFlagFromValidation(panValid: boolean): typeof PAN_VALID_YES | typeof PAN_VALID_NO {
  return panValid ? PAN_VALID_YES : PAN_VALID_NO;
}

/**
 * Editing PAN No or Birthdate resets the flag to NO so the PAN has to be validated again
 * (open question 10). Returns the flag to keep: the current one, or NO after such an edit.
 */
export function resetPanFlagOnChange(
  current: { panNumber: string; dob: string; isPanValid: string },
  next: { panNumber: string; dob: string },
): string {
  const changed = current.panNumber !== next.panNumber || current.dob !== next.dob;
  return changed ? PAN_VALID_NO : current.isPanValid;
}

/** Save is allowed only while the PAN flag is YES ("validate PAN before Save"). */
export function isPanValidated(isPanValid: string): boolean {
  return isPanValid === PAN_VALID_YES;
}

/**
 * Text shown in the dialog's snackbar after an NSDL call (open question 11): the API message, followed by the
 * "raise a PAN pendcode" line only when the API errored and no pending PAN pendcode exists.
 */
export function buildNsdlNotice(apiMessage: string, askToRaisePendcode: boolean): string {
  const lines = [apiMessage.trim(), askToRaisePendcode ? RAISE_PAN_PENDCODE_MESSAGE : ""].filter(Boolean);
  return lines.join(" ");
}

/**
 * A requirement row is a pending PAN pendcode when its `fupCode` is PAN and its `status` is "pending",
 * both compared case-insensitively (open question 16).
 */
export function hasPendingPanPendcode(requirements: ReadonlyArray<{ fupCode?: string; status?: string }>): boolean {
  return requirements.some(
    (row) => row.fupCode?.trim().toUpperCase() === "PAN" && row.status?.trim().toLowerCase() === "pending",
  );
}

/** Whether NSDL reported a match for each of the three NSDL selects (true = "Y"). */
export type NsdlMatchSelection = { nameMatching: boolean; dobMatching: boolean; aadharSeeding: boolean };

/** The three NSDL selects as `YES` / `NO` values; missing matches (data not available) give NO for all (add-on #17). */
export function nsdlSelectValues(matches: NsdlMatchSelection | undefined): {
  nsdlNameMatching: string;
  nsdlDobMatching: string;
  aadharSeedingStatus: string;
} {
  const flag = (matched: boolean | undefined) => (matched ? PAN_VALID_YES : PAN_VALID_NO);
  return {
    nsdlNameMatching: flag(matches?.nameMatching),
    nsdlDobMatching: flag(matches?.dobMatching),
    aadharSeedingStatus: flag(matches?.aadharSeeding),
  };
}

/** What the dialog hands to the app when the NSDL button is clicked. */
export type PanValidationInput = { panNumber: string; dob: string };

/**
 * What the app hands back after calling NSDL. The dialog never sees API shapes.
 * `panValid`: true sets the flag to YES, false sets it to NO, undefined leaves the flag as it is
 * (API error while a PAN pendcode is already pending, open question 9).
 */
export type PanValidationResult = {
  panValid?: boolean;
  /** NSDL match flags (add-on #17). Missing means "not available", which the dialog shows as NO. */
  matches?: NsdlMatchSelection;
  /** The API `message`; may be empty. */
  message: string;
  /** API error with no pending PAN pendcode: add the "raise a PAN pendcode" line. */
  raisePendcode: boolean;
};

/**
 * PAN, Birthdate, flag and the three NSDL selects of the last NSDL validation; the app keeps it so it survives
 * closing the dialog. The NSDL selects are read-only and only ever filled from the API response.
 */
export type PanStatus = {
  panNumber: string;
  dob: string;
  isPanValid: string;
  nsdlNameMatching?: string;
  nsdlDobMatching?: string;
  aadharSeedingStatus?: string;
};
