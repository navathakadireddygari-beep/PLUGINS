import { Fragment } from "react";
import BuyPlanCell from "@/components/BuyPlanCell";
import type { BuyPlanDataset } from "@/types";
import {
  CURRENCIES,
  formatBaseToDisplayed,
  formatBaseToEditable,
  formatPercent,
  parseDisplayedToBase,
  scaleDecimals,
  scaleDivisor,
  toDisplayCurrency,
  type MoneySettings,
} from "@/lib";
import { percentVariance } from "@/lib/variance";
import type { VarianceTone } from "@/types";

type Props = {
  dataset: BuyPlanDataset;
  /** Static table heading, e.g. "GSPC Proforma — Local Currency". */
  title: string;
  /** Static corner caption, e.g. "Local Currency". */
  caption: string;
  /**
   * The app-wide money settings (scale, number format, FX pair) with
   * `currency` pinned to THIS table's currency.
   */
  settings: MoneySettings;
  /** Buy Plan cells accept input (only in the table of the selected currency). */
  editable: boolean;
  /** Commit a Buy Plan cell in STORED units (USD thousands); null clears it. */
  onBuyPlanChange: (lineKey: string, bucket: string, amount: number | null) => void;
};

/** Percent cells: one decimal, as in the wireframe ("51.9%"). */
const PERCENT_CELL_DECIMALS = 1;

/**
 * Forecast − Buy Plan, run through the SAME conversion + scale + number format
 * as every other cell. A missing side counts as 0 (as the server's totals do);
 * a variance that rounds to zero at the current scale shows "—".
 */
function moneyVariance(
  forecast: number | null,
  buyPlan: number | null,
  settings: MoneySettings
): { text: string; tone: VarianceTone } {
  if (forecast === null && buyPlan === null) return { text: "—", tone: "flat" };
  const diff = (forecast ?? 0) - (buyPlan ?? 0);
  const shown =
    toDisplayCurrency(diff, settings.currency, settings.fxRate, settings.localCurrency) /
    scaleDivisor(settings.scale);
  const factor = 10 ** scaleDecimals(settings.scale);
  if (Math.round(shown * factor) === 0) return { text: "—", tone: "flat" };
  return { text: formatBaseToDisplayed(diff, settings), tone: diff < 0 ? "neg" : "pos" };
}

/**
 * Commit a typed Buy Plan value: parse it back to STORED units, ignore a no-op,
 * and pass null when the cell was cleared.
 */
function commitBuyPlan(
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

export default function BuyPlanTable({
  dataset,
  title,
  caption,
  settings,
  editable,
  onBuyPlanChange,
}: Props) {
  const { fiscalYears, groups } = dataset;
  const colCount = 1 + fiscalYears.length * 3;
  const symbol = CURRENCIES[settings.currency]?.symbol ?? settings.currency;
  const unit = `${symbol}${settings.scale}`;
  const lastIndex = fiscalYears.length - 1;
  // One grid per table; rows are numbered across groups so arrow keys run
  // straight through the whole table (and on into the next one).
  const gridId = `bp-${settings.currency}`;
  let rowIdx = 0;

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
                <th
                  key={fy}
                  colSpan={3}
                  className={`bp-th-fy${i === lastIndex ? "" : " bp-border-var"}`}
                >
                  {fy.toUpperCase()}
                </th>
              ))}
            </tr>
            <tr>
              <th className="bp-th-sub bp-th-sub--corner">{settings.currency}</th>
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
            {groups.map((group) => (
              <Fragment key={group.id}>
                <tr>
                  <td className="bp-group-header" colSpan={colCount}>
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => {
                  const r = rowIdx++;
                  const calculated = !!row.isCalculated;
                  return (
                    <tr key={row.key} className={`bp-row${calculated ? " bp-row--total" : ""}`}>
                      <td className="bp-row-label">
                        <div
                          title={row.label}
                          className={`bp-row-label-text${calculated ? " bp-row-label-text--calc" : ""}`}
                        >
                          {row.label}
                        </div>
                      </td>
                      {fiscalYears.map((fy, i) => {
                        const varTd = `bp-cell${i === lastIndex ? "" : " bp-border-var"}`;
                        const { forecast, buyPlan } = row.values[fy] ?? { forecast: null, buyPlan: null };
                        const col = i * 3;
                        const cell = (c: number, value: string, negative: boolean) => (
                          <BuyPlanCell
                            gridId={gridId}
                            row={r}
                            col={col + c}
                            value={value}
                            readOnly
                            calculated={calculated}
                            negative={negative}
                          />
                        );

                        if (row.kind === "percent") {
                          const variance = percentVariance(forecast, buyPlan);
                          return (
                            <Fragment key={fy}>
                              <td className="bp-cell">
                                {cell(0, formatPercent(forecast, settings.numberFormat, PERCENT_CELL_DECIMALS), (forecast ?? 0) < 0)}
                              </td>
                              <td className="bp-cell">
                                {cell(1, formatPercent(buyPlan, settings.numberFormat, PERCENT_CELL_DECIMALS), (buyPlan ?? 0) < 0)}
                              </td>
                              <td className={varTd}>{cell(2, variance.text, variance.tone === "neg")}</td>
                            </Fragment>
                          );
                        }

                        const variance = moneyVariance(forecast, buyPlan, settings);
                        const cellEditable = editable && row.editable;
                        return (
                          <Fragment key={fy}>
                            <td className="bp-cell">
                              {cell(0, formatBaseToDisplayed(forecast, settings), (forecast ?? 0) < 0)}
                            </td>
                            <td className="bp-cell">
                              {cellEditable ? (
                                <BuyPlanCell
                                  gridId={gridId}
                                  row={r}
                                  col={col + 1}
                                  value={formatBaseToDisplayed(buyPlan, settings)}
                                  editValue={formatBaseToEditable(buyPlan, settings)}
                                  negative={(buyPlan ?? 0) < 0}
                                  onCommit={(text) =>
                                    commitBuyPlan(text, buyPlan, settings, (value) =>
                                      onBuyPlanChange(row.key, fy, value)
                                    )
                                  }
                                />
                              ) : (
                                cell(1, formatBaseToDisplayed(buyPlan, settings), (buyPlan ?? 0) < 0)
                              )}
                            </td>
                            <td className={varTd}>{cell(2, variance.text, variance.tone === "neg")}</td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
