const BRE_RETRIGGER_COUNT_KEY = "breRetriggerCount";

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

/** True only after a successful BRE retrigger API call has stored a count. */
export function hasBreRetriggerCountInSession(): boolean {
  return readStorage()?.getItem(BRE_RETRIGGER_COUNT_KEY) !== null;
}

/** Last API-reported count; `null` when the session key has not been set yet. */
export function getBreRetriggerCount(): number | null {
  const raw = readStorage()?.getItem(BRE_RETRIGGER_COUNT_KEY);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setBreRetriggerCount(count: number): void {
  const storage = readStorage();
  if (!storage) return;
  if (!Number.isFinite(count)) return;
  const safe = Math.max(0, Math.floor(count));
  storage.setItem(BRE_RETRIGGER_COUNT_KEY, String(safe));
}

export function clearBreRetriggerCount(): void {
  readStorage()?.removeItem(BRE_RETRIGGER_COUNT_KEY);
}

/**
 * Call BRE retrigger when there is no saved count yet, or the last API count is 3 or less.
 * When the last saved count is greater than 3, skip the API and show the IT ticket dialog.
 */
export function canInvokeBreRetrigger(): boolean {
  const count = getBreRetriggerCount();
  if (count === null) return true;
  return count <= 3;
}

/** Block retrigger when the last saved API count is greater than 3. */
export function isBreRetriggerLimitReached(): boolean {
  return !canInvokeBreRetrigger();
}
