import type { MedicalTpaDrsRecord, MedicalTpaSubmitPayload } from "@insurance-poc/common/tpa";
import medicalTpaDrsMock from "../../../../mock/drs/medical-tpa-drs.json";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

const tpaApi = {
  drs: import.meta.env.VITE_MEDICAL_TPA_DRS_URL ?? "",
  submit: import.meta.env.VITE_MEDICAL_TPA_SUBMIT_URL ?? "",
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toMedicalTpaRecord(payload: unknown): MedicalTpaDrsRecord | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const details = value.details;
  if (!details || typeof details !== "object") {
    return null;
  }
  const applicationNo =
    typeof value.applicationNo === "string" ? value.applicationNo : "";
  if (!applicationNo) {
    return null;
  }
  return {
    applicationNo,
    failureReason:
      typeof value.failureReason === "string" ? value.failureReason : "",
    failureDetail:
      typeof value.failureDetail === "string" ? value.failureDetail : "",
    details: details as MedicalTpaDrsRecord["details"],
    serviceProviderOptions: Array.isArray(value.serviceProviderOptions)
      ? (value.serviceProviderOptions as string[])
      : [],
    defaultServiceProvider:
      typeof value.defaultServiceProvider === "string"
        ? value.defaultServiceProvider
        : undefined,
    reasonOptions: Array.isArray(value.reasonOptions)
      ? (value.reasonOptions as string[])
      : [],
  };
}

async function callMedicalTpaDrsApi(
  applicationNo: string,
): Promise<MedicalTpaDrsRecord | null> {
  const baseUrl = tpaApi.drs;
  if (!baseUrl) {
    throw new Error(
      "Medical TPA DRS API URL is not configured. Set VITE_MEDICAL_TPA_DRS_URL or use mock mode.",
    );
  }

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set("applicationNo", applicationNo);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Medical TPA DRS request failed (${response.status}).`);
  }
  return toMedicalTpaRecord(await response.json());
}

function readMockRecord(applicationNo: string): MedicalTpaDrsRecord | undefined {
  return medicalTpaDrsMock.records.find(
    (item) => item.applicationNo === applicationNo,
  ) as MedicalTpaDrsRecord | undefined;
}

export async function fetchMedicalTpaDrs(
  applicationNo: string,
): Promise<MedicalTpaDrsRecord | null> {
  if (!useMock) {
    return callMedicalTpaDrsApi(applicationNo);
  }

  await wait(250);
  const matched = readMockRecord(applicationNo);
  const fallback = medicalTpaDrsMock.records[0] as MedicalTpaDrsRecord | undefined;
  const record = matched ?? fallback;
  if (!record) {
    return null;
  }

  const details = { ...record.details };
  if (details.Application_no) {
    details.Application_no = applicationNo;
  }

  return {
    ...record,
    applicationNo,
    details,
  };
}

export type MedicalTpaSubmitResult = {
  message: string;
  /** When true, the UI should return to inbox after showing the success message. */
  redirectToInbox: boolean;
};

const DEFAULT_SUBMIT_SUCCESS =
  "Service provider details submitted successfully.";

function readResponseMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  for (const key of ["message", "successMessage", "statusMessage"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  const errorValue = record.error;
  if (typeof errorValue === "string" && errorValue.trim().length > 0) {
    return errorValue.trim();
  }
  if (
    errorValue &&
    typeof errorValue === "object" &&
    typeof (errorValue as Record<string, unknown>).message === "string"
  ) {
    const nested = (errorValue as Record<string, unknown>).message as string;
    if (nested.trim().length > 0) {
      return nested.trim();
    }
  }
  return undefined;
}

async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    const fromBody = readResponseMessage(payload);
    if (fromBody) {
      return fromBody;
    }
  } catch {
    // ignore non-JSON error bodies
  }
  return `Medical TPA submit failed (${response.status}).`;
}

export async function submitMedicalTpaServiceProvider(
  payload: MedicalTpaSubmitPayload,
): Promise<MedicalTpaSubmitResult> {
  if (useMock) {
    await wait(200);
    return {
      message: DEFAULT_SUBMIT_SUCCESS,
      redirectToInbox: false,
    };
  }

  const baseUrl = tpaApi.submit;
  if (!baseUrl) {
    throw new Error(
      "Medical TPA submit API URL is not configured. Set VITE_MEDICAL_TPA_SUBMIT_URL or use mock mode.",
    );
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  let message = DEFAULT_SUBMIT_SUCCESS;
  try {
    const payloadJson: unknown = await response.json();
    message = readResponseMessage(payloadJson) ?? DEFAULT_SUBMIT_SUCCESS;
  } catch {
    // empty or non-JSON success body
  }

  return { message, redirectToInbox: true };
}
