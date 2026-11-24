// NSDL PAN validate: request builder and response reader.
// Pure code, no React and no I/O. Contract: design-reference/Integration/nsdl-pan-validate.md (OpenAPI v1.3.0).
// From the response `data` only `panValidation.{name, dob, aadharSeedingStatus}` is read;
// every other field inside `data` (including `responseCode`) is ignored.

export type NsdlPanValidateRequest = {
  applicationNumber: string;
  pan: string;
  name: string;
  /** DD/MM/YYYY, as the API expects. */
  dob: string;
  fatherName: string;
};

export type NsdlPanValidateRequestInput = {
  applicationNumber: string;
  pan: string;
  name: string;
  /** The dialog stores the birth date as YYYY-MM-DD. */
  dob: string;
  fatherName: string;
};

/** `true` only when NSDL sent exactly "Y"; a missing, malformed or any other value is `false`. */
export type NsdlMatchFlags = {
  nameMatching: boolean;
  dobMatching: boolean;
  aadharSeeding: boolean;
};

export type NsdlPanValidateResult = {
  /** `error === false`: the API call itself succeeded. */
  apiSuccess: boolean;
  /** `pan_validation === true`. Anything else, including a missing field, is false. */
  panValid: boolean;
  /** Shown to the user for both success and failure. Empty when the API sent none. */
  message: string;
  /** All false when the call failed or `data.panValidation` is missing or not an object. */
  matches: NsdlMatchFlags;
};

export type NsdlOutcome =
  /** PAN valid. */
  | "success"
  /** API ok but PAN not valid. */
  | "blocked"
  /** API error and no pending PAN pendcode: ask the user to raise one. */
  | "apiErrorRaisePendcode"
  /** API error and a PAN pendcode is already pending: only show the error message. */
  | "apiErrorShowMessage";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function invalidResponse(): Error {
  return new Error("NSDL PAN validation response is not in the expected format.");
}

/** YYYY-MM-DD -> DD/MM/YYYY. Any other input is returned unchanged; the dialog and the API validate it. */
export function formatDobForNsdl(dob: string): string {
  const match = ISO_DATE.exec(dob.trim());
  if (!match) return dob;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function createNsdlPanValidateRequest(input: NsdlPanValidateRequestInput): NsdlPanValidateRequest {
  return {
    applicationNumber: input.applicationNumber,
    pan: input.pan,
    name: input.name,
    dob: formatDobForNsdl(input.dob),
    fatherName: input.fatherName,
  };
}

function isYes(value: unknown): boolean {
  return typeof value === "string" && value.trim().toUpperCase() === "Y";
}

function noMatches(): NsdlMatchFlags {
  return { nameMatching: false, dobMatching: false, aadharSeeding: false };
}

function readMatchFlags(data: unknown): NsdlMatchFlags {
  if (!isRecord(data)) return noMatches();
  const validation = data.panValidation;
  if (!isRecord(validation)) return noMatches();
  return {
    nameMatching: isYes(validation.name),
    dobMatching: isYes(validation.dob),
    aadharSeeding: isYes(validation.aadharSeedingStatus),
  };
}

/**
 * Reads `error`, `pan_validation`, `message` and `data.panValidation.{name, dob, aadharSeedingStatus}`.
 * `error` must be a boolean or the response is rejected. Success is exactly `pan_validation === true`.
 * When `error` is true the match flags are all false without looking at `data`.
 */
export function readNsdlPanValidateResponse(value: unknown): NsdlPanValidateResult {
  if (!isRecord(value) || typeof value.error !== "boolean") throw invalidResponse();
  return {
    apiSuccess: value.error === false,
    panValid: value.pan_validation === true,
    message: readText(value.message),
    matches: value.error === false ? readMatchFlags(value.data) : noMatches(),
  };
}

/** Maps a result to the outcome table in nsdl-pan-validate.md. */
export function resolveNsdlOutcome(result: NsdlPanValidateResult, hasPendingPanPendcode: boolean): NsdlOutcome {
  if (result.apiSuccess) return result.panValid ? "success" : "blocked";
  return hasPendingPanPendcode ? "apiErrorShowMessage" : "apiErrorRaisePendcode";
}
