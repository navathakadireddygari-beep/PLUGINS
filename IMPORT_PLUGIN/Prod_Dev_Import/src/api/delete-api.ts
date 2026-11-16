/**
 * Delete API — removes a custom line or a custom section from the staged
 * (imported) Financial evaluation.
 *
 * Backend endpoint (single proc for both):
 *   DELETE {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
 *
 * Request body:
 *   { finEvalLineStgId }      // deleting a line
 *   { finEvalSectionStgId }   // deleting a section
 *
 * Response body:
 *   { apiStatus: "S" | "E", apiMessage: "...", data: { file, header } }
 */
import type { AppConfig } from "../config/app-config";
// Same token as every other call (load / save / validate): one auth request
// per session, and a token cleared after any failure is refreshed here too.
import { authFetch } from "./financial-api";

type DeleteBody =
  | { finEvalSectionStgId: number }
  | { finEvalLineStgId:    number };

type DeleteResponse = {
  api_status?:  string;
  api_message?: string;
  [k: string]:  unknown;
};

async function sendDelete(cfg: AppConfig, body: DeleteBody): Promise<DeleteResponse> {
  if (cfg.file_id == null) throw new Error("Missing file_id — cannot delete from the staged evaluation.");
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/${cfg.file_id}`;

  //console.log("[delete-api] → DELETE", url, body);

  // A 401 is retried once with a fresh token (see authFetch).
  const res = await authFetch(cfg, url, (token) => ({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify(body),
  }));

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
  return sendDelete(cfg, { finEvalLineStgId: lineId });
}

/** Delete an entire section and all its lines. */
export async function deleteSection(cfg: AppConfig, sectionId: number): Promise<DeleteResponse> {
  return sendDelete(cfg, { finEvalSectionStgId: sectionId });
}
