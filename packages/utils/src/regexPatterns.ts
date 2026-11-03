export class RegexPatterns {
  static readonly alphanumeric = /^[A-Za-z\d]+$/;
  /** Date in DD/MM/YYYY form, capturing day, month and year. */
  static readonly dateDDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  /** 24-hour time in HH:MM form (00:00 to 23:59). */
  static readonly timeHHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
  /** Unsigned number with an optional decimal part. */
  static readonly numeric = /^\d+(\.\d+)?$/;
  /** Letters and spaces only (names). */
  static readonly alphabets = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  /** Assessment year range in the form "AY XX - AY XX" (two digits each, e.g. "AY 23 - AY 24"). */
  static readonly assessmentYear = /^AY \d{2} - AY \d{2}$/;
  /** Four-digit year (YYYY). */
  static readonly year = /^\d{4}$/;
  /** Permanent Account Number: 5 capital letters, 4 digits, 1 capital letter (e.g. ABCDE1234F). */
  static readonly pan = /^[A-Z]{5}\d{4}[A-Z]$/;
}
