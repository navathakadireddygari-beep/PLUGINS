import React, { useRef, useState } from "react";
import { focusCell, nextNavCell, sanitizeNumericInput } from "@/lib/grid-nav";

type Props = {
  gridId: string;
  row: number;
  col: number;
  /** Already-formatted display value. */
  value: string;
  /** Plain, un-grouped value shown while the cell has focus. */
  editValue?: string;
  /** Locked cell: still reachable by arrow keys, but not editable. */
  readOnly?: boolean;
  /** Server-computed figure: bold near-black, skipped by arrows and Tab. */
  calculated?: boolean;
  negative?: boolean;
  /** Commit the typed text (editable cells only). */
  onCommit?: (text: string) => void;
};

/**
 * A grid cell, ported from FIN_EVAL/MA's SpreadsheetCell. Every cell is a
 * borderless `<input>` — editable or read-only — so the Buy Plan tables look,
 * clip and navigate exactly like MA's:
 *
 *   not focused   the formatted display value ("1,234", "(29)")
 *   focused       the plain editable number ("1234.5678")
 *   on blur/Enter committed, and back to formatted
 *
 * A figure wider than its column is clipped by the input, with the full value
 * in the cell's hover `title`, as MA does.
 */
export default function BuyPlanCell({
  gridId,
  row,
  col,
  value,
  editValue,
  readOnly = false,
  calculated = false,
  negative = false,
  onCommit,
}: Props) {
  /** Text being typed. Null = not editing, so the formatted value shows. */
  const [draft, setDraft] = useState<string | null>(null);
  // Mirrors `draft` so a blur fired by our own Enter/arrow move does not
  // commit a second time from a stale closure.
  const draftRef = useRef<string | null>(null);

  const setDraftBoth = (next: string | null) => {
    draftRef.current = next;
    setDraft(next);
  };

  const commit = () => {
    const text = draftRef.current;
    if (text === null) return;
    setDraftBoth(null);
    onCommit?.(text);
  };

  const move = (dRow: number, dCol: number) => {
    const t = nextNavCell(gridId, row, col, dRow, dCol);
    if (t) focusCell(t.gridId, t.r, t.c, true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        // Move the caret while there is text to move through; jump to the
        // next cell only at the edge (MA's `handleCellArrowNav` rule).
        if (!readOnly) {
          const caret = el.selectionStart ?? 0;
          if (e.key === "ArrowLeft" && caret > 0) return;
          if (e.key === "ArrowRight" && caret < el.value.length) return;
        }
        e.preventDefault();
        commit();
        move(0, e.key === "ArrowLeft" ? -1 : 1);
        return;
      }
      case "ArrowUp":
      case "ArrowDown":
        e.preventDefault();
        commit();
        move(e.key === "ArrowUp" ? -1 : 1, 0);
        return;
      case "Enter":
        // Commit and drop to the next row, as in a spreadsheet.
        e.preventDefault();
        commit();
        move(1, 0);
        return;
      case "Escape":
        // Abandon the edit and restore the committed value.
        e.preventDefault();
        setDraftBoth(readOnly ? null : sanitizeNumericInput(editValue ?? value));
        return;
      default:
        return;
    }
  };

  const textClass = `${calculated ? " bp-grid-cell--calc" : ""}${negative ? " bp-grid-cell--neg" : ""}`;

  return (
    <input
      type="text"
      className={`bp-grid-cell${textClass}`}
      data-grid={gridId}
      data-row={row}
      data-col={col}
      data-skipnav={calculated || undefined}
      readOnly={readOnly}
      // Tab stops on editable Buy Plan cells only; arrows still reach the rest.
      tabIndex={readOnly || calculated ? -1 : undefined}
      title={value || (readOnly ? "Read-only" : undefined)}
      placeholder="—"
      inputMode={readOnly ? undefined : "decimal"}
      value={draft ?? value}
      style={{ cursor: readOnly ? "default" : "text" }}
      onFocus={() => {
        if (readOnly) return;
        // Swap the formatted display for the plain number, so typing replaces
        // the value rather than appending to a grouped string.
        setDraftBoth(sanitizeNumericInput(editValue ?? value));
      }}
      onChange={(e) => setDraftBoth(sanitizeNumericInput(e.target.value))}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  );
}
