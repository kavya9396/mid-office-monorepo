import { describe, expect, it } from "vitest";
import { drsRoutePath, drsUrl, parseDrsApplicationNo } from "@insurance-poc/routes";

describe("drsRoutePath", () => {
  it("builds app-scoped DRS paths", () => {
    expect(drsRoutePath("RET-CVT-001")).toBe("/app/RET-CVT-001/drs");
    expect(drsRoutePath("RET-CVT-001", "financial")).toBe("/app/RET-CVT-001/drs/financial");
  });

  it("parses application numbers from pathnames", () => {
    expect(parseDrsApplicationNo("/app/RET-CVT-001/drs")).toBe("RET-CVT-001");
    expect(parseDrsApplicationNo("/app/GRP-DVT-001/drs/financial")).toBe("GRP-DVT-001");
  });
});

describe("drsUrl", () => {
  it("returns gateway URLs with business prefix and no query by default", () => {
    expect(drsUrl("RETAIL", "RET-CVT-001")).toBe("/retail/app/RET-CVT-001/drs");
    expect(drsUrl("GROUP", "GRP-DVT-001")).toBe("/group/app/GRP-DVT-001/drs");
  });
});
