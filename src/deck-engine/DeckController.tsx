import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Slide } from "../decks/types";

/**
 * useDeckController — owns all presentation state and side effects for a deck:
 * slide navigation, fullscreen, keyboard control, and cross-tab
 * BroadcastChannel sync so a presenter-notes popout window can follow (and
 * drive) the main deck window.
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

  useEffect(() => {
    setSlideIndex(0);
  }, [deckId]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
          navigate(-1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, navigate, toggleFullscreen]);

  // BroadcastChannel — open/close keyed on the deck. Also accepts "goto"
  // messages from the presenter-notes window so it can drive the deck
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

  useEffect(() => {
    channelRef.current?.postMessage({
      type: "slide-change",
      index: slideIndex,
      total: slides.length,
    });
  }, [slideIndex, slides.length]);

  return { slideIndex, isFullscreen, goNext, goPrev, toggleFullscreen };
}
