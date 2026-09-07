/**
 * Percentage cells carry the "%" — the unit belongs in the cell, not only in
 * the row label.
 *
 * Rows whose label starts or ends with "%" ("% EBIT Margin", "Standalone EBIT
 * Margin %"), plus the ones matched by line_type (POST_TAX_RETURN, TAX_RATE),
 * used to print their stored value raw: a margin the engine computes to four
 * decimals rendered as "41.5584" beside a label reading "% EBIT Margin".
 *
 * Run: npx tsx src/lib/percent-cell.check.ts
 */
import { formatPercent, PERCENT_DECIMALS } from "@/lib/number-format";
import { isPercentRow } from "@/lib/row-rules";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(50)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`,
  );
};

/** What a grid cell renders — mirrors cellText's percentage branch. */
const cell = (stored: string): string => {
  if (stored.trim() === "") return "-";
  const n = Number(stored);
  if (!Number.isFinite(n) || n === 0) return "-";
  return formatPercent(n, "us");
};

console.log("The rows from the screenshot are recognised as percentages");
for (const name of [
  "% EBIT Margin",
  "% EBIT Growth",
  "% EBITDA Margin",
  "% EBITDA Growth",
  "Standalone EBIT Margin %",
]) {
  eq(`"${name}"`, isPercentRow({ name }), true);
}
// ...and by line_type, for the ones whose label carries no "%".
eq('"Post tax return" by line_type',
   isPercentRow({ name: "Post tax return", lineType: "POST_TAX_RETURN" }), true);
// Money rows must NOT be caught — "%" mid-label is prose, not a unit.
eq('"NPV @ 10% Discount Rate" is NOT a percentage',
   isPercentRow({ name: "NPV @ 10% Discount Rate" }), false);
eq('"Standalone Revenues" is NOT a percentage',
   isPercentRow({ name: "Standalone Revenues" }), false);

console.log("\nThe cell carries the % (screenshot values)");
eq("40 -> 40%", cell("40"), "40%");
eq("51 -> 51%", cell("51"), "51%");
eq("140 -> 140%", cell("140"), "140%");
eq("17 -> 17%", cell("17"), "17%");
// Negatives in accounting parentheses, as the screenshot shows them.
eq("-29 -> (29%)", cell("-29"), "(29%)");
eq("-17 -> (17%)", cell("-17"), "(17%)");
eq("-16 -> (16%)", cell("-16"), "(16%)");

console.log("\nThe server's 4-decimal figures round for display");
// Straight from proposal 698's EBIT_MARGIN_PCT.
eq("41.5584 -> 42%", cell("41.5584"), "42%");
eq("23.1527 -> 23%", cell("23.1527"), "23%");
eq("32.2314 -> 32%", cell("32.2314"), "32%");
eq("22.9437 -> 23%", cell("22.9437"), "23%");
// Only the DISPLAY rounds — the stored value is untouched, which is the same
// rule the money columns follow.
eq("display decimals is 0", PERCENT_DECIMALS, 0);

console.log("\nBlank and zero keep the dash placeholder");
eq("empty -> -", cell(""), "-");
eq("whitespace -> -", cell("   "), "-");
eq("zero -> -", cell("0"), "-");
eq("unparseable -> -", cell("n/a"), "-");

console.log("\nRegional grouping still applies to a large percentage");
eq("1234.5 US", formatPercent(1234.5, "us"), "1,235%");
eq("1234.5 EU", formatPercent(1234.5, "eu"), "1.235%");
eq("1234.5 Indian", formatPercent(1234.5, "in"), "1,235%");

console.log("\nNulls never render as NaN%");
eq("null -> ''", formatPercent(null), "");
eq("undefined -> ''", formatPercent(undefined), "");
eq("NaN -> ''", formatPercent(Number.NaN), "");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} percent-cell check(s) failed`);
