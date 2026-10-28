import { useEffect, useRef, useState, type ReactElement } from "react";
import ForecastActualsReport from "./ForecastActualsReport";
import NonFinancialMetrics from "./NonFinancialMetrics";
import { getAppConfig, hasValidProposalId, hasSpcTemplate } from "../config/app-config";
import { getKpiVariance, type KpiTile, type RagSummary } from "../api/kpi-variance-api";
import { getPirSnapshots, recapturePirSnapshots, type Snapshot } from "../api/pir-reporting-api";
import { getFinancialData } from "../api/financial-api";
import { getForecastActuals, getSectionIdsByName, applySectionIds, type ForecastReport } from "../api/forecast-actuals-api";
import { getActualDrilldown, isActualRow, type ActualDrilldownRow, type DrillContext } from "../api/actual-drilldown-api";
import { getUnmappedTransactions, postUnmappedMapping, toFullFiscalYear, type UnmappedRow } from "../api/unmapped-transactions-api";
import { postAdjustment, getAdjustments, monthToYearPeriod } from "../api/adjustments-api";
import { useRefreshToken } from "../lib/refresh-bus";
import FormatToolbar from "./FormatToolbar";
import {
  applyScaleToLabel,
  formatDate as formatDateWith,
  formatMoney,
  formatPlain,
  formatScaled,
  setDisplayCurrency,
  useFormatSettings,
} from "../lib/format-settings";

/* ── Icons ───────────────────────────────────────────────────────
   One monochrome line set for the whole dashboard. Every glyph is drawn
   with `stroke="currentColor"`, so it inherits the heading colour instead
   of carrying an emoji's own palette. */
type IconName =
  | "report" | "chart" | "search" | "summary" | "comments" | "lock" | "check"
  | "plus" | "list" | "database" | "link" | "camera" | "bell" | "clock"
  | "calendar" | "save" | "refresh";

const ICON_PATHS: Record<IconName, ReactElement> = {
  report: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  chart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  summary: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  comments: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  plus: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>
  ),
  link: (
    <>
      <path d="M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6a5 5 0 0 1 0-10h3" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </>
  ),
};

function Icon({ name, size = 16 }: { name: IconName; size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const TABS = [
  { key: "reporting", label: "PIR Reporting" },
  { key: "forecast", label: "Forecast vs Actuals" },
  { key: "drilldown", label: "Actuals Drilldown" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type DrCr = "Dr" | "Cr";
type Adjustment = { id: string; month: string; drCr: DrCr; gl: string; desc: string; amount: number };

/* ── PIR narrative cards (free-text sign-off commentary) ─────────── */
type NarrativeKey = "summary" | "lessons";

const NARRATIVE_LIMIT = 5000;

const NARRATIVE_CARDS: ReadonlyArray<{
  key:     NarrativeKey;
  icon:    IconName;
  title:   string;
  hint:    string;
  intro:   string;
  bullets: readonly string[];
}> = [
  {
    key:   "summary",
    icon:  "summary",
    title: "Executive PIR Summary",
    hint:  "Required for PIR sign-off",
    intro: "Provide a high-level executive summary of the Post-Implementation Review. Include:",
    bullets: [
      "Overall assessment of the investment against original business case",
      "Key achievements and milestones reached",
      "Critical risks or issues identified during implementation",
      "Recommendations for future investment cycles",
      "Lessons learned for the organisation",
    ],
  },
  {
    key:   "lessons",
    icon:  "comments",
    title: "Lessons Learned",
    hint:  "Stakeholder comments and sign-offs",
    intro: "Capture lessons learned from the investment. Include:",
    bullets: [
      "What went well during implementation",
      "What could have been done differently",
      "Key risks that materialised and how they were managed",
      "Process improvements for future capital projects",
      "Recommendations for the organisation",
      "Action items and responsible parties",
    ],
  },
];

const narrativePlaceholder = (card: (typeof NARRATIVE_CARDS)[number]): string =>
  `${card.intro}\n\n${card.bullets.map((b) => `• ${b}`).join("\n")}`;

// INITCAP-style: capitalise the first letter of each word, lower-case the rest.
const toInitCap = (s: string): string => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function ForecastDashboard(): ReactElement {
  // Changes after every successful write (POST / PUT / DELETE) anywhere in the
  // app — see src/lib/refresh-bus.ts. Every load effect below depends on it, so
  // one write re-reads all of the APIs on screen, not just the one written to.
  const refreshToken = useRefreshToken();
  // Scoped tokens — each changes on its own named writes *and* on any unscoped
  // (global) write, so this only trims which extra regions a targeted save
  // (e.g. a new line, or a Dr/Cr adjustment) re-fetches. See src/lib/refresh-bus.ts.
  const kpiRefreshToken = useRefreshToken("kpi");
  const snapshotsRefreshToken = useRefreshToken("snapshots");
  const unmappedRefreshToken = useRefreshToken("unmapped");
  const drilldownRefreshToken = useRefreshToken("drilldown");

  // CURRENCY / SCALE / NUMBER / DATE choices from the toolbar under the tabs.
  const fmt = useFormatSettings();

  // Opens on the leftmost tab — follows TABS, so reordering them can't leave
  // the dashboard landing on a tab that is no longer first.
  const [activeTab, setActiveTab] = useState<TabKey>(TABS[0].key);

  const [kpiTiles, setKpiTiles] = useState<KpiTile[]>([]);
  const [rag, setRag] = useState<RagSummary | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  const loadKpis = () => {
    let cancelled = false;
    setKpiLoading(true);
    setKpiError(null);
    const cfg = getAppConfig();
    // KPIVariance can resolve KPIs from spc_type_id + spc_type_template_id when
    // proposal_id is null, so only bail when neither path is available.
    if (!hasValidProposalId(cfg) && !hasSpcTemplate(cfg)) {
      setKpiTiles([]);
      setRag(null);
      setKpiError("No proposal selected — set a valid proposal_id (or spc_type_id + spc_type_template_id) to load this report.");
      setKpiLoading(false);
      return () => { cancelled = true; };
    }
    getKpiVariance(cfg)
      .then((data) => {
        if (cancelled) return;
        setKpiTiles(data.tiles);
        setRag(data.rag);
        if (data.proposalCode) setProposalCode(data.proposalCode);
      })
      .catch((err: unknown) => {
        if (!cancelled) setKpiError(err instanceof Error ? err.message : "Failed to load KPIs");
      })
      .finally(() => {
        if (!cancelled) setKpiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(loadKpis, [kpiRefreshToken]);

  // The CURRENCY chip in the toolbar is data (the proposal's own currency),
  // not a user preference — read once from the financial header rather than
  // hard-coded, same as KpiPanel's "DISPLAY CURRENCY" strip.
  useEffect(() => {
    let cancelled = false;
    const cfg = getAppConfig();
    if (!hasValidProposalId(cfg)) return;
    getFinancialData(cfg)
      .then(({ rawHeader }) => {
        if (!cancelled) setDisplayCurrency(rawHeader.display_currency || rawHeader.local_currency);
      })
      .catch((err: unknown) => {
        console.warn("[ForecastDashboard] currency lookup failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);

  // ── Manual re-capture (the refresh icon on the snapshots heading) ──
  const [recapturing, setRecapturing] = useState(false);
  const [recaptureError, setRecaptureError] = useState<string | null>(null);

  /**
   * POST the recapture, then let the refresh bus re-read every region.
   *
   * recapturePirSnapshots only calls notifyDataChanged when the response is
   * {"status":"S"} — a failure throws here instead, so a silent backend refusal
   * can never look like a successful refresh.
   */
  const recaptureSnapshots = async (): Promise<void> => {
    if (recapturing) return;
    setRecapturing(true);
    setRecaptureError(null);
    try {
      await recapturePirSnapshots(getAppConfig());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Re-capture failed";
      console.error("[Snapshots] recapture failed", err);
      setRecaptureError(message);
    } finally {
      setRecapturing(false);
    }
  };

  // Fetch on mount (in parallel with the KPI load) so the cards are ready by
  // the time the PIR Reporting tab is opened — avoids a visible loading wait.
  useEffect(() => {
    let cancelled = false;
    setSnapshotsLoading(true);
    setSnapshotsError(null);
    const cfg = getAppConfig();
    // No proposal-id guard: when it's null the API returns the 6/12/24-month
    // template snapshots via …/reportingPeriodicSnapshots/NULL.
    getPirSnapshots(cfg)
      .then((data) => {
        if (cancelled) return;
        setSnapshots(data);
        // The commentary is repeated on every snapshot row, so take it from the
        // first row that actually carries text. Seeded once — a later refresh
        // must not discard commentary the user is part-way through typing.
        if (!narrativesSeeded.current) {
          narrativesSeeded.current = true;
          const summary = data.find((s) => s.pirExecutiveSummary)?.pirExecutiveSummary ?? "";
          const lessons = data.find((s) => s.pirLessonsLearned)?.pirLessonsLearned ?? "";
          if (summary || lessons) setNarratives({ summary, lessons });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setSnapshotsError(err instanceof Error ? err.message : "Failed to load snapshots");
      })
      .finally(() => {
        if (!cancelled) setSnapshotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [snapshotsRefreshToken]);

  // ── PIR narrative cards ───────────────────────────────────────────
  // Seeded from the snapshots payload (pir_executive_summary /
  // pir_lessons_learned) and edited locally from there. There is still no
  // write endpoint for the commentary, so Save confirms with a toast only.
  const [narratives, setNarratives] = useState<Record<NarrativeKey, string>>({ summary: "", lessons: "" });
  /** Set once the snapshots land, so a refresh can't overwrite unsaved typing. */
  const narrativesSeeded = useRef(false);
  const [narrativeToast, setNarrativeToast] = useState<string | null>(null);
  const narrativeToastTimer = useRef<number | undefined>(undefined);

  const showNarrativeToast = (message: string): void => {
    setNarrativeToast(message);
    window.clearTimeout(narrativeToastTimer.current);
    narrativeToastTimer.current = window.setTimeout(() => setNarrativeToast(null), 2800);
  };

  useEffect(() => () => window.clearTimeout(narrativeToastTimer.current), []);

  const setNarrative = (key: NarrativeKey, text: string): void =>
    setNarratives((prev) => ({ ...prev, [key]: text }));

  // Forecast report — used to populate the Actuals Drilldown line-item picker
  // (section_name → optgroup heading, item_description → options).
  const [report, setReport] = useState<ForecastReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cfg = getAppConfig();
    // Section ids are matched in, same as ForecastActualsReport.tsx — without
    // them a line picked here carries finEvalSectionId: null, which drops the
    // Unmapped Transactions section filter for a directly-selected line.
    Promise.all([getForecastActuals(cfg), getSectionIdsByName(cfg)])
      .then(([data, sectionIds]) => {
        if (!cancelled) setReport(applySectionIds(data, sectionIds));
      })
      .catch(() => {
        /* dropdown stays empty on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const drilldownGroups = (report?.sections ?? [])
    .map((section) => ({
      title: section.title,
      items: section.rows.filter((r) => r.type === "line" && r.label.trim() !== ""),
    }))
    .filter((group) => group.items.length > 0);

  const [selectedLine, setSelectedLine] = useState<string>("");

  // ── Actuals drilldown — financial transactions for a clicked forecast cell ──
  // proposal_id (from config) + account + fiscalYear are sent to the API.
  const [drillCtx, setDrillCtx] = useState<DrillContext | null>(null);
  // Fiscal year actually sent to the drilldown/adjustments endpoints for the
  // open line — kept in state so the load effect can re-run it on a refresh.
  const [drillFy, setDrillFy] = useState<string>("");
  const [drillRows, setDrillRows] = useState<ActualDrilldownRow[]>([]);
  // SPC / proposal code — sourced from the KPI Variance API's `p_proposal_code`
  // (set in loadKpis). Empty until resolved — rendered as "—" so we never show a
  // fake code.
  const [proposalCode, setProposalCode] = useState<string>("");
  const proposalCodeLabel = proposalCode || "—";
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  // Shown in the empty state when a line is picked but no proposal exists yet.
  const [drillNotice, setDrillNotice] = useState<string | null>(null);
  const [actualsExpanded, setActualsExpanded] = useState(true);
  const [forecastExpanded, setForecastExpanded] = useState(true);
  const [unmappedExpanded, setUnmappedExpanded] = useState(true);

  // ── Unmapped Datalake transactions — per proposal, fetched once on mount. ──
  const [unmapped, setUnmapped] = useState<UnmappedRow[]>([]);
  const [unmappedLoading, setUnmappedLoading] = useState(true);
  const [unmappedError, setUnmappedError] = useState<string | null>(null);

  // Scoped to the drilled line's section + fiscal year, so the panel lists the
  // transactions that could be mapped to the line on screen. Before any drill
  // both headers are omitted and the endpoint decides what to return.
  const unmappedSectionId = drillCtx?.finEvalSectionId ?? null;
  const unmappedFy = drillFy || drillCtx?.fy || null;

  useEffect(() => {
    let cancelled = false;
    setUnmappedLoading(true);
    setUnmappedError(null);
    getUnmappedTransactions(getAppConfig(), unmappedSectionId, unmappedFy)
      .then((rows) => {
        if (!cancelled) setUnmapped(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setUnmappedError(err instanceof Error ? err.message : "Failed to load unmapped transactions");
      })
      .finally(() => {
        if (!cancelled) setUnmappedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unmappedSectionId, unmappedFy, unmappedRefreshToken]);

  useEffect(() => {
    setUnmappedSel(new Set());
    setMapComment("");
    setMapError(null);
  }, [unmappedSectionId, unmappedFy]);

  const unmappedTotal = unmapped.reduce((sum, u) => sum + u.amount, 0);

  // ── Unmapped row selection → "Map to <line>" ──────────────────────────────
  const [unmappedSel, setUnmappedSel] = useState<Set<number>>(new Set());
  const [mapComment, setMapComment] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapSaving, setMapSaving] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const selectedUnmapped = unmapped.filter((_, i) => unmappedSel.has(i));
  const selectedCount = selectedUnmapped.length;
  const selectedTotal = selectedUnmapped.reduce((sum, u) => sum + u.amount, 0);
  const allUnmappedSelected = unmapped.length > 0 && selectedCount === unmapped.length;
  const mapTargetLabel = drillCtx ? toInitCap(drillCtx.label) : "selected line";

  // Native checkboxes can't express "some selected" declaratively.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedCount > 0 && !allUnmappedSelected;
    }
  }, [selectedCount, allUnmappedSelected]);

  const toggleUnmappedRow = (index: number): void => {
    setMapError(null);
    setUnmappedSel((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleUnmappedAll = (checked: boolean): void => {
    setMapError(null);
    setUnmappedSel(checked ? new Set(unmapped.map((_, i) => i)) : new Set());
  };

  /** POST the ticked rows onto the drilled line, then re-read what's left. */
  const mapSelectedUnmapped = async (): Promise<void> => {
    if (selectedCount === 0) return;
    if (!mapComment.trim()) {
      setMapError("A mapping comment is required.");
      return;
    }
    const cfg = getAppConfig();
    const proposalId = Number(cfg.proposal_id);
    if (!drillCtx || !Number.isFinite(proposalId) || proposalId <= 0) {
      setMapError("Open a line from the Forecast vs Actuals report before mapping.");
      return;
    }

    // The rows carry a month label ("Jun'25"); the API wants YYYYMM. Direction
    // isn't in the datalake row, so it's taken from the sign of the amount.
    const transactions = selectedUnmapped.map((u) => ({
      yearperiod:      monthToYearPeriod(u.month) ?? 0,
      gl_string:       u.gl,
      dr_cr:           (u.amount < 0 ? "CR" : "DR") as "DR" | "CR",
      amount:          Math.abs(u.amount),
      source_document: u.source,
    }));
    const unresolved = transactions.filter((t) => !t.yearperiod);
    if (unresolved.length > 0) {
      setMapError(`Could not derive a year/period (YYYYMM) for ${unresolved.length} selected transaction(s).`);
      return;
    }

    setMapSaving(true);
    setMapError(null);
    try {
      await postUnmappedMapping(cfg, {
        proposal_id:         proposalId,
        fin_eval_section_id: drillCtx.finEvalSectionId ?? null,
        fin_eval_line_id:    drillCtx.finEvalLineId,
        mapping_comment:     mapComment.trim(),
        transactions,
      });
    } catch (err: unknown) {
      setMapError(err instanceof Error ? err.message : "Failed to map transactions");
      setMapSaving(false);
      return;
    }
    setMapSaving(false);

    // No explicit re-read: postUnmappedMapping signals the refresh bus, so the
    // unmapped list — and every other API on screen — is re-read from the
    // server rather than being patched locally.
    setUnmappedSel(new Set());
    setMapComment("");
    setMapError(null);
    setDrillNotice(
      `${selectedCount} transaction${selectedCount === 1 ? "" : "s"} mapped to ${mapTargetLabel}.`,
    );
  };

  // `apiArgs` overrides the account/fiscalYear sent to the endpoint while keeping
  // `ctx` for display. The direct line-item selection (no forecast cell context)
  // uses this to request the whole proposal via account=NULL / fiscalYear=NULL.
  // Resolve the fiscal-year header ("FY26") for the adjustments GET: prefer the
  // drilldown's fy, else the first real fiscal year from the report.
  const resolveAdjFy = (raw?: string): string => {
    const val = (raw ?? "").toString();
    if (/^fy/i.test(val)) return val.toUpperCase();
    const firstFy = report?.years.find((y) => /^fy/i.test(y.key))?.key;
    return (firstFy ?? val).toUpperCase();
  };

  // Load the adjustments already saved for this proposal + fiscal year and split
  // them into the Actuals / Forecast tables. Skipped when no proposal exists.
  const loadAdjustments = (rawFy?: string): void => {
    const cfg = getAppConfig();
    if (!hasValidProposalId(cfg)) {
      setAdjustments([]);
      setFAdjustments([]);
      return;
    }
    const fy = resolveAdjFy(rawFy);
    getAdjustments(cfg, fy, cfg.proposal_id)
      .then((recs) => {
        console.log("[Adjustments] parsed rows", recs);
        console.log(
          `[Adjustments] split → ACTUALS ${recs.filter((r) => r.scenario === "ACTUALS").length}` +
            ` · FORECAST ${recs.filter((r) => r.scenario === "FORECAST").length}`,
        );
        setAdjustments(recs.filter((r) => r.scenario === "ACTUALS"));
        setFAdjustments(recs.filter((r) => r.scenario === "FORECAST"));
      })
      .catch((err: unknown) => {
        // Tables stay empty on failure — adding a new adjustment still works —
        // but log it, otherwise the call fails completely silently.
        console.error("[Adjustments] load failed", { fy, proposal_id: cfg.proposal_id }, err);
      });
  };

  const openActualDrilldown = (
    ctx: DrillContext,
    apiArgs?: { account: string; fy: string; lineItem?: string },
  ): void => {
    setActiveTab("drilldown");
    setDrillCtx(ctx);
    setSelectedLine(ctx.id); // reflect the clicked line in the line-item dropdown
    setDrillRows([]);
    // The fetch itself lives in the effect below so a write (which bumps
    // refreshToken) re-reads the open line without going through a click.
    setDrillFy(apiArgs?.fy && apiArgs.fy !== "NULL" ? apiArgs.fy : ctx.fy);
  };

  // Transactions + saved adjustments for the line currently drilled into.
  // Re-runs when the line/fiscal year changes and after every successful write.
  useEffect(() => {
    if (!drillCtx) return;
    let cancelled = false;
    const fy = drillFy || drillCtx.fy;
    setDrillLoading(true);
    setDrillError(null);
    loadAdjustments(fy);
    // The endpoint is keyed on fin_eval_line_id + fy (not line name / account).
    getActualDrilldown(getAppConfig(), drillCtx.finEvalLineId, fy)
      .then((rows) => {
        if (cancelled) return;
        setDrillRows(rows);
        const code = rows.find((r) => r.proposalCode)?.proposalCode;
        if (code) setProposalCode(code);
      })
      .catch((err: unknown) => {
        if (!cancelled) setDrillError(err instanceof Error ? err.message : "Failed to load actuals");
      })
      .finally(() => {
        if (!cancelled) setDrillLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // loadAdjustments is re-created every render; listing it here would re-fetch
    // on every render instead of only when the line, the year or a write changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillCtx, drillFy, drilldownRefreshToken]);

  // Picking a line from the dropdown resolves its account + first fiscal year and
  // opens the same drilldown the forecast-cell click uses.
  const handleSelectLine = (value: string): void => {
    setSelectedLine(value);
    // No proposal created yet: the line picker is populated from the SPC-template
    // defaults, but there are no actual transactions to drill into. Let the user
    // pick a line, then explain why there's no data instead of calling the API.
    if (value && value !== "" && !hasValidProposalId(getAppConfig())) {
      setDrillCtx(null);
      setDrillRows([]);
      setDrillError(null);
      setDrillNotice(
        "No proposal created yet — these line items are template defaults, so there are no actual transactions to drill down. Create a proposal to see its actuals here.",
      );
      return;
    }
    setDrillNotice(null);
    if (report && value && value !== "all") {
      for (const section of report.sections) {
        const row = section.rows.find((r) => r.id === value && r.type === "line");
        if (row && row.finEvalLineId != null && row.finEvalLineId !== "") {
          // Direct line-item selection (no forecast cell context) — drill the
          // line's first fiscal year, since the endpoint requires one.
          const year = report.years.find((y) => !y.isTotal) ?? report.years[0];
          openActualDrilldown({
            id: row.id,
            finEvalLineId: row.finEvalLineId,
            finEvalSectionId: section.finEvalSectionId ?? null,
            account: row.account ?? "",
            fy: year.key,
            label: row.label,
            section: section.title,
            spc: row.cells[0]?.spc ?? "-",
            ytd: row.cells[0]?.ytd ?? "-",
            spcNum: row.cells[0]?.spcNum ?? null,
            ytdNum: row.cells[0]?.ytdNum ?? null,
            whole: true,
          });
          return;
        }
      }
    }
    // No selection / no line id on the row → clear the drilldown.
    setDrillCtx(null);
    setDrillRows([]);
    setDrillError(null);
  };

  // ── Actuals adjustments (Dr/Cr corrections on top of read-only actuals) ──
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [adjMonth, setAdjMonth] = useState<string>("");
  const [adjDrCr, setAdjDrCr] = useState<DrCr>("Dr");
  const [adjGl, setAdjGl] = useState<string>("");
  const [adjDesc, setAdjDesc] = useState<string>("");
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjSaving, setAdjSaving] = useState<boolean>(false);
  const [adjSaveError, setAdjSaveError] = useState<string | null>(null);

  // ── Forecast adjustments (Budget-scenario corrections) ──
  const [fAdjustments, setFAdjustments] = useState<Adjustment[]>([]);
  const [fMonth, setFMonth] = useState<string>("");
  const [fDrCr, setFDrCr] = useState<DrCr>("Dr");
  const [fGl, setFGl] = useState<string>("");
  const [fDesc, setFDesc] = useState<string>("");
  const [fAmount, setFAmount] = useState<string>("");

  const signedAdjustment = (a: Adjustment): number => (a.drCr === "Cr" ? -a.amount : a.amount);

  // Split by scenario: "Actual" → the Actuals table, anything else → Forecast.
  const isBudget = (r: ActualDrilldownRow): boolean => !isActualRow(r);
  const actualsRows = drillRows.filter(isActualRow);
  const forecastRows = drillRows.filter(isBudget);

  const actualsLineCount = actualsRows.length + adjustments.length;
  const actualsTotal =
    actualsRows.reduce((sum, t) => sum + t.amount, 0) +
    adjustments.reduce((sum, a) => sum + signedAdjustment(a), 0);

  const forecastLineCount = forecastRows.length + fAdjustments.length;
  const forecastTotal =
    forecastRows.reduce((sum, t) => sum + t.amount, 0) +
    fAdjustments.reduce((sum, a) => sum + signedAdjustment(a), 0);

  // ── Reconciliation: Actuals ± Act Adj + Forecast ± Fc Adj = Total, vs SPC ──
  const actualsTxTotal = actualsRows.reduce((sum, t) => sum + t.amount, 0);
  const actAdjNet = adjustments.reduce((sum, a) => sum + signedAdjustment(a), 0);
  const forecastTxTotal = forecastRows.reduce((sum, t) => sum + t.amount, 0);
  const fcAdjNet = fAdjustments.reduce((sum, a) => sum + signedAdjustment(a), 0);
  const reconTotal = actualsTxTotal + actAdjNet + forecastTxTotal + fcAdjNet;

  // ── FY calendar version — derived from the latest month that has actuals ──
  // "MMC{n} (Mon YYYY)": n = fiscal period (FY starts April → Apr=1 … Mar=12),
  // and the month/year is the most recent actual period in the drilldown.
  const FY_START_MONTH = 4; // April
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const latestActualYp = actualsRows
    .map((r) => monthToYearPeriod(r.month))
    .filter((n): n is number => n != null)
    .reduce((max, n) => Math.max(max, n), 0);
  const fyCalendarLabel = `${MONTH_ABBR[FY_START_MONTH - 1]} – ${MONTH_ABBR[(FY_START_MONTH + 10) % 12]}`;
  const drillVersionLabel = ((): string => {
    if (!latestActualYp) return "—";
    const year = Math.floor(latestActualYp / 100);
    const month = latestActualYp % 100; // 1-12 calendar month
    const fyPeriod = ((month - FY_START_MONTH + 12) % 12) + 1;
    return `MMC${fyPeriod} (${MONTH_ABBR[month - 1]} ${year})`;
  })();

  /* ── Month dropdowns ───────────────────────────────────────────────
     Driven by the drilled fiscal year rather than by whichever months happen
     to carry a transaction: the FY runs April → March (FY26 = Apr 2025 … Mar
     2026), so all twelve months are offered and split at the last closed
     period. Closed months are the Actuals form's options, the rest are the
     Forecast form's — an adjustment can then be booked against a month that
     has no line on screen yet. */
  const drillFyEnd = toFullFiscalYear(drillFy || drillCtx?.fy);

  const fyMonthList: number[] =
    drillFyEnd == null
      ? []
      : Array.from({ length: 12 }, (_, i) => {
          const month = ((FY_START_MONTH - 1 + i) % 12) + 1;
          // Apr–Dec fall in the FY's opening calendar year, Jan–Mar in the closing one.
          const year = month >= FY_START_MONTH ? drillFyEnd - 1 : drillFyEnd;
          return year * 100 + month;
        });

  // "Apr'25" — the same shape the transaction rows use, so a picked month
  // round-trips through monthToYearPeriod when the adjustment is posted.
  const ypLabel = (yp: number): string => `${MONTH_ABBR[(yp % 100) - 1]}'${String(yp).slice(2, 4)}`;

  // Prefer the data: the newest month with actuals is the last closed period.
  // Only when the line has no actuals at all does the last fully closed month
  // decide, which keeps a wholly past FY on the Actuals side and a future one
  // on the Forecast side. Capped at the previous calendar month regardless —
  // the current month is never "closed" (this month's actuals haven't landed
  // yet), so it always falls on the Forecast side, and a stray actual dated
  // ahead of that (test data, a mis-keyed period) can't push it back either.
  const today = new Date();
  const lastClosed = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastClosedYp = lastClosed.getFullYear() * 100 + lastClosed.getMonth() + 1;
  const actualsCutoff = Math.min(latestActualYp || lastClosedYp, lastClosedYp);

  const adjMonthOptions = fyMonthList.filter((yp) => yp <= actualsCutoff).map(ypLabel);
  const fMonthOptions = fyMonthList.filter((yp) => yp > actualsCutoff).map(ypLabel);

  // Default to the most recent closed month / the next open one.
  const effectiveAdjMonth = adjMonthOptions.includes(adjMonth)
    ? adjMonth
    : (adjMonthOptions[adjMonthOptions.length - 1] ?? "");
  const effectiveFMonth = fMonthOptions.includes(fMonth) ? fMonth : (fMonthOptions[0] ?? "");

  const addAdjustment = async (): Promise<void> => {
    const amt = parseFloat(adjAmount.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt === 0 || !effectiveAdjMonth) return;

    const cfg = getAppConfig();
    const desc = adjDesc.trim() || "Manual adjustment";
    const yearperiod = monthToYearPeriod(effectiveAdjMonth);
    if (yearperiod == null) {
      setAdjSaveError(`Could not derive year/period (YYYYMM) from month "${effectiveAdjMonth}"`);
      return;
    }
    // The adjustment targets the line currently drilled into.
    if (!drillCtx || drillCtx.finEvalLineId == null || drillCtx.finEvalLineId === "") {
      setAdjSaveError("Open a line from the Forecast vs Actuals report before adding an adjustment");
      return;
    }

    const createdBy = Number(cfg.created_by);
    setAdjSaving(true);
    setAdjSaveError(null);
    try {
      await postAdjustment(cfg, {
        proposal_id: Number(cfg.proposal_id) || 516,
        adjustment_type: "ACTUALS",
        adjustment_level: "LINE_ITEM",
        fin_eval_section_id: drillCtx.finEvalSectionId ?? null,
        fin_eval_line_id: drillCtx.finEvalLineId,
        yearperiod,
        dr_cr: adjDrCr.toUpperCase() as "DR" | "CR",
        gl_string: adjGl.trim(),
        description: desc,
        amount: Math.abs(amt),
        ...(Number.isFinite(createdBy) && createdBy > 0 ? { created_by: createdBy } : {}),
      });
      // On success, reflect the new adjustment in the table below.
      setAdjustments((prev) => [
        ...prev,
        {
          id: `adj-${prev.length}-${Date.now()}`,
          month: effectiveAdjMonth,
          drCr: adjDrCr,
          gl: adjGl.trim() || "—",
          desc,
          amount: Math.abs(amt),
        },
      ]);
      setAdjGl("");
      setAdjDesc("");
      setAdjAmount("");
    } catch (err: unknown) {
      setAdjSaveError(err instanceof Error ? err.message : "Failed to save adjustment");
    } finally {
      setAdjSaving(false);
    }
  };

  const addForecastAdjustment = (): void => {
    const amt = parseFloat(fAmount.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt === 0 || !effectiveFMonth) return;
    setFAdjustments((prev) => [
      ...prev,
      {
        id: `fadj-${prev.length}-${Date.now()}`,
        month: effectiveFMonth,
        drCr: fDrCr,
        gl: fGl.trim() || "—",
        desc: fDesc.trim() || "Forecast adjustment",
        amount: Math.abs(amt),
      },
    ]);
    setFGl("");
    setFDesc("");
    setFAmount("");
  };

  const fyLabel = (key: string | undefined): string => {
    if (!key) return "";
    const n = parseInt(key.replace(/\D/g, ""), 10);
    if (!Number.isFinite(n)) return key.toUpperCase();
    const yy = String(n).padStart(2, "0");
    const prev = String(n - 1).padStart(2, "0");
    return `FY ${prev}/${yy}`;
  };

  // Every amount on screen goes through this: scaled to K/M/B and punctuated per
  // the toolbar, negatives in accounting parentheses — ($1.63K).
  const fmtSignedAmount = (n: number): string => formatMoney(n, fmt);

  const parseMoneyStr = (s: string | undefined): number => {
    const n = parseFloat((s || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // SPC baseline for the reconciliation variance. Prefer the raw figure carried
  // on the drill context; the string is only a fallback for contexts opened
  // before spcNum existed (it is already scaled, so it cannot be re-scaled).
  const reconSpc = drillCtx?.spcNum ?? parseMoneyStr(drillCtx?.spc);
  const reconVariance = reconSpc - reconTotal;
  const reconVarPct = reconSpc === 0 ? 0 : Math.abs((reconVariance / reconSpc) * 100);
  const reconUnderBudget = reconVariance >= 0;

  // Drilldown tile amount — formatted from the raw figure, negatives in red.
  const moneyEl = (n: number | null | undefined): ReactElement => (
    <span className={n != null && n < 0 ? "pir-pd-amount-neg" : ""}>
      {n == null ? "$0" : formatMoney(n, fmt)}
    </span>
  );

  // Snapshot-card amount. Future (uncaptured) snapshots carry no figure — the
  // API's own placeholder ("—") is shown rather than a formatted zero.
  const snapMoney = (n: number | null, fallback: string): string =>
    n == null ? fallback : formatMoney(n, fmt);

  // ── PIR calendar — derived from the same snapshot cards ──────────
  const calendarDescription = (title: string): string => {
    if (/6-?month/i.test(title))
      return "Mid-year assessment — review benefit realisation progress, confirm PIR forecast adjustments, update risk register";
    if (/12-?month/i.test(title))
      return "Full-year review — complete FY actuals reconciliation, executive summary sign-off, lessons learned capture";
    if (/24-?month/i.test(title))
      return "Two-year investment review — cumulative actuals reconciliation, benefit realisation measurement, forecast re-baseline";
    return "Scheduled post-implementation review milestone.";
  };

  // Milestone dates arrive as UTC midnight (e.g. "2026-04-19T00:00:00Z"); the
  // shared formatter reads every part in UTC, so the calendar shows the exact
  // API date in every timezone, in the pattern picked in the DATE selector.
  const formatDate = (iso: string): string => formatDateWith(iso, fmt);

  const MS_PER_DAY = 86_400_000;
  // "Upcoming" is only meaningful for a future review that has an actual scheduled
  // date. In the null-proposal template no dates exist, so none is upcoming and
  // every row falls through to "future" — matching the snapshot cards.
  const firstFutureIdx = snapshots.findIndex(
    (s) => (s.status || "").toUpperCase() === "FUTURE" && !!s.milestoneDate,
  );
  const calendarItems = snapshots.map((s, i) => {
    const status = (s.status || "").toUpperCase();
    const completed = status === "CAPTURED";
    // CAPTURED → Completed; FUTURE → the nearest one is Upcoming, the rest Future.
    const state = completed ? "completed" : i === firstFutureIdx ? "upcoming" : "future";
    const daysAway = (() => {
      if (state !== "upcoming" || !s.milestoneDate) return null;
      const target = new Date(s.milestoneDate);
      if (Number.isNaN(target.getTime())) return null;
      // Whole-day difference, UTC-normalised so the count matches the shown date.
      const days = Math.floor(target.getTime() / MS_PER_DAY) - Math.floor(Date.now() / MS_PER_DAY);
      return days > 0 ? days : null;
    })();
    return {
      key: s.title,
      title: /pir/i.test(s.title) ? s.title : s.title.replace(/\s*Review$/i, " PIR Review"),
      date: formatDate(s.milestoneDate),
      description: calendarDescription(s.title),
      state,
      daysAway,
    };
  });

  // ── Top PIR report header — derived from the captured snapshots ──
  // Title = proposal_title from the API; INVESTMENT = Total Cost (SPC);
  // OVERALL STATUS rolls up the review statuses.
  const pirReportCode = snapshots.find((s) => s.proposalCode)?.proposalCode ?? proposalCode;
  const pirReportTitle = snapshots.find((s) => s.proposalTitle)?.proposalTitle ?? "—";
  // INVESTMENT comes from the API's own `investment` figure. Snapshots repeat it
  // per review, so the first one that carries it wins; payloads predating the
  // field fall back to Total Cost (SPC), which is what the card showed before.
  const pirInvestmentNum =
    snapshots.find((s) => s.investmentNum != null)?.investmentNum ??
    snapshots.find((s) => s.totalNum != null)?.totalNum ??
    null;
  // OVERALL STATUS is the proposal's recorded pir_status, which every snapshot
  // repeats — so the first one carrying it wins. It is null until the review
  // sets one, and an unset status shows "—" rather than being inferred from the
  // individual review statuses.
  const pirOverall = ((): { label: string; tone: "amber" | "green" | "muted" | "red"; icon?: IconName } => {
    const raw = snapshots.find((s) => s.pirStatus)?.pirStatus;
    if (!raw) return { label: "—", tone: "muted" };
    const key = raw.toUpperCase();
    const label = toInitCap(raw.replace(/_/g, " "));
    if (/REAPPROV/.test(key)) return { label, tone: "red", icon: "bell" };
    if (/ATTENTION|RISK|OVERDUE/.test(key)) return { label, tone: "amber", icon: "bell" };
    if (/ON.?TRACK|COMPLETE|APPROVED|CLOSED|PASS/.test(key)) return { label, tone: "green", icon: "check" };
    return { label, tone: "muted" };
  })();

  // Report title, investment and overall status all need a proposal to mean
  // anything — with no proposal_id the card shows only its heading.
  const hasProposalId = hasValidProposalId(getAppConfig());

  return (
    <div className="pir-pd-dashboard-root">
      {/* ── Sticky head: tabs + format toolbar ──────────────────────
          Both pin to the top as one block, so the offset never has to be
          hand-tuned to the tab bar's height. */}
      <div className="pir-pd-sticky-head">
      <nav className="pir-pd-tab-bar" aria-label="Primary">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`pir-pd-tab-button ${activeTab === tab.key ? "pir-pd-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Display-format toolbar — applies to every tab ────────── */}
      <FormatToolbar />
      </div>

      {activeTab === "forecast" && (
        <div className="pir-pd-tab-panel">
          {/* ── Executive KPI Tiles card ───────────────────────── */}
          <section className="pir-pd-kpi-card" aria-label="Executive KPI Tiles">
            <div className="pir-pd-kpi-card-header">
              <div className="pir-pd-kpi-card-heading">
                <span className="pir-pd-kpi-heading-icon" aria-hidden="true"><Icon name="chart" size={18} /></span>
                <div>
                  <div className="pir-pd-kpi-heading-title">
                    Executive KPI Tiles — Financial Metrics (RAG Status)
                  </div>
                  <div className="pir-pd-kpi-heading-sub">SPC Approved vs Actuals with hurdle thresholds</div>
                </div>
              </div>
            </div>

            {/* RAG status summary — only meaningful when tiles exist */}
            {rag && kpiTiles.length > 0 && (
              <div className="pir-pd-rag-summary">
                {rag.red.count > 0 && (
                  <span className="pir-pd-rag-item">
                    <span className="pir-pd-rag-dot pir-pd-rag-red" aria-hidden="true"></span>
                    <span className="pir-pd-rag-count">{rag.red.count} Red</span>
                    <span className="pir-pd-rag-desc">— {rag.red.names.join(", ")}</span>
                    {rag.needsReapproval && <span className="pir-pd-reapproval-pill">Needs Reapproval</span>}
                  </span>
                )}
                {rag.amber.count > 0 && (
                  <span className="pir-pd-rag-item">
                    <span className="pir-pd-rag-dot pir-pd-rag-amber" aria-hidden="true"></span>
                    <span className="pir-pd-rag-count">{rag.amber.count} Amber</span>
                    <span className="pir-pd-rag-desc">— {rag.amber.names.join(", ")}</span>
                  </span>
                )}
                {rag.green.count > 0 && (
                  <span className="pir-pd-rag-item">
                    <span className="pir-pd-rag-dot pir-pd-rag-green" aria-hidden="true"></span>
                    <span className="pir-pd-rag-count">{rag.green.count} Green</span>
                    <span className="pir-pd-rag-desc">— {rag.green.names.join(", ")}</span>
                  </span>
                )}
              </div>
            )}

            {/* KPI tiles grid */}
            {kpiLoading && kpiTiles.length === 0 && (
              <div className="pir-pd-kpi-state">Loading KPI tiles…</div>
            )}
            {kpiError && kpiTiles.length === 0 && (
              <div className="pir-pd-kpi-state pir-pd-kpi-error">Couldn’t load KPIs: {kpiError}</div>
            )}
            {!kpiLoading && !kpiError && kpiTiles.length === 0 && (
              <div className="pir-pd-kpi-state">No KPI data available for this proposal.</div>
            )}
            {kpiTiles.length > 0 && (
            <div className="pir-pd-kpi-grid">
              {kpiTiles.map((tile) => {
                // Money KPIs (CAPEX / OPEX / NPV) follow the SCALE selector and
                // their "($M)" label is rewritten to match. IRR, PTR and Payback
                // are percentages and years — they keep the API's own strings.
                const label = tile.isMoney ? applyScaleToLabel(tile.label, fmt) : tile.label;
                const value = tile.isMoney ? formatScaled(tile.valueNum, fmt) : tile.value;
                const approved = tile.isMoney
                  ? `SPC Approved ${formatScaled(tile.spcNum, fmt)}`
                  : tile.spcApproved;
                const variance = tile.isMoney
                  ? `${formatScaled(tile.varianceNum, fmt)}${
                      tile.variancePct == null ? "" : ` (${formatPlain(tile.variancePct, fmt)}%)`
                    }`
                  : tile.variance;
                return (
                <div key={tile.label} className={`pir-pd-kpi-tile pir-pd-tile-${tile.tone}`}>
                  <div className="pir-pd-tile-top">
                    <span className="pir-pd-tile-label">{label}</span>
                    <span className={`pir-pd-tile-badge pir-pd-badge-${tile.tone}`}>{tile.badge}</span>
                  </div>
                  <div className={`pir-pd-tile-value ${/^[-(]/.test(value.trim()) ? "pir-pd-amount-neg" : ""}`}>
                    {value}
                  </div>
                  <div className="pir-pd-tile-approved">{approved}</div>

                  <div className="pir-pd-tile-divider"></div>

                  <div className="pir-pd-tile-meta-label">VARIANCE</div>
                  <div className={`pir-pd-tile-variance pir-pd-variance-${tile.varianceTone}`}>{variance}</div>

                  <div className="pir-pd-tile-footer">
                    {tile.showHurdle && (
                      <div className="pir-pd-tile-footer-left">
                        <div className="pir-pd-tile-meta-label">HURDLE</div>
                        <div className="pir-pd-tile-hurdle">{tile.hurdle}</div>
                      </div>
                    )}
                    <div className={`pir-pd-tile-status pir-pd-status-${tile.statusTone}`}>{tile.status}</div>
                  </div>
                </div>
                );
              })}
            </div>
            )}
          </section>

          {/* ── Financial table ────────────────────────────────── */}
          <ForecastActualsReport onActualClick={openActualDrilldown} />

          {/* ── Non-financial metrics (clients, licence values, FTE) ── */}
          <NonFinancialMetrics />
        </div>
      )}

      {activeTab === "drilldown" && (
        <div className="pir-pd-tab-panel">
          {/* ── Title row ──────────────────────────────────────── */}
          <div className="pir-pd-title-row">
            <div />
            <div className="pir-pd-title-right">
              <select
                className="pir-pd-line-item-select"
                aria-label="Select a line item to drill down"
                value={selectedLine}
                onChange={(e) => handleSelectLine(e.target.value)}
              >
                <option value="" disabled>— Select a line item —</option>
                <option value="all">All Lines</option>
                {drilldownGroups.map((group) => (
                  <optgroup key={group.title} className="pir-pd-line-item-group" label={group.title.toUpperCase()}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {toInitCap(item.label)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                type="button"
                className="pir-pd-back-button"
                onClick={() => setActiveTab("forecast")}
              >
                ← Back to Forecast vs Actuals
              </button>
            </div>
          </div>

          {drillCtx ? (
            <>
              {/* ── Selected line header card ──────────────────── */}
              <div className="pir-pd-drill-detail-card">
                <div className="pir-pd-drill-detail-left">
                  <span className="pir-pd-drill-detail-icon" aria-hidden="true"><Icon name="chart" size={22} /></span>
                  <div>
                    <div className="pir-pd-drill-detail-title">{toInitCap(drillCtx.label)}</div>
                    <div className="pir-pd-drill-detail-sub">
                      {drillCtx.section.toUpperCase()}
                      {!drillCtx.whole && (
                        <>
                          {" · "}{fyLabel(drillCtx.fy)}
                        </>
                      )}
                      {" · "}Account <strong>{drillCtx.account || "—"}</strong>
                      {" · "}SPC <strong>{proposalCodeLabel}</strong>
                    </div>
                  </div>
                </div>
                <div className="pir-pd-drill-detail-right">
                  <div>FY Calendar: {fyCalendarLabel} · Version: <strong>{drillVersionLabel}</strong></div>
                  <div>Rolled up by Month + GL Account String</div>
                </div>
              </div>

              {/* ── Summary tiles ──────────────────────────────── */}
              <div className="pir-pd-drill-tiles">
                <div className="pir-pd-drill-tile pir-pd-drill-tile-purple">
                  <div className="pir-pd-drill-tile-label">SPC PROJECTED</div>
                  <div className="pir-pd-drill-tile-value">{moneyEl(drillCtx.spcNum)}</div>
                </div>
                <div className="pir-pd-drill-tile pir-pd-drill-tile-green">
                  <div className="pir-pd-drill-tile-label">PIR REFORECAST</div>
                  <div className="pir-pd-drill-tile-value">
                    {/* Always summarise the loaded transactions so the card total
                        reconciles with the Actuals + Forecast line totals below. */}
                    <span className={actualsTotal + forecastTotal < 0 ? "pir-pd-amount-neg" : ""}>
                      {fmtSignedAmount(actualsTotal + forecastTotal)}
                    </span>
                  </div>
                </div>
                <div className="pir-pd-drill-tile pir-pd-drill-tile-amber">
                  <div className="pir-pd-drill-tile-label">ALL ADJUSTMENTS</div>
                  <div className="pir-pd-drill-tile-value">{adjustments.length} <span className="pir-pd-drill-tile-unit">entries</span></div>
                </div>
                <div className="pir-pd-drill-tile pir-pd-drill-tile-orange">
                  <div className="pir-pd-drill-tile-label">DATALAKE</div>
                  <div className="pir-pd-drill-tile-value">{unmapped.length} <span className="pir-pd-drill-tile-unit">unmapped</span></div>
                </div>
              </div>

              {/* ── Actuals — Financial Transactions (rolled up by Month + GL) ── */}
              <section className="pir-pd-actuals-tx" aria-label="Actuals — Financial Transactions">
                <div className="pir-pd-actuals-tx-header">
                  <div className="pir-pd-actuals-tx-heading">
                    <button
                      type="button"
                      className="pir-pd-drill-section-toggle"
                      onClick={() => setActualsExpanded((expanded) => !expanded)}
                      aria-expanded={actualsExpanded}
                      aria-label={actualsExpanded ? "Collapse actuals transactions" : "Expand actuals transactions"}
                    >
                      {actualsExpanded ? "▾" : "▸"}
                    </button>
                    <span className="pir-pd-actuals-tx-title">
                      Actuals — Financial Transactions (rolled up by Month + GL)
                    </span>
                  </div>
                  <span className="pir-pd-actuals-tx-pill">
                    {actualsLineCount} lines ·{" "}
                    <span className={actualsTotal < 0 ? "pir-pd-amount-neg" : ""}>{fmtSignedAmount(actualsTotal)}</span>
                  </span>
                </div>

                {actualsExpanded && <>
                  <div className="pir-pd-actuals-tx-note">
                    <Icon name="lock" size={13} /> Actual lines are read-only — sourced from the financial
                    system. Use adjustments below to make Dr/Cr corrections.
                  </div>

                  <table className="pir-pd-actuals-table" aria-label="Actuals transactions">
                  <thead>
                    <tr>
                      <th className="pir-pd-actuals-th pir-pd-actuals-th-month">MONTH</th>
                      <th className="pir-pd-actuals-th">GL ACCOUNT</th>
                      <th className="pir-pd-actuals-th">GL DESCRIPTION</th>
                      <th className="pir-pd-actuals-th pir-pd-actuals-th-amount">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillLoading && (
                      <tr>
                        <td className="pir-pd-actuals-state" colSpan={4}>Loading actual transactions…</td>
                      </tr>
                    )}
                    {!drillLoading && drillError && (
                      <tr>
                        <td className="pir-pd-actuals-state pir-pd-actuals-state-error" colSpan={4}>
                          Couldn’t load actuals: {drillError}
                        </td>
                      </tr>
                    )}
                    {!drillLoading && !drillError && actualsRows.length === 0 && adjustments.length === 0 && (
                      <tr>
                        <td className="pir-pd-actuals-state" colSpan={4}>
                          No actual transactions for this account and fiscal year.
                        </td>
                      </tr>
                    )}
                    {!drillLoading && !drillError && actualsRows.map((t, i) => (
                      <tr key={`tx-${i}`} className="pir-pd-actuals-row">
                        <td className="pir-pd-actuals-month">{t.month}</td>
                        <td className="pir-pd-actuals-gl">{t.gl}</td>
                        <td className="pir-pd-actuals-desc">{t.desc}</td>
                        <td className={`pir-pd-actuals-amount ${t.amount < 0 ? "pir-pd-actuals-amount-neg" : ""}`}>
                          {fmtSignedAmount(t.amount)}
                        </td>
                      </tr>
                    ))}
                    {adjustments.map((a) => {
                      const signed = signedAdjustment(a);
                      return (
                        <tr key={a.id} className="pir-pd-actuals-row pir-pd-actuals-adj-row">
                          <td className="pir-pd-actuals-month">{a.month}</td>
                          <td className="pir-pd-actuals-gl">
                            {a.gl}{" "}
                            <span className={`pir-pd-actuals-tag pir-pd-actuals-tag-${a.drCr === "Cr" ? "cr" : "dr"}`}>
                              {a.drCr} ADJ
                            </span>
                          </td>
                          <td className="pir-pd-actuals-desc">{a.desc}</td>
                          <td className={`pir-pd-actuals-amount ${signed < 0 ? "pir-pd-actuals-amount-neg" : ""}`}>
                            {fmtSignedAmount(signed)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="pir-pd-actuals-total-row">
                      <td colSpan={3}>TOTAL ACTUALS</td>
                      <td className={`pir-pd-actuals-amount ${actualsTotal < 0 ? "pir-pd-actuals-total-neg" : ""}`}>
                        {fmtSignedAmount(actualsTotal)}
                      </td>
                    </tr>
                  </tfoot>
                  </table>
                </>}
              </section>

              {/* ── Add Actuals Adjustment ─────────────────────────── */}
              {actualsExpanded && <section className="pir-pd-adj" aria-label="Add Actuals Adjustment">
                <div className="pir-pd-adj-title">
                  <Icon name="plus" size={15} /> ADD ACTUALS ADJUSTMENT
                </div>
                <div className="pir-pd-adj-grid">
                  <div className="pir-pd-adj-field">
                    <label className="pir-pd-adj-label">MONTH</label>
                    <select className="pir-pd-adj-input" value={effectiveAdjMonth} onChange={(e) => setAdjMonth(e.target.value)}>
                      {adjMonthOptions.length === 0 && <option value="">—</option>}
                      {adjMonthOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pir-pd-adj-field">
                    <label className="pir-pd-adj-label">DR / CR</label>
                    <select
                      className="pir-pd-adj-input"
                      value={adjDrCr}
                      onChange={(e) => setAdjDrCr(e.target.value === "Cr" ? "Cr" : "Dr")}
                    >
                      <option value="Dr">Dr (Debit)</option>
                      <option value="Cr">Cr (Credit)</option>
                    </select>
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-grow">
                    <label className="pir-pd-adj-label">GL STRING</label>
                    <input
                      className="pir-pd-adj-input"
                      value={adjGl}
                      onChange={(e) => setAdjGl(e.target.value)}
                      placeholder="e.g. 1100.US.600.001.30000000.IAR0000.20161001.PROJ1"
                    />
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-grow">
                    <label className="pir-pd-adj-label">DESCRIPTION</label>
                    <input
                      className="pir-pd-adj-input"
                      value={adjDesc}
                      onChange={(e) => setAdjDesc(e.target.value)}
                      placeholder="Actuals adjustment description…"
                    />
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-amount">
                    <label className="pir-pd-adj-label">AMOUNT ($)</label>
                    <input
                      className="pir-pd-adj-input"
                      type="number"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-action">
                    <button
                      type="button"
                      className="pir-pd-adj-button"
                      onClick={addAdjustment}
                      disabled={adjSaving}
                    >
                      {adjSaving ? "Saving…" : "+ Add Adjustment"}
                    </button>
                  </div>
                </div>
                {adjSaveError && (
                  <div className="pir-pd-adj-error" role="alert">
                    ⚠ {adjSaveError}
                  </div>
                )}
              </section>}

              {/* ── Forecast — Remaining Months (Budget scenario) ── */}
              <section className="pir-pd-actuals-tx pir-pd-fc" aria-label="Forecast — Remaining Months">
                <div className="pir-pd-actuals-tx-header">
                  <div className="pir-pd-actuals-tx-heading">
                    <button
                      type="button"
                      className="pir-pd-drill-section-toggle"
                      onClick={() => setForecastExpanded((expanded) => !expanded)}
                      aria-expanded={forecastExpanded}
                      aria-label={forecastExpanded ? "Collapse forecast transactions" : "Expand forecast transactions"}
                    >
                      {forecastExpanded ? "▾" : "▸"}
                    </button>
                    <span className="pir-pd-actuals-tx-title">Forecast — Remaining Months</span>
                  </div>
                  <span className="pir-pd-actuals-tx-pill">
                    {forecastLineCount} lines ·{" "}
                    <span className={forecastTotal < 0 ? "pir-pd-amount-neg" : ""}>{fmtSignedAmount(forecastTotal)}</span>
                  </span>
                </div>

                {forecastExpanded && <table className="pir-pd-actuals-table" aria-label="Forecast transactions">
                  <thead>
                    <tr>
                      <th className="pir-pd-actuals-th pir-pd-actuals-th-month">MONTH</th>
                      <th className="pir-pd-actuals-th">GL ACCOUNT</th>
                      <th className="pir-pd-actuals-th">DESCRIPTION</th>
                      <th className="pir-pd-actuals-th pir-pd-actuals-th-amount">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillLoading && (
                      <tr>
                        <td className="pir-pd-actuals-state" colSpan={4}>Loading forecast…</td>
                      </tr>
                    )}
                    {!drillLoading && drillError && (
                      <tr>
                        <td className="pir-pd-actuals-state pir-pd-actuals-state-error" colSpan={4}>
                          Couldn’t load forecast: {drillError}
                        </td>
                      </tr>
                    )}
                    {!drillLoading && !drillError && forecastRows.length === 0 && fAdjustments.length === 0 && (
                      <tr>
                        <td className="pir-pd-actuals-state" colSpan={4}>
                          No forecast (budget) lines for this account and fiscal year.
                        </td>
                      </tr>
                    )}
                    {!drillLoading && !drillError && forecastRows.map((t, i) => (
                      <tr key={`fc-${i}`} className="pir-pd-actuals-row">
                        <td className="pir-pd-actuals-month">{t.month}</td>
                        <td className="pir-pd-actuals-gl">{t.gl}</td>
                        <td className="pir-pd-actuals-desc">{t.desc}</td>
                        <td className={`pir-pd-actuals-amount ${t.amount < 0 ? "pir-pd-actuals-amount-neg" : ""}`}>
                          {fmtSignedAmount(t.amount)}
                        </td>
                      </tr>
                    ))}
                    {fAdjustments.map((a) => {
                      const signed = signedAdjustment(a);
                      return (
                        <tr key={a.id} className="pir-pd-actuals-row pir-pd-actuals-adj-row">
                          <td className="pir-pd-actuals-month">{a.month}</td>
                          <td className="pir-pd-actuals-gl">
                            {a.gl}{" "}
                            <span className={`pir-pd-actuals-tag pir-pd-actuals-tag-${a.drCr === "Cr" ? "cr" : "dr"}`}>
                              {a.drCr} ADJ
                            </span>
                          </td>
                          <td className="pir-pd-actuals-desc">{a.desc}</td>
                          <td className={`pir-pd-actuals-amount ${signed < 0 ? "pir-pd-actuals-amount-neg" : ""}`}>
                            {fmtSignedAmount(signed)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="pir-pd-actuals-total-row">
                      <td colSpan={3}>TOTAL FORECAST</td>
                      <td className={`pir-pd-actuals-amount ${forecastTotal < 0 ? "pir-pd-actuals-total-neg" : ""}`}>
                        {fmtSignedAmount(forecastTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>}
              </section>

              {/* ── Add Forecast Adjustment ────────────────────────── */}
              {forecastExpanded && <section className="pir-pd-adj pir-pd-fc" aria-label="Add Forecast Adjustment">
                <div className="pir-pd-adj-title">
                  <Icon name="plus" size={15} /> ADD FORECAST ADJUSTMENT
                </div>
                <div className="pir-pd-adj-grid">
                  <div className="pir-pd-adj-field">
                    <label className="pir-pd-adj-label">MONTH</label>
                    <select className="pir-pd-adj-input" value={effectiveFMonth} onChange={(e) => setFMonth(e.target.value)}>
                      {fMonthOptions.length === 0 && <option value="">—</option>}
                      {fMonthOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pir-pd-adj-field">
                    <label className="pir-pd-adj-label">DR / CR</label>
                    <select
                      className="pir-pd-adj-input"
                      value={fDrCr}
                      onChange={(e) => setFDrCr(e.target.value === "Cr" ? "Cr" : "Dr")}
                    >
                      <option value="Dr">Dr (Debit)</option>
                      <option value="Cr">Cr (Credit)</option>
                    </select>
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-grow">
                    <label className="pir-pd-adj-label">GL STRING</label>
                    <input
                      className="pir-pd-adj-input"
                      value={fGl}
                      onChange={(e) => setFGl(e.target.value)}
                      placeholder="e.g. 1100.US.600.001.30000000.IAR0000.20161001.PROJ1"
                    />
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-grow">
                    <label className="pir-pd-adj-label">DESCRIPTION</label>
                    <input
                      className="pir-pd-adj-input"
                      value={fDesc}
                      onChange={(e) => setFDesc(e.target.value)}
                      placeholder="Forecast adjustment description…"
                    />
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-amount">
                    <label className="pir-pd-adj-label">AMOUNT ($)</label>
                    <input
                      className="pir-pd-adj-input"
                      type="number"
                      value={fAmount}
                      onChange={(e) => setFAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="pir-pd-adj-field pir-pd-adj-field-action">
                    <button type="button" className="pir-pd-adj-button" onClick={addForecastAdjustment}>
                      + Add Adjustment
                    </button>
                  </div>
                </div>
              </section>}

              {/* ── Unmapped Datalake Transactions ─────────────────── */}
              <section className="pir-pd-unmapped" aria-label="Unmapped Datalake Transactions">
                <div className="pir-pd-unmapped-header">
                  <div className="pir-pd-unmapped-heading">
                    <button
                      type="button"
                      className="pir-pd-drill-section-toggle"
                      onClick={() => setUnmappedExpanded((expanded) => !expanded)}
                      aria-expanded={unmappedExpanded}
                      aria-label={unmappedExpanded ? "Collapse unmapped transactions" : "Expand unmapped transactions"}
                    >
                      {unmappedExpanded ? "▾" : "▸"}
                    </button>
                    <span className="pir-pd-unmapped-title">
                      Unmapped Datalake Transactions{proposalCode ? ` — SPC ${proposalCode}` : ""}
                    </span>
                  </div>
                  <span className="pir-pd-unmapped-pill">{unmapped.length} unmatched</span>
                </div>

                {unmappedExpanded && <>
                <div className="pir-pd-unmapped-note">
                  These transactions were extracted from the datalake against the SPC project codes but have not
                  been mapped to any CAPEX / OPEX / Revenue line. Select lines below and map them to{" "}
                  <strong>{mapTargetLabel}</strong> if applicable.
                </div>

                <table className="pir-pd-actuals-table" aria-label="Unmapped transactions">
                  <thead>
                    <tr>
                      <th className="pir-pd-actuals-th pir-pd-unmapped-th-check">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="pir-pd-unmapped-check"
                          checked={allUnmappedSelected}
                          onChange={(e) => toggleUnmappedAll(e.target.checked)}
                          disabled={unmapped.length === 0}
                          aria-label="Select all unmapped transactions"
                        />
                      </th>
                      <th className="pir-pd-actuals-th pir-pd-actuals-th-month">MONTH</th>
                      <th className="pir-pd-actuals-th">GL ACCOUNT</th>
                      <th className="pir-pd-actuals-th">GL DESCRIPTION</th>
                      <th className="pir-pd-actuals-th pir-pd-actuals-th-amount">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmappedLoading && (
                      <tr>
                        <td className="pir-pd-actuals-state" colSpan={5}>Loading unmapped transactions…</td>
                      </tr>
                    )}
                    {!unmappedLoading && unmappedError && (
                      <tr>
                        <td className="pir-pd-actuals-state pir-pd-actuals-state-error" colSpan={5}>
                          Couldn’t load unmapped transactions: {unmappedError}
                        </td>
                      </tr>
                    )}
                    {!unmappedLoading && !unmappedError && unmapped.length === 0 && (
                      <tr>
                        <td className="pir-pd-actuals-state" colSpan={5}>No unmapped transactions for this proposal.</td>
                      </tr>
                    )}
                    {!unmappedLoading && !unmappedError && unmapped.map((u, i) => (
                      <tr
                        key={`unmapped-${i}`}
                        className={`pir-pd-actuals-row ${unmappedSel.has(i) ? "pir-pd-unmapped-row-selected" : ""}`}
                      >
                        <td className="pir-pd-unmapped-check-cell">
                          <input
                            type="checkbox"
                            className="pir-pd-unmapped-check"
                            checked={unmappedSel.has(i)}
                            onChange={() => toggleUnmappedRow(i)}
                            aria-label={`Select ${u.desc || u.gl}`}
                          />
                        </td>
                        <td className="pir-pd-actuals-month">{u.month}</td>
                        <td className="pir-pd-actuals-gl">{u.gl}</td>
                        <td className="pir-pd-actuals-desc">{u.desc}</td>
                        <td className={`pir-pd-actuals-amount ${u.amount < 0 ? "pir-pd-actuals-amount-neg" : ""}`}>
                          {fmtSignedAmount(u.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {unmapped.length > 0 && (
                    <tfoot>
                      <tr className="pir-pd-actuals-total-row">
                        <td colSpan={4}>TOTAL UNMAPPED</td>
                        <td className={`pir-pd-actuals-amount ${unmappedTotal < 0 ? "pir-pd-actuals-total-neg" : ""}`}>
                          {fmtSignedAmount(unmappedTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {!unmappedLoading && !unmappedError && unmapped.length > 0 && (
                  <div className="pir-pd-unmapped-actions">
                    <div className="pir-pd-unmapped-stat">
                      <div className="pir-pd-unmapped-stat-label">Selected</div>
                      <div className="pir-pd-unmapped-stat-value">
                        {selectedCount} line{selectedCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="pir-pd-unmapped-stat">
                      <div className="pir-pd-unmapped-stat-label">Total Amount</div>
                      <div className="pir-pd-unmapped-stat-value">{fmtSignedAmount(selectedTotal)}</div>
                    </div>
                    <div className="pir-pd-unmapped-comment">
                      <label className="pir-pd-unmapped-stat-label" htmlFor="pir-pd-map-comment">
                        Mapping Comment <span className="pir-pd-unmapped-required">*</span>
                      </label>
                      <textarea
                        id="pir-pd-map-comment"
                        className="pir-pd-unmapped-textarea"
                        value={mapComment}
                        onChange={(e) => { setMapComment(e.target.value); setMapError(null); }}
                        placeholder={`Explain why these transactions belong to ${mapTargetLabel}…`}
                      />
                      {mapError && <div className="pir-pd-unmapped-error">{mapError}</div>}
                    </div>
                    <button
                      type="button"
                      className="pir-pd-unmapped-map-button"
                      onClick={() => { void mapSelectedUnmapped(); }}
                      disabled={selectedCount === 0 || mapSaving}
                    >
                      <Icon name="link" size={15} />{" "}
                      {mapSaving ? "Mapping…" : `Map to ${mapTargetLabel}`}
                    </button>
                  </div>
                )}
                </>}
              </section>

              {/* ── Reconciliation ─────────────────────────────────── */}
              <section className="pir-pd-recon" aria-label="Reconciliation">
                <div className="pir-pd-recon-label">RECONCILIATION</div>
                <div className="pir-pd-recon-body">
                  <div className="pir-pd-recon-formula">
                    <span>Actuals: <strong className="pir-pd-recon-actuals">{fmtSignedAmount(actualsTxTotal)}</strong></span>
                    <span className="pir-pd-recon-op">±</span>
                    <span>Act Adj: <strong className="pir-pd-recon-adj">{fmtSignedAmount(actAdjNet)}</strong></span>
                    <span className="pir-pd-recon-op">+</span>
                    <span>Forecast: <strong className="pir-pd-recon-forecast">{fmtSignedAmount(forecastTxTotal)}</strong></span>
                    <span className="pir-pd-recon-op">±</span>
                    <span>Fc Adj: <strong className="pir-pd-recon-fadj">{fmtSignedAmount(fcAdjNet)}</strong></span>
                    <span className="pir-pd-recon-op">=</span>
                    <span>Total: <strong className="pir-pd-recon-total">{fmtSignedAmount(reconTotal)}</strong></span>
                  </div>
                  <div className={`pir-pd-recon-variance ${reconUnderBudget ? "pir-pd-recon-under" : "pir-pd-recon-over"}`}>
                    <div className="pir-pd-recon-var-value">{fmtSignedAmount(Math.abs(reconVariance))}</div>
                    <div className="pir-pd-recon-var-sub">
                      {reconUnderBudget ? "Under budget" : "Over budget"} ({formatPlain(reconVarPct, fmt)}% of SPC)
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* ── Empty state ──────────────────────────────────── */
            drillNotice ? (
              <div className="pir-pd-drilldown-empty">
                <div className="pir-pd-empty-icon" aria-hidden="true"><Icon name="lock" size={40} /></div>
                <div className="pir-pd-empty-title">No proposal created yet</div>
                <p className="pir-pd-empty-text">{drillNotice}</p>
              </div>
            ) : (
              <div className="pir-pd-drilldown-empty">
                <div className="pir-pd-empty-icon" aria-hidden="true"><Icon name="chart" size={40} /></div>
                <div className="pir-pd-empty-title">Select a Line Item to Drill Down</div>
                <p className="pir-pd-empty-text">
                  Use the <strong>line filter</strong> above to select a line item, or click any PIR Reforecast
                  value in the Forecast vs Actuals tab to view the full breakdown — actual financial
                  transactions, remaining month forecasts (MMC versions), and manual adjustments.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {activeTab === "reporting" && (
        <div className="pir-pd-tab-panel">
          {/* ── Report header card ─────────────────────────────── */}
          <div className={`pir-pd-pir-report-card ${hasProposalId ? "" : "pir-pd-pir-report-card-solo"}`}>
            <div className="pir-pd-pir-report-left">
              <div className="pir-pd-pir-report-eyebrow">
                Post-Implementation Review Report{pirReportCode ? ` — ${pirReportCode}` : ""}
              </div>
              {hasProposalId && <div className="pir-pd-pir-report-title">{pirReportTitle}</div>}
            </div>
            {hasProposalId && (
              <div className="pir-pd-pir-report-right">
                <div className="pir-pd-pir-stat">
                  <div className="pir-pd-pir-stat-label">INVESTMENT</div>
                  <div className="pir-pd-pir-stat-value">{snapMoney(pirInvestmentNum, "—")}</div>
                </div>
                <div className="pir-pd-pir-stat">
                  <div className="pir-pd-pir-stat-label">OVERALL STATUS</div>
                  <span className={`pir-pd-pir-status-pill pir-pd-pir-status-pill-${pirOverall.tone}`}>
                    {pirOverall.icon && <Icon name={pirOverall.icon} size={13} />}
                    {pirOverall.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Section heading ────────────────────────────────── */}
          <div className="pir-pd-pir-section-heading">
            <span className="pir-pd-pir-section-icon" aria-hidden="true"><Icon name="camera" size={18} /></span>
            <div>
              <div className="pir-pd-pir-section-title">Periodic Snapshots — PIR Reforecast Summary</div>
              <div className="pir-pd-pir-section-sub">Captured at key milestones across the investment lifecycle</div>
            </div>
            {/* Re-captures the snapshots server-side, then (only on status "S")
                re-reads every region — the refresh bus is global, so the figures
                here can't end up newer than the report they summarise. */}
            <button
              type="button"
              className="pir-pd-pir-section-refresh"
              onClick={() => { void recaptureSnapshots(); }}
              disabled={recapturing || snapshotsLoading}
              title={
                recapturing
                  ? "Re-capturing snapshots…"
                  : recaptureError
                    ? `Re-capture failed: ${recaptureError}`
                    : "Re-capture snapshots and refresh"
              }
              aria-label="Re-capture snapshots and refresh"
            >
              <span className={recapturing || snapshotsLoading ? "pir-pd-pir-refresh-spin" : undefined}>
                <Icon name="refresh" size={16} />
              </span>
            </button>
          </div>

          {/* A failed re-capture has to be visible — the cards below still show
              the previous figures and would otherwise look freshly captured. */}
          {recaptureError && (
            <div className="pir-pd-pir-recapture-error" role="alert">
              Couldn’t re-capture snapshots: {recaptureError}
            </div>
          )}

          {/* ── Snapshot cards ─────────────────────────────────── */}
          {snapshotsLoading && (
            <div className="pir-pd-snapshot-grid" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="pir-pd-snapshot-card pir-pd-snap-skel-card">
                  <div className="pir-pd-snapshot-header pir-pd-snap-header-dark">
                    <span className="pir-pd-skel pir-pd-skel-title" />
                    <span className="pir-pd-skel pir-pd-skel-badge" />
                  </div>
                  <div className="pir-pd-snapshot-body">
                    {[0, 1, 2].map((b) => (
                      <div key={b} className="pir-pd-snap-block">
                        <div className="pir-pd-snap-main-row">
                          <span className="pir-pd-skel pir-pd-skel-label" />
                          <span className="pir-pd-skel pir-pd-skel-value" />
                        </div>
                        <div className="pir-pd-snap-sub-row">
                          <span className="pir-pd-skel pir-pd-skel-sub" />
                          <span className="pir-pd-skel pir-pd-skel-sub-val" />
                        </div>
                      </div>
                    ))}
                    <div className="pir-pd-snap-summary">
                      <div className="pir-pd-snap-summary-row">
                        <span className="pir-pd-skel pir-pd-skel-label" />
                        <span className="pir-pd-skel pir-pd-skel-value" />
                      </div>
                    </div>
                  </div>
                  <div className="pir-pd-snap-skel-footer">
                    <span className="pir-pd-skel pir-pd-skel-footer-bar" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {snapshotsError && !snapshotsLoading && (
            <div className="pir-pd-snapshot-state pir-pd-snapshot-error">Couldn’t load snapshots: {snapshotsError}</div>
          )}
          {!snapshotsLoading && !snapshotsError && snapshots.length === 0 && (
            <div className="pir-pd-snapshot-state">No periodic snapshots available.</div>
          )}
          {!snapshotsLoading && !snapshotsError && snapshots.length > 0 && (
          <div className="pir-pd-snapshot-grid">
            {snapshots.map((snap) => (
              <div key={snap.title} className={`pir-pd-snapshot-card ${snap.muted ? "pir-pd-snapshot-muted" : ""}`}>
                <div className={`pir-pd-snapshot-header ${snap.headerTone === "muted" ? "pir-pd-snap-header-muted" : "pir-pd-snap-header-dark"}`}>
                  <span className="pir-pd-snapshot-title">{snap.title}</span>
                  <span className={`pir-pd-snapshot-badge pir-pd-badge-tone-${snap.badgeTone}`}>{snap.badge}</span>
                </div>

                <div className="pir-pd-snapshot-body">
                  {snap.lines.map((line) => (
                    <div key={line.label} className="pir-pd-snap-block">
                      <div className="pir-pd-snap-main-row">
                        <span className="pir-pd-snap-main-label">{line.label}</span>
                        <span className={`pir-pd-snap-main-value ${snap.muted ? "pir-pd-val-muted" : ""}`}>{snapMoney(line.valueNum, line.value)}</span>
                      </div>
                      <div className="pir-pd-snap-sub-row">
                        <span className="pir-pd-snap-sub-label">Reforecast</span>
                        <span className={`pir-pd-snap-sub-value ${snap.muted ? "pir-pd-val-muted" : line.actualsNum != null && line.actualsNum < 0 ? "pir-pd-amount-neg" : "pir-pd-val-accent"}`}>{snapMoney(line.actualsNum, line.actuals)}</span>
                      </div>
                      <div className="pir-pd-snap-sub-row">
                        <span className="pir-pd-snap-sub-label">Budget Variance</span>
                        <span className={`pir-pd-snap-sub-value pir-pd-variance-${line.varianceTone}`}>{line.variance}</span>
                      </div>
                    </div>
                  ))}

                  <div className="pir-pd-snap-summary">
                    <div className="pir-pd-snap-summary-row">
                      <span className="pir-pd-snap-summary-label">Total Cost (SPC)</span>
                      <span className={`pir-pd-snap-summary-value ${snap.muted ? "pir-pd-val-muted" : ""}`}>{snapMoney(snap.totalNum, snap.total)}</span>
                    </div>
                    <div className="pir-pd-snap-summary-row">
                      <span className="pir-pd-snap-summary-label">Reforecast</span>
                      <span className={`pir-pd-snap-summary-value ${snap.muted ? "pir-pd-val-muted" : snap.totalActualsNum != null && snap.totalActualsNum < 0 ? "pir-pd-amount-neg" : "pir-pd-val-accent"}`}>{snapMoney(snap.totalActualsNum, snap.totalActuals)}</span>
                    </div>
                    <div className="pir-pd-snap-summary-row">
                      <span className="pir-pd-snap-summary-label">Budget Variance</span>
                      <span className={`pir-pd-snap-summary-value pir-pd-variance-${snap.totalVarianceTone}`}>{snap.totalVariance}</span>
                    </div>
                    <div className="pir-pd-snap-summary-row">
                      <span className="pir-pd-snap-summary-label">Benefit Realisation</span>
                      <span className={`pir-pd-snap-summary-value ${snap.muted ? "pir-pd-val-muted" : /^\(/.test(snap.benefit) ? "pir-pd-amount-neg" : ""}`}>{snap.benefit}</span>
                    </div>
                  </div>
                </div>

                <div className={`pir-pd-snapshot-footer pir-pd-footer-${snap.footerTone}`}>{snap.footerLabel}</div>
              </div>
            ))}
          </div>
          )}

          {/* ── Narrative cards — executive summary & lessons learned ── */}
          <div className="pir-pd-narrative-grid">
            {NARRATIVE_CARDS.map((card) => {
              const value = narratives[card.key];
              return (
                <section key={card.key} className="pir-pd-narrative-card" aria-label={card.title}>
                  <div className="pir-pd-narrative-head">
                    <span className="pir-pd-narrative-icon" aria-hidden="true"><Icon name={card.icon} size={17} /></span>
                    <h3 className="pir-pd-narrative-title">{card.title}</h3>
                    <span className="pir-pd-narrative-hint">{card.hint}</span>
                  </div>

                  <textarea
                    className="pir-pd-narrative-input"
                    value={value}
                    maxLength={NARRATIVE_LIMIT}
                    onChange={(e) => setNarrative(card.key, e.target.value)}
                    placeholder={narrativePlaceholder(card)}
                    aria-label={card.title}
                  />

                  <div className="pir-pd-narrative-foot">
                    <span className="pir-pd-narrative-count">
                      {value.length.toLocaleString("en-US")} / {NARRATIVE_LIMIT.toLocaleString("en-US")} characters
                    </span>
                    <div className="pir-pd-narrative-actions">
                      <button
                        type="button"
                        className="pir-pd-narrative-clear"
                        onClick={() => {
                          setNarrative(card.key, "");
                          showNarrativeToast(`${card.title} cleared`);
                        }}
                        disabled={value === ""}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="pir-pd-narrative-save"
                        onClick={() => showNarrativeToast(`✓ ${card.title} saved`)}
                        disabled={value.trim() === ""}
                        title={value.trim() === "" ? "Enter commentary to enable saving" : undefined}
                      >
                        <Icon name="save" size={14} />
                        Save
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* ── PIR Calendar ───────────────────────────────────── */}
          {!snapshotsLoading && !snapshotsError && calendarItems.length > 0 && (
            <div className="pir-pd-pir-calendar">
              <div className="pir-pd-pir-cal-header">
                <span className="pir-pd-pir-cal-icon" aria-hidden="true">
                  <Icon name="calendar" size={20} />
                </span>
                <div>
                  <div className="pir-pd-pir-cal-title">PIR CALENDAR</div>
                  <div className="pir-pd-pir-cal-sub">Upcoming review milestones and reminders</div>
                </div>
              </div>

              {calendarItems.map((item) => (
                <div key={item.key} className={`pir-pd-pir-cal-row pir-pd-pir-cal-${item.state}`}>
                  <div className="pir-pd-pir-cal-left">
                    <div className="pir-pd-pir-cal-row-title">{item.title}</div>
                    {/* Milestone dates are absent in the null-proposal template — show
                        a "date TBC" placeholder instead of an empty date row. */}
                    <div className="pir-pd-pir-cal-date-row">
                      <span className="pir-pd-pir-cal-date" aria-hidden="true">
                        <Icon name="calendar" size={14} />
                      </span>
                      <span className="pir-pd-pir-cal-date-text">{item.date || "Date TBC"}</span>
                      {item.daysAway != null && (
                        <span className="pir-pd-pir-cal-days"><Icon name="bell" size={13} /> {item.daysAway} days away</span>
                      )}
                    </div>
                    <div className="pir-pd-pir-cal-desc">{item.description}</div>
                  </div>
                  <div className="pir-pd-pir-cal-right">
                    <button
                      type="button"
                      className={`pir-pd-pir-cal-outcome pir-pd-outcome-${item.state}`}
                      disabled={item.state === "future"}
                    >
                      <Icon name="report" size={14} /> Review Outcome
                    </button>
                    {item.state === "completed" && (
                      <span className="pir-pd-pir-cal-badge pir-pd-badge-completed"><Icon name="check" size={13} /> Completed</span>
                    )}
                    {item.state === "upcoming" && (
                      <span className="pir-pd-pir-cal-badge pir-pd-badge-upcoming"><Icon name="clock" size={13} /> Upcoming</span>
                    )}
                    {item.state === "future" && (
                      <span className="pir-pd-pir-cal-badge pir-pd-badge-future"><Icon name="lock" size={13} /> Future</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {narrativeToast && <div className="pir-pd-narrative-toast" role="status">{narrativeToast}</div>}
        </div>
      )}

      <style>{`
        .pir-pd-dashboard-root {
          /* Single source of truth for every heading in the dashboard: one
             navy for heading text and icons, one tint for heading strips and
             icon chips. Section themes (green actuals, purple forecast,
             orange datalake) all resolve to these. */
          --pir-heading: #1D2C4D;
          --pir-heading-bg: #dde2ec69;

          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          background: #f7f8fa;
          color: #001a3b;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Line icons sit on the text baseline and take the heading colour. */
        .pir-pd-dashboard-root svg { flex: 0 0 auto; }

        /* ── Sticky head ─────────────────────────────────────────
           The tab bar and the format toolbar pin together as one block, so
           neither scrolls away and no offset has to track the other's height.
           The opaque background stops content showing through the toolbar's
           surrounding margin as it scrolls underneath. The z-index clears the
           report's own sticky header row and first column. */
        .pir-pd-sticky-head {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #f7f8fa;
          padding-bottom: 8px;
        }

        /* ── Tab bar ─────────────────────────────────────────── */
        .pir-pd-tab-bar {
          display: flex;
          align-items: stretch;
          gap: 4px;
          background: #ffffff;
          border-bottom: 1px solid #e6e9ee;
          padding: 0;
        }

        .pir-pd-tab-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 18px;
          border: 0;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #687386;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-tab-button:hover {
          color: var(--pir-heading);
        }

        .pir-pd-tab-active {
          color: var(--pir-heading);
          border-bottom-color: var(--pir-heading);
        }

        .pir-pd-tab-panel {
          padding: 8px;
        }

        /* ── Breadcrumb ──────────────────────────────────────── */
        .pir-pd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 14px;
        }

        .pir-pd-crumb-link {
          color: #1D2C4D;
          font-weight: 600;
        }

        .pir-pd-crumb-sep {
          color: #b3bac6;
        }

        .pir-pd-crumb-current {
          color: #001a3b;
          font-weight: 700;
        }

        /* ── Title row ───────────────────────────────────────── */
        .pir-pd-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .pir-pd-title-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pir-pd-title-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-page-title {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-title-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .pir-pd-search-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 14px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
        }

        .pir-pd-search-icon {
          display: inline-flex;
          align-items: center;
          color: #9aa3b2;
        }

        .pir-pd-search-input {
          width: 220px;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #001a3b;
        }

        .pir-pd-edit-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 500;
        }

        .pir-pd-edit-hint-icon {
          font-size: 13px;
        }

        /* ── KPI card ────────────────────────────────────────── */
        .pir-pd-kpi-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 18px;
          box-shadow: 0 1px 3px rgba(0, 26, 59, 0.06);
        }

        .pir-pd-kpi-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .pir-pd-kpi-card-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pir-pd-kpi-heading-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-kpi-heading-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--pir-heading);
          letter-spacing: 0.01em;
        }

        .pir-pd-kpi-heading-sub {
          font-size: 12px;
          color: #687386;
          margin-top: 2px;
        }

        /* ── RAG summary ─────────────────────────────────────── */
        .pir-pd-rag-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 28px;
          padding: 12px 16px;
          background: #f4f6f9;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .pir-pd-rag-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .pir-pd-rag-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .pir-pd-rag-red { background: #e3342f; }
        .pir-pd-rag-amber { background: #f5a623; }
        .pir-pd-rag-green { background: #1ea761; }

        .pir-pd-rag-count {
          font-weight: 600;
          color: #001a3b;
        }

        .pir-pd-rag-desc {
          color: #687386;
        }

        .pir-pd-reapproval-pill {
          padding: 4px 12px;
          border-radius: 999px;
          background: #b91c2c;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* ── KPI grid ────────────────────────────────────────── */
        .pir-pd-kpi-state {
          padding: 30px 16px;
          text-align: center;
          color: #687386;
          font-size: 13px;
          background: #f7f8fa;
          border: 1px solid #e6e9ee;
          border-radius: 8px;
        }

        .pir-pd-kpi-error {
          color: red;
          background: #dde2ec69;
          border-color: #d5dbe7;
        }

        .pir-pd-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .pir-pd-kpi-tile {
          border: 1px solid #e6e9ee;
          border-left: 5px solid #cbd2dc;
          border-radius: 8px;
          padding: 11px 13px 13px;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(0, 26, 59, 0.05);
        }

        .pir-pd-tile-red {
          background: linear-gradient(180deg, #fdf3f3 0%, #ffffff 55%);
          border-color: #f1d4d4;
          border-left-color: #e3342f;
        }

        .pir-pd-tile-green {
          background: linear-gradient(180deg, #f1faf4 0%, #ffffff 55%);
          border-color: #d2ecdd;
          border-left-color: #1ea761;
        }

        .pir-pd-tile-amber {
          background: linear-gradient(180deg, #fdf6e9 0%, #ffffff 55%);
          border-color: #f1ddb6;
          border-left-color: #f0941e;
        }

        .pir-pd-tile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .pir-pd-tile-label {
          font-size: 14px;
          font-weight: 700;
          color: #6C757D;
          letter-spacing: 0.04em;
        }

        .pir-pd-tile-badge {
          padding: 3px 9px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #ffffff;
        }

        .pir-pd-badge-red { background: #e3342f; }
        .pir-pd-badge-green { background: #1ea761; }
        .pir-pd-badge-amber { background: #f0941e; }

        .pir-pd-tile-value {
          font-size: 26px;
          font-weight: 800;
          color: #001a3b;
          margin: 4px 0 2px;
        }

        /* Headline value takes the tile's RAG colour */
        .pir-pd-tile-red .pir-pd-tile-value { color: red; }
        .pir-pd-tile-green .pir-pd-tile-value { color: #1ea761; }
        .pir-pd-tile-amber .pir-pd-tile-value { color: #f0941e; }

        /* A negative headline value always reads red, overriding the RAG tone */
        .pir-pd-tile-value.pir-pd-amount-neg { color: red; }

        .pir-pd-tile-approved {
          font-size: 10px;
          color: #687386;
        }

        .pir-pd-tile-divider {
          height: 1px;
          background: rgba(0, 26, 59, 0.08);
          margin: 9px 0 7px;
        }

        .pir-pd-tile-meta-label {
          font-size: 11px;
          font-weight: 700;
          color: #9aa3b2;
          letter-spacing: 0.06em;
        }

        .pir-pd-tile-variance {
          font-size: 11.5px;
          font-weight: 700;
          margin-top: 2px;
        }

        .pir-pd-variance-red { color: red; }
        .pir-pd-variance-green { color: #1ea761; }
        .pir-pd-variance-amber { color: #d97d0c; }
        .pir-pd-variance-neutral { color: #687386; }

        .pir-pd-tile-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          margin-top: 9px;
        }

        .pir-pd-tile-hurdle {
          font-size: 13px;
          font-weight: 700;
          color: #001a3b;
          margin-top: 2px;
        }

        .pir-pd-tile-status {
          font-size: 15px;
          font-weight: 700;
          margin-left: auto;
        }

        .pir-pd-status-red { color: red; }
        .pir-pd-status-green { color: #1ea761; }
        .pir-pd-status-amber { color: #d97d0c; }

        /* ── Drilldown controls ──────────────────────────────── */
        .pir-pd-line-item-select {
          height: 36px;
          width: 320px;
          padding: 0 14px;
          border: 1px solid #1d2633;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }

        .pir-pd-line-item-group {
          font-weight: 700;
          color: #001a3b;
          font-size: 12px;
        }

        .pir-pd-line-item-select,
        .pir-pd-line-item-select option {
          text-transform: none;
        }

        .pir-pd-line-item-select option {
          font-size: 13.5px;
          font-weight: 500;
        }

        .pir-pd-back-button {
          height: 36px;
          padding: 0 18px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-back-button:hover {
          background: #f4f6f9;
        }

        /* ── Drilldown empty state ───────────────────────────── */
        .pir-pd-drilldown-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 70px 24px 80px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
        }

        /* ── Drilldown detail ───────────────────────────────── */
        .pir-pd-drill-detail-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 20px 24px;
          margin-bottom: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          background: var(--pir-heading-bg);
        }

        .pir-pd-drill-detail-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pir-pd-drill-detail-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 10px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-drill-detail-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-drill-detail-sub {
          margin-top: 3px;
          font-size: 13px;
          color: #687386;
        }

        .pir-pd-drill-detail-sub strong { color: var(--pir-heading); }

        .pir-pd-drill-detail-right {
          text-align: right;
          font-size: 12px;
          color: #8a93a3;
          line-height: 1.7;
        }

        .pir-pd-drill-detail-right strong { color: var(--pir-heading); }

        .pir-pd-drill-tiles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .pir-pd-drill-tile {
          padding: 18px 20px;
          border-radius: 10px;
          border: 1px solid transparent;
        }

        /* All four summary tiles share the heading tint — the label says what
           each one is, so the colour no longer has to. */
        .pir-pd-drill-tile-purple,
        .pir-pd-drill-tile-green,
        .pir-pd-drill-tile-amber,
        .pir-pd-drill-tile-orange { background: var(--pir-heading-bg); border-color: #dfe4ee; }

        .pir-pd-drill-tile-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          color: var(--pir-heading);
        }

        .pir-pd-drill-tile-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-drill-tile-unit {
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 1000px) {
          .pir-pd-drill-tiles { grid-template-columns: repeat(2, 1fr); }
          .pir-pd-drill-detail-card { flex-direction: column; align-items: flex-start; }
          .pir-pd-drill-detail-right { text-align: left; }
        }

        .pir-pd-empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          border-radius: 16px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          margin-bottom: 24px;
        }

        .pir-pd-empty-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--pir-heading);
          margin-bottom: 14px;
        }

        .pir-pd-empty-text {
          max-width: 720px;
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #687386;
        }

        .pir-pd-empty-text strong {
          color: #001a3b;
          font-weight: 600;
        }

        /* ── PIR report header card ──────────────────────────── */
        .pir-pd-pir-report-card {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          background: var(--pir-heading);
          border: 0;
          border-radius: 12px;
          padding: 22px 26px;
          margin-bottom: 22px;
        }

        /* No proposal → the title is hidden, so the eyebrow becomes the card's
           heading: bigger, and vertically centred against the stats on the right. */
        .pir-pd-pir-report-card-solo { align-items: center; }
        .pir-pd-pir-report-card-solo .pir-pd-pir-report-right { align-items: center; }

        .pir-pd-pir-report-card-solo .pir-pd-pir-report-eyebrow {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #ffffff;
          margin-bottom: 0;
        }

        .pir-pd-pir-report-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }

        .pir-pd-pir-report-title {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .pir-pd-pir-report-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.75);
        }

        .pir-pd-pir-report-right {
          display: flex;
          align-items: flex-start;
          gap: 40px;
          flex-shrink: 0;
        }

        .pir-pd-pir-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 6px;
        }

        .pir-pd-pir-stat-value {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
        }

        .pir-pd-pir-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #f3d28a;
          border-radius: 999px;
          background: #fdf6e3;
          color: #b07908;
          font-size: 12px;
          font-weight: 600;
        }

        .pir-pd-pir-status-pill-red {
          border-color: rgba(194, 65, 12, 0.85);
          background: rgba(194, 65, 12, 0.85);
          color: rgb(255, 255, 255);
        }

        .pir-pd-pir-status-pill-green {
          border-color: #cdeede;
          background: #eafaf1;
          color: #1ea761;
        }

        .pir-pd-pir-status-pill-muted {
          border-color: #e2e6ec;
          background: #f1f3f6;
          color: #9aa3b2;
        }

        /* ── PIR narrative cards ─────────────────────────────── */
        .pir-pd-narrative-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
          margin-bottom: 22px;
        }

        .pir-pd-narrative-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          padding: 18px 20px 16px;
          box-shadow: 0 1px 3px rgba(0, 26, 59, 0.06);
        }

        .pir-pd-narrative-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .pir-pd-narrative-icon {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          color: var(--pir-heading);
        }

        /* Sits directly beside the icon — centring it stretched the title across
           the free space and left a wide gap after the icon. */
        .pir-pd-narrative-title {
          flex: 0 1 auto;
          margin: 0;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--pir-heading);
        }

        /* Pushed to the far right, so the gap lands here rather than after the icon */
        .pir-pd-narrative-hint {
          flex: 0 0 auto;
          margin-left: auto;
          padding-left: 12px;
          font-size: 12px;
          color: #9aa3b2;
        }

        /* White fill and a defined border: the tinted background with a pale
           border read as a disabled field, so nobody realised these were
           editable. */
        .pir-pd-narrative-input {
          width: 100%;
          min-height: 300px;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid #1D2C4D;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.9;
          resize: vertical;
          outline: none;
        }

        /* Faded well below the typed colour so the guidance reads as a prompt
           rather than as content already in the box. */
        .pir-pd-narrative-input::placeholder {
          color: #1D2C4D;
          opacity: 0.42;
        }

        .pir-pd-narrative-input:focus {
          border-color: #1D2C4D;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(29, 44, 77, 0.10);
        }

        .pir-pd-narrative-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 14px;
        }

        .pir-pd-narrative-count {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          color: #9aa3b2;
        }

        .pir-pd-narrative-actions {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .pir-pd-narrative-clear,
        .pir-pd-narrative-save {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-narrative-clear {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: var(--pir-heading);
        }

        .pir-pd-narrative-clear:hover:not(:disabled) {
          background: #f4f6f9;
        }

        .pir-pd-narrative-save {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: var(--pir-heading);
        }

        .pir-pd-narrative-save:hover:not(:disabled) {
          background: #f4f6f9;
        }

        .pir-pd-narrative-clear:disabled,
        .pir-pd-narrative-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pir-pd-narrative-toast {
          position: fixed;
          right: 24px;
          top: 24px;
          z-index: 500;
          max-width: 420px;
          padding: 12px 18px;
          border-radius: 8px;
          background: #1d2633;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }

        /* ── PIR section heading ─────────────────────────────── */
        .pir-pd-pir-section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .pir-pd-pir-section-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-pir-section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-pir-section-sub {
          font-size: 12px;
          color: #687386;
          margin-top: 2px;
        }

        /* margin-left:auto pins it to the right edge of the heading row */
        .pir-pd-pir-section-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          padding: 0;
          border: 1px solid #e6e9ee;
          border-radius: 8px;
          background: #ffffff;
          color: var(--pir-heading);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .pir-pd-pir-section-refresh:hover:not(:disabled) {
          background: var(--pir-heading-bg);
          border-color: var(--pir-heading);
        }

        .pir-pd-pir-section-refresh:disabled {
          cursor: default;
          opacity: 0.55;
        }

        .pir-pd-pir-recapture-error {
          margin: -8px 0 16px;
          padding: 9px 12px;
          border-radius: 8px;
          background: #dde2ec69;
          color: red;
          font-size: 12px;
          line-height: 1.5;
        }

        .pir-pd-pir-refresh-spin {
          display: inline-flex;
          animation: pir-pd-pir-refresh-rotate 0.9s linear infinite;
        }

        @keyframes pir-pd-pir-refresh-rotate {
          to { transform: rotate(360deg); }
        }

        /* Respect a reduced-motion preference — the disabled state still reads
           as "busy" without the spin. */
        @media (prefers-reduced-motion: reduce) {
          .pir-pd-pir-refresh-spin { animation: none; }
        }

        /* ── Snapshot cards ──────────────────────────────────── */
        .pir-pd-snapshot-state {
          padding: 40px 20px;
          text-align: center;
          color: #687386;
          font-size: 14px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
        }

        .pir-pd-snapshot-error {
          color: red;
          border-color: #d5dbe7;
          background: #dde2ec69;
        }

        .pir-pd-snapshot-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        /* ── Snapshot skeleton (shown while snapshots load) ──── */
        .pir-pd-snap-skel-card .pir-pd-snapshot-header { background: #eef1f5; }
        .pir-pd-snap-skel-footer { height: 44px; background: #f4f6f9; }
        .pir-pd-skel {
          display: inline-block;
          border-radius: 5px;
          background: linear-gradient(90deg, #eef1f5 25%, #e2e6ec 37%, #eef1f5 63%);
          background-size: 400% 100%;
          animation: pir-pd-skel-shimmer 1.2s ease-in-out infinite;
        }
        @keyframes pir-pd-skel-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        .pir-pd-skel-title     { width: 46%; height: 13px; }
        .pir-pd-skel-badge     { width: 64px; height: 18px; border-radius: 4px; }
        .pir-pd-skel-label     { width: 38%; height: 12px; }
        .pir-pd-skel-value     { width: 30%; height: 13px; }
        .pir-pd-skel-sub       { width: 30%; height: 10px; }
        .pir-pd-skel-sub-val   { width: 24%; height: 10px; }
        .pir-pd-skel-footer-bar { display: block; width: 40%; height: 14px; margin: 15px auto 0; }

        .pir-pd-snapshot-card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
        }

        .pir-pd-snapshot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 16px;
        }

        .pir-pd-snap-header-dark {
          background: #1d2c4d;
        }

        .pir-pd-snap-header-muted {
          background: #9aa3b2;
        }

        .pir-pd-snapshot-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .pir-pd-snapshot-badge {
          padding: 3px 9px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }

        .pir-pd-badge-tone-dark {
          background: #33436b;
          color: #cdd6ea;
        }

        .pir-pd-badge-tone-amber {
          background: #f6e6a8;
          color: #8a6400;
        }

        .pir-pd-badge-tone-muted {
          background: #b6bdc9;
          color: #2f3848;
        }

        .pir-pd-snapshot-body {
          padding: 16px;
        }

        .pir-pd-snap-block {
          margin-bottom: 14px;
        }

        .pir-pd-snap-main-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding-bottom: 6px;
        }

        .pir-pd-snap-main-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-snap-main-value {
          font-size: 14px;
          font-weight: 700;
          color: #001a3b;
        }

        .pir-pd-snap-sub-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding: 2px 0 2px 10px;
        }

        .pir-pd-snap-sub-label {
          font-size: 12px;
          color: #8a93a3;
        }

        .pir-pd-snap-sub-value {
          font-size: 12px;
          font-weight: 600;
        }

        .pir-pd-val-accent { color: #1D2C4D; }
        .pir-pd-val-muted { color: #b3bac6; }

        .pir-pd-variance-green { color: #1ea761; }
        .pir-pd-variance-red { color: red; }
        .pir-pd-variance-muted { color: #b3bac6; }

        .pir-pd-snap-summary {
          border-top: 1px solid #eef1f5;
          margin-top: 4px;
          padding-top: 12px;
        }

        .pir-pd-snap-summary-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding: 4px 0;
        }

        .pir-pd-snap-summary-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--pir-heading);
        }

        .pir-pd-snap-summary-value {
          font-size: 13px;
          font-weight: 700;
          color: #001a3b;
        }

        .pir-pd-snap-summary-value.pir-pd-variance-green { color: #1ea761; }
        .pir-pd-snap-summary-value.pir-pd-variance-red { color: red; }
        .pir-pd-snap-summary-value.pir-pd-variance-muted { color: #b3bac6; }

        .pir-pd-snapshot-footer {
          margin: 0 16px 16px;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
        }

        .pir-pd-footer-green {
          background: #eafaf1;
          border: 1px solid #cdeede;
          color: #1ea761;
        }

        .pir-pd-footer-amber {
          background: #fdf6e3;
          border: 1px solid #f3e2bf;
          color: #b07908;
        }

        .pir-pd-footer-muted {
          background: #f1f3f6;
          border: 1px solid #e2e6ec;
          color: #9aa3b2;
        }

        .pir-pd-snapshot-muted .pir-pd-snap-main-label,
        .pir-pd-snapshot-muted .pir-pd-snap-summary-label,
        .pir-pd-snapshot-muted .pir-pd-snap-summary-value {
          color: #b3bac6;
        }

        /* ── PIR Calendar ────────────────────────────────────── */
        .pir-pd-pir-calendar {
          margin-top: 22px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          overflow: hidden;
        }

        .pir-pd-pir-cal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-pir-cal-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-pir-cal-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--pir-heading);
          letter-spacing: 0.02em;
        }

        .pir-pd-pir-cal-sub {
          font-size: 12px;
          color: #687386;
          margin-top: 2px;
        }

        .pir-pd-pir-cal-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 22px;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-pir-cal-row:last-child { border-bottom: 0; }

        .pir-pd-pir-cal-upcoming {
          background: #fdfaed;
          border-left: 4px solid #f0a91e;
        }

        .pir-pd-pir-cal-row-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-pir-cal-future .pir-pd-pir-cal-row-title { color: #9aa3b2; }

        .pir-pd-pir-cal-date-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0 8px;
          font-size: 13px;
          color: #687386;
        }

        .pir-pd-pir-cal-date {
          display: inline-flex;
          align-items: center;
          color: #9aa3b2;
        }

        .pir-pd-pir-cal-future .pir-pd-pir-cal-date-row { color: #aab1bd; }

        .pir-pd-pir-cal-days {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 9px;
          border-radius: 999px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          font-size: 11px;
          font-weight: 600;
        }

        .pir-pd-pir-cal-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }

        .pir-pd-pir-cal-future .pir-pd-pir-cal-desc { color: #aab1bd; }

        .pir-pd-pir-cal-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .pir-pd-pir-cal-outcome {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          border-radius: 8px;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-outcome-completed { border: 1px solid #bfe6cf; color: #1ea761; }
        .pir-pd-outcome-upcoming  { border: 1px solid #cdbdf0; color: #6d3bd0; }
        .pir-pd-outcome-future    { border: 1px solid #e2e6ec; color: #b3bac6; cursor: default; }

        .pir-pd-pir-cal-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .pir-pd-badge-completed { background: #cdf1dc; color: #137a44; }
        .pir-pd-badge-upcoming  { background: #fbe4ac; color: #97670a; }
        .pir-pd-badge-future    { background: #eef1f5; color: #9aa3b2; }

        @media (max-width: 1000px) {
          .pir-pd-snapshot-grid,
          .pir-pd-narrative-grid {
            grid-template-columns: 1fr;
          }
          .pir-pd-pir-report-card {
            flex-direction: column;
          }
          .pir-pd-pir-cal-row {
            flex-direction: column;
          }
        }

        /* ── Actuals — Financial Transactions ────────────────── */
        .pir-pd-actuals-tx {
          margin-top: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .pir-pd-actuals-tx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          background: var(--pir-heading-bg);
          border-bottom: 1px solid #d5dbe7;
        }

        .pir-pd-actuals-tx-heading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pir-pd-drill-section-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          padding: 0;
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: var(--pir-heading);
          font: inherit;
          font-size: 16px;
          cursor: pointer;
        }

        .pir-pd-drill-section-toggle:hover {
          background: #ffffff;
        }

        .pir-pd-actuals-tx-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid #d5dbe7;
          color: var(--pir-heading);
        }

        .pir-pd-actuals-tx-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-actuals-tx-pill {
          padding: 5px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #d5dbe7;
          color: var(--pir-heading);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .pir-pd-actuals-tx-note {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: #fafbfc;
          border-bottom: 1px solid #eef1f5;
          color: #6b7280;
          font-size: 12.5px;
          font-style: italic;
        }

        /* ── Unmapped Datalake Transactions ──────────────────── */
        .pir-pd-unmapped {
          margin-top: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .pir-pd-unmapped-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          background: var(--pir-heading-bg);
          border-bottom: 1px solid #d5dbe7;
          color: var(--pir-heading);
        }

        .pir-pd-unmapped-heading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pir-pd-unmapped-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--pir-heading);
          letter-spacing: 0.02em;
        }

        .pir-pd-unmapped-pill {
          padding: 5px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #d5dbe7;
          color: var(--pir-heading);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .pir-pd-unmapped-note {
          padding: 10px 18px;
          background: #fafbfc;
          border-bottom: 1px solid #eef1f5;
          color: #6b7280;
          font-size: 12.5px;
          font-style: italic;
        }

        /* Row selection */
        .pir-pd-unmapped-th-check,
        .pir-pd-unmapped-check-cell {
          width: 44px;
          padding-left: 18px;
          text-align: left;
        }

        .pir-pd-unmapped-check {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: var(--pir-heading);
          cursor: pointer;
        }

        .pir-pd-unmapped-check:disabled { cursor: default; opacity: 0.45; }

        .pir-pd-unmapped-row-selected { background: #fff6ee; }

        /* Map action bar */
        .pir-pd-unmapped-actions {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 14px 18px;
          background: var(--pir-heading-bg);
          border-top: 1.5px dashed #b9c2d4;
        }

        .pir-pd-unmapped-stat { flex: 0 0 auto; }

        .pir-pd-unmapped-stat-label {
          display: block;
          margin-bottom: 4px;
          color: var(--pir-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pir-pd-unmapped-stat-value {
          color: var(--pir-heading);
          font-size: 15px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .pir-pd-unmapped-required { color: red; }

        .pir-pd-unmapped-comment { flex: 1 1 auto; min-width: 0; }

        .pir-pd-unmapped-textarea {
          width: 100%;
          min-height: 54px;
          padding: 8px 12px;
          border: 1px solid #f0d6bb;
          border-radius: 6px;
          background: #ffffff;
          color: #001a3b;
          font: inherit;
          font-size: 13px;
          resize: vertical;
          outline: none;
        }

        .pir-pd-unmapped-textarea:focus {
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(29, 44, 77, 0.15);
        }

        .pir-pd-unmapped-error {
          margin-top: 4px;
          color: red;
          font-size: 11.5px;
          font-weight: 600;
        }

        .pir-pd-unmapped-map-button {
          flex: 0 0 auto;
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 18px;
          border: 0;
          border-radius: 6px;
          background: var(--pir-heading);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
        }

        .pir-pd-unmapped-map-button:hover:not(:disabled) { background: #142038; }

        .pir-pd-unmapped-map-button:disabled {
          background: #b6bcc6;
          color: #f4f6f9;
          cursor: not-allowed;
        }

        /* ── Reconciliation strip ────────────────────────────── */
        .pir-pd-recon {
          margin-top: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          background: var(--pir-heading-bg);
          padding: 16px 22px;
        }

        .pir-pd-recon-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--pir-heading);
          margin-bottom: 10px;
        }

        .pir-pd-recon-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pir-pd-recon-formula {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: #1d2633;
        }

        .pir-pd-recon-op { color: #9aa3b2; font-size: 15px; }
        .pir-pd-recon-actuals  { color: #1ea761; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-adj      { color: #e0761b; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-forecast { color: #4c2fa8; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-fadj     { color: #33179a; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-total    { color: #1D2C4D; font-variant-numeric: tabular-nums; }

        .pir-pd-recon-variance { text-align: right; }
        .pir-pd-recon-var-value {
          font-size: 20px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .pir-pd-recon-var-sub { font-size: 11px; margin-top: 2px; }
        .pir-pd-recon-under .pir-pd-recon-var-value,
        .pir-pd-recon-under .pir-pd-recon-var-sub { color: #1ea761; }
        .pir-pd-recon-over .pir-pd-recon-var-value,
        .pir-pd-recon-over .pir-pd-recon-var-sub { color: #c62828; }

        .pir-pd-actuals-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .pir-pd-actuals-th {
          padding: 10px 18px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-align: left;
          border-bottom: 1px solid #e6e9ee;
        }

        .pir-pd-actuals-th-amount {
          text-align: right;
        }

        .pir-pd-actuals-row td {
          padding: 11px 18px;
          border-bottom: 1px solid #f1f3f6;
          vertical-align: middle;
        }

        .pir-pd-actuals-row:hover td {
          background: #fbfcfe;
        }

        .pir-pd-actuals-month {
          color: #1D2C4D;
          font-weight: 600;
          white-space: nowrap;
        }

        .pir-pd-actuals-gl {
          color: #2f6fd0;
          font-size: 12px;
        }

        .pir-pd-actuals-desc {
          color: #001a3b;
        }

        .pir-pd-actuals-amount {
          text-align: right;
          color: #1ea761;
          font-weight: 700;
          white-space: nowrap;
        }

        .pir-pd-actuals-amount-neg {
          color: red;
        }

        .pir-pd-amount-neg {
          color: red;
        }

        .pir-pd-actuals-total-row .pir-pd-actuals-total-neg {
          color: red;
        }

        .pir-pd-actuals-adj-row td {
          background: #fafbfc;
        }

        .pir-pd-actuals-tag {
          display: inline-block;
          margin-left: 6px;
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .pir-pd-actuals-tag-dr {
          background: #e3f3ea;
          color: #1f7a44;
        }

        .pir-pd-actuals-tag-cr {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-actuals-total-row td {
          padding: 13px 18px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pir-pd-actuals-state {
          padding: 26px 18px;
          text-align: center;
          color: #687386;
          font-size: 13px;
        }

        .pir-pd-actuals-state-error {
          color: red;
        }

        /* ── Add Actuals Adjustment ──────────────────────────── */
        .pir-pd-adj {
          margin-top: 16px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          background: #ffffff;
          padding: 16px 18px 18px;
        }

        .pir-pd-adj-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--pir-heading);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }

        .pir-pd-adj-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 14px;
        }

        .pir-pd-adj-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 120px;
        }

        .pir-pd-adj-field-grow {
          flex: 1 1 240px;
        }

        .pir-pd-adj-field-amount {
          flex: 0 0 120px;
          min-width: 100px;
        }

        .pir-pd-adj-field-action {
          flex: 0 0 auto;
          min-width: 0;
        }

        .pir-pd-adj-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #8a93a3;
        }

        .pir-pd-adj-input {
          height: 38px;
          padding: 0 12px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 13px;
          outline: none;
        }

        .pir-pd-adj-input:focus {
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(29, 44, 77, 0.15);
        }

        .pir-pd-adj-button {
          height: 38px;
          padding: 0 18px;
          border: 0;
          border-radius: 8px;
          background: var(--pir-heading);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .pir-pd-adj-button:hover {
          background: #142038;
        }

        .pir-pd-adj-button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .pir-pd-adj-error {
          margin: 10px 16px 0;
          padding: 8px 12px;
          border-radius: 8px;
          background: #fdecea;
          border: 1px solid #f5c6cb;
          color: #b02a37;
          font-size: 12px;
          font-weight: 500;
        }

        /* ── Forecast section (reuses the actuals table) ─────────
           Headings, pills and totals come from the shared tokens, so only the
           value colours below differ from the actuals section. */
        .pir-pd-fc .pir-pd-actuals-month {
          color: #687386;
        }

        .pir-pd-fc .pir-pd-actuals-amount:not(.pir-pd-actuals-amount-neg) {
          color: var(--pir-heading);
        }

        @media (max-width: 720px) {
          .pir-pd-adj-field,
          .pir-pd-adj-field-grow,
          .pir-pd-adj-field-amount,
          .pir-pd-adj-field-action {
            flex: 1 1 100%;
          }
          .pir-pd-adj-button {
            width: 100%;
          }
        }

        /* ── Placeholder panels ──────────────────────────────── */
        .pir-pd-placeholder-panel {
          padding: 60px 20px;
          text-align: center;
          color: #687386;
          font-size: 15px;
          background: #ffffff;
          border: 1px dashed #d5dbe7;
          border-radius: 12px;
        }

        @media (max-width: 1100px) {
          .pir-pd-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .pir-pd-kpi-grid {
            grid-template-columns: 1fr;
          }
          .pir-pd-title-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
