/**
 * BuyPlan data model — mirrors the wireframe's "GSPC Proforma Financials"
 * tables (M_A_Authoring 08-05 (2).html -> #prop-buyplan).
 */

export type FiscalYear = "FY26" | "FY27" | "FY28" | "FY29" | "FY30" | "FY31";

export const FISCAL_YEARS: FiscalYear[] = [
  "FY26",
  "FY27",
  "FY28",
  "FY29",
  "FY30",
  "FY31",
];

export type CurrencyCode = "EUR" | "USD";

/** K / M / B — same scale convention used across the FinEval plugin suite. */
export type ScaleId = "K" | "M" | "B";

export type VarianceTone = "pos" | "neg" | "flat";

/** A single FY's Forecast vs Buy Plan pair for a money row. */
export interface MoneyFigures {
  forecast: number;
  buyPlan: number;
}

/**
 * A single FY's Forecast vs Buy Plan pair for the EBIT Margin % row — the
 * wireframe's variance here is a curated label ("5bps" / "—"), not a plain
 * subtraction, so it's carried explicitly rather than derived.
 */
export interface PercentFigures {
  forecast: number;
  buyPlan: number;
  varianceLabel: string;
  varianceTone: VarianceTone;
}

export interface MoneyRow {
  kind: "money";
  id: string;
  label: string;
  /** Bold "Proforma Total" style subtotal row. */
  isTotal?: boolean;
  values: Record<FiscalYear, MoneyFigures>;
}

export interface PercentRow {
  kind: "percent";
  id: string;
  label: string;
  values: Record<FiscalYear, PercentFigures>;
}

export type BuyPlanRow = MoneyRow | PercentRow;

export interface BuyPlanGroup {
  id: string;
  title: string;
  rows: BuyPlanRow[];
  /** Group supports the "+ Add Row" affordance from the wireframe. */
  allowAddRow?: boolean;
}

/**
 * Currency-agnostic — every figure is stored in EUR (the proposal's local
 * currency, in thousands), matching the rest of the FinEval suite's
 * BASE_CURRENCY convention. USD is derived at render time via the live/manual
 * exchange rate, not stored as a second dataset.
 */
export interface BuyPlanDataset {
  groups: BuyPlanGroup[];
}
