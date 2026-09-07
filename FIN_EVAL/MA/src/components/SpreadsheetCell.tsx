import React, { useState } from "react";
import { useSpreadsheet, type CellPos } from "@/components/spreadsheetContext";
import { sanitizeNumericInput } from "@/lib/spreadsheet";

type Props = {
  gridId: string;
  row: number;
  col: number;
  /** Already-formatted display value. */
  value: string;
  /**
   * Plain, un-grouped value shown while the cell has focus. Numeric grids pass
   * the raw scaled number here so a focus/blur round trip does not quantise the
   * stored value to the display's decimal places.
   */
  editValue?: string;
  /** Locked cell: still focusable and navigable, but not editable. */
  readOnly?: boolean;
  /**
   * This cell holds a COMPUTED figure (the server owns it), as opposed to being
   * merely locked because the whole screen is view-only. Only the computed case
   * gets the bold near-black treatment the reference gives calculated lines —
   * without the distinction, a view-only screen rendered every cell bold and
   * the input/derived split disappeared.
   */
  calculated?: boolean;
  /**
   * Tab order. Pass -1 for a trailing SUMMARY cell (CAGR): arrows still reach
   * it so it can be read and copied, but Tab skips straight past to the next
   * row — the reference marks its TOTAL cell exactly this way
   * (`data-cell-nav="1" ... tabIndex={-1}`).
   */
  tabIndex?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * An editable grid cell, modelled on the reference project's cell rather than
 * on Excel.
 *
 * The difference is the whole point of this component. MA used to render a
 * `<div>` that had to be SELECTED and then opened — double-click, Enter, or
 * typing — before an `<input>` appeared. That is Excel's modal model, and it
 * means a click followed by typing does nothing: the keystroke is swallowed
 * opening the editor. The reference has no edit mode at all — every cell IS a
 * borderless `<input>`, so clicking one and typing just works, and tabbing in
 * puts the caret straight in the text.
 *
 * What each state shows (Prod Dev -> the year-value `<input>`):
 *
 *   not focused   the formatted display value  ("1,234.57", "(29%)")
 *   focused       the plain editable number    ("1234.5678")
 *   on blur       committed, and back to formatted
 *
 * `draft` holds the text while the user is typing. Null means "not being
 * edited", which is what makes the formatted value show through — the cell
 * never has to ask the grid whether it is in edit mode.
 *
 * Selection, clipboard and arrow navigation still come from the provider, so
 * the range selection and copy/paste MA has over the reference are unaffected.
 */
export default function SpreadsheetCell({
  gridId,
  row,
  col,
  value,
  editValue,
  readOnly = false,
  calculated = false,
  tabIndex,
  className = "w-full text-right",
  style,
}: Props) {
  const api = useSpreadsheet();
  const pos: CellPos = { gridId, row, col };
  const active = api.isActive(pos);
  const selected = api.isSelected(pos);

  /** Text being typed. Null = not editing, so the formatted value shows. */
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (text: string) => {
    setDraft(null);
    api.commit(pos, text);
  };

  // Negatives render red in every row; the bold near-black is reserved for
  // computed figures (Prod Dev: `color: val < 0 ? "#DC2626" : "#1f2937"`).
  const negative = /^\(.*\)$/.test(String(value ?? "").trim());
  const textClass = calculated
    ? negative
      ? "font-bold text-[#DC2626]"
      : "font-bold text-[#111]"
    : negative
      ? "text-[#DC2626]"
      : "text-[#1f2937]";

  // The row supplies the resting surface (a calculated row is one continuous
  // grey band), so only the active/selected states paint.
  const stateClass = active
    ? "bg-white ring-1 ring-inset ring-[#3b82f6]"
    : selected
      ? "bg-sky-50"
      : "bg-transparent";

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    // Left/Right move the CARET while there is text to move through, and only
    // jump to the next cell at the edge — the reference's rule
    // (`handleCellArrowNav`). A locked cell has no caret to preserve, so every
    // arrow navigates.
    if (!readOnly && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      const caret = el.selectionStart ?? 0;
      const hasRange = (el.selectionEnd ?? 0) !== caret;
      if (e.key === "ArrowLeft" && (caret > 0 || hasRange)) return;
      if (e.key === "ArrowRight" && (caret < el.value.length || hasRange)) return;
    }
    // Enter commits and drops to the next row, as it does in a spreadsheet.
    if (e.key === "Enter") {
      e.preventDefault();
      if (draft !== null) commit(draft);
      // Pass the real event (not a spread copy — that drops preventDefault,
      // which lives on the SyntheticEvent prototype, not as an own property)
      // with an override so the grid treats this like ArrowDown.
      api.keyDown(e, pos, "ArrowDown");
      return;
    }
    // Escape abandons the edit and restores the committed value.
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft(null);
      return;
    }
    // Backspace/Delete clear the SELECTION only when the user is not typing —
    // mid-edit they must still edit the text.
    if ((e.key === "Backspace" || e.key === "Delete") && draft !== null) return;
    // Everything else — arrows across rows, Tab, Ctrl+C/V/X — is the grid's.
    api.keyDown(e, pos);
  };

  return (
    <input
      type="text"
      // The navigation and clipboard helpers find cells by these attributes.
      data-grid={gridId}
      data-row={row}
      data-col={col}
      data-value={value}
      data-readonly={readOnly || undefined}
      readOnly={readOnly}
      tabIndex={tabIndex}
      title={value || (readOnly ? "Read-only" : undefined)}
      placeholder="—"
      value={draft ?? value}
      className={`${className} h-full min-h-[2.5rem] border-none px-3 text-[13px] leading-10 outline-none ${textClass} ${stateClass}`}
      style={{ ...style, cursor: readOnly ? "default" : "text" }}
      onMouseDown={(e) => api.select(e, pos)}
      onMouseEnter={() => api.hover(pos)}
      onFocus={() => {
        // Move the active-cell highlight here. Focus can arrive by a route the
        // grid did not initiate — a Tab, or a click — and without this the
        // blue ring stays on whichever cell the grid last moved to.
        api.focus(pos);
        if (readOnly) return;
        // Swap the formatted display for the plain number, so typing replaces
        // the value rather than appending to a grouped string.
        //
        // The text is deliberately NOT selected here. Keyboard navigation
        // selects it (see focusCell's `selectText`), but a click has already
        // put the caret where the user aimed and selecting would discard it.
        setDraft(sanitizeNumericInput(editValue ?? value));
      }}
      onChange={(e) => setDraft(sanitizeNumericInput(e.target.value))}
      onBlur={() => {
        if (draft !== null) commit(draft);
      }}
      onKeyDown={onKeyDown}
    />
  );
}
