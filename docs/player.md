# Watching a deck

This page covers the player: the two ways to watch (Sofa and Podium), Suitcase
Mode, the phone layout, and the hooks and seams behind them.

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

Both chromes and `SlideRenderer` read no context themselves — everything they
show arrives as props — so you can import `DeckChromeMobile` directly and decide
the breakpoint yourself. One exception travels with it: the mobile chrome's
settings sheet renders the shared `SettingsForm`, which reads the presenter-mode,
voice-preference and viewport contexts. Mount it inside those providers, as
`App.tsx` does, or the sheet's stored-preference rows fall back to the
contexts' defaults.

For where narration comes from, see [Narration](narration.md); for what the
tests pin about all of the above, see [Tests](testing.md).
