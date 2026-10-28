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
  ChevronLeftRegular,
  ChevronRightRegular,
  DismissRegular,
  SettingsRegular,
  Speaker2Filled,
  SpeakerMuteRegular,
  SpeakerOffRegular,
} from "@fluentui/react-icons";
import { AudiobookTransport } from "./AudiobookTransport";
import { NAV_BG, BORDER, type DeckChromeProps } from "./deckChromeShared";
import {
  CLOSE_SETTINGS_LABEL,
  EXIT_DECK_LABEL,
  NO_NARRATION_TITLE,
  SETTINGS_LABEL,
} from "./narrationConstants";
import {
  RING_SIZE,
  TOUCH_ARROW_WIDTH,
  TOUCH_TARGET,
  VIEWER_BAR_COLUMNS,
  counterWidth,
  viewerBarGap,
  viewerBarInset,
} from "./viewerBarLayout";
// The switches and the voice radios all live in the shared form — this file
// owns the BAR (exit, transport, gear, fullscreen, sound) and the sheet it
// opens, not what goes inside it.
import { SettingsForm } from "../SettingsForm";

// The viewer's bar: Sofa and Audiobook mode, at every width. Written for
// someone watching or listening rather than presenting — on a phone, one
// person, one thumb, quite possibly not looking at the screen at all.
//
// Three things follow, none of which are true of the presenter's bar:
//
//   1. THREE COLUMNS. Exit | the transport | settings, fullscreen, the sound,
//      laid out so the transport's centre is the screen's centre at every
//      width (viewerBarLayout.ts holds the rule and the sizes behind it).
//   2. A GEAR, not a "⋯". The sheet behind it holds the mode, narration and
//      the voice, and in Audiobook mode it is the way back to paging. "⋯"
//      promises unspecified extras; a gear names what's behind it.
//   3. THE RING in Audiobook mode. The counter between previous and next gives
//      way to one play/pause wearing the slide's progress — the control worth
//      finding with your eyes closed — with previous and next still either
//      side of it, so a slide can be skipped without leaving the mode.
//
// At the phone width (`compact`) every control is a touch target, Exit drops
// its word, and fullscreen goes: iOS Safari has no Fullscreen API, and the
// browser already gives the deck the screen.
//
// Everything arrives as props. No breakpoint opinions baked in — lift this file
// into another stack and it works as long as you hand it the same shape (and
// mount the sheet's SettingsForm inside its providers; see DeckChrome).

const TOUCH = { minHeight: `${TOUCH_TARGET}px`, minWidth: `${TOUCH_TARGET}px` } as const;
// Paging arrows are the most-pressed controls, so they get extra width and a
// bigger glyph than the square minimum. Thin chevrons rather than ← →: either
// side of the ring they read as quiet skip marks, and the ring stays the
// heaviest thing in the middle.
const TOUCH_PAGE = { ...TOUCH, minWidth: `${TOUCH_ARROW_WIDTH}px`, fontSize: "20px" } as const;
// Exit's glyph is bare TEXT, not an icon component, so a 44px box left it
// drawing a ~14px ✕ floating in a big empty target. Sized to match the arrows
// so the bar's glyphs agree.
const TOUCH_EXIT = { ...TOUCH, fontSize: "20px", lineHeight: 1 } as const;

export function DeckChromeViewer({
  slideIndex,
  slides,
  isFullscreen,
  goNext,
  goPrev,
  toggleFullscreen,
  onExit,
  narration,
  compact = false,
  audiobookMode = false,
  onAudiobookChange,
  onSettingsOpenChange,
}: DeckChromeProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const buttonSize = compact ? "medium" : "small";

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
  // `!!narration` check, which put a dead play button where the counter
  // belongs. Audiobook mode is a promise the deck can't keep here, so the bar
  // stays in its paging form.
  const showRing = audiobookMode && !!narration && narration.hasAnyNarration;

  const prevButton = (
    <Button
      size={buttonSize}
      appearance="subtle"
      disabled={slideIndex === 0}
      onClick={goPrev}
      aria-label="Previous slide"
      icon={<ChevronLeftRegular />}
      style={compact ? TOUCH_PAGE : undefined}
    />
  );
  const nextButton = (
    <Button
      size={buttonSize}
      appearance="subtle"
      disabled={slideIndex === slides.length - 1}
      onClick={goNext}
      aria-label="Next slide"
      icon={<ChevronRightRegular />}
      style={compact ? TOUCH_PAGE : undefined}
    />
  );

  const gap = `${viewerBarGap(compact)}px`;
  const inset = `${viewerBarInset(compact)}px`;

  return (
    <>
      <div
        data-bar="viewer"
        style={{
          flexShrink: 0,
          backgroundColor: NAV_BG,
          borderTop: `1px solid ${BORDER}`,
          // Home-bar safe area on a phone — an iPhone's gesture bar sits over
          // the bottom of the viewport, and a 44px target half-covered by it is
          // a 22px target. env() is 0 where there is no inset.
          padding: compact
            ? `8px ${inset} calc(8px + env(safe-area-inset-bottom))`
            : `10px ${inset}`,
          // Three columns, the outer two equal (viewerBarLayout.ts), so the
          // transport's centre is the bar's centre at every width.
          display: "grid",
          gridTemplateColumns: VIEWER_BAR_COLUMNS,
          alignItems: "center",
          columnGap: gap,
        }}
      >
        {/* Left: exit. Icon-only on a phone — the word costs width the
            transport needs. */}
        <div data-bar-column="left" style={{ display: "flex", justifyContent: "flex-start" }}>
          <Button
            size={buttonSize}
            appearance="subtle"
            onClick={onExit}
            aria-label={EXIT_DECK_LABEL}
            style={compact ? TOUCH_EXIT : undefined}
          >
            {compact ? "✕" : "✕ Exit"}
          </Button>
        </div>

        {/* Center: previous and next either side of the counter, or of the
            play ring in Audiobook mode.

            The ring drives the transport HOLD (togglePause), never narration
            (toggle). Pause means "hold the audiobook", so the ring stays put
            with a Play glyph; if it flipped narration off instead, the
            player's gating would hand the middle back to the counter and the
            button would delete itself under the thumb that pressed it. The way
            OUT of Audiobook mode is the sheet's mode row, behind the gear. */}
        <div
          data-bar-column="transport"
          style={{ display: "flex", alignItems: "center", gap }}
        >
          {prevButton}
          {showRing && narration ? (
            <AudiobookTransport
              paused={narration.paused}
              onTogglePause={narration.togglePause}
              getProgress={narration.getSlideProgress}
              size={RING_SIZE}
            />
          ) : (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                // ~3.5:1 was too faint on the near-black nav; the token clears WCAG AA.
                color: tokens.colorNeutralForeground3,
                minWidth: `${counterWidth(compact)}px`,
                textAlign: "center",
              }}
            >
              {slideIndex + 1} / {slides.length}
            </span>
          )}
          {nextButton}
        </div>

        {/* Right: the gear, fullscreen, the sound. The gear never moves or
            hides — in Audiobook mode it is the way back to paging. */}
        <div
          data-bar-column="right"
          style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap }}
        >
          {narration && (
            <Button
              size={buttonSize}
              appearance="subtle"
              aria-label={SETTINGS_LABEL}
              icon={<SettingsRegular />}
              onClick={() => setSheet(true)}
              style={compact ? TOUCH : undefined}
            />
          )}
          {!compact && (
            <Button
              size="small"
              appearance="subtle"
              title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "⊡" : "⛶"}
            </Button>
          )}
          {/* The sound: narration on or off for this viewing. The SAME setting
              as the sheet's Narration row — both call narration.toggle and
              read narration.enabled — so a change in either shows in both. */}
          {narration && (
            <Button
              size={buttonSize}
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
              style={compact ? TOUCH : undefined}
            />
          )}
        </div>
      </div>

      {/* Bottom sheet, not a side drawer: it opens under the thumb rather than
          across the slide, and the same grammar serves a wide window.

          Mounted only while open, rather than kept hidden: the sheet is a
          whole settings form with its own subscriptions, and a closed one has
          nothing to preserve — every value it shows lives in the player or a
          context that outlives it. */}
      {settingsOpen && (
        <OverlayDrawer
          open={settingsOpen}
          position="bottom"
          // "small" cut the voice list off mid-way — the last option sat below
          // the fold behind a scrollbar, which reads as the sheet being broken
          // rather than scrollable. Capped at 85vh so the slide stays partly
          // visible behind it: this opens over something you were reading.
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
                rows, same hints, same gating rules — told to present itself as
                a sheet. It drives the LIVE player here (narration, voice and
                mode arrive as props) rather than the stored preference for
                narration, because muting the deck you're watching shouldn't
                rewrite what every future deck does. Podium is absent by
                design: the mode a deck opens in is chosen before it opens. */}
            {narration && (
              <SettingsForm
                variant="sheet"
                narrationValue={narration.enabled}
                onNarrationChange={narration.toggle}
                narrationDisabled={!narration.hasAnyNarration}
                voices={narration.voices}
                voiceId={narration.voiceId}
                onVoiceChange={narration.onVoiceChange}
                audiobookValue={audiobookMode}
                onAudiobookChange={onAudiobookChange}
              />
            )}
          </DrawerBody>
        </OverlayDrawer>
      )}
    </>
  );
}
