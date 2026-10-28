/**
 * Unmapped Datalake transactions — actuals extracted against the SPC project
 * codes that have NOT yet been mapped to any CAPEX / OPEX / Revenue line.
 *
 * Endpoint: GET {api_endpoint}/GIS/PIR/unmappedTrx
 * Headers:  proposal_id, section_id, fiscal_year
 *
 * `fiscal_year` is bound as a NUMBER — sending "fy26" fails with 400, so the
 * report's fy key is converted to its full year (fy26 → 2026).
 *
 * Live in APEX (Bearer token); in dev routes through the Vite "/api" proxy with
 * an optional dev token (same auth flow as the other PIR endpoints).
 */
import { authContextHeaders, type AppConfig } from "../config/app-config";
import { fetchAuthToken, extractToken } from "./auth-api";
import { fetchJson, REQUEST_TIMEOUT_MS, extractApiErrorMessage } from "../lib/http";
import { notifyDataChanged } from "../lib/refresh-bus";

/* ─────────────────────────── Wire types ─────────────────────────── */
// The ORDS responses in this API mix space-separated and underscored keys, so
// every field is read through `pick` with the plausible spellings.
export type UnmappedItem = Record<string, unknown>;

export type UnmappedResponse = {
  items?: UnmappedItem[];
  count?: number;
  hasMore?: boolean;
};

/* ─────────────────────────── UI-side type ───────────────────────── */
export type UnmappedRow = {
  id: string;
  month: string;
  gl: string;
  desc: string;
  amount: number;
  scenario: string;
  /** Originating document, e.g. "AP Invoice #INV-45102". */
  source: string;
};

/* ─────────────────────────── Transformer ────────────────────────── */
const str = (v: unknown): string => (v == null ? "" : String(v));

const pick = (o: UnmappedItem, ...keys: string[]): unknown => {
  for (const k of keys) if (o[k] != null) return o[k];
  return undefined;
};

export function transformUnmapped(json: UnmappedResponse): UnmappedRow[] {
  return (json?.items ?? []).map((it, i) => {
    const amount = pick(it, "amount", "AMOUNT");
    return {
      id:     str(pick(it, "id", "trx_id", "transaction_id", "ID")) || `U${String(i + 1).padStart(3, "0")}`,
      month:  str(pick(it, "month", "MONTH")),
      gl:     str(pick(it, "gl account", "gl_account", "gl_string", "GL_ACCOUNT")),
      // "gl description" comes back null on live rows — the readable text sits
      // in `description`, same as the actuals drilldown.
      desc:   str(pick(it, "gl description", "gl_description", "description", "DESCRIPTION")),
      amount: typeof amount === "number" ? amount : Number(amount) || 0,
      scenario: str(pick(it, "scenario", "scenerio", "SCENARIO")) || "Actual",
      source: str(pick(it, "source", "source_document", "SOURCE")),
    };
  });
}

/* ─────────────────────────── URL / token helpers ────────────────── */
const UNMAPPED_PATH = "/GIS/PIR/unmappedTrx";

// Always the real ORDS endpoint — see actual-drilldown-api.ts for why the
// local dev proxy branch was dropped.
export function buildUnmappedUrl(cfg: AppConfig): string {
  if (!cfg.api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__");
  return `${cfg.api_endpoint}${UNMAPPED_PATH}`;
}

/** "fy26" / "FY26" / 2026 → 2026. Null when it can't be resolved. */
export function toFullFiscalYear(fy: number | string | null | undefined): number | null {
  const n = parseInt(String(fy ?? "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  return n < 100 ? 2000 + n : n;
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
export async function getUnmappedTransactions(
  cfg: AppConfig,
  sectionId?: number | string | null,
  fiscalYear?: number | string | null,
  proposalId?: number | string,
): Promise<UnmappedRow[]> {
  const raw = proposalId ?? cfg.proposal_id;
  const override = devToken();

  const token = override || extractToken(await fetchAuthToken(cfg));
  const url = buildUnmappedUrl(cfg);
  const headers = {
    proposal_id: Number.isFinite(Number(raw)) && Number(raw) > 0 ? raw : undefined,
    section_id:  sectionId != null && sectionId !== "" ? sectionId : undefined,
    // Bound as a NUMBER server-side — "fy26" is rejected with 400.
    fiscal_year: toFullFiscalYear(fiscalYear) ?? undefined,
  };
  const json = await fetchJson<UnmappedResponse>(url, token, undefined, headers, cfg);
  console.log("[UnmappedTrx] request", { url, headers });
  console.log("[UnmappedTrx] response", json);
  return transformUnmapped(json);
}

/* ─────────────────── Map unmapped rows onto a line ──────────────── */
/**
 * POST {api_endpoint}/GIS/PIR/unmappedTrx
 *
 * Maps one or more datalake transactions onto a financial-evaluation line. The
 * transactions are sent in full (period, GL string, Dr/Cr, amount, source doc)
 * rather than by id, so the backend can record them against the target line.
 */
export type UnmappedMappingTransaction = {
  yearperiod:      number;
  gl_string:       string;
  dr_cr:           "DR" | "CR";
  amount:          number;
  source_document: string;
};

export type UnmappedMappingPayload = {
  proposal_id:         number;
  fin_eval_section_id: number | null;
  fin_eval_line_id:    number | string | null;
  mapping_comment:     string;
  transactions:        UnmappedMappingTransaction[];
};

export async function postUnmappedMapping(
  cfg: AppConfig,
  payload: UnmappedMappingPayload,
): Promise<void> {
  const override = devToken();
  const token = override || extractToken(await fetchAuthToken(cfg));

  // role / user_email are required by ORDS (403 without them). fetchJson adds
  // them automatically, but this call uses fetch directly for the POST body.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  for (const [key, value] of Object.entries(authContextHeaders(cfg))) {
    if (value != null) headers[key] = String(value);
  }

  const url = buildUnmappedUrl(cfg);
  console.log("[UnmappedTrx] POST", url);
  console.log("[UnmappedTrx] POST body\n" + JSON.stringify(payload, null, 2));

  // Same five-minute budget as every other call — this POST previously had no
  // timeout at all and could hang until the browser gave up.
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Request timed out after 5 minutes", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
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

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[UnmappedTrx] POST failed", res.status, detail);
    throw new Error(extractApiErrorMessage(detail) || `HTTP ${res.status}: ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  console.log("[UnmappedTrx] POST ok", res.status);
  // Mapping moves transactions onto a line: the unmapped list, the drilldown
  // and every rollup above it change — refresh every API.
  notifyDataChanged("POST unmappedTrx");
}
