import {
  calculateMa,
  cagrOf,
  irrOf,
  npvOf,
  paybackOf,
  terminalValueOf,
  netPurchasePriceOf,
  type MaYearInputs,
} from "./ma-formulas";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label.padEnd(46)} got=${got}  want=${want}`);
};

const year = (o: Partial<MaYearInputs>): MaYearInputs => ({
  standaloneRevenues: null, experianFactorRevenues: null, revenueTotal: null,
  standaloneCosts: null, costSynergies: null, depreciationAmortization: null,
  costsTotal: null, integrationCosts: null, purchasePrice: null, cashBenefits: null,
  ...o,
});

console.log("S8  NPV / IRR / payback");
// NPV: exponent is t-1, so year 1 is UNDISCOUNTED.
// 100 + 100/1.1 + 100/1.21 = 100 + 90.909090.. + 82.644628.. = 273.553719 -> 273.55
eq("NPV([100,100,100], r=10)", npvOf([100, 100, 100], 10), 273.55);
eq("NPV first year undiscounted", npvOf([100], 10), 100);
eq("NPV empty -> null", npvOf([], 10), null);
// IRR of [-100, 110] with t-1 exponents: -100 + 110/(1+r) = 0 -> r = 0.10
eq("IRR([-100,110]) = 10%", irrOf([-100, 110]), 10);
eq("IRR all zero -> null", irrOf([0, 0]), null);
eq("IRR empty -> null", irrOf([]), null);
eq("payback([-100,60,60]) = 3", paybackOf([-100, 60, 60]), 3);
eq("payback never recovers -> null", paybackOf([-100, 10]), null);
eq("payback immediate = 1", paybackOf([5]), 1);

console.log("\nS7  Terminal value (Gordon growth), guarded on r > g");
// 100 * (1 + 2/100) / ((10-2)/100) = 102 / 0.08 = 1275
eq("TV(ocf=100, r=10, g=2)", terminalValueOf(100, 10, 2), 1275);
eq("TV null when r == g", terminalValueOf(100, 5, 5), null);
eq("TV null when r < g", terminalValueOf(100, 2, 5), null);

console.log("\nS11 CAGR");
// (200/100)^(1/2) - 1 = 0.4142135.. -> 41.4214%
eq("CAGR([100,150,200]) over 3 pts", cagrOf([100, 150, 200]), 41.4214);
eq("CAGR null when first <= 0", cagrOf([0, 200]), null);
eq("CAGR null when last <= 0", cagrOf([100, -5]), null);
eq("CAGR null with < 2 years", cagrOf([100]), null);

console.log("\nS9  Net purchase price = enterprise value - tax benefit");
eq("NPP(420, 40)", netPurchasePriceOf(420, 40), 380);

console.log("\nS2-S6 engine, worked example (tax 25, r 10, g 2)");
const inputs = [
  year({ standaloneRevenues: 100, standaloneCosts: 40, revenueTotal: 120, costsTotal: 50,
         depreciationAmortization: 10, integrationCosts: 5, purchasePrice: -400, cashBenefits: 8 }),
  year({ standaloneRevenues: 120, standaloneCosts: 45, revenueTotal: 150, costsTotal: 60,
         depreciationAmortization: 10, integrationCosts: 0, purchasePrice: 0, cashBenefits: 8 }),
];
const res = calculateMa(inputs, { discountRate: 10, terminalGrowthRate: 2, taxRate: 25 });
const y0 = res.years[0];
const y1 = res.years[1];

// S3: EBIT = revenue_total - costs_total = 120 - 50 = 70 ; EBITDA = 70 + 10 = 80
eq("EBIT y0 = 120-50", y0.ebit, 70);
eq("EBITDA y0 = EBIT + D&A", y0.ebitda, 80);
eq("EBIT margin % = 70/120*100", y0.ebitMarginPct, 58.3333);
eq("EBITDA margin % = 80/120*100", y0.ebitdaMarginPct, 66.6667);
eq("EBIT growth null in first year", y0.ebitGrowthPct, null);
// y1 EBIT = 150-60 = 90 ; growth = (90-70)/70*100 = 28.5714
eq("EBIT y1 = 150-60", y1.ebit, 90);
eq("EBIT growth % y1 = (90-70)/70", y1.ebitGrowthPct, 28.5714);

// S4: standalone EBIT = 100-40 = 60 ; tax = 15 ; OCF = 45 ; margin = 60%
eq("standalone EBIT = 100-40", y0.standaloneEbit, 60);
eq("standalone tax = 60*25%", y0.standaloneTax, 15);
eq("standalone OCF = 60-15", y0.standaloneOcf, 45);
eq("standalone margin % = 60/100", y0.standaloneEbitMarginPct, 60);

// S5: cash tax NEGATIVE = -70*0.25 = -17.5
//     operating CF = 70 - 5 - 10 + (-17.5) = 37.5 ; Experian OCF = same
eq("cash tax is negative", y0.cashTax, -17.5);
eq("operating CF = EBIT - integ - D&A + cashTax", y0.operatingCf, 37.5);
eq("Experian OCF = operating CF (no scaling)", y0.experianOcf, 37.5);

// S7: TV off FINAL year. y1 OCF = 90 - 0 - 10 + (-22.5) = 57.5
//     TV = 57.5 * 1.02 / 0.08 = 733.125 -> 733.13
eq("TV only on final year (y0 null)", y0.terminalValue, null);
eq("TV on final year", y1.terminalValue, 733.13);

// S5: net cash flow = ExperianOCF + purchase price + TV
eq("net CF y0 = 37.5 + (-400) + 0", y0.netCashFlow, -362.5);
eq("net CF y1 = 57.5 + 0 + 733.13", y1.netCashFlow, 790.63);

// S6: PV of investment = sum of purchase price = -400 ; PTR uses |PV inv|
//     post-tax earnings y0 = 70 + (-17.5) + 8 = 60.5 ; 60.5/400*100 = 15.125
eq("PV of investment (undiscounted)", res.npvBlock.pvOfInvestment, -400);
eq("post-tax EBIT y0 = 70 + (-17.5)", y0.postTaxEbit, 52.5);
eq("post-tax earnings y0 = 52.5 + 8", y0.postTaxEarnings, 60.5);
eq("post-tax return % = 60.5/|-400|", y0.postTaxReturnPct, 15.125);

// S8/S9
// NPV = -362.5 + 790.63/1.1 = -362.5 + 718.7545.. = 356.25
eq("NPV of net cash flows", res.npv, 356.25);
eq("payback = 2 (turns positive in y2)", res.paybackPeriodYears, 2);
// PV years total = 37.5 + 57.5/1.1 = 37.5 + 52.2727 = 89.77
eq("PV of years (total)", res.npvBlock.pvYearsTotal, 89.77);
// PV terminal total = 733.13 / 1.1^2 = 733.13/1.21 = 605.89
eq("PV of terminal (full horizon /(1+r)^n)", res.npvBlock.pvTerminalTotal, 605.89);
eq("total present value", res.npvBlock.totalPresentValue, 695.66);

console.log("\nS3  null-denominator guards");
const zero = calculateMa([year({ revenueTotal: 0, costsTotal: 0 })], {
  discountRate: 10, terminalGrowthRate: 2, taxRate: 25,
});
eq("EBIT margin null when revenue total 0", zero.years[0].ebitMarginPct, null);
eq("standalone margin null when rev 0", zero.years[0].standaloneEbitMarginPct, null);
eq("post-tax return null when PV inv 0", zero.years[0].postTaxReturnPct, null);

console.log(`\n${pass} passed, ${fail} failed`);
