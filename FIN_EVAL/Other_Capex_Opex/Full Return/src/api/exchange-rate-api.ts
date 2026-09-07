/**
 * Currency exchange rate API — used to look up the live USD conversion rate
 * for the proposal's local currency (shown in the Currency/Scale strip).
 *
 * Endpoint: POST {api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates
 * Body:     { year_period: "YYYYMM", currency: "INR" }
 * Response: { apiStatus: "S", apiMessage: "Success", data: { usd_fbr, usd_ibr, ... } }
 *
 * `usd_fbr` (USD → foreign budgeted rate) is the number of units of the
 * given currency equal to 1 USD, e.g. usd_fbr: 84.57 for INR means
 * 1 USD = 84.57 INR.
 */
import type { AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";

let cachedToken: string | null = null;

async function getBearerToken(cfg: AppConfig): Promise<string> {
  if (cachedToken) return cachedToken;
  const resp = await fetchAuthToken(cfg);
  cachedToken = extractToken(resp);
  return cachedToken;
}

export type CurrencyExchangeRate = {
  entity_code:  string | null;
  year_period:  number | null;
  currency:     string;
  usd_fbr:      number | null;
  usd_ibr:      number | null;
  usd_nyfbr:    number | null;
  usd_nyibr:    number | null;
  usd_ar:       number | null;
  gbp_ar:       number | null;
};

// Current period formatted as "YYYYMM", matching the backend's year_period param.
export function currentYearPeriod(): string {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}${mm}`;
}

export async function getCurrencyExchangeRate(
  cfg:        AppConfig,
  currency:   string,
  yearPeriod: string = currentYearPeriod(),
): Promise<CurrencyExchangeRate | null> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates`;
  const token = await getBearerToken(cfg);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify({ year_period: yearPeriod, currency: currency.toUpperCase() }),
  });

  const text = await res.text().catch(() => "");
  let json: Record<string, unknown> = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  const apiStatus = (json.apiStatus || json.api_status || "") as string;
  if (!res.ok || (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS")) {
    const apiMsg = (json.apiMessage || json.api_message || text || res.statusText) as string;
    throw new Error(apiMsg || `Failed to fetch exchange rate (${res.status}).`);
  }

  const data = json.data as Record<string, unknown> | undefined;
  if (!data) return null;

  return {
    entity_code: data.entity_code != null ? String(data.entity_code) : null,
    year_period: data.year_period != null ? Number(data.year_period) : null,
    currency:    data.currency != null ? String(data.currency) : currency.toUpperCase(),
    usd_fbr:     data.usd_fbr   != null ? Number(data.usd_fbr)   : null,
    usd_ibr:     data.usd_ibr   != null ? Number(data.usd_ibr)   : null,
    usd_nyfbr:   data.usd_nyfbr != null ? Number(data.usd_nyfbr) : null,
    usd_nyibr:   data.usd_nyibr != null ? Number(data.usd_nyibr) : null,
    usd_ar:      data.usd_ar    != null ? Number(data.usd_ar)    : null,
    gbp_ar:      data.gbp_ar    != null ? Number(data.gbp_ar)    : null,
  };
}
