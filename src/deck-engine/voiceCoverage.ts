import type { Slide } from "../decks/types";
import type { NarrationVoice } from "./narrationConstants";

// Can this deck be narrated in this voice, at all? Asked by both narration
// surfaces (the player's chrome and the notes popout), which is why it lives
// here rather than being re-derived in each — when the two disagree, one of
// them is lying to the viewer.
//
// The bar is ALL slides, not most. A voice enabled because slide 4 happens to
// have a clip invites the viewer to pick something that goes silent for the
// other twenty; a partial bake is a state the author is mid-way through, not a
// viewing option.
//
// Coverage asks the same resolver the player fetches audio with, so "offered"
// is by construction the set of voices that actually play. A manifest or a
// deck-level flag would be a second source of truth, free to drift.
//
// hasApi flips the whole question off: with a live synthesizer, any voice can
// produce any slide on demand, so a missing mp3 is a cache miss rather than a
// gap. Callers state which world they're in so that "no resolver passed" is
// never mistaken for "no audio exists".

export interface VoiceAvailability extends NarrationVoice {
  /** True only if EVERY slide has a clip in this voice. */
  available: boolean;
  /** Clips found. Non-zero even when unavailable — shows how partial a bake is. */
  slideCount: number;
}

export interface VoiceCoverage {
  voices: VoiceAvailability[];
  /** False → disable the whole control group, picker included. */
  hasAnyNarration: boolean;
  /**
   * Preferred voice if covered, else the first covered one, else "". Never a
   * voice known to play nothing, so a preference remembered from another deck
   * can't silently select silence here.
   */
  defaultVoiceId: string;
}

/**
 * @param hasApi True when a live synthesizer is running; every voice is then
 *   reported available regardless of what's been baked.
 * @param resolveUrl Clip URL, or null when that pair has no audio. Required
 *   when hasApi is false; ignored when true.
 */
export function voiceCoverage({
  slides,
  voices,
  hasApi = false,
  resolveUrl,
  preferredVoiceId,
}: {
  slides: readonly Slide[];
  voices: readonly NarrationVoice[];
  hasApi?: boolean;
  resolveUrl?: (slide: Slide, voiceId: string) => string | null;
  preferredVoiceId?: string;
}): VoiceCoverage {
  // No resolver counts as "unlimited", not "empty": a host that simply didn't
  // wire coverage shouldn't silently lose its narration controls.
  if (hasApi || !resolveUrl) {
    const allCovered = voices.map((v) => ({
      ...v,
      available: slides.length > 0,
      slideCount: slides.length,
    }));
    return {
      voices: allCovered,
      hasAnyNarration: voices.length > 0 && slides.length > 0,
      defaultVoiceId: pickDefault(allCovered, preferredVoiceId),
    };
  }

  const surveyed = voices.map((voice) => {
    // Counts every hit instead of short-circuiting on the first miss, so a
    // partial bake can report "3 of 21" rather than a bare false.
    let slideCount = 0;
    for (const slide of slides) {
      if (resolveUrl(slide, voice.id)) slideCount += 1;
    }
    return {
      ...voice,
      // The length guard stops an empty deck reading as covered via 0 === 0.
      available: slides.length > 0 && slideCount === slides.length,
      slideCount,
    };
  });

  return {
    voices: surveyed,
    hasAnyNarration: surveyed.some((v) => v.available),
    defaultVoiceId: pickDefault(surveyed, preferredVoiceId),
  };
}

function pickDefault(
  surveyed: readonly VoiceAvailability[],
  preferredVoiceId?: string,
): string {
  const preferred = surveyed.find((v) => v.id === preferredVoiceId);
  if (preferred?.available) return preferred.id;
  return surveyed.find((v) => v.available)?.id ?? "";
}
