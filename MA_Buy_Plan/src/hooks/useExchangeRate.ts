import { useCallback, useEffect, useState } from "react";
import { fetchCurrencyExchangeRate } from "@/api/currency-exchange-api";

/** The wireframe's own static placeholder ("FBR Rate: 0.85 EUR/USD"), used
 * whenever a live rate can't be fetched (no host config, auth, or network). */
export const FALLBACK_EUR_USD_RATE = 0.85;

export type RateSource = "live" | "manual" | "fallback";

/**
 * Owns the EUR->USD FX rate BuyPlan converts figures with: tries a live fetch
 * from the shared currencyExchangeRates endpoint on mount, falls back to the
 * static rate on failure, and lets the user type their own rate either way.
 */
export function useExchangeRate() {
  const [rate, setRate] = useState<number>(FALLBACK_EUR_USD_RATE);
  const [source, setSource] = useState<RateSource>("fallback");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCurrencyExchangeRate("EUR")
      .then((liveRate) => {
        setRate(liveRate);
        setSource("live");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch exchange rate.");
        setSource((prev) => (prev === "live" ? "fallback" : prev));
      })
      .finally(() => setLoading(false));
  }, []);

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
