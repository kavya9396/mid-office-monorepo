import { describe, expect, it } from "vitest";
import {
  isApiFailureBody,
  readApiErrorMessage,
  toCustomQueryError,
} from "@insurance-poc/utils";

describe("readApiErrorMessage", () => {
  it("reads message from pool-columns save style errors", () => {
    expect(
      readApiErrorMessage(
        { status: 400, data: { message: "Unknown pool keys", error: "INVALID_REQUEST" } },
        "fallback",
      ),
    ).toBe("Unknown pool keys");
  });

  it("reads message from complete-task style errors", () => {
    expect(
      readApiErrorMessage(
        { message: "unable to store final decision", error: "BPM_INTEGRATION_ERROR" },
        "fallback",
      ),
    ).toBe("unable to store final decision");
  });

  it("detects string error codes as API failures", () => {
    expect(isApiFailureBody({ message: "unable to store final decision", error: "BPM_INTEGRATION_ERROR" })).toBe(
      true,
    );
  });

  it("normalizes fetch errors to custom errors with API message", () => {
    const normalized = toCustomQueryError({
      status: 400,
      data: { message: "Unknown pool keys", error: "INVALID_REQUEST" },
    });
    expect(normalized).toEqual({
      status: "CUSTOM_ERROR",
      error: "Unknown pool keys",
    });
  });
});
