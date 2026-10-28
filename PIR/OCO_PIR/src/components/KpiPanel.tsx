import React from "react";
import type { ApiHeader } from "../api/financial-api";

/**
 * KPI panel rendered above the pivot table.
 * All values come from the GET API (rawHeader). Financial Parameters are
 * editable and flow back into `rawHeader` so Save persists them via PUT.
 */
type Metric = {
  name?:   string;
  label?:  string;
  hurdle?: string | number | null;
  actual?: string | number | null;
  status?: string | boolean | null;
};

type Props = {
  rawHeader: ApiHeader;
  onChange:  (patch: Partial<ApiHeader>) => void;
};

const BRAND_BG   = "#dde2ec69";
const BRAND_TEXT = "#1D2C4D";
const GREEN  = "#10B981";
const PURPLE = "#7C3AED";

const cardShell: React.CSSProperties = {
  flex: 1, background: "#fff", border: "1px solid #e5e7eb",
  borderRadius: 8, padding: "14px 16px", borderLeft: "4px solid transparent",
};

const labelStyle: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.3 };
const valueStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#111827", margin: "4px 0" };
const subStyle:   React.CSSProperties = { fontSize: 11, color: "#9ca3af" };

const fieldWrap:  React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 };
const fieldLabel: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600 };
const fieldInput: React.CSSProperties = { padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12, outline: "none", background: "#fff" };

const fmtMoney = (n: number | null | undefined): string => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString("en-US")}`;
};

const fmtPercent = (n: string | number | null | undefined): string => {
  if (n == null || n === "") return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return Number.isFinite(num) ? `${num.toFixed(1)}%` : String(n);
};

const fmtYears = (n: number | null | undefined): string =>
  n == null ? "—" : `${n} Year${n === 1 ? "" : "s"}`;

export default function KpiPanel({ rawHeader, onChange }: Props): React.ReactElement {
  const metrics: Metric[] = Array.isArray(rawHeader.performance_metrics)
    ? (rawHeader.performance_metrics as Metric[])
    : [];

  const statusPill = (s: Metric["status"]) => {
    const ok = s === true || s === "Y" || s === "PASS" || s === "SUCCESS" || s === "S";
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 22, height: 22, borderRadius: 999,
          background: ok ? "#dcfce7" : "#fee2e2",
          color: ok ? "#15803d" : "#b91c1c",
          fontSize: 12, fontWeight: 700,
        }}
      >
        {ok ? "✓" : "×"}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
      {/* Display currency strip */}
      <div style={{ background: "#f3f4f6", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.4 }}>DISPLAY CURRENCY</span>
        <span style={{ background: BRAND_BG, color: BRAND_TEXT, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 4 }}>
          {rawHeader.display_currency || rawHeader.local_currency || "—"}
        </span>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...cardShell, borderLeftColor: "#3B82F6" }}>
          <div style={labelStyle}>NPV</div>
          <div style={valueStyle}>{fmtMoney(rawHeader.npv)}</div>
          <div style={subStyle}>Net Present Value</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: PURPLE }}>
          <div style={labelStyle}>IRR</div>
          <div style={valueStyle}>{fmtPercent(rawHeader.irr_percent)}</div>
          <div style={subStyle}>Internal Rate of Return</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: GREEN }}>
          <div style={labelStyle}>Payback Period</div>
          <div style={valueStyle}>{fmtYears(rawHeader.payback_period_years)}</div>
          <div style={subStyle}>Simple payback period</div>
        </div>
      </div>

      {/* Performance metrics */}
      {metrics.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
            Performance Against Key Metrics
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: 10, color: "#6b7280", letterSpacing: 0.4 }}>
                <th style={{ textAlign: "left",  padding: "6px 0" }}></th>
                <th style={{ textAlign: "right", padding: "6px 12px" }}>HURDLE</th>
                <th style={{ textAlign: "right", padding: "6px 12px" }}>ACTUAL</th>
                <th style={{ textAlign: "center", padding: "6px 0", width: 60 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 0", fontSize: 12, color: "#374151" }}>
                    {i + 1}. {m.name ?? m.label ?? "Metric"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#374151" }}>
                    {fmtPercent(m.hurdle)}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: GREEN, fontWeight: 600 }}>
                    {fmtPercent(m.actual)}
                  </td>
                  <td style={{ padding: "10px 0", textAlign: "center" }}>
                    {statusPill(m.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial parameters — editable */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
          Financial Parameters
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Hurdle Rate (%)</label>
            <input
              type="number" step="0.1" style={fieldInput}
              value={rawHeader.hurdle_rate_percent ?? ""}
              onChange={(e) => onChange({ hurdle_rate_percent: Number(e.target.value) })}
            />
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Discount Rate (%)</label>
            <input
              type="number" step="0.1" style={fieldInput}
              value={rawHeader.discount_rate_percent ?? ""}
              onChange={(e) => onChange({ discount_rate_percent: Number(e.target.value) })}
            />
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Share Repurchase (%)</label>
            <input
              type="number" step="0.1" style={fieldInput}
              value={rawHeader.share_repurchase_percent ?? ""}
              onChange={(e) => onChange({ share_repurchase_percent: Number(e.target.value) })}
            />
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Amortization Period (Years)</label>
            <input
              type="number" step="1" style={fieldInput}
              value={rawHeader.amortisation_period_years ?? ""}
              onChange={(e) => onChange({ amortisation_period_years: Number(e.target.value) })}
            />
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Date Placed in Service</label>
            <input
              type="date" style={fieldInput}
              value={rawHeader.date_placed_in_service ?? ""}
              onChange={(e) => onChange({ date_placed_in_service: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
