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

type DeleteBody =
  | { fin_eval_section_id: number }
  | { fin_eval_line_id:    number };

type DeleteResponse = {
  api_status?:  string;
  api_message?: string;
  [k: string]:  unknown;
};

async function sendDelete(cfg: AppConfig, body: DeleteBody): Promise<DeleteResponse> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/${cfg.proposal_id}/financialEvaluation`;

  //console.log("[delete-api] → DELETE", url, body);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  let json: DeleteResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log("[delete-api] ← response", res.status, json || text);

  const apiMsg    = (json as any).apiMessage || json.api_message || text || res.statusText;
  const apiStatus = (json as any).apiStatus  || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Delete failed (${res.status}).`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Delete failed on server.");
  }
  return json;
}

/** Delete a single line item. */
export async function deleteLine(cfg: AppConfig, lineId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, { fin_eval_line_id: lineId });
}

/** Delete an entire section and all its lines. */
export async function deleteSection(cfg: AppConfig, sectionId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, { fin_eval_section_id: sectionId });
}
