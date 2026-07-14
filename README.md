# Connected Deck

A presentation engine for engineers, built on the idea that a slide shouldn't
have to choose between "looks good" and "is real."

Most technical presentations are static: a screenshot of a dashboard, a
chart exported as a PNG, a diagram that was accurate the day it was made.
Connected Deck takes the opposite approach — a slide is just a React
component, so it can render a live chart, call a real API, or embed an actual
piece of your product's UI. When the underlying data changes, the slide does
too. When you want to show something live during a talk — zoom into a real
dashboard, run a real command, scroll a real chart — you can, because it
_is_ the real thing, not a picture of it.

This repo is the engine plus two sample decks: `getting-started` — three
plain placeholder slides and a thank-you, showing the bare minimum shape of
a deck with none of the visual flourish — and `git-weather-forecast`, a full
production deck, so you can see both the floor and the ceiling of what the
same engine can do.

## Why this exists

Software engineering has genuinely interesting stories to tell — architecture
decisions, delivery velocity, team health, migrations that actually worked —
but the tools we reach for to tell them (slide decks built from screenshots)
flatten everything back into static images. A connected presentation can sit
directly on top of your app's state and APIs and render *any* of your
existing components as a slide. The result is a presentation that can only be
built by people who actually built the thing it's presenting, and demos an
order of magnitude more convincingly for it.

## What's in the box

```
src/
  deck-engine/            the reusable engine — navigation, chrome, zoom,
                           presenter notes, fullscreen, keyboard control
    DeckController.tsx    slide index, fullscreen state, keyboard nav,
                           cross-window BroadcastChannel sync
    SlideRenderer.tsx     60/40 layout: live content on the left, talking
                           points on the right (or full-width copy-only)
    DeckChrome.tsx        bottom nav bar: exit, prev/next, notes, fullscreen
    ComponentFrame.tsx    wraps any real component for use inside a slide —
                          scales it, gives it a design-grid backdrop, and
                          adds a live zoom control you can drive mid-talk
    PresenterNotes.tsx    a second-screen presenter view (own tab/window):
                          notes, a timer, and a live next-slide preview —
                          the actual upcoming slide, rendered via
                          SlideRenderer and scaled down, not just its text
    PresenterNoteKit.tsx  Say / Context / Beat building blocks for composing
                          a slide's notes — see "The slide-authoring
                          contract" below
    DeckPickerCard.tsx    a "deck picker" card listing every registered deck
    SlidePlaceholder.tsx  a dashed-border "visual to build" stand-in — drop
                          it into a slide's `content` while sketching a deck

  decks/
    types.ts              the entire authoring contract — a Deck is an id,
                           a title, and a function that returns Slide[]
    getting-started.tsx        the floor: three placeholder slides (built
                                with SlidePlaceholder, no styling flourish)
                                plus a thank-you — the minimal shape to copy
    git-weather-forecast.tsx   the ceiling: git activity told as a 10-day
                                weather forecast, CSS/SVG animation
                                throughout, one slide rendering a real
                                connected dashboard component
    DemoSprintVelocity.tsx     a small "connected" dashboard component fed
                                by synthetic sample data — stands in for
                                the kind of live, store-backed component
                                you'd swap in from your own app

  PresentationDeck.tsx    orchestrator: looks up the deck by :deckId, wires
                          up DeckController + SlideRenderer + DeckChrome
  App.tsx, main.tsx       a minimal host app: a deck picker at `/` and the
                          deck routes
```

## The slide-authoring contract

There's no MDX pipeline, no JSON schema, no custom slide DSL. A slide is
just React:

```ts
export interface Slide {
  id: string;
  copy: ReactNode;      // talking points / title panel
  content?: ReactNode;  // the live visual — omit for a full-width copy slide
  notes?: ReactNode;    // shown in the presenter-notes window
}

export interface Deck {
  id: string;
  title: string;
  createSlides: () => Slide[];
}
```

`notes` still accepts a plain markdown string (rendered as before, for older
decks), but new decks should compose it from `Say` / `Context` / `Beat` in
`deck-engine/PresenterNoteKit.tsx` instead of one undifferentiated blob:

```tsx
notes: (
  <>
    <Say>This chart is pulling live from the same store the app uses.</Say>
    <Context>Slow down here — this is the "aha" moment for most audiences.</Context>
    <Beat>advance on click</Beat>
  </>
),
```

`Say` renders verbatim talking points, `Context` is background/tone the
presenter shouldn't read aloud, and `Beat` is a pacing/delivery cue — each
gets distinct styling on the presenter screen, with `NoteLegend` available to
key the colors for anyone new to the format.

Because slides are plain components, "connecting" one to something real is
just... importing it:

```tsx
function StormSlide() {
  return (
    <ComponentFrame initialZoom={1.35}>
      <YourRealDashboardCard />
    </ComponentFrame>
  );
}
```

`ComponentFrame` is the only piece of engine ceremony involved — it scales the
embedded component to fit the slide's design grid and gives you a live zoom
control so you can pull back or push in on it while you talk.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL, and use the deck picker to jump into
**Getting Started** (the bare-bones tour) or **Git as a 10-Day Forecast**
(the full production deck). Controls:

- `→` / `Space` — next slide, `←` — previous slide
- `F` — toggle fullscreen
- `Esc` — exit the deck
- speaker icon in the bottom bar — opens presenter notes in a second window,
  which can also drive the main deck's slide position

## Bringing your own decks

1. Add a new file under `src/decks/`, export a `Deck` from it (see
   `types.ts` and `getting-started.tsx` for the minimal shape, or
   `git-weather-forecast.tsx` for a fully realized example).
2. Register it in `src/decks/index.ts`.
3. That's it — no routing changes, no build config. The route
   `/deck/<your-deck-id>` exists as soon as the deck is registered.

To embed something from your own app: import the real component, wrap it in
`ComponentFrame`, and feed it whatever data source it normally uses (your
Redux store, an RTK Query hook, a REST call — the engine doesn't care).
If you want a slide to stay stable across a live demo (so it doesn't drift as
your data changes underneath you), do what `DemoSprintVelocity` does here:
pass the component a frozen snapshot instead of a live query.

## Design notes

- **Dark by default.** The engine assumes a dark, high-contrast presentation
  theme (Fluent UI's dark theme, restyled). Swap `src/theme.ts` for your own
  brand.
- **60/40 layout, but optional.** Slides with no `content` render as
  full-width copy — useful for a title card or a closing slide.
- **The engine doesn't know about your data layer.** `ComponentFrame` and
  `SlideRenderer` only deal in `ReactNode`. Whatever a slide's `content`
  renders — a chart, a live API call, a whole page from your app — is
  entirely up to the slide, not the engine.
- **Next-slide preview renders at a 1920×1080 internal canvas**, scaled down
  to card size (`PresenterNotes.tsx`'s `CARD_SLIDE_W`/`CARD_SLIDE_H`), not the
  card's actual on-screen pixel size. Slide content authored assuming a wide
  Stage can otherwise clip at the edge of a smaller virtual canvas — same
  16:9 ratio, just more internal pixel budget for the real slide to lay out
  in before it gets scaled down.

## Stack

React 18, TypeScript, Vite, Fluent UI v9 (`@fluentui/react-components`),
React Router, Recharts, react-markdown. No backend required to run the
sample deck — `DemoSprintVelocity` uses synthetic, hard-coded data.

## License

MIT
