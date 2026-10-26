import { z } from "zod";
import { RegexPatterns } from "@insurance-poc/utils";
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "User ID is required")
    .regex(
      RegexPatterns.alphanumeric,
      "User ID can only contain letters and numbers",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      RegexPatterns.alphanumeric,
      "Password must contain letters and numbers only",
    ),
});

export type LoginForm = z.infer<typeof loginSchema>;
