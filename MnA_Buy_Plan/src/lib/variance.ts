import type { VarianceTone } from "@/types";

/** Margin variance in basis points (1% = 100bps); "—" when either side is absent. */
export function percentVariance(
  forecast: number | null,
  buyPlan: number | null
): { text: string; tone: VarianceTone } {
  if (forecast === null || buyPlan === null) return { text: "—", tone: "flat" };
  const bps = Math.round((forecast - buyPlan) * 100);
  if (bps === 0) return { text: "—", tone: "flat" };
  const text = `${Math.abs(bps)}bps`;
  return { text: bps < 0 ? `(${text})` : text, tone: bps < 0 ? "neg" : "pos" };
}
