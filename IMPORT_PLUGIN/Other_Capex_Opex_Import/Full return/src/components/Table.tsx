import React, { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, RefreshCw, Save, Check, Calendar } from "lucide-react";
import { getAppConfig, type AppConfig } from "../config/app-config";
import { subscribeAllActions, publishToBridge } from "../lib";
import type {} from "../types/fin-eval-bridge";
import {
  getFinancialData,
  importFinancialData,
  migrateFinEvalStaging,
  clearCachedToken,
  isServerDrivenSection,
  getAccountCodes,
  getCurrencyExchangeRate,
  type AccountCode,
  type ApiHeader,
  type Group,
  type PivotTableData,
  type ValueRow,
  type YearValues,
  computeDisplayMultiplier,
} from "../api/financial-api";
import { deleteLine, deleteSection } from "../api/delete-api";
import KpiPanel from "./KpiPanel";
import Toast, { type ToastState } from "./Toast";
import {
  SCALES,
  NUMBER_FORMATS,
  DATE_FORMATS,
  applyScale,
  unapplyScale,
  formatNumber,
  formatDate,
  decimalsForScale,
  type Scale,
  type NumberFormatKey,
  type DateFormatKey,
} from "../lib/format";

const BRAND        = "#111827";
const DARK_HEADER  = "#2d3748";
// P&L sub-sections are indented by this much; the gutter stays white so the
// section bar, delete icon and line items all start at the indented edge.
const SUB_INDENT   = 16;
// Width of the leading delete-icon column (first <col> in the colgroup).
const ICON_COL     = 36;
// First cell of a sub-section row: paints the indent gutter white and draws
// the row's bottom rule only to the right of it, so no grid line runs
// through the empty gutter. `bg` is the cell's own fill (if any).
const subGutter = (on: boolean, bg = "transparent", line = "#e5e7eb"): CSSProperties => (on ? {
  borderBottom: "none",
  background: `linear-gradient(#fff, #fff) left top / ${SUB_INDENT}px 100% no-repeat, linear-gradient(${line}, ${line}) right bottom / calc(100% - ${SUB_INDENT}px) 1px no-repeat, ${bg}`,
} : {});
const DARK_TOGGLE  = "#1e2433";

const CURRENCY_LABELS: Record<string, string> = {
  CAD: "$ CAD", USD: "$ USD", EUR: "€ EUR",
  GBP: "£ GBP", AUD: "A$ AUD", JPY: "¥ JPY",
  SGD: "$ SGD", INR: "₹ INR", CNY: "¥ CNY",
};
const currencyLabel = (code: string): string => CURRENCY_LABELS[code.toUpperCase()] ?? code;

const toggleBtn = (active: boolean, first: boolean): React.CSSProperties => ({
  padding: "5px 14px", border: "none",
  borderLeft: first ? "none" : "1px solid #e5e7eb",
  cursor: "pointer", fontSize: 12, fontWeight: 700,
  background: active ? DARK_TOGGLE : "#fff",
  color:      active ? "#fff" : "#6b7280",
  transition: "background 0.15s, color 0.15s",
  whiteSpace: "nowrap",
});

const FIN_CELL_CLASS = "fin-cell-input";

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
                      background: selected ? "#e5e7eb" : "#fff",
                      color: selected ? "#111827" : "#1f2937",
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

/* API types, transformApiData, and buildPutPayload live in src/api/financial-api.ts */

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

// P&L is a parent section: Operating Expense and Returns Analysis render
// nested beneath it as sub-sections and collapse along with it. A section is
// a P&L child when the API links it via its parent id, or by name/type.
const isPnlGroup = (g: Group): boolean =>
  ["PL", "PANDL", "PROFITANDLOSS", "REVENUE"].includes(tok(g.name)) ||
  tok(g.sectionType) === "PLINVESTMENTOPEX" || tok(g.sectionType) === "REVENUE";
// Operating Expense (Full Return) and OPEX Costs (Prod Dev template naming)
// both nest under P&L, along with Returns Analysis.
const PNL_CHILD_TOKENS = new Set([
  "OPERATINGEXPENSE", "OPERATINGEXPENSES", "OPEXCOST", "OPEXCOSTS",
  "RETURNANALYSIS", "RETURNSANALYSIS",
]);
const isPnlChildGroup = (g: Group, pnl: Group | undefined): boolean =>
  !!pnl && g.id !== pnl.id && (
    (g.parentSectionId != null && g.parentSectionId === pnl.sectionId) ||
    PNL_CHILD_TOKENS.has(tok(g.name)) || PNL_CHILD_TOKENS.has(tok(g.sectionType))
  );
// Render order only (state order is untouched): P&L sub-sections move directly
// under P&L, keeping their relative order.
const orderWithSubSections = (groups: Group[]): { ordered: Group[]; pnl?: Group } => {
  const pnl = groups.find(isPnlGroup);
  if (!pnl) return { ordered: groups };
  const children = groups.filter((g) => isPnlChildGroup(g, pnl));
  const rest     = groups.filter((g) => !isPnlChildGroup(g, pnl));
  const at       = rest.indexOf(pnl) + 1;
  return { ordered: [...rest.slice(0, at), ...children, ...rest.slice(at)], pnl };
};

// Amortization Period / Date Placed in Service columns are only editable on
// Capital Investment lines; every other section shows them disabled.
const isCapitalInvestmentGroup = (g: Group): boolean =>
  tok(g.sectionType) === "CAPITALINVESTMENT" || tok(g.name) === "CAPITALINVESTMENT";
// Those two columns are only rendered for Capital Investment. Every other
// section gives their 2 grid columns to Account (or to Line Item when the
// section has no Account column).
const assetSpan = (g: Group): number => (isCapitalInvestmentGroup(g) ? 0 : 2);

// A "Revenue" section is labelled "P&L" on screen — display only, the saved
// section_name is left untouched.
const sectionDisplayName = (g: Group): string =>
  tok(g.name) === "REVENUE" || tok(g.sectionType) === "REVENUE" ? "P&L" : g.name;

// Amortization period: whole months only, max 4 digits (0–9999), no decimals.
const isValidMonthsInput = (s: string): boolean => s === "" || /^\d{0,4}$/.test(s);

/* Front-end subtotal / total recompute.
   For each section: calculated lines (isCalculated === "Y") get their year
   values set to the per-year sum of editable (isCalculated !== "Y") lines.
   Every line's rowTotal is set to the sum of its own year values.
   Server-driven sections (e.g. Cash Flow) are left untouched — their
   row values are owned by the backend and must not be overwritten by a
   local sum on cell edits. */
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
      if (v.isCalculated === "Y") {
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
  const [displayScale,  setDisplayScale]  = useState<Scale>("K");
  const [numberFormat,  setNumberFormat]  = useState<NumberFormatKey>("US");
  const [dateFormat,    setDateFormat]    = useState<DateFormatKey>("DMY");

  const [savingDraft,  setSavingDraft]  = useState<boolean>(false);
  const [validating,   setValidating]   = useState<boolean>(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);
  const [toast,        setToast]        = useState<ToastState>(null);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [errorNav,          setErrorNav]          = useState<{ groupId: string; valueId?: string } | null>(null);
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);

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
  const [stripTooltip,       setStripTooltip]       = useState<"currency" | "scale" | null>(null);
  const [stripTooltipPos,    setStripTooltipPos]    = useState<DOMRect | null>(null);
  const [fxRate,             setFxRate]             = useState<number | null>(null);
  const [headerPinned,     setHeaderPinned]     = useState<boolean>(false);
  const [headerHeight,     setHeaderHeight]     = useState<number>(0);
  const [leftOffset,       setLeftOffset]       = useState<number>(0);
  const [containerWidth,   setContainerWidth]   = useState<number>(0);
  const dbYearsRef   = useRef<Set<number>>(new Set());
  const headerRef    = useRef<HTMLDivElement>(null);
  const sentinelRef  = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Live USD→local exchange rate (usd_fbr) ──────────────────────
     Fetched once per local_currency (skipped for USD) — it drives both the
     table/KPI conversion and the FX rate strip. */
  const localCurrencyForFx = (rawHeader?.local_currency || "").toUpperCase();
  useEffect(() => {
    if (!localCurrencyForFx || localCurrencyForFx === "USD") { setFxRate(null); return; }
    let cancelled = false;
    const cfg = getAppConfig();
    getCurrencyExchangeRate(cfg, localCurrencyForFx)
      .then((rate) => { if (!cancelled) setFxRate(rate?.usd_fbr ?? null); })
      .catch((e) => { console.error("[fx-rate] failed to load exchange rate:", e); if (!cancelled) setFxRate(null); });
    return () => { cancelled = true; };
  }, [localCurrencyForFx]);

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
      const result = await getFinancialData(cfg);
      setData(result.table);
      setRawHeader(result.rawHeader);
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

  // Guards against React.StrictMode's dev-only double-invoke of this effect,
  // which would otherwise fire getFinancialData() twice on initial mount.
  const didInitialLoadRef = useRef(false);
  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    loadData();
  }, [loadData]);

  // Pre-load account codes for any section that already has saved account values
  useEffect(() => {
    if (!data) return;
    data.groups.forEach((g) => {
      if (g.sectionType && !isPnlGroup(g) && g.values.some((v) => v.accountId)) {
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
      const result = await getFinancialData(cfg);
      const numId  = parseInt(targetId, 10);
      const fresh  = result.table.groups.find((g) =>
        (Number.isFinite(numId) && g.sectionId === numId) ||
        tok(g.sectionType) === tok(targetId) ||
        tok(g.name)        === tok(targetId),
      );
      setData((prev) => {
        if (!prev) return result.table;
        if (!fresh) return prev;
        // Match on sectionType/name first — sectionId is unreliable here:
        // unsaved (template) sections all carry sectionId === undefined, so an
        // id-only comparison either merges unrelated sections together or fails
        // to recognize a section that just got its first real id from the
        // backend, leaving a stale duplicate copy behind in state.
        const matchesFresh = (g: Group): boolean =>
          (fresh.sectionId != null && g.sectionId === fresh.sectionId) ||
          (!!g.sectionType && tok(g.sectionType) === tok(fresh.sectionType)) ||
          tok(g.name) === tok(fresh.name);
        const exists = prev.groups.some(matchesFresh);
        return {
          ...prev,
          groups: exists
            ? prev.groups.map((g) =>
                matchesFresh(g)
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

  /* ── Validation error banner: click-to-navigate + highlight ─────
     Expands the offending section, scrolls to the specific line (or
     the section header when there's no line-level target), and flashes
     a yellow highlight on the line so the user can find where to edit. */
  useEffect(() => {
    if (!errorNav) return;
    setData((p) => p ? { ...p, groups: p.groups.map((g) => g.id === errorNav.groupId ? { ...g, expanded: true } : g) } : p);

    const selector = errorNav.valueId
      ? `[data-error-line-id="${errorNav.valueId}"]`
      : `[data-error-group-id="${errorNav.groupId}"]`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(selector)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));

    if (!errorNav.valueId) return;
    setHighlightedLineId(errorNav.valueId);
    const t = setTimeout(() => setHighlightedLineId(null), 4000);
    return () => clearTimeout(t);
  }, [errorNav]);

  /* ── Silent re-fetch — replace local state with the server result. ──
     After a successful save/validate the backend holds the source of
     truth and returns every section and line (calculated/template rows
     included, even empty ones), so we adopt it wholesale — exactly what
     a page reload does. We only carry over each section's expanded/
     collapsed state so the view doesn't jump. */
  const silentRefetch = useCallback(async (cfg: AppConfig, label: string): Promise<void> => {
    try {
      const refetched = await getFinancialData(cfg);
      console.log(`[${label}] re-fetch groups:`, refetched.table.groups.length,
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
    } catch (e) {
      console.error(`[${label}] re-fetch failed`, e);
    }
  }, []);

  /* ── Validate ─────────────────────────────────────────────────
     PUT the current state to the /import endpoint, then re-fetch. */
  const validateDraft = useCallback(async (): Promise<void> => {
    if (!data || !rawHeader) return;
    const cfg = getAppConfig();
    if (!cfg.proposal_id) {
      setToast({
        kind: "error",
        message: "Cannot validate — Proposal ID is required. Please create a Proposal and click Save Model.",
        action: {
          label: "Go to Proposal Setup",
          onClick: () => {
            (document.getElementById("Proposal_Setup_btn") as HTMLButtonElement | null)?.click();
          },
        },
      });
      return;
    }
    setValidating(true);
    setSaveError(null);
    try {
      const response = await importFinancialData(cfg, data, rawHeader);
      setToast({
        kind: "success",
        message: ((response as any).apiMessage || response.api_message || "") || "Financial evaluation validated successfully.",
      });
      await silentRefetch(cfg, "validateDraft");
    } catch (e: unknown) {
      clearCachedToken();
      const msg = e instanceof Error ? e.message : "Unknown validation error";
      setSaveError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setValidating(false);
    }
  }, [data, rawHeader, silentRefetch]);

  /* ── Save Draft ──────────────────────────────────────────────
     POST to finEvalStagingMigrate to migrate staged data, then re-fetch. */
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
    if (!cfg.file_id) {
      setToast({ kind: "error", message: "Cannot save — no file_id available for this proposal." });
      return;
    }
    setSavingDraft(true);
    setSaveError(null);
    try {
      const response = await migrateFinEvalStaging(cfg, cfg.file_id);
      setToast({
        kind: "success",
        message: ((response as any).apiMessage || response.api_message || "") || "Financial evaluation saved successfully.",
      });
      const saveEvent = new CustomEvent("tool:fin_eval_saved", { detail: { proposalId: cfg.proposal_id } });
      console.log("[fin_eval] dispatching tool:fin_eval_saved", saveEvent.detail);
      window.dispatchEvent(saveEvent);
      publishToBridge({ type: "PLUGIN_MSG", source: "editor", target: "chatbot", action: "fin-eval:saved", payload: { proposalId: cfg.proposal_id, method: "POST" } });
      await silentRefetch(cfg, "saveDraft");
    } catch (e: unknown) {
      clearCachedToken();
      const msg = e instanceof Error ? e.message : "Unknown save error";
      setSaveError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setSavingDraft(false);
    }
  }, [data, rawHeader, silentRefetch]);

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

  // Only one toast-style notification should be visible at a time.
  useEffect(() => { if (toast) setPasteToast(null); }, [toast]);
  useEffect(() => { if (pasteToast) setToast(null); }, [pasteToast]);

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
  // fxRate (usd_fbr) means "1 USD = fxRate <local currency>" — multiply (not
  // divide) to convert a stored USD value to local display. USD display → ×1.
  // Save path divides by fxMultiplier to convert back to USD for storage.
  const fxMultiplier: number = (() => {
    if (!rawHeader) return 1;
    const local   = (rawHeader.local_currency   || "USD").toUpperCase();
    const display = (rawHeader.display_currency || local).toUpperCase();
    return computeDisplayMultiplier(display, local, fxRate);
  })();

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

  // Tax Rate % — no currency conversion, no scale conversion, no total
  const TAX_RATE_DISPLAY_IDS = new Set(["TAXRATE", "TAXRATEPCT", "TAXRATEPERCENT"]);
  const isTaxRateRow = (v: ValueRow): boolean => matchesAny(v, TAX_RATE_DISPLAY_IDS);

  // Any percentage row — used to enforce 0–100 / 2-decimal input rules.
  // Covers Tax Rate %, EBIT Margin %, Post Tax Return %, Gross Margin %, etc.,
  // plus any custom row whose display name carries a "%".
  const PERCENT_DISPLAY_IDS = new Set([
    "TAXRATE", "TAXRATEPCT", "TAXRATEPERCENT",
    "EBITMARGIN", "EBITMARGINPCT", "EBITMARGINPERCENT",
    "POSTTAXRETURN", "POSTTAXRETURNPCT", "POSTTAXRETURNPERCENT",
    "GROSSMARGIN", "GROSSMARGINPCT", "GROSSMARGINPERCENT",
  ]);
  const isPercentRow = (v: ValueRow): boolean =>
    matchesAny(v, PERCENT_DISPLAY_IDS) || /%/.test(v.name ?? "");

  // Rows shown as-is, with no fx / K-M-B scale: Tax Rate %, and any line whose
  // name contains "%" (EBIT Margin %, custom % rows, …).
  const isUnscaledRow = (v: ValueRow): boolean => isTaxRateRow(v) || /%/.test(v.name ?? "");

  // NON_FINANCIAL lines (e.g. custom counts/metrics) also bypass fx/scale, like Tax Rate %.
  const isNonFinancialRow = (v: ValueRow): boolean => tok(v.lineIdentifier) === "NONFINANCIAL";

  // Raw formatter: no fx, no scale — used for percentage (% in the name) and
  // NON_FINANCIAL rows. Fixed 2 decimals, fully independent of the K/M/B toggle:
  // tying the decimals to the scale made "EBIT Margin %" read 23 at K but
  // 23.45 at B, i.e. it still looked scaled.
  const rawFmt = (n: number): string => {
    if (!n) return "—";
    const abs = Math.abs(n);
    // A non-zero value that rounds to zero at the shown decimals (e.g. 0.001 at 2dp)
    // must still read as empty, same as a true zero — not "0.00".
    if (Number(abs.toFixed(2)) === 0) return "—";
    const formatted = formatNumber(abs, numberFormat);
    return n < 0 ? `(${formatted})` : formatted;
  };

  const displayFmt = (n: number): string => {
    if (!n) return "—";
    const v = applyScale(n * fxMultiplier, displayScale);
    const abs = Math.abs(v);
    const decimals = decimalsForScale(displayScale);
    if (Number(abs.toFixed(decimals)) === 0) return "—";
    const formatted = formatNumber(abs, numberFormat, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return v < 0 ? `(${formatted})` : formatted;
  };

  const sectionTree = orderWithSubSections(data?.groups ?? []);
  const isSubSection = (g: Group): boolean => isPnlChildGroup(g, sectionTree.pnl);
  // Shown on the collapsed P&L header so hidden sub-sections aren't missed.
  const pnlSubCount = sectionTree.ordered.filter(isSubSection).length;

  /* ── Amortization Period / Date Placed in Service cells ──────── */
  const updateLineAsset = (gId: string, vId: string, patch: Partial<ValueRow>): void =>
    setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, values: g.values.map((v) => v.id === vId ? { ...v, ...patch } : v) } : g) }) : p);

  // Date Placed in Service follows the toolbar's date-format picker
  // (default dd-mm-yyyy). The stored / API value stays ISO yyyy-mm-dd.
  const fmtCellDate = (iso: string): string => (iso ? (/^\d{4}-\d{2}-\d{2}/.test(iso) ? formatDate(`${iso.slice(0, 10)}T00:00:00`, dateFormat) : iso) : "");
  const dateFormatHint: string = (DATE_FORMATS.find((f) => f.value === dateFormat)?.label ?? "dd-mm-yyyy");

  const renderAssetCells = (group: Group, value: ValueRow, padding: string): React.ReactElement | null => {
    if (!isCapitalInvestmentGroup(group)) return null;
    const enabled = !isReadonly && isCapitalInvestmentGroup(group) && value.isCalculated !== "Y";
    const amort   = value.amortizationPeriod ?? "";
    const placed  = value.datePlacedInService ?? "";
    const style: CSSProperties = {
      width: "100%", height: 28, border: "none", outline: "none", borderRadius: 4, padding: "0 6px", boxSizing: "border-box",
      fontSize: 12, color: "#1f2937", background: "transparent", cursor: "text",
    };
    // Disabled: the whole cell is filled grey, same as the calculated rows
    // (#f3f4f6) — no inner box; a saved value, if any, shows as plain text.
    if (!enabled) return (<>
      <td style={{ ...TD, padding: "4px 14px", background: "#f3f4f6", fontSize: 12, color: "#1f2937", textAlign: "right", cursor: "not-allowed" }}>{amort}</td>
      <td style={{ ...TD, padding: "4px 14px", background: "#f3f4f6", fontSize: 12, color: "#1f2937", cursor: "not-allowed" }}>{fmtCellDate(placed)}</td>
    </>);
    return (<>
      <td style={{ ...TD, padding }}>
        <input type="text" inputMode="numeric" value={amort} placeholder="Months"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { const next = e.target.value; if (!isValidMonthsInput(next)) return; updateLineAsset(group.id, value.id, { amortizationPeriod: next === "" ? null : Number(next) }); }}
          style={{ ...style, textAlign: "right" }}
        />
      </td>
      <td style={{ ...TD, padding }}>
        {/* A native date input can't take a custom display format, so the
            formatted date shows in a read-only text box and a transparent
            native date input on top supplies the calendar picker. */}
        <div style={{ position: "relative" }}>
          <input type="text" readOnly tabIndex={-1} value={fmtCellDate(placed)} placeholder={dateFormatHint}
            style={{ ...style, paddingRight: 28, cursor: "pointer" }}
          />
          {/* Same calendar icon as the Financial Parameters date field. */}
          <Calendar size={14}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
          />
          <input type="date" aria-label="Date Placed in Service" value={placed.slice(0, 10)}
            onClick={(e) => {
              e.stopPropagation();
              try { e.currentTarget.showPicker?.(); } catch { /* picker opens on focus instead */ }
            }}
            onChange={(e) => updateLineAsset(group.id, value.id, { datePlacedInService: e.target.value || null })}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0, margin: 0 }}
          />
        </div>
      </td>
    </>);
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

  /* ── Validation errors surfaced by the GET API (header/section/line
     validationStatus + errorMessage) — rendered as a banner above the
     KPI panel; clicking an entry expands + scrolls to + highlights the
     offending section/line (see the errorNav effect above). */
  const validationErrors: { id: string; message: string; groupId?: string; valueId?: string }[] = [];
  if (rawHeader?.validation_status === "INVALID" && rawHeader.error_message) {
    validationErrors.push({ id: "header", message: rawHeader.error_message });
  }
  data.groups.forEach((g) => {
    if (g.validationStatus === "INVALID" && g.errorMessage) {
      validationErrors.push({ id: `sec-${g.id}`, message: g.errorMessage, groupId: g.id });
    }
    g.values.forEach((v) => {
      if (v.validationStatus === "INVALID" && v.errorMessage) {
        validationErrors.push({ id: `line-${v.id}`, message: v.errorMessage, groupId: g.id, valueId: v.id });
      }
    });
  });

  /* ── Arrow-key cell navigation ───────────────────────────────
     Every navigable cell (line name, year value, row total — editable or
     read-only/calculated) shares the FIN_CELL_CLASS. A flat, row-major
     DOM query plus a fixed row length (name + years + total) lets Left/
     Right fall through to normal caret movement until the caret hits the
     text edge, and Up/Down jump by exactly one row. */
  const navRowLength = numYears + 2;
  const handleCellArrowNav = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const { key } = e;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") return;

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(`.${FIN_CELL_CLASS}`));
    const i = inputs.indexOf(e.currentTarget);
    if (i === -1) return;

    if (key === "ArrowUp" || key === "ArrowDown") {
      const target = inputs[key === "ArrowUp" ? i - navRowLength : i + navRowLength];
      if (target) { e.preventDefault(); target.focus(); }
      return;
    }

    const el    = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end   = el.selectionEnd ?? el.value.length;
    const atStart = start === 0 && end === 0;
    const atEnd   = start === el.value.length && end === el.value.length;

    if (key === "ArrowLeft" && atStart && inputs[i - 1]) { e.preventDefault(); inputs[i - 1].focus(); }
    else if (key === "ArrowRight" && atEnd && inputs[i + 1]) { e.preventDefault(); inputs[i + 1].focus(); }
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
  const toggleGroup = (id: string): void => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === id ? { ...g, expanded: !g.expanded } : g) }) : p);
  const toggleAll   = (): void => { const n = !allExpanded; setAllExpanded(n); setData((p) => p ? ({ ...p, groups: p.groups.map((g) => ({ ...g, expanded: n })) }) : p); };
  // A new line takes its section's kind: NON_FINANCIAL when every existing
  // editable line in the section is NON_FINANCIAL (e.g. Additional Metrics),
  // otherwise FINANCIAL. Without this, a row added or pasted into a
  // non-financial section was created FINANCIAL and got K/M/B-scaled.
  const newRowIdentifier = (g: Group): string => {
    const editable = g.values.filter((v) => v.isCalculated !== "Y");
    if (editable.length > 0) return editable.every((v) => tok(v.lineIdentifier) === "NONFINANCIAL") ? "NON_FINANCIAL" : "FINANCIAL";
    const kind = `${g.sectionType ?? ""} ${g.name ?? ""}`.toUpperCase().replace(/[^A-Z ]/g, "");
    return /NONFINANCIAL|NON FINANCIAL|ADDITIONAL ?METRIC/.test(kind) ? "NON_FINANCIAL" : "FINANCIAL";
  };

  const addValueRow = (gId: string): void => setData((p) => p ? ({
    ...p,
    groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: [...g.values, { ...blankRow(p), lineIdentifier: newRowIdentifier(g) }] }, p.years) : g),
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
        const pastedIdent = newRowIdentifier(g);
        const newRows: ValueRow[] = parsed.map((r): ValueRow => { const yv: YearValues = {}; p.years.forEach((y, i) => { yv[y] = r.values[i] ?? 0; }); return { id: generateId(), name: r.name, yearValues: yv, lineType: "CUSTOM", lineIdentifier: pastedIdent, isCalculated: "N", isCustom: "Y", status: "ACTIVE", languageCode: "EN" }; });
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
                style={{ padding: "6px 14px", background: "#fff", color: "#000", border: "1px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: deletingRow ? "not-allowed" : "pointer" }}
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
                style={{ padding: "6px 14px", background: "#fff", color: "#000", border: "1px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: deletingRow ? "not-allowed" : "pointer", opacity: deletingRow ? 0.7 : 1 }}
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
                style={{ padding: "6px 14px", background: "#fff", color: "#000", border: "1px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removeYear(confirmDeleteYear.year)}
                style={{ padding: "6px 14px", background: "#fff", color: "#000", border: "1px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
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
              onClick={validateDraft}
              disabled={validating || loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #000000b8", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#fff", color: "#000", cursor: validating || loading ? "not-allowed" : "pointer", opacity: validating || loading ? 0.7 : 1 }}
            >
              <Check size={14} style={validating ? { animation: "spin 1s linear infinite" } : {}} />
              {validating ? "Validating…" : "Validate"}
            </button>
            )}
            {!isReadonly && (
            <button
              id="fin-eval-save-model-btn"
              type="button"
              onClick={saveDraft}
              disabled={savingDraft || loading || validationErrors.length > 0}
              title={validationErrors.length > 0 ? "Resolve all validation errors before saving" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "1px solid #000000b8", borderRadius: 6, fontSize: 13, fontWeight: 700, background: "#fff", color: "#000", cursor: savingDraft || loading || validationErrors.length > 0 ? "not-allowed" : "pointer", opacity: savingDraft || loading ? 0.7 : validationErrors.length > 0 ? 0.4 : 1 }}
            >
              <Save size={14} style={savingDraft ? { animation: "spin 1s linear infinite" } : {}} />
              {savingDraft ? "Saving…" : "Save Model"}
            </button>
            )}
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

          const handleScaleChange = (scale: Scale) => {
            setDisplayScale(scale);
            const cfg = getAppConfig();
            const lbl = SCALES.find((s) => s.value === scale)?.label ?? scale;
            const evt = new CustomEvent("tool:fin_eval_scale_changed", {
              detail: { scale, denomination: scale, label: lbl, proposalId: cfg.proposal_id },
            });
            console.log("[fin_eval] dispatching tool:fin_eval_scale_changed", evt.detail);
            window.dispatchEvent(evt);
          };

          const infoIcon = (kind: "currency" | "scale", tooltipText: string) => (
            <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { setStripTooltipPos(e.currentTarget.getBoundingClientRect()); setStripTooltip(kind); }}
              onMouseLeave={() => setStripTooltip(null)}
            >
              <span style={{ width: 15, height: 15, borderRadius: 999, border: "1.5px solid #9ca3af", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, cursor: "default", userSelect: "none" }}>i</span>
              {stripTooltip === kind && stripTooltipPos && createPortal(
                // Overlays the page via a portal so the tooltip never inflates the scrollable strip.
                <span style={{ position: "fixed", left: stripTooltipPos.right + 6, top: stripTooltipPos.top - 4, background: DARK_TOGGLE, color: "#fff", padding: "6px 10px", borderRadius: 4, fontSize: 12, whiteSpace: "normal", width: 360, lineHeight: 1.5, zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,.25)", pointerEvents: "none" }}>
                  {tooltipText}
                </span>,
                document.body
              )}
            </div>
          );

          return (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Currency label + toggle + info */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>CURRENCY</span>
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
              {infoIcon("scale", "Switch the denomination for all financial values. Values arrive in thousands: K = thousands (as-is), M = millions (÷1,000), B = billions (÷1,000,000).")}

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Number label + select */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>NUMBER</span>
              <select
                value={numberFormat}
                onChange={(e) => setNumberFormat(e.target.value as NumberFormatKey)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                {NUMBER_FORMATS.map((nf) => (
                  <option key={nf.value} value={nf.value}>{nf.label}</option>
                ))}
              </select>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Date label + select */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>DATE</span>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormatKey)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.value} value={df.value}>{df.label}</option>
                ))}
              </select>

              {/* FX rate reference display — only for non-USD local currency */}
              {local !== "USD" && (
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 11, color: "#374151", lineHeight: 1.5 }}>
                  <span>1 {local} = {fxRate ? (1 / fxRate).toFixed(4) : "—"} USD</span>
                  <span>1 USD = {fxRate != null ? fxRate.toFixed(4) : "—"} {local}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Validation errors banner ── */}
      {validationErrors.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, margin: "12px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", color: "#b91c1c", fontWeight: 700, fontSize: 13 }}>
            <X size={16} />
            {validationErrors.length} validation error{validationErrors.length === 1 ? "" : "s"}
          </div>
          <div style={{ maxHeight: validationErrors.length > 4 ? 140 : undefined, overflowY: validationErrors.length > 4 ? "auto" : undefined }}>
            {validationErrors.map((err, i) => (
              <div
                key={err.id}
                onClick={() => err.groupId && setErrorNav({ groupId: err.groupId, valueId: err.valueId })}
                style={{ padding: "6px 16px", color: "#b91c1c", fontSize: 12, cursor: err.groupId ? "pointer" : "default" }}
              >
                <strong>{i + 1}.</strong> {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI panel (NPV / IRR / Payback / Metrics / Financial Parameters) ── */}
      {rawHeader && (
        <KpiPanel
          rawHeader={rawHeader}
          onChange={(patch) => setRawHeader((p) => p ? { ...p, ...patch } : p)}
          displayScale={displayScale}
          numberFormat={numberFormat}
          dateFormat={dateFormat}
          isReadonly={isReadonly}
          fxRate={fxRate}
        />
      )}

      {/* ── Table toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={toggleAll} style={{ padding: "3px 8px", fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>{allExpanded ? "Collapse All" : "Expand All"}</button>
        </div>
      </div>

      {/* ── Pivot table — sections remain in API display_order ── */}
      {(() => {
        const renderGroupTable = (groups: Group[]) => (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 36 }} />
                  <col style={{ width: colWidths.lineItem }} />
                  <col style={{ width: colWidths.account }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 150 }} />
                  {data.years.map((y) => <col key={y} style={{ minWidth: 120 }} />)}
                  <col style={{ width: 140 }} />
                </colgroup>
                <tbody>
                  {groups.map((group: Group) => (
                <React.Fragment key={group.id}>
                  {/* Section header */}
                  <tr data-section-id={group.sectionId} data-section-type={group.sectionType || group.id} data-error-group-id={group.id} style={{ background: isSubSection(group) ? "#fff" : DARK_HEADER, cursor: "pointer" }} onClick={() => toggleGroup(group.id)}>
                    {group.expanded ? (
                      <td colSpan={5 + numYears + 1} style={{ padding: isSubSection(group) ? `6px 0 0 ${SUB_INDENT}px` : "10px 14px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, ...(isSubSection(group) ? { background: DARK_HEADER, padding: "10px 14px" } : {}) }}>
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
                            >{sectionDisplayName(group) || "Enter section name"}</span>
                          )}
                          {!isReadonly && group.isCustom === "Y" && group.isMandatory !== "Y" && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, name: group.name, kind: "section" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", padding: 2 }} title="Delete section">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td colSpan={5 + numYears + 1} style={{ padding: isSubSection(group) ? `6px 0 0 ${SUB_INDENT}px` : "10px 14px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, ...(isSubSection(group) ? { background: DARK_HEADER, padding: "10px 14px" } : {}) }}>
                          <ChevronDown size={16} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>{sectionDisplayName(group)}{group.id === sectionTree.pnl?.id && pnlSubCount > 0 && (<span style={{ marginLeft: 10, fontSize: 10, fontWeight: 600, letterSpacing: 0, textTransform: "none", opacity: 0.75 }}>+{pnlSubCount} sub-section{pnlSubCount === 1 ? "" : "s"}</span>)}</span>
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
                      <th style={TH({ width: 28, background: "#e5e7eb", ...subGutter(isSubSection(group), "#e5e7eb", "#d1d5db") })} />
                      <th colSpan={group.isAccountRequired !== "Y" ? 2 + assetSpan(group) : 1} style={TH({ textAlign: "left", width: colWidths.lineItem, position: "relative", background: "#e5e7eb", paddingLeft: isSubSection(group) ? 12 + SUB_INDENT : 8 })}>
                        LINE ITEM
                        <div onMouseDown={(e) => startResize("lineItem", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                      </th>
                      {group.isAccountRequired === "Y" && (
                        <th colSpan={1 + assetSpan(group)} style={TH({ textAlign: "left", width: colWidths.account, position: "relative", background: "#e5e7eb" })}>
                          ACCOUNT <span style={{ color: "#ef4444" }}>*</span>
                          <div onMouseDown={(e) => startResize("account", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                        </th>
                      )}
                      {isCapitalInvestmentGroup(group) && (<>
                        <th style={TH({ textAlign: "left", background: "#e5e7eb" })}>AMORTIZATION PERIOD (MONTHS)</th>
                        <th style={TH({ textAlign: "left", background: "#e5e7eb" })}>DATE PLACED IN SERVICE</th>
                      </>)}
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
                      <th style={TH({ textAlign: "right", whiteSpace: "nowrap", width: 90, background: "#e5e7eb" })}>{group.sectionType === "CUSTOM" || tok(group.sectionType) === "BALANCESHEET" ? "" : "TOTAL"}</th>
                    </tr>
                  )}

                  {/* Line rows: editable lines → add button → calculated lines */}
                  {group.expanded && (() => {
                    const editable = group.values.filter((v) => v.isCalculated !== "Y");
                    const calc     = group.values.filter((v) => v.isCalculated === "Y");
                    // Bypass scale on this section's calculated/total rows only when every
                    // editable line in it is NON_FINANCIAL (mixed sections still scale).
                    const groupAllNonFinancial = editable.length > 0 && editable.every(isNonFinancialRow);
                    // User-added custom sections bypass K/M/B scale entirely, for every row.
                    const groupIsCustomSection = group.sectionType === "CUSTOM";
                    // Balance Sheet and custom sections never show a real cross-year TOTAL — always "—".
                    const groupNoTotal = groupIsCustomSection || tok(group.sectionType) === "BALANCESHEET";
                    const sub = isSubSection(group);

                    const renderEditable = (value: ValueRow, _idx: number) => {
                      const acKey = `${group.id}|${value.id}`;
                      const isAC  = activeAutocomplete === acKey;
                      const bg    = value.id === highlightedLineId ? "#FEF3C7" : "#fff";
                      // Non-custom lines (is_custom === "N") come from the template and
                      // must not have their name edited — on top of the read-only rule.
                      const nameLocked = isReadonly || value.isCustom === "N";
                      // Template line names render as a bold label (like the calculated
                      // rows) rather than a greyed-out input box.
                      const isTemplateName = value.isCustom === "N";
                      return (
                        <tr key={value.id} data-error-line-id={value.id} style={{ background: bg, transition: "background 0.3s" }}>
                          <td style={{ ...TD, padding: sub ? `4px 0 4px ${SUB_INDENT}px` : "4px 0", ...subGutter(sub), textAlign: "center", verticalAlign: "middle" }}>
                            {!isReadonly && value.isMandatory !== "Y" && value.isCustom !== "N" && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, vId: value.id, name: value.name, kind: "line" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                            )}
                          </td>
                          <td colSpan={group.isAccountRequired !== "Y" ? 2 + assetSpan(group) : 1} style={{ ...TD, padding: sub ? `4px 12px 4px ${12 + SUB_INDENT}px` : "4px 12px", position: "relative", overflow: "hidden" }} title={value.name}>
                            <input type="text"
                              className={FIN_CELL_CLASS}
                              value={isAC ? autocompleteSearch : value.name}
                              onChange={(e) => { if (value.isCustom === "N") return; updateValueName(group.id, value.id, e.target.value); if (isAC) setAutocompleteSearch(e.target.value); }}
                              onFocus={(e) => { if (value.isCustom === "N") { e.stopPropagation(); return; } e.stopPropagation(); setActiveAutocomplete(acKey); setAutocompleteSearch(value.name); }}
                              onPaste={(e) => { if (value.isCustom === "N") return; handleNamePaste(e, group.id, value.id); }}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={handleCellArrowNav}
                              placeholder="Enter line item name"
                              readOnly={nameLocked}
                              style={{ width: "100%", border: "none", background: isTemplateName ? "transparent" : (nameLocked ? "#f3f4f6" : "transparent"), fontSize: 12, fontWeight: isTemplateName ? 700 : 400, color: isTemplateName ? "#111827" : "#1f2937", outline: "none", textOverflow: "ellipsis", height: 28, cursor: nameLocked ? "default" : "text" }}
                            />
                          </td>
                          {group.isAccountRequired === "Y" && (
                          <td colSpan={1 + assetSpan(group)} style={{ ...TD, padding: "4px 12px", overflow: "visible" }}>
                            {isReadonly
                              ? <div style={{ fontSize: 12, color: "#6b7280", padding: "4px 6px", background: "#f3f4f6", borderRadius: 4, height: 28, display: "flex", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value.accountId || "—"}</div>
                              // P&L / Revenue lines take a free-text account instead of the
                              // account-code dropdown.
                              : isPnlGroup(group)
                                ? <input
                                    type="text"
                                    value={value.accountId ?? ""}
                                    onChange={(e) => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === group.id ? { ...g, values: g.values.map((v) => v.id === value.id ? { ...v, accountId: e.target.value || undefined } : v) } : g) }) : p)}
                                    placeholder="Enter account"
                                    style={{ width: "100%", height: 28, padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12, color: "#1f2937", outline: "none", boxSizing: "border-box" }}
                                  />
                              : <AccountCodeSelect
                                  value={value.accountId ?? ""}
                                  options={accountCodesBySection[group.sectionType ?? ""] ?? []}
                                  onFocus={() => loadAccountCodesForSection(group.sectionType ?? "")}
                                  onChange={(val) => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === group.id ? { ...g, values: g.values.map((v) => v.id === value.id ? { ...v, accountId: val || undefined } : v) } : g) }) : p)}
                                />
                            }
                          </td>
                          )}
                          {renderAssetCells(group, value, "4px 8px")}
                          {data.years.map((year: number, yi: number) => {
                            const val = value.yearValues[year] ?? 0;
                            const rawRow = isUnscaledRow(value) || isNonFinancialRow(value) || groupIsCustomSection;
                            const pctRow = isPercentRow(value);
                            return (
                              <td key={year} style={{ ...TD, padding: "4px 12px" }}>
                                <input type="text"
                                  className={FIN_CELL_CLASS}
                                  inputMode={pctRow ? "decimal" : undefined}
                                  value={editingCell?.gId === group.id && editingCell?.vId === value.id && editingCell?.year === year
                                    ? editingCell.raw
                                    : val === 0 ? "" : rawRow
                                      ? parseFloat(val.toFixed(3))
                                      : parseFloat(applyScale(val * fxMultiplier, displayScale).toFixed(decimalsForScale(displayScale)))}
                                  placeholder="—"
                                  onFocus={() => {
                                    const displayed = val === 0 ? "" : rawRow
                                      ? String(parseFloat(val.toFixed(3)))
                                      : String(parseFloat(applyScale(val * fxMultiplier, displayScale).toFixed(decimalsForScale(displayScale))));
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
                                        : String(unapplyScale(inputNum, displayScale) / fxMultiplier));
                                      setEditingCell(null);
                                    }
                                  }}
                                  readOnly={isReadonly}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={handleCellArrowNav}
                                  onPaste={isReadonly ? undefined : (e) => handleValueCellPaste(e, group.id, value.id, yi)}
                                  style={{ width: "100%", textAlign: "right", border: "none", background: isReadonly ? "#f3f4f6" : "transparent", fontSize: 13, color: val < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 28, cursor: isReadonly ? "default" : "text" }}
                                />
                              </td>
                              );
                            })}
                          {(isNoTotalRow(value) || groupNoTotal)
                            ? <td style={{ ...TD, padding: "4px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={groupNoTotal ? "" : "—"} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: "#1f2937", outline: "none", height: 28, cursor: "default" }} /></td>
                            : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "4px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={(isUnscaledRow(value) || isNonFinancialRow(value) || groupIsCustomSection) ? rawFmt(t) : displayFmt(t)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: t < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 28, cursor: "default" }} /></td>; })()
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
                      <tr key={value.id} style={{ background: "#f3f4f6" }}>
                        <td colSpan={3 + assetSpan(group)} style={{ ...TD, padding: sub ? `8px 12px 8px ${ICON_COL + 12 + SUB_INDENT}px` : "8px 12px", ...subGutter(sub) }}>
                          <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={value.name} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} />
                        </td>
                        {renderAssetCells(group, value, "4px 8px")}
                        {data.years.map((year: number) => {
                          const val = value.yearValues[year] ?? 0;
                          const rawRow = isUnscaledRow(value) || isNonFinancialRow(value) || groupAllNonFinancial || groupIsCustomSection;
                          return (
                            <td key={year} style={{ ...TD, padding: "8px 12px" }}>
                              <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={rawRow ? rawFmt(val) : displayFmt(val)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} />
                            </td>
                          );
                        })}
                        {(isNoTotalRow(value) || groupNoTotal)
                          ? <td style={{ ...TD, padding: "8px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={groupNoTotal ? "" : "—"} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} /></td>
                          : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); const rawRow = isUnscaledRow(value) || isNonFinancialRow(value) || groupAllNonFinancial || groupIsCustomSection; return <td style={{ ...TD, padding: "8px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={rawRow ? rawFmt(t) : displayFmt(t)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} /></td>; })()
                        }
                      </tr>
                    );

                    return (<>
                      {(hasOngoing ? regularEditable : editable).map((v, i) => renderEditable(v, i))}
                      {!isReadonly && group.isNewLineRequired !== "N" && (
                        <tr key="add-btn"><td colSpan={5 + numYears + 1} style={{ padding: sub ? `6px 10px 6px ${ICON_COL + 12 + SUB_INDENT - 8}px` : "6px 10px", borderBottom: "1px solid #e5e7eb", ...subGutter(sub) }}><button type="button" onClick={() => addValueRow(group.id)} style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#000", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, height: 15 }}>+ Add {sectionDisplayName(group)} Line</button></td></tr>
                      )}
                      {hasOngoing ? (<>
                        {calcInitial.map(renderCalcRow)}
                        {ongoingEditable.map((v, i) => renderEditable(v, regularEditable.length + i))}
                        {calcRest.map(renderCalcRow)}
                      </>) : calc.map((value: ValueRow) => (
                        <tr key={value.id} style={{ background: "#f3f4f6" }}>
                          <td colSpan={3 + assetSpan(group)} style={{ ...TD, padding: sub ? `10px 14px 10px ${ICON_COL + 12 + SUB_INDENT}px` : "10px 14px", ...subGutter(sub) }}>
                            <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={value.name} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} />
                          </td>
                          {renderAssetCells(group, value, "4px 8px")}
                          {data.years.map((year: number) => {
                            const val = value.yearValues[year] ?? 0;
                            const rawRow = isUnscaledRow(value) || isNonFinancialRow(value) || groupAllNonFinancial || groupIsCustomSection;
                            return (
                              <td key={year} style={{ ...TD, padding: "10px 14px" }}>
                                <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={rawRow ? rawFmt(val) : displayFmt(val)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} />
                              </td>
                            );
                          })}
                          {(isNoTotalRow(value) || groupNoTotal)
                            ? <td style={{ ...TD, padding: "10px 14px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={groupNoTotal ? "" : "—"} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} /></td>
                            : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); const rawRow = isUnscaledRow(value) || isNonFinancialRow(value) || groupAllNonFinancial || groupIsCustomSection; return <td style={{ ...TD, padding: "10px 14px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={rawRow ? rawFmt(t) : displayFmt(t)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} /></td>; })()
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
        );

        // P&L sub-sections render directly under P&L and hide while it is collapsed.
        return renderGroupTable(sectionTree.ordered.filter((g) => !(isSubSection(g) && !sectionTree.pnl?.expanded)));
      })()}

    </div>
  );
}
