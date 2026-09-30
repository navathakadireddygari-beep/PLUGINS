import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBuyPlan, saveBuyPlan, type BuyPlanEdits } from "@/api/buy-plan-api";
import { getAppConfig } from "@/config/app-config";
import type { BuyPlanDataset } from "@/types";

/**
 * Loads the proposal's Buy Plan, tracks the user's unsaved Buy Plan edits, and
 * saves them. After a successful save the evaluation is re-fetched so the
 * server-calculated lines (subtotals, EBIT, margins) reflect the new figures.
 */
export function useBuyPlan() {
  const proposalId = getAppConfig().proposal_id;
  const [dataset, setDataset] = useState<BuyPlanDataset | null>(null);
  const [edits, setEdits] = useState<BuyPlanEdits>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

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
        setEdits({});
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

  const setBuyPlan = useCallback((lineKey: string, bucket: string, amount: number | null) => {
    setEdits((prev) => ({ ...prev, [lineKey]: { ...prev[lineKey], [bucket]: amount } }));
    setSavedAt(null);
  }, []);

  /** The loaded dataset with unsaved Buy Plan edits applied, for rendering. */
  const view = useMemo<BuyPlanDataset | null>(() => {
    if (!dataset) return null;
    return {
      ...dataset,
      groups: dataset.groups.map((group) => ({
        ...group,
        rows: group.rows.map((row) => {
          const rowEdits = edits[row.key];
          if (!rowEdits) return row;
          const values = { ...row.values };
          Object.entries(rowEdits).forEach(([bucket, amount]) => {
            values[bucket] = { forecast: values[bucket]?.forecast ?? null, buyPlan: amount };
          });
          return { ...row, values };
        }),
      })),
    };
  }, [dataset, edits]);

  const dirty = Object.keys(edits).length > 0;

  const save = useCallback(async () => {
    if (!dataset || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      await saveBuyPlan(dataset.raw, edits, proposalId ?? dataset.header.proposalId);
      await load();
      setSavedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save the Buy Plan.");
    } finally {
      setSaving(false);
    }
  }, [dataset, dirty, edits, load, proposalId]);

  const discard = useCallback(() => setEdits({}), []);

  return { dataset: view, loading, saving, error, dirty, savedAt, setBuyPlan, save, discard, reload: load };
}
