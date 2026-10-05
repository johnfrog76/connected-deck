# Narration

This page explains how a deck reads itself aloud: the committed audio that
makes narration work out of the box, the filename contract behind it, and the
two narration sources a host can choose between.

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
[the narrate server](server.md).

## Two narration sources — `hasApi`

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

What narration speaks is the slide's `Say` notes — see
[Writing a deck](writing-a-deck.md#notes-say-context-beat). How the player
behaves while it speaks is in [Watching a deck](player.md).
