import { useState } from "react";
import { SCALES, currencyLabel } from "@/lib";
import type { CurrencyCode, ScaleId } from "@/lib";
import {
  infoDot,
  infoTip,
  stripDivider,
  stripLabel,
  toggleBtn,
  toggleGroup,
} from "@/components/strip-styles";

type Props = {
  /** Active display currency, or null while the proposal has not stated one. */
  currency: CurrencyCode | null;
  setCurrency: (c: CurrencyCode) => void;
  scale: ScaleId;
  setScale: (s: ScaleId) => void;
  /**
   * Codes to offer — derived from the proposal's local currency. EMPTY while
   * that is unknown, in which case the currency group is not rendered at all.
   */
  currencies: CurrencyCode[];
  /** The proposal's local currency, named in the info tooltip. */
  localCurrency: string | null;
};

const scaleOptions = SCALES.map((s) => ({ id: s.id, label: s.label }));

/** "i" hint icon with a dark hover tooltip, reused after each toggle group. */
function InfoDot({ label, tip }: { label: string; tip: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span style={infoDot} aria-label={label}>
        i
      </span>
      {open && <span style={infoTip}>{tip}</span>}
    </div>
  );
}

export default function CurrencyToggle({
  currency,
  setCurrency,
  scale,
  setScale,
  currencies,
  localCurrency,
}: Props) {
  const local = (localCurrency ?? "").trim().toUpperCase();
  const currencyOptions = currencies.map((code) => ({
    id: code,
    label: currencyLabel(code),
  }));
  // Nothing to offer means the proposal has not told us its currency yet (still
  // loading, or the fetch failed). Render no currency control rather than a
  // guessed one — a "$ USD" button here is indistinguishable from a real USD
  // proposal and silently hides a failed load.
  const currencyKnown = currencyOptions.length > 0 && !!currency;
  return (
    <>
      {currencyKnown && (
        <>
          <span style={stripLabel}>CURRENCY</span>
          <div style={toggleGroup}>
            {currencyOptions.map((option, i) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCurrency(option.id)}
                style={toggleBtn(currency === option.id, i === 0)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <InfoDot
            label="Currency info"
            tip={`Local Currency is ${local} — all values are displayed in ${currency}. Change Local Currency in Proposal Section to enable a USD/local toggle.`}
          />
          <div style={stripDivider} />
        </>
      )}

      <span style={stripLabel}>SCALE</span>
      <div style={toggleGroup}>
        {scaleOptions.map((option, i) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setScale(option.id)}
            style={toggleBtn(scale === option.id, i === 0)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <InfoDot
        label="Scale info"
        tip="Switch the denomination for all financial values. Values arrive in thousands: K = thousands (as-is), M = millions (÷1,000), B = billions (÷1,000,000)."
      />
    </>
  );
}
