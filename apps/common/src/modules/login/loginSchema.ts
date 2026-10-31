import { z } from "zod";
import { RegexPatterns } from "@insurance-poc/utils";

export const passwordSchema = z
  .string()
  .regex(
    RegexPatterns.password,
    "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
  );

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "User ID is required")
    .regex(RegexPatterns.userId, "User ID must be letters followed by numbers"),
  password: passwordSchema,
});

export type LoginForm = z.infer<typeof loginSchema>;
