import { useState } from "react";
import type { ReactNode } from "react";
import { ZoomControl } from "../shared/ZoomControl";
import { AtNativeSize } from "./artScale";
import { useViewport } from "../viewport";
import { TOUCH_TARGET } from "./viewerBarLayout";

interface ComponentFrameProps {
  children: ReactNode;
  /** Per-card initial view zoom (the design constant). Default 100% (1). */
  initialZoom?: number;
  /** Minimum zoom allowed. Default 0.25 (25%). */
  minZoom?: number;
  /**
   * Size of one zoom-control step. Default 0.25. A card that opens at 140% and
   * wants the presenter to land on 100% in two clicks sets 0.2.
   */
  zoomStep?: number;
  /** Hide the live zoom control (shown by default). */
  noZoom?: boolean;
  /**
   * Back the zoom control with a dark pill — for a framed component that
   * fills the frame with a light surface, where the app's dark-theme control
   * tokens would otherwise vanish. Same idea as the giveaway button reading
   * its contrast off the stage. A phone always has it.
   */
  inverse?: boolean;
  /**
   * No stage colour and no grid behind the content — for a component that
   * sits on art the deck has already drawn underneath the frame.
   */
  transparent?: boolean;
}

/** The dark pill behind the zoom control: `inverse`, and every phone. */
const ZOOM_BACKING = {
  backgroundColor: "rgba(13,14,24,0.88)",
  borderRadius: "10px",
  padding: "3px 4px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
} as const;

// Base design-grid cell (px) at 100% — matches the deck template grid.
const GRID_BASE = 28;

/**
 * Frames a real dashboard component for the deck and lends it the shell's
 * design vocabulary: scale it up, let it bleed off the edges (overflow hidden,
 * top-left origin), and zoom it live mid-talk with the shared ZoomControl.
 *
 * `initialZoom` is the per-card design constant for how the component first
 * appears — default 100%. The live control starts there and resets back to it.
 *
 * The grid behind the content scales with the zoom (cell = GRID_BASE * zoom),
 * so the whole space zooms together rather than the component floating over a
 * fixed grid.
 */
export function ComponentFrame({
  children,
  initialZoom = 1,
  minZoom = 0.25,
  zoomStep = 0.25,
  noZoom,
  inverse,
  transparent,
}: ComponentFrameProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const cell = GRID_BASE * zoom;
  // On a phone the zoom control is the slide's main control (code slides
  // open big and the reader zooms out), so it is drawn at native size inside
  // the scaled art and touch-sized. Desktop is unchanged.
  const compact = useViewport().isMobile;
  // At touch size the control covers the corner of whatever the art draws
  // there (a code panel's header strip, say), so on a phone it always carries
  // the dark pill: it reads as a control, not as part of the art.
  const backed = inverse || compact;

  return (
    <div
      style={{
        overflow: "hidden",
        width: "100%",
        height: "100%",
        position: "relative",
        // Solid stage so the static panel grid doesn't double up behind us.
        backgroundColor: transparent ? "transparent" : "#0d0e18",
      }}
    >
      {/* Grid layer — cell size tracks the zoom so it scales with the content. */}
      {!transparent && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(99,120,198,0.12) 1px, transparent 1px)",
            backgroundSize: `${cell}px ${cell}px`,
            backgroundPosition: "center center",
            transition: "background-size 0.18s ease",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          transition: "transform 0.18s ease",
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
        }}
      >
        {children}
      </div>

      {!noZoom && (
        <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 1 }}>
          {/* The backing sits inside the native-size box, so on a phone it is
              drawn at the control's own size rather than shrunk with the art. */}
          <AtNativeSize origin="top right">
            <div
              data-zoom-backing={backed ? "" : undefined}
              style={backed ? ZOOM_BACKING : undefined}
            >
              <ZoomControl
                zoom={zoom}
                setZoom={setZoom}
                resetTo={initialZoom}
                buttonSize={compact ? TOUCH_TARGET : undefined}
                min={minZoom}
                max={4}
                step={zoomStep}
              />
            </div>
          </AtNativeSize>
        </div>
      )}
    </div>
  );
}
