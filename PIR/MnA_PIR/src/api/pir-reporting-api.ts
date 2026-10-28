/**
 * PIR Reporting API — Periodic Snapshots
 *
 * Endpoint: {api_endpoint}/GIS/PIR/reportingPeriodicSnapshots
 * GET → list of milestone snapshots (6 / 12 / 24-month reviews) for a proposal.
 * The proposal is supplied in the `proposal_id` request header.
 *
 * Attaches a Bearer token obtained via `fetchAuthToken` (auth-api.ts).
 */
import type { AppConfig } from "../config/app-config";
import { authContextHeaders } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson, REQUEST_TIMEOUT_MS, extractApiErrorMessage } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Wire types ─────────────────────────── */
export type SnapshotItem = {
  proposal_code:            string | null;
  proposal_title:           string | null;
  review_label:             string;
  period_label:             string | null;
  milestone_date:           string | null;
  snapshot_status:          string; // CAPTURED | FUTURE
  capex_spc_amount:         number | null;
  capex_actual_amount:      number | null;
  capex_variance_pct:       number | null;
  opex_spc_amount:          number | null;
  opex_actual_amount:       number | null;
  opex_variance_pct:        number | null;
  revenue_spc_amount:       number | null;
  revenue_actual_amount:    number | null;
  revenue_variance_pct:     number | null;
  total_cost_spc_amount:    number | null;
  total_cost_actual_amount: number | null;
  total_cost_variance_pct:  number | null;
  benefit_realisation_pct:  number | null;
  review_status:            string;
  snapshot_captured_at:     string;
  /** Approved investment for the proposal — drives INVESTMENT on the report header. */
  investment:               number | null;
  /** Recorded PIR position for the proposal — drives OVERALL STATUS on the
   *  report header. Null until the review sets one. */
  pir_status:               string | null;
  /** Free-text sign-off commentary. Both null until the review records them. */
  pir_executive_summary:    string | null;
  pir_lessons_learned:      string | null;
};

export type SnapshotApiResponse = {
  items:  SnapshotItem[];
  count:  number;
  hasMore?: boolean;
};

/* ─────────────────────────── UI-side types ──────────────────────── */
export type Tone = "green" | "red" | "muted";

export type SnapshotLine = {
  label:        string;
  value:        string;
  actuals:      string;
  variance:     string;
  varianceTone: Tone;
  /** Raw amounts behind value / actuals — re-formatted under the SCALE and
   *  NUMBER toolbar settings. Null on future (uncaptured) snapshots. */
  valueNum:     number | null;
  actualsNum:   number | null;
};

export type Snapshot = {
  proposalCode:      string; // proposal_code from the API, e.g. "NA-PD-2026-516"
  proposalTitle:     string; // proposal_title from the API, e.g. "Product Development - Proposal 28"
  title:             string;
  badge:             string;
  badgeTone:         "dark" | "amber" | "muted";
  headerTone:        "dark" | "muted";
  muted?:            boolean;
  lines:             SnapshotLine[];
  total:             string;
  totalActuals:      string;
  totalVariance:     string;
  totalVarianceTone: Tone;
  /** Raw Total Cost figures behind total / totalActuals. */
  totalNum:          number | null;
  totalActualsNum:   number | null;
  benefit:           string;
  footerLabel:       string;
  footerTone:        "green" | "amber" | "muted";
  milestoneDate:     string; // raw ISO date — used by the PIR calendar
  status:            string; // CAPTURED | FUTURE
  reviewStatus:      string; // ON_TRACK | NEEDS_REAPPROVAL | …
  /** `investment` from the API — the approved figure shown on the report header.
   *  Null on payloads predating the field, where the caller falls back to the
   *  Total Cost (SPC). */
  investmentNum:     number | null;
  /** `pir_status` as stored, e.g. "ON_TRACK". Null when the review has not set
   *  one — the header then shows "—" rather than inferring a status. */
  pirStatus:         string | null;
  /** Sign-off commentary as stored. Null when the review has not written any —
   *  the narrative cards then show their placeholder guidance. */
  pirExecutiveSummary: string | null;
  pirLessonsLearned:   string | null;
};

/* ─────────────────────────── Formatters ─────────────────────────── */
const fmtMoney = (n: number | null): string => {
  if (n == null) return "—";
  const m = n / 1_000_000;
  const value = `$${Math.abs(m).toFixed(2)}M`;
  return m < 0 ? `(${value})` : value;
};

const fmtVariance = (n: number | null): { text: string; tone: Tone } => {
  if (n == null) return { text: "—", tone: "muted" };
  if (n > 0) return { text: `${n.toFixed(1)}%`, tone: "green" };
  if (n < 0) return { text: `(${Math.abs(n).toFixed(1)}%)`, tone: "red" };
  return { text: "0.0%", tone: "muted" };
};

const fmtPct = (n: number | null): string =>
  n == null ? "—" : n < 0 ? `(${Math.abs(n).toFixed(1)}%)` : `${n.toFixed(1)}%`;

const titleCase = (s: string): string =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function footerFor(status: string): { label: string; tone: "green" | "amber" | "muted" } {
  switch (status) {
    case "ON_TRACK":        return { label: "✓ On Track",          tone: "green" };
    case "NEEDS_REAPPROVAL": return { label: "⚠ Needs Reapproval",  tone: "amber" };
    case "NEEDS_ATTENTION":  return { label: "⚠ Needs Attention",   tone: "amber" };
    default:                 return { label: `⚠ ${titleCase(status)}`, tone: "amber" };
  }
}

/* ─────────────────────────── Transformer ────────────────────────── */
export function transformSnapshots(json: SnapshotApiResponse): Snapshot[] {
  const items = Array.isArray(json?.items) ? json.items : [];

  return items.map((item): Snapshot => {
    const isFuture = item.snapshot_status === "FUTURE";

    const capexVar   = fmtVariance(item.capex_variance_pct);
    const opexVar     = fmtVariance(item.opex_variance_pct);
    const revenueVar  = fmtVariance(item.revenue_variance_pct);
    const totalVar     = fmtVariance(item.total_cost_variance_pct);
    const footer       = isFuture ? { label: "🔒 Future", tone: "muted" as const } : footerFor(item.review_status);

    return {
      proposalCode:  item.proposal_code ?? "",
      proposalTitle: item.proposal_title ?? "",
      title:      item.review_label,
      badge:      isFuture
                    ? item.period_label ? `🔒 ${item.period_label} · Future` : "🔒 Future"
                    : item.period_label ?? "",
      badgeTone:  isFuture ? "muted" : item.review_status === "ON_TRACK" ? "dark" : "amber",
      headerTone: isFuture ? "muted" : "dark",
      muted:      isFuture,
      lines: [
        {
          label: "CAPEX",
          value: fmtMoney(item.capex_spc_amount),
          actuals: isFuture ? "—" : fmtMoney(item.capex_actual_amount),
          variance: isFuture ? "—" : capexVar.text,
          varianceTone: isFuture ? "muted" : capexVar.tone,
          valueNum: item.capex_spc_amount,
          actualsNum: isFuture ? null : item.capex_actual_amount,
        },
        {
          label: "OPEX",
          value: fmtMoney(item.opex_spc_amount),
          actuals: isFuture ? "—" : fmtMoney(item.opex_actual_amount),
          variance: isFuture ? "—" : opexVar.text,
          varianceTone: isFuture ? "muted" : opexVar.tone,
          valueNum: item.opex_spc_amount,
          actualsNum: isFuture ? null : item.opex_actual_amount,
        },
        {
          label: "Revenue",
          value: fmtMoney(item.revenue_spc_amount),
          actuals: isFuture ? "—" : fmtMoney(item.revenue_actual_amount),
          variance: isFuture ? "—" : revenueVar.text,
          varianceTone: isFuture ? "muted" : revenueVar.tone,
          valueNum: item.revenue_spc_amount,
          actualsNum: isFuture ? null : item.revenue_actual_amount,
        },
      ],
      total:             fmtMoney(item.total_cost_spc_amount),
      totalActuals:      isFuture ? "—" : fmtMoney(item.total_cost_actual_amount),
      totalNum:          item.total_cost_spc_amount,
      totalActualsNum:   isFuture ? null : item.total_cost_actual_amount,
      totalVariance:     isFuture ? "—" : totalVar.text,
      totalVarianceTone: isFuture ? "muted" : totalVar.tone,
      benefit:           isFuture ? "—" : fmtPct(item.benefit_realisation_pct),
      footerLabel:       footer.label,
      footerTone:        footer.tone,
      milestoneDate:     item.milestone_date ?? "",
      status:            item.snapshot_status,
      reviewStatus:      item.review_status,
      investmentNum:     item.investment ?? null,
      pirStatus:         item.pir_status?.trim() || null,
      pirExecutiveSummary: item.pir_executive_summary?.trim() || null,
      pirLessonsLearned:   item.pir_lessons_learned?.trim() || null,
    };
  });
}

/* ─────────────────────────── URL helper ─────────────────────────── */
// proposal_id falls back to the value supplied in window.__APP_CONFIG__.
export const DEFAULT_PIR_PROPOSAL_ID = 354;

const SNAPSHOT_PATH = "/GIS/PIR/reportingPeriodicSnapshots";

export function buildSnapshotsUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${SNAPSHOT_PATH}`;
}

// A bearer token can be supplied for local-dev testing via either
// window.__APP_CONFIG__.dev_token (index.html) or the VITE_PIR_TOKEN env var.
function devToken(): string | undefined {
  const fromCfg =
    typeof window !== "undefined"
      ? (window as unknown as { __APP_CONFIG__?: { dev_token?: string } }).__APP_CONFIG__?.dev_token
      : undefined;
  const fromEnv = import.meta.env.DEV ? import.meta.env.VITE_PIR_TOKEN : undefined;
  return fromCfg || fromEnv;
}

/* ─────────────────────────── Network call ───────────────────────── */
export async function getPirSnapshots(
  cfg: AppConfig,
  proposalId?: number | string,
): Promise<Snapshot[]> {
  const raw = proposalId ?? cfg.proposal_id;
  // No proposal-id guard here: a missing/invalid id is sent through as the
  // literal "NULL" header, and the endpoint answers with the 6/12/24-month
  // template snapshots instead of 404ing — callers rely on that fallback.
  const proposalHeader = Number.isFinite(Number(raw)) && Number(raw) > 0 ? String(raw) : "NULL";
  const override = devToken();

  const token = override || extractToken(await fetchAuthToken(cfg));
  const url = buildSnapshotsUrl(cfg);
  const json = await fetchJson<SnapshotApiResponse>(url, token, undefined, { proposal_id: proposalHeader }, cfg);
  return transformSnapshots(json);
}

/* ─────────────────────────── Recapture (POST) ───────────────────── */
/**
 * Ask the backend to re-capture the periodic snapshots for a proposal.
 *
 * POST {api_endpoint}/GIS/PIR/reportingPeriodicSnapshots
 * Headers: proposal_id, force_recapture ("N" re-captures only what is due;
 * "Y" re-takes every milestone), plus the usual bearer / role / user_email.
 *
 * The proposal travels as a header. Responds `{"status":"S"}` on success; any other status is surfaced as
 * an error so the caller does not refresh on a silent failure.
 */
export type RecaptureResponse = { status?: string | null; message?: string | null };

export async function recapturePirSnapshots(
  cfg: AppConfig,
  proposalId?: number | string,
  forceRecapture: "Y" | "N" = "N",
): Promise<RecaptureResponse> {
  const raw = proposalId ?? cfg.proposal_id;
  if (!Number.isFinite(Number(raw)) || Number(raw) <= 0) {
    throw new Error("A valid proposal_id is required to re-capture snapshots");
  }

  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));

  const path = "/GIS/PIR/reportingPeriodicSnapshots";
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  const url = `${cfg.api_endpoint}${path}`;

  // role / user_email are required by ORDS (403 without them). fetchJson adds
  // them automatically, but this call uses fetch directly for the POST.
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    proposal_id: String(raw),
    force_recapture: forceRecapture,
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  console.log("[Snapshots] POST recapture", { url, proposal_id: raw, force_recapture: forceRecapture });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Request timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      throw new Error(
        reason instanceof Error || reason instanceof DOMException
          ? reason.message
          : "Request timed out after 5 minutes",
        { cause: err },
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[Snapshots] recapture failed", res.status, text);
    throw new Error(extractApiErrorMessage(text) || `HTTP ${res.status}: ${res.statusText}${text ? ` — ${text.slice(0, 300)}` : ""}`);
  }

  let json: RecaptureResponse;
  try {
    json = text.trim() ? (JSON.parse(text) as RecaptureResponse) : {};
  } catch {
    throw new Error(`Expected JSON from the recapture call but received: ${text.slice(0, 200)}`);
  }
  console.log("[Snapshots] recapture response", json);

  // Only "S" means the snapshots were written. Anything else must not trigger a
  // refresh, or the screen would silently re-read the same stale figures and
  // look as though the recapture had worked.
  if ((json.status ?? "").trim().toUpperCase() !== "S") {
    throw new Error(json.message || `Recapture returned status "${json.status ?? "(none)"}"`);
  }

  // Snapshots feed the report header, the PIR calendar and the snapshot cards —
  // refresh every region rather than this one.
  notifyDataChanged("POST reportingPeriodicSnapshots (recapture)");
  return json;
}
