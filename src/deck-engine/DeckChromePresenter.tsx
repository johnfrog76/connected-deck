import { Button, tokens } from "@fluentui/react-components";
import { Speaker0Regular } from "@fluentui/react-icons";
import {
  NAV_BG,
  BORDER,
  openNotesWindow,
  type DeckChromeProps,
} from "./deckChromeShared";
import { OPEN_NOTES_LABEL } from "./narrationConstants";

// The presenter's bar, Podium mode's. Exit, previous, the
// counter, next, the notes, fullscreen. Sound and the voice are NOT here: they
// belong to the speaker-notes window, and a toggle on the projected bar played
// the narration in both windows. Understated ON
// PURPOSE all the same: the bar is projected on a wall in front of a room, so
// every pixel it occupies is a pixel the audience is looking at instead of the
// slide. Small buttons, subtle appearance, no drawers, no sheets, nothing that
// animates.
//
// Never drawn at the phone width: DeckPlayer does not offer Podium there, so
// this bar never has to fold. Do not port the viewer's bar's reasoning here —
// a gear that "names what's behind it" is the right call for someone watching
// and the wrong call for someone running a talk. See DeckChromeViewer for the
// other half of that argument.

export function DeckChromePresenter({
  slideIndex,
  slides,
  deckId,
  isFullscreen,
  goNext,
  goPrev,
  toggleFullscreen,
  onExit,
  hasNotesSurface = true,
  notesUrlBase = "/deck",
}: DeckChromeProps) {
  return (
    <div
      data-bar="presenter"
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

      {/* Center: prev / counter / next, */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Button size="small" appearance="subtle" disabled={slideIndex === 0} onClick={goPrev}>
          ←
        </Button>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            // was "#666" (~3.5:1 on the near-black nav) — token clears WCAG AA.
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
        {hasNotesSurface && (
          <Button
            size="small"
            appearance="subtle"
            title={OPEN_NOTES_LABEL}
            icon={<Speaker0Regular />}
            onClick={() => openNotesWindow(notesUrlBase, deckId, slideIndex)}
          />
        )}
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
