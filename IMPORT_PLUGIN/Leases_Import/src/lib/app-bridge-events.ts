/**
 * Typed event maps for AppBridge cross-plugin messaging.
 *
 * Single source of truth for every event flowing through `window.AppBridge`.
 * Lives in `@oneai/app-bridge` so chatbot, extensions, and the core shell all
 * agree on the wire contract without vendoring duplicate copies.
 *
 * Scope of this file
 * ──────────────────
 * Only **basic / standard** events live here:
 *   - `ActionMap`       — intentionally empty. No baseline cross-plugin
 *                         actions are blessed as "core" yet.
 *   - `ApexCommandMap`  — the standard APEX wiring commands that every
 *                         plugin can rely on (refresh region, set item,
 *                         submit page, navigate, execute process).
 *   - `StateMap`        — the standard `PAGE_CONTEXT` slot APEX always
 *                         publishes.
 *
 * Project-specific events (report refreshes, proposal sections, editor
 * UI commands, custom APEX commands, etc.) MUST NOT be added here. They
 * belong to the plugin that owns them and should be merged in via
 * declaration merging — see the example below.
 *
 * Extending these maps from a plugin
 * ──────────────────────────────────
 * These maps are declared as `interface` so they support TypeScript's
 * declaration-merging. A plugin adds its own actions / apex commands /
 * state slots without touching this package:
 *
 *   // my-plugin/src/types/app-bridge-events.d.ts
 *   import "@oneai/app-bridge"
 *   declare module "@oneai/app-bridge" {
 *     interface ActionMap {
 *       "my-plugin:do-thing": { id: string }
 *     }
 *     interface ApexCommandMap {
 *       MY_CUSTOM_CMD: { value: string }
 *     }
 *   }
 *
 * After that, `publishAction({ action: "my-plugin:do-thing", ... })` is
 * type-checked and autocompleted just like the built-ins.
 *
 * Stable subscriber ids — the `(string & {})` tail keeps autocomplete for
 * the listed values while still allowing any string id at the call site.
 */
export type SubscriberId = "chatbot" | "editor" | "data-grid" | "apex" | (string & {})

/**
 * Commands routed between sibling React plugins.
 * Envelope: { type: "PLUGIN_MSG", source, target, action, payload }
 *
 * Empty by default — extend per-plugin via declaration merging:
 *
 *   declare module "@oneai/app-bridge" {
 *     interface ActionMap {
 *       "my-plugin:do-thing": { id: string }
 *     }
 *   }
 */
export interface ActionMap {
  // Intentionally empty — see file header.
}

/**
 * Standard commands sent from React plugins to APEX page wiring.
 * Envelope: { type: "APEX_COMMAND", source, target: "apex", action, payload }
 * Handlers live in `apex/apex-page-wiring.js` → COMMAND_HANDLERS.
 *
 * Only the universal APEX primitives live here. Plugin-specific commands
 * should be added via declaration merging in the plugin that owns them.
 */
export interface ApexCommandMap {
  REFRESH_REGION: { regionId: string }
  SET_ITEM: { item: string; value: string | number | null }
  SUBMIT_PAGE: { request?: string }
  NAVIGATE:
    | { url: string }
    | {
        page: string | number
        appId?: string | number
        request?: string
        clearCache?: string
        itemNames?: string[]
        itemValues?: (string | number)[]
      }
  EXECUTE_PROCESS: {
    processName: string
    pageItems?: string | string[] | null
    x01?: string
    x02?: string
    x03?: string
    /** Optional: when APEX process finishes, publish this envelope back. */
    onDone?: { target: SubscriberId; action: keyof ActionMap }
  }
}

/**
 * Persistent state slots. Latest value per `type` is kept on the bridge
 * and replayed to every new subscriber synchronously on subscribe.
 * Envelope: { type: <state-type>, source, payload }
 */
export interface StateMap {
  PAGE_CONTEXT: {
    appId?: string | number
    pageId?: string | number
    sessionId?: string | number
    user?: string
    currentPageUrl?: string
    timestamp?: number
    [key: string]: unknown
  }
}
