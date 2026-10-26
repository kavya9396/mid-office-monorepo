import devConfig from "./dev-config.json";

/**
 * Local same-origin URLs for Common, Retail, and Group.
 *
 * Open the Common dev server (see dev-config.json). It proxies /retail and /group,
 * so all three apps share one browser origin and one sessionStorage bucket.
 * sessionStorage is not shared across origins. Never put the JWT in the URL.
 * Separate production origins need SSO or a parent-domain session instead.
 */

export const devGatewayOrigin = `http://${devConfig.host}:${devConfig.ports.common}`;

export const devPorts = devConfig.ports;

export const viteBase = devConfig.viteBase;

export const previewPort = devConfig.previewPort;

export function appBasename(base: string): string {
  if (base === "/") return "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const commonPaths = {
  home: "/",
  login: "/login",
} as const;

const retailBase = appBasename(viteBase.retail);
const groupBase = appBasename(viteBase.group);

export const retailPaths = {
  root: retailBase,
  inbox: `${retailBase}/inbox`,
  drs: `${retailBase}/drs`,
} as const;

export const groupPaths = {
  root: groupBase,
  inbox: `${groupBase}/inbox`,
  drs: `${groupBase}/drs`,
} as const;

export function businessInboxUrl(businessType: string): string | null {
  if (businessType === "RETAIL") return retailPaths.inbox;
  if (businessType === "GROUP") return groupPaths.inbox;
  return null;
}

export function drsUrl(
  businessType: string,
  applicationNo: string,
): string | null {
  const query = new URLSearchParams({ applicationNo }).toString();

  if (businessType === "RETAIL") return `${retailPaths.drs}?${query}`;
  if (businessType === "GROUP") return `${groupPaths.drs}?${query}`;

  return null;
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isStandaloneDevPort(): boolean {
  if (typeof window === "undefined") return false;
  const port = window.location.port;
  return port === String(devPorts.retail) || port === String(devPorts.group);
}

function resolveNavigationUrl(url: string): string {
  if (isAbsoluteUrl(url) || !isStandaloneDevPort()) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${devGatewayOrigin}${path}`;
}

export function assignUrl(url: string): void {
  window.location.assign(resolveNavigationUrl(url));
}

export function replaceUrl(url: string): void {
  window.location.replace(resolveNavigationUrl(url));
}
