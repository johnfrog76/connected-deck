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

interface SlideRendererProps {
  slide: Slide;
  slideIndex: number;
  isFullscreen: boolean;
}

export function SlideRenderer({ slide, slideIndex, isFullscreen }: SlideRendererProps) {
  const hasContent = !!slide?.content;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
      {/* Content panel — left 60% */}
      {hasContent && (
        <div
          // key per slide forces a remount so stateful visuals reset to a
          // clean state on arrival.
          key={`content-${slideIndex}`}
          style={{
            flex: "0 0 60%",
            overflow: "hidden",
            backgroundColor: CONTENT_BG,
            ...GRID_TEXTURE,
            borderRight: `1px solid ${BORDER}`,
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {slide.content}
        </div>
      )}

      {/* Copy panel — right 40% or full-width */}
      <div
        style={{
          flex: hasContent ? "0 0 40%" : "1",
          overflow: "auto",
          backgroundColor: COPY_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: hasContent ? "flex-start" : "center",
          paddingRight: isFullscreen ? "5vw" : 0,
        }}
      >
        {hasContent ? (
          slide.copy
        ) : (
          <div style={{ width: "100%", maxWidth: "820px", padding: "0 60px" }}>
            {slide.copy}
          </div>
        )}
      </div>
    </div>
  );
}
