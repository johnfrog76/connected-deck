import type { ReactNode } from "react";

// Shared building blocks for presenter notes. Compose these in a deck's
// `notes:` field (instead of a markdown string) so the presenter screen
// visually separates what to say verbatim from what's just for their own
// understanding of tone/reasoning/pacing.

const SAY_COLOR = "#f5f5f7";
const CONTEXT_FG = "#5eead4";
const CONTEXT_BG = "#050506";
const BEAT_COLOR = "#fbbf24";

/** Words to read (near-)verbatim to the audience. */
export function Say({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: "0 0 16px", color: SAY_COLOR, fontSize: "1.05em", lineHeight: 1.75 }}>
      {children}
    </p>
  );
}

/** Background, reasoning, or tone guidance — not meant to be spoken aloud. */
export function Context({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        color: CONTEXT_FG,
        backgroundColor: CONTEXT_BG,
        padding: "1px 7px",
        borderRadius: "4px",
        fontStyle: "italic",
        fontSize: "0.95em",
      }}
    >
      {children}
    </span>
  );
}

/** Pacing/delivery cues: pauses, transitions, "advance here". */
export function Beat({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        margin: "0 0 12px",
        color: BEAT_COLOR,
        fontFamily: "monospace",
        fontSize: "0.85em",
        letterSpacing: "0.02em",
      }}
    >
      ▸ {children}
    </div>
  );
}

const legendItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "11px",
  fontFamily: "monospace",
};

const swatchBase: React.CSSProperties = {
  display: "inline-block",
  width: "10px",
  height: "10px",
  borderRadius: "2px",
};

export function NoteLegend() {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        opacity: 0.7,
      }}
    >
      <span style={legendItemStyle}>
        <span style={{ ...swatchBase, backgroundColor: SAY_COLOR }} />
        Say — read aloud
      </span>
      <span style={legendItemStyle}>
        <span style={{ ...swatchBase, backgroundColor: CONTEXT_BG, border: `1px solid ${CONTEXT_FG}` }} />
        <span style={{ color: CONTEXT_FG }}>Context</span> — tone / background, don&apos;t speak
      </span>
      <span style={legendItemStyle}>
        <span style={{ ...swatchBase, backgroundColor: BEAT_COLOR }} />
        Beat — pacing / delivery cue
      </span>
    </div>
  );
}
