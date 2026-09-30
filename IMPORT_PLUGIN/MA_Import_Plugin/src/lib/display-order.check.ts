/**
 * Checks that a row added on screen SURVIVES the save → reload round trip in
 * the position the user put it.
 *
 * The grid inserts a new line above its section's subtotal, because a line that
 * feeds "Revenue (Total)" has to sit above it. `display_order` is the only
 * thing carrying that position to the server, and `mapFinancialEvaluation`
 * sorts by it on the way back — so this is the property that decides whether
 * the placement is real or just cosmetic until the next reload.
 *
 * Run: npx tsx src/lib/display-order.check.ts
 */
import {
  buildFinancialEvaluationPayload,
  mapFinancialEvaluation,
  type NewLineEdit,
} from "@/api/financial-api";
import type { FinancialEvaluationResponse } from "@/types";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(50)}\n         got=${JSON.stringify(got)}\n        want=${JSON.stringify(want)}`,
  );
};

const line = (
  name: string,
  code: string,
  order: number,
  isCalculated: "Y" | "N",
) => ({
  fin_eval_line_id: order,
  line_item_name: name,
  line_item_code: code,
  line_type: null,
  line_identifier: "Financial",
  is_calculated: isCalculated,
  is_read_only: "N",
  is_mandatory: "N",
  is_custom: "N",
  display_order: order,
  status: "ACTIVE",
  year_values: { fy26: { spc_projected_amount: 1, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null } },
});

/** The Revenue section as the template ships it: two inputs, then the total. */
const raw = {
  display_years: 8,
  local_currency: "USD",
  display_currency: "USD",
  sections: [
    {
      fin_eval_section_id: 1,
      section_name: "Revenue",
      section_type: "REVENUE",
      display_order: 10,
      status: "ACTIVE",
      lines: [
        line("Standalone Revenues", "STANDALONE_REVENUES", 10, "N"),
        line("Experian Factor Revenues", "EXPERIAN_FACTOR_REVENUES", 20, "N"),
        line("Revenue (Total)", "REVENUE_TOTAL", 30, "Y"),
      ],
    },
  ],
  m_a_key_inputs: { inputs: [] },
  m_a_npv_calculation: { discount_rate_percent: null, components: [] },
} as unknown as FinancialEvaluationResponse;

/** Row names in the order the screen would render them after a reload. */
const afterReload = (payload: unknown): string[] =>
  mapFinancialEvaluation(payload as FinancialEvaluationResponse).cor.map(
    (r) => r.label,
  );

console.log("Baseline — no edits, order preserved");
eq(
  "template order round-trips",
  afterReload(buildFinancialEvaluationPayload(raw)),
  ["Standalone Revenues", "Experian Factor Revenues", "Revenue (Total)"],
);

console.log("\nA new line added ABOVE the subtotal stays above it");
// What the grid produces: the row sits under "Experian Factor Revenues"
// (section 0, line 1) and above the total.
const added: NewLineEdit = {
  sectionIndex: 0,
  name: "My new revenue line",
  yearValues: { fy26: "5" },
  afterKey: "s0l1",
};
const saved = buildFinancialEvaluationPayload(raw, { newLines: [added] });
eq("position survives save + reload", afterReload(saved), [
  "Standalone Revenues",
  "Experian Factor Revenues",
  "My new revenue line",
  "Revenue (Total)",
]);
// The defect this guards: appending at max+10 put it last.
eq(
  "NOT below the subtotal",
  afterReload(saved).at(-1),
  "Revenue (Total)",
);

console.log("\ndisplay_order is renumbered in screen order");
/** Lines of the first section, as loose records (the payload echoes extras). */
const linesOf = (payload: unknown): Array<Record<string, unknown>> =>
  ((payload as { sections?: Array<{ lines?: unknown }> }).sections?.[0]
    ?.lines ?? []) as Array<Record<string, unknown>>;

const orders = linesOf(saved).map((l) => [l.line_item_name, l.display_order]);
eq("renumbered by tens", orders, [
  ["Standalone Revenues", 10],
  ["Experian Factor Revenues", 20],
  ["My new revenue line", 30],
  ["Revenue (Total)", 40],
]);
// A brand new row must carry no id, so the database inserts rather than matches.
eq(
  "the new line has a null id",
  linesOf(saved).find((l) => l.line_item_name === "My new revenue line")
    ?.fin_eval_line_id,
  null,
);

console.log("\nTwo rows added in the same gap keep their order and don't collide");
const two = buildFinancialEvaluationPayload(raw, {
  newLines: [
    { sectionIndex: 0, name: "First added", yearValues: {}, afterKey: "s0l1" },
    { sectionIndex: 0, name: "Second added", yearValues: {}, afterKey: "s0l1" },
  ],
});
eq("both land above the subtotal, in order", afterReload(two), [
  "Standalone Revenues",
  "Experian Factor Revenues",
  "First added",
  "Second added",
  "Revenue (Total)",
]);
const twoOrders = linesOf(two).map((l) => l.display_order);
eq("orders are distinct", new Set(twoOrders).size, twoOrders.length);

console.log("\nNo anchor falls back to the end rather than losing the row");
const noAnchor = buildFinancialEvaluationPayload(raw, {
  newLines: [{ sectionIndex: 0, name: "Orphan", yearValues: {} }],
});
eq("row is still saved", afterReload(noAnchor).includes("Orphan"), true);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} display-order check(s) failed`);
