import { STORAGE_CURRENCY } from "@/lib/currency-conversion";
import { fxBadge, fxErrorText, fxText } from "@/components/strip-styles";

type Props = {
  fxRate: string;
  /** The proposal's local currency — the non-USD side of the pair. */
  localCurrency: string | null;
  /** Live-rate fetch in flight. */
  loading?: boolean;
  /** Live-rate fetch failed; the widget falls back to 1:1. */
  error?: string | null;
};

/**
 * The FX strip. Mirrors the reference project: shown only for a non-USD local
 * currency (the caller decides that), and it states the rate in both
 * directions, or says plainly that the rate could not be loaded rather than
 * showing a guessed number.
 *
 * The pair is always local <-> USD, never local <-> the current toggle
 * selection. The rate describes the proposal's currency pair, which does not
 * change when the user flips the display toggle — quoting it against the
 * selection would render "1 GBP = 0.79 GBP" the moment the two coincide.
 */
export default function FxCard({
  fxRate,
  localCurrency,
  loading = false,
  error = null,
}: Props) {
  const local = (localCurrency ?? "").trim().toUpperCase() || STORAGE_CURRENCY;
  const rate = Number(fxRate);
  const valid = Number.isFinite(rate) && rate > 0;

  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <span style={fxBadge}>FX</span>
      {loading ? (
        <span style={fxText}>Loading rate…</span>
      ) : error || !valid ? (
        <span style={fxErrorText}>Rate unavailable — using 1:1</span>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}
        >
          <span style={fxText}>
            1 {local} = <span style={{ fontWeight: 700 }}>
              {(1 / rate).toFixed(2)}
            </span>{" "}
            {STORAGE_CURRENCY}
          </span>
          <span style={fxText}>
            1 {STORAGE_CURRENCY} ={" "}
            <span style={{ fontWeight: 700 }}>{rate.toFixed(2)}</span> {local}
          </span>
        </div>
      )}
    </div>
  );
}
