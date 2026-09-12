import type { Slide } from "../decks/types";
import { slideSpokenText } from "./sayText";

// How fast the Azure voice reads at its default rate (no SSML `rate` change).
// Calibrated against a real recording rather than guessed: a 30-slide deck,
// ~11.5k spoken characters, transitions under 10s, clocking just under 15:00 —
// which solves to ~15 chars/sec at a 5s dwell. Re-measure and adjust if a
// future voice or rate reads noticeably differently.
export const NARRATION_CHARS_PER_SEC = 15;

// Flat per-slide time to take the slide in, on top of narration — the transition
// pause the estimate is asked to include. Applies even to a slide with no Say
// text (a pure-visual slide still costs viewing time).
export const SLIDE_DWELL_SECONDS = 5;

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
