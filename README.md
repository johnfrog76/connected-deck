```text
 ________________________________________________________
|  o o o                                      [ 3 / 19 ] |
|                                                        |
|  requests / s                            ( * ) LIVE    |
|  |                                  .--.               |
|  |                    .--.       /    \      .-*       |
|  |        .-.        /    \     /      \    /          |
|  |  .--. /   \  .--./      \.--'        '--'           |
|  | /    '     '-'                                      |
|  +-----+-----+-----+-----+-----+-----+-----+-----+--   |
|                                                        |
|    ------------------------------------------------    |
|        C  O  N  N  E  C  T  E  D     D  E  C  K        |
|    ------------------------------------------------    |
|________________________________________________________|
```

<p align="center"><em>Slides that are the real thing, not a picture of it.</em></p>

# Connected Deck

**A presentation engine for engineers, built on the idea that a slide shouldn't have to choose between "looks good" and "is real."**

A slide is just a React component, so it can render a live chart, call a real
API, or embed an actual piece of your product's UI — and read itself aloud from
committed audio while it does.

What you get is a player with two ways to watch: **Sofa**, where the deck reads
itself to you, and **Podium**, where your notes, a timer and the next slide open
in a second window. A deck written for a laptop plays on a phone with no
re-authoring, and **Suitcase Mode** lets it play itself like an audiobook. Two
decks ship with it — a five-slide starter to copy, and a nineteen-slide trailer
to show how far the same contract goes.

It is for engineers who give technical talks and would rather show the thing
than a screenshot of it: a dashboard you can zoom into mid-talk, a chart that
is current, a piece of your own UI, running.

- **[Try it](https://johnfrog76.github.io/connected-deck/)** — no install; two decks, narrated
- MIT licensed, React 18 + Fluent UI, no backend needed to watch or hear a deck
- CI runs lint, type-check, the Jest suite and a production build on every pull
  request and every push to `main`; the demo's launch page runs the engine's
  checks in your browser

---

Most technical presentations are static: a screenshot of a dashboard, a chart
exported as a PNG, a diagram that was accurate the day it was made. Connected
Deck takes the opposite approach — a slide is just a React component, so it can
render a live chart, call a real API, or embed an actual piece of your product's
UI. When the underlying data changes, the slide does too. When you want to show
something live during a talk — zoom into a real dashboard, scroll a real chart —
you can, because it _is_ the real thing, not a picture of it.

## Documentation

| Page | What it covers |
| --- | --- |
| [Quick start](docs/quick-start.md) | Install, run, and the two decks that ship with it |
| [Watching a deck](docs/player.md) | Sofa and Podium, Suitcase Mode, the phone layout, progress seams |
| [Writing a deck](docs/writing-a-deck.md) | The slide-authoring contract, notes, `makeSlide`, adding your own deck, a map of the source |
| [Narration](docs/narration.md) | Committed audio, the filename contract, the two narration sources |
| [The narrate server](docs/server.md) | Re-baking narration in your own voice with Azure Speech |
| [Tests](docs/testing.md) | What the suite pins, and why |

## Run it locally

```bash
npm ci
npm run dev:client
```

Open the printed URL. Two decks are registered; both play immediately, and the
trailer reads itself aloud with no key, no server, and no configuration. Behind
a corporate npm proxy, see the note in the [quick start](docs/quick-start.md).

## Stack

React 18, TypeScript, Vite, Fluent UI v9, React Router. No backend is needed to
view a deck or hear it narrated. The one optional server is `server/index.js`
(Express → Azure Speech), and only for baking your own audio.

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

## License

MIT — see [LICENSE](LICENSE).

## Issues

Bugs and improvements are **GitHub issues on this repo** -- a product owns its
issues. Fixes and updates are still driven from the css-wasteland-app studio
(this repo shares code by copy, on purpose), but what needs doing is filed and
tracked here, where the product lives.
