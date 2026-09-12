import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BREAKPOINTS } from "./media";

// The one place that talks to matchMedia.
//
// Consumers ask a SEMANTIC question — "is this a phone?" — and never write a
// media string, a breakpoint number, or a subscription. Same contract as
// usePersistedState and localStorage: the mechanism lives in the hook, and a
// component only says what it wants to know. That's what makes both liftable
// into another stack — swap this file's internals for your own breakpoints and
// every consumer keeps working, because none of them ever knew how the answer
// was computed.
//
// It replaced two overlapping hooks (this one, and a separate useCompactLayout
// in deck-engine/) that each ran their own matchMedia subscription against what
// turned out to be the SAME 575px boundary. Two mechanisms answering one
// question is two chances to disagree.
//
// Division of labour with CSS, used like salt: if it's the same markup wearing
// different styles, use MEDIA.* ranges in makeStyles — CSS handles that with no
// re-render. Reach for this hook only when the STRUCTURE differs by tier (a
// different component, a different prop), which is a thing CSS can't do.

/** Tier names mirror the MEDIA tokens: "base" is the phone (0–575px), "sm" the
 *  576+ band, "md" 768 and up. */
export type ViewportTier = "base" | "sm" | "md";

export interface ViewportState {
  /** Which of the three tiers the viewport is in right now. */
  tier: ViewportTier;
  /**
   * A phone (0–575px). The question almost every consumer actually has, so it
   * is answered here rather than making each one compare tiers. Touch targets
   * grow, the deck swaps to its mobile chrome, and Presenter goes away.
   */
  isMobile: boolean;
  /** 768px and up. Sugar for tier === "md", for the rare "go overboard" case. */
  isWide: boolean;
}

// jsdom (and any non-browser runtime) has no matchMedia — default to the
// desktop tier there, which is what every existing test asserts against.
function readTier(): ViewportTier {
  if (typeof window === "undefined" || !window.matchMedia) return "md";
  if (window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`).matches) return "md";
  if (window.matchMedia(`(min-width: ${BREAKPOINTS.sm}px)`).matches) return "sm";
  return "base";
}

function stateFor(tier: ViewportTier): ViewportState {
  return { tier, isMobile: tier === "base", isWide: tier === "md" };
}

const ViewportContext = createContext<ViewportState>(stateFor("md"));

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<ViewportTier>(readTier);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    // Two boundary listeners cover all three tiers; either edge flipping
    // (resize, rotate, window snap) re-reads the tier. Rotating a phone into
    // landscape SHOULD restore the desktop layout, so this stays live rather
    // than being read once at mount.
    const edges = [
      window.matchMedia(`(min-width: ${BREAKPOINTS.sm}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`),
    ];
    const onChange = () => setTier(readTier());
    edges.forEach((mql) => mql.addEventListener("change", onChange));
    return () => edges.forEach((mql) => mql.removeEventListener("change", onChange));
  }, []);

  return (
    <ViewportContext.Provider value={stateFor(tier)}>{children}</ViewportContext.Provider>
  );
}

export function useViewport(): ViewportState {
  return useContext(ViewportContext);
}
