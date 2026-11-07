import { RegexPatterns } from "./regexPatterns";

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character";

export function meetsPasswordPolicy(value: string): boolean {
  return RegexPatterns.password.test(value);
}
