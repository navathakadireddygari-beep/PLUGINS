/**
 * Percentage cells carry the "%" — the unit belongs in the cell, not only in
 * the row label.
 *
 * Percentage rows (the line's is_percentage is "Y") used to print their stored
 * value raw: a margin the engine computes to four decimals rendered as
 * "41.5584" beside a label reading "% EBIT Margin".
 *
 * Run: npx tsx src/lib/percent-cell.check.ts
 */
import {
  formatPercent,
  isPartialNumberInput,
  parseTypedNumber,
  PERCENT_DECIMALS,
  toEditableNumber,
} from "@/lib/number-format";
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

console.log("Percentage rows come from is_percentage, not the name");
for (const name of [
  "% EBIT Margin",
  "% EBIT Growth",
  "% EBITDA Margin",
  "% EBITDA Growth",
  "Standalone EBIT Margin %",
]) {
  eq(`"${name}" with is_percentage Y`, isPercentRow({ name, isPercentage: true }), true);
  eq(`"${name}" with is_percentage N`, isPercentRow({ name, isPercentage: false }), false);
}
eq('"Post tax return" with is_percentage Y',
   isPercentRow({ name: "Post tax return", lineType: "POST_TAX_RETURN", isPercentage: true }), true);
eq('"NPV @ 10% Discount Rate" with no flag is NOT a percentage',
   isPercentRow({ name: "NPV @ 10% Discount Rate" }), false);
eq('"Standalone Revenues" is NOT a percentage',
   isPercentRow({ name: "Standalone Revenues", isPercentage: false }), false);

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

console.log("\nTyped / pasted percentages parse in the active number format");
eq("US 12.5", parseTypedNumber("12.5", "us"), 12.5);
eq("EU 12,5 is 12.5, not 125", parseTypedNumber("12,5", "eu"), 12.5);
eq("accounting (5) is -5", parseTypedNumber("(5)", "us"), -5);
eq("displayed (29%) is -29", parseTypedNumber("(29%)", "us"), -29);
eq("-17 stays negative (no 0 clamp)", parseTypedNumber("-17", "us"), -17);
eq("140 stays 140 (no 100 clamp)", parseTypedNumber("140", "us"), 140);
eq("4dp kept", parseTypedNumber("41.5584", "us"), 41.5584);
eq("blank -> null", parseTypedNumber("  ", "us"), null);
eq("EU editor seed", toEditableNumber("41.5584", "eu"), "41,5584");
eq("seed round-trips (EU)",
   parseTypedNumber(toEditableNumber("41.5584", "eu"), "eu"), 41.5584);

console.log("\nKey Input keystrokes: rejected, never rewritten");
const ok = (s: string, f: "us" | "eu" = "us", neg = false) =>
  isPartialNumberInput(s, f, { allowNegative: neg, max: 100 });
eq("'' accepted", ok(""), true);
eq("'12.' accepted (US)", ok("12."), true);
eq("'.5' accepted", ok(".5"), true);
eq("'12,' accepted (EU)", ok("12,", "eu"), true);
eq("'12,' rejected (US grouping)", ok("12,"), false);
eq("'1.2.3' rejected", ok("1.2.3"), false);
eq("'abc' rejected", ok("12a"), false);
eq("'101' rejected (not rewritten to 100)", ok("101"), false);
eq("'-' rejected without allowNegative", ok("-"), false);
eq("'-2.5' accepted for growth", ok("-2.5", "us", true), true);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} percent-cell check(s) failed`);
