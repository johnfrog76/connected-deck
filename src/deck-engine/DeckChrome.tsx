import { Button, Dropdown, Option, tokens } from "@fluentui/react-components";
import {
  Speaker0Regular,
  Speaker2Filled,
  SpeakerMuteRegular,
  SpeakerOffRegular,
} from "@fluentui/react-icons";
import type { Slide } from "../decks/types";
import type { VoiceAvailability } from "./voiceCoverage";
import {
  NO_NARRATION_TITLE,
  VOICE_PICKER_TITLE,
  voiceOptionLabel,
} from "./narrationConstants";

const NAV_BG = "#060710";
const BORDER = "#1e2030";

/**
 * In-player narration controls state (a play/pause toggle + voice picker),
 * shown when the host wires narration. Audience mode only — presenter mode
 * narrates from the notes popout instead, if at all.
 */
export interface NarrationControls {
  /** Does the CURRENT slide have a clip in the current voice? Gates the toggle. */
  available: boolean;
  /** Is a clip actually sounding right now? (swaps the icon). */
  playing: boolean;
  /** Is narration mode on? (auto-play as slides arrive). */
  enabled: boolean;
  toggle: () => void;
  /**
   * Voices WITH their deck-wide coverage (voiceCoverage.ts). Uncovered voices
   * are rendered disabled rather than dropped, so the audience can see that a
   * voice exists but wasn't baked for this deck — a missing option looks like a
   * feature that doesn't exist, a disabled one reads as "not for this deck".
   */
  voices: readonly VoiceAvailability[];
  voiceId: string;
  onVoiceChange: (voiceId: string) => void;
  /**
   * True if at least one voice covers the deck end to end. False → nothing can
   * narrate this deck, so the whole group renders disabled: the toggle AND the
   * picker, since there is no valid choice left to make inside it.
   */
  hasAnyNarration: boolean;
}

interface DeckChromeProps {
  slideIndex: number;
  slides: Slide[];
  deckId: string;
  isFullscreen: boolean;
  goNext: () => void;
  goPrev: () => void;
  toggleFullscreen: () => void;
  onExit: () => void;
  narration?: NarrationControls;
  /**
   * Whether this host has a speaker-notes surface. The notes button opens a
   * popout at {notesUrlBase}/:id/notes — a PRESENTER feature
   * (BroadcastChannel-synced second window with live narration). Defaults
   * true for web.
   */
  hasNotesSurface?: boolean;
  /**
   * Base path for the notes popout. Defaults to "/deck", this app's
   * BrowserRouter scheme; a HashRouter host would need the hash prefix baked
   * in ("/#/decks") instead.
   */
  notesUrlBase?: string;
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
            title="Open speaker notes"
            icon={<Speaker0Regular />}
            onClick={() => {
              const NOTES_WIDTH = 500;
              const NOTES_HEIGHT = 850;
              const left = window.screenX + (window.innerWidth - NOTES_WIDTH) / 2;
              const top = window.screenY + (window.innerHeight - NOTES_HEIGHT) / 2;
              window.open(
                // Hand the notes window the slide the deck is currently on, so
                // opening notes late (already past slide 1) follows the deck
                // instead of resetting to slide 1.
                `${notesUrlBase}/${deckId}/notes?slide=${slideIndex}`,
                // A deck-scoped name, not "_blank" — clicking this a second
                // time (double-click, or re-opening after alt-tabbing away)
                // refocuses the SAME window instead of stacking a new one on
                // top of it. No surprise extra popups.
                `connected-deck-notes-${deckId}`,
                `width=${NOTES_WIDTH},height=${NOTES_HEIGHT},left=${Math.round(left)},top=${Math.round(top)}`
              );
            }}
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
