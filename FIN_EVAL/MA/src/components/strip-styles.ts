/**
 * Toolbar-strip chrome, transcribed from the reference project
 * (Prod Dev -> src/components/Table.tsx). Every value here is prod's, so the
 * two widgets render an identical strip when they sit on the same APEX page.
 *
 * These are inline styles rather than Tailwind classes on purpose: APEX ships
 * its own `button` / `select` CSS that outranks utility classes, and prod
 * solves it the same way.
 */
import type { CSSProperties } from "react";

/** The active toggle's background (Prod Dev -> DARK_TOGGLE). */
export const DARK_TOGGLE = "#1e2433";

/* ── Palette, transcribed from the reference project's Table.tsx ── */
/** Experian magenta — primary actions and links. */
export const BRAND = "#A5005A";
/** Section header bars. */
export const DARK_HEADER = "#2d3748";
/**
 * Focus / selection outline. Prod uses this blue for every active input border;
 * MA previously used an off-palette navy (#1d2c4d) that appears nowhere in the
 * reference.
 */
export const ACCENT = "#3b82f6";
/** Header-cell rules. */
export const BORDER_STRONG = "#d1d5db";
/** Body-cell rules. */
export const BORDER_SOFT = "#e5e7eb";

/** "CURRENCY" / "SCALE" / "NUMBER FORMAT" / "DATE FORMAT". */
export const stripLabel: CSSProperties = {
  fontSize: 10,
  color: "#6b7280",
  fontWeight: 700,
  letterSpacing: 0.3,
  flexShrink: 0,
};

/** Outer card around the whole strip. */
export const stripCard: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

/**
 * Inner row. `nowrap` + `max-content` means the strip scrolls horizontally
 * rather than wrapping, so the controls never break mid-row inside a narrow
 * APEX plugin container.
 */
export const stripRow: CSSProperties = {
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "nowrap",
  width: "max-content",
  minWidth: "100%",
  boxSizing: "border-box",
};

/** The hairline between groups. */
export const stripDivider: CSSProperties = {
  width: 1,
  height: 18,
  background: "#e5e7eb",
  flexShrink: 0,
};

/** Wrapper that draws the joined border around a run of toggle buttons. */
export const toggleGroup: CSSProperties = {
  display: "flex",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  overflow: "hidden",
};

/** One toggle button. `first` drops the divider border on the leading button. */
export const toggleBtn = (
  active: boolean,
  first: boolean,
): CSSProperties => ({
  padding: "3px 8px",
  border: "none",
  borderLeft: first ? "none" : "1px solid #e5e7eb",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 700,
  background: active ? DARK_TOGGLE : "#fff",
  color: active ? "#fff" : "#6b7280",
  transition: "background 0.15s, color 0.15s",
  whiteSpace: "nowrap",
});

/** The Number / Date format dropdowns, sized to align with the toggles. */
export const stripSelect: CSSProperties = {
  height: 24,
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
  padding: "0 6px",
  background: "#fff",
  cursor: "pointer",
  outline: "none",
};

/** The "i" hint circle that follows each group. */
export const infoDot: CSSProperties = {
  width: 15,
  height: 15,
  borderRadius: 999,
  border: "1.5px solid #9ca3af",
  color: "#9ca3af",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  fontWeight: 700,
  cursor: "default",
  userSelect: "none",
};

/** Dark tooltip shown on info-dot hover. */
export const infoTip: CSSProperties = {
  position: "absolute",
  left: 19,
  top: -4,
  background: DARK_TOGGLE,
  color: "#fff",
  padding: "6px 10px",
  borderRadius: 4,
  fontSize: 12,
  whiteSpace: "normal",
  width: 360,
  lineHeight: 1.5,
  zIndex: 300,
};

/** The "FX" badge. */
export const fxBadge: CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 999,
  background: "#fff",
  color: "#000",
  border: "1.5px solid #000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 9,
  fontWeight: 800,
  flexShrink: 0,
};

/** FX rate lines. */
export const fxText: CSSProperties = {
  fontSize: 11,
  color: "rgb(17, 24, 39)",
  whiteSpace: "nowrap",
};

export const fxErrorText: CSSProperties = {
  fontSize: 11,
  color: "#b91c1c",
  whiteSpace: "nowrap",
};
