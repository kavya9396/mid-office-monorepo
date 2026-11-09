/** Basename-relative DRS paths: `/app/{applicationNo}/drs` (full URL adds `/retail` or `/group`). */

function encodeApplicationNo(applicationNo: string): string {
  return encodeURIComponent(applicationNo.trim());
}

export type DrsRouteSection = "financial" | "medical";

/**
 * In-app path for React Router (under Retail or Group basename).
 * Example: `/app/RET-CVT-001/drs` or `/app/RET-CVT-001/drs/financial`.
 */
export function drsRoutePath(applicationNo: string, section?: DrsRouteSection): string {
  const encoded = encodeApplicationNo(applicationNo);
  const base = `/app/${encoded}/drs`;
  if (section === "financial") return `${base}/financial`;
  if (section === "medical") return `${base}/medical`;
  return base;
}

/** Reads `applicationNo` from a pathname that matches the DRS app route pattern. */
export function parseDrsApplicationNo(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "");
  const match = normalized.match(/\/app\/([^/]+)\/drs(?:\/|$)/i);
  const raw = match?.[1];
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    const fallback = raw.trim();
    return fallback.length > 0 ? fallback : null;
  }
}

export function isDrsAppRoute(pathname: string): boolean {
  return /\/app\/[^/]+\/drs(?:\/|$)/i.test(pathname);
}
