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
 * Auth-service calls (login, forgot, reset, change password).
 * Apigee gateway credential is `Authorization: Basic base64(username:password)`.
 * When a user token is passed (logout), that Bearer value is `Authorization` instead.
 */
export function buildJsonAuthPostHeaders(bearerToken?: string): HeadersInit {
  const headers: Record<string, string> = { ...JSON_AUTH_HEADERS };
  const authorization = normalizeBearerToken(bearerToken);
  headers.Authorization = authorization.length > 0 ? authorization : apigeeBasicAuthorization();
  return headers;
}

/** Session Bearer only. Business APIs do not send the Apigee Basic credential. */
export function applyBusinessApiAuthHeaders(headers: Headers): void {
  const token = getToken()?.trim() ?? "";
  if (token.length > 0 && !isFirstLoginChangePending()) {
    headers.set("Authorization", `Bearer ${token}`);
  }
}
