/**
 * App configuration injected by the host page via window.__APP_CONFIG__
 * (set by the APEX plugin's p_render procedure).
 *
 * Plugin parameters:
 *   - proposal_id      : Financial proposal id (set once a proposal exists)
 *   - spc_type_id      : SPC type id (used when no proposal exists yet)
 *   - template_type_id : Template type id passed to every API call
 *   - app_user         : Logged-in user email — sent as the `user_email` header
 *                         and recorded with every save payload
 *   - app_roles        : Comma-separated role codes (G_APP_ROLES) — sent as
 *                         the `role` header on every API call for authorization
 *   - is_readonly      : Computed server-side from proposal ownership /
 *                         collaborator access level / role — when true, the
 *                         UI blocks every add/delete/rename/value-edit action
 *
 * Infrastructure:
 *   - api_endpoint     : Base ORDS endpoint, e.g. "https://host:port/ords/xxea_test"
 *
 * Optional (APEX OAuth AJAX call): ajaxId, flowId, stepId, instance
 */
export type AppConfig = {
  proposal_id:      number | null;
  spc_type_id:      number | null;
  template_type_id: number | null;
  app_user:         string;
  app_roles:        string;
  is_readonly:      boolean;
  api_endpoint:     string;
  ajaxId?:          string;
  flowId?:          string;
  stepId?:          string;
  instance?:        string;
};

export function getAppConfig(): AppConfig {
  const cfg =
    (typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: Partial<AppConfig> }).__APP_CONFIG__
      : undefined) || {};
  return {
    proposal_id:      Number(cfg.proposal_id)      > 0 ? Number(cfg.proposal_id)      : null,
    spc_type_id:      Number(cfg.spc_type_id)      > 0 ? Number(cfg.spc_type_id)      : null,
    template_type_id: Number(cfg.template_type_id) > 0 ? Number(cfg.template_type_id) : null,
    app_user:         cfg.app_user     ?? "",
    app_roles:        cfg.app_roles    ?? "",
    // Matches the prod-dev build: the widget is editable unless the host page
    // explicitly sends is_readonly: true. Defaulting to locked silently
    // disabled every add / delete / rename action whenever the APEX page
    // omitted the parameter.
    is_readonly:      cfg.is_readonly === true,
    api_endpoint:     (cfg.api_endpoint ?? "").toString().replace(/\/+$/, ""),
    ajaxId:           cfg.ajaxId,
    flowId:           cfg.flowId,
    stepId:           cfg.stepId,
    instance:         cfg.instance,
  };
}

/** Common auth/identity headers required by every proposalAuthoring API call. */
export function authHeaders(cfg: AppConfig, token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    user_email:    cfg.app_user,
    role:          cfg.app_roles,
  };
}
