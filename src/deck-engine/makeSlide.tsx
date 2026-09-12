import type { ComponentType, ReactNode } from "react";
import type { Slide } from "../decks/types";

// Decks style their own copy panels — that per-deck look is the point — so what
// gets shared is the wiring, not the styling. Hand over the kit once and each
// title is written ONCE, landing in both Slide.title and <SlideTitle>, which is
// the drift this exists to prevent.

type CopyComponent = ComponentType<{ children: ReactNode }>;

export interface DeckCopyKit {
  CopyPanel: CopyComponent;
  Eyebrow: CopyComponent;
  SlideTitle: CopyComponent;
  Lead: CopyComponent;
}

export interface MakeSlideArgs {
  id: string;
  /** Single source of truth: becomes Slide.title and the visible <SlideTitle>. */
  title: string;
  /** Kicker line above the title. Omit to render no <Eyebrow>. */
  eyebrow?: ReactNode;
  /** Supporting line under the title. Omit to render no <Lead>. */
  lead?: ReactNode;
  /** Extra copy after <Lead> — a Caption, a repo-link button, etc. */
  copyAfter?: ReactNode;
  /**
   * Bespoke copy panel for slides whose title treatment doesn't fit the
   * standard stack. Replaces eyebrow/lead/copyAfter entirely; `title` is
   * still required so the presenter window keeps its anchor — keep the
   * bespoke visual title matching it.
   */
  copy?: ReactNode;
  notes?: ReactNode;
  content?: ReactNode;
}

export function createMakeSlide(kit: DeckCopyKit) {
  const { CopyPanel, Eyebrow, SlideTitle, Lead } = kit;
  return function makeSlide({
    id,
    title,
    eyebrow,
    lead,
    copyAfter,
    copy,
    notes,
    content,
  }: MakeSlideArgs): Slide {
    return {
      id,
      title,
      notes,
      content,
      copy: copy ?? (
        <CopyPanel>
          {eyebrow != null && <Eyebrow>{eyebrow}</Eyebrow>}
          <SlideTitle>{title}</SlideTitle>
          {lead != null && <Lead>{lead}</Lead>}
          {copyAfter}
        </CopyPanel>
      ),
    };
  };
}
