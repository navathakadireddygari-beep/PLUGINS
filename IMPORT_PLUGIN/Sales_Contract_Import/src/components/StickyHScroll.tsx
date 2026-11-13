import { useEffect, useRef, useState, type RefObject } from "react";

/* ── Frozen horizontal scrollbar ──────────────────────────────────
   A table scroller's own scrollbar sits under its last row, so for the
   top sections of a long table it is off-screen. This bar is pinned to
   the bottom of the viewport and mirrors whichever scroller (marked with
   `data-hscroll`) runs past the bottom edge; once the scroller's own
   scrollbar is on screen the bar hides. */

const SCROLLER = "[data-hscroll]";

type Box = { left: number; width: number; scrollWidth: number };

export default function StickyHScroll({ rootRef }: { rootRef?: RefObject<HTMLElement | null> }) {
  const barRef    = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root: ParentNode = rootRef?.current ?? document;
      const vh = window.innerHeight;
      let target: HTMLElement | null = null;
      for (const el of Array.from(root.querySelectorAll<HTMLElement>(SCROLLER))) {
        if (el.scrollWidth <= el.clientWidth + 1) continue;
        const r = el.getBoundingClientRect();
        // Some of it is on screen, but its own scrollbar is below the fold.
        if (r.top < vh - 40 && r.bottom > vh) { target = el; break; }
      }
      targetRef.current = target;
      if (!target) { setBox(null); return; }
      const left = target.getBoundingClientRect().left + target.clientLeft;
      const width = target.clientWidth;
      const scrollWidth = target.scrollWidth;
      setBox((p) => (p && p.left === left && p.width === width && p.scrollWidth === scrollWidth ? p : { left, width, scrollWidth }));
      const bar = barRef.current;
      if (bar && bar.scrollLeft !== target.scrollLeft) bar.scrollLeft = target.scrollLeft;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    schedule();
    // Capture phase sees page scrolls and every element's own scroll.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    // Rows, years and sections change the table's width without a scroll.
    const mo = new MutationObserver(schedule);
    const root = rootRef?.current ?? document.body;
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, [rootRef]);

  // The bar was hidden while the scroller moved; catch it up when it shows.
  useEffect(() => {
    const bar = barRef.current, target = targetRef.current;
    if (box && bar && target) bar.scrollLeft = target.scrollLeft;
  }, [box]);

  return (
    <div
      ref={barRef}
      className="sticky-hscroll"
      onScroll={() => {
        const bar = barRef.current, target = targetRef.current;
        if (bar && target && target.scrollLeft !== bar.scrollLeft) target.scrollLeft = bar.scrollLeft;
      }}
      style={{
        display: box ? "block" : "none",
        position: "fixed", bottom: 0, left: box?.left ?? 0, width: box?.width ?? 0, height: 16,
        overflowX: "scroll", overflowY: "hidden", zIndex: 150,
        background: "#fff", borderTop: "1px solid #e5e7eb",
      }}
    >
      <div style={{ width: box?.scrollWidth ?? 0, height: 1 }} />
    </div>
  );
}

/**
 * Bottom edge of the host page's fixed/sticky bars at the top of the
 * viewport (e.g. the APEX navbar), so a pinned header sits below them
 * instead of behind them. 0 when nothing is pinned there.
 */
export function hostTopInset(own: HTMLElement | null): number {
  if (!own) return 0;
  const vh = window.innerHeight;
  const r = own.getBoundingClientRect();
  const x = Math.min(Math.max(r.left + 8, 0), window.innerWidth - 1);
  let inset = 0;
  // Bars can stack (navbar, then a sticky title bar): step down past each.
  for (let i = 0; i < 4; i++) {
    let bottom = inset;
    for (const hit of document.elementsFromPoint(x, inset + 1)) {
      if (own.contains(hit)) continue;
      for (let el: Element | null = hit; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        if (el.contains(own)) break;
        const pos = window.getComputedStyle(el).position;
        if (pos !== "fixed" && pos !== "sticky") continue;
        const b = el.getBoundingClientRect();
        // Full-page overlays (spinners, dialogs) are not top bars.
        if (b.top <= inset + 1 && b.height < vh / 3 && b.bottom > bottom) bottom = b.bottom;
        break;
      }
    }
    if (bottom <= inset) break;
    inset = bottom;
  }
  return inset;
}
