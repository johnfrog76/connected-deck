import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FluentProvider, Button } from "@fluentui/react-components";
import { darkTheme } from "./theme";
import { DECKS } from "./decks/index";
import { useDeckController } from "./deck-engine/DeckController";
import { SlideRenderer, DECK_BG } from "./deck-engine/SlideRenderer";
import { DeckChrome } from "./deck-engine/DeckChrome";

export { DeckPickerCard, DeckPicker } from "./deck-engine/DeckPickerCard";

export function PresentationDeck() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const deck = DECKS.find((d) => d.id === deckId);
  const slides = useMemo(() => deck?.createSlides() ?? [], [deck]);

  const { slideIndex, isFullscreen, goNext, goPrev, toggleFullscreen } =
    useDeckController(slides, deckId);

  if (!deck) {
    return (
      <FluentProvider theme={darkTheme} style={{ colorScheme: "dark" }}>
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
    <FluentProvider theme={darkTheme} style={{ colorScheme: "dark", height: "100%", display: "contents" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: DECK_BG, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SlideRenderer slide={slides[slideIndex]} slideIndex={slideIndex} isFullscreen={isFullscreen} />
        <DeckChrome
          slideIndex={slideIndex} slides={slides} deckId={deckId ?? ""}
          isFullscreen={isFullscreen} goNext={goNext} goPrev={goPrev}
          toggleFullscreen={toggleFullscreen} onExit={() => navigate(-1)}
        />
      </div>
    </FluentProvider>
  );
}
