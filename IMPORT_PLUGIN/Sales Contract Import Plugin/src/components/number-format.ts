// Front-end number formatting for the financial table & KPI cards.
// IMPORTANT: this is display-only. Stored/state values and everything sent to
// the API stay as raw numbers — formatting is applied at render, and user input
// is parsed back to a raw number before it touches state.

export type NumFmtKey = "us" | "euro" | "french" | "indian" | "swiss";

export interface NumFmtSpec {
  key:     NumFmtKey;
  label:   string;   // shown in the dropdown
  group:   string;   // thousands separator
  decimal: string;   // decimal separator
  indian:  boolean;  // true → 2,2,3 grouping (12,34,567) instead of 3s
}

export const NUMBER_FORMATS: NumFmtSpec[] = [
  { key: "us",     label: "1,234,567.89", group: ",", decimal: ".", indian: false },
  { key: "euro",   label: "1.234.567,89",          group: ".", decimal: ",", indian: false },
  { key: "french", label: "1 234 567,89",          group: " ", decimal: ",", indian: false },
  { key: "indian", label: "12,34,567.89",          group: ",", decimal: ".", indian: true  },
  { key: "swiss",  label: "1'234'567.89",          group: "'", decimal: ".", indian: false },
];

export function getNumFmt(key: NumFmtKey): NumFmtSpec {
  return NUMBER_FORMATS.find((f) => f.key === key) ?? NUMBER_FORMATS[0];
}

// Group the integer-digit string with the given separator.
function groupDigits(digits: string, group: string, indian: boolean): string {
  if (indian) {
    if (digits.length <= 3) return digits;
    const last3 = digits.slice(-3);
    const rest  = digits.slice(0, -3);
    return rest.replace(/\B(?=(\d\d)+(?!\d))/g, group) + group + last3;
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

// Full display: grouped integer + decimal separator, trailing zeros trimmed.
export function formatNumber(value: number, fmt: NumFmtSpec, maxDecimals = 3): string {
  if (!isFinite(value)) return "";
  const neg = value < 0;
  const s   = Math.abs(value).toFixed(maxDecimals);
  const [intPart, decRaw = ""] = s.split(".");
  const decPart = decRaw.replace(/0+$/, "");
  const grouped = groupDigits(intPart, fmt.group, fmt.indian);
  const body    = decPart ? grouped + fmt.decimal + decPart : grouped;
  return neg ? "-" + body : body;
}

// Plain (ungrouped) editable representation — only the decimal separator, no
// thousands grouping — so typing is unambiguous while a cell is focused.
export function plainNumber(value: number, fmt: NumFmtSpec, maxDecimals = 3): string {
  if (!isFinite(value)) return "";
  const neg = value < 0;
  const s   = Math.abs(value).toFixed(maxDecimals);
  const [intPart, decRaw = ""] = s.split(".");
  const decPart = decRaw.replace(/0+$/, "");
  const body    = decPart ? intPart + fmt.decimal + decPart : intPart;
  return neg ? "-" + body : body;
}

// Parse a user-typed string (in the given format) back to a raw number.
export function parseFormatted(raw: string, fmt: NumFmtSpec): number {
  if (!raw) return 0;
  let s = raw.split(fmt.group).join("");            // strip thousands separators
  if (fmt.decimal !== ".") s = s.split(fmt.decimal).join(".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
