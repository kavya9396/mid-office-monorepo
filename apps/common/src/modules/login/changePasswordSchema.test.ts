import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./changePasswordSchema";

const passwordMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";

describe("changePasswordSchema", () => {
  it("accepts matching new and confirm passwords", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "OldPass@1234",
      newPassword: "NewerPass@1234",
      confirmPassword: "NewerPass@1234",
    });
    expect(result.success).toBe(true);
  });

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "",
      newPassword: "NewerPass@1234",
      confirmPassword: "NewerPass@1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(passwordMessage);
    }
  });

  it("requires the new password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "OldPass@1234",
      newPassword: "",
      confirmPassword: "NewerPass@1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(passwordMessage);
    }
  });

  it("requires the confirm password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "OldPass@1234",
      newPassword: "NewerPass@1234",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(passwordMessage);
    }
  });

  it("reports a mismatch on the confirmPassword field", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "OldPass@1234",
      newPassword: "NewerPass@1234",
      confirmPassword: "NewerPass@1235",
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
      oldPassword: "OldPass@1234",
      newPassword: "NewerPass@1234",
      confirmPassword: "newerPass@1234",
    });
    expect(result.success).toBe(false);
  });
});
