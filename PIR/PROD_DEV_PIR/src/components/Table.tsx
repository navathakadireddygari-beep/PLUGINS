import { Fragment, useState, type ReactElement } from "react";
import additionalMetricsData from "../data/additional-metrics.json";
import staticFinancialData from "../data/static-financial-table.json";

type YearKey = "fy26" | "fy27" | "fy28" | "fy29";

type Metric = {
  spcProjected: number | null;
  ytdActualsForecast: number | null;
  variance: string | null;
  varianceTone?: "red" | "green";
};

type FinancialRow = {
  id?: string;
  label: string;
  editable?: boolean;
  type?: "normal" | "new" | "subtotal";
  values: Record<YearKey, Metric>;
};

type FinancialSection = {
  id?: string;
  title: string;
  editable?: boolean;
  rows: FinancialRow[];
};

type FinancialTableData = {
  years: Array<{
    key: YearKey;
    label: string;
    tone: "purple" | "blue" | "green" | "pink";
  }>;
  sections: FinancialSection[];
};

type AdditionalYearKey = "fy26" | "fy27" | "fy28" | "fy29" | "fy30";

type AdditionalMetric = {
  spcProjected: number | null;
  actual: number | null;
};

type AdditionalMetricRow = {
  id?: string;
  label: string;
  editable?: boolean;
  type?: "normal" | "total";
  values: Record<AdditionalYearKey, AdditionalMetric>;
};

type AdditionalMetricsSection = {
  id?: string;
  title: string;
  icon: string;
  editable?: boolean;
  rows: AdditionalMetricRow[];
};

type AdditionalMetricsData = {
  years: Array<{
    key: AdditionalYearKey;
    label: string;
    tone: "purple" | "blue" | "green" | "pink" | "orange";
  }>;
  sections: AdditionalMetricsSection[];
};

const tableData = staticFinancialData as FinancialTableData;
const additionalData = additionalMetricsData as AdditionalMetricsData;

const toneClass = {
  purple: "pir-pd-fy-purple",
  blue: "pir-pd-fy-blue",
  green: "pir-pd-fy-green",
  pink: "pir-pd-fy-pink",
  orange: "pir-pd-fy-orange",
};

const formatAmount = (value: number | null): string => {
  if (value === null) return "-";
  return value.toLocaleString("en-US");
};

const parseAmount = (value: string): number | null => {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const cloneInitialData = (): FinancialTableData =>
  JSON.parse(JSON.stringify(tableData)) as FinancialTableData;

const createBlankValues = (years: FinancialTableData["years"]): Record<YearKey, Metric> =>
  years.reduce((values, year) => {
    values[year.key] = {
      spcProjected: null,
      ytdActualsForecast: null,
      variance: null,
      varianceTone: "red",
    };
    return values;
  }, {} as Record<YearKey, Metric>);

const createBlankAdditionalValues = (
  years: AdditionalMetricsData["years"],
): Record<AdditionalYearKey, AdditionalMetric> =>
  years.reduce((values, year) => {
    values[year.key] = { spcProjected: null, actual: null };
    return values;
  }, {} as Record<AdditionalYearKey, AdditionalMetric>);

function ValueCell({
  metric,
  field,
  rowType,
}: {
  metric: Metric;
  field: "spcProjected" | "ytdActualsForecast" | "variance";
  rowType?: FinancialRow["type"];
}) {
  const isVariance = field === "variance";
  const value = isVariance ? metric.variance : formatAmount(metric[field]);
  const isDash = value === "-";
  const colorClass = isVariance
    ? metric.varianceTone === "green"
      ? "pir-pd-variance pir-pd-variance-green"
      : "pir-pd-variance pir-pd-variance-red"
    : "";

  return (
    <td className={`pir-pd-value-cell ${rowType === "subtotal" ? "pir-pd-subtotal-cell" : ""} ${colorClass}`}>
      <span className={`${field === "ytdActualsForecast" && !isDash ? "pir-pd-linked-value" : ""}`}>
        {value}
      </span>
    </td>
  );
}

function AdditionalMetricCell({ value, total }: { value: number | null; total?: boolean }): ReactElement {
  return (
    <td className={`pir-pd-additional-value-cell ${total ? "pir-pd-additional-total-cell" : ""}`}>
      {formatAmount(value)}
    </td>
  );
}

function ActualCell({ total }: { total?: boolean }): ReactElement {
  return (
    <td className={`pir-pd-additional-actual-cell ${total ? "pir-pd-additional-total-cell" : ""}`}>
      <span className="pir-pd-actual-pill">-</span>
    </td>
  );
}

export default function PivotTableWithAPI(): ReactElement {
  const [data, setData] = useState<FinancialTableData>(() => cloneInitialData());
  const [additionalMetrics, setAdditionalMetrics] = useState<AdditionalMetricsData>(() =>
    JSON.parse(JSON.stringify(additionalData)) as AdditionalMetricsData,
  );

  const updateRowLabel = (sectionIndex: number, rowIndex: number, label: string): void => {
    setData((current) => ({
      ...current,
      sections: current.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          rows: section.rows.map((row, currentRowIndex) =>
            currentRowIndex === rowIndex ? { ...row, label } : row,
          ),
        };
      }),
    }));
  };

  const updateRowMetric = (
    sectionIndex: number,
    rowIndex: number,
    yearKey: YearKey,
    field: "spcProjected" | "ytdActualsForecast" | "variance",
    value: string,
  ): void => {
    setData((current) => ({
      ...current,
      sections: current.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          rows: section.rows.map((row, currentRowIndex) => {
            if (currentRowIndex !== rowIndex) return row;

            const nextMetric: Metric =
              field === "variance"
                ? { ...row.values[yearKey], variance: value || null }
                : { ...row.values[yearKey], [field]: parseAmount(value) };

            return {
              ...row,
              values: {
                ...row.values,
                [yearKey]: nextMetric,
              },
            };
          }),
        };
      }),
    }));
  };

  const addLine = (sectionIndex: number): void => {
    setData((current) => ({
      ...current,
      sections: current.sections.map((section, index) => {
        if (index !== sectionIndex) return section;

        const newLineIndex = section.rows.findIndex((row) => row.type === "new");
        const insertAt = newLineIndex >= 0 ? newLineIndex : section.rows.length;
        const blankRow: FinancialRow = {
          id: `manual-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label: "New Line",
          editable: true,
          type: "normal",
          values: createBlankValues(current.years),
        };

        return {
          ...section,
          rows: [
            ...section.rows.slice(0, insertAt),
            blankRow,
            ...section.rows.slice(insertAt),
          ],
        };
      }),
    }));
  };

  const addFinancialSection = (): void => {
    const timestamp = Date.now();
    setData((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: `financial-section-${timestamp}`,
          title: "New Section",
          editable: true,
          rows: [
            {
              id: `financial-row-${timestamp}`,
              label: "New Line",
              editable: true,
              type: "normal",
              values: createBlankValues(current.years),
            },
            {
              id: `financial-add-row-${timestamp}`,
              label: "+ New Line",
              type: "new",
              values: createBlankValues(current.years),
            },
          ],
        },
      ],
    }));
  };

  const updateFinancialSectionTitle = (sectionIndex: number, title: string): void => {
    setData((current) => ({
      ...current,
      sections: current.sections.map((section, index) =>
        index === sectionIndex ? { ...section, title } : section,
      ),
    }));
  };

  const addAdditionalSection = (): void => {
    const timestamp = Date.now();
    setAdditionalMetrics((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: `additional-section-${timestamp}`,
          title: "NEW METRIC SECTION",
          icon: "+",
          editable: true,
          rows: [
            {
              id: `additional-row-${timestamp}`,
              label: "New Metric",
              editable: true,
              values: createBlankAdditionalValues(current.years),
            },
          ],
        },
      ],
    }));
  };

  const updateAdditionalSectionTitle = (sectionIndex: number, title: string): void => {
    setAdditionalMetrics((current) => ({
      ...current,
      sections: current.sections.map((section, index) =>
        index === sectionIndex ? { ...section, title } : section,
      ),
    }));
  };

  const updateAdditionalRowLabel = (sectionIndex: number, rowIndex: number, label: string): void => {
    setAdditionalMetrics((current) => ({
      ...current,
      sections: current.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          rows: section.rows.map((row, currentRowIndex) =>
            currentRowIndex === rowIndex ? { ...row, label } : row,
          ),
        };
      }),
    }));
  };

  const updateAdditionalMetric = (
    sectionIndex: number,
    rowIndex: number,
    yearKey: AdditionalYearKey,
    field: keyof AdditionalMetric,
    value: string,
  ): void => {
    setAdditionalMetrics((current) => ({
      ...current,
      sections: current.sections.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          rows: section.rows.map((row, currentRowIndex) => {
            if (currentRowIndex !== rowIndex) return row;
            return {
              ...row,
              values: {
                ...row.values,
                [yearKey]: {
                  ...row.values[yearKey],
                  [field]: parseAmount(value),
                },
              },
            };
          }),
        };
      }),
    }));
  };

  return (
    <div className="pir-pd-financial-static-wrap">
      <div className="pir-pd-table-action-bar">
        <button type="button" className="pir-pd-add-section-button" onClick={addFinancialSection}>
          + Add Section
        </button>
      </div>
      <table className="pir-pd-financial-static-table" aria-label="Financial evaluation">
        <thead>
          <tr>
            <th className="pir-pd-item-header" rowSpan={2}>
              ITEM DESCRIPTION
            </th>
            {data.years.map((year) => (
              <th key={year.key} className={`pir-pd-year-header ${toneClass[year.tone]}`} colSpan={3}>
                {year.label}
              </th>
            ))}
          </tr>
          <tr>
            {data.years.map((year) => (
              <Fragment key={`${year.key}-metrics`}>
                <th key={`${year.key}-spc`} className={`pir-pd-metric-header ${toneClass[year.tone]}`}>
                  SPC PROJECTED
                </th>
                <th key={`${year.key}-ytd`} className={`pir-pd-metric-header ${toneClass[year.tone]}`}>
                  PIR REFORECAST
                </th>
                <th key={`${year.key}-variance`} className={`pir-pd-metric-header ${toneClass[year.tone]}`}>
                  VARIANCE
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section, sectionIndex) => (
            <Fragment key={section.id ?? section.title}>
              <tr className="pir-pd-section-row">
                <td colSpan={1 + data.years.length * 3}>
                  +{" "}
                  {section.editable ? (
                    <input
                      className="pir-pd-section-title-input"
                      value={section.title}
                      onChange={(event) => updateFinancialSectionTitle(sectionIndex, event.target.value)}
                      aria-label="Financial section title"
                    />
                  ) : (
                    section.title
                  )}
                </td>
              </tr>
              {section.rows.map((row, rowIndex) => (
                <tr
                  key={row.id ?? `${section.title}-${row.label}-${rowIndex}`}
                  onClick={row.type === "new" ? () => addLine(sectionIndex) : undefined}
                  className={`${row.type === "subtotal" ? "pir-pd-subtotal-row" : ""} ${
                    row.type === "new" ? "pir-pd-new-row" : ""
                  }`}
                >
                  <td className="pir-pd-item-cell">
                    {row.type === "new" ? (
                      <button
                        type="button"
                        className="pir-pd-new-line-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          addLine(sectionIndex);
                        }}
                      >
                        {row.label}
                      </button>
                    ) : row.editable ? (
                      <input
                        className="pir-pd-editable-cell-input pir-pd-item-input"
                        value={row.label}
                        onChange={(event) => updateRowLabel(sectionIndex, rowIndex, event.target.value)}
                        aria-label={`${section.title} line item`}
                      />
                    ) : (
                      row.label
                    )}
                  </td>
                  {data.years.map((year) => {
                    const metric = row.values[year.key];
                    return (
                      <Fragment key={`${row.id ?? row.label}-${rowIndex}-${year.key}`}>
                        {row.editable ? (
                          <>
                            <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                              <input
                                className="pir-pd-editable-cell-input pir-pd-amount-input"
                                value={metric.spcProjected ?? ""}
                                onChange={(event) =>
                                  updateRowMetric(sectionIndex, rowIndex, year.key, "spcProjected", event.target.value)
                                }
                                aria-label={`${row.label} ${year.label} SPC projected`}
                              />
                            </td>
                            <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                              <input
                                className="pir-pd-editable-cell-input pir-pd-amount-input"
                                value={metric.ytdActualsForecast ?? ""}
                                onChange={(event) =>
                                  updateRowMetric(
                                    sectionIndex,
                                    rowIndex,
                                    year.key,
                                    "ytdActualsForecast",
                                    event.target.value,
                                  )
                                }
                                aria-label={`${row.label} ${year.label} YTD actuals and forecast`}
                              />
                            </td>
                            <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                              <input
                                className="pir-pd-editable-cell-input pir-pd-amount-input pir-pd-variance-input"
                                value={metric.variance ?? ""}
                                onChange={(event) =>
                                  updateRowMetric(sectionIndex, rowIndex, year.key, "variance", event.target.value)
                                }
                                aria-label={`${row.label} ${year.label} variance`}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <ValueCell
                              metric={metric}
                              field="spcProjected"
                              rowType={row.type}
                            />
                            <ValueCell
                              metric={metric}
                              field="ytdActualsForecast"
                              rowType={row.type}
                            />
                            <ValueCell
                              metric={metric}
                              field="variance"
                              rowType={row.type}
                            />
                          </>
                        )}
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      <section className="pir-pd-additional-metrics" aria-label="Additional Metrics">
        <div className="pir-pd-additional-heading-row">
          <div className="pir-pd-additional-title">
            <span aria-hidden="true">📋</span>
            <span>Additional Metrics</span>
          </div>
          <button type="button" className="pir-pd-add-section-button" onClick={addAdditionalSection}>
            + Add Section
          </button>
        </div>

        {additionalMetrics.sections.map((section, sectionIndex) => (
          <table key={section.id ?? section.title} className="pir-pd-additional-table" aria-label={section.title}>
            <thead>
              <tr className="pir-pd-additional-section-row">
                <th colSpan={1 + additionalMetrics.years.length * 2}>
                  <span className="pir-pd-additional-section-icon">{section.icon}</span>
                  {section.editable ? (
                    <input
                      className="pir-pd-section-title-input"
                      value={section.title}
                      onChange={(event) => updateAdditionalSectionTitle(sectionIndex, event.target.value)}
                      aria-label="Additional metrics section title"
                    />
                  ) : (
                    section.title
                  )}
                </th>
              </tr>
              <tr>
                <th className="pir-pd-additional-item-header" rowSpan={2}>
                  ITEM DESCRIPTION
                </th>
                {additionalMetrics.years.map((year) => (
                  <th key={year.key} className={`pir-pd-additional-year-header ${toneClass[year.tone]}`} colSpan={2}>
                    {year.label}
                  </th>
                ))}
              </tr>
              <tr>
                {additionalMetrics.years.map((year) => (
                  <Fragment key={`${section.title}-${year.key}-headers`}>
                    <th className={`pir-pd-additional-metric-header ${toneClass[year.tone]}`}>SPC PROJECTED</th>
                    <th className={`pir-pd-additional-metric-header ${toneClass[year.tone]}`}>ACTUAL</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, rowIndex) => (
                <tr key={row.id ?? `${section.title}-${row.label}`} className={row.type === "total" ? "pir-pd-additional-total-row" : ""}>
                  <td className="pir-pd-additional-item-cell">
                    {row.editable ? (
                      <input
                        className="pir-pd-editable-cell-input pir-pd-item-input"
                        value={row.label}
                        onChange={(event) => updateAdditionalRowLabel(sectionIndex, rowIndex, event.target.value)}
                        aria-label={`${section.title} metric`}
                      />
                    ) : (
                      row.label
                    )}
                  </td>
                  {additionalMetrics.years.map((year) => (
                    <Fragment key={`${section.title}-${row.label}-${year.key}`}>
                      {row.editable ? (
                        <>
                          <td className="pir-pd-additional-value-cell">
                            <input
                              className="pir-pd-editable-cell-input pir-pd-amount-input"
                              value={row.values[year.key].spcProjected ?? ""}
                              onChange={(event) =>
                                updateAdditionalMetric(sectionIndex, rowIndex, year.key, "spcProjected", event.target.value)
                              }
                              aria-label={`${row.label} ${year.label} SPC projected`}
                            />
                          </td>
                          <td className="pir-pd-additional-actual-cell">
                            <input
                              className="pir-pd-editable-cell-input pir-pd-amount-input"
                              value={row.values[year.key].actual ?? ""}
                              onChange={(event) =>
                                updateAdditionalMetric(sectionIndex, rowIndex, year.key, "actual", event.target.value)
                              }
                              aria-label={`${row.label} ${year.label} actual`}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <AdditionalMetricCell value={row.values[year.key].spcProjected} total={row.type === "total"} />
                          <ActualCell total={row.type === "total"} />
                        </>
                      )}
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </section>

      <style>{`
        .pir-pd-financial-static-wrap {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          background: #ffffff;
          color: #001a3b;
        }

        .pir-pd-table-action-bar,
        .pir-pd-additional-heading-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pir-pd-table-action-bar {
          margin: 10px 4px 8px;
          justify-content: flex-end;
        }

        .pir-pd-additional-heading-row {
          justify-content: space-between;
        }

        .pir-pd-add-section-button {
          min-width: 96px;
          height: 30px;
          padding: 0 12px;
          border: 1px solid #d5dbe7;
          border-radius: 3px;
          background: #ffffff;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 500;
          line-height: 1;
          cursor: pointer;
        }

        .pir-pd-add-section-button:hover {
          border-color: #c4cbd8;
          background: #fbfcfe;
        }

        .pir-pd-financial-static-table {
          width: 100%;
          min-width: 0;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          border: 1px solid #e6e9ee;
          border-radius: 0 10px 10px 10px;
          overflow: hidden;
          font-size: 12px;
        }

        .pir-pd-financial-static-table th,
        .pir-pd-financial-static-table td {
          border-right: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-financial-static-table th:last-child,
        .pir-pd-financial-static-table td:last-child {
          border-right: 0;
        }

        .pir-pd-item-header {
          width: 17%;
          height: 63px;
          padding: 0 20px;
          background: #ffffff;
          color: #687386;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-align: left;
          vertical-align: middle;
        }

        .pir-pd-year-header {
          height: 32px;
          padding: 0 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-align: left;
        }

        .pir-pd-metric-header {
          height: 31px;
          padding: 0 6px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-align: center;
          white-space: normal;
          overflow-wrap: anywhere;
          line-height: 1.15;
        }

        .pir-pd-fy-purple {
          background: #eee8fb;
          color: #5a1691;
        }

        .pir-pd-fy-blue {
          background: #e4efff;
          color: #0045a2;
        }

        .pir-pd-fy-green {
          background: #d9f5e5;
          color: #006c3b;
        }

        .pir-pd-fy-pink {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-fy-orange {
          background: #fff0da;
          color: #9a3f00;
        }

        .pir-pd-section-row td {
          height: 35px;
          padding: 0 10px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pir-pd-item-cell {
          height: 36px;
          padding: 0 20px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 600;
          text-align: left;
        }

        .pir-pd-value-cell {
          height: 36px;
          padding: 0 8px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
        }

        .pir-pd-linked-value {
          color: #9aa3b2;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .pir-pd-variance {
          font-weight: 600;
        }

        .pir-pd-variance-red {
          color: #ff0000;
        }

        .pir-pd-variance-green {
          color: #00a65a;
        }

        .pir-pd-new-row .pir-pd-item-cell,
        .pir-pd-new-row .pir-pd-value-cell {
          color: #9aa3b2;
          font-weight: 500;
        }

        .pir-pd-new-row {
          cursor: pointer;
        }

        .pir-pd-new-row:hover .pir-pd-item-cell,
        .pir-pd-new-row:hover .pir-pd-value-cell {
          background: #fbfcfe;
        }

        .pir-pd-new-line-button {
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        .pir-pd-editable-cell-input {
          width: 100%;
          min-width: 0;
          height: 26px;
          border: 1px solid transparent;
          border-radius: 3px;
          background: transparent;
          color: #001a3b;
          font: inherit;
          outline: none;
        }

        .pir-pd-editable-cell-input:focus {
          border-color: #9db7e8;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(157, 183, 232, 0.22);
        }

        .pir-pd-section-title-input {
          width: min(420px, 70%);
          height: 24px;
          border: 1px solid transparent;
          border-radius: 3px;
          background: transparent;
          color: #ffffff;
          font: inherit;
          font-weight: 700;
          letter-spacing: inherit;
          outline: none;
          text-transform: uppercase;
        }

        .pir-pd-section-title-input:focus {
          border-color: rgba(255, 255, 255, 0.65);
          background: rgba(255, 255, 255, 0.12);
        }

        .pir-pd-item-input {
          text-align: left;
          font-weight: 600;
        }

        .pir-pd-amount-input {
          text-align: right;
        }

        .pir-pd-variance-input {
          color: #ff0000;
          font-weight: 600;
        }

        .pir-pd-editable-value-cell {
          padding: 4px 8px;
        }

        .pir-pd-subtotal-row .pir-pd-item-cell,
        .pir-pd-subtotal-row .pir-pd-value-cell {
          height: 38px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-weight: 700;
        }

        .pir-pd-subtotal-row .pir-pd-item-cell {
          color: #001a3b;
        }

        @media (max-width: 900px) {
          .pir-pd-financial-static-table {
            min-width: 0;
          }

          .pir-pd-additional-table {
            min-width: 0;
          }
        }

        .pir-pd-additional-metrics {
          margin-top: 28px;
          padding: 0 0 16px;
          color: #001a3b;
        }

        .pir-pd-additional-title {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #001a3b;
        }

        .pir-pd-additional-heading-row {
          margin: 10px 0 10px;
        }

        .pir-pd-additional-table {
          width: 100%;
          min-width: 0;
          margin-bottom: 14px;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          border: 1px solid #e6e9ee;
          border-radius: 5px;
          overflow: hidden;
          font-size: 12px;
          background: #ffffff;
        }

        .pir-pd-additional-table th,
        .pir-pd-additional-table td {
          border-right: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-additional-table th:last-child,
        .pir-pd-additional-table td:last-child {
          border-right: 0;
        }

        .pir-pd-additional-section-row th {
          height: 35px;
          padding: 0 20px;
          background: #243b8f;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-align: left;
        }

        .pir-pd-additional-section-icon {
          display: inline-block;
          margin-right: 8px;
          color: #f5a623;
        }

        .pir-pd-additional-item-header {
          width: 24%;
          height: 63px;
          padding: 0 20px;
          background: #ffffff;
          color: #687386;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-align: left;
          vertical-align: middle;
        }

        .pir-pd-additional-year-header {
          height: 32px;
          padding: 0 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-align: left;
        }

        .pir-pd-additional-metric-header {
          height: 31px;
          padding: 0 6px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-align: right;
          white-space: normal;
          overflow-wrap: anywhere;
          line-height: 1.15;
        }

        .pir-pd-additional-item-cell {
          height: 36px;
          padding: 0 20px;
          background: #ffffff;
          color: #001a3b;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
        }

        .pir-pd-additional-value-cell,
        .pir-pd-additional-actual-cell {
          height: 36px;
          padding: 0 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 12px;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
        }

        .pir-pd-actual-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 19px;
          border: 1px solid #d6e6f7;
          border-radius: 4px;
          background: #eef6ff;
          color: #9aa3b2;
          font-weight: 600;
        }

        .pir-pd-additional-total-row .pir-pd-additional-item-cell,
        .pir-pd-additional-total-row .pir-pd-additional-value-cell,
        .pir-pd-additional-total-row .pir-pd-additional-actual-cell,
        .pir-pd-additional-total-cell {
          background: #dde2ec69;
          color: #1D2C4D;
          font-weight: 700;
        }

        .pir-pd-additional-total-row .pir-pd-actual-pill {
          border-color: #cdd6ea;
          background: #dde2ec69;
        }
      `}</style>
    </div>
  );
}
