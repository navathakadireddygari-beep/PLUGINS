/**
 * Wire types for GET /GIS/proposalAuthoring/financialEvaluation.
 *
 * Only the fields the UI consumes are typed strictly; the rest of the payload
 * is preserved loosely so unknown template variants do not break parsing.
 */

/** APEX-style boolean flag. */
export type YesNo = "Y" | "N";

/** One fiscal year's cell values for a line item. */
export interface FinEvalYearValue {
  spc_projected_amount: number | null;
  ytd_budgeted_forecast: number | null;
  ytd_actuals: number | null;
  variance: number | null;
}

/** Year buckets keyed by `fy24`…`fy33`, plus a `total` bucket. */
export type FinEvalYearValues = Record<string, FinEvalYearValue | null>;

/** A single row within a section. */
export interface FinEvalLine {
  fin_eval_line_id: number | null;
  /**
   * Owning section. Present on every line the payload sends (null on an
   * unsaved template), and echoed back on save — including on rows the user
   * added, so the backend is never left to infer the attachment.
   */
  fin_eval_section_id?: number | null;
  line_item_name: string;
  line_item_code: string;
  /** Stable server-side row type, e.g. "STANDALONE_REVENUES". */
  line_type?: string | null;
  line_identifier?: string | null;
  is_calculated: YesNo;
  is_read_only: YesNo;
  is_mandatory: YesNo;
  is_custom: YesNo;
  display_order: number;
  year_values: FinEvalYearValues | null;
  template_fin_eval_line_id: number | null;
  status: string | null;
  /** Locale the line's text is in; every echoed line carries it. */
  language_code?: string | null;
  /**
   * Account code. M&A renders no account column, but the field is part of the
   * line shape the endpoint round-trips and every line sends it — new rows
   * included, as null.
   */
  account?: string | null;
}

/** A grouping of lines, e.g. Revenue or Combined Free Cash Flows. */
export interface FinEvalSection {
  fin_eval_section_id: number | null;
  section_name: string;
  section_type: string;
  section_description: string | null;
  display_order: number;
  is_read_only: YesNo;
  /** "N" when the section takes no user-added lines (e.g. Returns Analysis). */
  is_new_line_required?: YesNo | null;
  /**
   * "Y" on a section the USER added ("+ Add Section"). Template sections ship
   * "N" or omit it. Only a custom section can be renamed or deleted on screen.
   */
  is_custom?: YesNo | null;
  template_section_id: number | null;
  status: string | null;
  lines: FinEvalLine[] | null;
}

/** One row of the Key Inputs panel. */
export interface FinEvalKeyInput {
  input_code: string;
  label: string;
  /** e.g. "PERCENT". */
  unit: string | null;
  value: number | null;
  is_calculated: YesNo;
  source_column: string | null;
  display_order: number;
}

/** One row of the NPV Calculation table. */
export interface FinEvalNpvComponent {
  component_code: string;
  label: string;
  target_standalone: number | null;
  experian_factor: number | null;
  total: number | null;
  is_calculated: YesNo;
  is_mandatory: YesNo;
  display_order: number;
}

/**
 * Body of PUT /GIS/proposalAuthoring/{proposal_id}/financialEvaluation.
 *
 * The endpoint round-trips the whole evaluation, so the payload is the GET
 * response with the user's edits applied. Fields the GET does not surface
 * (kpi_type, status, attribute1..10, …) are echoed back untouched, hence the
 * index signature rather than an exhaustive field list.
 */
export type FinancialEvaluationSavePayload = FinancialEvaluationResponse & {
  [key: string]: unknown;
};

/** The `data.items` object returned by the endpoint. */
export interface FinancialEvaluationResponse {
  fin_eval_header_id: number | null;
  /**
   * Workflow status of the owning proposal. Anything in
   * `READONLY_PROPOSAL_STATUSES` locks the screen — see
   * `isProposalStatusReadonly`. Absent on template-only fetches.
   */
  proposal_status?: string | null;
  proposal_id: number | null;
  proposal_title: string | null;
  local_currency: string | null;
  display_currency: string | null;
  exchange_rate: number | null;
  /** Number of projection columns the template wants shown. */
  display_years: number | null;
  discount_rate_percent: number | null;
  tax_rate_percent: number | null;
  /** "M_AND_A" for this screen; null on a freshly loaded template. */
  kpi_type: string | null;
  number_of_years: number | null;
  status: string | null;
  m_a_key_inputs: { inputs: FinEvalKeyInput[] | null } | null;
  m_a_npv_calculation: {
    discount_rate_percent: number | null;
    components: FinEvalNpvComponent[] | null;
  } | null;
  sections: FinEvalSection[] | null;
}
