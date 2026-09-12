import { Button, Dropdown, Option, tokens } from "@fluentui/react-components";
import {
  Speaker0Regular,
  Speaker2Filled,
  SpeakerMuteRegular,
  SpeakerOffRegular,
} from "@fluentui/react-icons";
import {
  NAV_BG,
  BORDER,
  openNotesWindow,
  type DeckChromeProps,
} from "./deckChromeShared";
import {
  NO_NARRATION_TITLE,
  OPEN_NOTES_LABEL,
  VOICE_PICKER_TITLE,
  voiceOptionLabel,
} from "./narrationConstants";

// The podium chrome. Understated ON PURPOSE: these controls are projected on a
// wall in front of a room, so every pixel they occupy is a pixel the audience
// is looking at instead of the slide. Small buttons, subtle appearance,
// everything inline — no drawers, no sheets, nothing that animates.
//
// Do not port mobile's reasoning here. A gear that "names what's behind it" is
// the right call for a thumb hunting on a bus and the wrong call for a room
// watching a talk. See DeckChromeMobile for the other half of that argument.

export function DeckChromeDesktop({
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
  narration,
}: DeckChromeProps) {
  const voiceName =
    narration?.voices.find((v) => v.id === narration.voiceId)?.name ?? "";
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

        {/* Narration controls — toggle + voice picker. Shown only when the host
            wires narration. The toggle disables on slides with no baked clip in
            the current voice, so it never silently does nothing. */}
        {narration && (
          <>
            <Button
              size="small"
              appearance={narration.enabled ? "primary" : "subtle"}
              // Two independent reasons to disable, and the deck-wide one wins:
              // no voice covers this deck at all, or this slide has no clip in
              // the (covered) voice currently selected.
              disabled={!narration.hasAnyNarration || !narration.available}
              icon={
                narration.playing ? (
                  <Speaker2Filled />
                ) : narration.available ? (
                  <SpeakerMuteRegular />
                ) : (
                  <SpeakerOffRegular />
                )
              }
              onClick={narration.toggle}
              title={
                !narration.hasAnyNarration
                  ? NO_NARRATION_TITLE
                  : narration.available
                    ? narration.enabled
                      ? "Stop narration"
                      : "Play with narration"
                    : "No narration for this slide"
              }
            />
            <Dropdown
              size="small"
              // Nothing narrates this deck ⇒ the picker is dead too. Every
              // option inside it would be disabled, so a dropdown that still
              // opens would just be a menu of things you can't pick.
              disabled={!narration.hasAnyNarration}
              value={voiceName}
              selectedOptions={[narration.voiceId]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) narration.onVoiceChange(data.optionValue);
              }}
              style={{ minWidth: "84px" }}
              title={
                narration.hasAnyNarration ? VOICE_PICKER_TITLE : NO_NARRATION_TITLE
              }
            >
              {narration.voices.map((v) => (
                <Option
                  key={v.id}
                  value={v.id}
                  text={v.name}
                  disabled={!v.available}
                >
                  {voiceOptionLabel(v.name, v.available)}
                </Option>
              ))}
            </Dropdown>
          </>
        )}
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
