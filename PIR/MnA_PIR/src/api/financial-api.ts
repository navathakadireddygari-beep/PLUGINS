/**
 * Financial evaluation API
 *
 * Endpoint:  {api_endpoint}/Financial/get_data/{proposal_id}
 * GET  → fetches current financial data for a proposal
 * PUT  → saves the edited table back (ORDS routes by HTTP method)
 *
 * Both calls attach a Bearer token obtained via `fetchAuthToken` (auth-api.ts).
 * `proposal_id`, `app_user`, `api_endpoint` come from window.__APP_CONFIG__
 * (set in index.html) and are read via `getAppConfig`.
 */
import type { AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { notifyDataChanged } from "../lib/refresh-bus";
import { extractApiErrorMessage } from "../lib/http";

/* ─────────────────────────── UI-side types ──────────────────────── */
export type YearValues = Record<number, number>;

export type ValueRow = {
  id:               string;
  name:             string;
  yearValues:       YearValues;
  rowTotal?:        number;
  accountId?:       string;
  lineType:         string;
  lineId?:          number;
  sectionId?:       number;
  lineIdentifier?:  string;
  isCalculated?:    string;
  displayOrder?:    number;
  status?:          string;
  languageCode?:    string;
};

export type Group = {
  id:            string;
  name:          string;
  expanded:      boolean;
  values:        ValueRow[];
  sectionId?:    number;
  sectionType?:  string;
  isCustom?:     string;
  displayOrder?: number;
  status?:       string;
  languageCode?: string;
  rawSection?:   ApiSection;
};

export type PivotTableData = {
  headerName:   string;
  years:        number[];
  columnLabels: Record<number, string>;
  groups:       Group[];
};

/* ─────────────────────────── Wire types ─────────────────────────── */
export type YearEntry = {
  spc_projected_amount:  number | null;
  ytd_budgeted_forecast: number | null;
  ytd_actuals:           number | null;
  variance:              number | null;
};

export type ApiLine = {
  fin_eval_line_id:    number;
  fin_eval_section_id: number;
  line_type:           string;
  line_item_name:      string;
  line_identifier:     string;
  is_calculated:       string;
  account:             string | null;
  display_order:       number;
  year_values:         Record<string, YearEntry>;
  status:              string;
  language_code:       string;
};

export type ApiSection = {
  fin_eval_section_id: number;
  section_name:        string;
  section_type:        string;
  is_custom:           string;
  display_order:       number;
  status:              string;
  language_code:       string;
  lines:               ApiLine[];
};

export type ApiHeader = {
  fin_eval_header_id:        number;
  proposal_id:               number;
  proposal_title:            string;
  local_currency:            string;
  display_currency:          string;
  exchange_rate:             number;
  hurdle_rate_percent:       number;
  discount_rate_percent:     number;
  share_repurchase_percent:  number;
  amortisation_period_years: number;
  date_placed_in_service:    string;
  tax_rate_percent:          number;
  display_years:             number;
  kpi_type:                  string;
  npv:                       number | null;
  irr_percent:               string | null;
  payback_period_years:      number | null;
  total_cash_inflow:         number | null;
  total_cash_outflow:        number | null;
  gross_profit:              number | null;
  gross_margin_percent:      number | null;
  total_contract_value_kpi:  number | null;
  number_of_years:           number | null;
  annual_contract_value:     number | null;
  total_lease_value:         number | null;
  lease_terms_years:         number | null;
  investment:                number | null;
  performance_metrics:       object[] | null;
  region_id:                 number | null;
  entity_id:                 number | null;
  business_unit_id:          number | null;
  status:                    string;
  language_code:             string;
  sections:                  ApiSection[];
};

export type ApiResponse = { data: ApiHeader[] };

/* ─────────────────────────── URL helper ─────────────────────────── */
export function buildFinancialUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  if (!cfg.proposal_id)  throw new Error("Missing proposal_id in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/${cfg.proposal_id}/financialEvaluation`;
}

/* ─────────────────────────── Empty defaults ─────────────────────── */
// Used when the backend returns no data so the UI can still render the
// toolbar and let the user build a proposal from scratch.
export function createEmptyTable(): PivotTableData {
  const startYear = new Date().getFullYear();
  const years     = Array.from({ length: 6 }, (_, i) => startYear + i);
  const columnLabels: Record<number, string> = {};
  years.forEach((y) => { columnLabels[y] = `FY${String(y).slice(2)}`; });
  return { headerName: "Untitled Proposal", years, columnLabels, groups: [] };
}

export function createEmptyHeader(cfg: AppConfig): ApiHeader {
  return {
    fin_eval_header_id:        0,
    proposal_id:               Number(cfg.proposal_id) || 0,
    proposal_title:            "Untitled Proposal",
    local_currency:            "",
    display_currency:          "",
    exchange_rate:             0,
    hurdle_rate_percent:       0,
    discount_rate_percent:     0,
    share_repurchase_percent:  0,
    amortisation_period_years: 0,
    date_placed_in_service:    "",
    tax_rate_percent:          0,
    display_years:             6,
    kpi_type:                  "",
    npv:                       null,
    irr_percent:               null,
    payback_period_years:      null,
    total_cash_inflow:         null,
    total_cash_outflow:        null,
    gross_profit:              null,
    gross_margin_percent:      null,
    total_contract_value_kpi:  null,
    number_of_years:           null,
    annual_contract_value:     null,
    total_lease_value:         null,
    lease_terms_years:         null,
    investment:                null,
    performance_metrics:       null,
    region_id:                 null,
    entity_id:                 null,
    business_unit_id:          null,
    status:                    "ACTIVE",
    language_code:             "EN",
    sections:                  [],
  };
}

/* ─────────────────────────── GET transformer ────────────────────── */
export function transformApiData(
  json: ApiResponse
): { table: PivotTableData; rawHeader: ApiHeader } | null {
  const header = json?.data?.[0];
  if (!header) return null;

  const sections: ApiSection[] = header.sections || [];

  let yearKeys: string[] = [];
  for (const sec of sections) {
    const firstLine = sec.lines?.[0];
    if (firstLine?.year_values) {
      yearKeys = Object.keys(firstLine.year_values).filter((k) => k !== "total").sort();
      break;
    }
  }

  const years: number[] = yearKeys.map((k) => {
    const n = parseInt(k.replace(/\D/g, ""), 10);
    return n < 100 ? 2000 + n : n;
  });

  const columnLabels: Record<number, string> = {};
  years.forEach((y, i) => { columnLabels[y] = yearKeys[i].toUpperCase(); });

  const groups: Group[] = [...sections]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((section): Group => {
      const values: ValueRow[] = [...(section.lines || [])]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((line): ValueRow => {
          const yearValues: YearValues = {};
          yearKeys.forEach((key, i) => {
            const raw = line.year_values?.[key]?.spc_projected_amount;
            yearValues[years[i]] = raw != null ? Number(raw) : 0;
          });
          const totalEntry = line.year_values?.["total"]?.spc_projected_amount;
          return {
            id:             `val-${line.fin_eval_line_id}`,
            name:           line.line_item_name  ?? "Line Item",
            yearValues,
            rowTotal:       totalEntry != null ? Number(totalEntry) : undefined,
            accountId:      line.account         ?? undefined,
            lineType:       line.line_type        ?? "",
            lineId:         line.fin_eval_line_id,
            sectionId:      line.fin_eval_section_id,
            lineIdentifier: line.line_identifier  ?? "Financial",
            isCalculated:   line.is_calculated    ?? "N",
            displayOrder:   line.display_order,
            status:         line.status           ?? "ACTIVE",
            languageCode:   line.language_code    ?? "EN",
          };
        });

      return {
        id:           `grp-${section.fin_eval_section_id}`,
        name:         section.section_name ?? "Section",
        expanded:     true,
        values,
        sectionId:    section.fin_eval_section_id,
        sectionType:  section.section_type   ?? "CUSTOM",
        isCustom:     section.is_custom      ?? "N",
        displayOrder: section.display_order,
        status:       section.status         ?? "ACTIVE",
        languageCode: section.language_code  ?? "EN",
        rawSection:   section,
      };
    });

  return {
    table:     { headerName: header.proposal_title ?? "Untitled Proposal", years, columnLabels, groups },
    rawHeader: header,
  };
}

/* ─────────────────────────── PUT payload builder ────────────────── */
export function buildPutPayload(
  tableData: PivotTableData,
  rawHeader: ApiHeader,
  appUser: string
): object {
  const proposalTitle = tableData.headerName?.trim() || rawHeader.proposal_title || "Untitled Proposal";
  const toFyKey = (year: number): string =>
    (tableData.columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const sections = tableData.groups.map((group, grpIdx) => {
    const lines = group.values.map((value, lineIdx) => {
      const year_values: Record<string, object> = {};
      tableData.years.forEach((y) => {
        year_values[toFyKey(y)] = {
          spc_projected_amount:  value.yearValues[y] || null,
          ytd_budgeted_forecast: null,
          ytd_actuals:           null,
          variance:              null,
        };
      });
      const totalAmt = tableData.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
      year_values["total"] = {
        spc_projected_amount:  totalAmt || null,
        ytd_budgeted_forecast: null,
        ytd_actuals:           null,
        variance:              null,
      };

      return {
        fin_eval_line_id:    value.lineId    ?? null,
        fin_eval_section_id: value.sectionId ?? group.sectionId ?? null,
        line_type:           value.lineType  || "CUSTOM",
        line_item_name:      value.name,
        line_identifier:     value.lineIdentifier ?? "Financial",
        is_calculated:       value.isCalculated   ?? "N",
        account:             value.accountId      ?? null,
        display_order:       value.displayOrder   ?? lineIdx + 1,
        year_values,
        status:              value.status       ?? "ACTIVE",
        language_code:       value.languageCode ?? "EN",
      };
    });

    return {
      fin_eval_section_id: group.sectionId    ?? null,
      section_name:        group.name,
      section_type:        group.sectionType  ?? "CUSTOM",
      is_custom:           group.isCustom     ?? "Y",
      display_order:       group.displayOrder ?? grpIdx + 1,
      status:              group.status       ?? "ACTIVE",
      language_code:       group.languageCode ?? "EN",
      lines,
    };
  });

  return {
    user_email:                appUser,
    proposal_title:            proposalTitle,
    local_currency:            rawHeader.local_currency,
    display_currency:          rawHeader.display_currency,
    exchange_rate:             rawHeader.exchange_rate,
    hurdle_rate_percent:       rawHeader.hurdle_rate_percent,
    discount_rate_percent:     rawHeader.discount_rate_percent,
    share_repurchase_percent:  rawHeader.share_repurchase_percent,
    amortisation_period_years: rawHeader.amortisation_period_years,
    date_placed_in_service:    rawHeader.date_placed_in_service,
    tax_rate_percent:          rawHeader.tax_rate_percent,
    display_years:             rawHeader.display_years,
    kpi_type:                  rawHeader.kpi_type,
    npv:                       rawHeader.npv,
    irr_percent:               rawHeader.irr_percent,
    payback_period_years:      rawHeader.payback_period_years,
    total_cash_inflow:         rawHeader.total_cash_inflow,
    total_cash_outflow:        rawHeader.total_cash_outflow,
    gross_profit:              rawHeader.gross_profit,
    gross_margin_percent:      rawHeader.gross_margin_percent,
    total_contract_value_kpi:  rawHeader.total_contract_value_kpi,
    number_of_years:           rawHeader.number_of_years,
    annual_contract_value:     rawHeader.annual_contract_value,
    total_lease_value:         rawHeader.total_lease_value,
    lease_terms_years:         rawHeader.lease_terms_years,
    investment:                rawHeader.investment,
    performance_metrics:       rawHeader.performance_metrics,
    region_id:                 rawHeader.region_id,
    entity_id:                 rawHeader.entity_id,
    business_unit_id:          rawHeader.business_unit_id,
    status:                    rawHeader.status,
    language_code:             rawHeader.language_code,
    sections,
  };
}

/* ─────────────────────────── Token cache ────────────────────────── */
// Simple in-module cache — one token per page session is enough for the
// Financial table widget; refreshing on auth failures is handled by callers.
let cachedToken: string | null = null;

async function getBearerToken(cfg: AppConfig): Promise<string> {
  if (cachedToken) return cachedToken;
  const resp = await fetchAuthToken(cfg);
  cachedToken = extractToken(resp);
  return cachedToken;
}

/** Reset the cached token (e.g. on 401 response). */
export function clearCachedToken(): void {
  cachedToken = null;
}

/* ─────────────────────────── Network calls ──────────────────────── */
export async function getFinancialData(
  cfg: AppConfig
): Promise<{ table: PivotTableData; rawHeader: ApiHeader }> {
  const token = await getBearerToken(cfg);
  const res = await fetch(buildFinancialUrl(cfg), {
    headers: {
      Accept:        "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json: ApiResponse = await res.json();
  const result = transformApiData(json);
  // When the backend returns no data, seed an empty table so the UI still
  // renders the toolbar (Refresh, Save, years +/-, Add Section, Collapse All)
  // and the user can start a fresh proposal.
  if (!result) return { table: createEmptyTable(), rawHeader: createEmptyHeader(cfg) };
  return result;
}

export type SaveResponse = {
  api_status?:  string;
  api_message?: string;
  [k: string]:  unknown;
};

async function sendJson(
  method:  "POST" | "PUT",
  cfg:     AppConfig,
  url:     string,
  payload: object,
): Promise<SaveResponse> {
  const token = await getBearerToken(cfg);

  console.log(`[financial-api] → ${method}`, url, payload);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let json: SaveResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  console.log(`[financial-api] ← ${method} response`, res.status, json || text);

  if (!res.ok) {
    throw new Error(json.api_message || extractApiErrorMessage(text) || `HTTP ${res.status}: ${res.statusText}`);
  }
  if (json.api_status && json.api_status !== "S" && json.api_status !== "SUCCESS") {
    throw new Error(json.api_message || "Save failed on server.");
  }
  notifyDataChanged(`${method} financialEvaluation`);
  return json;
}

/**
 * Save the proposal.
 *
 * Routing rule:
 *  - First save of a brand-new proposal (GET returned `{data: []}`, so
 *    `rawHeader.fin_eval_header_id` is 0 from createEmptyHeader) → POST
 *  - Every subsequent save                                        → PUT
 *
 * Callers should reload data afterwards so newly-created section/line ids
 * come back into local state.
 */
export async function saveFinancialData(
  cfg: AppConfig,
  data: PivotTableData,
  rawHeader: ApiHeader
): Promise<{ method: "POST" | "PUT"; response: SaveResponse }> {
  const url     = buildFinancialUrl(cfg);
  const payload = buildPutPayload(data, rawHeader, cfg.app_user);
  const method: "POST" | "PUT" = rawHeader.fin_eval_header_id ? "PUT" : "POST";
  const response = await sendJson(method, cfg, url, payload);
  return { method, response };
}

/* ─────────────────────────── Subtotal calc (section-level) ─────────── */
export type CalcSubtotalResponse = ApiSection & { [k: string]: unknown };

export function buildSectionPayload(
  group:        Group,
  tableData:    PivotTableData,
): object {
  const toFyKey = (year: number): string =>
    (tableData.columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const rawLines = group.rawSection?.lines ?? [];

  const lines = group.values.map((v) => {
    const rawLine = rawLines.find((rl) => rl.fin_eval_line_id === v.lineId);

    const year_values: Record<string, object> = {};
    tableData.years.forEach((y) => {
      const fyK = toFyKey(y);
      const rawYv = rawLine?.year_values?.[fyK];
      year_values[fyK] = {
        spc_projected_amount:  v.yearValues[y] || null,
        ytd_budgeted_forecast: rawYv?.ytd_budgeted_forecast ?? null,
        ytd_actuals:           rawYv?.ytd_actuals ?? null,
        variance:              rawYv?.variance ?? null,
      };
    });
    const rawTotal = rawLine?.year_values?.["total"];
    const totalAmt = tableData.years.reduce((s, y) => s + (v.yearValues[y] || 0), 0);
    year_values["total"] = {
      spc_projected_amount:  totalAmt || null,
      ytd_budgeted_forecast: rawTotal?.ytd_budgeted_forecast ?? null,
      ytd_actuals:           rawTotal?.ytd_actuals ?? null,
      variance:              rawTotal?.variance ?? null,
    };

    const base = rawLine ? { ...rawLine } : {};
    return {
      ...base,
      fin_eval_line_id:    v.lineId ?? null,
      fin_eval_section_id: group.sectionId ?? null,
      line_type:           v.lineType ?? group.sectionType ?? "",
      line_item_name:      v.name,
      line_identifier:     v.lineIdentifier ?? "Financial",
      is_calculated:       v.isCalculated ?? "N",
      account:             v.accountId ?? null,
      display_order:       v.displayOrder ?? 1,
      year_values,
      status:              v.status ?? "ACTIVE",
      language_code:       v.languageCode ?? "EN",
    };
  });

  const rawSec = group.rawSection ? { ...group.rawSection } : {};
  return {
    ...rawSec,
    fin_eval_section_id: group.sectionId ?? null,
    section_name:        group.name,
    section_type:        group.sectionType ?? "CUSTOM",
    is_custom:           group.isCustom ?? "Y",
    display_order:       group.displayOrder ?? 1,
    status:              group.status ?? "ACTIVE",
    language_code:       group.languageCode ?? "EN",
    lines,
  };
}

export async function calcSubtotal(
  cfg:     AppConfig,
  body:    object,
): Promise<CalcSubtotalResponse> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finCalcSubtotal`;

  console.log("[financial-api] → POST calcSubtotal", url, body);

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  console.log("[financial-api] ← calcSubtotal response", json);
  return json;
}

/* ─────────────────────────── Insert helpers (POST) ──────────────── */
// Payload builders for a single section / single line, matching the shape
// used by buildPutPayload so the backend sees a consistent schema.

function buildSectionInsertBody(group: Group, appUser: string, grpIdx = 1): object {
  return {
    user_email:          appUser,
    fin_eval_section_id: group.sectionId    ?? null,
    section_name:        group.name,
    section_type:        group.sectionType  ?? "CUSTOM",
    is_custom:           group.isCustom     ?? "Y",
    display_order:       group.displayOrder ?? grpIdx,
    status:              group.status       ?? "ACTIVE",
    language_code:       group.languageCode ?? "EN",
    lines:               [],
  };
}

function buildLineInsertBody(
  value:     ValueRow,
  sectionId: number | null,
  years:     number[],
  columnLabels: Record<number, string>,
  appUser:   string,
  lineIdx = 1,
): object {
  const toFyKey = (year: number): string =>
    (columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const year_values: Record<string, object> = {};
  years.forEach((y) => {
    year_values[toFyKey(y)] = {
      spc_projected_amount:  value.yearValues[y] || null,
      ytd_budgeted_forecast: null,
      ytd_actuals:           null,
      variance:              null,
    };
  });
  const totalAmt = years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
  year_values["total"] = {
    spc_projected_amount:  totalAmt || null,
    ytd_budgeted_forecast: null,
    ytd_actuals:           null,
    variance:              null,
  };

  return {
    user_email:          appUser,
    fin_eval_line_id:    value.lineId    ?? null,
    fin_eval_section_id: sectionId       ?? value.sectionId ?? null,
    line_type:           value.lineType  || "CUSTOM",
    line_item_name:      value.name,
    line_identifier:     value.lineIdentifier ?? "Financial",
    is_calculated:       value.isCalculated   ?? "N",
    account:             value.accountId      ?? null,
    display_order:       value.displayOrder   ?? lineIdx,
    year_values,
    status:              value.status       ?? "ACTIVE",
    language_code:       value.languageCode ?? "EN",
  };
}

/** The parts of a /Financial insert response the callers read. */
type InsertResponse = {
  api_status?:          string;
  api_message?:         string;
  fin_eval_section_id?: number | null;
  fin_eval_line_id?:    number | null;
  data?: Array<{ fin_eval_section_id?: number | null; fin_eval_line_id?: number | null }>;
  [k: string]: unknown;
};

async function postJson(cfg: AppConfig, path: string, body: object): Promise<InsertResponse> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}${path}`;

  console.log("[financial-api] → POST", url, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  let json: InsertResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  console.log("[financial-api] ← POST response", res.status, json || text);

  if (!res.ok) {
    throw new Error(json.api_message || extractApiErrorMessage(text) || `HTTP ${res.status}: ${res.statusText}`);
  }
  if (json.api_status && json.api_status !== "S" && json.api_status !== "SUCCESS") {
    throw new Error(json.api_message || "Insert failed on server.");
  }
  notifyDataChanged(`POST ${path}`);
  return json;
}

/** Insert a new section for this proposal. Returns server-assigned section id. */
export async function insertSection(
  cfg:   AppConfig,
  group: Group,
  displayOrder = 1,
): Promise<{ sectionId: number | null; raw: InsertResponse }> {
  const body = buildSectionInsertBody(group, cfg.app_user, displayOrder);
  const json = await postJson(cfg, `/Financial/section/${cfg.proposal_id}`, body);
  const sectionId: number | null =
    json?.data?.[0]?.fin_eval_section_id ??
    json?.fin_eval_section_id ??
    null;
  return { sectionId, raw: json };
}

/** Insert a new line inside a section. Returns server-assigned line id. */
export async function insertLine(
  cfg:          AppConfig,
  sectionId:    number | null,
  value:        ValueRow,
  years:        number[],
  columnLabels: Record<number, string>,
  displayOrder = 1,
): Promise<{ lineId: number | null; raw: InsertResponse }> {
  const body = buildLineInsertBody(value, sectionId, years, columnLabels, cfg.app_user, displayOrder);
  const json = await postJson(cfg, `/Financial/line/${cfg.proposal_id}`, body);
  const lineId: number | null =
    json?.data?.[0]?.fin_eval_line_id ??
    json?.fin_eval_line_id ??
    null;
  return { lineId, raw: json };
}
