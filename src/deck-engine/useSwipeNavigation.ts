import { useCallback, useRef } from "react";

// ── useSwipeNavigation — thumb paging for the deck on a phone ────────────────
//
// A horizontal drag across the slide pages the deck: left ⇒ next, right ⇒
// prev, the same direction a photo roll moves. Phone tier only; on a desktop
// the hook returns no handlers at all, so a mouse drag over a slide stays a
// mouse drag over a slide.
//
// Self-contained by design: React only, no context, no ambient hooks, no
// imports beyond React. Lift this file into another stack and it works — same
// contract as the rest of deck-engine.
//
// No gesture library. Detection here is a subtraction and three thresholds,
// and the genuinely hard part isn't recognizing a good swipe — it's rejecting
// the bad ones. A scroll, a tap, a slow fidget, and a drag that began on a
// control all have to NOT page the deck, and those four rules read better as
// named constants than as a config object passed to a general-purpose state
// machine.
//
// Pointer Events rather than touch events: one code path covers touch, pen,
// and mouse.
//
// ── Why this leaves Suitcase Mode alone ─────────────────────────────────────
//
// The hook touches no narration state — not the dwell timer, not `paused`. It
// calls the same goNext/goPrev the paging arrows and the arrow keys call, so
// a swipe is indistinguishable from a manual page everywhere downstream, and
// three behaviours that were already written for manual paging apply to it
// unchanged:
//
//   • Swiping during the post-clip dwell: useSlideNarration's stop() clears
//     the pending timer on a slide change, so the queued auto-advance cannot
//     fire on top of the swipe and skip a slide.
//   • Swiping while playing: the url change restarts narration at the new
//     slide's clip from the beginning.
//   • Swiping while paused: the new clip loads without starting, so an
//     explicit pause outranks the swipe and survives it.
//
// Keep navigation going through the host's paging callbacks and all three stay
// true for free; reimplement it against narration state and none of them do.

/** Minimum horizontal travel, in px. Below this the gesture was a tap. */
const SLOP_PX = 50;

/**
 * How decisively horizontal a swipe must be: |dx| must exceed |dy| by this
 * factor. A deck slide on a phone is a column of copy someone may be
 * scrolling, and the cost of the two mistakes isn't symmetric — a swallowed
 * page-turn is a shrug and a second try, a page-turn that fires mid-scroll
 * loses the reader's place in something they were reading.
 */
const DIRECTION_RATIO = 1.5;

/**
 * Longest gesture still read as a swipe. Past this the thumb was resting,
 * dragging, or selecting, and a page turn would come as a surprise.
 */
const MAX_DURATION_MS = 600;

/**
 * A gesture starting on a control belongs to that control — a link or button
 * inside slide content, for one. (The player's own chrome is a SIBLING of the
 * swipe surface, so the transport is already out of reach structurally; this
 * guard is for controls in the slide itself.)
 */
const INTERACTIVE = "button, a, input, select, textarea, [role='button'], [role='slider']";

export interface SwipeHandlers {
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
}

export function useSwipeNavigation({
  onNext,
  onPrev,
  enabled,
}: {
  /** Page forward. Pass the host's own goNext — see the header. */
  onNext: () => void;
  /** Page back. Pass the host's own goPrev. */
  onPrev: () => void;
  /**
   * Off ⇒ the returned object is empty and nothing binds. The caller's tier
   * gate (useViewport's isMobile) lives there rather than in here: the hook
   * knows what a swipe is, the host knows where swiping is wanted.
   */
  enabled: boolean;
}): SwipeHandlers {
  // The in-flight gesture. A ref, not state: nothing about a half-finished
  // drag belongs on screen, and re-rendering the whole player on pointermove
  // is the one thing that would make this feel worse than no gesture at all.
  const startRef = useRef<{ x: number; y: number; t: number; id: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Secondary buttons and multi-touch (a pinch-zoom's second finger) are not
    // page turns. Compared against false rather than tested for truthiness:
    // environments without a real PointerEvent constructor leave isPrimary
    // undefined, and treating undefined as "not primary" rejects every
    // gesture. Only an explicit false — a genuine secondary contact — is
    // disqualifying.
    if (e.isPrimary === false || e.button !== 0) return;
    if ((e.target as Element | null)?.closest?.(INTERACTIVE)) return;
    startRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
    // Deliberately NO setPointerCapture, which is the usual move for drags.
    //
    // The swipe surface is a full-bleed, position-fixed element filling the
    // player, so a gesture cannot leave it and capture gains nothing. It also
    // costs: while capture is held, slide content re-rendering under the
    // pointer raises pointercancel mid-gesture, and the swipe is lost. Without
    // capture the same gesture completes.
    //
    // Worth revisiting only if a future layout lets a drag start inside the
    // surface and finish outside it — and then the cancel path below needs to
    // be part of the change.
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || start.id !== e.pointerId) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const elapsed = e.timeStamp - start.t;

      if (elapsed > MAX_DURATION_MS) return; // a drag, not a flick
      if (Math.abs(dx) < SLOP_PX) return; // a tap, or a twitch
      if (Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return; // a scroll

      // Drag the content left to bring the next slide in from the right.
      if (dx < 0) onNext();
      else onPrev();
    },
    [onNext, onPrev],
  );

  // Cancel means the browser took the gesture over (scroll takeover, or the
  // OS back-swipe on a screen edge). Drop it — pointerup will never come, and
  // a stale start would let the NEXT unrelated pointerup measure against it.
  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  // Nothing to bind when disabled — no listeners, no per-render allocation on
  // the tier that will never use them.
  if (!enabled) return {};

  return { onPointerDown, onPointerUp, onPointerCancel };
}
