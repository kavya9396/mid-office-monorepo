const INBOX_NAVIGATION_LOADING_KEY = "inboxNavigationLoading";

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

/** Set before full-page navigation to the other business inbox (Retail ↔ Group). */
export function markInboxNavigationLoading(): void {
  readStorage()?.setItem(INBOX_NAVIGATION_LOADING_KEY, "true");
}

export function clearInboxNavigationLoading(): void {
  readStorage()?.removeItem(INBOX_NAVIGATION_LOADING_KEY);
}

export function isInboxNavigationLoading(): boolean {
  return readStorage()?.getItem(INBOX_NAVIGATION_LOADING_KEY) === "true";
}
