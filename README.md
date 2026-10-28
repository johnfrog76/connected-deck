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

What you get is a player with three modes: **Sofa**, where you watch and page
through a deck while it reads each slide to you; **Audiobook**, where it reads
itself aloud and turns its own slides, phone in a pocket; and **Podium**, where
your notes, a timer and the next slide open in a second window. A deck written
for a laptop plays on a phone with no re-authoring. Two decks ship with it — a five-slide starter to copy, and a nineteen-slide trailer
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
| [Watching a deck](docs/player.md) | Sofa, Audiobook and Podium, the two bars, the host's options, the phone layout, progress seams |
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

## Releases

What changed in each version is in [CHANGELOG.md](CHANGELOG.md), and the same
section is the notes of that version's
[GitHub Release](https://github.com/johnfrog76/connected-deck/releases). Any
change a host embedding the player would notice adds one line under
**Unreleased** in the same pull request, under Added, Changed, Fixed or Removed.

The version is semantic, picked by what a host with the player mounted has to
do: change its page or its options, major; nothing, and it finds the new thing
when it looks, minor; nothing, and something stopped being broken, patch.

A release is one small pull request on `main`: rename **Unreleased** to the
version and the date, open a fresh **Unreleased** above it, and set the same
version in `package.json`. Once it is merged, push the tag, `v` followed by the
version. The release workflow builds the GitHub Release from that changelog
section and fails, naming the missing section, if there is none. To preview the
notes locally: `node scripts/release-notes.mjs v<version>`.

## License

MIT — see [LICENSE](LICENSE).

## Issues

Bugs and improvements are GitHub issues on this repository.
