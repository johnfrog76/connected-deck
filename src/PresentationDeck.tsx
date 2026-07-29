import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { DECKS } from "./decks/index";
import { DeckPlayer } from "./deck-engine/DeckPlayer";
import { BAKED_VOICES, voiceUrl, type VoiceId } from "./bakedVoices";
import { usePresenterMode } from "./presenterMode";

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

  const presentParam = searchParams.get("present");
  const isPresenter = presentParam === null ? presenter : presentParam === "1";

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
    />
  );
}
