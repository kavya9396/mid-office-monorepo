import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { BusinessRequest, SessionBusinessType } from "@insurance-poc/utils";
import {
  isApiFailureBody,
  readApiErrorMessage,
  toCustomQueryError,
  useMock,
} from "@insurance-poc/utils";
import breRetriggerMock from "./mock/breRetrigger.json";

export type BreRetriggerEventName = "BRE-GROUP" | "BRE-RETAIL";

export type BreRetriggerLob = "G" | "R";

export type BreRetriggerRequestBody = {
  eventName: BreRetriggerEventName;
  applicationNumber: string;
  lob: BreRetriggerLob;
};

export type BreRequirementItem = {
  requirementType: string;
  requirementValue: string;
  ruleId: string;
  ruleName: string;
  isSTP: boolean;
  metaphorName: string;
};

export type BreDecisionTypes = {
  breDecision: string;
  breAction: string;
  breRequirement: string;
  stpCaseDecision: string;
};

export type BreOutput = {
  systemDecision: string;
  decisionTypes: BreDecisionTypes;
  requirements: BreRequirementItem[];
  systemDecisionDateTime: string;
  reTriggerCount: number;
  errorResp: string;
  breRemarks: string;
};

export type BreRetriggerMappedFinal = {
  /** Value for the DecisionBar "Final" chip. */
  barDecision: string;
  rows: {
    status: string;
    decision: string;
    remarks: string;
    discrepancy: string;
    timestamp: string;
  };
};

export type BreRetriggerBaseQuery = (
  args: string | BusinessRequest,
) => Promise<{ data: unknown } | { error: FetchBaseQueryError }>;

function customError(message: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

export function resolveBreRetriggerEventName(
  businessType: SessionBusinessType,
): BreRetriggerEventName {
  return businessType === "GROUP" ? "BRE-GROUP" : "BRE-RETAIL";
}

export function resolveBreRetriggerLob(businessType: SessionBusinessType): BreRetriggerLob {
  return businessType === "GROUP" ? "G" : "R";
}

export function buildBreRetriggerRequestBody(
  applicationNumber: string,
  businessType: SessionBusinessType,
): BreRetriggerRequestBody | { error: string } {
  const appNo = applicationNumber.trim();
  if (appNo.length === 0) {
    return { error: "Application number is required to retrigger BRE." };
  }
  return {
    eventName: resolveBreRetriggerEventName(businessType),
    applicationNumber: appNo,
    lob: resolveBreRetriggerLob(businessType),
  };
}

function readDecisionTypes(value: unknown): BreDecisionTypes {
  if (!isRecord(value)) {
    throw new Error("BRE retrigger response is missing decisionTypes.");
  }
  return {
    breDecision: readText(value.breDecision),
    breAction: readText(value.breAction),
    breRequirement: readText(value.breRequirement),
    stpCaseDecision: readText(value.stpCaseDecision),
  };
}

function readRequirements(value: unknown): BreRequirementItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({
      requirementType: readText(item.requirementType),
      requirementValue: readText(item.requirementValue),
      ruleId: readText(item.ruleId),
      ruleName: readText(item.ruleName),
      isSTP: readBoolean(item.isSTP),
      metaphorName: readText(item.metaphorName),
    }));
}

export function readBreOutputFromResponse(value: unknown): BreOutput {
  if (!isRecord(value)) {
    throw new Error("BRE retrigger response is not in the expected format.");
  }
  const data = isRecord(value.data) ? value.data : value;
  const breOutput = isRecord(data.breOutput) ? data.breOutput : null;
  if (!breOutput) {
    throw new Error("BRE retrigger response is not in the expected format.");
  }
  return {
    systemDecision: readText(breOutput.systemDecision),
    decisionTypes: readDecisionTypes(breOutput.decisionTypes),
    requirements: readRequirements(breOutput.requirements),
    systemDecisionDateTime: readText(breOutput.systemDecisionDateTime),
    reTriggerCount:
      typeof breOutput.reTriggerCount === "number" ? breOutput.reTriggerCount : 0,
    errorResp: readText(breOutput.errorResp),
    breRemarks: readText(breOutput.breRemarks),
  };
}

/** Maps a successful BRE output into Final-column values for the comparison modal and bar. */
export function mapBreRetriggerOutput(output: BreOutput): BreRetriggerMappedFinal {
  return {
    barDecision: output.systemDecision,
    rows: {
      status: "Success",
      decision: output.systemDecision,
      remarks: output.breRemarks,
      discrepancy: output.decisionTypes.breRequirement,
      timestamp: output.systemDecisionDateTime,
    },
  };
}

export async function mutateBreRetrigger(
  baseQuery: BreRetriggerBaseQuery,
  retriggerUrl: string,
  applicationNumber: string,
  businessType: SessionBusinessType,
): Promise<{ data: BreRetriggerMappedFinal } | { error: FetchBaseQueryError }> {
  const request = buildBreRetriggerRequestBody(applicationNumber, businessType);
  if ("error" in request) {
    return { error: customError(request.error) };
  }

  if (useMock) {
    try {
      const output = readBreOutputFromResponse(breRetriggerMock);
      return { data: mapBreRetriggerOutput(output) };
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "BRE retrigger mock failed.";
      return { error: customError(message) };
    }
  }

  if (retriggerUrl.length === 0) {
    return { error: customError("BRE retrigger API is not configured.") };
  }

  const result = await baseQuery({
    url: retriggerUrl,
    method: "POST",
    body: request,
    headers: { accept: "application/json", "Content-Type": "application/json" },
    encryptRequest: false,
    decryptResponse: false,
  });

  if ("error" in result) {
    return { error: toCustomQueryError(result.error) };
  }

  if (isApiFailureBody(result.data)) {
    return { error: customError(readApiErrorMessage(result.data, "Unable to retrigger BRE.")) };
  }

  try {
    const output = readBreOutputFromResponse(result.data);
    return { data: mapBreRetriggerOutput(output) };
  } catch (reason: unknown) {
    const message =
      reason instanceof Error ? reason.message : "BRE retrigger response is not in the expected format.";
    return { error: customError(message) };
  }
}
