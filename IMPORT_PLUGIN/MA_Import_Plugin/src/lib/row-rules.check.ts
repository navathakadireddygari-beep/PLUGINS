import { isPercentRow, isNoTotalRow } from "./row-rules";

const rows = [
  { name: "% EBIT Margin", lineType: "EBIT_MARGIN_PCT", want: true },
  { name: "% EBIT Growth", lineType: "EBIT_GROWTH_PCT", want: true },
  { name: "Post Tax Return %", lineType: "POST_TAX_RETURN", want: true },
  { name: "Tax rate", lineType: "TAX_RATE", want: true },
  { name: "Standalone Revenues", lineType: "STANDALONE_REVENUES", want: false },
  { name: "Revenue", lineType: "REVENUE_TOTAL", want: false },
  { name: "EBIT", lineType: "EBIT", want: false },
  { name: "Total Costs", lineType: "COSTS_TOTAL", want: false },
  // NPV components carry no lineType - only a label. This one is MONEY.
  { name: "NPV @ 23% Discount Rate", lineType: null, want: false },
  { name: "PV of Yrs 0-7", lineType: null, want: false },
  { name: "Net Purchase Price", lineType: null, want: false },
];

let fail = 0;
for (const r of rows) {
  const got = isPercentRow({ name: r.name, lineType: r.lineType });
  const ok = got === r.want;
  if (!ok) fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} isPercentRow(${JSON.stringify(r.name).padEnd(28)}) = ${String(got).padEnd(5)} want=${r.want}`,
  );
}
console.log("");
for (const lt of ["EBIT_MARGIN_PCT", "EBIT_GROWTH_PCT", "POST_TAX_RETURN"]) {
  const got = isNoTotalRow({ lineType: lt });
  if (!got) fail += 1;
  console.log(`${got ? "  ok  " : "  FAIL"} isNoTotalRow(${lt}) = ${got} (percentages have no cross-year total)`);
}
console.log(`\n${fail} failed`);
