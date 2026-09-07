/**
 * Typed event maps for AppBridge cross-plugin messaging.
 * Copied verbatim from the shared package — do not edit project-specific
 * events here. Extend via declaration merging in src/types/.
 */
export type SubscriberId = "chatbot" | "editor" | "data-grid" | "apex" | (string & {})

export interface ActionMap {
  // Intentionally empty — extended per-plugin via declaration merging.
}

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
    onDone?: { target: SubscriberId; action: keyof ActionMap }
  }
}

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
