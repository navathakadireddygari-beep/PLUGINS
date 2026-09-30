/**
 * Round-trip checks for the display <-> base money pipeline.
 *
 * The property under test is the one the grid depends on and that a two-decimal
 * base value quietly broke: for any value the user can type,
 *
 *   type -> parseDisplayedToBase -> formatBaseToDisplayed   shows what was typed
 *   type -> parseDisplayedToBase -> formatBaseToEditable    reopens as typed
 *   ...and re-committing that seed lands on the SAME base value (a fixed point)
 *
 * Run with:  npx tsx src/lib/format.check.ts
 */

import {
  formatBaseToDisplayed,
  formatBaseToEditable,
  parseDisplayedToBase,
  type MoneySettings,
} from "./format";
import type { NumberFormatId, ScaleId } from "@/config/formats";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(52)} got=${String(got)}  want=${String(want)}`,
  );
};

const settings = (
  o: Partial<MoneySettings> = {},
): MoneySettings => ({
  currency: "EUR",
  localCurrency: "EUR",
  fxRate: 0.87,
  scale: "K" as ScaleId,
  numberFormat: "us" as NumberFormatId,
  ...o,
});

/* ── The reported defect: type 4, reopen, see 4.002 ──────────────────── */
console.log("Editor round trip under FX (the '4 reopens as 4.002' defect)");
{
  const s = settings();
  const base = parseDisplayedToBase("4", s);
  // K scale renders whole units (0 decimals), so "4" comes back as "4".
  eq("displayed('4') stays '4'", formatBaseToDisplayed(base, s), "4");
  eq("editor seed for '4' is '4'", formatBaseToEditable(base, s), "4");
  eq(
    "re-committing the seed is a fixed point",
    parseDisplayedToBase(formatBaseToEditable(base, s), s),
    base,
  );
}

/* ── The same property across rates, scales and magnitudes ───────────── */
console.log("\nFixed point across rates / scales / magnitudes");
const RATES = [0.87, 1.35, 0.75, 1.11, 83.2, 0.6321];
const SCALES: ScaleId[] = ["K", "M", "B"];
const TYPED = ["4", "1", "12.5", "0.004", "1234", "-7", "0.25", "999999"];

for (const fxRate of RATES) {
  for (const scale of SCALES) {
    for (const typed of TYPED) {
      const s = settings({ fxRate, scale });
      const base = parseDisplayedToBase(typed, s);
      const seed = formatBaseToEditable(base, s);
      const again = parseDisplayedToBase(seed, s);
      const label = `fx=${fxRate} ${scale} typed=${typed}`;
      // Reopening the cell must show what was typed (modulo "-0"/blank zero).
      if (Number(typed) !== 0) eq(`seed  ${label}`, seed, String(Number(typed)));
      // And committing that seed must not move the stored value.
      eq(`fixed ${label}`, again, base);
    }
  }
}

/* ── No FX: the identity path must stay exact ────────────────────────── */
console.log("\nUSD (no conversion) is an exact identity");
{
  const s = settings({ currency: "USD", localCurrency: "USD", fxRate: 0 });
  eq("USD '4' -> base '4'", parseDisplayedToBase("4", s), "4");
  eq("USD editor seed '4'", formatBaseToEditable("4", s), "4");
  eq("USD displayed '4' at K", formatBaseToDisplayed("4", s), "4");
}

/* ── B scale: documented lossy EDITING, matching the reference ───────── */
// The editor seed is 3 decimals (the reference's toFixed(3)), so at B scale a
// figure below 0.001 billion cannot be round-tripped through the editor: 4500
// seeds as "0.004" and commits back as 4000. The DISPLAY says the same thing —
// 0.0045 renders "0.00" at two decimals — so B is a viewing scale for
// thousands-denominated data, not an editing one. Asserted here so the
// behaviour is recorded rather than discovered.
console.log("\nB scale editing is lossy below 0.001 (reference parity)");
{
  const s = settings({ currency: "USD", localCurrency: "USD", scale: "B" });
  eq("B: 4500 base -> seed 0.004", formatBaseToEditable("4500", s), "0.004");
  eq("B: seed 0.004 -> base 4000", parseDisplayedToBase("0.004", s), "4000");
  eq("B: 4500 displays as 0.00", formatBaseToDisplayed("4500", s), "0.00");
  // The one guard kept over the reference: a value too small for three decimals
  // is NOT seeded as "0", which would destroy it outright on the next blur.
  eq("B: 0.4 base seeds at full precision", formatBaseToEditable("0.4", s), "4e-7");
}

/* ── Per-scale decimals: K = 0, M = 1, B = 2 ─────────────────────────── */
// The suite-wide rule (Sales Contracts, Other Capex/Opex, Leases). Prod Dev
// differs — it uses a flat 2 — and that difference is deliberate, so these
// assertions are what stops someone "correcting" one to the other.
console.log("\nCell display uses per-scale decimals (K=0, M=1, B=2)");
{
  const at = (scale: ScaleId): MoneySettings =>
    settings({ currency: "USD", localCurrency: "USD", fxRate: 1, scale });
  // Typing 34 renders at the active scale's precision. The scale decides what
  // gets STORED (34, 34 000, 34 000 000) as well as how it is rendered.
  eq("typed 34 at K", formatBaseToDisplayed(parseDisplayedToBase("34", at("K")), at("K")), "34");
  eq("typed 34 at M", formatBaseToDisplayed(parseDisplayedToBase("34", at("M")), at("M")), "34.0");
  eq("typed 34 at B", formatBaseToDisplayed(parseDisplayedToBase("34", at("B")), at("B")), "34.00");
  // A STORED 34 (thousands) viewed at each scale: the divisor moves the figure
  // and the precision changes with it.
  eq("stored 34 at K", formatBaseToDisplayed("34", at("K")), "34");
  eq("stored 34 at M", formatBaseToDisplayed("34", at("M")), "0.0");
  eq("stored 34 at B", formatBaseToDisplayed("34", at("B")), "0.00");
  eq("stored 1234567 at K", formatBaseToDisplayed("1234567", at("K")), "1,234,567");
  eq("stored 1234567 at M", formatBaseToDisplayed("1234567", at("M")), "1,234.6");
  eq("stored 1234567 at B", formatBaseToDisplayed("1234567", at("B")), "1.23");
  // ACCEPTED trade-off of this rule: K renders whole units, so a typed 4.5
  // SHOWS as "5". Asserted, not tolerated by accident.
  eq("K rounds 4.5 in DISPLAY", formatBaseToDisplayed("4.5", at("K")), "5");
  eq("K rounds 1234.56 in DISPLAY", formatBaseToDisplayed("1234.56", at("K")), "1,235");
  // ...but the display is the ONLY thing that rounds. The stored value keeps
  // every digit and the editor shows it, so a focus/blur cannot destroy it.
  eq("stored value is untouched", parseDisplayedToBase("4.5", at("K")), "4.5");
  eq("editor still shows 4.5", formatBaseToEditable("4.5", at("K")), "4.5");
  eq("reopen + commit is a no-op", parseDisplayedToBase(formatBaseToEditable("4.5", at("K")), at("K")), "4.5");
  eq("editor still shows 1234.56", formatBaseToEditable("1234.56", at("K")), "1234.56");
  // Negatives render in accounting parentheses.
  eq("negatives use parentheses", formatBaseToDisplayed("-7", at("K")), "(7)");
}

/* ── Blank / zero / percentage passthrough is unchanged ──────────────── */
console.log("\nBlank, zero and percentage passthrough");
{
  const s = settings();
  eq("blank -> ''", parseDisplayedToBase("", s), "");
  eq("zero seeds blank", formatBaseToEditable("0", s), "");
  eq("percentage passes through", parseDisplayedToBase("25%", s), "25%");
}

console.log(`\n${pass} passed, ${fail} failed`);
// Thrown rather than set as an exit code so this file needs no Node type
// definitions — it is compiled by the app's tsconfig alongside the source it
// checks, the same way ma-formulas.check.ts is.
if (fail > 0) throw new Error(`${fail} format round-trip check(s) failed`);
