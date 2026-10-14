import CurrencyToggle from "@/components/CurrencyToggle";
import FxCard from "@/components/FxCard";
import NumberFormatToolbar from "@/components/NumberFormatToolbar";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import { stripCard, stripDivider, stripRow } from "@/components/strip-styles";

type Props = {
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
};

/**
 * The top bar, copied from FIN_EVAL/MA's <Header>: an action row (Save), then
 * the toolbar strip — currency toggle, scale toggle, number format and the FX
 * card — all reading/writing the shared CurrencyFormatContext, so every table
 * cell re-renders through the same conversion.
 */
export default function BuyPlanToolbar({
  dirty,
  saving,
  canSave,
  error,
  onSave,
  onDiscard,
}: Props) {
  const {
    currency,
    setCurrency,
    scale,
    setScale,
    fxRate,
    currencies,
    localCurrency,
    showFx,
    fxLoading,
    fxError,
  } = useCurrencyFormat();

  return (
    <header className="bp-topbar">
      <div className="bp-topbar-actions">
        {error && !saving && (
          <span className="bp-status bp-status--error" title={error}>
            {error}
          </span>
        )}
        {dirty && (
          <button type="button" className="bp-btn" onClick={onDiscard} disabled={saving}>
            Discard
          </button>
        )}
        <button
          type="button"
          className="bp-btn bp-btn--save"
          onClick={onSave}
          disabled={!canSave || !dirty || saving}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {saving ? "Saving…" : "Save Buy Plan"}
        </button>
      </div>

      <div className="bp-topbar-strip" style={stripCard}>
        <div style={stripRow}>
          <CurrencyToggle
            currency={currency}
            setCurrency={setCurrency}
            scale={scale}
            setScale={setScale}
            currencies={currencies}
            localCurrency={localCurrency}
          />
          <div style={stripDivider} />
          <NumberFormatToolbar />
          {showFx && (
            <FxCard fxRate={fxRate} localCurrency={localCurrency} loading={fxLoading} error={fxError} />
          )}
        </div>
      </div>
    </header>
  );
}
