/**
 * SaveModelContext
 * ----------------
 * Connects the header's "Save Model" button to the save logic that lives in
 * <FinancialEvaluation>. The two are siblings under <App>, so they share no
 * state — this context is the wire between them.
 *
 * Direction of flow:
 *   FinancialEvaluation  --registerSave(fn)--> context --requestSave()--> Header
 *   FinancialEvaluation  --publishStatus()-->  context --status-->        Header
 *
 * The handler is held in a ref rather than state: re-registering it on every
 * render of FinancialEvaluation (its closure changes whenever an edited cell
 * changes) must not re-render the header.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** What the header needs to know to render the button. */
export interface SaveModelStatus {
  saving: boolean;
  /** Human-readable failure message, or null. */
  error: string | null;
  /** True after a save succeeds, until the next attempt. */
  saved: boolean;
  /** False until a screen has registered a handler — button stays disabled. */
  ready: boolean;
  /**
   * View-only mode, published by the owning screen so the header's Save button
   * uses the SAME rule as the grid (host flag OR frozen proposal status)
   * rather than re-deriving a weaker one of its own.
   */
  readonly: boolean;
}

export interface SaveModelContextValue extends SaveModelStatus {
  /** Called by the header; runs whatever handler was registered. */
  requestSave: () => void;
  /** Called by the owning screen to supply the handler. Never triggers a render. */
  registerSave: (handler: (() => void) | null) => void;
  /**
   * Called by the owning screen whenever its save state changes. MUST be called
   * from an effect with a dependency array — it sets state.
   */
  publishStatus: (status: SaveModelStatus) => void;
}

const SaveModelContext = createContext<SaveModelContextValue | null>(null);

const IDLE: SaveModelStatus = {
  saving: false,
  error: null,
  saved: false,
  ready: false,
  readonly: false,
};

export function SaveModelProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<SaveModelStatus>(IDLE);

  /**
   * Registration touches the ref ONLY — never state. The owning screen
   * re-registers on every render (the handler closes over the current edits),
   * so a setState here would re-render the provider, which re-renders the
   * screen, which re-registers… i.e. an infinite update loop. `ready` is
   * reported through `publishStatus` instead, where it has a dependency array.
   */
  const registerSave = useCallback((handler: (() => void) | null) => {
    handlerRef.current = handler;
  }, []);

  const publishStatus = useCallback((next: SaveModelStatus) => {
    setStatus((prev) =>
      prev.saving === next.saving &&
      prev.error === next.error &&
      prev.saved === next.saved &&
      prev.ready === next.ready &&
      prev.readonly === next.readonly
        ? prev
        : next,
    );
  }, []);

  const requestSave = useCallback(() => {
    handlerRef.current?.();
  }, []);

  const value = useMemo<SaveModelContextValue>(
    () => ({ ...status, requestSave, registerSave, publishStatus }),
    [status, requestSave, registerSave, publishStatus],
  );

  return (
    <SaveModelContext.Provider value={value}>
      {children}
    </SaveModelContext.Provider>
  );
}

/** Access the app-wide "Save Model" wiring. */
export function useSaveModel(): SaveModelContextValue {
  const ctx = useContext(SaveModelContext);
  if (!ctx) {
    throw new Error("useSaveModel must be used within a <SaveModelProvider>");
  }
  return ctx;
}
