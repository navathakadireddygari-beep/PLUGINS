import { applyMaNpvBlock, recalcMaGrids, type RecalcRow } from "./ma-recalc";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label.padEnd(50)} got=${got}  want=${want}`);
};

const COLS = 2;
const row = (
  lineType: string,
  sectionType: string,
  isCalculated: boolean,
  values: string[] = ["", ""],
): RecalcRow & { label: string } => ({
  label: lineType,
  lineType,
  sectionType,
  isCalculated,
  values: [...values],
});

// The M&A template's real line-up, per proposal 679.
const build = (standaloneRev: string[], factorRev: string[], standaloneCosts: string[]) => {
  const cor = [
    row("STANDALONE_REVENUES", "REVENUE", false, standaloneRev),
    row("EXPERIAN_FACTOR_REVENUES", "REVENUE", false, factorRev),
    row("REVENUE_TOTAL", "REVENUE", true),
    row("STANDALONE_COSTS", "COSTS", false, standaloneCosts),
    row("DEPRECIATION_AMORTIZATION", "COSTS", false, ["10", "10"]),
    row("COSTS_TOTAL", "COSTS", true),
    row("EBIT", "RETURNS_ANALYSIS", true),
    row("EBIT_MARGIN_PCT", "RETURNS_ANALYSIS", true),
    row("EBIT_GROWTH_PCT", "RETURNS_ANALYSIS", true),
    row("EBITDA", "RETURNS_ANALYSIS", true),
  ];
  const fcf = [
    row("INTEGRATION_COSTS_ONE_TIME", "COMBINED_FREE_CASH_FLOWS", false, ["5", "0"]),
    row("PURCHASE_PRICE", "COMBINED_FREE_CASH_FLOWS", false, ["-400", "0"]),
    row("AMORT_DEPREC", "COMBINED_FREE_CASH_FLOWS", true),
    row("CASH_TAX_EBIT", "COMBINED_FREE_CASH_FLOWS", true),
    row("OPERATING_CF", "COMBINED_FREE_CASH_FLOWS", true),
    row("NET_CASH_FLOW", "COMBINED_FREE_CASH_FLOWS", true),
  ];
  // Display order 10..60, as the template ships it. EBIT_AFTER_TAX sits ABOVE
  // cash benefits and POST_TAX_EBIT below, which is what makes them two
  // different figures.
  const ptr = [
    row("PTR_EBIT", "POST_TAX_RETURN", true),
    row("PTR_TAXES_PAYABLE", "POST_TAX_RETURN", true),
    row("EBIT_AFTER_TAX", "POST_TAX_RETURN", true),
    row("CASH_BENEFITS", "POST_TAX_RETURN", false, ["8", "8"]),
    row("POST_TAX_EBIT", "POST_TAX_RETURN", true),
    row("POST_TAX_RETURN", "POST_TAX_RETURN", true),
  ];
  return { cor, fcf, ptr };
};

const KEY_INPUTS = [
  { code: "DISCOUNT_RATE", value: "10" },
  { code: "TERMINAL_GROWTH_RATE", value: "2" },
  { code: "TAX_RATE", value: "25" },
];

const runWith = (a: string[], b: string[], c: string[]) => {
  const { cor, fcf, ptr } = build(a, b, c);
  const { grids } = recalcMaGrids([cor, fcf, ptr], KEY_INPUTS, COLS);
  const find = (g: number, lt: string) =>
    grids[g].find((r) => r.lineType === lt)!.values;
  return { find, grids };
};

console.log("BEFORE edit: standalone rev [100,120], factor rev [20,30], costs [40,45]");
let r = runWith(["100", "120"], ["20", "30"], ["40", "45"]);
// Revenue total = 100+20 = 120 ; 120+30 = 150
eq("REVENUE_TOTAL = sum of Revenue section", r.find(0, "REVENUE_TOTAL"), ["120", "150"]);
// Costs total = 40+10 = 50 ; 45+10 = 55
eq("COSTS_TOTAL = sum of Costs section", r.find(0, "COSTS_TOTAL"), ["50", "55"]);
// EBIT = 120-50 = 70 ; 150-55 = 95
eq("EBIT = revenue_total - costs_total", r.find(0, "EBIT"), ["70", "95"]);
eq("EBITDA = EBIT + D&A", r.find(0, "EBITDA"), ["80", "105"]);
eq("EBIT margin % = 70/120, 95/150", r.find(0, "EBIT_MARGIN_PCT"), ["58.3333", "63.3333"]);
eq("EBIT growth % (y1 null, y2 = 25/70)", r.find(0, "EBIT_GROWTH_PCT"), ["", "35.7143"]);
eq("CASH_TAX_EBIT negative", r.find(1, "CASH_TAX_EBIT"), ["-17.5", "-23.75"]);
// operating CF y0 = 70 - 5 - 10 + (-17.5) = 37.5 ; y1 = 95 - 0 - 10 + (-23.75) = 61.25
eq("OPERATING_CF", r.find(1, "OPERATING_CF"), ["37.5", "61.25"]);
eq("EBIT_AFTER_TAX = EBIT + ptr tax", r.find(2, "EBIT_AFTER_TAX"), ["52.5", "71.25"]);
// S6: post-tax EARNINGS = pre-benefit + cash benefits. This row sits below
// CASH_BENEFITS in the template and must include it — 52.5 + 8, not 52.5.
eq("POST_TAX_EBIT = pre-benefit + cash benefits", r.find(2, "POST_TAX_EBIT"), ["60.5", "79.25"]);
// ...and post tax return % divides THAT by |PV of investment| = 400.
eq("POST_TAX_RETURN % = 60.5/400, 79.25/400", r.find(2, "POST_TAX_RETURN"), ["15.125", "19.8125"]);
// The bridge's D&A row echoes the Costs section input verbatim.
eq("AMORT_DEPREC echoes the D&A input", r.find(1, "AMORT_DEPREC"), ["10", "10"]);

console.log("\nEDIT: standalone revenue y1 100 -> 200 (everything downstream must move)");
r = runWith(["200", "120"], ["20", "30"], ["40", "45"]);
eq("REVENUE_TOTAL follows the edit", r.find(0, "REVENUE_TOTAL"), ["220", "150"]);
eq("EBIT follows (220-50)", r.find(0, "EBIT"), ["170", "95"]);
eq("EBITDA follows", r.find(0, "EBITDA"), ["180", "105"]);
eq("EBIT margin % follows", r.find(0, "EBIT_MARGIN_PCT"), ["77.2727", "63.3333"]);
// A decline is valid NEGATIVE growth. S3 nulls growth only when an endpoint is
// not strictly positive; 170 and 95 both are, so (95-170)/170 = -44.1176%.
eq("growth is negative on a fall, not null", r.find(0, "EBIT_GROWTH_PCT"), ["", "-44.1176"]);
eq("CASH_TAX_EBIT follows", r.find(1, "CASH_TAX_EBIT"), ["-42.5", "-23.75"]);
eq("OPERATING_CF follows (170-5-10-42.5)", r.find(1, "OPERATING_CF"), ["112.5", "61.25"]);
eq("EBIT_AFTER_TAX follows", r.find(2, "EBIT_AFTER_TAX"), ["127.5", "71.25"]);
eq("POST_TAX_EBIT follows (+ cash benefits)", r.find(2, "POST_TAX_EBIT"), ["135.5", "79.25"]);

console.log("\nEDIT: a COSTS line moves EBIT too");
r = runWith(["100", "120"], ["20", "30"], ["90", "45"]);
eq("COSTS_TOTAL = 90+10", r.find(0, "COSTS_TOTAL"), ["100", "55"]);
eq("EBIT = 120-100 = 20", r.find(0, "EBIT"), ["20", "95"]);

console.log("\nNon-calculated rows are never overwritten");
r = runWith(["100", "120"], ["20", "30"], ["40", "45"]);
eq("STANDALONE_REVENUES untouched", r.find(0, "STANDALONE_REVENUES"), ["100", "120"]);
eq("PURCHASE_PRICE untouched", r.find(1, "PURCHASE_PRICE"), ["-400", "0"]);
eq("CASH_BENEFITS untouched", r.find(2, "CASH_BENEFITS"), ["8", "8"]);

console.log("\nRow identity preserved (order + length unchanged)");
const before = build(["100", "120"], ["20", "30"], ["40", "45"]);
const after = recalcMaGrids([before.cor, before.fcf, before.ptr], KEY_INPUTS, COLS).grids;
eq("cor length", after[0].length, before.cor.length);
eq("cor order", after[0].map((x) => x.lineType).join(","), before.cor.map((x) => x.lineType).join(","));

console.log("\nNPV Calculation block (S9)");
{
  const { cor, fcf, ptr } = build(["100", "120"], ["20", "30"], ["40", "45"]);
  const { npvBlock } = recalcMaGrids([cor, fcf, ptr], KEY_INPUTS, COLS);

  // [target_standalone, experian_factor, total]
  const comp = (lineType: string, isCalculated: boolean, values = ["", "", ""]) => ({
    lineType,
    isCalculated,
    values: [...values],
  });
  const rows = [
    comp("PV_YEARS_0_7", true),
    comp("PV_TERMINAL_VALUE", true),
    comp("TOTAL_PRESENT_VALUE", true),
    comp("PV_OF_INVESTMENT", true),
    comp("NPV_AT_DISCOUNT_RATE", true),
    // The deal-value trio lives in the STANDALONE column with a null total,
    // as the live payload (proposal 698) states them.
    comp("ENTERPRISE_VALUE", true, ["420", "", ""]),
    comp("TAX_BENEFIT", false, ["40", "", ""]),
    comp("NET_PURCHASE_PRICE", true),
  ];
  const out = applyMaNpvBlock(rows, npvBlock);
  const at = (lineType: string) => out.find((x) => x.lineType === lineType)!.values;

  eq("PV of years (standalone / total)",
     [at("PV_YEARS_0_7")[0], at("PV_YEARS_0_7")[2]],
     [String(npvBlock.pvYearsStandalone), String(npvBlock.pvYearsTotal)]);
  eq("PV of terminal (standalone / total)",
     [at("PV_TERMINAL_VALUE")[0], at("PV_TERMINAL_VALUE")[2]],
     [String(npvBlock.pvTerminalStandalone), String(npvBlock.pvTerminalTotal)]);
  eq("Total PV = PV years + PV terminal",
     at("TOTAL_PRESENT_VALUE")[2], String(npvBlock.totalPresentValue));
  // PV of investment is the UNDISCOUNTED purchase price: -400 + 0.
  eq("PV of investment (undiscounted)", at("PV_OF_INVESTMENT")[2], "-400");
  eq("NPV @ discount rate", at("NPV_AT_DISCOUNT_RATE")[2], String(npvBlock.npvAtDiscountRate));
  // Net purchase price = enterprise value - tax benefit = 420 - 40.
  // Written to the STANDALONE column, beside its operands — that is where the
  // live payload (proposal 698) states all three of these.
  eq("Net purchase price = EV - tax benefit", at("NET_PURCHASE_PRICE")[0], "380");
  eq("...total left empty, as the server leaves it", at("NET_PURCHASE_PRICE")[2], "");
  // A user input and the un-formulated server figure are both left alone.
  eq("TAX_BENEFIT (user input) preserved", at("TAX_BENEFIT")[0], "40");
  eq("ENTERPRISE_VALUE (server-owned) preserved", at("ENTERPRISE_VALUE")[0], "420");
  // The document defines the standalone and total figures, not the split.
  eq("experian_factor column untouched", at("PV_YEARS_0_7")[1], "");
}

console.log("\nA user-added row feeds its section subtotal");
{
  // What "+ Add Row" produces: no lineType and no apiKey (the server has never
  // seen it), not calculated, carrying only the sectionType it inherited.
  const custom = (sectionType: string, values: string[]) => ({
    label: "My custom line",
    lineType: undefined,
    sectionType,
    isCalculated: false,
    values: [...values],
  });

  const { cor, fcf, ptr } = build(["100", "120"], ["20", "30"], ["40", "45"]);
  // Inserted ABOVE the subtotal, which is where sectionInsertIndex puts it:
  // index 2 is "REVENUE_TOTAL", so the new line goes at index 2 and pushes the
  // total down.
  cor.splice(2, 0, custom("REVENUE", ["7", "9"]));
  const withRevenue = recalcMaGrids([cor, fcf, ptr], KEY_INPUTS, COLS).grids;
  const find = (g: number, lt: string) =>
    withRevenue[g].find((r) => r.lineType === lt)!.values;

  // 100 + 20 + 7 = 127 ; 120 + 30 + 9 = 159
  eq("REVENUE_TOTAL includes the added row", find(0, "REVENUE_TOTAL"), ["127", "159"]);
  // ...and everything downstream of it moves: EBIT = 127 - 50, 159 - 55.
  eq("EBIT follows the added revenue", find(0, "EBIT"), ["77", "104"]);
  // The added row itself is never overwritten by the engine.
  eq("the added row keeps its values",
     withRevenue[0].find((r) => r.label === "My custom line")!.values, ["7", "9"]);
  // Order is preserved: the new line sits above the subtotal it feeds.
  eq("added row sits ABOVE the subtotal",
     withRevenue[0].slice(2, 4).map((r) => r.lineType ?? "(custom)"),
     ["(custom)", "REVENUE_TOTAL"]);
}

console.log("\nThe same holds for Total Costs");
{
  const { cor, fcf, ptr } = build(["100", "120"], ["20", "30"], ["40", "45"]);
  // Costs section is STANDALONE_COSTS, DEPRECIATION_AMORTIZATION, COSTS_TOTAL
  // at indices 3, 4, 5 - so a new cost line goes in at index 5.
  cor.splice(5, 0, {
    label: "My custom cost", lineType: undefined, sectionType: "COSTS",
    isCalculated: false, values: ["6", "6"],
  });
  const out = recalcMaGrids([cor, fcf, ptr], KEY_INPUTS, COLS).grids;
  const find = (g: number, lt: string) => out[g].find((r) => r.lineType === lt)!.values;
  // 40 + 10 + 6 = 56 ; 45 + 10 + 6 = 61
  eq("COSTS_TOTAL includes the added row", find(0, "COSTS_TOTAL"), ["56", "61"]);
  // EBIT = 120 - 56 ; 150 - 61
  eq("EBIT follows the added cost", find(0, "EBIT"), ["64", "89"]);
}

console.log("\nA row in a NON-summing section changes no subtotal");
{
  const { cor, fcf, ptr } = build(["100", "120"], ["20", "30"], ["40", "45"]);
  // Combined Free Cash Flows has no section subtotal - its calculated lines are
  // formula-driven - so an added line there must not disturb the totals above.
  fcf.push({
    label: "Extra cash item", lineType: undefined,
    sectionType: "COMBINED_FREE_CASH_FLOWS", isCalculated: false, values: ["5", "5"],
  });
  const out = recalcMaGrids([cor, fcf, ptr], KEY_INPUTS, COLS).grids;
  const find = (g: number, lt: string) => out[g].find((r) => r.lineType === lt)!.values;
  eq("REVENUE_TOTAL unchanged", find(0, "REVENUE_TOTAL"), ["120", "150"]);
  eq("COSTS_TOTAL unchanged", find(0, "COSTS_TOTAL"), ["50", "55"]);
  eq("EBIT unchanged", find(0, "EBIT"), ["70", "95"]);
}

console.log(`\n${pass} passed, ${fail} failed`);
