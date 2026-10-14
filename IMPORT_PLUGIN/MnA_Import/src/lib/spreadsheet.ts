/**
 * spreadsheet
 * -----------
 * Framework-agnostic helpers that give editable tables Excel-like behavior:
 *   - a DOM lookup / focus / navigation model keyed off data attributes
 *   - clipboard (copy/paste) serialization to and from TSV
 *
 * Cells carry `data-grid`, `data-row`, `data-col` and `data-value` attributes so
 * a single scheme works across every table with no per-table ref bookkeeping.
 * `data-col` is the index into the row's value array, `data-row` the index into
 * the grid's row array.
 */

export type PasteMatrix = string[][];

/**
 * Characters permitted in a numeric cell: digits, the grouping/decimal
 * separators used across every regional format ( , . space ' ), the accounting
 * sign helpers ( - ( ) ) and the percent sign. Everything else (letters and
 * other text) is rejected so numeric cells only ever hold numbers.
 */
const NUMERIC_ALLOWED = /[0-9.,'()%\s-]/;

/** True when a single typed character is allowed to start/continue a numeric edit. */
export const isNumericInputChar = (ch: string): boolean =>
  ch.length === 1 && NUMERIC_ALLOWED.test(ch);

/** Strip any non-numeric (text) characters from a numeric cell's draft value. */
export const sanitizeNumericInput = (s: string): string =>
  s.replace(/[^0-9.,'()%\s-]/g, "");

/**
 * Parse clipboard text into a 2D matrix. Rows split on newlines, columns on
 * tabs — matching what Excel, Google Sheets and similar apps put on the
 * clipboard.
 */
export const parseClipboardMatrix = (text: string): PasteMatrix => {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let lines = normalized.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines = lines.slice(0, -1);
  }
  return lines.map((line) => line.split("\t"));
};

/** True when the pasted payload spans more than one cell. */
export const isMultiCell = (matrix: PasteMatrix): boolean =>
  matrix.length > 1 || (matrix[0]?.length ?? 0) > 1;

const findEl = (gridId: string, row: number, col: number): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    `[data-grid="${gridId}"][data-row="${row}"][data-col="${col}"]`,
  );

/** True when the cell at these coordinates exists in the given grid. */
export const cellExists = (gridId: string, row: number, col: number): boolean =>
  findEl(gridId, row, col) !== null;

/**
 * Focus the cell at the given coordinates if it exists.
 *
 * `selectText` selects the cell's contents after focusing, so the next
 * keystroke replaces the value. Pass it ONLY for keyboard navigation — the
 * reference selects after `target.focus()` in its arrow handler, and nowhere
 * else. Selecting after a MOUSE click would throw away the caret position the
 * click just set, which is what makes a cell impossible to click into.
 */
export const focusCell = (
  gridId: string,
  row: number,
  col: number,
  selectText = false,
): boolean => {
  const el = findEl(gridId, row, col);
  if (!el) return false;
  el.focus();
  if (selectText && el instanceof HTMLInputElement) el.select();
  return true;
};

/** Walk from (row,col) in the given direction to the nearest existing cell. */
export const nearestCell = (
  gridId: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  max = 60,
): { r: number; c: number } | null => {
  let r = row;
  let c = col;
  for (let i = 0; i < max; i++) {
    r += dRow;
    c += dCol;
    if (findEl(gridId, r, c)) return { r, c };
  }
  return null;
};

/**
 * Next cell for a single-step arrow move, following Prod Dev's
 * `handleCellArrowNav`: cells are taken in DOM (= visual) order.
 *
 *  - Up/Down   the previous/next cell in the SAME COLUMN, crossing section and
 *              table boundaries (Combined Operating Results -> Free Cash Flows
 *              -> Post Tax Return ...), because Prod Dev's grid is one table.
 *  - Left/Right the previous/next cell in the same row of the same grid.
 *
 * Cells marked `data-skipnav` (calculated figures) are passed over, as Prod
 * Dev's calculated rows are plain text its navigation never lands on.
 *
 * `isolated` grids have their own column numbering (e.g. the NPV block's
 * three fixed columns are not fiscal years), so vertical moves never cross
 * into or out of them.
 */
export const nextNavCell = (
  gridId: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  isolated: string[] = [],
): { gridId: string; r: number; c: number } | null => {
  const current = findEl(gridId, row, col);
  if (!current) return null;
  const all = Array.from(
    document.querySelectorAll<HTMLElement>("[data-grid][data-row][data-col]"),
  ).filter((el) => el === current || !el.hasAttribute("data-skipnav"));
  const inIsolated = isolated.includes(gridId);
  const line =
    dRow !== 0
      ? all.filter(
          (el) =>
            el.dataset.col === String(col) &&
            (inIsolated
              ? el.dataset.grid === gridId
              : !isolated.includes(el.dataset.grid ?? "")),
        )
      : all.filter(
          (el) => el.dataset.grid === gridId && el.dataset.row === String(row),
        );
  const target = line[line.indexOf(current) + (dRow !== 0 ? dRow : dCol)];
  if (!target) return null;
  return {
    gridId: target.dataset.grid ?? gridId,
    r: Number(target.dataset.row),
    c: Number(target.dataset.col),
  };
};

/** The current display value of a cell element (data-value attribute). */
const cellValue = (el: HTMLElement | null): string =>
  el ? (el.getAttribute("data-value") ?? el.textContent ?? "") : "";

/**
 * Read a rectangular block of cells and serialize it as tab/newline TSV — the
 * format Excel and Google Sheets expect on the clipboard. Missing cells become
 * empty strings so alignment is preserved.
 */
export const readSelectionTSV = (
  gridId: string,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): string => {
  const rowMin = Math.min(r1, r2);
  const rowMax = Math.max(r1, r2);
  const colMin = Math.min(c1, c2);
  const colMax = Math.max(c1, c2);
  const lines: string[] = [];
  for (let r = rowMin; r <= rowMax; r++) {
    const cells: string[] = [];
    for (let c = colMin; c <= colMax; c++) {
      cells.push(cellValue(findEl(gridId, r, c)));
    }
    lines.push(cells.join("\t"));
  }
  return lines.join("\n");
};

/** Copy text to the clipboard, falling back to execCommand when needed. */
export const writeClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fall through to the legacy path (older browsers / denied permission)
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* nothing else we can do */
  }
  document.body.removeChild(ta);
};

/** Read text from the clipboard; returns "" when unavailable/denied. */
export const readClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return "";
  }
};
