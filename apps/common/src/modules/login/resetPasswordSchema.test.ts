import { PASSWORD_POLICY_MESSAGE } from "@insurance-poc/utils";
import { describe, expect, it } from "vitest";
import { resetPasswordSchema } from "./resetPasswordSchema";

const passwordMessage = PASSWORD_POLICY_MESSAGE;

describe("resetPasswordSchema", () => {
  it("accepts matching passwords of at least 12 characters", () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: "NewerPass@1234",
        confirmPassword: "NewerPass@1234",
      }).success,
    ).toBe(true);
  });

  it("rejects a password shorter than 12 characters", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "Short@1234",
      confirmPassword: "Short@1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(passwordMessage);
    }
  });

  it("requires the confirm password", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "NewerPass@1234",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(passwordMessage);
    }
  });

  it("reports a mismatch on the confirmPassword field", () => {
    const result = resetPasswordSchema.safeParse({
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
});
