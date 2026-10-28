/**
 * Actuals drilldown — financial transactions for one financial-evaluation line
 * and fiscal year.
 *
 * Endpoint: GET {api_endpoint}/GIS/PIR/actualDrilldown
 * Headers:  proposal_id, fin_eval_line_id, fy (e.g. "fy26")
 *
 * Each row carries a `scenario` — "Actual" rows feed the Actuals table, anything
 * else (Budget/Forecast) feeds the Forecast table.
 *
 * Live in APEX (Bearer token); in dev routes through the Vite "/api" proxy with
 * an optional dev token (same auth flow as the other PIR endpoints).
 */
import type { AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson } from "../lib/http";

/* ─────────────────────────── Wire types ─────────────────────────── */
// The ORDS response uses space-separated keys ("gl account", "line item").
export type ActualDrilldownItem = {
  month?: string;
  "gl account"?: string | null;
  "gl description"?: string | null;
  amount?: number | string | null;
  scenario?: string | null;
  account?: string | null;
  "proposal code"?: string | null;
  "line item"?: string | null;
  source?: string | null;
  description?: string | null;
  "transaction type"?: string | null;
};

export type ActualDrilldownResponse = {
  items?: ActualDrilldownItem[];
  hasMore?: boolean;
  count?: number;
  limit?: number;
  offset?: number;
};

/* ─────────────────────────── UI-side type ───────────────────────── */
export type ActualDrilldownRow = {
  month: string;
  gl: string;
  desc: string;
  amount: number;
  /** "Actual" rows render in the Actuals table; everything else in Forecast. */
  scenario: string;
  proposalCode: string; // SPC / proposal code, e.g. "NA-PD-2026-516"
  lineItem: string; // "line item" from the API, e.g. "Capex FY26"
  source: string; // e.g. "AP Invoice #INV-45102"
  transactionType: string; // e.g. "ADJUSTMENT" | "UNMAPPED"
};

/** True when a drilldown row belongs in the Actuals table. */
export const isActualRow = (r: ActualDrilldownRow): boolean =>
  (r.scenario || "").trim().toLowerCase() === "actual";

/* Context resolved from a clicked forecast cell (or a picked line). */
export type DrillContext = {
  id: string; // ReportRow id — selects the matching option in the line-item dropdown
  /** fin_eval_line_id — the drilldown is keyed on this, not the account. */
  finEvalLineId: number | string | null;
  /** fin_eval_section_id of the owning section — sent on LINE_ITEM adjustments. */
  finEvalSectionId?: number | null;
  account: string;
  fy: string; // fiscal-year key, e.g. "fy26" / "FY26"
  label: string;
  section: string;
  spc: string; // pre-formatted display strings from the forecast table
  ytd: string;
  /** Raw figures behind spc/ytd — the drilldown tiles re-format these under the
   *  current SCALE / NUMBER setting rather than re-parsing the strings above. */
  spcNum?: number | null;
  ytdNum?: number | null;
  /**
   * True when opened via the line-item dropdown rather than a specific cell, so
   * `fy` is the report's first year rather than a year the user chose.
   */
  whole?: boolean;
};

/* ─────────────────────────── Transformer ────────────────────────── */
const str = (v: unknown): string => (v == null ? "" : String(v));

export function transformActualDrilldown(json: ActualDrilldownResponse): ActualDrilldownRow[] {
  return (json?.items ?? []).map((it) => ({
    month:  str(it.month),
    gl:     str(it["gl account"]),
    // "gl description" comes back null on live rows — the readable text is in
    // `description`, so fall back to it before showing an empty cell.
    desc:   str(it["gl description"]) || str(it.description),
    amount: typeof it.amount === "number" ? it.amount : Number(it.amount) || 0,
    scenario: str(it.scenario) || "Actual",
    proposalCode:    str(it["proposal code"]),
    lineItem:        str(it["line item"]),
    source:          str(it.source),
    transactionType: str(it["transaction type"]),
  }));
}

/* ─────────────────────────── URL / token helpers ────────────────── */
// Parameters are headers now — the old
// /{proposal_id}/lineItem/…/fiscalYear/…/account/… path 404s (no ORDS handler).
const DRILLDOWN_PATH = "/GIS/PIR/actualDrilldown";

// Always the real ORDS endpoint, in dev and in APEX alike — no local proxy
// fallback. The dev-server "/api" proxy (vite.config.ts) forwards to whatever
// host is hardcoded there, which drifts out of sync with the real backend
// (see pir-reporting-api.ts); building the same URL everywhere means dev
// testing exercises the actual target instead of a second, easily-stale copy
// of the routing. Requires api_endpoint to be reachable from the browser
// (CORS) when running outside APEX's own origin.
export function buildDrilldownUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${DRILLDOWN_PATH}`;
}

/** proposal_id + fin_eval_line_id + fy. Null/undefined values are dropped by fetchJson. */
export function buildDrilldownHeaders(
  cfg: AppConfig,
  finEvalLineId: number | string | null | undefined,
  fy: string,
  proposalId?: number | string,
): Record<string, string | number | null | undefined> {
  const rawId = proposalId ?? cfg.proposal_id;
  return {
    proposal_id:      Number.isFinite(Number(rawId)) && Number(rawId) > 0 ? rawId : undefined,
    fin_eval_line_id: finEvalLineId != null && finEvalLineId !== "" ? finEvalLineId : undefined,
    fy:               fy || undefined,
  };
}

function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = import.meta.env.DEV ? import.meta.env.VITE_PIR_TOKEN : undefined;
  return fromCfg || fromEnv;
}

/* ─────────────────────────── Network call ───────────────────────── */
export async function getActualDrilldown(
  cfg: AppConfig,
  finEvalLineId: number | string | null | undefined,
  fy: string,
  proposalId?: number | string,
): Promise<ActualDrilldownRow[]> {
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));
  const baseUrl = buildDrilldownUrl(cfg);
  const headers = buildDrilldownHeaders(cfg, finEvalLineId, fy, proposalId);
  console.log("[actualDrilldown] request", { url: baseUrl, headers });

  // ORDS paginates the result (default 25 rows per page, `hasMore: true`).
  // Follow the offset chain to the last page so the drilldown total reflects
  // every line — otherwise the YTD figure never matches page 1's subtotal.
  const items: ActualDrilldownItem[] = [];
  let offset = 0;
  for (let page = 0; page < 1000; page++) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const json = await fetchJson<ActualDrilldownResponse>(
      `${baseUrl}${sep}offset=${offset}`,
      token,
      undefined,
      headers,
      cfg,
    );
    const pageItems = json?.items ?? [];
    items.push(...pageItems);
    if (!json?.hasMore || pageItems.length === 0) break;
    offset += pageItems.length;
  }
  console.log("[actualDrilldown] rows", items.length);
  return transformActualDrilldown({ items });
}
