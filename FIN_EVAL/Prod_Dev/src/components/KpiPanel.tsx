import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { computeDisplayMultiplier, type ApiHeader, type HurdleCheck } from "../api/financial-api";
import {
  scaleDivisorOf, scaleLabelOf, scaleDecimalsOf, groupNumber,
  formatDate, type NumberFormatId, type DateFormatId,
} from "../config/formats";

type Props = {
  rawHeader:    ApiHeader;
  onChange:     (patch: Partial<ApiHeader>) => void;
  displayScale: number;
  numberFormat: NumberFormatId;
  dateFormat:   DateFormatId;
  isReadonly:   boolean;
  fxRate:       number | null;
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
const fieldWrap:  React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, minWidth: 160 };
// nowrap so labels never wrap to a 2nd line and throw off row alignment across columns.
const fieldLabel: React.CSSProperties = { fontSize: 13, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" };
const fieldInput: React.CSSProperties = { padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, outline: "none", background: "#fff" };

// NPV arrives in thousands (K), like the table values. Divide down for M/B and
// append the scale suffix, grouped per the selected number format.
const fmtNpv = (
  n: number | null | undefined,
  scale: number,
  fmt: NumberFormatId,
): { text: string; negative: boolean } => {
  if (n == null) return { text: "—", negative: false };
  const v      = Math.abs(n) / scaleDivisorOf(scale);
  const raw    = `${groupNumber(v, fmt, scaleDecimalsOf(scale))}${scaleLabelOf(scale)}`;
  return n < 0
    ? { text: `(${raw})`, negative: true }
    : { text: raw,        negative: false };
};

const fmtPercent = (n: string | number | null | undefined): { text: string; negative: boolean } => {
  if (n == null || n === "") return { text: "—", negative: false };
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (!Number.isFinite(num)) return { text: String(n), negative: false };
  const negative = num < 0;
  const text = negative ? `(${Math.abs(num).toFixed(1)}%)` : `${num.toFixed(1)}%`;
  return { text, negative };
};

const fmtYears = (n: number | null | undefined): string =>
  n == null ? "—" : `${n} Year${n === 1 ? "" : "s"}`;

// ── Numeric input guards (block invalid keystrokes as the user types) ──
// Percent fields: 0–100 with up to 2 decimal places.
const isValidPercentInput = (s: string): boolean => {
  if (s === "") return true;
  if (!/^\d{0,3}(\.\d{0,2})?$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 100;
};
const clampPercent = (n: number): number =>
  Math.min(100, Math.max(0, Math.round(n * 100) / 100));

// Amortization period: whole months only, max 4 digits (0–9999), no decimals.
const isValidYearsInput = (s: string): boolean => s === "" || /^\d{0,4}$/.test(s);
const clampYears = (n: number): number =>
  Math.min(9999, Math.max(0, Math.trunc(n)));

export default function KpiPanel({ rawHeader, onChange, displayScale, numberFormat, dateFormat, isReadonly, fxRate }: Props): React.ReactElement {
  const pm = rawHeader.performance_metrics;
  const metrics: HurdleCheck[] = pm?.hurdle_checks ?? [];
  const dateInputRef = useRef<HTMLInputElement>(null);

  // In-progress text for guarded numeric fields, so partial entries like "12."
  // survive re-renders while the committed parent value stays a number.
  const [numDraft, setNumDraft] = useState<Record<string, string>>({});
  const guardedField = (
    key: keyof ApiHeader,
    rawValue: number | null | undefined,
    validate: (s: string) => boolean,
    clamp: (n: number) => number,
  ) => {
    const k     = key as string;
    const draft = numDraft[k];
    const shown = draft !== undefined ? draft : (rawValue ?? "");
    return {
      value: shown as string | number,
      readOnly: isReadonly,
      onChange: isReadonly ? undefined : (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (!validate(next)) return;                       // reject invalid keystroke
        setNumDraft((d) => ({ ...d, [k]: next }));
        onChange({ [key]: clamp(next === "" ? 0 : Number(next)) } as Partial<ApiHeader>);
      },
      onBlur: () => setNumDraft((d) => { const { [k]: _drop, ...rest } = d; return rest; }),
    };
  };

  const local   = (rawHeader.local_currency   || "USD").toUpperCase();
  const display = (rawHeader.display_currency || local).toUpperCase();

  // Default display currency: local currency when one is set, USD otherwise.
  // Only fills in the default when display_currency hasn't been chosen yet —
  // does not override a currency the user has already toggled.
  useEffect(() => {
    if (!rawHeader.display_currency) {
      onChange({ display_currency: local });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // KPI values (npv, irr, payback) from the API are always in USD.
  // fxRate (usd_fbr) means "1 USD = fxRate <local currency>" — multiply to
  // convert to local display. Falls back to ×1 when no live rate is available.
  const kpiFxMultiplier = computeDisplayMultiplier(display, local, fxRate);

  const updateHurdleValue = (idx: number, val: number) => {
    const updated = metrics.map((m, i) =>
      i === idx ? { ...m, hurdle_value: val } : m
    );
    onChange({ performance_metrics: { ...pm, hurdle_checks: updated } });
  };

  const statusPill = (pass: boolean | undefined) => {
    const ok = pass === true;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 999,
        background: ok ? "#dcfce7" : "#fee2e2",
        color: ok ? "#15803d" : "#b91c1c",
        fontSize: 12, fontWeight: 700,
      }}>
        {ok ? "✓" : "×"}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>

      {/* ── KPI cards ── */}
      <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
        <div style={{ ...cardShell, borderLeftColor: "#3B82F6" }}>
          <div style={labelStyle}>NPV</div>
          {(() => {
            const { text, negative } = fmtNpv(
              rawHeader.npv != null ? rawHeader.npv * kpiFxMultiplier : null,
              displayScale,
              numberFormat,
            );
            return <div style={{ ...valueStyle, color: negative ? "#DC2626" : "#111827" }}>{text}</div>;
          })()}
          <div style={subStyle}>Net Present Value</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: PURPLE }}>
          <div style={labelStyle}>IRR</div>
          {(() => { const { text, negative } = fmtPercent(rawHeader.irr_percent); return <div style={{ ...valueStyle, color: negative ? "#DC2626" : "#111827" }}>{text}</div>; })()}
          <div style={subStyle}>Internal Rate of Return</div>
        </div>
        <div style={{ ...cardShell, borderLeftColor: GREEN }}>
          <div style={labelStyle}>Payback Period</div>
          <div style={valueStyle}>{fmtYears(rawHeader.payback_period_years)}</div>
          <div style={subStyle}>Simple payback period</div>
        </div>
      </div>

      {/* ── Performance metrics ── */}
      {metrics.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
            Performance Against Key Metrics
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "40%" }} />
              <col />
              <col style={{ width: 120 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 60 }} />
            </colgroup>
            <thead>
              <tr style={{ fontSize: 10, color: "#6b7280", letterSpacing: 0.4 }}>
                <th style={{ textAlign: "left", padding: "6px 0" }}></th>
                <th></th>
                <th style={{ textAlign: "right", padding: "6px 12px" }}>HURDLE</th>
                <th style={{ textAlign: "right", padding: "6px 12px" }}>ACTUAL</th>
                <th style={{ textAlign: "center", padding: "6px 0" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 0", fontSize: 13, color: "#374151" }}>
                    {i + 1}. {m.label ?? "Metric"}
                  </td>
                  <td />
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {(() => {
                      const isReadOnly = isReadonly || i === 0 || i === 2;
                      return (
                        <input type="number" step="0.1"
                          value={m.hurdle_value ?? ""}
                          readOnly={isReadOnly}
                          onChange={isReadOnly ? undefined : (e) => updateHurdleValue(i, parseFloat(e.target.value) || 0)}
                          style={{
                            width: 80, textAlign: "right", fontSize: 13,
                            borderRadius: 4, padding: "4px 8px", outline: "none",
                            border: isReadOnly ? "1px solid #e5e7eb" : "1px solid #d1d5db",
                            background: isReadOnly ? "#f9fafb" : "#fff",
                            color: isReadOnly ? "#9ca3af" : "#374151",
                            cursor: isReadOnly ? "not-allowed" : "text",
                          }}
                        />
                      );
                    })()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                    {(() => { const { text, negative } = fmtPercent(m.actual_value); return <span style={{ color: negative ? "#DC2626" : GREEN }}>{text}</span>; })()}
                  </td>
                  <td style={{ padding: "10px 0", textAlign: "center" }}>
                    {statusPill(m.pass)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Financial parameters ── */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
          Financial Parameters
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {/* Columns stretch evenly when there's room (1fr) but never shrink below
            their label's natural width (max-content floor) — so labels never
            wrap and break row alignment; the wrapper above scrolls instead. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(max-content, 1fr))", gap: 12, minWidth: "100%" }}>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Hurdle Rate (%)</label>
            <input type="text" inputMode="decimal"
              style={{ ...fieldInput, background: isReadonly ? "#f3f4f6" : "#fff", cursor: isReadonly ? "default" : "text" }}
              {...guardedField("hurdle_rate_percent", rawHeader.hurdle_rate_percent, isValidPercentInput, clampPercent)}
            />
          </div>
          <div style={fieldWrap}>
            <label style={{ ...fieldLabel, display: "flex", alignItems: "center", gap: 4 }}>
              Discount Rate (%)
              <span id="discount_rate_info" style={{ color: "#A5005A", fontSize: 10, fontWeight: 700, cursor: "pointer", textDecoration: "underline", userSelect: "none" }}>(info)</span>
            </label>
            <input type="text" inputMode="decimal"
              style={{ ...fieldInput, background: isReadonly ? "#f3f4f6" : "#fff", cursor: isReadonly ? "default" : "text" }}
              {...guardedField("discount_rate_percent", rawHeader.discount_rate_percent, isValidPercentInput, clampPercent)}
            />
          </div>
          <div style={fieldWrap}>
            <label style={{ ...fieldLabel, display: "flex", alignItems: "center", gap: 4 }}>
              Share Repurchase (%)
              <span id="share_purchase_info" style={{ color: "#A5005A", fontSize: 10, fontWeight: 700, cursor: "pointer", textDecoration: "underline", userSelect: "none" }}>(info)</span>
            </label>
            <input type="text" inputMode="decimal"
              style={{ ...fieldInput, background: isReadonly ? "#f3f4f6" : "#fff", cursor: isReadonly ? "default" : "text" }}
              {...guardedField("share_repurchase_percent", rawHeader.share_repurchase_percent, isValidPercentInput, clampPercent)}
            />
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Amortization Period (Months)</label>
            <input type="text" inputMode="numeric"
              style={{ ...fieldInput, background: isReadonly ? "#f3f4f6" : "#fff", cursor: isReadonly ? "default" : "text" }}
              {...guardedField("amortization_period", rawHeader.amortization_period, isValidYearsInput, clampYears)}
            />
          </div>
          <div style={fieldWrap}>
            <label style={fieldLabel}>Date Placed in Service</label>
            {/* Display-only formatting: the value stored/sent to the API stays
                ISO (yyyy-mm-dd). A visible text field shows the chosen format;
                a transparent native date input on top provides the calendar. */}
            <div
              style={{ position: "relative" }}
              onClick={() => {
                const el = dateInputRef.current;
                if (!el || isReadonly) return;
                if (typeof el.showPicker === "function") el.showPicker();
                else el.focus();
              }}
            >
              <input type="text" readOnly
                value={formatDate(rawHeader.date_placed_in_service, dateFormat)}
                placeholder={dateFormat}
                style={{ ...fieldInput, width: "100%", boxSizing: "border-box", paddingRight: 32, background: isReadonly ? "#f3f4f6" : "#fff", cursor: isReadonly ? "default" : "pointer" }}
              />
              <Calendar
                size={16}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
              />
              {!isReadonly && (
                <input type="date"
                  ref={dateInputRef}
                  aria-label="Date Placed in Service"
                  value={rawHeader.date_placed_in_service ?? ""}
                  onChange={(e) => onChange({ date_placed_in_service: e.target.value })}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0, margin: 0 }}
                />
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
