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

/**
 * Envelope published on the host's `window.AppBridge` — the same bus the other
 * FinEval plugins use to talk to sibling plugins such as the chatbot.
 */
interface BridgeMessage {
  type: string;
  source?: string;
  target?: string;
  action?: string;
  payload?: unknown;
}

type BridgeUnsubscribe = () => void;

interface AppBridgeApi {
  publish: (msg: BridgeMessage) => void;
  subscribe: (id: string, fn: (msg: BridgeMessage) => void) => BridgeUnsubscribe;
}

declare global {
  interface Window {
    AppBridge?: AppBridgeApi;
  }
}

const getBridge = (): AppBridgeApi | undefined =>
  typeof window === "undefined" ? undefined : window.AppBridge;

/** Publish on the AppBridge. Silent no-op without a host bridge (standalone / dev). */
export const publishToBridge = (msg: BridgeMessage): void => {
  getBridge()?.publish(msg);
};

const READY_POLL_INTERVAL_MS = 100;
const READY_POLL_MAX_TRIES = 50;

/**
 * Run `attach` once the host's bridge exists — it may be injected after the
 * widget mounts, so poll briefly (5s), as Product Development does. Returns a
 * cancel function.
 */
const whenBridgeReady = (attach: (bridge: AppBridgeApi) => void): (() => void) => {
  let cancelled = false;
  let tries = 0;
  const tick = () => {
    if (cancelled) return;
    const bridge = getBridge();
    if (bridge) {
      attach(bridge);
      return;
    }
    if (++tries < READY_POLL_MAX_TRIES) setTimeout(tick, READY_POLL_INTERVAL_MS);
  };
  tick();
  return () => {
    cancelled = true;
  };
};

/** Subscriber id other plugins target for this widget's own commands. */
export const FIN_EVAL_SUBSCRIBER_ID = "fin-eval";

/**
 * Subscribe to every PLUGIN_MSG targeted at `myId`, whatever the action.
 * Returns the unsubscribe function, so it can go straight back from a
 * `useEffect`. Silent no-op without a host bridge.
 *
 * Commands handled by the grid (same contract as Product Development):
 *   fin-eval:refresh              — re-fetch the evaluation
 *   fin-eval:save                 — trigger Save programmatically
 *   fin-eval:scroll-to-section    — re-fetch and scroll to a section by type
 *   tool:refresh_financial_evaluation (target "editor") — chatbot refresh
 */
export const subscribeAllActions = (
  myId: string,
  handler: (env: BridgeMessage) => void,
): BridgeUnsubscribe => {
  let unsubscribe: BridgeUnsubscribe | null = null;
  const cancelWait = whenBridgeReady((bridge) => {
    unsubscribe = bridge.subscribe(myId, (env) => {
      if (env.type !== "PLUGIN_MSG") return;
      handler(env);
    });
  });
  return () => {
    cancelWait();
    unsubscribe?.();
    unsubscribe = null;
  };
};

/**
 * A save completed successfully. Tells the host page (`tool:fin_eval_saved`)
 * and the chatbot (`fin-eval:saved` over the AppBridge), as Product
 * Development does. M&A always saves with a PUT.
 */
export const emitSaved = (): void => {
  const proposalId = getProposalId();
  dispatch(HOST_EVENTS.saved, { proposalId });
  publishToBridge({
    type: "PLUGIN_MSG",
    source: "editor",
    target: "chatbot",
    action: "fin-eval:saved",
    payload: { proposalId, method: "PUT" },
  });
};

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
