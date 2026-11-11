import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionBusinessType,
  setSessionUser,
  type SessionBusinessType,
} from "@insurance-poc/utils";
import { mapRoleListPayload } from "../modules/inbox/inboxApi";
import type { LandingBaseQuery } from "./landingInboxQueries";

const mockRoleListWire = {
  poolData: {
    CVT_POOL: [{ applicationNo: "APP-001", businessType: "RETAIL" }],
  },
};

describe("buildRoleListRequestBody", () => {
  it("wraps businessType under request", async () => {
    const { buildRoleListRequestBody } = await import("./landingInboxQueries");
    expect(buildRoleListRequestBody("RETAIL")).toEqual({ request: { businessType: "RETAIL" } });
    expect(buildRoleListRequestBody("GROUP")).toEqual({ request: { businessType: "GROUP" } });
  });
});

describe("resolveRoleListBusinessType", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("prefers session businessType over app label", async () => {
    const { resolveRoleListBusinessType } = await import("./landingInboxQueries");
    setSessionBusinessType("GROUP");
    expect(resolveRoleListBusinessType("Retail")).toBe("GROUP");
  });

  it("falls back to Retail label when session is unset", async () => {
    const { resolveRoleListBusinessType } = await import("./landingInboxQueries");
    expect(resolveRoleListBusinessType("Retail")).toBe("RETAIL");
    expect(resolveRoleListBusinessType("Group")).toBe("GROUP");
  });
});

describe("queryLandingRoleList", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setSessionUser({ username: "UW001", displayName: "UW One" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const baseConfig = {
    roleListUrl: "https://example.test/v1/role-list",
    mapInboxPayload: mapRoleListPayload,
    mockData: mockRoleListWire as unknown as import("../modules/inbox/inboxApi").InboxData,
  };

  async function loadQueries(mock: boolean) {
    vi.stubEnv("VITE_USE_MOCK", mock ? "true" : "false");
    vi.resetModules();
    return import("./landingInboxQueries");
  }

  it("returns mock inbox data when session businessType matches the app (mock mode)", async () => {
    const { queryLandingRoleList } = await loadQueries(true);
    setSessionBusinessType("RETAIL");
    const baseQuery = vi.fn() as LandingBaseQuery;

    const result = await queryLandingRoleList(baseQuery, {
      ...baseConfig,
      businessLabel: "Retail",
    });

    expect(baseQuery).not.toHaveBeenCalled();
    expect("data" in result && result.data.poolData.CVT_POOL).toHaveLength(1);
  });

  it("rejects mock role-list when session businessType does not match the app", async () => {
    const { queryLandingRoleList } = await loadQueries(true);
    setSessionBusinessType("GROUP");

    const result = await queryLandingRoleList(vi.fn() as LandingBaseQuery, {
      ...baseConfig,
      businessLabel: "Retail",
    });

    expect("error" in result).toBe(true);
    if ("error" in result && "error" in result.error) {
      expect(String(result.error.error)).toContain("businessType");
    }
  });

  it("posts request.businessType from session in real API mode", async () => {
    const { queryLandingRoleList } = await loadQueries(false);
    setSessionBusinessType("GROUP");

    const roleListResponse = {
      poolData: {
        GUW: [{ applicationNo: "GRP-1", businessType: "GROUP" }],
      },
    };

    const posted: { body?: unknown } = {};
    const baseQuery: LandingBaseQuery = vi.fn(async (args) => {
      if (typeof args === "object" && args !== null && "body" in args) {
        posted.body = (args as { body: unknown }).body;
      }
      return { data: roleListResponse };
    });

    const result = await queryLandingRoleList(baseQuery, {
      ...baseConfig,
      businessLabel: "Group",
    });

    expect(posted.body).toEqual({ request: { businessType: "GROUP" } });
    expect("data" in result).toBe(true);
  });

  it("uses RETAIL in the role-list body after business switch session update", async () => {
    const { queryLandingRoleList } = await loadQueries(false);

    for (const businessType of ["GROUP", "RETAIL"] as SessionBusinessType[]) {
      setSessionBusinessType(businessType);
      const posted: { body?: unknown } = {};
      const baseQuery: LandingBaseQuery = vi.fn(async (args) => {
        if (typeof args === "object" && args !== null && "body" in args) {
          posted.body = (args as { body: unknown }).body;
        }
        return { data: mockRoleListWire };
      });

      await queryLandingRoleList(baseQuery, {
        ...baseConfig,
        businessLabel: businessType === "GROUP" ? "Group" : "Retail",
      });

      expect(posted.body).toEqual({ request: { businessType } });
    }
  });
});
