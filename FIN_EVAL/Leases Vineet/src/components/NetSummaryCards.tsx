import React from "react";
import type { ApiHeader } from "../api/financial-api";
import { formatScaledValue, type ScaleKey, type NumberFormatKey } from "../lib/format";

type Props = {
  rawHeader: ApiHeader;
  displayScale: ScaleKey;
  numberFormat: NumberFormatKey;
  fxMultiplier: number;
};

const cardShell: React.CSSProperties = {
  flex: "1 1 0",
  minWidth: 220,
  minHeight: 120,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "20px 25px 16px",
  borderLeft: "3px solid transparent",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "#334155",
  marginBottom: 8,
};

const valueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: "#08254A",
  margin: "14px 0 7px",
  lineHeight: 1.05,
};

const descStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
};

export default function NetSummaryCards({ rawHeader, displayScale, numberFormat, fxMultiplier }: Props): React.ReactElement {
  // The API returns these inside performance_metrics; the header-level fields
  // are kept as a fallback in case an older response shape turns up.
  const pm = rawHeader.performance_metrics;
  const totalNetSaving   = pm?.total_net_saving;
  const annualRentSaving = pm?.annual_rent_saving;
  const rentReductionPct = pm?.rent_reduction_pct;

  const formatMetric = (value: number | null | undefined, includeScaleSuffix = true): string => {
    if (value == null || value === 0) return "—";
    return formatScaledValue(value, numberFormat, displayScale, fxMultiplier, undefined, includeScaleSuffix, true);
  };

  // Percentages arrive as fractions (-0.0846 → 8.46%), so scale before display.
  const formatPercent = (value: number | null | undefined): string => {
    if (value == null || value === 0) return "—";
    return `${Math.abs(value * 100).toFixed(2)}%`;
  };

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0 24px 0" }}>
      {/* 5-Year Net Saving */}
      <div style={{ ...cardShell, borderLeftColor: "#16a34a" }}>
        <div style={labelStyle}>Net Saving</div>
        <div style={valueStyle}>{formatMetric(totalNetSaving)}</div>
        <div style={descStyle}>Total net across all cash flow lines</div>
      </div>

      {/* Annual Rent Saving */}
      <div style={{ ...cardShell, borderLeftColor: "#2563eb" }}>
        <div style={labelStyle}>Annual Rent Saving</div>
        <div style={valueStyle}>{formatMetric(annualRentSaving)}</div>
        <div style={descStyle}>Run-rate saving</div>
      </div>

      {/* Rent Reduction Percentage */}
      <div style={{ ...cardShell, borderLeftColor: "#9333ea" }}>
        <div style={labelStyle}>Rent Reduction</div>
        <div style={valueStyle}>{formatPercent(rentReductionPct)}</div>
        <div style={descStyle}>vs Current Site annual rent</div>
      </div>
    </div>
  );
}
