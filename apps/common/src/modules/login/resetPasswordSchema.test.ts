import { describe, expect, it } from "vitest";
import { resetPasswordSchema } from "./resetPasswordSchema";

describe("resetPasswordSchema", () => {
  it("accepts matching passwords of at least 8 characters", () => {
    expect(
      resetPasswordSchema.safeParse({ newPassword: "abcd1234", confirmPassword: "abcd1234" })
        .success,
    ).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "abc1234",
      confirmPassword: "abc1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Password must be at least 8 characters long",
      );
    }
  });

  it("requires the confirm password", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "abcd1234",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Confirm your password",
      );
    }
  });

  it("reports a mismatch on the confirmPassword field", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "abcd1234",
      confirmPassword: "abcd12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.message).toBe("Passwords do not match");
      expect(issue?.path).toEqual(["confirmPassword"]);
    }
  });
});
