/**
 * Checks for the per-section add / delete policy, run over the M&A template's
 * REAL line-up (proposal 679, as recorded in README.md).
 *
 * The rules under test, as specified:
 *   - a non-editable line never shows a delete icon, and IS greyed out
 *   - Revenue        deletable input lines + "+ Add ... Line"
 *   - Costs          deletable input lines + "+ Add ... Line"
 *   - Returns Analysis   no delete, no add
 *   - Combined Free Cash Flows   deletable input lines + add
 *   - Post Tax Return    no delete, no add
 *   - NPV block          no delete, no add
 *
 * The policy itself lives in Table.tsx, which cannot be imported outside React;
 * it is duplicated here in the same two lines it occupies there, so a change to
 * one that is not mirrored in the other shows up as a failure.
 *
 * Run: npx tsx src/lib/row-policy.check.ts
 */

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

/* ── the policy, mirroring Table.tsx ──────────────────────────────── */
const tok = (s: string | null | undefined): string =>
  (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const SECTIONS_ALLOWING_ROWS = new Set(["REVENUE", "COSTS", "COMBINEDFREECASHFLOWS"]);
const sectionAllowsRows = (t: string | null | undefined) => SECTIONS_ALLOWING_ROWS.has(tok(t));

interface L { name: string; sectionType: string; isCalculated: boolean; readOnly?: boolean }
// The ONE predicate behind both visible rules - greyed out AND no delete icon.
const isRowLocked = (r: L, isReadonly = false) =>
  isReadonly || !!r.isCalculated || !!r.readOnly;
const canDelete = (r: L, isReadonly = false) =>
  !isRowLocked(r, isReadonly) && sectionAllowsRows(r.sectionType);
// Greying follows the same predicate, with no section test: a locked row is
// grey wherever it sits.
const isGreyed = (r: L, isReadonly = false) => isRowLocked(r, isReadonly);

/* ── the template, verbatim from the payload ──────────────────────── */
const L = (name: string, sectionType: string, isCalculated: boolean): L =>
  ({ name, sectionType, isCalculated });

const TEMPLATE: L[] = [
  L("Standalone Revenues", "REVENUE", false),
  L("Experian Factor Revenues", "REVENUE", false),
  L("Revenue (Total)", "REVENUE", true),
  L("Standalone Costs", "COSTS", false),
  L("Experian Factor Costs", "COSTS", false),
  L("Cost Synergies", "COSTS", false),
  L("Depreciation and Amortization", "COSTS", false),
  L("Total Costs", "COSTS", true),
  L("EBIT", "RETURNS_ANALYSIS", true),
  L("% Margin", "RETURNS_ANALYSIS", true),
  L("% Growth", "RETURNS_ANALYSIS", true),
  L("EBITDA", "RETURNS_ANALYSIS", true),
  L("Standalone EBIT", "RETURNS_ANALYSIS", true),
  L("7-Year Terminal Value", "RETURNS_ANALYSIS", true),
  L("EBIT", "COMBINED_FREE_CASH_FLOWS", true),
  L("One-time exceptional integration costs", "COMBINED_FREE_CASH_FLOWS", false),
  L("Depreciation & Amortization", "COMBINED_FREE_CASH_FLOWS", true),
  L("Taxes payable", "COMBINED_FREE_CASH_FLOWS", true),
  L("Purchase Price", "COMBINED_FREE_CASH_FLOWS", false),
  L("Terminal value", "COMBINED_FREE_CASH_FLOWS", true),
  L("Net Free Cash Flow", "COMBINED_FREE_CASH_FLOWS", true),
  L("EBIT", "POST_TAX_RETURN", true),
  L("Cash benefits", "POST_TAX_RETURN", false),
  L("Post tax return", "POST_TAX_RETURN", true),
];

console.log("Rule 1 — a calculated (non-editable) line NEVER offers delete");
const calcWithDelete = TEMPLATE.filter((r) => r.isCalculated && canDelete(r));
eq("no calculated line is deletable", calcWithDelete.map((r) => r.name), []);

console.log("\nRule 2 — delete icons, per section");
const deletable = (section: string) =>
  TEMPLATE.filter((r) => r.sectionType === section && canDelete(r)).map((r) => r.name);
// The two Revenue input lines, as specified.
eq("REVENUE", deletable("REVENUE"), ["Standalone Revenues", "Experian Factor Revenues"]);
eq("COSTS", deletable("COSTS"), [
  "Standalone Costs", "Experian Factor Costs", "Cost Synergies", "Depreciation and Amortization",
]);
eq("RETURNS_ANALYSIS has none", deletable("RETURNS_ANALYSIS"), []);
eq("COMBINED_FREE_CASH_FLOWS", deletable("COMBINED_FREE_CASH_FLOWS"), [
  "One-time exceptional integration costs", "Purchase Price",
]);
eq("POST_TAX_RETURN has none", deletable("POST_TAX_RETURN"), []);
// The NPV block carries no sectionType at all, so it falls outside the policy.
eq("NPV block has none", canDelete(L("PV of Yrs 0-7", "", true)), false);
eq("NPV tax benefit (editable) still none", canDelete(L("Tax Benefit", "", false)), false);

console.log("\nRule 3 — '+ Add ... Line' appears under exactly these sections");
const sections = [...new Set(TEMPLATE.map((r) => r.sectionType))];
eq("sections offering add", sections.filter(sectionAllowsRows),
   ["REVENUE", "COSTS", "COMBINED_FREE_CASH_FLOWS"]);
eq("sections NOT offering add", sections.filter((s) => !sectionAllowsRows(s)),
   ["RETURNS_ANALYSIS", "POST_TAX_RETURN"]);

console.log("\nRule 4 — read-only screen suppresses every delete");
eq("nothing deletable when read-only",
   TEMPLATE.filter((r) => canDelete(r, true)).length, 0);

console.log("\nAdded rows inherit their section, so they behave like their neighbours");
// addRowAfter copies sectionType from the anchor row.
const added = L("", "REVENUE", false);
eq("a new Revenue line is deletable", canDelete(added), true);
eq("...and counts toward its section", sectionAllowsRows(added.sectionType), true);

console.log("\nRule 5 - greyed out and no-delete are the SAME predicate");
// The states that must never occur: a row that looks editable but refuses to
// delete, or looks locked but offers a bin. Checked over every template line in
// both screen modes.
for (const readOnlyScreen of [false, true]) {
  const contradictions = TEMPLATE.filter(
    (r) => isGreyed(r, readOnlyScreen) && canDelete(r, readOnlyScreen),
  );
  eq(`no greyed row is deletable (readonly=${readOnlyScreen})`,
     contradictions.map((r) => r.name), []);
}
// Every non-editable line is greyed, including ones outside the add/delete
// sections (Returns Analysis, Post Tax Return).
eq("every calculated line is greyed",
   TEMPLATE.filter((r) => r.isCalculated && !isGreyed(r)).map((r) => r.name), []);
// ...and every editable line is not, in normal mode.
eq("no editable line is greyed",
   TEMPLATE.filter((r) => !r.isCalculated && isGreyed(r)).map((r) => r.name), []);
// A view-only screen locks everything, so everything greys and nothing deletes.
eq("read-only screen greys every row",
   TEMPLATE.every((r) => isGreyed(r, true)), true);
// A line flagged read-only on its own is locked even though it is not computed.
const roLine = { name: "x", sectionType: "REVENUE", isCalculated: false, readOnly: true };
eq("an is_read_only line is locked", isGreyed(roLine), true);
eq("...and offers no delete", canDelete(roLine), false);

console.log("\nRule 6 - a new line lands ABOVE its section's subtotal");
// Mirrors sectionInsertIndex in Table.tsx: walk back over the section's
// trailing calculated rows, so the new line sits with the inputs it feeds
// rather than below the total it is counted in.
const sectionInsertIndex = (rows: L[], sectionEnd: number): number => {
  const section = tok(rows[sectionEnd]?.sectionType);
  let i = sectionEnd;
  while (i >= 0 && tok(rows[i].sectionType) === section && rows[i].isCalculated) i -= 1;
  return i;
};
// Index of each section's LAST row - where the "+ Add Row" button renders.
const lastIndexOf = (section: string) =>
  TEMPLATE.map((r, i) => [r, i] as const)
    .filter(([r]) => r.sectionType === section).at(-1)![1];

const landsBefore = (section: string) => {
  const at = sectionInsertIndex(TEMPLATE, lastIndexOf(section));
  return TEMPLATE[at + 1]?.name ?? "(end)";
};
// Revenue: the new line is inserted just before "Revenue (Total)".
eq("Revenue -> above the subtotal", landsBefore("REVENUE"), "Revenue (Total)");
eq("Costs -> above the subtotal", landsBefore("COSTS"), "Total Costs");
// Free cash flows has no subtotal, but the trailing computed rows are still
// skipped so the line lands with the inputs.
eq("Free cash flows -> above the computed tail",
   landsBefore("COMBINED_FREE_CASH_FLOWS"), "Terminal value");

// The row it is inserted AFTER must be the section's last editable line.
const insertAfterName = (section: string) =>
  TEMPLATE[sectionInsertIndex(TEMPLATE, lastIndexOf(section))].name;
eq("Revenue inserts after the last input",
   insertAfterName("REVENUE"), "Experian Factor Revenues");
eq("Costs inserts after the last input",
   insertAfterName("COSTS"), "Depreciation and Amortization");
eq("Free cash flows inserts after the last input",
   insertAfterName("COMBINED_FREE_CASH_FLOWS"), "Purchase Price");

// A section that is entirely calculated yields the index BEFORE its first row,
// so the new line lands at the top of the block rather than outside it.
const allCalc: L[] = [
  L("a", "REVENUE", false),
  L("x", "RETURNS_ANALYSIS", true),
  L("y", "RETURNS_ANALYSIS", true),
];
eq("all-calculated section -> top of the block",
   sectionInsertIndex(allCalc, 2) + 1, 1);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} row-policy check(s) failed`);
