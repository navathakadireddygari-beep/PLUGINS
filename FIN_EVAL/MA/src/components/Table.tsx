import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import SpreadsheetCell from "@/components/SpreadsheetCell";
import { ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import {
  clampPercent,
  isNoTotalRow,
  isPercentRow,
  isValidPercentInput,
  type RowIdentity,
} from "@/lib/row-rules";
import Toast, { type ToastState } from "@/components/Toast";
import { emitDeleted, emitSaved, onHostRefresh } from "@/lib/app-bridge";
import {
  SpreadsheetProvider,
  type CellPos,
  type SpreadsheetApi,
} from "@/components/spreadsheetContext";
import {
  cellExists,
  focusCell,
  nextNavCell,
  parseClipboardMatrix,
  readClipboard,
  readSelectionTSV,
  writeClipboard,
} from "@/lib/spreadsheet";
import useFinancialEvaluation from "@/hooks/useFinancialEvaluation";
import useSaveFinancialEvaluation from "@/hooks/useSaveFinancialEvaluation";
import useDeleteFinEvalLine from "@/hooks/useDeleteFinEvalLine";
import useDeleteFinEvalSection from "@/hooks/useDeleteFinEvalSection";
import { useSaveModel } from "@/context/SaveModelContext";
import { applyMaNpvBlock, recalcMaGrids } from "@/lib/ma-recalc";
import { DARK_HEADER } from "@/components/strip-styles";
import { cagrOf } from "@/lib/ma-formulas";
import { formatNumber, formatPercent } from "@/lib/number-format";
import { actualsCountOf, fyNumberOf } from "@/lib/fiscal-years";
import { collectGridRows, type NewSectionDraft } from "@/lib/save-collect";
import {
  getProposalId,
  isHostReadonly,
  isProposalStatusReadonly,
  sectionIndexOfKey,
} from "@/api";
import type {
  FinancialEvaluationEdits,
  FinEvalGridRow,
  FinEvalNpvRow,
  NewLineEdit,
  NewSectionEdit,
} from "@/api";

type Row = {
  id: string;
  label: string;
  bg?: "yellow" | "blue" | undefined;
  values: string[];
  /** Locked row: cells are navigable but not editable. */
  readOnly?: boolean;
  /**
   * Key of the template line this row came from, used to write the row's
   * values back into the save payload. Absent on rows the user added, which
   * the endpoint has no slot for yet and which are therefore not saved.
   */
  apiKey?: string;
  /**
   * Server-side id of the line this row came from (`fin_eval_line_id`). Present
   * only on rows the server already knows about — those are the ones the trash
   * icon can DELETE. Rows added locally have none and are simply dropped from
   * state.
   */
  lineId?: number | null;
  /** Stable server-side row type, for the percentage / tax-rate rules. */
  lineType?: string | null;
  /** Owning section's `section_type` — drives the section subtotal sums. */
  sectionType?: string | null;
  /** Owning section's `section_name`, rendered as the group header bar. */
  sectionName?: string | null;
  /**
   * Identity of the owning SECTION — `s3` for a section the response carried,
   * `new:<id>` for one added on screen. Every grouping decision keys on this
   * rather than on `sectionType`, which two custom sections share.
   */
  sectionKey?: string;
  /** Owning section's server id, when it has one. Null on an added section. */
  sectionId?: number | null;
  /** True when the owning section is the USER's (renameable, deletable). */
  sectionIsCustom?: boolean;
  /**
   * Local id of the section this row was added into THIS SESSION. Present only
   * on rows of a section that has no server identity yet; it is what routes the
   * row into `newSections` on save instead of under the section above it.
   */
  newSectionId?: string;
  /** Owning section's `is_new_line_required` — server-driven add/delete rule. */
  allowsNewLines?: boolean;
  /** Template identifier for the line, same purpose as `lineType`. */
  lineIdentifier?: string | null;
  /** True when server computes/owns this row. */
  isCalculated?: boolean;
  /** Mandatory rows should not show delete icon. */
  isMandatory?: boolean;
  /** Non-custom template rows should not show delete icon. */
  isCustom?: boolean;
};

// The year columns come from the response's own `fiscalYears` (see `fyKeys`),
// NOT from the calendar. `display_years` says how many of them are projections;
// the rest, at the front, are the actuals. The "N Years" control in the header
// adjusts that split. Anchoring to `new Date()` instead used to shift the whole
// grid whenever the backend's window disagreed with the browser's year.
// The NPV table's three columns (Target standalone / Experian factor / Total)
// are the shape of `m_a_npv_calculation.components`, not a display choice.
const NPV_COLS = 3;

/**
 * Projection columns shown before the response arrives. Replaced by the
 * response's `display_years` the moment it lands — this only covers the gap
 * while the GET is in flight.
 */
const DEFAULT_DISPLAY_YEARS = 6;

// Pad/truncate a values array to `size` slots, so every column the response
// defines is addressable and nothing beyond it is.
const toCapacity = (size: number, values?: string[]): string[] => {
  const out = (values ?? []).slice(0, size);
  while (out.length < size) out.push("");
  return out;
};

const makeRow = (
  size: number,
  label = "",
  bg?: Row["bg"],
  values?: string[],
): Row => ({
  id: String(Math.random()).slice(2),
  label,
  bg,
  values: toCapacity(size, values),
});

// Column index for each "fy26"-style bucket, derived from the ORDER the
// response lists its fiscal years in. Built per load rather than from the
// clock, so a value always lands under its own year.
const colIndexOf = (fiscalYears: string[]): Record<string, number> =>
  Object.fromEntries(fiscalYears.map((fy, i) => [fy, i]));


/**
 * Template line -> grid row. `yearValues` are already stored base values (the
 * service converts them), so they are placed into the row untouched.
 */
// Row ids carry the position as well as the template code so that a code
// repeated across two sections of the same grid still yields unique keys.
const rowFromApi = (
  line: FinEvalGridRow,
  index: number,
  colByFy: Record<string, number>,
  size: number,
): Row => {
  const values = toCapacity(size);
  Object.entries(line.yearValues).forEach(([fy, value]) => {
    const col = colByFy[fy];
    if (col !== undefined) values[col] = value;
  });
  return {
    id: `${line.code}#${index}`,
    label: line.label,
    bg: line.tint,
    values,
    readOnly: line.readOnly,
    isCalculated: line.isCalculated,
    isMandatory: line.isMandatory,
    isCustom: line.isCustom,
    apiKey: line.key,
    lineId: line.lineId,
    lineType: line.lineType,
    lineIdentifier: line.lineIdentifier,
    sectionType: line.sectionType,
    sectionName: line.sectionName,
    sectionKey: line.sectionKey,
    sectionId: line.sectionId,
    sectionIsCustom: line.sectionIsCustom,
    allowsNewLines: line.allowsNewLines,
  };
};

/** NPV component -> grid row (three fixed columns). */
const npvRowFromApi = (component: FinEvalNpvRow, index: number): Row => ({
  id: `${component.code}#${index}`,
  label: component.label,
  bg: component.tint,
  values: toCapacity(NPV_COLS, component.values),
  readOnly: component.isCalculated,
  isCalculated: component.isCalculated,
  isMandatory: component.isMandatory,
  isCustom: false,
  apiKey: component.key,
});

// The reference renders every table row on white with a faint grey hover
// (.t-Report tbody tr { background: #fff } / tr:hover { #fafbfc }) and defines
// no tinted or striped row backgrounds, so `bg` no longer changes the surface.
/* ─────────────────────────── Column widths ───────────────────────────
 * Every grid is `table-fixed`, which splits the width equally across columns
 * unless it is told otherwise. With no <colgroup> the label column got the same
 * share as a year column, so rows like "Standalone operating cashflow" were
 * ellipsed halfway through while the figure columns sat half empty.
 *
 * The numbers are the reference project's colgroup verbatim (Prod Dev ->
 * Table.tsx): 36 actions / 180 LINE ITEM / 240 ACCOUNT / years at 120 / 140
 * TOTAL, on a table with `minWidth: 700`.
 *
 * The label column is 180 — the reference's LINE ITEM width, nothing added.
 * Prod Dev only reaches a wider label by MERGING the account column into it
 * (`colSpan={group.isAccountRequired !== "Y" ? 2 : 1}`), and that merge is
 * about reclaiming a column M&A never renders in the first place, not about the
 * label needing the room. Long labels are handled the way the reference handles
 * them: ellipsis plus the full text in the cell's `title`.
 */
const LABEL_COL_WIDTH = 180;

/** Row-actions (trash) column — the reference's 36px. */
const ACTION_COL_WIDTH = 36;
/** Year column — the reference's 120px. */
const YEAR_COL_MIN_WIDTH = 120;
/** Trailing summary column — the reference's 140px on its TOTAL column. */
const CAGR_COL_WIDTH = 140;

/**
 * The <colgroup> shared by every year-by-year grid: actions (when the screen is
 * editable), the wide label column, one column per visible year, and optionally
 * the trailing CAGR column.
 */
const GridColgroup: React.FC<{
  showActions: boolean;
  yearCount: number;
  cagr?: boolean;
}> = ({ showActions, yearCount, cagr = false }) => (
  <colgroup>
    {showActions && <col style={{ width: ACTION_COL_WIDTH }} />}
    <col style={{ width: LABEL_COL_WIDTH }} />
    {Array.from({ length: yearCount }, (_, i) => (
      <col key={i} style={{ minWidth: YEAR_COL_MIN_WIDTH }} />
    ))}
    {cagr && <col style={{ width: CAGR_COL_WIDTH }} />}
  </colgroup>
);

/** The strings the percentage / tax-rate rules match a row on. */
const identityOf = (row: Row): RowIdentity => ({
  lineIdentifier: row.lineIdentifier,
  lineType: row.lineType,
  name: row.label,
});

/* ───────────────────── Row styling (Prod Dev parity) ─────────────────
 * The reference renders a CALCULATED line as a grey band with bold near-black
 * text, and an EDITABLE line on white. Transcribed from Prod Dev's
 * `renderCalcRow` / `renderEditable`:
 *
 *   calc row   <tr background #f3f4f6>
 *              label  8px 12px · 12px · 700 · #111
 *              value  8px 12px · 13px · 700 · #111  (negatives #DC2626)
 *   edit row   <tr white>
 *              label  4px 12px · 12px · 700 template / 400 custom · #1f2937
 *              value  4px 12px · 13px · 400 · #1f2937  (negatives #DC2626)
 *   both       td 40px tall, 1px #e5e7eb rules
 *
 * MA previously greyed the calculated CELLS but left the row white and rendered
 * the calculated LABEL in #6b7280, so a computed line read as a disabled input
 * rather than as a figure the system owns.
 */
/**
 * A row is LOCKED when the user cannot type into it — either the server owns
 * the figure (`is_calculated`), the line itself is flagged read-only, or the
 * whole screen is view-only.
 *
 * This is the single predicate behind BOTH visible rules: a locked row is
 * greyed out, and a locked row carries no delete icon. Deriving them from one
 * function is what keeps them from disagreeing — the state where a row looks
 * editable but offers no delete, or looks locked but offers one, cannot occur.
 */
const isRowLocked = (row: Row, isReadonly: boolean): boolean =>
  isReadonly || !!row.isCalculated || !!row.readOnly;

/**
 * Surface for a locked row: #f3f4f6, as in Prod Dev. Applied to the whole
 * `<tr>` so the label column and the figures beside it are one continuous
 * block (see SpreadsheetCell, whose resting state is transparent so this shows
 * through). Rows have no hover colour — Prod Dev has none.
 *
 * Written as a literal, never interpolated: Tailwind generates utilities by
 * scanning source TEXT, so a `bg-[${...}]` built at runtime produces no class
 * at all and the row silently renders unpainted.
 */
const rowBgClass = (locked: boolean): string =>
  locked ? "bg-[#f3f4f6]" : "bg-white";

/**
 * Label cell text. Bold near-black marks a COMPUTED line specifically — not
 * merely a locked one — so a view-only screen still reads as inputs and
 * derived figures rather than one undifferentiated grey slab.
 */
const labelTextClass = (isCalculated: boolean | undefined): string =>
  isCalculated
    ? "text-[12px] font-bold text-[#111]"
    : "text-[12px] font-normal text-[#1f2937]";

/** Template (non-custom) line names are bold #111827, as in Prod Dev. */
const TEMPLATE_LABEL_CLASS = "text-[12px] font-bold text-[#111827]";

/**
 * The divider between the ACTUALS block and the PROJECTIONS block. Dark grey so
 * the two halves of the grid read as separate at a glance; the 2px weight is
 * what distinguishes it from the ordinary 1px cell rules.
 */
const PARTITION_BORDER = "2px solid #4b5563";

/** Right-hand partition on the last ACTUALS column, else nothing. */
const partitionStyle = (
  col: number,
  actualsCount: number,
): React.CSSProperties | undefined =>
  actualsCount > 0 && col === actualsCount - 1
    ? { borderRight: PARTITION_BORDER }
    : undefined;

/* ─────────────────── Which rows can be added / deleted ───────────────
 * Per SECTION, not per table, because the first grid renders three sections
 * back to back (Revenue, Costs, Returns Analysis) with different rules:
 *
 *   REVENUE                   input lines deletable · "+ Add Row" beneath
 *   COSTS                     input lines deletable · "+ Add Row" beneath
 *   RETURNS_ANALYSIS          all computed — no delete, no add
 *   COMBINED_FREE_CASH_FLOWS  input lines deletable · "+ Add Row" beneath
 *   POST_TAX_RETURN           no delete, no add
 *   (NPV block)               no delete, no add
 */
const tok = (s: string | null | undefined): string =>
  (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * The section a row belongs to, as one comparable string.
 *
 * Grouping used to compare `sectionType`, which works only while every section
 * has a distinct one. It stops working the moment the screen can ADD sections:
 * two of those both carry "CUSTOM" and would be drawn, collapsed and saved as a
 * single merged block. `sectionKey` is unique per section — `s3` by position in
 * the payload, `new:<id>` before the section has been saved — and the
 * `section_type` fall-back only covers rows built before this field existed.
 */
const sectionKeyOf = (row: Row): string =>
  row.sectionKey ?? `type:${tok(row.sectionType)}`;

const SECTIONS_ALLOWING_ROWS: ReadonlySet<string> = new Set([
  "REVENUE",
  "COSTS",
  "COMBINEDFREECASHFLOWS",
]);

/**
 * True when this row's section may gain and lose lines.
 *
 * The SERVER's `is_new_line_required` is the authority — it already says "Y" on
 * Revenue and Costs and "N" on Returns Analysis, and the reference gates on
 * exactly that flag. The section-name list is only a fallback for payloads that
 * omit it (an unsaved template), so the screen still behaves sensibly rather
 * than offering "+ Add Row" on every computed block.
 */
const rowAllowsRows = (row: Row): boolean =>
  row.allowsNewLines ?? SECTIONS_ALLOWING_ROWS.has(tok(row.sectionType));

/**
 * Whether the trash icon shows for a row.
 *
 *  1. A CALCULATED line is never deletable, whatever its section says. The
 *     server owns it, the grid renders it as a read-only figure, and offering
 *     to remove a cell the user cannot even type into reads as broken.
 *  2. Its SECTION must be one that takes lines at all (Revenue, Costs, Combined
 *     Free Cash Flows). Returns Analysis, Post Tax Return and the NPV block are
 *     computed blocks and never show the icon.
 *  3. A TEMPLATE line (`is_custom: "N"`) is never deletable — only lines the
 *     user added. Same rule as Prod Dev (`value.isCustom !== "N"`).
 *     `isCustom` is `false` only for lines the response marks "N"; rows added
 *     on screen leave it unset, so they keep the icon.
 */
const canDeleteRow = (row: Row, isReadonly: boolean): boolean =>
  !isRowLocked(row, isReadonly) && rowAllowsRows(row) && row.isCustom !== false;

/**
 * A percentage input for the Key Inputs panel. Accepts digits and a single
 * decimal point only (no text characters) and never lets the value exceed 100.
 */
const PercentInput: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  /** View-only mode: the value is shown on the locked surface, not editable. */
  readOnly?: boolean;
}> = ({ value, onValueChange, readOnly = false }) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // digits + at most one decimal point, nothing else
    let raw = e.target.value.replace(/[^0-9.]/g, "");
    const dot = raw.indexOf(".");
    if (dot !== -1) {
      raw = raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, "");
    }
    // clamp to a maximum of 100
    if (raw !== "" && raw !== "." && Number(raw) > 100) raw = "100";
    onValueChange(raw);
  };
  return (
    <input
      readOnly={readOnly}
      className={`w-20 text-right text-[13px] text-[#1f2937] outline-none ${readOnly ? "cursor-default bg-[#f3f4f6] text-[#6b7280]" : "bg-transparent"}`}
      value={value}
      onChange={onChange}
      inputMode="decimal"
    />
  );
};

const Table: React.FC = () => {
  // Projection columns currently shown, and how many leading fiscal years the
  // response treats as actuals. Both start at 0 — unknown until the GET lands —
  // and are derived from `fiscalYears` + `display_years`, never hardcoded.
  const [years, setYears] = useState<number>(DEFAULT_DISPLAY_YEARS);
  const [actualsCount, setActualsCount] = useState<number>(0);
  // Fiscal-year buckets for the loaded evaluation, in order (e.g. fy24..fy33).
  // Empty until the response lands — the grid has no columns before then.
  const [fyKeys, setFyKeys] = useState<string[]>([]);
  /** Sections the user has collapsed, keyed `${gridId}:${sectionKey}`. */
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );
  /**
   * Whole GRIDS the user has collapsed, by grid id.
   *
   * Combined Free Cash Flows, Post Tax Return and the NPV block each render a
   * single section, so a header bar inside them would only repeat the title
   * above it — their title bar IS the collapse control. Combined Operating
   * Results is deliberately absent: it already collapses per section (Revenue,
   * Total Costs, Returns Analysis), and a second control over the top of those
   * would leave two different things called "collapsed".
   */
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(
    () => new Set(),
  );
  /**
   * Collapse key of a section to scroll to once it has rendered. Set when a
   * section is added: it lands at the BOTTOM of the first grid, which on a
   * populated evaluation is well below the fold.
   */
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  // Global currency / FX / scale state + shared formatters (single source of
  // truth — the primary controls live in the Header). This component only reads
  // the shared formatters; it no longer renders a duplicate currency toolbar.
  const {
    currency,
    fxRateNumber,
    fxRateKnown,
    formatBaseToDisplayed,
    formatBaseToEditable,
    parseDisplayedToBase,
    numberFormat,
    setProposalCurrencies,
  } = useCurrencyFormat();

  // Transient success/error notice, and the pending delete awaiting
  // confirmation — both ported from the reference project.
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    name: string;
    run: () => void;
  } | null>(null);
  /**
   * Lines already DELETED on the server this session.
   *
   * The PUT is assembled by echoing back what the last GET returned, and that
   * response still contains the deleted row — so without this list the next
   * save sends it straight back and it reappears on the following reload.
   * Cleared whenever a fresh response lands, because by then the server's own
   * answer no longer contains them.
   */
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>([]);
  /** Same, for whole sections removed through the delete endpoint. */
  const [deletedSectionIds, setDeletedSectionIds] = useState<number[]>([]);

  // Every grid starts EMPTY and is filled from the GET response. There is no
  // seed data: invented rows are indistinguishable from the proposal's own once
  // rendered, so a failed load must show nothing rather than a plausible
  // fiction. Section -> grid routing lives in SECTION_GRID (api/financial-api).
  /** Consideration (Cash / Deferred / Contingent) — its own panel beside Key Inputs. */
  const [conRows, setConRows] = useState<Row[]>([]);
  /** Fiscal-year buckets the Consideration lines carry — its column set. */
  const [conFyKeys, setConFyKeys] = useState<string[]>([]);
  const [corRows, setCorRows] = useState<Row[]>([]);
  const [fcfRows, setFcfRows] = useState<Row[]>([]);
  const [ptrRows, setPtrRows] = useState<Row[]>([]);
  const [npvRows, setNpvRows] = useState<Row[]>([]);
  /**
   * Sections the USER added, rendered as their own block below the NPV table.
   *
   * Deliberately NOT part of `corRows`. An added section is not part of
   * Combined Operating Results — it feeds none of its subtotals and belongs to
   * none of its sections — and holding it there put it between Returns Analysis
   * and the cash-flow tables, which is neither where it was asked for nor where
   * the payload's `display_order` brings it back.
   */
  const [cusRows, setCusRows] = useState<Row[]>([]);

  // Key Inputs come wholesale from `m_a_key_inputs.inputs` — labels included,
  // so the panel reflects whatever the template defines rather than a list
  // hardcoded here.
  type KeyInput = { code: string; label: string; value: string };
  const [keyInputs, setKeyInputs] = useState<KeyInput[]>([]);

  const setKeyInputValue = (code: string, value: string) =>
    setKeyInputs((prev) =>
      prev.map((k) => (k.code === code ? { ...k, value } : k)),
    );

  // Column layout comes from the response's own fiscal years. `display_years`
  // says how many of them are PROJECTIONS; whatever precedes them are the
  // actuals. Deriving it this way means the grid spans exactly the years the
  // backend stores — no invented leading column, no trailing year left
  // unreachable.
  const fyLabel = (i: number): string => (fyKeys[i] ?? "").toUpperCase();
  // The +/- control can only reach years the response actually carries: one
  // projection at minimum, and at most every fiscal year after the actuals.
  // Going past that would need a column the payload has no bucket for.

  const visibleCols = Math.min(fyKeys.length, actualsCount + years);
  const allYearIdx = Array.from({ length: visibleCols }, (_, i) => i);
  const projYearIdx = allYearIdx.slice(actualsCount); // projection-only
  /**
   * Consideration columns: the fiscal years its own lines carry (e.g. fy27-fy29),
   * not the full grid. Falls back to the first three projection years when the
   * response sends no Consideration buckets.
   */
  const conYearIdx = (() => {
    const idx = conFyKeys
      .map((fy) => fyKeys.indexOf(fy))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    return idx.length > 0 ? idx : projYearIdx.slice(0, 3);
  })();
  /**
   * Projection columns actually on screen. This — not the raw `years` state —
   * is what the stepper reports and what "-" is gated on, so the number in the
   * box always equals the columns to the right of the partition.
   *
   * They can differ: `years` starts from the response's `display_years`, which
   * is computed against the BACKEND's actuals split. Ours puts the current
   * fiscal year on the actuals side, so the two can disagree by a column, and
   * that slack used to swallow the first press of "-".
   */
  const projectionsShown = Math.max(0, visibleCols - actualsCount);
  /**
   * Grid column index of the trailing CAGR cell: one past every fiscal-year
   * bucket, so it can never collide with a real value slot (see the cell
   * itself for why that matters).
   */
  const cagrCol = fyKeys.length;
  /**
   * Span of the ACTUALS banner, in columns that actually EXIST.
   *
   * `years` is what the +/- control asks for and `actualsCount` what the
   * response reports; the grid renders `visibleCols`, which is the smaller of
   * the two against the response's own fiscal years. Spanning the banners by
   * the requested counts instead let the header claim columns the body never
   * rendered - while the GET was still in flight that was six phantom
   * projection columns, which pushed the rowSpan'd CAGR header clean off the
   * end of the table and left the column looking unbounded.
   *
   * A zero colSpan is not "no columns" in HTML - it means "to the end of the
   * column group" - so the banner is omitted entirely when there are no
   * actuals rather than rendered empty.
   */
  const actualsColSpan = Math.min(actualsCount, allYearIdx.length);

  /**
   * Live recalculation (see lib/ma-formulas + lib/ma-recalc).
   *
   * Editing a cell writes to `corRows`/`fcfRows`/`ptrRows`; these DERIVED grids
   * are what the tables render, so every calculated line downstream of the edit
   * refreshes immediately. All three grids are recomputed together because EBIT
   * depends on Revenue and Costs, and the cash-flow bridge depends on EBIT.
   *
   * The array order and length are preserved, so the positional indices used by
   * selection, editing and the clipboard stay valid against the source state.
   *
   * The server owns these numbers: it recomputes on save and its answer
   * replaces this on the next GET. This is the between-saves preview.
   */
  const [calcCor, calcFcf, calcPtr, calcNpv] = useMemo<
    [Row[], Row[], Row[], Row[]]
  >(() => {
    const { grids, npvBlock } = recalcMaGrids<Row>(
      [corRows, fcfRows, ptrRows],
      keyInputs,
      visibleCols,
    );
    // The NPV Calculation block (S9) is derived from the same pass — its PV
    // components discount the very cash-flow vectors the grids above produce —
    // so it refreshes with them rather than sitting on the last saved figures
    // while everything feeding it moves.
    return [
      grids[0],
      grids[1],
      grids[2],
      applyMaNpvBlock<Row>(npvRows, npvBlock),
    ];
  }, [corRows, fcfRows, ptrRows, npvRows, keyInputs, visibleCols]);

  /* ─────────────────────────── Year stepper ────────────────────────────
   * "+" ADDS a projection year, the way the reference does
   * (Prod Dev -> increaseYears): it takes the highest fiscal year, appends the
   * next one, and seeds an empty cell for it on every row.
   *
   * MA's stepper used to only SLICE the buckets the response happened to send,
   * so once they were all on screen "+" had nothing left to reveal and "-"
   * needed two presses before a column moved (the response's `display_years`
   * and our own actuals split disagreed by one, and that slack ate the first
   * press). Both are now exact: one press, one column.
   *
   * "-" only hides the trailing projection; it never deletes the bucket or its
   * values. The reference does delete them, but its years are a client-side
   * list — here they are the server's own `fy..` buckets, and dropping one on a
   * mis-click would take a year of entered figures with it. Hiding is
   * reversible, and the narrowed `display_years` still goes out on save.
   */

  /** Widen the grid by one fiscal year, seeding an empty cell on every row. */
  const addProjectionYear = () => {
    if (isReadonly) return;
    const available = Math.max(0, fyKeys.length - actualsCount);
    // A year the response already carries but the view has narrowed past: just
    // widen the view again rather than inventing a duplicate bucket.
    if (projectionsShown < available) {
      setYears(projectionsShown + 1);
      return;
    }
    // Otherwise there is no bucket left to show, so make one.
    const highest = fyKeys.reduce((max, fy) => {
      const n = fyNumberOf(fy);
      return n !== null && n > max ? n : max;
    }, -1);
    if (highest < 0) return; // no parseable buckets; nothing to count from
    const next = `fy${String((highest + 1) % 100).padStart(2, "0")}`;
    if (fyKeys.includes(next)) return;
    setFyKeys([...fyKeys, next]);
    // Every row gains a slot for it, or the new column would render "-" and
    // silently refuse edits (`writeCells` bounds-checks the row's own length).
    const widen = (rows: Row[]): Row[] =>
      rows.map((r) => ({ ...r, values: [...r.values, ""] }));
    setConRows(widen);
    setCorRows(widen);
    setFcfRows(widen);
    setPtrRows(widen);
    setCusRows(widen);
    setYears(projectionsShown + 1);
  };

  /** Narrow the grid by one projection year (the bucket is kept). */
  const removeProjectionYear = () => {
    if (isReadonly) return;
    setYears(Math.max(1, projectionsShown - 1));
  };

  // ----- template load -----
  // The grids are empty until this resolves; every row on screen comes from the
  // response. Values from the service are already in stored base units, so they
  // are placed as-is. A failed fetch leaves the grids empty and surfaces the
  // error (see the loadError effect below).
  const {
    data: template,
    loading,
    error: loadError,
    reload,
  } = useFinancialEvaluation();

  // The host APEX page can ask the widget to re-fetch after it changed
  // something the evaluation depends on.
  //
  // SILENT. The widget emits `tool:fin_eval_saved` / `tool:fin_eval_deleted`,
  // and a host wired to answer those with a refresh turns every save and every
  // delete into a spinner and a blank grid. There are already numbers on
  // screen; swapping them for the server's when they arrive is the whole point
  // of the reference's "silent re-fetch".
  useEffect(() => onHostRefresh(() => reload(true)), [reload]);

  // View-only mode. Mirrors the reference project: a host-declared read-only
  // flag locks the screen outright, and otherwise the proposal's own workflow
  // status decides — once it has left drafting, the numbers are frozen.
  const isReadonly =
    isHostReadonly() || isProposalStatusReadonly(template?.proposalStatus);

  useEffect(() => {
    if (!template) return;
    const colByFy = colIndexOf(template.fiscalYears);
    const size = template.fiscalYears.length;
    setFyKeys(template.fiscalYears);
    // PROJECTIONS come from the response's `display_years` — that one number
    // drives both the PROJECTIONS banner and the "N Years" stepper, so the two
    // can never disagree.
    // Clamped to the projections our own actuals split leaves room for. The
    // response computes `display_years` against ITS split, which puts the
    // current fiscal year on the projections side; ours does not, so the raw
    // value can overshoot the buckets available and is not what gets rendered.
    const actuals = actualsCountOf(template.fiscalYears);
    setYears(
      Math.max(1, Math.min(template.displayYears ?? size, size - actuals)),
    );
    // ACTUALS are the fiscal years BEFORE the current one — the reported window
    // is "current financial year − 3", i.e. FY23/24/25 against a current FY26.
    // Derived from the response's own buckets rather than assumed to be
    // "whatever display_years does not cover": those two are independent facts,
    // and subtracting one from the other silently relabelled a projection as an
    // actual whenever the response carried more years than it displayed.
    setActualsCount(actuals);
    setConRows(template.con.map((l, i) => rowFromApi(l, i, colByFy, size)));
    setConFyKeys([
      ...new Set(template.con.flatMap((l) => Object.keys(l.yearValues))),
    ]);
    setCorRows(template.cor.map((l, i) => rowFromApi(l, i, colByFy, size)));
    setFcfRows(template.fcf.map((l, i) => rowFromApi(l, i, colByFy, size)));
    setPtrRows(template.ptr.map((l, i) => rowFromApi(l, i, colByFy, size)));
    setCusRows(template.cus.map((l, i) => rowFromApi(l, i, colByFy, size)));
    setNpvRows(template.npv.map(npvRowFromApi));
    // Always take the response's Key Inputs, even when it has none. The old
    // `length > 0` guard left the hardcoded seed values (WACC 10, Terminal
    // growth 4, Discount 10, Tax 27) on screen for any proposal the endpoint
    // returns `m_a_key_inputs: null` for — invented numbers presented as the
    // proposal's own, the same failure mode as the USD currency default.
    setKeyInputs(template.keyInputs);
    // The response no longer carries the deleted lines or sections, so both
    // lists have done their job. Holding on to them would filter ids the server
    // may later reuse.
    setDeletedLineIds([]);
    setDeletedSectionIds([]);
    // Rows for the added sections came back from the server with real ids and
    // are rebuilt above, so nothing is left pointing at the local block.
    setPendingScroll(null);
    // The template also fixes the column count, so drop any stale selection.
    setSelection(null);

    // Hand the proposal's local currency to the shared context; it derives the
    // toggle options, decides whether the FX strip is shown at all, and fetches
    // the live rate — skipping the call entirely for USD-only proposals.
    setProposalCurrencies(
      template.localCurrency,
      template.displayCurrency,
      template.exchangeRate,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  /**
   * Bring a newly added section into view.
   *
   * It lands below the NPV table, i.e. at the very bottom of a screen or two
   * of grids — without this the button looks like it did nothing.
   * `scrollMarginTop` clears the host page's sticky navbar, the same 80px the
   * reference uses.
   *
   * Depends on `cusRows` so it runs on the commit that actually put the bar in
   * the DOM, not on the render before it.
   */
  useEffect(() => {
    if (!pendingScroll) return;
    const el = document.querySelector<HTMLElement>(
      `[data-section-key="${pendingScroll}"]`,
    );
    if (el) {
      el.style.scrollMarginTop = "80px";
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Straight into the name field: an unnamed section is not saved, so
      // naming it is the very next thing to do.
      el.querySelector("input")?.focus();
    }
    setPendingScroll(null);
  }, [pendingScroll, cusRows]);

  // ----- template save -----
  // The endpoint round-trips the whole evaluation, so the payload is the
  // loaded template with this screen's edits applied (see
  // buildFinancialEvaluationPayload). Rows the user added locally carry no
  // template key and are skipped — the payload has no slot for them.
  const {
    save,
    saving,
    error: saveError,
    saved,
  } = useSaveFinancialEvaluation();
  const { remove: deleteLine, error: deleteError } = useDeleteFinEvalLine();
  const { remove: deleteSection, error: deleteSectionError } =
    useDeleteFinEvalSection();

  /**
   * Grid rows -> save payload, via the extracted (and directly tested) helper
   * in lib/save-collect. This is where a row the user added either reaches the
   * PUT or is silently dropped, so it does not live inline in the component.
   */
  const collectRows = (
    rows: Row[],
    cols: number[],
    into: Record<string, Record<string, string>>,
    added: NewLineEdit[],
    newSections?: Record<string, NewSectionDraft>,
  ) =>
    collectGridRows(
      rows,
      cols,
      fyKeys,
      sectionIndexOfKey,
      into,
      added,
      newSections,
    );

  const onSave = () => {
    if (!template?.raw) return;
    // Mirrors saveFinancialEvaluation's own fallback chain (host config, then
    // the id the loaded template carries) — checking only the host config
    // here blocked saves for a template fetched by spc_type_id that already
    // has its assigned proposal_id, before the host page's config caught up.
    if (!getProposalId() && !template.raw.proposal_id) {
      setToast({
        kind: "error",
        message:
          "Cannot save — a Proposal is required. Please create the Proposal first, then save the financial evaluation.",
      });
      return;
    }

    const yearValues: Record<string, Record<string, string>> = {};
    const newLines: NewLineEdit[] = [];
    // Sections the user added this session, gathered by their local id. Only
    // the first grid can hold them, but every grid is passed the accumulator so
    // a row can never be silently dropped for being in the "wrong" one.
    const sectionDrafts: Record<string, NewSectionDraft> = {};
    // Consideration is never calculated, so its state IS what is on screen.
    collectRows(conRows, conYearIdx, yearValues, newLines, sectionDrafts);
    collectRows(calcCor, allYearIdx, yearValues, newLines, sectionDrafts);
    collectRows(calcFcf, allYearIdx, yearValues, newLines, sectionDrafts);
    // Post Tax Return only renders the projection columns.
    collectRows(calcPtr, projYearIdx, yearValues, newLines, sectionDrafts);
    // The user's own block. Its rows are never calculated, so there is no
    // derived copy of it — the state IS what is on screen.
    collectRows(cusRows, allYearIdx, yearValues, newLines, sectionDrafts);

    const newSections: NewSectionEdit[] = Object.entries(sectionDrafts).map(
      ([id, draft]) => ({ id, name: draft.name, lines: draft.lines }),
    );

    // Names of the CUSTOM sections already on the server, so a rename reaches
    // the PUT. Template sections are the backend's and are never sent.
    const sectionNames: Record<string, string> = {};
    cusRows.forEach((row) => {
      if (!row.sectionIsCustom || !row.apiKey) return;
      const index = sectionIndexOfKey(row.apiKey);
      if (index !== null) sectionNames[String(index)] = row.sectionName ?? "";
    });

    const npv: Record<string, [string, string, string]> = {};
    // The DERIVED rows, matching the three grids above: the previewed PV
    // components go out with the save rather than the stale figures they
    // replaced on screen. The server recomputes them either way, so this only
    // decides what the payload carries in the meantime.
    calcNpv.forEach((row) => {
      if (!row.apiKey) return;
      npv[row.apiKey] = [
        row.values[0] ?? "",
        row.values[1] ?? "",
        row.values[2] ?? "",
      ];
    });

    const edits: FinancialEvaluationEdits = {
      yearValues,
      npv,
      keyInputs: Object.fromEntries(keyInputs.map((k) => [k.code, k.value])),
      newLines,
      newSections,
      sectionNames,
      // Undefined (not null) when the proposal never stated a currency, so the
      // payload builder echoes back `raw.display_currency` instead of writing
      // a guess into the saved proposal.
      displayCurrency: currency ?? undefined,
      // Only write a rate we actually have. Sending the pinned placeholder here
      // silently overwrote the proposal's stored `exchange_rate` on every save.
      exchangeRate: fxRateKnown ? fxRateNumber : undefined,
      displayYears: years,
      deletedLineIds,
      deletedSectionIds,
    };

    void save(template.raw, edits);
  };

  // The header owns the only save control ("Save Model"), so hand it this
  // screen's save handler and keep it informed of the request's state. The
  // handler is re-registered whenever it changes, since it closes over the
  // current edits.
  const { registerSave, publishStatus } = useSaveModel();

  // Re-registered every render because `onSave` closes over the current edits.
  // Safe without a dependency array only because registerSave sets no state.
  useEffect(() => {
    registerSave(template?.raw ? onSave : null);
  });
  useEffect(() => () => registerSave(null), [registerSave]);

  // A failed delete has no error slot of its own, so it reports through the
  // header's status line alongside save failures.
  const ready = Boolean(template?.raw);
  useEffect(() => {
    publishStatus({
      saving,
      error: saveError ?? deleteError ?? deleteSectionError,
      saved,
      ready,
      readonly: isReadonly,
    });
  }, [
    publishStatus,
    saving,
    saveError,
    deleteError,
    deleteSectionError,
    saved,
    ready,
    isReadonly,
  ]);

  // Toast the save outcome and tell the host page, once per transition.
  //
  // The re-fetch is part of the outcome, not a nicety: the PUT answers with an
  // acknowledgement, not with the stored evaluation, so until the GET comes
  // back the screen is showing what the user typed rather than what the server
  // kept. Reloading here means server-assigned ids for newly added lines and
  // any backend-calculated rows land straight away, and a save the backend
  // silently dropped shows up immediately instead of at the next page reload.
  useEffect(() => {
    if (saved) {
      setToast({
        kind: "success",
        message: "Financial evaluation saved successfully.",
      });
      emitSaved();
      // Silent, matching the reference project's post-save re-fetch: the grid
      // keeps the numbers on screen and swaps them for the server's when they
      // arrive, rather than blanking to a spinner after every save.
      reload(true);
    }
  }, [saved, reload]);

  useEffect(() => {
    if (saveError) setToast({ kind: "error", message: saveError });
  }, [saveError]);

  // A failed LOAD used to be swallowed entirely: the screen fell back to the
  // seed rows and said nothing, so a 401 / CORS / bad-id failure was
  // indistinguishable from a proposal that genuinely has no data. That is what
  // makes the currency toggle look broken — with no template there is no
  // `local_currency`, so it collapses to the USD-only default while the grid
  // shows demo numbers that look real.
  useEffect(() => {
    if (loadError) setToast({ kind: "error", message: loadError });
  }, [loadError]);

  /**
   * Cell text for one row — Prod Dev's `cellDisplay` / `rawFmt` / `displayFmt`.
   *
   * Money rows: FX + K/M/B scale, K = 0 / M = 1 / B = 2 decimals, negatives in
   * parentheses.
   *
   * Percentage rows bypass FX and scale entirely (25% is 25% in any currency
   * or denomination) and show up to 2 decimals with trailing zeros trimmed and
   * no "%" sign — "41.56", "26" — exactly as Prod Dev's `groupNumberTrimmed`.
   *
   * An empty or zero cell shows "—", as in Prod Dev.
   */
  const cellText = (row: Row, raw: string | undefined): string => {
    const value = raw ?? "";
    if (value.trim() === "") return "—";
    const n = Number(value);
    if (Number.isFinite(n) && n === 0) return "—";
    // EVERY percentage row, not just Tax Rate: margins, growth and post-tax
    // return are percentages too, and running one through the FX/scale
    // pipeline turns 58.3333 into "58" at K or "0.1" at M.
    if (isPercentRow(identityOf(row))) {
      if (!Number.isFinite(n)) return "—";
      const trimmed = String(parseFloat(Math.abs(n).toFixed(2)));
      const decimals = trimmed.includes(".") ? trimmed.split(".")[1].length : 0;
      // Scale "K" divides by 1 — this is only for grouping and separators.
      return formatNumber(n, "K", numberFormat, decimals);
    }
    const shown = formatBaseToDisplayed(value);
    return shown === "" ? "—" : shown;
  };

  /**
   * CAGR for one row, across the visible columns (S11).
   *
   * Computed on the STORED base values, never the displayed ones — a growth
   * rate is scale- and currency-independent, so formatting first would be both
   * wasted work and a rounding trap. Percentage rows have no meaningful
   * cross-year compound, so they render "-", as the reference does.
   *
   * `write_cagr` deliberately carries no `is_calculated` test, so this applies
   * to input rows (standalone revenues, standalone costs) as well as computed
   * ones.
   */
  /* ----- section grouping ----- */
  /**
   * A grid can render several API sections back to back (Revenue, Total Costs
   * and Returns Analysis all feed the first table). The reference renders one
   * dark header bar per section using `section_name`; without it the rows are
   * flattened together and there is no way to tell which section a line belongs
   * to. Sections are contiguous because `mapFinancialEvaluation` emits them in
   * `display_order`, so a change of `sectionName` marks a boundary.
   */
  const collapseKey = (gridId: string, row: Row): string =>
    `${gridId}:${sectionKeyOf(row)}`;

  /**
   * Whether a row is hidden by its own section being collapsed. A grid that
   * collapses as a WHOLE (see `collapsedPanels`) hides its body above this, so
   * only the per-section rule is applied here.
   */
  const isSectionCollapsed = (gridId: string, row: Row): boolean =>
    collapsedSections.has(collapseKey(gridId, row));

  const toggleSection = (gridId: string, row: Row): void =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      const key = collapseKey(gridId, row);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /* ─────────────────── Collapse all / expand all ───────────────────
   * One control over both kinds of collapsible block: the sections inside
   * Combined Operating Results, and the three single-section grids below it.
   * "All expanded" means neither set holds anything, so the button's label can
   * never disagree with what is on screen.
   */
  const COLLAPSIBLE_PANELS = ["fcf", "ptr", "npv"] as const;

  /**
   * Collapse keys of every section bar on screen: the first grid's sections
   * (Revenue, Total Costs, Returns Analysis) and the user's own block below.
   */
  const sectionBarKeys = useMemo(
    () => [
      ...new Set([
        ...corRows.map((row) => `cor:${sectionKeyOf(row)}`),
        ...cusRows.map((row) => `cus:${sectionKeyOf(row)}`),
      ]),
    ],
    [corRows, cusRows],
  );

  const allExpanded = collapsedSections.size === 0 && collapsedPanels.size === 0;

  const toggleAll = (): void => {
    if (allExpanded) {
      setCollapsedSections(new Set(sectionBarKeys));
      setCollapsedPanels(new Set(COLLAPSIBLE_PANELS));
      return;
    }
    setCollapsedSections(new Set());
    setCollapsedPanels(new Set());
  };

  const isPanelCollapsed = (gridId: string): boolean =>
    collapsedPanels.has(gridId);

  const togglePanel = (gridId: string): void =>
    setCollapsedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(gridId)) next.delete(gridId);
      else next.add(gridId);
      return next;
    });

  /* ───────────────────────── Section CRUD ─────────────────────────
   * A new section is a LOCAL block until it is saved: it carries no
   * `fin_eval_section_id` and neither do its lines, and the backend assigns
   * both on the PUT (see `buildNewSection`) — the same contract a new LINE
   * already goes out under, so there is no POST-on-add and no id to reconcile.
   *
   * It is appended to the block BELOW the NPV table, and it comes back there:
   * `gridIdOf` routes any section flagged `is_custom` to that block, so the
   * screen's placement survives the round trip. `display_order` past the
   * highest the template uses keeps it last within the payload too.
   */
  const addSection = (): void => {
    if (isReadonly) return;
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const key = `new:${id}`;
    // Created WITH one blank row, as the reference does: a section with no rows
    // has nothing to render "+ Add Row" beneath, so it would be a dead header.
    const blank: Row = {
      ...makeRow(Math.max(fyKeys.length, visibleCols), "", "yellow"),
      sectionType: "CUSTOM",
      sectionName: "",
      sectionKey: key,
      sectionId: null,
      sectionIsCustom: true,
      newSectionId: id,
      allowsNewLines: true,
    };
    setCusRows((prev) => [...prev, blank]);
    // "Collapse All" may have left everything folded; a section the user just
    // asked for has to be visible.
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.delete(`cus:${key}`);
      return next;
    });
    setPendingScroll(`cus:${key}`);
  };

  /** Rename a section — every row carries the name, so all of them move. */
  const renameSection = (key: string, name: string): void =>
    setCusRows((prev) =>
      prev.map((row) =>
        sectionKeyOf(row) === key ? { ...row, sectionName: name } : row,
      ),
    );

  /**
   * Remove a whole section and the lines under it.
   *
   * A section the SERVER knows about is DELETEd through the endpoint and
   * recorded, so the next save does not echo it — and every line under it —
   * straight back; that is the same trap `deletedLineIds` exists for. A section
   * that only ever existed on screen is simply dropped.
   */
  const removeSection = (key: string): void => {
    const rows = cusRows.filter((row) => sectionKeyOf(row) === key);
    if (!rows.length) return;
    const name = rows[0].sectionName ?? "";
    const sectionId = rows[0].sectionId ?? null;
    const drop = () =>
      setCusRows((prev) => prev.filter((row) => sectionKeyOf(row) !== key));
    setConfirmDelete({
      name,
      run: () => {
        if (sectionId == null) {
          // Local-only section — nothing on the server to delete.
          drop();
          setToast({ kind: "success", message: "Section removed." });
          return;
        }
        const snapshot = cusRows;
        drop();
        void deleteSection(sectionId).then((ok) => {
          if (!ok) {
            setCusRows(snapshot); // put it back; the server still has it
            setToast({ kind: "error", message: "Failed to delete section." });
            return;
          }
          // Remember it, so the next save does not echo the section — and every
          // line under it — straight back.
          setDeletedSectionIds((prev) =>
            prev.includes(sectionId) ? prev : [...prev, sectionId],
          );
          setToast({
            kind: "success",
            message: "Section deleted successfully.",
          });
          emitDeleted();
        });
      },
    });
  };

  /**
   * The header bar, emitted before the FIRST row of each section. Styled as the
   * reference styles it (Prod Dev -> the group `<tr>`): #2d3748, uppercase bold
   * white, 0.5 letter-spacing, with a chevron that collapses the section.
   */
  const sectionHeaderRow = (
    gridId: string,
    rows: Row[],
    rowIdx: number,
    colSpan: number,
  ) => {
    const row = rows[rowIdx];
    const name = row.sectionName ?? "";
    const key = sectionKeyOf(row);
    const isCustom = !!row.sectionIsCustom;
    // A section the user just added has no name yet and still needs its bar —
    // that bar is where the name gets typed.
    if (!name && !isCustom) return null;
    // A grid holding a SINGLE section already carries that section's name in
    // its own title bar (Combined Free Cash Flows, Post Tax Return) — a header
    // row would just repeat it, and there is nothing to distinguish by
    // collapsing. Bars are only useful where several sections share a table,
    // as Revenue / Total Costs / Returns Analysis do.
    const sectionCount = new Set(rows.map(sectionKeyOf)).size;
    // ... unless the section is the user's, in which case it needs the bar for
    // its name and its delete control however many sections share the grid.
    if (sectionCount < 2 && !isCustom) return null;
    const prev = rowIdx > 0 ? rows[rowIdx - 1] : undefined;
    if (prev && sectionKeyOf(prev) === key) return null; // not a boundary
    const collapsed = collapsedSections.has(collapseKey(gridId, row));
    return (
      <tr
        data-section-type={row.sectionType ?? undefined}
        data-section-key={collapseKey(gridId, row)}
        style={{ background: DARK_HEADER, cursor: "pointer" }}
        onClick={() => toggleSection(gridId, row)}
      >
        <td
          colSpan={colSpan}
          style={{
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {collapsed ? (
              <ChevronDown size={16} style={{ flexShrink: 0 }} />
            ) : (
              <ChevronUp size={16} style={{ flexShrink: 0 }} />
            )}
            {isCustom && !isReadonly ? (
              // Always an input, not click-to-edit: every editable label on
              // this screen is already a plain input sitting in the cell (see
              // the row labels), and a second idiom for the same act would be
              // one more thing to discover.
              <input
                value={name}
                placeholder="Enter section name"
                onChange={(e) => renameSection(key, e.target.value)}
                // The bar itself toggles the section; typing in it must not.
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "2px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  background: "#fff",
                  color: "#111",
                  border: "1px solid #3b82f6",
                  borderRadius: 3,
                  outline: "none",
                }}
              />
            ) : (
              <span style={{ flex: 1, minWidth: 0 }}>{name}</span>
            )}
            {isCustom && !isReadonly && (
              <button
                type="button"
                title="Delete section"
                aria-label="Delete section"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSection(key);
                }}
                style={{
                  display: "flex",
                  padding: 2,
                  border: "none",
                  background: "none",
                  color: "#f87171",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const cagrText = (row: Row, cols: number[]): string => {
    if (isNoTotalRow(identityOf(row)) || isPercentRow(identityOf(row))) {
      return "—";
    }
    const series = cols.map((i) => {
      const v = row.values[i];
      if (v === undefined || v.trim() === "") return null;
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : null;
    });
    const result = cagrOf(series);
    // CAGR is M&A-only (Prod Dev has no such column), so it keeps its "%".
    return result === null ? "—" : formatPercent(result, numberFormat);
  };

  /** Editor seed for one row — percentage rows are seeded unconverted. */
  const cellSeed = (row: Row, raw: string | undefined): string => {
    const value = raw ?? "";
    if (isPercentRow(identityOf(row))) {
      return value === "" || Number(value) === 0 ? "" : value;
    }
    return formatBaseToEditable(value);
  };

  /* ─────────────────────── Shared grid body renderer ───────────────────
   * All four grids render the same row shape, and every rule the screen has
   * about deleting, adding, greying and partitioning is a property of the ROW
   * (its section, whether it is calculated), not of the table it happens to sit
   * in. Rendering them through one function is what keeps those rules from
   * drifting apart between four hand-maintained copies — which is how the grids
   * ended up with a delete icon on calculated lines and a single "+ Add Row"
   * stranded under Returns Analysis.
   */

  /**
   * The two-row column header the year-by-year grids share: the ACTUALS /
   * PROJECTIONS banners over the fiscal-year labels, with the CAGR column
   * spanning both rows where the grid carries one.
   *
   * One copy, because `actualsColSpan`, `partitionStyle` and the read-only
   * gutter all have to agree with the BODY those grids render through
   * `gridRows` — three hand-maintained copies is how a header ends up claiming
   * a column the body never draws.
   */
  const gridHead = (cagr: boolean) => (
    <thead>
      <tr className="h-[35px] bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
        {!isReadonly && <th className="border-b border-r border-[#d1d5db]" />}
        <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#374151]"></th>
        {actualsColSpan > 0 && (
          <th
            colSpan={actualsColSpan}
            className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-center text-[10px] font-bold uppercase text-[#374151]"
            style={{ borderRight: PARTITION_BORDER }}
          >
            ACTUALS
          </th>
        )}
        {projYearIdx.length > 0 && (
          <th
            colSpan={projYearIdx.length}
            className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-center text-[10px] font-bold uppercase text-[#374151]"
          >
            PROJECTIONS
          </th>
        )}
        {cagr && (
          <th
            rowSpan={2}
            className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-[10px] font-bold uppercase text-[#374151]"
          >
            CAGR
          </th>
        )}
      </tr>
      <tr className="h-[35px] bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
        {!isReadonly && <th className="border-b border-r border-[#d1d5db]" />}
        <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#374151]">
          LINE ITEM
        </th>
        {allYearIdx.map((i) => (
          <th
            key={i}
            className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]"
            style={partitionStyle(i, actualsCount)}
          >
            {fyLabel(i)}
          </th>
        ))}
      </tr>
    </thead>
  );

  /**
   * The dark title bar above a grid, doubling as its collapse control.
   *
   * Used by the three single-section grids only. Combined Operating Results
   * keeps a plain bar: its Revenue / Total Costs / Returns Analysis blocks
   * already collapse individually, and a fold over the top of those would mean
   * two different things could each call the grid "collapsed".
   */
  const panelTitle = (gridId: string, title: string) => {
    const collapsed = isPanelCollapsed(gridId);
    return (
      <button
        type="button"
        onClick={() => togglePanel(gridId)}
        aria-expanded={!collapsed}
        // Inline color forces white text — browser default <button> styling
        // can otherwise override the `text-white` utility class, which is
        // why this title showed black while the plain-<div> bars didn't.
        style={{ color: "#fff", cursor: "pointer" }}
        className="flex w-full items-center gap-2 rounded-t bg-[#2d3748] px-3 py-2 text-left text-xs font-bold text-white"
      >
        {collapsed ? (
          <ChevronDown size={16} className="shrink-0" />
        ) : (
          <ChevronUp size={16} className="shrink-0" />
        )}
        {title}
      </button>
    );
  };

  /** Column count for a full-width row (section bar, add-row). */
  const gridColSpan = (cols: number[], cagr: boolean): number =>
    (isReadonly ? 0 : 1) + 1 + cols.length + (cagr ? 1 : 0);

  const gridRows = (
    gridId: string,
    rows: Row[],
    source: Row[],
    setRows: (r: Row[]) => void,
    cols: number[],
    cagr = false,
  ) => {
    const span = gridColSpan(cols, cagr);
    return rows.map((row, rowIdx) => {
      const collapsed = isSectionCollapsed(gridId, row);
      const locked = isRowLocked(row, isReadonly);
      // The "+ Add ... Line" belongs to the section, so it is emitted beneath
      // that section's LAST row rather than at the foot of the table.
      const next = rows[rowIdx + 1];
      const endsSection = !next || sectionKeyOf(next) !== sectionKeyOf(row);
      const showAdd =
        !isReadonly &&
        !collapsed &&
        endsSection &&
        rowAllowsRows(row);

      return (
        <React.Fragment key={row.id}>
          {sectionHeaderRow(gridId, rows, rowIdx, span)}
          {!collapsed && (
            <tr className={rowBgClass(locked)}>
              {!isReadonly && (
                <td className="h-10 border-b border-r border-[#e5e7eb] p-0 text-center align-middle">
                  {canDeleteRow(row, isReadonly) && (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center text-[#9ca3af]"
                      onClick={() => removeRow(setRows, source, row.id)}
                      aria-label="Remove row"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </td>
              )}
              <td className="h-10 overflow-hidden border-b border-r border-[#e5e7eb] px-3 align-middle">
                {locked ? (
                  // A locked line is a LABEL, not a disabled field — the
                  // reference renders it as plain bold text, and an input box
                  // the user cannot type into only invites them to try.
                  <div
                    title={row.label}
                    className={`overflow-hidden text-ellipsis whitespace-nowrap ${labelTextClass(row.isCalculated)}`}
                  >
                    {row.label}
                  </div>
                ) : (
                  <input
                    title={row.label}
                    className={`w-full overflow-hidden bg-transparent text-ellipsis whitespace-nowrap outline-none ${row.isCustom === false ? TEMPLATE_LABEL_CLASS : labelTextClass(false)}`}
                    value={row.label}
                    placeholder="New row label..."
                    onChange={(e) =>
                      updateRowLabel(source, setRows, row.id, e.target.value)
                    }
                  />
                )}
              </td>
              {cols.map((i) => (
                <td
                  key={i}
                  className="h-10 border-b border-r border-[#e5e7eb] p-0 text-right align-middle"
                  style={partitionStyle(i, actualsCount)}
                >
                  <SpreadsheetCell
                    gridId={gridId}
                    row={rowIdx}
                    col={i}
                    value={cellText(row, row.values[i])}
                    editValue={cellSeed(row, row.values[i])}
                    readOnly={locked}
                    calculated={!!row.isCalculated}
                  />
                </td>
              ))}
              {cagr && (
                // Navigable, like the reference's TOTAL cell: arrows reach it
                // so the figure can be read and copied with the row, and Tab
                // skips it (tabIndex -1) rather than making every row one stop
                // longer.
                //
                // Its column index is `fyKeys.length` — one past EVERY fiscal
                // year bucket, not merely past the last VISIBLE one. That gap
                // matters: `writeCells` guards with `cc < row.values.length`,
                // so an index inside the array would let a paste land here and
                // silently overwrite a year the user had scrolled out of view.
                // Past the end, the guard rejects it and the cell is read-only
                // in the only sense that counts.
                <td className="h-10 border-b border-r border-[#e5e7eb] p-0 text-right align-middle">
                  <SpreadsheetCell
                    gridId={gridId}
                    row={rowIdx}
                    col={cagrCol}
                    value={cagrText(row, cols)}
                    readOnly
                    calculated
                    skipNav={false}
                    tabIndex={-1}
                  />
                </td>
              )}
            </tr>
          )}
          {showAdd && (
            <tr className="bg-white">
              <td
                colSpan={span}
                className="border-b border-[#e5e7eb] px-[10px] py-1.5"
              >
                <button
                  type="button"
                  // Matches Prod Dev's "+ Add ... Line": 11px / 600 / black,
                  // bottom rule only.
                  className="flex cursor-pointer items-center gap-1 px-2 py-[3px] text-[11px] font-semibold text-black"
                  onClick={() =>
                    addRowInSection(
                      setRows,
                      source,
                      sectionInsertIndex(source, rowIdx),
                      row,
                    )
                  }
                >
                  + Add Row
                </button>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  // ----- shared editing helpers (inline editing only) -----

  /**
   * Insert a blank line directly BELOW `index`, i.e. at the foot of the section
   * whose last row that is.
   *
   * Position is not cosmetic here. `collectRows` attributes a user-added row to
   * the section of the nearest template row ABOVE it, so a row appended to the
   * end of the whole grid was filed under whichever section happened to come
   * last — Returns Analysis for the first table, which owns no input lines at
   * all. Splicing it in under its own section is what makes "+ Add Revenue
   * Line" actually add a revenue line.
   */
  const addRowInSection = (
    setRows: (r: Row[]) => void,
    rows: Row[],
    insertAfter: number,
    section: Row,
  ) => {
    if (isReadonly) return;
    const next = [...rows];
    next.splice(insertAfter + 1, 0, {
      // Sized to EVERY fiscal year the response carries, not just the visible
      // ones. Sizing to `visibleCols` left the row short, so widening the year
      // count afterwards produced cells that rendered "-" and silently refused
      // edits — `writeCells` bounds-checks against the row's own length.
      ...makeRow(Math.max(fyKeys.length, visibleCols), "", "yellow"),
      // The new line carries its SECTION explicitly. Three things read it:
      // `sumSection` adds the row to REVENUE_TOTAL / COSTS_TOTAL by
      // `sectionType`; `canDeleteRow` uses it to show the trash icon; and
      // `collectRows` files the row under the right section on save.
      sectionType: section.sectionType,
      sectionName: section.sectionName,
      // The full section identity travels with the row, not just its type:
      // grouping, collapsing and — for a section that is itself new —
      // ATTRIBUTION on save all key on it. A row that lost `newSectionId` here
      // would be saved under whichever template section sat above the block.
      sectionKey: section.sectionKey,
      sectionId: section.sectionId,
      sectionIsCustom: section.sectionIsCustom,
      newSectionId: section.newSectionId,
      allowsNewLines: section.allowsNewLines,
    });
    setRows(next);
  };

  /**
   * Where a new line belongs within its section: after the last EDITABLE row,
   * i.e. ABOVE the computed subtotal that closes the block.
   *
   * "+ Add Row" sits at the foot of the section, and appending there put the
   * new line UNDER "Revenue (Total)" / "Total Costs" — visually detached from
   * the inputs it belongs with, and reading as though it fell outside the very
   * total it feeds. (It was counted either way: `sumSection` matches on
   * `sectionType`, not on position. But a row that adds to a total has to sit
   * above it, or the arithmetic on screen looks wrong.)
   *
   * Walks back over the section's trailing calculated rows. A section that is
   * entirely calculated yields the index before its first row, so the new line
   * lands at the top of the block rather than outside it.
   */
  const sectionInsertIndex = (rows: Row[], sectionEnd: number): number => {
    const section = rows[sectionEnd] ? sectionKeyOf(rows[sectionEnd]) : "";
    let i = sectionEnd;
    while (i >= 0 && sectionKeyOf(rows[i]) === section && rows[i].isCalculated) {
      i -= 1;
    }
    return i;
  };

  const updateRowLabel = (
    rows: Row[],
    setRows: (r: Row[]) => void,
    id: string,
    label: string,
  ) => {
    setRows(rows.map((r) => (r.id === id && !r.isCalculated ? { ...r, label } : r)));
  };

  /**
   * Remove a row. Rows that exist on the server (they carry a `lineId`) are
   * deleted through the API; rows the user added locally are just dropped.
   *
   * The row disappears immediately and is put back if the DELETE fails, so the
   * grid stays responsive without ever claiming a delete the server rejected.
   */
  /**
   * Ask before deleting. The reference confirms every line delete by name, so
   * a mis-click on the trash icon cannot silently drop a row — there is no
   * undo once the server call has gone out.
   */
  const removeRow = (setRows: (r: Row[]) => void, rows: Row[], id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setConfirmDelete({
      name: row.label,
      run: () => {
        let remaining = rows.filter((r) => r.id !== id);
        // A section the user added exists only as its rows, so removing the
        // last one would take the whole block — name, header bar and all —
        // with it, which is not what a row's trash icon says it does. Leave a
        // fresh blank row behind; the section's own trash icon is how the
        // section goes.
        if (
          row.newSectionId &&
          !remaining.some((r) => r.newSectionId === row.newSectionId)
        ) {
          const blank: Row = {
            ...makeRow(Math.max(fyKeys.length, visibleCols), "", "yellow"),
            sectionType: row.sectionType,
            sectionName: row.sectionName,
            sectionKey: row.sectionKey,
            sectionId: row.sectionId,
            sectionIsCustom: row.sectionIsCustom,
            newSectionId: row.newSectionId,
            allowsNewLines: row.allowsNewLines,
          };
          const at = rows.findIndex((r) => r.id === id);
          remaining = [
            ...remaining.slice(0, at),
            blank,
            ...remaining.slice(at),
          ];
        }
        setRows(remaining);

        if (row.lineId == null) {
          // Local-only row — nothing on the server to delete.
          setToast({ kind: "success", message: "Line removed." });
          return;
        }

        const deletedId = row.lineId;
        void deleteLine(deletedId).then((ok) => {
          if (ok) {
            // Remember it, so the next save does not echo it back.
            setDeletedLineIds((prev) =>
              prev.includes(deletedId) ? prev : [...prev, deletedId],
            );
            setToast({
              kind: "success",
              message: "Line deleted successfully.",
            });
            emitDeleted();
          } else {
            setRows(rows); // restore the pre-delete order
            setToast({ kind: "error", message: "Failed to delete line." });
          }
        });
      },
    });
  };

  // ----- grid data adapters: route generic cell ops to the right table -----
  // Every grid stores currency values, so they all share the FX/unit parser.
  const gridAdapters: Record<
    string,
    { rows: Row[]; setRows: (r: Row[]) => void; parse: (v: string) => string }
  > = {
    con: { rows: conRows, setRows: setConRows, parse: parseDisplayedToBase },
    cor: { rows: corRows, setRows: setCorRows, parse: parseDisplayedToBase },
    fcf: { rows: fcfRows, setRows: setFcfRows, parse: parseDisplayedToBase },
    ptr: { rows: ptrRows, setRows: setPtrRows, parse: parseDisplayedToBase },
    cus: { rows: cusRows, setRows: setCusRows, parse: parseDisplayedToBase },
    npv: { rows: npvRows, setRows: setNpvRows, parse: parseDisplayedToBase },
  };

  /**
   * Write a matrix of display strings into a grid starting at (startRow,
   * startCol), preserving row/column alignment and ignoring out-of-range
   * targets. Used for single-cell commits, paste, and clearing.
   */
  const writeCells = (
    gridId: string,
    startRow: number,
    startCol: number,
    matrix: string[][],
  ) => {
    // View-only mode blocks every write path that funnels through here —
    // single-cell commits, paste, cut and clear alike.
    if (isReadonly) return;
    const a = gridAdapters[gridId];
    if (!a) return;
    const next = a.rows.map((r) => ({ ...r, values: [...r.values] }));
    matrix.forEach((line, r) =>
      line.forEach((cell, c) => {
        const rr = startRow + r;
        const cc = startCol + c;
        if (
          next[rr] &&
          !next[rr].readOnly &&
          cc >= 0 &&
          cc < next[rr].values.length
        ) {
          const target = next[rr];
          if (isPercentRow(identityOf(target))) {
            // Percentages bypass the currency/scale parse and are forced into
            // [0, 100] — a safety net for paste, which skips the keystroke
            // check the editor applies.
            const trimmed = String(cell).trim();
            if (trimmed === "") {
              target.values[cc] = "";
            } else if (isValidPercentInput(trimmed)) {
              target.values[cc] = trimmed;
            } else {
              const n = Number(trimmed.replace(/[^0-9.-]/g, ""));
              target.values[cc] = Number.isFinite(n)
                ? String(clampPercent(n))
                : "";
            }
          } else {
            target.values[cc] = a.parse(cell);
          }
        }
      }),
    );
    a.setRows(next);
  };

  // ----- Excel-like selection / editing / clipboard -----
  // Selection is a rectangle within one grid; (r1,c1) is the anchor and
  // (r2,c2) is the active cell. Single click selects, double-click / Enter /
  // typing edits, Shift+Click / Shift+Arrow extend the range, and
  // Ctrl/Cmd+C / V / X copy / paste / cut through the clipboard as TSV.
  type GridSelection = {
    gridId: string;
    r1: number;
    c1: number;
    r2: number;
    c2: number;
  };
  const [selection, setSelection] = useState<GridSelection | null>(null);
  // True while the mouse button is held down for a click-and-drag selection.
  const dragging = useRef(false);
  /**
   * The pending selection change came from the KEYBOARD, so the newly focused
   * cell should have its text selected — the reference does `target.focus();
   * target.select();` in its arrow handler.
   *
   * A mouse click must not do this. The click has already placed the caret
   * where the user aimed, and selecting the contents afterwards throws that
   * away, which is what made cells impossible to click into.
   */
  const navByKeyboard = useRef(false);

  // Keep the active cell focused after navigation. Every cell is a live input,
  // so focusing it IS entering it — there is no separate editor to open.
  useEffect(() => {
    if (!selection) return;
    focusCell(
      selection.gridId,
      selection.r2,
      selection.c2,
      navByKeyboard.current,
    );
    navByKeyboard.current = false;
  }, [selection]);

  // End any drag selection when the mouse is released anywhere on the page.
  useEffect(() => {
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const within = (p: CellPos): boolean => {
    if (!selection || selection.gridId !== p.gridId) return false;
    const { r1, c1, r2, c2 } = selection;
    return (
      p.row >= Math.min(r1, r2) &&
      p.row <= Math.max(r1, r2) &&
      p.col >= Math.min(c1, c2) &&
      p.col <= Math.max(c1, c2)
    );
  };

  const isActive = (p: CellPos): boolean =>
    !!selection &&
    selection.gridId === p.gridId &&
    p.row === selection.r2 &&
    p.col === selection.c2;

  const moveActive = (dRow: number, dCol: number, extend: boolean) => {
    if (!selection) return;
    navByKeyboard.current = true;
    const { gridId, r1, c1, r2, c2 } = selection;
    if (extend) {
      const nr = r2 + dRow;
      const nc = c2 + dCol;
      if (cellExists(gridId, nr, nc))
        setSelection({ gridId, r1, c1, r2: nr, c2: nc });
    } else {
      // Prod Dev's navigation: same-column Up/Down across every table (except
      // the NPV block, whose columns are not fiscal years), skipping
      // calculated cells.
      const t = nextNavCell(gridId, r2, c2, dRow, dCol, ["npv"]);
      if (t)
        setSelection({ gridId: t.gridId, r1: t.r, c1: t.c, r2: t.r, c2: t.c });
    }
  };

  const clearSelectionCells = () => {
    if (!selection) return;
    const { gridId, r1, c1, r2, c2 } = selection;
    const rows = Math.abs(r2 - r1) + 1;
    const cols = Math.abs(c2 - c1) + 1;
    const blank = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ""),
    );
    writeCells(gridId, Math.min(r1, r2), Math.min(c1, c2), blank);
  };

  const copySelection = () => {
    if (!selection) return;
    void writeClipboard(
      readSelectionTSV(
        selection.gridId,
        selection.r1,
        selection.c1,
        selection.r2,
        selection.c2,
      ),
    );
  };

  const pasteInto = (p: CellPos) => {
    void readClipboard().then((text) => {
      if (!text) return;
      writeCells(p.gridId, p.row, p.col, parseClipboardMatrix(text));
    });
  };

  const spreadsheetApi: SpreadsheetApi = {
    isSelected: within,
    isActive,
    select: (e, p) => {
      if (e.shiftKey && selection && selection.gridId === p.gridId) {
        e.preventDefault(); // extend range without starting a text selection
        setSelection({ ...selection, r2: p.row, c2: p.col });
      } else {
        // Start a single-cell selection and begin a potential drag-select.
        dragging.current = true;
        setSelection({
          gridId: p.gridId,
          r1: p.row,
          c1: p.col,
          r2: p.row,
          c2: p.col,
        });
      }
    },
    focus: (p) => {
      // Returning the SAME object when the cell is already active matters:
      // this fires from the cell's own onFocus, and handing back a fresh
      // object would re-run the focus effect, which focuses the cell, which
      // fires onFocus again.
      setSelection((sel) =>
        sel && sel.gridId === p.gridId && sel.r2 === p.row && sel.c2 === p.col
          ? sel
          : { gridId: p.gridId, r1: p.row, c1: p.col, r2: p.row, c2: p.col },
      );
    },
    hover: (p) => {
      if (!dragging.current) return;
      // Extend the range to the hovered cell as the mouse drags over the grid.
      setSelection((sel) =>
        sel && sel.gridId === p.gridId ? { ...sel, r2: p.row, c2: p.col } : sel,
      );
    },
    keyDown: (e, p, keyOverride) => {
      // Some callers (e.g. Enter committing and dropping to the next row) need
      // to route through this like an ArrowDown without having to fake up a
      // whole synthetic event — spreading `e` loses preventDefault/stopPropagation,
      // which live on the SyntheticEvent prototype, not as own properties.
      const key = keyOverride ?? e.key;
      if (e.ctrlKey || e.metaKey) {
        const k = key.toLowerCase();
        if (k === "c") {
          e.preventDefault();
          copySelection();
        } else if (k === "v") {
          e.preventDefault();
          pasteInto(p);
        } else if (k === "x") {
          e.preventDefault();
          copySelection();
          clearSelectionCells();
        }
        return;
      }
      switch (key) {
        case "ArrowUp":
          e.preventDefault();
          moveActive(-1, 0, e.shiftKey);
          return;
        case "ArrowDown":
          e.preventDefault();
          moveActive(1, 0, e.shiftKey);
          return;
        case "ArrowLeft":
          e.preventDefault();
          moveActive(0, -1, e.shiftKey);
          return;
        case "ArrowRight":
          e.preventDefault();
          moveActive(0, 1, e.shiftKey);
          return;
        case "Backspace":
        case "Delete":
          // Only reaches here when the cell is NOT mid-edit (SpreadsheetCell
          // keeps the keystroke while there is a draft), so it clears the
          // selected range rather than a character.
          e.preventDefault();
          clearSelectionCells();
          return;
        case "Tab":
          return; // let the browser move focus
        default:
          // Nothing else to do: every cell is a live input, so an ordinary
          // keystroke is simply typed into it.
          return;
      }
    },
    commit: (p, text) => writeCells(p.gridId, p.row, p.col, [[text]]),
  };

  return (
    <SpreadsheetProvider value={spreadsheetApi}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-[420px] min-w-[340px] rounded-lg bg-white px-[22px] py-5 shadow-[0_10px_30px_rgba(0,0,0,.2)]"
          >
            <div className="mb-2 text-[14px] font-bold text-[#111827]">
              Delete line item
            </div>
            <div className="mb-[18px] text-[13px] text-[#374151]">
              Are you sure you want to delete
              {confirmDelete.name ? (
                <>
                  {" "}
                  <strong>&quot;{confirmDelete.name}&quot;</strong>
                </>
              ) : (
                ""
              )}
              ?
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-black bg-white px-3.5 py-1.5 text-[12px] font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDelete.run();
                  setConfirmDelete(null);
                }}
                className="rounded-md border border-black bg-white px-3.5 py-1.5 text-[12px] font-bold text-black"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            {loading && (
              <span className="flex items-center gap-2 text-[13px] text-[#6b7280]">
                <RefreshCw size={14} className="animate-spin" />
                Loading financial data…
              </span>
            )}
          </div>
          {/* One right-aligned group, in the reference's order: the year
              stepper, then "+ Add Section", then the collapse toggle (Sales
              Contract → its toolbar; Property Leases → the same four controls
              in the same sequence). MA had the stepper alone on the right and
              the other two stranded on the left, which read as two unrelated
              toolbars sharing a rule. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={removeProjectionYear}
              disabled={isReadonly || projectionsShown <= 1}
              className="h-7 w-7 rounded border border-[#d1d5db] text-gray-700 disabled:cursor-default disabled:border-[#f3f4f6] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:opacity-100"
              aria-label="Decrease years"
            >
              −
            </button>
            <div className="min-w-[60px] text-center text-sm font-semibold text-slate-800">
              {projectionsShown} Years
            </div>
            <button
              type="button"
              onClick={addProjectionYear}
              disabled={isReadonly}
              className="h-7 w-7 rounded border border-[#d1d5db] text-gray-700 disabled:cursor-default disabled:border-[#f3f4f6] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:opacity-100"
              aria-label="Increase years"
            >
              +
            </button>
            {!isReadonly && (
              <button
                type="button"
                onClick={addSection}
                // The grid's columns are the response's own fiscal years, so a
                // section added before it lands would be sized to nothing.
                disabled={!template?.raw}
                // Black outline, as both references give this one control, so
                // it reads as the primary action of the group.
                className="rounded border border-black bg-white px-3 py-1.5 text-[12px] font-bold text-black disabled:cursor-default disabled:border-[#f3f4f6] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
              >
                + Add Section
              </button>
            )}
            <button
              type="button"
              onClick={toggleAll}
              className="rounded border border-[#d1d5db] bg-white px-3 py-1.5 text-[12px] text-[#374151]"
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Key Inputs (left) and Consideration (right), side by side above
              Combined Operating Results, as in the wireframe. */}
          <div className="flex items-start gap-6">
            {/* Key inputs — one input per row: INPUT | VALUE */}
            <div className="w-1/3 shrink-0">
              <div className="rounded-t bg-[#2d3748] px-3 py-2 text-xs font-bold uppercase text-white">
                Key Inputs
              </div>
              <div className="overflow-auto rounded-b border">
                <table className="w-full table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="h-[35px] bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
                      <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#374151]">
                        INPUT
                      </th>
                      <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]">
                        VALUE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyInputs.map((input) => (
                      <tr key={input.code} className={rowBgClass(false)}>
                        <td className={`h-10 border-b border-r border-[#e5e7eb] px-3 align-middle ${TEMPLATE_LABEL_CLASS}`}>
                          {input.label}
                        </td>
                        <td className="h-10 border-b border-r border-[#e5e7eb] px-3 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <PercentInput
                              value={input.value}
                              onValueChange={(v) => setKeyInputValue(input.code, v)}
                              readOnly={isReadonly}
                            />
                            <span className="text-sm text-slate-500">%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consideration — Cash / Deferred / Contingent, moved out of
                Combined Operating Results into its own panel. */}
            {conRows.length > 0 && (
              <div className="min-w-0 flex-1">
                <div className="rounded-t bg-[#2d3748] px-3 py-2 text-xs font-bold uppercase text-white">
                  Consideration
                </div>
                <div className="overflow-auto rounded-b border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <GridColgroup showActions={!isReadonly} yearCount={conYearIdx.length} />
                    <thead>
                      <tr className="h-[35px] bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
                        {!isReadonly && <th className="border-b border-r border-[#d1d5db]" />}
                        <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#374151]">TYPE</th>
                        {conYearIdx.map((i) => (
                          <th key={i} className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]">
                            {fyLabel(i)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gridRows("con", conRows, conRows, setConRows, conYearIdx)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Combined Operating Results */}
          <div className="mt-6">
            <div className="rounded-t bg-[#2d3748] px-3 py-2 text-xs font-bold text-white">
              Combined Operating Results
            </div>
            <div className="overflow-auto rounded-b border">
              <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
                <GridColgroup showActions={!isReadonly} yearCount={allYearIdx.length} cagr />
                {gridHead(true)}
                <tbody>
                  {gridRows("cor", calcCor, corRows, setCorRows, allYearIdx, true)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combined Free Cash Flows */}
          <div className="mt-6">
            {panelTitle("fcf", "Combined Free Cash Flows")}
            {!isPanelCollapsed("fcf") && (
            <div className="overflow-auto rounded-b border">
              <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
                <GridColgroup showActions={!isReadonly} yearCount={allYearIdx.length} />
                {gridHead(false)}
                <tbody>
                  {gridRows("fcf", calcFcf, fcfRows, setFcfRows, allYearIdx)}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Post Tax Return */}
          <div className="mt-6">
            {panelTitle("ptr", "Post Tax Return")}
            {!isPanelCollapsed("ptr") && (
            <div className="overflow-auto rounded-b border">
              <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
                <GridColgroup showActions={!isReadonly} yearCount={projYearIdx.length} />
                <thead>
                  <tr className="h-[35px] bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
                    {!isReadonly && <th className="border-b border-r border-[#d1d5db]" />}
                    <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#374151]">LINE ITEM</th>
                    {projYearIdx.map((i) => (
                      <th key={i} className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]">
                        {fyLabel(i)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridRows("ptr", calcPtr, ptrRows, setPtrRows, projYearIdx)}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* NPV Calculation */}
          <div className="mt-6 w-full">
            {panelTitle("npv", "NPV Calculation")}
            {!isPanelCollapsed("npv") && (
            <div className="overflow-hidden rounded-b border bg-white">
              <table className="w-full table-fixed border-collapse text-sm">
                {/* No actions column: the NPV block takes neither new rows
                    nor deletions, so a permanently empty 36px gutter would be
                    dead space. */}
                <colgroup>
                  <col style={{ width: LABEL_COL_WIDTH }} />
                  {[0, 1, 2].map((c) => (
                    <col key={c} style={{ minWidth: 120 }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="h-[35px] bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
                    <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#374151]">Component</th>
                    <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]">Target (Standalone)</th>
                    <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]">Experian Factor</th>
                    <th className="border-b border-r border-[#d1d5db] px-2 py-1.5 text-right text-[10px] font-bold uppercase text-[#374151]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {calcNpv.map((row, rowIdx) => {
                    const locked = isRowLocked(row, isReadonly);
                    return (
                      <tr key={row.id} className={rowBgClass(locked)}>
                        <td className="h-10 overflow-hidden border-b border-r border-[#e5e7eb] px-3 align-middle">
                          {locked ? (
                            <div
                              title={row.label}
                              className={`overflow-hidden text-ellipsis whitespace-nowrap ${labelTextClass(row.isCalculated)}`}
                            >
                              {row.label}
                            </div>
                          ) : (
                            <input
                              title={row.label}
                              className={`w-full overflow-hidden bg-transparent text-ellipsis whitespace-nowrap outline-none ${row.isCustom === false ? TEMPLATE_LABEL_CLASS : labelTextClass(false)}`}
                              value={row.label}
                              placeholder="New component..."
                              onChange={(e) =>
                                updateRowLabel(npvRows, setNpvRows, row.id, e.target.value)
                              }
                            />
                          )}
                        </td>
                        {[0, 1, 2].map((c) => (
                          <td key={c} className="h-10 border-b border-r border-[#e5e7eb] p-0 text-right align-middle">
                            <SpreadsheetCell
                              gridId="npv"
                              row={rowIdx}
                              col={c}
                              className="w-full text-right"
                              value={cellText(row, row.values[c])}
                              editValue={cellSeed(row, row.values[c])}
                              readOnly={locked}
                              calculated={!!row.isCalculated}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Sections the user added — below everything the template defines.
              No panel title of its own: each section carries its own dark bar,
              and a wrapper would be a title for a block that has no name. */}
          {cusRows.length > 0 && (
            <div className="mt-6">
              <div className="overflow-auto rounded border">
                <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
                  <GridColgroup
                    showActions={!isReadonly}
                    yearCount={allYearIdx.length}
                    cagr
                  />
                  {gridHead(true)}
                  <tbody>
                    {/* Source and rendered rows are the same array: nothing in
                        this block is calculated, so there is no derived copy of
                        it the way the template grids have one. */}
                    {gridRows("cus", cusRows, cusRows, setCusRows, allYearIdx, true)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SpreadsheetProvider>
  );
};

export default Table;