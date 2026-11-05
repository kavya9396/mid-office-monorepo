import { describe, expect, it } from "vitest";
import { loginSchema } from "./loginSchema";

function firstMessage(input: unknown): string | undefined {
  const result = loginSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("loginSchema", () => {
  it("accepts any non-empty user id and password", () => {
    expect(loginSchema.safeParse({ username: "user-1", password: "x" }).success).toBe(true);
  });

  it("trims surrounding whitespace from the User ID", () => {
    const result = loginSchema.safeParse({ username: "  LDAP12345  ", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe("LDAP12345");
  });

  it("rejects an empty User ID", () => {
    expect(firstMessage({ username: "", password: "secret" })).toBe("User ID is required");
  });

  it("rejects a whitespace-only User ID", () => {
    expect(firstMessage({ username: "   ", password: "secret" })).toBe("User ID is required");
  });

  it("rejects an empty password", () => {
    expect(firstMessage({ username: "LDAP12345", password: "" })).toBe("Password is required");
  });

  it("does not trim the password", () => {
    const result = loginSchema.safeParse({
      username: "LDAP12345",
      password: "  secret  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBe("  secret  ");
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});
