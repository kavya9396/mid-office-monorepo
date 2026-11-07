/**
 * In-memory only — set from login when `firstLogin && mustChangePassword` are both true.
 * Not persisted; refresh or direct URL to change-password clears session and sends to login.
 */
let pendingFirstLoginPasswordChange = false;

export function setFirstLoginChangePending(pending: boolean): void {
  pendingFirstLoginPasswordChange = pending;
}

export function isFirstLoginChangePending(): boolean {
  return pendingFirstLoginPasswordChange;
}

export function clearFirstLoginChangePending(): void {
  pendingFirstLoginPasswordChange = false;
}
