import { createContext, useContext } from "react";
import type React from "react";

export type CellPos = { gridId: string; row: number; col: number };

/**
 * The behavior a SpreadsheetCell needs from its owning table. Implemented once
 * in the table container so selection, editing, navigation and clipboard are
 * coordinated across every cell.
 */
export interface SpreadsheetApi {
  isSelected: (p: CellPos) => boolean;
  isActive: (p: CellPos) => boolean;
  /** Mouse selection (plain = single cell + begin drag, shift = extend range). */
  select: (e: React.MouseEvent, p: CellPos) => void;
  /** Pointer entered a cell — extend the range while a drag is in progress. */
  hover: (p: CellPos) => void;
  /**
   * This cell received focus by a route the grid did not initiate — a Tab, or
   * a click. The active-cell highlight follows the grid's own selection state,
   * so without this it stays behind on whichever cell the grid last moved to
   * and the blue ring drifts away from the caret.
   */
  focus: (p: CellPos) => void;
  /**
   * Navigation and clipboard for a focused cell: arrows across rows, Tab,
   * Ctrl+C / V / X, and Delete over a selected range.
   *
   * There is deliberately no edit MODE here. Every cell is a live input (see
   * SpreadsheetCell), so nothing has to be opened before it can be typed into,
   * and the grid never has to track which cell is "being edited".
   */
  keyDown: (e: React.KeyboardEvent, p: CellPos, keyOverride?: string) => void;
  /** Persist an edited value. */
  commit: (p: CellPos, text: string) => void;
}

const SpreadsheetContext = createContext<SpreadsheetApi | null>(null);

export const SpreadsheetProvider = SpreadsheetContext.Provider;

export const useSpreadsheet = (): SpreadsheetApi => {
  const ctx = useContext(SpreadsheetContext);
  if (!ctx) {
    throw new Error(
      "SpreadsheetCell must be used within a SpreadsheetProvider",
    );
  }
  return ctx;
};
