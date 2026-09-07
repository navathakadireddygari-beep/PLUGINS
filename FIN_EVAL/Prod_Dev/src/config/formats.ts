/**
 * Display-format helpers for scale, number grouping, and date rendering.
 *
 * IMPORTANT: everything here is DISPLAY-ONLY. The values stored in state and
 * sent to the API are never changed by these helpers — they only affect how
 * numbers and dates are shown to the end-user.
 */

/* ─────────────────────────────── Scale ─────────────────────────────── */
// API year values arrive already in thousands (K). So K is the base and is
// shown as-is; M / B divide down from there.
export type ScaleId = "K" | "M" | "B";

export const SCALES: { label: ScaleId; value: number; divisor: number }[] = [
  { label: "K", value: 1,       divisor: 1        },  // base — no division
  { label: "M", value: 1000,    divisor: 1000     },  // ÷ 1,000
  { label: "B", value: 1000000, divisor: 1000000  },  // ÷ 1,000,000
];

export const scaleDivisorOf = (scaleValue: number): number =>
  SCALES.find((s) => s.value === scaleValue)?.divisor ?? 1;

export const scaleLabelOf = (scaleValue: number): ScaleId =>
  SCALES.find((s) => s.value === scaleValue)?.label ?? "K";

// Decimal places shown for scaled currency values: K = 0, M = 1, B = 2.
export const scaleDecimalsOf = (scaleValue: number): number => {
  switch (scaleLabelOf(scaleValue)) {
    case "K": return 0;
    case "M": return 1;
    case "B": return 2;
  }
};

/* ─────────────────────────── Number formats ────────────────────────── */
export type NumberFormatId = "us" | "eu" | "fr" | "in" | "ch";

export const NUMBER_FORMATS: { id: NumberFormatId; label: string; example: string }[] = [
  { id: "us", label: "1,234,567.89",  example: "US / UK"  },
  { id: "eu", label: "1.234.567,89",  example: "European" },
  { id: "fr", label: "1 234 567,89",  example: "French"   },
  { id: "in", label: "12,34,567.89",  example: "Indian"   },
  { id: "ch", label: "1'234'567.89",  example: "Swiss"    },
];

const SEPARATORS: Record<NumberFormatId, { group: string; decimal: string }> = {
  us: { group: ",",  decimal: "." },
  eu: { group: ".",  decimal: "," },
  fr: { group: " ",  decimal: "," },
  in: { group: ",",  decimal: "." },
  ch: { group: "'",  decimal: "." },
};

// Standard 3-digit grouping (1,234,567).
const groupThousands = (intStr: string, sep: string): string =>
  intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

// Indian grouping: last 3 digits, then groups of 2 (12,34,567).
const groupIndian = (intStr: string, sep: string): string => {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest  = intStr.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, sep) + sep + last3;
};

/**
 * Format a non-negative number's magnitude with the selected grouping/decimal
 * separators. Sign / parentheses are left to the caller (matches existing
 * rawFmt / displayFmt behaviour).
 */
export const groupNumber = (
  absValue: number,
  fmt: NumberFormatId,
  decimals = 2,
): string => {
  const sep = SEPARATORS[fmt];
  const fixed = Math.abs(absValue).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const grouped = fmt === "in"
    ? groupIndian(intPart, sep.group)
    : groupThousands(intPart, sep.group);
  return decPart != null ? `${grouped}${sep.decimal}${decPart}` : grouped;
};

/* ──────────────────────────── Date formats ─────────────────────────── */
export type DateFormatId = "dd-mm-yyyy" | "dd/mm/yyyy" | "mm/dd/yyyy" | "dd-mon-yyyy" | "yyyy-mm-dd";

export const DATE_FORMATS: { id: DateFormatId; label: string; example: string }[] = [
  { id: "dd-mm-yyyy",  label: "dd-mm-yyyy",  example: "UK / India" },
  { id: "dd/mm/yyyy",  label: "dd/mm/yyyy",  example: "UK / India" },
  { id: "mm/dd/yyyy",  label: "mm/dd/yyyy",  example: "US"         },
  { id: "dd-mon-yyyy", label: "dd-mon-yyyy", example: "02-Jul-2026" },
  { id: "yyyy-mm-dd",  label: "yyyy-mm-dd",  example: "ISO"        },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Render an ISO date string ("yyyy-mm-dd", the value stored/sent to the API)
 * in the selected display format. Returns "" for empty and echoes the raw
 * string if it isn't a parseable ISO date.
 */
export const formatDate = (iso: string | null | undefined, fmt: DateFormatId): string => {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, yyyy, mm, dd] = m;
  const mon = MONTHS_SHORT[Number(mm) - 1] ?? mm;
  switch (fmt) {
    case "dd-mm-yyyy":  return `${dd}-${mm}-${yyyy}`;
    case "dd/mm/yyyy":  return `${dd}/${mm}/${yyyy}`;
    case "mm/dd/yyyy":  return `${mm}/${dd}/${yyyy}`;
    case "dd-mon-yyyy": return `${dd}-${mon}-${yyyy}`;
    case "yyyy-mm-dd":  return `${yyyy}-${mm}-${dd}`;
    default:            return iso;
  }
};

/* ─────────────────── Persisted display preferences ─────────────────── */
const LS_SCALE  = "fin_eval_scale";
const LS_NUMFMT = "fin_eval_number_format";
const LS_DATEFMT = "fin_eval_date_format";

const readLS = (key: string): string | null => {
  try { return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null; }
  catch { return null; }
};
const writeLS = (key: string, value: string): void => {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(key, value); }
  catch { /* ignore quota / privacy-mode errors */ }
};

export const loadScale = (): number => {
  const raw = Number(readLS(LS_SCALE));
  return SCALES.some((s) => s.value === raw) ? raw : 1; // default K
};
export const saveScale = (v: number): void => writeLS(LS_SCALE, String(v));

export const loadNumberFormat = (): NumberFormatId => {
  const raw = readLS(LS_NUMFMT) as NumberFormatId | null;
  return raw && NUMBER_FORMATS.some((f) => f.id === raw) ? raw : "us";
};
export const saveNumberFormat = (v: NumberFormatId): void => writeLS(LS_NUMFMT, v);

export const loadDateFormat = (): DateFormatId => {
  const raw = readLS(LS_DATEFMT) as DateFormatId | null;
  return raw && DATE_FORMATS.some((f) => f.id === raw) ? raw : "dd-mm-yyyy";
};
export const saveDateFormat = (v: DateFormatId): void => writeLS(LS_DATEFMT, v);
