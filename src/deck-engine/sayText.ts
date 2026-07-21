import { isValidElement, Children, type ReactNode } from "react";
import { Say } from "./PresenterNoteKit";

// Walks a slide's notes tree and concatenates only the text spoken inside
// <Say> — Context and Beat are presenter-only. Shared by the deck-duration
// estimate (deckDuration) so it measures exactly the same spoken text a
// narrator would read.
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

// The full string a narrator would speak for a slide: its title read first,
// then the Say lines.
export function slideSpokenText(slide: { title?: string; notes?: ReactNode }): string {
  const body = slide.notes ? extractSayText(slide.notes) : "";
  const title = typeof slide.title === "string" ? slide.title.trim() : "";
  return [title, body].filter(Boolean).join(". ");
}
