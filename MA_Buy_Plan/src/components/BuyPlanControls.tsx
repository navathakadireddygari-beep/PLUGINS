import { useEffect, useState, type ReactNode } from "react";
import type { CurrencyCode, ScaleId } from "@/types";
import { SCALES } from "@/lib/scale";
import { currencySymbol } from "@/lib/currency-conversion";
import type { RateSource } from "@/hooks/useExchangeRate";

type Props = {
  localCurrency: CurrencyCode;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  scale: ScaleId;
  setScale: (s: ScaleId) => void;
  rate: number;
  rateSource: RateSource;
  rateLoading: boolean;
  rateError: string | null;
  onRefreshRate: () => void;
  onManualRate: (value: number) => void;
  /** Right-aligned slot (Save / Discard). */
  actions?: ReactNode;
};

const RATE_SOURCE_LABEL: Record<RateSource, string> = {
  live: "Live rate",
  manual: "Manual rate",
  fallback: "Fallback rate",
};

export default function BuyPlanControls({
  localCurrency,
  currency,
  setCurrency,
  scale,
  setScale,
  rate,
  rateSource,
  rateLoading,
  rateError,
  onRefreshRate,
  onManualRate,
  actions,
}: Props) {
  // Local text buffer so typing a rate doesn't fight the formatted prop value.
  const [rateText, setRateText] = useState(rate.toFixed(4));
  useEffect(() => setRateText(rate.toFixed(4)), [rate]);

  // Local currency and USD; a USD proposal has just the one.
  const currencyOptions = [...new Set([localCurrency, "USD"])];
  const converting = currency === "USD" && localCurrency !== "USD";

  return (
    <div className="bp-controls-card">
      <div className="bp-controls-row">
        <div className="bp-control-group">
          <span className="bp-control-label">Currency</span>
          <div className="bp-toggle">
            {currencyOptions.map((code) => (
              <button
                key={code}
                type="button"
                className={code === currency ? "active" : ""}
                onClick={() => setCurrency(code)}
              >
                {currencySymbol(code).trim()} {code}
              </button>
            ))}
          </div>
        </div>
        <div className="bp-control-group">
          <span className="bp-control-label">Scale</span>
          <div className="bp-toggle">
            {SCALES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={opt.id === scale ? "active" : ""}
                onClick={() => setScale(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {converting && (
          <div className="bp-control-group bp-fx-group">
            <span className="bp-control-label">FX Rate</span>
            <span className="bp-fx-fixed">1 USD =</span>
            <input
              className="bp-fx-input"
              value={rateText}
              disabled={rateLoading}
              onChange={(e) => setRateText(e.target.value)}
              onBlur={() => onManualRate(Number(rateText))}
            />
            <span className="bp-fx-fixed">{localCurrency}</span>
            <button
              type="button"
              className="bp-fx-refresh"
              onClick={onRefreshRate}
              disabled={rateLoading}
              title="Refetch the live rate"
            >
              {rateLoading ? "…" : "⟳"}
            </button>
            <span className={`bp-fx-status bp-fx-status--${rateSource}`}>
              {rateLoading ? "Fetching live rate…" : RATE_SOURCE_LABEL[rateSource]}
              {rateError && !rateLoading ? " — live fetch failed" : ""}
            </span>
          </div>
        )}
        {actions && <div className="bp-actions">{actions}</div>}
      </div>
    </div>
  );
}
