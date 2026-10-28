/**
 * Global display-format settings — the toolbar under the tab bar.
 *
 * One store for the whole app so SCALE / NUMBER / DATE apply everywhere at once:
 * the Forecast vs Actuals report, the executive KPI tiles, the periodic snapshot
 * cards, the actuals drilldown and the reconciliation strip all read from here.
 *
 * Same shape as src/lib/refresh-bus.ts — a module-level store plus a
 * useSyncExternalStore hook — so components subscribe without a provider.
 *
 * IMPORTANT: amounts must reach these formatters as raw numbers, never as
 * already-formatted strings. Re-parsing a displayed value would scale it twice
 * (a "$0.16M" re-read under scale K becomes "$0.00K"), which is why the API
 * transformers carry *Num fields alongside their display strings.
 */
import { useSyncExternalStore } from "react";

/* ─────────────────────────── Types ──────────────────────────────── */
export type ScaleKey = "K" | "M" | "B";
export type NumberFormatKey = "us" | "eu" | "fr" | "in" | "ch";
export type DateFormatKey = "dd-mm-yyyy" | "dd/mm/yyyy" | "mm/dd/yyyy" | "dd-Mon-yyyy" | "yyyy-mm-dd";

export type FormatSettings = {
  scale:  ScaleKey;
  number: NumberFormatKey;
  date:   DateFormatKey;
};

/* ─────────────────────────── Option tables ──────────────────────── */
/** Divisor + wording for the K / M / B segmented control. */
export const SCALES: ReadonlyArray<{ key: ScaleKey; divisor: number; name: string }> = [
  { key: "K", divisor: 1_000,         name: "Thousands" },
  { key: "M", divisor: 1_000_000,     name: "Millions" },
  { key: "B", divisor: 1_000_000_000, name: "Billions" },
];

type NumberFormatDef = {
  key:    NumberFormatKey;
  /** Shown in the dropdown — the format describing itself. */
  sample: string;
  group:  string;
  decimal: string;
  /** Indian 2-2-3 lakh grouping rather than western 3-3-3. */
  lakh?:  boolean;
};

export const NUMBER_FORMATS: ReadonlyArray<NumberFormatDef> = [
  { key: "us", sample: "1,234,567.89", group: ",",  decimal: "." },
  { key: "eu", sample: "1.234.567,89", group: ".",  decimal: "," },
  { key: "fr", sample: "1 234 567,89", group: " ",  decimal: "," },
  { key: "in", sample: "12,34,567.89", group: ",",  decimal: ".", lakh: true },
  { key: "ch", sample: "1'234'567.89", group: "'",  decimal: "." },
];

export const DATE_FORMATS: ReadonlyArray<{ key: DateFormatKey; sample: string }> = [
  { key: "dd-mm-yyyy", sample: "dd-mm-yyyy" },
  { key: "dd/mm/yyyy", sample: "dd/mm/yyyy" },
  { key: "mm/dd/yyyy", sample: "mm/dd/yyyy" },
  { key: "dd-Mon-yyyy", sample: "dd-Mon-yyyy" },
  { key: "yyyy-mm-dd", sample: "yyyy-mm-dd" },
];

export type DisplayCurrency = { symbol: string; code: string };

/** Shown until the API's header supplies the proposal's actual currency. */
const FALLBACK_CURRENCY: DisplayCurrency = { symbol: "$", code: "USD" };

/** Symbols for the currency codes ORDS is known to send; unlisted codes show the code itself as the symbol. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "\u20ac", GBP: "\u00a3", INR: "\u20b9", JPY: "\u00a5",
  AUD: "$", CAD: "$", CHF: "CHF", CNY: "\u00a5", SGD: "$",
};

/** code (e.g. "EUR") -> its display symbol, falling back to the code itself. */
export const currencySymbolFor = (code: string): string => CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;

const DEFAULTS: FormatSettings = { scale: "M", number: "us", date: "dd-mm-yyyy" };

/* ─────────────────────────── Store ──────────────────────────────── */
// Versioned: the key was bumped when the default scale changed to M, so a
// browser holding the previous default doesn't keep overriding it.
const STORAGE_KEY = "pir.formatSettings.v2";

const isScale = (v: unknown): v is ScaleKey => SCALES.some((s) => s.key === v);
const isNumberFormat = (v: unknown): v is NumberFormatKey => NUMBER_FORMATS.some((f) => f.key === v);
const isDateFormat = (v: unknown): v is DateFormatKey => DATE_FORMATS.some((f) => f.key === v);

/** Restore the last choice; any unreadable or stale value falls back to DEFAULTS. */
function restore(): FormatSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<FormatSettings>;
    return {
      scale:  isScale(saved.scale) ? saved.scale : DEFAULTS.scale,
      number: isNumberFormat(saved.number) ? saved.number : DEFAULTS.number,
      date:   isDateFormat(saved.date) ? saved.date : DEFAULTS.date,
    };
  } catch {
    return DEFAULTS;
  }
}

const listeners = new Set<() => void>();
let settings: FormatSettings = typeof window === "undefined" ? DEFAULTS : restore();

function update(patch: Partial<FormatSettings>): void {
  const next = { ...settings, ...patch };
  if (next.scale === settings.scale && next.number === settings.number && next.date === settings.date) return;
  settings = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private-browsing / storage-disabled — the setting still applies this session.
  }
  for (const listener of [...listeners]) listener();
}

export const setScale = (scale: ScaleKey): void => update({ scale });
export const setNumberFormat = (number: NumberFormatKey): void => update({ number });
export const setDateFormat = (date: DateFormatKey): void => update({ date });

export function subscribeToFormat(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable snapshot — the object identity only changes when a setting changes. */
export const getFormatSettings = (): FormatSettings => settings;

/** React hook: re-renders the caller whenever any format setting changes. */
export function useFormatSettings(): FormatSettings {
  return useSyncExternalStore(subscribeToFormat, getFormatSettings, getFormatSettings);
}

/**
 * Display currency — separate from FormatSettings because it's data (the
 * proposal's currency, from the financial header) rather than a user
 * preference, so it's never persisted to localStorage.
 */
const currencyListeners = new Set<() => void>();
let currentCurrency: DisplayCurrency = FALLBACK_CURRENCY;

/** Called once the financial header's local_currency/display_currency arrives. */
export function setDisplayCurrency(code: string | null | undefined): void {
  if (!code || !code.trim()) return;
  const next = { symbol: currencySymbolFor(code), code: code.toUpperCase() };
  if (next.symbol === currentCurrency.symbol && next.code === currentCurrency.code) return;
  currentCurrency = next;
  for (const listener of [...currencyListeners]) listener();
}

export function subscribeToCurrency(listener: () => void): () => void {
  currencyListeners.add(listener);
  return () => {
    currencyListeners.delete(listener);
  };
}

export const getDisplayCurrency = (): DisplayCurrency => currentCurrency;

export function useDisplayCurrency(): DisplayCurrency {
  return useSyncExternalStore(subscribeToCurrency, getDisplayCurrency, getDisplayCurrency);
}

/* ─────────────────────────── Number formatting ──────────────────── */
const scaleDef = (key: ScaleKey) => SCALES.find((s) => s.key === key) ?? SCALES[0];
const numberDef = (key: NumberFormatKey) => NUMBER_FORMATS.find((f) => f.key === key) ?? NUMBER_FORMATS[0];
const scaleDecimals = (key: ScaleKey): number => ({ K: 0, M: 1, B: 2 })[key];

/** 1234567 → "1,234,567" (western 3-3-3). */
const groupWestern = (digits: string, sep: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

/** 1234567 → "12,34,567" (Indian 2-2-3: last three digits, then pairs). */
const groupLakh = (digits: string, sep: string): string => {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3);
  return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, sep)}${sep}${digits.slice(-3)}`;
};

/**
 * Group and punctuate the magnitude of `n` per the chosen number format.
 * Sign is never emitted here — callers decide between a minus sign and the
 * accounting parentheses this app uses for negatives.
 */
export function formatMagnitude(n: number, settings: FormatSettings, decimals = 2): string {
  const def = numberDef(settings.number);
  const [int, frac] = Math.abs(n).toFixed(decimals).split(".");
  const grouped = def.lakh ? groupLakh(int, def.group) : groupWestern(int, def.group);
  return frac ? `${grouped}${def.decimal}${frac}` : grouped;
}

/**
 * An amount in the selected scale, with its K/M/B suffix — "1.23K", "(4.56M)".
 * Negatives use accounting parentheses, matching the rest of the report.
 */
export function formatAmount(
  n: number | null | undefined,
  settings: FormatSettings,
  decimals = scaleDecimals(settings.scale),
): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const scale = scaleDef(settings.scale);
  const body = `${formatMagnitude(n / scale.divisor, settings, decimals)}${scale.key}`;
  return n < 0 ? `(${body})` : body;
}

/** As formatAmount, prefixed with the display currency — "$1.23K", "($4.56M)". */
export function formatMoney(
  n: number | null | undefined,
  settings: FormatSettings,
  decimals = scaleDecimals(settings.scale),
): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const scale = scaleDef(settings.scale);
  const body = `${getDisplayCurrency().symbol}${formatMagnitude(n / scale.divisor, settings, decimals)}${scale.key}`;
  return n < 0 ? `(${body})` : body;
}

/** Scaled magnitude only — for values that carry their unit in a nearby label. */
export function formatScaled(
  n: number | null | undefined,
  settings: FormatSettings,
  decimals = scaleDecimals(settings.scale),
): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const scale = scaleDef(settings.scale);
  const body = formatMagnitude(n / scale.divisor, settings, decimals);
  return n < 0 ? `(${body})` : body;
}

/** Unscaled number (percentages, year counts, counts) in the chosen punctuation. */
export function formatPlain(n: number | null | undefined, settings: FormatSettings, decimals = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const body = formatMagnitude(n, settings, decimals);
  return n < 0 ? `(${body})` : body;
}

/**
 * Rewrites a "($M)" unit hint in a KPI label to the selected scale — the tiles
 * are labelled "TOTAL CAPEX ($M)" and must not keep saying M while showing K.
 */
export const applyScaleToLabel = (label: string, settings: FormatSettings): string =>
  label.replace(/\(\$[KMB]\)/g, `($${settings.scale})`);

/* ─────────────────────────── Date formatting ────────────────────── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Format an ISO date per the DATE selector. Dates arrive as UTC midnight
 * ("2026-04-19T00:00:00Z"), so every part is read in UTC — otherwise a
 * west-of-UTC browser would show the previous day.
 *
 * Anything unparseable is passed through unchanged (period labels such as
 * "Mar-2026" are not dates and are never routed through here).
 */
export function formatDate(iso: string | null | undefined, settings: FormatSettings): string {
  if (!iso) return "";
  // Only reformat true ISO dates. V8 happily parses loose strings — new
  // Date("Mar-2026") yields a real date — so a period label reaching this
  // function would otherwise be rewritten into a nonsense day.
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  const mon = MONTHS[d.getUTCMonth()];

  switch (settings.date) {
    case "dd/mm/yyyy":  return `${dd}/${mm}/${yyyy}`;
    case "mm/dd/yyyy":  return `${mm}/${dd}/${yyyy}`;
    case "dd-Mon-yyyy": return `${dd}-${mon}-${yyyy}`;
    case "yyyy-mm-dd":  return `${yyyy}-${mm}-${dd}`;
    case "dd-mm-yyyy":
    default:            return `${dd}-${mm}-${yyyy}`;
  }
}
