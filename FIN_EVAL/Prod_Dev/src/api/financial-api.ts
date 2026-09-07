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
  isMandatory?:     string;
  isCustom?:        string;
  isLineReadOnly?:  string;
  displayOrder?:    number;
  status?:          string;
  languageCode?:    string;
};

export type Group = {
  id:                  string;
  name:                string;
  expanded:            boolean;
  values:              ValueRow[];
  sectionId?:          number;
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
  is_mandatory?:              string;
  is_custom?:                 string;
  is_read_only?:              string;
  account:                    string | null;
  display_order:              number;
  year_values:                Record<string, YearEntry>;
  status:                     string;
  language_code:              string;
};

export type ApiSection = {
  fin_eval_section_id:   number | null;
  template_section_id?:  number | null;
  section_name:          string;
  section_type:          string;
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
  amortization_period: number;
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
  performance_metrics:       { hurdle_checks?: HurdleCheck[] } | null;
  region_id:                 number | null;
  entity_id:                 number | null;
  business_unit_id:          number | null;
  status:                    string;
  language_code:             string;
  sections:                  ApiSection[];
};

export type ApiResponse = { data: ApiHeader[] };

// Statuses where the proposal is locked for edits regardless of user role;
// anything else (DRAFT, REJECTED, NEEDS_REAPPROVAL, unknown/missing) stays editable.
const READONLY_PROPOSAL_STATUSES: ReadonlySet<string> = new Set([
  "SUBMITTED", "IN_PROGRESS", "APPROVED", "CLOSED",
]);
export const isProposalStatusReadonly = (status: string | null | undefined): boolean =>
  !!status && READONLY_PROPOSAL_STATUSES.has(status.toUpperCase());

/* ─────────────────────────── URL helpers ────────────────────────── */
// GET  →  {api_endpoint}/GIS/proposalAuthoring/financialEvaluation?proposal_id=X
//         {api_endpoint}/GIS/proposalAuthoring/financialEvaluation?spc_type_id=X&template_type_id=Y
// PUT  →  {api_endpoint}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation
export function buildFinancialUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const base = `${cfg.api_endpoint}/GIS/proposalAuthoring/financialEvaluation`;
  if (cfg.proposal_id != null) {
    return `${base}?proposal_id=${cfg.proposal_id}`;
  }
  if (cfg.spc_type_id != null) {
    // New-proposal case: template_type_id, when set, scopes which template to load.
    const templateParam = cfg.template_type_id != null ? `&template_type_id=${cfg.template_type_id}` : "";
    return `${base}?spc_type_id=${cfg.spc_type_id}${templateParam}`;
  }
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
    amortization_period: 0,
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

  // API always returns values in USD regardless of local_currency.
  // Store raw USD values in state — Table.tsx fxMultiplier handles display conversion.

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
            accountId:      line.account         ?? undefined,
            lineType:       line.line_type        ?? "",
            lineId:         line.fin_eval_line_id ?? undefined,
            sectionId:      line.fin_eval_section_id ?? undefined,
            lineIdentifier: (line.line_identifier ?? "FINANCIAL").toUpperCase(),
            isCalculated:   line.is_calculated    ?? "N",
            isMandatory:    line.is_mandatory     ?? "N",
            isCustom:       line.is_custom        ?? "Y",
            isLineReadOnly: line.is_read_only     ?? "N",
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
        sectionId:    section.fin_eval_section_id ?? undefined,
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

/* ─────────────────────────── FX helper ──────────────────────────── */
// All stored financial values are in USD. `usdFbr` is the live-fetched rate
// meaning "1 USD = usdFbr <local currency>". The display multiplier converts
// a stored USD value to the currently selected display currency:
//   display === USD              → ×1 (no conversion)
//   display === local (non-USD)  → × usdFbr
// When the rate hasn't loaded yet (or failed), fall back to ×1 rather than
// guessing a number.
export function computeDisplayMultiplier(
  display: string,
  local: string,
  usdFbr: number | null | undefined,
): number {
  const displayCode = (display || "USD").toUpperCase();
  const localCode    = (local   || "USD").toUpperCase();
  if (displayCode === "USD") return 1;
  if (displayCode === localCode && usdFbr != null && Number.isFinite(usdFbr) && usdFbr > 0) {
    return usdFbr;
  }
  return 1;
}

// Tax Rate % is a pure percentage — exempt from all currency and scale conversions.
const TAX_RATE_IDS = new Set(["TAXRATE", "TAXRATEPCT", "TAXRATEPERCENT"]);
export function isTaxRateId(id: string | undefined | null): boolean {
  return TAX_RATE_IDS.has((id || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

/* ─────────────────────────── PUT payload builder ────────────────── */
export function buildPutPayload(
  tableData: PivotTableData,
  rawHeader: ApiHeader,
  appUser: string
): object {
  const toFyKey = (year: number): string =>
    (tableData.columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  // State values are always in USD — send as-is, no fx conversion needed.

  const sections = tableData.groups.map((group, grpIdx) => {
    const lines = group.values.map((value, lineIdx) => {
      const year_values: Record<string, object> = {};
      tableData.years.forEach((y) => {
        const amt = value.yearValues[y] ? value.yearValues[y] : null;
        year_values[toFyKey(y)] = { spc_projected_amount: amt, actual: null };
      });
      const totalAmt = tableData.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
      year_values["total"] = { spc_projected_amount: totalAmt || null, actual: null };

      return {
        fin_eval_line_id:    value.lineId    ?? null,
        fin_eval_section_id: value.sectionId ?? group.sectionId ?? null,
        line_type:           value.lineType  || "CUSTOM",
        line_item_name:      value.name,
        line_identifier:     (value.lineIdentifier ?? "FINANCIAL").toUpperCase(),
        is_calculated:       value.isCalculated   ?? "N",
        is_custom:           value.isCustom       ?? "Y",
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
    fin_eval_header_id:        rawHeader.fin_eval_header_id || null,
    user_email:                appUser,
    display_currency:          rawHeader.display_currency,
    hurdle_rate_percent:       rawHeader.hurdle_rate_percent,
    discount_rate_percent:     rawHeader.discount_rate_percent,
    share_repurchase_percent:  rawHeader.share_repurchase_percent,
    amortization_period: rawHeader.amortization_period,
    date_placed_in_service:    rawHeader.date_placed_in_service,
    performance_metrics:       rawHeader.performance_metrics,
    sections,
  };
}

/* ─────────────────────────── Error helper ───────────────────────── */
// Parses the response body (JSON or text) and extracts the most meaningful
// error message. Handles both camelCase (apiMessage) and snake_case (api_message).
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

// Fetches the account category codes for a section. The selected section's
// code (its section_type, e.g. "PL_INVESTMENT_OPEX") is passed as the
// `account_category_type` query parameter.
//   GET {api_endpoint}/GIS/proposalAuthoring/finEvaluation/accountCategoryCodes
//        ?account_category_type=<sectionCode>
// Response: { data: [ { account_code, account_name, ... }, … ] }
export async function getAccountCodes(cfg: AppConfig, sectionCode: string): Promise<AccountCode[]> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluation/accountCategoryCodes?account_category_type=${encodeURIComponent(sectionCode)}`;

  console.log("[account-codes] section code:", sectionCode, "→ GET", url);

  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const json = await res.json();

  const rows: Record<string, unknown>[] =
    Array.isArray(json)        ? json        :
    Array.isArray(json.data)   ? json.data   :
    Array.isArray(json.items)  ? json.items  :
    Array.isArray(json.rows)   ? json.rows   : [];

  const codes = rows
    .map((r) => ({
      account_code: r.account_code != null ? String(r.account_code) : "",
      account_name: r.account_name != null ? String(r.account_name) : "",
    }))
    .filter((ac) => ac.account_code !== "");

  console.log(`[account-codes] ${sectionCode}: ${codes.length} codes`, codes);
  return codes;
}

/* ─────────────────────────── Network calls ──────────────────────── */
export async function getFinancialData(
  cfg: AppConfig
): Promise<{ table: PivotTableData; rawHeader: ApiHeader }> {
  const url = buildFinancialUrl(cfg);
  const token = await getBearerToken(cfg);
  console.log("[getFinancialData] GET", url);
  const res = await fetch(url, {
    headers: {
      Accept:        "application/json",
      Authorization: `Bearer ${token}`,
      user_email:    cfg.app_user,
      role:          cfg.app_roles,
    },
  });
  console.log("[getFinancialData] status:", res.status);
  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to load financial data (${res.status}).`);
    throw new Error(msg);
  }

  // Response format: { apiStatus, apiMessage, data: { items: ApiHeader } }
  const raw = await res.json() as Record<string, unknown>;

  // API may return HTTP 200 with apiStatus "E" for business-logic errors
  const rawStatus = (raw.apiStatus || raw.api_status || "") as string;
  if (rawStatus && rawStatus !== "S" && rawStatus !== "SUCCESS") {
    const rawMsg = (raw.apiMessage || raw.api_message || "") as string;
    throw new Error(rawMsg || "Failed to load financial data.");
  }

  const items = (raw.data as Record<string, unknown> | null)?.items;
  const dataArray: unknown[] = items != null ? [items] : [];

  const json: ApiResponse = { data: dataArray as ApiHeader[] };
  console.log("[getFinancialData] data array length:", dataArray.length, dataArray[0]);

  const result = transformApiData(json);
  console.log("[getFinancialData] transformApiData result:", result ? `${result.table.groups.length} groups, ${result.table.years.length} years` : "null → using createEmptyTable");

  if (!result) return { table: createEmptyTable(), rawHeader: createEmptyHeader(cfg) };
  return result;
}

/**
 * Fetch the live USD→local exchange rate for the given local currency.
 *
 *   POST {api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates
 *   Body: { year_period: "YYYYMM", currency: "<local currency code>" }
 *   Response: { apiStatus, apiMessage, data: { usd_fbr, ... } }
 *
 * `usd_fbr` means "1 USD = usd_fbr <currency>" (e.g. usd_fbr: 84.57 for INR
 * means 1 USD = 84.57 INR). Callers should treat a thrown error / missing
 * rate as "no live rate available" and fall back to a ×1 multiplier.
 */
export async function getCurrencyExchangeRate(cfg: AppConfig, currency: string): Promise<number> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates`;
  const now   = new Date();
  const year_period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  console.log("[getCurrencyExchangeRate] POST", url, { year_period, currency });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify({ year_period, currency: currency.toUpperCase() }),
  });

  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to fetch exchange rate (${res.status}).`);
    throw new Error(msg);
  }

  const raw = await res.json() as Record<string, unknown>;
  const apiStatus = (raw.apiStatus || raw.api_status || "") as string;
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    const apiMsg = (raw.apiMessage || raw.api_message || "") as string;
    throw new Error(apiMsg || "Failed to fetch exchange rate.");
  }

  const data = raw.data as Record<string, unknown> | undefined;
  const rate = data?.usd_fbr;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Exchange rate unavailable.");
  }
  return rate;
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
  console.log(`[financial-api] → ${method}`, url);
  console.log(`[financial-api] → ${method} body:`, JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let json: SaveResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log(`[financial-api] ← ${method} response`, res.status, json || text);

  const apiMsg = (json as any).apiMessage || json.api_message || text || res.statusText;
  const apiStatus = (json as any).apiStatus || json.api_status || "";

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
 * The front-end ALWAYS uses PUT — the initial POST (creating the header)
 * is handled inside APEX, so by the time this widget saves, the header
 * already exists. The full table (all sections + all lines) is sent in
 * the body via buildPutPayload.
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
  const payload = buildPutPayload(data, rawHeader, cfg.app_user);
  const response = await sendJson("PUT", cfg, url, payload);
  return { method: "PUT", response };
}

/* ─────────────────────────── Server-driven sections ─────────────── */
/** section_type OR section_name tokens (uppercase, non-alphanumerics
    stripped) whose calculated rows are owned by the backend — the
    front-end must not recompute calculated rows or row totals for them. */
const SERVER_DRIVEN_TOKENS: ReadonlySet<string> = new Set([
  "CASHFLOW",
  "RETURNANALYSIS",
  "RETURNSANALYSIS",
  "RETURNONANALYSIS",
]);

const sectionToken = (s: string | undefined | null): string =>
  (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** True if this group's calculated rows are owned by the backend
    (Cash Flow, Return Analysis) and must not be locally recomputed. */
export function isServerDrivenSection(group: { sectionType?: string; name?: string }): boolean {
  return (
    SERVER_DRIVEN_TOKENS.has(sectionToken(group.sectionType)) ||
    SERVER_DRIVEN_TOKENS.has(sectionToken(group.name))
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
  fx = 1,
): object {
  const toFyKey = (year: number): string =>
    (columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const year_values: Record<string, object> = {};
  years.forEach((y) => {
    year_values[toFyKey(y)] = {
      spc_projected_amount: value.yearValues[y] ? value.yearValues[y] * fx : null,
      actual:               null,
    };
  });
  const totalAmt = years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
  year_values["total"] = {
    spc_projected_amount: totalAmt ? totalAmt * fx : null,
    actual:               null,
  };

  return {
    user_email:          appUser,
    fin_eval_line_id:    value.lineId    ?? null,
    fin_eval_section_id: sectionId       ?? value.sectionId ?? null,
    line_type:           value.lineType  || "CUSTOM",
    line_item_name:      value.name,
    line_identifier:     value.lineIdentifier ?? "Financial",
    is_calculated:       value.isCalculated   ?? "N",
    is_custom:           value.isCustom       ?? "Y",
    account:             value.accountId      ?? null,
    display_order:       value.displayOrder   ?? lineIdx,
    year_values,
    status:              value.status       ?? "ACTIVE",
    language_code:       value.languageCode ?? "EN",
  };
}

async function postJson(cfg: AppConfig, path: string, body: object): Promise<any> {
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
  let json: { apiStatus?: string; api_status?: string; apiMessage?: string; api_message?: string; [k: string]: unknown } = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  //console.log("[financial-api] ← POST response", res.status, json || text);

  const apiMsg    = json.apiMessage || json.api_message || text || res.statusText;
  const apiStatus = json.apiStatus  || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Request failed (${res.status}).`);
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
): Promise<{ sectionId: number | null; raw: any }> {
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
): Promise<{ lineId: number | null; raw: any }> {
  // State values are always in USD — send as-is (fx=1, no conversion needed).
  const body = buildLineInsertBody(value, sectionId, years, columnLabels, cfg.app_user, displayOrder, 1);
  const json = await postJson(cfg, `/Financial/line/${cfg.proposal_id}`, body);
  const lineId: number | null =
    json?.data?.[0]?.fin_eval_line_id ??
    json?.fin_eval_line_id ??
    null;
  return { lineId, raw: json };
}
