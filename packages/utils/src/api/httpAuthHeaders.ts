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

/** Headers for Common auth-service POST calls (login, forgot, reset, change, logout). */
export function buildJsonAuthPostHeaders(bearerToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    ...JSON_AUTH_HEADERS,
    "X-Apigee-Authorization": apigeeBasicAuthorization(),
  };
  const authorization = normalizeBearerToken(bearerToken);
  if (authorization.length > 0) {
    headers.Authorization = authorization;
  }
  return headers;
}

/** Apigee Basic plus session Bearer for Retail/Group business APIs. */
export function applyBusinessApiAuthHeaders(headers: Headers): void {
  headers.set("X-Apigee-Authorization", apigeeBasicAuthorization());
  const token = getToken()?.trim() ?? "";
  if (token.length > 0 && !isFirstLoginChangePending()) {
    headers.set("Authorization", `Bearer ${token}`);
  }
}
