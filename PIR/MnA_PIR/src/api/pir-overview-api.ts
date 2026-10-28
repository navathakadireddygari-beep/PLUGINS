/**
 * PIR Overview — proposal-level Post-Investment Review summary.
 *
 * Endpoint: https://gisdev.uk.experian.com/api/GIS/MA/PIR/overview
 * GET → proposal header, the scoring summary across the 6/12/24-month
 * milestones and the PIR calendar.
 *
 * Request headers:
 *   - proposal_id : financial proposal id
 *
 * Live in APEX (Bearer token via auth-api); in local dev it routes through the
 * Vite "/api/GIS/MA" proxy with an optional dev token.
 */
import type { AppConfig } from "../config/app-config";
import { authContextHeaders } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson, extractApiErrorMessage, REQUEST_TIMEOUT_MS } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Wire types ─────────────────────────── */
export type PirOverviewProposalInfo = {
  proposal_code: string;
  proposal_title: string;
  completion_date: string;
};

/** Per-milestone scoring. Status fields are null until that period is assessed. */
export type PirOverviewScoring = {
  overall_status?: string | null;
  overall_criteria?: string | null;
  integration_status?: string | null;
  integration_criteria?: string | null;
  revenue_to_date_status?: string | null;
  revenue_to_date_criteria?: string | null;
  ebit_to_date_status?: string | null;
  ebit_to_date_criteria?: string | null;
  revenue_forecast_status?: string | null;
  revenue_forecast_criteria?: string | null;
  ebit_forecast_status?: string | null;
  ebit_forecast_criteria?: string | null;
  evidence_of_benefits_status?: string | null;
  evidence_of_benefits?: string | null;
  risk_status?: string | null;
  risk?: string | null;
  executive_summary?: string | null;
  lessons_learned?: string | null;
};

export type PirOverviewMilestone = {
  milestone_code: string;
  milestone_label: string;
  milestone_date: string;
  milestone_status: string;
  scoring: PirOverviewScoring;
  executive_summary?: string | null;
  lessons_learned?: string | null;
};

export type PirCalendarEntry = {
  milestone_code: string;
  label: string;
  date: string;
  status: string;
};

export type PirOverviewData = {
  proposal_info: PirOverviewProposalInfo;
  milestones: PirOverviewMilestone[];
  pir_calendar: PirCalendarEntry[];
};

export type PirOverviewResponse = {
  apiStatus: string;
  apiMessage: string;
  data: PirOverviewData;
};

/* ─────────────────────────── Network call ───────────────────────── */
const PIR_OVERVIEW_PATH = "/GIS/MA/PIR/overview";

export function buildPirOverviewUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${PIR_OVERVIEW_PATH}`;
}

function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PIR_TOKEN;
  return fromCfg || fromEnv;
}

export async function getPirOverview(
  cfg: AppConfig,
  opts: { proposalId?: number | string } = {},
): Promise<PirOverviewData> {
  const token = devToken() || extractToken(await fetchAuthToken(cfg));
  const url = buildPirOverviewUrl(cfg);
  const headers = { proposal_id: opts.proposalId ?? cfg.proposal_id };
  // 5-minute budget — the ORDS pool can be slow to wake.
  const TIMEOUT_MS = 300_000;
  console.log("[PIROverview] →request", { url, headers, timeoutMs: TIMEOUT_MS });

  try {
    const json = await fetchJson<PirOverviewResponse>(url, token, TIMEOUT_MS, headers, cfg);
    console.log("[PIROverview] ←response", json);
    if (json.apiStatus && json.apiStatus !== "S") {
      throw new Error(json.apiMessage || "PIR overview request failed");
    }
    if (!json.data) throw new Error("PIR overview response contained no data");
    return json.data;
  } catch (err) {
    console.error("[PIROverview] ✖ error", { url, headers, error: err });
    throw err;
  }
}

/* ─────────────────────────── Save (PUT) ─────────────────────────── */
/** Reviewer-editable fields saved per milestone. */
export type PirOverviewSaveFields = {
  integration_status: string | null;
  integration_criteria: string | null;
  evidence_of_benefits_status: string | null;
  evidence_of_benefits: string | null;
  risk_status: string | null;
  risk: string | null;
  executive_summary: string | null;
  lessons_learned: string | null;
};

/**
 * A milestone's current saved values for every editable field. The summary and
 * lessons-learned text may come back on the scoring block or the milestone itself.
 */
export function pirOverviewSaveFields(milestone: PirOverviewMilestone | undefined): PirOverviewSaveFields {
  const s = milestone?.scoring ?? {};
  return {
    integration_status: s.integration_status ?? null,
    integration_criteria: s.integration_criteria ?? null,
    evidence_of_benefits_status: s.evidence_of_benefits_status ?? null,
    evidence_of_benefits: s.evidence_of_benefits ?? null,
    risk_status: s.risk_status ?? null,
    risk: s.risk ?? null,
    executive_summary: s.executive_summary ?? milestone?.executive_summary ?? null,
    lessons_learned: s.lessons_learned ?? milestone?.lessons_learned ?? null,
  };
}

/**
 * PUT one milestone's editable fields. The body carries proposal_id,
 * milestone_code and created_by plus the full set of editable fields — callers
 * merge their edits over the milestone's current values so nothing is blanked.
 */
export async function savePirOverview(
  cfg: AppConfig,
  update: { proposalId?: number | string; milestoneCode: string; fields: PirOverviewSaveFields },
): Promise<void> {
  const token = devToken() || extractToken(await fetchAuthToken(cfg));
  const url = buildPirOverviewUrl(cfg);

  const payload: Record<string, unknown> = {
    proposal_id: update.proposalId ?? cfg.proposal_id,
    milestone_code: update.milestoneCode,
    ...update.fields,
  };
  if (cfg.created_by != null) payload.created_by = String(cfg.created_by);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  console.log("[PIROverview] PUT", url);
  console.log("[PIROverview] PUT body\n" + JSON.stringify(payload, null, 2));

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Save timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload), signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      throw new Error(reason instanceof Error || reason instanceof DOMException ? reason.message : "Save timed out after 5 minutes");
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[PIROverview] PUT failed", res.status, detail);
    throw new Error(extractApiErrorMessage(detail) || `HTTP ${res.status}: ${res.statusText}`);
  }
  console.log("[PIROverview] PUT ok", res.status);
  notifyDataChanged("PUT PIR overview");
}

/* ─────────────────────────── Snapshot (POST) ────────────────────── */
const PIR_SNAPSHOT_PATH = "/GIS/MA/PIR/snapshot";

/**
 * POST {api_endpoint}/GIS/MA/PIR/snapshot — refreshes the proposal's PIR
 * snapshot. No body; proposal_id and force_capture travel as headers.
 */
export async function capturePirSnapshot(
  cfg: AppConfig,
  opts: { proposalId?: number | string; forceCapture?: boolean } = {},
): Promise<void> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const token = devToken() || extractToken(await fetchAuthToken(cfg));
  const url = `${cfg.api_endpoint}${PIR_SNAPSHOT_PATH}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    proposal_id: String(opts.proposalId ?? cfg.proposal_id),
    force_capture: opts.forceCapture ? "Y" : "N",
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  console.log("[PIRSnapshot] POST", url, { proposal_id: headers.proposal_id, force_capture: headers.force_capture });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Refresh timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      throw new Error(reason instanceof Error || reason instanceof DOMException ? reason.message : "Refresh timed out after 5 minutes");
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error("[PIRSnapshot] POST failed", res.status, text);
    throw new Error(extractApiErrorMessage(text) || `HTTP ${res.status}: ${res.statusText}`);
  }
  // ORDS can answer 200 with the failure encoded in the body.
  try {
    const json = text.trim() ? (JSON.parse(text) as { apiStatus?: string; apiMessage?: string }) : {};
    if (json.apiStatus && json.apiStatus.toUpperCase() !== "S" && json.apiStatus.toUpperCase() !== "SUCCESS") {
      throw new Error(json.apiMessage || "Snapshot refresh rejected by server.");
    }
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
  }
  console.log("[PIRSnapshot] POST ok", res.status, text);
  notifyDataChanged("POST PIR snapshot");
}
