/**
 * App configuration injected via index.html → window.__APP_CONFIG__
 *
 * Mirrors the reference project (Prod Dev) exactly: the host APEX page is the
 * single source of truth, `getAppConfig()` normalises whatever it injected, and
 * every other module reads the resolved object rather than the raw global.
 *
 * Required (passed from index.html):
 *   - app_user      : User email / identifier sent as the `user_email` header
 *   - api_endpoint  : Base ORDS endpoint, e.g. "https://host:port/ords/xxea_test"
 *
 * Identity of the evaluation to load — exactly one case applies:
 *   Case 1 — proposal exists : proposal_id set, spc_type_id/template_type_id null
 *   Case 2 — no proposal yet : spc_type_id (+ template_type_id) set, proposal_id null
 *
 * Optional (APEX OAuth AJAX call): ajaxId, flowId, stepId, instance
 */

export type AppConfig = {
  proposal_id: number | null;
  /**
   * Host-declared view-only mode. Combined with the proposal's own status by
   * the UI — see `isProposalStatusReadonly` — so either can lock the screen.
   */
  is_readonly: boolean;
  spc_type_id: number | null;
  template_type_id: number | null;
  app_user: string;
  app_roles: string;
  app_language: string;
  api_endpoint: string;
  ajaxId?: string;
  flowId?: string;
  stepId?: string;
  instance?: string;
};

/** Values the host APEX page may inject — the un-normalised form of AppConfig. */
export interface HostAppConfig {
  proposal_id?: string | number | null;
  /** `true` puts the widget in view-only mode regardless of proposal status. */
  is_readonly?: boolean;
  spc_type_id?: string | number | null;
  template_type_id?: string | number | null;
  /** Logged-in user email — sent as the `user_email` header. */
  app_user?: string;
  /** Comma-separated role codes — sent as the `role` header. */
  app_roles?: string;
  /** UI language code — sent as the `language` header. */
  app_language?: string;
  /** Base ORDS endpoint, e.g. "https://host/ords/xxea_test". */
  api_endpoint?: string;
  /** APEX OAuth AJAX callback context. */
  ajaxId?: string;
  flowId?: string;
  stepId?: string;
  instance?: string;
}

/* ─────────────────────────── Dev fallbacks ──────────────────────── */
// Only reached outside APEX (local `npm run dev` / a standalone bundle), and
// only for values index.html did not set. Ids are deliberately NOT defaulted:
// the proposal_id / spc_type_id choice belongs to the host page.
const LOCAL_DEV_ROLES =
  "APP_FIN_GIS_SPC_AUTHOR_SPC_ALL,APP_FIN_GIS_RLS_NA_AUTOMOTIVE_SPC_ALL";
const LOCAL_DEV_USER_EMAIL = "arvind.tammineni@test.exp.com";
const LOCAL_DEV_LANGUAGE = "en";

/* ─────────────────────────── Token endpoint ─────────────────────── */

/** OAuth2 token endpoint, relative to the base URL. */
export const TOKEN_PATH = "/oauth/token";

/**
 * Credentials for the token endpoint, as the base64 payload of the
 * `authorization: Basic …` header — i.e. base64("<client id>:<client secret>").
 *
 * Local-dev only: inside APEX the token comes from the page's own AJAX callback
 * and this is never read. M&A has its own OAuth client, distinct from the
 * reference project's — the two apps talk to different ORDS modules.
 */
const DEV_BASIC_AUTH =
  "QVRCNEI5OEVWZ1RnZm1rUUJ2ek5ndy4uOk9TWDJBVUJoWVZyMThDVG5HOVZQZEEuLg==";

export const getBasicAuth = (): string | undefined => DEV_BASIC_AUTH;

/**
 * A pre-issued bearer token that bypasses the token endpoint entirely, for
 * debugging against one pasted from Postman: append `?token=…` to the URL.
 * Never refreshed.
 */
export const getStaticToken = (): string | undefined => queryParam("token");

/* ─────────────────────────── Host config ────────────────────────── */

/** Whatever the host page injected, or an empty object outside APEX. */
export const getHostConfig = (): HostAppConfig => {
  if (typeof window === "undefined") return {};
  return (
    (window as unknown as { __APP_CONFIG__?: HostAppConfig }).__APP_CONFIG__ ??
    {}
  );
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
const numericId = (
  ...values: Array<string | number | null | undefined>
): number | null => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

/** First non-empty string, or "". */
const firstOf = (...values: Array<string | undefined>): string => {
  const hit = values.find((v) => v !== undefined && v !== "");
  return hit === undefined ? "" : String(hit);
};

/* ─────────────────────────── Resolved config ────────────────────── */

/**
 * The normalised widget config. Resolution order per value:
 *   1. `window.__APP_CONFIG__`  2. the URL query string  3. dev fallbacks.
 */
export const getAppConfig = (): AppConfig => {
  const cfg = getHostConfig();
  const local = isLocalhost();

  return {
    proposal_id: numericId(cfg.proposal_id, queryParam("proposal_id")),
    is_readonly: cfg.is_readonly === true,
    spc_type_id: numericId(cfg.spc_type_id, queryParam("spc_type_id")),
    template_type_id: numericId(
      cfg.template_type_id,
      queryParam("template_type_id"),
    ),
    app_user: firstOf(
      cfg.app_user,
      queryParam("user_email"),
      local ? LOCAL_DEV_USER_EMAIL : undefined,
    ),
    app_roles: firstOf(
      cfg.app_roles,
      queryParam("role"),
      local ? LOCAL_DEV_ROLES : undefined,
    ),
    app_language: firstOf(
      cfg.app_language,
      queryParam("language"),
      LOCAL_DEV_LANGUAGE,
    ),
    api_endpoint: firstOf(cfg.api_endpoint, queryParam("api_endpoint")).replace(
      /\/+$/,
      "",
    ),
    ajaxId: cfg.ajaxId,
    flowId: cfg.flowId,
    stepId: cfg.stepId,
    instance: cfg.instance,
  };
};

/** True when the host page put the widget in view-only mode. */
export const isHostReadonly = (): boolean => getAppConfig().is_readonly;

/** Base URL of the REST module, without a trailing slash. */
export const getApiBaseUrl = (): string => getAppConfig().api_endpoint;

/**
 * Base URL captured at module load, for the axios client's `baseURL`.
 * Prefer `getApiBaseUrl()` anywhere the host config may arrive later.
 */
export const API_BASE_URL = getApiBaseUrl();

/** Comma-separated APEX roles for the `role` header. */
export const getApiRole = (): string | undefined =>
  getAppConfig().app_roles || undefined;

/** Caller identity for the `user_email` header. */
export const getApiUserEmail = (): string | undefined =>
  getAppConfig().app_user || undefined;

/** UI language for the `language` header. */
export const getApiLanguage = (): string | undefined =>
  getAppConfig().app_language || undefined;

/** Proposal id the financial evaluation belongs to (null when not yet created). */
export const getProposalId = (): number | null => getAppConfig().proposal_id;

/** SPC type id for the current proposal template. */
export const getSpcTypeId = (): number | null => getAppConfig().spc_type_id;

/** Template type id for the current proposal template. */
export const getTemplateTypeId = (): number | null =>
  getAppConfig().template_type_id;

/**
 * Auth/identity headers every proposalAuthoring call carries — exactly the trio
 * the reference project sends (`authorization`, `user_email`, `role`), and
 * exactly what the endpoint's own curl uses. `app_language` is kept in the
 * config for the UI but is deliberately not sent: the gateway does not read it,
 * and an extra custom header only widens the CORS preflight.
 */
export const authHeaders = (token: string): Record<string, string> => {
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
  };
  const role = getApiRole();
  const userEmail = getApiUserEmail();
  if (role) headers.role = role;
  if (userEmail) headers.user_email = userEmail;
  return headers;
};

/** Envelope every GIS endpoint wraps its payload in. */
export interface ApiEnvelope<T> {
  /** "S" on success, anything else is treated as a failure. */
  apiStatus: string;
  apiMessage: string;
  data?: { items: T };
}
