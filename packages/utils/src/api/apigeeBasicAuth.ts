function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function basicAuthorization(username: unknown, password: unknown, label: string): string {
  const user = readText(username);
  const pass = readText(password);
  if (user.length === 0 || pass.length === 0) {
    throw new Error(`${label} credentials are not configured.`);
  }
  const credentials = `${user}:${pass}`;
  return `Basic ${btoa(credentials)}`;
}

/** Mid-office Basic credential for `X-Apigee-Authorization`. */
export function apigeeBasicAuthorization(): string {
  return basicAuthorization(
    import.meta.env.VITE_AUTH_BASIC_USERNAME,
    import.meta.env.VITE_AUTH_BASIC_PASSWORD,
    "Mid-office auth",
  );
}

/** Apigee gateway Basic credential for `Authorization` when `VITE_USE_APIGEE=true`. */
export function apigeeGatewayAuthorization(): string {
  return basicAuthorization(
    import.meta.env.VITE_APIGEE_BASIC_USERNAME,
    import.meta.env.VITE_APIGEE_BASIC_PASSWORD,
    "Apigee",
  );
}
