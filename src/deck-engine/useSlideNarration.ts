import { useCallback, useEffect, useRef, useState } from "react";

// The audience path: play a slide's baked mp3, or stay silent. The URL is
// already resolved by the time it arrives, so unlike PresenterNotes there's no
// in-flight fetch to race — just one <audio> element retargeted per slide.
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
}

export function useSlideNarration({
  url,
  enabledDefault = false,
}: {
  /** Resolved clip URL for the current slide+voice, or null if none baked. */
  url: string | null;
  enabledDefault?: boolean;
}): SlideNarration {
  const [enabled, setEnabled] = useState(enabledDefault);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  }, []);

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
    stop(); // cut any current clip before starting the new slide's
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
    return stop;
  }, [enabled, url, stop]);

  // Belt-and-suspenders: stop on unmount (exiting the deck).
  useEffect(() => stop, [stop]);

  const toggle = useCallback(() => setEnabled((on) => !on), []);

  return { available: !!url, enabled, playing, toggle };
}
