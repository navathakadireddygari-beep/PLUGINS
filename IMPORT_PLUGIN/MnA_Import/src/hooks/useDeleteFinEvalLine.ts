/**
 * Deletes one line of the financial evaluation.
 *
 * Mirrors useSaveFinancialEvaluation: no data-fetching library, just the
 * request plus the state a delete control needs. The in-flight request is
 * aborted on unmount so a late response never sets state on a dead component.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteFinEvalLine } from "@/api";

/** Outcome of a delete: `message` is the API's text (or the error), if any. */
export interface DeleteResult {
  ok: boolean;
  message?: string;
}

export interface UseDeleteFinEvalLineResult {
  /** DELETE the line. Resolves `ok` plus the message to show in the toast. */
  remove: (lineId: number) => Promise<DeleteResult>;
  deleting: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** Clear the last error (e.g. once the user retries). */
  clearError: () => void;
}

export const useDeleteFinEvalLine = (
  options: { fileId?: string | number } = {},
): UseDeleteFinEvalLineResult => {
  const { fileId } = options;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const remove = useCallback(
    async (lineId: number): Promise<DeleteResult> => {
      const controller = new AbortController();
      controllerRef.current = controller;

      setDeleting(true);
      setError(null);
      try {
        const message = await deleteFinEvalLine(lineId, {
          fileId,
          signal: controller.signal,
        });
        return controller.signal.aborted ? { ok: false } : { ok: true, message };
      } catch (err: unknown) {
        if (controller.signal.aborted) return { ok: false };
        const message =
          err instanceof Error ? err.message : "Failed to delete the row";
        setError(message);
        return { ok: false, message };
      } finally {
        if (!controller.signal.aborted) setDeleting(false);
      }
    },
    [fileId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { remove, deleting, error, clearError };
};

export default useDeleteFinEvalLine;
