# Changelog

Every change a host embedding the player would notice is listed here, newest
first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the version follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
major when a host has to change its page or its options, minor when a host
changes nothing and finds the new thing when it looks, patch when a host changes
nothing and something stopped being broken.

## [Unreleased]

## [0.1.0] - 2026-10-28

The first release: the engine as it stands on `main`.

### Added

- A slide is a React component: it can render a live chart, call a real API or
  embed a piece of your own UI, through the slide-authoring contract and
  `makeSlide`.
- Two ways to watch: **Sofa**, where the deck reads itself aloud from committed
  audio, and **Podium**, a second window with your notes, a timer and the next
  slide. The choice persists per browser; `?present=1` and `?present=0` force
  it for one viewing.
- A phone layout that plays a deck written for a laptop with no re-authoring,
  and **Suitcase Mode**, where a deck plays itself like an audiobook.
- Narration from committed audio, with no key, server or configuration needed
  to hear it, and an optional narrate server to re-bake the audio in your own
  voice with Azure Speech (`npm run bake`).
- Two decks: a five-slide starter to copy and a nineteen-slide trailer.
- In-browser engine checks on the launch page.
- Documentation in `docs/`: quick start, watching a deck, writing a deck,
  narration, the narrate server and the tests.
- Runs on Node 24 (`engines.node` is `>=24`).

[Unreleased]: https://github.com/johnfrog76/connected-deck/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnfrog76/connected-deck/releases/tag/v0.1.0
