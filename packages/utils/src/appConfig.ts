function readFlag(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Shared by Common, Retail, and Group. False only when VITE_USE_MOCK is exactly "false". */
export const useMock = readFlag(import.meta.env.VITE_USE_MOCK) !== "false";
