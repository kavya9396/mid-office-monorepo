import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDrsTaskIds,
  getDrsTaskIds,
  hasDrsTaskIds,
  setDrsTaskIds,
} from "@insurance-poc/utils";

describe("drsTaskContext", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and reads taskId and instanceId", () => {
    setDrsTaskIds("T-1", "I-1");
    expect(getDrsTaskIds()).toEqual({ taskId: "T-1", instanceId: "I-1" });
    expect(hasDrsTaskIds()).toBe(true);
  });

  it("clears only taskId and instanceId while keeping the key", () => {
    setDrsTaskIds("T-1", "I-1");
    clearDrsTaskIds();
    expect(getDrsTaskIds()).toEqual({ taskId: "", instanceId: "" });
    expect(sessionStorage.getItem("drsTaskContext")).toBe(
      JSON.stringify({ taskId: "", instanceId: "" }),
    );
  });
});
