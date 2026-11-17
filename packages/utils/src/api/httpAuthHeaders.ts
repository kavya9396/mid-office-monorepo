import { isFirstLoginChangePending } from "../auth/firstLoginFlow";
import { getToken } from "../auth/session";
import { apigeeBasicAuthorization } from "./apigeeBasicAuth";

const JSON_AUTH_HEADERS = {
  accept: "*/*",
  "Content-Type": "application/json",
} as const;

function normalizeBearerToken(bearerToken?: string): string {
  const token = bearerToken?.trim() ?? "";
  if (token.length === 0) return "";
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

/**
 * Auth-service POST headers.
 * Login, forgot, reset, and change password send Apigee `Authorization: Basic`.
 * Logout sends the session `Authorization: Bearer` token.
 */
export function buildJsonAuthPostHeaders(bearerToken?: string): HeadersInit {
  const headers: Record<string, string> = { ...JSON_AUTH_HEADERS };
  const authorization = normalizeBearerToken(bearerToken);
  headers.Authorization =
    authorization.length > 0 ? authorization : apigeeBasicAuthorization();
  return headers;
}

/** Session Bearer only for Retail/Group business APIs. */
export function applyBusinessApiAuthHeaders(headers: Headers): void {
  const token = getToken()?.trim() ?? "";
  if (token.length > 0 && !isFirstLoginChangePending()) {
    headers.set("Authorization", `Bearer ${token}`);
  }
}
