import type { ReactNode } from "react";

// The authoring contract, in full. Everything a deck can say about itself is
// here; there is no schema, no frontmatter, and no config file behind it.

export interface Slide {
  id: string;
  /**
   * Plain-text title. Anchors the presenter-notes window and is the first thing
   * narration speaks, so it should match the title rendered inside `copy` —
   * `makeSlide` exists to keep those two from drifting.
   */
  title?: string;
  copy: ReactNode;
  /** The live visual. Omit for a full-width copy slide. */
  content?: ReactNode;
  /**
   * Compose from Say/Context/Beat (see PresenterNoteKit) rather than a plain
   * string: narration speaks only the Say lines, so the distinction is load
   * bearing, not styling.
   */
  notes?: ReactNode;
  /** "mm:ss" override for the launch-page estimate, which is otherwise computed. */
  approximateTime?: string;
}

/**
 * Drives nothing here but the launch-page badge. It exists because a growing
 * deck library needs somewhere to say "this one isn't finished," and that's
 * awkward to add later. Omitted reads as Prod.
 */
export enum DeckState {
  Draft = "draft",
  InProgress = "in-progress",
  Prod = "prod",
  Archive = "archive",
}

export interface Deck {
  id: string;
  title: string;
  /** Spoiler-free: what it's about, not how it ends. */
  summary: string;
  state?: DeckState;
  /** Lowercase kebab-case, roughly general → specific. */
  tags?: string[];
  /**
   * Called on each render rather than held as a static array, so a slide can
   * close over what it needs at mount time.
   *
   * Takes no arguments deliberately — upstream this carries an active-org slug
   * for org-scoped sample data, which is a host concept with no meaning in a
   * standalone repo. See README, "Where this came from".
   */
  slides: () => Slide[];
}
