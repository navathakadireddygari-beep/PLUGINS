/**
 * Checks for the ACTUALS / PROJECTIONS split — i.e. where the partition falls.
 *
 * Run: npx tsx src/lib/fiscal-years.check.ts
 */
import { actualsCountOf, currentFiscalYear, fyNumberOf } from "./fiscal-years";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(56)} got=${String(got)}  want=${String(want)}`,
  );
};

/** Where the partition sits, as "<last actual> | <first projection>". */
const partition = (years: string[], fy: number): string => {
  const n = actualsCountOf(years, fy);
  return `${years[n - 1] ?? "-"} | ${years[n] ?? "-"}`;
};

console.log("fyNumberOf");
eq("fy26 -> 26", fyNumberOf("fy26"), 26);
eq("FY07 -> 7", fyNumberOf("FY07"), 7);
eq("total -> null", fyNumberOf("total"), null);
eq("fy2026 -> null", fyNumberOf("fy2026"), null);

console.log("\ncurrentFiscalYear — named after the year the FY STARTS in");
// FY26 = April 2026 .. March 2027, written "2026-2027".
eq("21 Aug 2026 -> FY26", currentFiscalYear(new Date(2026, 7, 21)), 26);
eq("1 Apr 2026 (first day) -> FY26", currentFiscalYear(new Date(2026, 3, 1)), 26);
eq("31 Mar 2026 (last day of FY25) -> FY25", currentFiscalYear(new Date(2026, 2, 31)), 25);
// The bug a bare getFullYear() would cause: January is still the SAME fiscal
// year, so the partition must not move on 1 January.
eq("1 Jan 2027 -> still FY26", currentFiscalYear(new Date(2027, 0, 1)), 26);
eq("31 Mar 2027 -> still FY26", currentFiscalYear(new Date(2027, 2, 31)), 26);
eq("1 Apr 2027 -> rolls to FY27", currentFiscalYear(new Date(2027, 3, 1)), 27);

console.log("\nThe reported case: today is FY 2026-2027, buckets start at fy24");
// The current year belongs to ACTUALS, so the line falls after fy26.
const FY24_33 = ["fy24","fy25","fy26","fy27","fy28","fy29","fy30","fy31","fy32","fy33"];
eq("fy24..fy33 @ FY26 -> 3 actuals", actualsCountOf(FY24_33, 26), 3);
eq("partition sits between fy26 and fy27", partition(FY24_33, 26), "fy26 | fy27");
// The defect being fixed: an exclusive boundary put the line one column left.
eq("NOT between fy25 and fy26", partition(FY24_33, 26) === "fy25 | fy26", false);

console.log("\nThe line follows the YEAR, never a fixed column count");
// Four historic buckets: a three-column cap would have pinned the line at
// fy25|fy26 regardless of the date. It must still land after the current year.
const FY23_33 = ["fy23", ...FY24_33];
eq("fy23..fy33 @ FY26 -> 4 actuals", actualsCountOf(FY23_33, 26), 4);
eq("...partition still after fy26", partition(FY23_33, 26), "fy26 | fy27");
// Deep history: eight actuals, line still in the right place.
const FY18_33 = ["fy18","fy19","fy20","fy21","fy22", ...FY23_33];
eq("fy18..fy33 @ FY26 -> 9 actuals", actualsCountOf(FY18_33, 26), 9);
eq("...partition still after fy26", partition(FY18_33, 26), "fy26 | fy27");

console.log("\nIt moves with the calendar");
eq("same buckets @ FY27 -> after fy27", partition(FY24_33, 27), "fy27 | fy28");
eq("same buckets @ FY25 -> after fy25", partition(FY24_33, 25), "fy25 | fy26");
eq("same buckets @ FY24 -> after fy24", partition(FY24_33, 24), "fy24 | fy25");

console.log("\nEdges");
eq("no buckets -> 0", actualsCountOf([], 26), 0);
// Every bucket is still to come: no actuals, so no partition at all.
eq("all future -> 0", actualsCountOf(["fy27","fy28","fy29"], 26), 0);
// Every bucket has happened: no projections, partition at the far right.
eq("all past -> every column", actualsCountOf(["fy23","fy24","fy25"], 26), 3);
eq("current year alone -> 1", actualsCountOf(["fy26","fy27"], 26), 1);
// Unparseable buckets end the run rather than being guessed at.
eq("non-fy buckets -> 0", actualsCountOf(["total","x","y"], 26), 0);
eq("a stray bucket ends the run", actualsCountOf(["fy24","fy25","total","fy26"], 26), 2);
// Century wrap: FY99 is not "after" FY00 in the same window, but a run stops at
// the first bucket beyond the current year either way.
eq("run stops at the first future bucket", actualsCountOf(["fy24","fy27","fy25"], 26), 1);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} fiscal-year check(s) failed`);
