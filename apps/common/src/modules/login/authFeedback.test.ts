import { describe, expect, it } from "vitest";
import { authSnackbar, closedAuthSnackbar, readApiMessage } from "./authFeedback";

describe("closedAuthSnackbar", () => {
  it("is closed with an empty info message", () => {
    expect(closedAuthSnackbar).toEqual({ open: false, message: "", severity: "info" });
  });
});

describe("authSnackbar", () => {
  it("builds an open snackbar state", () => {
    expect(authSnackbar("Saved", "success")).toEqual({
      open: true,
      message: "Saved",
      severity: "success",
    });
  });
});

describe("readApiMessage", () => {
  it("returns a trimmed string reason", () => {
    expect(readApiMessage("  boom  ")).toBe("boom");
  });

  it("returns the fallback for a blank string", () => {
    expect(readApiMessage("   ", "fallback")).toBe("fallback");
  });

  it("returns an Error message", () => {
    expect(readApiMessage(new Error(" failed "))).toBe("failed");
  });

  it("returns the fallback for an Error with a blank message", () => {
    expect(readApiMessage(new Error("  "), "fallback")).toBe("fallback");
  });

  it("prefers the error property of an object", () => {
    expect(readApiMessage({ error: "E1", message: "M1" })).toBe("E1");
  });

  it("falls back to the message property of an object", () => {
    expect(readApiMessage({ error: " ", message: "M1" })).toBe("M1");
  });

  it("returns the fallback for an object without usable fields", () => {
    expect(readApiMessage({ code: 500 }, "fallback")).toBe("fallback");
  });

  it("returns an empty string by default for unsupported values", () => {
    expect(readApiMessage(null)).toBe("");
    expect(readApiMessage(42)).toBe("");
    expect(readApiMessage(undefined)).toBe("");
  });
});
