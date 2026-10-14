/**
 * Delete API — removes a line or a section from the Financial evaluation.
 *
 * Backend endpoint (single proc for both):
 *   DELETE {api_endpoint}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation
 *
 * Request body — pass exactly one of the two:
 *   { fin_eval_line_id }      // delete a single line
 *   { fin_eval_section_id }   // delete an entire section
 *
 * Response body:
 *   { api_status: "S" | "E", api_message: "..." }
 */
import type { AppConfig } from "../config/app-config";
import { authHeaders } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";

let cachedToken: string | null = null;

async function getBearerToken(cfg: AppConfig): Promise<string> {
  if (cachedToken) return cachedToken;
  const resp = await fetchAuthToken(cfg);
  cachedToken = extractToken(resp);
  return cachedToken;
}

export function clearCachedToken(): void {
  cachedToken = null;
}

type DeleteBody =
  | { fin_eval_line_id:    number }
  | { fin_eval_section_id: number };

type DeleteResponse = {
  api_status?:  string;
  api_message?: string;
  apiStatus?:   string;
  apiMessage?:  string;
  [k: string]:  unknown;
};

async function sendDelete(cfg: AppConfig, body: DeleteBody, proposalIdOverride?: number | null): Promise<DeleteResponse> {
  // The proposal id is part of the path, so a missing one must fail loudly —
  // it previously produced ".../proposalAuthoring/null/financialEvaluation",
  // which the backend answers without deleting anything.
  const proposalId = cfg.proposal_id ?? proposalIdOverride ?? null;
  if (proposalId == null) {
    throw new Error("Cannot delete: no proposal_id available.");
  }
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/${proposalId}/financialEvaluation`;

  //console.log("[delete-api] → DELETE", url, body);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(cfg, token),
    },
    body: JSON.stringify(body),
  });

  // Read the body first (prod-dev behaviour): ORDS returns the real reason in
  // api_message even on a non-2xx, so parsing before the status check gives the
  // user something better than "Delete failed (500)".
  const text = await res.text().catch(() => "");
  let json: DeleteResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log("[delete-api] ← response", res.status, json || text);

  const apiMsg    = (json.apiMessage as string) || json.api_message || text || res.statusText;
  const apiStatus = (json.apiStatus  as string) || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Delete failed (${res.status}).`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Delete failed on server.");
  }
  return json;
}

/** Delete a single line. */
export async function deleteLine(cfg: AppConfig, lineId: number, proposalId?: number | null): Promise<DeleteResponse> {
  return sendDelete(cfg, { fin_eval_line_id: lineId }, proposalId);
}

/** Delete an entire section. */
export async function deleteSection(cfg: AppConfig, sectionId: number, proposalId?: number | null): Promise<DeleteResponse> {
  return sendDelete(cfg, { fin_eval_section_id: sectionId }, proposalId);
}
