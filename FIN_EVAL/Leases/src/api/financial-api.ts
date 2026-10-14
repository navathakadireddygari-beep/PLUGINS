/**
 * Financial evaluation API
 *
 * Endpoint:  {api_endpoint}/Financial/get_data/{proposal_id}
 * GET  → fetches current financial data for a proposal
 * PUT  → saves the edited table back (ORDS routes by HTTP method)
 *
 * Both calls attach a Bearer token obtained via `fetchAuthToken` (auth-api.ts).
 * `proposal_id`, `app_user`, `api_endpoint` come from window.__APP_CONFIG__
 * (set by the host APEX page's p_render procedure) and are read via `getAppConfig`.
 */
import type { AppConfig } from "../config/app-config";
import { authHeaders } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";

/* ─────────────────────────── UI-side types ──────────────────────── */
export type YearValues = Record<number, number>;

export type ValueRow = {
  id:                 string;
  name:               string;
  yearValues:         YearValues;
  rowTotal?:          number;
  accountId?:         string;
  targetGoLiveDate?:  string;
  lineType:           string;
  lineId?:            number;
  sectionId?:         number;
  lineIdentifier?:    string;
  isCalculated?:      string;
  isCustom?:          string;
  isMandatory?:       string;
  displayOrder?:      number;
  status?:            string;
  languageCode?:      string;
};

export type Group = {
  id:                  string;
  name:                string;
  expanded:            boolean;
  values:              ValueRow[];
  sectionId?:          number;
  parentSectionId?:    number;
  // Template-hierarchy ids, present on fresh (unpersisted) template
  // responses where fin_eval_section_id / parent_fin_eval_section_id are
  // still null. Used only to build the parent/child tree — never sent
  // back as fin_eval_section_id in the save payload.
  templateSectionId?:       number;
  parentTemplateSectionId?: number;
  sectionType?:        string;
  isCustom?:           string;
  isMandatory?:        string;
  isNewLineRequired?:  string;
  isAccountRequired?:  string;
  displayOrder?:       number;
  status?:             string;
  languageCode?:       string;
  rawSection?:         ApiSection;
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
  fin_eval_line_id:           number | null;
  fin_eval_section_id:        number | null;
  template_fin_eval_line_id?: number | null;
  line_type:                  string;
  line_item_name:             string;
  line_identifier:            string;
  is_calculated:              string;
  is_custom?:                 string;
  is_mandatory?:              string;
  account:                    string | null;
  target_go_live_date:        string | null;
  display_order:              number;
  year_values:                Record<string, YearEntry>;
  status:                     string;
  language_code:              string;
};

export type ApiSection = {
  fin_eval_section_id:          number | null;
  parent_fin_eval_section_id?:  number | null;
  template_section_id?:         number | null;
  parent_template_section_id?:  number | null;
  section_name:                 string;
  section_type:                 string;
  is_custom:             string;
  is_mandatory?:         string;
  is_new_line_required?: string;
  is_account_required?:  string;
  display_order:         number;
  status:                string;
  language_code:         string;
  lines:                 ApiLine[];
};

export type HurdleCheck = {
  check_code?:   string;
  label?:        string;
  hurdle_value?: number | null;
  actual_value?: number | null;
  pass?:         boolean;
};

export type ApiHeader = {
  fin_eval_header_id:        number;
  proposal_id:               number;
  proposal_title:            string;
  proposal_status:           string;
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
  total_contract_value:      number | null;
  number_of_years:           number | null;
  annual_contract_value:     number | null;
  total_lease_value:         number | null;
  lease_terms_years:         number | null;
  investment:                number | null;
  // The API only returns Net Summary figures inside performance_metrics,
  // never at header level. `*_pct` values arrive as FRACTIONS
  // (-0.0846 = -8.46%), not as pre-multiplied percentages.
  performance_metrics:       {
    hurdle_checks?:          HurdleCheck[];
    total_net_saving?:       number | null;
    annual_run_rate_saving?: number | null;
    annual_run_rate_pct?:    number | null;
    annual_rent_saving?:     number | null;
    rent_reduction_pct?:     number | null;
    rentable_area_sqm?:      number | null;
    rentable_area_pct?:      number | null;
    pct_of_total_headcount?: number | null;
    pct_of_total_workstns?:  number | null;
    site_flex_rate?:         number | null;
    computed_at?:            string | null;
  } | null;
  status:                    string;
  language_code:             string;
  sections:                  ApiSection[];
};

export type ApiResponse = { data: ApiHeader[] };
type MutationResponse = {
  api_status?: string;
  api_message?: string;
  data?: Array<{
    fin_eval_section_id?: number | null;
    fin_eval_line_id?: number | null;
  }>;
  fin_eval_section_id?: number | null;
  fin_eval_line_id?: number | null;
  [key: string]: unknown;
};

/* ────────────────────── Proposal status handling ────────────────── */
// Statuses where the Export Template action is hidden.
const NO_EXPORT_PROPOSAL_STATUSES: ReadonlySet<string> = new Set([
  "SUBMITTED", "IN_PROGRESS", "APPROVED",
]);
export const isExportTemplateHidden = (status: string | null | undefined): boolean =>
  !!status && NO_EXPORT_PROPOSAL_STATUSES.has(status.toUpperCase());

// Statuses where the proposal is locked for edits regardless of user role;
// anything else (DRAFT, REJECTED, NEEDS_REAPPROVAL, unknown/missing) stays editable.
const READONLY_PROPOSAL_STATUSES: ReadonlySet<string> = new Set([
  "SUBMITTED", "IN_PROGRESS", "APPROVED", "CLOSED",
]);
export const isProposalStatusReadonly = (status: string | null | undefined): boolean =>
  !!status && READONLY_PROPOSAL_STATUSES.has(status.toUpperCase());

/* ─────────────────────────── URL helpers ────────────────────────── */
// GET  →  {api_endpoint}/GIS/proposalAuthoring/financialEvaluation?proposal_id=X[&template_type_id=Y]
//         {api_endpoint}/GIS/proposalAuthoring/financialEvaluation?spc_type_id=X[&template_type_id=Y]
// PUT  →  {api_endpoint}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation
export function buildFinancialUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const base = `${cfg.api_endpoint}/GIS/proposalAuthoring/financialEvaluation`;
  if (cfg.proposal_id != null) {
    return `${base}?proposal_id=${cfg.proposal_id}`;
  }
  const spc  = cfg.spc_type_id      != null ? `spc_type_id=${cfg.spc_type_id}`           : "";
  const tmpl = cfg.template_type_id != null ? `template_type_id=${cfg.template_type_id}` : "";
  const qs   = [spc, tmpl].filter(Boolean).join("&");
  if (qs) return `${base}?${qs}`;
  throw new Error("Missing proposal_id or spc_type_id in window.__APP_CONFIG__");
}

export function buildFinancialPutUrl(cfg: AppConfig, rawHeader: ApiHeader): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const proposalId = cfg.proposal_id ?? rawHeader.proposal_id;
  if (!proposalId) throw new Error("Cannot save: no proposal_id available.");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/${proposalId}/financialEvaluation`;
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
    proposal_id:               cfg.proposal_id ?? cfg.spc_type_id ?? 0,
    proposal_title:            "Untitled Proposal",
    proposal_status:           "DRAFT",
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
    total_contract_value:      null,
    number_of_years:           null,
    annual_contract_value:     null,
    total_lease_value:         null,
    lease_terms_years:         null,
    investment:                null,
    performance_metrics:       null,
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
          // Use template ID as React key fallback when real ID is null (template response)
          const lineKey = line.fin_eval_line_id ?? line.template_fin_eval_line_id;
          return {
            id:             `val-${lineKey ?? Math.random()}`,
            name:           line.line_item_name  ?? "Line Item",
            yearValues,
            rowTotal:       totalEntry != null ? Number(totalEntry) : undefined,
            accountId:          line.account               ?? undefined,
            targetGoLiveDate:   line.target_go_live_date   ?? undefined,
            lineType:           line.line_type              ?? "",
            lineId:         line.fin_eval_line_id ?? undefined,
            sectionId:      line.fin_eval_section_id ?? undefined,
            lineIdentifier: (line.line_identifier ?? "FINANCIAL").toUpperCase(),
            isCalculated:   line.is_calculated    ?? "N",
            isCustom:       line.is_custom        ?? "Y",
            isMandatory:    line.is_mandatory     ?? "N",
            displayOrder:   line.display_order,
            status:         line.status           ?? "ACTIVE",
            languageCode:   line.language_code    ?? "EN",
          };
        });

      // Use template ID as React key fallback when real ID is null (template response)
      const sectionKey = section.fin_eval_section_id ?? section.template_section_id;
      return {
        id:           `grp-${sectionKey ?? Math.random()}`,
        name:         section.section_name ?? "Section",
        expanded:     true,
        values,
        sectionId:               section.fin_eval_section_id        ?? undefined,
        parentSectionId:         section.parent_fin_eval_section_id ?? undefined,
        templateSectionId:       section.template_section_id        ?? undefined,
        parentTemplateSectionId: section.parent_template_section_id ?? undefined,
        sectionType:  section.section_type   ?? "CUSTOM",
        isCustom:           section.is_custom             ?? "N",
        isMandatory:        section.is_mandatory          ?? "N",
        isNewLineRequired:  section.is_new_line_required  ?? "Y",
        isAccountRequired:  section.is_account_required   ?? "N",
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
  cfg: AppConfig
): object {
  const appUser = cfg.app_user;
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
        line_item_name:        value.name,
        line_identifier:       (value.lineIdentifier ?? "FINANCIAL").toUpperCase(),
        is_calculated:         value.isCalculated      ?? "N",
        account:               value.accountId         ?? null,
        target_go_live_date:   value.targetGoLiveDate  ?? null,
        display_order:       value.displayOrder   ?? lineIdx + 1,
        year_values,
        status:              value.status       ?? "ACTIVE",
        language_code:       value.languageCode ?? "EN",
      };
    });

    return {
      fin_eval_section_id: group.sectionId    ?? null,
      // Without this a user-added section is stored with a null parent and
      // then disappears from its tab on the next load. Field name matches the
      // GET response exactly (see ApiSection).
      parent_fin_eval_section_id: group.parentSectionId ?? null,
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
    fin_eval_header_id:        rawHeader.fin_eval_header_id ?? null,
    proposal_id:               cfg.proposal_id,
    user_email:                appUser,
    display_currency:          rawHeader.display_currency,
    exchange_rate:             rawHeader.exchange_rate ?? null,
    hurdle_rate_percent:       rawHeader.hurdle_rate_percent,
    discount_rate_percent:     rawHeader.discount_rate_percent,
    share_repurchase_percent:  rawHeader.share_repurchase_percent,
    amortisation_period_years: rawHeader.amortisation_period_years,
    date_placed_in_service:    rawHeader.date_placed_in_service,
    tax_rate_percent:          rawHeader.tax_rate_percent ?? null,
    display_years:             rawHeader.display_years ?? null,
    kpi_type:                  rawHeader.kpi_type ?? null,
    number_of_years:           rawHeader.number_of_years ?? null,
    status:                    rawHeader.status ?? null,
    performance_metrics:       rawHeader.performance_metrics,
    attribute1:                (rawHeader as any).attribute1 ?? null,
    attribute2:                (rawHeader as any).attribute2 ?? null,
    attribute3:                (rawHeader as any).attribute3 ?? null,
    attribute4:                (rawHeader as any).attribute4 ?? null,
    attribute5:                (rawHeader as any).attribute5 ?? null,
    attribute6:                (rawHeader as any).attribute6 ?? null,
    attribute7:                (rawHeader as any).attribute7 ?? null,
    attribute8:                (rawHeader as any).attribute8 ?? null,
    attribute9:                (rawHeader as any).attribute9 ?? null,
    attribute10:               (rawHeader as any).attribute10 ?? null,
    sections,
  };
}

async function extractApiError(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const j = text ? JSON.parse(text) : {};
    const msg = j.apiMessage || j.api_message || j.message || "";
    if (msg) return msg;
  } catch { /* non-JSON body */ }
  return text || fallback;
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

/* ─────────────────────────── Account codes ──────────────────────── */
export type AccountCode = {
  account_code: string;
  account_name: string;
};

export async function getAccountCodes(cfg: AppConfig, sectionType: string): Promise<AccountCode[]> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluation/accountCategoryCodes?account_category_type=${encodeURIComponent(sectionType)}`;

  //console.log("[account-codes] section_type:", sectionType);
  //console.log("[account-codes] api:", url);

  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders(cfg, token) },
  });

  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to load account codes (${res.status}).`);
    throw new Error(msg);
  }

  const json = await res.json();
  //console.log("[account-codes] response:", json);

  const rows: Record<string, unknown>[] =
    Array.isArray(json)        ? json        :
    Array.isArray(json.items)  ? json.items  :
    Array.isArray(json.data)   ? json.data   :
    Array.isArray(json.rows)   ? json.rows   : [];

  return rows
    .map((r) => ({
      account_code: r.account_code != null ? String(r.account_code) : "",
      account_name: r.account_name != null ? String(r.account_name) : "",
    }))
    .filter((ac) => ac.account_code !== "");
}
export async function getCurrencyExchangeRate(
  cfg: AppConfig,
  currency: string,
  yearPeriod?: string,
): Promise<number> {
  const upperCurrency = currency.toUpperCase();
  if (upperCurrency === "USD") return 1;

  const token = await getBearerToken(cfg);
  const now = new Date();
  const period = yearPeriod ?? `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const url = `${cfg.api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...authHeaders(cfg, token),
    },
    body: JSON.stringify({ currency: upperCurrency, year_period: period }),
  });

  if (!res.ok) {
    throw new Error(`Failed to load currency exchange rate (${res.status}).`);
  }

  const raw = await res.json() as Record<string, unknown>;
  const usdFbr =
    typeof raw.usd_fbr === "number" ? raw.usd_fbr :
    typeof raw.data === "object" && raw.data != null && typeof (raw.data as Record<string, unknown>).usd_fbr === "number" ? (raw.data as Record<string, unknown>).usd_fbr :
    typeof raw.items === "object" && raw.items != null && typeof (raw.items as Record<string, unknown>).usd_fbr === "number" ? (raw.items as Record<string, unknown>).usd_fbr :
    Array.isArray(raw.data) && raw.data[0] && typeof (raw.data[0] as Record<string, unknown>).usd_fbr === "number" ? (raw.data[0] as Record<string, unknown>).usd_fbr :
    Array.isArray(raw.items) && raw.items[0] && typeof (raw.items[0] as Record<string, unknown>).usd_fbr === "number" ? (raw.items[0] as Record<string, unknown>).usd_fbr :
    undefined;

  if (typeof usdFbr !== "number" || Number.isNaN(usdFbr)) {
    throw new Error("Currency exchange rate response did not contain usd_fbr.");
  }

  return usdFbr;
}
/* ─────────────────────────── Network calls ──────────────────────── */
export async function getFinancialData(
  cfg: AppConfig
): Promise<{ table: PivotTableData; rawHeader: ApiHeader }> {
  const url = buildFinancialUrl(cfg);
  const token = await getBearerToken(cfg);
  //console.log("[getFinancialData] GET", url);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...authHeaders(cfg, token),
    },
  });
  //console.log("[getFinancialData] status:", res.status);
  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to load financial data (${res.status}).`);
    throw new Error(msg);
  }

  // Accept multiple response shapes:
  //   { data: [...] }                  — original ORDS array
  //   { items: [...] }                 — ORDS items array at root
  //   { data: { items: [...] } }       — nested items array
  //   { data: { items: { … } } }       — NEW: single-object items (not an array)
  const raw = await res.json() as Record<string, unknown>;
  //console.log("[getFinancialData] raw keys:", Object.keys(raw));

  const rawStatus = (raw.apiStatus || raw.api_status || "") as string;
  if (rawStatus && rawStatus !== "S" && rawStatus !== "SUCCESS") {
    const rawMsg = (raw.apiMessage || raw.api_message || "") as string;
    throw new Error(rawMsg || "Failed to load financial data.");
  }

  const rawData = raw.data as Record<string, unknown> | undefined;
  const nestedItems = rawData?.items;
  const dataArray: unknown[] =
    Array.isArray(raw.data)                                            ? raw.data as unknown[]     :
    Array.isArray(raw.items)                                           ? raw.items as unknown[]    :
    Array.isArray(nestedItems)                                         ? nestedItems as unknown[]  :
    nestedItems != null && typeof nestedItems === "object"             ? [nestedItems]             :
    [];

  const json: ApiResponse = { data: dataArray as ApiHeader[] };
  //console.log("[getFinancialData] data array length:", dataArray.length, dataArray[0]);

  const result = transformApiData(json);
  //console.log("[getFinancialData] transformApiData result:", result ? `${result.table.groups.length} groups, ${result.table.years.length} years` : "null → using createEmptyTable");

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
  //console.log(`[financial-api] → ${method}`, url, payload);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      ...authHeaders(cfg, token),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let json: SaveResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log(`[financial-api] ← ${method} response`, res.status, json || text);

  const apiMsg    = (json as any).apiMessage || json.api_message || text || res.statusText;
  const apiStatus = (json as any).apiStatus  || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Save failed (${res.status}).`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Save failed on server.");
  }
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
  const url     = buildFinancialPutUrl(cfg, rawHeader);
  const payload = buildPutPayload(data, rawHeader, cfg);
  const method: "POST" | "PUT" = rawHeader.fin_eval_header_id ? "PUT" : "POST";
  const response = await sendJson(method, cfg, url, payload);
  return { method, response };
}

/* ─────────────────────────── Server-driven sections ──────────────── */

/** section_type OR section_name tokens (uppercase, non-alphanumerics
    stripped) whose rows are fully driven by the engine response —
    the front-end must not recompute calculated rows or row totals
    for these sections. */
const FULL_DCF_SERVER_DRIVEN_TOKENS: ReadonlySet<string> = new Set([
  "CASHFLOW",
  "RETURNANALYSIS",
  "RETURNSANALYSIS",
  "RETURNONANALYSIS",
]);

const sectionToken = (s: string | undefined | null): string =>
  (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** True if this group's calculated rows are fully driven by an
    external calc engine (e.g. the Cash Flow section) rather than
    being recomputed client-side. */
export function isServerDrivenSection(group: { sectionType?: string; name?: string }): boolean {
  return (
    FULL_DCF_SERVER_DRIVEN_TOKENS.has(sectionToken(group.sectionType)) ||
    FULL_DCF_SERVER_DRIVEN_TOKENS.has(sectionToken(group.name))
  );
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
    line_identifier:     (value.lineIdentifier ?? "FINANCIAL").toUpperCase(),
    is_calculated:       value.isCalculated   ?? "N",
    account:             value.accountId      ?? null,
    display_order:       value.displayOrder   ?? lineIdx,
    year_values,
    status:              value.status       ?? "ACTIVE",
    language_code:       value.languageCode ?? "EN",
  };
}

async function postJson(cfg: AppConfig, path: string, body: object): Promise<MutationResponse> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}${path}`;

  console.log("[financial-api] → POST", url, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      ...authHeaders(cfg, token),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  let json: MutationResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log("[financial-api] ← POST response", res.status, json || text);

  const apiMsg    = (json as any).apiMessage || json.api_message || text || res.statusText;
  const apiStatus = (json as any).apiStatus  || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Insert failed (${res.status}).`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Insert failed on server.");
  }
  return json;
}

/** Insert a new section for this proposal. Returns server-assigned section id. */
export async function insertSection(
  cfg:   AppConfig,
  group: Group,
  displayOrder = 1,
): Promise<{ sectionId: number | null; raw: MutationResponse }> {
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
): Promise<{ lineId: number | null; raw: MutationResponse }> {
  const body = buildLineInsertBody(value, sectionId, years, columnLabels, cfg.app_user, displayOrder);
  const json = await postJson(cfg, `/Financial/line/${cfg.proposal_id}`, body);
  const lineId: number | null =
    json?.data?.[0]?.fin_eval_line_id ??
    json?.fin_eval_line_id ??
    null;
  return { lineId, raw: json };
}
