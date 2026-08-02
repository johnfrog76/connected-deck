import { useEffect, useState } from "react";
import { Button, tokens } from "@fluentui/react-components";
import { PauseFilled, PlayFilled } from "@fluentui/react-icons";

// ── SuitcaseTransport — the one-button transport, wearing its progress ───────
//
// Suitcase Mode's play/pause with a progress ring around it: the ring is the
// slide's audible LIFE — it fills as the voice reads, keeps filling through
// the post-clip dwell, and completes exactly as the deck advances (the hosts
// feed it clip + dwell, deckDuration's own model of a slide). The one
// glanceable answer to "when does the next slide come?" without surrendering
// the one-big-button contract.
//
// DUPLICATED FILE — this component exists byte-identical in two repos
// (prompts web/src/app/deck-components and connected-deck src/deck-engine),
// same contract as useSlideNarration itself: the repos share no package, they
// sync by porting, so this file must stay self-contained. Props only — no
// context, no ambient hooks, no imports beyond React and Fluent — and any
// change made in one copy gets made in the other.
//
// Presentation only, by design. It owns no playback state: `paused` and
// `onTogglePause` arrive from the host's narration controls, and progress is
// PULLED via a getter rather than pushed as a prop. That's what keeps the
// ring cheap — an <audio> element updates its clock many times a second, and
// a `progress` prop would re-render whatever owns the narration hook (the
// whole player) at that rate. Polling from inside this leaf keeps the
// re-render blast radius to one small button.

const RING_STROKE = 3;
const POLL_MS = 200;

export function SuitcaseTransport({
  paused,
  onTogglePause,
  getProgress,
  size = 48,
}: {
  /** Transport hold state — swaps the glyph, never unmounts the button. */
  paused: boolean;
  onTogglePause: () => void;
  /**
   * Progress 0..1, sampled ~5×/s while mounted. What it measures is the
   * host's call — both apps feed the slide's audible life (clip + dwell) so
   * the ring completes exactly at the auto-advance. Return 0 when nothing is
   * loaded.
   */
  getProgress: () => number;
  /** Diameter in px. Default sits above the 44px touch floor. */
  size?: number;
}) {
  const [progress, setProgress] = useState(0);

  // Poll rather than subscribe: the getter reads the live element on demand,
  // so there's no event plumbing to keep in sync across two repos, and an
  // unmounted transport (paging mode) costs nothing at all.
  //
  // Nothing here knows about viewports on purpose. Suitcase Mode is currently
  // a phone-width affordance, but that's the HOST'S policy (DeckPlayer's
  // gate), not this component's — it renders at any breakpoint it's mounted
  // in, and relaxing the mode to desktop someday touches the gate, not this.
  useEffect(() => {
    setProgress(getProgress());
    const id = setInterval(() => setProgress(getProgress()), POLL_MS);
    return () => clearInterval(id);
  }, [getProgress]);

  const r = (size - RING_STROKE) / 2;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* The ring. Behind the button and pointer-transparent — decoration for
          the eyes, invisible to the thumb and to assistive tech (the button's
          own label carries the semantics). pathLength normalizes the circle to
          100 so the dash math never involves the radius; no
          vector-effect/non-scaling-stroke anywhere near it on purpose. */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: "rotate(-90deg)", // progress starts at 12 o'clock
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tokens.colorNeutralStroke2}
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tokens.colorBrandForeground1}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(0, Math.min(1, progress)) * 100} 100`}
          // One poll interval of easing turns 5 updates/s into motion; linear
          // so the ring never overshoots the clock it reports.
          style={{ transition: `stroke-dasharray ${POLL_MS}ms linear` }}
        />
      </svg>
      <Button
        shape="circular"
        appearance="subtle"
        onClick={onTogglePause}
        aria-label={paused ? "Play" : "Pause"}
        style={{
          width: size,
          height: size,
          minWidth: size,
          maxWidth: size,
        }}
        icon={
          paused ? <PlayFilled fontSize="24px" /> : <PauseFilled fontSize="24px" />
        }
      />
    </span>
  );
}
