/**
 * Fin-eval pivot table bridge event extensions.
 * Extends the base ActionMap via TypeScript declaration merging.
 *
 * Inbound  (other plugins → fin-eval):
 *   fin-eval:refresh              — re-fetch all data (or a single section)
 *   fin-eval:save                 — trigger Save Draft programmatically
 *   fin-eval:scroll-to-section    — scroll to a section by type or id
 *
 * Outbound (fin-eval → other plugins):
 *   fin-eval:loaded               — data finished loading
 *   fin-eval:saved                — save completed successfully
 */
import "../lib/app-bridge-events"

declare module "../lib/app-bridge-events" {
  interface ActionMap {
    "fin-eval:refresh":           { sectionId?: string | number | null }
    "fin-eval:save":              Record<string, never>
    "fin-eval:scroll-to-section": { sectionType: string }
    "fin-eval:loaded":            { proposalId?: string | number | null }
    "fin-eval:saved":             { proposalId?: string | number | null; method: "POST" | "PUT" }
  }
}
