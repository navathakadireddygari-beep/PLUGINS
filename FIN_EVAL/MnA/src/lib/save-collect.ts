/**
 * Turning the grid's rows into the two things the save payload needs: edits to
 * lines the server already knows about, and lines the user added on screen.
 *
 * Extracted from the component so the save path can be exercised directly. It
 * is the step where a row the user typed either reaches the PUT or is silently
 * dropped, which is not something to verify by reading.
 */

import type { NewLineEdit } from "@/api/financial-api";

/** The subset of a grid row this module needs. */
export interface CollectableRow {
  /**
   * Position-based key of the template line this row came from. Absent on rows
   * the user added — that absence is exactly what marks a row as NEW.
   */
  apiKey?: string;
  label: string;
  values: string[];
  /**
   * Local identity of a section the user added THIS SESSION. Its rows have no
   * template section above them to attach to, so they are collected into that
   * section instead of being filed under the last template section on screen —
   * which, in the first grid, is Returns Analysis, a computed block that takes
   * no lines at all.
   */
  newSectionId?: string;
  /** Owning section's name; on a new section, whatever the user typed. */
  sectionName?: string | null;
}

/** One user-added section under assembly, keyed by its local id. */
export type NewSectionDraft = {
  name: string;
  lines: Array<{ name: string; yearValues: Record<string, string> }>;
};

/** Row values keyed by fiscal-year bucket ("fy26"), for the columns shown. */
export const byYearOf = (
  row: CollectableRow,
  cols: number[],
  fyKeys: string[],
): Record<string, string> => {
  const byYear: Record<string, string> = {};
  cols.forEach((i) => {
    const fy = (fyKeys[i] ?? "").toLowerCase();
    if (fy) byYear[fy] = row.values[i] ?? "";
  });
  return byYear;
};

/**
 * Split a grid's rows into edits and additions.
 *
 * A grid can render several sections back to back (Revenue, Costs and Returns
 * Analysis all feed the first grid), so a new row is attributed to the section
 * of the nearest TEMPLATE row above it — the section it visually sits under.
 * `afterKey` records that row, which is what fixes the new line's
 * `display_order` and keeps it above the subtotal it feeds.
 *
 * Rows added before any template row have nothing to attach to and are skipped,
 * as are rows the user never named — a blank line is a placeholder, not data.
 *
 * Rows in a section the USER added take neither route: they belong to that
 * section, which has no server identity yet either, so they are gathered into
 * `newSections` for the payload builder to emit as a whole new block.
 */
export const collectGridRows = (
  rows: CollectableRow[],
  cols: number[],
  fyKeys: string[],
  sectionIndexOfKey: (key: string) => number | null,
  into: Record<string, Record<string, string>>,
  added: NewLineEdit[],
  newSections?: Record<string, NewSectionDraft>,
): void => {
  let sectionIndex: number | null = null;
  let afterKey: string | undefined;
  rows.forEach((row) => {
    if (row.apiKey) {
      sectionIndex = sectionIndexOfKey(row.apiKey) ?? sectionIndex;
      afterKey = row.apiKey;
      into[row.apiKey] = byYearOf(row, cols, fyKeys);
      return;
    }
    // A row belonging to a section the user added this session.
    if (row.newSectionId) {
      if (!newSections) return;
      const draft = (newSections[row.newSectionId] ??= { name: "", lines: [] });
      // The name lives on every row of the section; the first non-blank one
      // wins, so a section named after its rows were typed still saves.
      if (!draft.name) draft.name = (row.sectionName ?? "").trim();
      if (row.label.trim()) {
        draft.lines.push({
          name: row.label.trim(),
          yearValues: byYearOf(row, cols, fyKeys),
        });
      }
      return;
    }
    if (sectionIndex === null || !row.label.trim()) return;
    added.push({
      sectionIndex,
      name: row.label.trim(),
      yearValues: byYearOf(row, cols, fyKeys),
      afterKey,
    });
  });
};
