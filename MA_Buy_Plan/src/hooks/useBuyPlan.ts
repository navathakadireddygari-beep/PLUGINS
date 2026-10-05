import { useCallback, useEffect, useRef, useState } from "react";
import { createBuyPlanAdjustment, fetchBuyPlan, fiscalYearOf } from "@/api/buy-plan-api";
import { getAppConfig } from "@/config/app-config";
import type { BuyPlanDataset, NewBuyPlanRow } from "@/types";

/** FY buckets of a new row that carry an amount worth posting. */
const postableYears = (row: NewBuyPlanRow): string[] =>
  Object.entries(row.amounts)
    .filter(([, amount]) => amount !== null && amount !== 0)
    .map(([fy]) => fy);

let nextRowId = 0;

/**
 * Loads the proposal's Buy Plan (read-only: Forecast, Buy Plan and Variance all
 * come from the server) and tracks the rows the user adds. Saving POSTs each
 * new row as one adjustment per fiscal year, then re-fetches so the server's
 * figures include them.
 */
export function useBuyPlan() {
  const { proposal_id: proposalId, user_id: userId } = getAppConfig();
  const [dataset, setDataset] = useState<BuyPlanDataset | null>(null);
  const [newRows, setNewRows] = useState<NewBuyPlanRow[]>([]);
  // Mirrors `newRows` so `save` posts what is on screen, not a stale closure.
  const newRowsRef = useRef<NewBuyPlanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const updateRows = useCallback((fn: (rows: NewBuyPlanRow[]) => NewBuyPlanRow[]) => {
    newRowsRef.current = fn(newRowsRef.current);
    setNewRows(newRowsRef.current);
    setSavedAt(null);
  }, []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!proposalId) {
        setError("No proposal_id configured — set it in window.__APP_CONFIG__ or the URL.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        setDataset(await fetchBuyPlan(proposalId, signal));
      } catch (e) {
        if (signal?.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load the Buy Plan.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [proposalId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const addRow = useCallback(
    (sectionCode: string) =>
      updateRows((rows) => [
        ...rows,
        { key: `new-${++nextRowId}`, sectionCode, description: "", amounts: {} },
      ]),
    [updateRows]
  );

  const setRowDescription = useCallback(
    (key: string, description: string) =>
      updateRows((rows) => rows.map((r) => (r.key === key ? { ...r, description } : r))),
    [updateRows]
  );

  /** `amount` is in USD; null clears the cell. */
  const setRowAmount = useCallback(
    (key: string, fy: string, amount: number | null) =>
      updateRows((rows) =>
        rows.map((r) => (r.key === key ? { ...r, amounts: { ...r.amounts, [fy]: amount } } : r))
      ),
    [updateRows]
  );

  const removeRow = useCallback(
    (key: string) => updateRows((rows) => rows.filter((r) => r.key !== key)),
    [updateRows]
  );

  const discard = useCallback(() => updateRows(() => []), [updateRows]);

  const dirty = newRows.length > 0;

  const save = useCallback(async () => {
    if (!dataset || !proposalId) return;
    // Rows with no amounts carry nothing to save — drop them quietly.
    const rows = newRowsRef.current.filter((r) => postableYears(r).length > 0);
    if (rows.length === 0) {
      updateRows(() => []);
      return;
    }
    const sectionIdOf = (code: string) =>
      dataset.sections.find((s) => s.code === code)?.sectionId ?? null;

    const problem =
      rows.find((r) => !r.description.trim()) !== undefined
        ? "Enter a description for every new row before saving."
        : rows.find((r) => sectionIdOf(r.sectionCode) === null) !== undefined
          ? "The Buy Plan response has no fin_eval_section_id for this section — cannot save the adjustment."
          : !userId
            ? "No user_id configured — set it in window.__APP_CONFIG__ (sent as created_by)."
            : null;
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError(null);
    updateRows(() => rows);
    let posted = 0;
    let failure: string | null = null;
    try {
      for (const row of rows) {
        for (const fy of postableYears(row)) {
          await createBuyPlanAdjustment({
            proposal_id: proposalId,
            fin_eval_section_id: sectionIdOf(row.sectionCode)!,
            description: row.description.trim(),
            amount: row.amounts[fy]!,
            fiscal_year: fiscalYearOf(fy),
            created_by: userId!,
          });
          // Drop each posted year at once, so a failure further on never
          // re-posts it when the user saves again.
          updateRows((current) =>
            current
              .map((r) => (r.key === row.key ? { ...r, amounts: { ...r.amounts, [fy]: null } } : r))
              .filter((r) => postableYears(r).length > 0)
          );
          posted++;
        }
      }
    } catch (e) {
      failure = e instanceof Error ? e.message : "Failed to save the Buy Plan adjustment.";
    }
    // Re-fetch so the server's Buy Plan figures include what was posted.
    // (`load` clears `error`, so the save outcome is reported after it.)
    if (posted > 0) await load();
    setSaving(false);
    if (failure) setError(failure);
    else setSavedAt(new Date());
  }, [dataset, proposalId, userId, updateRows, load]);

  return {
    dataset,
    newRows,
    loading,
    saving,
    error,
    dirty,
    savedAt,
    addRow,
    setRowDescription,
    setRowAmount,
    removeRow,
    save,
    discard,
  };
}
