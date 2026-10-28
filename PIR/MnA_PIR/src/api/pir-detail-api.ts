/**
 * PIR Detail — per-milestone Post-Investment Review data.
 *
 * Endpoint: https://gisdev.uk.experian.com/api/GIS/MA/PIR/detail
 * GET → milestone header, KPI RAG summary and the financial appendix sections
 * for one review period.
 *
 * Request headers:
 *   - currency       : "EUR" | "USD"
 *   - milestone_code : "6M" | "12" | "24M"
 *   - proposal_id    : financial proposal id
 *
 * Live in APEX (Bearer token via auth-api); in local dev it routes through the
 * Vite "/api/GIS/MA" proxy with an optional dev token.
 */
import type { AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson } from "../lib/http";

/* ─────────────────────────── Wire types ─────────────────────────── */
export type PirPeriodValues = {
  actual: number | null;
  buyplan: number | null;
  variance: number | null;
};

export type PirPeriodData = {
  cumulative?: PirPeriodValues;
  year_1?: PirPeriodValues;
} | null;

export type PirLine = {
  line_code: string;
  line_label: string;
  is_editable?: boolean;
  is_computed?: boolean;
  period_data?: PirPeriodData;
};

/** A reviewer-added line ("+ Add Row"), already rolled into the section's computed total. */
export type PirAdjustment = {
  pir_adjustment_id: number;
  description: string;
  amount: number;
  dr_cr?: "DR" | "CR" | string;
  fiscal_year?: number;
  /** "ACTUAL" → Actual column; buy-plan scenarios (e.g. "AcqnBuyPlan") → Buy Plan column. */
  scenario?: string;
};

export type PirSection = {
  section_code: string;
  section_label: string;
  fin_eval_section_id?: number;
  lines: PirLine[];
  adjustments?: PirAdjustment[];
};

export type PirKpi = {
  kpi_code: string;
  kpi_label: string;
  status: string;
  variance_pct?: number;
};

export type PirMilestoneInfo = {
  milestone_code: string;
  milestone_label: string;
  period_ending: string;
  completion_date: string;
  currency_code: string;
  fx_rate: number;
  display_currency: string;
};

export type PirDetailData = {
  milestone_info: PirMilestoneInfo;
  kpi_summary: PirKpi[];
  sections: PirSection[];
};

export type PirDetailResponse = {
  apiStatus: string;
  apiMessage: string;
  data: PirDetailData;
};

export type Currency = "EUR" | "USD";

/* ─────────────────────────── Network call ───────────────────────── */
const PIR_DETAIL_PATH = "/GIS/MA/PIR/detail";

export function buildPirDetailUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${PIR_DETAIL_PATH}`;
}

function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PIR_TOKEN;
  return fromCfg || fromEnv;
}

export async function getPirDetail(
  cfg: AppConfig,
  opts: { milestoneCode: string; currency: Currency; proposalId?: number | string },
): Promise<PirDetailData> {
  const token = devToken() || extractToken(await fetchAuthToken(cfg));
  const url = buildPirDetailUrl(cfg);
  const headers = {
    currency: opts.currency,
    milestone_code: opts.milestoneCode,
    proposal_id: opts.proposalId ?? cfg.proposal_id,
  };
  // 5-minute budget — the ORDS pool can be slow to wake.
  const TIMEOUT_MS = 300_000;
  console.log("[PIRDetail] →request", { url, headers, timeoutMs: TIMEOUT_MS });

  try {
    const json = await fetchJson<PirDetailResponse>(url, token, TIMEOUT_MS, headers, cfg);
    console.log("[PIRDetail] ←response", json);
    if (json.apiStatus && json.apiStatus !== "S") {
      throw new Error(json.apiMessage || "PIR detail request failed");
    }
    if (!json.data) throw new Error("PIR detail response contained no data");
    return json.data;
  } catch (err) {
    console.error("[PIRDetail] ✖ error", { url, headers, error: err });
    throw err;
  }
}
