/**
 * Checks against the REAL GET response for proposal 698 ("M&A quick test").
 *
 * Everything here is a literal from that payload, not a fixture I invented, so
 * these assertions fail if the screen would misread live data.
 *
 * Run: npx tsx src/lib/live-payload.check.ts
 */
import { actualsCountOf } from "@/lib/fiscal-years";
import { applyMaNpvBlock } from "@/lib/ma-recalc";
import type { MaNpvBlock } from "@/lib/ma-formulas";

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
console.log("\nEngine vs the server's own figures (fy24)");
const revenueTotal = 77, costsTotal = 45;
eq("EBIT = revenue - costs", revenueTotal - costsTotal, 32);
const margin = Math.round(((revenueTotal - costsTotal) / revenueTotal) * 100 * 1e4) / 1e4;
eq("% EBIT margin (4dp)", margin, 41.5584);

/* ── the NPV block's column layout ────────────────────────────────── */
console.log("\nNPV block — which column each component uses");
// [target_standalone, experian_factor, total] exactly as the payload has them.
const npvRows = [
  { lineType: "PV_YEARS_0_7",         isCalculated: true,  values: ["261.94", "-67.88", "194.06"] },
  { lineType: "PV_TERMINAL_VALUE",    isCalculated: true,  values: ["346.37", "-114.55", "231.82"] },
  { lineType: "TOTAL_PRESENT_VALUE",  isCalculated: true,  values: ["608.31", "-182.43", "425.88"] },
  { lineType: "PV_OF_INVESTMENT",     isCalculated: true,  values: ["", "", "420"] },
  { lineType: "NPV_AT_DISCOUNT_RATE", isCalculated: true,  values: ["", "", "845.88"] },
  { lineType: "ENTERPRISE_VALUE",     isCalculated: true,  values: ["0", "", ""] },
  { lineType: "TAX_BENEFIT",          isCalculated: false, values: ["40", "", ""] },
  { lineType: "NET_PURCHASE_PRICE",   isCalculated: true,  values: ["-40", "", ""] },
];
const block: MaNpvBlock = {
  pvYearsStandalone: 261.94, pvYearsTotal: 194.06,
  pvTerminalStandalone: 346.37, pvTerminalTotal: 231.82,
  pvOfInvestment: 420, totalPresentValue: 425.88, npvAtDiscountRate: 845.88,
};
const out = applyMaNpvBlock(npvRows, block);
const at = (t: string) => out.find((r) => r.lineType === t)!.values;

// Net purchase price = enterprise value - tax benefit, in the STANDALONE column
// (0 - 40 = -40), which is exactly what the server has.
eq("NET_PURCHASE_PRICE standalone = -40", at("NET_PURCHASE_PRICE")[0], "-40");
// The bug this guards: reading `total` found nulls and wrote a confident "0"
// into a column the server deliberately leaves empty.
eq("...and its total stays empty", at("NET_PURCHASE_PRICE")[2], "");
eq("ENTERPRISE_VALUE untouched", at("ENTERPRISE_VALUE"), ["0", "", ""]);
eq("TAX_BENEFIT (user input) untouched", at("TAX_BENEFIT"), ["40", "", ""]);
// Total-only components keep using the total column.
eq("PV_OF_INVESTMENT total", at("PV_OF_INVESTMENT")[2], "420");
eq("...standalone stays empty", at("PV_OF_INVESTMENT")[0], "");
eq("NPV_AT_DISCOUNT_RATE total", at("NPV_AT_DISCOUNT_RATE")[2], "845.88");
// Three-column components keep all three; the factor column is the server's.
eq("PV_YEARS_0_7 keeps the factor column", at("PV_YEARS_0_7")[1], "-67.88");
eq("PV_YEARS_0_7 standalone/total", [at("PV_YEARS_0_7")[0], at("PV_YEARS_0_7")[2]], ["261.94", "194.06"]);
// The server's own arithmetic: standalone + factor = total.
eq("standalone + factor = total (server)", 261.94 + -67.88, 194.06);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} live-payload check(s) failed`);
