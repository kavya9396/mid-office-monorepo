import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Reads `message` from API JSON bodies such as `{ message, error: "CODE" }`. */
export function readApiMessageFromBody(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!isRecord(value)) return "";
  const message = readText(value.message);
  if (message.length > 0) return message;
  return "";
}

/** API failure text: `message` first, then string `error` code when message is absent. */
export function readApiFailureText(value: unknown): string {
  const message = readApiMessageFromBody(value);
  if (message.length > 0) return message;
  if (isRecord(value)) {
    const errorCode = readText(value.error);
    if (errorCode.length > 0 && errorCode !== "true" && errorCode !== "false") {
      return errorCode;
    }
  }
  return "";
}

/** True when the API body indicates failure (boolean or string error code, or HTTP-style code). */
export function isApiFailureBody(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.error === true) return true;
  const errorCode = value.error;
  if (typeof errorCode === "string" && errorCode.length > 0) return true;
  const responseCode = typeof value.response_code === "number" ? value.response_code : 0;
  return responseCode >= 400;
}

/**
 * Normalizes RTK Query / fetch errors and API envelopes into user-facing text.
 * Uses API `message` (then string `error` code). Fallback only when the API sends no text.
 */
export function readApiErrorMessage(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (value instanceof Error && value.message.trim().length > 0) {
    return value.message.trim();
  }

  if (!isRecord(value)) return fallback;

  if (value.status === "CUSTOM_ERROR" && typeof value.error === "string" && value.error.length > 0) {
    return value.error;
  }

  if ("data" in value) {
    const fromData = readApiFailureText(value.data);
    if (fromData.length > 0) return fromData;
  }

  const fromBody = readApiFailureText(value);
  if (fromBody.length > 0) return fromBody;

  if ("error" in value && isRecord(value.error)) {
    const nested = readApiErrorMessage(value.error, "");
    if (nested.length > 0) return nested;
  }

  return fallback;
}

/** Maps HTTP/RTK errors to CUSTOM_ERROR using dynamic API response text only. */
export function toCustomQueryError(
  error: FetchBaseQueryError,
  fallback = "",
): FetchBaseQueryError {
  const text = readApiErrorMessage(error, "");
  return {
    status: "CUSTOM_ERROR",
    error: text.length > 0 ? text : fallback,
  };
}
