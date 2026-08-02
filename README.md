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
npm ci
npm run dev:client
```

Open the printed URL. Two decks are registered; both play immediately, and the
trailer reads itself aloud with no key, no server, and no configuration.

> **Behind a corporate npm proxy?** If `npm ci` 404s on a tarball it says exists
> (`Cannot find the file … in feed 'npm-public'`), that's the proxy not having
> mirrored it yet, not this repo — every dependency here resolves to the public
> registry. Install once with `npm ci --registry=https://registry.npmjs.org/`.

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
- **Podium** (`mode="presenter"`) — give me my notes. The notes button appears
  and opens a second window with your notes, a timer, and a live preview of the
  next slide. Voice and mute leave the main window, because someone reading
  from their own notes doesn't want a synthesized voice competing with them.

Your choice persists per browser. **The URL always wins over the setting**:
`?present=1` and `?present=0` force a mode for one viewing, so a deck link you
share never carries *your* podium default to whoever opens it. The launch page's
buttons pin the mode into the link deliberately for that reason.

**Podium is the notes window, and nothing else.** It is not a "presenting"
mode: presenting is screen-sharing whatever window you like, from whatever
device, which this app neither knows about nor affects. Someone sharing a phone
into a call with computer audio is presenting perfectly well in Sofa. What
Podium adds is a second window with your notes, a timer, and the next slide.

That's why it's **disabled below the `sm` breakpoint** — shown greyed with a
reason, never hidden. A narrow window can't open a positioned second window, so
the notes popout would be a dead tab. Nothing else is lost, which is what makes
disabling it the complete answer rather than a compromise. The same rule closes
an already-open notes popout if the window is narrowed mid-deck: it's a window
attached to a mode that no longer exists.

Reachable far more often on a **narrowed desktop window** than on an actual
phone — you can't resize a phone across the breakpoint, and a phone visitor
never had a Podium expectation to be surprised out of.

Mode is a required prop with no default — `DeckPlayer` makes every caller say
what a window is, rather than inferring it from which props happen to be wired.

## Suitcase Mode — a deck that plays itself

Behind the gear on the launch page, alongside a Voice switch that starts
narration the moment a deck opens. Turn **Suitcase Mode** on and a slide's
narration ending advances to the next one: an audiobook rather than a
slideshow. Headphones on, phone in a pocket, no fumbling to page a 60-slide
deck on a bus.

It waits `SLIDE_DWELL_SECONDS` (5) after each clip before moving — the same
constant `deckDuration.ts` already uses to estimate a deck's runtime, so a deck
that plays itself takes as long as the badge on the launch page promised. At
the last slide it simply stops: `goNext` clamps, so there's no separate
end-of-deck state to build or get wrong.

**Suitcase Mode requires narration, in both directions.** Turning it on turns
narration on; turning narration off turns it off. It advances when a clip
*ends*, so without narration there is no such event and the setting cannot mean
anything. An earlier version made this one-directional and let a stale Suitcase
flag start narration on its own — turn Voice off, open a deck, and it read
itself aloud anyway. Never let a dependent setting override the setting it
depends on.

That rule holds at **both layers**, because narration goes quiet at two
different depths. The stored preferences couple in `voicePreference.tsx`
(Settings' Voice switch off clears the Suitcase flag). But the in-deck sheet's
Narrated switch is deliberately *session* state — muting the deck you're
watching shouldn't rewrite what every future deck does — so the player gates
the chrome on the live value too: a viewing declared Silent hands the transport
back to the paging arrows. An earlier version gated only on the stored flag,
and flipping the sheet to Silent left a play button over a deck that would
never move, with no way to page by hand.

Which is also why **pause is not Silent**. The transport button holds playback
with narration still on (`paused` in `useSlideNarration`), it doesn't flip the
mode — if it did, the session gate above would swap the transport for paging
arrows under the thumb that pressed it. Three distinct quiets, three owners:
`paused` belongs to the listener, `suspended` (sheet open) to the player, and
`enabled` — the one that changes what the chrome *is* — to the settings
surfaces.

**It's mobile-only, and gated on the live viewport.** The mobile chrome trades
the paging arrows for one big play/pause; on a wide screen the ordinary arrows
are right there, so a deck advancing by itself would be moving with nothing on
screen saying why. Widen a window mid-deck and the auto-advance stops; narrow
it back and it resumes — including catching up if the clip finished while you
were wide. The *preference* survives either way.

**These settings deliberately have no URL override**, unlike `?present=`. Mode
is a property of the *link* — what you meant to share — so it travels. Whether
audio starts on its own is a property of the *listener*, so it doesn't.

Three patterns here worth copying rather than the feature itself:

- **Each setting owns its own storage and context** (`presenterMode.tsx`,
  `voicePreference.tsx`); the surfaces only *render* them. A preference module
  reads on its own and tests without a UI.
- **One form, two surfaces.** `SettingsForm.tsx` owns what the settings are,
  what they say, and how they gate each other; the launch page's drawer and the
  in-deck bottom sheet both render it with a `variant`. They were separate
  implementations once and drifted immediately — different labels for the same
  switch, and one of them enforcing the gating rule wrongly.
- **The player owns behaviour, hosts own preference.** `narrateByDefault` and
  `suitcase` arrive as props like `mode` does, and `DeckPlayer` decides what
  they *do* — so every host gets the viewport gating without knowing about it.

`useSlideNarration` reuses **one** `<audio>` element for every clip rather than
constructing one per slide. iOS Safari blesses an element for programmatic
playback once a user gesture has played it, and the blessing sticks to *that
element* — a fresh `new Audio()` per slide starts each one unblessed, so
narration dies after the first clip on a phone. That's the platform detail most
worth stealing from this file.

## On a phone

A deck opens on a phone as a **stacked** slide — art in a band on top, copy
below as a scrolling read — and the chrome swaps to a different component
rather than a restyled one.

The art doesn't reflow. It renders into the authored 768×720 panel and
transform-scales to fit the band, so **a deck written for a laptop works on a
phone with zero re-authoring** — compositions stay composed instead of
collapsing into a column. (One accepted tradeoff: `vw`-sized text inside art
resolves against the real viewport and lands smaller than `px` art at that
scale.)

`DeckChromeDesktop` and `DeckChromeMobile` are **separate components**, not one
file full of `compact ? a : b`, because they solve different problems:

|                | Desktop                        | Mobile                          |
| -------------- | ------------------------------ | ------------------------------- |
| Who's looking  | a room, via a projector        | one person, one thumb           |
| Controls       | small, subtle, inline          | 44px targets, safe-area insets  |
| Voice picker   | a dropdown, collapsed          | radios in a bottom sheet        |
| Extra chrome   | none — it should disappear     | a gear that names what's inside |

Understated is correct on a projector and wrong on a bus; explicit is the
reverse. One component with forks throughout serves neither, and both are
harder to lift out.

### Two hooks own two browser APIs

Nothing else in the app calls `matchMedia` or `localStorage`. Components ask
semantic questions and never see the mechanism:

```tsx
const { isMobile } = useViewport();              // not a media string
const { value, toggle } = usePersistedFlag(KEY); // not a storage call
```

That's what makes this liftable: repoint `viewport.tsx` at your own breakpoints
and every consumer keeps working, because none of them knew how the answer was
computed. `usePersistedState.ts` also means a setting can't be written without
the private-mode guard — Safari *throws* on `localStorage` in private mode, and
the version of this code that hand-rolled each preference had modules that
forgot the `try/catch`.

Both chromes and `SlideRenderer` are pure props-in — no context, no ambient
hooks — so you can import `DeckChromeMobile` directly and decide the breakpoint
yourself.

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
    SlideRenderer.tsx     60/40 side by side, or stacked art-over-copy on a
                          phone (the art SCALES, it doesn't reflow)
    DeckChrome.tsx        picks a chrome — ~10 lines, no styling of its own
    DeckChromeDesktop.tsx the podium bar: understated, a room can see it
    DeckChromeMobile.tsx  the bus bar: 44px targets, gear sheet, one-button
                          transport in Suitcase Mode
    deckChromeShared.ts   the props contract both chromes agree on
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
  shared/
    usePersistedState.ts  THE localStorage layer — nothing else touches it
  LaunchPage.tsx          deck list + the Sofa/Podium switch + the gear
  PresentationDeck.tsx    /deck/:deckId — resolves mode, mounts DeckPlayer
  SettingsForm.tsx        the settings themselves: rows, copy, gating rules
  SettingsDrawer.tsx      a container that renders SettingsForm. Nothing else
  presenterMode.tsx       the persisted Sofa/Podium setting
  voicePreference.tsx     narrate-by-default, Suitcase Mode, default voice
  viewport.tsx            THE matchMedia layer — components ask `isMobile`
  media.ts                breakpoints + MEDIA.* query strings for makeStyles
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

Suitcase Mode gets its own block, because every bug this feature has had lived
in a state nobody thinks to open by hand:

- a deck with **nothing baked and no synthesizer** — the transport button once
  rendered anyway, dead, having replaced the paging arrows, which left a reader
  with no way through the deck at all;
- the window **resized wide mid-slide and back** — auto-advance un-arms above
  the breakpoint, so the `ended` event that should have moved the deck fired
  into nothing and the deck sat on a finished slide forever;
- **desktop width with the preference on**, where slides must *not* advance;
- the **last slide**, which should stop rather than run off the end;
- the sheet flipped to **Silent mid-viewing** — the chrome gated on the stored
  flag only, so the transport outlived the narration it advances on and the
  paging arrows never came back;
- **pause pressed on the transport** — which must hold playback *without*
  flipping the narration mode, or the session gate hands the bar back to the
  arrows and the button deletes itself under the thumb that pressed it.

The viewport is stubbed (jsdom has no `matchMedia`), and `setViewport` fires
the registered listeners so a test can resize a mounted tree the way a real
window does. Every one of those cases was a real bug found by writing the test,
not by reading the code.

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
library of decks across two host apps. The copies are kept in sync by periodic
re-baseline, not by a shared package — so if you're comparing them, expect the
engine files to match and the surrounding app not to.

`Deck.slides()` takes no arguments, and that's worth a note because it briefly
didn't match. Upstream it used to carry an active-organization slug, for decks
rendering org-scoped sample data. Dropping it here wasn't a simplification for
the public repo — it was a judgment that a deck shouldn't have to know about
orgs at all, and upstream has since removed it too. A deck that genuinely needs
live host data should read it from the host's own runtime rather than have it
threaded through the interface every other deck has to implement.

The two `Deck` types now agree. If you ever see them drift again, that's a
question to settle, not a difference to preserve.

## Stack

React 18, TypeScript, Vite, Fluent UI v9, React Router. No backend is needed to
view a deck or hear it narrated. The one optional server is `server/index.js`
(Express → Azure Speech), and only for baking your own audio.

## License

MIT
