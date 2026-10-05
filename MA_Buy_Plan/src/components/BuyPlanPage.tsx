import { useCallback, useEffect, useMemo, useState } from "react";
import { useBuyPlan } from "@/hooks/useBuyPlan";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import { STORAGE_CURRENCY, type MoneySettings } from "@/lib";
import BuyPlanHeader from "@/components/BuyPlanHeader";
import BuyPlanToolbar from "@/components/BuyPlanToolbar";
import BuyPlanTable from "@/components/BuyPlanTable";
import Toast, { type ToastState } from "@/components/Toast";
import type { CurrencySide } from "@/types";

/** Static table headings (wireframe). */
const LOCAL_TABLE = { title: "GSPC Proforma — Local Currency", caption: "Local Currency" };
const USD_TABLE = { title: "GSPC Proforma — US$ at Actual Rates", caption: "US$ at Actual Rates" };

export default function BuyPlanPage() {
  const {
    dataset,
    newRows,
    loading,
    saving,
    error,
    dirty,
    savedAt,
    addRow,
    setRowDescription,
    setRowAmount,
    removeRow,
    save,
    discard,
  } = useBuyPlan();
  const { currency, localCurrency, settings, setProposalCurrencies } = useCurrencyFormat();

  // Hand the proposal's currency and FX rate (both from the Buy Plan GET) to
  // the shared context that drives the toolbar and the formatters.
  const header = dataset?.header;
  useEffect(() => {
    if (header) setProposalCurrencies(header.localCurrency, header.localCurrency, header.fxRate);
  }, [header?.localCurrency, header?.fxRate, setProposalCurrencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toast the save / load outcome, as FIN_EVAL/MA does.
  const [toast, setToast] = useState<ToastState>(null);
  const closeToast = useCallback(() => setToast(null), []);
  useEffect(() => {
    if (savedAt) setToast({ kind: "success", message: "Buy Plan saved successfully." });
  }, [savedAt]);
  useEffect(() => {
    if (error) setToast({ kind: "error", message: error });
  }, [error]);

  /**
   * One table per currency of the pair — local first, then US$ at actual rates
   * — each showing that currency's figures from the GET. A USD proposal has a
   * single table. New rows are typed into the table whose currency is selected
   * in the top bar; the other mirrors them, converted.
   */
  const tables = useMemo(() => {
    const local = (localCurrency ?? STORAGE_CURRENCY).toUpperCase();
    const pinned = (code: string): MoneySettings => ({ ...settings, currency: code });
    const list: Array<typeof LOCAL_TABLE & { side: CurrencySide; code: string; settings: MoneySettings }> = [];
    if (local !== STORAGE_CURRENCY) list.push({ ...LOCAL_TABLE, side: "local", code: local, settings: pinned(local) });
    list.push({ ...USD_TABLE, side: "usd", code: STORAGE_CURRENCY, settings: pinned(STORAGE_CURRENCY) });
    return list;
  }, [localCurrency, settings]);

  if (!dataset) {
    return (
      <div className="bp-page">
        <Toast toast={toast} onClose={closeToast} />
        <div className={`bp-status ${error ? "bp-status--error" : ""}`}>
          {error ?? (loading ? "Loading Buy Plan…" : "")}
        </div>
      </div>
    );
  }

  const editCurrency = (currency ?? STORAGE_CURRENCY).toUpperCase();

  return (
    <div className="bp-page">
      <Toast toast={toast} onClose={closeToast} />
      <BuyPlanHeader header={dataset.header} />
      <BuyPlanToolbar
        dirty={dirty}
        saving={saving}
        canSave={!loading}
        error={error}
        onSave={() => void save()}
        onDiscard={discard}
      />
      {tables.map((table) => (
        <BuyPlanTable
          key={table.code}
          dataset={dataset}
          newRows={newRows}
          side={table.side}
          title={table.title}
          caption={table.caption}
          settings={table.settings}
          editable={!saving && (tables.length === 1 || table.code === editCurrency)}
          onAddRow={addRow}
          onRowDescription={setRowDescription}
          onRowAmount={setRowAmount}
          onRemoveRow={removeRow}
        />
      ))}
    </div>
  );
}
