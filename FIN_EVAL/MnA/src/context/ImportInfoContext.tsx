/**
 * Last-imported financial-model file, shared from <Table> (which owns the GET)
 * to <Header> (which shows the "Financial model source" bar). Renders no markup.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface ImportInfo {
  /** `last_imported_file_name`; null when none was imported. */
  fileName: string | null;
  /** `last_imported_date` (ISO); null when none was imported. */
  importedAt: string | null;
}

interface ImportInfoContextValue extends ImportInfo {
  setImportInfo: (info: ImportInfo) => void;
}

const ImportInfoContext = createContext<ImportInfoContextValue | null>(null);

export function ImportInfoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<ImportInfo>({ fileName: null, importedAt: null });
  const value = useMemo<ImportInfoContextValue>(() => ({ ...info, setImportInfo: setInfo }), [info]);
  return <ImportInfoContext.Provider value={value}>{children}</ImportInfoContext.Provider>;
}

export function useImportInfo(): ImportInfoContextValue {
  const ctx = useContext(ImportInfoContext);
  if (!ctx) throw new Error("useImportInfo must be used within an <ImportInfoProvider>");
  return ctx;
}
