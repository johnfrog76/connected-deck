import type { Slide } from "../decks/types";
import type { VoiceAvailability } from "./voiceCoverage";

// What the two chromes agree on. DeckChromeDesktop and DeckChromeMobile are
// written for genuinely different purposes — a room watching a projector
// versus one thumb on a bus — so they share this contract and nothing else.
// Anything that has to look the same in both belongs here; anything that only
// looks the same by coincidence does not.

export const NAV_BG = "#060710";
export const BORDER = "#1e2030";

/**
 * In-player narration controls state (a play/pause toggle + voice picker),
 * shown when the host wires narration. Audience mode only — presenter mode
 * narrates from the notes popout instead, if at all.
 */
export interface NarrationControls {
  /** Does the CURRENT slide have a clip in the current voice? Gates the toggle. */
  available: boolean;
  /** Is a clip actually sounding right now? (swaps the icon). */
  playing: boolean;
  /** Is narration mode on? (auto-play as slides arrive). */
  enabled: boolean;
  toggle: () => void;
  /**
   * Transport hold — playback held by the listener, narration mode still ON.
   * The mobile transport button drives THIS, not `toggle`: pausing is "hold
   * the audiobook", not "make this viewing silent", so it must not collapse
   * the Suitcase chrome back to paging arrows under the thumb that pressed it.
   * `toggle` (the mode change) belongs to the settings surfaces.
   */
  paused: boolean;
  togglePause: () => void;
  /**
   * Current clip progress 0..1 for the transport's ring — a getter so the
   * ring's ~5×/s sampling stays inside SuitcaseTransport instead of
   * re-rendering the player at the audio clock's rate.
   */
  getSlideProgress: () => number;
  /**
   * Voices WITH their deck-wide coverage (voiceCoverage.ts). Uncovered voices
   * are rendered disabled rather than dropped, so the audience can see that a
   * voice exists but wasn't baked for this deck — a missing option looks like a
   * feature that doesn't exist, a disabled one reads as "not for this deck".
   */
  voices: readonly VoiceAvailability[];
  voiceId: string;
  onVoiceChange: (voiceId: string) => void;
  /**
   * True if at least one voice covers the deck end to end. False → nothing can
   * narrate this deck, so the whole group renders disabled: the toggle AND the
   * picker, since there is no valid choice left to make inside it.
   */
  hasAnyNarration: boolean;
}

export interface DeckChromeProps {
  slideIndex: number;
  slides: Slide[];
  deckId: string;
  isFullscreen: boolean;
  goNext: () => void;
  goPrev: () => void;
  toggleFullscreen: () => void;
  onExit: () => void;
  narration?: NarrationControls;
  /**
   * Whether this host has a speaker-notes surface. The notes button opens a
   * popout at {notesUrlBase}/:id/notes — a PRESENTER feature
   * (BroadcastChannel-synced second window with live narration). Defaults
   * true for web.
   */
  hasNotesSurface?: boolean;
  /**
   * Base path for the notes popout. Defaults to "/deck", this app's
   * BrowserRouter scheme; a HashRouter host would need the hash prefix baked
   * in ("/#/decks") instead.
   */
  notesUrlBase?: string;
  /**
   * Suitcase Mode is ON for this viewing. Mobile only — it replaces the paging
   * group with a single play/pause transport. Desktop ignores it: someone at a
   * keyboard has arrow keys and doesn't need the deck to drive itself.
   */
  suitcaseMode?: boolean;
  /**
   * The mobile chrome's settings sheet opened or closed. DeckPlayer holds
   * narration playback while it's open — a voice reading over you while you're
   * trying to read a switch is rude, and in Suitcase Mode the deck would
   * otherwise auto-advance out from under the sheet. Desktop never calls this:
   * its controls are inline, so there's nothing to open.
   */
  onSettingsOpenChange?: (open: boolean) => void;
}

/**
 * Open the speaker-notes popout for a deck, positioned over the current
 * window. Shared because getting the window NAME right matters in both
 * chromes: a deck-scoped name (not "_blank") means clicking twice refocuses
 * the same window instead of stacking a second one.
 */
export function openNotesWindow(
  notesUrlBase: string,
  deckId: string,
  slideIndex: number,
) {
  const NOTES_WIDTH = 500;
  const NOTES_HEIGHT = 850;
  const left = window.screenX + (window.innerWidth - NOTES_WIDTH) / 2;
  const top = window.screenY + (window.innerHeight - NOTES_HEIGHT) / 2;
  window.open(
    // Hand the notes window the slide the deck is currently on, so opening
    // notes late (already past slide 1) follows the deck instead of resetting.
    `${notesUrlBase}/${deckId}/notes?slide=${slideIndex}`,
    `connected-deck-notes-${deckId}`,
    `width=${NOTES_WIDTH},height=${NOTES_HEIGHT},left=${Math.round(left)},top=${Math.round(top)}`,
  );
}
