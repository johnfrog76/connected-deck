import type { Slide } from "../decks/types";
import type { VoiceAvailability } from "./voiceCoverage";

// What the two bars agree on. DeckChromePresenter and DeckChromeViewer are
// written for genuinely different jobs — someone presenting with every control
// at hand, and someone watching or listening, maybe with one thumb on a bus —
// so they share this contract and nothing else.
// Anything that has to look the same in both belongs here; anything that only
// looks the same by coincidence does not.

export const NAV_BG = "#060710";
export const BORDER = "#1e2030";

/**
 * In-player narration controls state (the sound toggle, the transport hold and
 * the voice), shown on either bar when the host wires narration.
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
   * The play ring drives THIS, not `toggle`: pausing is "hold the audiobook",
   * not "make this viewing silent", so it must not collapse the ring back to
   * the paging counter under the thumb that pressed it. `toggle` (narration
   * on or off) belongs to the sound control and the settings sheet.
   */
  paused: boolean;
  togglePause: () => void;
  /**
   * Current clip progress 0..1 for the transport's ring — a getter so the
   * ring's ~5×/s sampling stays inside AudiobookTransport instead of
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

/**
 * Which bar the player draws: two bars, each for a job, never a third.
 *
 * - `viewer` — Sofa and Audiobook mode, at every width. Exit on the left; the
 *   transport in the middle (previous, the play ring and next in Audiobook
 *   mode, previous, the counter and next otherwise); settings, fullscreen and
 *   the sound on the right; three columns, so the transport sits on the bar's
 *   centre. The gear's sheet holds the mode, narration and the voice.
 * - `presenter` — Podium, never at the phone width. Everything inline, because
 *   presenting is the one time every control is wanted at hand: Exit,
 *   previous, the counter, next, the sound, the voice, the notes, fullscreen.
 */
export type ChromeBar = "viewer" | "presenter";

export interface DeckChromeProps {
  /** Which of the two bars to draw — see ChromeBar. */
  bar: ChromeBar;
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
   * Whether this viewing has a speaker-notes surface. The notes button opens a
   * popout at {notesUrlBase}/:id/notes — a PRESENTER feature
   * (BroadcastChannel-synced second window with live narration), drawn on the
   * presenter's bar only.
   */
  hasNotesSurface?: boolean;
  /**
   * Base path for the notes popout. Defaults to "/deck", this app's
   * BrowserRouter scheme; a HashRouter host would need the hash prefix baked
   * in ("/#/decks") instead.
   */
  notesUrlBase?: string;
  /**
   * Phone-width chrome: thumb-sized targets, the home-bar safe area, an
   * icon-only Exit and no fullscreen button. The viewer's bar is the same bar
   * at this width, only sized for a thumb.
   */
  compact?: boolean;
  /**
   * Audiobook mode is driving this viewing (narration on, the mode chosen, the
   * viewer's bar). The counter between previous and next gives way to the
   * play ring.
   */
  audiobookMode?: boolean;
  /**
   * Choose Sofa (false) or Audiobook (true) from the settings sheet. Omitted,
   * the sheet has no mode row: the host has locked the player to one mode.
   */
  onAudiobookChange?: (next: boolean) => void;
  /**
   * The viewer's settings sheet opened or closed. DeckPlayer holds narration
   * playback while it's open — a voice reading over you while you're trying
   * to read a switch is rude, and in Audiobook mode the deck would otherwise
   * advance out from under the sheet. The presenter's bar never calls this:
   * its controls are inline, so there's nothing to open.
   */
  onSettingsOpenChange?: (open: boolean) => void;
}

/**
 * Open the speaker-notes popout for a deck, positioned over the current
 * window. Kept apart from the bar that calls it because getting the window
 * NAME right is the whole trick: a deck-scoped name (not "_blank") means clicking twice refocuses
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
