import { Button, tokens } from "@fluentui/react-components";
import { Speaker0Regular } from "@fluentui/react-icons";
import type { Slide } from "../decks/types";

const NAV_BG = "#060710";
const BORDER = "#1e2030";

interface DeckChromeProps {
  slideIndex: number;
  slides: Slide[];
  deckId: string;
  isFullscreen: boolean;
  goNext: () => void;
  goPrev: () => void;
  toggleFullscreen: () => void;
  onExit: () => void;
}

export function DeckChrome({
  slideIndex,
  slides,
  deckId,
  isFullscreen,
  goNext,
  goPrev,
  toggleFullscreen,
  onExit,
}: DeckChromeProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        backgroundColor: NAV_BG,
        borderTop: `1px solid ${BORDER}`,
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      {/* Left: exit */}
      <Button size="small" appearance="subtle" onClick={onExit}>
        ✕ Exit
      </Button>

      {/* Center: prev / counter / next */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Button size="small" appearance="subtle" disabled={slideIndex === 0} onClick={goPrev}>
          ←
        </Button>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            color: tokens.colorNeutralForeground3,
            minWidth: "60px",
            textAlign: "center",
          }}
        >
          {slideIndex + 1} / {slides.length}
        </span>
        <Button
          size="small"
          appearance="subtle"
          disabled={slideIndex === slides.length - 1}
          onClick={goNext}
        >
          →
        </Button>
      </div>

      {/* Right: notes + fullscreen */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          size="small"
          appearance="subtle"
          title="Open speaker notes"
          icon={<Speaker0Regular />}
          onClick={() => {
            const NOTES_WIDTH = 500;
            const NOTES_HEIGHT = 850;
            const left = window.screenX + (window.innerWidth - NOTES_WIDTH) / 2;
            const top = window.screenY + (window.innerHeight - NOTES_HEIGHT) / 2;
            window.open(
              `/deck/${deckId}/notes`,
              "_blank",
              `width=${NOTES_WIDTH},height=${NOTES_HEIGHT},left=${Math.round(left)},top=${Math.round(top)}`
            );
          }}
        />
        <Button
          size="small"
          appearance="subtle"
          title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? "⊡" : "⛶"}
        </Button>
      </div>
    </div>
  );
}
