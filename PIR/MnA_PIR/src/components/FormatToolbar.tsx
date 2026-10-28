/**
 * Display-format toolbar — sits directly under the tab bar and drives how every
 * amount and date on screen is rendered (see src/lib/format-settings.ts).
 *
 * CURRENCY comes from the financial header's local_currency/display_currency
 * (see setDisplayCurrency, fed from ForecastDashboard) — no conversion is
 * applied here.
 */
import type { ReactElement } from "react";
import {
  DATE_FORMATS,
  NUMBER_FORMATS,
  SCALES,
  setDateFormat,
  setNumberFormat,
  setScale,
  useDisplayCurrency,
  useFormatSettings,
  type DateFormatKey,
  type NumberFormatKey,
} from "../lib/format-settings";

function InfoIcon({ title }: { title: string }): ReactElement {
  return (
    <span className="pir-pd-fmt-info" tabIndex={0} role="img" aria-label={title} title={title}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <line x1="12" y1="7.5" x2="12" y2="7.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function FormatToolbar(): ReactElement {
  const settings = useFormatSettings();
  const currency = useDisplayCurrency();
  const scaleName = SCALES.find((s) => s.key === settings.scale)?.name ?? "";

  return (
    <div className="pir-pd-fmt-bar" role="group" aria-label="Display format">
      {/* ── Currency (display only) ─────────────────────────────── */}
      <div className="pir-pd-fmt-group">
        <span className="pir-pd-fmt-label">CURRENCY</span>
        <span className="pir-pd-fmt-chip">{`${currency.symbol} ${currency.code}`}</span>
        <InfoIcon title={`Amounts are shown in the proposal's display currency (${currency.code}). No conversion is applied.`} />
      </div>

      <span className="pir-pd-fmt-divider" aria-hidden="true" />

      {/* ── Scale ───────────────────────────────────────────────── */}
      <div className="pir-pd-fmt-group">
        <span className="pir-pd-fmt-label" id="pir-pd-fmt-scale-label">SCALE</span>
        <div className="pir-pd-fmt-segmented" role="group" aria-labelledby="pir-pd-fmt-scale-label">
          {SCALES.map((scale) => (
            <button
              key={scale.key}
              type="button"
              className={`pir-pd-fmt-seg ${settings.scale === scale.key ? "pir-pd-fmt-seg-active" : ""}`}
              onClick={() => setScale(scale.key)}
              aria-pressed={settings.scale === scale.key}
              title={`Show every amount in ${scale.name.toLowerCase()}`}
            >
              {scale.label}
            </button>
          ))}
        </div>
        <InfoIcon title={`Every amount across all tabs is divided down to ${scaleName.toLowerCase()} and suffixed ${settings.scale}. Percentages and year counts are never scaled.`} />
      </div>

      <span className="pir-pd-fmt-divider" aria-hidden="true" />

      {/* ── Number format ───────────────────────────────────────── */}
      <div className="pir-pd-fmt-group">
        <label className="pir-pd-fmt-label" htmlFor="pir-pd-fmt-number">NUMBER</label>
        <select
          id="pir-pd-fmt-number"
          className="pir-pd-fmt-select"
          value={settings.number}
          onChange={(e) => setNumberFormat(e.target.value as NumberFormatKey)}
        >
          {NUMBER_FORMATS.map((format) => (
            <option key={format.key} value={format.key}>{format.sample}</option>
          ))}
        </select>
      </div>

      <span className="pir-pd-fmt-divider" aria-hidden="true" />

      {/* ── Date format ─────────────────────────────────────────── */}
      <div className="pir-pd-fmt-group">
        <label className="pir-pd-fmt-label" htmlFor="pir-pd-fmt-date">DATE</label>
        <select
          id="pir-pd-fmt-date"
          className="pir-pd-fmt-select"
          value={settings.date}
          onChange={(e) => setDateFormat(e.target.value as DateFormatKey)}
        >
          {DATE_FORMATS.map((format) => (
            <option key={format.key} value={format.key}>{format.sample}</option>
          ))}
        </select>
      </div>

      <style>{`
        .pir-pd-fmt-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          /* Aligns with .pir-pd-tab-panel's 8px padding, so the bar lines up
             with the cards below it rather than sitting flush to the edge. */
          margin: 8px 8px 0;
          padding: 10px 18px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(29, 38, 51, 0.05);
        }

        .pir-pd-fmt-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pir-pd-fmt-label {
          color: #1D2C4D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
        }

        .pir-pd-fmt-divider {
          width: 1px;
          height: 24px;
          background: #e6e9ee;
        }

        /* Display-only currency chip — deliberately not a button */
        .pir-pd-fmt-chip {
          display: inline-flex;
          align-items: center;
          height: 30px;
          padding: 0 14px;
          border-radius: 6px;
          background: #1D2C4D;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .pir-pd-fmt-segmented {
          display: inline-flex;
          border: 1px solid #d5dbe7;
          border-radius: 6px;
          overflow: hidden;
        }

        .pir-pd-fmt-seg {
          min-width: 38px;
          height: 30px;
          padding: 0 12px;
          border: 0;
          border-right: 1px solid #d5dbe7;
          background: #ffffff;
          color: #1D2C4D;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .pir-pd-fmt-seg:last-child { border-right: 0; }

        .pir-pd-fmt-seg:hover:not(.pir-pd-fmt-seg-active) {
          background: #dde2ec69;
        }

        .pir-pd-fmt-seg-active {
          background: #1D2C4D;
          color: #ffffff;
        }

        .pir-pd-fmt-select {
          height: 30px;
          min-width: 130px;
          padding: 0 8px;
          border: 1px solid #d5dbe7;
          border-radius: 6px;
          background: #ffffff;
          color: #1D2C4D;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-fmt-select:focus {
          outline: none;
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(157, 183, 232, 0.22);
        }

        .pir-pd-fmt-info {
          display: inline-flex;
          align-items: center;
          color: #9aa3b2;
          cursor: help;
        }

        .pir-pd-fmt-info:hover,
        .pir-pd-fmt-info:focus { color: #1D2C4D; }
      `}</style>
    </div>
  );
}
