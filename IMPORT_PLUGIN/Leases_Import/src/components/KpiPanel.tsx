import React from "react";
import type { ApiHeader } from "../api/financial-api";
import { scaleDivisorFor, decimalsForScale, formatNumber, type ScaleKey, type NumberFormatKey } from "../lib/format";

type Props = {
  rawHeader: ApiHeader;
  onChange: (patch: Partial<ApiHeader>) => void;
  displayScale: ScaleKey;
  numberFormat: NumberFormatKey;
  fxMultiplier: number;
};

const PURPLE = "#7C3AED";
const GREEN  = "#178C45";
const ORANGE = "#F97316";

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

function fmtMoney(
  raw: number | null | undefined,
  symbol: string,
  fxMult: number,
  scale: ScaleKey,
  numberFormat: NumberFormatKey,
): string {
  if (raw == null) return "—";
  const v   = (raw * fxMult) / scaleDivisorFor(scale);
  const abs = Math.abs(v);
  const decimals  = decimalsForScale(scale);
  const formatted = formatNumber(abs, numberFormat, decimals);
  return `${symbol}${formatted}${scale}`;
}

export default function KpiPanel({ rawHeader, onChange, displayScale, numberFormat, fxMultiplier }: Props): React.ReactElement {
  void onChange;

  const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
  const symbol  = currencySymbol(display);
  const term    = rawHeader.lease_terms_years;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
        <div style={{ ...cardShell, borderLeftColor: GREEN }}>
          <div style={labelStyle}>Total Contract Value</div>
          <div style={valueStyle}>{fmtMoney(rawHeader.total_contract_value, symbol, fxMultiplier, displayScale, numberFormat)}</div>
          <div style={subStyle}>{term != null ? `${term}-Year Total` : "Total"}</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: PURPLE }}>
          <div style={labelStyle}>Total Lease Value</div>
          <div style={valueStyle}>{fmtMoney(rawHeader.total_lease_value, symbol, fxMultiplier, displayScale, numberFormat)}</div>
          <div style={subStyle}>{term != null ? `Over ${term} Years` : "Lease Value"}</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: ORANGE }}>
          <div style={labelStyle}>Terms</div>
          <div style={valueStyle}>{term != null ? `${term} Years` : "—"}</div>
          <div style={subStyle}>Lease Duration</div>
        </div>
      </div>
    </div>
  );
}
