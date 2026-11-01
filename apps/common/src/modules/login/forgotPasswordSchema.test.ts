import { describe, expect, it } from "vitest";
import { forgotPasswordSchema } from "./forgotPasswordSchema";

function parse(userId: string) {
  return forgotPasswordSchema.safeParse({ userId });
}

describe("forgotPasswordSchema", () => {
  it("accepts an alphanumeric User ID", () => {
    expect(parse("User123").success).toBe(true);
  });

  it("accepts a valid email address", () => {
    expect(parse("john.doe@example.com").success).toBe(true);
  });

  it("trims whitespace before validating", () => {
    const result = parse("  User123  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.userId).toBe("User123");
  });

  it("rejects an empty value", () => {
    const result = parse("");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("User ID is required");
  });

  it.each([
    "user-1",
    "john@",
    "@example.com",
    "john@@example.com",
    "john@example",
    "john@.com",
    "john@example.",
    "jo hn@example.com",
  ])("rejects an invalid User ID or email: %s", (value) => {
    const result = parse(value);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Enter a valid user ID or email");
    }
  });
});
