/**
 * Typed wrapper around the global `window.AppBridge` v3 runtime that
 * the host APEX page exposes via `app-bridge.js`.
 *
 * The bridge is the single communication backbone between APEX and
 * every React plugin running in the page (and between React plugins
 * themselves). It outlives React mount/unmount cycles, so we treat it
 * as an external store: subscribe on mount, unsubscribe on unmount,
 * and rely on AppBridge's snapshot replay + targeted queue for any
 * race that happens during APEX partial page swaps.
 *
 * If the host page doesn't publish `window.AppBridge` (e.g. running in
 * the standalone test-host harness), every helper here degrades to a
 * silent no-op so the widget still boots.
 *
 * Three message kinds, one envelope shape:
 *   - PAGE_CONTEXT  → state, latest-value, replayed
 *   - PLUGIN_MSG    → command between sibling plugins, queued by target
 *   - APEX_COMMAND  → command from a plugin to APEX wiring, queued
 *
 * Typed contract lives in `./app-bridge-events.ts` (ActionMap,
 * ApexCommandMap, StateMap, SubscriberId). Plugins can extend those
 * maps via TypeScript declaration merging — see that file for examples.
 */
import type {
  ActionMap,
  ApexCommandMap,
  StateMap,
  SubscriberId,
} from "./app-bridge-events"

export interface BridgeMessage<TPayload = unknown> {
  type: string
  payload?: TPayload
  source?: string
  target?: string
  action?: string
  version?: number
  __ts?: number
  __from?: string
  [key: string]: unknown
}

export type BridgeUnsubscribe = () => void

export interface AppBridgeApi {
  publish: (msg: BridgeMessage) => void
  /**
   * v3 signature: `subscribe(id, fn)` — `id` controls which queued
   * envelopes get drained for this subscriber.
   *
   * v1 signature: `subscribe(fn)` — still works, registered under
   * the reserved "__broadcast__" id (sees everything, drains only
   * untargeted envelopes).
   */
  subscribe: {
    (id: string, fn: (msg: BridgeMessage) => void): BridgeUnsubscribe
    (fn: (msg: BridgeMessage) => void): BridgeUnsubscribe
  }
  getSnapshot: (type?: string) => BridgeMessage | null
  inspect?: () => unknown
  __sealed?: boolean
}

declare global {
  interface Window {
    AppBridge?: AppBridgeApi
  }
}

const READY_POLL_INTERVAL_MS = 100
const READY_POLL_MAX_TRIES = 50

// ───── Low-level helpers (used by everything below) ────────────────────

function getBridge(): AppBridgeApi | undefined {
  return window.AppBridge
}

/**
 * Wait for `window.AppBridge` to exist, then call `attach(bridge)` once.
 * Returns a cleanup function that cancels the pending wait if no bridge
 * has appeared yet.
 */
function whenBridgeReady(attach: (bridge: AppBridgeApi) => void): () => void {
  let cancelled = false
  let done = false

  const run = (bridge: AppBridgeApi) => {
    if (cancelled || done) return
    done = true
    attach(bridge)
  }

  const existing = getBridge()
  if (existing) {
    run(existing)
    return () => {
      cancelled = true
    }
  }

  let tries = 0
  const tick = () => {
    if (cancelled || done) return
    const bridge = getBridge()
    if (bridge) {
      run(bridge)
      return
    }
    if (++tries < READY_POLL_MAX_TRIES) {
      setTimeout(tick, READY_POLL_INTERVAL_MS)
    }
  }
  tick()

  return () => {
    cancelled = true
  }
}

// ───── Backwards-compatible primitives ─────────────────────────────────

/**
 * Subscribe to every envelope published through the bridge. Uses the
 * legacy `subscribe(fn)` signature — registered as a broadcast
 * subscriber that sees all state replays and all untargeted commands.
 *
 * Prefer the typed helpers (`subscribeAction`, `subscribeState`) for
 * new code.
 */
export function subscribeWhenReady(
  handler: (msg: BridgeMessage) => void,
): BridgeUnsubscribe {
  let unsubscribe: BridgeUnsubscribe | null = null

  const cancelWait = whenBridgeReady((bridge) => {
    unsubscribe = bridge.subscribe(handler)
    // v3 replays state on subscribe, so no manual getSnapshot needed —
    // but read it once for robustness against any v1 bridge variant.
    try {
      const snap = bridge.getSnapshot?.()
      if (snap) handler(snap)
    } catch {
      // optional / may not exist
    }
  })

  return () => {
    cancelWait()
    unsubscribe?.()
    unsubscribe = null
  }
}

/** Read the latest snapshot synchronously (defaults to `PAGE_CONTEXT`). */
export function getBridgeSnapshot(type?: string): BridgeMessage | null {
  return getBridge()?.getSnapshot(type) ?? null
}

/** Publish a raw envelope through the bridge. Silent no-op without bridge. */
export function publishToBridge(msg: BridgeMessage): void {
  getBridge()?.publish(msg)
}

// ───── Typed: cross-plugin commands (PLUGIN_MSG) ───────────────────────

/**
 * Publish a typed command targeted at another plugin. If no subscriber
 * with that `target` id is attached, the envelope is queued and drained
 * when the target eventually subscribes.
 *
 * @example
 *   publishAction({
 *     source: "chatbot",
 *     target: "editor",
 *     action: "tool:refresh_proposal_section",
 *     payload: { sectionId: "42" },
 *   })
 */
export function publishAction<K extends keyof ActionMap>(args: {
  source: SubscriberId
  target: SubscriberId
  action: K
  payload: ActionMap[K]
}): void {
  console.log(
    `[${args.source}] emit PLUGIN_MSG →${args.target} action=${String(args.action)}`,
    args.payload,
  )
  publishToBridge({
    type: "PLUGIN_MSG",
    source: args.source,
    target: args.target,
    action: args.action as string,
    payload: args.payload,
  })
}

/**
 * Subscribe to one action targeted at this plugin id. Returns an
 * unsubscribe function — safe to use directly in a React `useEffect`.
 *
 * If you need DOM access (scroll, focus) inside the handler, gate the
 * `useEffect` on your data-loaded flag so the queue holds the command
 * until you are truly ready.
 */
export function subscribeAction<K extends keyof ActionMap>(
  myId: SubscriberId,
  action: K,
  handler: (payload: ActionMap[K], envelope: BridgeMessage) => void,
): BridgeUnsubscribe {
  let unsubscribe: BridgeUnsubscribe | null = null

  const cancelWait = whenBridgeReady((bridge) => {
    unsubscribe = bridge.subscribe(myId, (env) => {
      if (env.type !== "PLUGIN_MSG") return
      if (env.action !== action) return
      handler(env.payload as ActionMap[K], env)
    })
  })

  return () => {
    cancelWait()
    unsubscribe?.()
    unsubscribe = null
  }
}

/**
 * Subscribe to every PLUGIN_MSG targeted at this id, regardless of
 * action. Useful when one component handles many actions via a switch.
 */
export function subscribeAllActions(
  myId: SubscriberId,
  handler: (env: BridgeMessage & { action: keyof ActionMap; payload: unknown }) => void,
): BridgeUnsubscribe {
  let unsubscribe: BridgeUnsubscribe | null = null

  const cancelWait = whenBridgeReady((bridge) => {
    unsubscribe = bridge.subscribe(myId, (env) => {
      if (env.type !== "PLUGIN_MSG") return
      handler(env as BridgeMessage & { action: keyof ActionMap; payload: unknown })
    })
  })

  return () => {
    cancelWait()
    unsubscribe?.()
    unsubscribe = null
  }
}

// ───── Typed: React → APEX commands (APEX_COMMAND) ─────────────────────

/**
 * Publish a typed command for the APEX page wiring to execute.
 * Handlers are looked up in `apex/apex-page-wiring.js` →
 * COMMAND_HANDLERS. Queued if APEX hasn't subscribed yet.
 *
 * @example
 *   publishApexCommand("REFRESH_REGION", { regionId: "orders_ir" })
 *   publishApexCommand("SET_ITEM",       { item: "P10_CUSTOMER_ID", value: 7 })
 *   publishApexCommand("SUBMIT_PAGE",    { request: "SAVE" })
 */
export function publishApexCommand<K extends keyof ApexCommandMap>(
  action: K,
  payload: ApexCommandMap[K],
  source: SubscriberId = "chatbot",
): void {
  //console.log(`[${source}] emit APEX_COMMAND action=${String(action)}`, payload)
  publishToBridge({
    type: "APEX_COMMAND",
    source,
    target: "apex",
    action: action as string,
    payload,
  })
}

// ───── Typed: persistent state (PAGE_CONTEXT etc.) ─────────────────────

/**
 * Subscribe to state updates of a specific type. The current snapshot
 * is replayed synchronously on subscribe (so the handler always fires
 * at least once if state has ever been published).
 */
export function subscribeState<K extends keyof StateMap>(
  myId: SubscriberId,
  type: K,
  handler: (payload: StateMap[K], envelope: BridgeMessage) => void,
): BridgeUnsubscribe {
  let unsubscribe: BridgeUnsubscribe | null = null

  const cancelWait = whenBridgeReady((bridge) => {
    unsubscribe = bridge.subscribe(myId, (env) => {
      if (env.type !== type) return
      handler(env.payload as StateMap[K], env)
    })
  })

  return () => {
    cancelWait()
    unsubscribe?.()
    unsubscribe = null
  }
}

/** Read the latest state snapshot for a given type synchronously. */
export function getState<K extends keyof StateMap>(type: K): StateMap[K] | null {
  const snap = getBridge()?.getSnapshot(type as string)
  return (snap?.payload ?? null) as StateMap[K] | null
}

/**
 * Publish a state snapshot. Usually called only by APEX page wiring,
 * but exposed here for plugins that legitimately own a state slot.
 */
export function publishState<K extends keyof StateMap>(
  type: K,
  payload: StateMap[K],
  source: SubscriberId = "chatbot",
): void {
  console.log(`[${source}] emit state type=${String(type)}`, payload)
  publishToBridge({ type: type as string, source, payload })
}
