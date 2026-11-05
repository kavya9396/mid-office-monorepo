const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const DISPLAY_NAME_KEY = "displayName";
const BUSINESS_TYPE_KEY = "businessType";
const LAST_LOGIN_AT_KEY = "lastLoginAt";
const SESSION_ID_KEY = "sessionId";
/** Legacy mock-only key — removed on clear so real API sessions stay clean. */
const LEGACY_PASSWORD_CHANGED_KEY = "passwordChangedUserIds";

import {
  clearFirstLoginChangePending,
  isFirstLoginChangePending,
  setFirstLoginChangePending,
} from "./firstLoginFlow";

export type SessionBusinessType = "RETAIL" | "GROUP";

export interface SessionUser {
  userId: string;
  displayName: string;
}

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function getToken(): string | null {
  return readStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function setToken(token: string): void {
  readStorage()?.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return readStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function setRefreshToken(token: string): void {
  const storage = readStorage();
  if (!storage) return;
  if (token.trim().length === 0) {
    storage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  storage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearToken(): void {
  const storage = readStorage();
  storage?.removeItem(TOKEN_KEY);
  storage?.removeItem(REFRESH_TOKEN_KEY);
  storage?.removeItem(USER_ID_KEY);
  storage?.removeItem(DISPLAY_NAME_KEY);
  storage?.removeItem(BUSINESS_TYPE_KEY);
  storage?.removeItem(LAST_LOGIN_AT_KEY);
  clearFirstLoginChangePending();
  storage?.removeItem(SESSION_ID_KEY);
  storage?.removeItem(LEGACY_PASSWORD_CHANGED_KEY);
}

export function setSessionId(sessionId: string): void {
  const storage = readStorage();
  if (!storage) return;
  if (sessionId.trim().length === 0) {
    storage.removeItem(SESSION_ID_KEY);
    return;
  }
  storage.setItem(SESSION_ID_KEY, sessionId.trim());
}

export function getSessionId(): string | null {
  return readStorage()?.getItem(SESSION_ID_KEY) ?? null;
}

/** Removes every session value, including token, user, and any other saved keys. */
export function clearSession(): void {
  readStorage()?.clear();
  clearFirstLoginChangePending();
}

/** @deprecated Prefer setFirstLoginChangePending — in-memory only, from login `firstLogin`. */
export function setMustChangePassword(required: boolean): void {
  setFirstLoginChangePending(required);
}

/** @deprecated Prefer isFirstLoginChangePending — not read from sessionStorage. */
export function mustChangePassword(): boolean {
  return isFirstLoginChangePending();
}

export function setSessionUser(user: SessionUser): void {
  const storage = readStorage();
  storage?.setItem(USER_ID_KEY, user.userId);
  storage?.setItem(DISPLAY_NAME_KEY, user.displayName);
}

export function getSessionUser(): SessionUser | null {
  const storage = readStorage();
  const userId = storage?.getItem(USER_ID_KEY)?.trim();
  const displayName = storage?.getItem(DISPLAY_NAME_KEY)?.trim();

  return userId && displayName ? { userId, displayName } : null;
}

export function setSessionBusinessType(
  businessType: SessionBusinessType,
): void {
  readStorage()?.setItem(BUSINESS_TYPE_KEY, businessType);
}

export function setLastLoginAt(value: string): void {
  const storage = readStorage();
  if (!storage) return;
  if (value.trim().length === 0) {
    storage.removeItem(LAST_LOGIN_AT_KEY);
    return;
  }
  storage.setItem(LAST_LOGIN_AT_KEY, value.trim());
}

export function getLastLoginAt(): string | null {
  return readStorage()?.getItem(LAST_LOGIN_AT_KEY) ?? null;
}

export function getSessionBusinessType(): SessionBusinessType | null {
  const businessType = readStorage()?.getItem(BUSINESS_TYPE_KEY);
  return businessType === "RETAIL" || businessType === "GROUP"
    ? businessType
    : null;
}

/**
 * POC session check. A non-empty token means the user signed in through Common.
 * This does not validate a JWT signature or call a server.
 */
export function hasSession(): boolean {
  const token = getToken();
  return typeof token === "string" && token.trim().length > 0;
}
