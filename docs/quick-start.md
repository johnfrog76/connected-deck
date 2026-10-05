# Quick start

This page gets Connected Deck running on your machine and introduces the two
decks that ship with it.

## Run it

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
hand-written CSS and SVG, every atom a strand of light under some tension —
pulled taut, snapped, frayed, braided. No images, no video, no animation
library, no assets of any kind — open `src/decks/connected-deck-trailer.tsx`
and every frame you just watched is drawn in that one file. The one figure it
stages, the cat, is imported from `cat-dev.tsx`, which is the point of that
file. It's also the deck that explains the app, because Sofa Mode and
Presenter Mode (the Podium switch) are characters in it before they're a
switch you flip.

The gap between them is the point. Same engine, same contract, wildly different
ceilings.

## Where next

- [Watching a deck](player.md) — Sofa and Podium, Suitcase Mode, and the phone layout.
- [Writing a deck](writing-a-deck.md) — the slide-authoring contract and how to add your own.
- [Narration](narration.md) — how the committed audio works.
- [The narrate server](server.md) — re-baking narration in your own voice.
- [Tests](testing.md) — what the suite pins, and why.
