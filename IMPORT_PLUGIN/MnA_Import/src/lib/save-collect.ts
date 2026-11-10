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
  /** Carried onto a new line's `line_identifier` (NON_FINANCIAL in a custom section). */
  lineIdentifier?: string | null;
  /**
   * Owning section's key, `s<index>` for a section the response carried. A row
   * added with "+ Add Row" inherits it from its section, so it is the most
   * direct statement of where the row belongs — preferred over guessing from
   * the template row above it.
   */
  sectionKey?: string;
}

/** `s3` -> 3; null for `new:<id>` or anything else. */
const sectionIndexOfSectionKey = (key: string | undefined): number | null => {
  const match = /^s(\d+)$/.exec(key ?? "");
  return match ? Number(match[1]) : null;
};

/** One user-added section under assembly, keyed by its local id. */
export type NewSectionDraft = {
  name: string;
  lines: Array<{
    name: string;
    yearValues: Record<string, string>;
    lineIdentifier?: string | null;
  }>;
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
 * Edits to template rows carry the columns the grid SHOWS (`cols`); a year the
 * user cannot see cannot have been edited, and the payload builder echoes it
 * from the GET unchanged.
 *
 * A NEW row carries EVERY fiscal year (`fyKeys`), not just the visible ones: it
 * has no GET entry to fall back on, so a bucket left out is a bucket the line
 * never gets — a row added while some years were scrolled out of view used to
 * save with holes in it.
 *
 * Section attribution, most direct first:
 *  1. the row's own `sectionKey` (`s<index>`), which "+ Add Row" copies from
 *     the section it was added to;
 *  2. otherwise the section of the nearest TEMPLATE row above it — the section
 *     it visually sits under;
 *  3. otherwise (a row above every template row) the section of the first
 *     template row BELOW it. Such rows used to be skipped outright.
 *
 * `afterKey` is the nearest template row above in the SAME section, which fixes
 * the new line's `display_order` and keeps it above the subtotal it feeds.
 * When the row is the first of its section there is none, so `beforeKey` names
 * the section's first template row instead and the line is inserted ahead of
 * it.
 *
 * A row the user never named is still sent — same as the reference project —
 * so the backend's own validation rejects it with a proper error instead of the
 * row silently vanishing from the save.
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
  const allCols = fyKeys.map((_, i) => i);
  rows.forEach((row, idx) => {
    if (row.apiKey) {
      into[row.apiKey] = byYearOf(row, cols, fyKeys);
      return;
    }
    // A row belonging to a section the user added this session. (Unreachable
    // via the UI now that "+ Add Section" is gone, but kept for any leftover
    // in-flight local section state from before this change.)
    if (row.newSectionId) {
      if (!newSections) return;
      const draft = (newSections[row.newSectionId] ??= { name: "", lines: [] });
      // The name lives on every row of the section; the first non-blank one
      // wins, so a section named after its rows were typed still saves.
      if (!draft.name) draft.name = (row.sectionName ?? "").trim();
      if (row.label.trim()) {
        draft.lines.push({
          name: row.label.trim(),
          yearValues: byYearOf(row, allCols, fyKeys),
          lineIdentifier: row.lineIdentifier,
        });
      }
      return;
    }

    let sectionIndex = sectionIndexOfSectionKey(row.sectionKey);
    let afterKey: string | undefined;
    let beforeKey: string | undefined;
    // Nearest template row above. Sections are contiguous, so if it belongs to
    // another section this row is the first of its own.
    for (let j = idx - 1; j >= 0; j -= 1) {
      const key = rows[j].apiKey;
      if (!key) continue;
      const s = sectionIndexOfKey(key);
      if (sectionIndex === null) sectionIndex = s;
      if (s !== null && s === sectionIndex) afterKey = key;
      break;
    }
    if (afterKey === undefined) {
      for (let j = idx + 1; j < rows.length; j += 1) {
        const key = rows[j].apiKey;
        if (!key) continue;
        const s = sectionIndexOfKey(key);
        if (sectionIndex === null) sectionIndex = s;
        if (s !== null && s === sectionIndex) beforeKey = key;
        break;
      }
    }
    // A grid with no template row at all has nothing to attach the row to.
    if (sectionIndex === null) return;
    added.push({
      sectionIndex,
      name: row.label.trim(),
      yearValues: byYearOf(row, allCols, fyKeys),
      afterKey,
      beforeKey,
      lineIdentifier: row.lineIdentifier,
    });
  });
};

