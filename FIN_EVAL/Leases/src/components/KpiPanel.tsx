import React from "react";
import type { ApiHeader } from "../api/financial-api";
import { formatCurrencyValue, type ScaleKey, type NumberFormatKey } from "../lib/format";

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

function fmtMoney(
  raw: number | null | undefined,
  symbol: string,
  fxMult: number,
  scale: ScaleKey,
  numberFormat: NumberFormatKey,
): string {
  return formatCurrencyValue(raw, symbol, numberFormat, scale, fxMult, undefined, true, true);
}

export default function KpiPanel({ rawHeader, onChange, displayScale, numberFormat, fxMultiplier }: Props): React.ReactElement {
  void onChange;

  const display = (rawHeader.display_currency || rawHeader.local_currency || "USD").toUpperCase();
  const symbol  = currencySymbol(display);
  const term    = rawHeader.lease_terms_years;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, margin: "0 0 16px 0" }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
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
