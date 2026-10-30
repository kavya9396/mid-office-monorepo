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
  masDrs: `${retailBase}/mas/drs`,
  previousPolicy: `${retailBase}/previous-policy`,
} as const;

export const groupPaths = {
  root: groupBase,
  inbox: `${groupBase}/inbox`,
  drs: `${groupBase}/drs`,
  guwDrs: `${groupBase}/guw/drs`,
  previousPolicy: `${groupBase}/previous-policy`,
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

export function previousPolicyUrl(
  businessType: string,
  applicationNo: string,
): string | null {
  const query = new URLSearchParams({ applicationNo }).toString();

  if (businessType === "RETAIL") return `${retailPaths.previousPolicy}?${query}`;
  if (businessType === "GROUP") return `${groupPaths.previousPolicy}?${query}`;

  return null;
}

export function assignUrl(url: string): void {
  window.location.assign(url);
}

export function replaceUrl(url: string): void {
  window.location.replace(url);
}
