/**
 * Delete API — removes a line or a section from the Financial evaluation.
 *
 * Backend endpoint (single proc for both):
 *   DELETE {api_endpoint}/Financial/delete/{proposal_id}
 *
 * Request body (matches XXEX_GIS_FIN_EVAL_PKG.delete_fin_eval_prc):
 *   { user_email, section_id, line_id }   // pass null for the one you're not targeting
 *
 * Response body:
 *   { api_status: "S" | "E", api_message: "..." }
 */
import type { AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { notifyDataChanged } from "../lib/refresh-bus";
import { extractApiErrorMessage } from "../lib/http";

let cachedToken: string | null = null;

async function getBearerToken(cfg: AppConfig): Promise<string> {
  if (cachedToken) return cachedToken;
  // Match the dev-stub pattern used in financial-api.ts while backend auth is off.
  const resp = await fetchAuthToken(cfg);
  cachedToken = extractToken(resp);
  void fetchAuthToken; void extractToken; void cfg;
  return cachedToken;
}

export function clearCachedToken(): void {
  cachedToken = null;
}

type DeleteBody = {
  user_email: string;
  section_id: number | null;
  line_id:    number | null;
};

type DeleteResponse = {
  api_status?:  string;
  api_message?: string;
  [k: string]:  unknown;
};

async function sendDelete(cfg: AppConfig, body: DeleteBody): Promise<DeleteResponse> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/${cfg.proposal_id}/financialEvaluation`;

  console.log("[delete-api] → DELETE", url, body);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      proposal_id:    String(cfg.proposal_id),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  let json: DeleteResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  console.log("[delete-api] ← response", res.status, json || text);

  if (!res.ok) {
    throw new Error(json.api_message || extractApiErrorMessage(text) || `HTTP ${res.status}: ${res.statusText}`);
  }
  if (json.api_status && json.api_status !== "S" && json.api_status !== "SUCCESS") {
    throw new Error(json.api_message || "Delete failed on server.");
  }
  notifyDataChanged("DELETE financialEvaluation");
  return json;
}

/** Delete a single line. Pass null for section_id. */
export async function deleteLine(cfg: AppConfig, lineId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, {
    user_email: cfg.app_user,
    section_id: null,
    line_id:    lineId,
  });
}

/** Delete an entire section. Pass null for line_id. */
export async function deleteSection(cfg: AppConfig, sectionId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, {
    user_email: cfg.app_user,
    section_id: sectionId,
    line_id:    null,
  });
}
