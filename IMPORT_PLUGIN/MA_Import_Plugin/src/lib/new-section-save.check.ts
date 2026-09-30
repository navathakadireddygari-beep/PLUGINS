/**
 * End-to-end: add a SECTION, name it, type rows into it, save — does the whole
 * block reach the PUT body, and does it come back in the same place?
 *
 * Drives the real save path, no mocks of our own code:
 *   grid rows -> collectGridRows -> buildFinancialEvaluationPayload -> PUT body
 *                                -> mapFinancialEvaluation (the next GET)
 *
 * The round trip is the point. A new section that saves but reappears under a
 * different grid, or merged into the section beside it, is indistinguishable
 * from a save that failed.
 *
 * Run: npx tsx --tsconfig tsconfig.app.json src/lib/new-section-save.check.ts
 */
import {
  buildFinancialEvaluationPayload,
  mapFinancialEvaluation,
  sectionIndexOfKey,
  type NewLineEdit,
  type NewSectionEdit,
} from "@/api/financial-api";
import {
  collectGridRows,
  type CollectableRow,
  type NewSectionDraft,
} from "@/lib/save-collect";
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

const FY = ["fy25", "fy26", "fy27"];
const COLS = [0, 1, 2];

const tmplLine = (name: string, code: string, order: number, calc: "Y" | "N") => ({
  fin_eval_line_id: order,
  line_item_name: name,
  line_item_code: code,
  line_type: null,
  line_identifier: "Financial",
  is_calculated: calc,
  is_read_only: "N",
  is_mandatory: "Y",
  is_custom: "N",
  display_order: order,
  status: "ACTIVE",
  year_values: Object.fromEntries(
    FY.map((f) => [
      f,
      { spc_projected_amount: 1, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null },
    ]),
  ),
});

/** Revenue then Returns Analysis, i.e. the first grid's real shape. */
const raw = {
  display_years: 2,
  local_currency: "USD",
  display_currency: "USD",
  sections: [
    {
      fin_eval_section_id: 1,
      section_name: "Revenue",
      section_type: "REVENUE",
      display_order: 10,
      is_new_line_required: "Y",
      status: "ACTIVE",
      lines: [
        tmplLine("Standalone Revenues", "STANDALONE_REVENUES", 10, "N"),
        tmplLine("Revenue (Total)", "REVENUE_TOTAL", 20, "Y"),
      ],
    },
    {
      fin_eval_section_id: 2,
      section_name: "Returns Analysis",
      section_type: "RETURNS_ANALYSIS",
      display_order: 20,
      is_new_line_required: "N",
      status: "ACTIVE",
      lines: [tmplLine("EBIT", "EBIT", 10, "Y")],
    },
  ],
  m_a_key_inputs: { inputs: [] },
  m_a_npv_calculation: { discount_rate_percent: null, components: [] },
} as unknown as FinancialEvaluationResponse;

/**
 * The first grid after "+ Add Section", a name typed into the bar and two rows
 * typed into it — one filled in, one left blank as the section was created with.
 */
const gridWith = (sectionName: string): CollectableRow[] => [
  { apiKey: "s0l0", label: "Standalone Revenues", values: ["1", "1", "1"] },
  { apiKey: "s0l1", label: "Revenue (Total)", values: ["1", "1", "1"] },
  { apiKey: "s1l0", label: "EBIT", values: ["1", "1", "1"] },
  { newSectionId: "sec1", sectionName, label: "Licence fees", values: ["11", "22", "33"] },
  { newSectionId: "sec1", sectionName, label: "  ", values: ["", "", ""] },
];

const save = (sectionName: string) => {
  const rows: CollectableRow[] = gridWith(sectionName);
  const yearValues: Record<string, Record<string, string>> = {};
  const newLines: NewLineEdit[] = [];
  const drafts: Record<string, NewSectionDraft> = {};
  collectGridRows(rows, COLS, FY, sectionIndexOfKey, yearValues, newLines, drafts);
  const newSections: NewSectionEdit[] = Object.entries(drafts).map(
    ([id, draft]) => ({ id, name: draft.name, lines: draft.lines }),
  );
  return {
    newLines,
    newSections,
    payload: buildFinancialEvaluationPayload(raw, { yearValues, newLines, newSections }),
  };
};

const sectionsOf = (payload: unknown): Array<Record<string, unknown>> =>
  ((payload as { sections?: unknown[] }).sections ?? []) as Array<Record<string, unknown>>;

/* ── 1. the section reaches the collected edit ───────────────────────── */
console.log("1. Grid rows -> NewSectionEdit");
{
  const { newSections, newLines } = save("Other income");
  eq("one section collected", newSections.length, 1);
  eq("name is what was typed", newSections[0]?.name, "Other income");
  eq("only the named row is carried", newSections[0]?.lines.length, 1);
  eq("row name", newSections[0]?.lines[0]?.name, "Licence fees");
  eq("row values keyed by fiscal year", newSections[0]?.lines[0]?.yearValues, {
    fy25: "11", fy26: "22", fy27: "33",
  });
  // The trap this exists for: without the newSectionId branch these rows are
  // filed under the last template section above them — Returns Analysis, which
  // takes no lines at all.
  eq("nothing leaked into newLines", newLines, []);
}

/* ── 2. the section reaches the PUT body ─────────────────────────────── */
console.log("\n2. NewSectionEdit -> PUT body");
{
  const { payload } = save("Other income");
  const sections = sectionsOf(payload);
  eq("appended after the template sections", sections.length, 3);
  const added = sections[2];
  eq("name", added.section_name, "Other income");
  eq("type is CUSTOM", added.section_type, "CUSTOM");
  eq("id left for the database", added.fin_eval_section_id, null);
  eq("flagged custom", added.is_custom, "Y");
  eq("still takes lines", added.is_new_line_required, "Y");
  eq("active", added.status, "ACTIVE");
  // Past the highest the response used (20), so the GET sorts it last.
  eq("display_order sorts to the bottom", added.display_order, 30);

  const lines = added.lines as Array<Record<string, unknown>>;
  eq("one line", lines.length, 1);
  eq("line name", lines[0].line_item_name, "Licence fees");
  eq("line id left for the database", lines[0].fin_eval_line_id, null);
  eq("line is the user's", lines[0].is_custom, "Y");
  eq("line is editable", lines[0].is_calculated, "N");
  eq(
    "fy26 value survived the unit round trip",
    (lines[0].year_values as Record<string, { spc_projected_amount: number }>).fy26
      .spc_projected_amount,
    22,
  );
  eq(
    "total bucket is the sum of the years",
    (lines[0].year_values as Record<string, { spc_projected_amount: number }>).total
      .spc_projected_amount,
    66,
  );
  // The template sections must come through untouched.
  eq("Revenue still first", sections[0].section_name, "Revenue");
  eq("Returns Analysis still second", sections[1].section_name, "Returns Analysis");
}

/* ── 3. an unnamed section is a placeholder, not data ────────────────── */
console.log("\n3. Unnamed section is not saved");
{
  const { payload } = save("   ");
  eq("nothing appended", sectionsOf(payload).length, 2);
}

/* ── 4. round trip: the section comes back where the screen put it ───── */
console.log("\n4. PUT body -> next GET");
{
  const { payload } = save("Other income");
  const model = mapFinancialEvaluation(payload as unknown as FinancialEvaluationResponse);
  // CUSTOM is unmapped in SECTION_GRID, so the fallback puts it in the first
  // grid — which is where the screen shows it. If this ever changes, an added
  // section jumps to another table on reload.
  eq("lands in the first grid", model.cor.length, 4);
  const row = model.cor[3];
  eq("last row is the added one", row.label, "Licence fees");
  eq("under its own section", row.sectionName, "Other income");
  eq("marked custom, so it stays renameable", row.sectionIsCustom, true);
  eq("section still takes lines", row.allowsNewLines, true);
  eq("editable", row.readOnly, false);
  eq("fcf/ptr untouched", [model.fcf.length, model.ptr.length], [0, 0]);

  // Section identity is positional, so two CUSTOM sections never merge.
  eq("section key is its position", row.sectionKey, "s2");
  eq("Revenue keeps its own key", model.cor[0].sectionKey, "s0");
}

/* ── 5. rename and delete of a section the server already knows ──────── */
console.log("\n5. Rename / delete an existing section");
{
  const renamed = buildFinancialEvaluationPayload(raw, {
    sectionNames: { "1": "Return Analysis (revised)" },
  });
  const sections = sectionsOf(renamed);
  eq("the named section moved", sections[1].section_name, "Return Analysis (revised)");
  eq("its neighbour did not", sections[0].section_name, "Revenue");

  const dropped = buildFinancialEvaluationPayload(raw, { deletedSectionIds: [2] });
  eq("deleted section is gone", sectionsOf(dropped).length, 1);
  eq("the survivor is Revenue", sectionsOf(dropped)[0].section_name, "Revenue");

  // Indices must be read against the ORIGINAL positions, so a delete cannot
  // re-point another section's edits.
  const both = buildFinancialEvaluationPayload(raw, {
    deletedSectionIds: [2],
    sectionNames: { "0": "Revenue (renamed)" },
  });
  eq("edit still lands on section 0", sectionsOf(both)[0].section_name, "Revenue (renamed)");
}

console.log(`\n${pass} passed, ${fail} failed`);
