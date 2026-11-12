import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBreRetriggerCount, setSessionBusinessType } from "@insurance-poc/utils";
import {
  buildBreRetriggerRequestBody,
  mapBreRetriggerOutput,
  readBreOutputFromResponse,
  type BreRetriggerBaseQuery,
} from "./breRetrigger";
import breRetriggerMock from "./mock/breRetrigger.json";

describe("BRE retrigger", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("builds group and retail request bodies from business type", () => {
    expect(buildBreRetriggerRequestBody("OS40385478", "GROUP")).toEqual({
      eventName: "BRE-GROUP",
      applicationNumber: "OS40385478",
      lob: "G",
    });
    expect(buildBreRetriggerRequestBody("OS31229864", "RETAIL")).toEqual({
      eventName: "BRE-RETAIL",
      applicationNumber: "OS31229864",
      lob: "R",
    });
  });

  it("maps mock response to final BRE columns", () => {
    const output = readBreOutputFromResponse(breRetriggerMock);
    const mapped = mapBreRetriggerOutput(output);
    expect(mapped.barDecision).toBe("Non-STP");
    expect(mapped.reTriggerCount).toBe(0);
    expect(mapped.rows).toEqual({
      status: "Success",
      decision: "Non-STP",
      remarks:
        "Financially Not Eligible.#TSA gt 20lakhs height weight value blank received#Single Pay Policy",
      discrepancy: "GCD",
      timestamp: "2026-11-07T10:22:45Z",
    });
  });

  it("posts the BRE events payload in real mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.resetModules();
    setSessionBusinessType("GROUP");
    const { mutateBreRetrigger: mutate } = await import("./breRetrigger");

    const posted: { body?: unknown } = {};
    const baseQuery: BreRetriggerBaseQuery = vi.fn(async (args) => {
      if (typeof args === "object" && args !== null && "body" in args) {
        posted.body = (args as { body: unknown }).body;
      }
      return { data: breRetriggerMock };
    });

    const result = await mutate(baseQuery, "https://example.test/bre/v1/events", "OS40385478", "GROUP");

    expect("data" in result).toBe(true);
    expect(posted.body).toEqual({
      eventName: "BRE-GROUP",
      applicationNumber: "OS40385478",
      lob: "G",
    });
  });

  it("returns API error message from failure body", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.resetModules();
    const { mutateBreRetrigger: mutate } = await import("./breRetrigger");

    const baseQuery: BreRetriggerBaseQuery = vi.fn(async () => ({
      data: { message: "BRE orchestration failed", error: "BRE_ERROR" },
    }));

    const result = await mutate(baseQuery, "https://example.test/bre/v1/events", "OS40385478", "GROUP");

    expect("error" in result).toBe(true);
    if ("error" in result && "error" in result.error) {
      expect(result.error.error).toBe("BRE orchestration failed");
    }
  });

  it("reads mock payload when VITE_USE_MOCK is enabled", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_USE_MOCK", "true");
    vi.resetModules();
    const { mutateBreRetrigger: mutate } = await import("./breRetrigger");

    const baseQuery: BreRetriggerBaseQuery = vi.fn(async () => ({
      data: { message: "should not be called" },
    }));

    const pending = mutate(baseQuery, "", "OS40385478", "GROUP");
    await vi.advanceTimersByTimeAsync(100);
    const result = await pending;

    expect("data" in result).toBe(true);
    expect(baseQuery).not.toHaveBeenCalled();
    if ("data" in result) {
      expect(result.data.barDecision).toBe("Non-STP");
      expect(result.data.reTriggerCount).toBe(0);
    }
    vi.useRealTimers();
  });

  it("does not delay in real API mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.resetModules();
    const { mutateBreRetrigger: mutate } = await import("./breRetrigger");
    const started = Date.now();

    const baseQuery: BreRetriggerBaseQuery = vi.fn(async () => ({ data: breRetriggerMock }));
    await mutate(baseQuery, "https://example.test/bre/v1/events", "OS40385478", "GROUP");

    expect(Date.now() - started).toBeLessThan(50);
    expect(getBreRetriggerCount()).toBeNull();
  });
});
