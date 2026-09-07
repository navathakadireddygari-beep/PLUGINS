/**
 * Host-page messaging.
 *
 * The widget runs as a plugin region inside a much larger APEX page, so it
 * cannot call the host's code directly. Both sides talk through `CustomEvent`s
 * on `window`, exactly as the reference project does — same event names and
 * same `detail` shapes, so a page already wired for Product Development
 * understands this widget too.
 *
 * Outgoing: the host learns when the user changed a display setting, saved, or
 * deleted a line. Incoming: the host can ask the widget to re-fetch.
 */

import { getProposalId } from "@/config/app-config";
import { scaleMeta, type ScaleId } from "@/config/formats";

/** Events the widget dispatches at the host page. */
export const HOST_EVENTS = {
  scaleChanged: "tool:fin_eval_scale_changed",
  currencyChanged: "tool:fin_eval_currency_changed",
  saved: "tool:fin_eval_saved",
  deleted: "tool:fin_eval_deleted",
} as const;

/** Event the host page dispatches at the widget to force a reload. */
export const HOST_REFRESH_EVENT = "tool:refresh_financial_evaluation";

const dispatch = (name: string, detail: Record<string, unknown>): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

/**
 * The scale toggle moved.
 *
 * `scale` is the NUMERIC factor (1 / 1,000 / 1,000,000), not the letter — the
 * reference dispatches `{ scale, denomination, label, proposalId }` from
 * `handleScaleChange(scale: number)`, where `scale` is the value out of its
 * SCALES table. Sending the letter here instead meant a host wired for Product
 * Development received a string where it expected a number, and any lookup
 * keyed on it (`apex.region(...)` among them) resolved to nothing.
 *
 * `denomination` and `label` carry the letter, exactly as the reference sends
 * them, so a host reading either still works.
 */
export const emitScaleChanged = (denomination: ScaleId): void =>
  dispatch(HOST_EVENTS.scaleChanged, {
    scale: scaleMeta(denomination).divisor,
    denomination,
    label: denomination,
    proposalId: getProposalId(),
  });

/** The display currency toggle moved. */
export const emitCurrencyChanged = (currency: string): void =>
  dispatch(HOST_EVENTS.currencyChanged, {
    currency,
    proposalId: getProposalId(),
  });

/** A save completed successfully. */
export const emitSaved = (): void =>
  dispatch(HOST_EVENTS.saved, { proposalId: getProposalId() });

/** A line was deleted successfully. */
export const emitDeleted = (): void =>
  dispatch(HOST_EVENTS.deleted, { proposalId: getProposalId() });

/**
 * Subscribe to the host's refresh request. Returns the unsubscribe function,
 * so callers can hand it straight back from a `useEffect`.
 */
export const onHostRefresh = (handler: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const listener = () => handler();
  window.addEventListener(HOST_REFRESH_EVENT, listener);
  return () => window.removeEventListener(HOST_REFRESH_EVENT, listener);
};
