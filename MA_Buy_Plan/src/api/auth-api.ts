/**
 * Authentication API — same structure as FIN_EVAL/MA/src/api/auth-api.ts.
 * BuyPlan calls the same M&A GIS ORDS module (see index.html's
 * `api_endpoint`), so it shares M&A's token source and OAuth client.
 *
 * Token source, in order:
 *   1. APEX (`window.$v` present): POST AJAX call to wwv_flow.ajax with
 *      plugin/flow/step/instance from the widget config. The secret stays
 *      server-side and this is the only path a deployment takes.
 *   2. Standalone / local dev: the OAuth2 client-credentials endpoint,
 *      POST {base}/oauth/token with `authorization: Basic …`.
 *   3. If that endpoint is unreachable or rejects us, the static dev token
 *      below, so local work is not blocked by an auth outage.
 *
 * The token is cached in memory for the lifetime of the page; concurrent
 * callers share a single in-flight request, and `clearAccessToken()` /
 * `getAccessToken(true)` discards a token the server rejected with a 401.
 */

import {
  API_BASE_URL,
  TOKEN_PATH,
  getAppConfig,
  getBasicAuth,
  getStaticToken,
  isApexHost,
  type AppConfig,
} from "@/config/app-config";

export type AuthTokenResponse =
  | { token: string; expiresIn: number }
  | {
      accessToken: string;
      token_type: string;
      /** ISO timestamp. */
      expiration_time: string;
      app_user: string;
    };

/** Refresh this many ms before the real expiry, to cover clock skew + latency. */
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  token: string;
  /** Epoch ms after which the token must not be used. */
  expiresAt: number;
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

const isFresh = (entry: CachedToken | null): entry is CachedToken =>
  entry !== null && Date.now() < entry.expiresAt - EXPIRY_SKEW_MS;

/**
 * Mint a token from whichever source this host provides. Kept as a standalone
 * export (same signature as FIN_EVAL/MA) so it can be called directly.
 */
export async function fetchAuthToken(cfg: AppConfig): Promise<AuthTokenResponse> {
  if (isApexHost()) {
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
    form.append("p_debug", "");

    // APEX friendly URLs (/r/) put the callback alongside the app root; the
    // legacy form lives under /ords.
    const href = window.location.href;
    const url = href.includes("/r/")
      ? `${href.split("/r/")[0]}/wwv_flow.ajax`
      : `${window.location.origin}/ords/wwv_flow.ajax`;

    const resp = await fetch(url, { method: "POST", body: form, credentials: "include" });
    if (!resp.ok) {
      throw new Error(`Auth token call failed: ${resp.status} ${resp.statusText}`);
    }
    const json = JSON.parse(await resp.text());
    if (!json?.accessToken) {
      throw new Error("APEX auth callback returned no accessToken");
    }
    return {
      accessToken: json.accessToken,
      token_type: json.token_type,
      expiration_time: json.expiration_time,
      app_user: json.app_user,
    };
  }

  // Outside APEX: mint a real token, and only fall back if that fails.
  try {
    return await requestOAuthToken();
  } catch (error) {
    console.warn(
      "[auth-api] Token endpoint unavailable, using the static dev token:",
      error instanceof Error ? error.message : error
    );
  }

  // ── Local dev token — replace with a fresh token when you get 401 ──
  // Only reached when the OAuth endpoint above could not be used. Generate a
  // new one via: POST {base}/oauth/token with the client_credentials grant.
  // Tokens live ~1 hour, so this goes stale quickly and is a stopgap, not a
  // configuration — a 401 here means it needs replacing.
  const ACCESS_TOKEN = "_gT9SOFQN7yBweEn8c1L4A";
  return {
    accessToken: ACCESS_TOKEN,
    token_type: "Bearer",
    expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    app_user: cfg.app_user,
  };
}

/** Shape returned by the OAuth2 client-credentials endpoint. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  /** Lifetime in seconds. */
  expires_in: number;
}

/**
 * Request a brand-new token from the OAuth endpoint:
 *
 *   POST {base}/oauth/token
 *     authorization: Basic <client id:secret, base64>
 *     content-type:  application/x-www-form-urlencoded
 *     body:          grant_type=client_credentials
 *
 * Uses `fetch` directly rather than an axios client — BuyPlan has no shared
 * axios instance, and routing the token request through one that auto-attaches
 * this same token would recurse.
 */
const requestOAuthToken = async (): Promise<AuthTokenResponse> => {
  const basicAuth = getBasicAuth();
  if (!basicAuth) {
    throw new Error(
      "Missing API credentials: set DEV_BASIC_AUTH in config/app-config.ts, or run inside an APEX page so the token comes from the AJAX callback."
    );
  }

  const res = await fetch(`${API_BASE_URL}${TOKEN_PATH}`, {
    method: "POST",
    headers: {
      authorization: `Basic ${basicAuth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as TokenResponse;
  if (!data?.access_token) {
    throw new Error("Token endpoint returned no access_token");
  }
  return { token: data.access_token, expiresIn: data.expires_in };
};

/** The bearer string out of either response shape. */
export function extractToken(t: AuthTokenResponse): string {
  return "accessToken" in t ? t.accessToken : t.token;
}

/** Epoch ms this token stops being usable. */
const expiryOf = (t: AuthTokenResponse): number => {
  if ("accessToken" in t) {
    const parsed = Date.parse(t.expiration_time);
    return Number.isFinite(parsed) ? parsed : Date.now() + 3600 * 1000;
  }
  // Treat a missing/absurd lifetime as one minute rather than forever.
  return Date.now() + Math.max(60, t.expiresIn || 0) * 1000;
};

const requestToken = async (): Promise<string> => {
  const response = await fetchAuthToken(getAppConfig());
  cached = { token: extractToken(response), expiresAt: expiryOf(response) };
  return cached.token;
};

/**
 * The bearer token to send, minting one if the cache is empty or stale.
 * Pass `forceRefresh` after a 401 to discard a token the server rejected.
 */
export const getAccessToken = async (forceRefresh = false): Promise<string> => {
  // A token pasted on the URL (?token=…) wins and is never refreshed.
  const staticToken = getStaticToken();
  if (staticToken) return staticToken;

  if (forceRefresh) cached = null;
  if (isFresh(cached)) return cached.token;

  // Share a single request between concurrent callers.
  if (!inFlight) {
    inFlight = requestToken().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

/** Drop the cached token; the next call will mint a fresh one. */
export const clearAccessToken = (): void => {
  cached = null;
};

