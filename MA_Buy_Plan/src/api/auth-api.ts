/**
 * Bearer token for the GIS ORDS API, same 2-path strategy as the rest of the
 * FinEval suite (see FIN_EVAL/MA/src/api/auth-api.ts), trimmed to what
 * BuyPlan needs — just enough to call currencyExchangeRates:
 *
 *   1. Inside APEX (`window.$v` present): POST to the page's own
 *      `wwv_flow.ajax` callback using the plugin/flow/step/instance ids the
 *      host injected. No secret ever reaches this bundle.
 *   2. Standalone / local dev: OAuth2 client-credentials at
 *      `{api_endpoint}/oauth/token`, using `VITE_BUYPLAN_BASIC_AUTH` if set.
 *
 * Either path failing (no APEX context, no configured dev credentials, or a
 * rejected request) throws — callers treat that as "no live rate available"
 * and fall back to the manual FX rate input, they never invent a token.
 */

import {
  getAppConfig,
  getBasicAuth,
  getStaticToken,
  isApexHost,
  TOKEN_PATH,
  type AppConfig,
} from "@/config/app-config";

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

async function fetchViaApexAjax(cfg: AppConfig): Promise<string> {
  if (!cfg.ajaxId || !cfg.flowId || !cfg.stepId || !cfg.instance) {
    throw new Error(
      "Missing APEX context (ajaxId, flowId, stepId, instance) in window.__APP_CONFIG__"
    );
  }
  const form = new FormData();
  form.append("p_request", `PLUGIN=${cfg.ajaxId}`);
  form.append("p_flow_id", cfg.flowId);
  form.append("p_flow_step_id", cfg.stepId);
  form.append("p_instance", cfg.instance);

  const href = window.location.href;
  const url = href.includes("/r/")
    ? `${href.split("/r/")[0]}/wwv_flow.ajax`
    : `${window.location.origin}/ords/wwv_flow.ajax`;

  const res = await fetch(url, { method: "POST", body: form, credentials: "include" });
  if (!res.ok) throw new Error(`APEX auth callback failed (${res.status}).`);
  const data = (await res.json()) as { accessToken?: string; token?: string };
  const token = data.accessToken ?? data.token;
  if (!token) throw new Error("APEX auth callback returned no token.");
  return token;
}

async function fetchViaOAuth(cfg: AppConfig): Promise<string> {
  const basicAuth = getBasicAuth();
  if (!basicAuth) {
    throw new Error(
      "No OAuth credentials configured (set VITE_BUYPLAN_BASIC_AUTH for local dev)."
    );
  }
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__.");

  const res = await fetch(`${cfg.api_endpoint}${TOKEN_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Token endpoint failed (${res.status}).`);
  const data = (await res.json()) as { access_token?: string; accessToken?: string };
  const token = data.access_token ?? data.accessToken;
  if (!token) throw new Error("Token endpoint returned no token.");
  return token;
}

/** Refresh this many ms before the cached token's assumed expiry. */
const CACHE_TTL_MS = 5 * 60_000;

export async function getBearerToken(cfg: AppConfig = getAppConfig()): Promise<string> {
  const staticToken = getStaticToken();
  if (staticToken) return staticToken;

  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const token = isApexHost() ? await fetchViaApexAjax(cfg) : await fetchViaOAuth(cfg);
  cached = { token, expiresAt: Date.now() + CACHE_TTL_MS };
  return token;
}
