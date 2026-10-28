/**
 * Non-Financial Metrics — client numbers, annual licence values, headcount.
 *
 * Endpoint: GET {api_endpoint}/GIS/proposalAuthoring/financialEvaluation
 *           ?proposal_id=435&spc_type_id=…&template_type_id=…
 *
 * Same payload as the financial evaluation: header → sections → lines, each line
 * carrying `year_values` keyed by fiscal year. Financial and non-financial lines
 * live side by side and are told apart by `line_identifier` — anything that is
 * not "FINANCIAL" is treated as non-financial here (the field has been seen as
 * "NON_FINANCIAL" and "NONFINANCIAL", so the check is loose).
 *
 * A section is included only if it actually holds non-financial lines, so the
 * tables that render come from the data rather than from a hard-coded list of
 * section names — a new metric added server-side shows up without a code change.
 */
import type { AppConfig } from "../config/app-config";
import { authContextHeaders, describeAuthContext, missingAuthContext } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson, REQUEST_TIMEOUT_MS, extractApiErrorMessage } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Wire types ─────────────────────────── */
/** Amounts sit under different keys depending on whether the line is calculated. */
type WireYearEntry = {
  spc_projected_amount?:  number | null;
  actual?:                number | null;
  ytd_actuals?:           number | null;
  ytd_budgeted_forecast?: number | null;
  variance?:              number | null;
};

type WireLine = {
  fin_eval_line_id:    number | string | null;
  fin_eval_section_id: number | string | null;
  line_type?:          string | null;
  line_item_name?:     string | null;
  line_identifier?:    string | null;
  is_calculated?:      string | null;
  account?:            string | null;
  display_order?:      number | null;
  year_values?:        Record<string, WireYearEntry> | null;
};

type WireSection = {
  fin_eval_section_id?: number | string | null;
  section_name?:        string | null;
  section_type?:        string | null;
  display_order?:       number | null;
  lines?:               WireLine[] | null;
};

/** The financial-evaluation document — header fields plus its sections. */
type WireHeader = Record<string, unknown> & { sections?: WireSection[] | null };

/* ─────────────────────────── UI-side types ──────────────────────── */
export type NfYear = { key: string; label: string };

export type NfCell = {
  /** SPC-projected figure — read-only, straight from the approved business case. */
  spc:    number | null;
  /** Recorded actual. Null until someone enters one. */
  actual: number | null;
};

export type NfRow = {
  /** fin_eval_line_id — what an actuals write would be keyed on. */
  lineId:  number | null;
  label:   string;
  /** Server-calculated line (is_calculated = "Y") — shown as a total row and
   *  never editable, since the backend owns the number. */
  isTotal: boolean;
  cells:   NfCell[]; // one per year, in column order
};

export type NfTable = {
  sectionId: number | null;
  title:     string;
  rows:      NfRow[];
  /** True when the section carried no calculated line and the total row shown
   *  underneath is summed in the browser instead. Stays false for a single-row
   *  section, where a total would just repeat that row. */
  totalIsDerived: boolean;
};

export type NonFinancialReport = {
  years:  NfYear[];
  tables: NfTable[];
  /**
   * The financial-evaluation document exactly as it came back.
   *
   * Saving is a full-document PUT: the body replaces everything, financial lines
   * included. So a save round-trips this object with only the non-financial bits
   * changed, rather than composing a fresh payload that would drop the rest.
   */
  raw: WireHeader | null;
};

/* ─────────────────────────── Transformer ────────────────────────── */
const isNonFinancial = (line: WireLine): boolean => {
  const id = String(line.line_identifier ?? "").trim().toUpperCase();
  // Blank identifiers are ambiguous, so they stay out — only an explicit
  // non-financial marker pulls a line into these tables.
  return id !== "" && id !== "FINANCIAL";
};

const isCalculated = (line: WireLine): boolean =>
  String(line.is_calculated ?? "").trim().toUpperCase() === "Y";

const num = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** "fy27" → "FY27". Anything else is upper-cased as-is. */
const yearLabel = (key: string): string => key.toUpperCase();

/**
 * Pull the header out of the response. The nesting has varied across the PIR
 * endpoints (data.items / data[0] / data), so all three are probed — same
 * tolerance as getSectionIdsByName in forecast-actuals-api.
 */
function extractHeader(json: unknown): WireHeader | null {
  const data = (json as { data?: unknown })?.data;
  if (data == null) return null;
  const items = (data as { items?: unknown }).items;
  const candidates: unknown[] = [
    items,
    Array.isArray(items) ? items[0] : undefined,
    Array.isArray(data) ? data[0] : undefined,
    data,
  ];
  for (const c of candidates) {
    if (c && typeof c === "object" && Array.isArray((c as WireHeader).sections)) {
      return c as WireHeader;
    }
  }
  return null;
}

/**
 * Fiscal-year columns, in payload order across every non-financial line.
 *
 * "total" is deliberately dropped: these are counts and per-year licence values,
 * so a row-wise total across years would be meaningless (a client counted in
 * FY27 and FY28 is the same client). The per-year total *row* below the table
 * is the summary that does make sense.
 */
function collectYears(sections: WireSection[]): NfYear[] {
  const keys: string[] = [];
  for (const section of sections) {
    for (const line of section.lines ?? []) {
      if (!isNonFinancial(line)) continue;
      for (const key of Object.keys(line.year_values ?? {})) {
        if (key.toLowerCase() === "total") continue;
        if (!keys.includes(key)) keys.push(key);
      }
    }
  }
  return keys.map((key) => ({ key, label: yearLabel(key) }));
}

export function transformNonFinancial(json: unknown): NonFinancialReport {
  const raw = extractHeader(json);
  const sections = raw?.sections ?? [];
  const years = collectYears(sections);
  if (years.length === 0) return { years: [], tables: [], raw };

  const tables: NfTable[] = [...sections]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((section): NfTable | null => {
      const lines = (section.lines ?? [])
        .filter(isNonFinancial)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      if (lines.length === 0) return null;

      const rows: NfRow[] = lines.map((line) => ({
        lineId:  num(line.fin_eval_line_id),
        label:   line.line_item_name || line.account || "Metric",
        isTotal: isCalculated(line),
        cells:   years.map((year) => {
          const entry = line.year_values?.[year.key] ?? {};
          return {
            spc:    num(entry.spc_projected_amount),
            // Calculated lines report their actual under ytd_actuals; entered
            // lines use `actual`. Either can be the recorded figure.
            actual: num(entry.actual) ?? num(entry.ytd_actuals),
          };
        }),
      }));

      return {
        sectionId: num(section.fin_eval_section_id),
        title:     section.section_name || section.section_type || "Non-Financial Metric",
        rows,
        totalIsDerived: !rows.some((r) => r.isTotal) && rows.length > 1,
      };
    })
    .filter((t): t is NfTable => t !== null);

  return { years, tables, raw };
}

/* ─────────────────────────── URL / token helpers ────────────────── */
const EVAL_PATH = "/GIS/proposalAuthoring/financialEvaluation";

// Always the real ORDS endpoint — see actual-drilldown-api.ts for why the
// local dev proxy branch was dropped.
export function buildNonFinancialUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const base = `${cfg.api_endpoint}${EVAL_PATH}`;
  const query = new URLSearchParams();
  const proposalId = cfg.proposal_id;
  if (Number.isFinite(Number(proposalId)) && Number(proposalId) > 0) {
    query.set("proposal_id", String(proposalId));
  }
  // Let the endpoint resolve the template when no proposal exists yet.
  if (cfg.spc_type_id != null && cfg.spc_type_id !== "") {
    query.set("spc_type_id", String(cfg.spc_type_id));
  }
  if (cfg.spc_type_template_id != null && cfg.spc_type_template_id !== "") {
    query.set("template_type_id", String(cfg.spc_type_template_id));
  }
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = import.meta.env.DEV ? import.meta.env.VITE_PIR_TOKEN : undefined;
  return fromCfg || fromEnv;
}

/* ─────────────────────────── Network call ───────────────────────── */
/* ─────────────────────────── Save (PUT) ─────────────────────────── */
/** An actual entered against an existing non-financial line. */
export type NfActualEdit = {
  lineId:  number;
  yearKey: string;
  /** Null clears the actual back to "not recorded". */
  value:   number | null;
};

/** A non-financial line added during the review — posted with a null line id. */
export type NfNewLine = {
  /** Section it belongs to. Null sections can't take new lines (nothing to attach to). */
  sectionId: number;
  label:     string;
  /** Entered actuals, keyed by fiscal-year key. */
  actuals:   Record<string, number | null>;
};

export function buildSaveUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const id = cfg.proposal_id;
  if (!Number.isFinite(Number(id)) || Number(id) <= 0) {
    throw new Error("A valid proposal_id is required to save non-financial metrics");
  }
  return `${cfg.api_endpoint}/GIS/proposalAuthoring/${id}/financialEvaluation`;
}

/** Server-owned audit columns — echoing them back would stamp stale values. */
const AUDIT_FIELDS = ["created_by", "creation_date", "last_updated_by", "last_updated_date"];

const stripAudit = <T extends Record<string, unknown>>(obj: T): T => {
  const copy = { ...obj };
  for (const field of AUDIT_FIELDS) delete copy[field];
  return copy;
};

/** Sum of every fiscal-year `actual`, ignoring the total entry itself. */
function sumActuals(yearValues: Record<string, WireYearEntry>): number | null {
  let total: number | null = null;
  for (const [key, entry] of Object.entries(yearValues)) {
    if (key.toLowerCase() === "total") continue;
    const v = num(entry?.actual);
    if (v != null) total = (total ?? 0) + v;
  }
  return total;
}

const sumSpc = (yearValues: Record<string, WireYearEntry>): number | null => {
  let total: number | null = null;
  for (const [key, entry] of Object.entries(yearValues)) {
    if (key.toLowerCase() === "total") continue;
    const v = num(entry?.spc_projected_amount);
    if (v != null) total = (total ?? 0) + v;
  }
  return total;
};

/**
 * Build the PUT body: the document exactly as it was read, with only the
 * non-financial edits and new lines applied.
 *
 * The endpoint replaces the whole evaluation, so anything dropped here is
 * dropped in the database — which is why every financial section and line is
 * carried through untouched rather than rebuilt.
 *
 * Exported for testing.
 */
export function buildSavePayload(
  raw: WireHeader,
  years: NfYear[],
  edits: NfActualEdit[],
  newLines: NfNewLine[],
): WireHeader {
  // Deep clone so a failed save leaves the loaded report untouched.
  const doc = JSON.parse(JSON.stringify(raw)) as WireHeader;
  const editsByLine = new Map<number, NfActualEdit[]>();
  for (const edit of edits) {
    const list = editsByLine.get(edit.lineId) ?? [];
    list.push(edit);
    editsByLine.set(edit.lineId, list);
  }

  const sections = doc.sections ?? [];
  for (const section of sections) {
    const sectionId = num(section.fin_eval_section_id);
    const lines = section.lines ?? [];

    for (const line of lines) {
      const lineId = num(line.fin_eval_line_id);
      // Financial lines are passed through exactly as received.
      if (lineId == null || !isNonFinancial(line) || !editsByLine.has(lineId)) continue;

      const yearValues = (line.year_values ??= {});
      for (const edit of editsByLine.get(lineId) ?? []) {
        const entry = (yearValues[edit.yearKey] ??= {});
        entry.actual = edit.value;
      }
      // Keep the total entry consistent with the years it summarises.
      if (yearValues.total) yearValues.total.actual = sumActuals(yearValues);
    }

    // Append lines added during the review, with a null id so the backend
    // treats them as inserts.
    const additions = newLines.filter((n) => n.sectionId === sectionId);
    if (additions.length === 0) continue;

    const maxOrder = lines.reduce((max, l) => Math.max(max, Number(l.display_order ?? 0)), 0);
    additions.forEach((addition, i) => {
      const yearValues: Record<string, WireYearEntry> = {};
      for (const year of years) {
        yearValues[year.key] = {
          // No approved baseline exists for a line raised during the PIR.
          spc_projected_amount: null,
          actual: addition.actuals[year.key] ?? null,
        };
      }
      yearValues.total = {
        spc_projected_amount: sumSpc(yearValues),
        actual: sumActuals(yearValues),
      };

      lines.push({
        fin_eval_line_id:    null,
        fin_eval_section_id: sectionId,
        line_type:           "NON_FINANCIAL",
        line_item_name:      addition.label,
        line_identifier:     "NON_FINANCIAL",
        is_calculated:       "N",
        is_custom:           "Y",
        is_read_only:        "N",
        account:             null,
        display_order:       maxOrder + (i + 1) * 10,
        target_go_live_date: null,
        status:              "ACTIVE",
        year_values:         yearValues,
      } as WireLine);
    });
    section.lines = lines;
  }

  // Strip audit columns at every level — the backend stamps its own.
  return stripAudit({
    ...doc,
    sections: sections.map((section) => ({
      ...stripAudit(section as unknown as Record<string, unknown>),
      lines: (section.lines ?? []).map((line) => stripAudit(line as unknown as Record<string, unknown>)),
    })),
  } as WireHeader);
}

/**
 * PUT the evaluation back with the non-financial edits applied, then tell the
 * refresh bus — one write re-reads every region on screen (KPI tiles, the
 * Forecast vs Actuals report, snapshots and these tables).
 */
export async function saveNonFinancialMetrics(
  cfg: AppConfig,
  raw: WireHeader,
  years: NfYear[],
  edits: NfActualEdit[],
  newLines: NfNewLine[],
): Promise<void> {
  if (edits.length === 0 && newLines.length === 0) return;

  const payload = buildSavePayload(raw, years, edits, newLines);
  const url = buildSaveUrl(cfg);
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));

  // role / user_email are enforced by ORDS; language is required by this
  // endpoint. fetchJson injects the first two, but this call needs a body so it
  // goes through fetch directly.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    language: "EN",
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  const body = JSON.stringify(payload);
  // Logged before the call so a rejected save can be replayed verbatim.
  console.log("[NonFinancial] PUT", url);
  console.log("[NonFinancial] PUT body\n" + JSON.stringify(payload, null, 2));

  // A full-evaluation PUT is the slowest call in the app, so it gets the same
  // five-minute budget as everything else rather than the browser default.
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Save timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, { method: "PUT", headers, body, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      throw new Error(
        reason instanceof Error || reason instanceof DOMException
          ? reason.message
          : "Save timed out after 5 minutes",
        { cause: err },
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[NonFinancial] PUT failed", res.status, detail);
    throw new Error(extractApiErrorMessage(detail) || `HTTP ${res.status}: ${res.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ""}`);
  }
  console.log("[NonFinancial] PUT ok", res.status);
  notifyDataChanged("PUT financialEvaluation (non-financial)");
}

/* ─────────────────────────── Network call ───────────────────────── */
export async function getNonFinancialMetrics(cfg: AppConfig): Promise<NonFinancialReport> {
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));
  const url = buildNonFinancialUrl(cfg);

  // Full request detail up front: this endpoint answers 403 with a business
  // message that doesn't say which input it objected to, so the query params
  // and the auth context that produced the call are logged before it goes out.
  const [, queryString = ""] = url.split("?");
  const auth = describeAuthContext(cfg);
  const missing = missingAuthContext(cfg);

  console.groupCollapsed("[NonFinancial] GET financialEvaluation");
  console.log("url        ", url);
  console.log("params     ", Object.fromEntries(new URLSearchParams(queryString)));
  console.log("headers    ", {
    // Full header value — copy it straight out of the console to diff against
    // what the host page set when the endpoint disputes the entitlement.
    role:          auth.role ?? "(absent)",
    user_email:    auth.user_email ?? "(absent)",
    Authorization: token ? `Bearer ${token.slice(0, 6)}…` : "(absent)",
  });
  console.log("role grants", { count: auth.role_grant_count, all: auth.grants, rls: auth.rls_grants });
  console.log("runtime    ", { tokenSource: override ? "dev_token" : "auth-api" });
  if (missing.length > 0) {
    console.error(
      `[NonFinancial] ${missing.join(" and ")} missing from window.__APP_CONFIG__ — ` +
        `expect 403 "You are not authorised to view this financial evaluation".`,
    );
  }
  console.groupEnd();

  let json: unknown;
  try {
    json = await fetchJson<unknown>(url, token, undefined, undefined, cfg);
  } catch (err) {
    console.error("[NonFinancial] GET failed", {
      url,
      error: err instanceof Error ? err.message : String(err),
      role_header_present: auth.role_header_present,
      user_email:          auth.user_email ?? null,
      proposal_id:         cfg.proposal_id,
    });
    throw err;
  }

  const report = transformNonFinancial(json);
  console.groupCollapsed("[NonFinancial] response");
  console.log("raw        ", json);
  console.log("years      ", report.years.map((y) => y.label));
  console.log("tables     ", report.tables.map((t) => ({
    section: t.title,
    id:      t.sectionId,
    rows:    t.rows.length,
  })));
  if (report.tables.length === 0) {
    console.warn(
      "[NonFinancial] no non-financial lines in the payload — every line came back " +
        'with line_identifier "FINANCIAL" or blank.',
    );
  }
  console.groupEnd();

  return report;
}
