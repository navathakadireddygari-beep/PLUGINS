/**
 * Forecast vs Actuals — Executive KPI Tiles (RAG status)
 *
 * Endpoint: https://gisdev.uk.experian.com/api/GIS/PIR/KPIVariance
 * GET → SPC-approved vs actual variance for each KPI, with pass/fail status.
 *
 * Live in APEX (Bearer token via auth-api). In local dev it routes through the
 * Vite "/api" proxy with an optional dev token; on any failure it falls back
 * to the bundled sample so the tiles always render.
 */
import type { AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson } from "../lib/http";

/* ─────────────────────────── Wire types ─────────────────────────── */
export type KpiVarianceItem = {
  kpi_code:     string;
  kpi_name:     string;
  spc_approved: number | null;
  actual:       number | null;
  variance:     number | null;
  threshold:    number | null;
  operator:     string;
  /** Some KPIs (e.g. Payback) can flag a borderline result directly rather
   *  than relying on the actual-vs-threshold margin below. */
  pass_fail:    string; // PASS | FAIL | AMBER
};

// ORDS returns the cursor either prefixed (p_out_cursor, live proposal) or
// unprefixed (out_cursor, spc_type template defaults) — accept both.
export type KpiVarianceResponse = {
  p_api_status?:     string;
  p_api_status_msg?: string;
  p_proposal_code?:  string; // SPC / proposal code, e.g. "NA-PD-2026-516"
  p_out_cursor?:     KpiVarianceItem[];
  api_status?:       string;
  api_status_msg?:   string;
  proposal_code?:    string;
  out_cursor?:       KpiVarianceItem[];
};

/* ─────────────────────────── UI-side types ──────────────────────── */
export type Tone = "red" | "green" | "amber";

/** Variance colour reflects whether the movement is favourable, not the RAG tone. */
export type VarianceTone = "red" | "green" | "neutral";

export type KpiTile = {
  label:        string;
  value:        string;
  badge:        "RED" | "GREEN" | "AMBER";
  spcApproved:  string;
  variance:     string;
  varianceTone: VarianceTone;
  hurdle:       string;
  showHurdle:   boolean;
  status:       string;
  statusTone:   Tone;
  tone:         Tone;
  /** True for money KPIs (CAPEX / OPEX / NPV) — only these follow the SCALE
   *  selector. IRR, PTR and Payback are percentages and years, so they keep the
   *  strings above whatever scale is chosen. */
  isMoney:      boolean;
  /** Raw figures behind value / spcApproved / variance, in base currency units. */
  valueNum:     number | null;
  spcNum:       number | null;
  varianceNum:  number | null;
  /** Variance as a percentage of the SPC-approved base — appended to the
   *  variance line for CAPEX/OPEX ("0.30 (10.0%)"). Null for other KPIs. */
  variancePct:  number | null;
};

export type RagGroup = { count: number; names: string[] };

export type RagSummary = {
  red:             RagGroup;
  amber:           RagGroup;
  green:           RagGroup;
  needsReapproval: boolean;
};

export type KpiPanelData = { tiles: KpiTile[]; rag: RagSummary; proposalCode: string };

/* ─────────────────────────── Per-KPI display config ─────────────── */
// valUnit  → how the headline value + SPC-approved figure are formatted
// varKind  → how the variance line is rendered (matches the mock exactly)
// better   → favourable direction (drives variance colour)
// showHurdle → whether the HURDLE row is shown (NPV / Payback have none)
type ValUnit = "M" | "M0" | "pct" | "yr";
type VarKind = "moneyPct" | "yearPct" | "pts" | "numM";
type Better = "higher" | "lower";

type KpiCfg = {
  label:      string;
  valUnit:    ValUnit;
  varKind:    VarKind;
  better:     Better;
  showHurdle: boolean;
  hurdlePct?: boolean; // threshold expressed as a "+N%" tolerance (CAPEX/OPEX)
};

const KPI_CONFIG: Record<string, KpiCfg> = {
  CAPEX:      { label: "TOTAL CAPEX ($M)", valUnit: "M",   varKind: "moneyPct", better: "lower",  showHurdle: true,  hurdlePct: true },
  OPEX:       { label: "OPEX ($M)",        valUnit: "M",   varKind: "moneyPct", better: "lower",  showHurdle: true,  hurdlePct: true },
  IRR:        { label: "IRR (%)",          valUnit: "pct", varKind: "pts",      better: "higher", showHurdle: true },
  YEAR5_PTR:  { label: "YEAR-5 PTR (%)",   valUnit: "pct", varKind: "pts",      better: "higher", showHurdle: true },
  AVG3YR_PTR: { label: "AVG 3-YR PTR (%)", valUnit: "pct", varKind: "pts",      better: "higher", showHurdle: true },
  NPV:        { label: "NPV ($M)",         valUnit: "M0",  varKind: "numM",     better: "higher", showHurdle: true },
  PAYBACK:    { label: "PAYBACK (YEARS)",  valUnit: "yr",  varKind: "yearPct",  better: "lower",  showHurdle: true },
};

const DEFAULT_CFG: KpiCfg = { label: "", valUnit: "pct", varKind: "pts", better: "higher", showHurdle: true };

// A passing KPI sits "amber / borderline" when the actual only just clears the
// hurdle — within this fraction of the threshold (e.g. IRR 11.1 vs ≥11.0).
const BORDERLINE_MARGIN = 0.05;

/* ─────────────────────────── Formatters ─────────────────────────── */
// Negatives render in accounting style — parentheses, no minus sign: (238).
const wrapNeg = (s: string, n: number): string => (n < 0 ? `(${s})` : s);

const fmtValue = (n: number | null, unit: ValUnit): string => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  switch (unit) {
    case "M":   return wrapNeg((abs / 1_000_000).toFixed(2), n);
    case "M0":  return wrapNeg(Math.round(abs / 1_000_000).toLocaleString("en-US"), n);
    case "pct": return wrapNeg(abs.toFixed(1), n);
    case "yr":  return wrapNeg(abs.toFixed(0), n);
  }
};

// SPC-approved figure mirrors fmtValue, formatting money ($M) to 2 decimals.
const fmtSpcValue = (n: number | null, unit: ValUnit): string => {
  if (n == null) return "—";
  if (unit === "M") return wrapNeg((Math.abs(n) / 1_000_000).toFixed(2), n);
  return fmtValue(n, unit);
};

// Variance is always SPC-approved − actual, formatted per metric type. Negatives
// use parentheses, positives carry no "+" sign: "0.30 (10.0%)", "(2.7) pts", "(238)".
const fmtVariance = (delta: number, kind: VarKind): string => {
  switch (kind) {
    case "moneyPct":
      return wrapNeg((Math.abs(delta) / 1_000_000).toFixed(2), delta); // percent appended by caller
    case "yearPct":
      return wrapNeg(Math.abs(delta).toFixed(0), delta);
    case "pts":
      return `${wrapNeg(Math.abs(delta).toFixed(1), delta)} pts`;
    case "numM":
      return wrapNeg(Math.round(Math.abs(delta) / 1_000_000).toLocaleString("en-US"), delta);
  }
};

const sym = (operator: string): string =>
  /less/i.test(operator) ? "≤" : /greater/i.test(operator) ? "≥" : "";

const hurdleText = (operator: string, threshold: number | null, hurdlePct?: boolean): string => {
  if (threshold == null) return "N/A";
  const s = sym(operator);
  if (hurdlePct) return `${s} +${threshold}%`.trim();
  return `${s}${threshold}`;
};

/* ─────────────────────────── Transformer ────────────────────────── */
export function transformKpiVariance(json: KpiVarianceResponse): KpiPanelData {
  const cursor = json?.p_out_cursor ?? json?.out_cursor;
  const items = Array.isArray(cursor) ? cursor : [];

  const tiles: KpiTile[] = items.map((item): KpiTile => {
    const cfg = KPI_CONFIG[item.kpi_code] ?? { ...DEFAULT_CFG, label: item.kpi_name };
    const rawStatus = (item.pass_fail ?? "").trim().toUpperCase();
    const backendFail = rawStatus === "FAIL";
    const backendAmber = rawStatus === "AMBER";
    const delta =
      item.actual != null && item.spc_approved != null
        ? item.spc_approved - item.actual
        : item.variance ?? 0;

    // ── Does the RAW figure actually clear its own hurdle? ──
    // The backend's pass_fail has been seen saying PASS for a Payback that had
    // slipped a year past its <=5-year hurdle (it likely only checks the
    // SPC-approved figure, not the actual) — so a "better: lower" KPI (CAPEX /
    // OPEX / Payback) that came in worse than approved is re-checked against
    // its own threshold here rather than trusting that flag blindly. Coming in
    // AT OR UNDER the approved figure has nothing to fail, so it's skipped.
    const failsOwnHurdle = ((): boolean => {
      if (item.threshold == null) return false;
      if (cfg.hurdlePct) {
        if (delta >= 0) return false;
        const base = Math.abs(item.spc_approved ?? 0);
        const pct = base === 0 ? 0 : (Math.abs(delta) / base) * 100;
        return pct > item.threshold;
      }
      if (item.actual == null) return false;
      // cfg.better (not the API's own operator text, which has been seen
      // inconsistent) decides direction: "lower" KPIs fail at/above the
      // hurdle, "higher" KPIs fail at/below it. Inclusive: landing exactly on
      // the hurdle (e.g. Payback at exactly 5 years) is a warning too.
      return cfg.better === "lower" ? item.actual >= item.threshold : item.actual <= item.threshold;
    })();

    // ── RAG tone: backend FAIL → red; backend AMBER, or a PASS that doesn't
    // actually clear its hurdle → amber; a PASS that only just clears it →
    // amber too; otherwise green. ──
    let tone: Tone = backendFail ? "red" : backendAmber || failsOwnHurdle ? "amber" : "green";
    if (tone === "green" && !cfg.hurdlePct && item.threshold != null && item.actual != null) {
      const margin = Math.abs(item.actual - item.threshold) / Math.abs(item.threshold || 1);
      if (margin <= BORDERLINE_MARGIN) tone = "amber";
    }

    // ── Status label: a spend metric exactly on budget → "OK", else by tone. ──
    const onTarget = delta === 0;
    const status =
      tone === "red"   ? "× Fail" :
      tone === "amber" ? "⚠ Borderline" :
      cfg.varKind === "moneyPct" && onTarget ? "✓ OK" : "✓ Pass";

    // ── Variance colour by sign: positive → green, negative → red, neutral at 0. ──
    const varianceTone: VarianceTone = delta === 0 ? "neutral" : delta > 0 ? "green" : "red";

    // moneyPct appends the percent (magnitude) against the SPC-approved base.
    let variance = fmtVariance(delta, cfg.varKind);
    let variancePct: number | null = null;
    if (cfg.varKind === "moneyPct") {
      const base = item.spc_approved ?? 0;
      variancePct = base === 0 || delta === 0 ? 0 : (Math.abs(delta) / Math.abs(base)) * 100;
      variance = `${variance} (${variancePct.toFixed(1)}%)`;
    }

    // "M" / "M0" are the money units; "pct" and "yr" must ignore the scale.
    const isMoney = cfg.valUnit === "M" || cfg.valUnit === "M0";

    return {
      label:        cfg.label,
      value:        fmtValue(item.actual, cfg.valUnit),
      badge:        tone === "red" ? "RED" : tone === "amber" ? "AMBER" : "GREEN",
      spcApproved:  `SPC Approved ${fmtSpcValue(item.spc_approved, cfg.valUnit)}`,
      variance,
      varianceTone,
      hurdle:       hurdleText(item.operator, item.threshold, cfg.hurdlePct),
      showHurdle:   cfg.showHurdle,
      status,
      statusTone:   tone,
      tone,
      isMoney,
      valueNum:     item.actual,
      spcNum:       item.spc_approved,
      varianceNum:  delta,
      variancePct,
    };
  });

  // RAG summary is driven by the derived tile tones so amber/borderline counts.
  const cleanName = (name: string): string => name.replace(/%/g, "").trim();
  const tagged = tiles.map((tile, i) => ({ tone: tile.tone, name: cleanName(items[i]?.kpi_name ?? `KPI ${i + 1}`) }));
  const namesFor = (t: Tone): string[] => tagged.filter((x) => x.tone === t).map((x) => x.name);
  const reds   = namesFor("red");
  const ambers = namesFor("amber");
  const greens = namesFor("green");

  const rag: RagSummary = {
    red:             { count: reds.length,   names: reds },
    amber:           { count: ambers.length, names: ambers },
    green:           { count: greens.length, names: greens },
    needsReapproval: reds.length > 0,
  };

  return { tiles, rag, proposalCode: json?.p_proposal_code ?? json?.proposal_code ?? "" };
}

/* ─────────────────────────── URL / token helpers ────────────────── */
export const DEFAULT_KPI_PROPOSAL_ID = 516;

// proposal_id, spc_type_id and spc_type_template_id are now passed as request
// headers (see buildKpiHeaders) rather than in the path, so the endpoint can
// resolve KPIs from the SPC type/template when proposal_id is null.
const KPI_PATH = "/GIS/PIR/KPIVariance";

export function buildKpiUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${KPI_PATH}`;
}

/**
 * Headers for the KPIVariance call. proposal_id is sent when present; when it is
 * null/invalid, spc_type_id + spc_type_template_id let the endpoint resolve the
 * KPIs instead. Null/undefined values are dropped by fetchJson.
 */
export function buildKpiHeaders(
  cfg: AppConfig,
  proposalId?: number | string,
): Record<string, string | number | null | undefined> {
  const id = proposalId ?? cfg.proposal_id;
  // Send proposal_id present-but-empty when null/invalid (curl: `--header 'proposal_id;'`)
  // so the endpoint falls back to spc_type_id + spc_type_template_id.
  const validId = Number.isFinite(Number(id)) && Number(id) > 0 ? id : "";
  return {
    proposal_id:          validId,
    spc_type_id:          cfg.spc_type_id,
    spc_type_template_id: cfg.spc_type_template_id,
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
export async function getKpiVariance(
  cfg: AppConfig,
  proposalId?: number | string,
): Promise<KpiPanelData> {
  const override = devToken();

  const token = override || extractToken(await fetchAuthToken(cfg));
  const url = buildKpiUrl(cfg);
  const headers = buildKpiHeaders(cfg, proposalId);
  const json = await fetchJson<KpiVarianceResponse>(url, token, undefined, headers, cfg);
  // Debug: inspect the raw KPIVariance payload (incl. the null-proposal template
  // defaults) in the browser console.
  console.log("[KPIVariance] request", { url, headers });
  console.log("[KPIVariance] response", json);
  return transformKpiVariance(json);
}
