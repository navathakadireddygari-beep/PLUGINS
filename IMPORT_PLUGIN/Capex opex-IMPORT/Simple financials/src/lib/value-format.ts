/* ─────────────────────────── Scale (K / M / B) ────────────────────
   API year-values already arrive expressed in thousands (K). So K needs
   no further division; M and B divide the already-in-K value down. */
export type ScaleCode = "K" | "M" | "B";

export const SCALE_OPTIONS: { code: ScaleCode; label: string }[] = [
  { code: "K", label: "K" },
  { code: "M", label: "M" },
  { code: "B", label: "B" },
];

export const SCALE_DIVISOR: Record<ScaleCode, number> = { K: 1, M: 1000, B: 1000000 };

export const SCALE_TOOLTIP =
  "Switch the denomination for all financial values. K = thousands (native), M = millions, B = billions.";

// Decimal places shown depend on the active scale: K = whole numbers,
// M = 1 decimal, B = 2 decimals.
export const decimalsForScale = (scale: ScaleCode): number => {
  if (scale === "B") return 2;
  if (scale === "M") return 1;
  return 0;
};

/* ─────────────────────────── Number format ────────────────────────── */
export type NumberFormatCode = "US" | "DE" | "FR" | "IN" | "CH";

export const NUMBER_FORMAT_OPTIONS: { code: NumberFormatCode; label: string }[] = [
  { code: "US", label: "1,234,567.89" },
  { code: "DE", label: "1.234.567,89" },
  { code: "FR", label: "1 234 567,89" },
  { code: "IN", label: "12,34,567.89" },
  { code: "CH", label: "1'234'567.89" },
];

const NUMBER_LOCALE: Record<NumberFormatCode, string> = {
  US: "en-US",
  DE: "de-DE",
  FR: "fr-FR",
  IN: "en-IN",
  CH: "de-CH",
};

export const formatNumber = (value: number, fmt: NumberFormatCode, decimals = 2): string => {
  let s = new Intl.NumberFormat(NUMBER_LOCALE[fmt], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  if (fmt === "FR") s = s.replace(/[  ]/g, " ");
  if (fmt === "CH") s = s.replace(/’/g, "'");
  return s;
};

// Accounting style: em-dash for zero/empty, parentheses for negatives.
export const formatSignedAmount = (n: number, fmt: NumberFormatCode, decimals = 2): string => {
  if (!n) return "—";
  const abs = Math.abs(n);
  const formatted = formatNumber(abs, fmt, decimals);
  return n < 0 ? `(${formatted})` : formatted;
};

// Combines currency conversion + scale + number-format for a table/KPI cell.
export const formatDisplayValue = (
  raw: number,
  opts: { fxMultiplier: number; scale: ScaleCode; numberFormat: NumberFormatCode },
): string => {
  if (!raw) return "—";
  const v = (raw * opts.fxMultiplier) / SCALE_DIVISOR[opts.scale];
  return formatSignedAmount(v, opts.numberFormat, decimalsForScale(opts.scale));
};

/* ─────────────────────────── Date format ──────────────────────────── */
export type DateFormatCode = "DMY" | "MDY" | "DMON" | "ISO";

export const DATE_FORMAT_OPTIONS: { code: DateFormatCode; label: string }[] = [
  { code: "DMY",  label: "dd-mm-yyyy" },
  { code: "DMON", label: "dd-mon-yyyy" },
  { code: "ISO",  label: "yyyy-mm-dd" },
  { code: "MDY",  label: "mm/dd/yyyy (US)" },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad2 = (n: number): string => String(n).padStart(2, "0");

export const formatDate = (iso: string | null | undefined, fmt: DateFormatCode): string => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  switch (fmt) {
    case "DMY":  return `${dd}-${mm}-${yyyy}`;
    case "MDY":  return `${mm}/${dd}/${yyyy}`;
    case "DMON": return `${dd}-${MONTHS_SHORT[d.getMonth()]}-${yyyy}`;
    case "ISO":  return `${yyyy}-${mm}-${dd}`;
  }
};
