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
  displayOrder?:    number;
  status?:          string;
  languageCode?:    string;
  // True when the API sent no lineItemName for this row. Fixed at load time
  // (not re-derived from the live name) so a template line the user is
  // actively typing a missing name into doesn't re-lock itself after the
  // first keystroke — it only reverts to a locked template label on the
  // next fetch, once the name is actually saved.
  nameWasMissing?:  boolean;
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
  local_currency:            string;
  display_currency:          string;
  exchange_rate:             number;
  // number when valid; raw string passed through as-is when the API
  // returned something non-numeric, so the UI shows exactly what's wrong
  // (e.g. "two") instead of silently defaulting to 0.
  hurdle_rate_percent:       number | string;
  discount_rate_percent:     number | string;
  share_repurchase_percent:  number | string;
  amortizationPeriod:      number | string;
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

/* ─────────────────────────── Staging wire types ─────────────────── */
// finEvaluationStaging returns a different (camelCase) envelope than the
// financialEvaluation/import GET above — validation runs before migrate,
// so every section/line/file carries its own validationStatus/errorMessage.
export type StagingLine = {
  finEvalLineStgId:     number;
  finEvalSectionStgId:  number;
  lineType:             string;
  lineItemName:         string | null;
  lineIdentifier:       string;
  isCalculated:         string;
  isMandatory?:         string;
  isReadOnly?:          string;
  isCustom?:            string;
  account:              string | null;
  displayOrder:         number;
  yearValues:           Record<string, YearEntry>;
  targetGoLiveDate?:    string | null;
  validationStatus?:    string;
  errorCode?:           string | null;
  errorMessage?:        string | null;
};

export type StagingSection = {
  finEvalSectionStgId:        number;
  parentFinEvalSectionStgId?: number | null;
  sectionName:                string;
  sectionType:                string;
  isCustom:                   string;
  isMandatory?:               string;
  isReadOnly?:                string;
  isAccountRequired?:         string;
  isNewLineRequired?:         string;
  isGoLiveReq?:               string;
  displayOrder:               number;
  validationStatus?:          string;
  errorCode?:                 string | null;
  errorMessage?:              string | null;
  lines:                      StagingLine[];
};

export type StagingHeader = {
  finEvalHeaderStgId:      number;
  displayCurrency:         string;
  hurdleRatePercent:       string | number;
  discountRatePercent:     string | number;
  shareRepurchasePercent:  string | number;
  amortisationPeriodYears: string | number;
  amortizationPeriod:      string | number | null;
  datePlacedInService:     string | null;
  npv:                     string | number | null;
  irrPercent:              string | null;
  paybackPeriodYears:      string | number | null;
  performanceMetrics:      { hurdle_checks?: HurdleCheck[] } | null;
  validationStatus?:       string;
  errorCode?:              string | null;
  errorMessage?:           string | null;
  sections:                StagingSection[];
};

export type StagingFile = {
  fileId:      number;
  proposalId:  number;
  fileName:    string;
  errorMessage?: string | null;
};

export type StagingApiResponse = {
  apiStatus?:  string;
  apiMessage?: string;
  data?: {
    file?:        StagingFile;
    header?:      StagingHeader;
    orphanLines?: StagingLine[];
  };
};

/* ─────────────────────────── URL helpers ────────────────────────── */
// PUT  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
// file_id is mandatory (ORDS binds it from the URI Template — confirmed via
// the ORDS "Resource Handler" config's "Full URL" field). NOT sending
// ?proposal_id= here: the ORDS Parameters grid lists proposal_id with
// Source Type "URI" even though it has no matching {proposal_id} placeholder
// in this handler's actual template. That mismatch is suspected of causing
// "Invalid value provided for parameter file_id" on the PUT (untested as of
// this comment — if dropping the query param doesn't fix it, this isn't the
// cause and needs further digging). The PL/SQL's :proposal_id bind is
// presumably left NULL server-side without it.
export function buildFinEvaluationStagingPutUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  if (cfg.file_id == null) throw new Error("Cannot validate: no file_id available.");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/${cfg.file_id}`;
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
    local_currency:            "",
    display_currency:          "",
    exchange_rate:             0,
    hurdle_rate_percent:       0,
    discount_rate_percent:     0,
    share_repurchase_percent:  0,
    amortizationPeriod:      0,
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

/* ─────────────────────────── PUT payload builder ────────────────── */
// Builds the body for the finEvaluationStaging PUT (Validate button).
// user_email travels via the request header, not the body, per the sample.
// Field-inclusion assumptions (flagged for confirmation against the real
// API): every section/line sends its full known field set regardless of
// whether its *StgId is null (new) or set (existing) — the sample curl only
// showed a trimmed subset per case, and sending extra fields is normally
// harmless, whereas omitting an edited field would silently drop it.
export function buildFinEvaluationStagingPutPayload(
  tableData: PivotTableData,
  rawHeader: ApiHeader,
): object {
  const toFyKey = (year: number): string =>
    (tableData.columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const sections = tableData.groups.map((group, grpIdx) => {
    const lines = group.values.map((value, lineIdx) => {
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
        lineIdentifier:   (value.lineIdentifier ?? "FINANCIAL").toUpperCase(),
        isCalculated:     value.isCalculated ?? "N",
        isCustom:         value.isCustom     ?? "Y",
        account:          value.accountId    ?? null,
        displayOrder:     value.displayOrder ?? lineIdx + 1,
        targetGoLiveDate: null,
        yearValues,
      };
    });

    return {
      finEvalSectionStgId: group.sectionId    ?? null,
      sectionName:         group.name,
      sectionType:         group.sectionType  ?? "CUSTOM",
      isCustom:            group.isCustom     ?? "Y",
      displayOrder:        group.displayOrder ?? grpIdx + 1,
      status:              group.status       ?? "ACTIVE",
      lines,
    };
  });

  return {
    header: {
      finEvalHeaderStgId:      rawHeader.fin_eval_header_id || null,
      displayCurrency:         rawHeader.display_currency,
      hurdleRatePercent:       rawHeader.hurdle_rate_percent,
      discountRatePercent:     rawHeader.discount_rate_percent,
      shareRepurchasePercent:  rawHeader.share_repurchase_percent,
      amortizationPeriod:      rawHeader.amortizationPeriod,
      datePlacedInService:     rawHeader.date_placed_in_service,
      performanceMetrics:      rawHeader.performance_metrics,
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
// In-flight request, shared across concurrent callers (e.g. React StrictMode's
// double-invoked effects in dev) so only one auth call is made at a time.
let tokenPromise: Promise<string> | null = null;

export async function getBearerToken(cfg: AppConfig): Promise<string> {
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = (async () => {
    try {
      const resp = await fetchAuthToken(cfg);
      cachedToken = extractToken(resp);
      return cachedToken;
    } finally {
      tokenPromise = null;
    }
  })();
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

/* ─────────────────────────── Staging GET ────────────────────────── */
// GET  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X
export function buildFinEvaluationStagingUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  if (cfg.file_id == null) throw new Error("Missing file_id in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=${cfg.file_id}`;
}

/**
 * Fetches the staged (not-yet-migrated) financial evaluation for this proposal.
 * Response envelope: { apiStatus, apiMessage, data: { items: ApiHeader } } —
 * same shape as the PUT save/validate response, since staging feeds the
 * migrateFinEvalStaging flow.
 */
// Converts the finEvaluationStaging envelope (data.header/data.file, camelCase
// fields) into the same { table, rawHeader } shape the UI and PUT payload
// builder expect. rawHeader is a best-effort ApiHeader — fields the staging
// response doesn't carry (kpi_type, region_id, ...) are defaulted to null
// since nothing in the UI reads them for this widget.
// Passes a header numeric field through as a number when it parses cleanly;
// otherwise keeps the raw value verbatim (e.g. "two") so the UI displays
// exactly what the API sent instead of masking it behind a silent 0.
function numOrRaw(v: string | number | null | undefined): number | string {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

function transformStagingData(
  raw: StagingApiResponse,
  cfg: AppConfig,
): { table: PivotTableData; rawHeader: ApiHeader } | null {
  const header = raw.data?.header;
  if (!header) return null;

  const sections = header.sections || [];

  let yearKeys: string[] = [];
  for (const sec of sections) {
    const firstLine = sec.lines?.[0];
    if (firstLine?.yearValues) {
      yearKeys = Object.keys(firstLine.yearValues).filter((k) => k !== "total").sort();
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
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((section): Group => {
      const values: ValueRow[] = [...(section.lines || [])]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((line): ValueRow => {
          const yearValues: YearValues = {};
          yearKeys.forEach((key, i) => {
            const amt = line.yearValues?.[key]?.spc_projected_amount;
            const num = amt != null ? Number(amt) : 0;
            yearValues[years[i]] = Number.isFinite(num) ? num : 0;
          });
          const totalEntry = line.yearValues?.["total"]?.spc_projected_amount;
          const totalNum   = totalEntry != null ? Number(totalEntry) : undefined;
          return {
            id:             `val-${line.finEvalLineStgId ?? Math.random()}`,
            // Left blank (not defaulted to placeholder-looking text) when the
            // API sends null — the input's "Enter line item name" placeholder
            // then makes clear to the user that it's genuinely missing.
            name:           line.lineItemName ?? "",
            yearValues,
            rowTotal:       Number.isFinite(totalNum) ? totalNum : undefined,
            accountId:      line.account          ?? undefined,
            lineType:       line.lineType         ?? "",
            lineId:         line.finEvalLineStgId ?? undefined,
            sectionId:      line.finEvalSectionStgId ?? undefined,
            lineIdentifier: (line.lineIdentifier ?? "FINANCIAL").toUpperCase(),
            isCalculated:   line.isCalculated ?? "N",
            isMandatory:    line.isMandatory  ?? "N",
            isCustom:       line.isCustom     ?? "Y",
            displayOrder:   line.displayOrder,
            status:         "ACTIVE",
            languageCode:   "EN",
            nameWasMissing: !line.lineItemName,
          };
        });

      return {
        id:                 `grp-${section.finEvalSectionStgId ?? Math.random()}`,
        name:               section.sectionName ?? "Section",
        expanded:           true,
        values,
        sectionId:          section.finEvalSectionStgId ?? undefined,
        sectionType:        section.sectionType ?? "CUSTOM",
        isCustom:           section.isCustom          ?? "N",
        isMandatory:        section.isMandatory       ?? "N",
        isNewLineRequired:  section.isNewLineRequired ?? "Y",
        isAccountRequired:  section.isAccountRequired ?? "N",
        displayOrder:       section.displayOrder,
        status:             "ACTIVE",
        languageCode:       "EN",
      };
    });

  const proposalTitle = raw.data?.file?.fileName ?? "Untitled Proposal";
  const currency       = header.displayCurrency ?? "USD";

  const rawHeader: ApiHeader = {
    fin_eval_header_id:        header.finEvalHeaderStgId ?? 0,
    proposal_id:                cfg.proposal_id ?? raw.data?.file?.proposalId ?? 0,
    proposal_title:             proposalTitle,
    local_currency:             currency,
    display_currency:           currency,
    exchange_rate:              1,
    hurdle_rate_percent:        numOrRaw(header.hurdleRatePercent),
    discount_rate_percent:      numOrRaw(header.discountRatePercent),
    share_repurchase_percent:   numOrRaw(header.shareRepurchasePercent),
    amortizationPeriod:       numOrRaw(header.amortizationPeriod ?? header.amortisationPeriodYears),
    date_placed_in_service:     header.datePlacedInService ?? "",
    tax_rate_percent:           0,
    display_years:              years.length || 6,
    kpi_type:                   "",
    npv:                        header.npv != null ? Number(header.npv) : null,
    irr_percent:                header.irrPercent ?? null,
    payback_period_years:       header.paybackPeriodYears != null ? Number(header.paybackPeriodYears) : null,
    total_cash_inflow:          null,
    total_cash_outflow:         null,
    gross_profit:               null,
    gross_margin_percent:       null,
    total_contract_value_kpi:   null,
    number_of_years:            null,
    annual_contract_value:      null,
    total_lease_value:          null,
    lease_terms_years:          null,
    investment:                 null,
    performance_metrics:        header.performanceMetrics ?? null,
    region_id:                  null,
    entity_id:                  null,
    business_unit_id:           null,
    status:                     "ACTIVE",
    language_code:              "EN",
    sections:                   [],
  };

  return {
    table: { headerName: proposalTitle, years, columnLabels, groups },
    rawHeader,
  };
}

// A validation error message plus (when we can identify it) the specific
// header field / section / line it belongs to, so the UI can navigate
// straight to the actual offending control instead of guessing by position.
export type ValidationIssue = {
  message:      string;
  headerField?: keyof ApiHeader;
  sectionId?:   number;
  lineId?:      string; // matches ValueRow.id ("val-{finEvalLineStgId}")
};

// Only FE_HDR_HURDLE has been observed in a real response so far — extend
// this map as other header-level error codes turn up.
const HEADER_ERROR_FIELD_MAP: Partial<Record<string, keyof ApiHeader>> = {
  FE_HDR_HURDLE: "hurdle_rate_percent",
};

// Walks header → sections → lines and emits one entry per "|"-separated
// piece of EACH object's own errorMessage (a section/line's errorMessage can
// itself be compound, e.g. "FY29 appears twice. | FY101 isn't FY00 format."),
// tagged with that object's own target. Built directly from the structured
// data — never from string-matching against the concatenated file message —
// so two lines with the identical generic text ("A line is missing its item
// name.") each get their own correct entry instead of colliding. This is also
// what makes the list self-healing: once a line/section/header is fixed and
// revalidated, its own errorMessage comes back null and it simply stops
// contributing an entry — no separate "clear this error" step needed.
function collectStructuredIssues(header: StagingHeader): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const pushAll = (raw: string | null | undefined, target: Pick<ValidationIssue, "headerField" | "sectionId" | "lineId">) => {
    if (!raw) return;
    raw.split("|").map((s) => s.trim()).filter(Boolean).forEach((message) => out.push({ message, ...target }));
  };

  const field = HEADER_ERROR_FIELD_MAP[header.errorCode ?? ""];
  pushAll(header.errorMessage, field ? { headerField: field } : {});

  for (const sec of header.sections || []) {
    pushAll(sec.errorMessage, sec.finEvalSectionStgId != null ? { sectionId: sec.finEvalSectionStgId } : {});
    for (const line of sec.lines || []) {
      pushAll(line.errorMessage, line.finEvalLineStgId != null ? { lineId: `val-${line.finEvalLineStgId}` } : {});
    }
  }
  return out;
}

// data.file.errorMessage is a snapshot taken at upload time and has been
// observed to NOT clear on its own once a PUT revalidates an individual
// line/section back to VALID — using it as the primary "is this still
// wrong" signal made fixed errors look permanently stuck. The per-object
// errorMessage fields walked by collectStructuredIssues ARE kept fresh by
// each validate call, so they're the authoritative source; file.errorMessage
// is only used to surface messages with no owning object at all (e.g. "Section
// X is missing from the uploaded file" — there's no section object for a
// section that isn't even present, so nothing else could carry that message).
function attachValidationTargets(fileErrorMsg: string, header: StagingHeader | undefined): ValidationIssue[] {
  const structured = header ? collectStructuredIssues(header) : [];
  const structuredTexts = new Set(structured.map((s) => s.message));

  const fileOnly = fileErrorMsg
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((message) => !structuredTexts.has(message))
    .map((message) => ({ message }));

  return [...structured, ...fileOnly];
}

export async function getFinEvaluationStaging(
  cfg: AppConfig
): Promise<{ table: PivotTableData; rawHeader: ApiHeader; errors: ValidationIssue[] }> {
  const url   = buildFinEvaluationStagingUrl(cfg);
  const token = await getBearerToken(cfg);
  console.log("[getFinEvaluationStaging] GET", url);
  const res = await fetch(url, {
    headers: {
      Accept:        "application/json",
      Authorization: `Bearer ${token}`,
      user_email:    cfg.app_user,
      role:          cfg.app_roles,
    },
  });
  console.log("[getFinEvaluationStaging] status:", res.status);
  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to load staging data (${res.status}).`);
    throw new Error(msg);
  }

  const raw = await res.json() as StagingApiResponse;

  const rawStatus = raw.apiStatus || "";
  if (rawStatus && rawStatus !== "S" && rawStatus !== "SUCCESS") {
    throw new Error(raw.apiMessage || "Failed to load staging data.");
  }

  // File-level validation errors from the last import, pipe-separated
  // (e.g. "Section 'X' is missing. | Fiscal year FY29 appears more than once.").
  const fileErrorMsg = raw.data?.file?.errorMessage ?? "";
  const errors = attachValidationTargets(fileErrorMsg, raw.data?.header);

  const result = transformStagingData(raw, cfg);
  console.log("[getFinEvaluationStaging] transform result:", result ? `${result.table.groups.length} groups, ${result.table.years.length} years` : "null → using createEmptyTable");

  if (!result) return { table: createEmptyTable(), rawHeader: createEmptyHeader(cfg), errors };
  return { ...result, errors };
}

export type SaveResponse = {
  api_status?:  string;
  api_message?: string;
  [k: string]:  unknown;
};

/**
 * Validate the proposal — PUT the staged table to finEvaluationStaging so
 * the backend re-runs validation (refreshes validationStatus/errorMessage
 * per section/line, same shape the GET returns). Used by the Validate button.
 *
 * Callers should reload data afterwards (via getFinEvaluationStaging) so
 * newly-created section/line ids and refreshed validation state come back
 * into local state.
 */
export async function validateFinEvaluationStaging(
  cfg:       AppConfig,
  data:      PivotTableData,
  rawHeader: ApiHeader,
): Promise<SaveResponse> {
  const url     = buildFinEvaluationStagingPutUrl(cfg);
  const payload = buildFinEvaluationStagingPutPayload(data, rawHeader);
  const token   = await getBearerToken(cfg);

  console.log("[validateFinEvaluationStaging] → PUT", url);
  console.log("[validateFinEvaluationStaging] → PUT body:", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${token}`,
      user_email:     cfg.app_user,
      role:           cfg.app_roles,
      language:       "EN",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let json: SaveResponse = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }

  const apiMsg    = (json as any).apiMessage || json.api_message || text || res.statusText;
  const apiStatus = (json as any).apiStatus  || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Validation failed (${res.status}).`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Validation failed on server.");
  }
  return json;
}

/**
 * Migrate staging → main for this proposal (Save Model button).
 *
 *   POST {api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/{file_id}
 *
 * No request body — the file_id in the path is all the handler needs.
 * Bearer token is attached like every other call.
 */
export async function migrateFinEvalStaging(
  cfg: AppConfig,
): Promise<SaveResponse> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  if (!cfg.file_id) throw new Error("Cannot save: no file_id available.");

  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/${cfg.file_id}`;
  console.log("[financial-api] → POST (migrate)", url);

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
// Payload builders for a single section / single line, matching the
// snake_case shape the /Financial/section and /Financial/line insert
// endpoints expect (unrelated to the finEvaluationStaging PUT above).

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
