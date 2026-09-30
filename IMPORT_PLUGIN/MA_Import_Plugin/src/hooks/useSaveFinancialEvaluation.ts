/**
 * Validates the staged financial evaluation (Validate button).
 *
 * Builds the M&A payload from the loaded staging data + the screen's edits and
 * PUTs it to finEvaluationStaging/{file_id}, so the backend re-runs validation.
 * The in-flight request is aborted on unmount so a late response never sets
 * state on a dead component.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildFinancialEvaluationPayload,
  validateFinEvaluationStaging,
  type FinancialEvaluationEdits,
  type FinancialEvaluationResponse,
} from "@/api";

export interface UseSaveFinancialEvaluationResult {
  /** Build the payload from the loaded staging data + edits and PUT it. */
  save: (
    raw: FinancialEvaluationResponse,
    edits?: FinancialEvaluationEdits,
  ) => Promise<boolean>;
  saving: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** True after a validation succeeds, until the next attempt. */
  saved: boolean;
  /** The server's message for the last successful validation. */
  message: string | null;
}

export const useSaveFinancialEvaluation = (
  options: { fileId?: number | null } = {},
): UseSaveFinancialEvaluationResult => {
  const { fileId } = options;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
        const result = await validateFinEvaluationStaging(
          buildFinancialEvaluationPayload(raw, edits),
          { fileId, signal: controller.signal },
        );
        if (controller.signal.aborted) return false;
        setMessage(result.message);
        setSaved(true);
        return true;
      } catch (err: unknown) {
        if (controller.signal.aborted) return false;
        setError(err instanceof Error ? err.message : "Validation failed");
        return false;
      } finally {
        if (!controller.signal.aborted) setSaving(false);
      }
    },
    [fileId],
  );

  return { save, saving, error, saved, message };
};

export default useSaveFinancialEvaluation;
