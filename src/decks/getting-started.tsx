import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { tokens } from "@fluentui/react-components";
import { SlidePlaceholder } from "../deck-engine/SlidePlaceholder";
import { ComponentFrame } from "../deck-engine/ComponentFrame";
import { createMakeSlide } from "../deck-engine/makeSlide";
import { Say, Beat, Context } from "../deck-engine/PresenterNoteKit";
import { DeckState } from "./types";
import type { Deck, Slide } from "./types";

// ── Deliberately plain — no CSS art, no animation ────────────────────────────
// The floor. This deck exists to show the bare minimum shape of a Deck and a
// Slide, with none of the flourish the trailer carries. If the trailer shows
// what's possible, this shows what's required — and both run on the identical
// engine, which is the whole point of keeping them in the same repo.
//
// Read this file top to bottom and you've seen the entire authoring contract:
// a copy kit, makeSlide, four slides, one export.

// ── The copy kit ─────────────────────────────────────────────────────────────
// Each deck styles its own copy panel; that per-deck look is deliberate, so the
// engine shares the wiring rather than the styling. Hand these four components
// to createMakeSlide once and every slide below writes its title exactly once.

function CopyPanel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        padding: "40px 88px 40px 48px",
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: tokens.colorBrandForeground1,
        margin: "0 0 16px 0",
      }}
    >
      {children}
    </p>
  );
}

function SlideTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "2.5rem",
        fontWeight: 800,
        lineHeight: "1.25em",
        margin: "0 0 20px 0",
        color: "#f0f2fa",
      }}
    >
      {children}
    </h2>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: "1.25rem", lineHeight: 1.75, color: "#8891ab", margin: 0 }}>
      {children}
    </p>
  );
}

const makeSlide = createMakeSlide({ CopyPanel, Eyebrow, SlideTitle, Lead });

// ── A genuinely live component ───────────────────────────────────────────────
// Deliberately the simplest thing that could not possibly be a screenshot: it
// has its own state and it changes while you watch it. Stand-in for the real
// article — your dashboard card, your chart, your live query. The engine sees
// a ReactNode either way and doesn't care which.
function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      }}
    >
      <span
        style={{
          fontSize: "0.8rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#6b7799",
        }}
      >
        rendering right now
      </span>
      <span
        style={{
          fontSize: "4.5rem",
          fontWeight: 700,
          color: "#7fd1e8",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      <span style={{ fontSize: "0.95rem", color: "#8891ab" }}>
        A screenshot cannot do this.
      </span>
    </div>
  );
}

export const gettingStartedDeck: Deck = {
  id: "getting-started",
  title: "Getting Started",
  state: DeckState.Prod,
  summary:
    "The minimum shape of a deck: five slides showing the Deck and Slide contract with no visual flourish at all. Covers the full-width copy slide, the 60/40 content split, presenter notes composed from Say and Beat, and one genuinely live component running inside a slide. Read it top to bottom and you've seen the whole authoring surface.",
  tags: ["meta", "getting-started"],
  slides: (): Slide[] => [
    makeSlide({
      id: "welcome",
      title: "A Deck Is Just Data",
      eyebrow: <>Connected Deck · Starter</>,
      lead: (
        <>
          This slide has no <code>content</code>, so the player renders it full-width. A deck
          is nothing more than an id, a title, a summary, and a function that returns an array
          of slides.
        </>
      ),
      notes: (
        <>
          <Say>
            This is the presenter-notes view. Everything the audience sees is on the other
            screen; this window is yours.
          </Say>
          <Context>
            Notes accept a plain markdown string too, for quick drafts — but composed
            Say/Context/Beat is what the narrator reads from, so prefer it.
          </Context>
        </>
      ),
    }),

    makeSlide({
      id: "content-and-copy",
      title: "The Left Panel Is Real Estate",
      eyebrow: <>Slide 2 · Content + Copy</>,
      lead: (
        <>
          Whatever you put in <code>content</code> renders here. Add one and the player splits
          the frame 60/40 — visual on the left, talking points on the right.
        </>
      ),
      content: (
        <SlidePlaceholder
          label="Your first connected visual"
          sublabel="Swap this for a live chart, a real API call, or a component pulled straight from your own app."
        />
      ),
      notes: (
        <>
          <Say>
            A slide with both copy and content splits the frame. SlidePlaceholder is a real
            engine component — swap it for anything and the layout doesn&apos;t change.
          </Say>
          <Beat>Point at the dashed box, then advance</Beat>
        </>
      ),
    }),

    makeSlide({
      id: "live-component",
      title: "Connected Means Running",
      eyebrow: <>Slide 3 · ComponentFrame</>,
      lead: (
        <>
          The clock on the left is a React component with its own state, mounted inside the
          slide. Wrap anything in <code>ComponentFrame</code> and it gets a design-grid
          backdrop plus a zoom control you can drive mid-talk.
        </>
      ),
      content: (
        <ComponentFrame initialZoom={1}>
          <LiveClock />
        </ComponentFrame>
      ),
      notes: (
        <>
          <Say>
            This is the whole thesis in one slide. That clock is not an image — it is a
            component, running, right now, in front of you.
          </Say>
          <Say>
            Anything you can render in your app, you can render here: a chart backed by a real
            query, a card from your dashboard, a whole page of your product.
          </Say>
          <Beat>Zoom in with the control, top-right, while the seconds tick</Beat>
          <Context>
            ComponentFrame is the only engine ceremony involved. Everything else is just
            importing a component.
          </Context>
        </>
      ),
    }),

    makeSlide({
      id: "notes-off-stage",
      title: "Notes Live Off-Stage",
      eyebrow: <>Slide 4 · Presenter Notes</>,
      lead: (
        <>
          Switch to Podium on the launch page, then open the speaker-notes popout from the
          bottom bar — a second window with these notes, a timer, and a preview of what&apos;s
          next.
        </>
      ),
      content: (
        <SlidePlaceholder
          label="Your second connected visual"
          sublabel="Notes, narration, and the timer all live in the other window — the room only ever sees this panel."
        />
      ),
      notes: (
        <>
          <Say>
            Say is what you read aloud. Context is background you keep to yourself. Beat is a
            delivery cue.
          </Say>
          <Say>
            That split isn&apos;t only cosmetic — narration reads the Say lines and nothing
            else, so keeping stage directions out of Say is a contract, not a preference.
          </Say>
          <Beat>This line is a Beat — the narrator will not say it</Beat>
          <Context>And this is Context — also never spoken.</Context>
        </>
      ),
    }),

    makeSlide({
      id: "thank-you",
      title: "Thank You",
      eyebrow: <>That&apos;s It</>,
      lead: (
        <>
          Copy this file, delete the placeholders, and start wiring in your own story. Register
          it in <code>decks/index.ts</code> and the route exists.
        </>
      ),
      notes: (
        <>
          <Say>
            That is the entire contract. Four slides, one file, no build configuration.
          </Say>
          <Context>
            Deck convention: close with the give-away — tell them where to get it.
          </Context>
        </>
      ),
    }),
  ],
};
