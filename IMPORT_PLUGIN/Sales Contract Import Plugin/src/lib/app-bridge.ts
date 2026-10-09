/**
 * Typed wrapper around the global `window.AppBridge` v3 runtime that
 * the host APEX page exposes via `app-bridge.js`.
 *
 * Degrades to silent no-ops when running without a host bridge (standalone / dev).
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
const READY_POLL_MAX_TRIES   = 50

function getBridge(): AppBridgeApi | undefined {
  return window.AppBridge
}

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
    return () => { cancelled = true }
  }

  let tries = 0
  const tick = () => {
    if (cancelled || done) return
    const bridge = getBridge()
    if (bridge) { run(bridge); return }
    if (++tries < READY_POLL_MAX_TRIES) setTimeout(tick, READY_POLL_INTERVAL_MS)
  }
  tick()

  return () => { cancelled = true }
}

// ── Primitives ──────────────────────────────────────────────────────────────

export function subscribeWhenReady(
  handler: (msg: BridgeMessage) => void,
): BridgeUnsubscribe {
  let unsubscribe: BridgeUnsubscribe | null = null
  const cancelWait = whenBridgeReady((bridge) => {
    unsubscribe = bridge.subscribe(handler)
    try { const snap = bridge.getSnapshot?.(); if (snap) handler(snap) } catch { /* optional */ }
  })
  return () => { cancelWait(); unsubscribe?.(); unsubscribe = null }
}

export function getBridgeSnapshot(type?: string): BridgeMessage | null {
  return getBridge()?.getSnapshot(type) ?? null
}

export function publishToBridge(msg: BridgeMessage): void {
  getBridge()?.publish(msg)
}

// ── Typed: cross-plugin commands (PLUGIN_MSG) ────────────────────────────────

export function publishAction<K extends keyof ActionMap>(args: {
  source: SubscriberId
  target: SubscriberId
  action: K
  payload: ActionMap[K]
}): void {
  console.log(`[${args.source}] emit PLUGIN_MSG →${args.target} action=${String(args.action)}`, args.payload)
  publishToBridge({ type: "PLUGIN_MSG", source: args.source, target: args.target, action: args.action as string, payload: args.payload })
}

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
  return () => { cancelWait(); unsubscribe?.(); unsubscribe = null }
}

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
  return () => { cancelWait(); unsubscribe?.(); unsubscribe = null }
}

// ── Typed: React → APEX commands (APEX_COMMAND) ──────────────────────────────

export function publishApexCommand<K extends keyof ApexCommandMap>(
  action: K,
  payload: ApexCommandMap[K],
  source: SubscriberId = "fin-eval",
): void {
  console.log(`[${source}] emit APEX_COMMAND action=${String(action)}`, payload)
  publishToBridge({ type: "APEX_COMMAND", source, target: "apex", action: action as string, payload })
}

// ── Typed: persistent state (PAGE_CONTEXT etc.) ──────────────────────────────

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
  return () => { cancelWait(); unsubscribe?.(); unsubscribe = null }
}

export function getState<K extends keyof StateMap>(type: K): StateMap[K] | null {
  const snap = getBridge()?.getSnapshot(type as string)
  return (snap?.payload ?? null) as StateMap[K] | null
}

export function publishState<K extends keyof StateMap>(
  type: K,
  payload: StateMap[K],
  source: SubscriberId = "fin-eval",
): void {
  console.log(`[${source}] emit state type=${String(type)}`, payload)
  publishToBridge({ type: type as string, source, payload })
}
