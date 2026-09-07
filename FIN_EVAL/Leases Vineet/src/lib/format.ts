/**
 * Shared scale / number / date formatting for the Financial Evaluation table
 * and KPI cards. Centralized here so the pivot table and the KPI panel can
 * never drift out of sync on how a value is scaled or formatted.
 */

/* ─────────────────────────── Scale (K / M / B) ───────────────────────── */
// API year values arrive already expressed in thousands (K), so K is the
// baseline (no further division). M divides once more by 1,000, B by
// 1,000,000, relative to that K baseline.
export type ScaleKey = "K" | "M" | "B";

export const SCALES: { key: ScaleKey; label: string; divisor: number }[] = [
  { key: "K", label: "K", divisor: 1 },
  { key: "M", label: "M", divisor: 1000 },
  { key: "B", label: "B", divisor: 1000000 },
];

export const DEFAULT_SCALE: ScaleKey = "K";

export function scaleDivisorFor(scale: ScaleKey): number {
  return SCALES.find((s) => s.key === scale)?.divisor ?? 1;
}

/**
 * Decimal places shown for a scaled value:
 *   K → 0 decimals, M → 1 decimal, B → 2 decimals.
 */
export function scaleDecimalsFor(scale: ScaleKey): number {
  switch (scale) {
    case "M": return 1;
    case "B": return 2;
    case "K":
    default:  return 0;
  }
}

/* ─────────────────────────── Number format ───────────────────────────── */
export type NumberFormatKey = "US_UK" | "EU_DOT" | "FR_SPACE" | "INDIA" | "CH_APOS";

export const NUMBER_FORMATS: { key: NumberFormatKey; label: string }[] = [
  { key: "US_UK",    label: "1,234,567.89" },
  { key: "EU_DOT",   label: "1.234.567,89" },
  { key: "FR_SPACE", label: "1 234 567,89" },
  { key: "INDIA",    label: "12,34,567.89" },
  { key: "CH_APOS",  label: "1'234'567.89" },
];

export const DEFAULT_NUMBER_FORMAT: NumberFormatKey = "US_UK";

// Groups the integer-part digit string from the right: the rightmost
// `firstGroupSize` digits form one group, every group before that is
// `otherGroupSize` digits (India uses 3 then 2s — the lakh/crore pattern).
function groupDigits(digits: string, firstGroupSize: number, otherGroupSize: number, sep: string): string {
  if (digits.length <= firstGroupSize) return digits;
  const tail = digits.slice(digits.length - firstGroupSize);
  let rest = digits.slice(0, digits.length - firstGroupSize);
  const groups: string[] = [];
  while (rest.length > otherGroupSize) {
    groups.unshift(rest.slice(rest.length - otherGroupSize));
    rest = rest.slice(0, rest.length - otherGroupSize);
  }
  if (rest) groups.unshift(rest);
  return [...groups, tail].join(sep);
}

/** Formats a non-negative or negative number's magnitude (no sign, no currency symbol). */
export function formatNumber(value: number, formatKey: NumberFormatKey, maximumFractionDigits = 0): string {
  const fixed = Math.abs(value).toFixed(maximumFractionDigits);
  const [intPart, decPart] = fixed.split(".");
  let grouped: string;
  let decimalSep: string;
  switch (formatKey) {
    case "EU_DOT":   grouped = groupDigits(intPart, 3, 3, "."); decimalSep = ","; break;
    case "FR_SPACE": grouped = groupDigits(intPart, 3, 3, " "); decimalSep = ","; break;
    case "INDIA":    grouped = groupDigits(intPart, 3, 2, ","); decimalSep = "."; break;
    case "CH_APOS":  grouped = groupDigits(intPart, 3, 3, "'"); decimalSep = "."; break;
    case "US_UK":
    default:         grouped = groupDigits(intPart, 3, 3, ","); decimalSep = "."; break;
  }
  return decPart ? `${grouped}${decimalSep}${decPart}` : grouped;
}

/* ─────────────────────────── Date format ─────────────────────────────── */
export type DateFormatKey = "DD_MM_YYYY" | "DD_MON_YYYY" | "YYYY_MM_DD" | "MM_DD_YYYY" | "SLASH_DD_MM_YYYY";

export const DATE_FORMATS: { key: DateFormatKey; label: string }[] = [
  { key: "DD_MM_YYYY",       label: "dd-mm-yyyy" },
  { key: "DD_MON_YYYY",      label: "dd-mon-yyyy" },
  { key: "YYYY_MM_DD",       label: "yyyy-mm-dd" },
  { key: "MM_DD_YYYY",       label: "mm/dd/yyyy" },
  { key: "SLASH_DD_MM_YYYY", label: "dd/mm/yyyy" },
];

export const DEFAULT_DATE_FORMAT: DateFormatKey = "DD_MM_YYYY";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDateParts(raw: string): { y: number; m: number; d: number } | null {
  // Prefer a direct yyyy-mm-dd prefix match — avoids the UTC-midnight /
  // local-timezone rollback that `new Date("yyyy-mm-dd")` can cause.
  const m1 = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return { y: Number(m1[1]), m: Number(m1[2]), d: Number(m1[3]) };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

export function formatDateValue(raw: string | null | undefined, formatKey: DateFormatKey): string {
  if (!raw) return "—";
  const parts = parseDateParts(raw);
  if (!parts) return "—";
  const dd   = String(parts.d).padStart(2, "0");
  const mm   = String(parts.m).padStart(2, "0");
  const yyyy = String(parts.y);
  const mon  = MONTH_ABBR[parts.m - 1] ?? "";
  switch (formatKey) {
    case "DD_MON_YYYY":      return `${dd}-${mon}-${yyyy}`;
    case "YYYY_MM_DD":       return `${yyyy}-${mm}-${dd}`;
    case "MM_DD_YYYY":       return `${mm}/${dd}/${yyyy}`;
    case "SLASH_DD_MM_YYYY": return `${dd}/${mm}/${yyyy}`;
    case "DD_MM_YYYY":
    default:                 return `${dd}-${mm}-${yyyy}`;
  }
}

/**
 * Return the numeric display value after applying FX multiplier and scale divisor.
 * - `raw` is the stored USD number (can be 0).
 * - `fxMultiplier` converts USD -> display currency (usd_fbr from backend).
 * - `scale` divides the value for K/M/B display (API values are K baseline).
 */
export function scaledValue(raw: number | null | undefined, fxMultiplier: number, scale: ScaleKey): number {
  if (raw == null) return NaN;
  return (raw * fxMultiplier) / scaleDivisorFor(scale);
}

/**
 * Format a numeric value after scaling and FX conversion.
 * - `includeScaleSuffix` appends the `K|M|B` suffix when true.
 * - `maximumFractionDigits` if provided forces the fraction digits; otherwise uses 0 or 1 heuristics.
 */
export function formatScaledValue(
  raw: number | null | undefined,
  formatKey: NumberFormatKey,
  scale: ScaleKey,
  fxMultiplier: number,
  maximumFractionDigits?: number,
  includeScaleSuffix = false,
  useParenthesesForNegative = true,
): string {
  if (raw == null) return "—";
  const v = scaledValue(raw, fxMultiplier, scale);
  if (Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  // Default decimals follow the selected scale (K = 0, M = 1, B = 2) so the
  // table, the KPI cards and the Net Summary cards can never disagree.
  const decimals = typeof maximumFractionDigits === "number" ? maximumFractionDigits : scaleDecimalsFor(scale);
  const formatted = formatNumber(abs, formatKey, decimals);
  const withSuffix = includeScaleSuffix ? `${formatted}${scale}` : formatted;
  return v < 0 && useParenthesesForNegative ? `(${withSuffix})` : withSuffix;
}

/**
 * Convenience: format including a currency symbol (for KPI cards).
 */
export function formatCurrencyValue(
  raw: number | null | undefined,
  symbol: string,
  formatKey: NumberFormatKey,
  scale: ScaleKey,
  fxMultiplier: number,
  maximumFractionDigits?: number,
  includeScaleSuffix = true,
  useParenthesesForNegative = true,
): string {
  const body = formatScaledValue(raw, formatKey, scale, fxMultiplier, maximumFractionDigits, includeScaleSuffix, useParenthesesForNegative);
  if (body === "—") return body;
  return `${symbol}${body}`;
}
