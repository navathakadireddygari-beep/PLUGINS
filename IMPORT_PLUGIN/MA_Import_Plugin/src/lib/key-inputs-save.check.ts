/**
 * Key Inputs (WACC / discount, terminal growth, tax) through the staging
 * round trip:
 *
 *   staging GET -> mapStagingEnvelope -> buildFinancialEvaluationPayload
 *               -> buildFinEvaluationStagingPayload (the PUT body)
 *
 * The blob must go back in the casing the GET used, and an input backed by a
 * header column (`source_column`) must write that column too — otherwise the
 * backend rebuilds the input from the stale column and the edit reverts.
 *
 * Run: npx tsx --tsconfig tsconfig.app.json src/lib/key-inputs-save.check.ts
 */
import { buildFinancialEvaluationPayload } from "@/api/financial-api";
import {
  buildFinEvaluationStagingPayload,
  mapStagingEnvelope,
} from "@/api/staging-api";

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

const envelopeWith = (inputs: unknown) => ({
  apiStatus: "S",
  data: {
    file: { fileId: 9, proposalId: 5 },
    header: {
      finEvalHeaderStgId: 1,
      discountRatePercent: "10.8",
      taxRatePercent: "29.2",
      terminalGrowthRatePercent: "2",
      mAKeyInputs: { inputs },
      sections: [],
    },
  },
});

/* ── 1. camelCase blob ──────────────────────────────────────────────── */
console.log("\n1. GET sends the Key Inputs blob in camelCase");
const camel = mapStagingEnvelope(
  envelopeWith([
    { inputCode: "DISCOUNT_RATE", label: "WACC", value: 10.8, displayOrder: 1, sourceColumn: "discount_rate_percent" },
    { inputCode: "TERMINAL_GROWTH_RATE", label: "Terminal growth", value: 2, displayOrder: 2, sourceColumn: "terminalGrowthRatePercent" },
  ]) as any,
);
eq("screen shows both inputs", camel.keyInputs.map((k) => [k.label, k.value]), [
  ["WACC", "10.8"],
  ["Terminal growth", "2"],
]);
const camelPayload = buildFinancialEvaluationPayload(camel.raw!, {
  keyInputs: { DISCOUNT_RATE: "11", TERMINAL_GROWTH_RATE: "3" },
});
const camelBody = buildFinEvaluationStagingPayload(camelPayload).header as any;
eq("PUT blob keeps camelCase codes", camelBody.mAKeyInputs.inputs.map((i: any) => i.inputCode), [
  "DISCOUNT_RATE",
  "TERMINAL_GROWTH_RATE",
]);
eq("PUT blob carries the edited values", camelBody.mAKeyInputs.inputs.map((i: any) => i.value), [11, 3]);
eq("discount header column written", camelBody.discountRatePercent, 11);
eq("terminal growth header column written", camelBody.terminalGrowthRatePercent, 3);

/* ── 2. snake_case blob ─────────────────────────────────────────────── */
console.log("\n2. GET sends the Key Inputs blob in snake_case");
const snake = mapStagingEnvelope(
  envelopeWith([
    { input_code: "TERMINAL_GROWTH_RATE", label: "Terminal growth", value: 2, display_order: 1, source_column: null },
  ]) as any,
);
const snakeBody = buildFinEvaluationStagingPayload(
  buildFinancialEvaluationPayload(snake.raw!, { keyInputs: { TERMINAL_GROWTH_RATE: "4" } }),
).header as any;
eq("PUT blob keeps snake_case codes", snakeBody.mAKeyInputs.inputs[0].input_code, "TERMINAL_GROWTH_RATE");
eq("PUT blob carries the edited value", snakeBody.mAKeyInputs.inputs[0].value, 4);
eq("no source column -> header untouched", snakeBody.terminalGrowthRatePercent, "2");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} key-inputs-save check(s) failed`);
