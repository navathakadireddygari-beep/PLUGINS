/**
 * App configuration injected by the host page via window.__SPC_SALES_CONFIG__.
 *
 * Plugin parameters (all 4 required when embedding as a plug-in):
 *   - proposal_id      : Financial proposal id (set once a proposal exists)
 *   - spc_type_id      : SPC type id (used when no proposal exists yet)
 *   - template_type_id : Template type id passed to every API call
 *   - app_user         : Logged-in user email — sent with every save payload
 *
 * Infrastructure:
 *   - api_endpoint     : Base ORDS endpoint, e.g. "https://host:port/ords/xxea_test"
 *
 * Access control (resolved server-side in the plugin's p_render):
 *   - is_readonly      : When true, all editing/saving/deleting is disabled.
 *                        Defaults to TRUE (fail closed) when missing/malformed.
 *   - app_roles        : Logged-in user's roles (from V('G_APP_ROLES')),
 *                        kept as the raw string and sent to the backend as the
 *                        `role` header on every write (save/update/delete).
 *
 * Optional (APEX OAuth AJAX call): ajaxId, flowId, stepId, instance
 */
export type AppConfig = {
  proposal_id:      number | null;
  spc_type_id:      number | null;
  template_type_id: number | null;
  app_user:         string;
  api_endpoint:     string;
  is_readonly:      boolean;
  app_roles:        string;
  ajaxId?:          string;
  flowId?:          string;
  stepId?:          string;
  instance?:        string;
};

export function getAppConfig(): AppConfig {
  const cfg =
    (typeof window !== "undefined"
      ? (window as unknown as { __SPC_SALES_CONFIG__?: Record<string, unknown> }).__SPC_SALES_CONFIG__
      : undefined) || {};

  // Fail closed (least privilege) — mirrors the p_render `lv_is_readonly := TRUE`
  // default. Only an explicit boolean false (or the string "false") from the
  // host grants edit access; anything missing or malformed stays read-only.
  const rawReadonly = cfg.is_readonly;
  const is_readonly = !(rawReadonly === false || rawReadonly === "false");

  // app_roles arrives as a string from V('G_APP_ROLES'). Keep it raw (trimmed)
  // so it can be forwarded verbatim to the backend as the `role` header.
  const app_roles = typeof cfg.app_roles === "string" ? cfg.app_roles.trim() : "";

  return {
    proposal_id:      Number(cfg.proposal_id)      > 0 ? Number(cfg.proposal_id)      : null,
    spc_type_id:      Number(cfg.spc_type_id)      > 0 ? Number(cfg.spc_type_id)      : null,
    template_type_id: Number(cfg.template_type_id) > 0 ? Number(cfg.template_type_id) : null,
    app_user:         (cfg.app_user as string)     ?? "",
    api_endpoint:     String(cfg.api_endpoint ?? "").replace(/\/+$/, ""),
    is_readonly,
    app_roles,
    ajaxId:           cfg.ajaxId   as string | undefined,
    flowId:           cfg.flowId   as string | undefined,
    stepId:           cfg.stepId   as string | undefined,
    instance:         cfg.instance as string | undefined,
  };
}
