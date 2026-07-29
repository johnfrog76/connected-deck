# Connected Deck

A presentation engine for engineers, built on the idea that a slide shouldn't
have to choose between "looks good" and "is real."

Most technical presentations are static: a screenshot of a dashboard, a chart
exported as a PNG, a diagram that was accurate the day it was made. Connected
Deck takes the opposite approach — a slide is just a React component, so it can
render a live chart, call a real API, or embed an actual piece of your product's
UI. When the underlying data changes, the slide does too. When you want to show
something live during a talk — zoom into a real dashboard, scroll a real chart —
you can, because it _is_ the real thing, not a picture of it.

```bash
npm install
npm run dev:client
```

Open the printed URL. Two decks are registered; both play immediately, and the
trailer reads itself aloud with no key, no server, and no configuration.

## The two decks

**Getting Started** is the floor: five slides, one file, no visual flourish.
It's the whole authoring contract in something you can read top to bottom and
copy — a full-width copy slide, the 60/40 content split, notes composed from
Say/Context/Beat, and one genuinely live component (a ticking clock, mounted in
a slide, doing what a screenshot can't).

**Trailer — The Connected Deck Universe** is the ceiling: nineteen slides of
hand-written CSS and SVG. No images, no video, no animation library, no assets
of any kind — open `src/decks/connected-deck-trailer.tsx` and everything you
just watched is in that one file. It's also the deck that explains the app,
because Sofa Mode and Podium Mode are characters in it before they're a switch
you flip.

The gap between them is the point. Same engine, same contract, wildly different
ceilings.

## Two ways to watch — Sofa and Podium

The switch on the launch page decides how a deck opens, and it's the first thing
you see because it's the thing worth understanding:

- **Sofa** (`mode="audience"`) — read to me. Voice and mute controls live in the
  player and narrate from committed audio. There is no speaker-notes surface at
  all — not hidden, *absent*. Nothing to escalate to on a link someone sent you.
- **Podium** (`mode="presenter"`) — I'm presenting. The notes button appears and
  opens a second window with your notes, a timer, and a live preview of the next
  slide. Voice and mute leave the main window, because the presenter owns their
  own voice and a synthesized one competing with it is just noise.

Your choice persists per browser. **The URL always wins over the setting**:
`?present=1` and `?present=0` force a mode for one viewing, so a deck link you
share never carries *your* podium default to whoever opens it. The launch page's
buttons pin the mode into the link deliberately for that reason.

Mode is a required prop with no default — `DeckPlayer` makes every caller say
what a window is, rather than inferring it from which props happen to be wired.

## Narration: baked audio is the demo, the endpoint is the product

Narration works out of the box, because the trailer's audio is **committed to
this repo**:

```
public/voices/
  connected-deck-trailer/
    establishing-shot-en-US-JennyNeural.mp3
    establishing-shot-en-US-BrianNeural.mp3
    atom-introduction-en-US-JennyNeural.mp3
    atom-introduction-en-US-BrianNeural.mp3
    …                          38 files — 19 slides × 2 voices
```

The filename **is** the contract: `<deckId>/<slideId>-<voiceId>.mp3`.
`bakedVoices.ts` globs those files at build time, Vite fingerprints and ships
them, and the player resolves a clip by that exact key. Nothing else — no
manifest, no registry to update. Drop a correctly-named file in and it plays;
that's all "baking" means.

It also explains the strictness: a voice is offered **only when every slide in
the deck has a clip in it**. Nineteen Jenny files is a voice; eighteen is not.

The moment you write your own deck, or edit the words in this one, that audio is
stale by definition. That's expected, and there's no staleness detection here on
purpose — the answer isn't a hash manifest, it's to re-bake in your own voice.
So the repo also ships the thing that made the audio:

```bash
cp .env.example .env          # add your Azure Speech key and region
npm run dev:server            # the narrate server, port 5175
npm run bake -- connected-deck-trailer
```

`npm run bake` walks every slide, computes the exact text the player would
speak, and POSTs it to `/api/narrate`, whose write-through cache writes the mp3s
into the layout above. Re-running is free for anything already cached — a real
run looks like `19/19 baked (17 cached, 2 synthesized)`. It exits non-zero
unless every slide has audio in every requested voice, so a partial bake is a
failure you see now rather than a deck that stops talking halfway later.

You can also just rehearse with the server running: the same write-through cache
means playing a deck through bakes it.

### Two narration sources — `hasApi`

Where audio comes from is a **host** fact, not a deck fact, and both narration
surfaces take the same two props:

- **`hasApi: false` + `resolveNarrationUrl`** — how this app ships. Committed
  mp3s are the only audio; `/api/narrate` is never called. When no voice covers
  a deck, the controls render **disabled, not absent**: "this deck wasn't baked"
  is a different claim from "this player can't narrate," and the UI should make
  the true one.
- **`hasApi: true`** — the author's setup, with the narrate server running.
  Every voice stays selectable regardless of what's on disk, because a missing
  mp3 is a cache miss rather than a gap.

The same deck is therefore fully narratable in one setup and partly silent in
another. Coverage is a property of *(deck, host)*, never of the deck alone.

## The slide-authoring contract

No MDX pipeline, no JSON schema, no slide DSL. A slide is React:

```ts
export interface Slide {
  id: string;
  title?: string;           // plain-text anchor for the presenter window;
                            // also the first thing narration speaks
  copy: ReactNode;          // talking points / title panel
  content?: ReactNode;      // the live visual — omit for a full-width copy slide
  notes?: ReactNode;        // shown in the presenter-notes window
  approximateTime?: string; // optional "mm:ss" override for the length badge
}

export interface Deck {
  id: string;
  title: string;
  summary: string;          // spoiler-free: what it's about, not how it ends
  state?: DeckState;        // Draft | InProgress | Prod | Archive
  tags?: string[];
  slides: () => Slide[];
}
```

### Notes: Say, Context, Beat

`notes` accepts a plain markdown string, but compose it from the note kit
instead:

```tsx
notes: (
  <>
    <Say>This chart pulls from the same store the app uses.</Say>
    <Context>Slow down here — this is the aha moment for most rooms.</Context>
    <Beat>advance on click</Beat>
  </>
),
```

`Say` is what you read aloud, `Context` is background you keep to yourself, and
`Beat` is a delivery cue. Each is styled distinctly on the presenter screen —
but this split isn't cosmetic: **narration speaks only `Say`**. Keeping stage
directions out of `Say` is a contract, not a preference, and the deck-length
estimate measures the same text.

### `makeSlide` — write the title once

A slide's `title` must match the title rendered inside `copy`, and writing both
by hand invites drift. Hand `createMakeSlide` your deck's four copy components
once, then write each title exactly once:

```tsx
const makeSlide = createMakeSlide({ CopyPanel, Eyebrow, SlideTitle, Lead });

makeSlide({
  id: "live-component",
  title: "Connected Means Running",   // → Slide.title AND <SlideTitle>
  eyebrow: <>Slide 3 · ComponentFrame</>,
  lead: <>The clock on the left is a component with its own state.</>,
  content: <ComponentFrame><LiveClock /></ComponentFrame>,
  notes: <>…</>,
});
```

`copyAfter` appends extra copy below the lead; a bespoke `copy:` replaces the
standard stack entirely for a slide with a custom title treatment. `title` stays
required either way, so the presenter window never loses its anchor.

### Connecting a slide to something real

Import the component. That's the whole API:

```tsx
function StormSlide() {
  return (
    <ComponentFrame initialZoom={1.35}>
      <YourRealDashboardCard />
    </ComponentFrame>
  );
}
```

`ComponentFrame` is the only engine ceremony involved — it scales the component
to the slide's design grid and gives you a live zoom control to drive mid-talk.
Feed the component whatever data source it normally uses; the engine only ever
sees a `ReactNode`. If you want a slide to stay stable across a live demo, pass
it a frozen snapshot instead of a live query.

## Bringing your own decks

1. Add a file under `src/decks/`, export a `Deck` from it.
2. Register it in `src/decks/index.ts`.
3. That's it. `/deck/<your-deck-id>` exists as soon as it's registered — no
   routing changes, no build config.

## What's in the box

```
src/
  deck-engine/            the reusable engine
    DeckPlayer.tsx        the player: mode, slides, chrome, narration wiring
    DeckController.tsx    slide index, fullscreen, keyboard, cross-window sync
    SlideRenderer.tsx     60/40 layout (or full-width when there's no content)
    DeckChrome.tsx        bottom bar: exit, prev/next, voice, notes, fullscreen
    ComponentFrame.tsx    wraps a real component: design grid + live zoom
    PresenterNotes.tsx    the second-screen window: notes, timer, next-slide
                          preview, narration controls
    PresenterNoteKit.tsx  Say / Context / Beat
    makeSlide.tsx         the slide factory (write the title once)
    SlidePlaceholder.tsx  dashed "visual to build" stand-in for sketching
    sayText.ts            what the narrator speaks — one source of truth
    deckDuration.ts       the m:ss estimate on the launch page
    voiceCoverage.ts      which voices can narrate a deck, and why
    useVoiceControls.ts   coverage + selection, bound together on purpose
    useSlideNarration.ts  audience-side playback of baked audio
    narrationConstants.ts the voice roster and the exact "not baked" wording
  decks/
    types.ts              the entire authoring contract
    index.ts              the registry
    getting-started.tsx   the floor
    connected-deck-trailer.tsx  the ceiling
    cat-dev.tsx           a character the trailer casts, and a worked example
                          of the only dependency a slide really has
  LaunchPage.tsx          deck list + the Sofa/Podium switch
  PresentationDeck.tsx    /deck/:deckId — resolves mode, mounts DeckPlayer
  presenterMode.tsx       the persisted Sofa/Podium setting
  bakedVoices.ts          the committed-mp3 registry

public/voices/            committed narration audio (see above)
scripts/bake-voices.ts    npm run bake
server/index.js           POST /api/narrate — the author path, optional
```

Routes: `/` is the launch page, `/deck/:deckId` the player, `/deck/:deckId/notes`
the presenter popout.

## Tests

```bash
npm test
```

Deliberately narrow: the suite pins the rules that are invisible when broken —
mode ownership (presenter never grows voice controls, audience never grows a
notes surface), which narration source each host reads from, the voice-coverage
rules, and the player's neutral default theme. Those are the invariants a
refactor regresses silently, so they're the ones worth a headless assertion.

## Design notes

- **Dark by default, and host-neutral.** The player runs Fluent's stock
  `webDarkTheme`, deliberately unbranded, so no app's palette follows a deck in.
  `DeckPlayer` takes a `theme` prop as an escape hatch. Slides carry their own
  palettes as literals; no theme reaches into deck art.
- **60/40, but optional.** A slide with no `content` renders full-width —
  useful for a title card or a closer.
- **The engine doesn't know about your data layer.** `ComponentFrame` and
  `SlideRenderer` deal only in `ReactNode`.
- **The next-slide preview renders at a 1920×1080 internal canvas** and scales
  down, so slide content authored for a wide stage doesn't clip in the preview.

## Where this came from

The engine was extracted from a larger private toolkit, where it drives a
library of decks across two host apps. Extraction means the two copies are kept
in sync by periodic re-baseline, not by a shared package — so if you're
comparing them, expect the engine files to match and the surrounding app not to.

One deliberate difference worth naming: upstream, `Deck.slides` takes an
active-organization slug, for decks that render org-scoped sample data. That's a
host concept with no meaning in a standalone repo, so here `slides()` takes no
arguments. It's not an oversight, and it shouldn't be "fixed" back.

## Stack

React 18, TypeScript, Vite, Fluent UI v9, React Router. No backend is needed to
view a deck or hear it narrated. The one optional server is `server/index.js`
(Express → Azure Speech), and only for baking your own audio.

## License

MIT
