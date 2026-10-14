import type { BuyPlanHeaderInfo } from "@/types";

export default function BuyPlanHeader({ header }: { header: BuyPlanHeaderInfo }) {
  return (
    <div className="bp-header-card">
      <div className="bp-header-top">
        <div>
          <div className="bp-badge">
            GSPC BuyPlan{header.code ? ` — ${header.code}` : ""}
          </div>
          <h1 className="bp-title">{header.title}</h1>
          <div className="bp-subtitle">BuyPlan — GSPC Proforma Financials</div>
        </div>
      </div>
      <div className="bp-meta-row">
        {header.targetYearEnd && (
          <span>
            <strong>Y/E:</strong> {header.targetYearEnd}
          </span>
        )}
        {header.localCurrency && (
          <span>
            <strong>Local Currency:</strong> {header.localCurrency}
          </span>
        )}
        {header.fxRate !== null && header.localCurrency && header.localCurrency !== "USD" && (
          <span>
            <strong>FBR Rate:</strong> {header.fxRate} {header.localCurrency}/USD
          </span>
        )}
      </div>
    </div>
  );
}
