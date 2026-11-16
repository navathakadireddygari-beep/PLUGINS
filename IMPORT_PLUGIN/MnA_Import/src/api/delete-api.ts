/**
 * Delete API — removes a custom line (or a whole custom section) from the
 * staged (imported) financial evaluation. Both cases go through one endpoint,
 * distinguished by which id the body carries.
 *
 *   DELETE {base}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
 *   Body:  { "finEvalLineStgId": 20527 }      // delete one line
 *      or  { "finEvalSectionStgId": 20518 }   // delete a section and its lines
 *
 * The ids are the staging ids from the finEvaluationStaging GET — staging-api
 * places them in each row's `fin_eval_line_id` / `fin_eval_section_id` slot —
 * so only rows the server already knows about can be deleted this way.
 */

import { deleteItems } from "@/lib/axios";
import { getAppConfig } from "@/config/app-config";
import { finEvaluationStagingPutPath } from "@/api/staging-api";

/**
 * DELETE path for one staged file — the same URL the Validate PUT uses
 * (`/GIS/proposalAuthoring/finEvaluationStaging/{file_id}`), only the HTTP
 * method and body differ. Delegates to the PUT path builder so the two can
 * never drift apart.
 */
export const finEvaluationStagingDeletePath = finEvaluationStagingPutPath;

/** Exactly one id is sent — whichever the caller is targeting. */
export type DeleteFinEvalBody =
  { finEvalLineStgId: number } | { finEvalSectionStgId: number };

const sendDelete = async (
  body: DeleteFinEvalBody,
  options: { fileId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => {
  const fileId = options.fileId ?? getAppConfig().file_id;
  if (fileId == null) {
    throw new Error("No file id — cannot delete from the staged evaluation.");
  }
  await deleteItems(
    finEvaluationStagingDeletePath(fileId),
    body,
    options.signal,
  );
};

/** Delete a single line item by its staging line id. */
export const deleteFinEvalLine = async (
  lineId: number,
  options: { fileId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => sendDelete({ finEvalLineStgId: lineId }, options);

/** Delete an entire section and all its lines, by its staging section id. */
export const deleteFinEvalSection = async (
  sectionId: number,
  options: { fileId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => sendDelete({ finEvalSectionStgId: sectionId }, options);
