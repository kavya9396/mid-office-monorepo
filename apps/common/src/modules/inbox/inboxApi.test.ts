import { describe, expect, it } from "vitest";
import {
  casesForTask,
  mapRoleListPayload,
  readSelectedFields,
  rememberPoolColumns,
  ROLE_POOL_KEYS,
  storedPoolColumns,
  type InboxData,
  type RolePoolKey,
} from "./inboxApi";
import {
  columnsForPool,
  defaultVisibleColumns,
  formatColumnName,
  formatLastLogin,
  initials,
  isApplicationColumn,
  taskDetailsTitle,
  toDisplayLabel,
} from "./inboxFormat";

function roleListPayload(
  pools: Partial<Record<RolePoolKey, unknown[]>>,
  userId?: string,
): { poolData: Partial<Record<RolePoolKey, unknown[]>>; userId?: string } {
  return userId === undefined ? { poolData: pools } : { userId, poolData: pools };
}

function sampleInbox(): InboxData {
  return mapRoleListPayload(
    roleListPayload(
      {
        CVT_POOL: [{ id: "1", applicationNo: "RET-CVT-001", taskId: "T1", product: "iProtect" }],
        GUW: [
          {
            id: "2",
            applicationNo: "RET-GUW-001",
            productCode: "GTL-01",
            masterPlanNo: "MP-7782",
            taskId: "T2",
          },
        ],
        DVT_FORMAL: [
          {
            id: "3",
            policyNo: "POL-800001",
            applicationNo: "RET-DVTF-001",
            memberName: "Neel Kapoor",
            appliedCover: 2500000,
            taskId: "T3",
          },
        ],
      },
      "UW001",
    ),
  );
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

  it("maps GUW and formal pool fields while omitting pools the API left out", () => {
    const data = mapRoleListPayload(
      roleListPayload({
        GUW: [
          {
            id: "GP-004",
            applicationNo: "GRP-GUW-001",
            productCode: "GTL-01",
            masterPlanNo: "MP-7782",
            poolTAT: "6h",
            productType: "Group Term",
            product: "Group Term Life",
            typeOfGroupBusiness: "Employer-Employee",
            sumAssured: 10000000,
            caseReceivedDate: "2026-10-29",
            channelCode: "COR",
            channel: "Corporate",
            breDecision: "Pending",
          },
        ],
        DVT_POOL: [
          {
            id: "GP-005",
            applicationNo: "GRP-DVT-001",
            productCode: "GHL-01",
            masterPlanNo: "MP-5521",
            typeOfGroupBusiness: "Non-Employer",
            caseReceivedDate: "2026-10-28",
          },
        ],
        DVT_FORMAL: [
          {
            id: "GP-007",
            policyNo: "POL-900001",
            applicationNo: "GRP-DVTF-001",
            productCode: "GTL-02",
            memberName: "Neel Kapoor",
            poolTAT: "5h",
            appliedCover: 2500000,
            product: "Group Term Life",
          },
        ],
        GUW_FORMAL: [
          {
            id: "GP-008",
            policyNo: "POL-900002",
            applicationNo: "GRP-GUWF-001",
            memberName: "Ira Rao",
            appliedCover: 3000000,
          },
        ],
      }),
    );

    expect(Object.keys(data.poolData)).toEqual(["GUW", "DVT_POOL", "DVT_FORMAL", "GUW_FORMAL"]);
    expect(data.poolData.CUW).toBeUndefined();
    expect(data.poolData.GOPS_DVT).toBeUndefined();
    expect(data.poolData.GUW?.[0]?.fields).toMatchObject({
      productCode: "GTL-01",
      masterPlanNo: "MP-7782",
      typeOfGroupBusiness: "Employer-Employee",
      caseReceivedDate: "2026-10-29",
    });
    expect(data.poolData.DVT_FORMAL?.[0]?.fields).toMatchObject({
      policyNo: "POL-900001",
      memberName: "Neel Kapoor",
      appliedCover: 2500000,
    });
    expect(data.poolData.GUW_FORMAL?.[0]?.fields.policyNo).toBe("POL-900002");
  });

  it("reads the user id and keeps every 19 known pools when the API sends them", () => {
    const pools = Object.fromEntries(ROLE_POOL_KEYS.map((pool) => [pool, []])) as Partial<
      Record<RolePoolKey, unknown[]>
    >;
    const data = mapRoleListPayload(roleListPayload(pools, "  UW001  "));

    expect(data.userId).toBe("UW001");
    expect(Object.keys(data.poolData)).toEqual([...ROLE_POOL_KEYS]);
  });

  it("rejects a role-list payload that is not in the expected format", () => {
    expect(() => mapRoleListPayload(null)).toThrow("Role-list response is not in the expected format.");
    expect(() => mapRoleListPayload({ poolData: [] })).toThrow(
      "Role-list response is not in the expected format.",
    );
  });

  it("treats a non-array pool as empty and skips rows that are not objects", () => {
    const data = mapRoleListPayload({
      poolData: {
        CVT_POOL: { applicationNo: "RET-CVT-001" },
        CPT_POOL: ["skip-me", { applicationNo: "RET-CPT-001", nested: { ignore: true } }],
      },
    });

    expect(data.poolData.CVT_POOL).toEqual([]);
    expect(data.poolData.CPT_POOL).toHaveLength(1);
    expect(data.poolData.CPT_POOL?.[0]?.applicationNo).toBe("RET-CPT-001");
    expect(data.poolData.CPT_POOL?.[0]?.fields.nested).toBeUndefined();
  });
});

describe("landing task selection", () => {
  it("returns every mapped case for All Cases in pool order", () => {
    const data = sampleInbox();
    const cases = casesForTask(data, "ALL_CASES");

    expect(cases.map((item) => item.applicationNo)).toEqual([
      "RET-CVT-001",
      "RET-GUW-001",
      "RET-DVTF-001",
    ]);
  });

  it("returns only the selected pool and an empty list for an unknown task", () => {
    const data = sampleInbox();

    expect(casesForTask(data, "GUW").map((item) => item.applicationNo)).toEqual(["RET-GUW-001"]);
    expect(casesForTask(data, "CUW")).toEqual([]);
    expect(casesForTask(data, "UNKNOWN_POOL")).toEqual([]);
  });
});

describe("landing column configuration", () => {
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

  it("does not invent columns that the response omitted", () => {
    expect(defaultVisibleColumns([], "DVT_POOL")).toEqual([]);
    expect(defaultVisibleColumns(["channel", "product"], "CVT_POOL")).toEqual(["channel", "product"]);
    expect(columnsForPool(["applicationNo", "productCode"], "DVT_POOL")).toEqual([
      "applicationNo",
      "productCode",
    ]);
  });

  it("prioritizes group pool fields that the response actually sent", () => {
    expect(
      defaultVisibleColumns(
        [
          "applicationNo",
          "channel",
          "product",
          "sumAssured",
          "productCode",
          "masterPlanNo",
          "poolTAT",
          "productType",
          "typeOfGroupBusiness",
          "caseReceivedDate",
        ],
        "GUW",
      ),
    ).toEqual([
      "applicationNo",
      "productCode",
      "masterPlanNo",
      "poolTAT",
      "productType",
      "typeOfGroupBusiness",
      "caseReceivedDate",
      "channel",
    ]);
    expect(
      defaultVisibleColumns(
        ["applicationNo", "policyNo", "productCode", "memberName", "poolTAT", "appliedCover", "channel", "product"],
        "DVT_FORMAL",
      ),
    ).toEqual([
      "applicationNo",
      "policyNo",
      "productCode",
      "memberName",
      "poolTAT",
      "appliedCover",
      "channel",
      "product",
    ]);
  });

  it("reads saved column order and ignores blank field names", () => {
    const scope = "landing-report";
    const saved = rememberPoolColumns(scope, "GUW", ["applicationNo", "productCode"]);

    expect(saved).toEqual({ success: true, message: "Column sequence saved" });
    expect(storedPoolColumns(scope, "GUW", { selectedFields: ["channel"] })).toEqual([
      "applicationNo",
      "productCode",
    ]);
    expect(readSelectedFields({ selectedFields: ["channel", "", 12] })).toEqual(["channel"]);
    expect(readSelectedFields({ availableFields: ["product"] })).toEqual(["product"]);
    expect(readSelectedFields(null)).toEqual([]);
  });
});

describe("landing labels", () => {
  it("uses the landing display names for underwriting fields", () => {
    expect(formatColumnName("isMedical")).toBe("Medical");
    expect(formatColumnName("appliedSa")).toBe("Applied SA");
    expect(formatColumnName("drc")).toBe("DRC");
    expect(formatColumnName("hniFlag")).toBe("HNI Flags");
    expect(formatColumnName("ptlr")).toBe("PTLR");
    expect(formatColumnName("productCode")).toBe("Product Code");
    expect(formatColumnName("masterPlanNo")).toBe("Master Plan No");
  });

  it("formats sidebar titles, initials, and application columns", () => {
    expect(toDisplayLabel("CVT_POOL")).toBe("CVT Pool");
    expect(toDisplayLabel("GUW")).toBe("GUW");
    expect(taskDetailsTitle("ALL_CASES")).toBe("ALL CASES Details");
    expect(taskDetailsTitle("DVT_FORMAL")).toBe("DVT FORMAL Details");
    expect(initials("CVT_POOL")).toBe("CP");
    expect(initials("GUW")).toBe("GU");
    expect(initials("")).toBe("--");
    expect(isApplicationColumn("applicationNo")).toBe(true);
    expect(isApplicationColumn("application_number")).toBe(true);
    expect(isApplicationColumn("productCode")).toBe(false);
  });

  it("formats lastLoginAt from the login response", () => {
    expect(formatLastLogin("2026-10-06T14:10:20")).toMatch(/^Last login: /);
    expect(formatLastLogin("2026-10-06T14:10:20")).toContain("October");
    expect(formatLastLogin(new Date(2026, 9, 1, 14, 10))).toContain("1st");
    expect(formatLastLogin("not-a-date")).toBe("");
  });
});
