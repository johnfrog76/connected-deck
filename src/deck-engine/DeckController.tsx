import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Slide } from "../decks/types";

/**
 * useDeckController — owns all presentation state and side effects for a deck:
 * slide navigation, fullscreen, keyboard control, and the cross-tab
 * BroadcastChannel sync (spec §3.2). Extracted from PresentationDeck so the
 * renderer can stay presentational.
 */
export function useDeckController(
  slides: Slide[],
  deckId: string | undefined,
): {
  slideIndex: number;
  isFullscreen: boolean;
  goNext: () => void;
  goPrev: () => void;
  toggleFullscreen: () => void;
  exitDeck: () => void;
} {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const goNext = useCallback(
    () => setSlideIndex((i) => Math.min(i + 1, slides.length - 1)),
    [slides.length],
  );
  const goPrev = useCallback(() => setSlideIndex((i) => Math.max(0, i - 1)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Exiting the deck must tell any popped-out speaker-notes window to close
  // itself — otherwise it's orphaned, still listening on a BroadcastChannel for
  // a deck that's no longer running. Broadcast "deck-closed" before navigating
  // away so the notes window (which listens on the same channel) can close.
  const exitDeck = useCallback(() => {
    channelRef.current?.postMessage({ type: "deck-closed" });
    navigate(-1);
  }, [navigate]);

  // Reset slide index when deck changes
  useEffect(() => {
    setSlideIndex(0);
  }, [deckId]);

  // Keep isFullscreen in sync with the browser's fullscreen state
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          exitDeck();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, exitDeck, toggleFullscreen]);

  // BroadcastChannel (spec §3.2) — open/close keyed on the deck. Also accepts
  // "goto" messages from the presenter-notes window so it can drive the deck
  // (paging) without needing to be the focused/visible window.
  useEffect(() => {
    const channel = new BroadcastChannel(`connected-deck-${deckId}`);
    channelRef.current = channel;
    channel.onmessage = (e) => {
      if (e.data?.type === "goto" && typeof e.data.index === "number") {
        setSlideIndex(Math.max(0, Math.min(e.data.index, slides.length - 1)));
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [deckId, slides.length]);

  // Broadcast the current slide whenever it (or the slide count) changes
  useEffect(() => {
    channelRef.current?.postMessage({
      type: "slide-change",
      index: slideIndex,
      total: slides.length,
    });
  }, [slideIndex, slides.length]);

  return { slideIndex, isFullscreen, goNext, goPrev, toggleFullscreen, exitDeck };
}
