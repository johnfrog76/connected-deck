# Writing a deck

This page is the slide-authoring contract: what a slide and a deck are, how to
write notes, how to put a real component on a slide, how to register your own
deck, and a map of the source.

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

To give it narration, see [Narration](narration.md) and
[The narrate server](server.md).

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

public/voices/            committed narration audio (see Narration)
scripts/bake-voices.ts    npm run bake
server/index.js           POST /api/narrate — the author path, optional
```

Routes: `/` is the launch page, `/deck/:deckId` the player, `/deck/:deckId/notes`
the presenter popout.

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

Why `Deck.slides()` takes no arguments is told in the README,
["Where this came from"](../README.md#where-this-came-from).
