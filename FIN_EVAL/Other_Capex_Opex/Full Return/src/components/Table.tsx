import React, { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, RefreshCw, Download, Upload, Save } from "lucide-react";
import { getAppConfig } from "../config/app-config";
import { subscribeAllActions, publishToBridge } from "../lib";
import type {} from "../types/fin-eval-bridge";
import {
  getFinancialData,
  saveFinancialData,
  clearCachedToken,
  isServerDrivenSection,
  getAccountCodes,
  type AccountCode,
  type ApiHeader,
  type Group,
  type PivotTableData,
  type ValueRow,
  type YearValues,
} from "../api/financial-api";
import { deleteLine, deleteSection } from "../api/delete-api";
import { getCurrencyExchangeRate } from "../api/exchange-rate-api";
import KpiPanel from "./KpiPanel";
import Toast, { type ToastState } from "./Toast";
import {
  SCALES,
  NUMBER_FORMATS,
  DATE_FORMATS,
  applyScale,
  unapplyScale,
  formatNumber,
  decimalsForScale,
  type Scale,
  type NumberFormatKey,
  type DateFormatKey,
} from "../lib/format";

const BRAND        = "#A5005A";
const DARK_HEADER  = "#2d3748";

const CURRENCY_LABELS: Record<string, string> = {
  CAD: "$ CAD", USD: "$ USD", EUR: "€ EUR",
  GBP: "£ GBP", AUD: "A$ AUD", JPY: "¥ JPY",
  SGD: "$ SGD", INR: "₹ INR", CNY: "¥ CNY",
};
const currencyLabel = (code: string): string => CURRENCY_LABELS[code.toUpperCase()] ?? code;

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
  const [menuPos, setMenuPos] = useState<{ left: number; width: number; top: number } | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((ac) => {
    const q = search.toLowerCase();
    return (
      ac.account_code.toLowerCase().includes(q) ||
      ac.account_name.toLowerCase().includes(q)
    );
  });

  // Position the options panel with fixed coordinates (computed from the
  // trigger's viewport rect) and render it in a portal on <body>. This lets
  // it escape any ancestor `overflow`/table clipping and sit above whatever
  // content happens to follow in the DOM (e.g. the next section's table),
  // while always opening below the trigger like a native select.
  const updatePosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({ left: rect.left, width: rect.width, top: rect.bottom + 2 });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

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

      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed", top: menuPos.top, left: menuPos.left,
            width: Math.max(menuPos.width, 240), zIndex: 10000,
            background: "#fff", border: "1px solid #d1d5db", borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
        </div>,
        document.body
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

// Regular (non-percent) numeric cells: digits, one leading "-", one "." — no letters.
const isValidNumericInput = (s: string): boolean =>
  s === "" || s === "-" || /^-?\d*\.?\d*$/.test(s);

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

// Statuses beyond which the proposal is locked for editing (DRAFT, REJECTED,
// NEEDS_REAPPROVAL remain editable; CLOSED is intentionally excluded here).
const READONLY_STATUSES = new Set(["SUBMITTED", "IN_PROGRESS", "APPROVED"]);
const isStatusReadonly = (status: string | null | undefined): boolean =>
  !!status && READONLY_STATUSES.has(status.toUpperCase());

/* ─────────────────────────── Component ──────────────────────────── */
export default function PivotTableWithAPI(): React.ReactElement {

  const [data,        setData]        = useState<PivotTableData | null>(null);
  const [rawHeader,   setRawHeader]   = useState<ApiHeader | null>(null);
  const isReadonly = getAppConfig().is_readonly || isStatusReadonly(rawHeader?.proposal_status);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const [accountCodesBySection, setAccountCodesBySection] = useState<Record<string, AccountCode[]>>({});
  const [displayScale,  setDisplayScale]  = useState<Scale>("K");
  const [numberFormat,  setNumberFormat]  = useState<NumberFormatKey>("US");
  const [dateFormat,    setDateFormat]    = useState<DateFormatKey>("DMY");
  const [fxRate,        setFxRate]        = useState<number | null>(null);
  const [fxLoading,     setFxLoading]     = useState<boolean>(false);
  const [fxError,       setFxError]       = useState<string | null>(null);

  const [savingDraft,  setSavingDraft]  = useState<boolean>(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);
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
  const [stripTooltip,       setStripTooltip]       = useState<"currency" | "scale" | null>(null);
  const [stripTooltipPos,    setStripTooltipPos]    = useState<DOMRect | null>(null);
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

  useEffect(() => { loadData(); }, [loadData]);

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

  /* ── Save Draft ──────────────────────────────────────────────
     PUT/POST the current state, re-fetch, then run the full-DCF
     engine so KPI, subtotals and cash flow rows are up to date. */
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
      const { method, response } = await saveFinancialData(cfg, data, rawHeader);
      setToast({
        kind: "success",
        message: ((response as any).apiMessage || response.api_message || "")
          || (method === "POST" ? "Financial evaluation created successfully." : "Financial evaluation saved successfully."),
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
        const refetched = await getFinancialData(cfg);
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

  // Live FX rate lookup — fetches the current USD conversion rate whenever the
  // proposal's local currency changes (skipped for USD, which needs no rate).
  useEffect(() => {
    const local = (rawHeader?.local_currency || "").toUpperCase();
    if (!local || local === "USD") { setFxRate(null); setFxLoading(false); setFxError(null); return; }
    let cancelled = false;
    setFxLoading(true); setFxError(null);
    (async () => {
      try {
        const cfg = getAppConfig();
        const result = await getCurrencyExchangeRate(cfg, local);
        const rate = result?.usd_fbr ?? null;
        if (cancelled) return;
        setFxRate(rate);
        // A missing/zero rate is a failed lookup, not a real 0 — say so rather
        // than rendering a guessed number (M&A -> FxCard).
        setFxError(rate != null && rate > 0 ? null : "rate unavailable");
      } catch (e) {
        console.error("[fin_eval] failed to fetch currency exchange rate:", e);
        if (!cancelled) { setFxRate(null); setFxError("rate unavailable"); }
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rawHeader?.local_currency]);

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
  // exchange_rate is stored as "1 CAD = X USD" (e.g. 0.735).
  // USD display → no conversion (×1).
  // CAD display → USD × (1/rate) = CAD (e.g. 3000 USD × 1/0.735 = 4082 CAD).
  // Save path divides by fxMultiplier to convert back to USD for storage.
  const fxMultiplier: number = (() => {
    if (!rawHeader) return 1;
    const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
    const rate    = rawHeader.exchange_rate || 0.7350;
    return display === "CAD" ? (1 / rate) : 1;
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

  // Raw formatter: no fx, no scale — used for pure percentage rows like Tax Rate %
  const rawFmt = (n: number): string => {
    if (!n) return "—";
    const abs = Math.abs(n);
    const formatted = formatNumber(abs, numberFormat);
    return n < 0 ? `(${formatted})` : formatted;
  };

  const displayFmt = (n: number): string => {
    if (!n) return "—";
    const v = applyScale(n * fxMultiplier, displayScale);
    const abs = Math.abs(v);
    const decimals = decimalsForScale(displayScale);
    const formatted = formatNumber(abs, numberFormat, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
  const increaseYears   = (): void => setData((p) => { if (!p) return p; const y = Math.max(...p.years) + 1; return { ...p, years: [...p.years, y], columnLabels: { ...p.columnLabels, [y]: `FY${String(y).slice(2)}` }, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => ({ ...v, yearValues: { ...v.yearValues, [y]: 0 } })) })) }; });
  const decreaseYears   = (): void => { if (data.years.length <= 1) return; setData((p) => { if (!p) return p; const y = p.years[p.years.length - 1]; const lbl = { ...p.columnLabels }; delete lbl[y]; return { ...p, years: p.years.slice(0, -1), columnLabels: lbl, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => { const nv = { ...v.yearValues }; delete nv[y]; return { ...v, yearValues: nv }; }) })) }; }); };
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
  const addGroup = (): void => setData((p) => p ? ({
    ...p,
    groups: [...p.groups, {
      id: generateId(), name: "", expanded: true,
      sectionType: "CUSTOM", isCustom: "Y", status: "ACTIVE", languageCode: "EN",
      displayOrder: p.groups.length + 1,
      values: [blankRow(p)],
    }],
  }) : p);
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
            <button
              id="fin-eval-back-btn"
              type="button"
              onClick={() => { /* TODO: navigate back */ }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #000000b8", borderRadius: 4, fontSize: 13, fontWeight: 600, background: "#fff", color: "#000", cursor: "pointer" }}
            >
              <ChevronLeft size={14} />
              Back
            </button>
            {!isReadonly && (
            <button
              id="fin-eval-export-btn"
              type="button"
              onClick={() => { /* TODO: export template */ }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #000000b8", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#fff", color: "#000", cursor: "pointer" }}
            >
              <Download size={14} />
              Export Template
            </button>
            )}
            {!isReadonly && (
            <button
              id="fin-eval-import-btn"
              type="button"
              onClick={() => { /* TODO: import excel */ }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #000000b8", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#fff", color: "#000", cursor: "pointer" }}
            >
              <Upload size={14} />
              Import Excel
            </button>
            )}
            {!isReadonly && (
            <button
              id="fin-eval-save-model-btn"
              type="button"
              onClick={saveDraft}
              disabled={savingDraft || loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "1px solid #000000b8", borderRadius: 6, fontSize: 13, fontWeight: 700, background: "#fff", color: "#000", cursor: savingDraft || loading ? "not-allowed" : "pointer", opacity: savingDraft || loading ? 0.7 : 1 }}
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
            <div className="info-icon"
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { setStripTooltipPos(e.currentTarget.getBoundingClientRect()); setStripTooltip(kind); }}
              onMouseLeave={() => setStripTooltip(null)}
            >
              i
              {stripTooltip === kind && stripTooltipPos && createPortal(
                // Overlays the page via a portal so the tooltip never inflates the scrollable strip.
                <span className="info-tooltip" style={{ position: "fixed", left: stripTooltipPos.right + 6, top: stripTooltipPos.top - 4, zIndex: 9999 }}>
                  {tooltipText}
                </span>,
                document.body
              )}
            </div>
          );

          // The FX pair is always local <-> USD, never local <-> the current
          // toggle selection: the rate describes the proposal's pair, which does
          // not change when the user flips the display toggle.
          const fxKnown = fxRate != null && Number.isFinite(fxRate) && fxRate > 0;
          const fxValue = (n: number) => (
            fxLoading ? (
              <span className="fx-error-text" style={{ color: "#9ca3af" }}>Loading…</span>
            ) : fxError || !fxKnown ? (
              <span className="fx-error-text">{fxError || "rate unavailable"}</span>
            ) : (
              <strong>{n.toFixed(2)}</strong>
            )
          );

          return (
            <div className="currency-strip">
              <div className="currency-strip-row">
                {/* Currency label + toggle + info */}
                <span className="strip-label">CURRENCY</span>
                <div className="toggle-group">
                  {currencies.map((cur) => (
                    <button key={cur} type="button" className={`toggle-btn${display === cur ? " active" : ""}`} onClick={() => handleCurrencyChange(cur)}>
                      {currencyLabel(cur)}
                    </button>
                  ))}
                </div>
                {infoIcon("currency", `Local Currency is ${local} — all values are displayed in ${display}. Change Local Currency in Proposal Section to enable a USD/local toggle.`)}

                <div className="strip-divider" />

                {/* Scale label + toggle + info */}
                <span className="strip-label">SCALE</span>
                <div className="toggle-group">
                  {SCALES.map((s) => (
                    <button key={s.value} type="button" className={`toggle-btn${displayScale === s.value ? " active" : ""}`} onClick={() => handleScaleChange(s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {infoIcon("scale", "Switch the denomination for all financial values. K = thousands (default), M = millions, B = billions.")}

                <div className="strip-divider" />

                {/* Number format label + dropdown */}
                <span className="strip-label">NUMBER FORMAT</span>
                <select
                  className="strip-select"
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value as NumberFormatKey)}
                >
                  {NUMBER_FORMATS.map((nf) => (
                    <option key={nf.value} value={nf.value}>{nf.label}</option>
                  ))}
                </select>

                {/* Date format label + dropdown */}
                <span className="strip-label">DATE FORMAT</span>
                <select
                  className="strip-select"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value as DateFormatKey)}
                >
                  {DATE_FORMATS.map((df) => (
                    <option key={df.value} value={df.value}>{df.label}</option>
                  ))}
                </select>

                {/* FX rate — only relevant when local currency differs from USD */}
                {local !== "USD" && (
                  <div className="fx-wrap">
                    <span className="fx-badge">FX</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span className="fx-rate-text">
                        1 {local} = {fxValue(fxKnown ? 1 / (fxRate as number) : 0)} USD
                      </span>
                      <span className="fx-rate-text">
                        1 USD = {fxValue(fxKnown ? (fxRate as number) : 0)} {local}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>


      {/* ── KPI panel (NPV / IRR / Payback / Metrics / Financial Parameters) ── */}
      {rawHeader && (
        <KpiPanel
          rawHeader={rawHeader}
          onChange={(patch) => setRawHeader((p) => p ? { ...p, ...patch } : p)}
          displayScale={displayScale}
          numberFormat={numberFormat}
          dateFormat={dateFormat}
          isReadonly={isReadonly}
        />
      )}

      {/* ── Table toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", borderTop: "1px solid #e5e7eb", paddingTop: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={decreaseYears} disabled={numYears <= 1 || isReadonly} style={{ width: 20, height: 20, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: numYears <= 1 || isReadonly ? "not-allowed" : "pointer", color: "#374151", opacity: numYears <= 1 || isReadonly ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>−</button>
          <span style={{ fontSize: 11, color: "#374151" }}>{numYears} Years</span>
          <button type="button" onClick={increaseYears} disabled={isReadonly} style={{ width: 20, height: 20, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: isReadonly ? "not-allowed" : "pointer", color: "#374151", opacity: isReadonly ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>+</button>
          {!isReadonly && <button type="button" onClick={addGroup} style={{ padding: "3px 8px", border: "1px solid #000", borderRadius: 4, fontSize: 11, background: "#fff", cursor: "pointer", color: "#000", fontWeight: 600 }}>+ Add Section</button>}
          <button type="button" onClick={toggleAll} style={{ padding: "3px 8px", fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>{allExpanded ? "Collapse All" : "Expand All"}</button>
        </div>
      </div>

      {/* ── Pivot tables — sections split into Table 1 (OPEX) / Table 2 (CAPEX) / Table 3 (everything else) ── */}
      {(() => {
        const opexGroups  = data.groups.filter((g) => g.sectionType === "OPEX");
        const capexGroups = data.groups.filter((g) => g.sectionType === "CAPITAL_EXPENSE");
        const restGroups  = data.groups.filter((g) => g.sectionType !== "OPEX" && g.sectionType !== "CAPITAL_EXPENSE");

        const tableBlocks: { groups: Group[] }[] = [
          ...(opexGroups.length  ? [{ groups: opexGroups }]  : []),
          ...(capexGroups.length ? [{ groups: capexGroups }] : []),
          ...(restGroups.length  ? [{ groups: restGroups }] : []),
        ];

        // Each table block gets its own scroll container, so scrolling one block
        // never drags another sideways. Sections inside a block share the table
        // — and therefore the scroll — by design.
        const renderGroupTable = (groups: Group[]) => (
          <div className="table-scroll">
              <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 36 }} />
                  <col style={{ width: colWidths.lineItem }} />
                  <col style={{ width: colWidths.account }} />
                  {data.years.map((y) => <col key={y} style={{ minWidth: 120 }} />)}
                  <col style={{ width: 140 }} />
                </colgroup>
                <tbody>
                  {groups.map((group: Group) => (
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
                          {!isReadonly && hoveredColIdx === yi && (
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
                      const nameLocked = isReadonly || value.isCustom === "N";
                      // Template line names render as a bold label (like the calculated
                      // rows) rather than a greyed-out input box.
                      const isTemplateName = value.isCustom === "N";
                      return (
                        <tr key={value.id} style={{ background: bg }}>
                          <td style={{ ...TD, padding: "4px 0", textAlign: "center", verticalAlign: "middle" }}>
                            {!isReadonly && value.isMandatory !== "Y" && value.isCustom !== "N" && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, vId: value.id, name: value.name, kind: "line" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                            )}
                          </td>
                          <td colSpan={group.isAccountRequired !== "Y" ? 2 : 1} style={{ ...TD, padding: "4px 12px", position: "relative", overflow: "hidden" }} title={value.name}>
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
                            const rawRow = isTaxRateRow(value);
                            const pctRow = isPercentRow(value);
                            const scaleDecimals = decimalsForScale(displayScale);
                            return (
                              <td key={year} style={{ ...TD, padding: "4px 12px" }}>
                                <input type="text"
                                  className={FIN_CELL_CLASS}
                                  inputMode={pctRow ? "decimal" : undefined}
                                  value={editingCell?.gId === group.id && editingCell?.vId === value.id && editingCell?.year === year
                                    ? editingCell.raw
                                    : val === 0 ? "" : rawRow
                                      ? parseFloat(val.toFixed(3))
                                      : parseFloat(applyScale(val * fxMultiplier, displayScale).toFixed(scaleDecimals))}
                                  placeholder="—"
                                  onFocus={() => {
                                    const displayed = val === 0 ? "" : rawRow
                                      ? String(parseFloat(val.toFixed(3)))
                                      : String(parseFloat(applyScale(val * fxMultiplier, displayScale).toFixed(scaleDecimals)));
                                    setEditingCell({ gId: group.id, vId: value.id, year, raw: displayed });
                                  }}
                                  onChange={(e) => {
                                    // Percentage rows: reject the keystroke unless the
                                    // resulting text is a valid 0–100 value with ≤ 2 decimals.
                                    if (pctRow && !isValidPercentInput(e.target.value)) return;
                                    // Regular rows: only digits, one leading "-", one "." — no letters.
                                    if (!pctRow && !isValidNumericInput(e.target.value)) return;
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
                          {isNoTotalRow(value)
                            ? <td style={{ ...TD, padding: "4px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value="—" style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: "#1f2937", outline: "none", height: 28, cursor: "default" }} /></td>
                            : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "4px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={isTaxRateRow(value) ? rawFmt(t) : displayFmt(t)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: t < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 28, cursor: "default" }} /></td>; })()
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
                        <td colSpan={3} style={{ ...TD, padding: "8px 12px" }}>
                          <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={value.name} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} />
                        </td>
                        {data.years.map((year: number) => {
                          const val = value.yearValues[year] ?? 0;
                          return (
                            <td key={year} style={{ ...TD, padding: "8px 12px" }}>
                              <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={isTaxRateRow(value) ? rawFmt(val) : displayFmt(val)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} />
                            </td>
                          );
                        })}
                        {isNoTotalRow(value)
                          ? <td style={{ ...TD, padding: "8px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value="—" style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} /></td>
                          : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "8px 12px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={displayFmt(t)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} /></td>; })()
                        }
                      </tr>
                    );

                    return (<>
                      {(hasOngoing ? regularEditable : editable).map((v, i) => renderEditable(v, i))}
                      {!isReadonly && group.isNewLineRequired !== "N" && (
                        <tr key="add-btn"><td colSpan={3 + numYears + 1} style={{ padding: "6px 10px", borderBottom: "1px solid #e5e7eb" }}><button type="button" onClick={() => addValueRow(group.id)} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: "#000", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, height: 15 }}>+ Add {group.name} Line</button></td></tr>
                      )}
                      {hasOngoing ? (<>
                        {calcInitial.map(renderCalcRow)}
                        {ongoingEditable.map((v, i) => renderEditable(v, regularEditable.length + i))}
                        {calcRest.map(renderCalcRow)}
                      </>) : calc.map((value: ValueRow) => (
                        <tr key={value.id} style={{ background: "#f3f4f6" }}>
                          <td colSpan={3} style={{ ...TD, padding: "10px 14px" }}>
                            <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={value.name} style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} />
                          </td>
                          {data.years.map((year: number) => {
                            const val = value.yearValues[year] ?? 0;
                            return (
                              <td key={year} style={{ ...TD, padding: "10px 14px" }}>
                                <input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={isTaxRateRow(value) ? rawFmt(val) : displayFmt(val)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} />
                              </td>
                            );
                          })}
                          {isNoTotalRow(value)
                            ? <td style={{ ...TD, padding: "10px 14px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value="—" style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", height: 28, cursor: "default" }} /></td>
                            : (() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "10px 14px" }}><input type="text" readOnly className={FIN_CELL_CLASS} onKeyDown={handleCellArrowNav} value={displayFmt(t)} style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111", outline: "none", height: 28, cursor: "default" }} /></td>; })()
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

        return (
          <>
            {tableBlocks.map((block, i) => (
              <div key={i}>
                {renderGroupTable(block.groups)}
              </div>
            ))}
          </>
        );
      })()}

    </div>
  );
}