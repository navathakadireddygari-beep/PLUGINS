import CurrencyToggle from "@/components/CurrencyToggle";
import FxCard from "@/components/FxCard";
import DateFormatToolbar from "@/components/DateFormatToolbar";
import NumberFormatToolbar from "@/components/NumberFormatToolbar";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import { useSaveModel } from "@/context/SaveModelContext";
import { isHostReadonly } from "@/api";
import {
  stripCard,
  stripDivider,
  stripRow,
} from "@/components/strip-styles";

export default function Header() {
  // Single source of truth — shared with the table and every renderer.
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

  // Runs the save handler <FinancialEvaluation> registered (PUT financialEvaluation).
  const {
    requestSave,
    saving,
    error: saveError,
    ready,
    readonly,
  } = useSaveModel();
  // The grid publishes the resolved rule (host flag OR frozen proposal status);
  // fall back to the host flag alone before it has loaded.
  const isReadonly = readonly || isHostReadonly();

  return (
    <header className="mna:overflow-hidden mna:rounded-3xl mna:border mna:border-slate-200 mna:bg-white mna:shadow-sm">
      <div className="mna:flex mna:items-center mna:justify-end mna:border-b mna:border-slate-200 mna:bg-white mna:px-6 mna:py-4">
        <div className="mna:flex mna:flex-wrap mna:items-center mna:gap-2">
          {/* Back is always visible regardless of proposal status */}
          <button
            id="fin-eval-back-btn"
            type="button"
            className="mna:inline-flex mna:items-center mna:gap-1.5 mna:rounded mna:border mna:border-black/70 mna:bg-white mna:px-[14px] mna:py-2 mna:text-[13px] mna:font-semibold mna:text-black mna:transition"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          {!isReadonly && (
            <button
              id="fin-eval-export-btn"
              type="button"
              className="mna:inline-flex mna:items-center mna:gap-1.5 mna:rounded-md mna:border mna:border-black/70 mna:bg-white mna:px-[14px] mna:py-2 mna:text-[13px] mna:font-semibold mna:text-black mna:transition"
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
                <path d="M12 3v12" />
                <polyline points="7 10 12 15 17 10" />
                <path d="M4 19h16" />
              </svg>
              Export Template
            </button>
          )}
          {!isReadonly && (
            <button
              id="fin-eval-import-btn"
              type="button"
              className="mna:inline-flex mna:items-center mna:gap-1.5 mna:rounded-md mna:border mna:border-black/70 mna:bg-white mna:px-[14px] mna:py-2 mna:text-[13px] mna:font-semibold mna:text-black mna:transition"
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
                <path d="M12 21V9" />
                <polyline points="7 14 12 9 17 14" />
                <path d="M4 4h16" />
              </svg>
              Import Excel
            </button>
          )}
          {saveError && !saving && (
            <span
              className="mna:max-w-xs mna:truncate mna:text-sm mna:text-red-600"
              title={saveError}
            >
              {saveError}
            </span>
          )}
          {!isReadonly && (
            <button
              id="fin-eval-save-model-btn"
              type="button"
              className="mna:inline-flex mna:items-center mna:gap-1.5 mna:rounded-md mna:border mna:border-black/70 mna:bg-white mna:px-[18px] mna:py-2 mna:text-[13px] mna:font-bold mna:text-black mna:transition mna:disabled:cursor-not-allowed mna:disabled:opacity-70"
              onClick={requestSave}
              disabled={saving || !ready}
              title={ready ? undefined : "Nothing to save until the template loads"}
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
              {saving ? "Saving…" : "Save Model"}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar strip — one nowrap row that scrolls rather than wrapping,
          matching the reference project's layout and metrics exactly. */}
      <div className="mna:mx-6 mna:my-4" style={stripCard}>
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
          <div style={stripDivider} />
          <DateFormatToolbar />
          {showFx && (
            <FxCard
              fxRate={fxRate}
              localCurrency={localCurrency}
              loading={fxLoading}
              error={fxError}
            />
          )}
        </div>
      </div>
    </header>
  );
}
