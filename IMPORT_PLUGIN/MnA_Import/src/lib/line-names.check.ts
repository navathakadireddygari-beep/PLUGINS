/**
 * Renaming — or clearing — the label of a line the server already has must
 * reach the PUT. The builder used to echo every existing line's name from the
 * GET, so a cleared label still went out as the old name.
 */
import { buildFinancialEvaluationPayload } from "@/api/financial-api";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};

const raw = {
  sections: [
    {
      fin_eval_section_id: 1,
      section_name: "Revenue",
      section_type: "REVENUE",
      display_order: 1,
      lines: [
        { fin_eval_line_id: 11, line_item_name: "Standalone Revenues", is_custom: "N", year_values: {} },
        { fin_eval_line_id: 12, line_item_name: "Experian Factor Revenues", is_custom: "N", year_values: {} },
        { fin_eval_line_id: 13, line_item_name: "Licensing", is_custom: "Y", year_values: {} },
      ],
    },
  ],
} as unknown as Parameters<typeof buildFinancialEvaluationPayload>[0];

const namesOf = (p: unknown): unknown[] =>
  (((p as { sections?: Array<{ lines?: Array<Record<string, unknown>> }> }).sections?.[0]?.lines) ?? [])
    .map((l) => l.line_item_name);

eq("no edits -> names echoed", namesOf(buildFinancialEvaluationPayload(raw, {})),
  ["Standalone Revenues", "Experian Factor Revenues", "Licensing"]);

eq("cleared template label -> sent as empty", namesOf(buildFinancialEvaluationPayload(raw, {
  lineNames: { s0l0: "", s0l1: "Experian Factor Revenues", s0l2: "Licensing" },
})), ["", "Experian Factor Revenues", "Licensing"]);

eq("renamed custom label -> sent", namesOf(buildFinancialEvaluationPayload(raw, {
  lineNames: { s0l0: "Standalone Revenues", s0l1: "Experian Factor Revenues", s0l2: "Licensing fees" },
})), ["Standalone Revenues", "Experian Factor Revenues", "Licensing fees"]);

console.log(`\n${pass} passed, ${fail} failed`);
