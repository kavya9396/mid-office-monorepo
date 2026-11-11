import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  canInvokeBreRetrigger,
  clearBreRetriggerCount,
  clearToken,
  getBreRetriggerCount,
  hasBreRetriggerCountInSession,
  isBreRetriggerLimitReached,
  setBreRetriggerCount,
  setToken,
} from "@insurance-poc/utils";

describe("breRetriggerCount session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("does not create a session key until the first successful API save", () => {
    expect(hasBreRetriggerCountInSession()).toBe(false);
    expect(getBreRetriggerCount()).toBeNull();
    expect(isBreRetriggerLimitReached()).toBe(false);
  });

  it("stores and updates the API-reported count", () => {
    setBreRetriggerCount(1);
    expect(hasBreRetriggerCountInSession()).toBe(true);
    expect(getBreRetriggerCount()).toBe(1);
    expect(canInvokeBreRetrigger()).toBe(true);
    expect(isBreRetriggerLimitReached()).toBe(false);

    setBreRetriggerCount(3);
    expect(canInvokeBreRetrigger()).toBe(true);

    setBreRetriggerCount(4);
    expect(getBreRetriggerCount()).toBe(4);
    expect(canInvokeBreRetrigger()).toBe(false);
    expect(isBreRetriggerLimitReached()).toBe(true);
  });

  it("clears on inbox reset helper", () => {
    setBreRetriggerCount(2);
    clearBreRetriggerCount();
    expect(getBreRetriggerCount()).toBeNull();
  });

  it("clears on logout via clearToken", () => {
    setToken("test-token");
    setBreRetriggerCount(3);
    clearToken();
    expect(getBreRetriggerCount()).toBeNull();
  });
});
