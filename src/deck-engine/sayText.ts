import { isValidElement, Children, type ReactNode } from "react";
import { Say } from "./PresenterNoteKit";

// Walks a slide's notes tree and concatenates only the text spoken inside
// <Say>. Context and Beat are presenter-only and must never reach narration —
// that's the contract the note kit exists to enforce. Shared by the narration
// path (PresenterNotes) and the deck-duration estimate (deckDuration), so both
// measure exactly the same spoken text.
export function extractSayText(node: ReactNode): string {
  const parts: string[] = [];
  const walk = (n: ReactNode) => {
    if (isValidElement(n)) {
      if (n.type === Say) {
        Children.forEach((n.props as { children?: ReactNode }).children, (child) => {
          if (typeof child === "string") parts.push(child.trim());
        });
      } else {
        Children.forEach((n.props as { children?: ReactNode }).children, walk);
      }
    } else if (Array.isArray(n)) {
      n.forEach(walk);
    }
  };
  walk(node);
  return parts.filter(Boolean).join(" ");
}

// The full string the narrator speaks for a slide: its title read first, then
// the Say lines. Mirrors PresenterNotes' sayText composition so a duration
// estimate matches what actually gets synthesized.
export function slideSpokenText(slide: { title?: string; notes?: ReactNode }): string {
  const body = slide.notes ? extractSayText(slide.notes) : "";
  const title = typeof slide.title === "string" ? slide.title.trim() : "";
  return [title, body].filter(Boolean).join(". ");
}
