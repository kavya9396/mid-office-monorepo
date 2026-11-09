import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMasterData } from "@insurance-poc/utils";
import { MASTER_DATA_TYPES } from "./masterData/masterTypesConfig";
import { buildMastersRequestUrl } from "./masterData/buildMasterQuery";
import { parseMasterDataResponse } from "./masterDataService";

describe("parseMasterDataResponse", () => {
  it("normalizes list entries under data", () => {
    const payload = parseMasterDataResponse({
      data: {
        gender: [{ code: "M", description: "Male", value: "Male", isActive: "Y" }],
      },
      unknownTypes: [],
    });
    expect(payload.data.gender).toHaveLength(1);
    expect(payload.unknownTypes).toEqual([]);
  });
});

describe("fetchAndStoreMasterData", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("VITE_USE_MOCK", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores mock master data in sessionStorage", async () => {
    vi.resetModules();
    const { fetchAndStoreMasterData } = await import("./masterDataService");
    await fetchAndStoreMasterData();
    const stored = getMasterData();
    expect(stored?.data.gender?.length).toBeGreaterThan(0);
    expect(stored?.unknownTypes).toEqual([]);
  });
});

describe("MASTER_DATA_TYPES query", () => {
  it("includes every configured type in the URL", () => {
    const url = buildMastersRequestUrl("https://midoffice-uat-api.icicilife.com/masters", MASTER_DATA_TYPES);
    for (const type of MASTER_DATA_TYPES) {
      expect(url).toContain(`types=${encodeURIComponent(type)}`);
    }
  });
});
