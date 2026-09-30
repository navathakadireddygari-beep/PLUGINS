/**
 * End-to-end: add a row, type a label and some figures, save — does the label
 * actually reach the PUT body, and come back?
 *
 * Drives the REAL save path, no mocks of our own code:
 *   grid rows -> collectGridRows -> buildFinancialEvaluationPayload -> PUT body
 *                                -> mapFinancialEvaluation (the next GET)
 *
 * Run: npx tsx src/lib/new-row-save.check.ts
 */
import {
  buildFinancialEvaluationPayload,
  mapFinancialEvaluation,
  sectionIndexOfKey,
  type NewLineEdit,
} from "@/api/financial-api";
import { collectGridRows, type CollectableRow } from "@/lib/save-collect";
import type { FinancialEvaluationResponse } from "@/types";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(50)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`,
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
    FY.map((f) => [f, { spc_projected_amount: 1, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null }]),
  ),
});

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
      status: "ACTIVE",
      lines: [
        tmplLine("Standalone Revenues", "STANDALONE_REVENUES", 10, "N"),
        tmplLine("Experian Factor Revenues", "EXPERIAN_FACTOR_REVENUES", 20, "N"),
        tmplLine("Revenue (Total)", "REVENUE_TOTAL", 30, "Y"),
      ],
    },
  ],
  m_a_key_inputs: { inputs: [] },
  m_a_npv_calculation: { discount_rate_percent: null, components: [] },
} as unknown as FinancialEvaluationResponse;

/** The grid after "+ Add Row" under Revenue, with a label and figures typed. */
const gridWith = (label: string, values: string[] = ["11", "22", "33"]): CollectableRow[] => [
  { apiKey: "s0l0", label: "Standalone Revenues", values: ["1", "1", "1"] },
  { apiKey: "s0l1", label: "Experian Factor Revenues", values: ["1", "1", "1"] },
  { label, values },                                   // <- the added row
  { apiKey: "s0l2", label: "Revenue (Total)", values: ["1", "1", "1"] },
];

const save = (rows: CollectableRow[]) => {
  const yearValues: Record<string, Record<string, string>> = {};
  const newLines: NewLineEdit[] = [];
  collectGridRows(rows, COLS, FY, sectionIndexOfKey, yearValues, newLines);
  return {
    newLines,
    payload: buildFinancialEvaluationPayload(raw, { yearValues, newLines }),
  };
};
const linesOf = (payload: unknown): Array<Record<string, unknown>> =>
  ((payload as { sections?: Array<{ lines?: unknown }> }).sections?.[0]?.lines ??
    []) as Array<Record<string, unknown>>;

/* ── 1. the label reaches the collected edit ─────────────────────────── */
console.log("1. Grid row -> NewLineEdit");
{
  const { newLines } = save(gridWith("Licensing revenue"));
  eq("one new line collected", newLines.length, 1);
  eq("name is the typed label", newLines[0]?.name, "Licensing revenue");
  eq("section is Revenue (index 0)", newLines[0]?.sectionIndex, 0);
  eq("anchored under the last input", newLines[0]?.afterKey, "s0l1");
  eq("values keyed by fiscal year", newLines[0]?.yearValues, {
    fy25: "11", fy26: "22", fy27: "33",
  });
}

/* ── 2. the label reaches the PUT body ───────────────────────────────── */
console.log("\n2. NewLineEdit -> PUT body");
{
  const { payload } = save(gridWith("Licensing revenue"));
  const added = linesOf(payload).find(
    (l) => l.line_item_name === "Licensing revenue",
  );
  eq("line_item_name is in the body", added?.line_item_name, "Licensing revenue");
  eq("sent as a new row (null id)", added?.fin_eval_line_id, null);
  eq("flagged custom", added?.is_custom, "Y");
  eq("not calculated", added?.is_calculated, "N");
  // The owning section is stated explicitly, as it is on every echoed template
  // line — not left for the backend to infer from the nesting.
  eq("carries the owning section id", added?.fin_eval_section_id, 1);
  eq("carries a language code", added?.language_code, "EN");
  // Figures ride along with the label.
  const yv = added?.year_values as Record<string, { spc_projected_amount: number | null }>;
  eq("fy25 amount", yv?.fy25?.spc_projected_amount, 11);
  eq("fy26 amount", yv?.fy26?.spc_projected_amount, 22);
  eq("fy27 amount", yv?.fy27?.spc_projected_amount, 33);
  eq("total is summed", yv?.total?.spc_projected_amount, 66);
}

/* ── 3. the label survives the round trip ────────────────────────────── */
console.log("\n3. PUT body -> next GET");
{
  const { payload } = save(gridWith("Licensing revenue"));
  const reloaded = mapFinancialEvaluation(payload as FinancialEvaluationResponse);
  eq("label comes back", reloaded.cor.map((r) => r.label), [
    "Standalone Revenues",
    "Experian Factor Revenues",
    "Licensing revenue",
    "Revenue (Total)",
  ]);
  const back = reloaded.cor.find((r) => r.label === "Licensing revenue");
  eq("values come back", back?.yearValues, { fy25: "11", fy26: "22", fy27: "33" });
  eq("editable on reload", back?.isCalculated, false);
  eq("deletable on reload (is_custom Y)", back?.isCustom, true);
}

/* ── 4. labels that could trip the payload ───────────────────────────── */
console.log("\n4. Awkward labels");
for (const label of [
  "  Padded label  ",
  "Ünïcodé & symbols <>&\"'",
  "A very long label that runs well past the width of the label column",
  "123",
  "Revenue (Total)", // duplicates a template name
]) {
  const { payload } = save(gridWith(label));
  const names = linesOf(payload).map((l) => l.line_item_name);
  eq(`kept: ${JSON.stringify(label.slice(0, 28))}`,
     names.includes(label.trim()), true);
}
// Whitespace is trimmed, not preserved.
{
  const { newLines } = save(gridWith("  Padded label  "));
  eq("leading/trailing space trimmed", newLines[0]?.name, "Padded label");
}

/* ── 5. rows that must NOT be sent ───────────────────────────────────── */
console.log("\n5. Unnamed rows are placeholders, not data");
for (const [label, why] of [["", "empty"], ["   ", "whitespace only"]] as const) {
  const { newLines, payload } = save(gridWith(label));
  eq(`${why} label -> not collected`, newLines.length, 0);
  eq(`${why} label -> not in the body`, linesOf(payload).length, 3);
}
// A row added before any template row has no section to attach to.
{
  const orphan: CollectableRow[] = [
    { label: "Stranded", values: ["1", "1", "1"] },
    { apiKey: "s0l0", label: "Standalone Revenues", values: ["1", "1", "1"] },
  ];
  const yearValues: Record<string, Record<string, string>> = {};
  const newLines: NewLineEdit[] = [];
  collectGridRows(orphan, COLS, FY, sectionIndexOfKey, yearValues, newLines);
  eq("row above every template row is skipped", newLines.length, 0);
}

/* ── 6. edits to existing rows still ride along ──────────────────────── */
console.log("\n6. The added row does not disturb the template rows");
{
  const rows = gridWith("Licensing revenue");
  rows[0] = { ...rows[0], values: ["99", "99", "99"] }; // edit an existing line
  const { payload } = save(rows);
  const standalone = linesOf(payload).find(
    (l) => l.line_item_code === "STANDALONE_REVENUES",
  );
  const yv = standalone?.year_values as Record<string, { spc_projected_amount: number | null }>;
  eq("edited template row still sent", yv?.fy25?.spc_projected_amount, 99);
  eq("all four lines present", linesOf(payload).length, 4);
}

/* -- 7. shape parity: the reference, and MA's own existing lines -- */
console.log("\n7. New line's shape vs the reference (Prod Dev buildPutPayload)");
{
  const { payload } = save(gridWith("Licensing revenue"));
  const lines = linesOf(payload);
  const added = lines.find((l) => l.line_item_name === "Licensing revenue")!;
  const existing = lines.find((l) => l.line_item_code === "STANDALONE_REVENUES")!;

  // Every field Prod Dev's buildPutPayload emits for a line, with the value it
  // would emit for a brand new custom row.
  const REFERENCE: Array<[string, unknown]> = [
    ["fin_eval_line_id", null],       // value.lineId ?? null
    ["fin_eval_section_id", 1],       // group.sectionId
    ["line_type", "CUSTOM"],          // value.lineType || "CUSTOM"
    ["line_item_name", "Licensing revenue"],
    ["line_identifier", "FINANCIAL"], // (... ?? "FINANCIAL").toUpperCase()
    ["is_calculated", "N"],
    ["is_custom", "Y"],
    ["account", null],
    ["status", "ACTIVE"],
    ["language_code", "EN"],
  ];
  for (const [field, want] of REFERENCE) {
    eq(`  ${field}`, added[field], want);
  }
  // display_order is positional in both; here the row is third of four.
  eq("  display_order (positional)", added.display_order, 30);
  // year_values carries a `total` bucket, as the reference's does.
  eq("  year_values has a total bucket",
     Object.prototype.hasOwnProperty.call(added.year_values as object, "total"), true);

  // Strongest check: a new line must not differ from an ECHOED line in any
  // field that is not about identity or position. Those are the differences
  // that make a backend treat the two rows differently.
  const IDENTITY = new Set([
    "fin_eval_line_id", "template_fin_eval_line_id", "line_item_name",
    "line_item_code", "line_type", "display_order", "year_values",
    "is_calculated", "is_custom", "is_mandatory",
  ]);
  const missing = Object.keys(existing).filter(
    (k) => !IDENTITY.has(k) && !(k in added),
  );
  eq("no field the echoed lines send is missing", missing, []);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} new-row-save check(s) failed`);
