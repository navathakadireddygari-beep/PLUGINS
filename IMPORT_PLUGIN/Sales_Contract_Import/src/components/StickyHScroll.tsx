import { useEffect, useRef, useState, type RefObject } from "react";

/* ── Page-level horizontal scrollbar ──────────────────────────────
   One scrollbar for the whole page, pinned to the bottom of the
   viewport. It drives every table scroller (marked `data-hscroll`)
   together, so all sections move sideways as one, and the scrollers'
   own scrollbars are hidden. It shows only while some on-screen
   scroller has columns that do not fit, and hides once they all do. */

const SCROLLER = "[data-hscroll]";
const BAR_HEIGHT = 16;

// The scrollers keep scrolling (wheel / trackpad / keyboard); only their
// own bars are hidden, so the page bar is the single one on screen.
const CSS = `
${SCROLLER} { scrollbar-width: none; -ms-overflow-style: none; }
${SCROLLER}::-webkit-scrollbar { display: none; height: 0; }
`;

type Box = { left: number; width: number; range: number };

const maxScroll = (el: HTMLElement): number => Math.max(0, el.scrollWidth - el.clientWidth);

export default function StickyHScroll({ rootRef }: { rootRef?: RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLDivElement>(null);
  // Shared horizontal position of every scroller (and the bar).
  const posRef = useRef(0);
  // How far the widest on-screen scroller can move; 0 while everything fits.
  const rangeRef = useRef(0);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const scrollers = (): HTMLElement[] =>
      Array.from((rootRef?.current ?? document).querySelectorAll<HTMLElement>(SCROLLER));

    // Move every scroller (each clamped to its own range) and the bar to `pos`.
    const apply = (except?: Element) => {
      const pos = posRef.current;
      for (const el of scrollers()) {
        if (el === except) continue;
        const want = Math.min(pos, maxScroll(el));
        if (Math.abs(el.scrollLeft - want) > 1) el.scrollLeft = want;
      }
      const bar = barRef.current;
      if (bar && bar !== except && Math.abs(bar.scrollLeft - pos) > 1) bar.scrollLeft = pos;
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      let left = Infinity, right = -Infinity, range = 0;
      for (const el of scrollers()) {
        const r = el.getBoundingClientRect();
        // Hidden tabs measure 0×0; off-screen sections do not count.
        if (r.width === 0 || r.bottom <= 0 || r.top >= vh) continue;
        const m = maxScroll(el);
        if (m <= 1) continue;
        range = Math.max(range, m);
        left = Math.min(left, r.left + el.clientLeft);
        right = Math.max(right, r.left + el.clientLeft + el.clientWidth);
      }
      rangeRef.current = range;
      if (!range) { setBox(null); return; }
      posRef.current = Math.min(posRef.current, range);
      const next = { left, width: right - left, range };
      setBox((p) => (p && p.left === next.left && p.width === next.width && p.range === next.range ? p : next));
      // Newly rendered scrollers (tab switch, added years) join at the shared position.
      apply();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    // A scroller moved by wheel / trackpad / keyboard / cell focus: the rest follow.
    const onScroll = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLElement && t !== barRef.current && t.matches(SCROLLER)) {
        // Ignore the echo of our own clamped write.
        if (Math.abs(t.scrollLeft - Math.min(posRef.current, maxScroll(t))) > 1) {
          posRef.current = t.scrollLeft;
          apply(t);
        }
      }
      schedule();
    };

    // Two-finger sideways swipe (or Shift + wheel) anywhere on the page moves
    // every table together — over the KPI cards, the toolbar, between grids.
    const root = rootRef?.current ?? document.body;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const dy = e.shiftKey ? 0 : e.deltaY;
      // Mostly vertical: leave it to the page.
      if (!dx || Math.abs(dx) < Math.abs(dy)) return;
      const range = rangeRef.current;
      if (!range) return;
      // Anything else that scrolls sideways on its own (a dropdown list, the
      // bar itself) keeps its native behaviour.
      for (let el = e.target as Element | null; el && el !== root; el = el.parentElement) {
        if (el === barRef.current) return;
        if (el.matches(SCROLLER)) break;
        if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(window.getComputedStyle(el).overflowX)) return;
      }
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerWidth : 1;
      const next = Math.max(0, Math.min(range, posRef.current + dx * unit));
      // At either end the gesture is spent; also stops browser back/forward swipes.
      e.preventDefault();
      if (next === posRef.current) return;
      posRef.current = next;
      apply();
    };

    schedule();
    root.addEventListener("wheel", onWheel, { passive: false });
    // Capture phase sees page scrolls and every element's own scroll.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    // Rows, years, tabs and sections change the table's width without a scroll.
    const mo = new MutationObserver(schedule);
    mo.observe(rootRef?.current ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, [rootRef]);

  // Room under the last row, so the pinned bar never covers it.
  const shown = box !== null;
  useEffect(() => {
    const root = rootRef?.current;
    if (!root || !shown) return;
    const prev = root.style.paddingBottom;
    const base = parseFloat(window.getComputedStyle(root).paddingBottom) || 0;
    root.style.paddingBottom = `${base + BAR_HEIGHT}px`;
    return () => { root.style.paddingBottom = prev; };
  }, [rootRef, shown]);

  // The bar was hidden while the scrollers moved; catch it up when it shows.
  useEffect(() => {
    const bar = barRef.current;
    if (box && bar) bar.scrollLeft = posRef.current;
  }, [box]);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={barRef}
        className="sticky-hscroll"
        onScroll={() => {
          const bar = barRef.current;
          if (!bar || Math.abs(bar.scrollLeft - posRef.current) <= 1) return;
          posRef.current = bar.scrollLeft;
          for (const el of Array.from((rootRef?.current ?? document).querySelectorAll<HTMLElement>(SCROLLER))) {
            const want = Math.min(posRef.current, maxScroll(el));
            if (Math.abs(el.scrollLeft - want) > 1) el.scrollLeft = want;
          }
        }}
        style={{
          display: box ? "block" : "none",
          position: "fixed", bottom: 0, left: box?.left ?? 0, width: box?.width ?? 0, height: BAR_HEIGHT,
          overflowX: "scroll", overflowY: "hidden", zIndex: 150,
          background: "#fff", borderTop: "1px solid #e5e7eb",
        }}
      >
        <div style={{ width: (box?.width ?? 0) + (box?.range ?? 0), height: 1 }} />
      </div>
    </>
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
