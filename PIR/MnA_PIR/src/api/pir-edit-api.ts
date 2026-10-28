/**
 * PIR financial appendix — reviewer writes.
 *
 *   POST {api_endpoint}/GIS/MA/PIR/adjustment — a new line added via "+ Add Row"
 *   PUT  {api_endpoint}/GIS/MA/PIR/editable   — Actual values edited in place on
 *                                               the Investment and Integration &
 *                                               Synergies sections
 *
 * Same auth flow as the other PIR endpoints (Bearer token + role/user_email).
 */
import { authContextHeaders, type AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { extractApiErrorMessage, REQUEST_TIMEOUT_MS } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Payloads ───────────────────────────── */
export type PirAdjustmentPayload = {
  proposal_id:         number | string;
  fin_eval_section_id: number;
  description:         string;
  amount:              number;
  /** Full fiscal year, e.g. 2026. */
  fiscal_year:         number;
  scenario:            "Actual";
  created_by?:         number;
};

export type PirEditableLine = {
  section_code:    string;
  line_code:       string;
  period_key:      "cumulative" | "year_1";
  actual_amount?:  number;
  buyplan_amount?: number;
};

/* ─────────────────────────── Helpers ────────────────────────────── */
function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PIR_TOKEN;
  return fromCfg || fromEnv;
}

function buildUrl(cfg: AppConfig, path: string): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${path}`;
}

/** Sends a JSON body and surfaces both HTTP errors and 200-with-apiStatus≠S rejections. */
async function sendJson(cfg: AppConfig, method: "POST" | "PUT", path: string, payload: unknown, tag: string): Promise<void> {
  const token = devToken() || extractToken(await fetchAuthToken(cfg));
  const url = buildUrl(cfg, path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  console.log(`[${tag}] ${method}`, url);
  console.log(`[${tag}] ${method} body\n` + JSON.stringify(payload, null, 2));

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Request timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: JSON.stringify(payload), signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      throw new Error(reason instanceof Error || reason instanceof DOMException ? reason.message : "Request timed out after 5 minutes");
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[${tag}] ${method} failed`, res.status, text);
    throw new Error(extractApiErrorMessage(text) || `HTTP ${res.status}: ${res.statusText}`);
  }

  // ORDS can answer 200 with the failure encoded in the body.
  try {
    const json = text.trim() ? (JSON.parse(text) as { apiStatus?: string; apiMessage?: string }) : {};
    if (json.apiStatus && json.apiStatus.toUpperCase() !== "S" && json.apiStatus.toUpperCase() !== "SUCCESS") {
      throw new Error(json.apiMessage || "Request rejected by server.");
    }
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
  }
  console.log(`[${tag}] ${method} ok`, res.status, text);
  notifyDataChanged(`${method} ${path}`);
}

function createdBy(cfg: AppConfig): number | undefined {
  const n = Number(cfg.created_by);
  return cfg.created_by != null && cfg.created_by !== "" && Number.isFinite(n) ? n : undefined;
}

/* ─────────────────────────── Calls ──────────────────────────────── */
export async function postPirAdjustment(
  cfg: AppConfig,
  input: Omit<PirAdjustmentPayload, "proposal_id" | "scenario" | "created_by">,
): Promise<void> {
  const payload: PirAdjustmentPayload = {
    proposal_id: Number(cfg.proposal_id),
    ...input,
    scenario: "Actual",
  };
  const by = createdBy(cfg);
  if (by != null) payload.created_by = by;
  await sendJson(cfg, "POST", "/GIS/MA/PIR/adjustment", payload, "PIRAdjustment");
}

export async function savePirEditable(
  cfg: AppConfig,
  update: { milestoneCode: string; lines: PirEditableLine[] },
): Promise<void> {
  const payload: Record<string, unknown> = {
    proposal_id: Number(cfg.proposal_id),
    milestone_code: update.milestoneCode,
    lines: update.lines,
  };
  if (cfg.created_by != null && cfg.created_by !== "") payload.created_by = String(cfg.created_by);
  await sendJson(cfg, "PUT", "/GIS/MA/PIR/editable", payload, "PIREditable");
}
