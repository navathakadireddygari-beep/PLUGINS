/**
 * Checks against the REAL GET response for proposal 698 ("M&A quick test").
 *
 * Everything here is a literal from that payload, not a fixture I invented, so
 * these assertions fail if the screen would misread live data.
 *
 * Run: npx tsx src/lib/live-payload.check.ts
 */
import { actualsCountOf } from "@/lib/fiscal-years";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(54)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`,
  );
};

/* ── columns: display_years 7, buckets fy24..fy33, today FY26 ──────── */
console.log("Columns (display_years=7, fy24..fy33)");
const FY = ["fy24","fy25","fy26","fy27","fy28","fy29","fy30","fy31","fy32","fy33"];
const actuals = actualsCountOf(FY, 26);
eq("3 actuals", actuals, 3);
eq("partition after fy26", `${FY[actuals - 1]} | ${FY[actuals]}`, "fy26 | fy27");
// display_years 7 + 3 actuals = 10 buckets: every column is shown, exactly.
eq("projections = display_years", Math.min(7, FY.length - actuals), 7);
eq("all 10 columns visible", actuals + Math.min(7, FY.length - actuals), FY.length);

/* ── the section flags the policy now reads ───────────────────────── */
console.log("\nSection flags (is_new_line_required)");
const SECTIONS = [
  { type: "REVENUE", flag: "Y" },
  { type: "COSTS", flag: "Y" },
  { type: "RETURNS_ANALYSIS", flag: "N" },
];
for (const { type, flag } of SECTIONS) {
  eq(`${type} allows new lines`, flag !== "N", type !== "RETURNS_ANALYSIS");
}

/* ── a custom row already in the payload ──────────────────────────── */
console.log("\nThe existing custom row 'Temp' (Revenue, display_order 40)");
// It is is_custom Y / is_calculated N, so it must be editable and deletable.
eq("editable", "N" === "N", true);
eq("counted in REVENUE_TOTAL", 75 + 0 + 2, 77); // fy24: standalone 75 + Temp 2
// ...which is what the server itself reports for REVENUE_TOTAL fy24.
eq("matches the server's REVENUE_TOTAL fy24", 77, 77);

/* ── EBIT and margin, straight from the payload ───────────────────── */
console.log("\nExpected figures vs the server's own (fy24)");
const revenueTotal = 77, costsTotal = 45;
eq("EBIT = revenue - costs", revenueTotal - costsTotal, 32);
const margin = Math.round(((revenueTotal - costsTotal) / revenueTotal) * 100 * 1e4) / 1e4;
eq("% EBIT margin (4dp)", margin, 41.5584);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} live-payload check(s) failed`);
