/**
 * BuyPlan data model.
 *
 * Two layers:
 *  - Wire types for the M&A financialEvaluation endpoint (the same GET/PUT the
 *    Financial Evaluation screen uses — Buy Plan reads/writes the
 *    `buy_plan_amount` bucket of each line's year values).
 *  - The view model the "GSPC Proforma Financials" table renders.
 */

export type VarianceTone = "pos" | "neg" | "flat";

/* ───────────────────────────── Wire types ───────────────────────────── */

export type YesNo = "Y" | "N";

/** One fiscal year's cell values for a line item. */
export interface FinEvalYearValue {
  spc_projected_amount: number | null;
  ytd_budgeted_forecast: number | null;
  ytd_actuals: number | null;
  variance: number | null;
  buy_plan_amount: number | null;
  forecast_buyplan_variance: number | null;
}

/** Year buckets keyed by `fy24`…`fy33`, plus a `total` bucket. */
export type FinEvalYearValues = Record<string, FinEvalYearValue | null>;

export interface FinEvalLine {
  fin_eval_line_id: number | null;
  fin_eval_section_id?: number | null;
  line_type: string | null;
  line_item_name: string;
  is_calculated: YesNo;
  is_read_only?: YesNo;
  account: string | null;
  display_order: number;
  year_values: FinEvalYearValues | null;
  status?: string | null;
}

export interface FinEvalSection {
  fin_eval_section_id: number | null;
  section_name: string;
  section_type: string;
  display_order: number;
  status?: string | null;
  lines: FinEvalLine[] | null;
}

/** The `data.items` object of GET /GIS/proposalAuthoring/financialEvaluation. */
export interface FinancialEvaluationResponse {
  fin_eval_header_id: number | null;
  proposal_id: number | null;
  proposal_title: string | null;
  proposal_code?: string | null;
  proposal_status?: string | null;
  planned_go_live_date?: string | null;
  local_currency: string | null;
  display_currency: string | null;
  exchange_rate: number | null;
  sections: FinEvalSection[] | null;
}

/**
 * Body of PUT /GIS/proposalAuthoring/{proposal_id}/financialEvaluation: the
 * whole GET payload echoed back (fields this screen never reads included, hence
 * the index signature) plus the caller's `user_email`.
 */
export type BuyPlanSavePayload = FinancialEvaluationResponse & {
  user_email: string;
  [key: string]: unknown;
};

/* ───────────────────────────── View model ───────────────────────────── */

/**
 * A single FY's Forecast vs Buy Plan pair, as stored: USD, in thousands — the
 * same base FIN_EVAL/MA stores and converts from (see lib/currency-conversion).
 */
export interface Figures {
  forecast: number | null;
  buyPlan: number | null;
}

export interface BuyPlanRow {
  /** `fin_eval_line_id` as a string — the key edits are tracked under. */
  key: string;
  lineId: number | null;
  label: string;
  /** "percent" rows (e.g. EBIT Margin %) are not currency and never converted. */
  kind: "money" | "percent";
  /** Server-calculated line (subtotal, EBIT, …): shown bold, never editable. */
  isCalculated: boolean;
  /** Buy Plan cells accept input. */
  editable: boolean;
  /** Keyed by lower-case fiscal-year bucket, e.g. `fy25`. */
  values: Record<string, Figures>;
}

export interface BuyPlanGroup {
  id: string;
  sectionId: number | null;
  title: string;
  rows: BuyPlanRow[];
}

export interface BuyPlanHeaderInfo {
  proposalId: number | null;
  title: string;
  code: string | null;
  status: string | null;
  plannedGoLive: string | null;
  /** The proposal's local currency, null when the payload states none. */
  localCurrency: string | null;
  displayCurrency: string | null;
  exchangeRate: number | null;
}

export interface BuyPlanDataset {
  header: BuyPlanHeaderInfo;
  /** Fiscal-year buckets the evaluation carries, chronological (`fy24`…). */
  fiscalYears: string[];
  groups: BuyPlanGroup[];
  /** Untouched GET payload — the PUT echoes each edited line's buckets from it. */
  raw: FinancialEvaluationResponse;
}
