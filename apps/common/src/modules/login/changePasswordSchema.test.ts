import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./changePasswordSchema";

describe("changePasswordSchema", () => {
  it("accepts matching new and confirm passwords", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "old",
      newPassword: "newPass1",
      confirmPassword: "newPass1",
    });
    expect(result.success).toBe(true);
  });

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "",
      newPassword: "newPass1",
      confirmPassword: "newPass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Current password is required");
    }
  });

  it("requires the new password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "old",
      newPassword: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "New password is required",
      );
    }
  });

  it("requires the confirm password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "old",
      newPassword: "newPass1",
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
    const result = changePasswordSchema.safeParse({
      oldPassword: "old",
      newPassword: "newPass1",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.message).toBe("Passwords do not match");
      expect(issue?.path).toEqual(["confirmPassword"]);
    }
  });

  it("is case sensitive when comparing passwords", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "old",
      newPassword: "Password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });
});
