/**
 * Currency exchange rate API
 *
 * Endpoint: {api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates
 * POST → { year_period, currency } → { data: { usd_fbr, ... } }
 *
 * usd_fbr is "1 <currency> = usd_fbr USD" — same semantics as the legacy
 * ApiHeader.exchange_rate field it replaces.
 */
import type { AppConfig } from "../config/app-config";
import { getBearerToken } from "./financial-api";

export type ExchangeRateResponse = {
  entity_code?:  string;
  year_period:   number;
  currency:      string;
  usd_fbr:       number | null;
  usd_ibr?:      number | null;
  usd_nyfbr?:    number | null;
  usd_nyibr?:    number | null;
  usd_ar?:       number | null;
  gbp_ar?:       number | null;
};

// sysdate as YYYYMM, e.g. 2026-07-22 → "202607"
function currentYearPeriod(): string {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}${mm}`;
}

// Cached per currency+year_period so the toggle doesn't refetch on every render.
const rateCache = new Map<string, number>();

/** Fetches "1 currency = X USD". Returns 1 for USD without calling the API. */
export async function getExchangeRate(cfg: AppConfig, currency: string): Promise<number> {
  const cur = currency.toUpperCase();
  if (cur === "USD") return 1;

  const yearPeriod = currentYearPeriod();
  const cacheKey    = `${cur}:${yearPeriod}`;
  const cached      = rateCache.get(cacheKey);
  if (cached != null) return cached;

  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify({ year_period: yearPeriod, currency: cur }),
  });

  const text = await res.text().catch(() => "");
  let json: { apiStatus?: string; apiMessage?: string; data?: ExchangeRateResponse } = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  if (!res.ok) {
    throw new Error(json.apiMessage || `Failed to load exchange rate (${res.status}).`);
  }

  const rate = json.data?.usd_fbr;
  if (rate == null) {
    throw new Error(json.apiMessage || `No exchange rate available for ${cur}.`);
  }

  rateCache.set(cacheKey, rate);
  return rate;
}
