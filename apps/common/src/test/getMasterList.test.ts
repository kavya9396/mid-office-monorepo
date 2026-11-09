import { beforeEach, describe, expect, it } from "vitest";
import { clearMasterData, getMasterList, setMasterData } from "@insurance-poc/utils";

describe("getMasterList", () => {
  beforeEach(() => {
    clearMasterData();
  });

  it("returns the full list for a masterType when type is omitted", () => {
    setMasterData({
      data: {
        gender: [
          { code: "M", description: "Male", value: "Male", isActive: "Y" },
          { code: "F", description: "Female", value: "Female", isActive: "Y" },
        ],
      },
      unknownTypes: [],
    });

    expect(getMasterList("gender")).toHaveLength(2);
    expect(getMasterList("gender", "")).toHaveLength(2);
  });

  it("filters misc rows by optional type", () => {
    setMasterData({
      data: {
        misc: [
          {
            code: "1",
            description: "30",
            value: "30",
            isActive: "Y",
            type: "SES_TIMEOUT",
          },
          {
            code: "2",
            description: "Other",
            value: "Other",
            isActive: "Y",
            type: "OTHER",
          },
        ],
      },
      unknownTypes: [],
    });

    expect(getMasterList("misc")).toHaveLength(2);
    expect(getMasterList("misc", "SES_TIMEOUT")).toHaveLength(1);
    expect(getMasterList("misc", "ses_timeout")[0]?.value).toBe("30");
  });

  it("returns an empty array when session or master key is missing", () => {
    expect(getMasterList("gender")).toEqual([]);
    setMasterData({ data: {}, unknownTypes: [] });
    expect(getMasterList("gender")).toEqual([]);
  });
});
