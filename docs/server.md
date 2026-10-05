# The narrate server

This page covers the one optional server: what it is for, and how to use it to
re-bake a deck's narration in your own voice.

No backend is needed to view a deck or hear it narrated. The one optional server
is `server/index.js` (Express → Azure Speech), and only for baking your own
audio — the committed audio and its filename contract are described in
[Narration](narration.md).

## Re-baking in your own voice

```bash
cp .env.example .env          # add your Azure Speech key and region
npm run dev:server            # the narrate server, port 5175
npm run bake -- connected-deck-trailer
```

`npm run bake` walks every slide, computes the exact text the player would
speak, and POSTs it to `/api/narrate`, whose write-through cache writes the mp3s
into the `public/voices/` layout. Re-running is free for anything already
cached — a real run prints one line per voice, like
`en-US-JennyNeural: 19/19 baked (17 cached, 2 synthesized)`. It
exits non-zero unless every slide has audio in every requested voice, so a
partial bake is a failure you see now rather than a deck that stops talking
halfway later.

You can also just rehearse with the server running: the same write-through cache
means playing a deck through bakes it.
