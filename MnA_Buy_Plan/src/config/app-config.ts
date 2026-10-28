/**
 * App configuration injected via index.html -> window.__APP_CONFIG__.
 * Same shape/resolution order as the rest of the FinEval suite (see
 * FIN_EVAL/MA/src/config/app-config.ts) — APEX runs the exact same page code
 * for M&A and Buy Plan, so both widgets receive an identical host config
 * object (`app_user`, `app_roles`, `api_endpoint`, `session_id`,
 * ajaxId/flowId/stepId/instance). Buy Plan additionally needs a numeric
 * `user_id` for `created_by` on adjustments, read from the host config or
 * `?user_id=`. The `user_email` header carries `session_id` (falling back to
 * the APEX `instance`), else `app_user`.
 */

export type AppConfig = {
  /** Proposal whose Buy Plan is loaded/saved; null when none is configured. */
  proposal_id: number | null;
  /** Numeric GIS user id, sent as `created_by` on Buy Plan adjustments. */
  user_id: number | null;
  app_user: string;
  /** APEX session id — sent as `user_email` when present (see getApiUserEmail). */
  session_id: string;
  app_roles: string;
  api_endpoint: string;
  /** APEX OAuth AJAX callback context — only present/used inside APEX. */
  ajaxId?: string;
  flowId?: string;
  stepId?: string;
  instance?: string;
};

export interface HostAppConfig {
  proposal_id?: string | number | null;
  /** Explicit override for local testing — APEX itself never sends this. */
  user_id?: string | number | null;
  app_user?: string;
  session_id?: string | number | null;
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
 *
 * Read from VITE_DEV_BASIC_AUTH in .env.local (git-ignored). The DEV check
 * keeps it out of production builds entirely.
 */
export const getBasicAuth = (): string | undefined =>
  import.meta.env.DEV ? import.meta.env.VITE_DEV_BASIC_AUTH : undefined;

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

/** Read a value from the host page's query string. */
const queryParam = (name: string): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get(name) ?? undefined;
};

/** Positive numeric id, or null — anything else (0, "", null) means "absent". */
const numericId = (...values: Array<string | number | null | undefined>): number | null => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

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
    proposal_id: numericId(cfg.proposal_id, queryParam("proposal_id")),
    user_id: numericId(cfg.user_id, queryParam("user_id")),
    // Host value, then a local-dev-only fallback.
    app_user: firstOf(cfg.app_user, local ? LOCAL_DEV_USER_EMAIL : undefined),
    // Host value, then ?session_id=, then the APEX session (`instance`).
    session_id: firstOf(
      cfg.session_id == null ? undefined : String(cfg.session_id),
      queryParam("session_id"),
      cfg.instance
    ),
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

/** Value sent as the `user_email` header: the session id, else app_user. */
export const getApiUserEmail = (): string | undefined => {
  const cfg = getAppConfig();
  return cfg.session_id || cfg.app_user || undefined;
};

/** Auth/identity headers every GIS call carries. */
export const authHeaders = (token: string): Record<string, string> => {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  const role = getApiRole();
  const userEmail = getApiUserEmail();
  if (role) headers.role = role;
  if (userEmail) headers.user_email = userEmail;
  return headers;
};