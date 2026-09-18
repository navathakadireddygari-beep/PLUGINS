import React, { useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import type { ApiHeader } from "../api/financial-api";
import { applyScale, formatNumber, decimalsForScale, SCALES, formatDate, type Scale, type NumberFormatKey, type DateFormatKey } from "../lib/format";

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
  const decimals = decimalsForScale(scale);
  const raw    = `${formatNumber(abs, numberFormat, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return n < 0
    ? { text: `(${raw})`, negative: true }
    : { text: raw,        negative: false };
};

const fmtYears = (n: number | null | undefined): string =>
  n == null ? "—" : `${n} Year${n === 1 ? "" : "s"}`;

const fieldLabelStyle: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.3, marginBottom: 6, fontFamily: "inherit" };
const fieldInputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db", borderRadius: 6, padding: "9px 12px",
  fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none",
  width: 220, height: 38,
};

// Converts whatever date shape the API returns into the yyyy-mm-dd
// format required by a native <input type="date">.
const toDateInputValue = (v: string | null | undefined): string => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function KpiPanel({ rawHeader, onChange, displayScale, numberFormat, isReadonly }: Props): React.ReactElement {
  const dateInputRef = useRef<HTMLInputElement>(null);
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
              rawHeader.investment != null ? rawHeader.investment * kpiFxMultiplier : null,
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

      {/* ── Financial Parameters ── */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Financial Parameters</div>
        <div style={{ display: "flex", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={fieldLabelStyle}>Amortization Period (Months)</label>
            <input
              type="text"
              inputMode="numeric"
              value={rawHeader.amortization_period ?? ""}
              disabled={isReadonly}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "");
                onChange({ amortization_period: digits === "" ? 0 : Number(digits) });
              }}
              style={fieldInputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={fieldLabelStyle}>Date Placed in Service</label>
            <div
              style={{ ...fieldInputStyle, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: isReadonly ? "default" : "pointer" }}
              onClick={() => { if (!isReadonly) dateInputRef.current?.showPicker?.(); }}
            >
              <span>{formatDate(rawHeader.date_placed_in_service, "DMONY")}</span>
              <Calendar size={15} color="#6b7280" />
              <input
                ref={dateInputRef}
                type="date"
                value={toDateInputValue(rawHeader.date_placed_in_service)}
                disabled={isReadonly}
                onChange={(e) => onChange({ date_placed_in_service: e.target.value })}
                style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
