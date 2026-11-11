import { isPercentRow, isNoTotalRow } from "./row-rules";

// Only the backend's is_percentage flag makes a percentage row; the name and
// line_type no longer do.
const rows = [
  { name: "% EBIT Margin", lineType: "EBIT_MARGIN_PCT", isPercentage: true, want: true },
  { name: "Tax rate", lineType: "TAX_RATE", isPercentage: true, want: true },
  { name: "Post tax return", lineType: "POST_TAX_RETURN", isPercentage: true, want: true },
  { name: "% EBIT Margin", lineType: "EBIT_MARGIN_PCT", isPercentage: false, want: false },
  { name: "Tax rate", lineType: "TAX_RATE", isPercentage: undefined, want: false },
  { name: "NPV @ 23% Discount Rate", lineType: null, isPercentage: false, want: false },
  { name: "Standalone Revenues", lineType: "STANDALONE_REVENUES", isPercentage: false, want: false },
];

let fail = 0;
for (const r of rows) {
  const got = isPercentRow({ name: r.name, lineType: r.lineType, isPercentage: r.isPercentage });
  const ok = got === r.want;
  if (!ok) fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} isPercentRow(${JSON.stringify(r.name).padEnd(28)} is_percentage=${String(r.isPercentage).padEnd(9)}) = ${String(got).padEnd(5)} want=${r.want}`,
  );
}
console.log("");
for (const lt of ["EBIT_MARGIN_PCT", "EBIT_GROWTH_PCT", "POST_TAX_RETURN"]) {
  const got = isNoTotalRow({ lineType: lt });
  if (!got) fail += 1;
  console.log(`${got ? "  ok  " : "  FAIL"} isNoTotalRow(${lt}) = ${got} (percentages have no cross-year total)`);
}
console.log(`\n${fail} failed`);
