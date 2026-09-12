import { useMemo, useState } from "react";
import type { Slide } from "../decks/types";
import type { NarrationVoice } from "./narrationConstants";
import { voiceCoverage, type VoiceAvailability } from "./voiceCoverage";

// Coverage and selection, deliberately bound together and mounted by both
// narration surfaces.
//
// Split apart — coverage in a helper, selection in each component's own
// useState — they drift: a component keeps a voice its own picker has since
// disabled, and the toggle looks live while every slide plays silence. Bound,
// "selected" can only name a voice that actually narrates this deck.

export interface VoiceControls {
  voices: VoiceAvailability[];
  /** Always a covered voice, or "" when none is. */
  voiceId: string;
  setVoiceId: (voiceId: string) => void;
  hasAnyNarration: boolean;
}

export function useVoiceControls({
  slides,
  voices,
  hasApi = false,
  resolveUrl,
  preferredVoiceId,
  enabled = true,
}: {
  slides: readonly Slide[];
  voices: readonly NarrationVoice[];
  hasApi?: boolean;
  resolveUrl?: (slide: Slide, voiceId: string) => string | null;
  /** Honored only when that voice covers this deck. */
  preferredVoiceId?: string;
  /** False skips the survey entirely — e.g. presenter mode, which never narrates. */
  enabled?: boolean;
}): VoiceControls {
  const coverage = useMemo(
    () =>
      enabled
        ? voiceCoverage({ slides, voices, hasApi, resolveUrl, preferredVoiceId })
        : { voices: [], hasAnyNarration: false, defaultVoiceId: "" },
    [enabled, slides, voices, hasApi, resolveUrl, preferredVoiceId],
  );

  // Selection is an intent validated on read, not state corrected by an effect:
  // an effect would let one render escape with a dead voice selected. Deriving
  // holds the invariant on the first render too.
  const [intent, setIntent] = useState("");
  const voiceId = coverage.voices.find((v) => v.id === intent)?.available
    ? intent
    : coverage.defaultVoiceId;

  return {
    voices: coverage.voices,
    voiceId,
    setVoiceId: setIntent,
    hasAnyNarration: coverage.hasAnyNarration,
  };
}
