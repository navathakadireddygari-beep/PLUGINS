/**
 * Financial evaluation API — Sales Contract import (staging) flow
 *
 * GET  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X
 *        → staged (imported, not yet migrated) financial evaluation
 * PUT  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
 *        → Validate button: re-runs backend validation on the edited table
 * POST {api_endpoint}/GIS/proposalAuthoring/finEvalStagingMigrate/{file_id}
 *        → Save Model button: moves staging → main for this proposal
 *
 * Every call attaches a Bearer token obtained via `fetchAuthToken` (auth-api.ts).
 * `proposal_id`, `file_id`, `app_user`, `api_endpoint` come from
 * window.__SPC_SALES_CONFIG__ (set in index.html) and are read via `getAppConfig`.
 */
import type { AppConfig } from "../config/app-config";
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
  // True when the API sent no lineItemName for this row. Fixed at load time
  // (not re-derived from the live name) so a template line the user is
  // actively typing a missing name into doesn't re-lock itself after the
  // first keystroke — it only reverts to a locked template label on the
  // next fetch, once the name is actually saved.
  nameWasMissing?:    boolean;
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
  isGoLiveReq?:        string;
  displayOrder?:       number;
  status?:             string;
  languageCode?:       string;
};

export type PivotTableData = {
  headerName:   string;
  years:        number[];
  columnLabels: Record<number, string>;
  groups:       Group[];
};

/* ─────────────────────────── Wire types ─────────────────────────── */
// Financial lines carry the 4-field shape; NON_FINANCIAL lines (Additional
// Metrics) come back as { spc_projected_amount, actual } instead.
export type YearEntry = {
  spc_projected_amount:   number | null;
  ytd_budgeted_forecast?: number | null;
  ytd_actuals?:           number | null;
  variance?:              number | null;
  actual?:                number | null;
};

export type HurdleCheck = {
  check_code?:   string;
  label?:        string;
  hurdle_value?: number | null;
  actual_value?: number | null;
  pass?:         boolean;
};

// UI-side header. Built from the staging header in transformStagingData.
// Sales doesn't edit the hurdle/discount/amortisation fields, so they are kept
// exactly as the API sent them (null stays null) and passed straight back on
// the Validate PUT.
export type ApiHeader = {
  fin_eval_header_id:          number;
  proposal_id:                 number;
  proposal_title:              string;
  proposal_status?:            string;
  local_currency:              string;
  display_currency:            string;
  exchange_rate:               number;
  hurdle_rate_percent:         number | string | null;
  discount_rate_percent:       number | string | null;
  share_repurchase_percent:    number | string | null;
  amortisation_period_years:   number | string | null;
  amortization_period:         number | string | null;
  date_placed_in_service:      string | null;
  npv:                         number | null;
  irr_percent:                 string | null;
  payback_period_years:        number | null;
  contribution_margin_percent: number | null;
  total_contract_value:        number | null;
  annual_contract_value:       number | null;
  number_of_years:             number | null;
  contract_duration?:          number | string | null;
  performance_metrics:         { hurdle_checks?: HurdleCheck[] } | null;
  status:                      string;
  language_code:               string;
};

/* ─────────────────────────── Staging wire types ─────────────────── */
// finEvaluationStaging returns a camelCase envelope — validation runs before
// migrate, so every section/line/file carries its own validationStatus/errorMessage.
// Sample response: BUY_PLAN_APIS.txt (repo root).
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

type NumLike = string | number | null;

export type StagingHeader = {
  finEvalHeaderStgId:         number;
  localCurrency?:             string | null;
  displayCurrency:            string | null;
  exchangeRate?:              NumLike;
  hurdleRatePercent?:         NumLike;
  discountRatePercent?:       NumLike;
  shareRepurchasePercent?:    NumLike;
  amortisationPeriodYears?:   NumLike;
  amortizationPeriod?:        NumLike;
  datePlacedInService?:       string | null;
  npv?:                       NumLike;
  irrPercent?:                string | null;
  paybackPeriodYears?:        NumLike;
  contributionMarginPercent?: NumLike;
  totalContractValue?:        NumLike;
  annualContractValue?:       NumLike;
  numberOfYears?:             NumLike;
  contractDuration?:          NumLike;
  performanceMetrics?:        { hurdle_checks?: HurdleCheck[] } | null;
  status?:                    string;
  languageCode?:              string;
  validationStatus?:          string;
  errorCode?:                 string | null;
  errorMessage?:              string | null;
  sections:                   StagingSection[];
};

export type StagingFile = {
  fileId:        number;
  proposalId:    number;
  fileName:      string;
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
// GET  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X
export function buildFinEvaluationStagingUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__SPC_SALES_CONFIG__");
  if (cfg.file_id == null) throw new Error("Missing file_id in window.__SPC_SALES_CONFIG__");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging?file_id=${cfg.file_id}`;
}

// PUT  →  {api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
// file_id is mandatory (ORDS binds it from the URI Template). Same handler and
// URL shape as the Prod Dev import plugin.
export function buildFinEvaluationStagingPutUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__SPC_SALES_CONFIG__");
  if (cfg.file_id == null) throw new Error("Cannot validate: no file_id available.");
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluationStaging/${cfg.file_id}`;
}

/* ─────────────────────────── Empty defaults ─────────────────────── */
// Used when the backend returns no data so the UI can still render the toolbar.
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
    hurdle_rate_percent:         null,
    discount_rate_percent:       null,
    share_repurchase_percent:    null,
    amortisation_period_years:   null,
    amortization_period:         null,
    date_placed_in_service:      null,
    npv:                         null,
    irr_percent:                 null,
    payback_period_years:        null,
    contribution_margin_percent: null,
    total_contract_value:        null,
    annual_contract_value:       null,
    number_of_years:             null,
    contract_duration:           null,
    performance_metrics:         null,
    status:                      "ACTIVE",
    language_code:               "EN",
  };
}

/* ─────────────────────────── Staging GET transformer ────────────── */
// Numeric KPI fields arrive as strings ("22375.16…") or null.
function numOrNull(v: NumLike | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Converts the finEvaluationStaging envelope (data.header/data.file, camelCase
// fields) into the { table, rawHeader } shape the UI and PUT payload builder expect.
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
            id:               `val-${line.finEvalLineStgId ?? Math.random()}`,
            // Left blank (not defaulted to placeholder-looking text) when the
            // API sends null — the input placeholder then makes clear to the
            // user that it's genuinely missing.
            name:             line.lineItemName ?? "",
            yearValues,
            rowTotal:         Number.isFinite(totalNum) ? totalNum : undefined,
            accountId:        line.account          ?? undefined,
            targetGoLiveDate: line.targetGoLiveDate ?? undefined,
            lineType:         line.lineType         ?? "",
            lineId:           line.finEvalLineStgId ?? undefined,
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
        sectionId:          section.finEvalSectionStgId ?? undefined,
        sectionType:        section.sectionType ?? "CUSTOM",
        isCustom:           section.isCustom          ?? "N",
        isMandatory:        section.isMandatory       ?? "N",
        isNewLineRequired:  section.isNewLineRequired ?? "Y",
        isAccountRequired:  section.isAccountRequired ?? "N",
        isGoLiveReq:        section.isGoLiveReq       ?? "N",
        displayOrder:       section.displayOrder,
        status:             section.status       ?? "ACTIVE",
        languageCode:       section.languageCode ?? "EN",
      };
    });

  const proposalTitle = raw.data?.file?.fileName ?? "Untitled Proposal";
  const display       = header.displayCurrency ?? "USD";
  const local         = header.localCurrency || display;

  const rawHeader: ApiHeader = {
    fin_eval_header_id:          header.finEvalHeaderStgId ?? 0,
    proposal_id:                 cfg.proposal_id ?? raw.data?.file?.proposalId ?? 0,
    proposal_title:              proposalTitle,
    local_currency:              local,
    display_currency:            display,
    exchange_rate:               numOrNull(header.exchangeRate) ?? 1,
    hurdle_rate_percent:         header.hurdleRatePercent       ?? null,
    discount_rate_percent:       header.discountRatePercent     ?? null,
    share_repurchase_percent:    header.shareRepurchasePercent  ?? null,
    amortisation_period_years:   header.amortisationPeriodYears ?? null,
    amortization_period:         header.amortizationPeriod      ?? null,
    date_placed_in_service:      header.datePlacedInService     ?? null,
    npv:                         numOrNull(header.npv),
    irr_percent:                 header.irrPercent ?? null,
    payback_period_years:        numOrNull(header.paybackPeriodYears),
    contribution_margin_percent: numOrNull(header.contributionMarginPercent),
    total_contract_value:        numOrNull(header.totalContractValue),
    annual_contract_value:       numOrNull(header.annualContractValue),
    number_of_years:             numOrNull(header.numberOfYears),
    contract_duration:           header.contractDuration ?? null,
    performance_metrics:         header.performanceMetrics ?? null,
    status:                      header.status       ?? "ACTIVE",
    language_code:               header.languageCode ?? "EN",
  };

  return {
    table: { headerName: proposalTitle, years, columnLabels, groups },
    rawHeader,
  };
}

/* ─────────────────────────── Validation issues ──────────────────── */
// A validation error message plus (when we can identify it) the specific
// header field / section / line it belongs to, so the UI can navigate
// straight to the actual offending control instead of guessing by position.
export type ValidationIssue = {
  message:      string;
  headerField?: keyof ApiHeader;
  sectionId?:   number;
  lineId?:      string; // matches ValueRow.id ("val-{finEvalLineStgId}")
};

// Sales has no editable header fields on screen, so header-level errors are
// listed without a jump target. Extend this map if that changes.
const HEADER_ERROR_FIELD_MAP: Partial<Record<string, keyof ApiHeader>> = {};

// Walks header → sections → lines and emits one entry per "|"-separated
// piece of EACH object's own errorMessage, tagged with that object's own
// target. Once a line/section/header is fixed and revalidated, its own
// errorMessage comes back null and it simply stops contributing an entry.
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

// data.file.errorMessage is a snapshot taken at upload time and does NOT clear
// on its own once a PUT revalidates an individual line/section — the
// per-object errorMessage fields are the authoritative source. file.errorMessage
// is only used for messages with no owning object at all (e.g. "Section X is
// missing from the uploaded file").
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

/* ─────────────────────────── PUT payload builder ────────────────── */
// Builds the body for the finEvaluationStaging PUT (Validate button) in the
// same camelCase shape the staging GET returns. user_email travels via the
// request header, not the body. Every section/line sends its full known field
// set regardless of whether its *StgId is null (new) or set (existing).
export function buildFinEvaluationStagingPutPayload(
  tableData: PivotTableData,
  rawHeader: ApiHeader,
): object {
  const toFyKey = (year: number): string =>
    (tableData.columnLabels[year] || `FY${String(year).slice(2)}`).toLowerCase();

  const sections = tableData.groups.map((group, grpIdx) => {
    const lines = group.values.map((value, lineIdx) => {
      // Mirror the per-line year-entry shape the GET returned.
      const nonFinancial = (value.lineIdentifier ?? "").toUpperCase() === "NON_FINANCIAL";
      const entry = (amt: number | null): object => nonFinancial
        ? { spc_projected_amount: amt, actual: null }
        : { spc_projected_amount: amt, ytd_budgeted_forecast: null, ytd_actuals: null, variance: null };

      const yearValues: Record<string, object> = {};
      tableData.years.forEach((y) => {
        yearValues[toFyKey(y)] = entry(value.yearValues[y] ? value.yearValues[y] : null);
      });
      const totalAmt = tableData.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
      yearValues["total"] = entry(totalAmt || null);

      return {
        finEvalLineStgId: value.lineId ?? null,
        lineType:         value.lineType || "CUSTOM",
        lineItemName:     value.name,
        lineIdentifier:   (value.lineIdentifier ?? "FINANCIAL").toUpperCase(),
        isCalculated:     value.isCalculated ?? "N",
        isCustom:         value.isCustom     ?? "Y",
        account:          value.accountId    ?? null,
        displayOrder:     value.displayOrder ?? lineIdx + 1,
        targetGoLiveDate: value.targetGoLiveDate || null,
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
      amortisationPeriodYears: rawHeader.amortisation_period_years,
      amortizationPeriod:      rawHeader.amortization_period,
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

// GET {api_endpoint}/GIS/proposalAuthoring/finEvaluation/accountCategoryCodes
//      ?account_category_type=<sectionType>
export async function getAccountCodes(cfg: AppConfig, sectionType: string): Promise<AccountCode[]> {
  const token = await getBearerToken(cfg);
  const url   = `${cfg.api_endpoint}/GIS/proposalAuthoring/finEvaluation/accountCategoryCodes?account_category_type=${encodeURIComponent(sectionType)}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, user_email: cfg.app_user, role: cfg.app_roles },
  });

  if (!res.ok) {
    const msg = await extractApiError(res, `Failed to load account codes (${res.status}).`);
    throw new Error(msg);
  }

  const json = await res.json();

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

/* ─────────────────────────── Staging GET ────────────────────────── */
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

  // File-level validation errors from the last import, pipe-separated.
  const fileErrorMsg = raw.data?.file?.errorMessage ?? "";
  const errors = attachValidationTargets(fileErrorMsg, raw.data?.header);

  const result = transformStagingData(raw, cfg);
  console.log("[getFinEvaluationStaging] transform result:", result ? `${result.table.groups.length} groups, ${result.table.years.length} years` : "null → using createEmptyTable");

  if (!result) return { table: createEmptyTable(), rawHeader: createEmptyHeader(cfg), errors };
  return { ...result, errors };
}

export type SaveResponse = {
  apiStatus?:   string;
  apiMessage?:  string;
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
 * newly-created section/line ids and refreshed validation state come back.
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

  const apiMsg    = json.apiMessage || json.api_message || text || res.statusText;
  const apiStatus = json.apiStatus  || json.api_status  || "";

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
 */
export async function migrateFinEvalStaging(
  cfg: AppConfig,
): Promise<SaveResponse> {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__SPC_SALES_CONFIG__");
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

  const apiMsg    = json.apiMessage || json.api_message || text || res.statusText;
  const apiStatus = json.apiStatus  || json.api_status  || "";

  if (!res.ok) {
    throw new Error(apiMsg || `Save failed (${res.status}).`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMsg || "Save failed on server.");
  }
  return json;
}

/* ───────────────────── Server-driven sections ───────────────────── */
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

/** True if this group's calculated rows should come only from the
    backend (GET) response and must not be recomputed on the front-end. */
export function isServerDrivenSection(group: { sectionType?: string; name?: string }): boolean {
  return (
    FULL_DCF_SERVER_DRIVEN_TOKENS.has(sectionToken(group.sectionType)) ||
    FULL_DCF_SERVER_DRIVEN_TOKENS.has(sectionToken(group.name))
  );
}
