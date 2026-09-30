/**
 * Migrates the staged evaluation into the proposal (Save Model button):
 * POST finEvalStagingMigrate/{file_id}, no body. Same shape as the other hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { migrateFinEvalStaging } from "@/api";

export interface UseMigrateFinEvalStagingResult {
  /** Resolves with the server's message on success, or null on failure. */
  migrate: () => Promise<{ message: string | null } | null>;
  migrating: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
}

export const useMigrateFinEvalStaging = (
  options: { fileId?: number | null } = {},
): UseMigrateFinEvalStagingResult => {
  const { fileId } = options;
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const migrate = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setMigrating(true);
    setError(null);
    try {
      const result = await migrateFinEvalStaging({
        fileId,
        signal: controller.signal,
      });
      return controller.signal.aborted ? null : result;
    } catch (err: unknown) {
      if (controller.signal.aborted) return null;
      setError(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      if (!controller.signal.aborted) setMigrating(false);
    }
  }, [fileId]);

  return { migrate, migrating, error };
};

export default useMigrateFinEvalStaging;
