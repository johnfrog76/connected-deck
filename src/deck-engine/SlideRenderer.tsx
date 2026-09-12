import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Slide } from "../decks/types";

export const DECK_BG = "#07080f";
const CONTENT_BG = "#0d0e18";
const COPY_BG = "#0a0b14";
const BORDER = "#1e2030";

// Design-grid texture — holds the space and gives scaled/bleeding visuals a
// grid to register against.
const GRID_TEXTURE = {
  backgroundImage: "radial-gradient(circle, rgba(99,120,198,0.12) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
  backgroundPosition: "center center",
} as const;

// The authored content panel: 60% of the 1280×720 stage. In stacked mode the
// art renders INTO this virtual panel and transform-scales to fit the band, so
// every deck keeps its authored composition on a phone with zero re-authoring.
// This is why a phone doesn't need decks rewritten: the art isn't reflowed, it
// is scaled as a whole. (Known, accepted tradeoff: vw-sized text inside art
// resolves against the real viewport and lands smaller than px art at this
// scale.)
const PANEL_W = 768;
const PANEL_H = 720;

function ScaledContent({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const { width, height } = box.getBoundingClientRect();
      if (!width || !height) return;
      // Contain: the whole authored panel stays visible (the band's aspect
      // ratio matches the panel's, so in practice it fills edge to edge).
      setScale(Math.min(width / PANEL_W, height / PANEL_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${PANEL_W}px`,
          height: `${PANEL_H}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          // Mirror the desktop panel's interior so compositions sit as
          // authored: same padding, same column flex.
          boxSizing: "border-box",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface SlideRendererProps {
  slide: Slide;
  slideIndex: number;
  isFullscreen: boolean;
  /**
   * Compact (portrait-phone) layout: the slide's art SCALED into a top band
   * (ScaledContent above), copy below as a natively-sized, scrolling read —
   * the markdown reflows the way prose should. A PROP, not a media query in
   * here: a host that renders this component inside a fixed-size stage (a
   * poster, a thumbnail, a print sheet) must be able to keep the side-by-side
   * split regardless of how narrow the real viewport is.
   */
  stacked?: boolean;
}

export function SlideRenderer({
  slide,
  slideIndex,
  isFullscreen,
  stacked = false,
}: SlideRendererProps) {
  const hasContent = !!slide?.content;

  // Arrive at the top of every slide's copy.
  //
  // The copy panel is a scroll container that PERSISTS across slides — it has
  // no per-slide key, unlike the content panel below, so React reuses the same
  // DOM node and the browser keeps its scrollTop. Scroll halfway down a long
  // slide, advance, and the next slide opens mid-paragraph with its heading
  // above the fold. Worst in stacked/mobile, where the copy is the whole read
  // below the art band and auto-advance (Suitcase Mode) can page for you — but
  // it's the same bug on desktop's right-hand 40%, so this is not gated on
  // `stacked`.
  //
  // Deliberately NOT fixed by keying the panel per slide the way the content
  // panel is: that remount exists there to reset stateful visuals, and paying a
  // full subtree teardown just to reset one scalar would throw away the copy's
  // own DOM on every advance. Layout effect, so the reset lands in the same
  // frame the new slide paints — a useEffect here shows one frame of the old
  // scroll position first.
  //
  // Assigning scrollTop rather than calling scrollTo(): jsdom doesn't implement
  // Element.scrollTo at all (it's `undefined`, not a no-op stub), so calling it
  // throws in every test that mounts the player. scrollTop is a plain property
  // jsdom supports, and it's an instant jump by definition — which is what's
  // wanted here anyway.
  const copyRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (copyRef.current) copyRef.current.scrollTop = 0;
  }, [slideIndex]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* Content panel — left 60% on desktop/tablet (style object UNCHANGED,
          so the no-regression guarantee is readable right here), or the scaled
          band on top when stacked. Band ratio 16/15 = the virtual panel's own
          768×720, so the contain-scale fills it edge to edge. */}
      {hasContent && (
        <div
          // key per slide forces a remount so stateful visuals (e.g. a live
          // component's run result) reset to a clean state on arrival.
          key={`content-${slideIndex}`}
          style={
            stacked
              ? {
                  position: "relative",
                  flex: "0 0 auto",
                  width: "100%",
                  aspectRatio: "16 / 15",
                  overflow: "hidden",
                  backgroundColor: CONTENT_BG,
                  ...GRID_TEXTURE,
                  borderBottom: `1px solid ${BORDER}`,
                }
              : {
                  flex: "0 0 60%",
                  overflow: "hidden",
                  backgroundColor: CONTENT_BG,
                  ...GRID_TEXTURE,
                  borderRight: `1px solid ${BORDER}`,
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }
          }
        >
          {stacked ? <ScaledContent>{slide.content}</ScaledContent> : slide.content}
        </div>
      )}

      {/* Copy panel — right 40% or full-width; the scrolling read below the art
          when stacked (top-aligned: a paragraph vertically centered in a short
          band reads as floating, not as prose). */}
      <div
        ref={copyRef}
        style={{
          flex: hasContent && !stacked ? "0 0 40%" : "1",
          overflow: "auto",
          backgroundColor: COPY_BG,
          display: "flex",
          alignItems: stacked ? "flex-start" : "center",
          justifyContent: hasContent ? "flex-start" : "center",
          paddingRight: isFullscreen ? "5vw" : 0,
        }}
      >
        {hasContent ? (
          stacked ? (
            // Deck CopyPanels center themselves in a full-height column
            // (height: 100% + justify-content: center) — right beside the art,
            // but in a short scroll pane flex-centering puts overflow ABOVE the
            // scroll start, where it can't be reached (the clipped-title bug).
            // This plain block wrapper makes their height: 100% resolve against
            // an auto height, so the panel grows with its copy and reads from
            // the top.
            <div style={{ width: "100%" }}>{slide.copy}</div>
          ) : (
            slide.copy
          )
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: "820px",
              padding: stacked ? "0 20px" : "0 60px",
            }}
          >
            {slide.copy}
          </div>
        )}
      </div>
    </div>
  );
}
