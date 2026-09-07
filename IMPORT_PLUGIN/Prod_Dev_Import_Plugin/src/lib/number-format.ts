/**
 * Number display formats for the pivot table + KPI cards.
 * Only the grouping/decimal separators change — the underlying value is
 * unaffected; this is a display-layer concern only.
 */
export type NumberFormatId = "us" | "eu" | "fr" | "in" | "ch";

export const NUMBER_FORMATS: { id: NumberFormatId; label: string; sample: string }[] = [
  { id: "us", label: "US / UK",  sample: "1,234,567.89" },
  { id: "eu", label: "European", sample: "1.234.567,89" },
  { id: "fr", label: "French",   sample: "1 234 567,89" },
  { id: "in", label: "Indian",   sample: "12,34,567.89" },
  { id: "ch", label: "Swiss",    sample: "1'234'567.89" },
];

const SEPARATORS: Record<NumberFormatId, { group: string; decimal: string }> = {
  us: { group: ",", decimal: "." },
  eu: { group: ".", decimal: "," },
  fr: { group: " ", decimal: "," },
  in: { group: ",", decimal: "." },
  ch: { group: "'", decimal: "." },
};

// Standard 3-digit grouping: 1234567 -> 1,234,567
const groupStandard = (intDigits: string, sep: string): string =>
  intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

// Indian grouping: last 3 digits, then groups of 2: 1234567 -> 12,34,567
const groupIndian = (intDigits: string, sep: string): string => {
  if (intDigits.length <= 3) return intDigits;
  const last3 = intDigits.slice(-3);
  const rest  = intDigits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, sep);
  return `${rest}${sep}${last3}`;
};

const groupIntPart = (intDigits: string, styleId: NumberFormatId, sep: string): string =>
  styleId === "in" ? groupIndian(intDigits, sep) : groupStandard(intDigits, sep);

/** Fixed-decimal grouped format, e.g. table cells: always `decimals` digits. */
export function formatNumberByStyle(n: number, styleId: NumberFormatId, decimals = 2): string {
  const { group, decimal } = SEPARATORS[styleId];
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const groupedInt = groupIntPart(intPart, styleId, group);
  return decPart ? `${groupedInt}${decimal}${decPart}` : groupedInt;
}

/** Grouped format with trailing zero decimals trimmed, e.g. KPI cards ("20,000K" not "20,000.000K"). */
export function formatGroupedTrimmed(n: number, styleId: NumberFormatId, maxDecimals = 3): string {
  const { group, decimal } = SEPARATORS[styleId];
  const trimmed = parseFloat(Math.abs(n).toFixed(maxDecimals));
  const [intPart, decPart] = trimmed.toString().split(".");
  const groupedInt = groupIntPart(intPart, styleId, group);
  return decPart ? `${groupedInt}${decimal}${decPart}` : groupedInt;
}

// Decimal places shown depend on the active K/M/B scale toggle: K = whole
// numbers, M = 1 decimal, B = 2 decimals. `scale` is the raw toggle value
// used across Table.tsx/KpiPanel.tsx (1000 = K, 10000 = M, 100000 = B).
export function decimalsForScale(scale: number): number {
  if (scale === 100000) return 2;
  if (scale === 10000) return 1;
  return 0;
}
