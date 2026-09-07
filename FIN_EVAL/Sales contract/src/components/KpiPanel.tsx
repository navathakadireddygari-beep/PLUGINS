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
  flex: "1 1 0",
  minWidth: 220,
  minHeight: 120,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "20px 25px 16px",
  borderLeft: "3px solid transparent",
};
const labelStyle: React.CSSProperties = { fontSize: 11, color: "#334155", fontWeight: 500 };
const valueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: "#08254A", margin: "14px 0 7px", lineHeight: 1.05 };
const subStyle:   React.CSSProperties = { fontSize: 11, color: "#94a3b8" };

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
// Decimal places shown at each scale: K → 0, M → 1, B → 2 (matches Table.scaleDecimals).
function scaleUnit(scale: number): { divisor: number; suffix: string; decimals: number } {
  if (scale === 1_000_000_000) return { divisor: 1_000_000, suffix: "B", decimals: 2 };
  if (scale === 1_000_000)     return { divisor: 1_000,     suffix: "M", decimals: 1 };
  return { divisor: 1, suffix: "K", decimals: 0 };
}

function fmtMoney(
  raw: number | null | undefined,
  symbol: string,
  fxMult: number,
  scale: number,
  numFmt: NumFmtSpec,
): string {
  if (raw == null) return "—";
  const { divisor, suffix, decimals } = scaleUnit(scale);
  const v = (raw * fxMult) / divisor;
  return `${symbol}${formatNumber(v, numFmt, decimals)}${suffix}`;
}

function fmtPercent(raw: number | null | undefined): string {
  if (raw == null) return "—";
  return `${Math.round(raw)}%`;
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
          <div style={valueStyle}>{fmtPercent(rawHeader.contribution_margin_percent)}</div>
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
