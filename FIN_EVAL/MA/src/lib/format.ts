/**
 * moneyFormat
 * -----------
 * Composes CurrencyConversionService + NumberFormattingService into the two
 * operations the UI actually needs. This is the ONLY place these two concerns
 * are combined, so every table / card / chart / export produces identical
 * output. Do not re-implement conversion or formatting inline anywhere.
 */

import type {
  CurrencyCode,
  NumberFormatId,
  ScaleId,
} from "@/config/formats";
import { toBaseCurrency, toDisplayCurrency } from "@/lib/currency-conversion";
import {
  formatNumber,
  parseDisplayInput,
  parseNumericInput,
  scaleDivisor,
} from "@/lib/number-format";

export interface MoneySettings {
  /** Currency the user chose to view in. */
  currency: CurrencyCode;
  /** The proposal's local currency — the non-USD side of the pair. */
  localCurrency: string;
  /** `1 USD = fxRate <localCurrency>` (the endpoint's `usd_fbr`). */
  fxRate: number;
  scale: ScaleId;
  /** Regional grouping / decimal convention for display + input parsing. */
  numberFormat: NumberFormatId;
}

/**
 * base value (stored string) -> display string.
 * base --(fx)--> display currency amount --(scale = /divisor + suffix)--> string.
 * The stored base value itself is never mutated; only its display changes.
 * Blank/percentage/non-numeric content is passed through unchanged.
 */
export const formatBaseToDisplayed = (
  baseValue: string | number | null | undefined,
  { currency, localCurrency, fxRate, scale, numberFormat }: MoneySettings,
): string => {
  // Base values are canonical (a "." decimal, no grouping), so parse them with
  // the canonical parser — never the format-aware one.
  const parsed = parseNumericInput(baseValue);
  if (parsed.passthrough !== undefined) return parsed.passthrough;
  if (parsed.value === null) return "";
  const inCurrency = toDisplayCurrency(
    parsed.value,
    currency,
    fxRate,
    localCurrency,
  );
  return formatNumber(inCurrency, scale, numberFormat);
};

/**
 * Decimal places the EDITOR SEED is rounded to, in display space.
 *
 * Three, matching the reference project's cell `onFocus`, which seeds the
 * editor with `String(parseFloat(displayValue.toFixed(3)))`.
 *
 * This is the ONLY rounding in the whole round trip, and it is what erases the
 * FX residue. The stored base is never rounded (see `parseDisplayedToBase`), so
 * the residue is pure IEEE-754 noise — type "4" against a 0.87 rate and the
 * base is 4 / 0.87 = 4.597701149425287, which multiplies back to
 * 4.000000000000001. Three decimals turns that into "4" and the cell reopens
 * showing exactly what was typed.
 *
 * The earlier bug was the opposite mistake: rounding the BASE to two decimals
 * on commit stored 4.6, which genuinely is 4.002 in display currency. That is
 * data loss, not noise, and no amount of seed rounding could recover it.
 */
const EDIT_DECIMALS = 3;

/**
 * base value -> the string shown while a cell is BEING EDITED.
 *
 * Mirrors the reference project's cell `onFocus` exactly:
 *   String(parseFloat(((val * fxMultiplier) / scaleDivisor(scale)).toFixed(3)))
 * — the grouped, 2-decimal display is swapped for a plain un-grouped number at
 * up to 3 decimals, so typing is easy and the value is not quantised to the
 * display's decimal places. Zero renders blank so the placeholder shows
 * through, as it does there.
 */
export const formatBaseToEditable = (
  baseValue: string | number | null | undefined,
  { currency, localCurrency, fxRate, scale }: MoneySettings,
): string => {
  const parsed = parseNumericInput(baseValue);
  if (parsed.passthrough !== undefined) return parsed.passthrough;
  if (parsed.value === null) return "";
  if (parsed.value === 0) return "";
  const inCurrency = toDisplayCurrency(
    parsed.value,
    currency,
    fxRate,
    localCurrency,
  );
  const scaled = inCurrency / scaleDivisor(scale);
  const cleaned = parseFloat(scaled.toFixed(EDIT_DECIMALS));
  // The one deliberate departure from the reference: a non-zero value must
  // never seed the editor as "0". At B scale a small figure can fall below
  // three decimals (0.4 thousand is 4e-7 billion), and the reference would seed
  // "0" and destroy it on the next blur. Falling back to full precision here
  // can only PRESERVE a value the reference would have lost — it never changes
  // one the reference would have kept.
  if (cleaned === 0 && scaled !== 0) return String(Number(scaled.toPrecision(12)));
  return String(cleaned);
};

/**
 * user-typed display string -> base value (stored string).
 * Inverse of formatBaseToDisplayed: re-apply the unit divisor (a "1.5" typed
 * under the "K" unit means 1,500) then convert the display currency back to
 * base. Returns "" for blank input and passes through percentages / unparseable
 * content so state stays lossless.
 */
export const parseDisplayedToBase = (
  displayValue: unknown,
  { currency, localCurrency, fxRate, scale, numberFormat }: MoneySettings,
): string => {
  // Display input follows the user's regional format, so parse it format-aware.
  const parsed = parseDisplayInput(displayValue, numberFormat);
  if (parsed.passthrough !== undefined) return parsed.passthrough;
  if (parsed.value === null) return "";
  const inCurrency = parsed.value * scaleDivisor(scale);
  // NOT rounded, matching the reference project's cell `onBlur`:
  //   String((inputNum * scaleDivisor(scale)) / fxMultiplier)
  // The stored value is the user's number converted, at full precision. This is
  // the fix for a typed "4" reopening as "4.002": rounding the base to two
  // decimals here stored 4.6 for a 0.87 rate, and 4.6 really is 4.002 in
  // display currency. Rounding belongs on the way OUT (2 decimals in the cell,
  // 3 in the editor), never on the way in.
  return String(toBaseCurrency(inCurrency, currency, fxRate, localCurrency));
};
