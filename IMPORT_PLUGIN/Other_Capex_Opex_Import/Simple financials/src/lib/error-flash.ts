/**
 * Flash on the target of a validation-error click: #fef08a fill and an amber
 * ring for 3s.
 *
 * A row is flashed cell by cell. Colouring only the <tr> leaves gaps wherever a
 * cell or the input inside it paints its own background (sub-section gutters,
 * locked inputs, the account picker trigger). The ring is drawn on the cells
 * too, so it sits on top of those fills rather than on the <tr> beneath them.
 *
 * The rules are rendered by Table as a <style> element (ERROR_FLASH_CSS), so
 * they apply even when the host page does not load pivot-table.css, and are
 * !important so they out-rank the cells' inline styles.
 */
export const ERROR_FLASH_CLASS = "imp_err_flash";
/** Ring only, no fill: for dark section bars, where yellow would hide the white text. */
export const ERROR_RING_CLASS = "imp_err_ring";

const AMBER = "#f59e0b";
const FILL = "#fef08a";
const TOP_BOTTOM = `inset 0 2px 0 ${AMBER}, inset 0 -2px 0 ${AMBER}`;

export const ERROR_FLASH_CSS = `
tr.${ERROR_FLASH_CLASS} > td, tr.${ERROR_FLASH_CLASS} > th { background: ${FILL} !important; }
tr.${ERROR_FLASH_CLASS} input, tr.${ERROR_FLASH_CLASS} select, tr.${ERROR_FLASH_CLASS} textarea,
tr.${ERROR_FLASH_CLASS} > td > div, tr.${ERROR_FLASH_CLASS} > td > div > div:first-child { background: transparent !important; }
tr.${ERROR_FLASH_CLASS} > *, tr.${ERROR_RING_CLASS} > * { box-shadow: ${TOP_BOTTOM} !important; }
tr.${ERROR_FLASH_CLASS} > :first-child, tr.${ERROR_RING_CLASS} > :first-child { box-shadow: inset 2px 0 0 ${AMBER}, ${TOP_BOTTOM} !important; }
tr.${ERROR_FLASH_CLASS} > :last-child, tr.${ERROR_RING_CLASS} > :last-child { box-shadow: inset -2px 0 0 ${AMBER}, ${TOP_BOTTOM} !important; }
tr.${ERROR_FLASH_CLASS} > :only-child, tr.${ERROR_RING_CLASS} > :only-child { box-shadow: inset 0 0 0 2px ${AMBER} !important; }
:not(tr).${ERROR_FLASH_CLASS} { background-color: ${FILL} !important; box-shadow: 0 0 0 2px ${AMBER}, 0 0 0 5px #fde68a !important; }
`;

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Flash `el` for `ms`; a repeat call on the same element restarts the flash. */
export function flashElement(el: HTMLElement, className: string = ERROR_FLASH_CLASS, ms = 3000): void {
  const prev = timers.get(el);
  if (prev) clearTimeout(prev);
  el.classList.add(className);
  timers.set(el, setTimeout(() => {
    el.classList.remove(className);
    timers.delete(el);
  }, ms));
}

/** True when `el` has an opaque, dark background of its own. */
const isDark = (el: HTMLElement): boolean => {
  const [r, g, b, a] = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) ?? []).map(Number);
  if (b === undefined || a === 0) return false;
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

/** Flash a validation-error target; a dark section bar gets the ring only. */
export function flashErrorTarget(el: HTMLElement): void {
  flashElement(el, isDark(el) ? ERROR_RING_CLASS : ERROR_FLASH_CLASS);
}
