export type DvtPartyDecision = {
  partyId: string;
  decision: string;
};

export type DvtValidationRequest = {
  userId: string;
  role: string;
  applicationNo: string;
  partyDecision: DvtPartyDecision[];
};

export type DvtValidationItem = {
  validationId?: number;
  reason: string;
  remarks: string;
  action?: string;
};

export type DvtPartyValidation = {
  partyId: string;
  memberType: string;
  validations: DvtValidationItem[];
};

export type DvtValidationResult = {
  applicationNo: string;
  correlationId: string;
  status: string;
  partyValidations: DvtPartyValidation[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown): string => (typeof value === "string" ? value : "");

function readValidationItem(value: unknown): DvtValidationItem | null {
  if (!isRecord(value)) return null;
  const action = readText(value.action);
  return {
    validationId: typeof value.validationId === "number" ? value.validationId : undefined,
    reason: readText(value.reason),
    remarks: readText(value.remarks),
    action: action === "" ? undefined : action,
  };
}

function readPartyValidation(value: unknown): DvtPartyValidation | null {
  if (!isRecord(value)) return null;
  const validations = Array.isArray(value.validations) ? value.validations : [];
  return {
    partyId: readText(value.partyId),
    memberType: readText(value.memberType),
    validations: validations.map(readValidationItem).filter((item): item is DvtValidationItem => item !== null),
  };
}

export function readDvtValidationResponse(value: unknown): DvtValidationResult {
  if (!isRecord(value)) throw new Error("The DVT validation response could not be read.");
  const partyValidations = Array.isArray(value.partyValidations) ? value.partyValidations : [];
  return {
    applicationNo: readText(value.applicationNo),
    correlationId: readText(value.correlationId),
    status: readText(value.status),
    partyValidations: partyValidations
      .map(readPartyValidation)
      .filter((item): item is DvtPartyValidation => item !== null),
  };
}
