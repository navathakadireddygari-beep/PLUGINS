import React, { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, RefreshCw, Download, Upload, Save } from "lucide-react";
import { getAppConfig } from "../config/app-config";
import {
  getFinancialData,
  getCurrencyExchangeRate,
  saveFinancialData,
  clearCachedToken,
  isServerDrivenSection,
  isProposalStatusReadonly,
  isExportTemplateHidden,
  getAccountCodes,
  type AccountCode,
  type ApiHeader,
  type Group,
  type PivotTableData,
  type ValueRow,
  type YearValues,
} from "../api/financial-api";
import { deleteLine, deleteSection } from "../api/delete-api";
import KpiPanel from "./KpiPanel";
import NetSummaryCards from "./NetSummaryCards";
import Toast, { type ToastState } from "./Toast";
import {
  SCALES, DEFAULT_SCALE, scaleDivisorFor, scaleDecimalsFor, type ScaleKey,
  NUMBER_FORMATS, DEFAULT_NUMBER_FORMAT, formatNumber, formatScaledValue, type NumberFormatKey,
  DATE_FORMATS, DEFAULT_DATE_FORMAT, type DateFormatKey,
} from "../lib/format";
import { publishAction, subscribeAction } from "../lib/app-bridge";
import { FIN_EVAL_SUBSCRIBER_ID } from "../lib/app-bridge-events.fin-eval";

const BRAND        = "#A5005A";
const DARK_HEADER  = "#2d3748";
const DARK_TOGGLE  = "#1e2433";
const WIDGET_MAX_WIDTH = "none";

const CURRENCY_LABELS: Record<string, string> = {
  CAD: "$ CAD", USD: "$ USD", EUR: "€ EUR",
  GBP: "£ GBP", AUD: "A$ AUD", JPY: "¥ JPY",
  SGD: "$ SGD", INR: "₹ INR", CNY: "¥ CNY",
};
const currencyLabel = (code: string): string => {
  const upper = code.toUpperCase();
  // if (upper === "GBP") return "GB GBP";
  if (upper === "USD") return "$ USD";
  return CURRENCY_LABELS[upper] ?? code;
};

// Compact dropdown for the toolbar strip (number / date / status pickers) —
// sized to align with the currency / scale toggle buttons. Matches prod-dev.
const selectStyle: React.CSSProperties = {
  height: 24, border: "1px solid #e5e7eb", borderRadius: 6,
  fontSize: 11, fontWeight: 600, color: "#374151",
  padding: "0 6px", background: "#fff", cursor: "pointer",
  outline: "none",
};

const neutralButtonStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  border: "1px solid #000000b8",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  background: "#fff",
  color: "#000",
  cursor: "pointer",
  whiteSpace: "nowrap",
  ...extra,
});

const toggleBtn = (active: boolean, first: boolean): React.CSSProperties => ({
  padding: "3px 8px", border: "none",
  borderLeft: first ? "none" : "1px solid #e5e7eb",
  cursor: "pointer", fontSize: 11, fontWeight: 700,
  background: active ? DARK_TOGGLE : "#fff",
  color:      active ? "#fff" : "#6b7280",
  transition: "background 0.15s, color 0.15s",
  whiteSpace: "nowrap",
});

const stripGroup = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "nowrap",
  flex: "0 0 auto",
  whiteSpace: "nowrap",
  ...extra,
});

const stripRowStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "nowrap",
  overflowX: "auto",
  marginBottom: 16,
};

const yearMenuItem: React.CSSProperties = {
  width: "100%", padding: "7px 12px", textAlign: "left", fontSize: 12,
  color: "#374151", background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", gap: 6,
};

const generateId  = (): string => `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;


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

const isNumericCell = (s: string): boolean => {
  const t = s.trim();
  if (!t || t === "-") return true;
  return /^-?\(?\d[\d,._' ]*\)?%?$/.test(t);
};

// Guards keystrokes in value-cell inputs: digits, one leading "-", one "."
const isValidNumericInput = (s: string): boolean => s === "" || s === "-" || /^-?\d*\.?\d*$/.test(s);

type ParsedRow = { name: string; values: number[] };

const tok = (s: string | undefined | null): string =>
  (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* Front-end subtotal / total recompute.
   For each section: calculated lines (isCalculated === "Y") get their year
   values set to the per-year sum of editable (isCalculated !== "Y") lines.
   Every line's rowTotal is set to the sum of its own year values.
   Server-driven sections (e.g. Cash Flow) are left untouched — their
   row values come entirely from the finCalcFullDcf response and must
   not be overwritten by a local sum on cell edits. */
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
    name:   cols[0]?.trim() || "Enter line item name",
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

// Every section starts expanded, at every depth, so the full tree is visible
// on load without the user having to open each ancestor in turn.
function expandAllGroups(table: PivotTableData): PivotTableData {
  return {
    ...table,
    groups: table.groups.map((g) => ({ ...g, expanded: true })),
  };
}

/* ─────────────────────────── Component ──────────────────────────── */
export default function PivotTableWithAPI(): React.ReactElement {

  const [data,        setData]        = useState<PivotTableData | null>(null);
  const [rawHeader,   setRawHeader]   = useState<ApiHeader | null>(null);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const [accountCodesBySection, setAccountCodesBySection] = useState<Record<string, AccountCode[]>>({});
  const [displayScale,  setDisplayScale]  = useState<ScaleKey>(DEFAULT_SCALE);
  const [numberFormat,  setNumberFormat]  = useState<NumberFormatKey>(DEFAULT_NUMBER_FORMAT);
  const [dateFormat,    setDateFormat]    = useState<DateFormatKey>(DEFAULT_DATE_FORMAT);

  const [savingDraft,  setSavingDraft]  = useState<boolean>(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);
  const [toast,        setToast]        = useState<ToastState>(null);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const [activeAutocomplete, setActiveAutocomplete] = useState<string | null>(null);
  const [autocompleteSearch, setAutocompleteSearch] = useState<string>("");
  const [activeTab,          setActiveTab]          = useState<'current' | 'proposed' | 'net'>('current');
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

  // Master edit gate — the host page (APEX plugin) sets is_readonly from
  // proposal ownership / collaborator access level / role, and the proposal's
  // own status locks it too (SUBMITTED / IN_PROGRESS / APPROVED / CLOSED).
  // When true, no add/delete/rename/value-edit action is permitted.
  const isReadonly = getAppConfig().is_readonly || isProposalStatusReadonly(rawHeader?.proposal_status);

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
  const [colWidths, setColWidths] = useState<{ lineItem: number; account: number }>({ lineItem: 280, account: 180 });
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
      const table = expandAllGroups(result.table);
      setData(table);
      setRawHeader(result.rawHeader);
      dbYearsRef.current = new Set(result.table.years);
      return { table, rawHeader: result.rawHeader };
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
  }, [data, loadAccountCodesForSection]);

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
        if (!prev) return expandAllGroups(result.table);
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
  //   publishAction({ source: ..., target: "fin-eval", action: "tool:refresh_financial_evaluation", payload: { sectionId } });
  useEffect(() => {
    return subscribeAction(FIN_EVAL_SUBSCRIBER_ID, "tool:refresh_financial_evaluation", (payload) => {
      const sid = payload?.sectionId != null ? String(payload.sectionId).trim() : null;
      console.log("[Table] tool:refresh_financial_evaluation received, sectionId =", sid);
      if (sid && sid !== "null") {
        void refreshSection(sid);
      } else {
        void loadData();
      }
    });
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
            /financial[_-]?eval/i.test(l.getAttribute("href") ?? ""),
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
    if (!data || !rawHeader || isReadonly) return;
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
      publishAction({ source: FIN_EVAL_SUBSCRIBER_ID, target: "apex", action: "tool:fin_eval_saved", payload: { proposalId: cfg.proposal_id } });
      // Silent re-fetch — update state in place without showing the loading spinner.
      try {
        const refetched = await getFinancialData(cfg);
        setData(refetched.table);
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
  }, [data, rawHeader, isReadonly]);

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
  // DB stores all editable values in USD. The UI displays values in the
  // current display currency by multiplying USD by the backend-provided
  // USD→display exchange factor (`usd_fbr`).
  const localCcy = (rawHeader?.local_currency || "").toUpperCase();
  const displayCcy = (rawHeader?.display_currency || localCcy || "USD").toUpperCase();
  const fxLabelCurrency = displayCcy === "USD" && localCcy && localCcy !== "USD" ? localCcy : displayCcy;
  const [fxMultiplier, setFxMultiplier] = useState<number>(1);
  const [fxLabelRate, setFxLabelRate] = useState<number>(1);
  const [fxLoading, setFxLoading] = useState<boolean>(false);
  const [fxError,   setFxError]   = useState<boolean>(false);

  useEffect(() => {
    if (!rawHeader) return;

    let active = true;
    const cfg = getAppConfig();
    // exchange_rate comes back null on live proposals, so there is usually no
    // stored rate to fall back on — track that separately from the 1:1 default
    // so a failed lookup is reported instead of silently showing 1:1.
    const hasStoredRate = !!rawHeader.exchange_rate;
    const fallback = hasStoredRate ? (1 / rawHeader.exchange_rate) : 1;

    if (displayCcy === "USD") {
      setFxMultiplier(1);
    } else {
      setFxLoading(true);
      setFxError(false);
      // When local currency is selected, displayCcy will equal local currency.
      // Pass that currency to the backend and let the helper derive year_period from sysdate.
      getCurrencyExchangeRate(cfg, displayCcy)
        .then((rate) => {
          if (!active) return;
          setFxMultiplier(rate || fallback || 1);
          if (fxLabelCurrency === displayCcy) setFxLabelRate(rate || fallback || 1);
          setFxError(false);
        })
        .catch((e) => {
          console.error("[currency-exchange] failed to load usd_fbr for", displayCcy, e);
          if (!active) return;
          setFxMultiplier(fallback || 1);
          if (fxLabelCurrency === displayCcy) setFxLabelRate(fallback || 1);
          setFxError(!hasStoredRate);
        })
        .finally(() => { if (active) setFxLoading(false); });
    }

    if (fxLabelCurrency === "USD") {
      setFxLabelRate(1);
    } else if (fxLabelCurrency !== displayCcy) {
      setFxLoading(true);
      getCurrencyExchangeRate(cfg, fxLabelCurrency)
        .then((rate) => {
          if (!active) return;
          setFxLabelRate(rate || fallback || 1);
          setFxError(false);
        })
        .catch((e) => {
          console.error("[currency-exchange] failed to load usd_fbr for", fxLabelCurrency, e);
          if (!active) return;
          setFxLabelRate(fallback || 1);
          setFxError(!hasStoredRate);
        })
        .finally(() => { if (active) setFxLoading(false); });
    }

    return () => { active = false; };
    // NOTE: `rawHeader` itself is deliberately NOT a dependency — its identity
    // changes on every edit, which re-fired the exchange-rate request on each
    // keystroke.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayCcy, fxLabelCurrency, rawHeader?.exchange_rate]);

  const formatFxLabel = (rate: number): string => {
    const decimals = rate >= 100 ? 2 : rate >= 10 ? 3 : 4;
    return formatNumber(rate, numberFormat, decimals);
  };

  const formatDisplayValue = (n: number, useNetStyle = false): string => {
    if (!n) return useNetStyle ? "–" : "—";
    // Decimals follow the scale: K = 0, M = 2, B = 2.
    const formatted = formatScaledValue(n, numberFormat, displayScale, fxMultiplier, undefined, false, !useNetStyle);
    return useNetStyle ? formatted.replace(/^-/, '–') : formatted;
  };

  const formatEditableInputValue = (raw: number): string => {
    if (raw === 0) return "";
    const scaled = (raw * fxMultiplier) / scaleDivisorFor(displayScale);
    const formatted = formatNumber(Math.abs(scaled), numberFormat, scaleDecimalsFor(displayScale));
    return scaled < 0 ? `(${formatted})` : formatted;
  };

  const displayFmt = (n: number): string => formatDisplayValue(n, false);

  const getGroupTab = (group: Group): 'current' | 'proposed' | 'net' | null => {
    const st = (group.sectionType || '').toUpperCase();
    if (st === 'CURRENT_SITE' || st === 'PROPOSED_SITE') return null;
    if (st.startsWith('CURRENT_')) return 'current';
    if (st.startsWith('PROPOSED_')) return 'proposed';
    if (st === 'NET_SUMMARY' || st.startsWith('NET_')) return 'net';
    return 'current';
  };

  const getAddLineLabel = (group: Group): string => {
    const st = (group.sectionType || '').toUpperCase().replace(/^(CURRENT_|PROPOSED_)/, '');
    const map: Record<string, string> = {
      ANNUAL_RECURRING_COSTS: 'Annual Recurring Cost',
      PNL_ANNUAL_RECURRING_COSTS: 'Annual Recurring Cost',
      OPEX: 'Opex',
      CAPEX: 'Capex',
      LANDLORD_INC: 'Landlord Incentive',
      PNL: 'P&L',
      ADDITIONAL_METRICS: 'Metric',
      CASH_FLOW: 'Cash Flow',
      SETUP_DILAP: 'Setup/Dilapidation',
    };
    return map[st] || group.name;
  };

  const netFmt = (n: number): string => formatDisplayValue(n, true);

  // Section-header name cell: inline-renameable for custom sections, with the
  // delete-section control the visible table was missing entirely (it only
  // existed in the old hidden table that has since been removed).
  const sectionNameCell = (
    group: Group,
    isOwnSection: boolean,
    color: string,
  ): React.ReactElement => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {!isReadonly && isOwnSection && editingGroupId === group.id ? (
        <input
          autoFocus
          value={editingGroupName}
          placeholder="Enter section name"
          onChange={(e) => setEditingGroupName(e.target.value)}
          onBlur={() => updateGroupName(group.id, editingGroupName)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateGroupName(group.id, editingGroupName);
            else if (e.key === "Escape") { setEditingGroupId(null); setEditingGroupName(""); }
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, padding: "3px 8px", fontSize: 12, fontWeight: 700, background: "#fff", color: "#111827", border: "1px solid #3b82f6", borderRadius: 4, outline: "none" }}
        />
      ) : (
        <span
          style={{
            flex: 1, color,
            cursor: !isReadonly && isOwnSection ? "pointer" : "inherit",
            opacity: group.name ? 1 : 0.55,
            fontStyle: group.name ? "normal" : "italic",
          }}
          onClick={(e) => {
            if (isReadonly || !isOwnSection) return;
            e.stopPropagation();
            setEditingGroupId(group.id);
            setEditingGroupName(group.name);
          }}
        >
          {group.name || (isOwnSection ? "Enter section name" : "")}
        </span>
      )}
      {!isReadonly && isOwnSection && (
        <button
          type="button"
          title="Delete section"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, name: group.name, kind: "section" }); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", padding: 2, flexShrink: 0 }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );

  const netColor = (n: number): string => {
    if (!n) return '#6b7280';
    const v = (n * fxMultiplier) / scaleDivisorFor(displayScale);
    return v < 0 ? '#dc2626' : '#111827';
  };

  /* ── Loading / error gates ──────────────────────────────────── */
  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
      <div style={{ display: "inline-block", animation: "spin 1s linear infinite", marginBottom: 10 }}><RefreshCw size={20} /></div>
      <div>Loading Leases Contracts data…</div>
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
  const tabGroups  = data.groups.filter((g) => getGroupTab(g) === activeTab);

  /* ── Hierarchy builders ─────────────────────────────────────── */
  // Effective ids: prefer the persisted fin_eval instance id, falling back
  // to the template-hierarchy id when nothing has been persisted yet (a
  // fresh template response has fin_eval_section_id / parent_fin_eval_section_id
  // null on every section, with the real tree living in template_section_id /
  // parent_template_section_id instead).
  const effectiveId       = (g: Group): number | undefined => g.sectionId ?? g.templateSectionId;
  const effectiveParentId = (g: Group): number | undefined => g.parentSectionId ?? g.parentTemplateSectionId;

  const groupChildrenOf = new Map<number, Group[]>();
  data.groups.forEach((g) => {
    const parentId = effectiveParentId(g);
    if (parentId != null) {
      if (!groupChildrenOf.has(parentId)) groupChildrenOf.set(parentId, []);
      groupChildrenOf.get(parentId)!.push(g);
    }
  });
  groupChildrenOf.forEach((arr) => arr.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));

  const tabRootTypes: Record<string, string> = { current: 'CURRENT_SITE', proposed: 'PROPOSED_SITE', net: 'NET_SUMMARY' };
  const tabRootGroup = data.groups.find((g) => (g.sectionType || '').toUpperCase() === tabRootTypes[activeTab]);

  // DFS traversal: returns all non-root descendants in hierarchy order
  const getDFSGroups = (parentId: number): Group[] => {
    const children = groupChildrenOf.get(parentId) || [];
    return children.flatMap((g) => [g, ...getDFSGroups(effectiveId(g) ?? -1)]);
  };

  const tabRootId = tabRootGroup ? effectiveId(tabRootGroup) : undefined;
  const topLevelGroups: Group[] = tabRootId != null && (groupChildrenOf.get(tabRootId) || []).length > 0
    ? getDFSGroups(tabRootId)
    : tabGroups;

  const computeDescendantTotal = (g: Group, year: number): number => {
    const direct = g.values.filter((v) => v.isCalculated !== 'Y').reduce((s, v) => s + (v.yearValues[year] || 0), 0);
    const kids = groupChildrenOf.get(effectiveId(g) ?? -1) || [];
    return direct + kids.reduce((s, kid) => s + computeDescendantTotal(kid, year), 0);
  };

  // Every section from the API shows its own row — no merging.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMergedSection = (_g: Group): boolean => false;

  // Returns all lines to display for a section, paired with their source group.
  // Merged first-child lines appear before the section's own lines.
  const getMergedLines = (g: Group): { value: ValueRow; src: Group }[] => {
    const mergedChild = (groupChildrenOf.get(effectiveId(g) ?? -1) || []).find((c) => isMergedSection(c));
    const own = g.values.map((v) => ({ value: v, src: g }));
    return mergedChild ? [...getMergedLines(mergedChild), ...own] : own;
  };

  // Returns which group's "+ Add Line" button to render beneath a display section.
  // Container sections (those with child sections) never show an add button.
  const getAddSource = (g: Group): Group | null => {
    if ((groupChildrenOf.get(effectiveId(g) ?? -1) || []).length > 0) return null;
    return g.isNewLineRequired !== 'N' ? g : null;
  };

  // Direct children of the tab root (or the root itself, e.g. NET_SUMMARY with no children)
  // are the always-visible "parent" rows. Everything deeper is only shown once its ancestor
  // chain is expanded; every section starts expanded (see expandAllGroups at load time).
  const isTopLevelGroup = (g: Group): boolean =>
    (tabRootId != null && effectiveParentId(g) === tabRootId) ||
    (tabRootId != null && effectiveId(g) === tabRootId);

  // The tab root itself (CURRENT_SITE / PROPOSED_SITE / NET_SUMMARY) is a page
  // heading, not a data section — it never gets its own per-year totals row.
  const isRootBarGroup = (g: Group): boolean =>
    tabRootId != null && effectiveId(g) === tabRootId;

  const buildVisibleGroups = (): Group[] => {
    const result: Group[] = [];
    const visit = (g: Group): void => {
      result.push(g);
      if (!g.expanded) return;
      const kids = groupChildrenOf.get(effectiveId(g) ?? -1) || [];
      kids.forEach(visit);
    };
    topLevelGroups.filter(isTopLevelGroup).forEach(visit);
    return result;
  };

  // Display groups = top-level rows plus any descendants revealed by expansion.
  const displayGroups: Group[] = buildVisibleGroups().filter((g) => !isMergedSection(g));
  // Expand/collapse state covers every section belonging to the active tab
  // (nested ones included), so "Expand All" opens the whole tree in one go
  // and the label flips only once everything really is open.
  const tabSectionIds = new Set<string>(topLevelGroups.map((g) => g.id));
  const allExpanded = topLevelGroups.length > 0 && topLevelGroups.every((g) => g.expanded);

  /* ── Year management ────────────────────────────────────────── */
  const increaseYears   = (): void => { if (isReadonly) return; setData((p) => { if (!p) return p; const y = Math.max(...p.years) + 1; return { ...p, years: [...p.years, y], columnLabels: { ...p.columnLabels, [y]: `FY${String(y).slice(2)}` }, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => ({ ...v, yearValues: { ...v.yearValues, [y]: 0 } })) })) }; }); };
  const decreaseYears   = (): void => { if (isReadonly || data.years.length <= 1) return; setData((p) => { if (!p) return p; const y = p.years[p.years.length - 1]; const lbl = { ...p.columnLabels }; delete lbl[y]; return { ...p, years: p.years.slice(0, -1), columnLabels: lbl, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => { const nv = { ...v.yearValues }; delete nv[y]; return { ...v, yearValues: nv }; }) })) }; }); };
  const insertYearAfter = (idx: number): void => { if (isReadonly) return; setData((p) => { if (!p) return p; const y = Math.max(...p.years) + 1; return { ...p, years: [...p.years.slice(0, idx + 1), y, ...p.years.slice(idx + 1)], columnLabels: { ...p.columnLabels, [y]: `FY${String(y).slice(2)}` }, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => ({ ...v, yearValues: { ...v.yearValues, [y]: 0 } })) })) }; }); setHoveredColIdx(null); };
  const removeYear = (year: number): void => { if (isReadonly || data.years.length <= 1) return; setData((p) => { if (!p) return p; const lbl = { ...p.columnLabels }; delete lbl[year]; return { ...p, years: p.years.filter((y) => y !== year), columnLabels: lbl, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => { const nv = { ...v.yearValues }; delete nv[year]; return { ...v, yearValues: nv }; }) })) }; }); setConfirmDeleteYear(null); setOpenYearMenuIdx(null); };
  const updateColumnLabel = (year: number, lbl: string): void => {
    if (isReadonly) return;
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
  const moveYearLeft  = (i: number): void => { if (isReadonly || i <= 0) return; setData((p) => { if (!p) return p; const y = [...p.years]; [y[i-1], y[i]] = [y[i], y[i-1]]; return { ...p, years: y }; }); setOpenYearMenuIdx(null); };
  const moveYearRight = (i: number): void => { if (isReadonly || i >= data.years.length - 1) return; setData((p) => { if (!p) return p; const y = [...p.years]; [y[i], y[i+1]] = [y[i+1], y[i]]; return { ...p, years: y }; }); setOpenYearMenuIdx(null); };

  /* ── Group / row CRUD ───────────────────────────────────────── */
  const blankRow    = (p: PivotTableData): ValueRow => ({ id: generateId(), name: "", yearValues: p.years.reduce((a: YearValues, y) => ({ ...a, [y]: 0 }), {}), lineType: "CUSTOM", lineIdentifier: "FINANCIAL", isCalculated: "N", isCustom: "Y", status: "ACTIVE", languageCode: "EN" });
  // New sections / lines are persisted on Save (PUT) — the backend's
  // update_fin_eval_prc inserts rows with null fin_eval_section_id /
  // fin_eval_line_id and updates rows with real ids, so a separate
  // POST-on-add is unnecessary and caused a race that left stale
  // "Enter line item name" rows in the DB.
  const addGroup = (): void => {
    if (isReadonly) return;
    const newId = generateId();
    // A new section must be grafted onto the active tab's root, otherwise it
    // fails both the tab filter (getGroupTab) and the visibility filter
    // (isTopLevelGroup) and the row is created in state but never rendered —
    // which is why "+ Add Section" appeared to do nothing.
    const tabPrefix = activeTab === 'proposed' ? 'PROPOSED_' : activeTab === 'net' ? 'NET_' : 'CURRENT_';
    setData((p) => p ? ({
      ...p,
      groups: [...p.groups, {
        id: newId, name: "", expanded: true,
        sectionType: `${tabPrefix}CUSTOM`,
        // Null when the tab root itself hasn't been persisted yet; the section
        // still renders because tabGroups is the fallback in that case.
        parentSectionId:         tabRootGroup?.sectionId ?? undefined,
        parentTemplateSectionId: tabRootGroup?.templateSectionId ?? undefined,
        isCustom: "Y", isNewLineRequired: "Y", status: "ACTIVE", languageCode: "EN",
        displayOrder: p.groups.length + 1,
        values: [blankRow(p)],
      }],
    }) : p);
    setEditingGroupId(newId);
    setEditingGroupName("");
  };
  const toggleGroup = (id: string): void => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === id ? { ...g, expanded: !g.expanded } : g) }) : p);
  const toggleAll   = (): void => {
    const n = !allExpanded;
    setData((p) => p ? ({
      ...p,
      // Only the active tab's sections are toggled — collapsing "Current Site"
      // must not silently collapse the other tabs behind the user's back.
      groups: p.groups.map((g) => tabSectionIds.has(g.id) ? { ...g, expanded: n } : g),
    }) : p);
  };
  const addValueRow = (gId: string): void => { if (isReadonly) return; setData((p) => p ? ({
    ...p,
    groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: [...g.values, blankRow(p)] }, p.years) : g),
  }) : p); };
  const removeValueRow = (gId: string, vId: string): void => { if (isReadonly) return; setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: g.values.filter((v) => v.id !== vId) }, p.years) : g) }) : p); };
  const updateCellValue = (gId: string, vId: string, year: number, raw: string): void => {
    if (isReadonly) return;
    const entered = parseFloat(raw.replace(/,/g, "")) || 0;
    // Reverse display conversion: state is always USD.
    // stateUSD = enteredDisplayValue × scaleDivisor / fxMultiplier
    const n = entered * scaleDivisorFor(displayScale) / fxMultiplier;
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
  const updateValueName = (gId: string, vId: string, name: string): void => { if (isReadonly) return; setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, values: g.values.map((v) => v.id === vId ? { ...v, name } : v) } : g) }) : p); };
  const updateGroupName = (gId: string, name: string): void => { if (isReadonly) return; setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, name } : g) }) : p); setEditingGroupId(null); setEditingGroupName(""); };

  /* ── Paste handlers ─────────────────────────────────────────── */
  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>, gId: string, vId: string): void => {
    if (isReadonly) return;
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
        const newRows: ValueRow[] = parsed.map((r): ValueRow => { const yv: YearValues = {}; p.years.forEach((y, i) => { const v = r.values[i] ?? 0; yv[y] = v * scaleDivisorFor(displayScale) / fxMultiplier; }); return { id: generateId(), name: r.name, yearValues: yv, lineType: "CUSTOM", lineIdentifier: "FINANCIAL", isCalculated: "N", status: "ACTIVE", languageCode: "EN" }; });
        const ex      = g.values[idx];
        const isBlank = (!ex?.name || ex?.name === "New Line Item") && Object.values(ex.yearValues).every((v) => v === 0);
        const withRows: Group = { ...g, values: isBlank ? [...g.values.slice(0, idx), ...newRows, ...g.values.slice(idx + 1)] : [...g.values.slice(0, idx + 1), ...newRows, ...g.values.slice(idx + 1)] };
        return recomputeGroup(withRows, p.years);
      }) };
    });
    setPasteToast({ gId, count: parsed.length }); setActiveAutocomplete(null); setAutocompleteSearch("");
  };

  const handleValueCellPaste = (e: React.ClipboardEvent<HTMLInputElement>, gId: string, vId: string, startYearIdx: number): void => {
    if (isReadonly) return;
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
    setData((p) => { if (!p) return p; return { ...p, groups: p.groups.map((g) => { if (g.id !== gId) return g; const si = g.values.findIndex((v) => v.id === vId); if (si === -1) return g; const withValues: Group = { ...g, values: g.values.map((v, ri) => { const off = ri - si; if (off < 0 || off >= parsedRows.length) return v; const nv: YearValues = { ...v.yearValues }; parsedRows[off].forEach((val, ci) => { const yi = startYearIdx + ci; if (yi < p.years.length) nv[p.years[yi]] = val * scaleDivisorFor(displayScale) / fxMultiplier; }); return { ...v, yearValues: nv }; }) }; return recomputeGroup(withValues, p.years); }) }; });
    const grp = data.groups.find((g) => g.id === gId);
    const si  = grp ? grp.values.findIndex((v) => v.id === vId) : 0;
    setPasteToast({ gId, count: grp ? Math.min(parsedRows.length, grp.values.length - si) : parsedRows.length });
  };

  /* ── Keyboard cell navigation (year-value grid only; Total column excluded) ──
     Left/Right move the caret within the cell first, only jumping to the
     adjacent cell when the caret is already at the text boundary (or the
     cell is empty). Up/Down always jump to the same column in the row
     above/below. Read-only (calculated) cells are focusable inputs too,
     so arrows can reach them even though they can't be edited. */
  const totalNavRows = displayGroups.reduce((s, g) => s + getMergedLines(g).length, 0);
  let navRowCounter = 0;

  const focusNavCell = (row: number, col: number): void => {
    const el = containerRef.current?.querySelector<HTMLInputElement>(`[data-nav-row="${row}"][data-nav-col="${col}"]`);
    el?.focus();
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number): void => {
    const input = e.currentTarget;
    const empty = input.value === "";
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) focusNavCell(row - 1, col);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < totalNavRows - 1) focusNavCell(row + 1, col);
        break;
      case "ArrowLeft": {
        const atStart = empty || (input.selectionStart === 0 && input.selectionEnd === 0);
        if (atStart) {
          if (col > 0) { e.preventDefault(); focusNavCell(row, col - 1); }
        }
        break;
      }
      case "ArrowRight": {
        const atEnd = empty || (input.selectionStart === input.value.length && input.selectionEnd === input.value.length);
        if (atEnd) {
          if (col < numYears - 1) { e.preventDefault(); focusNavCell(row, col + 1); }
        }
        break;
      }
    }
  };

  /* ────────────────────────────── JSX ────────────────────────── */
  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: WIDGET_MAX_WIDTH, margin: "0 auto", background: "#fff", fontFamily: '"Oracle Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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
                  if (!confirmDelete || isReadonly) return;
                  const { gId, vId, kind } = confirmDelete;
                  setDeletingRow(true);
                  try {
                    let apiMessage: string | undefined;
                    const cfg = getAppConfig();
                    if (kind === "section") {
                      const group = dataRef.current?.groups.find((g) => g.id === gId);
                      if (group?.sectionId != null) {
                        const resp = await deleteSection(cfg, group.sectionId, rawHeader?.proposal_id);
                        apiMessage = resp.apiMessage || resp.api_message;
                      }
                      // The backend removes the whole subtree, so the UI must
                      // drop descendant sections too — otherwise child rows
                      // survive locally and get re-sent on the next Save.
                      setData((p) => {
                        if (!p) return p;
                        const idOf     = (g: Group) => g.sectionId ?? g.templateSectionId;
                        const parentOf = (g: Group) => g.parentSectionId ?? g.parentTemplateSectionId;
                        const doomed   = new Set<string>([gId]);
                        const doomedSectionIds = new Set<number>();
                        const seed = p.groups.find((g) => g.id === gId);
                        const seedId = seed ? idOf(seed) : undefined;
                        if (seedId != null) doomedSectionIds.add(seedId);
                        let grew = true;
                        while (grew) {
                          grew = false;
                          p.groups.forEach((g) => {
                            const pid = parentOf(g);
                            if (pid != null && doomedSectionIds.has(pid) && !doomed.has(g.id)) {
                              doomed.add(g.id);
                              const cid = idOf(g);
                              if (cid != null) doomedSectionIds.add(cid);
                              grew = true;
                            }
                          });
                        }
                        return { ...p, groups: p.groups.filter((g) => !doomed.has(g.id)) };
                      });
                    } else {
                      const row = dataRef.current?.groups.find((g) => g.id === gId)?.values.find((v) => v.id === vId);
                      if (row?.lineId != null) {
                        const resp = await deleteLine(cfg, row.lineId, rawHeader?.proposal_id);
                        apiMessage = resp.apiMessage || resp.api_message;
                      }
                      if (vId) removeValueRow(gId, vId);
                    }
                    setConfirmDelete(null);
                    setToast({
                      kind: "success",
                      message: apiMessage || (kind === "section" ? "Section deleted successfully." : "Line deleted successfully."),
                    });
                    publishAction({ source: FIN_EVAL_SUBSCRIBER_ID, target: "apex", action: "tool:fin_eval_deleted", payload: { proposalId: cfg.proposal_id } });
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 24px", minHeight: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              id="fin-eval-back-btn"
              type="button"
              onClick={() => { /* TODO: wire back navigation */ }}
              style={neutralButtonStyle()}
            >
              <ChevronLeft size={14} />
              Back
            </button>
            {/* Export Template is hidden once the proposal is submitted /
                in progress / approved. */}
            {!isExportTemplateHidden(rawHeader?.proposal_status) && (
              <button
                id="fin-eval-export-btn"
                type="button"
                onClick={() => { /* TODO: export template */ }}
                style={neutralButtonStyle()}
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
                style={neutralButtonStyle()}
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
                style={neutralButtonStyle({ fontWeight: 700, opacity: savingDraft || loading ? 0.7 : 1, cursor: savingDraft || loading ? "not-allowed" : "pointer" })}
              >
                <Save size={14} />
                {savingDraft ? "Saving…" : "Save Model"}
              </button>
            )}
          </div>
        </div>

        {/* Currency/scale strip */}
        {rawHeader && (() => {
          const local     = (rawHeader.local_currency   || "").toUpperCase();
          const display   = (rawHeader.display_currency || local).toUpperCase();
          const currencies = local && local !== "USD" ? [local, "USD"] : ["USD"];

          const handleCurrencyChange = (cur: string) => {
            setRawHeader((p) => p ? { ...p, display_currency: cur } : p);
            const cfg = getAppConfig();
            publishAction({ source: FIN_EVAL_SUBSCRIBER_ID, target: "apex", action: "tool:fin_eval_currency_changed", payload: { currency: cur, proposalId: cfg.proposal_id } });
          };

          const handleScaleChange = (scale: ScaleKey) => {
            setDisplayScale(scale);
            const cfg = getAppConfig();
            publishAction({ source: FIN_EVAL_SUBSCRIBER_ID, target: "apex", action: "tool:fin_eval_scale_changed", payload: { scale, proposalId: cfg.proposal_id } });
          };

          const handleDateFormatChange = (fmt: DateFormatKey) => {
            setDateFormat(fmt);
            const cfg = getAppConfig();
            publishAction({ source: FIN_EVAL_SUBSCRIBER_ID, target: "apex", action: "tool:fin_eval_date_format_changed", payload: { dateFormat: fmt, proposalId: cfg.proposal_id } });
          };

          const handleNumberFormatChange = (fmt: NumberFormatKey) => {
            setNumberFormat(fmt);
            const cfg = getAppConfig();
            publishAction({ source: FIN_EVAL_SUBSCRIBER_ID, target: "apex", action: "tool:fin_eval_number_format_changed", payload: { numberFormat: fmt, proposalId: cfg.proposal_id } });
          };

          const infoIcon = (kind: "currency" | "scale", tooltipText: string) => (
            <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { setStripTooltipPos(e.currentTarget.getBoundingClientRect()); setStripTooltip(kind); }}
              onMouseLeave={() => setStripTooltip(null)}
            >
              <span style={{ width: 15, height: 15, borderRadius: 999, border: "1.5px solid #9ca3af", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, cursor: "default", userSelect: "none" }}>i</span>
              {stripTooltip === kind && stripTooltipPos && createPortal(
                // Overlays the page via a portal so the tooltip never inflates the scrollable strip.
                <span style={{ position: "fixed", left: stripTooltipPos.right + 6, top: stripTooltipPos.top - 4, background: DARK_TOGGLE, color: "#fff", padding: "6px 10px", borderRadius: 4, fontSize: 11, whiteSpace: "normal", width: 300, lineHeight: 1.45, zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,.25)", pointerEvents: "none" }}>
                  {tooltipText}
                </span>,
                document.body
              )}
            </div>
          );

          return (
            <div style={stripRowStyle}>
              <div style={stripGroup({ flexWrap: "nowrap" })}>
                <div style={stripGroup({ flexWrap: "nowrap" })}>
                  {/* Currency label + toggle + info */}
                  <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 }}>CURRENCY</span>
                  {infoIcon("currency", `Local Currency is ${local || "USD"}. All values are displayed in ${display}.`)}
                  <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                    {currencies.map((cur, i) => (
                      <button key={cur} type="button" onClick={() => handleCurrencyChange(cur)} style={toggleBtn(display === cur, i === 0)}>
                        {currencyLabel(cur)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={stripGroup({ flexWrap: "nowrap" })}>
                  {/* Scale label + toggle + info */}
                  <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 }}>SCALE</span>
                  <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                    {SCALES.map((s, i) => (
                      <button key={s.key} type="button" onClick={() => handleScaleChange(s.key)} style={toggleBtn(displayScale === s.key, i === 0)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {infoIcon("scale", "Switch the denomination for all financial values. K = thousands (default, matches source data), M = millions, B = billions.")}
                </div>

                <div style={stripGroup({ flexWrap: "nowrap" })}>
                  {/* Number label + format select */}
                  <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 }}>NUMBER FORMAT</span>
                  <select
                    value={numberFormat}
                    onChange={(e) => handleNumberFormatChange(e.target.value as NumberFormatKey)}
                    style={selectStyle}
                  >
                    {NUMBER_FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>

                <div style={stripGroup({ flexWrap: "nowrap" })}>
                  {/* Date label + format select */}
                  <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 }}>DATE FORMAT</span>
                  <select
                    value={dateFormat}
                    onChange={(e) => handleDateFormatChange(e.target.value as DateFormatKey)}
                    style={selectStyle}
                  >
                    {DATE_FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              {/* FX box — only meaningful when the proposal has a non-USD local
                  currency; matches the prod-dev layout (both conversion
                  directions, explicit loading / unavailable states). */}
              {local && local !== "USD" && (
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", flexShrink: 0 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 999, background: "#fff", color: "#000", border: "1.5px solid #000", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>FX</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc" }}>
                    {fxLoading ? (
                      <span style={{ fontSize: 11, color: "#111827", whiteSpace: "nowrap" }}>Loading rate…</span>
                    ) : fxError ? (
                      <span style={{ fontSize: 11, color: "#b91c1c", whiteSpace: "nowrap" }}>Rate unavailable — using 1:1</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                        <span style={{ fontSize: 11, color: "#111827", whiteSpace: "nowrap" }}>
                          1 {fxLabelCurrency} = <strong>{formatFxLabel(fxLabelRate ? 1 / fxLabelRate : 1)}</strong> USD
                        </span>
                        <span style={{ fontSize: 11, color: "#111827", whiteSpace: "nowrap" }}>
                          1 USD = <strong>{formatFxLabel(fxLabelRate)}</strong> {fxLabelCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>


      {rawHeader && (
        <KpiPanel
          rawHeader={rawHeader}
          onChange={(patch) => setRawHeader((p) => p ? { ...p, ...patch } : p)}
          displayScale={displayScale}
          numberFormat={numberFormat}
          fxMultiplier={fxMultiplier}
        />
      )}

      <div style={{ margin: "0", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb" }}>
          {([
            { key: 'current',  label: 'Current Site',  icon: '⊞' },
            { key: 'proposed', label: 'Proposed Site',  icon: '⊞' },
            { key: 'net',      label: 'Net Summary',    icon: '$' },
          ] as const).map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                borderRight: key !== 'net' ? "1px solid #e5e7eb" : "none",
                background: activeTab === key ? DARK_HEADER : "#fff",
                color: activeTab === key ? "#fff" : "#6b7280",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Section name + year controls toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #e5e7eb", minHeight: 48 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            {activeTab === 'current' ? 'Current Site' : activeTab === 'proposed' ? 'Proposed Site' : 'Net Summary — Proposed vs Current'}
          </span>
          {activeTab !== 'net' && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!isReadonly && (
                <>
                  <button type="button" onClick={decreaseYears} disabled={numYears <= 1} style={{ width: 20, height: 20, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: numYears <= 1 ? "not-allowed" : "pointer", color: "#374151", opacity: numYears <= 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>−</button>
                  <span style={{ fontSize: 11, color: "#374151" }}>{numYears} Years</span>
                  <button type="button" onClick={increaseYears} style={{ width: 20, height: 20, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>+</button>
                  <button type="button" onClick={addGroup} style={{ padding: "3px 8px", border: "1px solid #000", borderRadius: 4, fontSize: 11, background: "#fff", cursor: "pointer", color: "#000", fontWeight: 600 }}>+ Add Section</button>
                </>
              )}
              {isReadonly && <span style={{ fontSize: 11, color: "#374151" }}>{numYears} Years</span>}
              <button type="button" onClick={toggleAll} style={neutralButtonStyle({ padding: "3px 10px", fontSize: 11, borderRadius: 4 })}>{allExpanded ? "Collapse All" : "Expand All"}</button>
            </div>
          )}
          {activeTab === 'net' && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>Cash flow impact of moving to Proposed Site</span>
          )}
        </div>

        {/* Net Summary Performance Cards */}
        {activeTab === 'net' && rawHeader && (
          <div style={{ padding: "16px 20px", background: "#fafbfc", borderBottom: "1px solid #e5e7eb" }}>
            <NetSummaryCards
              rawHeader={rawHeader}
              displayScale={displayScale}
              numberFormat={numberFormat}
              fxMultiplier={fxMultiplier}
            />
          </div>
        )}

      {/* Root section bar (Current/Proposed Site, Net Summary) — a page heading,
          not a data row, so it sits above the column header, not inside the table. */}
      {(() => {
        const rootGroup = displayGroups.find(isRootBarGroup);
        if (!rootGroup) return null;
        const isOwnRoot = rootGroup.isCustom === "Y" && rootGroup.isMandatory !== "Y";
        return (
          <div
            data-section-id={rootGroup.sectionId}
            data-section-type={rootGroup.sectionType || rootGroup.id}
            style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 14px", background: "#182a49", cursor: "pointer" }}
            onClick={() => toggleGroup(rootGroup.id)}
          >
            {rootGroup.expanded ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color="#fff" />}
            <div style={{ flex: 1, fontSize: 12, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {sectionNameCell(rootGroup, isOwnRoot, "#fff")}
            </div>
          </div>
        );
      })()}

      {/* ── Main pivot table ── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 28 }} />
              <col style={{ width: colWidths.lineItem }} />
              {data.years.map((y) => <col key={y} style={{ minWidth: 120 }} />)}
              <col style={{ width: 140 }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#e5e7eb", height: 42 }}>
                <th style={TH({ width: 28, background: "#e5e7eb" })} />
                <th style={TH({ textAlign: "left", background: "#e5e7eb", paddingLeft: 14, position: "relative" })}>
                  METRIC
                  <span
                    onMouseDown={(e) => startResize("lineItem", e)}
                    title="Drag to resize"
                    style={{ position: "absolute", top: 0, right: 0, width: 6, height: "100%", cursor: "col-resize", userSelect: "none" }}
                  />
                </th>
                {data.years.map((year: number, yi: number) => (
                  <th key={year}
                    style={TH({ textAlign: "right", background: "#e5e7eb", paddingRight: 14, position: "relative", whiteSpace: "nowrap" })}
                    onMouseMove={(e) => {
                      if (hoverTimer.current) clearTimeout(hoverTimer.current);
                      const r = e.currentTarget.getBoundingClientRect();
                      setHoveredColIdx(e.clientX - r.left > r.width * 0.8 ? yi : null);
                    }}
                    onMouseLeave={() => {
                      if (hoverTimer.current) clearTimeout(hoverTimer.current);
                      hoverTimer.current = setTimeout(() => setHoveredColIdx(null), 150);
                    }}
                  >
                    {/* Insert-year-after affordance on the right edge of the header */}
                    {!isReadonly && hoveredColIdx === yi && (
                      <div style={{ position: "absolute", right: 0, top: "50%", transform: "translate(50%,-50%)", zIndex: 20 }}
                        onMouseEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredColIdx(yi); }}
                        onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredColIdx(null); }}
                      >
                        <button type="button" title="Insert year after" onClick={() => insertYearAfter(yi)} style={{ width: 20, height: 20, background: "#fff", border: "1px solid #9ca3af", borderRadius: 4, cursor: "pointer", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                    )}
                    {editingYearIdx?.yi === yi ? (
                      <input type="text" autoFocus value={editingYearLabel}
                        onChange={(e) => { setEditingYearLabel(e.target.value); setEditingYearError(false); }}
                        onBlur={() => updateColumnLabel(year, editingYearLabel)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateColumnLabel(year, editingYearLabel);
                          else if (e.key === "Escape") { setEditingYearIdx(null); setEditingYearLabel(""); setEditingYearError(false); }
                        }}
                        style={{ width: "100%", padding: "2px 4px", fontSize: 11, fontWeight: 700, border: `1px solid ${editingYearError ? "#dc2626" : "#3b82f6"}`, borderRadius: 3, outline: "none", textAlign: "right", background: editingYearError ? "#fef2f2" : "#fff", color: editingYearError ? "#dc2626" : "#111827" }}
                      />
                    ) : (
                      <div
                        style={{ cursor: isReadonly ? "default" : "pointer" }}
                        onClick={() => { if (isReadonly) return; setOpenYearMenuIdx(openYearMenuIdx?.yi === yi ? null : { gId: "table", yi }); }}
                        onDoubleClick={() => {
                          if (isReadonly) return;
                          setOpenYearMenuIdx(null);
                          setEditingYearIdx({ gId: "table", yi });
                          setEditingYearLabel(data.columnLabels[year] || `FY${String(year).slice(2)}`);
                        }}
                      >
                        {data.columnLabels[year] || `FY${String(year).slice(2)}`}
                      </div>
                    )}
                    {openYearMenuIdx?.yi === yi && (
                      <div ref={yearMenuRef} style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, width: 160, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.1)", zIndex: 50, textAlign: "left" }}>
                        <button type="button" onClick={() => {
                          setOpenYearMenuIdx(null);
                          setEditingYearIdx({ gId: "table", yi });
                          setEditingYearLabel(data.columnLabels[year] || `FY${String(year).slice(2)}`);
                        }} style={yearMenuItem}>Rename</button>
                        {yi > 0 && <button type="button" onClick={() => moveYearLeft(yi)} style={yearMenuItem}><ChevronLeft size={12} /> Move Left</button>}
                        {yi < data.years.length - 1 && <button type="button" onClick={() => moveYearRight(yi)} style={yearMenuItem}><ChevronRight size={12} /> Move Right</button>}
                        <button type="button" onClick={() => {
                          setOpenYearMenuIdx(null);
                          if (dbYearsRef.current.has(year)) {
                            setToast({ kind: "error", message: "This year is saved in the database and cannot be deleted." });
                          } else {
                            setConfirmDeleteYear({ year, label: data.columnLabels[year] || `FY${String(year).slice(2)}` });
                          }
                        }} style={{ ...yearMenuItem, borderTop: "1px solid #f3f4f6", color: "#b91c1c" }}><Trash2 size={12} /> Delete</button>
                      </div>
                    )}
                  </th>
                ))}
                <th style={TH({ textAlign: "right", background: "#e5e7eb", paddingRight: 14 })}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {displayGroups.map((group: Group) => {
                const mergedLines  = getMergedLines(group);
                // A section is user-owned (renameable + deletable) when the API
                // flags it custom, or when it was just added in this session and
                // has no persisted id yet.
                const isOwnSection = group.isCustom === "Y" && group.isMandatory !== "Y";
                const editable     = mergedLines.filter(({ value }) => value.isCalculated !== "Y");
                const calculated   = mergedLines.filter(({ value }) => value.isCalculated === "Y");
                const sectionValues = data.years.reduce<Record<number, number>>((acc, year) => {
                  acc[year] = computeDescendantTotal(group, year);
                  return acc;
                }, {});
                const sectionTotal = data.years.reduce((s, y) => s + (sectionValues[y] || 0), 0);
                const addSource    = getAddSource(group);
                const isNetTab     = activeTab === 'net';

                // Direct children of tab root get dark navy header; deeper non-merged sections get bold yellow row.
                // Also treat the section itself as top-level when it IS the tab root (e.g. NET_SUMMARY has no children).
                const isTopLevel = isTopLevelGroup(group);
                // The tab root's own bar is rendered once, above the column header (see above) —
                // skip it here so it isn't duplicated as an in-table totals row.
                const isRootBar = isRootBarGroup(group);

                return (
                  <React.Fragment key={group.id}>
                    {/* Section header row — dark navy for top-level, grey (read-only) for sub-sections */}
                    {isRootBar ? null : isTopLevel ? (
                      <tr
                        data-section-id={group.sectionId}
                        data-section-type={group.sectionType || group.id}
                        style={{ background: "#182a49", cursor: "pointer" }}
                        onClick={() => toggleGroup(group.id)}
                      >
                        <td style={{ ...TD, height: 40, borderBottom: "1px solid #293a59", textAlign: "center", color: "#fff" }}>
                          {group.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td style={{ ...TD, padding: "8px 14px", fontSize: 12, fontWeight: 800, color: "#fff", borderBottom: "1px solid #293a59", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {sectionNameCell(group, isOwnSection, "#fff")}
                        </td>
                        {data.years.map((year: number) => (
                          <td key={year} style={{ ...TD, padding: "8px 14px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#fff", borderBottom: "1px solid #293a59" }}>
                            {isNetTab ? netFmt(sectionValues[year] || 0) : displayFmt(sectionValues[year] || 0)}
                          </td>
                        ))}
                        <td style={{ ...TD, padding: "8px 14px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#fff", borderBottom: "1px solid #293a59" }}>
                          {isNetTab ? netFmt(sectionTotal) : displayFmt(sectionTotal)}
                        </td>
                      </tr>
                    ) : (
                      <tr
                        data-section-id={group.sectionId}
                        data-section-type={group.sectionType || group.id}
                        style={{ background: isNetTab ? "#fff" : "#f3f4f6", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}
                        onClick={() => toggleGroup(group.id)}
                      >
                        <td style={{ ...TD, height: 36, borderBottom: "1px solid #e5e7eb", textAlign: "center", color: "#374151" }}>
                          {group.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td style={{ ...TD, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#1f2937", borderBottom: "1px solid #e5e7eb" }}>
                          {sectionNameCell(group, isOwnSection, "#1f2937")}
                        </td>
                        {data.years.map((year: number) => (
                          <td key={year} style={{ ...TD, padding: "6px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#1f2937", borderBottom: "1px solid #e5e7eb" }}>
                            {isNetTab ? netFmt(sectionValues[year] || 0) : displayFmt(sectionValues[year] || 0)}
                          </td>
                        ))}
                        <td style={{ ...TD, padding: "6px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#1f2937", borderBottom: "1px solid #e5e7eb" }}>
                          {isNetTab ? netFmt(sectionTotal) : displayFmt(sectionTotal)}
                        </td>
                      </tr>
                    )}

                    {/* Editable line rows (yellow) */}
                    {group.expanded && editable.map(({ value, src }) => {
                      const acKey = `${src.id}|${value.id}`;
                      const isAC  = activeAutocomplete === acKey;
                      const navRow = navRowCounter++;
                      return (
                        <tr key={value.id} style={{ background: "#fff" }}>
                          <td style={{ ...TD, padding: "4px 0", textAlign: "center", verticalAlign: "middle" }}>
                            {!isReadonly && value.isMandatory !== "Y" && value.isCustom !== "N" && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: src.id, vId: value.id, name: value.name, kind: "line" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                            )}
                          </td>
                          <td style={{ ...TD, padding: "4px 14px", position: "relative", overflow: "hidden", background: isReadonly ? "#f3f4f6" : "#fff" }} title={value.name}>
                            <input type="text"
                              value={isAC ? autocompleteSearch : value.name}
                              readOnly={isReadonly}
                              onChange={(e) => { updateValueName(src.id, value.id, e.target.value); if (isAC) setAutocompleteSearch(e.target.value); }}
                              onFocus={(e) => { e.stopPropagation(); setActiveAutocomplete(acKey); setAutocompleteSearch(value.name); }}
                              onPaste={(e) => handleNamePaste(e, src.id, value.id)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Enter line item name"
                              style={{ width: "100%", border: "none", background: isReadonly ? "#f3f4f6" : "transparent", fontSize: 12, color: "#1f2937", outline: "none", textOverflow: "ellipsis", height: 30 }}
                            />
                          </td>
                          {data.years.map((year: number, yi: number) => {
                            const stored = value.yearValues[year] ?? 0;
                            const scaled = (stored * fxMultiplier) / scaleDivisorFor(displayScale);
                            const isEditingThis = editingCell?.gId === src.id && editingCell?.vId === value.id && editingCell?.year === year;
                            return (
                              <td key={year} style={{ ...TD, padding: "4px 14px", background: isReadonly ? "#f3f4f6" : "#fff" }}>
                                <input type="text"
                                  data-nav-row={navRow}
                                  data-nav-col={yi}
                                  value={isEditingThis ? editingCell.raw : formatEditableInputValue(stored)}
                                  placeholder="—"
                                  readOnly={isReadonly}
                                  onFocus={() => {
                                    const displayed = stored === 0 ? "" : String(parseFloat(scaled.toFixed(scaleDecimalsFor(displayScale))));
                                    setEditingCell({ gId: src.id, vId: value.id, year, raw: displayed });
                                  }}
                                  onChange={(e) => {
                                    if (!isValidNumericInput(e.target.value)) return;
                                    setEditingCell((prev) => prev ? { ...prev, raw: e.target.value } : null);
                                  }}
                                  onBlur={() => {
                                    if (isEditingThis) {
                                      updateCellValue(src.id, value.id, year, editingCell.raw);
                                      setEditingCell(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  onPaste={(e) => handleValueCellPaste(e, src.id, value.id, yi)}
                                  onKeyDown={(e) => handleCellKeyDown(e, navRow, yi)}
                                  style={{ width: "100%", textAlign: "right", border: "none", background: isReadonly ? "#f3f4f6" : "transparent", fontSize: 12, color: scaled < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 30 }}
                                />
                              </td>
                            );
                          })}
                          {(() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "4px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: t < 0 ? "#DC2626" : "#1f2937" }}>{displayFmt(t)}</td>; })()}
                        </tr>
                      );
                    })}

                    {/* Add line button */}
                    {group.expanded && !isReadonly && !isNetTab && addSource && addSource.isNewLineRequired !== "N" && (
                      <tr key={`${group.id}-add`}>
                        <td colSpan={numYears + 3} style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb" }}>
                          <button type="button" onClick={() => addValueRow(addSource.id)} style={neutralButtonStyle({ fontSize: 12, padding: "7px 12px", border: "none" })}>
                            + Add {getAddLineLabel(addSource)} Line
                          </button>
                        </td>
                      </tr>
                    )}

                    {/* Calculated / summary line rows — read-only, but still keyboard-navigable */}
                    {group.expanded && calculated.map(({ value }) => {
                      const navRow = navRowCounter++;
                      return (
                      <tr key={value.id} style={{ background: isNetTab ? "#fff" : "#f3f4f6" }}>
                        <td colSpan={2} style={{ ...TD, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#1f2937", background: isNetTab ? "#fff" : "#f3f4f6" }}>{value.name}</td>
                        {data.years.map((year: number, yi: number) => {
                          const val = value.yearValues[year] ?? 0;
                          const col = isNetTab ? netColor(val) : (val < 0 ? "#DC2626" : "#1f2937");
                          const text = isNetTab ? netFmt(val) : displayFmt(val);
                          return (
                            <td key={year} style={{ ...TD, padding: "4px 14px", background: isNetTab ? "#fff" : "#f3f4f6" }}>
                              <input
                                type="text"
                                readOnly
                                data-nav-row={navRow}
                                data-nav-col={yi}
                                value={val === 0 ? "" : text}
                                placeholder="—"
                                onKeyDown={(e) => handleCellKeyDown(e, navRow, yi)}
                                style={{ width: "100%", textAlign: "right", border: "none", background: isNetTab ? "#fff" : "#f3f4f6", fontSize: 12, fontWeight: 700, color: col, outline: "none", cursor: "default", height: 30 }}
                              />
                            </td>
                          );
                        })}
                        {(() => {
                          const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0);
                          const col = isNetTab ? netColor(t) : (t < 0 ? "#DC2626" : "#1f2937");
                          return <td style={{ ...TD, padding: "4px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: col }}>{isNetTab ? netFmt(t) : displayFmt(t)}</td>;
                        })()}
                      </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
      </div>
      </div>

    </div>
  );
}
