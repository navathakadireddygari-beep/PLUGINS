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

  // Validate → PUT finEvaluationStaging; Save Model → POST finEvalStagingMigrate.
  // Both handlers are registered by <FinancialEvaluation>.
  const {
    requestSave,
    requestMigrate,
    saving,
    migrating,
    issueCount,
    error: saveError,
    ready,
    readonly,
  } = useSaveModel();
  const busy = saving || migrating;
  // The grid publishes the resolved rule (host flag OR frozen proposal status);
  // fall back to the host flag alone before it has loaded.
  const isReadonly = readonly || isHostReadonly();

  return (
    <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-end border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Back is always visible regardless of proposal status */}
          <button
            id="fin-eval-back-btn"
            type="button"
            className="inline-flex items-center gap-1.5 rounded border border-black/70 bg-white px-[14px] py-2 text-[13px] font-semibold text-black transition"
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
          {saveError && !saving && !migrating && (
            <span
              className="max-w-xs truncate text-sm text-red-600"
              title={saveError}
            >
              {saveError}
            </span>
          )}
          {!isReadonly && (
            <button
              id="fin-eval-validate-btn"
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-black/70 bg-white px-[14px] py-2 text-[13px] font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-70"
              onClick={requestSave}
              disabled={busy || !ready}
              title={
                issueCount > 0
                  ? `${issueCount} validation issue${issueCount > 1 ? "s" : ""}`
                  : ready
                    ? undefined
                    : "Nothing to validate until the staged data loads"
              }
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {saving ? "Validating…" : "Validate"}
              {!saving && issueCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-extrabold text-white">
                  {issueCount}
                </span>
              )}
            </button>
          )}
          {!isReadonly && (
            <button
              id="fin-eval-save-model-btn"
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-black/70 bg-white px-[18px] py-2 text-[13px] font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-70"
              onClick={requestMigrate}
              disabled={busy || !ready}
              title={ready ? undefined : "Nothing to save until the staged data loads"}
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
              {migrating ? "Saving…" : "Save Model"}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar strip — one nowrap row that scrolls rather than wrapping,
          matching the reference project's layout and metrics exactly. */}
      <div className="mx-6 my-4" style={stripCard}>
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
