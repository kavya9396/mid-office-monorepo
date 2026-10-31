import { describe, expect, it } from "vitest";
import {
  mapRoleListPayload,
  type RolePoolKey,
} from "./inboxApi";
import {
  columnsForPool,
  defaultVisibleColumns,
  formatColumnName,
  formatLastLogin,
} from "./inboxFormat";

function roleListPayload(
  pools: Partial<Record<RolePoolKey, unknown[]>>,
): { poolData: Partial<Record<RolePoolKey, unknown[]>> } {
  return { poolData: pools };
}

describe("role-list inbox contract", () => {
  it("keeps only pools and fields present in the response", () => {
    const data = mapRoleListPayload(
      roleListPayload({
        CPT_POOL: [
          {
            id: null,
            applicationNo: null,
            medicalReceivedDate: null,
            financialReceivedDate: "2026-10-30",
            poolTAT: "8h",
            taskId: "TASK-1",
          },
        ],
        DVT_POOL: [],
      }),
    );

    expect(Object.keys(data.poolData)).toEqual(["CPT_POOL", "DVT_POOL"]);
    expect(data.poolData.CVT_POOL).toBeUndefined();
    expect(data.poolData.DVT_POOL).toEqual([]);
    expect(data.poolData.CPT_POOL?.[0]?.applicationNo).toBe("");
    expect(data.poolData.CPT_POOL?.[0]?.fields).toEqual({
      id: null,
      applicationNo: null,
      medicalReceivedDate: null,
      financialReceivedDate: "2026-10-30",
      poolTAT: "8h",
      taskId: "TASK-1",
    });
  });

  it("keeps Application Number first and prioritizes pool-specific fields in eight defaults", () => {
    const columns = [
      "applicationNo",
      "channel",
      "sumAssured",
      "medicalReceivedDate",
      "financialReceivedDate",
      "poolTAT",
      "product",
      "premium",
      "clientType",
    ];

    expect(defaultVisibleColumns(columns, "CPT_POOL")).toEqual([
      "applicationNo",
      "medicalReceivedDate",
      "financialReceivedDate",
      "poolTAT",
      "channel",
      "product",
      "sumAssured",
      "premium",
    ]);
  });

  it("uses the landing display names for underwriting fields", () => {
    expect(formatColumnName("isMedical")).toBe("Medical");
    expect(formatColumnName("appliedSa")).toBe("Applied SA");
    expect(formatColumnName("drc")).toBe("DRC");
    expect(formatColumnName("hniFlag")).toBe("HNI Flags");
    expect(formatColumnName("ptlr")).toBe("PTLR");
  });

  it("does not invent columns that the response omitted", () => {
    expect(defaultVisibleColumns([], "DVT_POOL")).toEqual([]);
    expect(defaultVisibleColumns(["channel", "product"], "CVT_POOL")).toEqual(["channel", "product"]);
    expect(columnsForPool(["applicationNo", "productCode"], "DVT_POOL")).toEqual([
      "applicationNo",
      "productCode",
    ]);
  });

  it("formats lastLoginAt from the login response", () => {
    expect(formatLastLogin("2026-10-06T14:10:20")).toMatch(/^Last login: /);
    expect(formatLastLogin("2026-10-06T14:10:20")).toContain("October");
    expect(formatLastLogin("not-a-date")).toBe("");
  });
});
