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
 * Same credential as FIN_EVAL/MA — BuyPlan calls the same M&A GIS ORDS
 * module (`api_endpoint` in index.html), so it shares M&A's OAuth client.
 */
const DEV_BASIC_AUTH =
  "QVRCNEI5OEVWZ1RnZm1rUUJ2ek5ndy4uOk9TWDJBVUJoWVZyMThDVG5HOVZQZEEuLg==";

export const getBasicAuth = (): string | undefined => DEV_BASIC_AUTH;

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

/** Base URL of the REST module, without a trailing slash. */
export const getApiBaseUrl = (): string => getAppConfig().api_endpoint;

/**
 * Base URL captured at module load — mirrors FIN_EVAL/MA's `API_BASE_URL`,
 * used by `auth-api.ts`'s OAuth token request.
 */
export const API_BASE_URL = getApiBaseUrl();

/** Comma-separated APEX roles for the `role` header. */
export const getApiRole = (): string | undefined => getAppConfig().app_roles || undefined;

/** Caller identity for the `user_email` header. */
export const getApiUserEmail = (): string | undefined => getAppConfig().app_user || undefined;

/** Auth/identity headers every proposalAuthoring call carries. */
export const authHeaders = (token: string): Record<string, string> => {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  const role = getApiRole();
  const userEmail = getApiUserEmail();
  if (role) headers.role = role;
  if (userEmail) headers.user_email = userEmail;
  return headers;
};
