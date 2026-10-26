const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";
const DISPLAY_NAME_KEY = "displayName";
const BUSINESS_TYPE_KEY = "businessType";

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

export function clearToken(): void {
  const storage = readStorage();
  storage?.removeItem(TOKEN_KEY);
  storage?.removeItem(USER_ID_KEY);
  storage?.removeItem(DISPLAY_NAME_KEY);
  storage?.removeItem(BUSINESS_TYPE_KEY);
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
