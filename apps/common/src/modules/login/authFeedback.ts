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

export function readApiMessage(reason: unknown, fallback = ""): string {
  if (typeof reason === "string" && reason.trim().length > 0) return reason.trim();
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }
  if (typeof reason === "object" && reason !== null) {
    const record = reason as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim().length > 0) {
      return record.error.trim();
    }
    if (typeof record.message === "string" && record.message.trim().length > 0) {
      return record.message.trim();
    }
  }
  return fallback;
}

export function authSnackbar(
  message: string,
  severity: SnackbarSeverity,
): AuthSnackbarState {
  return { open: true, message, severity };
}
