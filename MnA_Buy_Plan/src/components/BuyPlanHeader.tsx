import type { BuyPlanHeaderInfo } from "@/types";

type Props = {
  header: BuyPlanHeaderInfo;
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

export default function BuyPlanHeader({ header, dirty, saving, canSave, onSave }: Props) {
  return (
    <div className="bp-header-card">
      <div className="bp-header-top">
        <div className="bp-header-main">
          <div className="bp-badge">
            GSPC BuyPlan{header.code ? ` — ${header.code}` : ""}
          </div>
          <h1 className="bp-title">{header.title}</h1>
          <div className="bp-subtitle">BuyPlan — GSPC Proforma Financials</div>
        </div>
        <button
          type="button"
          className="bp-btn bp-btn--save bp-header-save"
          onClick={onSave}
          disabled={!canSave || !dirty || saving}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {saving ? "Saving…" : "Save"}
        </button>
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
