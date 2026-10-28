import { useCallback, useEffect, useMemo, useState } from "react";
import { useBuyPlan } from "@/hooks/useBuyPlan";
import {
  acquisitionDateToIso,
  financialEvaluationPath,
  formatAcquisitionDate,
  updateActualAcquisitionDate,
} from "@/api/buy-plan-api";
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

  const header = dataset?.header;

  // Actual Acquisition Date: "dd-Mon-yyyy" as edited, and as last loaded/saved.
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [savedAcquisitionDate, setSavedAcquisitionDate] = useState("");
  const [dateSaving, setDateSaving] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  useEffect(() => {
    if (!header) return;
    const formatted = formatAcquisitionDate(header.actualAcquisitionDate);
    const value = formatted === "—" ? "" : formatted;
    setAcquisitionDate(value);
    setSavedAcquisitionDate(value);
  }, [header?.actualAcquisitionDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const dateDirty = acquisitionDate !== savedAcquisitionDate;

  // Hand the proposal's currency and FX rate (both from the Buy Plan GET) to
  // the shared context that drives the toolbar and the formatters.
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

  /** One Save for both the new Buy Plan rows and the Actual Acquisition Date. */
  const saveAll = useCallback(async () => {
    if (!dataset || saving || dateSaving) return;
    setDateError(null);
    try {
      if (dirty) await save();
      if (dateDirty) {
        const finEvalHeaderId = dataset.header.finEvalHeaderId;
        const isoDate = acquisitionDateToIso(acquisitionDate);
        const payload = { fin_eval_header_id: finEvalHeaderId ?? null, actual_acquisition_date: isoDate };
        console.log("[Actual Acquisition Date] SAVE CLICKED");
        console.log("[Actual Acquisition Date] PUT URL:", financialEvaluationPath(dataset.header.proposalId ?? ""));
        console.log("[Actual Acquisition Date] Request Payload:", payload);
        console.log("[Actual Acquisition Date] Request Body JSON:", JSON.stringify(payload));
        if (finEvalHeaderId == null) throw new Error("fin_eval_header_id is missing from the Buy Plan response.");
        if (acquisitionDate && isoDate == null) throw new Error("Actual Acquisition Date is invalid.");
        setDateSaving(true);
        await updateActualAcquisitionDate(dataset.header.proposalId ?? "", finEvalHeaderId, isoDate);
        setSavedAcquisitionDate(acquisitionDate);
      }
      setToast({ kind: "success", message: "Buy Plan saved successfully." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save Buy Plan.";
      setDateError(message);
      setToast({ kind: "error", message });
    } finally {
      setDateSaving(false);
    }
  }, [dataset, saving, dateSaving, dirty, save, dateDirty, acquisitionDate]);

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
  const isSaving = saving || dateSaving;
  const saveError = dateError || error;

  return (
    <div className="bp-page">
      <Toast toast={toast} onClose={closeToast} />
      <BuyPlanHeader
        header={dataset.header}
        dirty={dirty || dateDirty}
        saving={isSaving}
        canSave={!loading}
        onSave={() => void saveAll()}
      />
      <BuyPlanToolbar
        dirty={dirty}
        saving={isSaving}
        error={saveError}
        onDiscard={() => {
          discard();
          setAcquisitionDate(savedAcquisitionDate);
          setDateError(null);
        }}
        actualAcquisitionDate={acquisitionDate}
        onActualAcquisitionDateChange={setAcquisitionDate}
        dateDirty={dateDirty}
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
          editable={!isSaving && (tables.length === 1 || table.code === editCurrency)}
          onAddRow={addRow}
          onRowDescription={setRowDescription}
          onRowAmount={setRowAmount}
          onRemoveRow={removeRow}
        />
      ))}
    </div>
  );
}
