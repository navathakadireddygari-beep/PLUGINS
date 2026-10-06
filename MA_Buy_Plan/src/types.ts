/**
 * BuyPlan data model.
 *
 * Two layers:
 *  - Wire types for the M&A Buy Plan endpoints:
 *      GET  /GIS/MA/buyPlan             (headers: proposal_id [, currency])
 *      POST /GIS/MA/buyPlan/adjustment  (one adjustment = one section + one FY)
 *  - The view model the "GSPC Proforma Financials" tables render.
 */

export type VarianceTone = "pos" | "neg" | "flat";

/* ───────────────────────────── Wire types ───────────────────────────── */

/**
 * One fiscal year of a section. Without a `currency` header the GET returns
 * both the `_local` and `_usd` triples; with one, only that currency's.
 * `variance_*` is computed by the server (forecast − buy plan) and is null
 * where there is no forecast to compare against.
 */
export interface BuyPlanFyData {
  forecast_local?: number | null;
  buyplan_local?: number | null;
  variance_local?: number | null;
  forecast_usd?: number | null;
  buyplan_usd?: number | null;
  variance_usd?: number | null;
  /** EBIT section only. */
  ebit_margin_pct?: number | null;
}

export interface BuyPlanSection {
  /** "REVENUE" | "EBIT". */
  section_code: string;
  section_label: string;
  /** Needed to POST an adjustment against this section. */
  fin_eval_section_id?: number | null;
  /** Keyed by lower-case fiscal-year bucket, e.g. `fy26`. */
  fy_data: Record<string, BuyPlanFyData | null> | null;
}

export interface BuyPlanProposalInfo {
  proposal_code: string | null;
  proposal_title: string | null;
  /** The proposal's local currency. */
  currency_code: string | null;
  /** `1 USD = fx_rate <currency_code>`. */
  fx_rate: number | null;
  target_year_end: string | null;
  /** The `currency` header echoed back, or "BOTH" when none was sent. */
  display_currency: string | null;
  proration_months: number | null;
  /** First fiscal year the Buy Plan covers, e.g. `fy26`. */
  first_fy_key: string | null;
}

/** The `data` object of GET /GIS/MA/buyPlan. */
export interface BuyPlanResponse {
  proposal_info: BuyPlanProposalInfo | null;
  fiscal_years: string[] | null;
  sections: BuyPlanSection[] | null;
}

/** Body of POST /GIS/MA/buyPlan/adjustment. */
export interface BuyPlanAdjustmentPayload {
  proposal_id: number;
  /** The GET currently never returns this — null until the backend adds it. */
  fin_eval_section_id: number | null;
  /** `section_code`, e.g. "REVENUE" — sent so the section is identifiable without an id. */
  section_code: string;
  description: string;
  amount: number;
  /** Four-digit year, e.g. 2026 for `fy26`. */
  fiscal_year: number;
  created_by: number;
}

/* ───────────────────────────── View model ───────────────────────────── */

/** Which of the GET's two value sets a table shows. */
export type CurrencySide = "local" | "usd";

/** One FY's Forecast / Buy Plan / Variance, as the server sent them. */
export interface Figures {
  forecast: number | null;
  buyPlan: number | null;
  variance: number | null;
}

/** Fiscal-year bucket -> figures. */
export type FyFigures = Record<string, Figures>;

export interface BuyPlanSectionView {
  /** `section_code`, e.g. "REVENUE". */
  code: string;
  label: string;
  sectionId: number | null;
  /** The section's own figures, per currency side. */
  values: Record<CurrencySide, FyFigures>;
}

export interface BuyPlanHeaderInfo {
  proposalId: number | null;
  title: string;
  code: string | null;
  targetYearEnd: string | null;
  /** The proposal's local currency, null when the payload states none. */
  localCurrency: string | null;
  fxRate: number | null;
}

export interface BuyPlanDataset {
  header: BuyPlanHeaderInfo;
  /** Fiscal-year buckets shown, chronological, from `first_fy_key` on. */
  fiscalYears: string[];
  sections: BuyPlanSectionView[];
}

/**
 * A row the user added with "+ Add Row", not yet saved. Amounts are kept in
 * USD (the currency the Financial Evaluation stores in) and POSTed per FY.
 */
export interface NewBuyPlanRow {
  key: string;
  sectionCode: string;
  description: string;
  /** Fiscal-year bucket -> USD amount. */
  amounts: Record<string, number | null>;
}
