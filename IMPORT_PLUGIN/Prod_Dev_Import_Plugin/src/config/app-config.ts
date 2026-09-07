/**
 * App configuration injected via index.html → window.__APP_CONFIG__
 *
 * Required (passed from index.html):
 *   - proposal_id   : Financial proposal id
 *   - app_user      : User email / identifier saved with PUT payloads
 *   - api_endpoint  : Base ORDS endpoint, e.g. "https://host:port/ords/xxea_test"
 *
 * Optional (APEX OAuth AJAX call): ajaxId, flowId, stepId, instance, viaAiBrain
 */
export type AppConfig = {
  proposal_id:  number | null;
  file_id:      number | null;
  spc_type_id:  number | null;
  app_user:     string;
  api_endpoint: string;
  is_readonly:  boolean;
  app_roles:    string;
  ajaxId?:      string;
  flowId?:      string;
  stepId?:      string;
  instance?:    string;
};

// Fallback roles used only on localhost for development/testing.
const LOCAL_DEV_ROLES =
  "APP_FIN_GIS_RLS_NA_AUTOMOTIVE_PRODUCT_DEVELOPMENT,APP_FIN_GIS_SPC_AUTHOR_PRODUCT_DEVELOPMENT";

export function getAppConfig(): AppConfig {
  const cfg =
    (typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: Partial<AppConfig> }).__APP_CONFIG__
      : undefined) || {};

  const isLocalhost = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  return {
    proposal_id:  Number(cfg.proposal_id) > 0 ? Number(cfg.proposal_id) : null,
    file_id:      Number(cfg.file_id) > 0 ? Number(cfg.file_id) : null,
    spc_type_id:  Number(cfg.spc_type_id) > 0 ? Number(cfg.spc_type_id) : null,
    app_user:     cfg.app_user     ?? "",
    api_endpoint: (cfg.api_endpoint ?? "").toString().replace(/\/+$/, ""),
    is_readonly:  cfg.is_readonly === true,
    app_roles:    cfg.app_roles   ?? (isLocalhost ? LOCAL_DEV_ROLES : ""),
    ajaxId:       cfg.ajaxId,
    flowId:       cfg.flowId,
    stepId:       cfg.stepId,
    instance:     cfg.instance,
  };
}
