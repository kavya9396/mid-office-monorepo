import { z } from "zod";
import { isLikelyEmail, isValidEmailAddress } from "@insurance-poc/utils";

export const forgotPasswordSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "User ID is required")
    .superRefine((value, context) => {
      if (!isLikelyEmail(value)) return;
      if (!isValidEmailAddress(value)) {
        context.addIssue({
          code: "custom",
          message: "Enter a valid email address",
        });
      }
    }),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
