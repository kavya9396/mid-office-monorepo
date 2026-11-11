const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Parsed in two steps to keep each regular expression simple.
// 1. yyyy-mm-dd or yyyy/mm/dd; everything after the date is captured as the "rest".
const DATE_PATTERN = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})([\s\S]*)$/;
// 2. The rest: optionally "T" or a space and hh:mm[:ss[.fff]], optionally followed by a
//    time zone ("Z", "+05:30", "+0530") that is ignored.
const TIME_PATTERN =
  /^(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?\s*(?:Z|[+-]\d{2}(?::?\d{2})?)?$/i;

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  /** Undefined when the input has no time part. */
  time?: { hours: number; minutes: number; seconds: number };
};

const isValidParts = ({ year, month, day, time }: DateTimeParts): boolean => {
  if (month < 1 || month > 12 || day < 1) return false;
  if (day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return false;
  if (!time) return true;
  return time.hours <= 23 && time.minutes <= 59 && time.seconds <= 59;
};

const partsFromString = (value: string): DateTimeParts | null => {
  const dateMatch = DATE_PATTERN.exec(value.trim());
  const timeMatch = dateMatch ? TIME_PATTERN.exec(dateMatch[4]) : null;
  if (dateMatch && timeMatch) {
    const [, year, month, day] = dateMatch;
    const [, hours, minutes, seconds] = timeMatch;
    return {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      time:
        hours === undefined
          ? undefined
          : { hours: Number(hours), minutes: Number(minutes), seconds: Number(seconds ?? 0) },
    };
  }

  // Any other format the browser understands (e.g. "Aug 14, 2026 11:08 AM")
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : partsFromDate(parsed);
};

const partsFromDate = (date: Date): DateTimeParts | null =>
  Number.isNaN(date.getTime())
    ? null
    : {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        time: { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() },
      };

const pad2 = (value: number) => String(value).padStart(2, "0");

/**
 * Formats a date/time as "D Mon YYYY, hh:mm:ss am|pm".
 *
 * Accepts ISO strings (with "T" or a space, optional fraction and time zone), "yyyy/mm/dd" and
 * "yyyy-mm-dd" strings, other strings `new Date()` can parse, `Date` objects and epoch milliseconds.
 *
 * - Strings in the formats above are read literally: the date and time are shown as written and the
 *   time-zone offset is not applied.
 * - `Date` objects, epoch numbers and other string formats are shown in the local time zone.
 * - Input without a time part returns the date only (no invented "12:00:00 am").
 * - Empty or invalid values return "-".
 *
 * @example
 * formatDateTime("2026-08-14T11:08:00+05:30"); // "14 Aug 2026, 11:08:00 am"
 * formatDateTime("2026/08/14 16:05:09");       // "14 Aug 2026, 04:05:09 pm"
 * formatDateTime("2026-08-14");                // "14 Aug 2026"
 * formatDateTime("");                          // "-"
 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return "-";

  let parts: DateTimeParts | null;
  if (typeof value === "string") {
    parts = value.trim() === "" ? null : partsFromString(value);
  } else {
    parts = partsFromDate(typeof value === "number" ? new Date(value) : value);
  }

  if (!parts || !isValidParts(parts)) return "-";

  const date = `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
  if (!parts.time) return date;

  const { hours, minutes, seconds } = parts.time;
  const hour12 = hours % 12 || 12;
  const meridiem = hours < 12 ? "am" : "pm";
  return `${date}, ${pad2(hour12)}:${pad2(minutes)}:${pad2(seconds)} ${meridiem}`;
}

export default formatDateTime;
