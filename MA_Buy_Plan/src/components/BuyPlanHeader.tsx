import type { BuyPlanHeaderInfo } from "@/types";

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function BuyPlanHeader({ header }: { header: BuyPlanHeaderInfo }) {
  const goLive = formatDate(header.plannedGoLive);
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
        {header.status && (
          <span>
            <strong>Status:</strong> {header.status}
          </span>
        )}
        {goLive && (
          <span>
            <strong>Planned Go-Live:</strong> {goLive}
          </span>
        )}
        <span>
          <strong>Local Currency:</strong> {header.localCurrency}
        </span>
      </div>
    </div>
  );
}
