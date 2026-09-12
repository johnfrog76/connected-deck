// The viewing-mode gating rules, stated ONCE and imported everywhere they're
// needed (SettingsForm, LaunchPage). These used to be re-derived inline in
// both places — the SettingsForm.tsx header tells that exact story about a
// drawer and a sheet drifting apart, and the same risk exists any time a
// second surface writes its own copy of "am I at the podium?" instead of
// asking this module.

/**
 * Podium requires BOTH the stored/route preference AND a window wide enough
 * for the notes popout — a phone forces Sofa regardless of what's saved, so
 * this is the EFFECTIVE mode, not the raw flag.
 */
export function computeAtPodium(presenter: boolean, isMobile: boolean): boolean {
  return presenter && !isMobile;
}

/**
 * Can Suitcase Mode be turned on at all? It advances when a narration clip
 * ENDS, so it needs Voice on (an event to advance on) and it needs Sofa
 * (presenter mode drops in-player narration entirely). `narrationDisabled`
 * covers the in-deck case where a specific deck has no baked audio at all.
 */
export function computeSuitcaseAvailable(
  atPodium: boolean,
  narrationOn: boolean,
  narrationDisabled = false,
): boolean {
  return !atPodium && narrationOn && !narrationDisabled;
}

/** Is Suitcase Mode actually driving this viewing right now? */
export function computeSuitcaseActive(
  atPodium: boolean,
  suitcaseMode: boolean,
  narrationOn: boolean,
): boolean {
  return !atPodium && suitcaseMode && narrationOn;
}

/** Sofa is the absence of the other two — not a stored flag of its own. */
export function computeSofaActive(atPodium: boolean, suitcaseActive: boolean): boolean {
  return !atPodium && !suitcaseActive;
}
