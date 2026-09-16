import type { CurrencyCode } from "@/types";

/**
 * All BuyPlan figures are stored in EUR (the proposal's local currency).
 * `rate` follows the GIS `usd_fbr` convention: "1 USD = rate EUR" — so
 * converting a EUR amount to USD DIVIDES by it. EUR itself is a no-op.
 */
export function toDisplayCurrency(
  baseEur: number,
  currency: CurrencyCode,
  rate: number
): number {
  if (currency !== "USD") return baseEur;
  return rate > 0 ? baseEur / rate : baseEur;
}
