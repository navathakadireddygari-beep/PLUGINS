import { Fragment, useEffect, useRef, useState, type ReactElement } from "react";
import { getAppConfig } from "../config/app-config";
import {
  getForecastActuals,
  getSectionIdsByName,
  applySectionIds,
  saveForecastActuals,
  type ForecastReport,
  type ForecastCellEdit,
} from "../api/forecast-actuals-api";
import type { DrillContext } from "../api/actual-drilldown-api";
import { postAdjustment, type SectionAdjustmentPayload } from "../api/adjustments-api";
import { useRefreshToken } from "../lib/refresh-bus";
import StatusBanner from "./StatusBanner";
import { formatMagnitude, formatScaled, SCALES, useFormatSettings, type FormatSettings } from "../lib/format-settings";

/** Draft state for the inline "+ New Line" form (one open at a time). */
type NewLineDraft = {
  sectionIndex: number;
  label:        string;
  /** Raw typed YTD values, one per year column (the TOTAL column auto-sums). */
  values:       string[];
};

/** "fy26" → 2026. Null when the key isn't a fiscal year (e.g. "total"). */
const fyYearOf = (key: string): number | null => {
  const n = parseInt(key.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? 2000 + n : null;
};

/* ── Input sanitisers ────────────────────────────────────────────────
   Applied on change so disallowed characters never make it into the field —
   the user sees the keystroke rejected rather than an error after the fact. */

/** Line names allow letters, digits, spaces, underscores and hyphens, but cannot start with a digit. */
const sanitiseLineName = (raw: string): string =>
  raw.replace(/[^A-Za-z0-9 _-]/g, "").replace(/^\d+/, "");

/** Amount fields take digits, thousands separators, one decimal point and a leading minus. */
const sanitiseAmount = (raw: string): string => {
  let s = raw.replace(/[^\d.,-]/g, "");
  const negative = s.startsWith("-");
  s = s.replace(/-/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = `${s.slice(0, firstDot + 1)}${s.slice(firstDot + 1).replace(/\./g, "")}`;
  }
  return negative ? `-${s}` : s;
};

/** "1,234" / "(500)" / "$1200" → number. Blank or unparseable → null. */
const parseAmount = (raw: string): number | null => {
  const cleaned = raw.replace(/[,\s$]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

/** FY label (Apr→Mar, ending year) that "now" falls in — e.g. Sep 2026 → FY27. */
const currentFiscalYearEnd = (): number => {
  const now = new Date();
  return now.getMonth() + 1 >= 4 ? now.getFullYear() + 1 : now.getFullYear();
};

/** True for fiscal years after the one currently in progress. */
const isFutureFiscalYear = (key: string): boolean => {
  const match = key.match(/^fy(\d{2})$/i);
  return match != null && 2000 + Number(match[1]) > currentFiscalYearEnd();
};

/** Rate/margin/percent lines (e.g. "Tax Rate %") — never scaled, always a plain %. */
const isPercentRow = (label: string): boolean => /%|\brate\b|\bmargin\b|\bpercent\b/i.test(label);

/** Stored as value * 1,000,000 — same figure at every K/M/B scale, e.g. 26000000 → "26%". */
const formatPercentCell = (n: number | null, settings: FormatSettings): string => {
  if (n == null) return "-";
  const value = n / 1_000_000;
  return `${formatMagnitude(value, settings, Number.isInteger(value) ? 0 : 1)}%`;
};

const editorValue = (value: number, settings: FormatSettings): string => {
  return formatScaled(value, settings);
};

const baseEditorValue = (value: string, settings: FormatSettings): number | null => {
  const amount = parseAmount(value);
  const scale = SCALES.find((item) => item.key === settings.scale) ?? SCALES[0];
  return amount == null ? null : amount * scale.divisor;
};

/**
 * Report cell text under the current SCALE / NUMBER setting.
 * Formats from the raw figure so changing scale never re-reads a displayed value.
 */
const cellText = (num: number | null | undefined, fallback: string, settings: FormatSettings): string => {
  if (num == null) return fallback;
  if (num === 0) return "0";
  return formatScaled(num, settings);
};

const toneClass: Record<string, string> = {
  purple: "pir-pd-fy-purple",
  blue:   "pir-pd-fy-blue",
  green:  "pir-pd-fy-green",
  pink:   "pir-pd-fy-pink",
  orange: "pir-pd-fy-orange",
  total:  "pir-pd-fy-total",
};

type ForecastActualsReportProps = {
  /** Fired when a forecast (YTD Actuals + Forecast) value is clicked — opens the actuals drilldown. */
  onActualClick?: (ctx: DrillContext) => void;
};

export default function ForecastActualsReport({ onActualClick }: ForecastActualsReportProps = {}): ReactElement {
  // Bumped after every successful write anywhere in the app — re-reads the report.
  const refreshToken = useRefreshToken("forecastActuals");

  // SCALE / NUMBER choices from the toolbar under the tab bar.
  const fmt = useFormatSettings();

  const [report, setReport] = useState<ForecastReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [futureForecastEdits, setFutureForecastEdits] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  // Section indices that are currently collapsed (their rows are hidden).
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  // Inline "+ New Line" form — only one open across the whole table.
  const [draft, setDraft] = useState<NewLineDraft | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessages, setSuccessMessages] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = (message: string): void => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const openDraft = (sectionIndex: number, yearCount: number): void => {
    setDraft({
      sectionIndex,
      label:  "",
      values: Array.from({ length: yearCount }, () => ""),
    });
  };

  const cancelDraft = (): void => {
    setDraft(null);
  };

  const setDraftValue = (yearIndex: number, value: string): void => {
    setDraft((current) => {
      if (!current) return current;
      const values = [...current.values];
      values[yearIndex] = value;
      return { ...current, values };
    });
  };

  /**
   * SECTION-level adjustments for the open draft — one per fiscal year that has
   * a value. Derived live (not staged), so Save All lights up as soon as the
   * user types an amount.
   */
  const draftPayloads = ((): SectionAdjustmentPayload[] => {
    if (!draft || !report) return [];
    const label = draft.label.trim();
    if (!label) return [];

    const section = report.sections[draft.sectionIndex];
    const proposalId = Number(getAppConfig().proposal_id);
    if (!Number.isFinite(proposalId) || proposalId <= 0) return [];

    const createdBy = Number(getAppConfig().created_by);

    const out: SectionAdjustmentPayload[] = [];
    report.years.forEach((year, i) => {
      if (year.isTotal) return; // TOTAL is a derived rollup, never posted
      const amount = parseAmount(draft.values[i] ?? "");
      const fiscalYear = fyYearOf(year.key);
      if (amount == null || fiscalYear == null) return;
      const isFuture = isFutureFiscalYear(year.key);
      if (isFuture && amount === 0) return; // future-year input is blocked — never post a bare 0
      // Input is blocked for future years, but the type still follows the
      // year: ACTUALS lands in ytd_actuals_forecast, FORECAST in ytd_actuals.
      const adjustmentType = isFuture ? "FORECAST" : "ACTUALS";
      out.push({
        proposal_id:         proposalId,
        adjustment_type:     adjustmentType,
        adjustment_level:    "SECTION",
        fin_eval_section_id: section?.finEvalSectionId ?? null,
        fiscal_year:         fiscalYear,
        description:         label,
        amount:              Math.abs(amount),
        ...(Number.isFinite(createdBy) && createdBy > 0 ? { created_by: createdBy } : {}),
      });
    });
    return out;
  })();

  const toggleSection = (sectionIndex: number): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  };

  /**
   * Fetch the report. Saved adjustments arrive with it — the API appends a
   * rolled-up "Section Adjustments" line (is_section_adj = "Y") to each section
   * — so no separate adjustments call is needed.
   *
   * Returns a cancel fn so the mount effect can bail cleanly.
   */
  const loadReport = (): (() => void) => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const cfg = getAppConfig();
    // The comparison endpoint omits fin_eval_section_id, but adjustments are
    // posted against it — so the PKs come from financialEvaluation in parallel
    // and are matched on section_name.
    Promise.all([getForecastActuals(cfg), getSectionIdsByName(cfg)])
      .then(([data, sectionIds]) => {
        if (cancelled) return;
        setReport(applySectionIds(data, sectionIds));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load report");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  // Re-runs on mount and again whenever any POST/PUT/DELETE succeeds.
  useEffect(loadReport, [refreshToken]);

  /** Discard local edits (manual lines, the open draft) and re-fetch. */
  const resetActuals = (): void => {
    setDraft(null);
    setFutureForecastEdits({});
    loadReport();
    showToast("↺ Actuals reset to the last saved values");
  };

  const futureForecastEditKey = (rowId: string, fiscalYear: string): string => `${rowId}::${fiscalYear}`;

  const futureForecastPayloads: ForecastCellEdit[] = Object.entries(futureForecastEdits).map(([key, value]) => {
    const [rowId, fiscalYear] = key.split("::");
    return { rowId, fiscalYear, value: baseEditorValue(value, fmt) };
  });

  const pendingSaveCount = draftPayloads.length + futureForecastPayloads.length;

  /**
   * POST the open draft as SECTION adjustments — one per fiscal year with a
   * value. Sent sequentially so the first failure stops the batch and leaves the
   * draft open for a retry.
   */
  const saveAll = async (): Promise<void> => {
    if (pendingSaveCount === 0 || !report) return;

    setSaving(true);
    const cfg = getAppConfig();

    try {
      const messages: string[] = [];
      if (futureForecastPayloads.length > 0) {
        const apiMessage = await saveForecastActuals(cfg, report, futureForecastPayloads);
        messages.push(apiMessage || "Forecast values saved");
        setFutureForecastEdits({});
      }
      for (const payload of draftPayloads) {
        const apiMessage = await postAdjustment(cfg, payload);
        messages.push(apiMessage || "Adjustment created successfully");
      }
      setDraft(null);
      setSuccessMessages(messages);
      // No explicit re-read here: postAdjustment signals the refresh bus, which
      // re-runs this report's load effect *and* every other API in the app. The
      // saved amounts come back rolled into each section's "Section
      // Adjustments" line, so nothing is faked client-side.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save adjustments";
      setErrorMessages([message]);
    } finally {
      setSaving(false);
    }
  };

  const updateSectionTitle = (sectionIndex: number, title: string): void => {
    setReport((current) =>
      !current ? current : {
        ...current,
        sections: current.sections.map((s, i) => (i === sectionIndex ? { ...s, title } : s)),
      });
  };

  const updateRowLabel = (sectionIndex: number, rowIndex: number, label: string): void => {
    setReport((current) =>
      !current ? current : {
        ...current,
        sections: current.sections.map((s, i) =>
          i !== sectionIndex ? s : { ...s, rows: s.rows.map((r, ri) => (ri === rowIndex ? { ...r, label } : r)) }),
      });
  };

  const updateCell = (
    sectionIndex: number,
    rowIndex: number,
    cellIndex: number,
    field: "spc" | "ytd" | "variance",
    value: string,
  ): void => {
    setReport((current) =>
      !current ? current : {
        ...current,
        sections: current.sections.map((s, i) => {
          if (i !== sectionIndex) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== rowIndex) return r;
              return {
                ...r,
                cells: r.cells.map((c, ci) => (ci === cellIndex ? { ...c, [field]: value } : c)),
              };
            }),
          };
        }),
      });
  };

  if (loading && !report) return <div className="pir-pd-report-state">Loading Forecast vs Actuals…</div>;
  if (error && !report) return <div className="pir-pd-report-state pir-pd-report-error">Couldn’t load report: {error}</div>;
  if (!report) return <div className="pir-pd-report-state">No report data available.</div>;

  const colCount = 1 + report.years.length * 3;

  return (
    <div className="pir-pd-report-wrap">
      <div className="pir-pd-report-scroll">
      <table className="pir-pd-report-table" aria-label="Forecast vs Actuals comparison">
        <thead>
          <tr>
            <th className="pir-pd-item-header" rowSpan={2}>ITEM DESCRIPTION</th>
            {report.years.map((year) => (
              <th key={year.key} className={`pir-pd-year-header ${toneClass[year.tone]}`} colSpan={3}>
                {year.label}
              </th>
            ))}
          </tr>
          <tr>
            {report.years.map((year) => (
              <Fragment key={`${year.key}-metrics`}>
                <th className="pir-pd-metric-header">SPC PROJECTED</th>
                <th className="pir-pd-metric-header">PIR REFORECAST</th>
                <th className="pir-pd-metric-header">VARIANCE</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.sections.map((section, sectionIndex) => (
            <Fragment key={`${section.title}-${sectionIndex}`}>
              <tr className="pir-pd-section-row">
                <td colSpan={colCount}>
                  <div className="pir-pd-section-head">
                    <button
                      type="button"
                      className="pir-pd-section-toggle"
                      onClick={() => toggleSection(sectionIndex)}
                      aria-expanded={!collapsed.has(sectionIndex)}
                      aria-label={collapsed.has(sectionIndex) ? "Expand section" : "Collapse section"}
                    >
                      <span
                        className={`pir-pd-section-caret ${collapsed.has(sectionIndex) ? "pir-pd-caret-collapsed" : ""}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </button>
                    {section.editable ? (
                      <input
                        className="pir-pd-section-title-input"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                        placeholder="Enter new section name"
                        aria-label="Section title"
                      />
                    ) : (
                      <span className="pir-pd-section-title-text">{section.title}</span>
                    )}
                  </div>
                </td>
              </tr>
              {!collapsed.has(sectionIndex) && section.rows.map((row, rowIndex) => {
                if (row.type === "new") {
                  return (
                    <Fragment key={row.id}>
                      {/* Inline draft form — Enter saves via Save All, Escape cancels */}
                      {draft && draft.sectionIndex === sectionIndex && (
                        <tr
                          className="pir-pd-draft-row"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); void saveAll(); }
                            if (e.key === "Escape") { e.preventDefault(); cancelDraft(); }
                          }}
                        >
                          <td className="pir-pd-item-cell">
                            <input
                              ref={nameInputRef}
                              className="pir-pd-editable-cell-input pir-pd-item-input"
                              value={draft.label}
                              onChange={(e) => setDraft({ ...draft, label: sanitiseLineName(e.target.value) })}
                              placeholder="Enter line name…"
                              title="Letters and spaces only"
                              aria-label="New line name"
                              autoFocus
                            />
                          </td>
                          {report.years.map((year, i) => (
                            <Fragment key={`draft-${year.key}`}>
                              {/* No SPC baseline exists for a line added during the PIR */}
                              <td className="pir-pd-value-cell pir-pd-draft-muted">–</td>
                              <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                                {year.isTotal ? (
                                  <span className="pir-pd-draft-auto">Auto</span>
                                ) : isFutureFiscalYear(year.key) ? (
                                  <input
                                    className="pir-pd-editable-cell-input pir-pd-amount-input"
                                    value=""
                                    disabled
                                    readOnly
                                    title="You cannot add adjustments for future years"
                                    aria-label={`${year.label} YTD actuals and forecast`}
                                  />
                                ) : (
                                  <input
                                    className="pir-pd-editable-cell-input pir-pd-amount-input"
                                    value={draft.values[i] ?? ""}
                                    onChange={(e) => setDraftValue(i, sanitiseAmount(e.target.value))}
                                    disabled={!draft.label.trim()}
                                    placeholder={draft.label.trim() ? "0" : ""}
                                    title={!draft.label.trim() ? "Enter a line item name to enable this field" : "Numbers only"}
                                    inputMode="decimal"
                                    aria-label={`${year.label} YTD actuals and forecast`}
                                  />
                                )}
                              </td>
                              <td className="pir-pd-value-cell pir-pd-draft-muted">
                                {i === report.years.length - 1 ? (
                                  <div className="pir-pd-draft-actions">
                                    <button
                                      type="button"
                                      className="pir-pd-draft-cancel"
                                      onClick={cancelDraft}
                                      aria-label="Cancel new line"
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  "–"
                                )}
                              </td>
                            </Fragment>
                          ))}
                        </tr>
                      )}
                      <tr className="pir-pd-new-row">
                        <td className="pir-pd-item-cell">
                          <button
                            type="button"
                            className="pir-pd-new-line-button"
                            onClick={() => openDraft(sectionIndex, report.years.length)}
                          >
                            + New Line
                          </button>
                        </td>
                        <td className="pir-pd-value-cell pir-pd-new-row-filler" colSpan={colCount - 1} />
                      </tr>
                    </Fragment>
                  );
                }
                return (
                  <Fragment key={row.id}>
                  <tr
                    className={
                      row.type === "subtotal"
                        ? "pir-pd-subtotal-row"
                        : row.isAdjustment
                          ? "pir-pd-adjustment-row"
                          : ""
                    }
                  >
                    <td className="pir-pd-item-cell">
                      {row.editable ? (
                        <input
                          className="pir-pd-editable-cell-input pir-pd-item-input"
                          value={row.label}
                          onChange={(e) => updateRowLabel(sectionIndex, rowIndex, sanitiseLineName(e.target.value))}
                          disabled={!section.title.trim()}
                          placeholder={section.title.trim() ? "Enter New Line Item..." : "Enter a section name to continue"}
                          title={!section.title.trim() ? "Enter a section name to enable this field" : "Letters and spaces only"}
                          aria-label="Line item"
                        />
                      ) : (
                        row.label
                      )}
                    </td>
                    {row.cells.map((cell, i) =>
                      row.editable ? (
                        <Fragment key={`${row.id}-${i}`}>
                          <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                            <input
                              className="pir-pd-editable-cell-input pir-pd-amount-input"
                              value={cell.spc}
                              onChange={(e) => updateCell(sectionIndex, rowIndex, i, "spc", sanitiseAmount(e.target.value))}
                              disabled={!row.label.trim()}
                              title={!row.label.trim() ? "Enter an item description to enable this field" : "Numbers only"}
                              aria-label="SPC projected"
                            />
                          </td>
                          <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                            <input
                              className="pir-pd-editable-cell-input pir-pd-amount-input"
                              value={cell.ytd}
                              onChange={(e) => updateCell(sectionIndex, rowIndex, i, "ytd", sanitiseAmount(e.target.value))}
                              disabled={!row.label.trim()}
                              title={!row.label.trim() ? "Enter an item description to enable this field" : "Numbers only"}
                              aria-label="YTD actuals and forecast"
                            />
                          </td>
                          <td className="pir-pd-value-cell pir-pd-editable-value-cell">
                            <input
                              className="pir-pd-editable-cell-input pir-pd-amount-input"
                              value={cell.variance}
                              onChange={(e) => updateCell(sectionIndex, rowIndex, i, "variance", sanitiseAmount(e.target.value))}
                              disabled={!row.label.trim()}
                              title={!row.label.trim() ? "Enter an item description to enable this field" : "Numbers only"}
                              aria-label="Variance"
                            />
                          </td>
                        </Fragment>
                      ) : (
                        (() => {
                          // The TOTAL rollup column is a summary — not drillable
                          // (there is no single fiscal year to drill into).
                          const isTotal = report.years[i].isTotal === true;
                          const totalCls = isTotal ? " pir-pd-total-cell" : "";
                          // A section made up entirely of rate/percent lines rolls its
                          // subtotal up as a percent too (e.g. "Subtotal Returns").
                          const sectionLineRows = section.rows.filter((r) => r.type === "line");
                          const isPercent =
                            row.type === "subtotal"
                              ? sectionLineRows.length > 0 && sectionLineRows.every((r) => isPercentRow(r.label))
                              : isPercentRow(row.label);
                          const futureForecastCell =
                            !isTotal &&
                            !isPercent &&
                            row.type === "line" &&
                            !row.isAdjustment &&
                            isFutureFiscalYear(report.years[i].key);
                          const editKey = futureForecastEditKey(row.id, report.years[i].key);
                          const editedValue = futureForecastEdits[editKey];
                          // The drilldown is keyed on fin_eval_line_id, so a line
                          // without one (e.g. the Section Adjustments rollup) can't
                          // be drilled even though it has values.
                          const drillable =
                            !isTotal &&
                            onActualClick &&
                            row.finEvalLineId != null &&
                            row.finEvalLineId !== "" &&
                            cell.ytd !== "-" &&
                            cell.ytd !== "";
                          return (
                            <Fragment key={`${row.id}-${i}`}>
                              <td className={`pir-pd-value-cell${totalCls}`}>
                                {isPercent ? formatPercentCell(cell.spcNum, fmt) : cellText(cell.spcNum, cell.spc, fmt)}
                              </td>
                              <td className={`pir-pd-value-cell${totalCls} ${drillable && !futureForecastCell ? "pir-pd-actuals-link-cell" : ""}`}>
                                {futureForecastCell ? (
                                  <span className="pir-pd-scaled-input">
                                    <input
                                      className="pir-pd-editable-cell-input pir-pd-amount-input"
                                      value={editedValue ?? (cell.ytdNum == null ? "" : editorValue(cell.ytdNum, fmt))}
                                      onChange={(e) => setFutureForecastEdits((current) => ({
                                        ...current,
                                        [editKey]: sanitiseAmount(e.target.value),
                                      }))}
                                      inputMode="decimal"
                                      aria-label={`${report.years[i].label} YTD actuals and forecast in ${fmt.scale}`}
                                    />
                                  </span>
                                ) : (
                                  <span
                                    className={`pir-pd-ytd-${cell.ytdTone} ${cell.ytdLinked && !isTotal ? "pir-pd-linked-value" : ""}`}
                                    onClick={
                                      drillable && !futureForecastCell
                                        ? () => onActualClick?.({
                                              id: row.id,
                                              finEvalLineId: row.finEvalLineId ?? null,
                                              finEvalSectionId: section.finEvalSectionId ?? null,
                                              account: row.account ?? "",
                                              fy: report.years[i].key,
                                              label: row.label,
                                              section: section.title,
                                              spc: cell.spc,
                                              ytd: cell.ytd,
                                              spcNum: cell.spcNum,
                                              ytdNum: cell.ytdNum,
                                            })
                                        : undefined
                                    }
                                    title={drillable && !futureForecastCell ? "View actuals drilldown" : undefined}
                                  >
                                    {isPercent ? formatPercentCell(cell.ytdNum, fmt) : cellText(cell.ytdNum, cell.ytd, fmt)}
                                  </span>
                                )}
                              </td>
                              <td className={`pir-pd-value-cell${totalCls} pir-pd-variance pir-pd-variance-${cell.varianceTone}`}>
                                {isPercent ? formatPercentCell(cell.varianceNum, fmt) : cellText(cell.varianceNum, cell.variance, fmt)}
                              </td>
                            </Fragment>
                          );
                        })()
                      )
                    )}
                  </tr>
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
      </div>

      {/* ── Footer actions ─────────────────────────────────── */}
      <div className="pir-pd-report-actions">
        {pendingSaveCount > 0 && (
          <span className="pir-pd-report-pending">
            {pendingSaveCount} change{pendingSaveCount === 1 ? "" : "s"} ready to save
          </span>
        )}
        <button
          type="button"
          className="pir-pd-report-reset"
          onClick={resetActuals}
          disabled={loading || saving}
        >
          <span aria-hidden="true">↺</span> Reset Actuals
        </button>
        <button
          type="button"
          className="pir-pd-report-save"
          onClick={() => { void saveAll(); }}
          disabled={loading || saving || pendingSaveCount === 0}
          title={pendingSaveCount === 0 ? "Edit a future forecast value or add a line to enable saving" : undefined}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      {toast && <div className="pir-pd-toast" role="status">{toast}</div>}
      <StatusBanner kind="error" messages={errorMessages} onClose={() => setErrorMessages([])} />
      <StatusBanner kind="success" messages={successMessages} onClose={() => setSuccessMessages([])} autoDismissMs={5000} />

      <style>{`
        /* ── "+ New Line" row ───────────────────────────────── */
        .pir-pd-new-row .pir-pd-item-cell,
        .pir-pd-new-row .pir-pd-value-cell {
          height: 36px;
          color: #9aa3b2;
          font-weight: 500;
        }

        .pir-pd-new-row:hover .pir-pd-item-cell,
        .pir-pd-new-row:hover .pir-pd-new-row-filler {
          background: #fbfcfe;
        }

        .pir-pd-new-line-button {
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

        .pir-pd-new-line-button:hover {
          border-color: #1D2C4D;
          color: #1D2C4D;
          background: #dde2ec69;
        }

        /* ── Inline draft row ───────────────────────────────── */
        .pir-pd-draft-row .pir-pd-item-cell,
        .pir-pd-draft-row .pir-pd-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-draft-row .pir-pd-editable-cell-input {
          border-color: #cdd6ea;
          background: #ffffff;
        }

        .pir-pd-draft-muted {
          color: #b3bccb;
          font-style: italic;
        }

        .pir-pd-draft-auto {
          color: #b3bccb;
          font-style: italic;
        }

        .pir-pd-draft-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .pir-pd-draft-cancel {
          padding: 3px 8px;
          border-radius: 4px;
          background: #ffffff;
          color: #687386;
          border: 1px solid #e6e9ee;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .pir-pd-draft-cancel:hover { color: #001a3b; background: #f4f6f9; }

        /* ── "Section Adjustments" row (is_section_adj = "Y") ─
           Same metrics as a normal line — only the tint marks it apart. */
        .pir-pd-adjustment-row .pir-pd-item-cell,
        .pir-pd-adjustment-row .pir-pd-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        /* ── Footer actions ─────────────────────────────────── */
        .pir-pd-report-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 14px 20px;
          background: #f7f8fa;
          border-top: 1px solid #e6e9ee;
        }

        .pir-pd-report-pending {
          margin-right: auto;
          font-size: 13px;
          color: #687386;
        }

        .pir-pd-report-save-error {
          margin-right: auto;
          font-size: 13px;
          font-weight: 600;
          color: red;
        }

        .pir-pd-report-reset,
        .pir-pd-report-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 20px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-report-reset {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: #1D2C4D;
        }

        .pir-pd-report-reset:hover:not(:disabled) {
          background: #eef1f5;
          border-color: #c4cbd8;
        }

        .pir-pd-report-save {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: #1D2C4D;
        }

        .pir-pd-report-save:hover:not(:disabled) {
          background: #eef1f5;
          border-color: #c4cbd8;
        }

        .pir-pd-report-reset:disabled,
        .pir-pd-report-save:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ── Toast ──────────────────────────────────────────── */
        .pir-pd-toast {
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

        /* Card container around the whole report. overflow:hidden here is safe —
           it's the parent of the scrolling element, so it clips the card to
           rounded corners without breaking the sticky first column inside. */
        .pir-pd-report-wrap {
          width: 100%;
          max-width: 100%;
          background: #ffffff;
          color: #001a3b;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(29, 38, 51, 0.06), 0 8px 24px -14px rgba(29, 38, 51, 0.12);
          overflow: hidden;
        }

        /* Only the table scrolls horizontally */
        .pir-pd-report-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
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

        .pir-pd-scaled-input {
          position: relative;
          display: block;
        }

        .pir-pd-scaled-input .pir-pd-editable-cell-input {
          padding-right: 18px;
        }

        .pir-pd-scaled-input-unit {
          position: absolute;
          top: 50%;
          right: 5px;
          transform: translateY(-50%);
          color: #687386;
          font-size: 12px;
          font-weight: 700;
          pointer-events: none;
        }

        /* Value inputs stay locked until the row has an item description */
        .pir-pd-editable-cell-input:disabled {
          background: #f4f6f9;
          color: #c4cbd8;
          cursor: not-allowed;
        }

        .pir-pd-item-input { text-align: left; font-weight: 600; }

        .pir-pd-item-input::placeholder {
          font-weight: 400;
          color: #9aa3b2;
        }
        .pir-pd-amount-input { text-align: right; }
        .pir-pd-editable-value-cell { padding: 4px 8px; }

        .pir-pd-section-title-input {
          width: min(420px, 70%);
          height: 24px;
          border: 1px solid transparent;
          border-radius: 3px;
          background: transparent;
          color: #1D2C4D;
          font: inherit;
          font-weight: 700;
          letter-spacing: inherit;
          text-transform: uppercase;
          outline: none;
        }

        .pir-pd-section-title-input:focus {
          border-color: rgba(29, 44, 77, 0.45);
          background: rgba(255, 255, 255, 0.65);
        }

        .pir-pd-section-title-input::placeholder {
          color: rgba(29, 44, 77, 0.55);
          font-weight: 600;
          text-transform: none;
          letter-spacing: normal;
        }

        .pir-pd-report-state {
          padding: 40px 20px;
          text-align: center;
          color: #687386;
          font-size: 14px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
        }

        .pir-pd-report-error {
          color: red;
          background: #dde2ec69;
          border-color: #d5dbe7;
        }

        .pir-pd-report-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          /* Frame/rounding is provided by the .pir-pd-report-wrap card.
             NOTE: no overflow:hidden here — it would break the sticky first
             column (item names) inside the horizontally-scrolling wrapper. */
          font-size: 12px;
        }

        .pir-pd-report-table th,
        .pir-pd-report-table td {
          border-right: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-report-table th:last-child,
        .pir-pd-report-table td:last-child {
          border-right: 0;
        }

        .pir-pd-item-header {
          min-width: 240px;
          width: 240px;
          height: 64px;
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

        .pir-pd-year-header {
          height: 34px;
          padding: 0 16px;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: center;
          vertical-align: middle;
        }

        /* Metric sub-headers: subtle grey on a light row (not FY-tone coloured) */
        .pir-pd-metric-header {
          min-width: 120px;
          height: 40px;
          padding: 6px 14px;
          background: #f8f9fa;
          color: #1D2C4D;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
          line-height: 1.25;
        }

        /* One heading tint for every fiscal-year column — the year label does the
           distinguishing, so the tone classes all resolve to the same band. The
           TOTAL rollup keeps a slightly deeper tint to mark it as a summary. */
        .pir-pd-fy-purple,
        .pir-pd-fy-blue,
        .pir-pd-fy-green,
        .pir-pd-fy-pink,
        .pir-pd-fy-orange { background: #dde2ec69; }
        .pir-pd-fy-total  { background: #e4e8ef; }

        /* TOTAL rollup column — emphasised against the per-year columns */
        .pir-pd-total-cell {
          background: #f4f6f9;
          font-weight: 700;
          border-left: 1px solid #d5dbe7;
        }

        .pir-pd-subtotal-row .pir-pd-total-cell { background: #e4e8ef; color: #1D2C4D; }

        .pir-pd-section-row td {
          height: 40px;
          padding: 0;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          vertical-align: middle;
        }

        /* The full-width <td> can't stick (it fills its row), so the label
           inside it is what stays pinned to the left as the data scrolls. */
        .pir-pd-section-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 20px;
          position: sticky;
          left: 0;
          z-index: 2;
        }

        .pir-pd-section-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          padding: 0;
          border: 0;
          border-radius: 3px;
          background: transparent;
          color: #1D2C4D;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .pir-pd-section-toggle:hover {
          background: rgba(29, 44, 77, 0.1);
        }

        .pir-pd-section-caret {
          font-size: 11px;
          line-height: 1;
          transition: transform 0.15s ease;
        }

        /* Rotate the caret to point right when the section is collapsed */
        .pir-pd-caret-collapsed {
          transform: rotate(-90deg);
        }

        .pir-pd-section-title-text {
          display: inline-block;
        }

        .pir-pd-item-cell {
          min-width: 240px;
          width: 240px;
          height: 40px;
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

        .pir-pd-value-cell {
          height: 40px;
          padding: 0 14px;
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

        .pir-pd-actuals-link-cell {
          cursor: pointer;
        }

        .pir-pd-actuals-link-cell:hover {
          background: #dde2ec69;
        }

        .pir-pd-actuals-link-cell:hover .pir-pd-linked-value {
          color: #1D2C4D;
        }

        /* YTD Actuals + Forecast — coloured by sign (overrides the linked grey) */
        .pir-pd-ytd-green { color: #1ea761; font-weight: 600; }
        .pir-pd-ytd-red   { color: red; font-weight: 600; }

        .pir-pd-variance { font-weight: 600; }
        .pir-pd-variance-red   { color: red; }
        .pir-pd-variance-green { color: #1ea761; }
        .pir-pd-variance-none  { color: #9aa3b2; font-weight: 500; }

        .pir-pd-subtotal-row .pir-pd-item-cell,
        .pir-pd-subtotal-row .pir-pd-value-cell {
          height: 38px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-weight: 700;
        }

        .pir-pd-subtotal-row .pir-pd-item-cell { color: #1D2C4D; }

        /* Value inputs in the draft row stay locked until a line name is typed
           (must sit after the .pir-pd-draft-row tint to win on equal specificity) */
        .pir-pd-draft-row .pir-pd-editable-cell-input:disabled {
          background: #f4f6f9;
          border-color: transparent;
          color: #c4cbd8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
