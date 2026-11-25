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
import type { DeleteResult } from "./useDeleteFinEvalLine";

export interface UseDeleteFinEvalSectionResult {
  /** DELETE the section. Resolves `ok` plus the message to show in the toast. */
  remove: (sectionId: number) => Promise<DeleteResult>;
  deleting: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** Clear the last error (e.g. once the user retries). */
  clearError: () => void;
}

export const useDeleteFinEvalSection = (
  options: { fileId?: string | number } = {},
): UseDeleteFinEvalSectionResult => {
  const { fileId } = options;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const remove = useCallback(
    async (sectionId: number): Promise<DeleteResult> => {
      const controller = new AbortController();
      controllerRef.current = controller;

      setDeleting(true);
      setError(null);
      try {
        const message = await deleteFinEvalSection(sectionId, {
          fileId,
          signal: controller.signal,
        });
        return controller.signal.aborted ? { ok: false } : { ok: true, message };
      } catch (err: unknown) {
        if (controller.signal.aborted) return { ok: false };
        const message =
          err instanceof Error ? err.message : "Failed to delete the section";
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

export default useDeleteFinEvalSection;
