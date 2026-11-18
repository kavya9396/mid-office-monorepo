export type DvtValidationRequest = {
  userId: string;
  role: string;
  applicationNo: string;
  partyId: string;
  dvtDecision: string;
};

export type DvtValidationItem = {
  validationId?: number;
  reason: string;
  remarks: string;
  action?: string;
};

export type DvtValidationResult = {
  applicationNo: string;
  correlationId: string;
  validations: DvtValidationItem[];
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

export function readDvtValidationResponse(value: unknown): DvtValidationResult {
  if (!isRecord(value)) throw new Error("The DVT validation response could not be read.");
  const validations = Array.isArray(value.validations) ? value.validations : [];
  return {
    applicationNo: readText(value.applicationNo),
    correlationId: readText(value.correlationId),
    validations: validations.map(readValidationItem).filter((item): item is DvtValidationItem => item !== null),
  };
}
