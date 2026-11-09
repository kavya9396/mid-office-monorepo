/** Builds `types=a&types=b` query string for the masters API. */
export function buildMasterTypesQuery(types: readonly string[]): string {
  const params = new URLSearchParams();
  for (const type of types) {
    const trimmed = type.trim();
    if (trimmed.length > 0) params.append("types", trimmed);
  }
  return params.toString();
}

/** Full masters URL with dynamic `types` query parameters. */
export function buildMastersRequestUrl(mastersBaseUrl: string, types: readonly string[]): string {
  const base = mastersBaseUrl.trim();
  if (base.length === 0) {
    throw new Error("Masters API URL is not configured.");
  }
  const query = buildMasterTypesQuery(types);
  if (query.length === 0) {
    throw new Error("At least one master type is required.");
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${query}`;
}
