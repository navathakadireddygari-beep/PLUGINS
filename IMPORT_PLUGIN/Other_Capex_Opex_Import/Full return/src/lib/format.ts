/* ─────────────────────────── Shared scale / number / date formatting ───────────────────────────
   Single source of truth for the financial table + KPI panel so their display math can't drift
   apart. API year-values always arrive expressed in thousands (K). */

export type Scale = "K" | "M" | "B";
export type NumberFormatKey = "US" | "DE" | "FR" | "IN" | "CH";
export type DateFormatKey = "DMY" | "DMONY" | "ISO" | "MDY";

export const SCALES: { label: string; value: Scale }[] = [
  { label: "K", value: "K" },
  { label: "M", value: "M" },
  { label: "B", value: "B" },
];

export const NUMBER_FORMATS: { label: string; value: NumberFormatKey }[] = [
  { label: "1,234,567.89", value: "US" },
  { label: "1.234.567,89", value: "DE" },
  { label: "1 234 567,89", value: "FR" },
  { label: "12,34,567.89", value: "IN" },
  { label: "1'234'567.89", value: "CH" },
];

export const DATE_FORMATS: { label: string; value: DateFormatKey }[] = [
  { label: "dd-mm-yyyy", value: "DMY" },
  { label: "dd-mon-yyyy", value: "DMONY" },
  { label: "yyyy-mm-dd", value: "ISO" },
  { label: "mm/dd/yyyy", value: "MDY" },
];

// K = no division (native scale — API values already arrive in thousands).
// M = divide the K-value by 1,000. B = divide the K-value by 1,000,000.
export function applyScale(kValue: number, scale: Scale): number {
  if (scale === "M") return kValue / 1000;
  if (scale === "B") return kValue / 1_000_000;
  return kValue;
}

// Inverse of applyScale — converts a value the user typed at the current
// display scale back to the native K-value for storage.
export function unapplyScale(displayValue: number, scale: Scale): number {
  if (scale === "M") return displayValue * 1000;
  if (scale === "B") return displayValue * 1_000_000;
  return displayValue;
}

// Decimal places shown depend on the active scale: K = whole numbers,
// M = 1 decimal, B = 2 decimals.
export function decimalsForScale(scale: Scale): number {
  if (scale === "B") return 2;
  if (scale === "M") return 1;
  return 0;
}

const LOCALE_MAP: Record<NumberFormatKey, string> = {
  US: "en-US",
  DE: "de-DE",
  FR: "fr-FR",
  IN: "en-IN",
  CH: "de-CH",
};

const NARROW_NBSP = " ";
const NBSP = " ";
const CURLY_APOSTROPHE = "’";

export function formatNumber(
  value: number,
  fmt: NumberFormatKey,
  opts: Intl.NumberFormatOptions = {}
): string {
  let out = new Intl.NumberFormat(LOCALE_MAP[fmt], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value);

  if (fmt === "FR") {
    out = out.replace(new RegExp(`[${NARROW_NBSP}${NBSP}]`, "g"), " ");
  }
  if (fmt === "CH") {
    out = out.replace(new RegExp(CURLY_APOSTROPHE, "g"), "'");
  }
  return out;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(isoOrDate: string | Date | null | undefined, fmt: DateFormatKey): string {
  if (!isoOrDate) return "—";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";

  const yyyy = String(d.getFullYear());
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");

  switch (fmt) {
    case "ISO":   return `${yyyy}-${mm}-${dd}`;
    case "MDY":   return `${mm}/${dd}/${yyyy}`;
    case "DMONY": return `${dd}-${MONTH_ABBR[d.getMonth()]}-${yyyy}`;
    case "DMY":
    default:      return `${dd}-${mm}-${yyyy}`;
  }
}
