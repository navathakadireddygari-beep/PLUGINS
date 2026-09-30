/**
 * The reported sequence: add a row, save, reload (fine) — then DELETE it, save,
 * reload, and watch it come back.
 *
 * Cause: the PUT is assembled by echoing back the lines the last GET returned,
 * and that response still contains the deleted row. Deleting and reloading
 * WITHOUT saving looked fine, which is what made it read as a save bug.
 *
 * Run: npx tsx src/lib/delete-save.check.ts
 */
import {
  buildFinancialEvaluationPayload,
  mapFinancialEvaluation,
} from "@/api/financial-api";
import type { FinancialEvaluationResponse } from "@/types";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(52)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`,
  );
};

const line = (id: number, name: string, order: number, calc: "Y" | "N", custom: "Y" | "N") => ({
  fin_eval_line_id: id,
  fin_eval_section_id: 9745,
  line_type: custom === "Y" ? "CUSTOM" : name.toUpperCase().replace(/\W+/g, "_"),
  line_item_name: name,
  line_identifier: "FINANCIAL",
  is_calculated: calc,
  is_custom: custom,
  is_read_only: calc === "Y" ? "Y" : "N",
  account: null,
  display_order: order,
  status: "ACTIVE",
  language_code: "EN",
  year_values: { fy26: { spc_projected_amount: 1, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null } },
});

/** The GET after the add was saved — "Temp" (id 15013) is now a real line. */
const raw = {
  display_years: 7,
  local_currency: "USD",
  display_currency: "USD",
  sections: [
    {
      fin_eval_section_id: 9745,
      section_name: "Revenue",
      section_type: "REVENUE",
      is_new_line_required: "Y",
      display_order: 10,
      status: "ACTIVE",
      lines: [
        line(14836, "Standalone Revenues", 10, "N", "N"),
        line(14837, "Experian Factor Revenues", 20, "N", "N"),
        line(15013, "Temp", 30, "N", "Y"),          // <- the added row
        line(14838, "Revenue", 40, "Y", "N"),        // REVENUE_TOTAL
      ],
    },
  ],
  m_a_key_inputs: { inputs: [] },
  m_a_npv_calculation: { discount_rate_percent: null, components: [] },
} as unknown as FinancialEvaluationResponse;

const namesAfterReload = (payload: unknown): string[] =>
  mapFinancialEvaluation(payload as FinancialEvaluationResponse).cor.map((r) => r.label);

console.log("Before deleting — the saved row is there");
eq("row present", namesAfterReload(buildFinancialEvaluationPayload(raw)).includes("Temp"), true);

console.log("\nDelete 'Temp' (id 15013), then SAVE");
{
  // The screen removed the row locally, so it is simply not in the collected
  // edits — which on its own is NOT enough, because the builder echoes `raw`.
  const withoutTracking = buildFinancialEvaluationPayload(raw, {});
  eq("echoing raw alone resurrects it",
     namesAfterReload(withoutTracking).includes("Temp"), true);

  // With the deleted id tracked, the line is left out of the PUT.
  const tracked = buildFinancialEvaluationPayload(raw, { deletedLineIds: [15013] });
  eq("tracked delete -> row is GONE", namesAfterReload(tracked).includes("Temp"), false);
  eq("the other rows survive", namesAfterReload(tracked),
     ["Standalone Revenues", "Experian Factor Revenues", "Revenue"]);
}

console.log("\nDeleting does not disturb anything else");
{
  const p = buildFinancialEvaluationPayload(raw, { deletedLineIds: [15013] });
  const lines = ((p as { sections?: Array<{ lines?: unknown }> }).sections?.[0]?.lines ??
    []) as Array<Record<string, unknown>>;
  eq("three lines remain", lines.length, 3);
  // Surviving ids are untouched.
  eq("ids preserved", lines.map((l) => l.fin_eval_line_id), [14836, 14837, 14838]);
  // ...and renumbered contiguously, so no gap is left where the row was.
  eq("display_order closed up", lines.map((l) => l.display_order), [10, 20, 30]);
}

console.log("\nEdits still land on the RIGHT rows after a delete");
{
  // s0l1 is "Experian Factor Revenues" by its ORIGINAL index. Deleting the row
  // below it must not shift that mapping.
  const p = buildFinancialEvaluationPayload(raw, {
    deletedLineIds: [15013],
    yearValues: { s0l1: { fy26: "999" } },
  });
  const lines = ((p as { sections?: Array<{ lines?: unknown }> }).sections?.[0]?.lines ??
    []) as Array<Record<string, unknown>>;
  const edited = lines.find((l) => l.line_item_name === "Experian Factor Revenues");
  const yv = edited?.year_values as Record<string, { spc_projected_amount: number | null }>;
  eq("edit landed on the intended row", yv?.fy26?.spc_projected_amount, 999);
  // And nothing leaked onto its neighbour.
  const neighbour = lines.find((l) => l.line_item_name === "Standalone Revenues");
  const nyv = neighbour?.year_values as Record<string, { spc_projected_amount: number | null }>;
  eq("neighbour untouched", nyv?.fy26?.spc_projected_amount, 1);
}

console.log("\nA row added AFTER a delete still anchors correctly");
{
  // Delete "Temp", then add a new line under "Experian Factor Revenues" (s0l1).
  const p = buildFinancialEvaluationPayload(raw, {
    deletedLineIds: [15013],
    newLines: [{ sectionIndex: 0, name: "Fresh line", yearValues: {}, afterKey: "s0l1" }],
  });
  eq("lands above the subtotal, not at the end", namesAfterReload(p), [
    "Standalone Revenues",
    "Experian Factor Revenues",
    "Fresh line",
    "Revenue",
  ]);
}

console.log("\nDeleting several rows at once");
{
  const p = buildFinancialEvaluationPayload(raw, { deletedLineIds: [15013, 14837] });
  eq("both gone", namesAfterReload(p), ["Standalone Revenues", "Revenue"]);
}

console.log("\nAn unknown id is harmless");
{
  const p = buildFinancialEvaluationPayload(raw, { deletedLineIds: [999999] });
  eq("nothing removed", namesAfterReload(p).length, 4);
}

console.log("\nSOFT delete: the row comes back as status INACTIVE");
{
  // The other route to the same symptom. If the backend retires a line rather
  // than removing it, the NEXT GET still contains it, flagged INACTIVE.
  const softDeleted = JSON.parse(JSON.stringify(raw)) as FinancialEvaluationResponse;
  const lines = ((softDeleted.sections ?? [])[0].lines ??
    []) as unknown as Array<Record<string, unknown>>;
  const temp = lines.find((l) => l.line_item_name === "Temp")!;
  temp.status = "INACTIVE";

  // The grid already hides it - which is why deleting then RELOADING looked
  // fine and hid the bug.
  eq("grid hides an INACTIVE row", namesAfterReload(softDeleted).includes("Temp"), false);

  // ...but the payload used to echo it straight back, handing the backend a
  // row it had retired. It must not appear in the save at all.
  const p2 = buildFinancialEvaluationPayload(softDeleted, {});
  const sent = ((p2 as { sections?: Array<{ lines?: unknown }> }).sections?.[0]?.lines ??
    []) as Array<Record<string, unknown>>;
  eq("INACTIVE row is NOT sent", sent.some((l) => l.line_item_name === "Temp"), false);
  eq("only the live rows are sent", sent.map((l) => l.line_item_name),
     ["Standalone Revenues", "Experian Factor Revenues", "Revenue"]);
  // And it does not come back on the reload after that save.
  eq("still gone after save + reload", namesAfterReload(p2).includes("Temp"), false);
}

console.log("\nAn INACTIVE row does not shift the edit mapping");
{
  const softDeleted = JSON.parse(JSON.stringify(raw)) as FinancialEvaluationResponse;
  const lines = ((softDeleted.sections ?? [])[0].lines ??
    []) as unknown as Array<Record<string, unknown>>;
  // Retire the SECOND row, so anything keyed by position would slip.
  lines.find((l) => l.line_item_name === "Experian Factor Revenues")!.status = "INACTIVE";
  // s0l2 is "Temp" by its ORIGINAL index, which is how the grid keys it.
  const p3 = buildFinancialEvaluationPayload(softDeleted, {
    yearValues: { s0l2: { fy26: "777" } },
  });
  const sent = ((p3 as { sections?: Array<{ lines?: unknown }> }).sections?.[0]?.lines ??
    []) as Array<Record<string, unknown>>;
  const edited = sent.find((l) => l.line_item_name === "Temp");
  const yv = edited?.year_values as Record<string, { spc_projected_amount: number | null }>;
  eq("edit still lands on 'Temp'", yv?.fy26?.spc_projected_amount, 777);
  const other = sent.find((l) => l.line_item_name === "Standalone Revenues");
  const oyv = other?.year_values as Record<string, { spc_projected_amount: number | null }>;
  eq("no leak onto a neighbour", oyv?.fy26?.spc_projected_amount, 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} delete-save check(s) failed`);
