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
    const json = JSON.parse(await resp.text());
    return {
      accessToken:     json.accessToken,
      token_type:      json.token_type,
      expiration_time: json.expiration_time,
      app_user:        json.app_user,
    };
  }
  // ── Local dev token — replace with a fresh token when you get 401 ──
  // Generate via: POST {TOKEN_URL} with client_credentials grant
  // Token expires in ~1 hour; update ACCESS_TOKEN below when expired.
  const ACCESS_TOKEN = "48CUhIPMR4SZgQC92jch_g";
  return {
    accessToken: ACCESS_TOKEN,
    token_type: "Bearer",
    expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    app_user: "satish.mallagundla@eappsys.com",
  }
}

export function extractToken(t: AuthTokenResponse): string {
  return "accessToken" in t ? t.accessToken : t.token;
}
