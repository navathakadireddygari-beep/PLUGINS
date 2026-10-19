/**
 * Delete API — removes a line or a section from the Financial evaluation.
 *
 * Backend endpoint (single proc for both):
 *   DELETE {api_endpoint}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation
 *
 * Request body:
 *   { fin_eval_line_id }      // deleting a line
 *   { fin_eval_section_id }   // deleting a section
 *
 * Response body:
 *   { api_status: "S" | "E", api_message: "..." }
 */
import type { AppConfig } from "../config/app-config";
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

type DeleteBody =
  | { fin_eval_line_id: number }
  | { fin_eval_section_id: number };

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
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
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

/** Delete a single line. */
export async function deleteLine(cfg: AppConfig, lineId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, { fin_eval_line_id: lineId });
}

/** Delete an entire section. */
export async function deleteSection(cfg: AppConfig, sectionId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, { fin_eval_section_id: sectionId });
}
