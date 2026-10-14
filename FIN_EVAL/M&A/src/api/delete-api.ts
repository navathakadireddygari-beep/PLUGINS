/**
 * Delete API — removes a line (or a whole section) from the financial
 * evaluation. Ported from the reference project's src/api/delete-api.ts, which
 * routes both cases through one endpoint and distinguishes them by which id the
 * body carries.
 *
 *   DELETE {base}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation
 *   Body:  { "fin_eval_line_id": 5563 }      // delete one line
 *      or  { "fin_eval_section_id": 5401 }   // delete a section and its lines
 *
 * The ids come from the GET response — `fin_eval_line_id` on each line and
 * `fin_eval_section_id` on each section — so only rows the server already knows
 * about can be deleted this way.
 */

import { deleteItems } from "@/lib/axios";
import { getAppConfig } from "@/config/app-config";
import { financialEvaluationSavePath } from "@/api/financial-api";

/**
 * DELETE path for one proposal's evaluation — the same URL the PUT uses
 * (`/GIS/proposalAuthoring/{proposal_id}/financialEvaluation`), only the HTTP
 * method and body differ. Deliberately delegates to the save path builder so
 * the two can never drift apart.
 */
export const financialEvaluationDeletePath = financialEvaluationSavePath;

/** Exactly one id is sent — whichever the caller is targeting. */
export type DeleteFinEvalBody =
  { fin_eval_line_id: number } | { fin_eval_section_id: number };

const sendDelete = async (
  body: DeleteFinEvalBody,
  options: { proposalId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => {
  const proposalId = options.proposalId ?? getAppConfig().proposal_id;
  if (!proposalId) {
    throw new Error("No proposal id — cannot delete from the evaluation.");
  }
  await deleteItems(
    financialEvaluationDeletePath(proposalId),
    body,
    options.signal,
  );
};

/** Delete a single line item by its `fin_eval_line_id`. */
export const deleteFinEvalLine = async (
  lineId: number,
  options: { proposalId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => sendDelete({ fin_eval_line_id: lineId }, options);

/** Delete an entire section and all its lines, by `fin_eval_section_id`. */
export const deleteFinEvalSection = async (
  sectionId: number,
  options: { proposalId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => sendDelete({ fin_eval_section_id: sectionId }, options);
