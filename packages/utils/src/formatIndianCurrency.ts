const indianNumberFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formats a number or numeric string as rupees with Indian digit grouping.
 * Empty, invalid, or non-finite values return "-".
 * Decimal amounts are rounded to at most two decimal places.
 *
 * @example
 * formatIndianCurrency(50000);    // "₹ 50,000"
 * formatIndianCurrency("50000");  // "₹ 50,000"
 * formatIndianCurrency(1500000);  // "₹ 15,00,000"
 * formatIndianCurrency(1234.5);   // "₹ 1,234.5"
 */
export function formatIndianCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  let amount: number;

  if (typeof value === "string") {
    const trimmed = value.trim();

    // Accept decimal numeric strings; reject partial values such as "500abc".
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return "-";

    amount = Number(trimmed);
  } else {
    amount = value;
  }

  if (!Number.isFinite(amount)) return "-";

  return `₹ ${indianNumberFormatter.format(amount)}`;
}

export default formatIndianCurrency;
