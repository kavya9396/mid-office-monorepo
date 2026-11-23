import { isFirstLoginChangePending } from "../auth/firstLoginFlow";
import { getToken } from "../auth/session";
import { isApigeeMode } from "../config/appConfig";
import { apigeeBasicAuthorization, apigeeGatewayAuthorization } from "./apigeeBasicAuth";

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
 * Login headers follow VITE_USE_APIGEE.
 * true: `Authorization: Basic` from VITE_APIGEE_BASIC_USERNAME / VITE_APIGEE_BASIC_PASSWORD.
 * false: `X-Apigee-Authorization: Basic` from VITE_AUTH_BASIC_USERNAME / VITE_AUTH_BASIC_PASSWORD.
 */
export function buildLoginAuthHeaders(): HeadersInit {
  if (isApigeeMode()) {
    return { ...JSON_AUTH_HEADERS, Authorization: apigeeGatewayAuthorization() };
  }
  return { ...JSON_AUTH_HEADERS, "X-Apigee-Authorization": apigeeBasicAuthorization() };
}

/**
 * Forgot password, reset password, change password, and logout.
 * These stay on the mid-office header. Logout also sends `Authorization: Bearer`.
 */
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

/**
 * Auth-service GET calls (e.g. users by role, `VITE_USERS_BY_ROLE_API`).
 * Same headers as logout: mid-office `X-Apigee-Authorization: Basic` plus the session `Authorization: Bearer`.
 */
export function buildAuthServiceGetHeaders(bearerToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    accept: JSON_AUTH_HEADERS.accept,
    "X-Apigee-Authorization": apigeeBasicAuthorization(),
  };
  const authorization = normalizeBearerToken(bearerToken ?? getToken() ?? undefined);
  if (authorization.length > 0) {
    headers.Authorization = authorization;
  }
  return headers;
}

/** Session Bearer only. Business APIs do not send the Apigee Basic credential. */
export function applyBusinessApiAuthHeaders(headers: Headers): void {
  const token = getToken()?.trim() ?? "";
  if (token.length > 0 && !isFirstLoginChangePending()) {
    headers.set("Authorization", `Bearer ${token}`);
  }
}
