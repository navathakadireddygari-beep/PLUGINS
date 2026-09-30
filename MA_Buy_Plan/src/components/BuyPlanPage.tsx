import { useEffect, useMemo } from "react";
import { useBuyPlan } from "@/hooks/useBuyPlan";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import { STORAGE_CURRENCY, type MoneySettings } from "@/lib";
import BuyPlanHeader from "@/components/BuyPlanHeader";
import BuyPlanToolbar from "@/components/BuyPlanToolbar";
import BuyPlanTable from "@/components/BuyPlanTable";

/** Static table headings (wireframe). */
const LOCAL_TABLE = { title: "GSPC Proforma — Local Currency", caption: "Local Currency" };
const USD_TABLE = { title: "GSPC Proforma — US$ at Actual Rates", caption: "US$ at Actual Rates" };

export default function BuyPlanPage() {
  const { dataset, loading, saving, error, dirty, savedAt, setBuyPlan, save, discard } = useBuyPlan();
  const { currency, localCurrency, settings, setProposalCurrencies } = useCurrencyFormat();

  // Hand the proposal's currencies (and its stored rate) to the shared
  // context, exactly as FIN_EVAL/MA does once its GET lands.
  const header = dataset?.header;
  useEffect(() => {
    if (header) setProposalCurrencies(header.localCurrency, header.displayCurrency, header.exchangeRate);
  }, [header?.localCurrency, header?.displayCurrency, header?.exchangeRate, setProposalCurrencies]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * One table per currency of the pair — local first, then US$ at actual rates
   * — each rendered through the same settings with only `currency` pinned. A
   * USD proposal has a single table. Buy Plan is typed into the table whose
   * currency is selected in the top bar; the other mirrors it, converted.
   */
  const tables = useMemo(() => {
    const local = (localCurrency ?? STORAGE_CURRENCY).toUpperCase();
    const pinned = (code: string): MoneySettings => ({ ...settings, currency: code });
    const list = [];
    if (local !== STORAGE_CURRENCY) list.push({ ...LOCAL_TABLE, code: local, settings: pinned(local) });
    list.push({ ...USD_TABLE, code: STORAGE_CURRENCY, settings: pinned(STORAGE_CURRENCY) });
    return list;
  }, [localCurrency, settings]);

  if (!dataset) {
    return (
      <div className="bp-page">
        <div className={`bp-status ${error ? "bp-status--error" : ""}`}>
          {error ?? (loading ? "Loading Buy Plan…" : "")}
        </div>
      </div>
    );
  }

  const editCurrency = (currency ?? STORAGE_CURRENCY).toUpperCase();

  return (
    <div className="bp-page">
      <BuyPlanHeader header={dataset.header} />
      <BuyPlanToolbar
        dirty={dirty}
        saving={saving}
        canSave={!loading}
        error={error}
        saved={savedAt !== null}
        onSave={() => void save()}
        onDiscard={discard}
      />
      {tables.map((table) => (
        <BuyPlanTable
          key={table.code}
          dataset={dataset}
          title={table.title}
          caption={table.caption}
          settings={table.settings}
          editable={!saving && (tables.length === 1 || table.code === editCurrency)}
          onBuyPlanChange={setBuyPlan}
        />
      ))}
    </div>
  );
}
