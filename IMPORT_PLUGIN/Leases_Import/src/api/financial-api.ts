/**
 * Financial evaluation API — Leases (Import Plugin)
 *
 * Endpoint:  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging
 * GET  → fetches the staged (not-yet-migrated) financial evaluation for file_id
 * PUT  → {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
 *        re-validates the staged data (Validate button)
 * POST → {api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/{file_id}
 *        migrates staging → main proposal (Save Model button)
 *
 * All calls attach a Bearer token obtained via `fetchAuthToken` (auth-api.ts).
 * `file_id`, `proposal_id`, `app_user`, `api_endpoint` come from window.__APP_CONFIG__
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
  isMandatory?:       string;
  isCustom?:          string;
  displayOrder?:      number;
  status?:            string;
  languageCode?:      string;
  // True when the API sent no lineItemName for this row — the input's
  // "Enter line item name" placeholder makes clear it's genuinely missing.
  nameWasMissing?:    boolean;
};

export type Group = {
  id:                  string;
  name:                string;
  expanded:            boolean;
  values:              ValueRow[];
  sectionId?:          number;
  parentSectionId?:    number;
  // Template-hierarchy ids, present on fresh (unpersisted) template
  // responses where finEvalSectionStgId / parentFinEvalSectionStgId are
  // still null. Used only to build the parent/child tree — never sent
  // back as fin_eval_section_id in the save payload.
  templateSectionId?:       number;
  parentTemplateSectionId?: number;
  sectionType?:        string;
  isCustom?:           string;
  isMandatory?:        string;
  isNewLineRequired?:  string;
  isAccountRequired?:  string;
  isGoLiveReq?:        string;
  displayOrder?:       number;
  status?:             string;
  languageCode?:       string;
  rawSection?:         StagingSection;
};

export type PivotTableData = {
  headerName:   string;
  years:        number[];
  columnLabels: Record<number, string>;
  groups:       Group[];
};

/* ─────────────────────────── Wire types (finEvaluationStaging) ──── */
export type YearEntry = {
  spc_projected_amount:  number | null;
  ytd_budgeted_forecast: number | null;
  ytd_actuals:           number | null;
  variance:              number | null;
};

export type HurdleCheck = {
  check_code?:   string;
  label?:        string;
  hurdle_value?: number | null;
  actual_value?: number | null;
  pass?:         boolean | null;
  status?:       string;
};

// finEvaluationStaging returns a camelCase envelope — validation runs before
// migrate, so every section/line/file carries its own validationStatus/errorMessage.
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
  status?:              string;
  languageCode?:        string;
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
  status?:                    string;
  languageCode?:              string;
  validationStatus?:          string;
  errorCode?:                 string | null;
  errorMessage?:              string | null;
  lines:                      StagingLine[];
};

export type StagingHeader = {
  finEvalHeaderStgId:        number;
  localCurrency:             string | null;
  displayCurrency:           string;
  exchangeRate:              number | string | null;
  hurdleRatePercent:         string | number | null;
  discountRatePercent:       string | number | null;
  shareRepurchasePercent:    string | number | null;
  amortisationPeriodYears:   string | number | null;
  amortizationPeriod:        string | number | null;
  datePlacedInService:       string | null;
  taxRatePercent:            string | number | null;
  displayYears:              number | null;
  kpiType:                   string | null;
  npv:                       string | number | null;
  irrPercent:                string | number | null;
  paybackPeriodYears:        string | number | null;
  totalCashInflow:           number | null;
  totalCashOutflow:          number | null;
  grossProfit:               number | null;
  grossMarginPercent:        number | null;
  contributionMarginPercent: number | null;
  totalContractValue:        number | null;
  numberOfYears:             number | null;
  annualContractValue:       number | null;
  totalLeaseValue:           number | null;
  leaseTermsYears:           number | null;
  investment:                number | null;
  annualCost:                number | null;
  totalCapexInvestment:      number | null;
  annualOpex:                number | null;
  npvActuals:                number | null;
  irrActualsPercent:         number | null;
  paybackActualsYears:       number | null;
  npvVariance:               number | null;
  irrVariance:               number | null;
  paybackVariance:           number | null;
  avgWeeklyPeakHeadcount:    number | null;
  performanceMetrics:        { hurdle_checks?: HurdleCheck[]; computed_at?: string | null } | null;
  status?:                   string;
  languageCode?:             string;
  validationStatus?:         string;
  errorCode?:                string | null;
  errorMessage?:             string | null;
  sections:                  StagingSection[];
};

export type StagingFile = {
  fileId:             number;
  proposalId:         number;
  fileName:           string;
  spcTypeId?:         number;
  spcTypeTemplateId?: number;
  displayCurrency?:   string;
  loadStatus?:        string;
  totalSectionCount?: number;
  totalLineCount?:    number;
  errorCode?:         string | null;
  errorMessage?:      string | null;
  migratedDate?:      string | null;
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

/* ─────────────────────────── UI-side header ─────────────────────── */
// A best-effort snake_case projection of StagingHeader used by the table
// component / KpiPanel — kept stable so the rest of the UI doesn't need to
// know about the camelCase staging wire format.
export type ApiHeader = {
  fin_eval_header_id:          number;
  proposal_id:                 number;
  proposal_title:              string;
  local_currency:              string;
  display_currency:            string;
  exchange_rate:               number;
  hurdle_rate_percent:         number | string;
  discount_rate_percent:       number | string;
  share_repurchase_percent:    number | string;
  amortisation_period_years:   number | string;
  date_placed_in_service:      string;
  tax_rate_percent:            number | string;
  display_years:               number;
  kpi_type:                    string;
  npv:                         number | null;
  irr_percent:                 number | string | null;
  payback_period_years:        number | null;
  total_cash_inflow:           number | null;
  total_cash_outflow:          number | null;
  gross_profit:                number | null;
  gross_margin_percent:        number | null;
  contribution_margin_percent: number | null;
  total_contract_value:        number | null;
  number_of_years:             number | null;
  annual_contract_value:       number | null;
  total_lease_value:           number | null;
  lease_terms_years:           number | null;
  investment:                  number | null;
  annual_cost:                 number | null;
  total_capex_investment:      number | null;
  annual_opex:                 number | null;
  npv_actuals:                 number | null;
  irr_actuals_percent:         number | null;
  payback_actuals_years:       number | null;
  npv_variance:                number | null;
  irr_variance:                number | null;
  payback_variance:            number | null;
  avg_weekly_peak_headcount:   number | null;
  performance_metrics:         { hurdle_checks?: HurdleCheck[] } | null;
  status:                      string;
  language_code:               string;
};

/* ─────────────────────────── URL helpers ────────────────────────── */
// GET  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X
export function buildFinEvaluationStagingUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  if (cfg.file_id == null) throw new Error("Missing file_id in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=${cfg.file_id}`;
}

// PUT  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
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
    fin_eval_header_id:          0,
    proposal_id:                 cfg.proposal_id ?? cfg.spc_type_id ?? 0,
    proposal_title:              "Untitled Proposal",
    local_currency:              "",
    display_currency:            "",
    exchange_rate:               0,
    hurdle_rate_percent:         0,
    discount_rate_percent:       0,
    share_repurchase_percent:    0,
    amortisation_period_years:   0,
    date_placed_in_service:      "",
    tax_rate_percent:            0,
    display_years:               6,
    kpi_type:                    "",
    npv:                         null,
    irr_percent:                 null,
    payback_period_years:        null,
    total_cash_inflow:           null,
    total_cash_outflow:          null,
    gross_profit:                null,
    gross_margin_percent:        null,
    contribution_margin_percent: null,
    total_contract_value:        null,
    number_of_years:             null,
    annual_contract_value:       null,
    total_lease_value:           null,
    lease_terms_years:           null,
    investment:                  null,
    annual_cost:                 null,
    total_capex_investment:      null,
    annual_opex:                 null,
    npv_actuals:                 null,
    irr_actuals_percent:         null,
    payback_actuals_years:       null,
    npv_variance:                null,
    irr_variance:                null,
    payback_variance:            null,
    avg_weekly_peak_headcount:   null,
    performance_metrics:         null,
    status:                      "ACTIVE",
    language_code:               "EN",
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

/* ─────────────────────────── Currency exchange rate ─────────────── */
export type CurrencyExchangeRate = {
  entity_code?:  string;
  year_period?:  number;
  currency?:     string;
  usd_fbr?:      number | null;
  usd_ibr?:      number | null;
  usd_nyfbr?:    number | null;
  usd_nyibr?:    number | null;
  usd_ar?:       number | null;
  gbp_ar?:       number | null;
};

export async function getCurrencyExchangeRate(
  cfg:        AppConfig,
  currency:   string,
  yearPeriod: string
): Promise<CurrencyExchangeRate | null> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      ...authHeaders(cfg, token),
    },
    body: JSON.stringify({ year_period: yearPeriod, currency }),
  });

  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to load exchange rate (${res.status}).`);
    throw new Error(msg);
  }

  const json = await res.json() as { data?: CurrencyExchangeRate };
  return json?.data ?? null;
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

/* ─────────────────────────── FY-key helpers ──────────────────────── */
// Passes a header numeric field through as a number when it parses cleanly;
// otherwise keeps the raw value verbatim (e.g. "two") so the UI displays
// exactly what the API sent instead of masking it behind a silent 0.
function numOrRaw(v: string | number | null | undefined): number | string {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

/* ─────────────────────────── GET transformer ─────────────────────── */
// Converts the finEvaluationStaging envelope (data.header/data.file, camelCase
// fields) into the same { table, rawHeader } shape the UI and PUT payload
// builder expect.
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
            const raw = line.yearValues?.[key]?.spc_projected_amount;
            yearValues[years[i]] = raw != null ? Number(raw) : 0;
          });
          const totalEntry = line.yearValues?.["total"]?.spc_projected_amount;
          return {
            id:               `val-${line.finEvalLineStgId ?? Math.random()}`,
            name:             line.lineItemName ?? "",
            yearValues,
            rowTotal:         totalEntry != null ? Number(totalEntry) : undefined,
            accountId:        line.account          ?? undefined,
            targetGoLiveDate: line.targetGoLiveDate  ?? undefined,
            lineType:         line.lineType          ?? "",
            lineId:           line.finEvalLineStgId    ?? undefined,
            sectionId:        line.finEvalSectionStgId ?? undefined,
            lineIdentifier:   (line.lineIdentifier ?? "FINANCIAL").toUpperCase(),
            isCalculated:     line.isCalculated ?? "N",
            isMandatory:      line.isMandatory  ?? "N",
            isCustom:         line.isCustom     ?? "Y",
            displayOrder:     line.displayOrder,
            status:           line.status       ?? "ACTIVE",
            languageCode:     line.languageCode ?? "EN",
            nameWasMissing:   !line.lineItemName,
          };
        });

      return {
        id:                 `grp-${section.finEvalSectionStgId ?? Math.random()}`,
        name:               section.sectionName ?? "Section",
        expanded:           true,
        values,
        sectionId:          section.finEvalSectionStgId       ?? undefined,
        parentSectionId:    section.parentFinEvalSectionStgId ?? undefined,
        sectionType:        section.sectionType ?? "CUSTOM",
        isCustom:           section.isCustom          ?? "N",
        isMandatory:        section.isMandatory       ?? "N",
        isNewLineRequired:  section.isNewLineRequired ?? "Y",
        isAccountRequired:  section.isAccountRequired ?? "N",
        isGoLiveReq:        section.isGoLiveReq       ?? "N",
        displayOrder:       section.displayOrder,
        status:             section.status      ?? "ACTIVE",
        languageCode:       section.languageCode ?? "EN",
        rawSection:         section,
      };
    });

  const proposalTitle = raw.data?.file?.fileName ?? "Untitled Proposal";
  const currency       = header.displayCurrency ?? "USD";

  const rawHeader: ApiHeader = {
    fin_eval_header_id:          header.finEvalHeaderStgId ?? 0,
    proposal_id:                 cfg.proposal_id ?? raw.data?.file?.proposalId ?? 0,
    proposal_title:              proposalTitle,
    local_currency:              header.localCurrency ?? currency,
    display_currency:            currency,
    exchange_rate:                typeof header.exchangeRate === "number" ? header.exchangeRate : Number(header.exchangeRate) || 1,
    hurdle_rate_percent:          numOrRaw(header.hurdleRatePercent),
    discount_rate_percent:        numOrRaw(header.discountRatePercent),
    share_repurchase_percent:     numOrRaw(header.shareRepurchasePercent),
    amortisation_period_years:    numOrRaw(header.amortisationPeriodYears ?? header.amortizationPeriod),
    date_placed_in_service:       header.datePlacedInService ?? "",
    tax_rate_percent:             numOrRaw(header.taxRatePercent),
    display_years:                header.displayYears ?? years.length ?? 6,
    kpi_type:                     header.kpiType ?? "",
    npv:                          header.npv != null ? Number(header.npv) : null,
    irr_percent:                  header.irrPercent ?? null,
    payback_period_years:         header.paybackPeriodYears != null ? Number(header.paybackPeriodYears) : null,
    total_cash_inflow:            header.totalCashInflow ?? null,
    total_cash_outflow:           header.totalCashOutflow ?? null,
    gross_profit:                 header.grossProfit ?? null,
    gross_margin_percent:         header.grossMarginPercent ?? null,
    contribution_margin_percent:  header.contributionMarginPercent ?? null,
    total_contract_value:         header.totalContractValue ?? null,
    number_of_years:              header.numberOfYears ?? null,
    annual_contract_value:        header.annualContractValue ?? null,
    total_lease_value:            header.totalLeaseValue ?? null,
    lease_terms_years:            header.leaseTermsYears ?? null,
    investment:                   header.investment ?? null,
    annual_cost:                  header.annualCost ?? null,
    total_capex_investment:       header.investment ?? null,
    annual_opex:                  header.annualCost ?? null,
    npv_actuals:                  header.npvActuals ?? null,
    irr_actuals_percent:          header.irrActualsPercent ?? null,
    payback_actuals_years:        header.paybackActualsYears ?? null,
    npv_variance:                 header.npvVariance ?? null,
    irr_variance:                 header.irrVariance ?? null,
    payback_variance:             header.paybackVariance ?? null,
    avg_weekly_peak_headcount:    header.avgWeeklyPeakHeadcount ?? null,
    performance_metrics:          header.performanceMetrics ?? null,
    status:                       header.status ?? "ACTIVE",
    language_code:                header.languageCode ?? "EN",
  };

  return {
    table: { headerName: proposalTitle, years, columnLabels, groups },
    rawHeader,
  };
}

/* ─────────────────────────── Validation issues ───────────────────── */
// A validation error message plus (when we can identify it) the specific
// header field / section / line it belongs to, so the UI can navigate
// straight to the actual offending control instead of guessing by position.
export type ValidationIssue = {
  message:      string;
  headerField?: keyof ApiHeader;
  sectionId?:   number;
  lineId?:      string; // matches ValueRow.id ("val-{finEvalLineStgId}")
};

const HEADER_ERROR_FIELD_MAP: Partial<Record<string, keyof ApiHeader>> = {
  FE_HDR_HURDLE: "hurdle_rate_percent",
};

// Walks header → sections → lines and emits one entry per "|"-separated
// piece of EACH object's own errorMessage, tagged with that object's own
// target. Built directly from the structured data so two lines sharing the
// same generic error text each get their own correct entry.
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

// file.errorMessage is a load-time snapshot that doesn't clear itself once a
// PUT revalidates an individual line/section — the per-object errorMessage
// fields walked above ARE kept fresh by each validate call, so they're the
// authoritative source; file.errorMessage only fills in messages with no
// owning object at all (e.g. "Section X is missing from the uploaded file").
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

/* ─────────────────────────── PUT payload builder ─────────────────── */
// Builds the body for the finEvaluationStaging PUT (Validate button).
export function buildFinEvaluationStagingPutPayload(
  tableData: PivotTableData,
  rawHeader: ApiHeader,
): object {
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
        finEvalLineStgId: value.lineId ?? null,
        lineType:         value.lineType || "CUSTOM",
        lineItemName:     value.name,
        lineIdentifier:   (value.lineIdentifier ?? "FINANCIAL").toUpperCase(),
        isCalculated:     value.isCalculated ?? "N",
        isCustom:         value.isCustom     ?? "Y",
        account:          value.accountId    ?? null,
        displayOrder:     value.displayOrder ?? lineIdx + 1,
        targetGoLiveDate: value.targetGoLiveDate ?? null,
        yearValues:       year_values,
      };
    });

    return {
      finEvalSectionStgId:       group.sectionId       ?? null,
      parentFinEvalSectionStgId: group.parentSectionId  ?? null,
      sectionName:               group.name,
      sectionType:               group.sectionType  ?? "CUSTOM",
      isCustom:                  group.isCustom     ?? "Y",
      displayOrder:              group.displayOrder ?? grpIdx + 1,
      status:                    group.status       ?? "ACTIVE",
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
      amortisationPeriodYears: rawHeader.amortisation_period_years,
      datePlacedInService:     rawHeader.date_placed_in_service,
      taxRatePercent:          rawHeader.tax_rate_percent,
      performanceMetrics:      rawHeader.performance_metrics,
      sections,
    },
  };
}

/* ─────────────────────────── Network calls ───────────────────────── */
export type SaveResponse = {
  api_status?:  string;
  api_message?: string;
  [k: string]:  unknown;
};

/**
 * Fetches the staged (not-yet-migrated) financial evaluation for this file.
 * Response envelope: { apiStatus, apiMessage, data: { file, header, orphanLines } }.
 */
export async function getFinEvaluationStaging(
  cfg: AppConfig
): Promise<{ table: PivotTableData; rawHeader: ApiHeader; errors: ValidationIssue[] }> {
  const url   = buildFinEvaluationStagingUrl(cfg);
  const token = await getBearerToken(cfg);
  //console.log("[getFinEvaluationStaging] GET", url);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...authHeaders(cfg, token),
    },
  });
  //console.log("[getFinEvaluationStaging] status:", res.status);
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
  //console.log("[getFinEvaluationStaging] transform result:", result ? `${result.table.groups.length} groups, ${result.table.years.length} years` : "null → using createEmptyTable");

  if (!result) return { table: createEmptyTable(), rawHeader: createEmptyHeader(cfg), errors };
  return { ...result, errors };
}

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

  //console.log("[validateFinEvaluationStaging] → PUT", url, payload);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      language:       "EN",
      ...authHeaders(cfg, token),
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
 * Migrate staging → main for this file (Save Model button).
 *
 *   POST {api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/{file_id}
 *
 * No request body — the file_id in the path is all the handler needs.
 */
export async function migrateFinEvalStaging(
  cfg: AppConfig,
  fileId: number | null,
): Promise<SaveResponse> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  if (!fileId) throw new Error("Cannot save: no file_id available.");

  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/${fileId}`;
  //console.log("[financial-api] → POST (migrate)", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(cfg, token),
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

