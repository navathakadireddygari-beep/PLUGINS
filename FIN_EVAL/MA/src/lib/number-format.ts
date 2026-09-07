/**
 * NumberFormattingService
 * ------------------------
 * Single source of truth for turning numbers into display strings and back.
 * Pure + framework-agnostic: no React, no currency knowledge.
 *
 * The display "scale" selects a magnitude UNIT (K / Million / Billion, see
 * config.ScaleId): the value is divided by the unit's divisor for display and a
 * suffix is appended (e.g. 1500 -> "1.5 K"). Grouping and the decimal separator
 * follow the selected regional NUMBER FORMAT (config.NumberFormatId), so the
 * SAME scaled magnitude renders as "1,234.5" (US), "1.234,5" (EU) or "1'234.5"
 * (CH). All of this is implemented by hand (not Intl) so it is deterministic
 * across machine locales.
 */

import {
  numberFormatMeta,
  scaleDecimals,
  scaleMeta,
  type NumberFormatId,
  type ScaleId,
} from "@/config/formats";

/** The magnitude divisor for a given display unit (K -> 1000, ...). */
export const scaleDivisor = (scale: ScaleId): number =>
  scaleMeta(scale).divisor;

/** A value that could not be parsed to a finite number. */
const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

/**
 * Round to a fixed number of decimals without floating point drift
 * (e.g. 1.005 -> 1.01). Defaults to 2 decimals.
 */
export const round = (n: number, decimals = 2): number => {
  if (!isFiniteNumber(n)) return NaN;
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/**
 * Group an all-digits integer string using the given regional format's
 * separator and grouping scheme:
 *   - "thousand": Western groups of three from the right (1,234,567)
 *   - "indian":   the last group is three, the rest are twos (12,34,567)
 * The separator is a plain replacement string, so ",", ".", " " and "'" are all
 * inserted verbatim.
 */
export const groupIntegerDigits = (
  intStr: string,
  format: NumberFormatId = "us",
): string => {
  const { groupSeparator, grouping } = numberFormatMeta(format);
  if (grouping === "indian") {
    if (intStr.length <= 3) return intStr;
    const last3 = intStr.slice(-3);
    const head = intStr
      .slice(0, -3)
      .replace(/\B(?=(\d{2})+(?!\d))/g, groupSeparator);
    return `${head}${groupSeparator}${last3}`;
  }
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
};

/**
 * Format a finite number for display in the selected unit and regional number
 * format: divide by the unit divisor, group the integer digits, keep the
 * scale's decimal places (K = 0, M = 1, B = 2 - see `scaleDecimals`) using the
 * format's decimal separator, and render negatives in accounting parentheses
 * e.g. (1.5).
 *
 * The unit suffix (K / Million / Billion) is intentionally NOT appended: the
 * active unit is chosen by the toggle at the top of the page, so repeating it in
 * every cell is noise. Pass `withSuffix = true` if a caller (e.g. a heading)
 * ever needs the suffix. Returns "" for null/undefined/NaN so callers never
 * render "NaN".
 */
export const formatNumber = (
  n: number | null | undefined,
  scale: ScaleId,
  format: NumberFormatId = "us",
  fractionDigits = scaleDecimals(scale),
  withSuffix = false,
): string => {
  if (n === null || n === undefined || !isFiniteNumber(n)) return "";
  const meta = scaleMeta(scale);
  const { decimalSeparator } = numberFormatMeta(format);
  const scaled = n / meta.divisor;
  const negative = scaled < 0;
  // Fixed (not maximum) decimals, matching the reference's `groupNumber`:
  // at M scale 1000 renders "1.0", not "1". Trailing zeros are significant
  // here because every column must line up on the decimal point.
  const fixed = Math.abs(scaled).toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split(".");
  const grouped = groupIntegerDigits(intPart, format);
  const num = fracPart ? `${grouped}${decimalSeparator}${fracPart}` : grouped;
  const out = withSuffix && meta.suffix ? `${num} ${meta.suffix}` : num;
  return negative ? `(${out})` : out;
};

/**
 * Decimal places shown on a PERCENTAGE cell.
 *
 * Zero — a margin reads as "43%", not "43.21%". The stored value keeps every
 * digit the server sent (the engine computes percentages to 4dp); only the
 * rendering rounds, exactly as the money columns work.
 */
export const PERCENT_DECIMALS = 0;

/**
 * Format a percentage for a grid cell: the number, a "%" suffix, and negatives
 * in accounting parentheses — "43%", "(29%)".
 *
 * Percentages bypass the money pipeline entirely: 25% is 25% whatever currency
 * or scale the screen is showing, so there is no FX multiplier and no unit
 * divisor here. Only the regional grouping and decimal separator apply, so a
 * three-digit percentage still groups the way the rest of the grid does.
 *
 * Returns "" for null/undefined/NaN so callers never render "NaN%".
 */
export const formatPercent = (
  n: number | null | undefined,
  format: NumberFormatId = "us",
  fractionDigits = PERCENT_DECIMALS,
): string => {
  if (n === null || n === undefined || !isFiniteNumber(n)) return "";
  const { decimalSeparator } = numberFormatMeta(format);
  const negative = n < 0;
  const fixed = Math.abs(n).toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split(".");
  const grouped = groupIntegerDigits(intPart, format);
  const body = fracPart
    ? `${grouped}${decimalSeparator}${fracPart}%`
    : `${grouped}%`;
  return negative ? `(${body})` : body;
};

export interface ParsedInput {
  /** Numeric value (already sign-applied), or null when not numeric. */
  value: number | null;
  /** True when the input was blank / a dash placeholder. */
  isBlank: boolean;
  /** Passthrough content that should be kept verbatim (e.g. percentages). */
  passthrough?: string;
}

/** Upper bound enforced on any percentage value. */
export const MAX_PERCENT = 100;

/**
 * A percentage cell is kept as passthrough text, but its magnitude must never
 * exceed 100. Re-emit the value clamped to at most MAX_PERCENT, preserving the
 * "%" suffix; non-numeric percentage text is returned unchanged.
 */
const clampPercent = (raw: string): string => {
  const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
  if (!isFiniteNumber(n)) return raw;
  return n > MAX_PERCENT ? `${MAX_PERCENT}%` : raw;
};

/**
 * Parse a CANONICAL numeric string (a "." decimal, optional "," grouping) into
 * a number. This is for values the app itself produced — stored base values and
 * default-formatted seeds — NOT for arbitrary user input in a foreign format
 * (use `parseDisplayInput` for that). Tolerates currency symbols, whitespace and
 * accounting parentheses; percentages are flagged as passthrough.
 */
export const parseNumericInput = (raw: unknown): ParsedInput => {
  if (raw === null || raw === undefined) return { value: null, isBlank: true };
  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "—")
    return { value: null, isBlank: true };
  if (trimmed.includes("%"))
    return { value: null, isBlank: false, passthrough: clampPercent(trimmed) };

  let t = trimmed.replace(/[,\s ]/g, "");
  let negative = false;
  if (t.startsWith("(") && t.endsWith(")")) {
    negative = true;
    t = t.slice(1, -1);
  }
  // strip currency symbols / stray characters, keep digits, dot and sign
  t = t.replace(/[^0-9.-]/g, "");
  if (t === "") return { value: null, isBlank: true };
  const num = parseFloat(t);
  if (!isFiniteNumber(num))
    return { value: null, isBlank: false, passthrough: trimmed };
  return { value: negative ? -num : num, isBlank: false };
};

/**
 * Parse a user-typed / pasted display string that follows the selected regional
 * NUMBER FORMAT. The group separator is removed and the format's decimal
 * separator is normalised to "." before parsing, so "1.234.567,89" (EU) and
 * "1'234'567.89" (CH) both yield 1234567.89. Currency symbols, unit suffixes
 * (K / Million), whitespace and accounting parentheses are tolerated;
 * percentages are flagged as passthrough.
 */
export const parseDisplayInput = (
  raw: unknown,
  format: NumberFormatId = "us",
): ParsedInput => {
  if (raw === null || raw === undefined) return { value: null, isBlank: true };
  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "—")
    return { value: null, isBlank: true };
  if (trimmed.includes("%"))
    return { value: null, isBlank: false, passthrough: clampPercent(trimmed) };

  const { groupSeparator, decimalSeparator } = numberFormatMeta(format);
  let t = trimmed;
  let negative = false;
  if (t.startsWith("(") && t.endsWith(")")) {
    negative = true;
    t = t.slice(1, -1);
  }
  // Drop all whitespace (covers the space group separator) first.
  t = t.replace(/\s/g, "");
  // Remove the group separator, then normalise the decimal separator to ".".
  if (groupSeparator && groupSeparator !== " ")
    t = t.split(groupSeparator).join("");
  if (decimalSeparator !== ".") t = t.split(decimalSeparator).join(".");
  // strip currency symbols / unit suffixes / stray characters
  t = t.replace(/[^0-9.-]/g, "");
  if (t === "") return { value: null, isBlank: true };
  const num = parseFloat(t);
  if (!isFiniteNumber(num))
    return { value: null, isBlank: false, passthrough: trimmed };
  return { value: negative ? -num : num, isBlank: false };
};
