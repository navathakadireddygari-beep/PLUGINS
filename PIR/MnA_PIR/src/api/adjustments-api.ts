/**
 * PIR Adjustments — POST a manual Dr/Cr adjustment.
 *
 * Endpoint: POST {api_endpoint}/GIS/PIR/adjustments
 * The ORDS handler binds the request body to :body_text and runs:
 *   BEGIN
 *     XXEX_GIS_PIR_PKG.pir_adj_insert_prc(p_body_text => :body_text, p_status => :p_status);
 *   END;
 * so the JSON payload below is what `pir_adj_insert_prc` parses.
 *
 * Live in APEX (Bearer token); in dev routes through the Vite "/api" proxy with
 * an optional dev token (same auth flow as the other PIR endpoints).
 */
import { authContextHeaders, type AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson, REQUEST_TIMEOUT_MS, extractApiErrorMessage } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Payload ────────────────────────────── */
/**
 * JSON contract parsed by XXEX_GIS_PIR_PKG.pir_adj_insert_prc. Two variants,
 * distinguished by adjustment_level:
 *
 *   MONTHLY (proposal- or line-level) — targets a single period:
 *     yearperiod YYYYMM, dr_cr, gl_string
 *
 *   SECTION — targets a whole fiscal year of one financial-evaluation section:
 *     fin_eval_section_id, fiscal_year (e.g. 2026); no period/dr_cr/GL
 *
 * Shared: proposal_id, adjustment_type ('ACTUALS' | 'FORECAST', drives SCENARIO),
 * description, amount (stored as ABS), created_by (optional; defaults to -1).
 */
type AdjustmentBase = {
  proposal_id:     number;
  adjustment_type: "ACTUALS" | "FORECAST";
  description:     string;
  amount:          number;
  created_by?:     number;
};

export type MonthlyAdjustmentPayload = AdjustmentBase & {
  adjustment_level?:    "LINE_ITEM";
  fin_eval_section_id?: number | null;
  /** String in the comparison payload ("10422"), number in financialEvaluation. */
  fin_eval_line_id?:    number | string | null;
  /** YYYYMM, e.g. 202504. */
  yearperiod:           number;
  dr_cr:                "DR" | "CR";
  /** ACCOUNT_CODE is derived from its 2nd dot segment server-side. */
  gl_string:            string;
};

export type SectionAdjustmentPayload = AdjustmentBase & {
  adjustment_level:    "SECTION";
  fin_eval_section_id: number | null;
  /** Full fiscal year, e.g. 2026 for FY26. */
  fiscal_year:         number;
};

export type AdjustmentPayload = MonthlyAdjustmentPayload | SectionAdjustmentPayload;

/* ─── Month label ("Apr'25", "202504", "April 2025", …) → YYYYMM ─────── */
const MONTH_NUM: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** YYYYMM (e.g. 202504) → a readable, round-trippable label "Apr 2025". */
export function yearPeriodToMonth(yp: number | string | null | undefined): string {
  const n = Number(yp);
  if (!Number.isFinite(n) || n < 190001) return "";
  const year = Math.floor(n / 100);
  const month = n % 100;
  if (month < 1 || month > 12) return "";
  return `${MONTH_ABBR[month - 1]} ${year}`;
}

export function monthToYearPeriod(month: string): number | null {
  const s = (month || "").trim();
  if (!s) return null;
  // Already numeric YYYYMM (optionally separated, e.g. "2025-04").
  const ym = s.match(/^(\d{4})[-/]?(\d{2})$/);
  if (ym) return Number(`${ym[1]}${ym[2]}`);
  const mm = s.toLowerCase().match(/[a-z]{3,}/);
  const yy = s.match(/\d{2,4}/);
  if (!mm || !yy) return null;
  const monthNo = MONTH_NUM[mm[0].slice(0, 3)];
  if (!monthNo) return null;
  let year = Number(yy[0]);
  if (year < 100) year += 2000;
  return year * 100 + monthNo;
}

/* ─────────────────────────── URL / token helpers ────────────────── */
const ADJ_PATH = "/GIS/PIR/adjustments";

// Always the real ORDS endpoint — see actual-drilldown-api.ts for why the
// local dev proxy branch was dropped.
export function buildAdjustmentsUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${ADJ_PATH}`;
}

function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = import.meta.env.DEV ? import.meta.env.VITE_PIR_TOKEN : undefined;
  return fromCfg || fromEnv;
}

/* ─────────────────── GET existing adjustments ───────────────────── */
// UI-facing shape, matching the `Adjustment` type used by the drilldown tables.
// `scenario` routes each record into the Actuals vs Forecast adjustment list.
export type AdjustmentRecord = {
  id:       string;
  scenario: "ACTUALS" | "FORECAST";
  month:    string; // display label derived from yearperiod, e.g. "Apr 2025"
  drCr:     "Dr" | "Cr";
  gl:       string;
  desc:     string;
  amount:   number;
  account?: string;
};

// The GET response field names aren't documented yet, so read them tolerantly —
// primary names mirror the POST contract (pir_adj_insert_prc), with fallbacks.
type RawAdjustment = Record<string, unknown>;
type AdjustmentsResponse = { items?: RawAdjustment[]; out_cursor?: RawAdjustment[] };

const str = (v: unknown): string => (v == null ? "" : String(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pick = (o: RawAdjustment, ...keys: string[]): unknown => {
  for (const k of keys) if (o[k] != null) return o[k];
  return undefined;
};

export function transformAdjustments(json: AdjustmentsResponse): AdjustmentRecord[] {
  const rows = json?.items ?? json?.out_cursor ?? [];
  if (!Array.isArray(rows)) return [];

  return rows.map((r, i): AdjustmentRecord => {
    const typeRaw = str(pick(r, "adjustment_type", "scenario", "ADJUSTMENT_TYPE", "SCENARIO")).toUpperCase();
    const scenario: AdjustmentRecord["scenario"] = /FORECAST|BUDGET/.test(typeRaw) ? "FORECAST" : "ACTUALS";
    const drcrRaw = str(pick(r, "dr_cr", "drcr", "DR_CR")).toUpperCase();
    // The API may return either a ready month label ("Apr'26") or a YYYYMM number.
    const yp = pick(r, "yearperiod", "year_period", "period", "YEARPERIOD");
    const monthLabel =
      str(pick(r, "month", "month_label", "period_label", "MONTH")) || yearPeriodToMonth(yp as number);
    return {
      id:       str(pick(r, "adjustment_id", "id", "ADJUSTMENT_ID")) || `adj-api-${i}`,
      scenario,
      month:    monthLabel,
      drCr:     drcrRaw === "CR" ? "Cr" : "Dr",
      gl:       str(pick(r, "gl_string", "account_code", "gl", "GL_STRING", "ACCOUNT_CODE")) || "—",
      desc:     str(pick(r, "description", "desc", "DESCRIPTION")) || "Manual adjustment",
      amount:   Math.abs(num(pick(r, "amount", "AMOUNT"))),
      account:  str(pick(r, "account_code", "account", "ACCOUNT_CODE")) || undefined,
    };
  });
}

/**
 * GET the adjustments already saved for a proposal + fiscal year.
 * Headers: fy (e.g. "FY26") and proposal_id — matches the documented curl.
 */
export async function getAdjustments(
  cfg: AppConfig,
  fy: string,
  proposalId: number | string,
): Promise<AdjustmentRecord[]> {
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));
  const url = buildAdjustmentsUrl(cfg);
  const headers = { fy, proposal_id: proposalId };
  const json = await fetchJson<AdjustmentsResponse>(url, token, undefined, headers, cfg);
  // Debug: inspect the raw adjustments payload so we can confirm the field names.
  console.log("[Adjustments] request", { url, headers });
  console.log("[Adjustments] response", json);
  return transformAdjustments(json);
}

/* ─────────────────────────── Network call ───────────────────────── */
export async function postAdjustment(cfg: AppConfig, payload: AdjustmentPayload): Promise<string | undefined> {
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));

  // role / user_email are required by ORDS (403 without them). fetchJson adds
  // them automatically, but this call uses fetch directly for the POST body.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  const url = buildAdjustmentsUrl(cfg);
  const body = JSON.stringify(payload);

  // Debug: the exact body on the wire, so a rejected save can be replayed in
  // Postman verbatim. Logged before the call so it survives a network failure.
  console.log("[Adjustments] POST", url);
  console.log("[Adjustments] POST body\n" + JSON.stringify(payload, null, 2));
  console.log(
    "[Adjustments] curl:\n" +
      `curl --location '${url}' \\\n` +
      `  --header 'Content-Type: application/json' \\\n` +
      Object.entries(headers)
        .filter(([k]) => k !== "Content-Type" && k !== "Accept")
        .map(([k, v]) => `  --header '${k}: ${v}' \\\n`)
        .join("") +
      `  --data '${body}'`,
  );

  // Same five-minute budget as every other call — previously this POST had no
  // timeout at all and could hang until the browser gave up.
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Request timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      throw new Error(
        reason instanceof Error || reason instanceof DOMException
          ? reason.message
          : "Request timed out after 5 minutes",
        { cause: err },
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[Adjustments] POST failed", res.status, detail);
    throw new Error(extractApiErrorMessage(detail) || `HTTP ${res.status}: ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }

  // ORDS can answer 200 with a failure encoded in the body (e.g. the ON_TRACK
  // "proposals can no longer be edited" rejection) — res.ok alone would report
  // a save that the backend silently dropped, so the new line never appears.
  const text = await res.text().catch(() => "");
  let apiMessage: string | undefined;
  try {
    const json = text.trim() ? (JSON.parse(text) as RawAdjustment) : {};
    const status = str(pick(json, "apiStatus", "api_status", "status")).toUpperCase();
    apiMessage = str(pick(json, "apiMessage", "api_message", "message")) || undefined;
    if (status && status !== "S" && status !== "SUCCESS") {
      throw new Error(apiMessage || "Adjustment rejected by server.");
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Non-JSON 2xx body — nothing to validate, treat as success.
    } else {
      throw err;
    }
  }

  console.log("[Adjustments] POST ok", res.status, text);
  // Every write re-reads every GET on screen.
  notifyDataChanged("POST adjustments");
  return apiMessage;
}
