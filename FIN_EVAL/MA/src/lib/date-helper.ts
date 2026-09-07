/**
 * dateFormat
 * ----------
 * Single source of truth for turning date values into display strings. Pure +
 * framework-agnostic (no React). Every header, table, grid cell, preview and
 * card formats dates through this module so a change to the active format is
 * reflected everywhere, consistently. Underlying Date values are never mutated;
 * only their rendering changes.
 */

export type DateFormatId =
  | "DD-MM-YYYY"
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "DD-MON-YYYY"
  | "YYYY-MM-DD"
  | "MM-DD-YYYY";

export interface DateFormatMeta {
  id: DateFormatId;
  label: string;
  /** Countries/regions that use this convention (for the selector hint). */
  regions: string;
}

// Order and wording mirror the reference project's DATE_FORMATS.
export const DATE_FORMATS: DateFormatMeta[] = [
  { id: "DD-MM-YYYY", label: "dd-mm-yyyy", regions: "UK / India" },
  { id: "DD/MM/YYYY", label: "dd/mm/yyyy", regions: "UK / India" },
  { id: "MM/DD/YYYY", label: "mm/dd/yyyy", regions: "US" },
  { id: "DD-MON-YYYY", label: "dd-mon-yyyy", regions: "02-Jul-2026" },
  { id: "YYYY-MM-DD", label: "yyyy-mm-dd", regions: "ISO" },
];

export const DEFAULT_DATE_FORMAT: DateFormatId = "DD-MM-YYYY";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const pad = (n: number): string => String(n).padStart(2, "0");

/** Coerce accepted inputs into a Date, or null when not a valid date. */
const toDate = (
  value: Date | string | number | null | undefined,
): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Format a date value using the selected display format. Non-date content is
 * returned verbatim so the caller never renders "Invalid Date".
 */
export const formatDate = (
  value: Date | string | number | null | undefined,
  format: DateFormatId,
): string => {
  const d = toDate(value);
  if (!d) return value == null ? "" : String(value);
  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();
  switch (format) {
    case "DD-MM-YYYY":
      return `${pad(day)}-${pad(monthIndex + 1)}-${year}`;
    case "DD/MM/YYYY":
      return `${pad(day)}/${pad(monthIndex + 1)}/${year}`;
    case "MM/DD/YYYY":
      return `${pad(monthIndex + 1)}/${pad(day)}/${year}`;
    case "MM-DD-YYYY":
      return `${pad(monthIndex + 1)}-${pad(day)}-${year}`;
    case "YYYY-MM-DD":
      return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
    case "DD-MON-YYYY":
      return `${pad(day)}-${MONTHS_SHORT[monthIndex]}-${year}`;
    default:
      return `${pad(day)}-${pad(monthIndex + 1)}-${year}`;
  }
};

/* ─────────────────── Persisted display preference ─────────────────── */
/**
 * The active date format survives a reload, using the same localStorage key as
 * the reference project so both widgets on a page agree.
 */
const LS_DATE_FORMAT = "fin_eval_date_format";

export const loadDateFormat = (): DateFormatId => {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? (localStorage.getItem(LS_DATE_FORMAT) as DateFormatId | null)
        : null;
    return raw && DATE_FORMATS.some((f) => f.id === raw)
      ? raw
      : DEFAULT_DATE_FORMAT;
  } catch {
    return DEFAULT_DATE_FORMAT;
  }
};

export const saveDateFormat = (value: DateFormatId): void => {
  try {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(LS_DATE_FORMAT, value);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
};
