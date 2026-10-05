/**
 * Authentication API — ported from lucky's code/src/api/auth-api.ts.
 *
 * - APEX environment (window.$v present): POST AJAX call to wwv_flow.ajax with
 *   plugin/flow/step/instance from widget config.
 * - Otherwise: POST to localhost token endpoint (dev fallback).
 */

import type { AppConfig } from "../config/app-config";

export type AuthTokenResponse =
  | { token: string; expiresIn: number }
  | { accessToken: string; token_type: string; expiration_time: string; app_user: string };

/** ORDS handlers and wwv_flow.ajax can append debug output or a second JSON
    document after the payload, so parse only the first balanced {...} block. */
export function parseFirstJsonObject(text: string, context: string): Record<string, unknown> {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error(`${context} response was not JSON: ${text.slice(0, 200)}`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { if (inString) escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      const slice = text.slice(start, i + 1);
      const trailing = text.slice(i + 1).trim();
      if (trailing) {
        console.warn(`[${context}] ignoring trailing output after JSON:`, trailing.slice(0, 500));
      }
      return JSON.parse(slice) as Record<string, unknown>;
    }
  }

  throw new Error(`${context} response contained no complete JSON object: ${text.slice(0, 200)}`);
}

export async function fetchAuthToken(cfg: AppConfig): Promise<AuthTokenResponse> {
  const isApex = typeof window !== "undefined" && "$v" in window;

  if (isApex) {
    if (!cfg.ajaxId || !cfg.flowId || !cfg.stepId || !cfg.instance) {
      throw new Error(
        "Missing APEX context (ajaxId, flowId, stepId, instance) in window.__APP_CONFIG__"
      );
    }

    const form = new FormData();
    form.append("p_request",      "PLUGIN=" + cfg.ajaxId);
    form.append("p_flow_id",      cfg.flowId);
    form.append("p_flow_step_id", cfg.stepId);
    form.append("p_instance",     cfg.instance);
    form.append("p_debug",        "");

    const url = window.location.href.includes("/r/")
      ? window.location.href.split("/r/")[0] + "/wwv_flow.ajax"
      : window.location.origin + "/ords/wwv_flow.ajax";

    const resp = await fetch(url, { method: "POST", body: form, credentials: "include" });
    if (!resp.ok) {
      throw new Error(`Auth token call failed: ${resp.status} ${resp.statusText}`);
    }
    const json = parseFirstJsonObject(await resp.text(), "auth-token");
    if (!json.accessToken) {
      throw new Error("Auth token response did not contain an accessToken.");
    }
    return {
      accessToken:     json.accessToken as string,
      token_type:      json.token_type as string,
      expiration_time: json.expiration_time as string,
      app_user:        json.app_user as string,
    };
  }
  // ── Local dev token — replace with a fresh token when you get 401 ──
  // Generate via: POST {TOKEN_URL} with client_credentials grant
  // Token expires in ~1 hour; update ACCESS_TOKEN below when expired.
  const ACCESS_TOKEN = "n-r3fLhVY_UFsMWcXGiGnA";
  return {
    accessToken: ACCESS_TOKEN,
    token_type: "Bearer",
    expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    app_user: "laxmi.kasam@test.exp.com"
  }
}

export function extractToken(t: AuthTokenResponse): string {
  return "accessToken" in t ? t.accessToken : t.token;
}
