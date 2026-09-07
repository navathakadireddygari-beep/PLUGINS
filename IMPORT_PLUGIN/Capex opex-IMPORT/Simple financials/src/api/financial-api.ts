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
  templateLineId?:  number;
  sectionId?:       number;
  lineIdentifier?:  string;
  lineItemCode?:    string;
  isCalculated?:    string;
  isMandatory?:     string;
  isCustom?:        string;
  isReadOnly?:      string;
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
  templateSectionId?:  number;
  sectionType?:        string;
  isCustom?:           string;
  isReadOnly?:         string;
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
  line_type:                  string | null;
  line_item_name:             string;
  line_identifier:            string;
  is_calculated:              string;
  is_read_only?:              string;
  is_mandatory?:              string;
  is_custom?:                 string;
  account:                    string | null;
  display_order:              number;
  year_values:                Record<string, YearEntry>;
  status:                     string;
  language_code:              string;
  line_item_code?:            string | null;
  validation_status?:         string | null;
  error_message?:             string | null;
};

export type ApiSection = {
  fin_eval_section_id:   number | null;
  template_section_id?:  number | null;
  section_name:          string;
  section_type:          string;
  is_custom:             string;
  is_read_only?:         string;
  is_mandatory?:         string;
  is_new_line_required?: string;
  is_account_required?:  string;
  display_order:         number;
  status:                string;
  language_code:         string;
  lines:                 ApiLine[];
  validation_status?:    string | null;
  error_message?:        string | null;
};

export type HurdleCheck = {
  check_code?:   string;
  label?:        string;
  hurdle_value?: number | null;
  actual_value?: number | null;
  pass?:         boolean;
};

export type ApiHeader = {
  fin_eval_header_id:        number | null;
  proposal_id:               number | null;
  proposal_title:            string | null;
  proposal_code?:            string | null;
  local_currency:            string | null;
  display_currency:          string | null;
  exchange_rate:             number | null;
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
  total_contract_value_kpi:  number | null;
  annual_contract_cost:      number | null;
  number_of_years:           number | null;
  annual_contract_value:     number | null;
  contract_duration:         number | null;
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
  validation_status?:        string | null;
  error_code?:               string | null;
  error_message?:            string | null;
};

export type ApiResponse = { data: ApiHeader[] };

// Every validation issue carries exactly one navigable target — a header
// field, a section, or a specific line — never more than one, so the
// dispatcher below can branch on "which target is set" unambiguously.
export type ValidationIssue = {
  message:      string;
  headerField?: string;
  sectionId?:   number;
  lineId?:      string;
};

// Maps a header-level error_code to the header field it refers to. Small,
// hand-maintained table — extend as new FE_HDR_* codes are observed.
const ERROR_CODE_TO_HEADER_FIELD: Record<string, string> = {
  FE_HDR_AMORT:            "amortisation_period_years",
  FE_HDR_HURDLE:           "hurdle_rate_percent",
  FE_HDR_DISCOUNT:         "discount_rate_percent",
  FE_HDR_SHARE_REPURCHASE: "share_repurchase_percent",
  FE_HDR_DATE:             "date_placed_in_service",
  FE_HDR_CURRENCY:         "display_currency",
};

function mapErrorCodeToField(code?: string | null): string | undefined {
  return code ? ERROR_CODE_TO_HEADER_FIELD[code] : undefined;
}

// A single object's error_message can itself be a compound message —
// split on "|" so each piece becomes its own listed/navigable issue.
const splitMessage = (msg: string): string[] =>
  msg.split("|").map((m) => m.trim()).filter(Boolean);

// Walks header → sections → lines (in display order) collecting every
// failing validation_status entry, tagging each with its own object's
// identity (headerField / sectionId / lineId) so the UI can navigate to the
// exact place the error is coming from. This self-heals — a fixed line's
// error_message naturally comes back null on the next fetch. Different
// endpoints use different terminology for a failing status ("ERROR" vs
// "INVALID"), so both are treated as failing.
export function extractValidationErrors(header: ApiHeader): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const isFailing = (status?: string | null): boolean => {
    const s = (status || "").toUpperCase();
    return s === "ERROR" || s === "INVALID";
  };

  if (isFailing(header.validation_status) && header.error_message) {
    const headerField = mapErrorCodeToField(header.error_code);
    splitMessage(header.error_message).forEach((message) => {
      issues.push(headerField ? { message, headerField } : { message });
    });
  }

  const sections = [...(header.sections || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  for (const section of sections) {
    if (isFailing(section.validation_status) && section.error_message) {
      splitMessage(section.error_message).forEach((message) => {
        issues.push({ message, sectionId: section.fin_eval_section_id ?? undefined });
      });
    }
    const lines = [...(section.lines || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    for (const line of lines) {
      if (isFailing(line.validation_status) && line.error_message) {
        const lineKey = line.fin_eval_line_id ?? line.template_fin_eval_line_id;
        const lineId  = lineKey != null ? `val-${lineKey}` : undefined;
        splitMessage(line.error_message).forEach((message) => {
          issues.push(lineId ? { message, lineId } : { message, sectionId: section.fin_eval_section_id ?? undefined });
        });
      }
    }
  }
  return issues;
}

/* ─────────────────────────── URL helpers ────────────────────────── */
// GET  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X
export function buildFinancialUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=${cfg.file_id}`;
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
    proposal_id:               cfg.proposal_id ?? null,
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
    total_contract_value:      null,
    total_contract_value_kpi:  null,
    annual_contract_cost:      null,
    number_of_years:           null,
    annual_contract_value:     null,
    contract_duration:         null,
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
            templateLineId: line.template_fin_eval_line_id ?? undefined,
            sectionId:      line.fin_eval_section_id ?? undefined,
            lineIdentifier: (line.line_identifier ?? "FINANCIAL").toUpperCase(),
            lineItemCode:   line.line_item_code ?? undefined,
            isCalculated:   line.is_calculated    ?? "N",
            isMandatory:    line.is_mandatory     ?? "N",
            isCustom:       line.is_custom        ?? "Y",
            isReadOnly:     line.is_read_only     ?? "N",
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
        templateSectionId: section.template_section_id ?? undefined,
        sectionType:  section.section_type   ?? "CUSTOM",
        isCustom:           section.is_custom             ?? "N",
        isReadOnly:         section.is_read_only          ?? "N",
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
// Converts a value from local currency to USD for API storage.
// Always targets USD regardless of the display currency selected in the UI.
// exchange_rate is the USD→local rate (e.g. 1 USD = 1.35 CAD → rate=1.35).
export function computeFxMultiplier(header: ApiHeader): number {
  const local = (header.local_currency || "USD").toUpperCase();
  const rate  = header.exchange_rate || 0.7350;
  if (local === "USD") return 1;       // already USD — no conversion needed
  if (local === "CAD") return 1 / rate; // CAD → USD: divide by USD→CAD rate
  return 1 / rate;                      // generic fallback for other currencies
}

// Tax Rate % is a pure percentage — exempt from all currency and scale conversions.
const TAX_RATE_IDS = new Set(["TAXRATE", "TAXRATEPCT", "TAXRATEPERCENT"]);
export function isTaxRateId(id: string | undefined | null): boolean {
  return TAX_RATE_IDS.has((id || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

/* ─────────────────────────── Staging PUT payload builder ────────── */
// Builds the request body for the finEvaluationStaging PUT (Validate button) —
// mirrors the staging GET response shape (camelCase, *StgId ids).
export function buildStagingPutPayload(
  tableData: PivotTableData,
  rawHeader: ApiHeader,
): object {
  const toFyKey = (year: number): string =>
    (tableData.columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const sections = tableData.groups.map((group) => {
    const lines = group.values.map((value) => {
      const yearValues: Record<string, object> = {};
      tableData.years.forEach((y) => {
        const amt = value.yearValues[y] ? value.yearValues[y] : null;
        yearValues[toFyKey(y)] = {
          spc_projected_amount:  amt,
          ytd_budgeted_forecast: null,
          ytd_actuals:           null,
          variance:              null,
        };
      });
      const totalAmt = tableData.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
      yearValues["total"] = {
        spc_projected_amount:  totalAmt || null,
        ytd_budgeted_forecast: null,
        ytd_actuals:           null,
        variance:              null,
      };

      return {
        finEvalLineStgId: value.lineId ?? null,
        lineType:         value.lineType || "CUSTOM",
        lineItemName:     value.name,
        lineIdentifier:   value.lineIdentifier ?? "Financial",
        isCalculated:     value.isCalculated ?? "N",
        isMandatory:      value.isMandatory  ?? "N",
        isReadOnly:       value.isReadOnly   ?? "N",
        isCustom:         value.isCustom     ?? "Y",
        account:          value.accountId    ?? null,
        displayOrder:     value.displayOrder ?? 0,
        yearValues,
        targetGoLiveDate: null,
        status:           value.status       ?? "ACTIVE",
        languageCode:     value.languageCode ?? "EN",
        attribute1: null, attribute2: null, attribute3: null, attribute4: null, attribute5: null,
        attribute6: null, attribute7: null, attribute8: null, attribute9: null, attribute10: null,
      };
    });

    return {
      finEvalSectionStgId:       group.sectionId ?? null,
      parentFinEvalSectionStgId: null,
      sectionName:               group.name,
      sectionType:               group.sectionType ?? "CUSTOM",
      isCustom:                  group.isCustom ?? "Y",
      isMandatory:               group.isMandatory ?? "N",
      isReadOnly:                group.isReadOnly ?? "N",
      isAccountRequired:         group.isAccountRequired ?? "N",
      isNewLineRequired:         group.isNewLineRequired ?? "Y",
      isGoLiveReq:               "N",
      displayOrder:              group.displayOrder ?? 0,
      status:                    group.status ?? "ACTIVE",
      languageCode:              group.languageCode ?? "EN",
      attribute1: null, attribute2: null, attribute3: null, attribute4: null, attribute5: null,
      attribute6: null, attribute7: null, attribute8: null, attribute9: null, attribute10: null,
      lines,
    };
  });

  return {
    header: {
      finEvalHeaderStgId: rawHeader.fin_eval_header_id ?? null,
      localCurrency:      rawHeader.local_currency,
      displayCurrency:    rawHeader.display_currency,
      exchangeRate:       rawHeader.exchange_rate,
      taxRatePercent:     rawHeader.tax_rate_percent,
      displayYears:       rawHeader.display_years,
      kpiType:            rawHeader.kpi_type,
      investment:         rawHeader.investment,
      annualCost:         rawHeader.annual_contract_cost,
      status:             rawHeader.status ?? "ACTIVE",
      languageCode:       rawHeader.language_code ?? "EN",
      sections,
    },
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
let tokenPromise: Promise<string> | null = null;

async function getBearerToken(cfg: AppConfig): Promise<string> {
  if (cachedToken) return cachedToken;
  // Dedupe concurrent callers (e.g. StrictMode's double-invoked effects)
  // so only one auth request is ever in flight at a time.
  if (!tokenPromise) {
    tokenPromise = fetchAuthToken(cfg).then((resp) => {
      cachedToken = extractToken(resp);
      return cachedToken;
    }).finally(() => { tokenPromise = null; });
  }
  return tokenPromise;
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
/* ─────────────────────────── Staging wire adapter ───────────────── */
// The finEvaluationStaging GET response is a different wire shape entirely
// (camelCase, *StgId suffixes, data.header/data.file instead of data.items)
// from the ApiHeader/ApiSection/ApiLine types above, which the rest of this
// module (transformApiData, buildStagingPutPayload, KpiPanel, extractValidationErrors)
// is built around. This adapter translates the staging response into that
// existing shape so nothing downstream has to change.
function mapStagingLine(line: Record<string, any>): ApiLine {
  return {
    fin_eval_line_id:    line.finEvalLineStgId    ?? null,
    fin_eval_section_id: line.finEvalSectionStgId ?? null,
    line_type:           line.lineType       ?? null,
    line_item_name:      line.lineItemName   ?? "",
    line_identifier:     line.lineIdentifier ?? "FINANCIAL",
    is_calculated:       line.isCalculated ?? "N",
    is_read_only:        line.isReadOnly   ?? "N",
    is_mandatory:        line.isMandatory  ?? "N",
    is_custom:           line.isCustom     ?? "Y",
    account:             line.account      ?? null,
    display_order:       line.displayOrder ?? 0,
    year_values:         line.yearValues   ?? {},
    status:              line.status       ?? "ACTIVE",
    language_code:       line.languageCode ?? "EN",
    validation_status:   line.validationStatus ?? null,
    error_message:       line.errorMessage     ?? null,
  };
}

function mapStagingSection(section: Record<string, any>): ApiSection {
  return {
    fin_eval_section_id:  section.finEvalSectionStgId ?? null,
    section_name:         section.sectionName ?? "Section",
    section_type:         section.sectionType ?? "CUSTOM",
    is_custom:            section.isCustom            ?? "N",
    is_read_only:         section.isReadOnly          ?? "N",
    is_mandatory:         section.isMandatory         ?? "N",
    is_new_line_required: section.isNewLineRequired   ?? "Y",
    is_account_required:  section.isAccountRequired   ?? "N",
    display_order:        section.displayOrder ?? 0,
    status:               section.status       ?? "ACTIVE",
    language_code:        section.languageCode ?? "EN",
    lines:                (section.lines || []).map(mapStagingLine),
    validation_status:    section.validationStatus ?? null,
    error_message:        section.errorMessage     ?? null,
  };
}

function mapStagingHeader(
  header: Record<string, any>,
  file:   Record<string, any> | undefined,
  cfg:    AppConfig,
): ApiHeader {
  return {
    fin_eval_header_id:        header.finEvalHeaderStgId ?? null,
    proposal_id:               file?.proposalId ?? cfg.proposal_id ?? null,
    proposal_title:            file?.fileName   ?? null,
    proposal_code:             null,
    local_currency:            header.localCurrency   ?? null,
    display_currency:          header.displayCurrency ?? null,
    exchange_rate:             header.exchangeRate    ?? null,
    hurdle_rate_percent:       header.hurdleRatePercent       ?? 0,
    discount_rate_percent:     header.discountRatePercent     ?? 0,
    share_repurchase_percent:  header.shareRepurchasePercent  ?? 0,
    amortisation_period_years: header.amortisationPeriodYears ?? 0,
    date_placed_in_service:    header.datePlacedInService ?? "",
    tax_rate_percent:          header.taxRatePercent ?? 0,
    display_years:             header.displayYears   ?? 0,
    kpi_type:                  header.kpiType ?? "",
    npv:                       header.npv          ?? null,
    irr_percent:               header.irrPercent   ?? null,
    payback_period_years:      header.paybackPeriodYears ?? null,
    total_cash_inflow:         header.totalCashInflow  ?? null,
    total_cash_outflow:        header.totalCashOutflow ?? null,
    gross_profit:              header.grossProfit        ?? null,
    gross_margin_percent:      header.grossMarginPercent ?? null,
    total_contract_value:      header.totalContractValue ?? null,
    total_contract_value_kpi:  null,
    annual_contract_cost:      header.annualCost         ?? null,
    number_of_years:           header.numberOfYears      ?? null,
    annual_contract_value:     header.annualContractValue ?? null,
    contract_duration:         header.numberOfYears      ?? null,
    total_lease_value:         header.totalLeaseValue    ?? null,
    lease_terms_years:         header.leaseTermsYears    ?? null,
    investment:                header.investment ?? header.totalCapexInvestment ?? null,
    performance_metrics:       header.performanceMetrics ?? null,
    region_id:                 null,
    entity_id:                 null,
    business_unit_id:          null,
    status:                    header.status       ?? "ACTIVE",
    language_code:             header.languageCode ?? "EN",
    sections:                  (header.sections || []).map(mapStagingSection),
    validation_status:         header.validationStatus ?? null,
    error_code:                header.errorCode        ?? null,
    error_message:             header.errorMessage     ?? null,
  };
}

export async function getFinancialData(
  cfg: AppConfig
): Promise<{ table: PivotTableData; rawHeader: ApiHeader; validationErrors: ValidationIssue[] }> {
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

  // Response format: { apiStatus, apiMessage, data: { file: {...}, header: {...} } }
  const raw = await res.json() as Record<string, unknown>;

  // API may return HTTP 200 with apiStatus "E" for business-logic errors
  const rawStatus = (raw.apiStatus || raw.api_status || "") as string;
  if (rawStatus && rawStatus !== "S" && rawStatus !== "SUCCESS") {
    const rawMsg = (raw.apiMessage || raw.api_message || "") as string;
    throw new Error(rawMsg || "Failed to load financial data.");
  }

  const dataObj      = raw.data as Record<string, unknown> | undefined;
  const stagedHeader = dataObj?.header as Record<string, any> | undefined;
  const stagedFile   = dataObj?.file   as Record<string, any> | undefined;

  const header: ApiHeader | null = stagedHeader ? mapStagingHeader(stagedHeader, stagedFile, cfg) : null;
  const json: ApiResponse = { data: header ? [header] : [] };
  console.log("[getFinancialData] staged header present:", Boolean(stagedHeader), "sections:", header?.sections.length ?? 0);

  const result = transformApiData(json);
  console.log("[getFinancialData] transformApiData result:", result ? `${result.table.groups.length} groups, ${result.table.years.length} years` : "null → using createEmptyTable");

  if (!result) return { table: createEmptyTable(), rawHeader: createEmptyHeader(cfg), validationErrors: [] };

  let validationErrors = extractValidationErrors(result.rawHeader);
  if (!validationErrors.length && typeof raw.errorMessages === "string" && raw.errorMessages.trim()) {
    // Fallback for messages that don't belong to any header/section/line object
    // at all (e.g. "an entire section is missing from the upload") — the
    // structured walk above is empty, so nothing more precise is available.
    validationErrors = raw.errorMessages.split("\n").filter(Boolean).map((message) => ({ message }));
  }
  console.log("[getFinancialData] validationErrors:", validationErrors.length);

  return { ...result, validationErrors };
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
 * Validate the proposal.
 *
 * PUT {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
 * Sends the staging payload shape (buildStagingPutPayload) — camelCase,
 * *StgId-keyed sections/lines — matching what this endpoint expects.
 */
export function buildFinancialImportUrl(cfg: AppConfig, fileId: number | null): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/${fileId}`;
}

export async function validateFinancialData(
  cfg: AppConfig,
  data: PivotTableData,
  rawHeader: ApiHeader
): Promise<SaveResponse> {
  const url     = buildFinancialImportUrl(cfg, cfg.file_id);
  const payload = buildStagingPutPayload(data, rawHeader);
  return sendJson("PUT", cfg, url, payload);
}

/**
 * Migrate the proposal's staged data (Save Model action).
 *
 * POST {api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/{file_id}
 * No request body — headers only.
 */
export function buildFinEvalStagingMigrateUrl(cfg: AppConfig, fileId: number | null): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/${fileId}`;
}

export async function migrateFinEvalStaging(cfg: AppConfig, fileId: number | null): Promise<SaveResponse> {
  const token = await getBearerToken(cfg);
  const url   = buildFinEvalStagingMigrateUrl(cfg, fileId);

  console.log("[finEvalStagingMigrate] POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept:        "application/json",
      Authorization: `Bearer ${token}`,
      user_email:    cfg.app_user,
      role:          cfg.app_roles,
    },
  });

  const text = await res.text().catch(() => "");
  let json: SaveResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

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
// Payload builders for a single section / single line, using the same
// snake_case field naming as the older financialEvaluation PUT/POST schema.

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

/* ─────────────────────────── Currency exchange rate ──────────────── */
// POST {api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates
// Body: { year_period: "YYYYMM", currency: "GBP" }
export async function getCurrencyExchangeRate(
  cfg:        AppConfig,
  yearPeriod: string,
  currency:   string,
): Promise<number> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates`;
  const body  = { year_period: yearPeriod, currency };

  console.log("[currency-exchange-rate] POST", url, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to fetch exchange rate (${res.status}).`);
    throw new Error(msg);
  }

  const raw = await res.json() as { data?: { usd_fbr?: number | null } };
  const rate = Number(raw.data?.usd_fbr ?? 0);

  console.log("[currency-exchange-rate] usd_fbr:", rate);
  return rate || 0.7350;
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
