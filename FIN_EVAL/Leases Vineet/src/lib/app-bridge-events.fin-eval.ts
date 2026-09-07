/**
 * Financial Evaluation plugin's own AppBridge action contract.
 *
 * Extends the shared `ActionMap` (see `./app-bridge-events`) via TypeScript
 * declaration merging, per that file's documented extension pattern. Import
 * this file once (for its type side effects) wherever `publishAction` /
 * `subscribeAction` are used with these actions — see `Table.tsx`.
 *
 * Subscriber id for this plugin: "fin-eval".
 *
 *   - Outgoing notifications (saved/deleted/currency/scale/date/number
 *     changed) are published with `target: "apex"` — the host page is the
 *     conventional recipient for "something changed" notifications.
 *   - "tool:refresh_financial_evaluation" is incoming — other plugins or
 *     the host page ask this widget to reload by targeting "fin-eval".
 */
import type { ScaleKey, NumberFormatKey, DateFormatKey } from "./format"

declare module "./app-bridge-events" {
  interface ActionMap {
    "tool:fin_eval_saved": { proposalId: number | null }
    "tool:fin_eval_deleted": { proposalId: number | null }
    "tool:fin_eval_currency_changed": { currency: string; proposalId: number | null }
    "tool:fin_eval_scale_changed": { scale: ScaleKey; proposalId: number | null }
    "tool:fin_eval_date_format_changed": { dateFormat: DateFormatKey; proposalId: number | null }
    "tool:fin_eval_number_format_changed": { numberFormat: NumberFormatKey; proposalId: number | null }
    "tool:refresh_financial_evaluation": { sectionId: string | number | null }
  }
}

export const FIN_EVAL_SUBSCRIBER_ID = "fin-eval"
