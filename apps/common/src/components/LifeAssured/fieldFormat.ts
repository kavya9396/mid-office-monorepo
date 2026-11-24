import { z } from "zod";
import { RegexPatterns } from "@insurance-poc/utils";
import { formatMessage, requiredMessage, type FieldFormat } from "./editApplicant.messages";

const FORMAT_PATTERNS: Record<FieldFormat, RegExp> = {
  numeric: RegexPatterns.numeric,
  alphabets: RegexPatterns.alphabets,
  alphanumeric: RegexPatterns.alphanumeric,
  pan: RegexPatterns.pan,
  ifsc: RegexPatterns.ifsc,
};

/** Mandatory text field that must also match `format`; empty -> "is required", wrong format -> "should be ...". */
export const requiredFormat = (label: string, format: FieldFormat) =>
  z.string().trim().min(1, requiredMessage(label)).regex(FORMAT_PATTERNS[format], formatMessage(label, format));
