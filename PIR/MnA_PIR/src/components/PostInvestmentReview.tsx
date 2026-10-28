import { useEffect, useRef, useState, type ReactElement } from "react";
import { getAppConfig } from "../config/app-config";
import { getPirDetail, type PirAdjustment, type PirDetailData } from "../api/pir-detail-api";
import { postPirAdjustment, savePirEditable } from "../api/pir-edit-api";
import { useRefreshToken } from "../lib/refresh-bus";
import {
  getPirOverview,
  savePirOverview,
  capturePirSnapshot,
  pirOverviewSaveFields,
  type PirOverviewSaveFields,
  type PirOverviewMilestone,
  type PirOverviewProposalInfo,
  type PirOverviewScoring,
  type PirCalendarEntry,
} from "../api/pir-overview-api";

/* ─────────────────────────────────────────────────────────────────────────
   Post-Investment Review (PIR) screens.

   Rebuilt from the Experian "Global Investment Solution" M&A authoring
   wireframe. Renders the branded chrome (gradient bar + header) and the PIR
   Overview screen: the report header, the "PIR Dashboard — Scoring Summary"
   table and the "PIR Calendar" milestone list. The 6-/12-month review panels
   (RAG cards + financial appendix tables) remain in the file for later use but
   are not surfaced while the Overview is the only active screen.

   Everything is static mock data — no API calls. All styles are scoped under
   `.pir-rv-root` so they never leak into the host APEX page or sibling
   components. API wiring can be layered on later by replacing the mock
   constants with fetched data.
   ───────────────────────────────────────────────────────────────────────── */

// ── Domain model ──────────────────────────────────────────────────────────
type PeriodKey = "overview" | "6m" | "12m" | "24m";
type Rag = "green" | "amber" | "red";

/** A single cell value. `null` renders as an em-dash. */
type Cell = string | null;

interface RagCardData {
  dimension: string;
  rating: Rag | "none";
  label: string;
  criteria: string;
}

interface FinRow {
  label: string;
  lineCode?: string;
  /** Totals/derived lines — never editable. */
  computed?: boolean;
  indent?: boolean;
  bold?: boolean;
  /** [actual, buy plan, variance] for the review period */
  cells: [Cell, Cell, Cell];
}

/** A line added by the reviewer via "+ Add Row" — POSTed as an adjustment. */
interface DraftRow {
  id: number;
  label: string;
  /** Cumulative Actual, in the table's display scale. The only value a new line takes. */
  actual: string;
  saving?: boolean;
  error?: string;
}

interface FinSection {
  title: string;
  code?: string;
  finEvalSectionId?: number;
  rows: FinRow[];
}

interface FinTableData {
  unit: string;
  rowHeader: string;
  group1: string;
  cols: [string, string, string];
  sections: FinSection[];
  fx: string;
  titleBar?: string;
  milestoneCode: string;
  fiscalYear: number;
  /** Display scale divisor — entered values are multiplied back by this. */
  divisor: number;
}

/** Sections whose Actual column is edited in place (PUT /editable) instead of via Add Row. */
const ACTUAL_EDIT_SECTIONS = new Set(["INVESTMENT", "INTEGRATION_SYNERGIES"]);

type ScoreStatus = "on-track" | "attention" | "at-risk" | "not-assessed";

interface PeriodScore {
  status: ScoreStatus;
  criteria: string;
}

interface ScoreRow {
  dimension: string;
  sixMonth: PeriodScore;
  twelveMonth: PeriodScore;
  twentyFourMonth: PeriodScore;
}

type MilestoneStatus = "completed" | "upcoming" | "future";

interface Milestone {
  code?: string;
  title: string;
  date: string;
  countdown?: string;
  description: string;
  status: MilestoneStatus;
}

// ── Scoring summary (mirrors the PIR dashboard table) ─────────────────────
const NOT_ASSESSED: PeriodScore = { status: "not-assessed", criteria: "Not assessed at this period" };

// Review sample data removed — the 6/12/24-month tabs render from the live PIR detail API.

const TABS: { key: PeriodKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "6m", label: "6-Month Review" },
  { key: "12m", label: "12-Month Review" },
  { key: "24m", label: "24-Month Review" },
];

// ── Icons ─────────────────────────────────────────────────────────────────
function DotIcon(): ReactElement {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="4" fill="currentColor" />
    </svg>
  );
}

function WarnIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function RiskIcon(): ReactElement {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3z" />
    </svg>
  );
}

function CalIcon(): ReactElement {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function DocIcon(): ReactElement {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CheckIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function BellIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function LockIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function RefreshIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function ChevronIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Shared pieces ──────────────────────────────────────────────────────────
function RagBadge({ rating, label }: { rating: Rag; label: string }): ReactElement {
  const icon = rating === "green" ? <DotIcon /> : rating === "amber" ? <WarnIcon /> : <RiskIcon />;
  return (
    <span className={`pir-rv-rag-badge pir-rv-rag-${rating}`}>
      <span className="pir-rv-rag-badge-icon">{icon}</span>
      {label}
    </span>
  );
}

type Currency = "EUR" | "USD";
type Scale = "K" | "M" | "B";

function OverallBadge({ rating, label }: { rating: Rag | "none"; label: string }): ReactElement {
  if (rating === "none") return <span className="pir-rv-ov-badge pir-rv-ov-none">— {label}</span>;
  const icon = rating === "green" ? <DotIcon /> : rating === "amber" ? <WarnIcon /> : <RiskIcon />;
  return <span className={`pir-rv-ov-badge pir-rv-ov-${rating}`}>{icon} {label}</span>;
}

function ReviewHeader({ title, subtitle, rating, label }: { title: string; subtitle: string; rating: Rag | "none"; label: string }): ReactElement {
  return (
    <section className="pir-rv-card pir-rv-rvhead">
      <div>
        <div className="pir-rv-rvhead-title">{title}</div>
        <div className="pir-rv-rvhead-sub">{subtitle}</div>
      </div>
      <OverallBadge rating={rating} label={label} />
    </section>
  );
}

function Toolbar({ currency, onCurrency, scale, onScale }: { currency: Currency; onCurrency: (c: Currency) => void; scale: Scale; onScale: (s: Scale) => void }): ReactElement {
  const scales: { value: Scale; label: string; title: string }[] = [
    { value: "K", label: "K", title: "Thousand" },
    { value: "M", label: "M", title: "Million" },
    { value: "B", label: "B", title: "Billion" },
  ];
  return (
    <section className="pir-rv-card pir-rv-toolbar">
      <span className="pir-rv-tb-label">CURRENCY</span>
      <div className="pir-rv-seg">
        <button type="button" className={currency === "EUR" ? "active" : ""} onClick={() => onCurrency("EUR")}>€ EUR</button>
        <button type="button" className={currency === "USD" ? "active" : ""} onClick={() => onCurrency("USD")}>$ USD</button>
      </div>
      <span className="pir-rv-tb-label">SCALE</span>
      <div className="pir-rv-seg">
        {scales.map((s) => (
          <button key={s.value} type="button" title={s.title} className={scale === s.value ? "active" : ""} onClick={() => onScale(s.value)}>{s.label}</button>
        ))}
      </div>
    </section>
  );
}

function RagCards({ cards }: { cards: RagCardData[] }): ReactElement {
  return (
    <div className="pir-rv-rag2-grid">
      {cards.map((c) => (
        <div key={c.dimension} className={`pir-rv-rag2-card ${c.rating === "none" ? "pir-rv-rag2-pending" : ""}`}>
          <div className="pir-rv-rag2-label">{c.dimension}</div>
          {c.rating === "none" ? <span className="pir-rv-rag2-dash">—</span> : <RagBadge rating={c.rating} label={c.label} />}
          <div className="pir-rv-rag2-crit">{c.criteria}</div>
        </div>
      ))}
    </div>
  );
}

function ColourKey(): ReactElement {
  return (
    <div className="pir-rv-colourkey">
      <span className="pir-rv-ck-label">COLOUR KEY</span>
      <span className="pir-rv-ck-item">
        <span className="pir-rv-ck-swatch pir-rv-ck-purple" /> <strong>Grey</strong> — Populated from Data Lake (Oracle)
      </span>
      <span className="pir-rv-ck-item">
        <span className="pir-rv-ck-swatch pir-rv-ck-blue" /> <strong>Blue</strong> — Populated from Financial Evaluation (GIS)
      </span>
    </div>
  );
}

/** Classifies a variance cell for sign-based colouring. */
function varianceClass(value: Cell): string {
  if (!value) return "pir-rv-fin-muted";
  return value.includes("(") ? "pir-rv-fin-neg" : "pir-rv-fin-pos";
}

/** Digits, one decimal point, parentheses/minus for negatives — nothing else. */
function sanitiseCell(raw: string): string {
  let s = raw.replace(/[^\d.()-]/g, "");
  const negative = s.includes("(") || s.startsWith("-");
  s = s.replace(/[()-]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = `${s.slice(0, dot + 1)}${s.slice(dot + 1).replace(/\./g, "")}`;
  return negative && s ? `(${s})` : s;
}

/** "1,234.5" / "(12.0)" → number in display units; null when blank or not a number. */
function parseCell(value: string | null | undefined): number | null {
  const s = (value ?? "").replace(/,/g, "").trim();
  if (!s) return null;
  const negative = s.startsWith("(") || s.startsWith("-");
  const n = Number(s.replace(/[()-]/g, ""));
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Display-scale value → raw amount the API stores (undoes the '000 / '000000 scaling). */
function toRawAmount(n: number, divisor: number): number {
  return Math.round(n * divisor * 100) / 100;
}

/** Success-message state that clears itself 5 seconds after being set. */
function useAutoClearMessage(): [string | null, (msg: string | null) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 5000);
    return () => window.clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}

// Saves trigger notifyDataChanged in the API layer, so the panel re-fetches on its own.
function FinancialTable({ data, compact = false }: { data: FinTableData; compact?: boolean }): ReactElement {
  const cellWidth = compact ? "58px" : "70px";
  const labelWidth = compact ? "150px" : "180px";

  // Reviewer-added lines, keyed by section title, until they're POSTed.
  const [drafts, setDrafts] = useState<Record<string, DraftRow[]>>({});
  const seq = useRef(0);

  // In-place Actual edits on Investment / Integration & Synergies, keyed `${section}::${line}`.
  const [actualEdits, setActualEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useAutoClearMessage();
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const addRow =(sectionTitle: string): void => {
    seq.current += 1;
    const id = seq.current;
    setDrafts((prev) => ({
      ...prev,
      [sectionTitle]: [...(prev[sectionTitle] ?? []), { id, label: "", actual: "" }],
    }));
  };

  const updateDraft = (sectionTitle: string, id: number, patch: Partial<DraftRow>): void => {
    setDrafts((prev) => ({
      ...prev,
      [sectionTitle]: (prev[sectionTitle] ?? []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  };

  const removeDraft = (sectionTitle: string, id: number): void => {
    setDrafts((prev) => ({
      ...prev,
      [sectionTitle]: (prev[sectionTitle] ?? []).filter((d) => d.id !== id),
    }));
  };

  // New lines with both a name and an Actual value — the ones Save will POST.
  const readyDrafts = data.sections.flatMap((section) =>
    (drafts[section.title] ?? [])
      .filter((d) => d.label.trim() !== "" && parseCell(d.actual) != null)
      .map((draft) => ({ section, draft })),
  );

  const editKey = (section: FinSection, row: FinRow): string => `${section.code}::${row.lineCode}`;

  // Only edits that actually changed the value are sent.
  const changedLines = data.sections.flatMap((section) =>
    section.rows.flatMap((row) => {
      const edited = actualEdits[editKey(section, row)];
      if (edited === undefined || !section.code || !row.lineCode) return [];
      const next = parseCell(edited);
      if (next === parseCell(row.cells[0])) return [];
      return [{
        section_code: section.code,
        line_code: row.lineCode,
        period_key: "cumulative" as const,
        actual_amount: next == null ? 0 : toRawAmount(next, data.divisor),
      }];
    }),
  );

  const hasChanges = changedLines.length > 0 || readyDrafts.length > 0;

  /**
   * One Save for the whole table: PUT the edited Actuals (Investment /
   * Integration & Synergies), then POST each completed new line. A line that
   * fails stays on screen with its error; the rest are cleared.
   */
  const save = async (): Promise<void> => {
    if (!hasChanges) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    const failures: string[] = [];
    const cfg = getAppConfig();

    if (changedLines.length > 0) {
      try {
        await savePirEditable(cfg, { milestoneCode: data.milestoneCode, lines: changedLines });
        setActualEdits({});
      } catch (e) {
        failures.push(e instanceof Error ? e.message : String(e));
      }
    }

    for (const { section, draft } of readyDrafts) {
      if (section.finEvalSectionId == null) {
        const msg = "This section has no fin_eval_section_id — can't save.";
        updateDraft(section.title, draft.id, { error: msg });
        failures.push(msg);
        continue;
      }
      updateDraft(section.title, draft.id, { saving: true, error: undefined });
      try {
        await postPirAdjustment(cfg, {
          fin_eval_section_id: section.finEvalSectionId,
          description: draft.label.trim(),
          amount: toRawAmount(parseCell(draft.actual) as number, data.divisor),
          fiscal_year: data.fiscalYear,
        });
        removeDraft(section.title, draft.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        updateDraft(section.title, draft.id, { saving: false, error: msg });
        failures.push(msg);
      }
    }

    if (failures.length > 0) setSaveErr(failures.join("\n"));
    else setSaveMsg("Saved");
    setSaving(false);
  };

  return (
    <section className={`pir-rv-fin-card ${compact ? "pir-rv-fin-compact" : ""}`}>
      <div className="pir-rv-fin-titlebar">
        <span>{data.titleBar}</span>
        <div className="pir-rv-save-wrap">
          {saveMsg && <span className="pir-rv-save-ok">{saveMsg}</span>}
          {saveErr && <span className="pir-rv-save-err" title={saveErr}>Save failed</span>}
          <button
            type="button"
            className="pir-rv-save-btn"
            onClick={save}
            disabled={saving || !hasChanges}
            title={hasChanges ? "Save edited values and new lines" : "No changes to save"}
            aria-label="Save changes"
          >
            <SaveIcon /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="pir-rv-fin-scroll">
        <table className="pir-rv-fin-table">
          <colgroup>
            <col style={{ width: labelWidth, minWidth: compact ? "130px" : "150px" }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <col key={i} style={{ width: cellWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="pir-rv-fin-unit">{data.unit}</th>
              <th colSpan={3} className="pir-rv-fin-group">{data.group1}</th>
            </tr>
            <tr>
              <th className="pir-rv-fin-rowhdr">{data.rowHeader}</th>
              {data.cols.map((c, i) => (
                <th key={i} className="pir-rv-fin-colhdr">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sections.map((section) => (
              <SectionBlock
                key={section.title}
                section={section}
                actualEditable={!!section.code && ACTUAL_EDIT_SECTIONS.has(section.code)}
                actualValue={(row) => actualEdits[editKey(section, row)]}
                onActualChange={(row, value) => {
                  setSaveMsg(null);
                  setActualEdits((p) => ({ ...p, [editKey(section, row)]: value }));
                }}
                drafts={drafts[section.title] ?? []}
                onAdd={() => { setSaveMsg(null); addRow(section.title); }}
                onUpdate={(id, patch) => { setSaveMsg(null); updateDraft(section.title, id, patch); }}
                onRemove={(id) => removeDraft(section.title, id)}
              />
            ))}
            <tr>
              <td colSpan={4} className="pir-rv-fin-fx">FX Rate: <strong>{data.fx}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionBlock({
  section,
  actualEditable,
  actualValue,
  onActualChange,
  drafts,
  onAdd,
  onUpdate,
  onRemove,
}: {
  section: FinSection;
  /** Investment / Integration & Synergies: Actual edited in place, no Add Row. */
  actualEditable: boolean;
  actualValue: (row: FinRow) => string | undefined;
  onActualChange: (row: FinRow, value: string) => void;
  drafts: DraftRow[];
  onAdd: () => void;
  onUpdate: (id: number, patch: Partial<DraftRow>) => void;
  onRemove: (id: number) => void;
}): ReactElement {
  return (
    <>
      <tr>
        <td colSpan={4} className="pir-rv-fin-sec">{section.title}</td>
      </tr>
      {section.rows.map((row) => (
        <FinRowCells
          key={row.lineCode ?? row.label}
          row={row}
          actualEditable={actualEditable && !row.computed && !!row.lineCode}
          actualValue={actualValue(row)}
          onActualChange={(v) => onActualChange(row, v)}
        />
      ))}
      {!actualEditable && (
        <>
          {drafts.map((draft) => (
            <DraftRowCells
              key={draft.id}
              draft={draft}
              onUpdate={(patch) => onUpdate(draft.id, patch)}
              onRemove={() => onRemove(draft.id)}
            />
          ))}
          <tr>
            <td colSpan={4} className="pir-rv-fin-addrow">
              <button type="button" onClick={onAdd}>+ Add Row</button>
            </td>
          </tr>
        </>
      )}
    </>
  );
}

function FinRowCells({
  row,
  actualEditable,
  actualValue,
  onActualChange,
}: {
  row: FinRow;
  actualEditable: boolean;
  actualValue: string | undefined;
  onActualChange: (value: string) => void;
}): ReactElement {
  const labelCls = [
    "pir-rv-fin-label",
    row.indent ? "pir-rv-fin-indent" : "",
    row.bold ? "pir-rv-fin-bold" : "",
  ].join(" ").trim();

  return (
    <tr>
      <td className={labelCls}>{row.label}</td>
      {row.cells.map((c, i) => {
        const colType = i === 0 ? "pir-rv-fin-act" : i === 1 ? "pir-rv-fin-plan" : "pir-rv-fin-var";
        const isVar = i === 2;
        const cls = ["pir-rv-fin-cell", colType, isVar ? varianceClass(c) : ""].join(" ").trim();
        if (i === 0 && actualEditable) {
          return (
            <td key={i} className={cls}>
              <input
                className="pir-rv-fin-input"
                value={actualValue ?? (c ?? "").replace(/,/g, "")}
                onChange={(e) => onActualChange(sanitiseCell(e.target.value))}
                placeholder="—"
                inputMode="decimal"
                aria-label={`${row.label} actual`}
              />
            </td>
          );
        }
        return <td key={i} className={cls}>{c ?? "—"}</td>;
      })}
    </tr>
  );
}

function DraftRowCells({
  draft,
  onUpdate,
  onRemove,
}: {
  draft: DraftRow;
  onUpdate: (patch: Partial<DraftRow>) => void;
  onRemove: () => void;
}): ReactElement {
  const named = draft.label.trim() !== "";
  return (
    <tr className="pir-rv-fin-draft">
      <td className="pir-rv-fin-label">
        <div className="pir-rv-fin-draft-label">
          <input
            className="pir-rv-fin-input pir-rv-fin-name-input"
            value={draft.label}
            onChange={(e) => onUpdate({ label: e.target.value.replace(/^\s+/, ""), error: undefined })}
            placeholder="New line item…"
            aria-label="New line item name"
            disabled={draft.saving}
            autoFocus
          />
          <button
            type="button"
            className="pir-rv-fin-draft-remove"
            onClick={onRemove}
            disabled={draft.saving}
            title="Remove this line"
            aria-label="Remove new line"
          >
            ✕
          </button>
        </div>
        {draft.error && <div className="pir-rv-fin-draft-err" title={draft.error}>{draft.error}</div>}
      </td>
      {/* Only the cumulative Actual is captured for a new line — the rest are locked. */}
      <td className="pir-rv-fin-cell pir-rv-fin-act">
        <input
          className="pir-rv-fin-input"
          value={draft.actual}
          onChange={(e) => onUpdate({ actual: sanitiseCell(e.target.value), error: undefined })}
          disabled={!named || draft.saving}
          title={!named ? "Name the line to enable this field" : undefined}
          placeholder={named ? "—" : ""}
          inputMode="decimal"
          aria-label="New line actual value"
        />
      </td>
      {[1, 2].map((i) => {
        const colType = i === 1 ? "pir-rv-fin-plan" : "pir-rv-fin-var";
        const cls = ["pir-rv-fin-cell", colType, "pir-rv-fin-locked"].join(" ").trim();
        return <td key={i} className={cls} title="Not editable for a new line">—</td>;
      })}
    </tr>
  );
}

// ── PIR report header card ─────────────────────────────────────────────────
function ReportHeader({
  code,
  subtitle,
  completion,
  overallRating,
  overallLabel,
  overallPeriod,
}: {
  code: string;
  subtitle: string;
  completion: string;
  overallRating: Rag | "none";
  overallLabel: string;
  overallPeriod: string;
}): ReactElement {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshErr, setRefreshErr] = useState<string | null>(null);

  // POST /PIR/snapshot; on success the refresh bus re-runs the overview GET.
  const refresh = async (): Promise<void> => {
    setRefreshing(true);
    setRefreshErr(null);
    try {
      await capturePirSnapshot(getAppConfig());
    } catch (e) {
      setRefreshErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="pir-rv-card pir-rv-report-head">
      <div className="pir-rv-report-top">
        <div>
          <div className="pir-rv-report-eyebrow">PIR REPORT — {code}</div>
          <h1 className="pir-rv-report-title">Post-Investment Review</h1>
          <div className="pir-rv-report-sub">{subtitle}</div>
        </div>
        <div className="pir-rv-report-status">
          <div className="pir-rv-report-status-label">OVERALL STATUS{overallPeriod ? ` · ${overallPeriod}` : ""}</div>
          <div className="pir-rv-report-status-row">
            <OverallBadge rating={overallRating} label={overallLabel} />
            <button
              type="button"
              className={`pir-rv-refresh-btn ${refreshing ? "pir-rv-refresh-spin" : ""}`}
              onClick={refresh}
              disabled={refreshing}
              title={refreshing ? "Refreshing…" : "Refresh snapshot"}
              aria-label="Refresh snapshot"
            >
              <RefreshIcon />
            </button>
          </div>
          {refreshErr && <div className="pir-rv-refresh-err" title={refreshErr}>Refresh failed: {refreshErr}</div>}
        </div>
      </div>

      <div className="pir-rv-meta-row">
        <div className="pir-rv-meta-item">
          <span className="pir-rv-meta-label">Completion:</span>
          <span className="pir-rv-meta-value">{completion}</span>
        </div>
      </div>
    </section>
  );
}

// ── Overview: scoring summary table ────────────────────────────────────────
function StatusPill({ status }: { status: ScoreStatus }): ReactElement {
  if (status === "not-assessed") return <span className="pir-rv-dash" />;
  const map: Record<Exclude<ScoreStatus, "not-assessed">, { label: string; icon: ReactElement }> = {
    "on-track": { label: "On Track", icon: <DotIcon /> },
    attention: { label: "Needs Attention", icon: <WarnIcon /> },
    "at-risk": { label: "At Risk", icon: <RiskIcon /> },
  };
  const { label, icon } = map[status];
  return (
    <span className={`pir-rv-pill pir-rv-pill-${status}`}>
      <span className="pir-rv-pill-icon">{icon}</span>
      {label}
    </span>
  );
}

function CriteriaCell({ score }: { score: PeriodScore }): ReactElement {
  // Mute only the "not assessed" placeholder — real commentary (e.g. evidence,
  // risk) shows normally even though it carries no RAG pill.
  const muted = score.criteria === NOT_ASSESSED.criteria;
  return (
    <span className={`pir-rv-criteria ${muted ? "pir-rv-criteria-muted" : ""}`}>
      {score.criteria}
    </span>
  );
}

// Dimensions the reviewer can edit (status dropdown + free-text criteria).
const EDITABLE_DIMENSIONS = new Set(["Evidence of Benefits", "Risk"]);

// Maps an editable dimension to its PUT /PIR/overview payload fields.
const DIM_FIELDS: Record<string, { statusKey?: string; criteriaKey: string }> = {
  "Evidence of Benefits": { statusKey: "evidence_of_benefits_status", criteriaKey: "evidence_of_benefits" },
  "Risk": { statusKey: "risk_status", criteriaKey: "risk" },
};

const STATUS_OPTIONS: { value: string; score: ScoreStatus; label: string }[] = [
  { value: "ON_TRACK", score: "on-track", label: "On Track" },
  { value: "NEEDS_ATTENTION", score: "attention", label: "Needs Attention" },
  { value: "AT_RISK", score: "at-risk", label: "At Risk" },
];

type PeriodField = "sixMonth" | "twelveMonth" | "twentyFourMonth";

const PERIOD_MILESTONE: Record<PeriodField, string> = {
  sixMonth: "6M",
  twelveMonth: "12M",
  twentyFourMonth: "24M",
};

function StatusIcon({ status }: { status: ScoreStatus }): ReactElement | null {
  if (status === "on-track") return <DotIcon />;
  if (status === "attention") return <WarnIcon />;
  if (status === "at-risk") return <RiskIcon />;
  return null;
}

function StatusDropdown({ value, onChange }: { value: ScoreStatus; onChange: (s: ScoreStatus) => void }): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = STATUS_OPTIONS.find((o) => o.score === value);
  const choose = (s: ScoreStatus): void => {
    onChange(s);
    setOpen(false);
  };

  return (
    <div className="pir-rv-dd" ref={ref}>
      <button
        type="button"
        className={`pir-rv-dd-btn pir-rv-dd-${value}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Set status"
      >
        <span className="pir-rv-dd-current">
          {current && <><StatusIcon status={value} /> {current.label}</>}
        </span>
        <ChevronIcon />
      </button>
      {open && (
        <ul className="pir-rv-dd-menu" role="listbox">
          <li>
            <button type="button" className="pir-rv-dd-opt pir-rv-dd-opt-clear" onClick={() => choose("not-assessed")}>Clear</button>
          </li>
          {STATUS_OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={`pir-rv-dd-opt pir-rv-dd-${o.score}`}
                onClick={() => choose(o.score)}
                role="option"
                aria-selected={o.score === value}
              >
                <StatusIcon status={o.score} /> {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SaveIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

type NarrativeField = "executive_summary" | "lessons_learned";

/**
 * All reviewer edits on the Overview screen — scoring-table cells plus each
 * milestone's summary / lessons learned. One save sends a single
 * PUT /PIR/overview per edited milestone carrying every field.
 */
function useOverviewEdits(milestones: PirOverviewMilestone[]) {
  // Scoring edits, keyed `${dimension}::${period}`.
  const [statusEdits, setStatusEdits] = useState<Record<string, ScoreStatus>>({});
  const [textEdits, setTextEdits] = useState<Record<string, string>>({});
  // Narrative edits, keyed by milestone code.
  const [narrativeEdits, setNarrativeEdits] = useState<Record<string, Partial<Record<NarrativeField, string>>>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useAutoClearMessage();
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const hasEdits =
    Object.keys(statusEdits).length > 0 || Object.keys(textEdits).length > 0 || Object.keys(narrativeEdits).length > 0;

  const narrativeOf = (code: string, field: NarrativeField): string =>
    narrativeEdits[code]?.[field] ?? pirOverviewSaveFields(milestones.find((m) => m.milestone_code === code))[field] ?? "";
  const setNarrative = (code: string, field: NarrativeField, value: string): void =>
    setNarrativeEdits((p) => ({ ...p, [code]: { ...p[code], [field]: value } }));

  const save = async (): Promise<void> => {
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const cfg = getAppConfig();
      // One full payload per edited milestone: its current values with the edits on top.
      const byMilestone = new Map<string, PirOverviewSaveFields>();
      const fieldsFor = (ms: string): Record<string, string | null> => {
        const f = byMilestone.get(ms) ?? pirOverviewSaveFields(milestones.find((m) => m.milestone_code === ms));
        byMilestone.set(ms, f);
        return f;
      };
      for (const [k, score] of Object.entries(statusEdits)) {
        const [dimension, period] = k.split("::") as [string, PeriodField];
        const statusKey = DIM_FIELDS[dimension]?.statusKey;
        const ms = PERIOD_MILESTONE[period];
        if (!statusKey || !ms) continue;
        fieldsFor(ms)[statusKey] = STATUS_OPTIONS.find((o) => o.score === score)?.value ?? null;
      }
      for (const [k, value] of Object.entries(textEdits)) {
        const [dimension, period] = k.split("::") as [string, PeriodField];
        const criteriaKey = DIM_FIELDS[dimension]?.criteriaKey;
        const ms = PERIOD_MILESTONE[period];
        if (!criteriaKey || !ms) continue;
        fieldsFor(ms)[criteriaKey] = value;
      }
      for (const [ms, edits] of Object.entries(narrativeEdits)) {
        Object.assign(fieldsFor(ms), edits);
      }
      for (const [milestoneCode, fields] of byMilestone) {
        await savePirOverview(cfg, { milestoneCode, fields });
      }
      // The PUT triggers a global refresh, so the saved values come back from the GET.
      setStatusEdits({});
      setTextEdits({});
      setNarrativeEdits({});
      setSaveMsg("Saved");
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return {
    statusEdits, setStatusEdits, textEdits, setTextEdits,
    narrativeOf, setNarrative,
    hasEdits, saving, saveMsg, saveErr, save,
  };
}

type OverviewEdits = ReturnType<typeof useOverviewEdits>;

function SaveButton({ edits, title }: { edits: OverviewEdits; title: string }): ReactElement {
  return (
    <div className="pir-rv-save-wrap">
      {edits.saveMsg && <span className="pir-rv-save-ok">{edits.saveMsg}</span>}
      {edits.saveErr && <span className="pir-rv-save-err" title={edits.saveErr}>Save failed</span>}
      <button
        type="button"
        className="pir-rv-save-btn"
        onClick={edits.save}
        disabled={edits.saving || !edits.hasEdits}
        title={title}
        aria-label={title}
      >
        <SaveIcon /> {edits.saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function ScoringSummary({ rows, edits }: { rows: ScoreRow[]; edits: OverviewEdits }): ReactElement {
  const { statusEdits, setStatusEdits, textEdits, setTextEdits } = edits;
  const keyOf = (dimension: string, period: PeriodField): string => `${dimension}::${period}`;
  const initialText = (score: PeriodScore): string => (score.criteria === NOT_ASSESSED.criteria ? "" : score.criteria);
  const statusOf = (row: ScoreRow, period: PeriodField): ScoreStatus => statusEdits[keyOf(row.dimension, period)] ?? row[period].status;
  const textOf = (row: ScoreRow, period: PeriodField): string => textEdits[keyOf(row.dimension, period)] ?? initialText(row[period]);

  const renderPeriod = (row: ScoreRow, period: PeriodField, statusCls: string, criteriaCls: string): ReactElement => {
    const editable = EDITABLE_DIMENSIONS.has(row.dimension);
    const score = row[period];
    const text = textOf(row, period);
    return (
      <>
        <td className={statusCls}>
          {editable ? (
            <StatusDropdown value={statusOf(row, period)} onChange={(s) => setStatusEdits((p) => ({ ...p, [keyOf(row.dimension, period)]: s }))} />
          ) : (
            <StatusPill status={score.status} />
          )}
        </td>
        <td className={criteriaCls}>
          {editable ? (
            <input
              className="pir-rv-criteria-input"
              value={text}
              title={text.length > 40 ? text : undefined}
              onChange={(e) => setTextEdits((p) => ({ ...p, [keyOf(row.dimension, period)]: e.target.value }))}
              placeholder="Enter details…"
              aria-label={`${row.dimension} ${period} criteria`}
            />
          ) : (
            <CriteriaCell score={score} />
          )}
        </td>
      </>
    );
  };

  return (
    <section className="pir-rv-card pir-rv-table-card">
      <div className="pir-rv-card-head pir-rv-card-head-row">
        <span>PIR DASHBOARD — SCORING SUMMARY</span>
        <SaveButton edits={edits} title="Save changes" />
      </div>
      <div className="pir-rv-table-scroll">
        <table className="pir-rv-table">
          <thead>
            <tr>
              <th className="pir-rv-th-dim">DIMENSION</th>
              <th>6-MONTH</th>
              <th className="pir-rv-th-crit">CRITERIA MET</th>
              <th className="pir-rv-col-active pir-rv-col-border-l">12-MONTH</th>
              <th className="pir-rv-th-crit pir-rv-col-active pir-rv-col-border-r">CRITERIA MET</th>
              <th>24-MONTH</th>
              <th className="pir-rv-th-crit">CRITERIA MET</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dimension}>
                <td className="pir-rv-td-dim">{row.dimension}</td>
                {renderPeriod(row, "sixMonth", "", "")}
                {renderPeriod(row, "twelveMonth", "pir-rv-col-active pir-rv-col-border-l", "pir-rv-col-active pir-rv-col-border-r")}
                {renderPeriod(row, "twentyFourMonth", "", "")}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Overview: PIR calendar ─────────────────────────────────────────────────
const MS_CONFIG: Record<MilestoneStatus, { pill: string; icon: ReactElement; btnClass: string; disabled: boolean }> = {
  completed: { pill: "Completed", icon: <CheckIcon />, btnClass: "pir-rv-ms-btn", disabled: false },
  upcoming: { pill: "Upcoming", icon: <BellIcon />, btnClass: "pir-rv-ms-btn pir-rv-ms-btn-primary", disabled: false },
  future: { pill: "Future", icon: <LockIcon />, btnClass: "pir-rv-ms-btn pir-rv-ms-btn-disabled", disabled: true },
};

function MilestoneRow({ milestone, edits }: { milestone: Milestone; edits: OverviewEdits }): ReactElement {
  const cfg = MS_CONFIG[milestone.status];
  const [expanded, setExpanded] = useState(false);
  const code = milestone.code;
  const summary = code ? edits.narrativeOf(code, "executive_summary") : "";
  const lessons = code ? edits.narrativeOf(code, "lessons_learned") : "";

  // Future milestones aren't captured yet — expansion stays locked.
  const expandable = milestone.status !== "future";
  const isOpen = expandable && expanded;

  return (
    <div className={`pir-rv-ms-wrap pir-rv-ms-${milestone.status} ${isOpen ? "pir-rv-ms-open" : ""}`}>
      <div className="pir-rv-ms">
        <div className="pir-rv-ms-main">
          <div className="pir-rv-ms-title">{milestone.title}</div>
          <div className="pir-rv-ms-date">
            <CalIcon /> {milestone.date}
            {milestone.countdown && (
              <span className="pir-rv-ms-countdown"><ClockIcon /> {milestone.countdown}</span>
            )}
          </div>
          <div className="pir-rv-ms-desc">{milestone.description}</div>
        </div>
        <div className="pir-rv-ms-actions">
          <button type="button" className={cfg.btnClass} disabled={cfg.disabled}>
            <DocIcon /> Review Outcome
          </button>
          <span className={`pir-rv-ms-pill pir-rv-ms-pill-${milestone.status}`}>{cfg.icon} {cfg.pill}</span>
          <button
            type="button"
            className={`pir-rv-ms-chevron ${isOpen ? "pir-rv-ms-chevron-open" : ""}`}
            onClick={() => setExpanded((e) => !e)}
            disabled={!expandable}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="pir-rv-ms-detail">
          <div className="pir-rv-ms-grid2">
            <section className="pir-rv-panel">
              <div className="pir-rv-panel-head">SUMMARY</div>
              <div className="pir-rv-panel-body">
                <textarea
                  className="pir-rv-ta"
                  value={summary}
                  onChange={(e) => code && edits.setNarrative(code, "executive_summary", e.target.value)}
                  placeholder="Enter summary…"
                  aria-label={`${milestone.title} summary`}
                />
              </div>
            </section>
            <section className="pir-rv-panel">
              <div className="pir-rv-panel-head">LESSONS LEARNED</div>
              <div className="pir-rv-panel-body">
                <textarea
                  className="pir-rv-ta"
                  value={lessons}
                  onChange={(e) => code && edits.setNarrative(code, "lessons_learned", e.target.value)}
                  placeholder="Enter lessons learned…"
                  aria-label={`${milestone.title} lessons learned`}
                />
              </div>
            </section>
          </div>
          <SaveButton edits={edits} title={`Save ${milestone.title} summary and lessons learned`} />
        </div>
      )}
    </div>
  );
}

function PirCalendar({ milestones, edits }: { milestones: Milestone[]; edits: OverviewEdits }): ReactElement {
  return (
    <section className="pir-rv-card">
      <div className="pir-rv-cal2-head">
        <span className="pir-rv-cal2-ico"><CalIcon /></span>
        <div>
          <div className="pir-rv-cal2-title">PIR CALENDAR</div>
          <div className="pir-rv-cal2-sub">Upcoming review milestones and reminders</div>
        </div>
      </div>
      {milestones.map((m) => (
        <MilestoneRow key={m.title} milestone={m} edits={edits} />
      ))}
    </section>
  );
}

// ── Period panels ──────────────────────────────────────────────────────────
/** Maps an API status string to the scoring-table status. */
function statusToScore(status?: string | null): ScoreStatus {
  if (!status) return "not-assessed";
  const s = status.toLowerCase();
  if (s.includes("track") || s.includes("on plan")) return "on-track";
  if (s.includes("risk")) return "at-risk";
  return "attention";
}

function scoreToRag(s: ScoreStatus): Rag {
  return s === "on-track" ? "green" : s === "at-risk" ? "red" : "amber";
}

/** "NEEDS_ATTENTION" → "Needs Attention". */
function humanizeStatus(raw?: string | null): string {
  if (!raw) return "";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The scoring-summary dimensions, in display order, mapped to their payload keys. */
const SCORE_DIMENSIONS: { label: string; statusKey?: keyof PirOverviewScoring; criteriaKey: keyof PirOverviewScoring }[] = [
  { label: "Overall", statusKey: "overall_status", criteriaKey: "overall_criteria" },
  { label: "Integration", statusKey: "integration_status", criteriaKey: "integration_criteria" },
  { label: "Revenue to Date", statusKey: "revenue_to_date_status", criteriaKey: "revenue_to_date_criteria" },
  { label: "EBIT to Date", statusKey: "ebit_to_date_status", criteriaKey: "ebit_to_date_criteria" },
  { label: "Revenue Forecast", statusKey: "revenue_forecast_status", criteriaKey: "revenue_forecast_criteria" },
  { label: "EBIT Forecast", statusKey: "ebit_forecast_status", criteriaKey: "ebit_forecast_criteria" },
  { label: "Evidence of Benefits", statusKey: "evidence_of_benefits_status", criteriaKey: "evidence_of_benefits" },
  { label: "Risk", statusKey: "risk_status", criteriaKey: "risk" },
];

/** Resolves one dimension's cell for a milestone's scoring block. */
function scoreCell(scoring: PirOverviewScoring | undefined, dim: typeof SCORE_DIMENSIONS[number]): PeriodScore {
  if (!scoring) return NOT_ASSESSED;
  const text = scoring[dim.criteriaKey];
  // Text-only dimensions (evidence, risk) carry commentary but no RAG pill.
  if (!dim.statusKey) {
    return text ? { status: "not-assessed", criteria: text } : NOT_ASSESSED;
  }
  const status = statusToScore(scoring[dim.statusKey]);
  // Keep commentary saved without a status (editable dimensions allow that).
  if (status === "not-assessed") return text ? { status, criteria: text } : NOT_ASSESSED;
  return { status, criteria: text || humanizeStatus(scoring[dim.statusKey]) };
}

/** Builds the scoring-summary rows by aligning each milestone's scoring block. */
function buildOverviewScoreRows(milestones: PirOverviewMilestone[]): ScoreRow[] {
  const byCode = new Map(milestones.map((m) => [m.milestone_code, m.scoring]));
  const s6 = byCode.get("6M"), s12 = byCode.get("12M"), s24 = byCode.get("24M");
  return SCORE_DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    sixMonth: scoreCell(s6, dim),
    twelveMonth: scoreCell(s12, dim),
    twentyFourMonth: scoreCell(s24, dim),
  }));
}

/** Overall RAG for the header — the latest assessed milestone wins (12M → 6M → 24M). */
function overviewOverall(milestones: PirOverviewMilestone[]): { rating: Rag | "none"; label: string; period: string } {
  const byCode = new Map(milestones.map((m) => [m.milestone_code, m]));
  const chosen = ["12M", "6M", "24M"].map((c) => byCode.get(c)).find((m) => m?.scoring.overall_status);
  if (!chosen?.scoring.overall_status) return { rating: "none", label: "Not yet assessed", period: "" };
  return {
    rating: scoreToRag(statusToScore(chosen.scoring.overall_status)),
    label: humanizeStatus(chosen.scoring.overall_status),
    period: chosen.milestone_label.replace(/\s*Review$/i, ""),
  };
}

const CAL_DESCRIPTION: Record<string, string> = {
  "6M": "Mid-year assessment — review benefit realisation progress, confirm PIR forecast adjustments, update risk register",
  "12M": "Full-year review — complete FY actuals reconciliation, executive summary sign-off, lessons learned capture",
  "24M": "Two-year investment review — cumulative actuals reconciliation, benefit realisation measurement, forecast re-baseline",
};

function toCalendarMilestone(e: PirCalendarEntry): Milestone {
  const s = e.status.toLowerCase();
  const status: MilestoneStatus = s === "completed" ? "completed" : s === "upcoming" ? "upcoming" : "future";
  return {
    code: e.milestone_code,
    title: /pir/i.test(e.label) ? e.label : e.label.replace(/\s*Review$/i, " PIR Review"),
    date: e.date,
    description: CAL_DESCRIPTION[e.milestone_code] ?? "Scheduled post-implementation review milestone.",
    status,
  };
}

function OverviewPanel(): ReactElement {
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [overall, setOverall] = useState<{ rating: Rag | "none"; label: string; period: string }>({ rating: "none", label: "Not yet assessed", period: "" });
  const [info, setInfo] = useState<PirOverviewProposalInfo | null>(null);
  const [calendar, setCalendar] = useState<Milestone[]>([]);
  const [milestones, setMilestones] = useState<PirOverviewMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const edits = useOverviewEdits(milestones);
  // Changes after any successful PUT/POST anywhere — re-runs the GET below.
  const refreshToken = useRefreshToken();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPirOverview(getAppConfig())
      .then((d) => {
        if (cancelled) return;
        setInfo(d.proposal_info);
        setMilestones(d.milestones);
        setRows(buildOverviewScoreRows(d.milestones));
        setOverall(overviewOverall(d.milestones));
        setCalendar(d.pir_calendar.map(toCalendarMilestone));
      })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : String(e)); setRows(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshToken]);

  return (
    <>
      <ReportHeader
        code={info?.proposal_code ?? "—"}
        subtitle={info?.proposal_title ?? ""}
        completion={info?.completion_date ?? "—"}
        overallRating={overall.rating}
        overallLabel={overall.label}
        overallPeriod={overall.period}
      />
      {loading && <div className="pir-rv-card pir-rv-note">Loading review scores…</div>}
      {error && <div className="pir-rv-card pir-rv-note pir-rv-note-error">Couldn’t load review scores. ({error})</div>}
      {rows && <ScoringSummary rows={rows} edits={edits} />}
      {calendar.length > 0 && <PirCalendar milestones={calendar} edits={edits} />}
    </>
  );
}

// ── Review panels (live PIR detail API) ────────────────────────────────────
const SCALE_DIVISOR: Record<Scale, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
/** Decimal places shown at each scale (keyed by divisor): Thousand 0, Million 1, Billion 2. */
const SCALE_DECIMALS: Record<number, number> = { 1_000: 0, 1_000_000: 1, 1_000_000_000: 2 };
const SCALE_NAME: Record<Scale, string> = { K: "Thousands", M: "Millions", B: "Billions" };
const INDENT_CODES = new Set(["EXCL_GS_COST_ALLOCATION", "TECHNOLOGY", "INFOSEC", "OTHER_INTEGRATION"]);
const KPI_ORDER = ["OVERALL", "INTEGRATION", "REVENUE_TO_DATE", "REVENUE_FORECAST", "EBIT_TO_DATE", "EBIT_FORECAST", "EVIDENCE_OF_BENEFITS", "RISK"];
const GROUP_LABELS: Record<string, string> = {
  "6M": "Months 1–6 Post-Acquisition",
  "12M": "Year 1 Post-Acquisition",
  "24M": "Year 2 Post-Acquisition",
};

function statusToRag(status: string): Rag {
  const s = status.toLowerCase();
  if (s.includes("track") || s.includes("on plan")) return "green";
  if (s.includes("risk")) return "red";
  return "amber";
}

/** Scales a raw value, formats to the scale's decimals, wraps negatives in parentheses. */
function fmtCell(value: number | null | undefined, isVariance: boolean, divisor: number): Cell {
  if (value == null) return null;
  const n = value / divisor;
  if (isVariance && n === 0) return null;
  const dp = SCALE_DECIMALS[divisor] ?? 1;
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return n < 0 ? `(${s})` : s;
}

function kpisToCards(kpis: PirDetailData["kpi_summary"]): RagCardData[] {
  const order = (code: string) => {
    const i = KPI_ORDER.indexOf(code);
    return i === -1 ? KPI_ORDER.length : i;
  };
  return [...kpis]
    .sort((a, b) => order(a.kpi_code) - order(b.kpi_code))
    .map((k) => ({
      dimension: k.kpi_label,
      rating: statusToRag(k.status),
      label: k.status,
      criteria: k.variance_pct != null ? `Variance: ${k.variance_pct}%` : k.status,
    }));
}

/**
 * Reviewer-added lines from the section's `adjustments` array. The amount lands
 * in Actual or Buy Plan by scenario; CR is negative. Read-only (computed).
 */
function adjustmentsToRows(adjustments: PirAdjustment[] | undefined, divisor: number, fiscalYear: number): FinRow[] {
  return (adjustments ?? []).map((a) => {
    const signed = (a.dr_cr ?? "").toUpperCase() === "CR" ? -a.amount : a.amount;
    const isActual = (a.scenario ?? "").toUpperCase().startsWith("ACTUAL");
    const fy = a.fiscal_year && a.fiscal_year !== fiscalYear ? ` (FY${String(a.fiscal_year).slice(-2)})` : "";
    return {
      label: `${a.description || "Manual adjustment"}${fy}`,
      lineCode: `ADJ-${a.pir_adjustment_id}`,
      computed: true,
      indent: true,
      bold: false,
      cells: [
        isActual ? fmtCell(signed, false, divisor) : null,
        isActual ? null : fmtCell(signed, false, divisor),
        fmtCell(isActual ? signed : -signed, true, divisor),
      ],
    };
  });
}

function sectionsToTable(sections: PirDetailData["sections"], divisor: number, fiscalYear: number): FinSection[] {
  return sections.map((s) => {
    const lineRows = sectionLinesToRows(s.lines, divisor);
    const adjRows = adjustmentsToRows(s.adjustments, divisor, fiscalYear);
    // Added lines sit above the computed total they roll into — the first
    // computed line after a source line (a header-style total at the top is skipped).
    const totalAt = lineRows.findIndex((r, i) => r.computed && lineRows.slice(0, i).some((p) => !p.computed));
    const at = totalAt === -1 ? lineRows.length : totalAt;
    return {
      title: s.section_label,
      code: s.section_code,
      finEvalSectionId: s.fin_eval_section_id,
      rows: [...lineRows.slice(0, at), ...adjRows, ...lineRows.slice(at)],
    };
  });
}

function sectionLinesToRows(lines: PirDetailData["sections"][number]["lines"], divisor: number): FinRow[] {
  return lines.map((l) => {
    const indent = INDENT_CODES.has(l.line_code);
    const cum = l.period_data?.cumulative;
    return {
      label: l.line_label,
      lineCode: l.line_code,
      computed: l.is_computed === true,
      indent,
      bold: !indent,
      cells: [
        fmtCell(cum?.actual, false, divisor),
        fmtCell(cum?.buyplan, false, divisor),
        fmtCell(cum?.variance, true, divisor),
      ] as FinRow["cells"],
    };
  });
}

interface ReviewUi {
  title: string;
  subtitle: string;
  overallRating: Rag | "none";
  overallLabel: string;
  cards: RagCardData[];
  table: FinTableData;
}

function transformReview(data: PirDetailData, milestoneCode: string, scale: Scale): ReviewUi {
  const divisor = SCALE_DIVISOR[scale];
  const info = data.milestone_info;
  const g1 = GROUP_LABELS[milestoneCode] ?? "Cumulative";
  const sym = info.display_currency === "USD" ? "$" : "€";
  const overall = data.kpi_summary.find((k) => k.kpi_code === "OVERALL");
  return {
    title: `${info.milestone_label} — PIR`,
    subtitle: `Period ending ${info.period_ending} · Completion date: ${info.completion_date} · ${info.display_currency}`,
    overallRating: overall ? statusToRag(overall.status) : "none",
    overallLabel: overall ? `Overall: ${overall.status}` : "Not yet assessed",
    cards: kpisToCards(data.kpi_summary),
    table: {
      titleBar: `PIR Financial Appendix — ${info.display_currency === "USD" ? "US Dollars" : "Local Currency"}`,
      unit: `${sym} ${SCALE_NAME[scale]}`,
      rowHeader: "Hyperion intersection: [Entity / BU / Country]",
      group1: g1,
      cols: ["Actual", "Buy Plan", "Variance"],
      sections: sectionsToTable(data.sections, divisor, fiscalYearOf(info.period_ending)),
      fx: `${info.fx_rate} (${info.currency_code})`,
      milestoneCode,
      fiscalYear: fiscalYearOf(info.period_ending),
      divisor,
    },
  };
}

/** Fiscal year (April–March) the review period ends in: "30-Sep-2025" → 2026. */
function fiscalYearOf(periodEnding: string): number {
  const d = new Date(periodEnding);
  if (!Number.isNaN(d.getTime())) return d.getMonth() >= 3 ? d.getFullYear() + 1 : d.getFullYear();
  const y = (periodEnding ?? "").match(/\b(\d{4})\b/);
  return y ? Number(y[1]) : new Date().getFullYear();
}

function ReviewPanel({ milestoneCode, title }: { milestoneCode: string; title: string }): ReactElement {
  // USD by default; switching currency re-runs the detail GET with the new `currency` header.
  const [currency, setCurrency] = useState<Currency>("USD");
  const [scale, setScale] = useState<Scale>("K");
  const [raw, setRaw] = useState<PirDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Changes after any successful PUT/POST anywhere — re-runs the GET below.
  const refreshToken = useRefreshToken();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPirDetail(getAppConfig(), { milestoneCode, currency })
      .then((d) => { if (!cancelled) setRaw(d); })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : String(e)); setRaw(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [milestoneCode, currency, refreshToken]);

  const review = raw ? transformReview(raw, milestoneCode, scale) : null;

  return (
    <>
      <ReviewHeader
        title={review?.title ?? title}
        subtitle={review?.subtitle ?? ""}
        rating={review?.overallRating ?? "none"}
        label={review?.overallLabel ?? ""}
      />
      <Toolbar currency={currency} onCurrency={setCurrency} scale={scale} onScale={setScale} />
      {loading && <div className="pir-rv-card pir-rv-note">Loading live review data…</div>}
      {error && (
        <div className="pir-rv-card pir-rv-note pir-rv-note-error">
          Couldn’t load live data. ({error})
        </div>
      )}
      {!loading && !error && !review && (
        <div className="pir-rv-card pir-rv-note">No review data available.</div>
      )}
      {review && (
        <>
          <RagCards cards={review.cards} />
          <ColourKey />
          <FinancialTable data={review.table} />
        </>
      )}
    </>
  );
}

// ── Root screen ────────────────────────────────────────────────────────────
export default function PostInvestmentReview(): ReactElement {
  const [tab, setTab] = useState<PeriodKey>("overview");

  return (
    <div className="pir-rv-root">
      <style>{PIR_RV_CSS}</style>

      {/* Period navigation */}
      <nav className="pir-rv-tabs" aria-label="Review periods">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`pir-rv-tab ${tab === t.key ? "pir-rv-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="pir-rv-main">
        {tab === "overview" && <OverviewPanel />}
        {tab === "6m" && <ReviewPanel milestoneCode="6M" title="6-Month PIR Review" />}
        {tab === "12m" && <ReviewPanel milestoneCode="12M" title="12-Month PIR Review" />}
        {tab === "24m" && <ReviewPanel milestoneCode="24M" title="24-Month PIR Review" />}
      </main>
    </div>
  );
}

// ── Scoped styles ──────────────────────────────────────────────────────────
const PIR_RV_CSS = `
.pir-rv-root {
  /* Brand shades — dark for bars/headers/accents, light for tinted fills. No pinks. */
  --dark:#1D2C4D; --light:#dde2ec69;
  --navy:var(--dark); --navy-d:var(--dark); --raspberry:var(--dark); --purple:var(--dark);
  --g50:#F8F9FA; --g100:#F1F3F5; --g200:#E9ECEF; --g300:#DEE2E6;
  --g400:#ADB5BD; --g500:#6C757D; --g600:#495057; --g700:#343A40;
  --blue-calc:var(--light); --act:var(--light); --plan:#EBF3FB;
  /* One status palette used by every badge, pill, dropdown and card. */
  --s-green:#1E7B45; --s-green-bg:#E6F4EC; --s-green-bd:#B7DFC6;
  --s-amber:#9A5B00; --s-amber-bg:#FFF4E0; --s-amber-bd:#F5D49A;
  --s-red:#B42318;   --s-red-bg:#FDECEA;   --s-red-bd:#F5C2BD;
  font-family: 'Roboto','Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;
  color: var(--g700);
  background: var(--g50);
  font-size: 13px;
  min-height: 100%;
}
.pir-rv-root *, .pir-rv-root *::before, .pir-rv-root *::after { box-sizing: border-box; }

/* Gradient + header */
.pir-rv-gradient { height:4px; background:var(--dark); }
.pir-rv-header {
  background:#fff; border-bottom:1px solid var(--g200);
  padding:0 24px; display:flex; align-items:center; gap:12px; height:52px;
}
.pir-rv-logo {
  width:28px; height:28px; background:var(--navy); border-radius:6px; color:#fff;
  font-weight:900; font-size:15px; display:flex; align-items:center; justify-content:center;
}
.pir-rv-brand { font-size:14px; font-weight:600; color:var(--g600); }
.pir-rv-sep { color:var(--g300); font-size:18px; }
.pir-rv-section { font-size:14px; font-weight:700; color:var(--raspberry); }
.pir-rv-wf-badge {
  background:var(--s-amber-bg); color:var(--s-amber); border:1px solid var(--s-amber-bd); border-radius:4px;
  padding:2px 8px; font-size:11px; font-weight:700; letter-spacing:.5px;
}
.pir-rv-header-sp { flex:1; }
.pir-rv-home { font-size:13px; font-weight:600; color:var(--g600); cursor:pointer; text-decoration:none; }
.pir-rv-home:hover { color:var(--navy); }
.pir-rv-avatar {
  width:32px; height:32px; background:var(--raspberry); border-radius:50%; color:#fff;
  font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center;
}

/* Tabs */
.pir-rv-tabs {
  background:#fff; border-bottom:1px solid var(--g200);
  padding:0; display:flex; gap:0; overflow-x:auto;
}
.pir-rv-tab {
  flex:1; min-width:140px; text-align:center; padding:14px 18px; font-size:14px;
  color:var(--g500); background:none; border:none; border-bottom:2px solid transparent;
  margin-bottom:-1px; cursor:pointer; white-space:nowrap; font-family:inherit; transition:color .15s;
}
.pir-rv-tab:hover { color:var(--navy); }
.pir-rv-tab-active { color:var(--navy-d); border-bottom-color:var(--navy-d); font-weight:700; }

/* Main */
.pir-rv-main { width:100%; margin:0; padding:0; }

/* Card */
.pir-rv-card {
  background:#fff; border:1px solid var(--g200); border-radius:10px;
  overflow:hidden; margin-bottom:18px;
}
.pir-rv-card-head {
  background:var(--navy-d); color:#fff; padding:12px 18px;
  font-size:12px; font-weight:700; letter-spacing:.8px;
}

/* Report header */
.pir-rv-report-head { padding:0; }
.pir-rv-report-top {
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
  padding:20px 22px 16px;
}
.pir-rv-report-eyebrow { font-size:11px; font-weight:700; color:var(--g500); letter-spacing:.6px; margin-bottom:4px; }
.pir-rv-report-title { font-size:24px; font-weight:800; color:var(--navy); margin:0 0 6px; }
.pir-rv-report-sub { font-size:13px; color:var(--g600); }
.pir-rv-report-status { text-align:right; flex-shrink:0; }
.pir-rv-report-status-label { font-size:11px; font-weight:700; color:var(--g400); letter-spacing:.6px; margin-bottom:6px; }
.pir-rv-report-status-row { display:flex; align-items:center; justify-content:flex-end; gap:8px; }
.pir-rv-refresh-btn {
  display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px;
  border-radius:8px; border:1px solid var(--g300); background:#fff; color:var(--dark); cursor:pointer;
}
.pir-rv-refresh-btn:hover:not(:disabled) { background:var(--light); border-color:var(--dark); }
.pir-rv-refresh-btn:disabled { cursor:progress; opacity:.7; }
.pir-rv-refresh-spin svg { animation:pir-rv-spin 1s linear infinite; }
@keyframes pir-rv-spin { to { transform:rotate(360deg); } }
.pir-rv-refresh-err {
  margin-top:6px; max-width:320px; margin-left:auto; font-size:11px; color:var(--s-red);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* Meta row */
.pir-rv-meta-row {
  display:flex; flex-wrap:wrap; gap:4px 24px;
  padding:14px 22px; border-top:1px solid var(--g200); background:var(--g50);
}
.pir-rv-meta-item { font-size:13px; }
.pir-rv-meta-label { color:var(--g500); }
.pir-rv-meta-value { color:var(--g700); font-weight:700; margin-left:4px; }

/* RAG badges */
.pir-rv-rag-badge {
  display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:6px;
  font-size:13px; font-weight:700; white-space:nowrap;
}
.pir-rv-rag-badge-icon { display:inline-flex; }
.pir-rv-rag-green { background:var(--s-green-bg); color:var(--s-green); border:1px solid var(--s-green-bd); }
.pir-rv-rag-amber { background:var(--s-amber-bg); color:var(--s-amber); border:1px solid var(--s-amber-bd); }
.pir-rv-rag-red { background:var(--s-red-bg); color:var(--s-red); border:1px solid var(--s-red-bd); }

/* RAG cards */
.pir-rv-rag-wrap { padding:18px; }
.pir-rv-rag-grid {
  display:grid; grid-template-columns:repeat(4,1fr); gap:12px;
}
.pir-rv-rag-card {
  border:1px solid var(--g200); border-left:4px solid var(--g300);
  border-radius:8px; padding:12px 14px; background:#fff;
}
.pir-rv-rag-card-green { border-left-color:var(--s-green); }
.pir-rv-rag-card-amber { border-left-color:var(--s-amber); }
.pir-rv-rag-card-red { border-left-color:var(--s-red); }
.pir-rv-rag-dim { font-size:13px; font-weight:700; color:var(--navy); margin-bottom:8px; }
.pir-rv-rag-crit { font-size:12px; color:var(--g600); margin-top:8px; line-height:1.4; }
@media (max-width:1100px) { .pir-rv-rag-grid { grid-template-columns:repeat(2,1fr); } }

/* Review period header */
.pir-rv-rvhead { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 20px; }
.pir-rv-rvhead-title { font-size:16px; font-weight:800; color:var(--navy); margin-bottom:4px; }
.pir-rv-rvhead-sub { font-size:12px; color:var(--g500); }
.pir-rv-ov-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; font-size:13px; font-weight:700; white-space:nowrap; }
.pir-rv-ov-green { background:var(--s-green-bg); color:var(--s-green); border:1px solid var(--s-green-bd); }
.pir-rv-ov-amber { background:var(--s-amber-bg); color:var(--s-amber); border:1px solid var(--s-amber-bd); }
.pir-rv-ov-red { background:var(--s-red-bg); color:var(--s-red); border:1px solid var(--s-red-bd); }
.pir-rv-ov-none { background:#fff; color:var(--g500); border:1px dashed var(--g300); }

/* Currency / scale toolbar */
.pir-rv-toolbar { display:flex; align-items:center; gap:14px; padding:12px 16px; flex-wrap:wrap; }
.pir-rv-tb-label { font-size:11px; font-weight:700; color:var(--g500); letter-spacing:.5px; }
.pir-rv-seg { display:inline-flex; border:1px solid var(--g300); border-radius:7px; overflow:hidden; }
.pir-rv-seg button {
  padding:6px 14px; font-size:12px; border:none; border-right:1px solid var(--g300);
  background:#fff; color:var(--g600); cursor:pointer; font-family:inherit; font-weight:600;
}
.pir-rv-seg button:last-child { border-right:none; }
.pir-rv-seg button.active { background:var(--navy-d); color:#fff; }

/* Restyled RAG cards */
.pir-rv-rag2-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.pir-rv-rag2-card { border:1px solid var(--g200); border-radius:10px; padding:14px 16px; background:#fff; }
.pir-rv-rag2-pending { background:var(--g50); }
.pir-rv-rag2-label { font-size:11px; font-weight:700; color:var(--g500); letter-spacing:.5px; text-transform:uppercase; margin-bottom:8px; }
.pir-rv-rag2-crit { font-size:12px; color:var(--g500); margin-top:8px; line-height:1.4; }
.pir-rv-rag2-dash { color:var(--g400); font-size:14px; }
@media (max-width:1100px) { .pir-rv-rag2-grid { grid-template-columns:repeat(2,1fr); } }

/* Colour key */
.pir-rv-colourkey {
  display:flex; align-items:center; gap:20px; flex-wrap:wrap;
  padding:10px 16px; background:var(--g50); border:1px solid var(--g200);
  border-radius:8px; margin-bottom:14px;
}
.pir-rv-ck-label { font-size:11px; font-weight:700; color:var(--g400); letter-spacing:.5px; }
.pir-rv-ck-item { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--g600); }
.pir-rv-ck-swatch { width:16px; height:16px; border-radius:4px; display:inline-block; }
.pir-rv-ck-purple { background:var(--act); border:1px solid #C5CCDA; }
.pir-rv-ck-blue { background:var(--plan); border:1px solid #C3D4EC; }

/* Scoring summary table */
.pir-rv-table-card { padding:0; }
.pir-rv-table-scroll { overflow-x:auto; }
.pir-rv-table { width:100%; border-collapse:collapse; }
.pir-rv-table th {
  background:var(--g100); padding:10px 16px; text-align:left;
  font-size:11px; font-weight:700; color:var(--g500); letter-spacing:.5px; white-space:nowrap;
}
.pir-rv-th-crit { color:var(--g400); }
.pir-rv-table td { padding:12px 16px; font-size:13px; border-top:1px solid var(--g200); vertical-align:middle; }
.pir-rv-table tbody tr:hover td { background:var(--g50); }
.pir-rv-td-dim { font-weight:700; color:var(--navy); white-space:nowrap; }
.pir-rv-criteria { color:var(--g600); }
.pir-rv-criteria-muted { color:var(--g400); font-style:italic; }
.pir-rv-dash { color:var(--g400); }
.pir-rv-col-active { background:var(--light); }
.pir-rv-table tbody tr:hover td.pir-rv-col-active { background:#dde2ec; }
.pir-rv-col-border-l { border-left:2px solid var(--navy-d); }
.pir-rv-col-border-r { border-right:2px solid var(--navy-d); }
.pir-rv-table thead th.pir-rv-col-active { background:var(--blue-calc); color:var(--navy); }
.pir-rv-pill {
  display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:6px;
  font-size:13px; font-weight:700; white-space:nowrap;
}
.pir-rv-pill-icon { display:inline-flex; }
.pir-rv-pill-on-track { background:var(--s-green-bg); color:var(--s-green); border:1px solid var(--s-green-bd); }
.pir-rv-pill-attention { background:var(--s-amber-bg); color:var(--s-amber); border:1px solid var(--s-amber-bd); }
.pir-rv-pill-at-risk { background:var(--s-red-bg); color:var(--s-red); border:1px solid var(--s-red-bd); }
.pir-rv-card-head-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.pir-rv-save-wrap { display:flex; align-items:center; gap:10px; }
.pir-rv-save-ok { font-size:11px; font-weight:600; color:#7CF3B0; letter-spacing:.3px; }
.pir-rv-save-err { font-size:11px; font-weight:600; color:#FF9D9D; letter-spacing:.3px; }
.pir-rv-save-btn {
  display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:6px;
  border:1px solid rgba(255,255,255,.35); background:rgba(255,255,255,.12); color:#fff;
  font-size:12px; font-weight:700; letter-spacing:.3px; cursor:pointer;
}
.pir-rv-save-btn:hover:not(:disabled) { background:rgba(255,255,255,.22); }
.pir-rv-save-btn:disabled { opacity:.5; cursor:not-allowed; }
.pir-rv-criteria-input {
  width:100%; box-sizing:border-box; padding:6px 8px; border:1px solid var(--g300);
  border-radius:6px; font-size:13px; color:var(--g600); background:#fff;
}
.pir-rv-criteria-input:focus { outline:none; border-color:var(--navy); }
.pir-rv-criteria-input::placeholder { color:var(--g400); font-style:italic; }
.pir-rv-dd { position:relative; min-width:150px; }
.pir-rv-dd-btn {
  display:flex; align-items:center; justify-content:space-between; gap:6px; width:100%;
  padding:5px 8px; border-radius:6px; border:1px solid var(--g300); background:#fff;
  font-size:13px; font-weight:700; cursor:pointer; color:var(--g500); font-family:inherit;
}
.pir-rv-dd-btn:focus { outline:none; border-color:var(--navy); }
.pir-rv-dd-current { display:inline-flex; align-items:center; gap:6px; min-height:16px; }
.pir-rv-dd-on-track { color:var(--s-green); border-color:var(--s-green-bd); background-color:var(--s-green-bg); }
.pir-rv-dd-attention { color:var(--s-amber); border-color:var(--s-amber-bd); background-color:var(--s-amber-bg); }
.pir-rv-dd-at-risk { color:var(--s-red); border-color:var(--s-red-bd); background-color:var(--s-red-bg); }
.pir-rv-dd-menu {
  position:absolute; bottom:calc(100% + 4px); left:0; right:0; z-index:20; margin:0; padding:4px;
  list-style:none; background:#fff; border:1px solid var(--g200); border-radius:8px;
  box-shadow:0 8px 24px rgba(0,0,0,.12);
}
.pir-rv-dd-menu li { margin:0; }
.pir-rv-dd-opt {
  display:flex; align-items:center; gap:8px; width:100%; padding:7px 9px; border:none;
  background:none; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;
  color:var(--g500); font-family:inherit; text-align:left;
}
.pir-rv-dd-opt:hover { background:var(--g50); }
.pir-rv-dd-opt-clear { color:var(--g400); font-weight:600; }
.pir-rv-dd-opt.pir-rv-dd-on-track { color:var(--s-green); background:none; }
.pir-rv-dd-opt.pir-rv-dd-attention { color:var(--s-amber); background:none; }
.pir-rv-dd-opt.pir-rv-dd-at-risk { color:var(--s-red); background:none; }
.pir-rv-dd-opt.pir-rv-dd-on-track:hover { background:var(--s-green-bg); }
.pir-rv-dd-opt.pir-rv-dd-attention:hover { background:var(--s-amber-bg); }
.pir-rv-dd-opt.pir-rv-dd-at-risk:hover { background:var(--s-red-bg); }

/* PIR calendar (milestone list) */
.pir-rv-cal2-head { display:flex; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid var(--g200); }
.pir-rv-cal2-ico {
  width:36px; height:36px; border-radius:8px; background:var(--light); color:var(--navy);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.pir-rv-cal2-title { font-size:14px; font-weight:800; color:var(--navy); letter-spacing:.5px; }
.pir-rv-cal2-sub { font-size:12px; color:var(--g500); margin-top:2px; }
.pir-rv-ms-wrap { border-bottom:1px solid var(--g200); border-left:4px solid transparent; }
.pir-rv-ms-wrap:last-child { border-bottom:none; }
.pir-rv-ms-upcoming { background:var(--light); border-left-color:var(--s-amber); }
.pir-rv-ms-completed { border-left-color:var(--s-green); }
.pir-rv-ms-future { opacity:.6; }
.pir-rv-ms {
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
  padding:16px 20px;
}
.pir-rv-ms-main { min-width:0; }
.pir-rv-ms-title { font-size:14px; font-weight:700; color:var(--navy); margin-bottom:5px; }
.pir-rv-ms-future .pir-rv-ms-title { color:var(--g500); }
.pir-rv-ms-date { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--g600); margin-bottom:6px; }
.pir-rv-ms-date svg { color:var(--g400); }
.pir-rv-ms-countdown {
  display:inline-flex; align-items:center; gap:4px; background:var(--s-amber-bg); color:var(--s-amber);
  border:1px solid var(--s-amber-bd); border-radius:20px; padding:2px 9px; font-size:11px; font-weight:600;
}
.pir-rv-ms-countdown svg { color:var(--s-amber); }
.pir-rv-ms-desc { font-size:12px; color:var(--g500); line-height:1.5; }
.pir-rv-ms-actions { display:flex; align-items:center; gap:10px; flex-shrink:0; }
.pir-rv-ms-btn {
  display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:6px;
  border:1px solid var(--g300); background:#fff; color:var(--g600); font-size:12px;
  font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap;
}
.pir-rv-ms-btn:hover { background:var(--g50); }
.pir-rv-ms-btn-primary { border-color:var(--purple); color:var(--purple); }
.pir-rv-ms-btn-disabled { color:var(--g400); cursor:not-allowed; }
.pir-rv-ms-pill {
  display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:20px;
  font-size:11px; font-weight:600; white-space:nowrap;
}
.pir-rv-ms-pill-completed { background:var(--s-green-bg); color:var(--s-green); border:1px solid var(--s-green-bd); }
.pir-rv-ms-pill-upcoming { background:var(--s-amber-bg); color:var(--s-amber); border:1px solid var(--s-amber-bd); }
.pir-rv-ms-pill-future { background:var(--g100); color:var(--g500); }
.pir-rv-ms-chevron {
  color:var(--g400); display:flex; cursor:pointer; background:none; border:none;
  padding:4px; transition:transform .15s ease;
}
.pir-rv-ms-chevron-open { transform:rotate(180deg); }
.pir-rv-ms-chevron:disabled { cursor:not-allowed; opacity:.5; }

/* Expanded milestone detail */
.pir-rv-ms-detail { padding:0 20px 18px; display:flex; flex-direction:column; gap:14px; }
.pir-rv-ms-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px; }
.pir-rv-panel { border:1px solid var(--g200); border-radius:8px; overflow:hidden; background:#fff; }
.pir-rv-panel-head {
  background:var(--navy-d); color:#fff; padding:9px 14px; font-size:11px; font-weight:700; letter-spacing:.6px;
}
.pir-rv-panel-body { padding:12px 14px; }
.pir-rv-ta {
  width:100%; box-sizing:border-box; min-height:100px; resize:vertical; padding:10px 12px;
  border:1px solid var(--g300); border-radius:6px; font-size:13px; font-family:inherit;
  color:var(--g700); line-height:1.5; background:#fff;
}
.pir-rv-ta:focus { outline:none; border-color:var(--navy); }
.pir-rv-ta::placeholder { color:var(--g400); font-style:italic; }

/* Financial tables */
.pir-rv-fin-card {
  background:#fff; border:1px solid var(--g200); border-radius:8px;
  overflow:hidden; margin-bottom:14px;
}
.pir-rv-fin-titlebar {
  padding:10px 16px; font-size:12px; font-weight:700; color:#fff; background:var(--dark);
  text-transform:uppercase; letter-spacing:.8px;
  display:flex; align-items:center; justify-content:space-between; gap:12px;
}
.pir-rv-fin-scroll { overflow-x:auto; }
.pir-rv-fin-table { width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed; }
.pir-rv-fin-compact .pir-rv-fin-table { font-size:11px; }
.pir-rv-fin-unit {
  padding:8px 14px; text-align:left; font-size:12px; font-weight:700;
  color:var(--navy-d); background:var(--g50); white-space:nowrap;
}
.pir-rv-fin-group {
  padding:8px 10px; text-align:center; font-size:10px; font-weight:700;
  color:var(--navy-d); background:var(--g50); white-space:nowrap;
}
.pir-rv-fin-rowhdr {
  padding:7px 14px; text-align:left; font-size:12px; font-weight:700;
  color:var(--navy-d); background:var(--light); vertical-align:middle; height:42px;
}
.pir-rv-fin-colhdr {
  padding:7px 8px; text-align:right; font-size:10px; font-weight:600;
  color:var(--navy-d); background:var(--light); white-space:nowrap; border-left:1px solid #CED4DA;
}
.pir-rv-fin-sep { border-right:2px solid var(--navy-d); }
.pir-rv-fin-sec {
  padding:6px 14px; font-size:13px; font-weight:700; color:#fff; background:var(--navy-d);
  text-transform:uppercase; letter-spacing:.5px;
}
.pir-rv-fin-label { padding:7px 14px; color:var(--g600); white-space:nowrap; }
.pir-rv-fin-bold { font-size:12px; font-weight:600; }
.pir-rv-fin-indent { padding-left:26px; }
.pir-rv-fin-cell { padding:7px 9px; text-align:right; }
.pir-rv-fin-act { color:var(--navy-d); background:var(--act); }
.pir-rv-fin-plan { color:var(--g500); background:var(--plan); }
.pir-rv-fin-var { background:#fff; }
.pir-rv-fin-pos { color:var(--s-green); font-weight:600; }
.pir-rv-fin-neg { color:var(--s-red); font-weight:600; }
.pir-rv-fin-muted { color:var(--g400); }
.pir-rv-fin-table tbody tr { border-bottom:1px solid #F1F3F5; }
.pir-rv-fin-addrow { padding:5px 16px; background:#fff; }
.pir-rv-fin-addrow button {
  border:none; background:#dde2ec69; padding:4px 10px; border-radius:4px; color:#1D2C4D;
  font-size:12px; font-weight:600; cursor:pointer;
}
.pir-rv-fin-addrow button:hover { background:#dde2ec; }
.pir-rv-fin-draft { background:var(--light); }
.pir-rv-fin-draft-label { display:flex; align-items:center; gap:6px; }
.pir-rv-fin-input {
  width:100%; box-sizing:border-box; padding:4px 6px; text-align:right;
  border:1px solid #CED4DA; border-radius:4px; font-size:12px; color:var(--navy-d);
  background:#fff;
}
.pir-rv-fin-input:focus { outline:none; border-color:var(--raspberry); }
.pir-rv-fin-input:disabled { background:var(--g50); cursor:not-allowed; }
.pir-rv-fin-name-input { text-align:left; }
.pir-rv-fin-draft-remove {
  border:none; background:none; padding:0; color:var(--g400);
  font-size:12px; line-height:1; cursor:pointer; flex:0 0 auto;
}
.pir-rv-fin-draft-remove:hover { color:var(--s-red); }
.pir-rv-fin-draft-remove:disabled { opacity:.4; cursor:not-allowed; }
.pir-rv-fin-draft-err {
  margin-top:3px; font-size:10px; color:var(--s-red);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.pir-rv-fin-locked { color:var(--g400); cursor:not-allowed; }
.pir-rv-fin-fx { padding:7px 14px; font-size:11px; color:var(--g400); background:var(--g50); }

/* Side-by-side appendix (12-month) */
.pir-rv-fin-sidebyside { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; }
.pir-rv-fin-sidebyside > .pir-rv-fin-card { flex:1 1 440px; min-width:0; }

/* Commentary */
.pir-rv-commentary { padding:16px 20px; font-size:13px; color:var(--g600); line-height:1.7; }

/* Loading / error notes */
.pir-rv-note { padding:14px 18px; font-size:13px; color:var(--g600); }
.pir-rv-note-error { color:var(--s-red); background:var(--s-red-bg); border-color:var(--s-red-bd); }
`;
