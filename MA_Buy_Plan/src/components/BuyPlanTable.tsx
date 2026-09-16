import { Fragment, useState } from "react";
import {
  FISCAL_YEARS,
  type BuyPlanDataset,
  type BuyPlanGroup,
  type CurrencyCode,
  type MoneyRow,
  type ScaleId,
} from "@/types";
import { PROPOSAL_META } from "@/config/proposal-meta";
import { applyScale, scaleMeta } from "@/lib/scale";
import { toDisplayCurrency } from "@/lib/currency-conversion";
import { formatMoney, formatPercent, moneyVariance, TONE_COLOR } from "@/lib/format";

let newRowSeq = 0;

function emptyMoneyRow(): MoneyRow {
  newRowSeq += 1;
  const values = {} as MoneyRow["values"];
  FISCAL_YEARS.forEach((fy) => {
    values[fy] = { forecast: 0, buyPlan: 0 };
  });
  return { kind: "money", id: `custom-${newRowSeq}`, label: "New Line", values };
}

const COL_COUNT = 1 + FISCAL_YEARS.length * 3;

const TABLE_TITLE: Record<CurrencyCode, string> = {
  EUR: "GSPC Proforma — Local Currency (€m)",
  USD: "GSPC Proforma — US$ at Actual Rates ($m)",
};
const UNIT_LABEL: Record<CurrencyCode, string> = {
  EUR: "Local Currency — €m",
  USD: "US$ at Actual Rates — $m",
};

type Props = {
  dataset: BuyPlanDataset;
  scale: ScaleId;
  currency: CurrencyCode;
  /** "1 USD = rate EUR" — only used to convert when `currency` is USD. */
  rate: number;
};

export default function BuyPlanTable({ dataset, scale, currency, rate }: Props) {
  const [groups, setGroups] = useState<BuyPlanGroup[]>(dataset.groups);
  const decimals = scaleMeta(scale).decimals;

  function addRow(groupId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, rows: [...g.rows, emptyMoneyRow()] } : g
      )
    );
  }

  function renameRow(groupId: string, rowId: string, label: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : { ...g, rows: g.rows.map((r) => (r.id === rowId ? { ...r, label } : r)) }
      )
    );
  }

  return (
    <div className="bp-table-card">
      <div className="bp-table-title">{TABLE_TITLE[currency]}</div>
      <div className="bp-table-scroll">
        <table className="bp-table">
          <colgroup>
            <col className="bp-col-label" />
            {FISCAL_YEARS.flatMap((fy) => [
              <col key={`${fy}-f`} />,
              <col key={`${fy}-b`} />,
              <col key={`${fy}-v`} />,
            ])}
          </colgroup>
          <thead>
            <tr>
              <th className="bp-th-corner">{UNIT_LABEL[currency]}</th>
              {FISCAL_YEARS.map((fy) => (
                <th key={fy} colSpan={3} className="bp-th-fy">
                  {fy}
                </th>
              ))}
            </tr>
            <tr>
              <th className="bp-th-sub bp-th-sub--corner">{PROPOSAL_META.yearEnd}</th>
              {FISCAL_YEARS.map((fy, i) => {
                const isLastYear = i === FISCAL_YEARS.length - 1;
                return (
                  <Fragment key={fy}>
                    <th className="bp-th-sub">FORECAST</th>
                    <th className="bp-th-sub">Buy Plan</th>
                    <th className={`bp-th-sub bp-th-sub--var ${isLastYear ? "" : "bp-border-var"}`}>
                      Var
                    </th>
                  </Fragment>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.id}>
                <tr>
                  <td className="bp-group-header" colSpan={COL_COUNT}>
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id} className="bp-row">
                    <td
                      className="bp-row-label"
                      style={
                        row.kind === "money" && row.isTotal
                          ? { fontWeight: 700, color: "#1A2B4B" }
                          : row.kind === "percent"
                            ? { fontWeight: 700, color: "#1A2B4B" }
                            : undefined
                      }
                    >
                      {row.id.startsWith("custom-") ? (
                        <input
                          className="bp-row-label-input"
                          value={row.label}
                          onChange={(e) => renameRow(group.id, row.id, e.target.value)}
                        />
                      ) : (
                        row.label
                      )}
                    </td>
                    {FISCAL_YEARS.map((fy, i) => {
                      const isLastYear = i === FISCAL_YEARS.length - 1;
                      const varClass = `bp-cell bp-cell--var ${isLastYear ? "" : "bp-border-var"}`;

                      if (row.kind === "money") {
                        const { forecast, buyPlan } = row.values[fy];
                        const displayForecast = applyScale(
                          toDisplayCurrency(forecast, currency, rate),
                          scale
                        );
                        const displayBuyPlan = applyScale(
                          toDisplayCurrency(buyPlan, currency, rate),
                          scale
                        );
                        const variance = moneyVariance(displayForecast, displayBuyPlan, decimals);
                        return (
                          <Fragment key={fy}>
                            <td className="bp-cell bp-cell--forecast">
                              {formatMoney(displayForecast, decimals)}
                            </td>
                            <td className="bp-cell bp-cell--buyplan">
                              {formatMoney(displayBuyPlan, decimals)}
                            </td>
                            <td className={varClass} style={{ color: TONE_COLOR[variance.tone] }}>
                              {variance.text}
                            </td>
                          </Fragment>
                        );
                      }

                      const p = row.values[fy];
                      return (
                        <Fragment key={fy}>
                          <td className="bp-cell bp-cell--forecast bp-cell--pct">
                            {formatPercent(p.forecast)}
                          </td>
                          <td className="bp-cell bp-cell--buyplan bp-cell--pct">
                            {formatPercent(p.buyPlan)}
                          </td>
                          <td className={varClass} style={{ color: TONE_COLOR[p.varianceTone] }}>
                            {p.varianceLabel}
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                ))}
                {group.allowAddRow && (
                  <tr className="bp-add-row">
                    <td colSpan={COL_COUNT}>
                      <button
                        type="button"
                        className="bp-add-row-btn"
                        onClick={() => addRow(group.id)}
                      >
                        + Add Row
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bp-fx-note">
        {currency === "USD"
          ? `FX Rate: 1 USD = ${rate.toFixed(4)} EUR (at actual rates)`
          : `FBR Rate: ${PROPOSAL_META.fbrRate}`}
      </div>
    </div>
  );
}
