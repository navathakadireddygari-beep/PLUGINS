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
  /**
   * Owning section's identity — `s<index>` for a section the response carried.
   * "+ Add Row" stamps it on the new row, and it is the authority for where the
   * row is saved: position alone misfiles a row inserted at the TOP of a
   * section (e.g. one whose lines are all calculated), because the nearest
   * template row above it then belongs to the previous section.
   */
  sectionKey?: string;
  /** Carried onto a new line's `line_identifier` (NON_FINANCIAL in a custom section). */
  lineIdentifier?: string | null;
}

/** One user-added section under assembly, keyed by its local id. */
export type NewSectionDraft = {
  name: string;
  lines: Array<{
    name: string;
    yearValues: Record<string, string>;
    lineIdentifier?: string | null;
  }>;
};

/**
 * Row values keyed by fiscal-year bucket ("fy26"), for EVERY year the row
 * carries — not only the columns on screen.
 *
 * Narrowing the view with the year stepper only hides columns; it never
 * deletes their values. Collecting just the visible ones meant a NEW line
 * typed with five projections and then narrowed to three saved only three,
 * and the hidden two were gone on reload. (Template lines were unaffected —
 * the payload builder keeps buckets it is not sent — but new lines have no
 * buckets to keep.) `cols` is still honoured as a minimum, so a column the
 * stepper added ahead of `fyKeys` is never missed.
 */
export const byYearOf = (
  row: CollectableRow,
  cols: number[],
  fyKeys: string[],
): Record<string, string> => {
  const byYear: Record<string, string> = {};
  const indices = new Set<number>([...fyKeys.keys(), ...cols]);
  [...indices]
    .sort((a, b) => a - b)
    .forEach((i) => {
      const fy = (fyKeys[i] ?? "").toLowerCase();
      if (fy) byYear[fy] = row.values[i] ?? "";
    });
  return byYear;
};

/** True when any year of the row holds something. */
const hasAnyValue = (row: CollectableRow): boolean =>
  row.values.some((v) => String(v ?? "").trim() !== "");

/** Section index of a row's own `sectionKey` (`s3` -> 3), when it has one. */
const sectionIndexOfRow = (row: CollectableRow): number | null => {
  const match = /^s(\d+)$/.exec(row.sectionKey ?? "");
  return match ? Number(match[1]) : null;
};

/**
 * New rows the save could not place. A row the user typed figures into must
 * never be dropped silently — the caller blocks the save and says why.
 */
export interface CollectIssues {
  /** New rows with figures but no name. */
  unnamedLines: number;
  /** New rows with no section to attach to (no template row in the grid). */
  unattachedLines: number;
}

/**
 * Split a grid's rows into edits and additions.
 *
 * A new row is attributed to its OWN section (`sectionKey`, stamped by "+ Add
 * Row"); a row without one falls back to the section of the nearest TEMPLATE
 * row above it — the section it visually sits under — and a row above every
 * template row to the grid's first section. `afterKey` records the template
 * row of that section directly above it (or `beforeKey` the one directly below,
 * for a row at the top of its section), which is what fixes the new line's
 * `display_order` and keeps it above the subtotal it feeds.
 *
 * A row the user never named and never typed into is a placeholder and is
 * skipped. One that HAS figures but no name is not saved either — there is no
 * line to save it as — but it is counted in the returned issues so the caller
 * can block the save and say so, instead of letting the figures vanish on the
 * next reload.
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
): CollectIssues => {
  const issues: CollectIssues = { unnamedLines: 0, unattachedLines: 0 };
  const sectionOfTemplate = (row: CollectableRow): number | null =>
    row.apiKey ? sectionIndexOfKey(row.apiKey) : null;
  const firstSection =
    rows.map(sectionOfTemplate).find((s): s is number => s !== null) ?? null;
  /** First template row of `section` at or after position `from`. */
  const templateKeyAfter = (from: number, section: number): string | undefined =>
    rows.slice(from).find((r) => sectionOfTemplate(r) === section)?.apiKey;

  let runningSection: number | null = null;
  /** Last template row seen so far, per section. */
  const lastKeyOf = new Map<number, string>();

  rows.forEach((row, i) => {
    if (row.apiKey) {
      const s = sectionOfTemplate(row);
      if (s !== null) {
        runningSection = s;
        lastKeyOf.set(s, row.apiKey);
      }
      into[row.apiKey] = byYearOf(row, cols, fyKeys);
      return;
    }
    const name = row.label.trim();
    // A row belonging to a section the user added this session.
    if (row.newSectionId) {
      if (!newSections) return;
      const draft = (newSections[row.newSectionId] ??= { name: "", lines: [] });
      // The name lives on every row of the section; the first non-blank one
      // wins, so a section named after its rows were typed still saves.
      if (!draft.name) draft.name = (row.sectionName ?? "").trim();
      if (name) {
        draft.lines.push({
          name,
          yearValues: byYearOf(row, cols, fyKeys),
          lineIdentifier: row.lineIdentifier,
        });
      } else if (hasAnyValue(row)) {
        issues.unnamedLines += 1;
      }
      return;
    }
    if (!name) {
      if (hasAnyValue(row)) issues.unnamedLines += 1;
      return;
    }
    const sectionIndex = sectionIndexOfRow(row) ?? runningSection ?? firstSection;
    if (sectionIndex === null) {
      issues.unattachedLines += 1;
      return;
    }
    const afterKey = lastKeyOf.get(sectionIndex);
    added.push({
      sectionIndex,
      name,
      yearValues: byYearOf(row, cols, fyKeys),
      afterKey,
      beforeKey: afterKey ? undefined : templateKeyAfter(i + 1, sectionIndex),
      lineIdentifier: row.lineIdentifier,
    });
  });
  return issues;
};

/**
 * Why the user-added LINES cannot be saved, or null when they can. Summed over
 * every grid's `collectGridRows` result.
 */
export const newLinesError = (issues: CollectIssues): string | null => {
  if (issues.unnamedLines > 0) {
    return issues.unnamedLines === 1
      ? "Cannot save — a new line has figures but no name. Enter a line name or delete the line."
      : `Cannot save — ${issues.unnamedLines} new lines have figures but no name. Enter a line name or delete the lines.`;
  }
  if (issues.unattachedLines > 0) {
    return "Cannot save — a new line has no section to belong to. Delete it and add it again with \"+ Add Row\".";
  }
  return null;
};

/**
 * Why the user-added sections cannot be saved yet, or null when they can.
 *
 * A section needs a name and at least one named line. The backend accepts a
 * section with no lines but never returns it, so without this check the save
 * reports success and the section silently disappears on the next GET.
 */
export const newSectionsError = (
  drafts: Record<string, NewSectionDraft>,
): string | null => {
  for (const draft of Object.values(drafts)) {
    const name = draft.name.trim();
    if (!name) {
      return "Cannot save — a new section has no name. Enter a section name or delete the section.";
    }
    if (!draft.lines.length) {
      return `Cannot save — section "${name}" has no lines. Add at least one line or delete the section.`;
    }
  }
  return null;
};
