import { z } from "zod";
import { PASSWORD_POLICY_MESSAGE, RegexPatterns } from "@insurance-poc/utils";

export const passwordSchema = z.string().regex(RegexPatterns.password, PASSWORD_POLICY_MESSAGE);

export const loginSchema = z.object({
  username: z.string().trim().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginForm = z.infer<typeof loginSchema>;
