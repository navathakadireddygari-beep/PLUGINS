/**
 * Plugin-specific AppBridge event declarations for the Sales Contracts /
 * Financial Evaluation editor.
 *
 * These augment the vendored `@/lib/app-bridge-events` maps via TypeScript
 * declaration merging — keeping the core wire-contract file untouched while
 * letting `publishAction` / `subscribeAction` type-check our own actions.
 *
 * The module specifier below is relative to THIS file
 * (`src/types/app-bridge-events.d.ts`), so `../lib/app-bridge-events`
 * resolves to `src/lib/app-bridge-events.ts` — the same module the runtime
 * helpers import, which is what makes the merge take effect.
 */
import "../lib/app-bridge-events"

declare module "../lib/app-bridge-events" {
  interface ActionMap {
    /** Re-fetch all data, or a single section when `sectionId` is supplied. */
    "fin-eval:refresh": { sectionId?: string | number | null }
    /** Trigger a programmatic save of the current editor state. */
    "fin-eval:save": { proposalId?: string | number | null }
    /** Scroll the editor to a section identified by its section type. */
    "fin-eval:scroll-to-section": { sectionType: string }
    /** Outbound: published to the chatbot after a successful save. */
    "fin-eval:saved": { proposalId: string | number | null; method: string }

    /**
     * Legacy action targeted at the "editor" id by the chatbot. Re-fetches
     * all data, or a single section when `sectionId` is supplied.
     */
    "tool:refresh_financial_evaluation": { sectionId?: string | number | null }
  }
}
