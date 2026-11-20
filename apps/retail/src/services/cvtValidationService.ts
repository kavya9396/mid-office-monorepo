export type CvtPartyDecision = {
  partyId: string;
  decision: string;
};

export type CvtValidationRequest = {
  userId: string;
  role: string;
  applicationNo: string;
  partyDecision: CvtPartyDecision[];
};

export type CvtValidationItem = {
  validationId?: number;
  reason: string;
  remarks: string;
  action?: string;
};

export type CvtPartyValidation = {
  partyId: string;
  memberType: string;
  validations: CvtValidationItem[];
};

export type CvtValidationResult = {
  applicationNo: string;
  correlationId: string;
  status: string;
  partyValidations: CvtPartyValidation[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown): string => (typeof value === "string" ? value : "");

function readValidationItem(value: unknown): CvtValidationItem | null {
  if (!isRecord(value)) return null;
  const action = readText(value.action);
  return {
    validationId: typeof value.validationId === "number" ? value.validationId : undefined,
    reason: readText(value.reason),
    remarks: readText(value.remarks),
    action: action === "" ? undefined : action,
  };
}

function readPartyValidation(value: unknown): CvtPartyValidation | null {
  if (!isRecord(value)) return null;
  const validations = Array.isArray(value.validations) ? value.validations : [];
  return {
    partyId: readText(value.partyId),
    memberType: readText(value.memberType),
    validations: validations.map(readValidationItem).filter((item): item is CvtValidationItem => item !== null),
  };
}

export function readCvtValidationResponse(value: unknown): CvtValidationResult {
  if (!isRecord(value)) throw new Error("The CVT validation response could not be read.");
  const partyValidations = Array.isArray(value.partyValidations) ? value.partyValidations : [];
  return {
    applicationNo: readText(value.applicationNo),
    correlationId: readText(value.correlationId),
    status: readText(value.status),
    partyValidations: partyValidations
      .map(readPartyValidation)
      .filter((item): item is CvtPartyValidation => item !== null),
  };
}
