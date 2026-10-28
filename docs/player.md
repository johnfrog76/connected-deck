# Watching a deck

This page covers the player: the three modes (Sofa, Audiobook and Podium), the
two bars that go with them, the settings sheet, the options a host passes when
it mounts the player, the phone layout, and the hooks and seams behind them.

## Three modes — Sofa, Audiobook and Podium

The cards on the launch page decide how a deck opens, and they're the first
thing you see because they're the thing worth understanding:

| Mode | What it is for | The bar |
| --- | --- | --- |
| **Sofa** | Watching. You page through it yourself; the voice reads each slide if narration is on. | The viewer's bar, the counter between previous and next |
| **Audiobook** | Listening. The deck reads itself aloud and turns its own slides, phone in a pocket. | The viewer's bar, the play ring between previous and next |
| **Podium** | Presenting. Notes, a timer and the next slide in a second window. | The presenter's bar, never on a phone |

- **Sofa** (`mode="audience"`) — the plain player. The sound and the settings
  live in the player and narrate from committed audio. There is no
  speaker-notes surface at all — not hidden, *absent*. Nothing to escalate to
  on a link someone sent you.
- **Audiobook** (`mode="audience"` with `audiobook`) — Sofa's player, reading
  itself. See [Audiobook mode](#audiobook-mode--a-deck-that-plays-itself).
- **Podium** (`mode="presenter"`) — give me my notes. The notes button appears
  and opens a second window with your notes, a timer, and a live preview of the
  next slide. The deck opens silent, because someone reading from their own
  notes doesn't usually want a synthesized voice competing with them; the
  sound and the voice are on the bar for when they do.

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

## Two bars, each for its job

The bar follows the mode, not the width. There are two, and never a third:

- **The viewer's bar** — Sofa and Audiobook, at every width.
  `Exit | the transport | settings, fullscreen, the sound`. The transport is
  previous, the counter and next in Sofa, and previous, the play ring and next
  in Audiobook mode, so a slide can be skipped without leaving the mode. The
  bar is three columns, `1fr auto 1fr`, so the transport's centre is the
  screen's centre at every width rather than the centre of whatever space two
  groups of different widths leave. `viewerBarLayout.ts` holds that rule and
  the sizes that keep a phone's groups inside their halves.
- **The presenter's bar** — Podium only. Exit, previous, the counter, next,
  the sound, the voice as a dropdown, the notes and fullscreen, all inline,
  because presenting is the one time every control is wanted at hand. It is
  understated all the same: it's projected on a wall, so every pixel it takes
  is one the room isn't spending on the slide.

**The settings sheet** sits behind the viewer's bar's gear, at every width. It
holds the mode (Sofa or Audiobook), narration on or off, and the voice. The
bar's sound button and the sheet's narration row are **one setting** — both
read and flip the same state, so a change in either shows in the other. Podium
isn't in the sheet: the mode a deck opens in is chosen before it opens.

## Audiobook mode — a deck that plays itself

Choose **Audiobook** on the launch page, or in the settings sheet mid-deck, and
the deck reads itself aloud and advances when a slide's narration ends: an
audiobook rather than a slideshow. Headphones on, phone in a pocket, no
fumbling to page a 60-slide deck on a bus. The play ring pauses and resumes;
previous and next either side of it skip a slide, and the narration follows;
swiping on a phone does the same. Choosing Sofa in the sheet hands the bar
back to the counter.

It waits `SLIDE_DWELL_SECONDS` (5) after each clip before moving — the same
constant `deckDuration.ts` already uses to estimate a deck's runtime, so a deck
that plays itself takes as long as the badge on the launch page promised. At
the last slide it simply stops: `goNext` clamps, so there's no separate
end-of-deck state to build or get wrong.

**Audiobook mode requires narration, in both directions.** Choosing it turns
narration on; turning narration off turns it off. It advances when a clip
*ends*, so without narration there is no such event and the mode cannot mean
anything. An earlier version made this one-directional and let a stale flag
start narration on its own — turn the voice off, open a deck, and it read
itself aloud anyway. Never let a dependent setting override the setting it
depends on.

That rule holds at **both layers**, because narration goes quiet at two
different depths. The stored preferences couple in `voicePreference.tsx`
(Settings' narration off clears the Audiobook choice). But the in-deck sound
button and the sheet's Narrated row are deliberately *session* state — muting
the deck you're watching shouldn't rewrite what every future deck does — so
the player gates the bar on the live value too: a viewing declared Silent
hands the ring back to the counter. An earlier version gated only on the
stored flag, and going Silent left a play button over a deck that would never
move.

Which is also why **pause is not Silent**. The ring holds playback with
narration still on (`paused` in `useSlideNarration`), it doesn't flip
narration off — if it did, the session gate above would swap the ring for the
counter under the thumb that pressed it. Three distinct quiets, three owners:
`paused` belongs to the listener, `suspended` (sheet open) to the player, and
`enabled` — the one that changes what the bar *is* — to the sound button and
the sheet.

**It runs at every width, and never in Podium.** The viewer's bar draws the
ring on a laptop as on a phone, so a deck moving on its own always has
something on screen saying why. A presenter turns their own slides, so a
window widened from a phone into Podium stops the advance; narrowed back, it
resumes — including catching up if the clip finished while it was wide. The
*choice* survives either way.

A deck that is not in Audiobook mode behaves as it always has: no autoplay
unless narration is on, and the voices still there to play a slide by hand.

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
  `audiobook` arrive as props like `mode` does, and `DeckPlayer` decides what
  they *do* — so every host gets the Podium and phone gating without knowing
  about it. See [The host's options](#the-hosts-options).
- **Two seams for progress, and the engine never persists.**
  `onAfterSlideNavCallback(slideIndex, totalSlides)` fires on arrival at a deck
  and after every move within it, in both modes. That is the whole seam for
  building a watch-history page, a "continue where you left off", or an
  analytics ping — without the engine ever learning the words *watched*,
  *history* or *liked*, and without it touching storage. "After" is in the
  name because it is not interceptable: the navigation already happened.

  Two things it does that are worth stealing, both invisible when broken. It
  reads the callback through a ref rather than listing it as an effect
  dependency, so a host can pass a fresh inline arrow every render — with the
  callback in the deps, a host whose handler writes state has an infinite
  render loop, not a stray extra call. And it guards on `deckId`: a route at
  `/deck/:deckId` does not remount when only the param changes, so the commit
  right after a deck-to-deck navigation still carries the OUTGOING deck's
  slide index beside the incoming deck's slide count. Report that pair and a
  host recording a high-water mark marks the new deck finished, permanently.
  The guard fires `(0, totalSlides)` for the arrival instead — firing rather
  than skipping, because if you left the previous deck on slide 0 the index
  reset changes nothing, React bails out of the re-render, and a
  skip-and-wait guard would never report the new deck at all.

  The other half is `initialSlideIndex`, which says which slide to **open**
  on. Together they are a complete resume feature that the engine knows
  nothing about: the host records where you stopped, hands it back next time,
  and the deck opens there.

  The subtlety worth stealing: `initialSlideIndex` is read **once per deck**,
  through a ref, not honoured continuously. A host computes it from its own
  stored progress, so recording a slide change hands back a new value on the
  very next render — honoured live, every step forward would snap the visitor
  back and the deck could not be paged at all. It is clamped to the deck too,
  so a number stored against a longer version of it cannot open past the end.

`useSlideNarration` reuses **one** `<audio>` element for every clip rather than
constructing one per slide. iOS Safari blesses an element for programmatic
playback once a user gesture has played it, and the blessing sticks to *that
element* — a fresh `new Audio()` per slide starts each one unblessed, so
narration dies after the first clip on a phone. That's the platform detail most
worth stealing from this file.

## The host's options

A host embeds the player by mounting `DeckPlayer`. The mode options, all props:

```tsx
<DeckPlayer
  deckId={deckId}
  slides={slides}
  mode="audience"                      // or "presenter": required, no default
  offeredModes={["audience"]}          // the modes this host offers; default both
  audiobook={audiobookOn}              // Audiobook mode, the host's stored choice
  onAudiobookChange={setAudiobookOn}   // the sheet's Sofa / Audiobook row
  narrateByDefault={narrateOn}
  voices={voices}
  resolveNarrationUrl={resolveUrl}
/>
```

- **`offeredModes`** — the modes this host offers. A host that only ever plays
  to a viewer passes `["audience"]`, and Podium is absent there on every
  screen: no presenter's bar, no notes button, whatever `mode` says. A host
  that presents passes both, which is the default. Podium is also never drawn
  at the phone width, whatever is offered; the player enforces that itself.
- **`audiobook`** — Audiobook mode for this viewing. It turns narration on with
  it and is ignored in Podium.
- **`onAudiobookChange`** — called with `true` or `false` when the viewer
  picks Audiobook or Sofa in the settings sheet. The host stores the choice and
  passes it back as `audiobook`. Leave it out and the sheet has no mode row:
  locking a player to one mode is just a fixed `audiobook` and
  `offeredModes={["audience"]}`.
- **`suitcase`** — deprecated, the old name for `audiobook`. It still plays as
  Audiobook when `audiobook` is not passed; pass `audiobook` instead.

## On a phone

A deck opens on a phone as a **stacked** slide — art in a band on top, copy
below as a scrolling read — and the viewer's bar sizes itself for a thumb.

The art doesn't reflow. It renders into the authored 768×720 panel and
transform-scales to fit the band, so **a deck written for a laptop works on a
phone with zero re-authoring** — compositions stay composed instead of
collapsing into a column. (One accepted tradeoff: `vw`-sized text inside art
resolves against the real viewport and lands smaller than `px` art at that
scale.)

The two bars are **separate components**, `DeckChromePresenter` and
`DeckChromeViewer`, not one file full of `presenter ? a : b`, because they do
different jobs:

|                | Presenter's bar (Podium)       | Viewer's bar (Sofa, Audiobook)    |
| -------------- | ------------------------------ | --------------------------------- |
| Who's looking  | a room, via a projector        | one person, maybe one thumb       |
| Controls       | small, subtle, all inline      | three columns, the transport centred |
| Voice picker   | a dropdown, collapsed          | radios in the settings sheet      |
| Extra chrome   | none — it should disappear     | a gear that names what's inside   |
| On a phone     | never drawn                    | 44px targets, safe-area insets, no fullscreen |

Inline is correct for someone running a talk and wrong for someone listening on
a bus; a gear is the reverse. One component with forks throughout serves
neither, and both are harder to lift out.

### Two hooks own two browser APIs

Nothing else in the app calls `matchMedia`, and nothing else calls
`localStorage` except the launch page's in-browser checks (`deckChecks.ts`),
which write a scratch key to test the read path. Components ask semantic
questions and never see the mechanism:

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

Both bars and `SlideRenderer` read no context themselves — everything they
show arrives as props — so you can import `DeckChromeViewer` directly if you
only ever play to a viewer. One exception travels with it: the viewer's
settings sheet renders the shared `SettingsForm`, which reads the presenter-mode,
voice-preference and viewport contexts. Mount it inside those providers, as
`App.tsx` does, or the sheet's stored-preference rows fall back to the
contexts' defaults.

For where narration comes from, see [Narration](narration.md); for what the
tests pin about all of the above, see [Tests](testing.md).
