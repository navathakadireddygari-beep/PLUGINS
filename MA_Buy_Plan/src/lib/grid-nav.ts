/**
 * grid-nav
 * --------
 * Keyboard navigation for the Buy Plan tables, ported from FIN_EVAL/MA
 * src/lib/spreadsheet.ts. Cells carry `data-grid`, `data-row` and `data-col`
 * attributes so one scheme works across both tables with no ref bookkeeping.
 */

/** Strip any non-numeric (text) characters from a numeric cell's draft value. */
export const sanitizeNumericInput = (s: string): string =>
  s.replace(/[^0-9.,'()%\s-]/g, "");

const findEl = (gridId: string, row: number, col: number): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    `[data-grid="${gridId}"][data-row="${row}"][data-col="${col}"]`
  );

/**
 * Focus the cell at the given coordinates. `selectText` selects its contents so
 * the next keystroke replaces the value — keyboard navigation only, as in MA.
 */
export const focusCell = (
  gridId: string,
  row: number,
  col: number,
  selectText = false
): boolean => {
  const el = findEl(gridId, row, col);
  if (!el) return false;
  el.focus();
  if (selectText && el instanceof HTMLInputElement) el.select();
  return true;
};

/**
 * Next cell for a single-step arrow move, in DOM (= visual) order, exactly as
 * MA's `nextNavCell`:
 *
 *  - Up/Down    the previous/next cell in the SAME COLUMN, crossing group and
 *               table boundaries (Local Currency -> US$ table).
 *  - Left/Right the previous/next cell in the same row of the same grid.
 *
 * Cells marked `data-skipnav` (calculated figures) are passed over.
 */
export const nextNavCell = (
  gridId: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number
): { gridId: string; r: number; c: number } | null => {
  const current = findEl(gridId, row, col);
  if (!current) return null;
  const all = Array.from(
    document.querySelectorAll<HTMLElement>("[data-grid][data-row][data-col]")
  ).filter((el) => el === current || !el.hasAttribute("data-skipnav"));
  const line =
    dRow !== 0
      ? all.filter((el) => el.dataset.col === String(col))
      : all.filter((el) => el.dataset.grid === gridId && el.dataset.row === String(row));
  const target = line[line.indexOf(current) + (dRow !== 0 ? dRow : dCol)];
  if (!target) return null;
  return {
    gridId: target.dataset.grid ?? gridId,
    r: Number(target.dataset.row),
    c: Number(target.dataset.col),
  };
};
