/**
 * BuyPlanService
 * --------------
 * Buy Plan lives on the M&A financial evaluation itself — the same endpoints
 * the Financial Evaluation screen uses (FIN_EVAL/MA/src/api/financial-api.ts):
 *
 *   GET {api}/GIS/proposalAuthoring/financialEvaluation?proposal_id=X
 *   PUT {api}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation
 *
 * Each line's `year_values.fyNN` bucket carries both the forecast
 * (`spc_projected_amount`) and the Buy Plan (`buy_plan_amount`). The PUT sends
 * only the edited sections' input lines, as `{ fin_eval_line_id, account,
 * year_values }` — the server recomputes the calculated lines (subtotals, EBIT,
 * margins) and the variances.
 *
 * Units: amounts are stored exactly as FIN_EVAL/MA stores them — USD, in
 * THOUSANDS. Currency conversion and K/M/B scaling happen only at display time
 * (lib/format), so nothing is converted here.
 */

import { requestJson } from "@/api/http";
import { getApiUserEmail, getAppConfig } from "@/config/app-config";
import type {
  BuyPlanDataset,
  BuyPlanGroup,
  BuyPlanRow,
  BuyPlanSavePayload,
  FinancialEvaluationResponse,
  FinEvalLine,
  FinEvalYearValue,
  FinEvalYearValues,
} from "@/types";

export const FINANCIAL_EVALUATION_PATH = "/GIS/proposalAuthoring/financialEvaluation";

export const financialEvaluationSavePath = (proposalId: number) =>
  `/GIS/proposalAuthoring/${proposalId}/financialEvaluation`;

/** Buy Plan edits: line key -> fiscal-year bucket -> base amount (null = cleared). */
export type BuyPlanEdits = Record<string, Record<string, number | null>>;

const FY_BUCKET = /^fy\d{2}$/i;

const byDisplayOrder = <T extends { display_order: number }>(a: T, b: T) =>
  (a.display_order ?? 0) - (b.display_order ?? 0);

const isActive = (item: { status?: string | null }) => item.status !== "INACTIVE";

/** Input lines are the only ones Buy Plan can be typed into (and saved). */
const isInputLine = (line: FinEvalLine) =>
  line.is_calculated !== "Y" && line.fin_eval_line_id != null;

/** EBIT Margin % and friends: percentages, not currency. */
const isPercentLine = (line: FinEvalLine) =>
  /(_PCT|_PERCENT)$/i.test(line.line_type ?? "") || line.line_item_name.includes("%");

/**
 * Group headings are fixed per section type (as in the wireframe), not taken
 * from the payload's `section_name`; unknown types fall back to that name.
 */
const SECTION_TITLE: Record<string, string> = {
  REVENUE: "Revenue",
  RETURNS_ANALYSIS: "EBIT",
};

/**
 * The Buy Plan shows ONLY Revenue and EBIT (EBIT + EBIT Margin % live in the
 * Returns Analysis section). Other sections (Costs, …) stay in the payload and
 * are echoed back on save, but are not rendered.
 */
const isVisibleSection = (section: { section_type: string }) =>
  section.section_type in SECTION_TITLE;

const lineKeyOf = (line: FinEvalLine) => String(line.fin_eval_line_id);

/** Every `fyNN` bucket present anywhere in the payload, chronologically. */
const collectFiscalYears = (items: FinancialEvaluationResponse): string[] => {
  const seen = new Set<string>();
  (items.sections ?? []).forEach((section) =>
    (section.lines ?? []).forEach((line) =>
      Object.keys(line.year_values ?? {}).forEach((key) => {
        if (FY_BUCKET.test(key)) seen.add(key.toLowerCase());
      })
    )
  );
  return [...seen].sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
};

const mapLine = (line: FinEvalLine): BuyPlanRow => {
  const values: BuyPlanRow["values"] = {};
  Object.entries(line.year_values ?? {}).forEach(([bucket, v]) => {
    if (!FY_BUCKET.test(bucket)) return;
    values[bucket.toLowerCase()] = {
      forecast: v?.spc_projected_amount ?? null,
      buyPlan: v?.buy_plan_amount ?? null,
    };
  });
  return {
    key: lineKeyOf(line),
    lineId: line.fin_eval_line_id,
    label: line.line_item_name,
    kind: isPercentLine(line) ? "percent" : "money",
    isCalculated: line.is_calculated === "Y",
    editable: isInputLine(line) && !isPercentLine(line),
    values,
  };
};

export const mapBuyPlan = (
  raw: FinancialEvaluationResponse | FinancialEvaluationResponse[]
): BuyPlanDataset => {
  // Some GIS endpoints answer `data.items` as a one-element array.
  const items = (Array.isArray(raw) ? raw[0] : raw) ?? ({} as FinancialEvaluationResponse);

  const groups: BuyPlanGroup[] = (items.sections ?? [])
    .filter(isActive)
    .filter(isVisibleSection)
    .sort(byDisplayOrder)
    .map((section, i) => ({
      id: String(section.fin_eval_section_id ?? `s${i}`),
      sectionId: section.fin_eval_section_id,
      title: SECTION_TITLE[section.section_type],
      rows: (section.lines ?? []).filter(isActive).sort(byDisplayOrder).map(mapLine),
    }))
    .filter((group) => group.rows.length > 0);

  return {
    header: {
      proposalId: items.proposal_id ?? null,
      title: items.proposal_title ?? "Buy Plan",
      code: items.proposal_code ?? null,
      status: items.proposal_status ?? null,
      plannedGoLive: items.planned_go_live_date ?? null,
      localCurrency: items.local_currency ?? null,
      displayCurrency: items.display_currency ?? null,
      exchangeRate: items.exchange_rate ?? null,
    },
    fiscalYears: collectFiscalYears(items),
    groups,
    raw: items,
  };
};

export async function fetchBuyPlan(
  proposalId: number,
  signal?: AbortSignal
): Promise<BuyPlanDataset> {
  // The evaluation sits under `data.items`, not `data` itself.
  const data = await requestJson<{
    items?: FinancialEvaluationResponse | FinancialEvaluationResponse[];
  }>("GET", FINANCIAL_EVALUATION_PATH, { params: { proposal_id: proposalId }, signal });
  if (!data?.items) throw new Error("Financial evaluation response has no data.items.");
  return mapBuyPlan(data.items);
}

const emptyYearValue = (): FinEvalYearValue => ({
  spc_projected_amount: null,
  ytd_budgeted_forecast: null,
  ytd_actuals: null,
  variance: null,
  buy_plan_amount: null,
  forecast_buyplan_variance: null,
});

/**
 * One line's buckets with the Buy Plan edits applied. Year buckets echo the
 * GET, with `buy_plan_amount` replaced and the (now stale) year variance
 * cleared for the server to recompute; `total` is re-summed.
 */
const applyBuyPlan = (
  line: FinEvalLine,
  edits: Record<string, number | null> | undefined
): FinEvalYearValues => {
  const source = line.year_values ?? {};
  const next: FinEvalYearValues = {};
  let total = 0;
  let hasTotal = false;

  const buckets = new Set([
    ...Object.keys(source).filter((b) => FY_BUCKET.test(b)),
    ...Object.keys(edits ?? {}),
  ]);
  [...buckets]
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)))
    .forEach((bucket) => {
      const existing = source[bucket] ?? emptyYearValue();
      const edited = edits !== undefined && bucket in edits;
      const amount = edited ? edits[bucket] : existing.buy_plan_amount;
      next[bucket] = {
        ...existing,
        buy_plan_amount: amount,
        forecast_buyplan_variance: edited ? null : existing.forecast_buyplan_variance,
      };
      if (amount !== null) {
        total += amount;
        hasTotal = true;
      }
    });

  const sourceTotal = source.total ?? emptyYearValue();
  const buyPlanTotal = hasTotal ? total : null;
  next.total = {
    ...sourceTotal,
    buy_plan_amount: buyPlanTotal,
    forecast_buyplan_variance:
      buyPlanTotal === null ? null : (sourceTotal.spc_projected_amount ?? 0) - buyPlanTotal,
  };
  return next;
};

/**
 * PUT body, built the way FIN_EVAL/MA builds its (working) save to this same
 * endpoint: the WHOLE evaluation the GET returned is echoed back, with the
 * caller identity (`user_email`, `proposal_id`, `fin_eval_header_id`) at the top
 * level and only the edited lines' `buy_plan_amount`s changed.
 *
 * A body holding just `{ sections: [{ fin_eval_section_id, lines }] }` answers
 * 500: the endpoint replaces the evaluation and has no caller to stamp it with.
 * Every section is sent — including those the Buy Plan screen does not show
 * (Costs) — so saving here never drops data the Financial Evaluation owns.
 * INACTIVE sections/lines are left out, as FIN_EVAL/MA leaves them out.
 */
export const buildBuyPlanPayload = (
  raw: FinancialEvaluationResponse,
  edits: BuyPlanEdits
): BuyPlanSavePayload => {
  const cfg = getAppConfig();
  const sections = (raw.sections ?? []).filter(isActive).map((section) => ({
    ...section,
    lines: (section.lines ?? []).filter(isActive).map((line) => {
      const lineEdits = isInputLine(line) ? edits[lineKeyOf(line)] : undefined;
      return lineEdits ? { ...line, year_values: applyBuyPlan(line, lineEdits) } : line;
    }),
  }));
  return {
    ...raw,
    fin_eval_header_id: raw.fin_eval_header_id ?? null,
    proposal_id: raw.proposal_id ?? cfg.proposal_id ?? null,
    user_email: getApiUserEmail() ?? "",
    sections,
  };
};

/** True when the edits touch at least one saveable (input) line. */
const hasSaveableEdits = (raw: FinancialEvaluationResponse, edits: BuyPlanEdits): boolean =>
  (raw.sections ?? []).some((section) =>
    (section.lines ?? []).some((line) => isInputLine(line) && !!edits[lineKeyOf(line)])
  );

export async function saveBuyPlan(
  raw: FinancialEvaluationResponse,
  edits: BuyPlanEdits,
  proposalId: number | null = getAppConfig().proposal_id ?? raw.proposal_id
): Promise<void> {
  if (!proposalId) throw new Error("No proposal id — cannot save the Buy Plan.");
  if (!hasSaveableEdits(raw, edits)) return;
  const payload = buildBuyPlanPayload(raw, edits);
  const path = financialEvaluationSavePath(proposalId);
  // The body is the only evidence of what was asked for if the next GET comes
  // back unchanged — log it, as the Financial Evaluation screen does.
  console.log("[buy-plan-api] PUT", path, payload);
  await requestJson("PUT", path, { body: payload });
}
