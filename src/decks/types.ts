import type { ReactNode } from "react";

export interface Slide {
  id: string;
  copy: ReactNode;
  content?: ReactNode;
  /**
   * Presenter notes. Plain strings are still supported (rendered as markdown,
   * for older decks) but new decks should compose Say/Context/Beat from
   * "../deck-engine/PresenterNoteKit" so verbatim lines, background context,
   * and delivery cues are visually distinct on the presenter screen.
   */
  notes?: ReactNode;
}

export interface Deck {
  id: string;
  title: string;
  createSlides: () => Slide[];
}
