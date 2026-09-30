/**
 * CurrencyFormatContext
 * ---------------------
 * The single source of truth for the app-wide currency, FX rate and display
 * scale. Any control (Header toggles, table toolbar, ...) reads/writes the
 * SAME state through this context, and any renderer (tables, cards, charts,
 * exports) formats through the memoized helpers exposed here — so a change in
 * one place is reflected everywhere, consistently.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  STORAGE_CURRENCY,
  currenciesFor,
  showFxFor,
  loadScale,
  saveScale,
  loadNumberFormat,
  saveNumberFormat,
  FX_CONVERSION_EDITABLE,
  formatBaseToDisplayed as formatBaseToDisplayedPure,
  formatBaseToEditable as formatBaseToEditablePure,
  parseDisplayedToBase as parseDisplayedToBasePure,
  type CurrencyCode,
  type MoneySettings,
  type NumberFormatId,
  type ScaleId,
} from "@/lib";
import { fetchCurrencyExchangeRate } from "@/api/currency-exchange-api";
import { emitCurrencyChanged, emitScaleChanged } from "@/lib/app-bridge";

export interface CurrencyFormatContextValue {
  // ---- state (single source of truth) ----
  /**
   * The display currency from the loaded proposal, or null while it is
   * unknown. Null is a real state, not a placeholder — see `currenciesFor`.
   */
  currency: CurrencyCode | null;
  scale: ScaleId;
  /** Active regional number format (grouping + decimal separator). */
  numberFormat: NumberFormatId;
  /** Raw FX input string ("1 EUR = <n> USD"), kept as typed for good UX. */
  fxRate: string;
  /** Parsed numeric FX rate (falls back to 0 when invalid). */
  fxRateNumber: number;
  /**
   * True once a REAL rate is in hand — the proposal's stored `exchange_rate`
   * or a live fetch. False means `fxRate` is still the hardcoded placeholder,
   * which must never be written back to the proposal.
   */
  fxRateKnown: boolean;
  /** The proposal's local currency from the loaded header, or null. */
  localCurrency: string | null;
  /**
   * Codes the toggle should offer — [local, "USD"], just ["USD"], or EMPTY
   * while the proposal's currency is unknown. An empty list means "render no
   * currency control", not "fall back to USD".
   */
  currencies: CurrencyCode[];
  /** True when there is a conversion worth showing (display differs from local). */
  showFx: boolean;
  /** Live-rate fetch in flight. */
  fxLoading: boolean;
  /** Live-rate fetch failed; the UI falls back to 1:1. */
  fxError: string | null;

  // ---- setters ----
  setCurrency: (c: CurrencyCode) => void;
  setScale: (s: ScaleId) => void;
  setNumberFormat: (f: NumberFormatId) => void;
  setFxRate: (v: string) => void;
  /**
   * Record the proposal's currencies from the loaded header. Sets the local
   * currency (which drives the toggle options and the FX strip) AND snaps the
   * selected display currency to `display || local`, so the active toggle
   * button always matches one of the options that are actually rendered.
   */
  setProposalCurrencies: (
    local?: string | null,
    display?: string | null,
    exchangeRate?: number | null,
  ) => void;
  /**
   * Fetch the live rate for `currency` (the proposal's local/display
   * currency) from the currencyExchangeRates endpoint and apply it. Unlike
   * `setFxRate`, this always applies — it is not gated by
   * FX_CONVERSION_EDITABLE, which only guards manual user input.
   */
  refreshFxRate: (currency: string, yearPeriod?: string) => Promise<void>;

  // ---- derived formatters (bound to current settings, memoized) ----
  settings: MoneySettings;
  /** base value string -> display string. */
  formatBaseToDisplayed: (value: string | number | null | undefined) => string;
  /** base value -> the plain string shown while a cell is being edited. */
  formatBaseToEditable: (value: string | number | null | undefined) => string;
  /** display string -> base value string (for storing edits). */
  parseDisplayedToBase: (value: unknown) => string;
}

const CurrencyFormatContext = createContext<CurrencyFormatContextValue | null>(
  null,
);

export function CurrencyFormatProvider({ children }: { children: ReactNode }) {
  // No seed value: the display currency is whatever the GET says it is, and
  // until that lands it is genuinely unknown rather than "USD".
  const [currency, setCurrencyState] = useState<CurrencyCode | null>(null);

  /** User-driven currency change — also notifies the host page. */
  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    emitCurrencyChanged(c);
  }, []);
  const [localCurrency, setLocalCurrencyState] = useState<string | null>(null);
  // Scale and number format are restored from localStorage and written back on
  // change, as the reference project does.
  const [scale, setScaleState] = useState<ScaleId>(() => loadScale());
  const [numberFormat, setNumberFormatState] = useState<NumberFormatId>(() =>
    loadNumberFormat(),
  );
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);

  const setScale = useCallback((s: ScaleId) => {
    setScaleState(s);
    saveScale(s);
    emitScaleChanged(s);
  }, []);
  const setNumberFormat = useCallback((f: NumberFormatId) => {
    setNumberFormatState(f);
    saveNumberFormat(f);
  }, []);

  // Display conversion is pinned to a fixed rate for now. The editable FX state
  // stays here (commented) so re-enabling later is a one-line change; flip
  // FX_CONVERSION_EDITABLE in lib/currency/config.ts and the setter re-activates.
  // Starts EMPTY, i.e. "no rate yet" — matching the reference, which holds
  // `fxRate` as `number | null` seeded to null (Prod Dev -> Table.tsx). An
  // unknown rate must convert 1:1 and say so, never apply a stand-in constant:
  // the old FIXED_FX_RATE seed is a EUR-era number, so on a CAD proposal it
  // rendered confident, wrong figures. `fxRateNumber` parses "" to 0, and
  // `computeDisplayMultiplier` treats any non-positive rate as x1.
  const [fxRate, setFxRateState] = useState<string>("");
  // Tracks whether a REAL rate (stored or live) has replaced the empty seed.
  const [fxRateKnown, setFxRateKnownState] = useState(false);
  // Mirrored in a ref because the fetch effect below reads it without listing
  // it as a dependency — adding it there would re-run the fetch the moment the
  // rate arrives, firing a second request for the answer we just got.
  const fxRateKnownRef = useRef(false);
  const setFxRateKnown = useCallback((known: boolean) => {
    fxRateKnownRef.current = known;
    setFxRateKnownState(known);
  }, []);
  const setFxRate = (v: string) => {
    if (FX_CONVERSION_EDITABLE) setFxRateState(v);
  };

  const refreshFxRate = useCallback(
    async (currency: string, yearPeriod?: string) => {
      const rate = await fetchCurrencyExchangeRate(currency, yearPeriod);
      if (rate !== null && Number.isFinite(rate) && rate > 0) {
        setFxRateState(String(rate));
        setFxRateKnown(true);
      }
    },
    [setFxRateKnown],
  );

  // Available currencies + FX visibility, derived from the proposal currency
  // and current display selection.
  const currencies = useMemo(
    () => currenciesFor(localCurrency),
    [localCurrency],
  );
  // Parity with the reference (Prod Dev -> Table.tsx): the FX strip is shown
  // for every non-USD proposal, whichever side of the pair is on display. It
  // describes the pair, not the current selection, so hiding it while the user
  // is looking at the local currency would drop the rate off the screen exactly
  // when it is needed to read the numbers.
  const showFx = useMemo(() => showFxFor(localCurrency), [localCurrency]);

  /**
   * Fetch the live rate whenever the local currency changes. Skipped entirely
   * for USD-only proposals (there is nothing to convert), matching the
   * reference. A failure leaves the pinned fallback in place and surfaces
   * `fxError` so the strip can say so rather than silently showing a guess.
   */
  const setProposalCurrencies = useCallback(
    (
      local?: string | null,
      display?: string | null,
      exchangeRate?: number | null,
    ) => {
      // Seed from the proposal's stored rate first; the live fetch below
      // supersedes it if it succeeds.
      if (
        exchangeRate != null &&
        Number.isFinite(exchangeRate) &&
        exchangeRate > 0
      ) {
        setFxRateState(String(exchangeRate));
        setFxRateKnown(true);
      }
      // `local_currency` is the pair's anchor, but a proposal that only states
      // `display_currency` still tells us what to show, so either one is
      // enough. Neither means the header carried no currency at all, and the
      // toggle stays hidden rather than inventing one.
      const localCode = (local ?? "").trim().toUpperCase();
      const displayCode = (display ?? "").trim().toUpperCase();
      const anchor = localCode || displayCode;
      if (!anchor) {
        setLocalCurrencyState(null);
        setCurrencyState(null);
        return;
      }
      setLocalCurrencyState(anchor);
      // The reference derives the selected currency as `display_currency ||
      // local_currency`. Without this the selection could sit on a code the
      // toggle never renders, leaving every button looking unselected.
      const options = currenciesFor(anchor);
      const wanted = displayCode || anchor;
      setCurrencyState(options.includes(wanted) ? wanted : options[0]);
    },
    [setFxRateKnown],
  );

  useEffect(() => {
    if (!showFx) {
      setFxLoading(false);
      setFxError(null);
      return;
    }
    let cancelled = false;
    setFxLoading(true);
    setFxError(null);
    fetchCurrencyExchangeRate(localCurrency ?? "")
      .then((rate) => {
        if (cancelled) return;
        if (rate !== null && Number.isFinite(rate) && rate > 0) {
          setFxRateState(String(rate));
          setFxRateKnown(true);
        } else {
          // The proposal's own stored rate already seeded `fxRate`, so a failed
          // live lookup is only an error when we have nothing better.
          if (!fxRateKnownRef.current) setFxError("Rate unavailable");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setFxError(
            e instanceof Error ? e.message : "Failed to load exchange rate.",
          );
      })
      .finally(() => {
        if (!cancelled) setFxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [localCurrency, showFx, setFxRateKnown]);

  const fxRateNumber = useMemo(() => {
    const n = Number(fxRate);
    return Number.isFinite(n) ? n : 0;
  }, [fxRate]);

  // The FORMATTERS still need concrete codes, so an unknown currency resolves
  // to the storage currency here — a 1:1 no-op conversion. That keeps number
  // rendering total without letting "unknown" leak into the UI as "USD": the
  // toggle reads `currency`/`currencies` above, which stay null/empty.
  const settings = useMemo<MoneySettings>(
    () => ({
      currency: currency ?? STORAGE_CURRENCY,
      localCurrency: localCurrency ?? STORAGE_CURRENCY,
      fxRate: fxRateNumber,
      scale,
      numberFormat,
    }),
    [currency, localCurrency, fxRateNumber, scale, numberFormat],
  );

  const value = useMemo<CurrencyFormatContextValue>(
    () => ({
      currency,
      scale,
      numberFormat,
      fxRate,
      fxRateNumber,
      fxRateKnown,
      localCurrency,
      currencies,
      showFx,
      fxLoading,
      fxError,
      setCurrency,
      setProposalCurrencies,
      setScale,
      setNumberFormat,
      setFxRate,
      refreshFxRate,
      settings,
      formatBaseToDisplayed: (v) => formatBaseToDisplayedPure(v, settings),
      formatBaseToEditable: (v) => formatBaseToEditablePure(v, settings),
      parseDisplayedToBase: (v) => parseDisplayedToBasePure(v, settings),
    }),
    [
      currency,
      scale,
      numberFormat,
      fxRate,
      fxRateNumber,
      fxRateKnown,
      localCurrency,
      currencies,
      showFx,
      fxLoading,
      fxError,
      setProposalCurrencies,
      setScale,
      setNumberFormat,
      settings,
      refreshFxRate,
    ],
  );

  return (
    <CurrencyFormatContext.Provider value={value}>
      {children}
    </CurrencyFormatContext.Provider>
  );
}

/** Access the app-wide currency/format state + formatters. */
export function useCurrencyFormat(): CurrencyFormatContextValue {
  const ctx = useContext(CurrencyFormatContext);
  if (!ctx) {
    throw new Error(
      "useCurrencyFormat must be used within a <CurrencyFormatProvider>",
    );
  }
  return ctx;
}
