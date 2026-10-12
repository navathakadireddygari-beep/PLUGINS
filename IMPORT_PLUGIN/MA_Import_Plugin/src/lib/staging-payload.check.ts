/**
 * Checks the staging GET → screen model → PUT body round trip against the
 * REAL finEvaluationStaging response in BUY_PLAN_APIS.txt (repo root, file 475:
 * an upload with only Combined Free Cash Flows + Post Tax Return, flagged
 * VALIDATION_FAILED for four missing template sections).
 *
 * Run: npx tsx --tsconfig tsconfig.app.json src/lib/staging-payload.check.ts
 */
import {
  buildFinEvaluationStagingPayload,
  mapStagingEnvelope,
  missingSectionOf,
  type StagingEnvelope,
} from "@/api/staging-api";
import { buildFinancialEvaluationPayload } from "@/api/financial-api";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(54)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`,
  );
};

// Loaded through a computed specifier so this file needs no Node type
// definitions (the app tsconfig has none), same as format.check.ts.
const fsModule = "node:fs";
const { readFileSync } = await import(/* @vite-ignore */ fsModule);
const envelope = JSON.parse(
  readFileSync(new URL("../../../../BUY_PLAN_APIS.txt", import.meta.url), "utf8"),
) as StagingEnvelope;
const wire = (envelope.data as Record<string, any>).header;

const model = mapStagingEnvelope(envelope);
const raw = model.raw!;

console.log("GET → model");
eq("header id from finEvalHeaderStgId", raw.fin_eval_header_id, 551);
eq("proposal id falls back to file.proposalId", raw.proposal_id !== null, true);
eq("section count", raw.sections?.length, wire.sections.length);
eq("first section id", raw.sections?.[0].fin_eval_section_id, 3067);
eq("first line id", raw.sections?.[0].lines?.[0].fin_eval_line_id, 9990);
eq(
  "first line fy27 amount",
  raw.sections?.[0].lines?.[0].year_values?.fy27?.spc_projected_amount,
  68.04,
);
eq("fiscal years fy24..fy33 ('7yr cagr' dropped)", model.fiscalYears, [
  "fy24", "fy25", "fy26", "fy27", "fy28", "fy29", "fy30", "fy31", "fy32", "fy33",
]);
eq("Free Cash Flows lines → fcf grid", model.fcf.length, 9);
eq("Post Tax Return lines → ptr grid", model.ptr.length, 6);
eq("no Consideration lines in this upload", model.con.length, 0);
// The grid row the screen renders: base-unit strings keyed by fiscal year.
eq("fcf EBIT fy27 reaches the grid row", model.fcf[0].yearValues.fy27, "68.04");
eq("ptr Post tax return fy33 reaches the grid row", model.ptr[5].yearValues.fy33, "0.0182318");

console.log("validation issues");
eq("four FE_SEC_MISSING issues", model.validationIssues.length, 4);
eq(
  "each tagged with the section it names",
  model.validationIssues.map((i) => i.missingSection),
  ["Consideration", "Returns Analysis", "Revenue", "Total Costs"],
);
eq(
  "missingSectionOf ignores unrelated messages",
  missingSectionOf("Fiscal year FY29 appears more than once."),
  undefined,
);

console.log("model → PUT body");
const body = buildFinEvaluationStagingPayload(
  buildFinancialEvaluationPayload(raw),
).header as Record<string, any>;
eq("header id key", body.finEvalHeaderStgId, 551);
eq("no snake_case keys at header level", Object.keys(body).filter((k) => k.includes("_")), []);
eq("no plain/mapper keys", ["finEvalHeaderId", "proposalId", "proposalTitle", "userEmail", "val"].filter((k) => k in body), []);
const section = body.sections[0];
const line = section.lines[0];
eq("section id key", section.finEvalSectionStgId, 3067);
eq("section has no plain id", "finEvalSectionId" in section, false);
eq("line id key", line.finEvalLineStgId, 9990);
eq("line section id key", line.finEvalSectionStgId, 3067);
eq("line has no plain/mapper ids", ["finEvalLineId", "finEvalSectionId", "templateFinEvalLineId", "lineItemCode"].filter((k) => k in line), []);
eq("yearValues buckets stay snake_case", Object.keys(line.yearValues.fy27), Object.keys(wire.sections[0].lines[0].yearValues.fy27));
eq("yearValues fy27 amount", line.yearValues.fy27.spc_projected_amount, 68.04);

const allLinesPut = body.sections.flatMap((s: any) => s.lines).length;
const allLinesGet = wire.sections.flatMap((s: any) => s.lines).length;
eq("every staged line goes back", allLinesPut, allLinesGet);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} staging payload check(s) failed`);
