import type { ScaleId } from "@/types";

export interface ScaleMeta {
  id: ScaleId;
  /** Toggle button label. */
  label: string;
  /** Underlying magnitude is divided by this for display. */
  divisor: number;
  /** Decimal places shown at this scale (K = 0, M = 1, B = 2). */
  decimals: number;
}

/**
 * Matches the rest of the FinEval suite's convention (see FIN_EVAL/MA
 * src/config/currency-config.ts): base figures are stored in THOUSANDS, so
 * K is a no-op, M divides by 1,000, B by 1,000,000.
 */
export const SCALES: ScaleMeta[] = [
  { id: "K", label: "K", divisor: 1, decimals: 0 },
  { id: "M", label: "M", divisor: 1_000, decimals: 1 },
  { id: "B", label: "B", divisor: 1_000_000, decimals: 2 },
];

const SCALE_BY_ID: Record<ScaleId, ScaleMeta> = SCALES.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<ScaleId, ScaleMeta>
);

export const scaleMeta = (scale: ScaleId): ScaleMeta => SCALE_BY_ID[scale];

export function applyScale(value: number, scale: ScaleId): number {
  return value / SCALE_BY_ID[scale].divisor;
}
