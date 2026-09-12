import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Slide } from "../decks/types";

/**
 * useDeckController — owns all presentation state and side effects for a deck:
 * slide navigation, fullscreen, keyboard control, and the cross-tab
 * BroadcastChannel sync (spec §3.2). Extracted from PresentationDeck so the
 * renderer can stay presentational.
 *
 * `onAfterSlideNavCallback` is the one extension point a host gets into
 * navigation: it reports that the visitor is now looking at slide N of M,
 * AFTER the navigation happened ("after" in the name, over `onSlideNavigate`,
 * so it reads as non-interceptable — returning false from it does nothing).
 * The controller never persists anything and holds no opinion about what a
 * host does with the fact; this is the seam a watch-history, analytics, or
 * resume feature is built on without the engine learning those words. An
 * unsupplied callback is simply never called — nothing else branches on it,
 * and a host is never required to stabilize the function's identity.
 */
export function useDeckController(
  slides: Slide[],
  deckId: string | undefined,
  onAfterSlideNavCallback?: (slideIndex: number, totalSlides: number) => void,
  initialSlideIndex = 0,
): {
  slideIndex: number;
  isFullscreen: boolean;
  goNext: () => void;
  goPrev: () => void;
  toggleFullscreen: () => void;
  exitDeck: () => void;
} {
  const navigate = useNavigate();
  // Opens where the host says, not always at 0 — the whole of the engine's
  // part in a "continue where you left off" feature. Clamped on the way in:
  // the host's number came from somewhere persistent, and a deck edited
  // shorter since would otherwise open past its own end.
  const [slideIndex, setSlideIndex] = useState(() =>
    Math.min(Math.max(0, initialSlideIndex), Math.max(0, slides.length - 1)),
  );
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

  // Read through a ref, and deliberately NOT in the reset effect's deps.
  //
  // A host computing this from its own stored progress hands back a NEW value
  // on every slide change, because recording the move is what changes it. With
  // initialSlideIndex in the deps below, every step forward would re-run the
  // reset and yank the visitor back to where they started — a deck that cannot
  // be paged at all. Same shape of trap as the callback ref further down: a
  // prop that is an INPUT AT MOUNT must not behave like one that is live.
  const initialIndexRef = useRef(initialSlideIndex);
  useEffect(() => {
    initialIndexRef.current = initialSlideIndex;
  });

  // Deck changed: land on wherever the host wants THAT deck opened, which is 0
  // unless it has somewhere better to resume.
  useEffect(() => {
    setSlideIndex(
      Math.min(Math.max(0, initialIndexRef.current), Math.max(0, slides.length - 1)),
    );
  }, [deckId, slides.length]);

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

  // The host's after-navigation hook. A notification SINK, not a value worth
  // re-firing on: a host naturally passes an inline arrow, so the prop's
  // identity changes on every parent render. If it sat in the deps below,
  // every render would re-run the effect — and a host whose callback writes
  // state (a watch-history recorder is the obvious one) would then be in an
  // infinite render loop, not merely getting a stray extra call. Read through
  // a ref, kept current, and left OUT of the deps. That is what makes an
  // inline arrow at the call site safe, so it is part of the contract rather
  // than an implementation detail.
  const callbackRef = useRef(onAfterSlideNavCallback);
  useEffect(() => {
    callbackRef.current = onAfterSlideNavCallback;
  });

  // Deliberately NOT the broadcast effect above, whose deps lack `deckId`.
  // PresentationDeck routes at /deck/:deckId and does not remount when only
  // the param changes, so navigating deck A (14 slides, at index 13) to deck
  // B (8 slides)
  // commits one render where slides.length is already B's 8 while slideIndex
  // is still A's 13 — the reset effect's setSlideIndex(0) is a state update
  // scheduled by this same commit's effects, not a synchronous one, so it
  // hasn't applied yet. Reporting that commit would attribute (13, 8) to deck
  // B, and a host recording a high-water mark would read B as fully watched
  // from then on, permanently. Having deckId in the deps also means the
  // arrival fires when two decks happen to share a slide count, which the
  // broadcast effect's deps would miss entirely.
  const seenDeckIdRef = useRef(deckId);
  useEffect(() => {
    if (seenDeckIdRef.current !== deckId) {
      seenDeckIdRef.current = deckId;
      // Report the arrival we already know is correct rather than reading the
      // stale index. NOT a bare `return` waiting for the reset to land: if the
      // outgoing deck was already on slide 0, setSlideIndex(0) sets state to
      // the value it already holds, React bails out of the re-render, and this
      // effect never runs again — the incoming deck would go unrecorded
      // entirely. Firing here covers both paths. The cost is one duplicate
      // call in the non-zero case (the reset lands, slideIndex becomes 0, and
      // this fires an identical pair), which is why the contract promises only
      // "the visitor is now looking at slide N of M" and not "exactly once".
      // Where the reset above is about to put them, not a hardcoded 0 — a
      // resumed deck arrives at its resume point, and a host recording this
      // must be told the truth about where the visitor actually is.
      callbackRef.current?.(
        Math.min(Math.max(0, initialIndexRef.current), Math.max(0, slides.length - 1)),
        slides.length,
      );
      return;
    }
    callbackRef.current?.(slideIndex, slides.length);
  }, [slideIndex, slides.length, deckId]);

  // Clamped, not raw. The same commit described above — the one carrying the
  // outgoing deck's slideIndex beside the incoming deck's slides — also
  // RENDERS: leaving deck A on slide 5 for a 3-slide deck B hands the renderer
  // slides[5], which is undefined, and SlideRenderer dereferences it. That is
  // a white-screen crash, and it needs no callback to reach — browser
  // back/forward between two deck URLs never remounts the route element.
  //
  // Clamped here rather than at each consumer because this hook owns the
  // index: an index pointing past its own slide array is this module's
  // invariant to keep, not something every renderer should re-check. Within a
  // deck it is a no-op — goNext already stops at the end — so it only bites on
  // the one intermediate commit it exists for.
  const safeSlideIndex = Math.min(slideIndex, Math.max(0, slides.length - 1));

  return {
    slideIndex: safeSlideIndex,
    isFullscreen,
    goNext,
    goPrev,
    toggleFullscreen,
    exitDeck,
  };
}
