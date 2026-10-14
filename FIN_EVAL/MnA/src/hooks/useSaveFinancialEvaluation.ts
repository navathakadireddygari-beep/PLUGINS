/**
 * Saves the financial evaluation back to the API.
 *
 * Mirrors useFinancialEvaluation: no data-fetching library, just the request
 * plus the three pieces of state a Save button needs. The in-flight request is
 * aborted on unmount so a late response never sets state on a dead component.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildFinancialEvaluationPayload,
  saveFinancialEvaluation,
  type FinancialEvaluationEdits,
  type FinancialEvaluationResponse,
} from "@/api";

export interface UseSaveFinancialEvaluationResult {
  /** Build the payload from the loaded template + edits and PUT it. */
  save: (
    raw: FinancialEvaluationResponse,
    edits?: FinancialEvaluationEdits,
  ) => Promise<boolean>;
  saving: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** True after a save succeeds, until the next attempt. */
  saved: boolean;
}

export const useSaveFinancialEvaluation = (
  options: { proposalId?: string | number } = {},
): UseSaveFinancialEvaluationResult => {
  const { proposalId } = options;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const save = useCallback(
    async (
      raw: FinancialEvaluationResponse,
      edits: FinancialEvaluationEdits = {},
    ): Promise<boolean> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setSaving(true);
      setError(null);
      setSaved(false);
      try {
        await saveFinancialEvaluation(
          buildFinancialEvaluationPayload(raw, edits),
          { proposalId, signal: controller.signal },
        );
        if (controller.signal.aborted) return false;
        setSaved(true);
        return true;
      } catch (err: unknown) {
        if (controller.signal.aborted) return false;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save the financial evaluation",
        );
        return false;
      } finally {
        if (!controller.signal.aborted) setSaving(false);
      }
    },
    [proposalId],
  );

  return { save, saving, error, saved };
};

export default useSaveFinancialEvaluation;
