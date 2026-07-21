import type { Slide } from "../decks/types";
import { slideSpokenText } from "./sayText";

// Approximate read speed used for the estimate — ~120 wpm effective (with
// natural punctuation pauses), expressed as chars/sec. Tune this if it drifts
// noticeably from how the deck actually plays.
export const NARRATION_CHARS_PER_SEC = 12;

// Flat per-slide time to take the slide in, on top of narration — applies
// even to a slide with no Say text (a pure-visual slide still costs viewing
// time).
export const SLIDE_DWELL_SECONDS = 10;

// Parse an authored "mm:ss" override into seconds, or null if not well-formed.
function parseMmSs(value: string | undefined): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// Estimated on-screen seconds for one slide: an authored approximateTime wins
// outright, otherwise narration read time + the flat dwell.
export function estimateSlideSeconds(slide: Slide): number {
  const authored = parseMmSs(slide.approximateTime);
  if (authored !== null) return authored;
  const narrationSeconds = slideSpokenText(slide).length / NARRATION_CHARS_PER_SEC;
  return narrationSeconds + SLIDE_DWELL_SECONDS;
}

// Format a duration in seconds as "m:ss" (minutes are not zero-padded).
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Approximate time to get through a whole deck, formatted "m:ss".
export function estimateDeckDuration(slides: Slide[]): string {
  const total = slides.reduce((sum, slide) => sum + estimateSlideSeconds(slide), 0);
  return formatDuration(total);
}
