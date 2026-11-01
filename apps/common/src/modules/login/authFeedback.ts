export type SnackbarSeverity = "success" | "error" | "warning" | "info";

export type AuthSnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
};

export const closedAuthSnackbar: AuthSnackbarState = {
  open: false,
  message: "",
  severity: "info",
};

function readTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function messageFromData(data: unknown): string {
  if (typeof data === "string") return data.trim();
  if (typeof data !== "object" || data === null) return "";

  const record = data as Record<string, unknown>;
  const message = readTrimmed(record.message);
  if (message.length > 0) return message;
  return readTrimmed(record.errorMessage);
}

/** Message from an auth API failure: string, Error, or `{ error | message | data }`. */
export function readApiMessage(reason: unknown, fallback = ""): string {
  if (typeof reason === "string") {
    const text = reason.trim();
    return text.length > 0 ? text : fallback;
  }
  if (reason instanceof Error) {
    const text = reason.message.trim();
    return text.length > 0 ? text : fallback;
  }
  if (typeof reason === "object" && reason !== null) {
    const record = reason as Record<string, unknown>;
    const fromError = readTrimmed(record.error);
    if (fromError.length > 0) return fromError;
    const fromMessage = readTrimmed(record.message);
    if (fromMessage.length > 0) return fromMessage;
    const fromData = messageFromData(record.data);
    if (fromData.length > 0) return fromData;
  }
  return fallback;
}

/** Prefer the API `message`; use fallback only when it is blank. */
export function apiResultMessage(message: string, fallback: string): string {
  const text = message.trim();
  return text.length > 0 ? text : fallback;
}

export function authSnackbar(
  message: string,
  severity: SnackbarSeverity,
): AuthSnackbarState {
  return { open: true, message, severity };
}
