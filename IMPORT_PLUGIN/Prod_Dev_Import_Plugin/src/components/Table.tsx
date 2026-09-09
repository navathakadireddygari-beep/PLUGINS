import React, { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, RefreshCw, Save, CheckCircle2 } from "lucide-react";
import { getAppConfig } from "../config/app-config";
import { subscribeAllActions, publishToBridge } from "../lib";
import type {} from "../types/fin-eval-bridge";
import {
  getFinEvaluationStaging,
  validateFinEvaluationStaging,
  migrateFinEvalStaging,
  clearCachedToken,
  isServerDrivenSection,
  getAccountCodes,
  type AccountCode,
  type ApiHeader,
  type Group,
  type PivotTableData,
  type ValidationIssue,
  type ValueRow,
  type YearValues,
} from "../api/financial-api";
import { deleteLine, deleteSection } from "../api/delete-api";
import { getExchangeRate } from "../api/currency-api";
import { NUMBER_FORMATS, formatNumberByStyle, formatGroupedTrimmed, decimalsForScale, type NumberFormatId } from "../lib/number-format";
import { DATE_FORMATS, type DateFormatId } from "../lib/date-helper";
import KpiPanel from "./KpiPanel";
import Toast, { type ToastState } from "./Toast";

const BRAND        = "#A5005A";
const DARK_HEADER  = "#2d3748";
const DARK_TOGGLE  = "#1e2433";

const CURRENCY_LABELS: Record<string, string> = {
  CAD: "$ CAD", USD: "$ USD", EUR: "€ EUR",
  GBP: "£ GBP", AUD: "A$ AUD", JPY: "¥ JPY",
  SGD: "$ SGD", INR: "₹ INR", CNY: "¥ CNY",
};
const currencyLabel = (code: string): string => CURRENCY_LABELS[code.toUpperCase()] ?? code;

const SCALES: { label: string; value: number }[] = [
  { label: "K", value: 1000   },
  { label: "M", value: 10000  },
  { label: "B", value: 100000 },
];

const toggleBtn = (active: boolean, first: boolean): React.CSSProperties => ({
  padding: "5px 14px", border: "none",
  borderLeft: first ? "none" : "1px solid #e5e7eb",
  cursor: "pointer", fontSize: 12, fontWeight: 700,
  background: active ? DARK_TOGGLE : "#fff",
  color:      active ? "#fff" : "#6b7280",
  transition: "background 0.15s, color 0.15s",
  whiteSpace: "nowrap",
});

const generateId  = (): string => `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/* ─────────────────────────── Searchable Account Code Select ─────── */
function AccountCodeSelect({
  value,
  options,
  onFocus,
  onChange,
}: {
  value:    string;
  options:  AccountCode[];
  onFocus:  () => void;
  onChange: (val: string) => void;
}): React.ReactElement {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((ac) => {
    const q = search.toLowerCase();
    return (
      ac.account_code.toLowerCase().includes(q) ||
      ac.account_name.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const label = value || "Select *";
  const hasValue = !!value;

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger button — matches existing select style exactly */}
      <div
        onClick={(e) => { e.stopPropagation(); onFocus(); setOpen((o) => !o); }}
        style={{
          width: "100%", border: "1px solid #d1d5db", borderRadius: 4,
          padding: "2px 24px 2px 6px", fontSize: 12,
          color: hasValue ? "#1f2937" : "#6b7280",
          background: "#fff", height: 28, cursor: "pointer",
          display: "flex", alignItems: "center",
          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
          boxSizing: "border-box", userSelect: "none", position: "relative",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: 10 }}>▼</span>
      </div>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: "100%", left: 0, zIndex: 9999,
            width: "100%", minWidth: 240,
            background: "#fff", border: "1px solid #d1d5db", borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", marginTop: 2,
          }}
        >
          {/* Search input */}
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #f0f0f0" }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account..."
              style={{
                width: "100%", fontSize: 12, padding: "4px 8px",
                border: "1px solid #d1d5db", borderRadius: 4,
                outline: "none", boxSizing: "border-box", color: "#1f2937",
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "8px 10px", fontSize: 12, color: "#9ca3af" }}>
                No results
              </div>
            ) : (
              filtered.map((ac) => {
                const optVal = `${ac.account_code} – ${ac.account_name}`;
                const selected = value === optVal;
                return (
                  <div
                    key={ac.account_code}
                    onMouseDown={() => { onChange(optVal); setOpen(false); setSearch(""); }}
                    style={{
                      padding: "6px 10px", fontSize: 12, cursor: "pointer",
                      background: selected ? "#ede9fe" : "#fff",
                      color: selected ? "#5b21b6" : "#1f2937",
                    }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "#fff"; }}
                  >
                    {ac.account_code} – {ac.account_name}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* API types, transformStagingData, and buildFinEvaluationStagingPutPayload live in src/api/financial-api.ts */

/* ─────────────────────────── Helpers ────────────────────────────── */
// Cell formatting to match Figma: thousands-separated, no currency symbol,
// em-dash for zero / empty. Parentheses for negatives.

const parseExcelValue = (raw: string): number => {
  const t = raw.trim();
  if (!t || t === "-") return 0;
  const neg = t.match(/^\(([0-9,]+\.?[0-9]*)\)$/);
  if (neg) return -parseFloat(neg[1].replace(/,/g, ""));
  return parseFloat(t.replace(/,/g, "")) || 0;
};

const parseCellInput = (raw: string): number => {
  const t = raw.trim().replace(/,/g, "");
  if (!t || t === "-") return 0;
  return parseFloat(t) || 0;
};

// Percentage cells (e.g. Tax Rate %) accept only 0–100 with up to 2 decimals.
// Returns false for anything that should be rejected as the user types:
// letters, negatives, > 100, or more than 2 decimal places.
const isValidPercentInput = (s: string): boolean => {
  if (s === "") return true;                     // allow clearing the field
  if (!/^\d{0,3}(\.\d{0,2})?$/.test(s)) return false;
  const n = Number(s);                           // "12." → 12, ".5" → 0.5
  return Number.isFinite(n) && n >= 0 && n <= 100;
};

// Safety net for paste / any value that slips past keystroke checks:
// force into [0, 100] at 2 decimal places.
const clampPercent = (n: number): number =>
  Math.min(100, Math.max(0, Math.round(n * 100) / 100));

const isNumericCell = (s: string): boolean => {
  const t = s.trim();
  if (!t || t === "-") return true;
  return /^-?\(?\d[\d,._]*\)?%?$/.test(t);
};

type ParsedRow = { name: string; values: number[] };

const tok = (s: string | undefined | null): string =>
  (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* Front-end subtotal / total recompute.
   For each section: calculated lines (isCalculated === "Y") get their year
   values set to the per-year sum of editable (isCalculated !== "Y") lines.
   Every line's rowTotal is set to the sum of its own year values.
   Server-driven sections (e.g. Cash Flow) are left untouched — their
   row values are owned by the backend and must not be overwritten by a
   local sum on cell edits. */
// Depreciation & Amortization is a calculated row that must keep whatever
// value the backend/user set for it — unlike Total Opex etc., it must NOT be
// overwritten with the running sum of the section's editable lines whenever
// a new line is added.
const isDepreciationAmortizationRow = (v: ValueRow): boolean => {
  const t = tok(v.name);
  return t === "DA" || t.includes("DEPRECIATION") || t.includes("AMORTIZATION");
};

const recomputeGroup = (g: Group, years: number[]): Group => {
  if (isServerDrivenSection(g)) {
    return g;
  }
  const editable    = g.values.filter((v) => v.isCalculated !== "Y");
  const nonOngoing  = editable.filter((v) => v.lineType !== "ONGOING_CAPEX");

  const yearSumsAll:        Record<number, number> = {};
  const yearSumsNonOngoing: Record<number, number> = {};
  years.forEach((y) => {
    yearSumsAll[y]        = editable.reduce((s, v) => s + (v.yearValues[y] || 0), 0);
    yearSumsNonOngoing[y] = nonOngoing.reduce((s, v) => s + (v.yearValues[y] || 0), 0);
  });

  return {
    ...g,
    values: g.values.map((v) => {
      if (v.isCalculated === "Y" && !isDepreciationAmortizationRow(v)) {
        // INITIAL_CAPEX = Total - Ongoing  (exclude ONGOING_CAPEX lines)
        // All other calculated rows (TOTAL_CAPEX etc.) = sum of all editable
        const sums = v.lineType === "INITIAL_CAPEX" ? yearSumsNonOngoing : yearSumsAll;
        const yv: YearValues = { ...v.yearValues };
        years.forEach((y) => { yv[y] = sums[y] || 0; });
        const rowTotal = years.reduce((s, y) => s + (yv[y] || 0), 0);
        return { ...v, yearValues: yv, rowTotal };
      }
      const rowTotal = years.reduce((s, y) => s + (v.yearValues[y] || 0), 0);
      return { ...v, rowTotal };
    }),
  };
};

const parseExcelPaste = (text: string): ParsedRow[] => {
  const lines = text.split(/\r?\n/).map((l: string) => l.trimEnd()).filter((l: string) => l.trim());
  if (!lines.length) return [];
  const rows: string[][] = lines.map((l: string) => l.split("\t"));
  const maxC = Math.max(...rows.map((r: string[]) => r.length));
  let startCol = 1;
  for (let c = 1; c < maxC; c++) {
    if (rows.every((r: string[]) => { const v = (r[c] ?? "").trim(); return !v || isNumericCell(v); })) { startCol = c; break; }
  }
  return rows.map((cols: string[]): ParsedRow => ({
    name:   cols[0]?.trim() || "New Line Item",
    values: cols.slice(startCol).map((c: string) => parseExcelValue(c)),
  }));
};

/* ─────────────────────────── Shared styles ──────────────────────── */
const TH = (extra: CSSProperties = {}): CSSProperties => ({
  padding: "6px 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
  color: "#374151", borderBottom: "1px solid #d1d5db", borderRight: "1px solid #d1d5db",
  background: "#f9fafb",
  ...extra,
});
const TD: CSSProperties = { borderBottom: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", height: 40 };

/* ─────────────────────────── Component ──────────────────────────── */
export default function PivotTableWithAPI(): React.ReactElement {

  const isReadonly = getAppConfig().is_readonly;

  const [data,        setData]        = useState<PivotTableData | null>(null);
  const [rawHeader,   setRawHeader]   = useState<ApiHeader | null>(null);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const [accountCodesBySection, setAccountCodesBySection] = useState<Record<string, AccountCode[]>>({});
  const [displayScale,  setDisplayScale]  = useState<number>(10000);
  const [numberFormat,  setNumberFormat]  = useState<NumberFormatId>("us");
  const [dateFormat,    setDateFormat]    = useState<DateFormatId>("dd-mm-yyyy");
  const [exchangeRate,  setExchangeRate]  = useState<number | null>(null);

  const [savingDraft,  setSavingDraft]  = useState<boolean>(false);
  const [validating,   setValidating]   = useState<boolean>(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
  const [highlightLineId,  setHighlightLineId]  = useState<string | null>(null);
  const [highlightHeaderField, setHighlightHeaderField] = useState<string | null>(null);
  const [toast,        setToast]        = useState<ToastState>(null);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const [activeAutocomplete, setActiveAutocomplete] = useState<string | null>(null);
  const [autocompleteSearch, setAutocompleteSearch] = useState<string>("");
  const [allExpanded,        setAllExpanded]        = useState<boolean>(true);
  const [hoveredColIdx,      setHoveredColIdx]      = useState<number | null>(null);
  const [openYearMenuIdx,    setOpenYearMenuIdx]    = useState<{ gId: string; yi: number } | null>(null);
  const [editingYearIdx,     setEditingYearIdx]     = useState<{ gId: string; yi: number } | null>(null);
  const [editingYearLabel,   setEditingYearLabel]   = useState<string>("");
  const [editingYearError,   setEditingYearError]   = useState<boolean>(false);
  const [editingGroupId,     setEditingGroupId]     = useState<string | null>(null);
  const [editingGroupName,   setEditingGroupName]   = useState<string>("");
  const [editingCell,        setEditingCell]        = useState<{ gId: string; vId: string; year: number; raw: string } | null>(null);
  const [pasteToast,         setPasteToast]         = useState<{ gId: string; count: number } | null>(null);
  const [confirmDelete,      setConfirmDelete]      = useState<{ gId: string; vId?: string; name: string; kind: "line" | "section" } | null>(null);
  const [deletingRow,        setDeletingRow]        = useState<boolean>(false);
  const [confirmDeleteYear,  setConfirmDeleteYear]  = useState<{ year: number; label: string } | null>(null);
  const [stripTooltip,       setStripTooltip]       = useState<"currency" | "scale" | "number" | "date" | null>(null);
  const [headerPinned,     setHeaderPinned]     = useState<boolean>(false);
  const [headerHeight,     setHeaderHeight]     = useState<number>(0);
  const [leftOffset,       setLeftOffset]       = useState<number>(0);
  const [containerWidth,   setContainerWidth]   = useState<number>(0);
  const dbYearsRef   = useRef<Set<number>>(new Set());
  const headerRef    = useRef<HTMLDivElement>(null);
  const sentinelRef  = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Sticky header: walk DOM to find APEX scroll container, listen directly ── */
  useEffect(() => {
    const getScrollParents = (el: HTMLElement): Element[] => {
      const parents: Element[] = [];
      let cur: Element | null = el.parentElement;
      while (cur && cur !== document.documentElement) {
        const s = window.getComputedStyle(cur);
        if (/auto|scroll/.test(s.overflow + s.overflowY + s.overflowX)) parents.push(cur);
        cur = cur.parentElement;
      }
      parents.push(document.documentElement);
      return parents;
    };

    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setLeftOffset(rect.left);
      setContainerWidth(rect.width);
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();

    const check = () => {
      if (!sentinelRef.current) return;
      const pinned = sentinelRef.current.getBoundingClientRect().top < 0;
      setHeaderPinned(pinned);
      if (pinned) measure();
    };

    // Listen on scroll parents (catches APEX inner scroll container)
    const scrollParents = containerRef.current ? getScrollParents(containerRef.current) : [];
    scrollParents.forEach((el) => el.addEventListener("scroll", check, { passive: true }));
    // Capture-phase fallback on window/document for edge cases
    window.addEventListener("scroll", check, { passive: true, capture: true });
    window.addEventListener("resize", measure);

    return () => {
      scrollParents.forEach((el) => el.removeEventListener("scroll", check));
      window.removeEventListener("scroll", check, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* ── Column resize state ── */
  const [colWidths, setColWidths] = useState<{ lineItem: number; account: number }>({ lineItem: 180, account: 240 });
  const resizeRef = useRef<{ col: "lineItem" | "account"; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const newW = Math.max(80, r.startW + (e.clientX - r.startX));
      setColWidths((prev) => ({ ...prev, [r.col]: newW }));
    };
    const onMouseUp = () => { resizeRef.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  const startResize = (col: "lineItem" | "account", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { col, startX: e.clientX, startW: colWidths[col] };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Mirror of `data` kept in a ref so async POST handlers can read the
  // latest row (e.g. the name the user just typed) without re-rendering.
  const dataRef = useRef<PivotTableData | null>(null);
  useEffect(() => { dataRef.current = data; });

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const yearMenuRef     = useRef<HTMLDivElement>(null);
  const hoverTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Account codes — fetch on demand when user opens the dropdown ── */
  const loadAccountCodesForSection = useCallback((sectionType: string) => {
    if (!sectionType || accountCodesBySection[sectionType]) return;
    const cfg = getAppConfig();
    getAccountCodes(cfg, sectionType)
      .then((codes) => setAccountCodesBySection((prev) => ({ ...prev, [sectionType]: codes })))
      .catch((e) => console.error("[account-codes] failed for", sectionType, e));
  }, [accountCodesBySection]);

  /* ── GET ─────────────────────────────────────────────────────── */
  const loadData = useCallback(async (): Promise<{ table: PivotTableData; rawHeader: ApiHeader } | null> => {
    setLoading(true);
    setFetchError(null);
    setSaveError(null);
    try {
      const cfg = getAppConfig();
      const result = await getFinEvaluationStaging(cfg);
      setData(result.table);
      setRawHeader(result.rawHeader);
      setValidationErrors(result.errors ?? []);
      dbYearsRef.current = new Set(result.table.years);
      return result;
    } catch (e: unknown) {
      clearCachedToken();
      setFetchError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  const didInitialLoadRef = useRef(false);
  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    loadData();
  }, [loadData]);

  // Live FX rate for the proposal's local currency, fetched from the
  // currencyExchangeRates API (usd_fbr = "1 local = X USD"). USD needs no rate.
  useEffect(() => {
    const local = rawHeader?.local_currency?.toUpperCase();
    if (!local || local === "USD") { setExchangeRate(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const cfg  = getAppConfig();
        const rate = await getExchangeRate(cfg, local);
        if (!cancelled) setExchangeRate(rate);
      } catch (e) {
        console.error("[fin_eval] exchange rate fetch failed", e);
        if (!cancelled) setExchangeRate(null);
      }
    })();
    return () => { cancelled = true; };
  }, [rawHeader?.local_currency]);

  // Pre-load account codes for any section that already has saved account values
  useEffect(() => {
    if (!data) return;
    data.groups.forEach((g) => {
      if (g.sectionType && g.values.some((v) => v.accountId)) {
        loadAccountCodesForSection(g.sectionType);
      }
    });
  }, [data?.groups.length, loadAccountCodesForSection]);

  // Surgically refresh a single section by AJAX without a full reload.
  // Finds the matching group in fresh data by sectionId / sectionType / name,
  // patches only that group in state (preserving expanded state for all others),
  // then triggers the scroll. Used by the event listener and mount effect.
  const refreshSection = useCallback(async (targetId: string): Promise<void> => {
    try {
      const cfg    = getAppConfig();
      const result = await getFinEvaluationStaging(cfg);
      const numId  = parseInt(targetId, 10);
      const fresh  = result.table.groups.find((g) =>
        (Number.isFinite(numId) && g.sectionId === numId) ||
        tok(g.sectionType) === tok(targetId) ||
        tok(g.name)        === tok(targetId),
      );
      setData((prev) => {
        if (!prev) return result.table;
        if (!fresh) return prev;
        const exists = prev.groups.some((g) => g.sectionId === fresh.sectionId);
        return {
          ...prev,
          groups: exists
            ? prev.groups.map((g) =>
                g.sectionId === fresh.sectionId
                  ? { ...fresh, expanded: g.expanded }
                  : g,
              )
            : [...prev.groups, { ...fresh, expanded: true }],
        };
      });
      setRawHeader(result.rawHeader);
      setScrollTarget(targetId);
    } catch (e) {
      console.error("[refreshSection]", e);
    }
  }, []);

  // On mount: pick up any scroll target stored on window by the APEX listener.
  useEffect(() => {
    const w = window as Window & { __finEvalScrollTarget?: string };
    if (w.__finEvalScrollTarget) {
      const target = w.__finEvalScrollTarget;
      delete w.__finEvalScrollTarget;
      void refreshSection(target);
    }
  }, [refreshSection]);

  // External refresh trigger — handles the no-remount path.
  //   window.dispatchEvent(new CustomEvent("tool:refresh_financial_evaluation", { detail: { sectionId } }));
  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<{ sectionId?: string | number | null }>).detail;
      const sid = detail?.sectionId != null ? String(detail.sectionId).trim() : null;
      console.log("[Table] tool:refresh_financial_evaluation received, sectionId =", sid);
      if (sid && sid !== "null") {
        void refreshSection(sid);
      } else {
        void loadData();
      }
    };
    window.addEventListener("tool:refresh_financial_evaluation", handler);
    return () => window.removeEventListener("tool:refresh_financial_evaluation", handler);
  }, [loadData, refreshSection]);

  // After loadData() resolves and data updates, scroll to the target section.
  // scrollTarget may be a numeric DB section ID ("5799") or a section type
  // string ("CAPITAL_INVESTMENT") — try all three match strategies.
  // Polls for element visibility so it works whether the APEX tab was already
  // active or just switched (display:none → block transition).
  useEffect(() => {
    if (!data || !scrollTarget) return;
    const matched = data.groups.find(
      (g) =>
        String(g.sectionId) === scrollTarget ||
        tok(g.sectionType)  === tok(scrollTarget) ||
        tok(g.name)         === tok(scrollTarget),
    );
    if (!matched) { setScrollTarget(null); return; }

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 × 100ms = 6s — allows for APEX tab-switch transition

    const tryScroll = (): void => {
      const el =
        document.querySelector<HTMLElement>(`[data-section-id="${matched.sectionId}"]`) ??
        document.querySelector<HTMLElement>(`[data-section-type="${matched.sectionType || matched.id}"]`);

      if (!el) { setScrollTarget(null); return; }

      if (el.offsetParent === null) {
        // Element is inside a hidden container (inactive APEX tab).
        // After 500ms, proactively click the Financial Evaluation nav link so we
        // don't have to rely on the APEX JS knowing which button to click.
        if (attempts === 5) {
          const allLinks = Array.from(document.querySelectorAll<HTMLElement>("a, button, [role='tab'], [role='menuitem']"));
          const finLink  = allLinks.find((l) =>
            /financial\s*eval/i.test(l.textContent?.trim() ?? "") ||
            /financial[_\-]?eval/i.test(l.getAttribute("href") ?? ""),
          );
          if (finLink) {
            console.log("[Table] clicking Financial Evaluation tab:", finLink);
            finLink.click();
          }
        }
        if (attempts < MAX_ATTEMPTS) {
          attempts++;
          setTimeout(tryScroll, 100);
          return;
        }
      }

      // scroll-margin-top offsets the section header below the APEX sticky navbar
      el.style.scrollMarginTop = "80px";
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollTarget(null);
    };

    tryScroll();
  }, [data, scrollTarget]);

  /* ── Scroll to a specific line row (from a validation-error click) ── */
  useEffect(() => {
    if (!highlightLineId) return;
    let attempts = 0;
    const tryScroll = (): void => {
      const el = document.querySelector<HTMLElement>(`[data-line-id="${highlightLineId}"]`);
      if (el) {
        el.style.scrollMarginTop = "120px";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (attempts < 20) {
        attempts++;
        setTimeout(tryScroll, 50);
      }
    };
    tryScroll();
    const clear = setTimeout(() => setHighlightLineId(null), 3000);
    return () => clearTimeout(clear);
  }, [highlightLineId]);

  /* ── Scroll to a specific Financial Parameters field (validation-error click) ── */
  useEffect(() => {
    if (!highlightHeaderField) return;
    const el = document.querySelector<HTMLElement>(`[data-kpi-field="${highlightHeaderField}"]`);
    if (el) {
      el.style.scrollMarginTop = "120px";
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus?.();
    }
    const clear = setTimeout(() => setHighlightHeaderField(null), 3000);
    return () => clearTimeout(clear);
  }, [highlightHeaderField]);

  /* ── Save Model ──────────────────────────────────────────────
     POST to the staging-migrate endpoint (moves staging → main for
     this proposal), then re-fetch so KPI, subtotals and cash flow
     rows reflect the migrated server state. */
  const saveDraft = useCallback(async (): Promise<void> => {
    if (!data || !rawHeader) return;
    const cfg = getAppConfig();
    if (!cfg.proposal_id) {
      setToast({
        kind: "error",
        message: "Cannot save — Proposal ID is required. Please create a Proposal and click Save Model.",
        action: {
          label: "Go to Proposal Setup",
          onClick: () => {
            (document.getElementById("Proposal_Setup_btn") as HTMLButtonElement | null)?.click();
          },
        },
      });
      return;
    }
    setSavingDraft(true);
    setSaveError(null);
    try {
      const response = await migrateFinEvalStaging(cfg);
      const method: "POST" = "POST";
      setToast({
        kind: "success",
        message: ((response as any).apiMessage || response.api_message || "")
          || "Financial evaluation saved successfully.",
      });
      const saveEvent = new CustomEvent("tool:fin_eval_saved", { detail: { proposalId: cfg.proposal_id } });
      console.log("[fin_eval] dispatching tool:fin_eval_saved", saveEvent.detail);
      window.dispatchEvent(saveEvent);
      publishToBridge({ type: "PLUGIN_MSG", source: "editor", target: "chatbot", action: "fin-eval:saved", payload: { proposalId: cfg.proposal_id, method } });
      // Silent re-fetch — replace local state with the server result.
      // After a successful save the backend holds the source of truth and
      // returns every section and line (calculated/template rows included,
      // even empty ones), so we adopt it wholesale — exactly what a page
      // reload does. We only carry over each section's expanded/collapsed
      // state so the view doesn't jump.
      try {
        const refetched = await getFinEvaluationStaging(cfg);
        console.log("[saveDraft] re-fetch groups:", refetched.table.groups.length,
          "lines:", refetched.table.groups.reduce((s, g) => s + g.values.length, 0));

        setData((current) => {
          if (!current) return refetched.table;

          const expandedBySection = new Map(
            current.groups.filter((g) => g.sectionId != null).map((g) => [g.sectionId, g.expanded]),
          );
          const expandedByName = new Map(
            current.groups.map((g) => [g.name.trim().toLowerCase(), g.expanded]),
          );

          return {
            ...refetched.table,
            groups: refetched.table.groups.map((g) => ({
              ...g,
              expanded:
                (g.sectionId != null && expandedBySection.has(g.sectionId)
                  ? expandedBySection.get(g.sectionId)
                  : expandedByName.get(g.name.trim().toLowerCase())) ?? g.expanded,
            })),
          };
        });

        // Always update the header so KPIs, exchange rate, etc. reflect server state.
        setRawHeader(refetched.rawHeader);
        setValidationErrors(refetched.errors ?? []);
      } catch (e) {
        console.error("[saveDraft] re-fetch failed", e);
      }
    } catch (e: unknown) {
      clearCachedToken();
      const msg = e instanceof Error ? e.message : "Unknown save error";
      setSaveError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setSavingDraft(false);
    }
  }, [data, rawHeader, loadData]);

  /* ── Validate ─────────────────────────────────────────────────
     PUT the current state to finEvaluationStaging so the backend re-runs
     validation. Mirrors Save Draft exactly (same PUT + re-fetch +
     bridge events) but with its own loading state and messaging. */
  const validate = useCallback(async (): Promise<void> => {
    if (!data || !rawHeader) return;
    const cfg = getAppConfig();
    if (!cfg.proposal_id) {
      setToast({
        kind: "error",
        message: "Cannot validate — Proposal ID is required. Please create a Proposal first.",
      });
      return;
    }
    if (!cfg.file_id) {
      setToast({
        kind: "error",
        message: "Cannot validate — File ID is required.",
      });
      return;
    }
    setValidating(true);
    setSaveError(null);
    try {
      const response = await validateFinEvaluationStaging(cfg, data, rawHeader);
      const method: "PUT" = "PUT";
      setToast({
        kind: "success",
        message: ((response as any).apiMessage || response.api_message || "")
          || "Validation completed successfully.",
      });
      const saveEvent = new CustomEvent("tool:fin_eval_saved", { detail: { proposalId: cfg.proposal_id } });
      console.log("[fin_eval] dispatching tool:fin_eval_saved (validate)", saveEvent.detail);
      window.dispatchEvent(saveEvent);
      publishToBridge({ type: "PLUGIN_MSG", source: "editor", target: "chatbot", action: "fin-eval:saved", payload: { proposalId: cfg.proposal_id, method } });
      // Silent re-fetch — adopt the server result as source of truth,
      // carrying over each section's expanded/collapsed state.
      try {
        const refetched = await getFinEvaluationStaging(cfg);
        console.log("[validate] re-fetch groups:", refetched.table.groups.length,
          "lines:", refetched.table.groups.reduce((s, g) => s + g.values.length, 0));

        setData((current) => {
          if (!current) return refetched.table;

          const expandedBySection = new Map(
            current.groups.filter((g) => g.sectionId != null).map((g) => [g.sectionId, g.expanded]),
          );
          const expandedByName = new Map(
            current.groups.map((g) => [g.name.trim().toLowerCase(), g.expanded]),
          );

          return {
            ...refetched.table,
            groups: refetched.table.groups.map((g) => ({
              ...g,
              expanded:
                (g.sectionId != null && expandedBySection.has(g.sectionId)
                  ? expandedBySection.get(g.sectionId)
                  : expandedByName.get(g.name.trim().toLowerCase())) ?? g.expanded,
            })),
          };
        });

        setRawHeader(refetched.rawHeader);
        setValidationErrors(refetched.errors ?? []);
      } catch (e) {
        console.error("[validate] re-fetch failed", e);
      }
    } catch (e: unknown) {
      clearCachedToken();
      const msg = e instanceof Error ? e.message : "Unknown validation error";
      setSaveError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setValidating(false);
    }
  }, [data, rawHeader]);

  // AppBridge event listeners.
  // "fin-eval" — commands from sibling plugins using our typed action names.
  // "editor"   — legacy target used by the chatbot (tool:refresh_financial_evaluation).
  // Existing window custom-event listeners are untouched.
  useEffect(() => {
    const unsubFinEval = subscribeAllActions("fin-eval", (env) => {
      const action  = env.action as string;
      const payload = env.payload as Record<string, unknown> | null | undefined;
      console.log("[fin-eval] bridge action received:", action, payload);

      if (action === "fin-eval:refresh") {
        const sid = payload?.sectionId != null ? String(payload.sectionId).trim() : null;
        if (sid && sid !== "null") void refreshSection(sid);
        else void loadData();
      } else if (action === "fin-eval:save") {
        void saveDraft();
      } else if (action === "fin-eval:scroll-to-section") {
        const sectionType = payload?.sectionType as string | undefined;
        if (sectionType) void refreshSection(sectionType);
      }
    });

    const unsubEditor = subscribeAllActions("editor", (env) => {
      const action  = env.action as string;
      const payload = env.payload as Record<string, unknown> | null | undefined;
      console.log("[fin-eval/editor] bridge action received:", action, payload);

      if (action === "tool:refresh_financial_evaluation") {
        const sid = payload?.sectionId != null ? String(payload.sectionId).trim() : null;
        if (sid && sid !== "null") void refreshSection(sid);
        else void loadData();
      }
    });

    return () => { unsubFinEval(); unsubEditor(); };
  }, [loadData, refreshSection, saveDraft]);

  /* ── Side-effects ───────────────────────────────────────────── */
  useEffect(() => {
    if (pasteToast) { const t = setTimeout(() => setPasteToast(null), 3000); return () => clearTimeout(t); }
  }, [pasteToast]);

  useEffect(() => {
    const h = (e: MouseEvent): void => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        if (activeAutocomplete && autocompleteSearch) {
          const [gId, ...rest] = activeAutocomplete.split("|");
          const vId = rest.join("|");
          setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, values: g.values.map((v) => v.id === vId ? { ...v, name: autocompleteSearch } : v) } : g) }) : p);
        }
        setActiveAutocomplete(null); setAutocompleteSearch("");
      }
    };
    if (activeAutocomplete) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [activeAutocomplete, autocompleteSearch]);

  useEffect(() => {
    const h = (e: MouseEvent): void => { if (yearMenuRef.current && !yearMenuRef.current.contains(e.target as Node)) setOpenYearMenuIdx(null); };
    if (openYearMenuIdx !== null) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openYearMenuIdx]);

  /* ── FX multiplier for display currency conversion ────────────── */
  // All values are stored in USD in the database.
  // exchangeRate is fetched live from the currencyExchangeRates API as
  // "1 local currency = exchangeRate USD" (usd_fbr).
  // USD display → no conversion (×1).
  // Local display → USD × (1/rate) = local (e.g. 3000 USD × 1/0.78 = 3846 GBP).
  // Save path divides by fxMultiplier to convert back to USD for storage.
  const fxMultiplier: number = (() => {
    if (!rawHeader) return 1;
    const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
    if (display === "USD") return 1;
    return exchangeRate ? 1 / exchangeRate : 1;
  })();

  const scaleDivisor = (scale: number): number =>
    scale === 100000 ? 1000000 : scale === 10000 ? 1000 : 1;

  // Checks lineIdentifier, lineType, AND display name — one of them will match
  // even when line_identifier comes back null from the API.
  const matchesAny = (v: ValueRow, ids: Set<string>): boolean =>
    ids.has(tok(v.lineIdentifier)) ||
    ids.has(tok(v.lineType))       ||
    ids.has(tok(v.name));

  // Percentage-based rows where a cross-year total is meaningless — show "—"
  const NO_TOTAL_IDS = new Set([
    "TAXRATE", "TAXRATEPCT", "TAXRATEPERCENT",
    "POSTTAXRETURN", "POSTTAXRETURNPCT", "POSTTAXRETURNPERCENT",
  ]);
  const isNoTotalRow = (v: ValueRow): boolean => matchesAny(v, NO_TOTAL_IDS);

  // Any percentage row — bypasses fx/scale (K/M/B) conversion entirely and
  // enforces 0–100 / 2-decimal input rules. Prod Dev's template only has Tax
  // Rate %, EBIT Margin %, and Post Tax Return %, plus any custom row whose
  // display name carries a "%".
  const PERCENT_DISPLAY_IDS = new Set([
    "TAXRATE", "TAXRATEPCT", "TAXRATEPERCENT",
    "EBITMARGIN", "EBITMARGINPCT", "EBITMARGINPERCENT",
    "POSTTAXRETURN", "POSTTAXRETURNPCT", "POSTTAXRETURNPERCENT",
  ]);
  const isPercentRow = (v: ValueRow): boolean =>
    matchesAny(v, PERCENT_DISPLAY_IDS) || /%/.test(v.name ?? "");

  // Raw formatter: no fx, no scale, trailing zero decimals trimmed (26 not
  // 26.00) — used for percentage rows (Tax Rate %, EBIT Margin %, Post Tax
  // Return %); the row label already carries the "%". Fully independent of
  // the K/M/B toggle — neither the value nor its precision shifts when scale changes.
  const rawFmt = (n: number): string => {
    if (!n) return "—";
    const formatted = formatGroupedTrimmed(n, numberFormat, 2);
    return n < 0 ? `(${formatted})` : formatted;
  };

  const displayFmt = (n: number): string => {
    if (!n) return "—";
    const v = (n * fxMultiplier) / scaleDivisor(displayScale);
    const formatted = formatNumberByStyle(v, numberFormat, decimalsForScale(displayScale));
    return v < 0 ? `(${formatted})` : formatted;
  };

  /* ── Loading / error gates ──────────────────────────────────── */
  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
      <div style={{ display: "inline-block", animation: "spin 1s linear infinite", marginBottom: 10 }}><RefreshCw size={20} /></div>
      <div>Loading financial data…</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (fetchError) return (
    <div style={{ padding: 40, maxWidth: 480, margin: "40px auto" }}>
      <div style={{ padding: "14px 18px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 14 }}><strong>Error:</strong> {fetchError}</div>
      <button type="button" onClick={loadData} style={{ padding: "8px 18px", background: BRAND, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Retry</button>
    </div>
  );

  if (!data) return <></>;

  /* ── Calculations (from line-level data populated by API) ─────── */
  const numYears   = data.years.length;

  /* ── Validation errors → real navigation targets ───────────────
     Each ValidationIssue already carries whichever target the backend's
     own errorMessage matched to (header field / section id / line id) —
     see attachValidationTargets in financial-api.ts. No more positional
     guessing across unrelated error types. */
  const goToError = (idx: number): void => {
    const err = validationErrors[idx];
    if (!err) return;
    if (err.headerField) {
      setHighlightHeaderField(err.headerField);
      return;
    }
    if (err.sectionId != null) {
      setScrollTarget(String(err.sectionId));
      return;
    }
    if (err.lineId) {
      const owningGroup = data.groups.find((g) => g.values.some((v) => v.id === err.lineId));
      if (owningGroup) {
        setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === owningGroup.id ? { ...g, expanded: true } : g) }) : p);
      }
      setHighlightLineId(err.lineId);
    }
  };

  /* ── Year management ────────────────────────────────────────── */
  const insertYearAfter = (idx: number): void => { setData((p) => { if (!p) return p; const y = Math.max(...p.years) + 1; return { ...p, years: [...p.years.slice(0, idx + 1), y, ...p.years.slice(idx + 1)], columnLabels: { ...p.columnLabels, [y]: `FY${String(y).slice(2)}` }, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => ({ ...v, yearValues: { ...v.yearValues, [y]: 0 } })) })) }; }); setHoveredColIdx(null); };
  const removeYear = (year: number): void => { if (data.years.length <= 1) return; setData((p) => { if (!p) return p; const lbl = { ...p.columnLabels }; delete lbl[year]; return { ...p, years: p.years.filter((y) => y !== year), columnLabels: lbl, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => { const nv = { ...v.yearValues }; delete nv[year]; return { ...v, yearValues: nv }; }) })) }; }); setConfirmDeleteYear(null); setOpenYearMenuIdx(null); };
  const updateColumnLabel = (year: number, lbl: string): void => {
    const trimmed = lbl.trim();
    const existing = Object.entries(data?.columnLabels ?? {}).find(
      ([k, v]) => Number(k) !== year && v === trimmed
    );
    if (trimmed && existing) {
      setEditingYearError(true);
      setToast({ kind: "error", message: `Year label "${trimmed}" already exists.` });
      return;
    }
    setEditingYearError(false);
    setData((p) => p ? ({ ...p, columnLabels: { ...p.columnLabels, [year]: trimmed || `FY${String(year).slice(2)}` } }) : p);
    setEditingYearIdx(null);
    setEditingYearLabel("");
  };
  const moveYearLeft  = (i: number): void => { if (i <= 0) return; setData((p) => { if (!p) return p; const y = [...p.years]; [y[i-1], y[i]] = [y[i], y[i-1]]; return { ...p, years: y }; }); setOpenYearMenuIdx(null); };
  const moveYearRight = (i: number): void => { if (i >= data.years.length - 1) return; setData((p) => { if (!p) return p; const y = [...p.years]; [y[i], y[i+1]] = [y[i+1], y[i]]; return { ...p, years: y }; }); setOpenYearMenuIdx(null); };

  /* ── Group / row CRUD ───────────────────────────────────────── */
  const blankRow    = (p: PivotTableData): ValueRow => ({ id: generateId(), name: "", yearValues: p.years.reduce((a: YearValues, y) => ({ ...a, [y]: 0 }), {}), lineType: "CUSTOM", lineIdentifier: "FINANCIAL", isCalculated: "N", isCustom: "Y", status: "ACTIVE", languageCode: "EN" });
  // New sections / lines are persisted on Save (PUT) — the backend's
  // update_fin_eval_prc inserts rows with null fin_eval_section_id /
  // fin_eval_line_id and updates rows with real ids, so a separate
  // POST-on-add is unnecessary and caused a race that left stale
  // "New Line Item" rows in the DB.
  const toggleGroup = (id: string): void => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === id ? { ...g, expanded: !g.expanded } : g) }) : p);
  const toggleAll   = (): void => { const n = !allExpanded; setAllExpanded(n); setData((p) => p ? ({ ...p, groups: p.groups.map((g) => ({ ...g, expanded: n })) }) : p); };
  const addValueRow = (gId: string): void => setData((p) => p ? ({
    ...p,
    groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: [...g.values, blankRow(p)] }, p.years) : g),
  }) : p);
  const removeValueRow = (gId: string, vId: string): void => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: g.values.filter((v) => v.id !== vId) }, p.years) : g) }) : p);
  const updateCellValue = (gId: string, vId: string, year: number, raw: string): void => {
    const n = parseFloat(raw.replace(/,/g, "")) || 0;
    setData((p) => p ? ({
      ...p,
      groups: p.groups.map((g) => {
        if (g.id !== gId) return g;
        const withValue: Group = {
          ...g,
          values: g.values.map((v) => v.id === vId ? { ...v, yearValues: { ...v.yearValues, [year]: n } } : v),
        };
        return recomputeGroup(withValue, p.years);
      }),
    }) : p);
  };
  const updateValueName = (gId: string, vId: string, name: string): void => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, values: g.values.map((v) => v.id === vId ? { ...v, name } : v) } : g) }) : p);
  const updateGroupName = (gId: string, name: string): void => { setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, name } : g) }) : p); setEditingGroupId(null); setEditingGroupName(""); };

  /* ── Paste handlers ─────────────────────────────────────────── */
  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>, gId: string, vId: string): void => {
    const text: string = e.clipboardData.getData("text/plain");
    if (!text.includes("\n") && !text.includes("\r") && !text.includes("\t")) return;
    e.preventDefault();
    const parsed: ParsedRow[] = parseExcelPaste(text);
    if (!parsed.length) return;
    setData((p) => {
      if (!p) return p;
      return { ...p, groups: p.groups.map((g) => {
        if (g.id !== gId) return g;
        const idx     = g.values.findIndex((v) => v.id === vId);
        const newRows: ValueRow[] = parsed.map((r): ValueRow => { const yv: YearValues = {}; p.years.forEach((y, i) => { yv[y] = r.values[i] ?? 0; }); return { id: generateId(), name: r.name, yearValues: yv, lineType: "CUSTOM", lineIdentifier: "FINANCIAL", isCalculated: "N", isCustom: "Y", status: "ACTIVE", languageCode: "EN" }; });
        const ex      = g.values[idx];
        const isBlank = (!ex?.name || ex.name === "New Line Item") && Object.values(ex.yearValues).every((v) => v === 0);
        const withRows: Group = { ...g, values: isBlank ? [...g.values.slice(0, idx), ...newRows, ...g.values.slice(idx + 1)] : [...g.values.slice(0, idx + 1), ...newRows, ...g.values.slice(idx + 1)] };
        return recomputeGroup(withRows, p.years);
      }) };
    });
    setPasteToast({ gId, count: parsed.length }); setActiveAutocomplete(null); setAutocompleteSearch("");
  };

  const handleValueCellPaste = (e: React.ClipboardEvent<HTMLInputElement>, gId: string, vId: string, startYearIdx: number): void => {
    const text: string = e.clipboardData.getData("text/plain");
    if (!text.includes("\n") && !text.includes("\r") && !text.includes("\t")) return;
    e.preventDefault();
    const lines: string[]     = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());
    const rawRows: string[][] = lines.map((l) => l.split("\t"));
    const maxC = Math.max(...rawRows.map((r) => r.length));
    let vs = 0;
    for (let c = 0; c < maxC; c++) { if (rawRows.every((r) => { const v = (r[c] ?? "").trim(); return !v || isNumericCell(v); })) { vs = c; break; } }
    const parsedRows: number[][] = rawRows.map((cols) => cols.slice(vs).map((c) => parseExcelValue(c)));
    if (!parsedRows.length) return;
    setData((p) => { if (!p) return p; return { ...p, groups: p.groups.map((g) => { if (g.id !== gId) return g; const si = g.values.findIndex((v) => v.id === vId); if (si === -1) return g; const withValues: Group = { ...g, values: g.values.map((v, ri) => { const off = ri - si; if (off < 0 || off >= parsedRows.length) return v; const nv: YearValues = { ...v.yearValues }; const vIsPct = isPercentRow(v); parsedRows[off].forEach((val, ci) => { const yi = startYearIdx + ci; if (yi < p.years.length) nv[p.years[yi]] = vIsPct ? clampPercent(val) : val; }); return { ...v, yearValues: nv }; }) }; return recomputeGroup(withValues, p.years); }) }; });
    const grp = data.groups.find((g) => g.id === gId);
    const si  = grp ? grp.values.findIndex((v) => v.id === vId) : 0;
    setPasteToast({ gId, count: grp ? Math.min(parsedRows.length, grp.values.length - si) : parsedRows.length });
  };

  /* ────────────────────────────── JSX ────────────────────────── */
  return (
    <div ref={containerRef}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {/* Sentinel — IntersectionObserver watches this to detect when header should pin */}
      <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }} />

      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          onClick={() => !deletingRow && setConfirmDelete(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 8, padding: "20px 22px", minWidth: 340, maxWidth: 420, boxShadow: "0 10px 30px rgba(0,0,0,.2)" }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Delete {confirmDelete.kind === "section" ? "section" : "line item"}
            </div>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 18 }}>
              Are you sure you want to delete{confirmDelete.name ? <>{" "}<strong>&quot;{confirmDelete.name}&quot;</strong></> : ""}?
              {confirmDelete.kind === "section" ? " All line items in this section will also be removed." : ""}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                disabled={deletingRow}
                onClick={() => setConfirmDelete(null)}
                style={{ padding: "6px 14px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: deletingRow ? "not-allowed" : "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingRow}
                onClick={async () => {
                  if (!confirmDelete) return;
                  const { gId, vId, kind } = confirmDelete;
                  setDeletingRow(true);
                  try {
                    let apiMessage: string | undefined;
                    const cfg = getAppConfig();
                    if (kind === "section") {
                      const group = dataRef.current?.groups.find((g) => g.id === gId);
                      if (group?.sectionId != null) {
                        const resp = await deleteSection(cfg, group.sectionId);
                        apiMessage = (resp as any).apiMessage || resp.api_message;
                      }
                      setData((p) => p ? { ...p, groups: p.groups.filter((g) => g.id !== gId) } : p);
                    } else {
                      const row = dataRef.current?.groups.find((g) => g.id === gId)?.values.find((v) => v.id === vId);
                      if (row?.lineId != null) {
                        const resp = await deleteLine(cfg, row.lineId);
                        apiMessage = (resp as any).apiMessage || resp.api_message;
                      }
                      if (vId) removeValueRow(gId, vId);
                    }
                    setConfirmDelete(null);
                    setToast({
                      kind: "success",
                      message: apiMessage || (kind === "section" ? "Section deleted successfully." : "Line deleted successfully."),
                    });
                    const deleteEvent = new CustomEvent("tool:fin_eval_deleted", { detail: { proposalId: cfg.proposal_id } });
                    console.log("[fin_eval] dispatching tool:fin_eval_deleted", deleteEvent.detail);
                    window.dispatchEvent(deleteEvent);
                  } catch (e) {
                    clearCachedToken();
                    const msg = e instanceof Error ? e.message : (kind === "section" ? "Failed to delete section" : "Failed to delete line");
                    setSaveError(msg);
                    setToast({ kind: "error", message: msg });
                    setConfirmDelete(null);
                  } finally {
                    setDeletingRow(false);
                  }
                }}
                style={{ padding: "6px 14px", background: BRAND, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: deletingRow ? "not-allowed" : "pointer", opacity: deletingRow ? 0.7 : 1 }}
              >
                {deletingRow ? "Deleting…" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete year confirmation modal */}
      {confirmDeleteYear && (
        <div
          onClick={() => setConfirmDeleteYear(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 8, padding: "20px 22px", minWidth: 340, maxWidth: 420, boxShadow: "0 10px 30px rgba(0,0,0,.2)" }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Delete year
            </div>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 18 }}>
              Are you sure you want to delete <strong>&quot;{confirmDeleteYear.label}&quot;</strong> and all its values? This cannot be undone.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteYear(null)}
                style={{ padding: "6px 14px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removeYear(confirmDeleteYear.year)}
                style={{ padding: "6px 14px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste toast */}
      {pasteToast && (
        <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 200, padding: "10px 16px", background: "#059669", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>
          <span>✓ {pasteToast.count} row{pasteToast.count !== 1 ? "s" : ""} pasted from Excel</span>
          <button type="button" onClick={() => setPasteToast(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={12} /></button>
        </div>
      )}

      {/* Save error banner */}
      {saveError && (
        <div style={{ marginBottom: 12, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span><strong>Save failed:</strong> {saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><X size={12} /></button>
        </div>
      )}

      {/* ── Sticky action bar + currency/scale strip ── */}
      {headerPinned && <div style={{ height: headerHeight }} />}
      <div ref={headerRef} style={{ position: headerPinned ? "fixed" : "sticky", top: 0, left: headerPinned ? leftOffset : undefined, width: headerPinned ? containerWidth : undefined, zIndex: 200, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        {/* Action bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isReadonly && (
            <button
              id="fin-eval-validate-btn"
              type="button"
              onClick={validate}
              disabled={validating || savingDraft || loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid rgb(4 165 0)", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#fff", color: "rgb(4 165 0)", cursor: validating || savingDraft || loading ? "not-allowed" : "pointer", opacity: validating || savingDraft || loading ? 0.7 : 1 }}
            >
              <CheckCircle2 size={14} style={validating ? { animation: "spin 1s linear infinite" } : {}} />
              {validating ? "Validating…" : "Validate"}
            </button>
            )}
            {!isReadonly && (() => {
              const hasErrors = validationErrors.length > 0;
              const saveModelDisabled = savingDraft || loading || hasErrors;
              return (
                <button
                  id="fin-eval-save-model-btn"
                  type="button"
                  onClick={saveDraft}
                  disabled={saveModelDisabled}
                  title={hasErrors ? "Resolve all validation errors before saving the model." : undefined}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, background: BRAND, color: "#fff", cursor: saveModelDisabled ? "not-allowed" : "pointer", opacity: saveModelDisabled ? 0.4 : 1 }}
                >
                  <Save size={14} style={savingDraft ? { animation: "spin 1s linear infinite" } : {}} />
                  {savingDraft ? "Saving…" : "Save Model"}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Currency/scale strip */}
        {rawHeader && (() => {
          const local     = (rawHeader.local_currency   || "USD").toUpperCase();
          const display   = (rawHeader.display_currency || local).toUpperCase();
          const currencies = local === "USD" ? ["USD"] : [local, "USD"];

          const handleCurrencyChange = (cur: string) => {
            setRawHeader((p) => p ? { ...p, display_currency: cur } : p);
            const cfg = getAppConfig();
            const evt = new CustomEvent("tool:fin_eval_currency_changed", {
              detail: { currency: cur, proposalId: cfg.proposal_id },
            });
            console.log("[fin_eval] dispatching tool:fin_eval_currency_changed", evt.detail);
            window.dispatchEvent(evt);
          };

          const handleScaleChange = (scale: number) => {
            setDisplayScale(scale);
            const cfg = getAppConfig();
            const denomination = scale === 100000 ? "B" : scale === 10000 ? "M" : "K";
            const evt = new CustomEvent("tool:fin_eval_scale_changed", {
              detail: { scale, denomination, label: denomination, proposalId: cfg.proposal_id },
            });
            console.log("[fin_eval] dispatching tool:fin_eval_scale_changed", evt.detail);
            window.dispatchEvent(evt);
          };

          const infoIcon = (kind: "currency" | "scale" | "number" | "date", tooltipText: string) => (
            <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
              onMouseEnter={() => setStripTooltip(kind)}
              onMouseLeave={() => setStripTooltip(null)}
            >
              <span style={{ width: 18, height: 18, borderRadius: 999, border: "1.5px solid #9ca3af", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "default", userSelect: "none" }}>i</span>
              {stripTooltip === kind && (
                <span style={{ position: "absolute", left: 22, top: -4, background: DARK_TOGGLE, color: "#fff", padding: "6px 10px", borderRadius: 4, fontSize: 13, whiteSpace: "normal", width: 360, lineHeight: 1.5, zIndex: 300 }}>
                  {tooltipText}
                </span>
              )}
            </div>
          );

          return (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Currency label + toggle + info */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>DISPLAY CURRENCY</span>
              <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                {currencies.map((cur, i) => (
                  <button key={cur} type="button" onClick={() => handleCurrencyChange(cur)} style={toggleBtn(display === cur, i === 0)}>
                    {currencyLabel(cur)}
                  </button>
                ))}
              </div>
              {infoIcon("currency", `Local Currency is ${local} — all values are displayed in ${display}. Change Local Currency in Proposal Section to enable a USD/local toggle.`)}

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Scale label + toggle + info */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>SCALE</span>
              <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                {SCALES.map((s, i) => (
                  <button key={s.value} type="button" onClick={() => handleScaleChange(s.value)} style={toggleBtn(displayScale === s.value, i === 0)}>
                    {s.label}
                  </button>
                ))}
              </div>
              {infoIcon("scale", "Switch the denomination for all financial values: K = thousands, M = millions, B = billions.")}

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Number format label + select + info */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>NUMBER</span>
              <select
                value={numberFormat}
                onChange={(e) => setNumberFormat(e.target.value as NumberFormatId)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                {NUMBER_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.sample}</option>
                ))}
              </select>
              {infoIcon("number", "Choose how numbers are grouped and how decimals are separated across the table and KPI cards.")}

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Date format label + select + info */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>DATE</span>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormatId)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.id}</option>
                ))}
              </select>
              {infoIcon("date", "Choose the display format for date fields, e.g. Date Placed in Service.")}

              {/* FX rate badge */}
              {display !== "USD" && exchangeRate != null && (
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 11, color: "#374151", lineHeight: 1.5 }}>
                  <span>1 {display} = {(1 / exchangeRate).toFixed(4)} USD</span>
                  <span>1 USD = {exchangeRate.toFixed(4)} {display}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Validation errors (from the staging GET response) ──────────
          One entry per "|" in file.errorMessage. Scrollable list with a
          min-height; clicking a row jumps to the field/section/line the
          backend's own errorMessage actually matched to, if any. */}
      {validationErrors.length > 0 && (
        <div style={{ marginTop: 12, marginBottom: 4, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", background: "#fee2e2", color: "#b91c1c", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <X size={14} />
            {validationErrors.length} validation {validationErrors.length === 1 ? "error" : "errors"}
          </div>
          <div style={{ minHeight: 88, maxHeight: 200, overflowY: "auto" }}>
            {validationErrors.map((err, i) => {
              const hasTarget = !!(err.headerField || err.sectionId != null || err.lineId);
              return (
                <div
                  key={i}
                  onClick={() => goToError(i)}
                  title={hasTarget ? "Go to field" : undefined}
                  style={{ display: "flex", gap: 8, padding: "8px 14px", fontSize: 12, color: "#991b1b", borderTop: i === 0 ? "none" : "1px solid #fecaca", cursor: hasTarget ? "pointer" : "default" }}
                  onMouseEnter={(e) => { if (hasTarget) e.currentTarget.style.background = "#fee2e2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontWeight: 700, minWidth: 18, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ flex: 1 }}>{err.message}</span>
                  {hasTarget && <ChevronRight size={14} style={{ flexShrink: 0, color: "#dc2626" }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── KPI panel (NPV / IRR / Payback / Metrics / Financial Parameters) ── */}
      {rawHeader && (
        <KpiPanel
          rawHeader={rawHeader}
          onChange={(patch) => setRawHeader((p) => p ? { ...p, ...patch } : p)}
          displayScale={displayScale}
          isReadonly={isReadonly}
          numberFormat={numberFormat}
          dateFormat={dateFormat}
          fxMultiplier={fxMultiplier}
          highlightField={highlightHeaderField}
        />
      )}

      {/* ── Table toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#374151" }}>{numYears} Years</span>
          <button type="button" onClick={toggleAll} style={{ padding: "3px 8px", fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>{allExpanded ? "Collapse All" : "Expand All"}</button>
        </div>
      </div>

      {/* ── Main pivot table ── */}
      <div style={{ marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: colWidths.lineItem }} />
              <col style={{ width: colWidths.account }} />
              {data.years.map((y) => <col key={y} style={{ minWidth: 120 }} />)}
              <col style={{ width: 140 }} />
            </colgroup>
            <tbody>
              {data.groups.map((group: Group) => (
                <React.Fragment key={group.id}>
                  {/* Section header */}
                  <tr data-section-id={group.sectionId} data-section-type={group.sectionType || group.id} style={{ background: DARK_HEADER, cursor: "pointer" }} onClick={() => toggleGroup(group.id)}>
                    {group.expanded ? (
                      <td colSpan={3 + numYears + 1} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ChevronUp size={16} style={{ flexShrink: 0 }} />
                          {editingGroupId === group.id && group.isCustom === "Y" ? (
                            <input autoFocus value={editingGroupName}
                              placeholder="Enter section name"
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onBlur={() => updateGroupName(group.id, editingGroupName)}
                              onKeyDown={(e) => { if (e.key === "Enter") updateGroupName(group.id, editingGroupName); else if (e.key === "Escape") { setEditingGroupId(null); setEditingGroupName(""); } }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ flex: 1, padding: "2px 8px", fontSize: 12, fontWeight: 700, background: "#fff", color: "#111", border: "1px solid #3b82f6", borderRadius: 3, outline: "none" }}
                            />
                          ) : (
                            <span
                              style={{ flex: 1, cursor: group.isCustom === "Y" ? "pointer" : "default", opacity: group.name ? 1 : 0.45, fontStyle: group.name ? "normal" : "italic" }}
                              onClick={(e) => { if (group.isCustom !== "Y") return; e.stopPropagation(); setEditingGroupId(group.id); setEditingGroupName(group.name); }}
                            >{group.name || "Enter section name"}</span>
                          )}
                          {!isReadonly && group.isCustom === "Y" && group.isMandatory !== "Y" && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, name: group.name, kind: "section" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", padding: 2 }} title="Delete section">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td colSpan={3 + numYears + 1} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ChevronDown size={16} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>{group.name}</span>
                          {!isReadonly && group.isCustom === "Y" && group.isMandatory !== "Y" && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, name: group.name, kind: "section" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", padding: 2 }} title="Delete section">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Per-section column sub-header */}
                  {group.expanded && (
                    <tr style={{ background: "#e5e7eb", height: 35 }}>
                      <th style={TH({ width: 28, background: "#e5e7eb" })} />
                      <th colSpan={group.isAccountRequired !== "Y" ? 2 : 1} style={TH({ textAlign: "left", width: colWidths.lineItem, position: "relative", background: "#e5e7eb" })}>
                        LINE ITEM
                        <div onMouseDown={(e) => startResize("lineItem", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                      </th>
                      {group.isAccountRequired === "Y" && (
                        <th style={TH({ textAlign: "left", width: colWidths.account, position: "relative", background: "#e5e7eb" })}>
                          ACCOUNT <span style={{ color: "#ef4444" }}>*</span>
                          <div onMouseDown={(e) => startResize("account", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                        </th>
                      )}
                      {data.years.map((year: number, yi: number) => (
                        <th key={year} style={TH({ textAlign: "right", whiteSpace: "nowrap", position: "relative", background: "#e5e7eb" })}
                          onMouseMove={(e) => { if (hoverTimer.current) clearTimeout(hoverTimer.current); const r = e.currentTarget.getBoundingClientRect(); setHoveredColIdx(e.clientX - r.left > r.width * 0.8 ? yi : null); }}
                          onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setHoveredColIdx(null), 150); }}
                        >
                          {hoveredColIdx === yi && (
                            <div style={{ position: "absolute", right: 0, top: "50%", transform: "translate(50%,-50%)", zIndex: 20 }}
                              onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredColIdx(yi); }}
                              onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredColIdx(null); }}
                            >
                              <button type="button" onClick={() => insertYearAfter(yi)} style={{ width: 20, height: 20, background: "#fff", border: "1px solid #9ca3af", borderRadius: 4, cursor: "pointer", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                            </div>
                          )}
                          {editingYearIdx?.gId === group.id && editingYearIdx?.yi === yi ? (
                            <input type="text" autoFocus value={editingYearLabel}
                              onChange={(e) => { setEditingYearLabel(e.target.value); setEditingYearError(false); }}
                              onBlur={() => updateColumnLabel(year, editingYearLabel)}
                              onKeyDown={(e) => { if (e.key === "Enter") updateColumnLabel(year, editingYearLabel); else if (e.key === "Escape") { setEditingYearIdx(null); setEditingYearLabel(""); setEditingYearError(false); } }}
                              style={{ width: "100%", padding: "2px 4px", fontSize: 10, fontWeight: 700, border: `1px solid ${editingYearError ? "#dc2626" : "#3b82f6"}`, borderRadius: 3, outline: "none", textAlign: "right", background: editingYearError ? "#fef2f2" : "#fff", color: editingYearError ? "#dc2626" : "#111" }}
                            />
                          ) : (
                            <div style={{ cursor: "pointer" }} onClick={() => setOpenYearMenuIdx(openYearMenuIdx?.gId === group.id && openYearMenuIdx?.yi === yi ? null : { gId: group.id, yi })}>
                              {data.columnLabels[year] || `FY${String(year).slice(2)}`}
                            </div>
                          )}
                          {openYearMenuIdx?.gId === group.id && openYearMenuIdx?.yi === yi && (
                            <div ref={yearMenuRef} style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, width: 144, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.1)", zIndex: 50 }}>
                              {yi > 0 && <button type="button" onClick={() => moveYearLeft(yi)} style={{ width: "100%", padding: "6px 12px", textAlign: "left", fontSize: 11, color: "#374151", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><ChevronLeft size={12} /> Move Left</button>}
                              {yi < data.years.length - 1 && <button type="button" onClick={() => moveYearRight(yi)} style={{ width: "100%", padding: "6px 12px", textAlign: "left", fontSize: 11, color: "#374151", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><ChevronRight size={12} /> Move Right</button>}
                              {!isReadonly && <button type="button" onClick={() => {
                                setOpenYearMenuIdx(null);
                                if (dbYearsRef.current.has(year)) {
                                  setToast({ kind: "error", message: "This year is saved in the database and cannot be deleted." });
                                } else {
                                  setConfirmDeleteYear({ year, label: data.columnLabels[year] || `FY${String(year).slice(2)}` });
                                }
                              }} style={{ width: "100%", padding: "6px 12px", textAlign: "left", fontSize: 11, color: "black", background: "none", border: "none", borderTop: "1px solid #f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={12} /> Delete</button>}
                            </div>
                          )}
                        </th>
                      ))}
                      <th style={TH({ textAlign: "right", whiteSpace: "nowrap", width: 90, background: "#e5e7eb" })}>TOTAL</th>
                    </tr>
                  )}

                  {/* Line rows: editable lines → add button → calculated lines */}
                  {group.expanded && (() => {
                    const editable = group.values.filter((v) => v.isCalculated !== "Y");
                    const calc     = group.values.filter((v) => v.isCalculated === "Y");

                    const renderEditable = (value: ValueRow, _idx: number) => {
                      const acKey = `${group.id}|${value.id}`;
                      const isAC  = activeAutocomplete === acKey;
                      const bg    = "#fff";
                      // Non-custom lines (is_custom === "N") come from the template and
                      // must not have their name edited — on top of the read-only rule.
                      // Exception: if the API sent no name at all, the template line is
                      // left editable so the user can actually supply the missing name
                      // (nameWasMissing is fixed at load time — see ValueRow — so typing
                      // the first character doesn't immediately re-lock the field).
                      const nameEditableException = value.isCustom === "N" && value.nameWasMissing === true;
                      const nameLocked = isReadonly || (value.isCustom === "N" && !nameEditableException);
                      // Template line names render as a bold label (like the calculated
                      // rows) rather than a greyed-out input box.
                      const isTemplateName = value.isCustom === "N" && !nameEditableException;
                      const isHighlighted = value.id === highlightLineId;
                      return (
                        <tr key={value.id} data-line-id={value.id} style={{ background: isHighlighted ? "#fef08a" : bg, transition: "background 0.4s", boxShadow: isHighlighted ? "inset 0 0 0 2px #f59e0b" : undefined }}>
                          <td style={{ ...TD, padding: "4px 0", textAlign: "center", verticalAlign: "middle" }}>
                            {!isReadonly && value.isMandatory !== "Y" && value.isCustom !== "N" && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, vId: value.id, name: value.name, kind: "line" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                            )}
                          </td>
                          <td colSpan={group.isAccountRequired !== "Y" ? 2 : 1} style={{ ...TD, padding: "4px 12px", position: "relative", overflow: "hidden" }} title={value.name}>
                            <input type="text"
                              value={isAC ? autocompleteSearch : value.name}
                              onChange={(e) => { if (nameLocked) return; updateValueName(group.id, value.id, e.target.value); if (isAC) setAutocompleteSearch(e.target.value); }}
                              onFocus={(e) => { if (nameLocked) { e.stopPropagation(); return; } e.stopPropagation(); setActiveAutocomplete(acKey); setAutocompleteSearch(value.name); }}
                              onPaste={(e) => { if (nameLocked) return; handleNamePaste(e, group.id, value.id); }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Enter line item name"
                              readOnly={nameLocked}
                              style={{ width: "100%", border: "none", background: isTemplateName ? "transparent" : (nameLocked ? "#f3f4f6" : "transparent"), fontSize: 12, fontWeight: isTemplateName ? 700 : 400, color: isTemplateName ? "#111827" : "#1f2937", outline: "none", textOverflow: "ellipsis", height: 28, cursor: nameLocked ? "default" : "text" }}
                            />
                          </td>
                          {group.isAccountRequired === "Y" && (
                          <td style={{ ...TD, padding: "4px 12px", overflow: "visible" }}>
                            {isReadonly
                              ? <div style={{ fontSize: 12, color: "#6b7280", padding: "4px 6px", background: "#f3f4f6", borderRadius: 4, height: 28, display: "flex", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value.accountId || "—"}</div>
                              : <AccountCodeSelect
                                  value={value.accountId ?? ""}
                                  options={accountCodesBySection[group.sectionType ?? ""] ?? []}
                                  onFocus={() => loadAccountCodesForSection(group.sectionType ?? "")}
                                  onChange={(val) => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === group.id ? { ...g, values: g.values.map((v) => v.id === value.id ? { ...v, accountId: val || undefined } : v) } : g) }) : p)}
                                />
                            }
                          </td>
                          )}
                          {data.years.map((year: number, yi: number) => {
                            const val = value.yearValues[year] ?? 0;
                            // Any percentage row bypasses fx conversion, K/M/B scaling, and
                            // decimal precision — a fixed 2 decimals is used regardless of scale.
                            const pctRow = isPercentRow(value);
                            const rawRow = pctRow;
                            const decimals = rawRow ? 2 : decimalsForScale(displayScale);
                            return (
                              <td key={year} style={{ ...TD, padding: "4px 12px" }}>
                                <input type="text"
                                  inputMode={pctRow ? "decimal" : undefined}
                                  value={editingCell?.gId === group.id && editingCell?.vId === value.id && editingCell?.year === year
                                    ? editingCell.raw
                                    : val === 0 ? "" : (() => {
                                        const v = rawRow ? val : (val * fxMultiplier) / scaleDivisor(displayScale);
                                        const formatted = rawRow ? formatGroupedTrimmed(v, numberFormat, decimals) : formatNumberByStyle(v, numberFormat, decimals);
                                        return v < 0 ? `(${formatted})` : formatted;
                                      })()}
                                  placeholder="—"
                                  onFocus={() => {
                                    const displayed = val === 0 ? "" : rawRow
                                      ? String(parseFloat(val.toFixed(decimals)))
                                      : String(parseFloat(((val * fxMultiplier) / scaleDivisor(displayScale)).toFixed(decimals)));
                                    setEditingCell({ gId: group.id, vId: value.id, year, raw: displayed });
                                  }}
                                  onChange={(e) => {
                                    // Percentage rows: reject the keystroke unless the
                                    // resulting text is a valid 0–100 value with ≤ 2 decimals.
                                    if (pctRow && !isValidPercentInput(e.target.value)) return;
                                    setEditingCell((prev) => prev ? { ...prev, raw: e.target.value } : null);
                                  }}
                                  onBlur={() => {
                                    if (editingCell?.gId === group.id && editingCell?.vId === value.id && editingCell?.year === year) {
                                      const parsed   = parseCellInput(editingCell.raw);
                                      const inputNum = pctRow ? clampPercent(parsed) : parsed;
                                      updateCellValue(group.id, value.id, year, rawRow
                                        ? String(inputNum)
                                        : String((inputNum * scaleDivisor(displayScale)) / fxMultiplier));
                                      setEditingCell(null);
                                    }
                                  }}
                                  readOnly={isReadonly}
                                  onClick={(e) => e.stopPropagation()}
                                  onPaste={isReadonly ? undefined : (e) => handleValueCellPaste(e, group.id, value.id, yi)}
                                  style={{ width: "100%", textAlign: "right", border: "none", background: isReadonly ? "#f3f4f6" : "transparent", fontSize: 13, color: val < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 28, cursor: isReadonly ? "default" : "text" }}
                                />
                              </td>
                              );
                            })}
                          {isNoTotalRow(value)
                            ? <td style={{ ...TD, padding: "4px 12px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>—</td>
                            : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "4px 12px", textAlign: "right", fontSize: 13, fontWeight: 600, color: t < 0 ? "#DC2626" : "#1f2937" }}>{isPercentRow(value) ? rawFmt(t) : displayFmt(t)}</td>; })()
                          }
                        </tr>
                      );
                    };

                    const regularEditable = editable.filter((v) => v.lineType !== "ONGOING_CAPEX");
                    const ongoingEditable = editable.filter((v) => v.lineType === "ONGOING_CAPEX");
                    const hasOngoing      = ongoingEditable.length > 0;
                    const calcInitial     = calc.filter((v) => v.lineType === "INITIAL_CAPEX");
                    const calcRest        = calc.filter((v) => v.lineType !== "INITIAL_CAPEX");

                    const renderCalcRow = (value: ValueRow) => (
                      <tr key={value.id} data-line-id={value.id} style={{ background: value.id === highlightLineId ? "#fef08a" : "#f3f4f6", transition: "background 0.4s", boxShadow: value.id === highlightLineId ? "inset 0 0 0 2px #f59e0b" : undefined }}>
                        <td colSpan={3} style={{ ...TD, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#111" }}>{value.name}</td>
                        {data.years.map((year: number) => {
                          const val = value.yearValues[year] ?? 0;
                          return (<td key={year} style={{ ...TD, padding: "8px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111" }}>{isPercentRow(value) ? rawFmt(val) : displayFmt(val)}</td>);
                        })}
                        {isNoTotalRow(value)
                          ? <td style={{ ...TD, padding: "8px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#111" }}>—</td>
                          : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "8px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111" }}>{isPercentRow(value) ? rawFmt(t) : displayFmt(t)}</td>; })()
                        }
                      </tr>
                    );

                    return (<>
                      {(hasOngoing ? regularEditable : editable).map((v, i) => renderEditable(v, i))}
                      {!isReadonly && group.isNewLineRequired !== "N" && (
                        <tr key="add-btn"><td colSpan={3 + numYears + 1} style={{ padding: "6px 10px", borderBottom: "1px solid #e5e7eb" }}><button type="button" onClick={() => addValueRow(group.id)} style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: BRAND, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, height: 15 }}>+ Add {group.name} Line</button></td></tr>
                      )}
                      {hasOngoing ? (<>
                        {calcInitial.map(renderCalcRow)}
                        {ongoingEditable.map((v, i) => renderEditable(v, regularEditable.length + i))}
                        {calcRest.map(renderCalcRow)}
                      </>) : calc.map((value: ValueRow) => (
                        <tr key={value.id} data-line-id={value.id} style={{ background: value.id === highlightLineId ? "#fef08a" : "#f3f4f6", transition: "background 0.4s", boxShadow: value.id === highlightLineId ? "inset 0 0 0 2px #f59e0b" : undefined }}>
                          <td colSpan={3} style={{ ...TD, padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#111" }}>{value.name}</td>
                          {data.years.map((year: number) => {
                            const val = value.yearValues[year] ?? 0;
                            return (<td key={year} style={{ ...TD, padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111" }}>{isPercentRow(value) ? rawFmt(val) : displayFmt(val)}</td>);
                          })}
                          {isNoTotalRow(value)
                            ? <td style={{ ...TD, padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#111" }}>—</td>
                            : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111" }}>{isPercentRow(value) ? rawFmt(t) : displayFmt(t)}</td>; })()
                          }
                        </tr>
                      ))}
                    </>);
                  })()}
                </React.Fragment>
              ))}

            </tbody>
          </table>
      </div>

    </div>
  );
}
