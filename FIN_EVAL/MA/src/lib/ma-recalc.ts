/**
 * Wires the grid rows to the M&A formula engine.
 *
 * Reads the user-entered lines out of the grids, runs `calculateMa`, and writes
 * the results back onto the calculated lines so a cell edit immediately moves
 * everything downstream of it. Rows are keyed by `line_type`, which is the
 * stable server-side identity (`line_item_code` is absent from proposal
 * payloads, so it cannot be used).
 *
 * The server recomputes all of this on save and its answer wins on the next
 * GET; this is the between-saves preview.
 */

import {
  calculateMa,
  netPurchasePriceOf,
  type MaNpvBlock,
  type MaRates,
  type MaYearInputs,
  type MaYearOutputs,
} from "@/lib/ma-formulas";

/** The subset of a grid row this module needs. */
export interface RecalcRow {
  lineType?: string | null;
  sectionType?: string | null;
  isCalculated?: boolean;
  values: string[];
}

/** Numeric view of a stored base string ("" / unparseable -> null). */
const num = (v: string | undefined): number | null => {
  if (v === undefined || v === null || v.trim() === "") return null;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Back to the stored base string; null renders as an empty cell. */
const str = (v: number | null): string => (v === null ? "" : String(v));

const tok = (v: string | null | undefined): string =>
  (v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* ── Input line types (S2) ────────────────────────────────────────── */
const INPUT_OF: Record<string, keyof MaYearInputs> = {
  STANDALONEREVENUES: "standaloneRevenues",
  EXPERIANFACTORREVENUES: "experianFactorRevenues",
  STANDALONECOSTS: "standaloneCosts",
  COSTSYNERGIES: "costSynergies",
  DEPRECIATIONAMORTIZATION: "depreciationAmortization",
  INTEGRATIONCOSTSONETIME: "integrationCosts",
  PURCHASEPRICE: "purchasePrice",
  CASHBENEFITS: "cashBenefits",
};

/* ── Calculated line types -> engine output (S3-S7) ───────────────── */
const OUTPUT_OF: Record<string, keyof MaYearOutputs> = {
  // Returns Analysis
  EBIT: "ebit",
  EBITMARGINPCT: "ebitMarginPct",
  EBITGROWTHPCT: "ebitGrowthPct",
  EBITDA: "ebitda",
  EBITDAMARGINPCT: "ebitdaMarginPct",
  EBITDAGROWTHPCT: "ebitdaGrowthPct",
  // Standalone memo (S4)
  STANDALONEEBIT: "standaloneEbit",
  STANDALONETAXESPAYABLE: "standaloneTax",
  STANDALONEOPERATINGCASHFLOW: "standaloneOcf",
  STANDALONEEBITMARGINPCT: "standaloneEbitMarginPct",
  STANDALONETERMINALVALUE7YR: "standaloneTerminalValue",
  // Free cash flow bridge (S5)
  CFEBIT: "ebit",
  CASHTAXEBIT: "cashTax",
  OPERATINGCF: "operatingCf",
  EXPERIANSHAREOPERATINGFCF: "experianOcf",
  TERMINALVALUE: "terminalValue",
  NETCASHFLOW: "netCashFlow",
  // Post tax return (S6)
  //
  // The section's display order is the formula, read top to bottom:
  //   PTR_EBIT (10) -> PTR_TAXES_PAYABLE (20) -> EBIT_AFTER_TAX (30)
  //   -> CASH_BENEFITS (40, the one user input) -> POST_TAX_EBIT (50)
  //   -> POST_TAX_RETURN (60)
  // so EBIT_AFTER_TAX is the doc's "pre-benefit" figure (EBIT + PTR tax) and
  // POST_TAX_EBIT, which sits BELOW cash benefits, is "post-tax earnings"
  // (pre-benefit + cash benefits). Mapping both to `postTaxEbit` dropped cash
  // benefits from the "Post tax EBIT" row and left it contradicting the
  // Post tax return % directly beneath it, which divides post-tax EARNINGS by
  // PV of investment.
  PTREBIT: "ebit",
  PTRTAXESPAYABLE: "ptrTax",
  EBITAFTERTAX: "postTaxEbit",
  POSTTAXEBIT: "postTaxEarnings",
  POSTTAXRETURN: "postTaxReturnPct",
};

/** Section-wide subtotals (S2) — sums of every line in the section. */
const REVENUE_TOTAL = "REVENUETOTAL";
const COSTS_TOTAL = "COSTSTOTAL";

/**
 * Calculated lines that simply ECHO one of the user-entered inputs into another
 * section, rather than deriving anything. The free cash flow bridge carries D&A
 * (as AMORT_DEPREC, `is_calculated: "Y"`) so the bridge reads end to end, but
 * the figure is the Costs section's DEPRECIATION_AMORTIZATION input verbatim —
 * it is not an engine output, so it needs its own route from `MaYearInputs`.
 * Without one the row sat frozen on the server's value while every line around
 * it moved.
 */
const ECHO_OF: Record<string, keyof MaYearInputs> = {
  AMORTDEPREC: "depreciationAmortization",
};

/**
 * Sum the non-calculated lines of one section, per year. Only user-entered
 * lines contribute — "Only non-calculated lines contribute" (S2).
 */
const sumSection = (
  rows: RecalcRow[],
  sectionType: string,
  cols: number,
): Array<number | null> => {
  const totals = Array.from({ length: cols }, () => 0);
  let any = false;
  rows.forEach((row) => {
    if (row.isCalculated) return;
    if (tok(row.sectionType) !== sectionType) return;
    for (let i = 0; i < cols; i += 1) {
      const v = num(row.values[i]);
      if (v !== null) {
        totals[i] += v;
        any = true;
      }
    }
  });
  return any ? totals : Array.from({ length: cols }, () => null);
};

/** Per-year value of the first non-calculated line matching `lineType`. */
const lineValues = (
  rows: RecalcRow[],
  token: string,
  cols: number,
): Array<number | null> => {
  const row = rows.find((r) => tok(r.lineType) === token);
  return Array.from({ length: cols }, (_, i) =>
    row ? num(row.values[i]) : null,
  );
};

/**
 * Assemble the engine's per-year inputs from every grid.
 *
 * `revenueTotal` / `costsTotal` are section sums, not the named standalone
 * lines — "These, not the standalone figures, drive EBIT" (S2).
 */
export const buildMaInputs = (
  rows: RecalcRow[],
  cols: number,
): MaYearInputs[] => {
  const revenueTotal = sumSection(rows, "REVENUE", cols);
  const costsTotal = sumSection(rows, "COSTS", cols);

  const named: Partial<Record<keyof MaYearInputs, Array<number | null>>> = {};
  Object.entries(INPUT_OF).forEach(([token, field]) => {
    named[field] = lineValues(rows, token, cols);
  });

  return Array.from({ length: cols }, (_, i) => ({
    standaloneRevenues: named.standaloneRevenues?.[i] ?? null,
    experianFactorRevenues: named.experianFactorRevenues?.[i] ?? null,
    revenueTotal: revenueTotal[i],
    standaloneCosts: named.standaloneCosts?.[i] ?? null,
    costSynergies: named.costSynergies?.[i] ?? null,
    depreciationAmortization: named.depreciationAmortization?.[i] ?? null,
    costsTotal: costsTotal[i],
    integrationCosts: named.integrationCosts?.[i] ?? null,
    purchasePrice: named.purchasePrice?.[i] ?? null,
    cashBenefits: named.cashBenefits?.[i] ?? null,
  }));
};

/** Rates from the Key Inputs panel (percentages as typed). */
export const ratesFromKeyInputs = (
  keyInputs: Array<{ code: string; value: string }>,
): MaRates => {
  const find = (code: string): number | null => {
    const hit = keyInputs.find((k) => k.code === code);
    return hit ? num(hit.value) : null;
  };
  return {
    discountRate: find("DISCOUNT_RATE"),
    terminalGrowthRate: find("TERMINAL_GROWTH_RATE"),
    taxRate: find("TAX_RATE"),
  };
};

/**
 * Return `rows` with every calculated line refreshed from `result`.
 *
 * Rows whose `line_type` the engine does not produce are left exactly as the
 * server sent them — better an untouched server value than a blanked cell.
 * Identity is preserved (same array order, same length), so the caller can keep
 * using positional indices for selection and editing.
 */
export const applyMaOutputs = (
  rows: RecalcRow[],
  inputs: MaYearInputs[],
  years: MaYearOutputs[],
  cols: number,
): RecalcRow[] =>
  rows.map((row) => {
    if (!row.isCalculated) return row;
    const token = tok(row.lineType);

    // Section subtotals are sums rather than engine outputs.
    if (token === REVENUE_TOTAL || token === COSTS_TOTAL) {
      const values = [...row.values];
      for (let i = 0; i < cols; i += 1) {
        const v =
          token === REVENUE_TOTAL ? inputs[i]?.revenueTotal : inputs[i]?.costsTotal;
        values[i] = str(v ?? null);
      }
      return { ...row, values };
    }

    // Echoed inputs (D&A into the cash flow bridge) come from the input vector.
    const echo = ECHO_OF[token];
    if (echo) {
      const values = [...row.values];
      for (let i = 0; i < cols; i += 1) values[i] = str(inputs[i]?.[echo] ?? null);
      return { ...row, values };
    }

    const field = OUTPUT_OF[token];
    if (!field) return row;

    const values = [...row.values];
    for (let i = 0; i < cols; i += 1) {
      values[i] = str(years[i]?.[field] ?? null);
    }
    return { ...row, values };
  });

/* ── NPV Calculation block (S9) ───────────────────────────────────── */

/**
 * The NPV table's three columns, in the order the payload lists them:
 * `target_standalone`, `experian_factor`, `total`.
 */
const NPV_STANDALONE = 0;
const NPV_TOTAL = 2;

/**
 * Sum two figures, treating a null as absent rather than as zero: null + null
 * stays null, so an empty row renders empty instead of a confident "0".
 */
const add = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

/**
 * Refresh the NPV Calculation table from the engine's `npvBlock` (S9).
 *
 * Only the components the document actually defines are written. Two rows are
 * deliberately left as the server sent them:
 *
 *  - TAX_BENEFIT is a user input — "the engine never overwrites whatever is
 *    already stored" (S9).
 *  - ENTERPRISE_VALUE is server-calculated and the document gives no formula
 *    for it, so there is nothing to preview. It is READ here (for net purchase
 *    price) but never written.
 *
 * The `experian_factor` column is left untouched throughout: the server fills
 * it (a real payload shows `261.94 / -67.88 / 194.06`, i.e. standalone + factor
 * = total), and the document defines the standalone and total figures, not the
 * split between them.
 *
 * NOT every component uses the same column. A real payload puts the deal-value
 * trio in `target_standalone` with a NULL total:
 *
 *   PV_YEARS_0_7          261.94 | -67.88 | 194.06    all three
 *   PV_TERMINAL_VALUE     346.37 | -114.55 | 231.82   all three
 *   TOTAL_PRESENT_VALUE   608.31 | -182.43 | 425.88   all three
 *   PV_OF_INVESTMENT        null | null    | 420      total only
 *   NPV_AT_DISCOUNT_RATE    null | null    | 845.88   total only
 *   ENTERPRISE_VALUE           0 | null    | null     STANDALONE only
 *   TAX_BENEFIT               40 | null    | null     STANDALONE only
 *   NET_PURCHASE_PRICE       -40 | null    | null     STANDALONE only
 *
 * so net purchase price must be read from and written to the FIRST column.
 * Reading it from `total` found nulls and wrote a confident 0 into a column the
 * server deliberately leaves empty, while the real -40 sat beside it.
 */
export const applyMaNpvBlock = <T extends RecalcRow>(
  rows: T[],
  block: MaNpvBlock,
): T[] => {
  // Enterprise value and tax benefit are stated in the STANDALONE column, so
  // net purchase price is computed and written there too (S9).
  const columnOf = (token: string, col: number): number | null => {
    const row = rows.find((r) => tok(r.lineType) === token);
    return row ? num(row.values[col]) : null;
  };
  const netPurchasePrice = netPurchasePriceOf(
    columnOf("ENTERPRISEVALUE", NPV_STANDALONE),
    columnOf("TAXBENEFIT", NPV_STANDALONE),
  );

  /** [standalone, total] for each component the engine owns. */
  const VALUES: Record<string, [number | null, number | null]> = {
    PVYEARS07: [block.pvYearsStandalone, block.pvYearsTotal],
    PVTERMINALVALUE: [block.pvTerminalStandalone, block.pvTerminalTotal],
    TOTALPRESENTVALUE: [
      add(block.pvYearsStandalone, block.pvTerminalStandalone),
      block.totalPresentValue,
    ],
    PVOFINVESTMENT: [null, block.pvOfInvestment],
    NPVATDISCOUNTRATE: [null, block.npvAtDiscountRate],
    // Standalone column, total left alone — the server keeps it null.
    NETPURCHASEPRICE: [netPurchasePrice, null],
  };

  return rows.map((row) => {
    if (!row.isCalculated) return row;
    const pair = VALUES[tok(row.lineType)];
    if (!pair) return row;
    const values = [...row.values];
    const [standalone, total] = pair;
    // A null here means "this component does not use that column" — leave what
    // the server sent rather than blanking a cell it deliberately populated.
    if (standalone !== null) values[NPV_STANDALONE] = str(standalone);
    if (total !== null) values[NPV_TOTAL] = str(total);
    return { ...row, values };
  });
};

/**
 * One-shot recompute over a set of grids that share the same fiscal-year
 * columns. Takes every grid together because EBIT (Returns Analysis) depends on
 * Revenue and Costs, and the cash-flow bridge depends on EBIT — a per-grid
 * recompute would see only part of the picture.
 */
export const recalcMaGrids = <T extends RecalcRow>(
  grids: T[][],
  keyInputs: Array<{ code: string; value: string }>,
  cols: number,
): {
  grids: T[][];
  inputs: MaYearInputs[];
  years: MaYearOutputs[];
  npvBlock: MaNpvBlock;
} => {
  const all = grids.flat();
  const inputs = buildMaInputs(all, cols);
  const result = calculateMa(inputs, ratesFromKeyInputs(keyInputs));
  return {
    grids: grids.map(
      (rows) => applyMaOutputs(rows, inputs, result.years, cols) as T[],
    ),
    inputs,
    years: result.years,
    npvBlock: result.npvBlock,
  };
};
