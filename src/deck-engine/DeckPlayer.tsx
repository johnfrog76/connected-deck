import { useEffect, useRef, useState } from "react";
import { FluentProvider, Button, webDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import type { Slide } from "../decks/types";
import { useDeckController } from "./DeckController";
import { SlideRenderer, DECK_BG } from "./SlideRenderer";
import { DeckChrome } from "./DeckChrome";
import { useSlideNarration } from "./useSlideNarration";
import { useViewport } from "../viewport";
import { useVoiceControls } from "./useVoiceControls";
import type { NarrationVoice } from "./narrationConstants";

// NarrationVoice now lives with the rest of the narration contract
// (narrationConstants.ts). Re-exported here so existing importers keep working.
export type { NarrationVoice };

// What a window IS, declared per viewing rather than reconciled from a pile of
// independent flags.
//
//   "audience" — the sofa. Owns Voice/mute; NO notes surface exists. Absent,
//     not hidden: a link someone shared with you has nothing to escalate to.
//   "presenter" — the podium. The notes popout is available, and Voice/mute
//     leaves the main window because the presenter's own voice is the point.
export type DeckMode = "presenter" | "audience";

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
  suitcase = false,
  preferredVoiceId,
  onVoicePicked,
  theme = webDarkTheme,
}: {
  deckId: string | undefined;
  slides: Slide[];
  /** Required, no default: see DeckMode. */
  mode: DeckMode;
  /** Defaults to this app's BrowserRouter path; a HashRouter host passes "/#/decks". */
  notesUrlBase?: string;
  /** Pair with resolveNarrationUrl. Ignored in presenter mode. */
  voices?: readonly NarrationVoice[];
  /** See voiceCoverage.ts — a live synthesizer means no voice is ever disabled. */
  hasApi?: boolean;
  resolveNarrationUrl?: (slide: Slide, voiceId: string) => string | null;
  /** Start narrating on arrival instead of waiting for the Voice control. */
  narrateByDefault?: boolean;
  /**
   * Suitcase Mode: advance when the current slide's narration ends. A host
   * fact like `mode` — the player is told, and never reads the preference
   * itself. Ignored in presenter mode, where there's no in-player narration
   * to end.
   */
  suitcase?: boolean;
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
  /** Escape hatch. The default is unbranded so no app's palette follows a deck in. */
  theme?: Theme;
}) {
  const navigate = useNavigate();
  const { isMobile } = useViewport();

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
  const wasPresenterRef = useRef(mode === "presenter");
  useEffect(() => {
    const wasPresenter = wasPresenterRef.current;
    wasPresenterRef.current = mode === "presenter";
    if (!wasPresenter || mode === "presenter" || !deckId) return;
    const channel = new BroadcastChannel(`connected-deck-${deckId}`);
    channel.postMessage({ type: "deck-closed" });
    channel.close();
  }, [mode, deckId]);
  const { slideIndex, isFullscreen, goNext, goPrev, toggleFullscreen, exitDeck } =
    useDeckController(slides, deckId);

  // Mode owns this, not the presence of the props: presenter mode drops
  // in-player narration even when a host wires it fully.
  const wantsNarration = mode === "audience" && !!voices?.length && !!resolveNarrationUrl;

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
  // Suitcase Mode is a MOBILE affordance: it exists because paging a 60-slide
  // deck with a thumb on a bus is miserable, and the mobile chrome trades the
  // paging arrows for one big play/pause to match. On a wide screen none of
  // that applies — the desktop chrome shows ordinary paging arrows, so slides
  // advancing on their own would be a deck moving with nothing on screen
  // saying why. Resizing a window across the breakpoint therefore has to stop
  // the auto-advance, not just re-skin the chrome around it.
  //
  // Gated on the LIVE viewport rather than on a stored flag, so this follows a
  // resize the moment useViewport re-renders. The preference itself is left
  // alone: widen a window and narrow it again and Suitcase Mode is still where
  // you left it, same as Presenter.
  const suitcaseActive = wantsNarration && suitcase && isMobile;

  // goNext already clamps at the last slide, so the deck simply stops
  // advancing when it runs out — no separate "end of deck" state to build.
  // Held while the mobile settings sheet is open — see onSettingsOpenChange.
  // Not `enabled`: suspending leaves narration ON, so the sheet's own switch
  // still reads "Narrated" and playback picks up mid-clip on close.
  const [settingsOpen, setSettingsOpen] = useState(false);

  const narration = useSlideNarration({
    url: narrationUrl,
    enabledDefault: wantsNarration && narrateByDefault,
    onEnded: suitcaseActive ? goNext : undefined,
    suspended: settingsOpen,
  });

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
        {/* stacked is the player's call, not the renderer's: SlideRenderer
            takes it as a prop so a host rendering slides into a fixed-size
            stage (poster, thumbnail) can keep the split on a narrow screen. */}
        <SlideRenderer
          slide={slides[slideIndex]}
          slideIndex={slideIndex}
          isFullscreen={isFullscreen}
          stacked={isMobile}
        />
        <DeckChrome
          slideIndex={slideIndex} slides={slides} deckId={deckId ?? ""}
          isFullscreen={isFullscreen} goNext={goNext} goPrev={goPrev}
          toggleFullscreen={toggleFullscreen} onExit={exitDeck}
          hasNotesSurface={mode === "presenter"}
          notesUrlBase={notesUrlBase}
          // "Requires narration in both directions" applies to the SESSION
          // layer too, not just the stored prefs (voicePreference.tsx): the
          // sheet's Narrated switch drives narration.enabled, and a viewing
          // declared silent has no clip-ends for Suitcase Mode to advance on.
          // Without this gate the chrome kept the one-button transport over a
          // silent deck — a play control for a mode that could no longer mean
          // anything, with the paging arrows nowhere. Transport PAUSE is not
          // this: pause holds playback with narration still on (see
          // useSlideNarration), so the transport survives its own button.
          suitcaseMode={suitcaseActive && narration.enabled}
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
