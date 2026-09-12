import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { usePersistedFlag, usePersistedValue } from "./shared/usePersistedState";
import {
  DEFAULT_VOICE_ID,
  NARRATION_VOICES,
  VOICE_STORAGE_KEY,
} from "./deck-engine/narrationConstants";

// Two preferences about how a deck should sound and pace itself, remembered per
// browser. Same shape as presenterMode.tsx — a stored default, not a live
// control — and read the same way: DeckPlayer takes them as props, so the
// player itself still infers nothing about its host.
//
//   narrateByDefault — start narrating the moment a deck opens, instead of
//     waiting for someone to find the Voice control in the player.
//
//   suitcaseMode — when the current slide's narration ends, advance to the
//     next one. An audiobook rather than a slideshow: headphones on, phone in
//     a pocket, no fumbling to page through a 60-slide deck.
//
// Suitcase Mode requires narration, in BOTH directions: turning it on turns
// narration on, and turning narration off turns it off. It advances when a
// clip ENDS, so without narration there is no such event and the setting
// cannot mean anything. Never let a dependent setting outlive — or override —
// the setting it depends on: a Suitcase flag left set over a silent deck is
// how you end up reading audio aloud to someone who just asked for quiet.

const NARRATE_STORAGE_KEY = "connected-deck:narrate-by-default";
const SUITCASE_STORAGE_KEY = "connected-deck:suitcase-mode";

interface VoicePreferenceValue {
  narrateByDefault: boolean;
  setNarrateByDefault: (next: boolean) => void;
  suitcaseMode: boolean;
  setSuitcaseMode: (next: boolean) => void;
  /**
   * Which voice a deck opens in. Shares VOICE_STORAGE_KEY with the presenter
   * notes window's own picker on purpose — "which voice reads to me" is one
   * answer per visitor, not one per surface, so picking Brian in Settings and
   * picking Brian in the player are the same act.
   */
  defaultVoiceId: string;
  setDefaultVoiceId: (next: string) => void;
}

// Defaults are both false: a deck opens quiet and pages by hand. Narration and
// auto-advance are each a deliberate opt-in, the same way podium is.
const VoicePreferenceContext = createContext<VoicePreferenceValue>({
  narrateByDefault: false,
  setNarrateByDefault: () => {},
  suitcaseMode: false,
  setSuitcaseMode: () => {},
  defaultVoiceId: DEFAULT_VOICE_ID,
  setDefaultVoiceId: () => {},
});

export function VoicePreferenceProvider({ children }: { children: ReactNode }) {
  // Storage is the hook's business, not this module's — it owns the reads,
  // the writes, and the private-mode guard. What lives here is the one thing
  // the hook can't know: how these two settings relate to each other.
  const { value: narrateByDefault, setValue: setNarrate } =
    usePersistedFlag(NARRATE_STORAGE_KEY);
  const { value: suitcaseMode, setValue: setSuitcase } =
    usePersistedFlag(SUITCASE_STORAGE_KEY);
  // A stored voice outlives the code that wrote it — an id since removed from
  // NARRATION_VOICES must not be handed back out, so the hook validates it.
  const { value: defaultVoiceId, setValue: setDefaultVoiceId } = usePersistedValue(
    VOICE_STORAGE_KEY,
    DEFAULT_VOICE_ID,
    (stored) => NARRATION_VOICES.some((v) => v.id === stored),
  );

  const setNarrateByDefault = useCallback(
    (next: boolean) => {
      setNarrate(next);
      // Narration off clears Suitcase Mode — see the module comment.
      if (!next) setSuitcase(false);
    },
    [setNarrate, setSuitcase],
  );

  const setSuitcaseMode = useCallback(
    (next: boolean) => {
      setSuitcase(next);
      // Turning Suitcase Mode on implies narration — see the module comment.
      if (next) setNarrate(true);
    },
    [setSuitcase, setNarrate],
  );

  const value = useMemo(
    () => ({
      narrateByDefault,
      setNarrateByDefault,
      suitcaseMode,
      setSuitcaseMode,
      defaultVoiceId,
      setDefaultVoiceId,
    }),
    [
      narrateByDefault,
      setNarrateByDefault,
      suitcaseMode,
      setSuitcaseMode,
      defaultVoiceId,
      setDefaultVoiceId,
    ],
  );

  return (
    <VoicePreferenceContext.Provider value={value}>{children}</VoicePreferenceContext.Provider>
  );
}

export function useVoicePreference() {
  return useContext(VoicePreferenceContext);
}
