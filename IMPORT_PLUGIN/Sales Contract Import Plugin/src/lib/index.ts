// ── AppBridge: cross-plugin / APEX messaging contract ─────────────────────
// Runtime helpers — typed wrappers over `window.AppBridge`.
export {
  subscribeWhenReady,
  getBridgeSnapshot,
  publishToBridge,
  publishAction,
  subscribeAction,
  subscribeAllActions,
  publishApexCommand,
  subscribeState,
  getState,
  publishState,
} from "./app-bridge"
export type {
  BridgeMessage,
  BridgeUnsubscribe,
  AppBridgeApi,
} from "./app-bridge"

// Wire-contract types — declared as `interface` so consumers can extend
// `ActionMap`, `ApexCommandMap`, and `StateMap` via TS declaration merging:
//   declare module "@/lib/app-bridge-events" {
//     interface ActionMap { "my-plugin:do-thing": { id: string } }
//   }
export type { SubscriberId } from "./app-bridge-events"
export type {
  ActionMap,
  ApexCommandMap,
  StateMap,
} from "./app-bridge-events"
