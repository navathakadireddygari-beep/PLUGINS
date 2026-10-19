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
import { authHeaders } from "../config/app-config";
// Same token as every other call (load / save / validate): one auth request
// per session, and a token cleared after any failure is refreshed here too.
import { authFetch } from "./financial-api";

async function extractApiError(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const j = text ? JSON.parse(text) : {};
    const msg = j.apiMessage || j.api_message || j.message || "";
    if (msg) return msg;
  } catch { /* non-JSON body */ }
  return text || fallback;
}

type DeleteBody = {
  user_email: string;
  section_id: number | null;
  line_id:    number | null;
};

type DeleteResponse = {
  api_status?:  string;
  api_message?: string;
  apiStatus?:   string;
  apiMessage?:  string;
  [k: string]:  unknown;
};

async function sendDelete(cfg: AppConfig, body: DeleteBody): Promise<DeleteResponse> {
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/${cfg.proposal_id}/financialEvaluation`;

  //console.log("[delete-api] → DELETE", url, body);

  // A 401 is retried once with a fresh token (see authFetch).
  const res = await authFetch(cfg, url, (token) => ({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      proposal_id:    String(cfg.proposal_id),
      ...authHeaders(cfg, token),
    },
    body: JSON.stringify(body),
  }));

  if (!res.ok) {
    const msg = await extractApiError(res, `Delete failed (${res.status}).`);
    throw new Error(msg);
  }

  const text = await res.text().catch(() => "");
  let json: DeleteResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log("[delete-api] ← response", res.status, json || text);

  const apiMsg    = json.apiMessage || json.api_message || "";
  const apiStatus = json.apiStatus  || json.api_status  || "";
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Delete failed on server.");
  }
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
