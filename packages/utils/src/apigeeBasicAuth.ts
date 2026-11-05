function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Builds `Basic base64(username:password)` from env for Apigee gateway calls. */
export function apigeeBasicAuthorization(): string {
  const username = readText(import.meta.env.VITE_AUTH_BASIC_USERNAME);
  const password = readText(import.meta.env.VITE_AUTH_BASIC_PASSWORD);
  if (username.length === 0 || password.length === 0) {
    throw new Error("Auth credentials are not configured.");
  }
  return `Basic ${btoa(`${username}:${password}`)}`;
}
