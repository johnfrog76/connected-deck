import { useState } from "react";
import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  tokens,
} from "@fluentui/react-components";
import {
  DismissRegular,
  PauseFilled,
  PlayFilled,
  SettingsRegular,
} from "@fluentui/react-icons";
import {
  NAV_BG,
  BORDER,
  openNotesWindow,
  type DeckChromeProps,
} from "./deckChromeShared";
import {
  CLOSE_SETTINGS_LABEL,
  EXIT_DECK_LABEL,
  OPEN_NOTES_LABEL,
  SETTINGS_LABEL,
} from "./narrationConstants";
// The switches and the voice radios all live in the shared form now — this
// file owns the BAR (transport, exit, gear) and the sheet it opens, not what
// goes inside it.
import { SettingsForm } from "../SettingsForm";

// The bus chrome. Written for one person, one thumb, a phone at arm's length,
// and quite possibly not looking at the screen at all.
//
// Three things follow, none of which are true of the desktop chrome:
//
//   1. TOUCH TARGETS, not pixel economy. 44px is the Apple HIG floor and
//      Fluent's "medium" is only 32, so every control is explicitly sized.
//      Nobody is watching this on a projector, so the chrome can afford room.
//   2. A GEAR, not a "⋯". This sheet is where voice, narration and Suitcase
//      Mode live, and in Suitcase Mode it is the ONLY route back to manual
//      paging. "⋯" promises unspecified extras; a gear names what's behind it,
//      which is what someone hunting for the way out is looking for.
//   3. ONE BUTTON in Suitcase Mode. Paging arrows and a slide counter are the
//      wrong controls for a listening-not-watching mode — the one thing worth
//      a 44px target with your eyes closed is play/pause.
//
// Everything arrives as props. No context, no ambient hooks, no breakpoint
// opinions baked in — lift this file into another stack and it works as long
// as you hand it the same shape.

const TOUCH = { minHeight: "44px", minWidth: "44px" } as const;
// Paging arrows are the most-pressed controls, so they get extra width and a
// bigger glyph than the square minimum.
const TOUCH_PAGE = { ...TOUCH, minWidth: "56px", fontSize: "20px" } as const;
// Exit's glyph is bare TEXT, not an icon component, so a 44px box left it
// drawing a ~14px ✕ floating in a big empty target. Sized to match the arrows
// so the bar's glyphs agree.
const TOUCH_EXIT = { ...TOUCH, fontSize: "20px", lineHeight: 1 } as const;

export function DeckChromeMobile({
  slideIndex,
  slides,
  deckId,
  goNext,
  goPrev,
  onExit,
  hasNotesSurface = false,
  notesUrlBase = "/deck",
  narration,
  suitcaseMode = false,
  onSettingsOpenChange,
}: DeckChromeProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // One place that both moves the sheet and tells the player, so the two can't
  // disagree — a sheet that opened without suspending playback would talk over
  // the reader, and a suspend that outlived the sheet would leave a deck
  // silently paused with nothing on screen explaining why.
  const setSheet = (open: boolean) => {
    setSettingsOpen(open);
    onSettingsOpenChange?.(open);
  };

  // Requires narration that can ACTUALLY PLAY, not merely narration that was
  // wired. On a deck with nothing baked and no synthesizer, `narration` is a
  // live object whose hasAnyNarration is false — truthy enough to pass a
  // `!!narration` check, which put a dead play button where the paging arrows
  // belong and left the reader stranded on slide one with no way forward.
  // Suitcase Mode is a promise the deck can't keep here, so the bar stays in
  // its ordinary paging form.
  const showTransport = suitcaseMode && !!narration && narration.hasAnyNarration;

  return (
    <>
      <div
        style={{
          flexShrink: 0,
          backgroundColor: NAV_BG,
          borderTop: `1px solid ${BORDER}`,
          // Home-bar safe area — an iPhone's gesture bar sits over the bottom
          // of the viewport, and a 44px target half-covered by it is a 22px
          // target. This is the difference between "works on the bus" and
          // "works everywhere except the one phone you own".
          padding: "8px 12px calc(8px + env(safe-area-inset-bottom)) 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        {/* Left: exit. Icon-only — "✕ Exit" costs width the transport needs. */}
        <Button
          size="medium"
          appearance="subtle"
          onClick={onExit}
          aria-label={EXIT_DECK_LABEL}
          style={TOUCH_EXIT}
        >
          ✕
        </Button>

        {/* Center: either the paging group, or Suitcase Mode's single
            play/pause. Never both — the whole point of Suitcase Mode is that
            there is one control worth finding without looking. */}
        {showTransport && narration ? (
          <Button
            size="large"
            appearance="subtle"
            onClick={narration.toggle}
            aria-label={narration.enabled ? "Pause" : "Play"}
            style={{ minHeight: TOUCH.minHeight, minWidth: "72px" }}
            icon={
              narration.enabled ? (
                <PauseFilled fontSize="28px" />
              ) : (
                <PlayFilled fontSize="28px" />
              )
            }
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Button
              size="medium"
              appearance="subtle"
              disabled={slideIndex === 0}
              onClick={goPrev}
              aria-label="Previous slide"
              style={TOUCH_PAGE}
            >
              ←
            </Button>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                color: tokens.colorNeutralForeground3,
                minWidth: "56px",
                textAlign: "center",
              }}
            >
              {slideIndex + 1} / {slides.length}
            </span>
            <Button
              size="medium"
              appearance="subtle"
              disabled={slideIndex === slides.length - 1}
              onClick={goNext}
              aria-label="Next slide"
              style={TOUCH_PAGE}
            >
              →
            </Button>
          </div>
        )}

        {/* Right: the gear. Always present, always in the same place — in
            Suitcase Mode it is the only way back to manual paging, so it must
            never move or hide. */}
        <Button
          size="medium"
          appearance="subtle"
          aria-label={SETTINGS_LABEL}
          icon={<SettingsRegular />}
          onClick={() => setSheet(true)}
          style={TOUCH}
        />
      </div>

      {/* Bottom sheet, not a side drawer: it opens under the thumb rather than
          across the slide.

          Mounted only while open, rather than kept hidden: the sheet is a
          whole settings form with its own subscriptions, and a closed one has
          nothing to preserve — every value it shows lives in a context that
          outlives it. Unmounting also guarantees it can't hold stale state
          across an open/close cycle. */}
      {settingsOpen && (
      <OverlayDrawer
        open={settingsOpen}
        position="bottom"
        // "small" cut the voice list off mid-way — the last option sat below
        // the fold behind a scrollbar, which reads as the sheet being broken
        // rather than scrollable. The content is four rows plus their hints;
        // it needs the room. Capped at 85vh so the slide stays partly visible
        // behind it: this opens over something you were reading, and covering
        // the whole screen would read as navigating away rather than as a
        // panel you can dismiss.
        size="medium"
        style={{ maxHeight: "85vh" }}
        onOpenChange={(_, { open }) => {
          if (!open) setSheet(false);
        }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label={CLOSE_SETTINGS_LABEL}
                icon={<DismissRegular />}
                onClick={() => setSheet(false)}
              />
            }
          >
            {SETTINGS_LABEL}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          }}
        >
          {/* The SAME form the launch page's Settings drawer renders — same
              rows, same hints, same gating rules — told to present itself as a
              sheet. It drives the LIVE player here (narration/voice arrive as
              props) rather than the stored preference, because muting the deck
              you're watching shouldn't rewrite what every future deck does.
              Presenter is absent by design: the mode is fixed for the life of
              this mount, so a switch here couldn't take effect without leaving
              the deck, and flipping it would orphan an open notes window. */}
          {narration && (
            <SettingsForm
              variant="sheet"
              narrationValue={narration.enabled}
              onNarrationChange={narration.toggle}
              narrationDisabled={!narration.hasAnyNarration}
              voices={narration.voices}
              voiceId={narration.voiceId}
              onVoiceChange={narration.onVoiceChange}
            />
          )}

          {/* Rare, but a presenter on a phone is still a presenter. No
              fullscreen button: iOS Safari has no Fullscreen API, so it would
              be a control that silently does nothing. */}
          {hasNotesSurface && (
            <Button
              appearance="subtle"
              style={TOUCH}
              onClick={() => {
                openNotesWindow(notesUrlBase, deckId, slideIndex);
                setSheet(false);
              }}
            >
              {OPEN_NOTES_LABEL}
            </Button>
          )}
        </DrawerBody>
      </OverlayDrawer>
      )}
    </>
  );
}
