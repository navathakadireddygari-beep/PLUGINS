/**
 * DateFormatContext
 * -----------------
 * The single source of truth for the app-wide date display format. Any control
 * (the Date Format toolbar) reads/writes the SAME state, and any renderer
 * (headers, tables, grid cells, previews, cards) formats through the memoized
 * helper exposed here — so switching the format updates every displayed date
 * consistently.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  formatDate as formatDatePure,
  loadDateFormat,
  saveDateFormat,
  type DateFormatId,
} from "@/lib/date-helper";

export interface DateFormatContextValue {
  dateFormat: DateFormatId;
  setDateFormat: (f: DateFormatId) => void;
  /** date value -> display string, bound to the active format. */
  formatDate: (value: Date | string | number | null | undefined) => string;
}

const DateFormatContext = createContext<DateFormatContextValue | null>(null);

export function DateFormatProvider({ children }: { children: ReactNode }) {
  // Restored from localStorage and written back on change, as the reference
  // project does (shared key "fin_eval_date_format").
  const [dateFormat, setDateFormatState] = useState<DateFormatId>(() =>
    loadDateFormat(),
  );

  const setDateFormat = useCallback((f: DateFormatId) => {
    setDateFormatState(f);
    saveDateFormat(f);
  }, []);

  const value = useMemo<DateFormatContextValue>(
    () => ({
      dateFormat,
      setDateFormat,
      formatDate: (v) => formatDatePure(v, dateFormat),
    }),
    [dateFormat, setDateFormat],
  );

  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
}

/** Access the app-wide date format state + formatter. */
export function useDateFormat(): DateFormatContextValue {
  const ctx = useContext(DateFormatContext);
  if (!ctx) {
    throw new Error("useDateFormat must be used within a <DateFormatProvider>");
  }
  return ctx;
}
