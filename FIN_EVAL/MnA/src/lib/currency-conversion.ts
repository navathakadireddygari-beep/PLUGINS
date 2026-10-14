/**
 * CurrencyConversionService
 * -------------------------
 * Single source of truth for currency math. Pure + framework-agnostic.
 *
 * Model — mirrors the reference project (Prod Dev → computeDisplayMultiplier in
 * src/api/financial-api.ts): stored values are in USD, and the fetched rate
 * (`usd_fbr`) means "1 USD = rate <local currency>". So converting a stored
 * value to the local display currency MULTIPLIES by the rate, and saving back
 * divides by it. Displaying in USD is a no-op whatever the rate.
 *
 * When the rate has not loaded (or the fetch failed) the multiplier falls back
 * to 1 rather than guessing a number, so the screen shows unconverted values
 * and the FX strip says the rate is unavailable.
 */

import { type CurrencyCode } from "@/config/formats";

/** The currency stored values are denominated in. */
export const STORAGE_CURRENCY = "USD";

/** Normalize an FX rate; non-positive / non-finite rates fall back to 1. */
const safeRate = (fxRate: number): number =>
  Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1;

/**
 * Multiplier that converts a stored (USD) value into `display`.
 *   display === USD             → 1 (no conversion)
 *   display === local, rate ok  → rate
 *   anything else               → 1
 */
export const computeDisplayMultiplier = (
  display: string,
  local: string,
  fxRate: number | null | undefined,
): number => {
  const displayCode = (display || STORAGE_CURRENCY).toUpperCase();
  const localCode = (local || STORAGE_CURRENCY).toUpperCase();
  if (displayCode === STORAGE_CURRENCY) return 1;
  if (
    displayCode === localCode &&
    fxRate != null &&
    Number.isFinite(fxRate) &&
    fxRate > 0
  ) {
    return fxRate;
  }
  return 1;
};

/** stored (USD) -> display currency amount. */
export const toDisplayCurrency = (
  baseValue: number,
  currency: CurrencyCode,
  fxRate: number,
  localCurrency: string = currency,
): number =>
  baseValue * computeDisplayMultiplier(currency, localCurrency, fxRate);

/** display currency amount -> stored (USD). */
export const toBaseCurrency = (
  displayValue: number,
  currency: CurrencyCode,
  fxRate: number,
  localCurrency: string = currency,
): number =>
  displayValue /
  safeRate(computeDisplayMultiplier(currency, localCurrency, fxRate));
