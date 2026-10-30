import { describe, expect, it } from "vitest";
import { loginSchema } from "./loginSchema";

function firstMessage(input: unknown): string | undefined {
  const result = loginSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("loginSchema", () => {
  it("accepts a valid alphanumeric User ID and a password", () => {
    expect(loginSchema.safeParse({ username: "User123", password: "secret" }).success).toBe(true);
  });

  it("trims surrounding whitespace from the User ID", () => {
    const result = loginSchema.safeParse({ username: "  User123  ", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe("User123");
  });

  it("rejects an empty User ID", () => {
    expect(firstMessage({ username: "", password: "secret" })).toBe("User ID is required");
  });

  it("rejects a whitespace-only User ID", () => {
    expect(firstMessage({ username: "   ", password: "secret" })).toBe("User ID is required");
  });

  it.each(["user-1", "user_1", "user 1", "user@1", "user.1"])(
    "rejects User ID with special characters: %s",
    (username) => {
      expect(firstMessage({ username, password: "secret" })).toBe(
        "User ID can only contain letters and numbers",
      );
    },
  );

  it("rejects an empty password", () => {
    expect(firstMessage({ username: "User123", password: "" })).toBe("Password is required");
  });

  it("does not trim the password", () => {
    const result = loginSchema.safeParse({ username: "User123", password: "  pw  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBe("  pw  ");
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});
