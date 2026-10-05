# Tests

This page covers the test suite: how to run it, what it deliberately pins, and
why.

```bash
npm test
```

Deliberately narrow: the suite pins the rules that are invisible when broken —
mode ownership (presenter never grows voice controls, audience never grows a
notes surface), which narration source each host reads from, the voice-coverage
rules, and the player's neutral default theme. Those are the invariants a
refactor regresses silently, so they're the ones worth a headless assertion.

Suitcase Mode gets its own block, because every bug this feature has had lived
in a state nobody thinks to open by hand:

- a deck with **nothing baked and no synthesizer** — the transport button once
  rendered anyway, dead, having replaced the paging arrows, which left a reader
  with no way through the deck at all;
- the window **resized wide mid-slide and back** — auto-advance un-arms above
  the breakpoint, so the `ended` event that should have moved the deck fired
  into nothing and the deck sat on a finished slide forever;
- **desktop width with the preference on**, where slides must *not* advance;
- the **last slide**, which should stop rather than run off the end;
- the sheet flipped to **Silent mid-viewing** — the chrome gated on the stored
  flag only, so the transport outlived the narration it advances on and the
  paging arrows never came back;
- **pause pressed on the transport** — which must hold playback *without*
  flipping the narration mode, or the session gate hands the bar back to the
  arrows and the button deletes itself under the thumb that pressed it.

The viewport is stubbed (jsdom has no `matchMedia`), and `setViewport` fires
the registered listeners so a test can resize a mounted tree the way a real
window does. Every one of those cases was a real bug found by writing the test,
not by reading the code.

The behaviour these cases pin is described in [Watching a deck](player.md).
