/**
 * Admin messages API
 *
 * GET {api_endpoint}/GIS/adminManagement/messages?message_code={code}
 *   → { apiStatus, apiMessage, data: { items: [{ message_code, message_text, status, ... }] } }
 *
 * Admin-maintained UI copy (e.g. the hint beside Validate / Save Model), so the
 * text can change without redeploying the plugin.
 */
import type { AppConfig } from "../config/app-config";
import { authFetch } from "./financial-api";

/** Hint shown beside the Back / Validate / Save Model buttons. */
export const IMPORT_FE_LOAD_MSG = "XXEXP_GIS_IMPORT_FE_LOAD_MSG";

type AdminMessage = {
  message_code?: string;
  message_text?: string | null;
  status?:       string | null;
};

// Messages don't change during a page session — one request per code (the
// promise itself, so concurrent callers share it). A failed request is evicted
// so a later mount can retry.
const messageCache = new Map<string, Promise<string>>();

/** message_text of the ACTIVE message for `code`, or "" when there is none. */
export function getAdminMessage(cfg: AppConfig, code: string): Promise<string> {
  const cached = messageCache.get(code);
  if (cached) return cached;
  const request = fetchAdminMessage(cfg, code);
  messageCache.set(code, request);
  request.catch(() => messageCache.delete(code));
  return request;
}

async function fetchAdminMessage(cfg: AppConfig, code: string): Promise<string> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const url = `${cfg.api_endpoint}/GIS/adminManagement/messages?message_code=${encodeURIComponent(code)}`;

  const res = await authFetch(cfg, url, (token) => ({
    headers: {
      Accept:        "application/json",
      Authorization: `Bearer ${token}`,
      user_email:    cfg.app_user,
      role:          cfg.app_roles,
      language:      "US",
    },
  }));
  if (!res.ok) throw new Error(`Failed to load message ${code} (${res.status}).`);

  const json = await res.json() as { apiStatus?: string; apiMessage?: string; data?: { items?: AdminMessage[] } };
  if (json.apiStatus && json.apiStatus !== "S" && json.apiStatus !== "SUCCESS") {
    throw new Error(json.apiMessage || `Failed to load message ${code}.`);
  }

  const item = (json.data?.items ?? []).find(
    (m) => m.message_code === code && (m.status ?? "ACTIVE").toUpperCase() === "ACTIVE",
  );
  return item?.message_text?.trim() ?? "";
}
