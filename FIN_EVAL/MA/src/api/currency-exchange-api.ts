/**
 * CurrencyExchangeRateService
 * ---------------------------
 * POSTs the proposal's local/display currency to the GIS currency exchange
 * rate endpoint for a given fiscal period and returns the rate.
 *
 * Envelope note — this endpoint does NOT follow the usual `data.items` shape.
 * The reference project (Prod Dev → getCurrencyExchangeRate) reads the rate
 * from `data.usd_fbr`, i.e. the rate object sits directly under `data`, and the
 * field is `usd_fbr`, not `exchange_rate`. Both spellings and both nestings are
 * accepted here so neither variant silently fails.
 *
 * `usd_fbr` means "1 USD = usd_fbr <currency>" (e.g. 84.57 for INR).
 */

import { apiClient, ApiError } from "@/lib/axios";

export const CURRENCY_EXCHANGE_RATES_PATH =
  "/GIS/proposalAuthoring/currencyExchangeRates";

/** Shape returned by the currency exchange rate endpoint. */
export interface CurrencyExchangeRateResponse {
  year_period?: string | null;
  currency?: string | null;
  /** Reference spelling: "1 USD = usd_fbr <currency>". */
  usd_fbr?: number | null;
  /** Alternate spelling seen on some environments. */
  exchange_rate?: number | null;
}

/** Current calendar month as "yyyymm", e.g. 2026-08 -> "202608". */
export const currentYearPeriod = (date: Date = new Date()): string =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

/** First positive finite number among `usd_fbr` / `exchange_rate`, else null. */
const rateOf = (source: unknown): number | null => {
  if (!source || typeof source !== "object") return null;
  const record = source as Record<string, unknown>;
  for (const key of ["usd_fbr", "exchange_rate"]) {
    const value = record[key];
    const parsed = typeof value === "string" ? Number(value) : value;
    if (typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

/**
 * Fetch the exchange rate for `currency` (the proposal's local or display
 * currency) for `yearPeriod` ("yyyymm"), defaulting to the current month.
 * Returns null when the endpoint has no rate for the pair.
 */
export const fetchCurrencyExchangeRate = async (
  currency: string,
  yearPeriod: string = currentYearPeriod(),
  signal?: AbortSignal,
): Promise<number | null> => {
  const { data: body } = await apiClient.post<Record<string, unknown>>(
    CURRENCY_EXCHANGE_RATES_PATH,
    { year_period: yearPeriod, currency: (currency || "").toUpperCase() },
    { signal },
  );

  const apiStatus = (body?.apiStatus ?? body?.api_status) as string | undefined;
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new ApiError(
      (body?.apiMessage as string) || "Failed to fetch exchange rate.",
    );
  }

  const data = body?.data as Record<string, unknown> | undefined;
  // `data.usd_fbr` (reference), `data.items.usd_fbr` (standard envelope), or a
  // bare object — whichever this environment answers with.
  return rateOf(data) ?? rateOf(data?.items) ?? rateOf(body);
};
