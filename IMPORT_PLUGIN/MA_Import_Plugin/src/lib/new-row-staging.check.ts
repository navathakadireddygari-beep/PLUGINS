/**
 * End-to-end through the layer new-row-save.check.ts does NOT cover: the
 * staging envelope wrapper (buildFinEvaluationStagingPayload), which is what
 * MA_Import_Plugin's Validate button actually PUTs over the wire.
 *
 *   grid rows -> collectGridRows -> buildFinancialEvaluationPayload
 *             -> buildFinEvaluationStagingPayload (the PUT body) -> mapStagingEnvelope (next GET)
 *
 * Run: npx tsx --tsconfig tsconfig.app.json src/lib/new-row-staging.check.ts
 */
import {
  buildFinancialEvaluationPayload,
  sectionIndexOfKey,
  type NewLineEdit,
} from "@/api/financial-api";
import { collectGridRows, type CollectableRow } from "@/lib/save-collect";
import {
  buildFinEvaluationStagingPayload,
  mapStagingEnvelope,
} from "@/api/staging-api";
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

// A staging line/section, in the `_stg_id` spelling every staging GET uses.
const tmplLine = (name: string, code: string, order: number, calc: "Y" | "N") => ({
  fin_eval_line_stg_id: order,
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

// The staging ENVELOPE shape (data.header.sections[].lines[]), as the real
// GET {base}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X returns it.
const envelope = {
  apiStatus: "S",
  data: {
    file: { file_id: 9, proposal_id: 5, file_name: "M&A quick test" },
    header: {
      fin_eval_header_stg_id: 1,
      display_years: 2,
      local_currency: "USD",
      display_currency: "USD",
      sections: [
        {
          fin_eval_section_stg_id: 1,
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
    },
  },
};

/* ── 1. GET -> screen model (establishes detectedIdStyle = "stg") ────── */
console.log("1. Staging GET -> screen model");
const model = mapStagingEnvelope(envelope as any);
eq("one section", model.raw?.sections?.length, 1);
const raw = model.raw as unknown as FinancialEvaluationResponse;

/* ── 2. "+ Add Row": grid rows -> collectGridRows -> payload ─────────── */
console.log("\n2. Add a row under Revenue, collect + build the inner payload");
const rows: CollectableRow[] = [
  { apiKey: "s0l0", label: "Standalone Revenues", values: ["1", "1", "1"] },
  { apiKey: "s0l1", label: "Experian Factor Revenues", values: ["1", "1", "1"] },
  { label: "Licensing revenue", values: ["11", "22", "33"] }, // <- the added row
  { apiKey: "s0l2", label: "Revenue (Total)", values: ["1", "1", "1"] },
];
const yearValues: Record<string, Record<string, string>> = {};
const newLines: NewLineEdit[] = [];
collectGridRows(rows, COLS, FY, sectionIndexOfKey, yearValues, newLines);
eq("one new line collected off the grid", newLines.length, 1);

const innerPayload = buildFinancialEvaluationPayload(raw, { yearValues, newLines });
const innerLines = (innerPayload as any).sections[0].lines as Array<Record<string, unknown>>;
eq("inner payload has 4 lines", innerLines.length, 4);
eq("inner payload carries the new name", innerLines.map((l) => l.line_item_name), [
  "Standalone Revenues", "Experian Factor Revenues", "Licensing revenue", "Revenue (Total)",
]);

/* ── 3. inner payload -> the ACTUAL staging PUT body ──────────────────── */
console.log("\n3. Inner payload -> buildFinEvaluationStagingPayload (the real PUT body)");
const stagingBody = buildFinEvaluationStagingPayload(innerPayload);
const stagingLines = (stagingBody.header as any).sections[0].lines as Array<Record<string, unknown>>;
eq("PUT body has 4 lines", stagingLines.length, 4);
eq("PUT body carries the new name", stagingLines.map((l) => l.lineItemName), [
  "Standalone Revenues", "Experian Factor Revenues", "Licensing revenue", "Revenue (Total)",
]);
const newStagingLine = stagingLines.find((l) => l.lineItemName === "Licensing revenue");
eq("new line's stg id is null (so the backend inserts)", newStagingLine?.finEvalLineStgId, null);
eq("new line carries its owning section's stg id", newStagingLine?.finEvalSectionStgId, 1);
eq("new line's year values keyed camelCase, contents snake_case", newStagingLine?.yearValues, {
  fy25: { spc_projected_amount: 11, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null },
  fy26: { spc_projected_amount: 22, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null },
  fy27: { spc_projected_amount: 33, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null },
  total: { spc_projected_amount: 66, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null },
});

/* ── 4. if the backend echoed this PUT body straight back as a GET ───── */
console.log("\n4. PUT body -> mapStagingEnvelope (simulating the next GET)");
const echoedEnvelope = {
  apiStatus: "S",
  data: { file: envelope.data.file, header: stagingBody.header },
};
const reloaded = mapStagingEnvelope(echoedEnvelope as any);
eq("4 lines come back in the cor grid", reloaded.cor.length, 4);
eq("new line's label survives the round trip", reloaded.cor.map((r) => r.label), [
  "Standalone Revenues", "Experian Factor Revenues", "Licensing revenue", "Revenue (Total)",
]);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} new-row-staging check(s) failed`);
