import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { DECKS } from "./decks/index";
import { DeckPlayer } from "./deck-engine/DeckPlayer";
import { BAKED_VOICES, voiceUrl, type VoiceId } from "./bakedVoices";
import { usePresenterMode } from "./presenterMode";
import { useVoicePreference } from "./voicePreference";
import { useViewport } from "./viewport";

// Resolves the two host facts DeckPlayer refuses to infer — which mode this
// window is, and where its audio comes from — and hands them over as props.
//
// The URL beats the saved setting on purpose: a deck link you send someone must
// never carry YOUR podium default to them. The switch sets your default; the
// link carries the mode you meant to share.
export function PresentationDeck() {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const { presenter } = usePresenterMode();
  const { isMobile } = useViewport();
  const { narrateByDefault, suitcaseMode, defaultVoiceId, setDefaultVoiceId } =
    useVoicePreference();

  const presentParam = searchParams.get("present");
  // isMobile overrides everything, INCLUDING ?present=1: a phone can't open a
  // second positioned window, so podium's notes popout would just be a dead
  // tab. Without this override a saved preference — or a ?present=1 link
  // someone shared — reaches a phone and lands it in a mode it can't use,
  // where DeckPlayer drops narration and the settings sheet renders empty
  // because there's nothing left to put in it.
  const isPresenter =
    !isMobile && (presentParam === null ? presenter : presentParam === "1");

  const deck = DECKS.find((d) => d.id === deckId);
  const slides = useMemo(() => deck?.slides() ?? [], [deck]);

  return (
    <DeckPlayer
      deckId={deckId}
      slides={slides}
      mode={isPresenter ? "presenter" : "audience"}
      voices={BAKED_VOICES}
      hasApi={false}
      resolveNarrationUrl={(slide, voice) =>
        voiceUrl(deckId, slide.id, voice as VoiceId)
      }
      // Deliberately no URL override, unlike ?present=. These stay with the
      // user: a shared link shouldn't carry your auto-play and auto-advance
      // to whoever opens it.
      narrateByDefault={narrateByDefault}
      suitcase={suitcaseMode}
      // One answer per visitor, wherever they gave it: Settings, this player,
      // or the notes window — all three read and write VOICE_STORAGE_KEY. Pick
      // Jenny mid-deck and the next deck opens on Jenny.
      preferredVoiceId={defaultVoiceId}
      onVoicePicked={setDefaultVoiceId}
    />
  );
}
