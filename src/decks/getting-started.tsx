import type { ReactNode } from "react";
import { tokens } from "@fluentui/react-components";
import { SlidePlaceholder } from "../deck-engine/SlidePlaceholder";
import { Say, Beat } from "../deck-engine/PresenterNoteKit";
import type { Deck, Slide } from "./types";

// ── Deliberately plain — no CSS-art, no animation ────────────────────────────
// This deck exists to show the bare minimum shape of a Deck/Slide, with none
// of the flourish from git-weather-forecast.tsx. If that deck shows what's
// possible, this one shows what's required: player and content are fully
// separate — this deck uses the exact same engine, just with placeholder
// visuals instead of live components.

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
    <p style={{ fontSize: "1.25rem", lineHeight: 1.75, color: "#8891ab", margin: 0 }}>{children}</p>
  );
}

export const gettingStartedDeck: Deck = {
  id: "getting-started",
  title: "Getting Started",
  createSlides: (): Slide[] => [
    {
      id: "welcome",
      title: "A Deck Is Just Data",
      notes: (
        <Say>
          This is the presenter-notes view. A slide&apos;s <code>notes</code> field can be a plain
          markdown string, or composed JSX — see slide 3 for the latter.
        </Say>
      ),
      copy: (
        <CopyPanel>
          <Eyebrow>Connected Deck · Starter</Eyebrow>
          <SlideTitle>A Deck Is Just Data</SlideTitle>
          <Lead>
            This slide has no `content`, so the player renders it full-width. A deck is nothing more
            than an id, a title, and a function that returns an array of slides.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "placeholder-one",
      title: "The Left Panel Is Real Estate",
      notes: (
        <Say>
          This slide has both <code>copy</code> and <code>content</code>, so the player splits the
          frame 60/40. SlidePlaceholder is a real engine component — swap it for any live React
          component and the layout doesn&apos;t change.
        </Say>
      ),
      content: <SlidePlaceholder label="Your first connected visual" sublabel="Swap this for a live chart, a real API call, or a component pulled straight from your own app." />,
      copy: (
        <CopyPanel>
          <Eyebrow>Slide 2 · Content + Copy</Eyebrow>
          <SlideTitle>The Left Panel Is Real Estate</SlideTitle>
          <Lead>
            Whatever you put in `content` renders here, live. In the git-weather-forecast sample deck
            this slot holds an actual connected dashboard component — not a screenshot of one.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "placeholder-two",
      title: "Notes Live Off-Stage",
      notes: (
        <>
          <Say>
            This note is composed from Say and Beat (see PresenterNoteKit) instead of a markdown
            string — that&apos;s why it looks different from slides 1 and 2. Say is what you read
            aloud; Beat is a delivery cue you keep to yourself.
          </Say>
          <Beat>Open this deck, click the speaker icon in the bottom bar</Beat>
          <Beat>A second window opens with these notes, a timer, and a next-slide preview</Beat>
        </>
      ),
      content: <SlidePlaceholder label="Your second connected visual" sublabel="ComponentFrame (used inside SlidePlaceholder) gives every slide a live zoom control for free." />,
      copy: (
        <CopyPanel>
          <Eyebrow>Slide 3 · Presenter Notes</Eyebrow>
          <SlideTitle>Notes Live Off-Stage</SlideTitle>
          <Lead>
            Open the speaker-notes popout (bottom bar, speaker icon) to see what you&apos;re reading
            right now — plus a timer and a preview of what&apos;s next.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "thank-you",
      title: "Thank You",
      notes: <Say>The closer. Full-width, no content panel — same pattern as the title slide.</Say>,
      copy: (
        <CopyPanel>
          <Eyebrow>That&apos;s It</Eyebrow>
          <SlideTitle>Thank You</SlideTitle>
          <Lead>Fork this deck, delete the placeholders, and start wiring in your own story.</Lead>
        </CopyPanel>
      ),
    },
  ],
};
