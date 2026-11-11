/**
 * Row classification rules, ported from the reference project
 * (Prod Dev → src/components/Table.tsx).
 *
 * Some rows hold percentages rather than money. They must NOT be converted by
 * the FX rate or divided by the display scale — 25% is 25% whether the screen
 * is showing USD thousands or EUR billions — and a cross-year total of a
 * percentage is meaningless, so those rows render "—" instead.
 *
 * Whether a row is a percentage comes from the backend alone: the line's
 * `is_percentage` flag ("Y"). Its name and type are no longer consulted for
 * that. The other rules (Tax Rate, no-total) still match on the row's
 * identifier, type or name, since the API may return `line_identifier` as null.
 */

/** Normalise an identifier for comparison: upper-case, alphanumerics only. */
const tok = (s: string | null | undefined): string =>
  (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** The identifying strings a row can be matched on. */
export interface RowIdentity {
  lineIdentifier?: string | null;
  lineType?: string | null;
  name?: string | null;
  /** The line's `is_percentage` flag is "Y". */
  isPercentage?: boolean;
}

const matchesAny = (row: RowIdentity, ids: ReadonlySet<string>): boolean =>
  ids.has(tok(row.lineIdentifier)) ||
  ids.has(tok(row.lineType)) ||
  ids.has(tok(row.name));

/**
 * Rows with no meaningful cross-year total — shown as "—". Every percentage
 * qualifies: summing or compounding a margin across years is nonsense.
 */
const NO_TOTAL_IDS: ReadonlySet<string> = new Set([
  "TAXRATE",
  "TAXRATEPCT",
  "TAXRATEPERCENT",
  "POSTTAXRETURN",
  "POSTTAXRETURNPCT",
  "POSTTAXRETURNPERCENT",
  "EBITMARGINPCT",
  "EBITGROWTHPCT",
  "EBITDAMARGINPCT",
  "EBITDAGROWTHPCT",
  "STANDALONEEBITMARGINPCT",
]);

/** Tax Rate % — clamped on entry. */
const TAX_RATE_IDS: ReadonlySet<string> = new Set([
  "TAXRATE",
  "TAXRATEPCT",
  "TAXRATEPERCENT",
]);

/** A row whose cross-year total is meaningless. */
export const isNoTotalRow = (row: RowIdentity): boolean =>
  matchesAny(row, NO_TOTAL_IDS);

/** The Tax Rate row: its entry is clamped. */
export const isTaxRateRow = (row: RowIdentity): boolean =>
  matchesAny(row, TAX_RATE_IDS);

/**
 * A percentage row: the backend's `is_percentage` is "Y". These are exempt
 * from FX and K/M/B scale — 58.33% is 58.33% whether the screen shows USD
 * thousands or CAD billions. "N" or null is a money row and is scaled, whatever
 * its name says.
 */
export const isPercentRow = (row: RowIdentity): boolean =>
  row.isPercentage === true;

/** A NON_FINANCIAL row (e.g. a custom count/metric) — bypasses FX and scale, same as a percentage row. */
export const isNonFinancialRow = (row: RowIdentity): boolean =>
  tok(row.lineIdentifier) === "NONFINANCIAL";

/**
 * Should this keystroke be accepted in a percentage cell? Rejects letters,
 * negatives, values above 100 and more than 2 decimal places, while still
 * allowing the field to be cleared and intermediate text like "12." or ".5".
 */
export const isValidPercentInput = (s: string): boolean => {
  if (s === "") return true;
  if (!/^\d{0,3}(\.\d{0,2})?$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 100;
};

/**
 * Safety net for a typed / pasted percentage: magnitude at most 100, 2 decimal
 * places. Negatives are kept — margins and growth rates go below zero (the
 * grid renders them as "(29%)") — so "(5)" or "-5" stays -5 rather than 0.
 * Only applied to a value the user actually changed: an untouched cell is
 * never re-committed (see SpreadsheetCell), so stored figures outside this
 * range (a server-computed 140%) are left exactly as they are.
 */
export const clampPercent = (n: number): number =>
  Math.min(100, Math.max(-100, Math.round(n * 100) / 100));
