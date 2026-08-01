// The voice roster and the words the UI uses to explain an unavailable voice.
//
// Centralized because three places consume it — both pickers and the baked-asset
// registry — and a disagreement between them is invisible until someone plays a
// deck. The ids are load-bearing beyond display: they're sent to /api/narrate
// AND they appear in baked filenames, so renaming one orphans every asset baked
// under it. Treat the list as a published contract.

export interface NarrationVoice {
  id: string;
  name: string;
}

/**
 * Must stay a subset of ALLOWED_VOICES in server/index.js — a voice added here
 * and not there is offered in the UI and rejected on play.
 */
export const NARRATION_VOICES: readonly NarrationVoice[] = [
  { id: "en-US-JennyNeural", name: "Jenny" },
  { id: "en-US-BrianNeural", name: "Brian" },
] as const;

export const DEFAULT_VOICE_ID = "en-US-JennyNeural";

export const VOICE_STORAGE_KEY = "connected-deck-narration-voice";

// Shared so both pickers phrase it identically. "Not baked" (this deck lacks
// audio) is a different claim from narration being unavailable entirely, and
// the UI should never blur the two.
export const VOICE_NOT_BAKED_SUFFIX = "— not baked";
export const NO_NARRATION_TITLE = "No narration available for this deck";
export const VOICE_PICKER_TITLE = "Narration voice";

// Control labels, named rather than inlined so the two chromes and the
// Settings drawer can't drift into saying slightly different things about the
// same switch. Suitcase Mode's label states which mode you are IN, not what
// the switch does — same grammar as Sofa/Podium on the launch page.
export const NARRATION_SWITCH_LABEL = "Narration";
export const SUITCASE_ON_LABEL = "Suitcase mode";
export const SUITCASE_OFF_LABEL = "Manual paging";
export const SETTINGS_LABEL = "Settings";
export const CLOSE_SETTINGS_LABEL = "Close settings";
export const EXIT_DECK_LABEL = "Exit deck";
export const OPEN_NOTES_LABEL = "Open speaker notes";

export function voiceOptionLabel(name: string, available: boolean): string {
  return available ? name : `${name} ${VOICE_NOT_BAKED_SUFFIX}`;
}
