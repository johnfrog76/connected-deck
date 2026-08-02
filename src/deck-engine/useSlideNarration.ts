import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDE_DWELL_SECONDS } from "./deckDuration";

// The audience path: play a slide's baked mp3, or stay silent. The URL is
// already resolved by the time it arrives, so unlike PresenterNotes there's no
// in-flight fetch to race — just one <audio> element retargeted per slide.
//
// ONE element, literally — created on first use and reused for every clip.
// This matters on iOS: Safari blesses an element for programmatic playback
// once a user gesture has played it, and the blessing sticks to THAT element.
// A fresh `new Audio()` per slide starts each slide unblessed and at the mercy
// of the autoplay policy, so narration dies after the first clip; retargeting
// the blessed element's src keeps it flowing across slides.
//
// Enabled is a session mode, not a one-shot. A slide with no audio is a no-op
// rather than an error, so a partially-baked deck still pages cleanly.

export interface SlideNarration {
  /** True if the current slide has a playable clip in the current voice. */
  available: boolean;
  /** Whether narration mode is on (auto-play as slides arrive). */
  enabled: boolean;
  /** True while a clip is actually sounding. */
  playing: boolean;
  toggle: () => void;
  /**
   * Transport hold: the listener pressed pause. Narration stays ON — the
   * settings sheet's switch still reads "Narrated", and Suitcase Mode keeps
   * its transport — playback is simply held until togglePause resumes it.
   *
   * This is a THIRD state, deliberately distinct from the other two ways
   * narration goes quiet: `enabled` off means "this viewing is silent" (a mode
   * change — Suitcase loses its parent and the chrome returns to paging
   * arrows), and `suspended` means "the sheet is open over the deck" (the
   * player's own hold, invisible to the listener). Folding pause into either
   * one is how the pause button ends up deleting itself mid-tap, or the sheet
   * lying about the state it reports.
   */
  paused: boolean;
  togglePause: () => void;
  /**
   * Progress through the slide's audible LIFE, 0..1 — the clip plus the
   * post-clip dwell, the same model deckDuration.ts prices a slide at. So in
   * Suitcase Mode the ring completes exactly when the deck advances, rather
   * than sitting full through five silent seconds looking stuck. Read from
   * the live element on demand — a getter, not state, so a caller sampling
   * it (SuitcaseTransport's ring) doesn't force this hook's owner to
   * re-render at the audio clock's rate. 0 with nothing loaded.
   */
  getSlideProgress: () => number;
}

export function useSlideNarration({
  url,
  enabledDefault = false,
  onEnded,
  suspended = false,
}: {
  /** Resolved clip URL for the current slide+voice, or null if none baked. */
  url: string | null;
  enabledDefault?: boolean;
  /**
   * Called SLIDE_DWELL_SECONDS after the current clip finishes playing (not
   * on pause/stop, only a real end). Suitcase Mode's whole mechanic:
   * DeckPlayer passes goNext here so the deck advances the way a podcast
   * moves to its next track — after the same dwell the deck's own length
   * estimate (deckDuration.ts) already bakes in for a slide with no
   * narration, so a slide doesn't vanish the instant the voice stops. Read
   * via a ref, not a dependency — the caller's closure changes every render,
   * and re-running this effect on that would restart the current clip for no
   * reason.
   */
  onEnded?: () => void;
  /**
   * Hold playback without changing whether narration is ON. The mobile
   * settings sheet sets this while it's open: a voice reading over you while
   * you're trying to read a switch is rude, and the deck may auto-advance out
   * from under the sheet in Suitcase Mode.
   *
   * Deliberately NOT `toggle()`. That flips `enabled`, which would make the
   * sheet's own Narration switch turn itself off as the sheet opened — a
   * control lying about the state it reports. Suspending leaves `enabled`
   * true, so the switch still reads "Narrated" and playback resumes from where
   * it left off on close.
   */
  suspended?: boolean;
}): SlideNarration {
  const [enabled, setEnabled] = useState(enabledDefault);
  // The transport hold. Composes with `suspended` rather than replacing it —
  // either one held means the element stays quiet — but they belong to
  // different owners: `suspended` to the player (sheet open), `paused` to the
  // listener (the transport button).
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef(onEnded);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // This slide's clip already finished at a moment when no onEnded was armed.
  // Cleared whenever a new clip starts, and acted on if onEnded arrives late.
  const endedWhileUnarmedRef = useRef(false);
  // Wall-clock moment the current clip ended — the dwell's own clock, read by
  // getSlideProgress so the ring keeps filling through the post-clip silence.
  // Wall clock rather than a counter because nothing re-renders during the
  // dwell; the poller computes elapsed on demand.
  const dwellStartedAtRef = useRef<number | null>(null);
  // Read by the main effect via a ref, NOT a dependency: making the hold a
  // dep there would tear down and restart the clip from the beginning every
  // time the sheet opened or closed (or pause was pressed), which is the
  // opposite of holding it.
  const heldRef = useRef(suspended || paused);
  // In an effect, not the render body — a ref write during render is a side
  // effect and this repo's hooks lint rejects it. Ordering is safe: the main
  // effect below reads this ref, and effects run in declaration order, so this
  // one has already updated it by the time that one runs.
  useEffect(() => {
    heldRef.current = suspended || paused;
  }, [suspended, paused]);

  // Kept current in an effect rather than assigned during render — a ref write
  // in the render body is a side effect, and this repo's hooks lint rejects it.
  // The effect runs before any dwell timer can fire, since the timer is only
  // ever armed from an audio "ended" event.
  useEffect(() => {
    onEndedRef.current = onEnded;
    // Re-armed after the current slide's clip already finished — the window was
    // widened past the mobile breakpoint mid-slide and narrowed back, so the
    // "ended" that should have advanced the deck fired into nothing. Catch up
    // rather than waiting for an event that has already been and gone.
    if (onEnded && endedWhileUnarmedRef.current) {
      endedWhileUnarmedRef.current = false;
      onEnded();
    }
  }, [onEnded]);

  const stop = useCallback(() => {
    // Pause, never discard — the element carries the iOS gesture blessing.
    audioRef.current?.pause();
    setPlaying(false);
    // A manual slide change (or unmount) mid-dwell should cancel the queued
    // advance — otherwise a stale timer fires goNext a second time on
    // whatever slide the visitor already moved to by hand.
    if (dwellTimerRef.current !== null) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    dwellStartedAtRef.current = null;
  }, []);

  // Hold / resume (sheet-suspend OR transport pause), kept OUT of the main
  // effect below on purpose: that one is keyed on slide and voice and starts a
  // clip from the beginning, so folding the hold into its deps would restart
  // the current slide's narration every time the settings sheet closed or the
  // pause button was pressed. This pauses and resumes the same element
  // mid-clip instead, and never touches `enabled` — the sheet's Narration
  // switch keeps reading "Narrated" while it's held.
  //
  // A dwell timer already running is left alone: it's counting down to an
  // advance the visitor asked for, and cancelling it here would silently
  // strand a Suitcase Mode deck on the slide it had just finished. Pausing in
  // that 5-second gap therefore lets the queued slide change complete and then
  // holds on the new slide — one flip, then stillness until Play.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled || !url) return;
    if (suspended || paused) {
      audio.pause();
    } else if (!audio.ended) {
      // Play from wherever the element is: mid-clip if it was held part-way
      // through, or from the start if the clip changed while held. Switching
      // VOICE with the sheet open does exactly that — the main effect loads a
      // fresh src at currentTime 0 but won't start it, so a resume that only
      // handled `currentTime > 0` left the deck silently paused on a clip that
      // never played. `ended` is the one case to skip: that clip is spent, and
      // the dwell timer already owns what happens next.
      audio.play().catch(() => setPlaying(false));
    }
  }, [suspended, paused, enabled, url]);

  // On every change of enabled / url (slide or voice change), sync audio to
  // match: if on and there's a clip, (re)start it; otherwise stop. This single
  // effect is the whole state machine — no imperative play calls elsewhere.
  // `playing` is driven by the element's own events (play/pause/ended), not set
  // synchronously here, so the effect only ever talks to the external system.
  useEffect(() => {
    if (!enabled || !url) {
      stop(); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const audio = (audioRef.current ??= new Audio());
    audio.pause(); // cut any current clip before starting the new slide's
    // A fresh clip is about to play, so nothing is spent any more. Without
    // this, paging by hand off a finished slide would leave the flag set and
    // the NEXT re-arm would advance a slide the visitor had just arrived at.
    endedWhileUnarmedRef.current = false;
    dwellStartedAtRef.current = null;
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => {
      setPlaying(false);
      dwellStartedAtRef.current = Date.now();
      dwellTimerRef.current = setTimeout(() => {
        dwellTimerRef.current = null;
        if (onEndedRef.current) {
          onEndedRef.current();
        } else {
          // The clip finished while nothing wanted to hear about it — Suitcase
          // Mode was off, or the window had been widened past the mobile
          // breakpoint, which un-arms it. Remember that this slide is SPENT so
          // that re-arming can act on it: without this the deck sits on a
          // finished slide showing a Pause button, playing nothing, advancing
          // never, because the "ended" event it needed is long gone.
          endedWhileUnarmedRef.current = true;
        }
      }, SLIDE_DWELL_SECONDS * 1000);
    };
    audio.onerror = () => setPlaying(false);
    audio.src = url;
    // Don't start while held. This effect runs on slide/voice changes AND
    // whenever `stop` is re-created, so without the guard a re-render during
    // an open settings sheet (or a transport pause) would start the clip
    // playing underneath it — the hold effect above has already run by then
    // and won't run again. Suitcase Mode makes this reachable on its own: the
    // deck can auto-advance to a new slide while the sheet is open, which is
    // exactly a url change.
    if (!heldRef.current) {
      audio.play().catch(() => setPlaying(false));
    }
    return stop;
  }, [enabled, url, stop]);

  // Belt-and-suspenders: stop on unmount (exiting the deck).
  useEffect(() => stop, [stop]);

  // Changing the MODE clears any transport hold: flipping "Silent" back to
  // "Narrated" is a request to hear the deck, and honoring a pause pressed in
  // some earlier narrated stretch would leave it silently stopped with a
  // switch on screen claiming it's reading aloud.
  const toggle = useCallback(() => {
    setEnabled((on) => !on);
    setPaused(false);
  }, []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const getSlideProgress = useCallback(() => {
    const audio = audioRef.current;
    // duration is NaN until metadata loads (and Infinity for streams) —
    // both read as "no clock yet", not as progress.
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return 0;
    }
    // The slide's audible life is clip + dwell (deckDuration's model), so the
    // fraction keeps moving through the post-clip silence and lands on 1 at
    // the moment the dwell timer advances the deck.
    const total = audio.duration + SLIDE_DWELL_SECONDS;
    if (audio.ended) {
      const started = dwellStartedAtRef.current;
      const dwellElapsed =
        started === null
          ? 0
          : Math.min((Date.now() - started) / 1000, SLIDE_DWELL_SECONDS);
      return Math.min(1, (audio.duration + dwellElapsed) / total);
    }
    return Math.min(audio.currentTime, audio.duration) / total;
  }, []);

  return {
    available: !!url,
    enabled,
    playing,
    toggle,
    paused,
    togglePause,
    getSlideProgress,
  };
}
