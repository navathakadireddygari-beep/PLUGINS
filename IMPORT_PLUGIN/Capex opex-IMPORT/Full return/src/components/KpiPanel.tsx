import React, { useEffect } from "react";
import type { ApiHeader } from "../api/financial-api";
import { applyScale, decimalsForScale, formatNumber, SCALES, type Scale, type NumberFormatKey, type DateFormatKey } from "../lib/format";

type Props = {
  rawHeader:    ApiHeader;
  onChange:     (patch: Partial<ApiHeader>) => void;
  displayScale: Scale;
  numberFormat: NumberFormatKey;
  dateFormat:   DateFormatKey;
  isReadonly:   boolean;
};

const GREEN  = "#10B981";
const PURPLE = "#7C3AED";

const cardShell: React.CSSProperties = {
  flex: 1, background: "#fff", border: "1px solid #e5e7eb",
  borderRadius: 8, padding: "14px 16px", borderLeft: "4px solid transparent",
};
const labelStyle: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.3 };
const valueStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#111827", margin: "4px 0" };
const subStyle:   React.CSSProperties = { fontSize: 11, color: "#9ca3af" };

const fmtNpv = (
  n: number | null | undefined,
  scale: Scale,
  numberFormat: NumberFormatKey
): { text: string; negative: boolean } => {
  if (n == null) return { text: "—", negative: false };
  const scaled = applyScale(n, scale);
  const abs    = Math.abs(scaled);
  const suffix = SCALES.find((s) => s.value === scale)?.label ?? "";
  const raw    = `${formatNumber(abs, numberFormat, { minimumFractionDigits: decimalsForScale(scale), maximumFractionDigits: decimalsForScale(scale) })}${suffix}`;
  return n < 0
    ? { text: `(${raw})`, negative: true }
    : { text: raw,        negative: false };
};

const fmtYears = (n: number | null | undefined): string =>
  n == null ? "—" : `${n} Year${n === 1 ? "" : "s"}`;

export default function KpiPanel({ rawHeader, onChange, displayScale, numberFormat }: Props): React.ReactElement {
  const local   = (rawHeader.local_currency   || "USD").toUpperCase();
  const display = (rawHeader.display_currency || local).toUpperCase();
  const rate    = rawHeader.exchange_rate || 0.7350;

  // Always default display currency to USD on mount
  useEffect(() => {
    if (display !== "USD") {
      onChange({ display_currency: "USD" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // KPI values (npv, irr, payback) from the API are always in USD.
  // exchange_rate is stored as "1 CAD = X USD" (e.g. 0.735).
  // USD display → no conversion (×1).
  // CAD display → USD × (1/rate) = CAD (e.g. 100 USD × 1/0.735 = 136 CAD).
  const kpiFxMultiplier = display === "CAD" ? (1 / rate) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>

      {/* ── KPI cards ── */}
      <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
        <div style={{ ...cardShell, borderLeftColor: "#3B82F6" }}>
          <div style={labelStyle}>Total CAPEX Investment</div>
          {(() => {
            const { text, negative } = fmtNpv(
              rawHeader.total_capex_investment != null ? rawHeader.total_capex_investment * kpiFxMultiplier : null,
              displayScale,
              numberFormat,
            );
            return <div style={{ ...valueStyle, color: negative ? "#DC2626" : "#111827" }}>{text}</div>;
          })()}
          <div style={subStyle}>Total capital expenditure</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: PURPLE }}>
          <div style={labelStyle}>Annual OPEX</div>
          {(() => {
            const { text, negative } = fmtNpv(
              rawHeader.annual_opex != null ? rawHeader.annual_opex * kpiFxMultiplier : null,
              displayScale,
              numberFormat,
            );
            return <div style={{ ...valueStyle, color: negative ? "#DC2626" : "#111827" }}>{text}</div>;
          })()}
          <div style={subStyle}>Annual operating expenditure</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: GREEN }}>
          <div style={labelStyle}>Programme Term</div>
          <div style={valueStyle}>{fmtYears(rawHeader.investment_term_years)}</div>
          <div style={subStyle}>Programme duration</div>
        </div>
      </div>

    </div>
  );
}
