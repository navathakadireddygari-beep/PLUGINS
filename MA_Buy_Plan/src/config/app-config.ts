/**
 * App configuration injected via index.html -> window.__APP_CONFIG__.
 * Same shape/resolution order as the rest of the FinEval suite (see
 * FIN_EVAL/MA/src/config/app-config.ts), trimmed to what BuyPlan needs: the
 * proposal to load plus what the proposalAuthoring endpoints need.
 */

export type AppConfig = {
  /** Proposal whose Buy Plan is loaded/saved; null when none is configured. */
  proposal_id: number | null;
  app_user: string;
  /**
   * APEX session id. Buy Plan sends it as `user_email` (header + save body)
   * in place of `app_user` — the other FinEval plugins still send app_user.
   * "" when unknown.
   */
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
  app_user?: string;
  session_id?: string | number;
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
    app_user: firstOf(cfg.app_user, local ? LOCAL_DEV_USER_EMAIL : undefined),
    // Explicit `session_id`, else `?session_id=`, else the APEX session the
    // host already passes as `instance` (&APP_SESSION.) for the auth callback.
    session_id: firstOf(
      cfg.session_id != null ? String(cfg.session_id) : undefined,
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

/**
 * Value sent as `user_email` (header and save body): the APEX session id.
 * Falls back to `app_user` only when no session id is available (e.g. local
 * dev outside APEX), so the field is never sent empty.
 */
export const getApiUserEmail = (): string | undefined => {
  const cfg = getAppConfig();
  return cfg.session_id || cfg.app_user || undefined;
};

/** Auth/identity headers every proposalAuthoring call carries. */
export const authHeaders = (token: string): Record<string, string> => {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  const role = getApiRole();
  const userEmail = getApiUserEmail();
  if (role) headers.role = role;
  if (userEmail) headers.user_email = "402051823629786";
  return headers;
};