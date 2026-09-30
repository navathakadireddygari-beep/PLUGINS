import { useCallback, useEffect, useState } from "react";
import { fetchCurrencyExchangeRate } from "@/api/currency-exchange-api";

/**
 * Static "1 USD = X <local>" placeholders used whenever a live rate can't be
 * fetched (no host config, auth, or network). EUR is the wireframe's own
 * "FBR Rate: 0.85 EUR/USD"; anything else starts at 1 and is flagged as a
 * fallback so the user knows to type the real rate.
 */
const FALLBACK_USD_RATES: Record<string, number> = { EUR: 0.85 };

export type RateSource = "live" | "manual" | "fallback";

const fallbackRate = (currency: string) => FALLBACK_USD_RATES[currency] ?? 1;

/**
 * Owns the "1 USD = rate <localCurrency>" FX rate BuyPlan converts figures
 * with: tries a live fetch from the shared currencyExchangeRates endpoint,
 * falls back to a static rate on failure, and lets the user type their own
 * rate either way. A USD proposal needs no conversion and never fetches.
 */
export function useExchangeRate(localCurrency: string | null) {
  const [rate, setRate] = useState<number>(1);
  const [source, setSource] = useState<RateSource>("fallback");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!localCurrency || localCurrency === "USD") {
      setRate(1);
      setSource("live");
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchCurrencyExchangeRate(localCurrency)
      .then((liveRate) => {
        setRate(liveRate);
        setSource("live");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch exchange rate.");
        setRate(fallbackRate(localCurrency));
        setSource("fallback");
      })
      .finally(() => setLoading(false));
  }, [localCurrency]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setManualRate = useCallback((value: number) => {
    if (Number.isFinite(value) && value > 0) {
      setRate(value);
      setSource("manual");
      setError(null);
    }
  }, []);

  return { rate, source, loading, error, refresh, setManualRate };
}
