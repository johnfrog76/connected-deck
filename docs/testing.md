# Tests

This page covers the test suite: how to run it, what it deliberately pins, and
why.

```bash
npm test
```

Deliberately narrow: the suite pins the rules that are invisible when broken —
mode ownership (each mode gets its own bar, audience never grows a notes
surface, a host that offers the viewer's mode alone never shows Podium, and a
phone never does), which narration source each host reads from, the
voice-coverage rules, and the player's neutral default theme. Those are the invariants a
refactor regresses silently, so they're the ones worth a headless assertion.

Audiobook mode gets its own cases, spread across the player's test blocks,
because every bug this feature has had lived in a state nobody thinks to open
by hand:

- a deck with **nothing baked and no synthesizer** — the play ring once
  rendered anyway, dead, which left a reader with nothing to press;
- the window **widened into Podium mid-slide and back** — auto-advance un-arms
  in Podium, so the `ended` event that should have moved the deck fired into
  nothing and the deck sat on a finished slide forever;
- **Podium with Audiobook chosen**, where slides must *not* advance;
- the **last slide**, which should stop rather than run off the end, and a
  deck **opened mid-way**, which should play on from there;
- the sheet flipped to **Silent mid-viewing** — the bar gated on the stored
  flag only, so the ring outlived the narration it advances on;
- **pause pressed on the ring** — which must hold playback *without* turning
  narration off, or the session gate hands the bar back to the counter and the
  button deletes itself under the thumb that pressed it.

The viewer's bar's three-column rule is held through `viewerBarLayout.ts`'s own
arithmetic at 390, 430 and 1440 wide, for both forms of the transport, because
jsdom cannot lay out a grid; one case widens a group past its half to prove the
check fails when it should.

The viewport is stubbed (jsdom has no `matchMedia`), and `setViewport` fires
the registered listeners so a test can resize a mounted tree the way a real
window does. Every one of those cases was a real bug found by writing the test,
not by reading the code.

The behaviour these cases pin is described in [Watching a deck](player.md).
