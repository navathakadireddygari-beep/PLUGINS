/**
 * CurrencyExchangeRateService — same endpoint/contract as the rest of the
 * FinEval suite (see FIN_EVAL/MA/src/api/currency-exchange-api.ts):
 *
 *   POST {api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates
 *   Body: { year_period: "YYYYMM", currency: "<code>" }
 *   Response: { apiStatus, apiMessage, data: { usd_fbr, ... } }
 *
 * `usd_fbr` means "1 USD = usd_fbr <currency>" — for `currency: "EUR"` that's
 * exactly the wireframe's "FBR Rate: 0.85 EUR/USD" figure.
 */

import { getAccessToken } from "@/api/auth-api";
import { authHeaders, getAppConfig, type AppConfig } from "@/config/app-config";

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
  cfg: AppConfig = getAppConfig(),
  yearPeriod: string = currentYearPeriod()
): Promise<number> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__.");

  const token = await getAccessToken();
  const url = `${cfg.api_endpoint}${CURRENCY_EXCHANGE_RATES_PATH}`;

  let res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ year_period: yearPeriod, currency: currency.toUpperCase() }),
  });

  // A rejected token gets one retry against a freshly minted one.
  if (res.status === 401) {
    const freshToken = await getAccessToken(true);
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(freshToken),
      },
      body: JSON.stringify({ year_period: yearPeriod, currency: currency.toUpperCase() }),
    });
  }

  if (!res.ok) throw new Error(`Failed to fetch exchange rate (${res.status}).`);

  const raw = (await res.json()) as Record<string, unknown>;
  const apiStatus = (raw.apiStatus ?? raw.api_status) as string | undefined;
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error((raw.apiMessage as string) || "Failed to fetch exchange rate.");
  }

  const data = raw.data as Record<string, unknown> | undefined;
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
