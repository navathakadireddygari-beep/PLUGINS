/**
 * Forecast vs Actuals — financial line comparison report.
 *
 * Endpoint: {api_endpoint}/GIS/PIR/forecastsActualsComparision/{proposal_id}
 * GET → SPC projected vs YTD actuals+forecast vs variance, per fiscal year,
 *       grouped into sections with subtotals.
 *
 * Live in APEX (Bearer token); in dev routes through the Vite "/api" proxy with
 * an optional dev token, and falls back to the bundled sample on any failure.
 */
import type { AppConfig } from "../config/app-config";
import { authContextHeaders, missingAuthContext } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson, extractApiErrorMessage } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Wire types ─────────────────────────── */
export type FyCell = {
  spc_projected:        number | null;
  ytd_actuals_forecast: number | null;
  variance:             number | null;
};

/** One year's figures in the PUT `year_values` payload. */
type YearValueEntry = {
  spc_projected_amount: number | null;
  ytd_actuals?:         number | null;
  variance:             number | null;
};

export type ApiLine = {
  /** String in practice, and comma-joined when several lines are merged
   *  ("8187, 8435"). Null on the synthetic "Section Adjustments" row. */
  fin_eval_line_id: number | string | null;
  account:          string | null;
  item_description: string;
  display_order:    number;
  /** "Y" on the rolled-up adjustments row the API appends to each section. */
  is_section_adj?:  string | null;
  fy_data:          Record<string, FyCell>;
};

export type ApiSection = {
  /** Sent back on adjustments as fin_eval_section_id. Key casing has varied
   *  across the PIR endpoints, so it is read tolerantly (see sectionIdOf). */
  fin_eval_section_id?: number | string | null;
  section_id?:          number | string | null;
  section_name:  string;
  section_type:  string;
  display_order: number;
  lines:         ApiLine[];
  subtotal:      { label: string; fy_data: Record<string, FyCell> };
};

const sectionIdOf = (section: ApiSection): number | null => {
  const raw = section as unknown as Record<string, unknown>;
  for (const key of ["fin_eval_section_id", "FIN_EVAL_SECTION_ID", "section_id", "SECTION_ID"]) {
    const v = raw[key];
    if (v != null && v !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
};

/** FY label (Apr→Mar, ending year) that "now" falls in — e.g. Sep 2026 → FY27. */
const currentFiscalYearEnd = (): number => {
  const now = new Date();
  return now.getMonth() + 1 >= 4 ? now.getFullYear() + 1 : now.getFullYear();
};

/** True for fiscal years after the one currently in progress. */
const isFutureFiscalYear = (key: string): boolean => {
  const match = key.match(/^fy(\d{2})$/i);
  return match != null && 2000 + Number(match[1]) > currentFiscalYearEnd();
};

export type ForecastActualsResponse = {
  apiStatus:  string;
  apiMessage: string;
  data: {
    fiscal_years: string[];
    sections:     ApiSection[];
  };
};

/* ─────────────────────────── UI-side types ──────────────────────── */
export type Tone = "purple" | "blue" | "green" | "pink" | "orange" | "total";

export type Cell = {
  spc:          string;
  ytd:          string;
  ytdLinked:    boolean;
  ytdTone:      "red" | "green" | "none";
  variance:     string;
  varianceTone: "red" | "green" | "none";
  /** Raw values behind the display strings — the SCALE / NUMBER toolbar formats
   *  from these, so a scale change never re-parses an already-formatted string.
   *  Null on blank (editable) cells and wherever the API sent no figure. */
  spcNum:       number | null;
  ytdNum:       number | null;
  varianceNum:  number | null;
};

export type ReportRow = {
  id:        string;
  label:     string;
  type:      "line" | "subtotal" | "new";
  editable?: boolean;
  account?:  string | null; // GL account for the line
  /** fin_eval_line_id — what the actuals drilldown is keyed on. */
  finEvalLineId?: number | string | null;
  /** Row came from /adjustments/section rather than the report itself. */
  isAdjustment?: boolean;
  cells:     Cell[]; // one per year, in column order
};

export type ReportSection = {
  /** fin_eval_section_id — sent on adjustments raised against this section. */
  finEvalSectionId?: number | null;
  title:     string;
  editable?: boolean;
  rows:      ReportRow[];
};

export type ForecastReport = {
  years:    Array<{ key: string; label: string; tone: Tone; isTotal?: boolean }>;
  sections: ReportSection[];
};

export type ForecastCellEdit = {
  rowId:      string;
  fiscalYear: string;
  value:      number | null;
};

/* ─────────────────────────── Formatters ─────────────────────────── */
const YEAR_TONES: Tone[] = ["purple", "blue", "green", "pink", "orange"];

// Negatives render in accounting style — parentheses, no minus sign: (100).
const fmtAmount = (n: number | null): string => {
  if (n == null) return "-";
  if (n === 0) return "0";
  const abs = Math.round(Math.abs(n)).toLocaleString("en-US");
  return n < 0 ? `(${abs})` : abs;
};

const fmtVariance = (n: number | null): { text: string; tone: "red" | "green" | "none" } => {
  if (n == null) return { text: "-", tone: "none" };
  if (n === 0) return { text: "0", tone: "none" };
  const abs = Math.round(Math.abs(n)).toLocaleString("en-US");
  return n < 0 ? { text: `(${abs})`, tone: "red" } : { text: abs, tone: "green" };
};

/** A blank editable cell (raw strings the user types into). */
export const blankCell = (): Cell => ({
  spc: "", ytd: "", ytdLinked: false, ytdTone: "none", variance: "", varianceTone: "none",
  spcNum: null, ytdNum: null, varianceNum: null,
});

export const blankCells = (count: number): Cell[] =>
  Array.from({ length: count }, () => blankCell());

const toCell = (c: FyCell | undefined): Cell => {
  const cell = c ?? { spc_projected: null, ytd_actuals_forecast: null, variance: null };
  const v = fmtVariance(cell.variance);
  const ytd = fmtAmount(cell.ytd_actuals_forecast);
  const ytdNum = cell.ytd_actuals_forecast;
  const ytdTone: Cell["ytdTone"] =
    ytdNum == null || ytdNum === 0 ? "none" : ytdNum < 0 ? "red" : "green";
  return {
    spc:          fmtAmount(cell.spc_projected),
    ytd,
    ytdLinked:    ytd !== "-" && ytd !== "0",
    ytdTone,
    variance:     v.text,
    varianceTone: v.tone,
    spcNum:       cell.spc_projected,
    ytdNum:       cell.ytd_actuals_forecast,
    varianceNum:  cell.variance,
  };
};

const sumOrEither = (a: number | null, b: number | null): number | null =>
  a == null ? b : b == null ? a : a + b;

/** Column-wise combine of two adjustment cells covering different fiscal years. */
const combineCells = (a: Cell, b: Cell): Cell => {
  const spcNum = sumOrEither(a.spcNum, b.spcNum);
  const ytdNum = sumOrEither(a.ytdNum, b.ytdNum);
  const varianceNum = sumOrEither(a.varianceNum, b.varianceNum);
  const v = fmtVariance(varianceNum);
  return {
    spc:          fmtAmount(spcNum),
    ytd:          fmtAmount(ytdNum),
    ytdLinked:    a.ytdLinked || b.ytdLinked,
    ytdTone:      ytdNum == null || ytdNum === 0 ? "none" : ytdNum < 0 ? "red" : "green",
    variance:     v.text,
    varianceTone: v.tone,
    spcNum,
    ytdNum,
    varianceNum,
  };
};

/**
 * A SECTION adjustment is posted once per fiscal year that has a value (see
 * saveAll in ForecastActualsReport), so the backend stores one row per year
 * under the same description — the report otherwise renders "test 13cfy"
 * as two near-duplicate rows, one per fiscal year it was saved for. Merge
 * same-label adjustment rows in a section into a single row, column-wise.
 */
const mergeAdjustmentLines = (rows: ReportRow[]): ReportRow[] => {
  const merged: ReportRow[] = [];
  const byLabel = new Map<string, ReportRow>();
  for (const row of rows) {
    if (!row.isAdjustment) {
      merged.push(row);
      continue;
    }
    const key = row.label.trim().toLowerCase();
    const existing = byLabel.get(key);
    if (!existing) {
      const copy = { ...row };
      byLabel.set(key, copy);
      merged.push(copy);
      continue;
    }
    existing.cells = existing.cells.map((cell, i) => combineCells(cell, row.cells[i]));
  }
  return merged;
};

/* ─────────────────────────── Transformer ────────────────────────── */
export function transformForecastActuals(json: ForecastActualsResponse): ForecastReport {
  const fiscalYears = json?.data?.fiscal_years ?? [];
  const apiSections = json?.data?.sections ?? [];


  // The API may append a "total" rollup to each fy_data (alongside the fiscal
  // years). When present, render it as a final TOTAL column group.
  const hasTotal = apiSections.some(
    (s) =>
      s.subtotal?.fy_data?.total != null ||
      (s.lines ?? []).some((l) => l.fy_data?.total != null),
  );

  // Column keys drive both the headers and every row's cells, so lines and
  // subtotals stay aligned with the year columns (total included).
  const columnKeys = hasTotal ? [...fiscalYears, "total"] : fiscalYears;

  const years = columnKeys.map((key, i) => {
    const isTotal = key === "total";
    return {
      key,
      label: isTotal ? "TOTAL" : key.toUpperCase(),
      tone:  (isTotal ? "total" : YEAR_TONES[i % YEAR_TONES.length]) as Tone,
      isTotal,
    };
  });

  const sections: ReportSection[] = [...apiSections]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((section): ReportSection => {
      const lineRows: ReportRow[] = mergeAdjustmentLines(
        [...(section.lines ?? [])]
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((line, lineIndex): ReportRow => {
            // The rolled-up adjustments row carries no line id, so fall back to a
            // section-scoped key to keep React keys unique.
            const isAdjustment = String(line.is_section_adj ?? "").toUpperCase() === "Y";
            const id = line.fin_eval_line_id != null && line.fin_eval_line_id !== ""
              ? `line-${line.fin_eval_line_id}`
              : `line-${section.section_type}-${section.display_order}-${lineIndex}`;
            return {
              id,
              label:   line.item_description || line.account || "Line Item",
              type:    "line",
              account: line.account,
              finEvalLineId: line.fin_eval_line_id ?? null,
              isAdjustment,
              cells:   columnKeys.map((y) => toCell(line.fy_data?.[y])),
            };
          }),
      );

      const newLineRow: ReportRow = {
        id:    `new-${section.section_type}-${section.display_order}`,
        label: "+ Add New Line",
        type:  "new",
        cells: blankCells(columnKeys.length),
      };

      const subtotalRow: ReportRow = {
        id:    `subtotal-${section.section_type}-${section.display_order}`,
        label: section.subtotal?.label ?? `Subtotal ${section.section_name}`,
        type:  "subtotal",
        cells: columnKeys.map((y) => toCell(section.subtotal?.fy_data?.[y])),
      };

      return {
        finEvalSectionId: sectionIdOf(section),
        title:            section.section_name,
        rows:             [...lineRows, newLineRow, subtotalRow],
      };
    });

  return { years, sections };
}

/* ─────────────────────────── URL / token helpers ────────────────── */
export const DEFAULT_REPORT_PROPOSAL_ID = 516;

// proposal_id, spc_type_id and spc_type_template_id are now passed as request
// headers (see buildReportHeaders) rather than in the path, so the endpoint can
// resolve the report from the SPC type/template when proposal_id is null.
const REPORT_PATH = "/GIS/PIR/forecastsActualsComparision";

// Always the real ORDS endpoint — see actual-drilldown-api.ts for why the
// local dev proxy branch was dropped.
export function buildReportUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${REPORT_PATH}`;
}

/**
 * Headers for the forecast-vs-actuals call. proposal_id is sent present-but-empty
 * when null/invalid (curl: `--header 'proposal_id;'`) so the endpoint falls back
 * to spc_type_id + spc_type_template_id. Null/undefined values are dropped by fetchJson.
 */
export function buildReportHeaders(
  cfg: AppConfig,
  proposalId?: number | string,
): Record<string, string | number | null | undefined> {
  const id = proposalId ?? cfg.proposal_id;
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

/* ────────────────── Section ids (financialEvaluation) ───────────── */
/**
 * forecastsActualsComparision omits fin_eval_section_id, but adjustments must be
 * posted against it, so the PKs are read from financialEvaluation and matched on
 * section_name — e.g. "Capital Investment" → 6097.
 *
 * Endpoint: GET {api_endpoint}/GIS/proposalAuthoring/financialEvaluation
 *           ?proposal_id=516&spc_type_id=102&template_type_id=308
 * (query params, not a path segment — and note `template_type_id`, which maps
 * from the config's spc_type_template_id.)
 *
 * Response nesting has varied (data.items.sections / data[0].sections /
 * data.sections), so all three are probed.
 */
type EvalSection = { fin_eval_section_id?: number | string | null; section_name?: string | null };

const normaliseName = (s: string): string => s.trim().toLowerCase();

function extractEvalSections(json: unknown): EvalSection[] {
  const data = (json as { data?: unknown })?.data;
  if (data == null) return [];
  const candidates: unknown[] = [
    (data as { items?: { sections?: unknown } })?.items?.sections,
    Array.isArray(data) ? (data[0] as { sections?: unknown })?.sections : undefined,
    (data as { sections?: unknown })?.sections,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c as EvalSection[];
  return [];
}

/** section_name (normalised) → fin_eval_section_id. Empty map on any failure. */
export async function getSectionIdsByName(cfg: AppConfig): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const proposalId = cfg.proposal_id;
  if (!Number.isFinite(Number(proposalId)) || Number(proposalId) <= 0) return map;

  const path = "/GIS/proposalAuthoring/financialEvaluation";
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const base = `${cfg.api_endpoint}${path}`;
  const query = new URLSearchParams({ proposal_id: String(proposalId) });
  // The endpoint resolves the template from these when they're configured.
  if (cfg.spc_type_id != null && cfg.spc_type_id !== "") {
    query.set("spc_type_id", String(cfg.spc_type_id));
  }
  if (cfg.spc_type_template_id != null && cfg.spc_type_template_id !== "") {
    query.set("template_type_id", String(cfg.spc_type_template_id));
  }
  const url = `${base}?${query.toString()}`;

  try {
    const override = devToken();
    const token = override || extractToken(await fetchAuthToken(cfg));
    const json = await fetchJson<unknown>(url, token, undefined, undefined, cfg);
    for (const s of extractEvalSections(json)) {
      const id = Number(s?.fin_eval_section_id);
      const name = s?.section_name;
      if (name && Number.isFinite(id) && id > 0) map.set(normaliseName(name), id);
    }
  } catch (err) {
    // Swallowed on purpose — the report still renders without section ids. But
    // adjustments post against fin_eval_section_id, so say what breaks rather
    // than logging a bare error next to a screen that looks fine.
    const missing = missingAuthContext(cfg);
    console.warn(
      "[SectionIds] financialEvaluation lookup failed — sections load without " +
        "fin_eval_section_id, so posting adjustments will fail." +
        (missing.length > 0
          ? ` Cause: ${missing.join(" and ")} missing from window.__APP_CONFIG__.`
          : ""),
      err,
    );
  }
  console.log("[SectionIds] section_name → fin_eval_section_id", Object.fromEntries(map));
  return map;
}

/** Stamp fin_eval_section_id onto each section by matching section_name. */
export function applySectionIds(report: ForecastReport, ids: Map<string, number>): ForecastReport {
  if (ids.size === 0) return report;
  return {
    ...report,
    sections: report.sections.map((s) =>
      s.finEvalSectionId != null ? s : { ...s, finEvalSectionId: ids.get(normaliseName(s.title)) ?? null }),
  };
}

/* ─────────────────────────── Network call ───────────────────────── */
// Live-only: returns the API response or throws (no static fallback).
export async function getForecastActuals(
  cfg: AppConfig,
  proposalId?: number | string,
): Promise<ForecastReport> {
  const override = devToken();

  const token = override || extractToken(await fetchAuthToken(cfg));
  const url = buildReportUrl(cfg);
  const headers = buildReportHeaders(cfg, proposalId);
  const json = await fetchJson<ForecastActualsResponse>(url, token, undefined, headers, cfg);
  // Debug: inspect the raw forecast-vs-actuals payload (incl. null-proposal defaults).
  console.log("[ForecastActuals] request", { url, headers });
  console.log("[ForecastActuals] response", json);
  return transformForecastActuals(json);
}

export async function saveForecastActuals(
  cfg: AppConfig,
  report: ForecastReport,
  edits: ForecastCellEdit[],
): Promise<string | undefined> {
  if (edits.length === 0) return undefined;
  const proposalId = Number(cfg.proposal_id);
  if (!Number.isFinite(proposalId) || proposalId <= 0) {
    throw new Error("A valid proposal_id is required to save forecast values");
  }

  const editsByCell = new Map(edits.map((edit) => [`${edit.rowId}::${edit.fiscalYear}`, edit.value]));
  const sections = report.sections
    .filter((section) => section.finEvalSectionId != null)
    .map((section) => ({
      fin_eval_section_id: section.finEvalSectionId,
      lines: section.rows
        .filter((row) => row.type === "line" && !row.isAdjustment && row.finEvalLineId != null)
        .map((row) => ({
          fin_eval_line_id: row.finEvalLineId,
          // Required by the backend even on an unrelated field update — omitting
          // it reads as "missing" and rejects the whole line.
          account: row.account ?? null,
          year_values: Object.fromEntries(
            report.years.map((year, index) => {
              const cell = row.cells[index];
              const editKey = `${row.id}::${year.key}`;
              const entry: YearValueEntry = {
                spc_projected_amount: cell.spcNum,
                variance: cell.varianceNum,
              };
              // An edited cell always sends what was typed. Otherwise future years
              // leave ytd_actuals out entirely; past/current years resend the GET value.
              if (editsByCell.has(editKey)) entry.ytd_actuals = editsByCell.get(editKey) ?? null;
              else if (!isFutureFiscalYear(year.key)) entry.ytd_actuals = cell.ytdNum;
              return [year.key, entry];
            }),
          ),
        })),
    }));

  const url = `${cfg.api_endpoint}/GIS/proposalAuthoring/${proposalId}/financialEvaluation`;
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    language: "EN",
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  const body = JSON.stringify({ sections });
  console.log("[ForecastActuals] PUT", url);
  console.log("[ForecastActuals] PUT headers", headers);
  console.log("[ForecastActuals] PUT body\n" + JSON.stringify({ sections }, null, 2));

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body,
  });
  const responseText = await response.text().catch(() => "");
  console.log("[ForecastActuals] PUT response", response.status, responseText);
  if (!response.ok) {
    // ORDS error bodies are JSON ({apiStatus, apiMessage}) — surface just the
    // message when present instead of dumping the raw JSON at the user.
    throw new Error(extractApiErrorMessage(responseText) || `HTTP ${response.status}: ${response.statusText}${responseText ? ` — ${responseText.slice(0, 300)}` : ""}`);
  }
  // ORDS can answer 200 with a failure encoded in the body (apiStatus "E") —
  // the earlier "Account ... is missing" error came back exactly this way, so
  // response.ok alone would have reported a save that the backend rejected.
  let apiMessage: string | undefined;
  try {
    const parsed = responseText.trim() ? JSON.parse(responseText) as { apiStatus?: string; apiMessage?: string } : {};
    if (parsed.apiStatus && parsed.apiStatus.toUpperCase() !== "S") {
      throw new Error(parsed.apiMessage || `Save rejected (apiStatus "${parsed.apiStatus}")`);
    }
    apiMessage = parsed.apiMessage;
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Non-JSON 2xx body — nothing to validate, treat as success.
    } else {
      throw err;
    }
  }
  notifyDataChanged("PUT financialEvaluation (future forecasts)");
  return apiMessage;
}
