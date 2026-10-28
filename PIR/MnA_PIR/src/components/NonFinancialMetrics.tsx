/**
 * Non-Financial Metrics — client numbers, annual licence values, headcount.
 *
 * One card per non-financial section returned by financialEvaluation, each a
 * fiscal-year grid of SPC PROJECTED (read-only, from the approved case) against
 * ACTUAL (entered here during the PIR). New lines can be raised against a
 * section; Save All PUTs the whole evaluation back and refreshes every region.
 *
 * The tables are built from the payload, not from a fixed list of section names,
 * so a metric added server-side appears without a code change.
 *
 * These are counts, FTEs and licence values — not currency — so the toolbar's
 * SCALE (K/M/B) is deliberately not applied: a headcount of 2 must never read
 * "0.00M". The NUMBER setting still drives grouping and decimal punctuation.
 */
import { Fragment, useEffect, useRef, useState, type ReactElement } from "react";
import { getAppConfig } from "../config/app-config";
import {
  getNonFinancialMetrics,
  saveNonFinancialMetrics,
  type NfActualEdit,
  type NfNewLine,
  type NfRow,
  type NfTable,
  type NonFinancialReport,
} from "../api/non-financial-api";
import { useRefreshToken } from "../lib/refresh-bus";
import { formatMagnitude, useFormatSettings, type FormatSettings } from "../lib/format-settings";
import StatusBanner from "./StatusBanner";

/** Edited actuals, keyed `${lineId}::${yearKey}` — raw strings as typed. */
type Edits = Record<string, string>;

/** A line being added to a section, before it is saved. */
type NewRow = {
  key:       string;
  sectionId: number;
  label:     string;
  /** Entered actuals, keyed by fiscal-year key. */
  values:    Record<string, string>;
};

const editKey = (lineId: number, yearKey: string): string => `${lineId}::${yearKey}`;

/** Digits, one decimal point and a leading minus — nothing else gets in. */
const sanitiseNumber = (raw: string): string => {
  let s = raw.replace(/[^\d.-]/g, "");
  const negative = s.startsWith("-");
  s = s.replace(/-/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = `${s.slice(0, dot + 1)}${s.slice(dot + 1).replace(/\./g, "")}`;
  return negative ? `-${s}` : s;
};

/** Metric names are free text, but not numeric-only or padded. */
const sanitiseLabel = (raw: string): string => raw.replace(/^\s+/, "");

const parseNumber = (raw: string): number | null => {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

/**
 * Whole numbers stay whole (a headcount of 2 is "2", not "2.00"); anything with
 * a fraction keeps two places. Grouping/decimal marks follow the NUMBER toolbar.
 */
const fmtValue = (n: number | null, settings: FormatSettings): string => {
  if (n == null) return "–";
  const body = formatMagnitude(n, settings, Number.isInteger(n) ? 0 : 2);
  return n < 0 ? `(${body})` : body;
};

export default function NonFinancialMetrics(): ReactElement | null {
  const refreshToken = useRefreshToken();
  const fmt = useFormatSettings();

  const [report, setReport] = useState<NonFinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [edits, setEdits] = useState<Edits>({});
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessages, setSuccessMessages] = useState<string[]>([]);
  const newRowSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getNonFinancialMetrics(getAppConfig())
      .then((data) => {
        if (cancelled) return;
        setReport(data);
        // A refresh means the server is now the truth — drop local drafts so the
        // table can't show stale entries alongside saved ones.
        setEdits({});
        setNewRows([]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load non-financial metrics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  /** Entered value if the user has touched the cell, else the stored actual. */
  const actualOf = (row: NfRow, yearIndex: number, yearKey: string): number | null => {
    if (row.lineId != null) {
      const edited = edits[editKey(row.lineId, yearKey)];
      if (edited !== undefined) return parseNumber(edited);
    }
    return row.cells[yearIndex]?.actual ?? null;
  };

  /** Per-year totals across entered rows and unsaved additions. */
  const derivedTotals = (table: NfTable, yearIndex: number, yearKey: string) => {
    let spc: number | null = null;
    let actual: number | null = null;
    for (const row of table.rows) {
      if (row.isTotal) continue;
      const s = row.cells[yearIndex]?.spc ?? null;
      if (s != null) spc = (spc ?? 0) + s;
      const a = actualOf(row, yearIndex, yearKey);
      if (a != null) actual = (actual ?? 0) + a;
    }
    for (const draft of newRows) {
      if (draft.sectionId !== table.sectionId) continue;
      const a = parseNumber(draft.values[yearKey] ?? "");
      if (a != null) actual = (actual ?? 0) + a;
    }
    return { spc, actual };
  };

  const addRow = (sectionId: number): void => {
    newRowSeq.current += 1;
    setNewRows((prev) => [
      ...prev,
      { key: `new-${newRowSeq.current}`, sectionId, label: "", values: {} },
    ]);
  };

  const updateRow = (key: string, patch: Partial<NewRow>): void => {
    setNewRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string): void => {
    setNewRows((prev) => prev.filter((r) => r.key !== key));
  };

  /** Additions only count once they are named — a blank draft is not a line. */
  const namedRows = newRows.filter((r) => r.label.trim() !== "");
  const editCount = Object.keys(edits).length;
  const pendingCount = editCount + namedRows.length;

  const saveAll = async (): Promise<void> => {
    if (!report?.raw || pendingCount === 0) return;
    setSaving(true);
    setSaveError(null);

    const actualEdits: NfActualEdit[] = Object.entries(edits).map(([key, value]) => {
      const [lineId, yearKey] = key.split("::");
      return { lineId: Number(lineId), yearKey, value: parseNumber(value) };
    });

    const additions: NfNewLine[] = namedRows.map((row) => ({
      sectionId: row.sectionId,
      label:     row.label.trim(),
      actuals:   Object.fromEntries(
        Object.entries(row.values).map(([yearKey, value]) => [yearKey, parseNumber(value)]),
      ),
    }));

    try {
      await saveNonFinancialMetrics(getAppConfig(), report.raw, report.years, actualEdits, additions);
      // notifyDataChanged inside the save re-runs the load effect, which clears
      // the local drafts once the server copy is back.
      setSuccessMessages(["Non-financial metrics saved"]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !report) {
    return <div className="pir-pd-nf-state">Loading non-financial metrics…</div>;
  }
  if (error && !report) {
    return <div className="pir-pd-nf-state pir-pd-nf-error">Couldn’t load non-financial metrics: {error}</div>;
  }
  // Nothing to show is not an error — plenty of proposals carry no such metrics.
  if (!report || report.tables.length === 0) return null;

  return (
    <section className="pir-pd-nf" aria-label="Non-Financial Metrics">
      <div className="pir-pd-nf-heading">
        <span className="pir-pd-nf-heading-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </span>
        <div>
          <div className="pir-pd-nf-heading-title">Non-Financial Metrics</div>
          <div className="pir-pd-nf-heading-sub">SPC projected against actuals recorded during the review</div>
        </div>
      </div>


      {report.tables.map((table) => {
        const drafts = newRows.filter((r) => r.sectionId === table.sectionId);
        const colCount = 1 + report.years.length * 2;
        return (
          <div key={`${table.sectionId ?? table.title}`} className="pir-pd-nf-card">
            <div className="pir-pd-nf-card-header">{table.title}</div>

            <div className="pir-pd-nf-scroll">
              <table className="pir-pd-nf-table" aria-label={table.title}>
                <thead>
                  <tr>
                    <th className="pir-pd-nf-item-header" rowSpan={2}>ITEM DESCRIPTION</th>
                    {report.years.map((year) => (
                      <th key={year.key} className="pir-pd-nf-year-header" colSpan={2}>{year.label}</th>
                    ))}
                  </tr>
                  <tr>
                    {report.years.map((year) => (
                      <Fragment key={`${year.key}-metrics`}>
                        <th className="pir-pd-nf-metric-header">SPC PROJECTED</th>
                        <th className="pir-pd-nf-metric-header">ACTUAL</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={`${row.lineId ?? rowIndex}`} className={row.isTotal ? "pir-pd-nf-total-row" : ""}>
                      <td className="pir-pd-nf-item-cell">{row.label}</td>
                      {report.years.map((year, yearIndex) => {
                        const cell = row.cells[yearIndex];
                        const stored = cell?.actual ?? null;
                        // A line with no id can't be addressed by the PUT, so it
                        // stays read-only rather than accepting edits that would
                        // silently fail to save.
                        const editable = !row.isTotal && row.lineId != null;
                        const key = row.lineId != null ? editKey(row.lineId, year.key) : "";
                        const value = (key && edits[key]) ?? (stored == null ? "" : String(stored));
                        return (
                          <Fragment key={`${row.lineId ?? rowIndex}-${year.key}`}>
                            <td className="pir-pd-nf-value-cell">{fmtValue(cell?.spc ?? null, fmt)}</td>
                            <td className="pir-pd-nf-value-cell pir-pd-nf-actual-cell">
                              {editable ? (
                                <input
                                  className="pir-pd-nf-input"
                                  value={value}
                                  onChange={(e) =>
                                    setEdits((prev) => ({ ...prev, [key]: sanitiseNumber(e.target.value) }))
                                  }
                                  placeholder="–"
                                  inputMode="decimal"
                                  aria-label={`${row.label} ${year.label} actual`}
                                />
                              ) : (
                                fmtValue(actualOf(row, yearIndex, year.key), fmt)
                              )}
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Lines raised during the review — saved with a null line id */}
                  {drafts.map((draft) => (
                    <tr key={draft.key} className="pir-pd-nf-draft-row">
                      <td className="pir-pd-nf-item-cell">
                        <div className="pir-pd-nf-draft-name">
                          <input
                            className="pir-pd-nf-input pir-pd-nf-name-input"
                            value={draft.label}
                            onChange={(e) => updateRow(draft.key, { label: sanitiseLabel(e.target.value) })}
                            placeholder="Enter metric name…"
                            aria-label="New metric name"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="pir-pd-nf-draft-cancel"
                            onClick={() => removeRow(draft.key)}
                            title="Remove this line"
                            aria-label="Remove new line"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                      {report.years.map((year) => (
                        <Fragment key={`${draft.key}-${year.key}`}>
                          {/* No approved baseline exists for a line added during the PIR */}
                          <td className="pir-pd-nf-value-cell pir-pd-nf-muted">–</td>
                          <td className="pir-pd-nf-value-cell pir-pd-nf-actual-cell">
                            <input
                              className="pir-pd-nf-input"
                              value={draft.values[year.key] ?? ""}
                              onChange={(e) =>
                                updateRow(draft.key, {
                                  values: { ...draft.values, [year.key]: sanitiseNumber(e.target.value) },
                                })
                              }
                              disabled={!draft.label.trim()}
                              title={!draft.label.trim() ? "Name the metric to enable this field" : undefined}
                              placeholder={draft.label.trim() ? "0" : ""}
                              inputMode="decimal"
                              aria-label={`New metric ${year.label} actual`}
                            />
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  ))}

                  {/* Sections with no id can't take new lines — nothing to attach to */}
                  {table.sectionId != null && (
                    <tr className="pir-pd-nf-new-row">
                      <td className="pir-pd-nf-item-cell">
                        <button
                          type="button"
                          className="pir-pd-nf-new-line-button"
                          onClick={() => addRow(table.sectionId as number)}
                        >
                          + New Line
                        </button>
                      </td>
                      <td className="pir-pd-nf-value-cell" colSpan={colCount - 1} />
                    </tr>
                  )}

                  {/* Summed in the browser only when the API sent no calculated line */}
                  {table.totalIsDerived && (
                    <tr className="pir-pd-nf-total-row">
                      <td className="pir-pd-nf-item-cell">Total</td>
                      {report.years.map((year, yearIndex) => {
                        const totals = derivedTotals(table, yearIndex, year.key);
                        return (
                          <Fragment key={`total-${year.key}`}>
                            <td className="pir-pd-nf-value-cell">{fmtValue(totals.spc, fmt)}</td>
                            <td className="pir-pd-nf-value-cell">{fmtValue(totals.actual, fmt)}</td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="pir-pd-nf-actions">
        <StatusBanner kind="error" messages={saveError ? [saveError] : []} onClose={() => setSaveError(null)} />
        <StatusBanner kind="success" messages={successMessages} onClose={() => setSuccessMessages([])} autoDismissMs={5000} />
        {!saveError && pendingCount > 0 && (
          <span className="pir-pd-nf-pending">
            {editCount > 0 && `${editCount} actual${editCount === 1 ? "" : "s"} edited`}
            {editCount > 0 && namedRows.length > 0 && " · "}
            {namedRows.length > 0 && `${namedRows.length} new line${namedRows.length === 1 ? "" : "s"}`}
            {" ready to save"}
          </span>
        )}
        <button
          type="button"
          className="pir-pd-nf-reset"
          onClick={() => { setEdits({}); setNewRows([]); setSaveError(null); }}
          disabled={saving || pendingCount === 0}
        >
          <span aria-hidden="true">↺</span> Reset Actuals
        </button>
        <button
          type="button"
          className="pir-pd-nf-save"
          onClick={() => { void saveAll(); }}
          disabled={saving || pendingCount === 0}
          title={pendingCount === 0 ? "Enter an actual or add a line to enable saving" : undefined}
        >
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      <style>{`
        .pir-pd-nf { margin-top: 16px; }


        .pir-pd-nf-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pir-pd-nf-heading-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-nf-heading-title {
          color: #1D2C4D;
          font-size: 15px;
          font-weight: 700;
        }

        .pir-pd-nf-heading-sub {
          color: #687386;
          font-size: 12px;
        }

        .pir-pd-nf-state {
          padding: 24px 20px;
          margin-top: 16px;
          text-align: center;
          color: #687386;
          font-size: 13px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
        }

        .pir-pd-nf-error { color: red; }

        .pir-pd-nf-card {
          margin-bottom: 16px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(29, 38, 51, 0.06);
          /* Safe here: the scrolling element is the child, so this only clips
             the card to its rounded corners. */
          overflow: hidden;
        }

        .pir-pd-nf-card-header {
          padding: 12px 18px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          border-bottom: 1px solid #e6e9ee;
        }

        /* Only the table scrolls sideways — the card stays put */
        .pir-pd-nf-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
        }

        .pir-pd-nf-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 12px;
        }

        .pir-pd-nf-table th,
        .pir-pd-nf-table td {
          border-right: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-nf-table th:last-child,
        .pir-pd-nf-table td:last-child { border-right: 0; }

        .pir-pd-nf-item-header {
          min-width: 240px;
          width: 240px;
          height: 56px;
          padding: 0 20px;
          background: #ffffff;
          color: #1D2C4D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-align: left;
          vertical-align: middle;
          position: sticky;
          left: 0;
          z-index: 3;
          box-shadow: 6px 0 8px -6px rgba(29, 38, 51, 0.18);
        }

        .pir-pd-nf-year-header {
          height: 32px;
          padding: 0 16px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: center;
          vertical-align: middle;
        }

        .pir-pd-nf-metric-header {
          min-width: 120px;
          height: 34px;
          padding: 4px 14px;
          background: #f8f9fa;
          color: #1D2C4D;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
        }

        .pir-pd-nf-item-cell {
          min-width: 240px;
          width: 240px;
          height: 38px;
          padding: 0 20px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 600;
          text-align: left;
          position: sticky;
          left: 0;
          z-index: 2;
          box-shadow: 6px 0 8px -6px rgba(29, 38, 51, 0.12);
        }

        .pir-pd-nf-value-cell {
          height: 38px;
          padding: 0 14px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
        }

        .pir-pd-nf-actual-cell { padding: 4px 8px; }
        .pir-pd-nf-muted { color: #b3bccb; font-style: italic; text-align: right; }

        .pir-pd-nf-input {
          width: 100%;
          min-width: 0;
          height: 26px;
          padding: 0 6px;
          border: 1px solid #d5dbe7;
          border-radius: 4px;
          background: #ffffff;
          color: #1D2C4D;
          font: inherit;
          font-weight: 600;
          text-align: right;
          outline: none;
        }

        .pir-pd-nf-input:focus {
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(157, 183, 232, 0.22);
        }

        .pir-pd-nf-input:disabled {
          background: #f4f6f9;
          color: #c4cbd8;
          cursor: not-allowed;
        }

        .pir-pd-nf-input::placeholder { color: #b3bccb; font-weight: 400; }

        .pir-pd-nf-name-input { text-align: left; }

        /* ── Inline draft row ────────────────────────────────── */
        .pir-pd-nf-draft-row .pir-pd-nf-item-cell,
        .pir-pd-nf-draft-row .pir-pd-nf-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-nf-draft-name {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pir-pd-nf-draft-cancel {
          flex: 0 0 auto;
          padding: 3px 8px;
          border: 1px solid #e6e9ee;
          border-radius: 4px;
          background: #ffffff;
          color: #687386;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .pir-pd-nf-draft-cancel:hover { color: #1D2C4D; background: #f4f6f9; }

        .pir-pd-nf-new-row .pir-pd-nf-item-cell,
        .pir-pd-nf-new-row .pir-pd-nf-value-cell {
          height: 34px;
          color: #9aa3b2;
        }

        .pir-pd-nf-new-line-button {
          margin: 0;
          padding: 2px 8px;
          border: 1px dashed #c4cbd8;
          border-radius: 4px;
          background: transparent;
          color: #687386;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-nf-new-line-button:hover {
          border-color: #1D2C4D;
          color: #1D2C4D;
          background: #dde2ec69;
        }

        .pir-pd-nf-total-row .pir-pd-nf-item-cell,
        .pir-pd-nf-total-row .pir-pd-nf-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
          font-weight: 700;
        }

        .pir-pd-nf-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 4px 0 8px;
        }

        .pir-pd-nf-pending {
          margin-right: auto;
          color: #687386;
          font-size: 13px;
        }

        .pir-pd-nf-save-error {
          margin-right: auto;
          color: red;
          font-size: 13px;
          font-weight: 600;
        }

        .pir-pd-nf-reset,
        .pir-pd-nf-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 18px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
          color: #1D2C4D;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-nf-reset:hover:not(:disabled),
        .pir-pd-nf-save:hover:not(:disabled) {
          background: #eef1f5;
          border-color: #c4cbd8;
        }

        .pir-pd-nf-reset:disabled,
        .pir-pd-nf-save:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pir-pd-nf-toast {
          position: fixed;
          right: 24px;
          top: 24px;
          z-index: 500;
          max-width: 420px;
          padding: 12px 18px;
          border-radius: 8px;
          background: #1d2633;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </section>
  );
}
