const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
/** Session username (login API `data.username`); pool-columns and landing use this query param. */
const USERNAME_KEY = "username";
/** Legacy key — migrated on read/write; removed on clear. */
const LEGACY_USER_ID_KEY = "userId";
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
  username: string;
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
  storage?.removeItem(USERNAME_KEY);
  storage?.removeItem(LEGACY_USER_ID_KEY);
  storage?.removeItem(DISPLAY_NAME_KEY);
  storage?.removeItem(BUSINESS_TYPE_KEY);
  storage?.removeItem(LAST_LOGIN_AT_KEY);
  clearFirstLoginChangePending();
  storage?.removeItem(SESSION_ID_KEY);
  storage?.removeItem(LEGACY_PASSWORD_CHANGED_KEY);
}

/** Generic string values kept for the browser session (cleared by `clearSession`). */
export function getSessionValue(key: string): string | null {
  return readStorage()?.getItem(key) ?? null;
}

export function setSessionValue(key: string, value: string): void {
  readStorage()?.setItem(key, value);
}

export function removeSessionValue(key: string): void {
  readStorage()?.removeItem(key);
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
  if (!storage) return;
  storage.setItem(USERNAME_KEY, user.username);
  storage.removeItem(LEGACY_USER_ID_KEY);
  storage.setItem(DISPLAY_NAME_KEY, user.displayName);
}

export function getSessionUser(): SessionUser | null {
  const storage = readStorage();
  if (!storage) return null;

  const fromUsername = storage.getItem(USERNAME_KEY)?.trim();
  const fromLegacy = storage.getItem(LEGACY_USER_ID_KEY)?.trim();
  const username = (fromUsername ?? fromLegacy ?? "").trim();
  const displayName = storage.getItem(DISPLAY_NAME_KEY)?.trim();

  if (username.length === 0 || !displayName) return null;

  if ((!fromUsername || fromUsername.length === 0) && fromLegacy !== undefined && fromLegacy.length > 0) {
    storage.setItem(USERNAME_KEY, username);
    storage.removeItem(LEGACY_USER_ID_KEY);
  }

  return { username, displayName };
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
