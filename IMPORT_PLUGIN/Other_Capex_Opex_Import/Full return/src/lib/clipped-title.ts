import type React from "react";

/**
 * Hover tooltip for cells whose text doesn't fit — a long figure in a narrow
 * year column is clipped (inputs) or cut with "…" (read-only cells). Attach as
 * `onMouseOver` on the table's container: the full text becomes the cell's
 * `title` while it is clipped, and is removed again once it fits. Elements
 * that already carry their own title (line-item names, buttons) are left alone.
 */
export function showClippedTitle(e: React.MouseEvent<HTMLElement>): void {
  let el = (e.target as HTMLElement).closest<HTMLElement>("input, td, span");
  // An inline span has no box width to compare, so measure its cell instead.
  if (el?.tagName === "SPAN" && getComputedStyle(el).display === "inline") el = el.closest<HTMLElement>("td");
  if (!el) return;
  if (el.title && !el.dataset.clipTitle) return;

  const text = (el instanceof HTMLInputElement ? el.value : el.textContent ?? "").trim();
  if (text && el.scrollWidth > el.clientWidth) {
    el.title = text;
    el.dataset.clipTitle = "1";
  } else if (el.dataset.clipTitle) {
    el.removeAttribute("title");
    delete el.dataset.clipTitle;
  }
}
