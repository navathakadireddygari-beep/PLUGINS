import { useState } from "react";
import CurrencyToggle from "@/components/CurrencyToggle";
import FxCard from "@/components/FxCard";
import NumberFormatToolbar from "@/components/NumberFormatToolbar";
import { useCurrencyFormat } from "@/context/CurrencyFormatContext";
import { stripCard, stripDivider, stripRow } from "@/components/strip-styles";

type Props = {
  dirty: boolean;
  saving: boolean;
  error: string | null;
  onDiscard: () => void;
  /** "dd-Mon-yyyy", or "" when no date is set. */
  actualAcquisitionDate: string;
  onActualAcquisitionDateChange: (value: string) => void;
  dateDirty: boolean;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type CalendarProps = {
  value: string;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  onSelect: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
};

/** Month-grid date picker; selecting a day yields "dd-Mon-yyyy". */
function BpCalendarPopup({ value, viewDate, setViewDate, onSelect, onClear, onClose }: CalendarProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(<span key={`empty-${i}`} className="bp-cal-empty" />);
  for (let day = 1; day <= daysInMonth; day++) {
    const formatted = `${String(day).padStart(2, "0")}-${MONTH_ABBR[month]}-${year}`;
    cells.push(
      <button
        key={`day-${day}`}
        type="button"
        className={`bp-cal-day ${value === formatted ? "bp-cal-day--selected" : ""}`}
        onClick={() => onSelect(formatted)}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="bp-calendar-popup" role="dialog">
      <div className="bp-calendar-header">
        <button type="button" className="bp-cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
          ‹
        </button>
        <strong>
          {MONTH_NAMES[month]} {year}
        </strong>
        <button type="button" className="bp-cal-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
          ›
        </button>
      </div>
      <div className="bp-calendar-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="bp-calendar-days">{cells}</div>
      <div className="bp-calendar-footer">
        <button type="button" className="bp-calendar-clear" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="bp-calendar-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * The top bar, copied from FIN_EVAL/MA's <Header>: the toolbar strip —
 * currency toggle, scale toggle, number format and the FX card — all
 * reading/writing the shared CurrencyFormatContext, so every table cell
 * re-renders through the same conversion — plus the Actual Acquisition Date
 * picker on the right. Save lives in <BuyPlanHeader>.
 */
export default function BuyPlanToolbar({
  dirty,
  saving,
  error,
  actualAcquisitionDate,
  onActualAcquisitionDateChange,
  dateDirty,
}: Props) {
  const {
    currency,
    setCurrency,
    scale,
    setScale,
    fxRate,
    currencies,
    localCurrency,
    showFx,
    fxLoading,
    fxError,
  } = useCurrencyFormat();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const openCalendar = () => {
    if (saving) return;
    setCalendarOpen(true);
  };

  return (
    <header className="bp-topbar">
      {((error && !saving) || dirty || dateDirty) && <div className="bp-toolbar-message-row">{null}</div>}

      <div className="bp-controls-row">
        <div className="bp-controls-left">
          <div className="bp-topbar-strip" style={stripCard}>
            <div style={stripRow}>
              <CurrencyToggle
                currency={currency}
                setCurrency={setCurrency}
                scale={scale}
                setScale={setScale}
                currencies={currencies}
                localCurrency={localCurrency}
              />
              <div style={stripDivider} />
              <NumberFormatToolbar />
              {showFx && (
                <FxCard fxRate={fxRate} localCurrency={localCurrency} loading={fxLoading} error={fxError} />
              )}
            </div>
          </div>
        </div>

        <div className="bp-controls-right">
          <div className="bp-acquisition-date">
            <label className="bp-acquisition-date-label">Actual Acquisition Date</label>
            <div className="bp-acquisition-date-control">
              <input
                type="text"
                className="bp-acquisition-date-input"
                value={actualAcquisitionDate}
                placeholder="dd-Mon-yyyy"
                readOnly
                disabled={saving}
                onClick={openCalendar}
              />
              <button type="button" className="bp-calendar-btn" disabled={saving} onClick={openCalendar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path d="M8 2v4M16 2v4M3 9h18" />
                  <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
                </svg>
              </button>
              {calendarOpen && (
                <BpCalendarPopup
                  value={actualAcquisitionDate}
                  viewDate={viewDate}
                  setViewDate={setViewDate}
                  onSelect={(value) => {
                    onActualAcquisitionDateChange(value);
                    setCalendarOpen(false);
                  }}
                  onClear={() => {
                    onActualAcquisitionDateChange("");
                    setCalendarOpen(false);
                  }}
                  onClose={() => setCalendarOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
