/**
 * In-memory only — set from the login API when `firstLogin === true`.
 * Not persisted; refresh or direct URL to change-password sends the user to login.
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
