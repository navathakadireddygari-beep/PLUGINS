/**
 * Loads the financial evaluation template once on mount.
 *
 * There is no data-fetching library in this app, so this is a plain
 * effect + state hook. The request is aborted on unmount, which also makes it
 * safe under React StrictMode's double-invoke.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFinancialEvaluation, type FinancialEvaluationModel } from "@/api";

export interface UseFinancialEvaluationResult {
  data: FinancialEvaluationModel | null;
  loading: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /**
   * Re-fetch the template. Used by the host page's refresh event, so an
   * external change (e.g. the proposal header being edited elsewhere on the
   * APEX page) can be pulled in without remounting the widget.
   *
   * `silent` suppresses the loading state, matching the reference project's
   * post-save "silent re-fetch": the grid keeps showing the numbers the user is
   * looking at and they are swapped for the server's when they arrive, instead
   * of the whole screen blanking to a spinner after every save.
   */
  reload: (silent?: boolean) => void;
}

export const useFinancialEvaluation = (
  options: {
    proposalId?: string | number;
    spcTypeId?: string | number;
    templateTypeId?: string | number;
  } = {},
): UseFinancialEvaluationResult => {
  const { proposalId, spcTypeId, templateTypeId } = options;
  const [data, setData] = useState<FinancialEvaluationModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped to re-run the fetch effect on demand.
  const [reloadToken, setReloadToken] = useState(0);

  // Read by the effect below without being a dependency of it — a state flag
  // would re-run the fetch when it changed.
  const silentRef = useRef(false);

  const reload = useCallback((silent = false) => {
    silentRef.current = silent;
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!silentRef.current) setLoading(true);
    setError(null);

    fetchFinancialEvaluation({
      proposalId,
      spcTypeId,
      templateTypeId,
      signal: controller.signal,
    })
      .then((model) => {
        if (controller.signal.aborted) return;
        setData(model);
        setLoading(false);
        silentRef.current = false;
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load the financial evaluation template",
        );
        setLoading(false);
        silentRef.current = false;
      });

    return () => controller.abort();
  }, [proposalId, spcTypeId, templateTypeId, reloadToken]);

  return { data, loading, error, reload };
};

export default useFinancialEvaluation;
