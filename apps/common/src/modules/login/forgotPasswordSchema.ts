import { z } from "zod";
import { RegexPatterns } from "@insurance-poc/utils";

function isEmailAddress(value: string): boolean {
  const at = value.indexOf("@");
  if (at <= 0 || value.includes("@", at + 1)) return false;

  for (const character of value) {
    if (character.trim() === "") return false;
  }

  const domain = value.slice(at + 1);
  return domain.slice(1, -1).includes(".");
}

export const forgotPasswordSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "User ID is required")
    .refine(
      (value) => RegexPatterns.userId.test(value) || isEmailAddress(value),
      "Enter a valid user ID or email",
    ),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
