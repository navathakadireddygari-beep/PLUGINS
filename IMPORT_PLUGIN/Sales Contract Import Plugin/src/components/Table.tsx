import React, { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, RefreshCw, Save, Check } from "lucide-react";
import { getAppConfig } from "../config/app-config";
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
import { NUMBER_FORMATS, getNumFmt, formatNumber, plainNumber, parseFormatted, type NumFmtKey } from "./number-format";
import { subscribeAllActions, publishAction } from "../lib";
import KpiPanel from "./KpiPanel";
import Toast, { type ToastState } from "./Toast";

const BRAND        = "#A5005A";
const DARK_HEADER  = "#2d3748";
const DARK_TOGGLE  = "#1e2433";
const WIDGET_MAX_WIDTH = "none";

// Currency conversion: the DB always stores USD. exchange_rate is "1 local = X USD"
// (e.g. 0.735 → 1 CAD = 0.735 USD, i.e. 1 USD ≈ 1.36 CAD). Display multiplies
// USD by (1 / rate) for the local currency, and by 1 for USD.
const DEFAULT_FX_RATE = 0.7350;

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

const SCALES: { label: string; value: number }[] = [
  { label: "K", value: 1_000         },
  { label: "M", value: 1_000_000     },
  { label: "B", value: 1_000_000_000 },
];

// Date display formats for the Target Go Live column.
type DateFmt = "dd-mm-yyyy" | "dd-mon-yyyy" | "yyyy-mm-dd" | "mm/dd/yyyy";
const DATE_FORMATS: { value: DateFmt; label: string }[] = [
  { value: "dd-mm-yyyy",  label: "dd-mm-yyyy" },
  { value: "dd-mon-yyyy", label: "dd-mon-yyyy" },
  { value: "yyyy-mm-dd",  label: "yyyy-mm-dd" },
  { value: "mm/dd/yyyy",  label: "mm/dd/yyyy (US)" },
];
const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
   row values come entirely from the backend (GET) response and must
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

/* ─────────────────────────── Component ──────────────────────────── */
export default function PivotTableWithAPI(): React.ReactElement {

  const [data,        setData]        = useState<PivotTableData | null>(null);
  const [rawHeader,   setRawHeader]   = useState<ApiHeader | null>(null);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const [accountCodesBySection, setAccountCodesBySection] = useState<Record<string, AccountCode[]>>({});
  const [displayScale,  setDisplayScale]  = useState<number>(1000);
  // exchange_rate is stored as "1 local-currency (e.g. CAD) = X USD" (e.g. 0.735).
  // DEFAULT_FX_RATE is the fallback when the API header omits it.
  const [exchangeRate,  setExchangeRate]  = useState<number>(DEFAULT_FX_RATE);

  // Raw text buffer for the percentage cell currently being edited, so a user
  // can type in-progress values like "12." (which would otherwise be stripped
  // to a number by updateCellValue on every keystroke). Keyed by `${vId}-${year}`.
  const [pctEdit, setPctEdit] = useState<{ key: string; text: string } | null>(null);

  // Selected date format for the Target Go Live column (default dd-mm-yyyy).
  const [dateFormat, setDateFormat] = useState<DateFmt>("dd-mm-yyyy");

  // Selected number format (thousands/decimal separators) — display only; the
  // stored/API value stays a raw number. Default US/UK (1,234,567.89).
  const [numberFormat, setNumberFormat] = useState<NumFmtKey>("us");
  // Raw text buffer for the numeric value cell currently being edited (like
  // pctEdit) so users can type unambiguously; keyed by `${vId}-${year}`.
  const [numEdit, setNumEdit] = useState<{ key: string; text: string } | null>(null);

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
  const [pasteToast,         setPasteToast]         = useState<{ gId: string; count: number } | null>(null);
  const [confirmDelete,      setConfirmDelete]      = useState<{ gId: string; vId?: string; name: string; kind: "line" | "section" } | null>(null);
  const [deletingRow,        setDeletingRow]        = useState<boolean>(false);
  const [confirmDeleteYear,  setConfirmDeleteYear]  = useState<{ year: number; label: string } | null>(null);
  const [stripTooltip,       setStripTooltip]       = useState<"currency" | "scale" | null>(null);
  const [stripTooltipPos,    setStripTooltipPos]    = useState<DOMRect | null>(null);
  const [activeLov,          setActiveLov]          = useState<{ gId: string; vId: string; sectionType: string; currentValue?: string } | null>(null);
  const [lovSearch,          setLovSearch]          = useState<string>("");
  const [headerPinned,     setHeaderPinned]     = useState<boolean>(false);
  const [headerHeight,     setHeaderHeight]     = useState<number>(0);
  const [leftOffset,       setLeftOffset]       = useState<number>(0);
  const [containerWidth,   setContainerWidth]   = useState<number>(0);
  const dbYearsRef   = useRef<Set<number>>(new Set());
  const headerRef    = useRef<HTMLDivElement>(null);
  const sentinelRef  = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Access control ───────────────────────────────────────────────
     Resolved server-side (owner → collaborator → JSON role) and injected
     via the config global; getAppConfig() fails closed when absent. When
     read-only, every mutation handler short-circuits (which also freezes
     the controlled inputs) and the editing controls are not rendered. */
  const isReadOnly = useState<boolean>(() => getAppConfig().is_readonly)[0];

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
  const [colWidths, setColWidths] = useState<{ lineItem: number; account: number; targetGoLive: number }>({ lineItem: 180, account: 240, targetGoLive: 150 });
  const resizeRef = useRef<{ col: "lineItem" | "account" | "targetGoLive"; startX: number; startW: number } | null>(null);

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

  const startResize = (col: "lineItem" | "account" | "targetGoLive", e: React.MouseEvent) => {
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
  const lovRef          = useRef<HTMLDivElement>(null);
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

  // Sync exchange rate from API header when present; otherwise keep DEFAULT_FX_RATE.
  useEffect(() => {
    if (rawHeader?.exchange_rate != null && rawHeader.exchange_rate > 0) {
      setExchangeRate(rawHeader.exchange_rate);
    }
  }, [rawHeader?.exchange_rate]);

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
      //console.log("[Table] tool:refresh_financial_evaluation received, sectionId =", sid);
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
            /financial[_-]?eval/i.test(l.getAttribute("href") ?? ""),
          );
          if (finLink) {
            //console.log("[Table] clicking Financial Evaluation tab:", finLink);
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
    if (isReadOnly) return;            // access control — no saves when read-only
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
      //console.log("[fin_eval] dispatching tool:fin_eval_saved", saveEvent.detail);
      window.dispatchEvent(saveEvent);
      // AppBridge outbound — notify the chatbot the save completed.
      publishAction({
        source: "editor",
        target: "chatbot",
        action: "fin-eval:saved",
        payload: { proposalId: cfg.proposal_id, method },
      });
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
  }, [data, rawHeader, isReadOnly]);

  /* ── AppBridge inbound commands ───────────────────────────────────
     Subscribe under our own typed id ("fin-eval") and the legacy id the
     chatbot targets ("editor"). One handler switches on the action. This
     runs alongside — and independently of — the window CustomEvent
     wiring above. Degrades to a silent no-op when window.AppBridge is
     absent (standalone / dev). */
  useEffect(() => {
    const handle = (env: { action: string | symbol | number; payload: unknown }): void => {
      const action  = String(env.action);
      const payload = (env.payload ?? {}) as { sectionId?: string | number | null; sectionType?: string };
      switch (action) {
        case "fin-eval:refresh":
        case "tool:refresh_financial_evaluation": {
          const sid = payload.sectionId != null ? String(payload.sectionId).trim() : null;
          //console.log("[Table] AppBridge refresh, sectionId =", sid);
          if (sid && sid !== "null") void refreshSection(sid);
          else void loadData();
          break;
        }
        case "fin-eval:save":
          //console.log("[Table] AppBridge save");
          void saveDraft();
          break;
        case "fin-eval:scroll-to-section":
          //console.log("[Table] AppBridge scroll-to-section, sectionType =", payload.sectionType);
          if (payload.sectionType) setScrollTarget(payload.sectionType);
          break;
        default:
          break;
      }
    };
    const unsubFinEval = subscribeAllActions("fin-eval", handle);
    const unsubEditor  = subscribeAllActions("editor", handle);
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

  useEffect(() => {
    const h = (e: MouseEvent): void => { if (lovRef.current && !lovRef.current.contains(e.target as Node)) { setActiveLov(null); setLovSearch(""); } };
    if (activeLov) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [activeLov]);

  /* DB values are always in USD. fxMultiplier converts USD → display currency for
     rendering, and divides user input back to USD before storing in state.
     exchange_rate is "1 local = X USD", so the local-currency multiplier is (1 / rate):
       - USD display → ×1 (no conversion)
       - local display (e.g. CAD) → ×(1 / rate)
     e.g. 3,000,000 USD × (1 / 0.735) = 4,081,632 CAD. */
  const fxMultiplier: number = (() => {
    if (!rawHeader) return 1;
    const display = (rawHeader.display_currency || rawHeader.local_currency || "").toUpperCase();
    if (display === "USD") return 1;
    const rate = exchangeRate > 0 ? exchangeRate : DEFAULT_FX_RATE;
    return 1 / rate;
  })();

  // API values are already stored in thousands (K), so at K we show them as-is
  //   (÷1); only M and B divide further. divisor = scale / 1,000:
  //     K (1,000)         → ÷1          (no change — data is already in K)
  //     M (1,000,000)     → ÷1,000
  //     B (1,000,000,000) → ÷1,000,000
  //   Both the grid and the KPI cards use this factor so they move together;
  //   the cards additionally append the K/M/B letter (KpiPanel.scaleUnit).
  const scaleDivisor = (scale: number): number => scale / 1_000;

  // Decimal places shown depend on the active scale: K = whole numbers,
  // M = 1 decimal, B = 2 decimals.
  const decimalsForScale = (scale: number): number =>
    scale === 1_000_000_000 ? 2 : scale === 1_000_000 ? 1 : 0;

  // Active number-format spec (thousands/decimal separators) — display only.
  const numFmt = getNumFmt(numberFormat);

  const displayFmt = (n: number): string => {
    if (!n) return "—";
    const v = (n * fxMultiplier) / scaleDivisor(displayScale);
    const formatted = formatNumber(Math.abs(v), numFmt, decimalsForScale(displayScale));
    return v < 0 ? `(${formatted})` : formatted;
  };

  /* Percentage rows (e.g. "Margin %") are currency-agnostic — they must not be
     multiplied by the exchange rate or divided by the scale factor. */
  const isPercentRow = (value: ValueRow): boolean => {
    const name = (value.name || "").trim();
    const ident = `${value.lineIdentifier || ""} ${value.lineType || ""}`.toUpperCase();
    return name.endsWith("%") || /PCT|PERCENT|MARGIN_?%/.test(ident);
  };

  const displayPercent = (n: number): string => {
    if (!n) return "—";
    const formatted = formatNumber(Math.abs(n), numFmt, decimalsForScale(displayScale));
    return n < 0 ? `(${formatted})` : formatted;
  };

  // Row-aware formatter: percent rows bypass currency/scale conversion.
  const displayRow = (value: ValueRow, n: number): string =>
    isPercentRow(value) ? displayPercent(n) : displayFmt(n);

  const targetGoLive = (): string => {
    const raw = rawHeader?.date_placed_in_service;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-GB");
  };

  // Format a line's target_go_live_date for read-only display in the selected
  // dateFormat. The API returns a timestamp ("2026-07-15T00:00:00"); we parse
  // the date part as a string (no Date object) to avoid any timezone shift.
  const fmtGoLiveDate = (raw?: string): string => {
    if (!raw) return "";
    const datePart = raw.split("T")[0];                       // "2026-07-15"
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
    if (!m) return datePart;                                  // unknown shape → show as-is
    const [, yyyy, mm, dd] = m;
    const mon = MONTHS_ABBR[parseInt(mm, 10) - 1] ?? mm;
    switch (dateFormat) {
      case "dd-mon-yyyy": return `${dd}-${mon}-${yyyy}`;
      case "yyyy-mm-dd":  return `${yyyy}-${mm}-${dd}`;
      case "mm/dd/yyyy":  return `${mm}/${dd}/${yyyy}`;
      case "dd-mm-yyyy":
      default:            return `${dd}-${mm}-${yyyy}`;
    }
  };

  /* ── Loading / error gates ──────────────────────────────────── */
  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
      <div style={{ display: "inline-block", animation: "spin 1s linear infinite", marginBottom: 10 }}><RefreshCw size={20} /></div>
      <div>Loading Sales Contracts data…</div>
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
  // Only reserve the Target Go Live column when at least one section requires it;
  // otherwise it collapses to width 0 so there's no empty gap in the table.
  const anyGoLive  = data.groups.some((g) => g.isGoLiveReq === "Y");

  /* ── Year management ────────────────────────────────────────── */
  const insertYearAfter = (idx: number): void => { if (isReadOnly) return; setData((p) => { if (!p) return p; const y = Math.max(...p.years) + 1; return { ...p, years: [...p.years.slice(0, idx + 1), y, ...p.years.slice(idx + 1)], columnLabels: { ...p.columnLabels, [y]: `FY${String(y).slice(2)}` }, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => ({ ...v, yearValues: { ...v.yearValues, [y]: 0 } })) })) }; }); setHoveredColIdx(null); };
  const removeYear = (year: number): void => { if (isReadOnly) return; if (data.years.length <= 1) return; setData((p) => { if (!p) return p; const lbl = { ...p.columnLabels }; delete lbl[year]; return { ...p, years: p.years.filter((y) => y !== year), columnLabels: lbl, groups: p.groups.map((g) => ({ ...g, values: g.values.map((v) => { const nv = { ...v.yearValues }; delete nv[year]; return { ...v, yearValues: nv }; }) })) }; }); setConfirmDeleteYear(null); setOpenYearMenuIdx(null); };
  const updateColumnLabel = (year: number, lbl: string): void => {
    if (isReadOnly) return;
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
  const moveYearLeft  = (i: number): void => { if (isReadOnly) return; if (i <= 0) return; setData((p) => { if (!p) return p; const y = [...p.years]; [y[i-1], y[i]] = [y[i], y[i-1]]; return { ...p, years: y }; }); setOpenYearMenuIdx(null); };
  const moveYearRight = (i: number): void => { if (isReadOnly) return; if (i >= data.years.length - 1) return; setData((p) => { if (!p) return p; const y = [...p.years]; [y[i], y[i+1]] = [y[i+1], y[i]]; return { ...p, years: y }; }); setOpenYearMenuIdx(null); };

  /* ── Group / row CRUD ───────────────────────────────────────── */
  const blankRow    = (p: PivotTableData): ValueRow => ({ id: generateId(), name: "", yearValues: p.years.reduce((a: YearValues, y) => ({ ...a, [y]: 0 }), {}), lineType: "CUSTOM", lineIdentifier: "FINANCIAL", isCalculated: "N", isCustom: "Y", status: "ACTIVE", languageCode: "EN" });
  const toggleGroup = (id: string): void => setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === id ? { ...g, expanded: !g.expanded } : g) }) : p);
  const toggleAll   = (): void => { const n = !allExpanded; setAllExpanded(n); setData((p) => p ? ({ ...p, groups: p.groups.map((g) => ({ ...g, expanded: n })) }) : p); };
  const addValueRow = (gId: string): void => { if (isReadOnly) return; setData((p) => p ? ({
    ...p,
    groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: [...g.values, blankRow(p)] }, p.years) : g),
  }) : p); };
  const removeValueRow = (gId: string, vId: string): void => { if (isReadOnly) return; setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? recomputeGroup({ ...g, values: g.values.filter((v) => v.id !== vId) }, p.years) : g) }) : p); };
  const updateCellValue = (gId: string, vId: string, year: number, raw: string): void => {
    if (isReadOnly) return;
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

  /* ── Numeric value cells: display in the selected number format, but keep the
     stored value a raw number (so the API is unaffected). While a cell is
     focused we show an ungrouped buffer (numEdit) so typing is unambiguous. ── */
  const numCellText = (cellKey: string, storedVal: number): string => {
    if (numEdit && numEdit.key === cellKey) return numEdit.text;
    if (storedVal === 0) return "";
    return formatNumber((storedVal * fxMultiplier) / scaleDivisor(displayScale), numFmt, decimalsForScale(displayScale));
  };
  const numCellFocus = (cellKey: string, storedVal: number): void => {
    if (isReadOnly) return;
    const dv = storedVal === 0 ? 0 : (storedVal * fxMultiplier) / scaleDivisor(displayScale);
    setNumEdit({ key: cellKey, text: storedVal === 0 ? "" : plainNumber(dv, numFmt, decimalsForScale(displayScale)) });
  };
  const numCellChange = (gId: string, vId: string, year: number, cellKey: string, raw: string): void => {
    if (isReadOnly) return;
    if (raw !== "" && /[^\d\s.,'-]/.test(raw)) return;   // digits + separators only
    setNumEdit({ key: cellKey, text: raw });
    const num = parseFormatted(raw, numFmt);
    updateCellValue(gId, vId, year, String((num * scaleDivisor(displayScale)) / fxMultiplier));
  };
  const numCellBlur = (): void => setNumEdit(null);
  // Percentage cells: numeric only, range 0–100, max 2 decimal places. Unlike
  // currency cells they bypass currency/scale conversion (a rate is literal).
  // Invalid keystrokes are rejected (the controlled value reverts).
  const PCT_PATTERN = /^\d{0,3}(\.\d{0,2})?$/;
  const renderPercentInput = (
    gId: string, value: ValueRow, year: number, inputStyle: React.CSSProperties,
  ): React.ReactElement => {
    const val     = value.yearValues[year] ?? 0;
    const cellKey = `${value.id}-${year}`;
    const editing = pctEdit?.key === cellKey;
    return (
      <input
        className="spc-nav-cell"
        type="text"
        inputMode="decimal"
        value={editing ? pctEdit!.text : (val === 0 ? "" : val.toFixed(decimalsForScale(displayScale)))}
        placeholder="—"
        readOnly={isReadOnly}
        onFocus={() => setPctEdit({ key: cellKey, text: val === 0 ? "" : String(val) })}
        onBlur={() => setPctEdit(null)}
        onChange={(e) => {
          if (isReadOnly) return;
          const raw = e.target.value;
          if (raw !== "" && !PCT_PATTERN.test(raw)) return;   // reject non-numeric / >2 decimals
          if (raw !== "" && parseFloat(raw) > 100) return;    // reject out of 0–100 range
          setPctEdit({ key: cellKey, text: raw });
          updateCellValue(gId, value.id, year, raw === "" ? "0" : raw);
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleCellNav}
        style={inputStyle}
      />
    );
  };

  // Excel-style arrow-key navigation between value cells. Every numeric input is
  // tagged with class "spc-nav-cell"; on an arrow key we focus the nearest cell
  // in that direction (chosen spatially, so it works across any table layout).
  const handleCellNav = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const dir: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const d = dir[e.key];
    if (!d) return;
    const cur   = e.currentTarget;
    const cells = Array.from(document.querySelectorAll<HTMLInputElement>("input.spc-nav-cell"));
    const r0 = cur.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best: HTMLInputElement | null = null, bestScore = Infinity;
    for (const c of cells) {
      if (c === cur) continue;
      const r = c.getBoundingClientRect();
      const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      if (d[0] === -1 && dx >= -1) continue;   // must lie in the arrow direction
      if (d[0] === 1  && dx <= 1)  continue;
      if (d[1] === -1 && dy >= -1) continue;
      if (d[1] === 1  && dy <= 1)  continue;
      const primary = d[0] !== 0 ? Math.abs(dx) : Math.abs(dy);
      const cross   = d[0] !== 0 ? Math.abs(dy) : Math.abs(dx);
      const score   = primary + cross * 3;     // penalize cross-axis drift
      if (score < bestScore) { bestScore = score; best = c; }
    }
    if (best) { e.preventDefault(); best.focus(); best.select(); }
  };
  const updateValueName = (gId: string, vId: string, name: string): void => { if (isReadOnly) return; setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, values: g.values.map((v) => v.id === vId ? { ...v, name } : v) } : g) }) : p); };
  const updateGroupName = (gId: string, name: string): void => { if (isReadOnly) return; setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === gId ? { ...g, name } : g) }) : p); setEditingGroupId(null); setEditingGroupName(""); };

  /* ── Paste handlers ─────────────────────────────────────────── */
  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>, gId: string, vId: string): void => {
    if (isReadOnly) return;
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
        const isBlank = (!ex?.name || ex?.name === "New Line Item") && Object.values(ex.yearValues).every((v) => v === 0);
        const withRows: Group = { ...g, values: isBlank ? [...g.values.slice(0, idx), ...newRows, ...g.values.slice(idx + 1)] : [...g.values.slice(0, idx + 1), ...newRows, ...g.values.slice(idx + 1)] };
        return recomputeGroup(withRows, p.years);
      }) };
    });
    setPasteToast({ gId, count: parsed.length }); setActiveAutocomplete(null); setAutocompleteSearch("");
  };

  const handleValueCellPaste = (e: React.ClipboardEvent<HTMLInputElement>, gId: string, vId: string, startYearIdx: number): void => {
    if (isReadOnly) return;
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
    setData((p) => { if (!p) return p; return { ...p, groups: p.groups.map((g) => { if (g.id !== gId) return g; const si = g.values.findIndex((v) => v.id === vId); if (si === -1) return g; const withValues: Group = { ...g, values: g.values.map((v, ri) => { const off = ri - si; if (off < 0 || off >= parsedRows.length) return v; const nv: YearValues = { ...v.yearValues }; parsedRows[off].forEach((val, ci) => { const yi = startYearIdx + ci; if (yi < p.years.length) nv[p.years[yi]] = val; }); return { ...v, yearValues: nv }; }) }; return recomputeGroup(withValues, p.years); }) }; });
    const grp = data.groups.find((g) => g.id === gId);
    const si  = grp ? grp.values.findIndex((v) => v.id === vId) : 0;
    setPasteToast({ gId, count: grp ? Math.min(parsedRows.length, grp.values.length - si) : parsedRows.length });
  };

  /* ────────────────────────────── JSX ────────────────────────── */
  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: WIDGET_MAX_WIDTH, margin: "0 auto", background: "#fff" }}>
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
                        apiMessage = resp.apiMessage || resp.api_message;
                      }
                      setData((p) => p ? { ...p, groups: p.groups.filter((g) => g.id !== gId) } : p);
                    } else {
                      const row = dataRef.current?.groups.find((g) => g.id === gId)?.values.find((v) => v.id === vId);
                      if (row?.lineId != null) {
                        const resp = await deleteLine(cfg, row.lineId);
                        apiMessage = resp.apiMessage || resp.api_message;
                      }
                      if (vId) removeValueRow(gId, vId);
                    }
                    setConfirmDelete(null);
                    setToast({
                      kind: "success",
                      message: apiMessage || (kind === "section" ? "Section deleted successfully." : "Line deleted successfully."),
                    });
                    const deleteEvent = new CustomEvent("tool:fin_eval_deleted", { detail: { proposalId: cfg.proposal_id } });
                    //console.log("[fin_eval] dispatching tool:fin_eval_deleted", deleteEvent.detail);
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 24px", minHeight: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Edit-only controls — hidden for read-only users */}
            {!isReadOnly && (
              <>
                <button
                  id="fin-eval-validate-btn"
                  type="button"
                  onClick={() => { /* TODO: validate */ }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #04A500", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#fff", color: "#04A500", cursor: "pointer" }}
                >
                  <Check size={14} />
                  Validate
                </button>
                <button
                  id="fin-eval-save-model-btn"
                  type="button"
                  onClick={saveDraft}
                  disabled={savingDraft || loading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, background: BRAND, color: "#fff", cursor: savingDraft || loading ? "not-allowed" : "pointer", opacity: savingDraft || loading ? 0.7 : 1 }}
                >
                  <Save size={14} />
                  {savingDraft ? "Saving…" : "Save Model"}
                </button>
              </>
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
            const evt = new CustomEvent("tool:fin_eval_currency_changed", {
              detail: { currency: cur, proposalId: cfg.proposal_id },
            });
            //console.log("[fin_eval] dispatching tool:fin_eval_currency_changed", evt.detail);
            window.dispatchEvent(evt);
          };

          const handleScaleChange = (scale: number) => {
            setDisplayScale(scale);
            const cfg = getAppConfig();
            const denomination = scale === 1_000_000_000 ? "B" : scale === 1_000_000 ? "M" : "K";
            const evt = new CustomEvent("tool:fin_eval_scale_changed", {
              detail: { scale, denomination, label: denomination, proposalId: cfg.proposal_id },
            });
            //console.log("[fin_eval] dispatching tool:fin_eval_scale_changed", evt.detail);
            window.dispatchEvent(evt);
          };

          const infoIcon = (kind: "currency" | "scale", tooltipText: string) => (
            <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { setStripTooltipPos(e.currentTarget.getBoundingClientRect()); setStripTooltip(kind); }}
              onMouseLeave={() => setStripTooltip(null)}
            >
              <span style={{ width: 18, height: 18, borderRadius: 999, border: "1.5px solid #9ca3af", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "default", userSelect: "none" }}>i</span>
              {stripTooltip === kind && stripTooltipPos && createPortal(
                // Overlays the page via a portal so the tooltip never inflates the scrollable strip.
                <span style={{ position: "fixed", left: stripTooltipPos.right + 6, top: stripTooltipPos.top - 4, background: DARK_TOGGLE, color: "#fff", padding: "6px 10px", borderRadius: 4, fontSize: 13, whiteSpace: "normal", width: 360, lineHeight: 1.5, zIndex: 9999, boxShadow: "0 4px 14px rgba(0,0,0,.25)", pointerEvents: "none" }}>
                  {tooltipText}
                </span>,
                document.body
              )}
            </div>
          );

          return (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              {/* Currency label + toggle + info */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>CURRENCY</span>
              <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                {currencies.map((cur, i) => (
                  <button key={cur} type="button" onClick={() => handleCurrencyChange(cur)} style={toggleBtn(display === cur, i === 0)}>
                    {currencyLabel(cur)}
                  </button>
                ))}
              </div>
              {infoIcon("currency", `Local Currency is ${local}. All values are displayed in ${display}.`)}

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
              {infoIcon("scale", "Switch the denomination for all financial values. K = thousands (default), M = millions, B = billions.")}

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Number format label + dropdown */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>NUMBER</span>
              <select
                value={numberFormat}
                onChange={(e) => setNumberFormat(e.target.value as NumFmtKey)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                {NUMBER_FORMATS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

              {/* Date format label + dropdown */}
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5 }}>DATE</span>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFmt)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* FX rate reference display — only relevant when converting local ↔ USD */}
              {display !== local && local && (
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 11, color: "#374151", lineHeight: 1.5 }}>
                  <span>1 {local} = {exchangeRate > 0 ? exchangeRate.toFixed(4) : "—"} USD</span>
                  <span>1 USD = {exchangeRate > 0 ? (1 / exchangeRate).toFixed(4) : "—"} {local}</span>
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
          fxMultiplier={fxMultiplier}
          numFmt={numFmt}
        />
      )}

      <div style={{ margin: "0", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 20px", borderBottom: "1px solid #e5e7eb", minHeight: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isReadOnly && (
            <span title="You have read-only access to this record" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #d1d5db", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#6b7280", background: "#f9fafb" }}>Read-only</span>
          )}
          <button type="button" onClick={toggleAll} style={{ padding: "7px 11px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer", color: "#374151" }}>{allExpanded ? "Collapse All" : "Expand All"}</button>
        </div>
      </div>

      {/* ── Main pivot table ── */}
      <div style={{ marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ display: "none", width: "100%", minWidth: 1100, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: colWidths.lineItem }} />
              <col style={{ width: 360 }} />
              {data.years.map((y) => <col key={y} style={{ minWidth: 120 }} />)}
              <col style={{ width: 140 }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#e5e7eb", height: 42 }}>
                <th style={TH({ width: 40, background: "#e5e7eb" })} />
                <th style={TH({ textAlign: "left", background: "#e5e7eb", paddingLeft: 14 })}>LINE ITEM</th>
                <th style={TH({ textAlign: "left", background: "#e5e7eb", paddingLeft: 14 })}>TARGET GO LIVE</th>
                {data.years.map((year: number) => (
                  <th key={year} style={TH({ textAlign: "right", background: "#e5e7eb", paddingRight: 14 })}>
                    {data.columnLabels[year] || `FY${String(year).slice(2)}`}
                  </th>
                ))}
                <th style={TH({ textAlign: "right", background: "#e5e7eb", paddingRight: 14 })}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data.groups.map((group: Group) => {
                const editable = group.values.filter((v) => v.isCalculated !== "Y");
                const calc = group.values.find((v) => v.isCalculated === "Y");
                const sectionValues = data.years.reduce<Record<number, number>>((acc, year) => {
                  acc[year] = calc ? (calc.yearValues[year] || 0) : editable.reduce((s, v) => s + (v.yearValues[year] || 0), 0);
                  return acc;
                }, {});
                const sectionTotal = calc?.rowTotal ?? data.years.reduce((s, y) => s + (sectionValues[y] || 0), 0);

                return (
                  <React.Fragment key={group.id}>
                    <tr data-section-id={group.sectionId} data-section-type={group.sectionType || group.id} style={{ background: "#182a49" }}>
                      <td style={{ ...TD, height: 40, borderBottom: "1px solid #293a59", borderRight: "none" }} />
                      <td colSpan={2} style={{ ...TD, padding: "8px 14px", fontSize: 12, fontWeight: 800, color: "#fff", borderBottom: "1px solid #293a59", borderRight: "1px solid #31415e" }}>
                        {group.name}
                      </td>
                      {data.years.map((year) => (
                        <td key={year} style={{ ...TD, padding: "8px 14px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#fff", borderBottom: "1px solid #293a59", borderRight: "1px solid #31415e" }}>
                          {displayFmt(sectionValues[year] || 0)}
                        </td>
                      ))}
                      <td style={{ ...TD, padding: "8px 14px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#fff", borderBottom: "1px solid #293a59" }}>
                        {displayFmt(sectionTotal)}
                      </td>
                    </tr>

                    {editable.map((value) => {
                      const acKey = `${group.id}|${value.id}`;
                      const isAC = activeAutocomplete === acKey;
                      return (
                        <tr key={value.id} style={{ background: "#fffbea" }}>
                          <td style={{ ...TD, padding: "4px 0", textAlign: "center", verticalAlign: "middle" }}>
                            {value.isMandatory !== "Y" && value.isCustom !== "N" && !isReadOnly && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, vId: value.id, name: value.name, kind: "line" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                            )}
                          </td>
                          <td style={{ ...TD, padding: "4px 14px", position: "relative", overflow: "hidden" }} title={value.name}>
                            <input type="text"
                              value={isAC ? autocompleteSearch : value.name}
                              readOnly={isReadOnly || value.isCustom === "N"}
                              onChange={(e) => { if (value.isCustom === "N") return; updateValueName(group.id, value.id, e.target.value); if (isAC) setAutocompleteSearch(e.target.value); }}
                              onFocus={(e) => { e.stopPropagation(); if (value.isCustom === "N") return; setActiveAutocomplete(acKey); setAutocompleteSearch(value.name); }}
                              onPaste={(e) => { if (value.isCustom === "N") { e.preventDefault(); return; } handleNamePaste(e, group.id, value.id); }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, color: "#111827", outline: "none", textOverflow: "ellipsis", height: 30 }}
                            />
                          </td>
                          <td style={{ ...TD, padding: "4px 14px", color: "#475569", fontSize: 12 }}>{value.accountId || targetGoLive()}</td>
                          {data.years.map((year: number, yi: number) => {
                            const val = value.yearValues[year] ?? 0;
                            return (
                              <td key={year} style={{ ...TD, padding: "4px 14px" }}>
                                {isPercentRow(value)
                                  ? renderPercentInput(group.id, value, year, { width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 12, color: "#111827", outline: "none", height: 30 })
                                  : (
                                <input type="text"
                                  className="spc-nav-cell"
                                  value={numCellText(`${value.id}-${year}`, val)}
                                  placeholder="-"
                                  onFocus={() => numCellFocus(`${value.id}-${year}`, val)}
                                  onChange={(e) => numCellChange(group.id, value.id, year, `${value.id}-${year}`, e.target.value)}
                                  onBlur={numCellBlur}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={handleCellNav}
                                  onPaste={(e) => handleValueCellPaste(e, group.id, value.id, yi)}
                                  style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 12, color: val < 0 ? "#DC2626" : "#111827", outline: "none", height: 30 }}
                                />
                                  )}
                              </td>
                            );
                          })}
                          {(() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return (
                            <td style={{ ...TD, padding: "4px 14px" }}>
                              <input type="text"
                                className="spc-nav-cell"
                                readOnly
                                value={displayFmt(t)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={handleCellNav}
                                style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 12, fontWeight: 800, color: t < 0 ? "#DC2626" : "#111827", outline: "none", height: 30 }}
                              />
                            </td>
                          ); })()}
                        </tr>
                      );
                    })}

                    {group.isNewLineRequired !== "N" && !isReadOnly && (
                      <tr key={`${group.id}-add`}>
                        <td colSpan={3 + numYears + 1} style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb" }}>
                          <button type="button" onClick={() => addValueRow(group.id)} style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: BRAND, fontWeight: 700, padding: 0 }}>
                            + Add {group.name} Line
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: colWidths.lineItem }} />
              <col style={{ width: colWidths.account }} />
              <col style={{ width: anyGoLive ? colWidths.targetGoLive : 0 }} />
              {data.years.map((y) => <col key={y} style={{ minWidth: 120 }} />)}
              <col style={{ width: 140 }} />
            </colgroup>
            <tbody>
              {data.groups.map((group: Group) => (
                <React.Fragment key={group.id}>
                  {/* Section header */}
                  <tr data-section-id={group.sectionId} data-section-type={group.sectionType || group.id} style={{ background: DARK_HEADER, cursor: "pointer" }} onClick={() => toggleGroup(group.id)}>
                    {group.expanded ? (
                      <td colSpan={4 + numYears + 1} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
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
                              style={{ flex: 1, cursor: group.isCustom === "Y" && !isReadOnly ? "pointer" : "default", color: group.name ? "#fff" : "rgba(255,255,255,0.45)", fontStyle: group.name ? "normal" : "italic" }}
                              onClick={(e) => { if (group.isCustom !== "Y" || isReadOnly) return; e.stopPropagation(); setEditingGroupId(group.id); setEditingGroupName(group.name); }}
                            >{group.name || "Enter section name"}</span>
                          )}
                          {group.isCustom === "Y" && group.isMandatory !== "Y" && !isReadOnly && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, name: group.name, kind: "section" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", padding: 2 }} title="Delete section">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td colSpan={4 + numYears + 1} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ChevronDown size={16} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, color: group.name ? "#fff" : "rgba(255,255,255,0.45)", fontStyle: group.name ? "normal" : "italic" }}>{group.name || "Enter section name"}</span>
                          {group.isCustom === "Y" && group.isMandatory !== "Y" && !isReadOnly && (
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
                      <th colSpan={1 + (group.isAccountRequired !== "Y" ? 1 : 0)} style={TH({ textAlign: "left", width: colWidths.lineItem, position: "relative", background: "#e5e7eb" })}>
                        LINE ITEM
                        <div onMouseDown={(e) => startResize("lineItem", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                      </th>
                      {group.isAccountRequired === "Y" && (
                        <th style={TH({ textAlign: "left", width: colWidths.account, position: "relative", background: "#e5e7eb" })}>
                          ACCOUNT <span style={{ color: "#ef4444" }}>*</span>
                          <div onMouseDown={(e) => startResize("account", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                        </th>
                      )}
                      {group.isGoLiveReq === "Y" ? (
                        <th style={TH({ textAlign: "left", whiteSpace: "nowrap", background: "#e5e7eb", width: colWidths.targetGoLive, position: "relative" })}>
                          TARGET GO LIVE
                          <div onMouseDown={(e) => startResize("targetGoLive", e)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "transparent" }} />
                        </th>
                      ) : (
                        <th style={{ background: "#e5e7eb", padding: 0, border: "none", width: colWidths.targetGoLive }} />
                      )}
                      {data.years.map((year: number, yi: number) => (
                        <th key={year} style={TH({ textAlign: "right", whiteSpace: "nowrap", position: "relative", background: "#e5e7eb" })}
                          onMouseMove={(e) => { if (hoverTimer.current) clearTimeout(hoverTimer.current); const r = e.currentTarget.getBoundingClientRect(); setHoveredColIdx(e.clientX - r.left > r.width * 0.8 ? yi : null); }}
                          onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setHoveredColIdx(null), 150); }}
                        >
                          {hoveredColIdx === yi && !isReadOnly && (
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
                            <div style={{ cursor: isReadOnly ? "default" : "pointer" }} onClick={() => { if (isReadOnly) return; setOpenYearMenuIdx(openYearMenuIdx?.gId === group.id && openYearMenuIdx?.yi === yi ? null : { gId: group.id, yi }); }}>
                              {data.columnLabels[year] || `FY${String(year).slice(2)}`}
                            </div>
                          )}
                          {openYearMenuIdx?.gId === group.id && openYearMenuIdx?.yi === yi && (
                            <div ref={yearMenuRef} style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, width: 144, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.1)", zIndex: 50 }}>
                              {yi > 0 && <button type="button" onClick={() => moveYearLeft(yi)} style={{ width: "100%", padding: "6px 12px", textAlign: "left", fontSize: 11, color: "#374151", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><ChevronLeft size={12} /> Move Left</button>}
                              {yi < data.years.length - 1 && <button type="button" onClick={() => moveYearRight(yi)} style={{ width: "100%", padding: "6px 12px", textAlign: "left", fontSize: 11, color: "#374151", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><ChevronRight size={12} /> Move Right</button>}
                              <button type="button" onClick={() => {
                                setOpenYearMenuIdx(null);
                                if (dbYearsRef.current.has(year)) {
                                  setToast({ kind: "error", message: "This year is saved in the database and cannot be deleted." });
                                } else {
                                  setConfirmDeleteYear({ year, label: data.columnLabels[year] || `FY${String(year).slice(2)}` });
                                }
                              }} style={{ width: "100%", padding: "6px 12px", textAlign: "left", fontSize: 11, color: "black", background: "none", border: "none", borderTop: "1px solid #f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={12} /> Delete</button>
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

                    const renderEditable = (value: ValueRow, idx: number) => {
                      const acKey = `${group.id}|${value.id}`;
                      const isAC  = activeAutocomplete === acKey;
                      const bg    = idx % 2 === 0 ? "#fff" : "#f9fafb";
                      return (
                        <tr key={value.id} style={{ background: bg }}>
                          <td style={{ ...TD, padding: "4px 0", textAlign: "center", verticalAlign: "middle" }}>
                            {value.isMandatory !== "Y" && value.isCustom !== "N" && !isReadOnly && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ gId: group.id, vId: value.id, name: value.name, kind: "line" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                            )}
                          </td>
                          <td colSpan={1 + (group.isAccountRequired !== "Y" ? 1 : 0)} style={{ ...TD, padding: "4px 12px", position: "relative", overflow: "hidden" }} title={value.name}>
                            <input type="text"
                              value={isAC ? autocompleteSearch : value.name}
                              readOnly={isReadOnly || value.isCustom === "N"}
                              onChange={(e) => { if (value.isCustom === "N") return; updateValueName(group.id, value.id, e.target.value); if (isAC) setAutocompleteSearch(e.target.value); }}
                              onFocus={(e) => { e.stopPropagation(); if (value.isCustom === "N") return; setActiveAutocomplete(acKey); setAutocompleteSearch(value.name); }}
                              onPaste={(e) => { if (value.isCustom === "N") { e.preventDefault(); return; } handleNamePaste(e, group.id, value.id); }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Enter line item name"
                              style={{ width: "100%", border: "none", background: "transparent", fontSize: 12, color: "#1f2937", outline: "none", textOverflow: "ellipsis", height: 28 }}
                            />
                          </td>
                          {group.isAccountRequired === "Y" && (() => {
                            const isOpen = activeLov?.gId === group.id && activeLov?.vId === value.id;
                            const codes  = accountCodesBySection[group.sectionType ?? ""] ?? [];
                            const filtered = lovSearch.trim()
                              ? codes.filter((ac) => ac.account_code.toLowerCase().includes(lovSearch.toLowerCase()) || ac.account_name.toLowerCase().includes(lovSearch.toLowerCase()))
                              : codes;
                            return (
                            <td style={{ ...TD, padding: "4px 8px", overflow: "visible", position: "relative" }}>
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isReadOnly) return;
                                  loadAccountCodesForSection(group.sectionType ?? "");
                                  if (isOpen) { setActiveLov(null); setLovSearch(""); }
                                  else { setActiveLov({ gId: group.id, vId: value.id, sectionType: group.sectionType ?? "", currentValue: value.accountId }); setLovSearch(""); }
                                }}
                                style={{ width: "100%", height: 28, border: `1px solid ${isOpen ? BRAND : "#d1d5db"}`, borderRadius: 4, padding: "2px 8px", fontSize: 12, color: value.accountId ? "#1f2937" : "#9ca3af", background: "#fff", cursor: isReadOnly ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, overflow: "hidden" }}
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{value.accountId ?? "Select…"}</span>
                                <span style={{ flexShrink: 0, color: "#9ca3af", fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
                              </button>
                              {isOpen && (
                                <div ref={lovRef} onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, zIndex: 300, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,.12)", minWidth: 320, maxHeight: 260, display: "flex", flexDirection: "column", marginTop: 2 }}>
                                  <div style={{ padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>
                                    <input
                                      autoFocus
                                      type="text"
                                      placeholder="Search…"
                                      value={lovSearch}
                                      onChange={(e) => setLovSearch(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12, outline: "none", color: "#1f2937", boxSizing: "border-box" }}
                                    />
                                  </div>
                                  <div style={{ overflowY: "auto", flex: 1 }}>
                                    {filtered.length === 0 ? (
                                      <div style={{ padding: "16px 12px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No records found</div>
                                    ) : (
                                      filtered.map((ac) => {
                                        const val = `${ac.account_code} – ${ac.account_name}`;
                                        const isSel = value.accountId === val;
                                        return (
                                          <div
                                            key={ac.account_code}
                                            onClick={() => {
                                              setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === group.id ? { ...g, values: g.values.map((v) => v.id === value.id ? { ...v, accountId: val } : v) } : g) }) : p);
                                              setActiveLov(null); setLovSearch("");
                                            }}
                                            style={{ padding: "6px 12px", fontSize: 12, cursor: "pointer", background: isSel ? "#fdf2f8" : "transparent", color: "#1f2937", fontWeight: isSel ? 700 : 400, borderBottom: "1px solid #f3f4f6", display: "flex", gap: 8 }}
                                            onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = isSel ? "#fdf2f8" : "transparent"; }}
                                          >
                                            <span style={{ color: "#6b7280", minWidth: 80 }}>{ac.account_code}</span>
                                            <span>{ac.account_name}</span>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                  {value.accountId && (
                                    <div style={{ padding: "6px 8px", borderTop: "1px solid #e5e7eb" }}>
                                      <button type="button" onClick={() => { setData((p) => p ? ({ ...p, groups: p.groups.map((g) => g.id === group.id ? { ...g, values: g.values.map((v) => v.id === value.id ? { ...v, accountId: undefined } : v) } : g) }) : p); setActiveLov(null); setLovSearch(""); }} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear selection</button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            );
                          })()}
                          {group.isGoLiveReq === "Y" ? (
                            <td style={{ ...TD, padding: "4px 12px", color: "#475569", fontSize: 12 }}>
                              {fmtGoLiveDate(value.targetGoLiveDate) || "—"}
                            </td>
                          ) : (
                            <td style={{ ...TD, padding: 0, border: "none", background: bg }} />
                          )}
                          {data.years.map((year: number, yi: number) => {
                            const val = value.yearValues[year] ?? 0;
                            return (
                              <td key={year} style={{ ...TD, padding: "4px 12px" }}>
                                {isPercentRow(value)
                                  ? renderPercentInput(group.id, value, year, { width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, color: "#1f2937", outline: "none", height: 28 })
                                  : (
                                <input type="text"
                                  className="spc-nav-cell"
                                  value={numCellText(`${value.id}-${year}`, val)}
                                  placeholder="—"
                                  onFocus={() => numCellFocus(`${value.id}-${year}`, val)}
                                  onChange={(e) => numCellChange(group.id, value.id, year, `${value.id}-${year}`, e.target.value)}
                                  onBlur={numCellBlur}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={handleCellNav}
                                  onPaste={(e) => handleValueCellPaste(e, group.id, value.id, yi)}
                                  style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, color: val < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 28 }}
                                />
                                  )}
                              </td>
                              );
                            })}
                          {(() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return (
                            <td style={{ ...TD, padding: "4px 12px" }}>
                              <input type="text"
                                className="spc-nav-cell"
                                readOnly
                                value={displayFmt(t)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={handleCellNav}
                                style={{ width: "100%", textAlign: "right", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: t < 0 ? "#DC2626" : "#1f2937", outline: "none", height: 28 }}
                              />
                            </td>
                          ); })()}
                        </tr>
                      );
                    };

                    const regularEditable = editable.filter((v) => v.lineType !== "ONGOING_CAPEX");
                    const ongoingEditable = editable.filter((v) => v.lineType === "ONGOING_CAPEX");
                    const hasOngoing      = ongoingEditable.length > 0;
                    const calcInitial     = calc.filter((v) => v.lineType === "INITIAL_CAPEX");
                    const calcRest        = calc.filter((v) => v.lineType !== "INITIAL_CAPEX");

                    const fixedColSpan = 4;
                    const renderCalcRow = (value: ValueRow) => (
                      <tr key={value.id} style={{ background: "#f3f4f6" }}>
                        <td colSpan={fixedColSpan} style={{ ...TD, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#111" }}>{value.name}</td>
                        {data.years.map((year: number) => {
                          const val = value.yearValues[year] ?? 0;
                          return (<td key={year} style={{ ...TD, padding: "8px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111" }}>{displayRow(value, val)}</td>);
                        })}
                        {(() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "8px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111" }}>{displayRow(value, t)}</td>; })()}
                      </tr>
                    );

                    return (<>
                      {(hasOngoing ? regularEditable : editable).map((v, i) => renderEditable(v, i))}
                      {group.isNewLineRequired !== "N" && !isReadOnly && (
                        <tr key="add-btn"><td colSpan={4 + numYears + 1} style={{ padding: "6px 10px", borderBottom: "1px solid #e5e7eb" }}><button type="button" onClick={() => addValueRow(group.id)} style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: BRAND, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, height: 15 }}>+ Add {group.name} Line</button></td></tr>
                      )}
                      {hasOngoing ? (<>
                        {calcInitial.map(renderCalcRow)}
                        {ongoingEditable.map((v, i) => renderEditable(v, regularEditable.length + i))}
                        {calcRest.map(renderCalcRow)}
                      </>) : calc.map((value: ValueRow) => (
                        <tr key={value.id} style={{ background: "#f3f4f6" }}>
                          <td colSpan={fixedColSpan} style={{ ...TD, padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#111" }}>{value.name}</td>
                          {data.years.map((year: number) => {
                            const val = value.yearValues[year] ?? 0;
                            return (<td key={year} style={{ ...TD, padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: val < 0 ? "#DC2626" : "#111" }}>{displayRow(value, val)}</td>);
                          })}
                          {(() => { const t = value.rowTotal ?? data.years.reduce((s, y) => s + (value.yearValues[y] || 0), 0); return <td style={{ ...TD, padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: t < 0 ? "#DC2626" : "#111" }}>{displayRow(value, t)}</td>; })()}
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

    </div>
  );
}
