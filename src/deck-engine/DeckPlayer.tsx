import { useEffect, useRef, useState } from "react";
import { FluentProvider, Button, webDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import type { Slide } from "../decks/types";
import { useDeckController } from "./DeckController";
import { SlideRenderer, DECK_BG } from "./SlideRenderer";
import { DeckChrome } from "./DeckChrome";
import { useSlideNarration } from "./useSlideNarration";
import { useSwipeNavigation } from "./useSwipeNavigation";
import { useViewport } from "../viewport";
import { useVoiceControls } from "./useVoiceControls";
import type { NarrationVoice } from "./narrationConstants";

// NarrationVoice now lives with the rest of the narration contract
// (narrationConstants.ts). Re-exported here so existing importers keep working.
export type { NarrationVoice };

// What a window IS, declared per viewing rather than reconciled from a pile of
// independent flags — and which of the two bars it gets.
//
//   "audience" — the viewer: Sofa, or Audiobook mode when the host turns it
//     on. The viewer's bar (Exit | the transport | settings, fullscreen, the
//     sound) at every width; NO notes surface exists. Absent, not hidden: a
//     link someone shared with you has nothing to escalate to.
//   "presenter" — the podium. The presenter's bar, everything inline, with the
//     notes popout; never at the phone width, where the bar can't fold.
export type DeckMode = "presenter" | "audience";

/**
 * The modes a host offers, when it says nothing: both. A host that only ever
 * plays to a viewer passes ["audience"] and gets no Podium anywhere — no
 * presenter's bar, no notes button — whatever `mode` says.
 */
export const ALL_DECK_MODES: readonly DeckMode[] = ["audience", "presenter"];

// Host facts all arrive as props — nothing here fetches or reads ambient state,
// which is what lets one player serve both a live narrate server and a folder
// of committed mp3s.
export function DeckPlayer({
  deckId,
  slides,
  mode,
  notesUrlBase,
  voices,
  hasApi = false,
  resolveNarrationUrl,
  narrateByDefault = false,
  audiobook,
  suitcase = false,
  onAudiobookChange,
  offeredModes = ALL_DECK_MODES,
  preferredVoiceId,
  onVoicePicked,
  onAfterSlideNavCallback,
  initialSlideIndex = 0,
  theme = webDarkTheme,
}: {
  deckId: string | undefined;
  slides: Slide[];
  /** Required, no default: see DeckMode. */
  mode: DeckMode;
  /**
   * The modes this host offers (ALL_DECK_MODES by default). Podium is drawn
   * only where it is offered AND the window is wider than a phone; anything
   * else plays on the viewer's bar. A host that never presents passes
   * ["audience"], and locking a player to one mode is just that.
   */
  offeredModes?: readonly DeckMode[];
  /** Defaults to this app's BrowserRouter path; a HashRouter host passes "/#/decks". */
  notesUrlBase?: string;
  /** Pair with resolveNarrationUrl. Wired, both bars carry the sound and the voice. */
  voices?: readonly NarrationVoice[];
  /** See voiceCoverage.ts — a live synthesizer means no voice is ever disabled. */
  hasApi?: boolean;
  resolveNarrationUrl?: (slide: Slide, voiceId: string) => string | null;
  /**
   * Start narrating on arrival instead of waiting for the sound control. The
   * viewer's bar only: Podium opens silent, since a presenter's own voice is
   * usually the point, and its sound button is there when it isn't.
   */
  narrateByDefault?: boolean;
  /**
   * Audiobook mode: read the deck aloud and advance when the current slide's
   * narration ends, stopping at the last slide. A host fact like `mode` — the
   * player is told, and never reads a preference itself. Turns narration on
   * with it; ignored in Podium, where a presenter turns their own slides.
   */
  audiobook?: boolean;
  /**
   * @deprecated The old name for `audiobook`, read only when `audiobook` is
   * not passed. Pass `audiobook` instead.
   */
  suitcase?: boolean;
  /**
   * Choose Sofa (false) or Audiobook (true) from the viewer's settings sheet.
   * The host stores the choice and passes it back as `audiobook`. Omitted, the
   * sheet has no mode row: the host has fixed the mode itself.
   */
  onAudiobookChange?: (next: boolean) => void;
  /**
   * Which voice this visitor picked, from wherever the host stores it. A
   * DEFAULT only: voiceCoverage honors it just when that voice covers this
   * deck end to end, so a preference remembered from another deck can't
   * select a voice that plays nothing here. Omit and the player opens on the
   * first covered voice.
   */
  preferredVoiceId?: string;
  /**
   * Remember a voice picked from inside the player. Every voice change
   * persists, wherever it's made — arrive on Brian, switch to Jenny, and the
   * next deck opens on Jenny. `setVoiceId` alone is session state, so without
   * this an in-player pick would be forgotten on exit and "pick a voice" would
   * mean two different things depending on which control you used.
   */
  onVoicePicked?: (voiceId: string) => void;
  /**
   * Fires after the visitor lands on a slide: (slideIndex, totalSlides). The
   * one seam a host gets into navigation, and the extension point behind
   * anything that wants to REMEMBER what was watched — a history page, a
   * "continue where you left off", an analytics ping.
   *
   * "After" is in the name because it is not interceptable: the navigation has
   * already happened and nothing you return changes it. The player never
   * persists any of this itself, and never learns what a host does with it.
   *
   * Fires on arrival at slide 0 as well as on every move within a deck, in
   * both modes — rehearsing a deck in presenter mode is still watching it, and
   * a host that disagrees can check `mode` itself. Passing a fresh inline
   * arrow every render is safe; useDeckController reads this through a ref.
   */
  onAfterSlideNavCallback?: (slideIndex: number, totalSlides: number) => void;
  /**
   * Which slide to OPEN this deck on. Defaults to 0; a host that remembers
   * where a visitor stopped passes that instead, and the deck resumes.
   *
   * Read ONCE per deck, not live. That distinction is the whole reason this is
   * safe: a host computes it from its own stored progress, so it changes on
   * every slide change, and an engine that honoured it continuously would snap
   * the visitor back on every step. useDeckController holds it in a ref.
   *
   * Clamped to the deck, so a number stored against a longer version of it
   * cannot open past the end.
   */
  initialSlideIndex?: number;
  /** Escape hatch. The default is unbranded so no app's palette follows a deck in. */
  theme?: Theme;
}) {
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  // The mode this window plays in: Podium only where the host offers it and
  // never at the phone width (the presenter's bar does not fold). The engine
  // enforces this itself, so a host that forgets the phone rule can't strand a
  // phone on a bar it can't use.
  const playMode: DeckMode =
    mode === "presenter" && offeredModes.includes("presenter") && !isMobile
      ? "presenter"
      : "audience";
  const audiobookOn = audiobook ?? suitcase;

  // A notes popout outlives the mode that opened it. A host can flip presenter
  // off mid-session — PresentationDeck forces audience once the viewport
  // crosses into mobile — and the popout, being a separate window with its own
  // React tree, has no way to notice. It keeps following slide changes on the
  // shared BroadcastChannel while the parent has already switched to audience
  // chrome: two windows disagreeing about what the session is.
  //
  // Reuses the channel and the message exitDeck already broadcasts, because
  // this IS that situation from the popout's point of view — the thing it was
  // attached to is gone. Widen the window again and Podium comes back, so the
  // notes button is there to reopen it.
  const wasPresenterRef = useRef(playMode === "presenter");
  useEffect(() => {
    const wasPresenter = wasPresenterRef.current;
    wasPresenterRef.current = playMode === "presenter";
    if (!wasPresenter || playMode === "presenter" || !deckId) return;
    const channel = new BroadcastChannel(`connected-deck-${deckId}`);
    channel.postMessage({ type: "deck-closed" });
    channel.close();
  }, [playMode, deckId]);
  const { slideIndex, isFullscreen, goNext, goPrev, toggleFullscreen, exitDeck } =
    useDeckController(slides, deckId, onAfterSlideNavCallback, initialSlideIndex);

  // In-player narration, wherever the host wired it: the viewer's bar carries
  // the sound and the sheet, and the presenter's bar carries the sound and the
  // voice dropdown inline.
  const wantsNarration = !!voices?.length && !!resolveNarrationUrl;

  // Same hook the notes popout mounts, so the two surfaces can't disagree.
  const { voices: surveyedVoices, voiceId, setVoiceId, hasAnyNarration } =
    useVoiceControls({
      slides,
      voices: voices ?? [],
      hasApi,
      resolveUrl: resolveNarrationUrl,
      enabled: wantsNarration,
      // The visitor's stored voice, honored only if it can actually narrate
      // THIS deck — voiceCoverage falls back to a covered voice otherwise, so
      // a remembered "Brian" can't silently select silence on a Jenny-only
      // deck. Without this the player always opened on DEFAULT_VOICE_ID and
      // the Settings choice wrote to storage that nothing read.
      preferredVoiceId,
    });

  // Coverage decides whether the controls are ENABLED, never whether they
  // exist. Present-but-disabled reads as "this deck wasn't baked"; absent would
  // claim "this player can't narrate", which is a different and false thing.
  const currentSlide = slides[slideIndex];
  const narrationUrl =
    wantsNarration && hasAnyNarration && currentSlide && voiceId
      ? resolveNarrationUrl!(currentSlide, voiceId)
      : null;
  // AUDIOBOOK MODE runs at every width on the viewer's bar, whose counter
  // gives way to the play ring while it is on: the ring is what says, on any
  // screen, why the deck is moving on its own, previous and next either side
  // of it skip a slide without leaving the mode, and the sheet behind the gear
  // is the way back to paging. Never in Podium: a presenter turns their own
  // slides.
  //
  // Gated on the LIVE mode rather than on a stored flag, so narrowing a Podium
  // window into the viewer's bar picks the mode up, and widening it again
  // stops the advance. The host's choice itself is left alone.
  const audiobookActive = wantsNarration && audiobookOn && playMode === "audience";

  // goNext already clamps at the last slide, so the deck simply stops
  // advancing when it runs out — no separate "end of deck" state to build.
  // Held while the viewer's settings sheet is open — see onSettingsOpenChange.
  // Not `enabled`: suspending leaves narration ON, so the sheet's own switch
  // still reads "Narrated" and playback picks up mid-clip on close.
  const [settingsOpen, setSettingsOpen] = useState(false);

  const narration = useSlideNarration({
    url: narrationUrl,
    // Audiobook mode turns narration on with it: a deck that turns its own
    // slides on a clip's end needs clips to end.
    enabledDefault:
      wantsNarration && playMode === "audience" && (narrateByDefault || audiobookOn),
    onEnded: audiobookActive ? goNext : undefined,
    suspended: settingsOpen,
  });

  // Thumb paging on a phone. Gated on the tier ALONE, not on the mode: a
  // phone-width deck pages by swipe whether it is reading itself in Audiobook
  // mode or paged by hand, because the gesture means the same thing either
  // way. Same live-viewport gate as everything else here, so rotating to
  // landscape drops it with the rest of the phone layout.
  //
  // Handed the controller's OWN goNext/goPrev, which is what keeps Audiobook
  // mode's auto-advance intact: a swipe is then indistinguishable from an
  // arrow press, and the dwell-timer cancellation, clip restart, and
  // pause-survives-navigation behaviour all come along for free (details in
  // useSwipeNavigation's header).
  const swipe = useSwipeNavigation({ onNext: goNext, onPrev: goPrev, enabled: isMobile });

  if (slides.length === 0) {
    return (
      <FluentProvider theme={theme}>
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999, backgroundColor: DECK_BG,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "16px", color: "#fff",
          }}
        >
          <p style={{ fontSize: "1.4rem", margin: 0 }}>Deck &ldquo;{deckId}&rdquo; not found</p>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={theme} style={{ colorScheme: "dark", height: "100%", display: "contents" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: DECK_BG, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* The swipe target: one element covering the slide area, reading both
            directions. Direction is the sign of the gesture's travel, not the
            half of the screen it started in, so there is no left zone and no
            right zone to miss.

            A real box rather than display:contents, because touch-action needs
            one — on a boxless element the browser drops the declaration. The
            wrapper therefore takes over SlideRenderer's slot in the column and
            the renderer fills it: same layout, one element deeper.

            touch-action:none because the player never scrolls (it is fixed,
            inset 0, with the slide scaled to fit). The browser decides a
            gesture's axis from its first few pixels, so leaving it free to
            claim a slightly off-axis drag as a pan cancels the pointer stream
            mid-swipe. If a slide ever becomes scrollable, this needs to become
            pan-y and the cancel path needs handling. */}
        <div
          data-swipe-surface=""
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            touchAction: isMobile ? "none" : undefined,
          }}
          {...swipe}
        >
          {/* stacked is the player's call, not the renderer's: SlideRenderer
              takes it as a prop so a host rendering slides into a fixed-size
              stage (poster, thumbnail) can keep the split on a narrow screen. */}
          <SlideRenderer
            slide={slides[slideIndex]}
            slideIndex={slideIndex}
            isFullscreen={isFullscreen}
            stacked={isMobile}
          />
        </div>
        <DeckChrome
          slideIndex={slideIndex} slides={slides} deckId={deckId ?? ""}
          isFullscreen={isFullscreen} goNext={goNext} goPrev={goPrev}
          toggleFullscreen={toggleFullscreen} onExit={exitDeck}
          bar={playMode === "presenter" ? "presenter" : "viewer"}
          compact={isMobile}
          hasNotesSurface={playMode === "presenter"}
          notesUrlBase={notesUrlBase}
          // "Requires narration in both directions" applies to the SESSION
          // layer too, not just the stored prefs (voicePreference.tsx): the
          // sound button and the sheet's Narrated row drive narration.enabled,
          // and a viewing declared silent has no clip-ends for Audiobook mode
          // to advance on. Without this gate the bar kept the play ring over a
          // silent deck — a play control for a mode that could no longer mean
          // anything. Transport PAUSE is not this: pause holds playback with
          // narration still on (see useSlideNarration), so the ring survives
          // its own button.
          audiobookMode={audiobookActive && narration.enabled}
          onAudiobookChange={wantsNarration ? onAudiobookChange : undefined}
          onSettingsOpenChange={setSettingsOpen}
          narration={
            wantsNarration
              ? {
                  available: narration.available,
                  playing: narration.playing,
                  enabled: narration.enabled,
                  toggle: narration.toggle,
                  paused: narration.paused,
                  togglePause: narration.togglePause,
                  getSlideProgress: narration.getSlideProgress,
                  voices: surveyedVoices,
                  voiceId,
                  // Session AND storage: the picker moves this viewing, and
                  // the host remembers it for the next deck.
                  onVoiceChange: (next: string) => {
                    setVoiceId(next);
                    onVoicePicked?.(next);
                  },
                  hasAnyNarration,
                }
              : undefined
          }
        />
      </div>
    </FluentProvider>
  );
}
