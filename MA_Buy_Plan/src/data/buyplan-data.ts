import {
  FISCAL_YEARS,
  type BuyPlanDataset,
  type BuyPlanGroup,
  type MoneyRow,
  type PercentRow,
} from "@/types";

type Pair = [forecast: number, buyPlan: number];

/** Figures below are authored in €m for readability; stored base is in
 * thousands (×1,000) to match the rest of the FinEval suite's convention. */
function moneyRow(id: string, label: string, pairs: Pair[], isTotal = false): MoneyRow {
  const values = {} as MoneyRow["values"];
  FISCAL_YEARS.forEach((fy, i) => {
    const [forecast, buyPlan] = pairs[i];
    values[fy] = { forecast: forecast * 1000, buyPlan: buyPlan * 1000 };
  });
  return { kind: "money", id, label, isTotal, values };
}

type PercentTuple = [forecast: number, buyPlan: number, varianceLabel: string, varianceTone: "pos" | "neg" | "flat"];

function percentRow(id: string, label: string, tuples: PercentTuple[]): PercentRow {
  const values = {} as PercentRow["values"];
  FISCAL_YEARS.forEach((fy, i) => {
    const [forecast, buyPlan, varianceLabel, varianceTone] = tuples[i];
    values[fy] = { forecast, buyPlan, varianceLabel, varianceTone };
  });
  return { kind: "percent", id, label, values };
}

// Same across both currencies — margin % doesn't change with FX.
const ebitMarginRow = () =>
  percentRow("ebit-margin", "EBIT Margin %", [
    [51.9, 51.3, "5bps", "pos"],
    [30.9, 30.9, "—", "flat"],
    [62.6, 62.6, "—", "flat"],
    [43.0, 43.0, "—", "flat"],
    [43.3, 43.3, "—", "flat"],
    [43.3, 43.3, "—", "flat"],
  ]);

function revenueGroup(rows: {
  novaCredit: Pair[];
  synergies: Pair[];
  total: Pair[];
}): BuyPlanGroup {
  return {
    id: "revenue",
    title: "Revenue",
    allowAddRow: true,
    rows: [
      moneyRow("revenue-novacredit", "NovaCredit", rows.novaCredit),
      moneyRow("revenue-synergies", "Experian Synergies", rows.synergies),
      moneyRow("revenue-total", "Proforma Total", rows.total, true),
    ],
  };
}

function ebitGroup(rows: {
  novaCredit: Pair[];
  synergies: Pair[];
  total: Pair[];
}): BuyPlanGroup {
  return {
    id: "ebit",
    title: "EBIT",
    allowAddRow: true,
    rows: [
      moneyRow("ebit-novacredit", "NovaCredit", rows.novaCredit),
      moneyRow("ebit-synergies", "Experian Synergies", rows.synergies),
      moneyRow("ebit-total", "Proforma Total", rows.total, true),
      ebitMarginRow(),
    ],
  };
}

export const BUY_PLAN_DATA: BuyPlanDataset = {
  groups: [
    revenueGroup({
      novaCredit: [
        [110.4, 115.0],
        [132.3, 135.0],
        [163.2, 160.0],
        [188.7, 185.0],
        [214.2, 210.0],
        [214.2, 210.0],
      ],
      synergies: [
        [5.5, 5.8],
        [6.6, 6.8],
        [8.2, 8.0],
        [18.9, 18.5],
        [21.4, 21.0],
        [21.4, 21.0],
      ],
      total: [
        [115.9, 120.8],
        [138.9, 141.8],
        [171.4, 168.0],
        [207.6, 203.5],
        [235.6, 231.0],
        [235.6, 231.0],
      ],
    }),
    ebitGroup({
      novaCredit: [
        [47.1, 48.6],
        [49.0, 50.0],
        [94.7, 92.8],
        [64.2, 62.9],
        [72.8, 71.4],
        [72.8, 71.4],
      ],
      synergies: [
        [13.0, 13.4],
        [-6.0, -6.2],
        [12.6, 12.4],
        [25.2, 24.7],
        [29.1, 28.6],
        [29.1, 28.6],
      ],
      total: [
        [60.1, 62.0],
        [42.9, 43.8],
        [107.3, 105.2],
        [89.3, 87.6],
        [101.9, 100.0],
        [101.9, 100.0],
      ],
    }),
  ],
};
