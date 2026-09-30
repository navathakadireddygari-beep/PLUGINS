/**
 * CurrencyExchangeRateService — same endpoint/contract as the rest of the
 * FinEval suite (see FIN_EVAL/MA/src/api/currency-exchange-api.ts):
 *
 *   POST {api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates
 *   Body: { year_period: "YYYYMM", currency: "<code>" }
 *   Response: { apiStatus, apiMessage, data: { usd_fbr, ... } }
 *
 * `usd_fbr` means "1 USD = usd_fbr <currency>".
 */

import { requestJson } from "@/api/http";

export const CURRENCY_EXCHANGE_RATES_PATH =
  "/GIS/proposalAuthoring/currencyExchangeRates";

/** Current calendar month as "yyyymm", e.g. 2026-09 -> "202609". */
export const currentYearPeriod = (date: Date = new Date()): string =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

/**
 * Fetch the live "1 USD = X <currency>" rate. Throws when the host has no
 * `api_endpoint`, auth fails, or the endpoint has no rate for the pair —
 * callers treat any throw as "no live rate available".
 */
export async function fetchCurrencyExchangeRate(
  currency: string,
  yearPeriod: string = currentYearPeriod()
): Promise<number> {
  const data = await requestJson<Record<string, unknown> | undefined>(
    "POST",
    CURRENCY_EXCHANGE_RATES_PATH,
    { body: { year_period: yearPeriod, currency: currency.toUpperCase() } }
  );

  const rate = (data?.usd_fbr ?? (data?.items as Record<string, unknown> | undefined)?.usd_fbr) as
    | number
    | string
    | undefined;
  const parsed = typeof rate === "string" ? Number(rate) : rate;

  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`No exchange rate available for ${currency}.`);
  }
  return parsed;
}
