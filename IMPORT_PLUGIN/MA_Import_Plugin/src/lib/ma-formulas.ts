/**
 * M&A Financial Evaluation formulas.
 *
 * Transcribed from "Experian GIS - M&A Financial Evaluation Formulas" v1.0
 * (20 Aug 2026), which documents the shipped procedure
 * `XXEXP_GIS_FIN_EVAL_CALC_PKG.calc_ma_prc`.
 *
 * AUTHORITY: the DATABASE owns these numbers. Calculated lines arrive from the
 * GET already populated (`is_calculated: "Y"`, `last_updated_by: "SYSTEM"`) and
 * are recomputed server-side on every save. This module exists so the grid can
 * show a LIVE PREVIEW between saves - type a revenue, see EBIT move - and its
 * output is always superseded by the next response. It is deliberately pure and
 * framework-free so it can be checked against the procedure in isolation.
 *
 * Section numbers in the comments refer to that document.
 */

/* --------------------------- Rounding (S1) ---------------------------- */
// "Rounding is applied at every step rather than only at the end. Currency
// amounts are rounded to two decimal places; percentages, multiples and CAGR to
// four."

const roundTo = (value: number, dp: number): number => {
  if (!Number.isFinite(value)) return NaN;
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON * Math.sign(value || 1)) * f) / f;
};

/** Currency amounts - two decimal places. */
export const money = (v: number | null): number | null =>
  v === null || !Number.isFinite(v) ? null : roundTo(v, 2);

/** Percentages, multiples and CAGR - four decimal places. */
export const rate = (v: number | null): number | null =>
  v === null || !Number.isFinite(v) ? null : roundTo(v, 4);

/** Treat a missing input as zero, the way `sum_n_lines_in_section` does. */
const n = (v: number | null | undefined): number =>
  v === null || v === undefined || !Number.isFinite(v) ? 0 : v;

/**
 * A ratio that is null when its denominator is zero - "left null when revenue
 * total is zero, rather than raising" (S3).
 */
const ratioPct = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : rate((numerator / denominator) * 100);

/* ------------------------- Inputs (S2) -------------------------------- */

/**
 * The user-entered line types, plus the two whole-section subtotals. One entry
 * per fiscal year, in the same order as `fiscalYears`.
 *
 * `revenueTotal` / `costsTotal` are sums across the WHOLE section - "These, not
 * the standalone figures, drive EBIT" (S2).
 */
export interface MaYearInputs {
  standaloneRevenues: number | null;
  experianFactorRevenues: number | null;
  revenueTotal: number | null;
  standaloneCosts: number | null;
  costSynergies: number | null;
  depreciationAmortization: number | null;
  costsTotal: number | null;
  integrationCosts: number | null;
  purchasePrice: number | null;
  cashBenefits: number | null;
}

/** Scalars from the fin-eval header / Key Inputs panel, as percentages. */
export interface MaRates {
  /** Discount rate, r. */
  discountRate: number | null;
  /** Terminal growth rate, g. */
  terminalGrowthRate: number | null;
  /** Tax rate. */
  taxRate: number | null;
}

/** Everything the engine derives for one fiscal year. */
export interface MaYearOutputs {
  ebit: number | null;
  ebitda: number | null;
  ebitMarginPct: number | null;
  ebitdaMarginPct: number | null;
  ebitGrowthPct: number | null;
  ebitdaGrowthPct: number | null;
  standaloneEbit: number | null;
  standaloneTax: number | null;
  standaloneOcf: number | null;
  standaloneEbitMarginPct: number | null;
  cashTax: number | null;
  operatingCf: number | null;
  experianOcf: number | null;
  terminalValue: number | null;
  standaloneTerminalValue: number | null;
  netCashFlow: number | null;
  ptrTax: number | null;
  postTaxEbit: number | null;
  postTaxEarnings: number | null;
  postTaxReturnPct: number | null;
}

export interface MaNpvBlock {
  pvYearsStandalone: number | null;
  pvYearsTotal: number | null;
  pvTerminalStandalone: number | null;
  pvTerminalTotal: number | null;
  /** Undiscounted purchase price at time zero (S6). */
  pvOfInvestment: number | null;
  totalPresentValue: number | null;
  npvAtDiscountRate: number | null;
}

export interface MaResult {
  years: MaYearOutputs[];
  npv: number | null;
  irrPercent: number | null;
  paybackPeriodYears: number | null;
  npvBlock: MaNpvBlock;
}

/* ------------------------ Headline KPIs (S8) -------------------------- */

/**
 * NPV = sum of CF_t / (1 + r/100)^(t-1).
 *
 * Note the exponent is t-1, so the FIRST year is undiscounted - "consistent
 * across the whole GIS calculation package, not specific to M&A" (S8).
 */
export const npvOf = (
  cashFlows: Array<number | null>,
  discountRatePct: number | null,
): number | null => {
  if (cashFlows.length === 0) return null;
  const r = n(discountRatePct) / 100;
  let total = 0;
  cashFlows.forEach((cf, i) => {
    total += n(cf) / (1 + r) ** i;
  });
  return money(total);
};

/**
 * IRR by Newton-Raphson, seeded at 10%, tolerance 0.0001, ceiling 100
 * iterations (S8). Returns null when there are no years, when every flow is
 * zero, or when the iteration fails to converge.
 */
export const irrOf = (cashFlows: Array<number | null>): number | null => {
  if (cashFlows.length === 0) return null;
  const flows = cashFlows.map(n);
  if (flows.every((f) => f === 0)) return null;

  let r = 0.1;
  for (let iter = 0; iter < 100; iter += 1) {
    let value = 0;
    let derivative = 0;
    flows.forEach((cf, i) => {
      value += cf / (1 + r) ** i;
      derivative += (-i * cf) / ((1 + r) ** i * (1 + r));
    });
    if (Math.abs(value) < 0.0001) return rate(r * 100);
    if (derivative === 0 || !Number.isFinite(derivative)) return null;
    const next = r - value / derivative;
    if (!Number.isFinite(next) || next <= -1) return null;
    r = next;
  }
  return null;
};

/**
 * Payback - "accumulates net cash flow period by period; the payback point is
 * the first period at which the running total turns non-negative" (S8).
 */
export const paybackOf = (cashFlows: Array<number | null>): number | null => {
  let running = 0;
  for (let i = 0; i < cashFlows.length; i += 1) {
    running += n(cashFlows[i]);
    if (running >= 0) return i + 1;
  }
  return null;
};

/* ----------------------------- CAGR (S11) ----------------------------- */

/**
 * CAGR = ((last / first)^(1 / (years - 1)) - 1) * 100.
 *
 * Null if either endpoint is zero or negative, or fewer than two years are
 * present. Applies to INPUT rows as well as computed ones - `write_cagr`
 * carries no `is_calculated` test (S11).
 */
export const cagrOf = (values: Array<number | null>): number | null => {
  const series = values.map(n);
  if (series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  if (first <= 0 || last <= 0) return null;
  return rate(((last / first) ** (1 / (series.length - 1)) - 1) * 100);
};

/* --------------------- Terminal value (S7) ---------------------------- */

/**
 * Gordon growth, off the final fiscal year:
 *   TV = OCF(FY n) * (1 + g/100) / ((r - g) / 100)
 *
 * Guarded on r > g strictly - otherwise the denominator is zero or negative and
 * the figure would be meaningless, so it is left null.
 */
export const terminalValueOf = (
  finalYearOcf: number | null,
  discountRatePct: number | null,
  growthRatePct: number | null,
): number | null => {
  const r = n(discountRatePct);
  const g = n(growthRatePct);
  if (r <= g) return null;
  return money((n(finalYearOcf) * (1 + g / 100)) / ((r - g) / 100));
};

/* --------------------------- The engine ------------------------------- */

/**
 * Run the full M&A calculation over a proposal's fiscal years.
 *
 * Two passes, as the procedure does (S1): the first walks the years computing
 * everything that depends only on the inputs; terminal values are then taken
 * off the final year; the second pass fills in the rows that need the complete
 * vector - the growth percentages, the terminal-value placements, and net cash
 * flow, which cannot be known until the terminal value exists.
 */
export const calculateMa = (
  inputs: MaYearInputs[],
  rates: MaRates,
): MaResult => {
  const { discountRate, terminalGrowthRate, taxRate } = rates;
  const tax = n(taxRate);

  // PV of Investment is the undiscounted purchase price, computed BEFORE the
  // per-year loop so the loop acquires no circular dependency on the NPV block
  // assembled at the end (S6).
  const pvOfInvestment = money(
    inputs.reduce((sum, year) => sum + n(year.purchasePrice), 0),
  );

  /* -- Pass 1 -- */
  const years: MaYearOutputs[] = inputs.map((y) => {
    const revenueTotal = n(y.revenueTotal);
    const costsTotal = n(y.costsTotal);
    const da = n(y.depreciationAmortization);

    const ebit = revenueTotal - costsTotal;
    const ebitda = ebit + da;

    // S4 - the standalone memo uses the NAMED standalone lines, not the
    // section totals.
    const standaloneRevenues = n(y.standaloneRevenues);
    const standaloneEbit = standaloneRevenues - n(y.standaloneCosts);
    const standaloneTax = standaloneEbit * (tax / 100);
    const standaloneOcf = standaloneEbit - standaloneTax;

    // S5 - cash tax is carried NEGATIVE (the CASH_TAX_EBIT convention) and is
    // therefore ADDED in the bridge rather than subtracted.
    const cashTax = -ebit * (tax / 100);
    const operatingCf = ebit - n(y.integrationCosts) - da + cashTax;
    // Experian's OCF is taken at FULL value - there is no purchase-share
    // scaling, because the capex / working-capital rows were removed (S5, S12).
    const experianOcf = operatingCf;

    // S6
    const ptrTax = -ebit * (tax / 100);
    const postTaxEbit = ebit + ptrTax;
    const postTaxEarnings = postTaxEbit + n(y.cashBenefits);

    return {
      ebit: money(ebit),
      ebitda: money(ebitda),
      ebitMarginPct: ratioPct(ebit, revenueTotal),
      ebitdaMarginPct: ratioPct(ebitda, revenueTotal),
      ebitGrowthPct: null, // pass 2
      ebitdaGrowthPct: null, // pass 2
      standaloneEbit: money(standaloneEbit),
      standaloneTax: money(standaloneTax),
      standaloneOcf: money(standaloneOcf),
      standaloneEbitMarginPct: ratioPct(standaloneEbit, standaloneRevenues),
      cashTax: money(cashTax),
      operatingCf: money(operatingCf),
      experianOcf: money(experianOcf),
      terminalValue: null, // pass 2
      standaloneTerminalValue: null, // pass 2
      netCashFlow: null, // pass 2
      ptrTax: money(ptrTax),
      postTaxEbit: money(postTaxEbit),
      postTaxEarnings: money(postTaxEarnings),
      postTaxReturnPct:
        pvOfInvestment === null || pvOfInvestment === 0
          ? null
          : ratioPct(postTaxEarnings, Math.abs(pvOfInvestment)),
    };
  });

  /* -- Terminal values, off the FINAL fiscal year (S7) -- */
  const last = years.length - 1;
  const combinedTv =
    last >= 0
      ? terminalValueOf(
          years[last].experianOcf,
          discountRate,
          terminalGrowthRate,
        )
      : null;
  const standaloneTv =
    last >= 0
      ? terminalValueOf(
          years[last].standaloneOcf,
          discountRate,
          terminalGrowthRate,
        )
      : null;

  /* -- Pass 2 -- */
  years.forEach((year, i) => {
    // Growth is undefined in the first year and wherever either endpoint is not
    // strictly positive (S3).
    if (i > 0) {
      const prev = years[i - 1];
      if (n(prev.ebit) > 0 && n(year.ebit) > 0) {
        year.ebitGrowthPct = ratioPct(n(year.ebit) - n(prev.ebit), n(prev.ebit));
      }
      if (n(prev.ebitda) > 0 && n(year.ebitda) > 0) {
        year.ebitdaGrowthPct = ratioPct(
          n(year.ebitda) - n(prev.ebitda),
          n(prev.ebitda),
        );
      }
    }
    // The terminal value is written onto the final fiscal year only; every
    // other year carries null (S7).
    year.terminalValue = i === last ? combinedTv : null;
    year.standaloneTerminalValue = i === last ? standaloneTv : null;
    year.netCashFlow = money(
      n(year.experianOcf) + n(inputs[i].purchasePrice) + n(year.terminalValue),
    );
  });

  /* -- Headline KPIs (S8) - fiscal years only -- */
  const netCashFlows = years.map((y) => y.netCashFlow);
  const npv = npvOf(netCashFlows, discountRate);
  const irrPercent = irrOf(netCashFlows);
  const paybackPeriodYears = paybackOf(netCashFlows);

  /* -- NPV calculation block (S9) -- */
  const r = n(discountRate) / 100;
  const horizon = years.length;
  const pvTerminal = (tv: number | null): number | null =>
    tv === null ? null : money(tv / (1 + r) ** horizon);

  const pvYearsStandalone = npvOf(
    years.map((y) => y.standaloneOcf),
    discountRate,
  );
  const pvYearsTotal = npvOf(
    years.map((y) => y.experianOcf),
    discountRate,
  );
  const pvTerminalStandalone = pvTerminal(standaloneTv);
  const pvTerminalTotal = pvTerminal(combinedTv);
  const totalPresentValue = money(n(pvYearsTotal) + n(pvTerminalTotal));

  return {
    years,
    npv,
    irrPercent,
    paybackPeriodYears,
    npvBlock: {
      pvYearsStandalone,
      pvYearsTotal,
      pvTerminalStandalone,
      pvTerminalTotal,
      pvOfInvestment,
      totalPresentValue,
      npvAtDiscountRate: npv,
    },
  };
};

/**
 * Net purchase price = enterprise value - tax benefit (S9).
 *
 * Both operands are USER INPUTS preserved across recalculation - "the engine
 * never overwrites whatever is already stored" - so this is exposed separately
 * rather than computed inside `calculateMa`.
 */
export const netPurchasePriceOf = (
  enterpriseValue: number | null,
  taxBenefit: number | null,
): number | null => money(n(enterpriseValue) - n(taxBenefit));
