import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { webDarkTheme } from "@fluentui/react-components";
import { DeckPlayer, type DeckMode } from "./DeckPlayer";
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
import {
  RING_SIZE,
  TOUCH_ARROW_WIDTH,
  TOUCH_TARGET,
  counterWidth,
  resolveViewerBar,
  viewerBarGap,
} from "./viewerBarLayout";

// The mode contract, pinned at the component seam. DeckPlayer is the one
// player every surface mounts; what a window IS comes from `mode` and the
// host's `offeredModes`, never from which props happen to be wired:
//
//   presenter — the podium, and the presenter's bar: Exit, previous, the
//     counter, next, the notes, fullscreen (never the sound or the voice). Only where the host offers it, never at the phone width,
//     and it opens silent.
//   audience — Sofa, or Audiobook mode, on the viewer's bar: Exit | the
//     transport | settings, fullscreen, the sound, at every width. No notes
//     surface exists AT ALL (absent, not hidden — nothing to escalate to on a
//     link someone shared with you).
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
// desktop tier in tests. `setViewport("compact")` installs a stub so the phone
// width can actually be exercised — without it every test here would silently
// assert against the wide layout and the phone's rules would ship untested.
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

// jsdom implements neither PointerEvent nor setPointerCapture. Both gaps fail
// silently in a way that mimics a working feature: with no constructor,
// fireEvent.pointerDown builds a plain Event whose isPrimary and clientX are
// undefined, every synthesized swipe is discarded, and each "must not page"
// assertion then passes for the wrong reason.
class PointerEventStub extends MouseEvent {
  pointerId: number;
  isPrimary: boolean;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
    this.isPrimary = init.isPrimary ?? true;
  }
}

beforeAll(() => {
  (globalThis as unknown as { BroadcastChannel: unknown }).BroadcastChannel =
    BroadcastChannelStub;
  (globalThis as unknown as { Audio: unknown }).Audio = AudioStub;
  if (!("PointerEvent" in globalThis)) {
    (globalThis as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventStub;
    (globalThis as unknown as { window: { PointerEvent: unknown } }).window.PointerEvent =
      PointerEventStub;
  }
  // A no-op is the honest stub: capture only affects where later events are
  // delivered, and these tests fire both ends at the same element.
  Element.prototype.setPointerCapture ??= function setPointerCapture() {};
  Element.prototype.releasePointerCapture ??= function releasePointerCapture() {};
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

interface MountExtra {
  narrateByDefault?: boolean;
  audiobook?: boolean;
  /** The deprecated name, mounted on its own to prove it still works. */
  suitcase?: boolean;
  offeredModes?: readonly DeckMode[];
  onAudiobookChange?: (next: boolean) => void;
}

/** Mount the shared player exactly as a host would, with narration wired. */
function mountPlayer(mode: DeckMode, extra?: MountExtra) {
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
        audiobook={extra?.audiobook}
        suitcase={extra?.suitcase}
        offeredModes={extra?.offeredModes}
        onAudiobookChange={extra?.onAudiobookChange}
      />
      </VoicePreferenceProvider>
      </PresenterModeProvider>
      </ViewportProvider>
    </MemoryRouter>,
  );
}

/**
 * A host that keeps the Sofa / Audiobook choice in its own state, the way
 * PresentationDeck keeps it in the stored preference: the sheet's mode row
 * calls back, and the player is handed the new choice.
 */
function HostWithModeChoice({ startInAudiobook = false }: { startInAudiobook?: boolean }) {
  const [audiobook, setAudiobook] = useState(startInAudiobook);
  return (
    <DeckPlayer
      deckId="fake-deck"
      slides={slides}
      mode="audience"
      voices={NARRATION_VOICES}
      hasApi={false}
      resolveNarrationUrl={allBaked}
      audiobook={audiobook}
      onAudiobookChange={setAudiobook}
    />
  );
}

function mountHostWithModeChoice(startInAudiobook = false) {
  return render(
    <MemoryRouter>
      <ViewportProvider>
        <PresenterModeProvider>
          <VoicePreferenceProvider>
            <HostWithModeChoice startInAudiobook={startInAudiobook} />
          </VoicePreferenceProvider>
        </PresenterModeProvider>
      </ViewportProvider>
    </MemoryRouter>,
  );
}

/** Which bar is drawn: "viewer" or "presenter". */
const barKind = () =>
  document.querySelector("[data-bar]")?.getAttribute("data-bar") ?? "";

/** The play ring's button, by its label: Pause while playing, Play while held. */
const ring = () => screen.queryByLabelText(/^(Play|Pause)$/);

describe("DeckPlayer — two bars, each for its job", () => {
  it("audience: the viewer's bar — sound and gear on the bar, no notes surface", () => {
    mountPlayer("audience");

    expect(barKind()).toBe("viewer");
    expect(screen.getByTitle("Play with narration")).toBeTruthy();
    expect(screen.getByLabelText("Settings")).toBeTruthy();
    // The voice moved into the sheet behind the gear; the bar carries the
    // transport and the sound, nothing more.
    expect(screen.queryByTitle(VOICE_PICKER_TITLE)).toBeNull();
    // Absent, not disabled — an audience window has nothing to escalate to.
    expect(screen.queryByTitle("Open speaker notes")).toBeNull();
  });

  it("presenter: the presenter's bar — paging and notes, never sound or the voice, no gear", () => {
    // Narration is fully wired and covered; the room's bar still carries
    // neither the sound toggle nor the voice picker. Those stay in the
    // speaker-notes window.
    mountPlayer("presenter");

    expect(barKind()).toBe("presenter");
    expect(screen.getByTitle("Open speaker notes")).toBeTruthy();
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.queryByLabelText("Settings")).toBeNull();
    expect(screen.queryByTitle("Play with narration")).toBeNull();
    expect(screen.queryByTitle("Stop narration")).toBeNull();
    expect(screen.queryByTitle(VOICE_PICKER_TITLE)).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("presenter: opens silent, even with narrate-by-default on", () => {
    // The presenter's own voice is usually the point; the sound button is
    // there for when it isn't.
    mountPlayer("presenter", { narrateByDefault: true });

    expect(audioInstances.every((a) => a.paused)).toBe(true);
  });

  it("a host offering the viewer's mode alone gets no Podium, whatever `mode` says", () => {
    mountPlayer("presenter", { offeredModes: ["audience"] });

    expect(barKind()).toBe("viewer");
    expect(screen.queryByTitle("Open speaker notes")).toBeNull();
  });

  it("the phone never gets Podium, even when the host asks for it", () => {
    setViewport("compact");
    mountPlayer("presenter");

    expect(barKind()).toBe("viewer");
    expect(screen.queryByTitle("Open speaker notes")).toBeNull();
  });

  it("the viewer's bar is three columns, the transport in the middle one", () => {
    mountPlayer("audience");

    const bar = document.querySelector<HTMLElement>('[data-bar="viewer"]')!;
    expect(bar.style.display).toBe("grid");
    expect(bar.style.gridTemplateColumns).toBe("1fr auto 1fr");
    const transport = bar.querySelector('[data-bar-column="transport"]')!;
    expect(transport.contains(screen.getByLabelText("Next slide"))).toBe(true);
    expect(transport.contains(screen.getByText("1 / 2"))).toBe(true);
  });
});

describe("viewerBarLayout — the transport sits on the screen's centre", () => {
  // jsdom cannot lay out a grid, so the rule is held through the grid's own
  // arithmetic over the bar's real sizes (viewerBarLayout.ts).
  const compactSides = {
    left: TOUCH_TARGET, // Exit
    right: TOUCH_TARGET * 2 + viewerBarGap(true), // gear + sound (no fullscreen)
  };
  const compactMiddle = {
    paging: TOUCH_ARROW_WIDTH * 2 + counterWidth(true) + viewerBarGap(true) * 2,
    ring: TOUCH_ARROW_WIDTH * 2 + RING_SIZE + viewerBarGap(true) * 2,
  };
  // Fluent's small buttons, and the ✕ Exit word.
  const wideSides = { left: 64, right: 32 * 3 + viewerBarGap(false) * 2 };
  const wideMiddle = {
    paging: 32 * 2 + counterWidth(false) + viewerBarGap(false) * 2,
    ring: 32 * 2 + RING_SIZE + viewerBarGap(false) * 2,
  };

  for (const width of [390, 430]) {
    for (const form of ["paging", "ring"] as const) {
      it(`phone ${width} wide, ${form}: centred within 2px`, () => {
        const { centre } = resolveViewerBar({
          width,
          compact: true,
          ...compactSides,
          middle: compactMiddle[form],
        });
        expect(Math.abs(centre - width / 2)).toBeLessThanOrEqual(2);
      });
    }
  }

  for (const form of ["paging", "ring"] as const) {
    it(`desktop 1440 wide, ${form}: centred within 2px`, () => {
      const { centre } = resolveViewerBar({
        width: 1440,
        compact: false,
        ...wideSides,
        middle: wideMiddle[form],
      });
      expect(Math.abs(centre - 720)).toBeLessThanOrEqual(2);
    });
  }

  it("the check has teeth: a right group wider than its half pushes the transport off", () => {
    const { centre } = resolveViewerBar({
      width: 390,
      compact: true,
      left: compactSides.left,
      right: 200,
      middle: compactMiddle.ring,
    });
    expect(Math.abs(centre - 195)).toBeGreaterThan(2);
  });
});

describe("DeckPlayer — Audiobook mode advances on narration end", () => {
  // Which slide the deck is on, read from the live element's src: the player
  // retargets it per slide from the resolved narration URL, and in Audiobook
  // mode the ring stands where the counter was.
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

  beforeEach(() => {
    jest.useFakeTimers();
    setViewport("compact");
  });
  afterEach(() => jest.useRealTimers());

  it("advances to the next slide a dwell after the clip ends", () => {
    mountPlayer("audience", { audiobook: true });
    expect(currentSlideId()).toBe("s1");

    endCurrentClip();

    expect(currentSlideId()).toBe("s2");
  });

  it("turns narration on with it — no narrate-by-default needed", () => {
    mountPlayer("audience", { audiobook: true });

    expect(audioInstances[0].paused).toBe(false);
    expect(ring()).toBeTruthy();
  });

  it("the deprecated `suitcase` prop still plays as Audiobook", () => {
    mountPlayer("audience", { suitcase: true });

    endCurrentClip();

    expect(currentSlideId()).toBe("s2");
    expect(ring()).toBeTruthy();
  });

  it("waits out the dwell — it does not advance the instant audio stops", () => {
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

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
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    endCurrentClip(); // 1 -> 2
    expect(currentSlideId()).toBe("s2");

    endCurrentClip(); // goNext clamps; no third slide to reach
    expect(currentSlideId()).toBe("s2");
  });

  it("plays through from any slide, not only the first", () => {
    render(
      <MemoryRouter>
        <ViewportProvider>
          <PresenterModeProvider>
            <VoicePreferenceProvider>
              <DeckPlayer
                deckId="fake-deck"
                slides={[...slides, { id: "s3", copy: null }]}
                mode="audience"
                voices={NARRATION_VOICES}
                resolveNarrationUrl={allBaked}
                audiobook
                initialSlideIndex={1}
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>,
    );
    expect(currentSlideId()).toBe("s2");

    endCurrentClip();

    expect(currentSlideId()).toBe("s3");
  });

  it("desktop: advances too, with the ring on the bar", () => {
    // The viewer's bar draws the ring at every width, so a deck moving on its
    // own always has something on screen saying why.
    setViewport("desktop");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    expect(ring()).toBeTruthy();
    endCurrentClip();

    expect(currentSlideId()).toBe("s2");
  });

  it("never in Podium: a presenter turns their own slides", () => {
    setViewport("desktop");
    mountPlayer("presenter", { narrateByDefault: true, audiobook: true });

    expect(ring()).toBeNull();
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("widened into Podium mid-slide and back: catches up instead of stranding", () => {
    // The sequence: Audiobook mode on a phone with a host that presents,
    // widen the window into Podium (which un-arms auto-advance), the clip
    // finishes while wide, then narrow back. The "ended" event that should
    // have advanced the deck fired into nothing and is long gone, so
    // re-arming has to act on the slide being SPENT — otherwise the deck sits
    // on a finished slide showing a Pause button, playing nothing, advancing
    // never.
    mountPlayer("presenter", { narrateByDefault: true, audiobook: true });
    expect(currentSlideId()).toBe("s1");

    // Widen. Podium takes over; the clip then finishes unheeded. No rerender
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
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    endCurrentClip();

    // Two slides played, one element — a fresh `new Audio()` per slide would
    // start each slide unblessed and get muted by the autoplay policy.
    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].src).toContain("s2");
  });

  it("previous and next skip a slide without leaving the mode", () => {
    mountPlayer("audience", { audiobook: true });

    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(currentSlideId()).toBe("s2");
    expect(ring()).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Previous slide"));
    expect(currentSlideId()).toBe("s1");
    expect(ring()).toBeTruthy();
  });
});

describe("DeckChrome — the viewer's bar and its settings sheet", () => {
  // The suspend tests below advance a dwell timer to force a slide change.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  for (const width of ["desktop", "compact"] as const) {
    it(`${width}: the gear opens the SAME settings form the drawer renders`, async () => {
      setViewport(width);
      mountPlayer("audience", { narrateByDefault: true, onAudiobookChange: () => {} });

      // Closed by default — the sheet is over a slide someone is reading.
      expect(screen.queryByRole("radiogroup")).toBeNull();

      fireEvent.click(screen.getByLabelText("Settings"));

      // The shared form's rows, by their shared labels. If the sheet ever
      // grows its own hand-written copy of these again, the wording drifts
      // and this fails — which is the whole point of asserting on it here.
      expect(await screen.findByRole("radiogroup", { name: VOICE_PICKER_TITLE })).toBeTruthy();
      expect(screen.getByRole("switch", { name: /Narrated|Silent/ })).toBeTruthy();
      expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /^Sofa/ })).toBeTruthy();
      expect(screen.getByRole("radio", { name: /^Audiobook/ })).toBeTruthy();
      // Podium is chosen before a deck opens, and has its own bar.
      expect(screen.queryByRole("radio", { name: /^Podium/ })).toBeNull();
    });
  }

  it("no mode row when the host fixes the mode itself", () => {
    mountPlayer("audience", { narrateByDefault: true });

    fireEvent.click(screen.getByLabelText("Settings"));

    expect(screen.queryByRole("radiogroup", { name: "Mode" })).toBeNull();
    expect(screen.getByRole("switch", { name: /Narrated|Silent/ })).toBeTruthy();
  });

  it("no word Suitcase anywhere on the bar or in the sheet", () => {
    mountPlayer("audience", { audiobook: true, onAudiobookChange: () => {} });
    fireEvent.click(screen.getByLabelText("Settings"));

    expect(document.body.textContent).not.toMatch(/suitcase/i);
  });

  it("Audiobook in the sheet turns the counter into the ring; Sofa turns it back", () => {
    mountHostWithModeChoice();
    expect(ring()).toBeNull();
    expect(screen.getByText("1 / 2")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Settings"));
    // Over a silent viewing: choosing Audiobook turns narration on with it,
    // since the mode advances on a clip's end.
    fireEvent.click(screen.getByRole("radio", { name: /^Audiobook/ }));
    expect(
      (screen.getByRole("switch", { name: /Narrated|Silent/ }) as HTMLInputElement).checked,
    ).toBe(true);
    fireEvent.click(screen.getByLabelText("Close settings"));

    expect(ring()).toBeTruthy();
    expect(screen.queryByText("1 / 2")).toBeNull();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Settings"));
    fireEvent.click(screen.getByRole("radio", { name: /^Sofa/ }));
    fireEvent.click(screen.getByLabelText("Close settings"));

    expect(ring()).toBeNull();
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("the bar's sound and the sheet's Narration are one setting, both ways", () => {
    mountPlayer("audience", { narrateByDefault: true });
    const narrated = () =>
      screen.getByRole("switch", { name: /Narrated|Silent/ }) as HTMLInputElement;

    // Sound off from the bar → the sheet reads Silent.
    fireEvent.click(screen.getByTitle("Stop narration"));
    fireEvent.click(screen.getByLabelText("Settings"));
    expect(narrated().checked).toBe(false);

    // Narration on from the sheet → the bar's sound reads on.
    fireEvent.click(narrated());
    fireEvent.click(screen.getByLabelText("Close settings"));
    expect(screen.getByTitle("Stop narration")).toBeTruthy();
  });

  it("opening the settings sheet holds playback, closing resumes", () => {
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

  it("stays held when the deck re-renders under an open sheet", () => {
    // The bug this pins: the main narration effect re-runs on slide/voice
    // changes AND whenever its `stop` callback is re-created, calling play()
    // each time. The suspend effect has already run by then and won't run
    // again, so a re-render while the sheet is open used to start the voice
    // talking underneath it. Audiobook mode reaches this on its own — the deck
    // can auto-advance to a new slide while the sheet sits open.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
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

  it("switching voice while held plays the new one on close", () => {
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

  it("holding playback does not turn narration OFF", () => {
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

  it("the counter until Audiobook mode puts the ring in its place", () => {
    setViewport("compact");
    const { unmount } = mountPlayer("audience", { narrateByDefault: true });

    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(ring()).toBeNull();
    unmount();

    // Same viewport, Audiobook on: previous and next stay, either side of the
    // ring — a slide can be skipped without leaving the mode.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    expect(screen.queryByText("1 / 2")).toBeNull();
    expect(ring()).toBeTruthy();
    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
  });

  it("declaring the viewing Silent hands back the counter", () => {
    // The bus repro this pins: Audiobook on, narrated deck, phone width. Flip
    // the sheet's Narrated switch to Silent and close. "Requires narration in
    // both directions" holds at the SESSION layer too — a silent viewing has
    // no clip-ends to advance on, so the ring must give way to the counter.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    expect(ring()).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Settings"));
    fireEvent.click(screen.getByRole("switch", { name: /Narrated|Silent/ }));
    fireEvent.click(screen.getByLabelText("Close settings"));

    expect(ring()).toBeNull();
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("the ring's pause is a hold — the ring stays, and the slide with it", () => {
    // Pause and Silent are different acts on the same silence. Pause holds
    // playback with narration still ON, so the bar keeps its ring (now
    // showing Play) — if pausing flipped narration off instead, the session
    // gate above would swap the ring for the counter under the thumb that
    // pressed it.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    const audio = audioInstances[audioInstances.length - 1];
    audio.currentTime = 3;
    expect(audio.paused).toBe(false);

    fireEvent.click(screen.getByLabelText("Pause"));
    expect(audio.paused).toBe(true);
    expect(screen.getByLabelText("Play")).toBeTruthy();
    expect(screen.queryByText("1 / 2")).toBeNull();

    // A clip end can't arrive while held, and time passing doesn't page.
    act(() => {
      jest.advanceTimersByTime(SLIDE_DWELL_SECONDS * 1000 * 3);
    });
    expect(audio.src).toContain("s1");

    fireEvent.click(screen.getByLabelText("Play"));
    // Resumed from where it was held, not restarted.
    expect(audio.paused).toBe(false);
    expect(audio.currentTime).toBe(3);
  });

  it("a paused ring does not survive Silent → Narrated", () => {
    // Flipping Narrated back on is a request to HEAR the deck. A pause pressed
    // during some earlier narrated stretch must not outlive the mode change —
    // honoring it would leave the deck silently stopped behind a switch
    // claiming it reads aloud, with a Play button as the only clue.
    setViewport("compact");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    const audio = audioInstances[audioInstances.length - 1];

    fireEvent.click(screen.getByLabelText("Pause"));
    expect(audio.paused).toBe(true);

    fireEvent.click(screen.getByLabelText("Settings"));
    const narrated = () =>
      screen.getByRole("switch", { name: /Narrated|Silent/ });
    fireEvent.click(narrated()); // Silent
    fireEvent.click(narrated()); // Narrated again
    fireEvent.click(screen.getByLabelText("Close settings"));

    expect(audio.paused).toBe(false);
  });

  it("compact: thumb-sized, with no fullscreen button", () => {
    setViewport("compact");
    mountPlayer("audience");

    // iOS Safari has no Fullscreen API, and the browser already gives the deck
    // the screen.
    expect(screen.queryByTitle(/Fullscreen/)).toBeNull();
    expect(screen.getByLabelText("Exit deck").textContent).toBe("✕");
  });
});

describe("DeckPlayer — nothing baked, no API: every surface says so", () => {
  /** No clip for any slide in any voice, and no live synthesizer to fall back
   *  on. The state a deck is in before anyone has run the bake. */
  const nothingBaked = () => null;

  function mountUnbaked(extra?: { narrateByDefault?: boolean; audiobook?: boolean }) {
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
                audiobook={extra?.audiobook}
                onAudiobookChange={() => {}}
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>,
    );
  }

  it("controls render but are DEAD — present-but-disabled, not absent", () => {
    mountUnbaked();

    // Absent would claim "this player can't narrate", which is a different and
    // false thing. Present-but-disabled says "this deck wasn't baked".
    const sound = screen.getByTitle(NO_NARRATION_TITLE);
    expect(sound.hasAttribute("disabled")).toBe(true);
  });

  it("the presenter's bar: no sound and no voice dropdown, even with nothing baked", () => {
    render(
      <MemoryRouter>
        <ViewportProvider>
          <DeckPlayer
            deckId="fake-deck"
            slides={slides}
            mode="presenter"
            voices={NARRATION_VOICES}
            resolveNarrationUrl={nothingBaked}
          />
        </ViewportProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByTitle(NO_NARRATION_TITLE)).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("never auto-plays, even with narrate-by-default and Audiobook both on", () => {
    mountUnbaked({ narrateByDefault: true, audiobook: true });

    // The preference says "read to me"; there is nothing to read. No <audio>
    // should have been constructed at all — a silent element that fires no
    // "ended" is how an Audiobook deck would sit forever on slide one.
    expect(audioInstances).toHaveLength(0);
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("the sheet's rows are disabled and say why", async () => {
    setViewport("compact");
    mountUnbaked({ narrateByDefault: true, audiobook: true });

    fireEvent.click(screen.getByLabelText("Settings"));

    // Narration dead, Audiobook dead, and the voice group with them — there is
    // no valid choice left to make inside it.
    const narration = await screen.findByRole("switch", { name: /Narrated|Silent/ });
    expect(narration.hasAttribute("disabled")).toBe(true);
    const audiobook = screen.getByRole("radio", { name: /^Audiobook/ });
    expect(audiobook.hasAttribute("disabled")).toBe(true);
    // Each dead row states its OWN reason rather than leaving a bare grey
    // control: the narration row explains there's nothing to read, and the
    // mode row explains Audiobook has no clip-end to advance on.
    expect(screen.getByText(/no baked audio — nothing to read aloud/i)).toBeTruthy();
    expect(screen.getByText(/no baked audio to advance on/i)).toBeTruthy();
  });

  it("no ring to strand the reader on", () => {
    setViewport("compact");
    mountUnbaked({ narrateByDefault: true, audiobook: true });

    // Audiobook asked for the ring, but with nothing to play it would be a
    // dead button where the counter used to be.
    expect(ring()).toBeNull();
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

describe("DeckPlayer — swipe paging", () => {
  // The contract these pin: a swipe goes through the controller's own
  // goNext/goPrev, the same path as the arrows and the arrow keys. That is
  // what keeps Audiobook mode's auto-advance intact, so reimplementing the
  // gesture against narration state directly fails here.
  const currentSlideId = () => {
    const src = audioInstances[audioInstances.length - 1]?.src ?? "";
    return src.match(/\/(s\d+)-/)?.[1] ?? "";
  };

  /** The slide area — the one swipe target, wrapping SlideRenderer. */
  const slideSurface = () => document.querySelector("[data-swipe-surface]")!;

  /** One gesture, start to finish, in the shape the hook reads. */
  function drag(
    el: Element,
    { dx, dy = 0, pointerId = 1 }: { dx: number; dy?: number; pointerId?: number },
  ) {
    act(() => {
      fireEvent.pointerDown(el, {
        pointerId, isPrimary: true, button: 0, clientX: 200, clientY: 400,
      });
      fireEvent.pointerUp(el, {
        pointerId, isPrimary: true, button: 0,
        clientX: 200 + dx, clientY: 400 + dy,
      });
    });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    setViewport("compact");
  });
  afterEach(() => jest.useRealTimers());

  it("a left swipe pages forward, a right swipe pages back", () => {
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    expect(currentSlideId()).toBe("s1");

    drag(slideSurface(), { dx: -120 });
    expect(currentSlideId()).toBe("s2");

    drag(slideSurface(), { dx: 120 });
    expect(currentSlideId()).toBe("s1");
  });

  it("one target reads both directions — travel decides, not where the thumb landed", () => {
    // Why there is no left zone and no right zone: direction is the sign of
    // dx. Both gestures below start at the same x; only the travel differs.
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    const surface = slideSurface();

    drag(surface, { dx: -120 });
    expect(currentSlideId()).toBe("s2");
    drag(surface, { dx: 120 });
    expect(currentSlideId()).toBe("s1");
  });

  it("ignores a vertical drag — that is a scroll, not a page turn", () => {
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    drag(slideSurface(), { dx: -60, dy: 200 });

    expect(currentSlideId()).toBe("s1");
  });

  it("ignores a short drag — that is a tap", () => {
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    drag(slideSurface(), { dx: -20 });

    expect(currentSlideId()).toBe("s1");
  });

  it("desktop: no swipe handlers at all", () => {
    setViewport("desktop");
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    drag(slideSurface(), { dx: -120 });

    expect(currentSlideId()).toBe("s1");
  });

  it("swiping during the dwell does not double-advance", () => {
    // The clip ends and a dwell timer is queued to advance the deck; the
    // reader swipes during that gap. Without the timer being cleared on the
    // slide change, the queued advance lands on top of the swipe and the deck
    // jumps two.
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    expect(currentSlideId()).toBe("s1");

    act(() => {
      audioInstances[audioInstances.length - 1].onended?.();
    });
    expect(currentSlideId()).toBe("s1");

    drag(slideSurface(), { dx: -120 });
    expect(currentSlideId()).toBe("s2");

    act(() => {
      jest.advanceTimersByTime(SLIDE_DWELL_SECONDS * 1000);
    });
    expect(currentSlideId()).toBe("s2");
  });

  it("auto-advance still works after a swipe", () => {
    // The other half: clearing the queued advance must not leave the mode
    // dead. The swiped-to slide plays, ends, and advances on its own.
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    drag(slideSurface(), { dx: 120 }); // clamped at the first slide
    expect(currentSlideId()).toBe("s1");

    act(() => {
      audioInstances[audioInstances.length - 1].onended?.();
    });
    act(() => {
      jest.advanceTimersByTime(SLIDE_DWELL_SECONDS * 1000);
    });

    expect(currentSlideId()).toBe("s2");
  });

  it("a swipe restarts the new slide's clip from the beginning", () => {
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });
    const audio = audioInstances[0];
    audio.currentTime = 12;

    drag(slideSurface(), { dx: -120 });

    expect(audio.src).toContain("s2");
    expect(audio.currentTime).toBe(0);
  });

  it("a gesture starting on a control inside the slide belongs to the control", () => {
    // Slides carry their own links and buttons, and those sit inside the
    // swipe surface. A drag begun on one is that control's gesture.
    mountPlayer("audience", { narrateByDefault: true, audiobook: true });

    const control = document.createElement("button");
    control.textContent = "in-slide control";
    slideSurface().appendChild(control);

    act(() => {
      fireEvent.pointerDown(control, { pointerId: 1, isPrimary: true, button: 0, clientX: 200, clientY: 400 });
      fireEvent.pointerUp(control, { pointerId: 1, isPrimary: true, button: 0, clientX: 60, clientY: 400 });
    });

    expect(currentSlideId()).toBe("s1");
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

// The host's one seam into navigation, and the two silent failures it has to
// not have. Both are the kind this suite exists for: invisible when broken,
// permanent once they happen.
describe("DeckPlayer — onAfterSlideNavCallback", () => {
  const deckOf = (n: number): Slide[] =>
    Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, copy: null }));

  function mountWithCallback(
    deckId: string,
    deckSlides: Slide[],
    onAfterSlideNavCallback?: (slideIndex: number, totalSlides: number) => void,
  ) {
    const ui = (
      id: string,
      s: Slide[],
      cb?: (slideIndex: number, totalSlides: number) => void,
    ) => (
      <MemoryRouter>
        <ViewportProvider>
          <PresenterModeProvider>
            <VoicePreferenceProvider>
              <DeckPlayer
                deckId={id}
                slides={s}
                mode="audience"
                onAfterSlideNavCallback={cb}
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>
    );
    const view = render(ui(deckId, deckSlides, onAfterSlideNavCallback));
    return {
      ...view,
      /** Re-render WITHOUT unmounting — what a route param change does. */
      rerenderWith: (
        id: string,
        s: Slide[],
        cb?: (slideIndex: number, totalSlides: number) => void,
      ) => view.rerender(ui(id, s, cb)),
    };
  }

  it("fires on mount at slide 0, and again on each navigation", () => {
    const onNav = jest.fn();
    mountWithCallback("deck-a", deckOf(3), onNav);
    expect(onNav).toHaveBeenCalledWith(0, 3);

    onNav.mockClear();
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(onNav).toHaveBeenCalledWith(1, 3);
  });

  it("omitting the prop changes nothing", () => {
    expect(() => {
      mountWithCallback("deck-a", deckOf(3));
      act(() => {
        fireEvent.keyDown(window, { key: "ArrowRight" });
      });
    }).not.toThrow();
  });

  // PresentationDeck routes at /deck/:deckId and does not remount on a param
  // change, so a deck-to-deck navigation commits one render carrying the
  // OUTGOING deck's slideIndex beside the INCOMING deck's slide count. A host
  // recording a high-water mark would read the new deck as finished forever.
  it("never reports the outgoing deck's index against the incoming deck", () => {
    const onNav = jest.fn();
    const view = mountWithCallback("deck-a", deckOf(8), onNav);
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(onNav).toHaveBeenCalledWith(5, 8);

    onNav.mockClear();
    act(() => {
      view.rerenderWith("deck-b", deckOf(3), onNav);
    });

    expect(onNav).not.toHaveBeenCalledWith(5, 3);
    expect(onNav).toHaveBeenCalledWith(0, 3);
  });

  // Why the guard FIRES rather than returning early. With the outgoing deck
  // already on slide 0, the reset sets state to the value it already holds,
  // React bails out of the re-render, and a skip-and-wait guard never runs
  // again — the incoming deck would go unrecorded entirely.
  it("reports the incoming deck even when the outgoing deck was on slide 0", () => {
    const onNav = jest.fn();
    const view = mountWithCallback("deck-a", deckOf(8), onNav);
    onNav.mockClear();

    act(() => {
      view.rerenderWith("deck-b", deckOf(3), onNav);
    });

    expect(onNav).toHaveBeenCalledWith(0, 3);
  });

  // What reusing the existing slide-change broadcast effect would miss: with
  // equal slide counts neither of its deps appears to change on the switch.
  it("reports a switch between two decks of the same length", () => {
    const onNav = jest.fn();
    const view = mountWithCallback("deck-a", deckOf(4), onNav);
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    onNav.mockClear();

    act(() => {
      view.rerenderWith("deck-b", deckOf(4), onNav);
    });

    expect(onNav).toHaveBeenCalledWith(0, 4);
  });

  // A host passing an inline arrow is the ordinary case, so the prop's
  // identity changes every render. With the callback in the effect's deps and
  // a handler that writes state, that is an infinite render loop.
  it("does not re-fire when only the callback's identity changes", () => {
    const spy = jest.fn();
    const view = mountWithCallback("deck-a", deckOf(3), (i, t) => spy(i, t));
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    act(() => {
      view.rerenderWith("deck-a", deckOf(3), (i, t) => spy(i, t));
    });
    act(() => {
      view.rerenderWith("deck-a", deckOf(3), (i, t) => spy(i, t));
    });

    expect(spy).not.toHaveBeenCalled();
  });

  // Not about the callback — about the commit it exposed. That same render
  // also DRAWS, and slides[5] of a 3-slide deck is undefined. Reachable with
  // no callback in sight: browser back/forward between two deck URLs never
  // remounts the route element.
  it("survives switching to a shorter deck while paged past its end", () => {
    const view = mountWithCallback("deck-a", deckOf(8));
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });

    expect(() => {
      act(() => {
        view.rerenderWith("deck-b", deckOf(3));
      });
    }).not.toThrow();
  });
});

// Opening somewhere other than slide 0 — the engine half of a host's
// "continue where you left off". The engine takes a number and holds no
// opinion about where it came from.
describe("DeckPlayer — initialSlideIndex", () => {
  const deckOf = (n: number): Slide[] =>
    Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, copy: null }));

  function mountAt(
    deckId: string,
    deckSlides: Slide[],
    initialSlideIndex: number,
    onNav?: (slideIndex: number, totalSlides: number) => void,
  ) {
    const ui = (id: string, sl: Slide[], initial: number) => (
      <MemoryRouter>
        <ViewportProvider>
          <PresenterModeProvider>
            <VoicePreferenceProvider>
              <DeckPlayer
                deckId={id}
                slides={sl}
                mode="audience"
                initialSlideIndex={initial}
                onAfterSlideNavCallback={onNav}
              />
            </VoicePreferenceProvider>
          </PresenterModeProvider>
        </ViewportProvider>
      </MemoryRouter>
    );
    const view = render(ui(deckId, deckSlides, initialSlideIndex));
    return {
      ...view,
      rerenderWith: (id: string, sl: Slide[], initial: number) =>
        view.rerender(ui(id, sl, initial)),
    };
  }

  it("opens on the slide the host asks for", () => {
    const onNav = jest.fn();
    mountAt("deck-a", deckOf(10), 4, onNav);
    expect(onNav).toHaveBeenCalledWith(4, 10);
  });

  it("pages forward from where it opened, not from the start", () => {
    const onNav = jest.fn();
    mountAt("deck-a", deckOf(10), 4, onNav);
    onNav.mockClear();
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(onNav).toHaveBeenCalledWith(5, 10);
  });

  // THE trap, and the reason this is a ref rather than a live prop. A host
  // computes the value from its own stored progress, so recording a slide
  // change hands back a NEW one on the very next render. Honoured
  // continuously, every step forward would snap the visitor back and the deck
  // could not be paged at all.
  it("ignores a changing initialSlideIndex while staying on the same deck", () => {
    const onNav = jest.fn();
    const view = mountAt("deck-a", deckOf(10), 4, onNav);

    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    onNav.mockClear();

    // The host now says "resume at 5", then 6, because it just recorded them.
    act(() => {
      view.rerenderWith("deck-a", deckOf(10), 5);
    });
    act(() => {
      view.rerenderWith("deck-a", deckOf(10), 6);
    });
    expect(onNav).not.toHaveBeenCalled();

    // Still paging from where the visitor actually is.
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(onNav).toHaveBeenCalledWith(6, 10);
  });

  it("clamps a resume point past the end of a deck edited shorter", () => {
    const onNav = jest.fn();
    mountAt("deck-a", deckOf(3), 19, onNav);
    expect(onNav).toHaveBeenCalledWith(2, 3);
  });

  it("clamps a negative resume point to the start", () => {
    const onNav = jest.fn();
    mountAt("deck-a", deckOf(5), -3, onNav);
    expect(onNav).toHaveBeenCalledWith(0, 5);
  });

  // A deck switch without a remount lands where the host wants the NEW deck
  // opened, and reports THAT — not a hardcoded 0, or a host would record the
  // wrong position for it.
  it("resumes the incoming deck on a deck switch", () => {
    const onNav = jest.fn();
    const view = mountAt("deck-a", deckOf(10), 4, onNav);
    onNav.mockClear();

    act(() => {
      view.rerenderWith("deck-b", deckOf(8), 3);
    });

    expect(onNav).toHaveBeenCalledWith(3, 8);
    expect(onNav).not.toHaveBeenCalledWith(4, 8);
  });
});
