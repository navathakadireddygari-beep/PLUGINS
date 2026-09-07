import React from "react";
import type { ApiHeader } from "../api/financial-api";
import { formatNumber, decimalsForScale, type ScaleCode, type NumberFormatCode, SCALE_DIVISOR } from "../lib/value-format";

type Props = {
  rawHeader: ApiHeader;
  displayScale: ScaleCode;
  numberFormat: NumberFormatCode;
};

const cardShell: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "14px 16px",
  borderLeft: "4px solid transparent",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  fontWeight: 600,
  letterSpacing: 0.3,
};

const valueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
  margin: "4px 0",
};

const subStyle: React.CSSProperties = { fontSize: 11, color: "#9ca3af" };

const fmtAmount = (
  n: number | null | undefined,
  scale: ScaleCode,
  fxMultiplier: number,
  numberFormat: NumberFormatCode,
): { text: string; negative: boolean } => {
  if (n == null) return { text: "-", negative: false };
  const displayed = (n * fxMultiplier) / SCALE_DIVISOR[scale];
  if (!displayed) return { text: "—", negative: false };
  const formatted = `${formatNumber(Math.abs(displayed), numberFormat, decimalsForScale(scale))}${scale}`;
  return { text: displayed < 0 ? `(${formatted})` : formatted, negative: displayed < 0 };
};

const fmtYears = (n: number | null | undefined): string =>
  n == null ? "-" : `${n} Year${n === 1 ? "" : "s"}`;

export default function KpiPanel({ rawHeader, displayScale, numberFormat }: Props): React.ReactElement {
  const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
  const rate = rawHeader.exchange_rate || 0.7350;
  const kpiFxMultiplier = display === "CAD" ? (1 / rate) : 1;

  const totalInvestment = fmtAmount(rawHeader.investment, displayScale, kpiFxMultiplier, numberFormat);
  const annualCost = fmtAmount(
    rawHeader.annual_contract_cost ?? rawHeader.annual_contract_value,
    displayScale,
    kpiFxMultiplier,
    numberFormat,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
        <div style={{ ...cardShell, borderLeftColor: "#4ECDC4" }}>
          <div style={labelStyle}>Total Investment</div>
          <div style={{ ...valueStyle, color: totalInvestment.negative ? "#DC2626" : "#111827" }}>
            {totalInvestment.text}
          </div>
          <div style={subStyle}>Total contract value</div>
        </div>

        <div style={{ ...cardShell, borderLeftColor: "#3B6FB6" }}>
          <div style={labelStyle}>Annual Cost</div>
          <div style={{ ...valueStyle, color: annualCost.negative ? "#DC2626" : "#111827" }}>
            {annualCost.text}
          </div>
          <div style={subStyle}>Annual contract cost</div>
        </div>

        <div style={{ ...cardShell, borderLeftColor: "#8A0F8A" }}>
          <div style={labelStyle}>Investment Term</div>
          <div style={valueStyle}>{fmtYears(rawHeader.contract_duration ?? rawHeader.number_of_years)}</div>
          <div style={subStyle}>Contract duration</div>
        </div>
      </div>
    </div>
  );
}