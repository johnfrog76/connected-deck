import { DeckChromeDesktop } from "./DeckChromeDesktop";
import { DeckChromeMobile } from "./DeckChromeMobile";
import { useViewport } from "../viewport";
import type { DeckChromeProps } from "./deckChromeShared";

// Picks a chrome. That's all this does.
//
// The desktop and mobile chromes are SEPARATE COMPONENTS rather than one file
// full of `compact ? a : b`, because they solve different problems: desktop
// chrome is projected in front of a room and should disappear, mobile chrome is
// operated by one thumb and should be findable without looking. A single
// component with forks throughout serves neither well, and makes both harder to
// lift into another project.
//
// This file asks `isMobile` and nothing else — no media strings, no breakpoint
// numbers, no matchMedia. That all lives in viewport.tsx, which is what lets
// you re-point the breakpoints without touching a single component.
//
// Taking just one chrome: both siblings are pure props-in, no context, no
// ambient hooks. Import DeckChromeMobile directly and hand it the same props if
// you'd rather decide the breakpoint yourself.

export type { NarrationControls, DeckChromeProps } from "./deckChromeShared";

export function DeckChrome(props: DeckChromeProps) {
  const { isMobile } = useViewport();
  return isMobile ? <DeckChromeMobile {...props} /> : <DeckChromeDesktop {...props} />;
}
