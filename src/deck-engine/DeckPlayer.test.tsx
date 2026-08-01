import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { webDarkTheme } from "@fluentui/react-components";
import { DeckPlayer } from "./DeckPlayer";
import { darkTheme } from "../theme";
import { SLIDE_DWELL_SECONDS } from "./deckDuration";
import { ViewportProvider } from "../viewport";
import { PresenterModeProvider } from "../presenterMode";
import { VoicePreferenceProvider } from "../voicePreference";
import {
  DEFAULT_VOICE_ID,
  NARRATION_VOICES,
  NO_NARRATION_TITLE,
  VOICE_PICKER_TITLE,
} from "./narrationConstants";
import type { Slide } from "../decks/types";

// The mode contract, pinned at the component seam. DeckPlayer is the one
// player every surface mounts; what a window IS comes from `mode`, never from
// which props happen to be wired:
//
//   presenter — the podium. The notes surface is available; in-player
//     Voice/mute NEVER renders, even when a host wires voices, because the
//     presenter's own voice is the point and a synthesized one would compete.
//   audience — the sofa. Voice controls render; no notes surface exists AT ALL
//     (absent, not hidden — nothing to escalate to on a link someone shared
//     with you).
//
// These tests are what keeps the two from bleeding into each other as the app
// grows a settings switch, a new route, or a second host. The theme test pins
// the third fact: the player's chrome defaults to plain webDarkTheme, so an
// app's own brand never follows a deck in.

// jsdom has no BroadcastChannel (useDeckController's cross-window sync); a
// silent stub is enough — cross-window behavior is Playwright's job.
// Messages recorded so a test can assert what the parent told the notes
// popout — losing presenter mode has to reach the other window, and a silent
// stub would let that regress unnoticed.
const broadcasts: { channel: string; message: unknown }[] = [];
class BroadcastChannelStub {
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor(public name: string) {}
  postMessage(message: unknown) {
    broadcasts.push({ channel: this.name, message });
  }
  close() {}
}

// jsdom's HTMLMediaElement can't play. The stub mirrors the real element's
// shape closely enough for the hook's state machine: constructed ONCE with no
// src (useSlideNarration reuses one element and retargets .src per slide, to
// keep iOS's gesture blessing), then driven by assigning .src and calling
// play(). `instances` lets a test reach the live element and fire "ended".
const audioInstances: AudioStub[] = [];
class AudioStub {
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  // Modelled because suspend/resume depends on them. `src` is a real setter:
  // assigning a new source RESETS currentTime and clears `ended`, exactly as
  // the DOM does. A plain field here would leave a stale currentTime behind
  // and hide the bug where switching voice mid-suspend leaves the deck paused
  // on a clip that never started.
  #src = "";
  get src() {
    return this.#src;
  }
  set src(next: string) {
    if (next === this.#src) return;
    this.#src = next;
    this.currentTime = 0;
    this.ended = false;
  }
  paused = true;
  currentTime = 0;
  ended = false;
  constructor() {
    audioInstances.push(this);
  }
  play() {
    this.paused = false;
    this.onplay?.();
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.onpause?.();
  }
}

// jsdom has no matchMedia at all, which is why viewport.tsx defaults to the
// desktop tier in tests. `setViewport("compact")` installs a stub so the mobile
// chrome can actually be exercised — without it every test here would silently
// assert against DeckChromeDesktop and the mobile file would ship untested.
//
// viewport.tsx asks two min-width questions (sm=576, md=768) and calls anything
// below both "base" — the phone. So the compact stub answers false to both.
let viewportIsCompact = false;
// Listeners registered against matchMedia, so a test can RESIZE mid-mount
// rather than only choosing a width before it. The real matchMedia fires these
// on a window resize or a device rotation; the stub fires them from
// setViewport.
//
// Keyed by the query they subscribed to, and handed a real event-shaped object
// when fired: ViewportProvider ignores the argument and re-reads the tier, but
// Fluent's own useIsReducedMotion listener reads `event.matches` and throws on
// a bare call. Anything in the tree may subscribe, so the stub has to behave
// like matchMedia for all of them, not just for the code under test.
type Listener = (event: { matches: boolean; media: string }) => void;
const viewportListeners = new Map<Listener, string>();

/** What a given media query evaluates to at the current stubbed width. */
function queryMatches(query: string): boolean {
  // viewport.tsx asks two min-width questions (sm=576, md=768) and calls
  // anything below both "base" — the phone. So compact answers false to both.
  if (query.includes("min-width")) return !viewportIsCompact;
  // Everything else (prefers-reduced-motion, prefers-color-scheme, …) is a
  // question about the environment rather than the width — default false.
  return false;
}

// Installed ONCE, and reads the live `viewportIsCompact` on every call — so a
// mid-test resize doesn't swap the function out from under a listener that is
// already running.
// Installed ONCE, and reads the live `viewportIsCompact` on every call — so a
// mid-test resize doesn't swap the function out from under a listener that is
// already running.
function installMatchMedia() {
  (globalThis as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    matches: queryMatches(query),
    media: query,
    addEventListener: (_: string, fn: Listener) => {
      viewportListeners.set(fn, query);
    },
    removeEventListener: (_: string, fn: Listener) => {
      viewportListeners.delete(fn);
    },
  });
}

function setViewport(kind: "compact" | "desktop") {
  viewportIsCompact = kind === "compact";
  installMatchMedia();
  // Let anything already mounted observe the change, the way a real resize
  // does. Copied before iterating: a listener that re-subscribes mid-loop
  // would otherwise mutate the map being walked.
  act(() => {
    [...viewportListeners].forEach(([fn, query]) => {
      fn({ matches: queryMatches(query), media: query });
    });
  });
}

beforeAll(() => {
  (globalThis as unknown as { BroadcastChannel: unknown }).BroadcastChannel =
    BroadcastChannelStub;
  (globalThis as unknown as { Audio: unknown }).Audio = AudioStub;
});

beforeEach(() => {
  audioInstances.length = 0;
  broadcasts.length = 0;
  viewportListeners.clear();
  setViewport("desktop");
});

const slides: Slide[] = [
  { id: "s1", copy: null },
  { id: "s2", copy: null },
];

/** Every slide baked in every voice — narration is fully wired and covered. */
const allBaked = (slide: Slide, voiceId: string) =>
  `/voices/fake-deck/${slide.id}-${voiceId}.mp3`;

/** Mount the shared player exactly as a host would, with narration wired. */
function mountPlayer(
  mode: "presenter" | "audience",
  extra?: { narrateByDefault?: boolean; suitcase?: boolean },
) {
  return render(
    <MemoryRouter>
      <ViewportProvider>
      <PresenterModeProvider>
      <VoicePreferenceProvider>
      <DeckPlayer
        deckId="fake-deck"
        slides={slides}
        mode={mode}
        voices={NARRATION_VOICES}
        hasApi={false}
        resolveNarrationUrl={allBaked}
        narrateByDefault={extra?.narrateByDefault}
        suitcase={extra?.suitcase}
      />
      </VoicePreferenceProvider>
      </PresenterModeProvider>
      </ViewportProvider>
    </MemoryRouter>,
  );
}

describe("DeckPlayer — mode owns the host differences", () => {
  it("audience: voice controls render, the notes surface does not exist", () => {
    mountPlayer("audience");

    expect(screen.getByTitle("Play with narration")).toBeTruthy();
    expect(screen.getByTitle(VOICE_PICKER_TITLE)).toBeTruthy();
    // Absent, not disabled — an audience window has nothing to escalate to.
    expect(screen.queryByTitle("Open speaker notes")).toBeNull();
  });

  it("presenter: the notes surface renders, voice controls never do — even fully wired", () => {
    // SAME narration wiring as the audience mount above. Locking a host into
    // presenter mode must drop the in-player voice group entirely, not merely
    // disable it: mode owns this, not the presence of the props.
    mountPlayer("presenter");

    expect(screen.getByTitle("Open speaker notes")).toBeTruthy();
    expect(screen.queryByTitle("Play with narration")).toBeNull();
    expect(screen.queryByTitle(VOICE_PICKER_TITLE)).toBeNull();
    // Not even the disabled/empty variant of the group:
    expect(screen.queryByTitle(NO_NARRATION_TITLE)).toBeNull();
  });
});

describe("DeckPlayer — Suitcase Mode advances on narration end", () => {
  // Which slide the deck is on. Suitcase Mode REPLACES the counter with its
  // one-button transport (that's the point of the mode), so there is no
  // "1 / 2" to read — the live element's src is the honest signal, since the
  // player retargets it per slide from the resolved narration URL.
  const currentSlideId = () => {
    const src = audioInstances[audioInstances.length - 1]?.src ?? "";
    return src.match(/\/(s\d+)-/)?.[1] ?? "";
  };

  /** Fire the live element's "ended", then run out the post-clip dwell. */
  function endCurrentClip() {
    const audio = audioInstances[audioInstances.length - 1];
    act(() => {
      audio.onended?.();
    });
    act(() => {
      jest.advanceTimersByTime(SLIDE_DWELL_SECONDS * 1000);
    });
  }

  // Suitcase Mode is mobile-only, so these all run on a phone-width viewport.
  // Asserting auto-advance from a desktop mount would have been asserting
  // behavior the feature is not supposed to have — see the desktop test below.
  beforeEach(() => {
    jest.useFakeTimers();
    setViewport("compact");
  });
  afterEach(() => jest.useRealTimers());

  it("advances to the next slide a dwell after the clip ends", () => {
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });
    expect(currentSlideId()).toBe("s1");

    endCurrentClip();

    expect(currentSlideId()).toBe("s2");
  });

  it("waits out the dwell — it does not advance the instant audio stops", () => {
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });

    act(() => {
      audioInstances[audioInstances.length - 1].onended?.();
    });
    // Ended, but the dwell hasn't elapsed: still on slide one.
    expect(currentSlideId()).toBe("s1");

    act(() => {
      jest.advanceTimersByTime(SLIDE_DWELL_SECONDS * 1000);
    });
    expect(currentSlideId()).toBe("s2");
  });

  it("stops at the last slide rather than running off the end", () => {
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });

    endCurrentClip(); // 1 -> 2
    expect(currentSlideId()).toBe("s2");

    endCurrentClip(); // goNext clamps; no third slide to reach
    expect(currentSlideId()).toBe("s2");
  });

  it("desktop: Suitcase Mode does not auto-advance, even with the preference on", () => {
    // Suitcase Mode is a mobile affordance — the desktop chrome shows ordinary
    // paging arrows, so a deck advancing on its own here would be moving with
    // nothing on screen explaining why. Widening a window past the breakpoint
    // has to stop the advance, not merely re-skin the chrome around it.
    setViewport("desktop");
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });

    endCurrentClip();

    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("resized wide mid-slide and back: catches up instead of stranding", () => {
    // The sequence: Suitcase Mode on a phone, widen the window past the
    // breakpoint (which un-arms auto-advance), the clip finishes while wide,
    // then narrow back. The "ended" event that should have advanced the deck
    // fired into nothing and is long gone, so re-arming has to act on the
    // slide being SPENT — otherwise the deck sits on a finished slide showing
    // a Pause button, playing nothing, advancing never.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });
    expect(currentSlideId()).toBe("s1");

    // Widen. Suitcase goes inert; the clip then finishes unheard. No rerender
    // call — setViewport fires the matchMedia listeners, so the provider
    // re-renders exactly the way a real window resize makes it.
    setViewport("desktop");
    endCurrentClip();
    expect(currentSlideId()).toBe("s1");

    // Narrow back — the deck should pick up where it should have been.
    setViewport("compact");

    expect(currentSlideId()).toBe("s2");
  });

  it("off by default: a clip ending does not advance anything", () => {
    mountPlayer("audience", { narrateByDefault: true });

    endCurrentClip();

    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("reuses ONE audio element across slides (the iOS gesture blessing)", () => {
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });
    endCurrentClip();

    // Two slides played, one element — a fresh `new Audio()` per slide would
    // start each slide unblessed and get muted by the autoplay policy.
    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].src).toContain("s2");
  });
});

describe("DeckChrome — mobile and desktop are different components", () => {
  // The suspend tests below advance a dwell timer to force a slide change.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("desktop: inline notes/fullscreen, no settings gear", () => {
    mountPlayer("presenter");

    expect(screen.getByTitle("Open speaker notes")).toBeTruthy();
    // The gear belongs to the phone. A room watching a projector gets the
    // understated inline controls instead.
    expect(screen.queryByLabelText("Settings")).toBeNull();
  });

  it("compact: one gear, and the desktop controls are gone", () => {
    setViewport("compact");
    mountPlayer("audience");

    expect(screen.getByLabelText("Settings")).toBeTruthy();
    // Desktop's inline voice group does not exist here — it moved into the
    // sheet behind the gear, it isn't merely restyled.
    expect(screen.queryByTitle(VOICE_PICKER_TITLE)).toBeNull();
  });

  it("compact: the gear opens the SAME settings form the drawer renders", async () => {
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true });

    // Closed by default — the sheet is over a slide someone is reading.
    expect(screen.queryByRole("radiogroup")).toBeNull();

    fireEvent.click(screen.getByLabelText("Settings"));

    // The shared form's rows, by their shared labels. If the sheet ever grows
    // its own hand-written copy of these again, the wording drifts and this
    // fails — which is the whole point of asserting on it here.
    expect(await screen.findByRole("radiogroup", { name: VOICE_PICKER_TITLE })).toBeTruthy();
    expect(screen.getByRole("switch", { name: /Narrated|Silent/ })).toBeTruthy();
    expect(screen.getByRole("switch", { name: /Suitcase mode|Manual paging/ })).toBeTruthy();
    // Presenter is PRESENT but disabled in-deck. It can't be changed here —
    // the mode is fixed for the life of this mount — but someone who set
    // Podium and landed in Sofa (a window too narrow for it) needs the row to
    // say so. An absent control explains nothing.
    const presenterRow = screen.getByRole("switch", {
      name: /Podium|Sofa/,
    }) as HTMLInputElement;
    expect(presenterRow.disabled).toBe(true);
  });

  it("compact: the sheet says WHY the deck isn't at the podium", () => {
    // The confusing case, and it's a narrow DESKTOP window rather than a real
    // phone: you can't resize a phone across the breakpoint, and a phone
    // visitor never had a Podium expectation to be surprised out of. Someone
    // with Podium set opens a deck in a narrowed window, lands in Sofa, and
    // the sheet has to account for it.
    setViewport("compact");
    mountPlayer("audience");

    fireEvent.click(screen.getByLabelText("Settings"));

    expect(screen.getByText(/disabled for small screens/i)).toBeTruthy();
  });

  it("compact: opening the settings sheet holds playback, closing resumes", () => {
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true });
    const audio = audioInstances[audioInstances.length - 1];
    // Mid-clip, so resume has something to resume to.
    audio.currentTime = 3;
    expect(audio.paused).toBe(false);

    fireEvent.click(screen.getByLabelText("Settings"));
    // A voice reading over you while you're trying to read a switch is rude.
    expect(audio.paused).toBe(true);

    fireEvent.click(screen.getByLabelText("Close settings"));
    // Resumed, and from where it left off rather than restarting the sentence.
    expect(audio.paused).toBe(false);
    expect(audio.currentTime).toBe(3);
  });

  it("compact: stays held when the deck re-renders under an open sheet", () => {
    // The bug this pins: the main narration effect re-runs on slide/voice
    // changes AND whenever its `stop` callback is re-created, calling play()
    // each time. The suspend effect has already run by then and won't run
    // again, so a re-render while the sheet is open used to start the voice
    // talking underneath it. Suitcase Mode reaches this on its own — the deck
    // can auto-advance to a new slide while the sheet sits open.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });
    const audio = audioInstances[audioInstances.length - 1];
    audio.currentTime = 3;

    fireEvent.click(screen.getByLabelText("Settings"));
    expect(audio.paused).toBe(true);

    // A slide change under the open sheet — the most realistic re-render.
    act(() => {
      audio.onended?.();
    });
    act(() => {
      jest.advanceTimersByTime(SLIDE_DWELL_SECONDS * 1000);
    });

    expect(audio.paused).toBe(true);
  });

  it("compact: switching voice while held plays the new one on close", () => {
    // Changing voice mid-suspend swaps the element's src, so it sits at
    // currentTime 0 with the guard blocking play(). A resume that only handled
    // "mid-clip" left the deck silently paused on a clip that never started —
    // no voice, no indication why.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true });
    const audio = audioInstances[audioInstances.length - 1];
    audio.currentTime = 3;

    fireEvent.click(screen.getByLabelText("Settings"));
    expect(audio.paused).toBe(true);

    // Pick the voice that isn't currently selected.
    const other = NARRATION_VOICES.find((v) => !audio.src.includes(v.id))!;
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(other.name) }));
    expect(audio.src).toContain(other.id);

    fireEvent.click(screen.getByLabelText("Close settings"));

    expect(audio.paused).toBe(false);
  });

  it("compact: holding playback does not turn narration OFF", () => {
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true });

    fireEvent.click(screen.getByLabelText("Settings"));

    // The switch must still read "Narrated" — suspending is not toggling, and
    // a control that flipped itself as the sheet opened would be lying about
    // the state it reports.
    const narration = screen.getByRole("switch", {
      name: /Narrated|Silent/,
    }) as HTMLInputElement;
    expect(narration.checked).toBe(true);
  });

  it("compact: paging controls until Suitcase Mode replaces them", () => {
    setViewport("compact");
    const { unmount } = mountPlayer("audience", { narrateByDefault: true });

    expect(screen.getByLabelText("Next slide")).toBeTruthy();
    expect(screen.queryByLabelText(/^(Play|Pause)$/)).toBeNull();
    unmount();

    // Same viewport, Suitcase on: the paging group gives way to one transport
    // button — the whole point of a mode you operate without looking.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, suitcase: true });

    expect(screen.queryByLabelText("Next slide")).toBeNull();
    expect(screen.getByLabelText(/^(Play|Pause)$/)).toBeTruthy();
  });
});

describe("DeckPlayer — nothing baked, no API: every surface says so", () => {
  /** No clip for any slide in any voice, and no live synthesizer to fall back
   *  on. The state a deck is in before anyone has run the bake. */
  const nothingBaked = () => null;

  function mountUnbaked(extra?: { narrateByDefault?: boolean; suitcase?: boolean }) {
    return render(
      <MemoryRouter>
        <ViewportProvider>
          <PresenterModeProvider>
            <VoicePreferenceProvider>
              <DeckPlayer
                deckId="fake-deck"
                slides={slides}
                mode="audience"
                voices={NARRATION_VOICES}
                hasApi={false}
                resolveNarrationUrl={nothingBaked}
                narrateByDefault={extra?.narrateByDefault}
                suitcase={extra?.suitcase}
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>,
    );
  }

  it("desktop: controls render but are DEAD — present-but-disabled, not absent", () => {
    mountUnbaked();

    // Absent would claim "this player can't narrate", which is a different and
    // false thing. Present-but-disabled says "this deck wasn't baked".
    //
    // BOTH the toggle and the voice picker carry this title — that's the rule
    // (no covered voice ⇒ the whole group is dead, picker included), so
    // asserting on all of them is the assertion worth making.
    const dead = screen.getAllByTitle(NO_NARRATION_TITLE);
    expect(dead.length).toBeGreaterThanOrEqual(2);
    dead.forEach((el) => {
      const control = el.tagName === "BUTTON" ? el : el.querySelector("button") ?? el;
      expect(control.hasAttribute("disabled")).toBe(true);
    });
  });

  it("never auto-plays, even with narrate-by-default and Suitcase both on", () => {
    mountUnbaked({ narrateByDefault: true, suitcase: true });

    // The preference says "read to me"; there is nothing to read. No <audio>
    // should have been constructed at all — a silent element that fires no
    // "ended" is how a Suitcase deck would sit forever on slide one.
    expect(audioInstances).toHaveLength(0);
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("compact: the sheet's rows are disabled and say why", async () => {
    setViewport("compact");
    mountUnbaked({ narrateByDefault: true, suitcase: true });

    fireEvent.click(screen.getByLabelText("Settings"));

    // Both switches dead, and the voice group with them — there is no valid
    // choice left to make inside it.
    const narration = await screen.findByRole("switch", { name: /Narrated|Silent/ });
    expect(narration.hasAttribute("disabled")).toBe(true);
    const suitcase = screen.getByRole("switch", { name: /Suitcase mode|Manual paging/ });
    expect(suitcase.hasAttribute("disabled")).toBe(true);
    // Each dead row states its OWN reason rather than leaving a bare grey
    // control: the narration row explains there's nothing to read, and the
    // Suitcase row explains it has no clip-end to advance on.
    expect(screen.getByText(/no baked audio — nothing to read aloud/i)).toBeTruthy();
    expect(screen.getByText(/no baked audio to advance on/i)).toBeTruthy();
  });

  it("compact: no transport bar to strand the reader on", () => {
    setViewport("compact");
    mountUnbaked({ narrateByDefault: true, suitcase: true });

    // Suitcase asked for the one-button transport, but with nothing to play it
    // would be a dead button where the paging arrows used to be — leaving no
    // way to move through the deck at all.
    expect(screen.queryByLabelText(/^(Play|Pause)$/)).toBeNull();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
  });
});

describe("DeckPlayer — a stored voice meets a deck that can't honor it", () => {
  // Derived from the roster's own contract, not from positions in it.
  // DEFAULT_VOICE_ID is a stated fact; "some other voice" is the only other
  // thing these tests actually need. Indexing [0]/[1] would keep passing while
  // testing the opposite case if anyone reordered the roster, and would test
  // the wrong pair entirely if a third voice were added at the front.
  const DEFAULT = DEFAULT_VOICE_ID;
  const OTHER = NARRATION_VOICES.find((v) => v.id !== DEFAULT)?.id;

  // A roster of one would make "fall back to a different voice" untestable —
  // say so out loud rather than silently passing a vacuous assertion.
  if (!OTHER) throw new Error("These tests need at least two voices in NARRATION_VOICES");

  /** Only this voice is baked; the other resolves to nothing. */
  const onlyVoice = (only: string) => (slide: Slide, voiceId: string) =>
    voiceId === only ? `/voices/fake-deck/${slide.id}-${voiceId}.mp3` : null;

  function mountWith(opts: {
    preferredVoiceId?: string;
    resolveNarrationUrl?: (slide: Slide, voiceId: string) => string | null;
    hasApi?: boolean;
  }) {
    return render(
      <MemoryRouter>
        <ViewportProvider>
          <PresenterModeProvider>
            <VoicePreferenceProvider>
              <DeckPlayer
                deckId="fake-deck"
                slides={slides}
                mode="audience"
                voices={NARRATION_VOICES}
                hasApi={opts.hasApi ?? false}
                resolveNarrationUrl={opts.resolveNarrationUrl ?? allBaked}
                preferredVoiceId={opts.preferredVoiceId}
                narrateByDefault
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>,
    );
  }

  // Which voice the live element is actually playing. Matched against the
  // roster rather than by parsing an id shape out of the URL — the ids are a
  // published contract (they appear in baked filenames), but their FORMAT
  // isn't something these tests should encode.
  const playingVoice = () => {
    const src = audioInstances[audioInstances.length - 1]?.src ?? "";
    return NARRATION_VOICES.find((v) => src.includes(v.id))?.id ?? "";
  };

  it("stored voice isn't baked here: falls back to one that is", () => {
    // A voice remembered from another deck; this deck doesn't have it baked.
    // Falling back beats honoring the preference into silence.
    mountWith({ preferredVoiceId: OTHER, resolveNarrationUrl: onlyVoice(DEFAULT) });

    expect(playingVoice()).toBe(DEFAULT);
  });

  it("stored voice IS baked here: honored over the roster default", () => {
    // The inverse, and the one that proves the preference is read at all: only
    // the NON-default voice is baked, so opening on it can't be a coincidence.
    mountWith({ preferredVoiceId: OTHER, resolveNarrationUrl: onlyVoice(OTHER) });

    expect(playingVoice()).toBe(OTHER);
  });

  it("no voice baked at all: nothing plays, nothing is selected", () => {
    mountWith({ preferredVoiceId: OTHER, resolveNarrationUrl: () => null });

    // pickDefault returns "" rather than a voice known to play nothing, so no
    // clip is ever constructed.
    expect(audioInstances).toHaveLength(0);
    expect(screen.getAllByTitle(NO_NARRATION_TITLE).length).toBeGreaterThan(0);
  });

  it("hasApi: a stored voice is honored even with nothing baked", () => {
    // A live synthesizer can produce any voice on demand, so a missing mp3 is
    // a cache miss rather than a gap — coverage stops being the question.
    mountWith({
      preferredVoiceId: OTHER,
      resolveNarrationUrl: () => null,
      hasApi: true,
    });

    expect(screen.queryByTitle(NO_NARRATION_TITLE)).toBeNull();
  });
});

describe("DeckPlayer — losing presenter mode closes the notes popout", () => {
  function renderAt(mode: "presenter" | "audience") {
    return (
      <MemoryRouter>
        <ViewportProvider>
          <PresenterModeProvider>
            <VoicePreferenceProvider>
              <DeckPlayer
                deckId="fake-deck"
                slides={slides}
                mode={mode}
                voices={NARRATION_VOICES}
                hasApi={false}
                resolveNarrationUrl={allBaked}
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>
    );
  }

  // The controller also broadcasts slide-change for normal cross-window sync;
  // these tests care only about the close.
  const closes = () =>
    broadcasts.filter(
      (b) => (b.message as { type?: string })?.type === "deck-closed",
    );

  it("presenter → audience broadcasts deck-closed", () => {
    // The host flips presenter off mid-session — PresentationDeck does exactly
    // this when the viewport crosses into mobile. The popout is a separate
    // window with its own React tree and can't observe that on its own, so it
    // would keep following slide changes while the parent showed audience
    // chrome: two windows disagreeing about what the session is.
    const { rerender } = render(renderAt("presenter"));
    expect(closes()).toHaveLength(0);

    rerender(renderAt("audience"));

    expect(closes()).toEqual([
      { channel: "connected-deck-fake-deck", message: { type: "deck-closed" } },
    ]);
  });

  it("mounting straight into audience says nothing", () => {
    // No popout can exist yet, so a broadcast here would close a notes window
    // belonging to some OTHER deck the visitor left open.
    render(renderAt("audience"));

    expect(closes()).toHaveLength(0);
  });

  it("staying in presenter says nothing", () => {
    const { rerender } = render(renderAt("presenter"));
    rerender(renderAt("presenter"));

    expect(closes()).toHaveLength(0);
  });
});

describe("DeckPlayer — the shared player's chrome is host-neutral", () => {
  // FluentProvider writes its theme as CSS custom properties into injected
  // stylesheets; jsdom exposes them via document.styleSheets/style tags.
  function injectedCss(): string {
    const fromSheets = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .map((rule) => rule.cssText)
      .join("\n");
    const fromTags = Array.from(document.querySelectorAll("style"))
      .map((el) => el.textContent ?? "")
      .join("\n");
    return fromSheets + fromTags;
  }

  it("defaults to plain webDarkTheme, not the app's branded theme", () => {
    mountPlayer("presenter");

    const css = injectedCss();
    // The neutral default is actually applied...
    expect(css).toContain(webDarkTheme.colorBrandBackground);
    // ...and this app's indigo brand did not follow the deck in.
    expect(css).not.toContain(darkTheme.colorBrandBackground);
  });
});
