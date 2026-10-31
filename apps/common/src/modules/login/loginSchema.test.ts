import { describe, expect, it } from "vitest";
import { loginSchema } from "./loginSchema";

function firstMessage(input: unknown): string | undefined {
  const result = loginSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

const validPassword = "NewerPass@1234";

describe("loginSchema", () => {
  it("accepts a valid alphanumeric User ID and a password", () => {
    expect(
      loginSchema.safeParse({ username: "LDAP12345", password: validPassword }).success,
    ).toBe(true);
  });

  it("trims surrounding whitespace from the User ID", () => {
    const result = loginSchema.safeParse({ username: "  LDAP12345  ", password: validPassword });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe("LDAP12345");
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
      expect(firstMessage({ username, password: validPassword })).toBe(
        "User ID must be letters followed by numbers",
      );
    },
  );

  it("rejects an empty password", () => {
    expect(firstMessage({ username: "LDAP12345", password: "" })).toBe(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
    );
  });

  it("does not trim the password", () => {
    const result = loginSchema.safeParse({
      username: "LDAP12345",
      password: `  ${validPassword}  `,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});
