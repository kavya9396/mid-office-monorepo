const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const DISPLAY_NAME_KEY = "displayName";
const BUSINESS_TYPE_KEY = "businessType";
const MUST_CHANGE_PASSWORD_KEY = "mustChangePassword";
/** Legacy mock-only key — removed on clear so real API sessions stay clean. */
const LEGACY_PASSWORD_CHANGED_KEY = "passwordChangedUserIds";

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
  storage?.removeItem(MUST_CHANGE_PASSWORD_KEY);
  storage?.removeItem(LEGACY_PASSWORD_CHANGED_KEY);
}

/**
 * Only persist when the server requires a password change (first login).
 * Never write "false" — absence of the key means the server did not require it.
 */
export function setMustChangePassword(required: boolean): void {
  const storage = readStorage();
  if (!storage) return;
  if (required) {
    storage.setItem(MUST_CHANGE_PASSWORD_KEY, "true");
    return;
  }
  storage.removeItem(MUST_CHANGE_PASSWORD_KEY);
}

export function mustChangePassword(): boolean {
  return readStorage()?.getItem(MUST_CHANGE_PASSWORD_KEY) === "true";
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
