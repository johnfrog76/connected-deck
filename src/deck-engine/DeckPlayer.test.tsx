import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { webDarkTheme } from "@fluentui/react-components";
import { DeckPlayer } from "./DeckPlayer";
import { darkTheme } from "../theme";
import { NARRATION_VOICES, NO_NARRATION_TITLE, VOICE_PICKER_TITLE } from "./narrationConstants";
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
class BroadcastChannelStub {
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor(public name: string) {}
  postMessage() {}
  close() {}
}

// jsdom's HTMLMediaElement can't play; narration stays toggled off in these
// tests, but useSlideNarration constructs the element eagerly per slide.
class AudioStub {
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public src: string) {}
  play() {
    return Promise.resolve();
  }
  pause() {}
}

beforeAll(() => {
  (globalThis as unknown as { BroadcastChannel: unknown }).BroadcastChannel =
    BroadcastChannelStub;
  (globalThis as unknown as { Audio: unknown }).Audio = AudioStub;
});

const slides: Slide[] = [
  { id: "s1", copy: null },
  { id: "s2", copy: null },
];

/** Every slide baked in every voice — narration is fully wired and covered. */
const allBaked = (slide: Slide, voiceId: string) =>
  `/voices/fake-deck/${slide.id}-${voiceId}.mp3`;

/** Mount the shared player exactly as a host would, with narration wired. */
function mountPlayer(mode: "presenter" | "audience") {
  return render(
    <MemoryRouter>
      <DeckPlayer
        deckId="fake-deck"
        slides={slides}
        mode={mode}
        voices={NARRATION_VOICES}
        hasApi={false}
        resolveNarrationUrl={allBaked}
      />
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
