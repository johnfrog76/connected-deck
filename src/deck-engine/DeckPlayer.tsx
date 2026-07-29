import { FluentProvider, Button, webDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import type { Slide } from "../decks/types";
import { useDeckController } from "./DeckController";
import { SlideRenderer, DECK_BG } from "./SlideRenderer";
import { DeckChrome } from "./DeckChrome";
import { useSlideNarration } from "./useSlideNarration";
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
  /** Escape hatch. The default is unbranded so no app's palette follows a deck in. */
  theme?: Theme;
}) {
  const navigate = useNavigate();
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
    });

  // Coverage decides whether the controls are ENABLED, never whether they
  // exist. Present-but-disabled reads as "this deck wasn't baked"; absent would
  // claim "this player can't narrate", which is a different and false thing.
  const currentSlide = slides[slideIndex];
  const narrationUrl =
    wantsNarration && hasAnyNarration && currentSlide && voiceId
      ? resolveNarrationUrl!(currentSlide, voiceId)
      : null;
  const narration = useSlideNarration({ url: narrationUrl });

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
        <SlideRenderer slide={slides[slideIndex]} slideIndex={slideIndex} isFullscreen={isFullscreen} />
        <DeckChrome
          slideIndex={slideIndex} slides={slides} deckId={deckId ?? ""}
          isFullscreen={isFullscreen} goNext={goNext} goPrev={goPrev}
          toggleFullscreen={toggleFullscreen} onExit={exitDeck}
          hasNotesSurface={mode === "presenter"}
          notesUrlBase={notesUrlBase}
          narration={
            wantsNarration
              ? {
                  available: narration.available,
                  playing: narration.playing,
                  enabled: narration.enabled,
                  toggle: narration.toggle,
                  voices: surveyedVoices,
                  voiceId,
                  onVoiceChange: setVoiceId,
                  hasAnyNarration,
                }
              : undefined
          }
        />
      </div>
    </FluentProvider>
  );
}
