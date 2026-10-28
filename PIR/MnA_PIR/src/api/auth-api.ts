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

// Build-time signal, not a runtime probe. window.$v (APEX's own JS helper) only
// exists once apex.js has actually executed — not guaranteed at the exact
// instant an early mount-time effect fires (e.g. a fetch that runs the moment
// a component mounts, before user interaction). A false negative here skipped
// the real APEX AJAX call entirely and silently returned a hardcoded fake
// token below instead, which then failed authorisation on the real ORDS call.
// import.meta.env.DEV is replaced with a literal at build time, so it can
// never race — the production bundle always resolves true (real APEX), the
// dev server always resolves false (local token endpoint).
function isApexEnvironment(): boolean {
  return !import.meta.env.DEV;
}

export async function fetchAuthToken(cfg: AppConfig): Promise<AuthTokenResponse> {
  const isApex = isApexEnvironment();

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
  // ── Local dev token ──
  // Only reached by the dev server (production builds always take the APEX
  // branch above, so Vite drops this code from the bundle). Set
  // VITE_DEV_ACCESS_TOKEN / VITE_DEV_APP_USER in PLUGINS/.env.local — never
  // commit a real token here.
  if (!import.meta.env.DEV) {
    throw new Error("No APEX context: an auth token is only available inside APEX.");
  }
  return {
    accessToken: import.meta.env.VITE_DEV_ACCESS_TOKEN ?? "",
    token_type: "Bearer",
    expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    app_user: import.meta.env.VITE_DEV_APP_USER ?? "",
  }
}

export function extractToken(t: AuthTokenResponse): string {
  return "accessToken" in t ? t.accessToken : t.token;
}
