/**
 * Pure state transformers for year column management.
 *
 * Each function takes a PivotTableData and returns a new PivotTableData with
 * the requested change. No React, no side effects. The component wraps these
 * with setData and any UI-state cleanup (closing menus, clearing hover).
 *
 * Invariants preserved across every operation:
 *   - `years`        — ordered list of fiscal years (numbers)
 *   - `columnLabels` — one label per year, keyed by the year number
 *   - every row's `yearValues` — keyed by year; always has an entry for each
 *     year in `years`, no extra keys
 */
import type { PivotTableData, YearValues } from "../api/financial-api";

const fyLabel = (year: number): string => `FY${String(year).slice(2)}`;

const withYearAddedEverywhere = (p: PivotTableData, year: number): PivotTableData => ({
  ...p,
  columnLabels: { ...p.columnLabels, [year]: fyLabel(year) },
  groups: p.groups.map((g) => ({
    ...g,
    values: g.values.map((v) => ({ ...v, yearValues: { ...v.yearValues, [year]: 0 } })),
  })),
});

const withYearRemovedEverywhere = (p: PivotTableData, year: number): PivotTableData => {
  const lbl = { ...p.columnLabels };
  delete lbl[year];
  return {
    ...p,
    columnLabels: lbl,
    groups: p.groups.map((g) => ({
      ...g,
      values: g.values.map((v) => {
        const nv: YearValues = { ...v.yearValues };
        delete nv[year];
        return { ...v, yearValues: nv };
      }),
    })),
  };
};

/** `+` in the toolbar. Appends next year (max + 1) to the end. */
export function increaseYears(p: PivotTableData): PivotTableData {
  const year = (p.years.length ? Math.max(...p.years) : new Date().getFullYear()) + 1;
  return { ...withYearAddedEverywhere(p, year), years: [...p.years, year] };
}

/** `−` in the toolbar. Removes the last year; no-op when only one year remains. */
export function decreaseYears(p: PivotTableData): PivotTableData {
  if (p.years.length <= 1) return p;
  const last = p.years[p.years.length - 1];
  const base = withYearRemovedEverywhere(p, last);
  return { ...base, years: p.years.slice(0, -1) };
}

/** `+` chip on column hover. Inserts a new year just after the given index. */
export function insertYearAfter(p: PivotTableData, idx: number): PivotTableData {
  const year = (p.years.length ? Math.max(...p.years) : new Date().getFullYear()) + 1;
  const base = withYearAddedEverywhere(p, year);
  return {
    ...base,
    years: [...p.years.slice(0, idx + 1), year, ...p.years.slice(idx + 1)],
  };
}

/** Column-menu Delete. Removes a specific year; no-op when only one year remains. */
export function removeYear(p: PivotTableData, year: number): PivotTableData {
  if (p.years.length <= 1) return p;
  const base = withYearRemovedEverywhere(p, year);
  return { ...base, years: p.years.filter((y) => y !== year) };
}

/** Inline-edit commit for the column label. Falls back to FYxx when blank. */
export function updateColumnLabel(p: PivotTableData, year: number, label: string): PivotTableData {
  return { ...p, columnLabels: { ...p.columnLabels, [year]: label || fyLabel(year) } };
}

/** Swap year at index `i` with `i - 1`. `yearValues` needs no change (keyed by year). */
export function moveYearLeft(p: PivotTableData, i: number): PivotTableData {
  if (i <= 0) return p;
  const y = [...p.years];
  [y[i - 1], y[i]] = [y[i], y[i - 1]];
  return { ...p, years: y };
}

/** Swap year at index `i` with `i + 1`. */
export function moveYearRight(p: PivotTableData, i: number): PivotTableData {
  if (i >= p.years.length - 1) return p;
  const y = [...p.years];
  [y[i], y[i + 1]] = [y[i + 1], y[i]];
  return { ...p, years: y };
}
