export function isLikelyEmail(value: string): boolean {
  return value.includes("@");
}

/** Lightweight client check when the user enters an email instead of a user ID. */
export function isValidEmailAddress(value: string): boolean {
  const at = value.indexOf("@");
  if (at <= 0 || value.includes("@", at + 1)) return false;

  for (const character of value) {
    if (character.trim() === "") return false;
  }

  const domain = value.slice(at + 1);
  return domain.slice(1, -1).includes(".");
}
