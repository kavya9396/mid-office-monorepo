import { describe, expect, it } from "vitest";
import { buildMasterTypesQuery, buildMastersRequestUrl } from "./buildMasterQuery";

describe("buildMasterTypesQuery", () => {
  it("repeats types as separate query params", () => {
    expect(buildMasterTypesQuery(["gender", "country"])).toBe("types=gender&types=country");
  });

  it("skips blank entries", () => {
    expect(buildMasterTypesQuery(["gender", " ", "country"])).toBe("types=gender&types=country");
  });
});

describe("buildMastersRequestUrl", () => {
  it("appends query to the masters base URL", () => {
    const url = buildMastersRequestUrl("https://api.example/masters", ["gender", "state"]);
    expect(url).toBe("https://api.example/masters?types=gender&types=state");
  });
});
