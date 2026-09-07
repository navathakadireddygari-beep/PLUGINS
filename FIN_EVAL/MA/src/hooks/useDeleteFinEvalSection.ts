/**
 * Deletes one SECTION of the financial evaluation, and every line under it.
 *
 * The same shape as useDeleteFinEvalLine — the endpoint is the same URL and
 * differs only in which id the body carries (see api/delete-api) — so the two
 * hooks are deliberately identical apart from the call they make. The in-flight
 * request is aborted on unmount so a late response never sets state on a dead
 * component.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteFinEvalSection } from "@/api";

export interface UseDeleteFinEvalSectionResult {
  /** DELETE the section. Resolves true on success, false on failure. */
  remove: (sectionId: number) => Promise<boolean>;
  deleting: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** Clear the last error (e.g. once the user retries). */
  clearError: () => void;
}

export const useDeleteFinEvalSection = (
  options: { proposalId?: string | number } = {},
): UseDeleteFinEvalSectionResult => {
  const { proposalId } = options;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const remove = useCallback(
    async (sectionId: number): Promise<boolean> => {
      const controller = new AbortController();
      controllerRef.current = controller;

      setDeleting(true);
      setError(null);
      try {
        await deleteFinEvalSection(sectionId, {
          proposalId,
          signal: controller.signal,
        });
        return !controller.signal.aborted;
      } catch (err: unknown) {
        if (controller.signal.aborted) return false;
        setError(
          err instanceof Error ? err.message : "Failed to delete the section",
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

export default useDeleteFinEvalSection;
