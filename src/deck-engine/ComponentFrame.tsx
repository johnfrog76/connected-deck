import { useState } from "react";
import type { ReactNode } from "react";
import { ZoomControl } from "../shared/ZoomControl";

interface ComponentFrameProps {
  children: ReactNode;
  /** Per-slide initial view zoom (the design constant). Default 100% (1). */
  initialZoom?: number;
  /** Minimum zoom allowed. Default 0.25 (25%). */
  minZoom?: number;
  /** Hide the live zoom control (shown by default). */
  noZoom?: boolean;
}

// Base design-grid cell (px) at 100% — matches the deck template grid.
const GRID_BASE = 28;

/**
 * Frames a real, live component for use inside a slide: scale it up, let it
 * bleed off the edges (overflow hidden, top-left origin), and zoom it live
 * mid-talk with the shared ZoomControl.
 *
 * `initialZoom` is the per-slide design constant for how the component first
 * appears — default 100%. The live control starts there and resets back to it.
 *
 * The grid behind the content scales with the zoom (cell = GRID_BASE * zoom),
 * so the whole space zooms together rather than the component floating over a
 * fixed grid.
 */
export function ComponentFrame({ children, initialZoom = 1, minZoom = 0.25, noZoom }: ComponentFrameProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const cell = GRID_BASE * zoom;

  return (
    <div
      style={{
        overflow: "hidden",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#0d0e18",
      }}
    >
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
          <ZoomControl zoom={zoom} setZoom={setZoom} resetTo={initialZoom} min={minZoom} max={4} />
        </div>
      )}
    </div>
  );
}
