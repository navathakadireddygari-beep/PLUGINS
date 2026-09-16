import type { VarianceTone } from "@/types";

/** Accounting style: negatives in parentheses, `decimals` places (scale-driven). */
export function formatMoney(value: number, decimals = 1): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  const abs = Math.abs(rounded).toFixed(decimals);
  return rounded < 0 ? `(${abs})` : abs;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function moneyVariance(
  forecast: number,
  buyPlan: number,
  decimals = 1
): { text: string; tone: VarianceTone } {
  const factor = 10 ** decimals;
  const diff = Math.round((forecast - buyPlan) * factor) / factor;
  if (diff === 0) return { text: "—", tone: "flat" };
  return {
    text: diff < 0 ? `(${Math.abs(diff).toFixed(decimals)})` : diff.toFixed(decimals),
    tone: diff < 0 ? "neg" : "pos",
  };
}

export const TONE_COLOR: Record<VarianceTone, string> = {
  pos: "#1E8449",
  neg: "#C0392B",
  flat: "#ADB5BD",
};
