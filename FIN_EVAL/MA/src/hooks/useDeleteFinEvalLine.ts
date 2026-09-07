/**
 * Deletes one line of the financial evaluation.
 *
 * Mirrors useSaveFinancialEvaluation: no data-fetching library, just the
 * request plus the state a delete control needs. The in-flight request is
 * aborted on unmount so a late response never sets state on a dead component.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteFinEvalLine } from "@/api";

export interface UseDeleteFinEvalLineResult {
  /** DELETE the line. Resolves true on success, false on failure. */
  remove: (lineId: number) => Promise<boolean>;
  deleting: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** Clear the last error (e.g. once the user retries). */
  clearError: () => void;
}

export const useDeleteFinEvalLine = (
  options: { proposalId?: string | number } = {},
): UseDeleteFinEvalLineResult => {
  const { proposalId } = options;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const remove = useCallback(
    async (lineId: number): Promise<boolean> => {
      const controller = new AbortController();
      controllerRef.current = controller;

      setDeleting(true);
      setError(null);
      try {
        await deleteFinEvalLine(lineId, {
          proposalId,
          signal: controller.signal,
        });
        return !controller.signal.aborted;
      } catch (err: unknown) {
        if (controller.signal.aborted) return false;
        setError(
          err instanceof Error ? err.message : "Failed to delete the row",
        );
        return false;
      } finally {
        if (!controller.signal.aborted) setDeleting(false);
      }
    },
    [proposalId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { remove, deleting, error, clearError };
};

export default useDeleteFinEvalLine;
