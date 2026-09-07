import React from "react";
import type { ApiHeader } from "../api/financial-api";
import { formatNumber, SCALE_DECIMALS, type ScaleCode, type NumberFormatCode, SCALE_DIVISOR } from "../lib/value-format";

type Props = {
  rawHeader: ApiHeader;
  displayScale: ScaleCode;
  numberFormat: NumberFormatCode;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", CAD: "$", EUR: "€", GBP: "£", AUD: "A$", JPY: "¥", SGD: "$", INR: "₹", CNY: "¥",
};
const currencyPrefix = (code: string): string => CURRENCY_SYMBOLS[code.toUpperCase()] ?? `${code.toUpperCase()} `;

const cardShell: React.CSSProperties = {
  flex: "1 1 0",
  minWidth: 240,
  height: 114,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "16px 18px",
  borderLeft: "4px solid transparent",
  boxShadow: "0 8px 18px rgba(15,23,42,.08)",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 600,
  letterSpacing: 1.2,
};

const valueStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: "#0f1f3d",
  margin: "10px 0 6px",
  lineHeight: 1,
};

const subStyle: React.CSSProperties = { fontSize: 14, color: "#9ca3af" };

const fmtAmount = (
  n: number | null | undefined,
  scale: ScaleCode,
  fxMultiplier: number,
  numberFormat: NumberFormatCode,
  currencyCode: string,
): { text: string; negative: boolean } => {
  if (n == null) return { text: "-", negative: false };
  const displayed = (n * fxMultiplier) / SCALE_DIVISOR[scale];
  if (!displayed) return { text: "—", negative: false };
  const formatted = `${currencyPrefix(currencyCode)}${formatNumber(Math.abs(displayed), numberFormat, SCALE_DECIMALS[scale])}${scale}`;
  return { text: displayed < 0 ? `(${formatted})` : formatted, negative: displayed < 0 };
};

const fmtYears = (n: number | null | undefined): string =>
  n == null ? "-" : `${n} Year${n === 1 ? "" : "s"}`;

export default function KpiPanel({ rawHeader, displayScale, numberFormat }: Props): React.ReactElement {
  const local = (rawHeader.local_currency || "").trim().toUpperCase();
  const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
  // exchange_rate (usd_fbr): 1 USD = exchange_rate local — multiply USD by it to get local.
  const rate = rawHeader.exchange_rate || 1;
  const kpiFxMultiplier = local && display === local && display !== "USD" ? rate : 1;

  const totalInvestment = fmtAmount(rawHeader.investment, displayScale, kpiFxMultiplier, numberFormat, display);
  const annualCost = fmtAmount(
    rawHeader.annual_cost ?? rawHeader.annual_contract_cost ?? rawHeader.annual_contract_value,
    displayScale,
    kpiFxMultiplier,
    numberFormat,
    display,
  );

  return (
    <div style={{ display: "flex", gap: 24, margin: "16px 0 26px", flexWrap: "wrap", width: "100%" }}>
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
        <div style={valueStyle}>{fmtYears(rawHeader.investment_term_years ?? rawHeader.contract_duration ?? rawHeader.number_of_years)}</div>
        <div style={subStyle}>Contract duration</div>
      </div>
    </div>
  );
}
