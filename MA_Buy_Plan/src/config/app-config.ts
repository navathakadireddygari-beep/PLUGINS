/**
 * App configuration injected via index.html -> window.__APP_CONFIG__.
 * Same shape/resolution order as the rest of the FinEval suite (see
 * FIN_EVAL/MA/src/config/app-config.ts), trimmed to what BuyPlan needs: just
 * enough to call the shared currencyExchangeRates endpoint.
 */

export type AppConfig = {
  app_user: string;
  app_roles: string;
  api_endpoint: string;
  /** APEX OAuth AJAX callback context — only present/used inside APEX. */
  ajaxId?: string;
  flowId?: string;
  stepId?: string;
  instance?: string;
};

export interface HostAppConfig {
  app_user?: string;
  app_roles?: string;
  api_endpoint?: string;
  ajaxId?: string;
  flowId?: string;
  stepId?: string;
  instance?: string;
}

const LOCAL_DEV_ROLES =
  "APP_FIN_GIS_SPC_AUTHOR_SPC_ALL,APP_FIN_GIS_RLS_NA_AUTOMOTIVE_SPC_ALL";
const LOCAL_DEV_USER_EMAIL = "arvind.tammineni@test.exp.com";

/** OAuth2 token endpoint, relative to `api_endpoint`. */
export const TOKEN_PATH = "/oauth/token";

/**
 * Base64 `<client id>:<client secret>` for the token endpoint's
 * `authorization: Basic …` header — local-dev only (inside APEX the token
 * comes from the page's own AJAX callback instead, see `api/auth-api.ts`).
 *
 * Deliberately NOT hardcoded here: set `VITE_BUYPLAN_BASIC_AUTH` in a local
 * `.env` file to test the OAuth path outside APEX. Without it, live-rate
 * fetches simply fail and the UI falls back to the manual FX rate input.
 */
export const getBasicAuth = (): string | undefined => {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env.VITE_BUYPLAN_BASIC_AUTH;
};

/** A pre-issued bearer token for debugging: append `?token=…` to the URL. */
export const getStaticToken = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("token") ?? undefined;
};

/** True when running inside an APEX page (APEX defines the `$v` global). */
export const isApexHost = (): boolean =>
  typeof window !== "undefined" && "$v" in window;

const isLocalhost = (): boolean =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const firstOf = (...values: Array<string | undefined>): string => {
  const hit = values.find((v) => v !== undefined && v !== "");
  return hit === undefined ? "" : String(hit);
};

export const getAppConfig = (): AppConfig => {
  const cfg: HostAppConfig =
    (typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: HostAppConfig }).__APP_CONFIG__
      : undefined) ?? {};
  const local = isLocalhost();

  return {
    app_user: firstOf(cfg.app_user, local ? LOCAL_DEV_USER_EMAIL : undefined),
    app_roles: firstOf(cfg.app_roles, local ? LOCAL_DEV_ROLES : undefined),
    api_endpoint: (cfg.api_endpoint ?? "").toString().replace(/\/+$/, ""),
    ajaxId: cfg.ajaxId,
    flowId: cfg.flowId,
    stepId: cfg.stepId,
    instance: cfg.instance,
  };
};
