/**
 * BuyPlanService
 * --------------
 * The M&A Buy Plan endpoints:
 *
 *   GET  {api}/GIS/MA/buyPlan              headers: proposal_id [, currency]
 *   POST {api}/GIS/MA/buyPlan/adjustment   body: BuyPlanAdjustmentPayload
 *   PUT  {api}/proposalAuthoring/{proposal_id}/financialEvaluation
 *        body: { fin_eval_header_id, actual_acquisition_date }
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
export const financialEvaluationPath = (proposalId: number | string) =>
  `/proposalAuthoring/${encodeURIComponent(proposalId)}/financialEvaluation`;

const FY_BUCKET = /^fy\d{2}$/i;

const fyNumber = (bucket: string) => Number(bucket.slice(2));

/** `fy26` -> 2026. */
export const fiscalYearOf = (bucket: string): number => 2000 + fyNumber(bucket);

/** Number, or null for anything absent / non-numeric. */
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const figuresOf = (data: BuyPlanFyData | null, side: CurrencySide): Figures =>
  side === "local"
    ? {
        forecast: num(data?.forecast_local),
        buyPlan: num(data?.buyplan_local),
        variance: num(data?.variance_local),
        ebitMarginPct: num(data?.ebit_margin_pct),
      }
    : {
        forecast: num(data?.forecast_usd),
        buyPlan: num(data?.buyplan_usd),
        variance: num(data?.variance_usd),
        ebitMarginPct: num(data?.ebit_margin_pct),
      };

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
      actualAcquisitionDate: info?.actual_acquisition_date ?? data?.actual_acquisition_date ?? null,
      finEvalHeaderId: num(info?.fin_eval_header_id ?? data?.fin_eval_header_id),
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

/** Save the proposal's Actual Acquisition Date (ISO `yyyy-mm-dd`, or null to clear it). */
export async function updateActualAcquisitionDate(
  proposalId: number | string,
  finEvalHeaderId: number,
  actualAcquisitionDate: string | null
): Promise<void> {
  const payload = { fin_eval_header_id: finEvalHeaderId, actual_acquisition_date: actualAcquisitionDate };
  console.log("[Actual Acquisition Date] PUT URL:", financialEvaluationPath(proposalId));
  console.log("[Actual Acquisition Date] Request Payload:", payload);
  console.log("[Actual Acquisition Date] Request Payload JSON:", JSON.stringify(payload));
  await requestJson("PUT", financialEvaluationPath(proposalId), { headers: { language: "en" }, body: payload });
}

const MONTH_NUMBERS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** "dd-Mon-yyyy" -> "yyyy-mm-dd"; null for blank or unrecognised input. */
export function acquisitionDateToIso(value: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const month = MONTH_NUMBERS[match[2]];
  return month ? `${match[3]}-${month}-${match[1]}` : null;
}

/** ISO date from the server -> "dd-Mon-yyyy" for the date input; "—" when absent/invalid. */
export function formatAcquisitionDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  return `${day}-${month}-${date.getFullYear()}`;
}
