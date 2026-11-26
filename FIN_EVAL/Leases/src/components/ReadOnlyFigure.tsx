import type { CSSProperties } from "react";

/**
 * A read-only figure (calculated row, subtotal, total) drawn as a locked input
 * rather than plain text, so a value too long for its column can still be read
 * in place: it ends in "…" at rest, and clicking in shows the caret and lets
 * the arrow keys / Home / End scroll through it. Font, colour, weight and
 * alignment all come from the surrounding cell. Kept out of the Tab order, like
 * the other read-only inputs in the grid.
 */
const STYLE: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  font: "inherit",
  color: "inherit",
  textAlign: "inherit",
  textOverflow: "ellipsis",
  cursor: "inherit",
};

export default function ReadOnlyFigure({ value }: { value: string | number }) {
  return <input type="text" readOnly tabIndex={-1} value={value} style={STYLE} />;
}
