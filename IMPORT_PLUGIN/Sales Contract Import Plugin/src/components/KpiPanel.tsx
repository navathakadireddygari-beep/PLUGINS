import React from "react";
import type { ApiHeader } from "../api/financial-api";
import { formatNumber, type NumFmtSpec } from "./number-format";

type Props = {
  rawHeader: ApiHeader;
  onChange: (patch: Partial<ApiHeader>) => void;
  displayScale: number;
  fxMultiplier: number;
  numFmt: NumFmtSpec;
};

const PURPLE  = "#7C3AED";
const NAVY    = "#0F2A4D";
const MAGENTA = "#8A0F87";
const GREEN   = "#178C45";

const cardShell: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "14px 16px",
  borderLeft: "4px solid transparent",
};
const labelStyle: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.3 };
const valueStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: "#111827", margin: "4px 0" };
const subStyle:   React.CSSProperties = { fontSize: 11, color: "#9ca3af" };

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "$", AUD: "A$", JPY: "¥", SGD: "$", INR: "₹", CNY: "¥",
};

function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[(code || "").toUpperCase()] ?? code;
}

// API values are already stored in thousands (K), so at K we show them as-is
// and only M/B divide further (divisor = scale / 1,000). The K/M/B letter is
// appended. This matches the grid (Table.scaleDivisor) so cards and table agree
// — e.g. a stored 20,000 shows the same magnitude in both:
//   K → ÷1         , "K"   (20,000 → "20,000K")
//   M → ÷1,000     , "M"   (20,000 → "20M")
//   B → ÷1,000,000 , "B"   (20,000 → "0.02B")
function scaleUnit(scale: number): { divisor: number; suffix: string } {
  if (scale === 1_000_000_000) return { divisor: 1_000_000, suffix: "B" };
  if (scale === 1_000_000)     return { divisor: 1_000,     suffix: "M" };
  return { divisor: 1, suffix: "K" };
}

// Decimal places shown depend on the active scale: K = whole numbers,
// M = 1 decimal, B = 2 decimals.
function decimalsForScale(scale: number): number {
  if (scale === 1_000_000_000) return 2;
  if (scale === 1_000_000)     return 1;
  return 0;
}

function fmtMoney(
  raw: number | null | undefined,
  symbol: string,
  fxMult: number,
  scale: number,
  numFmt: NumFmtSpec,
): string {
  if (raw == null) return "—";
  const { divisor, suffix } = scaleUnit(scale);
  const v = (raw * fxMult) / divisor;
  return `${symbol}${formatNumber(v, numFmt, decimalsForScale(scale))}${suffix}`;
}

function fmtPercent(raw: number | null | undefined, numFmt: NumFmtSpec, scale: number): string {
  if (raw == null) return "—";
  return `${raw.toFixed(decimalsForScale(scale)).replace(".", numFmt.decimal)}%`;
}

export default function KpiPanel({ rawHeader, onChange, displayScale, fxMultiplier, numFmt }: Props): React.ReactElement {
  void onChange;

  const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
  const symbol  = currencySymbol(display);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, margin: "0 0 16px 0" }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...cardShell, borderLeftColor: GREEN }}>
          <div style={labelStyle}>Total Contract Value</div>
          <div style={valueStyle}>{fmtMoney(rawHeader.total_contract_value, symbol, fxMultiplier, displayScale, numFmt)}</div>
          <div style={subStyle}>TCV</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: NAVY }}>
          <div style={labelStyle}>Annual Contract Value</div>
          <div style={valueStyle}>{fmtMoney(rawHeader.annual_contract_value, symbol, fxMultiplier, displayScale, numFmt)}</div>
          <div style={subStyle}>ACV</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: MAGENTA }}>
          <div style={labelStyle}>Margin</div>
          <div style={valueStyle}>{fmtPercent(rawHeader.contribution_margin_percent, numFmt, displayScale)}</div>
          <div style={subStyle}>Contribution Margin %</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: PURPLE }}>
          <div style={labelStyle}>Contract Duration</div>
          <div style={valueStyle}>{rawHeader.contract_duration ?? rawHeader.number_of_years ?? "—"}</div>
          <div style={subStyle}>Years</div>
        </div>
      </div>
    </div>
  );
}
