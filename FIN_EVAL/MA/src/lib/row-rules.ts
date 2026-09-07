/**
 * Row classification rules, ported from the reference project
 * (Prod Dev → src/components/Table.tsx).
 *
 * Some rows hold percentages rather than money. They must NOT be converted by
 * the FX rate or divided by the display scale — 25% is 25% whether the screen
 * is showing USD thousands or EUR billions — and a cross-year total of a
 * percentage is meaningless, so those rows render "—" instead.
 *
 * Matching is deliberately loose: the API may return `line_identifier` as null,
 * so the row's type and its display name are checked too, and a custom row
 * whose name simply contains "%" counts as a percentage row.
 */

/** Normalise an identifier for comparison: upper-case, alphanumerics only. */
const tok = (s: string | null | undefined): string =>
  (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** The identifying strings a row can be matched on. */
export interface RowIdentity {
  lineIdentifier?: string | null;
  lineType?: string | null;
  name?: string | null;
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

/** Tax Rate % — exempt from currency AND scale conversion, and from totals. */
const TAX_RATE_IDS: ReadonlySet<string> = new Set([
  "TAXRATE",
  "TAXRATEPCT",
  "TAXRATEPERCENT",
]);

/**
 * Any percentage row. These are exempt from FX and scale conversion — 58.33%
 * is 58.33% whether the screen shows USD thousands or CAD billions — and they
 * drive the 0-100 / 2-decimal input rules.
 *
 * The M&A template's percentage `line_type`s are all listed here. Without them
 * a margin was run through the money formatter, so 58.3333 rendered as "58" at
 * K scale and "0.1" at M scale.
 */
const PERCENT_IDS: ReadonlySet<string> = new Set([
  ...TAX_RATE_IDS,
  "EBITMARGIN",
  "EBITMARGINPCT",
  "EBITMARGINPERCENT",
  "EBITGROWTHPCT",
  "EBITDAMARGINPCT",
  "EBITDAGROWTHPCT",
  "STANDALONEEBITMARGINPCT",
  "POSTTAXRETURN",
  "POSTTAXRETURNPCT",
  "POSTTAXRETURNPERCENT",
  "GROSSMARGIN",
  "GROSSMARGINPCT",
  "GROSSMARGINPERCENT",
]);

/** A row whose cross-year total is meaningless. */
export const isNoTotalRow = (row: RowIdentity): boolean =>
  matchesAny(row, NO_TOTAL_IDS);

/** A pure percentage exempt from all currency and scale conversion. */
export const isTaxRateRow = (row: RowIdentity): boolean =>
  matchesAny(row, TAX_RATE_IDS);

/**
 * A custom row can declare itself a percentage by putting "%" at the START or
 * END of its name ("% EBIT Margin", "Post Tax Return %") — that is how the unit
 * is written on a label.
 *
 * A "%" in the MIDDLE is prose, not a unit: "NPV @ 23% Discount Rate" is an
 * amount of money. Matching it loosely made that NPV component skip currency
 * and scale formatting entirely.
 */
const nameLooksLikePercent = (name: string | null | undefined): boolean => {
  const t = (name ?? "").trim();
  return t.startsWith("%") || t.endsWith("%");
};

/** Any percentage row, including a custom one whose name carries a "%". */
export const isPercentRow = (row: RowIdentity): boolean =>
  matchesAny(row, PERCENT_IDS) || nameLooksLikePercent(row.name);

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

/** Safety net for paste: force into [0, 100] at 2 decimal places. */
export const clampPercent = (n: number): number =>
  Math.min(100, Math.max(0, Math.round(n * 100) / 100));
