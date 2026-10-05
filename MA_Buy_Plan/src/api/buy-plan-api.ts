/**
 * BuyPlanService
 * --------------
 * The M&A Buy Plan endpoints:
 *
 *   GET  {api}/GIS/MA/buyPlan              headers: proposal_id [, currency]
 *   POST {api}/GIS/MA/buyPlan/adjustment   body: BuyPlanAdjustmentPayload
 *
 * The GET is sent WITHOUT a `currency` header, so it answers both the local
 * (`*_local`) and USD (`*_usd`) figures in one call — one per table. Forecast,
 * Buy Plan and Variance all come from the server and are read-only; the only
 * write is an adjustment (a row the user added), POSTed once per fiscal year.
 */

import { requestJson } from "@/api/http";
import { getAppConfig } from "@/config/app-config";
import type {
  BuyPlanAdjustmentPayload,
  BuyPlanDataset,
  BuyPlanFyData,
  BuyPlanResponse,
  BuyPlanSectionView,
  CurrencySide,
  Figures,
  FyFigures,
} from "@/types";

export const BUY_PLAN_PATH = "/GIS/MA/buyPlan";
export const BUY_PLAN_ADJUSTMENT_PATH = "/GIS/MA/buyPlan/adjustment";

const FY_BUCKET = /^fy\d{2}$/i;

const fyNumber = (bucket: string) => Number(bucket.slice(2));

/** `fy26` -> 2026. */
export const fiscalYearOf = (bucket: string): number => 2000 + fyNumber(bucket);

/** Number, or null for anything absent / non-numeric. */
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const figuresOf = (data: BuyPlanFyData | null, side: CurrencySide): Figures =>
  side === "local"
    ? { forecast: num(data?.forecast_local), buyPlan: num(data?.buyplan_local), variance: num(data?.variance_local) }
    : { forecast: num(data?.forecast_usd), buyPlan: num(data?.buyplan_usd), variance: num(data?.variance_usd) };

/**
 * Fiscal years to show: the payload's list (or every bucket it carries),
 * chronological, starting at `first_fy_key` — earlier years precede the Buy
 * Plan and are not part of it.
 */
const visibleFiscalYears = (data: BuyPlanResponse): string[] => {
  const seen = new Set<string>();
  (data.fiscal_years ?? []).forEach((fy) => FY_BUCKET.test(fy) && seen.add(fy.toLowerCase()));
  if (seen.size === 0) {
    (data.sections ?? []).forEach((s) =>
      Object.keys(s.fy_data ?? {}).forEach((fy) => FY_BUCKET.test(fy) && seen.add(fy.toLowerCase()))
    );
  }
  const first = data.proposal_info?.first_fy_key?.toLowerCase();
  return [...seen]
    .filter((fy) => !first || !FY_BUCKET.test(first) || fyNumber(fy) >= fyNumber(first))
    .sort((a, b) => fyNumber(a) - fyNumber(b));
};

export const mapBuyPlan = (data: BuyPlanResponse): BuyPlanDataset => {
  const info = data.proposal_info;
  const sections: BuyPlanSectionView[] = (data.sections ?? []).map((section) => {
    const local: FyFigures = {};
    const usd: FyFigures = {};
    Object.entries(section.fy_data ?? {}).forEach(([bucket, fy]) => {
      if (!FY_BUCKET.test(bucket)) return;
      local[bucket.toLowerCase()] = figuresOf(fy, "local");
      usd[bucket.toLowerCase()] = figuresOf(fy, "usd");
    });
    return {
      code: section.section_code,
      label: section.section_label || section.section_code,
      sectionId: num(section.fin_eval_section_id),
      values: { local, usd },
    };
  });

  return {
    header: {
      proposalId: getAppConfig().proposal_id,
      title: info?.proposal_title ?? "Buy Plan",
      code: info?.proposal_code ?? null,
      targetYearEnd: info?.target_year_end ?? null,
      localCurrency: info?.currency_code ?? null,
      fxRate: num(info?.fx_rate),
    },
    fiscalYears: visibleFiscalYears(data),
    sections,
  };
};

export async function fetchBuyPlan(
  proposalId: number,
  signal?: AbortSignal
): Promise<BuyPlanDataset> {
  const data = await requestJson<BuyPlanResponse>("GET", BUY_PLAN_PATH, {
    headers: { proposal_id: proposalId },
    signal,
  });
  if (!data) throw new Error("Buy Plan response has no data.");
  return mapBuyPlan(data);
}

export async function createBuyPlanAdjustment(payload: BuyPlanAdjustmentPayload): Promise<void> {
  console.log("[buy-plan-api] POST", BUY_PLAN_ADJUSTMENT_PATH, payload);
  await requestJson("POST", BUY_PLAN_ADJUSTMENT_PATH, { body: payload });
}
