import { Fragment, useEffect, useState } from "react";
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

/** Negatives render #DC2626, as in FIN_EVAL/MA (`val < 0 ? "#DC2626" : …`). */
const negClass = (negative: boolean) => (negative ? " bp-cell--neg" : "");

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
 * Buy Plan input cell. Shows the grouped display value at rest and the plain
 * editable value while focused (MA's formatBaseToEditable); commits on blur /
 * Enter through parseDisplayedToBase, Esc reverts.
 */
function BuyPlanInput({
  base,
  settings,
  onCommit,
}: {
  base: number | null;
  settings: MoneySettings;
  onCommit: (value: number | null) => void;
}) {
  const shown = formatBaseToDisplayed(base, settings);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(shown);

  useEffect(() => {
    if (!editing) setText(shown);
  }, [shown, editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseDisplayedToBase(text, settings);
    if (parsed === "") {
      if (base !== null) onCommit(null);
      return;
    }
    const next = Number(parsed);
    if (!Number.isFinite(next)) return;
    if (base === null || Math.abs(next - base) > 1e-9) onCommit(next);
  };

  return (
    <input
      className="bp-cell-input"
      inputMode="decimal"
      value={text}
      onFocus={() => {
        setEditing(true);
        setText(formatBaseToEditable(base, settings));
      }}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setText(formatBaseToEditable(base, settings));
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
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
              <col key={`${fy}-f`} />,
              <col key={`${fy}-b`} />,
              <col key={`${fy}-v`} />,
            ])}
          </colgroup>
          <thead>
            <tr>
              <th className="bp-th-corner">
                {caption} — {unit}
              </th>
              {fiscalYears.map((fy) => (
                <th key={fy} colSpan={3} className="bp-th-fy">
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
                  <th className={`bp-th-sub bp-th-sub--var ${i === lastIndex ? "" : "bp-border-var"}`}>
                    VAR
                  </th>
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
                {group.rows.map((row) => (
                  <tr key={row.key} className={`bp-row ${row.isCalculated ? "bp-row--total" : ""}`}>
                    <td className="bp-row-label">{row.label}</td>
                    {fiscalYears.map((fy, i) => {
                      const varClass = `bp-cell${i === lastIndex ? "" : " bp-border-var"}`;
                      const { forecast, buyPlan } = row.values[fy] ?? { forecast: null, buyPlan: null };

                      if (row.kind === "percent") {
                        const variance = percentVariance(forecast, buyPlan);
                        return (
                          <Fragment key={fy}>
                            <td className={`bp-cell${negClass((forecast ?? 0) < 0)}`}>
                              {formatPercent(forecast, settings.numberFormat, PERCENT_CELL_DECIMALS)}
                            </td>
                            <td className={`bp-cell${negClass((buyPlan ?? 0) < 0)}`}>
                              {formatPercent(buyPlan, settings.numberFormat, PERCENT_CELL_DECIMALS)}
                            </td>
                            <td className={varClass + negClass(variance.tone === "neg")}>
                              {variance.text}
                            </td>
                          </Fragment>
                        );
                      }

                      const variance = moneyVariance(forecast, buyPlan, settings);
                      const cellEditable = editable && row.editable;
                      return (
                        <Fragment key={fy}>
                          <td className={`bp-cell${negClass((forecast ?? 0) < 0)}`}>
                            {formatBaseToDisplayed(forecast, settings)}
                          </td>
                          <td
                            className={`bp-cell${cellEditable ? " bp-cell--editable" : ""}${negClass((buyPlan ?? 0) < 0)}`}
                          >
                            {cellEditable ? (
                              <BuyPlanInput
                                base={buyPlan}
                                settings={settings}
                                onCommit={(value) => onBuyPlanChange(row.key, fy, value)}
                              />
                            ) : (
                              formatBaseToDisplayed(buyPlan, settings)
                            )}
                          </td>
                          <td className={varClass + negClass(variance.tone === "neg")}>
                            {variance.text}
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
