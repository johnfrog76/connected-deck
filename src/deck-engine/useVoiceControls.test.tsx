import { renderHook, act } from "@testing-library/react";
import { useVoiceControls } from "./useVoiceControls";
import { NARRATION_VOICES } from "./narrationConstants";
import type { Slide } from "../decks/types";

// useVoiceControls is the ONE hook both narration surfaces mount — the audience
// player's chrome (via DeckPlayer) and the presenter notes popout. These tests
// exist because the two used to hand-roll this separately and disagreed: the
// notes window offered voices the player had disabled, and either window could
// sit on a selected voice that plays nothing.
//
// So what's pinned here is the SELECTION invariant, which is the part that can't
// be checked by reading voiceCoverage alone:
//
//   the selected voice is ALWAYS one that can narrate this deck, or "".
//
// It must hold on the first render (no effect-driven correction that lets one
// frame escape with a dead voice) and after any deck change.

const JENNY = NARRATION_VOICES[0].id;
const BRIAN = NARRATION_VOICES[1].id;

function deck(slideCount: number, prefix = "s"): Slide[] {
  return Array.from({ length: slideCount }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    copy: null,
  }));
}

/** Resolver that has `voice` for every slide, and nothing for any other voice. */
function onlyVoice(voice: string) {
  return (_slide: Slide, voiceId: string) =>
    voiceId === voice ? `/voices/${_slide.id}-${voiceId}.mp3` : null;
}

/** The resolver signature the hook takes, named so fixtures don't narrow it. */
type Resolver = (slide: Slide, voiceId: string) => string | null;

const noneBaked: Resolver = () => null;
const allBaked: Resolver = (slide, voiceId) =>
  `/voices/${slide.id}-${voiceId}.mp3`;

describe("useVoiceControls — selection can never be a dead voice", () => {
  it("starts on the covered voice when the default one isn't baked", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: onlyVoice(BRIAN),
      }),
    );

    // True on the FIRST render — not corrected a frame later.
    expect(result.current.voiceId).toBe(BRIAN);
    expect(result.current.hasAnyNarration).toBe(true);
  });

  it("ignores an attempt to select an uncovered voice", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: onlyVoice(BRIAN),
      }),
    );

    act(() => result.current.setVoiceId(JENNY)); // not baked for this deck

    // The intent is recorded but never becomes the effective voice, so the
    // player can't be handed a voice that resolves to no audio.
    expect(result.current.voiceId).toBe(BRIAN);
  });

  it("accepts a selection among covered voices", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: allBaked,
      }),
    );

    expect(result.current.voiceId).toBe(JENNY);
    act(() => result.current.setVoiceId(BRIAN));
    expect(result.current.voiceId).toBe(BRIAN);
  });

  it("selects nothing when no voice covers the deck", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: noneBaked,
      }),
    );

    expect(result.current.voiceId).toBe("");
    expect(result.current.hasAnyNarration).toBe(false);
    // Both controls dead: the consumers gate the toggle AND the picker on this.
    expect(result.current.voices.every((v) => !v.available)).toBe(true);
  });
});

describe("useVoiceControls — surviving a deck change", () => {
  it("drops a now-uncovered selection when the deck changes", () => {
    // Start on a deck where both voices work and pick Brian...
    const { result, rerender } = renderHook(
      ({ resolveUrl }: { resolveUrl: Resolver }) =>
        useVoiceControls({
          slides: deck(10),
          voices: NARRATION_VOICES,
          resolveUrl,
        }),
      { initialProps: { resolveUrl: allBaked } },
    );

    act(() => result.current.setVoiceId(BRIAN));
    expect(result.current.voiceId).toBe(BRIAN);

    // ...then navigate to a deck baked only in Jenny. Brian must not survive.
    rerender({ resolveUrl: onlyVoice(JENNY) });
    expect(result.current.voiceId).toBe(JENNY);
  });

  it("re-honors the earlier choice if it becomes valid again", () => {
    const { result, rerender } = renderHook(
      ({ resolveUrl }: { resolveUrl: Resolver }) =>
        useVoiceControls({
          slides: deck(10),
          voices: NARRATION_VOICES,
          resolveUrl,
        }),
      { initialProps: { resolveUrl: allBaked } },
    );

    act(() => result.current.setVoiceId(BRIAN));
    rerender({ resolveUrl: onlyVoice(JENNY) }); // Brian unavailable here
    expect(result.current.voiceId).toBe(JENNY);

    rerender({ resolveUrl: allBaked }); // Brian available again
    // Intent was preserved rather than overwritten, so the presenter's actual
    // preference comes back instead of being silently lost to one bad deck.
    expect(result.current.voiceId).toBe(BRIAN);
  });
});

describe("useVoiceControls — host parity (the two-app rule)", () => {
  const slides = deck(28);

  it("hasApi keeps every voice live even with zero baked assets", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides,
        voices: NARRATION_VOICES,
        hasApi: true,
        resolveUrl: noneBaked,
      }),
    );

    expect(result.current.hasAnyNarration).toBe(true);
    expect(result.current.voices.every((v) => v.available)).toBe(true);
    expect(result.current.voiceId).toBe(JENNY);
  });

  it("the SAME inputs without an API disable everything", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides,
        voices: NARRATION_VOICES,
        hasApi: false,
        resolveUrl: noneBaked,
      }),
    );

    expect(result.current.hasAnyNarration).toBe(false);
    expect(result.current.voiceId).toBe("");
  });

  it("both windows agree given the same host facts", () => {
    // Mounting the hook twice models the deck window and the notes window: same
    // inputs must yield the same offer, which is the whole point of sharing it.
    const args = {
      slides,
      voices: NARRATION_VOICES,
      hasApi: false,
      resolveUrl: onlyVoice(BRIAN),
    };
    const player = renderHook(() => useVoiceControls(args));
    const notes = renderHook(() => useVoiceControls(args));

    expect(notes.result.current.voiceId).toBe(player.result.current.voiceId);
    expect(notes.result.current.hasAnyNarration).toBe(
      player.result.current.hasAnyNarration,
    );
    expect(notes.result.current.voices.map((v) => v.available)).toEqual(
      player.result.current.voices.map((v) => v.available),
    );
  });
});

describe("useVoiceControls — remembered preference", () => {
  it("uses a stored voice when this deck supports it", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: allBaked,
        preferredVoiceId: BRIAN,
      }),
    );
    expect(result.current.voiceId).toBe(BRIAN);
  });

  it("falls back when the stored voice can't narrate this deck", () => {
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: onlyVoice(JENNY),
        preferredVoiceId: BRIAN, // remembered from a Brian-baked deck
      }),
    );
    expect(result.current.voiceId).toBe(JENNY);
  });
});

describe("useVoiceControls — disabled by the host", () => {
  it("reports nothing when narration isn't wired for this window", () => {
    // enabled:false is how DeckPlayer short-circuits presenter mode, where the
    // presenter's own voice is the point and a synthesized one would compete.
    const { result } = renderHook(() =>
      useVoiceControls({
        slides: deck(10),
        voices: NARRATION_VOICES,
        resolveUrl: allBaked,
        enabled: false,
      }),
    );

    expect(result.current.voices).toHaveLength(0);
    expect(result.current.hasAnyNarration).toBe(false);
    expect(result.current.voiceId).toBe("");
  });
});
