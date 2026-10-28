/**
 * App configuration injected via index.html → window.__APP_CONFIG__
 *
 * Required (passed from index.html):
 *   - proposal_id   : Financial proposal id
 *   - app_user      : User email / identifier saved with PUT payloads
 *   - api_endpoint  : Base ORDS endpoint, e.g. "https://host:port/ords/xxea_test"
 *
 * Optional (APEX OAuth AJAX call): ajaxId, flowId, stepId, instance, viaAiBrain
 * Optional (KPIVariance fallback when proposal_id is null): spc_type_id, spc_type_template_id
 */
export type AppConfig = {
  proposal_id:  number | string;
  app_user:     string;
  api_endpoint: string;
  ajaxId?:      string;
  flowId?:      string;
  stepId?:      string;
  instance?:    string;
  viaAiBrain?:  boolean;
  /** Optional bearer token for local-dev testing of live REST calls. */
  dev_token?:   string;
  /** SPC type + template ids — let KPIVariance resolve KPIs when proposal_id is null. */
  spc_type_id?:          number | string;
  spc_type_template_id?: number | string;
  /** Numeric user id sent as `created_by` on adjustments. Omitted when unset
   *  (the backend then defaults to -1) — app_user is an email, not this id. */
  created_by?:           number | string;
  /** Comma-separated APP_FIN_GIS_* grants. Sent as the `role` header — ORDS
   *  returns 403 without it. */
  role?:                 string;
  /** Sent as the `user_email` header; falls back to app_user when unset. */
  user_email?:           string;
};

/**
 * The signed-in APEX user, read from the page's APP_USER item.
 *
 * Only a fallback: when the plugin's PL/SQL supplies app_user / user_email those
 * win. It covers the case where the plugin renders __APP_CONFIG__ without them,
 * which otherwise sends the request with no `user_email` header at all. There is
 * no equivalent for `role` — the grants aren't exposed to the browser, so a
 * missing role can only be fixed in the plugin.
 */
function apexUser(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const $v = (window as unknown as { $v?: (item: string) => string | undefined }).$v;
  if (typeof $v !== "function") return undefined;
  try {
    return $v("APP_USER") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Config as rendered by the host page, before defaults are applied.
 *
 * `template_type_id` is the spelling one of the APEX regions uses for what this
 * app calls `spc_type_template_id`; both are accepted below.
 */
type RawConfig = Partial<AppConfig> & { template_type_id?: number | string };

/**
 * The APEX page carries two config globals, and neither is complete on its own:
 *
 *   __SPC_PD_PIR_CONFIG__  the PIR plugin's own render — carries `role`
 *   __APP_CONFIG__         rendered by another region — no `role` key
 *
 * Reading only __APP_CONFIG__ meant the `role` header was never sent, and the
 * endpoints answer 403 "You are not authorised to view this financial
 * evaluation" without it. So both are merged: __APP_CONFIG__ wins wherever it
 * actually supplies a value, and __SPC_PD_PIR_CONFIG__ fills the gaps.
 *
 * Blank strings and nulls count as gaps, not as values — an empty `role` from
 * one global must not mask a populated one in the other.
 */
function readHostConfig(): RawConfig {
  if (typeof window === "undefined") return {};
  const w = window as unknown as {
    __APP_CONFIG__?:        RawConfig;
    __SPC_PD_PIR_CONFIG__?: RawConfig;
  };

  const merged: Record<string, unknown> = { ...(w.__SPC_PD_PIR_CONFIG__ ?? {}) };
  for (const [key, value] of Object.entries(w.__APP_CONFIG__ ?? {})) {
    if (value !== undefined && value !== null && value !== "") merged[key] = value;
  }
  return merged as RawConfig;
}

export function getAppConfig(): AppConfig {
  const cfg = readHostConfig();
  return {
    proposal_id:  cfg.proposal_id ?? 0,
    app_user:     cfg.app_user    ?? "",
    api_endpoint: (cfg.api_endpoint ?? "").toString().replace(/\/+$/, ""),
    ajaxId:       cfg.ajaxId,
    flowId:       cfg.flowId,
    stepId:       cfg.stepId,
    instance:     cfg.instance,
    viaAiBrain:   cfg.viaAiBrain,
    dev_token:    cfg.dev_token,
    spc_type_id:          cfg.spc_type_id,
    // Accept either spelling — the two host regions disagree on the name.
    spc_type_template_id: cfg.spc_type_template_id ?? cfg.template_type_id,
    created_by:           cfg.created_by,
    role:                 cfg.role,
    user_email:           cfg.user_email || cfg.app_user || apexUser(),
  };
}

/**
 * Headers every ORDS call must carry. `role` and `user_email` are enforced by
 * the endpoints — without them the request is rejected with 403 even when the
 * bearer token is valid. Undefined values are dropped by fetchJson.
 */
export function authContextHeaders(
  cfg: AppConfig = getAppConfig(),
): Record<string, string | undefined> {
  return {
    role:       cfg.role || undefined,
    user_email: cfg.user_email || cfg.app_user || undefined,
  };
}

/**
 * Which of the two required auth-context values the host page failed to supply.
 *
 * A missing `role` is invisible at the network layer — fetchJson drops undefined
 * headers, so the request goes out looking normal and the endpoint answers 403
 * with a business message ("You are not authorised to view this financial
 * evaluation") that reads like a data problem rather than a config one. Callers
 * use this to say which it actually is.
 */
export function missingAuthContext(cfg: AppConfig = getAppConfig()): string[] {
  const headers = authContextHeaders(cfg);
  return (["role", "user_email"] as const).filter((key) => !headers[key]);
}

/**
 * The auth context as it goes on the wire, for logs.
 *
 * `role` is the exact header value — comparing it character-for-character
 * against what the host page set is the only way to tell a truncated or
 * re-ordered grant list from a genuine entitlement gap. The split-out arrays
 * are conveniences; `rls_grants` is the subset the per-proposal authorisation
 * check reads.
 */
export function describeAuthContext(cfg: AppConfig = getAppConfig()): {
  role:                string | undefined;
  role_header_present: boolean;
  role_grant_count:    number;
  grants:              string[];
  rls_grants:          string[];
  user_email:          string | undefined;
} {
  const { role, user_email } = authContextHeaders(cfg);
  const grants = (role ?? "").split(",").map((g) => g.trim()).filter(Boolean);
  return {
    role,
    role_header_present: Boolean(role),
    role_grant_count:    grants.length,
    grants,
    rls_grants:          grants.filter((g) => g.toUpperCase().includes("_RLS_")),
    user_email,
  };
}

/**
 * True only when a usable proposal id is present. A missing id (null/undefined)
 * is coerced to 0 by getAppConfig, and 0 / "" / NaN are never valid proposals,
 * so callers should skip API requests and render a "no proposal" state instead.
 */
export function hasValidProposalId(cfg: AppConfig): boolean {
  const n = Number(cfg.proposal_id);
  return Number.isFinite(n) && n > 0;
}

/**
 * True when the SPC type + template ids are present. KPIVariance uses these to
 * return template-default KPIs when proposal_id is null, so callers can still
 * load the KPI tiles in that case even though hasValidProposalId is false.
 */
export function hasSpcTemplate(cfg: AppConfig): boolean {
  return cfg.spc_type_id != null && cfg.spc_type_id !== "" &&
         cfg.spc_type_template_id != null && cfg.spc_type_template_id !== "";
}
