const FIRST_LOGIN_CHANGE_PENDING_KEY = "firstLoginChangePending";

let pendingFirstLoginPasswordChange = false;

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function readPendingFromStorage(): boolean {
  return readStorage()?.getItem(FIRST_LOGIN_CHANGE_PENDING_KEY) === "true";
}

/**
 * Set from login when `mustChangePassword` is true.
 * Persisted in sessionStorage so change-password survives full-page redirects (`replaceUrl`).
 */
export function setFirstLoginChangePending(pending: boolean): void {
  pendingFirstLoginPasswordChange = pending;
  const storage = readStorage();
  if (!storage) return;
  if (pending) {
    storage.setItem(FIRST_LOGIN_CHANGE_PENDING_KEY, "true");
  } else {
    storage.removeItem(FIRST_LOGIN_CHANGE_PENDING_KEY);
  }
}

export function isFirstLoginChangePending(): boolean {
  if (pendingFirstLoginPasswordChange) return true;
  const stored = readPendingFromStorage();
  if (stored) pendingFirstLoginPasswordChange = true;
  return stored;
}

export function clearFirstLoginChangePending(): void {
  pendingFirstLoginPasswordChange = false;
  readStorage()?.removeItem(FIRST_LOGIN_CHANGE_PENDING_KEY);
}
