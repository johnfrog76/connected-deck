# Changelog

Every change a host embedding the player would notice is listed here, newest
first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the version follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
major when a host has to change its page or its options, minor when a host
changes nothing and finds the new thing when it looks, patch when a host changes
nothing and something stopped being broken.

## [Unreleased]

### Fixed

- **Podium's bar no longer offers the sound toggle or the voice picker.**
  Turning narration on from the room's window played it in both windows, out
  of step. Sound and voice now live only in the speaker-notes window; the
  room's bar keeps Exit, paging, the notes button and fullscreen.

## [0.2.0] - 2026-10-28

### Added

- **Audiobook mode**: the player reads a deck aloud and turns its own slides,
  advancing when each slide's narration ends and stopping at the last slide.
  Choose it on the launch page or in the player's settings sheet, at any
  width. Previous and next sit either side of a play ring, so a slide can be
  skipped without leaving the mode; pause holds the slide.
- `DeckPlayer` takes `audiobook` to turn the mode on and `onAudiobookChange` to
  let a viewer choose Sofa or Audiobook from the settings sheet.
- `DeckPlayer` takes `offeredModes`, the modes a host offers. Pass
  `["audience"]` and Podium is absent on every screen; the default offers both.

### Changed

- Two bars. Sofa and Audiobook mode share the viewer's bar at every width:
  Exit, then previous and next around the counter or the play ring, centred on
  the screen, then settings, fullscreen and the sound. Podium keeps the
  presenter's bar, everything inline, and now carries the sound and the voice
  dropdown too, opening silent.
- The settings sheet behind the gear is on the viewer's bar at every width,
  not only on a phone, and holds the mode, narration and the voice. The bar's
  sound button and the sheet's narration row are one setting.
- The player never draws Podium at phone width, even when a host asks for it.
- The launch page and the documentation describe the three modes — Sofa,
  Audiobook and Podium — and the launch page shows Audiobook on a phone.

### Deprecated

- `DeckPlayer`'s `suitcase` prop, the old name for `audiobook`. A host that
  still passes it gets Audiobook mode. Suitcase Mode is now Audiobook mode
  everywhere it is named; a visitor's stored choice carries over.

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

[Unreleased]: https://github.com/johnfrog76/connected-deck/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/johnfrog76/connected-deck/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/johnfrog76/connected-deck/releases/tag/v0.1.0
