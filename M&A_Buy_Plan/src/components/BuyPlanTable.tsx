import { Fragment } from "react";
import BuyPlanCell from "@/components/BuyPlanCell";
import type {
  BuyPlanDataset,
  BuyPlanSectionView,
  CurrencySide,
  Figures,
  NewBuyPlanRow,
  VarianceTone,
} from "@/types";
import {
  CURRENCIES,
  computeDisplayMultiplier,
  formatBaseToDisplayed,
  formatBaseToEditable,
  formatPercent,
  parseDisplayedToBase,
  scaleDecimals,
  scaleDivisor,
  type MoneySettings,
} from "@/lib";
import { percentVariance } from "@/lib/variance";

type Props = {
  dataset: BuyPlanDataset;
  /** Unsaved "+ Add Row" rows, all sections. */
  newRows: NewBuyPlanRow[];
  /** Which of the GET's value sets this table shows. */
  side: CurrencySide;
  /** Static table heading, e.g. "GSPC Proforma — Local Currency". */
  title: string;
  /** Static corner caption, e.g. "Local Currency". */
  caption: string;
  /**
   * The app-wide money settings (scale, number format, FX pair) with
   * `currency` pinned to THIS table's currency.
   */
  settings: MoneySettings;
  /** New rows can be added / typed into here (the selected currency's table). */
  editable: boolean;
  onAddRow: (sectionCode: string) => void;
  onRowDescription: (key: string, description: string) => void;
  /** Commit a new row's amount in USD; null clears it. */
  onRowAmount: (key: string, fy: string, amount: number | null) => void;
  onRemoveRow: (key: string) => void;
};

/** Percent cells: one decimal, as in the wireframe ("51.9%"). */
const PERCENT_CELL_DECIMALS = 1;

const EMPTY: Figures = { forecast: null, buyPlan: null, variance: null };

/** Variance as the server computes it: forecast − buy plan, none without a forecast. */
const varianceOf = (forecast: number | null, buyPlan: number | null): number | null =>
  forecast === null || forecast === 0 ? null : forecast - (buyPlan ?? 0);

/** "30 Sep 2025" -> "30 SEPTEMBER", as the wireframe's year-end caption. */
const yearEndCaption = (value: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : `${d.getDate()} ${d.toLocaleString("en-GB", { month: "long" })}`.toUpperCase();
};

/**
 * Commit a typed amount: parse it back to USD, ignore a no-op, and pass null
 * when the cell was cleared.
 */
function commitAmount(
  text: string,
  base: number | null,
  settings: MoneySettings,
  onCommit: (value: number | null) => void
) {
  const parsed = parseDisplayedToBase(text, settings);
  if (parsed === "") {
    if (base !== null) onCommit(null);
    return;
  }
  const next = Number(parsed);
  if (!Number.isFinite(next)) return;
  if (base === null || Math.abs(next - base) > 1e-9) onCommit(next);
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function BuyPlanTable({
  dataset,
  newRows,
  side,
  title,
  caption,
  settings,
  editable,
  onAddRow,
  onRowDescription,
  onRowAmount,
  onRemoveRow,
}: Props) {
  const { fiscalYears, sections, header } = dataset;
  const colCount = 1 + fiscalYears.length * 3;
  const symbol = CURRENCIES[settings.currency]?.symbol ?? settings.currency;
  const unit = `${symbol}${settings.scale}`;
  const lastIndex = fiscalYears.length - 1;
  const gridId = `bp-${side}`;
  let rowIdx = 0;

  // Server figures are already in this table's currency, so they are only
  // scaled and formatted — never FX-converted.
  const plain: MoneySettings = { ...settings, fxRate: 1 };
  // New-row amounts are USD; this converts them into this table's currency.
  const fx = computeDisplayMultiplier(settings.currency, settings.localCurrency, settings.fxRate);

  const money = (value: number | null) => formatBaseToDisplayed(value, plain);

  /** A variance in this table's currency; "—" when absent or zero at this scale. */
  const varianceCell = (value: number | null): { text: string; tone: VarianceTone } => {
    if (value === null) return { text: "—", tone: "flat" };
    const factor = 10 ** scaleDecimals(settings.scale);
    if (Math.round((value / scaleDivisor(settings.scale)) * factor) === 0) return { text: "—", tone: "flat" };
    return { text: money(value), tone: value < 0 ? "neg" : "pos" };
  };

  const rowsOf = (code: string) => newRows.filter((r) => r.sectionCode === code);

  /** The section's figures with its new rows' amounts added to the Buy Plan. */
  const totalOf = (section: BuyPlanSectionView | undefined, fy: string): Figures => {
    if (!section) return EMPTY;
    const base = section.values[side][fy] ?? EMPTY;
    const added = rowsOf(section.code).reduce((sum, r) => sum + (r.amounts[fy] ?? 0) * fx, 0);
    const buyPlan = base.buyPlan === null && added === 0 ? null : (base.buyPlan ?? 0) + added;
    return { forecast: base.forecast, buyPlan, variance: varianceOf(base.forecast, buyPlan) };
  };

  const revenue = sections.find((s) => s.code === "REVENUE");
  const marginOf = (ebit: number | null, rev: number | null) =>
    ebit === null || !rev ? null : (ebit / rev) * 100;

  const readOnlyCell = (r: number, c: number, value: string, negative: boolean, calculated = false) => (
    <BuyPlanCell gridId={gridId} row={r} col={c} value={value} readOnly calculated={calculated} negative={negative} />
  );

  const varClass = (i: number) => `bp-cell${i === lastIndex ? "" : " bp-border-var"}`;

  /** A locked row of money figures: the server's section row, or the total. */
  const figuresRow = (key: string, label: string, figures: (fy: string) => Figures, calculated: boolean) => {
    const r = rowIdx++;
    return (
      <tr key={key} className={`bp-row bp-row--locked${calculated ? " bp-row--total" : ""}`}>
        <td className="bp-row-label">
          <div title={label} className={`bp-row-label-text${calculated ? " bp-row-label-text--calc" : ""}`}>
            {label}
          </div>
        </td>
        {fiscalYears.map((fy, i) => {
          const { forecast, buyPlan, variance } = figures(fy);
          const v = varianceCell(variance);
          return (
            <Fragment key={fy}>
              <td className="bp-cell">{readOnlyCell(r, i * 3, money(forecast), (forecast ?? 0) < 0, calculated)}</td>
              <td className="bp-cell">{readOnlyCell(r, i * 3 + 1, money(buyPlan), (buyPlan ?? 0) < 0, calculated)}</td>
              <td className={varClass(i)}>{readOnlyCell(r, i * 3 + 2, v.text, v.tone === "neg", calculated)}</td>
            </Fragment>
          );
        })}
      </tr>
    );
  };

  /** A row the user added: only its description and Buy Plan amounts are editable. */
  const newRow = (row: NewBuyPlanRow) => {
    const r = rowIdx++;
    return (
      <tr key={row.key} className="bp-row bp-row--new">
        <td className="bp-row-label">
          <div className="bp-row-label-edit">
            {editable ? (
              <input
                className="bp-row-label-input"
                value={row.description}
                placeholder="New row label..."
                title={row.description}
                onChange={(e) => onRowDescription(row.key, e.target.value)}
              />
            ) : (
              <div title={row.description} className="bp-row-label-text bp-row-label-text--custom">
                {row.description || "—"}
              </div>
            )}
            {editable && (
              <button
                type="button"
                className="bp-row-delete"
                onClick={() => onRemoveRow(row.key)}
                aria-label="Remove row"
                title="Remove row"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </td>
        {fiscalYears.map((fy, i) => {
          const amount = row.amounts[fy] ?? null;
          return (
            <Fragment key={fy}>
              <td className="bp-cell">{readOnlyCell(r, i * 3, "", false)}</td>
              <td className="bp-cell">
                <BuyPlanCell
                  gridId={gridId}
                  row={r}
                  col={i * 3 + 1}
                  value={formatBaseToDisplayed(amount, settings)}
                  editValue={formatBaseToEditable(amount, settings)}
                  readOnly={!editable}
                  negative={(amount ?? 0) < 0}
                  onCommit={(text) => commitAmount(text, amount, settings, (value) => onRowAmount(row.key, fy, value))}
                />
              </td>
              {/* No forecast to compare against, so no variance. */}
              <td className={varClass(i)}>{readOnlyCell(r, i * 3 + 2, "", false)}</td>
            </Fragment>
          );
        })}
      </tr>
    );
  };

  /** EBIT Margin % — EBIT over Revenue, each side including any new rows. */
  const marginRow = (ebit: BuyPlanSectionView) => {
    const r = rowIdx++;
    return (
      <tr key={`${ebit.code}-margin`} className="bp-row bp-row--locked bp-row--total">
        <td className="bp-row-label">
          <div className="bp-row-label-text bp-row-label-text--calc">EBIT Margin %</div>
        </td>
        {fiscalYears.map((fy, i) => {
          const e = totalOf(ebit, fy);
          const rev = totalOf(revenue, fy);
          const forecast = marginOf(e.forecast, rev.forecast);
          const buyPlan = marginOf(e.buyPlan, rev.buyPlan);
          const v = percentVariance(forecast, buyPlan);
          const pct = (n: number | null) => formatPercent(n, settings.numberFormat, PERCENT_CELL_DECIMALS);
          return (
            <Fragment key={fy}>
              <td className="bp-cell">{readOnlyCell(r, i * 3, pct(forecast), (forecast ?? 0) < 0, true)}</td>
              <td className="bp-cell">{readOnlyCell(r, i * 3 + 1, pct(buyPlan), (buyPlan ?? 0) < 0, true)}</td>
              <td className={varClass(i)}>{readOnlyCell(r, i * 3 + 2, v.text, v.tone === "neg", true)}</td>
            </Fragment>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="bp-table-card">
      <div className="bp-table-title">
        {title} ({unit})
      </div>
      <div className="bp-table-scroll">
        <table className="bp-table">
          <colgroup>
            <col className="bp-col-label" />
            {fiscalYears.flatMap((fy) => [
              <col key={`${fy}-f`} className="bp-col-value" />,
              <col key={`${fy}-b`} className="bp-col-value" />,
              <col key={`${fy}-v`} className="bp-col-value" />,
            ])}
          </colgroup>
          <thead>
            <tr>
              <th className="bp-th-corner">
                {caption} — {unit}
              </th>
              {fiscalYears.map((fy, i) => (
                <th key={fy} colSpan={3} className={`bp-th-fy${i === lastIndex ? "" : " bp-border-var"}`}>
                  {fy.toUpperCase()}
                </th>
              ))}
            </tr>
            <tr>
              <th className="bp-th-sub bp-th-sub--corner">
                {yearEndCaption(header.targetYearEnd) ?? settings.currency}
              </th>
              {fiscalYears.map((fy, i) => (
                <Fragment key={fy}>
                  <th className="bp-th-sub">FORECAST</th>
                  <th className="bp-th-sub">BUY PLAN</th>
                  <th className={`bp-th-sub${i === lastIndex ? "" : " bp-border-var"}`}>VAR</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const added = rowsOf(section.code);
              return (
                <Fragment key={section.code}>
                  <tr>
                    <td className="bp-group-header" colSpan={colCount}>
                      {section.label}
                    </td>
                  </tr>
                  {figuresRow(section.code, section.label, (fy) => section.values[side][fy] ?? EMPTY, false)}
                  {added.map(newRow)}
                  {added.length > 0 &&
                    figuresRow(`${section.code}-total`, "Proforma Total", (fy) => totalOf(section, fy), true)}
                  {section.code === "EBIT" && marginRow(section)}
                  {editable && (
                    <tr className="bp-row">
                      <td colSpan={colCount} className="bp-add-row-cell">
                        <button type="button" className="bp-add-row" onClick={() => onAddRow(section.code)}>
                          + Add Row
                        </button>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
