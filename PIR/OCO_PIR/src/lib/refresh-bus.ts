/**
 * Global "server data changed" bus.
 *
 * Every write call (POST / PUT / DELETE) in src/api calls `notifyDataChanged()`
 * once the server has accepted it. Components read `useRefreshToken()` and put
 * that token in the dependency array of their load effects, so a single write
 * re-reads *every* API on screen — KPIs, snapshots, the Forecast vs Actuals
 * report, unmapped transactions, adjustments and the actuals drilldown — rather
 * than only the endpoint that was written to.
 *
 * Scoped refreshes: a write can optionally target only specific named regions
 * (e.g. `notifyDataChanged("POST adjustments", ["kpi", "snapshots"])`), so a
 * change that only affects the KPI tiles and snapshot cards doesn't also
 * re-fetch the drilldown, unmapped transactions, etc. Calls made with no scope
 * (the default) still refresh every region, scoped or not — that's what keeps
 * every write site that hasn't been given a scope working exactly as before.
 *
 * Notifications are coalesced on a short timer: `saveAll` posts one adjustment
 * per fiscal year in a loop, and without coalescing each POST would kick off a
 * full round of re-fetches mid-loop.
 */
import { useSyncExternalStore } from "react";

type Listener = () => void;

const COALESCE_MS = 150;

const listeners = new Set<Listener>();

// Unscoped writes bump this — every consumer (scoped or not) reacts to it.
let globalVersion = 0;
// Scoped writes bump only the named scope's counter — only consumers that ask
// for that scope react to it.
const scopeVersions = new Map<string, number>();

let pendingIsGlobal = false;
let pendingScopes = new Set<string>();
let pending: ReturnType<typeof setTimeout> | undefined;

const flush = (): void => {
  pending = undefined;
  if (pendingIsGlobal) {
    globalVersion += 1;
    console.log(`[Refresh] re-reading all APIs (v${globalVersion})`);
  } else {
    for (const scope of pendingScopes) {
      scopeVersions.set(scope, (scopeVersions.get(scope) ?? 0) + 1);
    }
    console.log(`[Refresh] re-reading scoped APIs: ${[...pendingScopes].join(", ")}`);
  }
  pendingIsGlobal = false;
  pendingScopes = new Set();
  for (const listener of [...listeners]) listener();
};

/**
 * Signal that a write succeeded. `source` is only used for the console log so a
 * refresh can be traced back to the call that triggered it. `scopes`, when
 * given, limits the refresh to those named regions instead of everything.
 */
export function notifyDataChanged(source?: string, scopes?: string[]): void {
  if (source) {
    console.log(`[Refresh] data changed by ${source}${scopes ? ` (scope: ${scopes.join(", ")})` : ""}`);
  }
  if (!scopes || scopes.length === 0) {
    pendingIsGlobal = true; // a global write always wins over any scoped ones queued alongside it
  } else if (!pendingIsGlobal) {
    for (const scope of scopes) pendingScopes.add(scope);
  }
  clearTimeout(pending);
  pending = setTimeout(flush, COALESCE_MS);
}

/** Subscribe to refresh signals. Returns the unsubscribe fn. */
export function subscribeToRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Current token for `scope` (or the global token when omitted) — changes
 * whenever a matching write is coalesced. Scoped tokens also change on every
 * unscoped (global) write, so a scope only opts into *fewer* refreshes, never
 * into missing the ones every other region still gets.
 */
export function getRefreshVersion(scope?: string): number {
  return scope ? globalVersion + (scopeVersions.get(scope) ?? 0) : globalVersion;
}

/**
 * React hook: returns a number that changes after every successful write
 * (or, when `scope` is given, after every write scoped to it or unscoped).
 * Add it to a load effect's dependency array to make that load re-run.
 */
export function useRefreshToken(scope?: string): number {
  const getSnapshot = (): number => getRefreshVersion(scope);
  return useSyncExternalStore(subscribeToRefresh, getSnapshot, getSnapshot);
}
