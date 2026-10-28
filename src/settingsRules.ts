// The viewing-mode gating rules, stated ONCE and imported everywhere they're
// needed (SettingsForm, LaunchPage). These used to be re-derived inline in
// both places — the SettingsForm.tsx header tells that exact story about a
// drawer and a sheet drifting apart, and the same risk exists any time a
// second surface writes its own copy of "am I at the podium?" instead of
// asking this module.

/**
 * The three ways to play a deck. Sofa is the plain player: you page, and the
 * voice reads each slide if narration is on. Audiobook reads the deck aloud
 * and turns the slides itself. Podium is for presenting.
 */
export type ViewingMode = "sofa" | "audiobook" | "podium";

/** Each mode's name and the one line on what it is for — the cards and the
 *  settings rows say the same thing. */
export const VIEWING_MODES: Record<ViewingMode, { name: string; line: string }> = {
  sofa: {
    name: "Sofa",
    line: "Watch and page through it yourself; the voice reads each slide if narration is on.",
  },
  audiobook: {
    name: "Audiobook",
    line: "Listen: the deck reads itself aloud and turns its own slides, phone in a pocket.",
  },
  podium: {
    name: "Podium",
    line: "Present: notes, a timer and the next slide in a second window.",
  },
};

/**
 * Podium requires BOTH the stored/route preference AND a window wide enough
 * for the notes popout — a phone forces Sofa regardless of what's saved, so
 * this is the EFFECTIVE mode, not the raw flag.
 */
export function computeAtPodium(presenter: boolean, isMobile: boolean): boolean {
  return presenter && !isMobile;
}

/**
 * Can Audiobook mode be chosen at all? It advances when a narration clip ENDS,
 * so it needs Sofa's player (Podium never turns its own slides) and a deck
 * with something to read. `narrationDisabled` covers the in-deck case where a
 * specific deck has no baked audio at all. Narration being OFF does not block
 * the choice: choosing Audiobook turns narration on, as an explicit act.
 */
export function computeAudiobookAvailable(
  atPodium: boolean,
  narrationDisabled = false,
): boolean {
  return !atPodium && !narrationDisabled;
}

/** Is Audiobook mode actually driving this viewing right now? */
export function computeAudiobookActive(
  atPodium: boolean,
  audiobookMode: boolean,
  narrationOn: boolean,
): boolean {
  return !atPodium && audiobookMode && narrationOn;
}

/** Sofa is the absence of the other two — not a stored flag of its own. */
export function computeSofaActive(atPodium: boolean, audiobookActive: boolean): boolean {
  return !atPodium && !audiobookActive;
}

/** The one mode a viewing is in, from the effective flags above. */
export function computeViewingMode(atPodium: boolean, audiobookActive: boolean): ViewingMode {
  return atPodium ? "podium" : audiobookActive ? "audiobook" : "sofa";
}
