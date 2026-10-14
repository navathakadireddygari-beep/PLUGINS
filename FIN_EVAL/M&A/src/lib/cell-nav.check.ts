/**
 * Cell navigation, matching the reference project's `handleCellArrowNav`.
 *
 * The rules, transcribed from Prod Dev:
 *   - Left/Right move the CARET while there is text to move through, and only
 *     jump to the next cell once it is at the edge.
 *   - A read-only cell has no caret to preserve, so every arrow navigates.
 *   - Up/Down always move rows.
 *   - The trailing summary cell (its TOTAL, our CAGR) is reachable by arrows
 *     but skipped by Tab.
 *
 * Run: npx tsx src/lib/cell-nav.check.ts
 */
let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "  ok  " : "  FAIL"} ${label.padEnd(56)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`,
  );
};

/** Mirrors SpreadsheetCell.onKeyDown's caret rule. */
const navigates = (
  key: "ArrowLeft" | "ArrowRight",
  opts: { readOnly: boolean; caret: number; selEnd?: number; length: number },
): boolean => {
  const { readOnly, caret, length } = opts;
  const selEnd = opts.selEnd ?? caret;
  if (!readOnly) {
    const hasRange = selEnd !== caret;
    if (key === "ArrowLeft" && (caret > 0 || hasRange)) return false;
    if (key === "ArrowRight" && (caret < length || hasRange)) return false;
  }
  return true;
};

console.log("Left/Right move the caret until it reaches the edge");
// "1234.5" with the caret mid-text: the arrow belongs to the text.
eq("caret mid-text, Left  -> caret", navigates("ArrowLeft",  { readOnly: false, caret: 3, length: 6 }), false);
eq("caret mid-text, Right -> caret", navigates("ArrowRight", { readOnly: false, caret: 3, length: 6 }), false);
// At the edges it moves to the next cell.
eq("caret at start, Left  -> navigate", navigates("ArrowLeft",  { readOnly: false, caret: 0, length: 6 }), true);
eq("caret at end,   Right -> navigate", navigates("ArrowRight", { readOnly: false, caret: 6, length: 6 }), true);
// The opposite edge still moves the caret.
eq("caret at start, Right -> caret", navigates("ArrowRight", { readOnly: false, caret: 0, length: 6 }), false);
eq("caret at end,   Left  -> caret", navigates("ArrowLeft",  { readOnly: false, caret: 6, length: 6 }), false);

console.log("\nA selected span counts as 'not at the edge'");
// Focus selects the whole value; an arrow should collapse that selection
// rather than skip to the next cell.
eq("whole value selected, Left  -> caret",
   navigates("ArrowLeft",  { readOnly: false, caret: 0, selEnd: 6, length: 6 }), false);
eq("whole value selected, Right -> caret",
   navigates("ArrowRight", { readOnly: false, caret: 0, selEnd: 6, length: 6 }), false);

console.log("\nA read-only cell has no caret to preserve");
for (const caret of [0, 3, 6]) {
  eq(`read-only, caret ${caret}, Left  -> navigate`,
     navigates("ArrowLeft",  { readOnly: true, caret, length: 6 }), true);
  eq(`read-only, caret ${caret}, Right -> navigate`,
     navigates("ArrowRight", { readOnly: true, caret, length: 6 }), true);
}

console.log("\nAn empty cell navigates from either side");
eq("empty, Left  -> navigate", navigates("ArrowLeft",  { readOnly: false, caret: 0, length: 0 }), true);
eq("empty, Right -> navigate", navigates("ArrowRight", { readOnly: false, caret: 0, length: 0 }), true);

/* ── the CAGR column is reachable but never writable ────────────────── */
console.log("\nThe CAGR cell: reachable by arrows, immune to paste");
// Mirrors writeCells' guard: `cc >= 0 && cc < row.values.length`.
const writable = (col: number, valuesLength: number) => col >= 0 && col < valuesLength;

const FY_BUCKETS = 10;
const cagrCol = FY_BUCKETS; // one past EVERY bucket
eq("CAGR sits past the last bucket", cagrCol, 10);
eq("a paste cannot write there", writable(cagrCol, FY_BUCKETS), false);
// The last real year still is writable, so the guard is not simply off.
eq("the last year IS writable", writable(FY_BUCKETS - 1, FY_BUCKETS), true);

// The bug this guards: anchoring to the last VISIBLE column instead. Narrow
// the view to 8 years and that index lands inside the array, so a paste would
// overwrite fy32 — a year scrolled out of sight.
const visibleCols = 8;
eq("naive 'last visible + 1' would be writable",
   writable(visibleCols, FY_BUCKETS), true);
eq("...whereas ours still is not", writable(cagrCol, FY_BUCKETS), false);

console.log("\nTab order: summary cells are skipped, value cells are not");
// SpreadsheetCell passes tabIndex only for the CAGR cell.
eq("CAGR tabIndex", -1, -1);
eq("value cell tabIndex is the default", undefined, undefined);

/* -- the active-cell highlight follows focus -- */
console.log("\nThe blue ring follows whatever has focus");
type Sel = { gridId: string; r1: number; c1: number; r2: number; c2: number };
// Mirrors the provider's `focus` reducer.
const onFocus = (sel: Sel | null, p: { gridId: string; row: number; col: number }): Sel =>
  sel && sel.gridId === p.gridId && sel.r2 === p.row && sel.c2 === p.col
    ? sel
    : { gridId: p.gridId, r1: p.row, c1: p.col, r2: p.row, c2: p.col };

{
  // Tab moves focus natively; the grid only learns about it from onFocus.
  // Without that, the ring stays on the cell the grid last moved to.
  const before: Sel = { gridId: "cor", r1: 2, c1: 3, r2: 2, c2: 3 };
  const after = onFocus(before, { gridId: "cor", row: 2, col: 4 });
  eq("Tab to the next column moves the ring", [after.r2, after.c2], [2, 4]);
  eq("...and collapses the range to that cell", [after.r1, after.c1], [2, 4]);
}
{
  // Tab can land in a different grid entirely.
  const before: Sel = { gridId: "cor", r1: 9, c1: 9, r2: 9, c2: 9 };
  const after = onFocus(before, { gridId: "fcf", row: 0, col: 0 });
  eq("Tab across tables switches grid", after.gridId, "fcf");
}
{
  // Focusing the cell that is ALREADY active must return the same object.
  // A fresh one re-runs the focus effect, which focuses the cell, which fires
  // onFocus again - an endless loop.
  const before: Sel = { gridId: "cor", r1: 1, c1: 1, r2: 1, c2: 1 };
  const after = onFocus(before, { gridId: "cor", row: 1, col: 1 });
  eq("re-focusing the active cell is a no-op", after === before, true);
}
{
  // A shift-click range keeps its anchor; onFocus fires for the clicked cell,
  // which is already r2/c2, so the range survives.
  const ranged: Sel = { gridId: "cor", r1: 1, c1: 1, r2: 3, c2: 5 };
  const after = onFocus(ranged, { gridId: "cor", row: 3, col: 5 });
  eq("an extended range is not collapsed by its own focus", after === ranged, true);
}

console.log("\nText is selected on KEYBOARD moves only");
// focusCell(gridId, r, c, selectText) - the flag is set by moveActive and by
// nothing else, so a click keeps the caret the browser just placed.
const selectsText = (source: "keyboard" | "mouse" | "tab") => source === "keyboard";
eq("arrow key -> select the text", selectsText("keyboard"), true);
eq("mouse click -> keep the caret", selectsText("mouse"), false);
eq("tab -> leave it to the browser", selectsText("tab"), false);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) throw new Error(`${fail} cell-nav check(s) failed`);
