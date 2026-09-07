/**
 * Centralized configuration for currency conversion + number formatting.
 * This is the SINGLE place that defines currencies, scales and defaults.
 * Do not hardcode any of these values elsewhere.
 */

/**
 * An ISO-4217 code. Kept open (not a closed union) because the reference
 * derives the available currencies from the proposal's `local_currency`, which
 * can be any code the back office configured — see `currenciesFor`.
 */
export type CurrencyCode = string;

/**
 * The currency all row values are stored in ("base"). Every value in
 * component state is a full-magnitude amount in this currency. Display
 * conversion is derived; state is never mutated by display settings.
 */
export const BASE_CURRENCY: CurrencyCode = "EUR";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  /** Label used in toggles, e.g. "€ EUR". */
  label: string;
}

/**
 * Labels for the codes the reference project knows about
 * (Prod Dev → Table.tsx CURRENCY_LABELS). Anything outside this table falls
 * back to the bare code, exactly as `currencyLabel` does there.
 */
export const CURRENCIES: Record<string, CurrencyMeta> = {
  CAD: { code: "CAD", symbol: "$", label: "$ CAD" },
  USD: { code: "USD", symbol: "$", label: "$ USD" },
  EUR: { code: "EUR", symbol: "€", label: "€ EUR" },
  GBP: { code: "GBP", symbol: "£", label: "£ GBP" },
  AUD: { code: "AUD", symbol: "A$", label: "A$ AUD" },
  JPY: { code: "JPY", symbol: "¥", label: "¥ JPY" },
  SGD: { code: "SGD", symbol: "$", label: "$ SGD" },
  INR: { code: "INR", symbol: "₹", label: "₹ INR" },
  CNY: { code: "CNY", symbol: "¥", label: "¥ CNY" },
};

/** Display label for a code, falling back to the code itself. */
export const currencyLabel = (code: string): string =>
  CURRENCIES[(code || "").toUpperCase()]?.label ?? code;

/**
 * The currencies the toggle offers, given the proposal's local currency.
 * Mirrors the reference: a USD-only proposal gets a single button, and anything
 * else offers "local" alongside USD.
 *
 * An UNKNOWN local currency (null / "" — the proposal has not loaded yet, or
 * the fetch failed) yields NO options at all, deliberately. Defaulting to
 * ["USD"] here would render a confident, wrong "$ USD" button that is
 * indistinguishable from a genuine USD proposal, which hides a failed load
 * instead of showing it. The currency is the response's to state, not ours to
 * guess.
 */
export const currenciesFor = (
  localCurrency: string | null | undefined,
): CurrencyCode[] => {
  const local = (localCurrency ?? "").trim().toUpperCase();
  if (!local) return [];
  return local === "USD" ? ["USD"] : [local, "USD"];
};

/**
 * The FX strip is shown only when there is a conversion to describe — i.e. a
 * KNOWN, non-USD local currency. An unknown one describes nothing.
 */
export const showFxFor = (localCurrency: string | null | undefined): boolean => {
  const local = (localCurrency ?? "").trim().toUpperCase();
  return local !== "" && local !== "USD";
};

export const CURRENCY_CODES: CurrencyCode[] = ["EUR", "USD"];

/**
 * Display scale = magnitude UNIT the value is shown in. A scale DIVIDES the
 * underlying magnitude by a fixed factor for display; stored values are never
 * mutated.
 *
 * IMPORTANT — matches the reference project (Prod Dev → src/config/formats.ts):
 * API year values arrive ALREADY IN THOUSANDS, so K is the base and is shown
 * as-is; M and B divide down from there.
 *   "K" -> ÷ 1            (as-is)
 *   "M" -> ÷ 1,000
 *   "B" -> ÷ 1,000,000
 *
 * Decimals shown per scale: K = 0, M = 1, B = 2 (the `decimals` field below,
 * read through `scaleDecimals`). This matches the rest of the GIS plugin suite
 * — Sales Contracts, Other Capex/Opex and Leases all use exactly this rule.
 *
 * It does NOT match Prod Dev, which passes a hardcoded 2 to `groupNumber` at
 * every call site and has no per-scale decimals at all. Prod Dev is the outlier
 * of the four; several of the others carry comments claiming to follow it here,
 * and they do not. Recorded so the next reader does not "fix" one to the other.
 *
 * The trade-off this rule carries, accepted deliberately: at K — the default
 * scale — zero decimals means a typed 4.5 RENDERS as "5" and 1,234.56 as
 * "1,235". Only the rendering rounds; the stored value keeps every digit, and
 * the editor seeds at 3 decimals (EDIT_DECIMALS in lib/format) so reopening a
 * cell still shows 4.5 and committing it cannot round the value away.
 */
export type ScaleId = "K" | "M" | "B";

export interface ScaleMeta {
  id: ScaleId;
  /** Button label. */
  label: string;
  /** Suffix appended to displayed values, e.g. "1.5 K". */
  suffix: string;
  /** Factor the underlying magnitude is divided by for display. */
  divisor: number;
  /** Decimal places shown at this scale (K = 0, M = 1, B = 2). */
  decimals: number;
}

export const SCALES: ScaleMeta[] = [
  { id: "K", label: "K", suffix: "K", divisor: 1, decimals: 0 },
  { id: "M", label: "M", suffix: "M", divisor: 1_000, decimals: 1 },
  { id: "B", label: "B", suffix: "B", divisor: 1_000_000, decimals: 2 },
];

const SCALE_BY_ID: Record<ScaleId, ScaleMeta> = SCALES.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<ScaleId, ScaleMeta>,
);

export const scaleMeta = (scale: ScaleId): ScaleMeta => SCALE_BY_ID[scale];

/** Decimal places to render at the given scale (K = 0, M = 1, B = 2). */
export const scaleDecimals = (scale: ScaleId): number =>
  SCALE_BY_ID[scale].decimals;

/**
 * Number format = the regional convention used to render a number: which
 * character groups the thousands, which separates the decimals, and how the
 * integer digits are grouped (Western "thousand" groups of 3, or the Indian
 * lakh/crore scheme 12,34,567). This is purely a display concern — stored base
 * values are always canonical (a "." decimal, no grouping) and are never
 * mutated by the selected format.
 */
export type NumberFormatId = "us" | "eu" | "fr" | "in" | "ch";

export interface NumberFormatMeta {
  id: NumberFormatId;
  /** Sample rendering shown in the selector, e.g. "1,234,567.89". */
  label: string;
  /** Countries/regions that use this convention (for the selector hint). */
  regions: string;
  /** Character inserted between digit groups. */
  groupSeparator: string;
  /** Character separating the integer and fraction parts. */
  decimalSeparator: string;
  /** Digit-grouping scheme: Western groups of 3, or Indian 3-then-2s. */
  grouping: "thousand" | "indian";
}

export const NUMBER_FORMATS: NumberFormatMeta[] = [
  {
    id: "us",
    label: "1,234,567.89",
    regions: "US / UK",
    groupSeparator: ",",
    decimalSeparator: ".",
    grouping: "thousand",
  },
  {
    id: "eu",
    label: "1.234.567,89",
    regions: "European",
    groupSeparator: ".",
    decimalSeparator: ",",
    grouping: "thousand",
  },
  {
    id: "fr",
    label: "1 234 567,89",
    regions: "French",
    groupSeparator: " ",
    decimalSeparator: ",",
    grouping: "thousand",
  },
  {
    id: "in",
    label: "12,34,567.89",
    regions: "Indian",
    groupSeparator: ",",
    decimalSeparator: ".",
    grouping: "indian",
  },
  {
    id: "ch",
    label: "1'234'567.89",
    regions: "Swiss",
    groupSeparator: "'",
    decimalSeparator: ".",
    grouping: "thousand",
  },
];

const NUMBER_FORMAT_BY_ID: Record<NumberFormatId, NumberFormatMeta> =
  NUMBER_FORMATS.reduce(
    (acc, f) => {
      acc[f.id] = f;
      return acc;
    },
    {} as Record<NumberFormatId, NumberFormatMeta>,
  );

export const numberFormatMeta = (id: NumberFormatId): NumberFormatMeta =>
  NUMBER_FORMAT_BY_ID[id];

/** Defaults for the global currency/format state. */
/**
 * The currency template amounts are AUTHORED in — a unit-conversion constant
 * for parsing the wire format, NOT a UI default. There is deliberately no
 * default display currency: the toggle shows nothing until the GET states one
 * (see `currenciesFor`).
 */
export const DEFAULT_CURRENCY: CurrencyCode = "USD";
export const DEFAULT_SCALE: ScaleId = "K";
export const DEFAULT_NUMBER_FORMAT: NumberFormatId = "us";

/**
 * Display conversion (FX) is currently PINNED to a fixed value. The editable FX
 * input is disabled and every currency calculation uses this rate.
 *
 * To re-enable user-editable conversion later, flip FX_CONVERSION_EDITABLE to
 * true — the FxCard input and the provider's setter will resume working with no
 * other change required.
 */
export const FX_CONVERSION_EDITABLE = false;
/** `1 EUR = FIXED_FX_RATE USD`. */
export const FIXED_FX_RATE = 0.87;
export const FIXED_FX_RATE_STRING = "0.87";

/**
 * `1 EUR = DEFAULT_FX_RATE USD`. Retained as the rate the seed data was
 * authored against; the live rate is FIXED_FX_RATE above.
 */
export const DEFAULT_FX_RATE = FIXED_FX_RATE;
export const DEFAULT_FX_RATE_STRING = FIXED_FX_RATE_STRING;

/* ─────────────────── Persisted display preferences ─────────────────── */
/**
 * Scale and number format survive a reload. Keys match the reference project
 * (Prod Dev → src/config/formats.ts) so both widgets share one preference.
 */
const LS_SCALE = "fin_eval_scale";
const LS_NUMBER_FORMAT = "fin_eval_number_format";

const readLS = (key: string): string | null => {
  try {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
};

const writeLS = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
};

export const loadScale = (): ScaleId => {
  const raw = readLS(LS_SCALE) as ScaleId | null;
  return raw && SCALES.some((s) => s.id === raw) ? raw : DEFAULT_SCALE;
};
export const saveScale = (value: ScaleId): void => writeLS(LS_SCALE, value);

export const loadNumberFormat = (): NumberFormatId => {
  const raw = readLS(LS_NUMBER_FORMAT) as NumberFormatId | null;
  return raw && NUMBER_FORMATS.some((f) => f.id === raw)
    ? raw
    : DEFAULT_NUMBER_FORMAT;
};
export const saveNumberFormat = (value: NumberFormatId): void =>
  writeLS(LS_NUMBER_FORMAT, value);
