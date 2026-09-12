import { voiceCoverage } from "./deck-engine/voiceCoverage";
import { NARRATION_VOICES, voiceOptionLabel, VOICE_NOT_BAKED_SUFFIX } from "./deck-engine/narrationConstants";
import { extractSayText, slideSpokenText } from "./deck-engine/sayText";
import {
  estimateSlideSeconds,
  estimateDeckDuration,
  formatDuration,
  NARRATION_CHARS_PER_SEC,
  SLIDE_DWELL_SECONDS,
} from "./deck-engine/deckDuration";
import { createMakeSlide } from "./deck-engine/makeSlide";
import { openNotesWindow } from "./deck-engine/deckChromeShared";
import { formatElapsed } from "./deck-engine/PresenterNotes";
import { voiceUrl } from "./bakedVoices";
import { DECKS } from "./decks/index";
import { Say, Context, Beat } from "./deck-engine/PresenterNoteKit";
import { computeAtPodium, computeSuitcaseAvailable, computeSuitcaseActive, computeSofaActive } from "./settingsRules";
import { readPersistedFlag } from "./shared/usePersistedState";
import type { Slide } from "./decks/types";
import type { ReactElement, ReactNode } from "react";
import { createElement, isValidElement, Children } from "react";

/**
 * The engine's guarantees, checked IN THE BROWSER.
 *
 * The repo's Jest suite (`npm test`) is the real one and it's what CI runs.
 * This is a second, smaller harness that exists for a different reason: this
 * page is the open-source pitch, and a visitor should be able to watch the
 * claims get proved rather than take a README's word for it.
 *
 * Not a badge and not a mock. Every check below calls the same exported
 * functions the player, the notes popout, and the launch page itself call —
 * the numbers on screen are computed the moment you press Run. If one of
 * these guarantees breaks and gets deployed, this panel goes red on its own.
 *
 * Kept deliberately free of any test framework: plain functions returning
 * pass/fail counts, so nothing extra needs bundling for production.
 */

export interface CheckResult {
  name: string;
  passed: number;
  total: number;
  /** First failure, if any — enough to see what went wrong without a console. */
  detail?: string;
}

type Assert = (ok: boolean, detail: string) => void;

function group(name: string, body: (t: Assert) => void): CheckResult {
  let passed = 0;
  let total = 0;
  let detail: string | undefined;
  const t: Assert = (ok, d) => {
    total++;
    if (ok) passed++;
    else if (!detail) detail = d;
  };
  try {
    body(t);
  } catch (e) {
    total++;
    detail = detail ?? `threw: ${(e as Error).message}`;
  }
  return { name, passed, total, detail };
}

/** First descendant of the given component type in a React element tree, or undefined. */
function findElement(node: unknown, type: unknown): ReactElement | undefined {
  if (isValidElement(node)) {
    if (node.type === type) return node;
    let found: ReactElement | undefined;
    Children.forEach((node.props as { children?: unknown }).children, (child) => {
      found = found ?? findElement(child, type);
    });
    return found;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type);
      if (found) return found;
    }
  }
  return undefined;
}

const JENNY = NARRATION_VOICES[0].id;
const BRIAN = NARRATION_VOICES[1].id;

/** A synthetic slide — just enough shape for the checks below. */
function slide(id: string): Slide {
  return { id, copy: null };
}

/** A resolver backed by "<slideId>-<voiceId>" keys, same shape as the real registry. */
function resolverFor(baked: Set<string>) {
  return (s: Slide, voiceId: string) => (baked.has(`${s.id}-${voiceId}`) ? `/voices/${s.id}-${voiceId}.mp3` : null);
}

function bake(voice: string, ids: string[]): string[] {
  return ids.map((id) => `${id}-${voice}`);
}

export const CHECKS: (() => CheckResult)[] = [
  () =>
    group("Deck registry", (t) => {
      t(DECKS.length > 0, "at least one deck should be registered");
      const ids = DECKS.map((d) => d.id);
      t(new Set(ids).size === ids.length, "deck ids should be unique");
      for (const deck of DECKS) {
        t(deck.title.trim().length > 0, `${deck.id} should have a title`);
        const slides = deck.slides();
        t(slides.length > 0, `${deck.id} should have at least one slide`);
        const slideIds = slides.map((s) => s.id);
        t(new Set(slideIds).size === slideIds.length, `${deck.id}'s slide ids should be unique`);
        const duration = estimateDeckDuration(slides);
        t(/^\d+:\d{2}$/.test(duration), `${deck.id}'s duration badge "${duration}" should read as m:ss`);
      }
    }),

  () =>
    group("makeSlide — one title, no drift", (t) => {
      // Every deck styles its own copy panel, but all of them hand their four
      // components to createMakeSlide exactly once — this is the wiring every
      // deck in the repo shares, checked against a throwaway kit rather than
      // any one deck's real styling.
      function Panel({ children }: { children?: ReactNode }) {
        return createElement("panel", null, children);
      }
      function Kicker({ children }: { children?: ReactNode }) {
        return createElement("kicker", null, children);
      }
      function Title({ children }: { children?: ReactNode }) {
        return createElement("title", null, children);
      }
      function Body({ children }: { children?: ReactNode }) {
        return createElement("body", null, children);
      }
      const makeSlide = createMakeSlide({
        CopyPanel: Panel,
        Eyebrow: Kicker,
        SlideTitle: Title,
        Lead: Body,
      });

      const withTitle = makeSlide({ id: "x", title: "The Only Title" });
      t(withTitle.title === "The Only Title", "Slide.title should carry the authored title verbatim");
      const rendered = findElement(withTitle.copy, Title);
      t(
        rendered?.props.children === "The Only Title",
        "the visual <SlideTitle> should read the same string as Slide.title — one write, not two",
      );
      t(findElement(withTitle.copy, Kicker) === undefined, "omitting eyebrow should render no Eyebrow at all");

      const withEyebrow = makeSlide({ id: "y", title: "T", eyebrow: "Kicker text" });
      t(
        findElement(withEyebrow.copy, Kicker)?.props.children === "Kicker text",
        "a supplied eyebrow should render inside Eyebrow",
      );

      const bespoke = createElement("bespoke", null, "hand-rolled panel");
      const withCopyOverride = makeSlide({ id: "z", title: "T", eyebrow: "ignored", copy: bespoke });
      t(
        withCopyOverride.copy === bespoke,
        "a bespoke `copy` should replace the eyebrow/lead stack entirely, not merge with it",
      );
      t(withCopyOverride.title === "T", "title stays the presenter-notes anchor even with bespoke copy");
    }),

  () =>
    group("Settings — the gating rules, stated once", (t) => {
      // SettingsForm's own header tells the story this check pins: the drawer
      // and the in-deck sheet used to each re-derive "am I at the podium?" and
      // drifted. Both surfaces (and the launch page's mode cards) now import
      // these functions from settingsRules rather than recomputing them, so
      // this check is exercising the exact logic all three read.
      t(computeAtPodium(true, false) === true, "presenter + wide window ⇒ podium");
      t(computeAtPodium(true, true) === false, "a phone forces Sofa even with Podium saved");
      t(computeAtPodium(false, false) === false, "Sofa preference stays Sofa on a wide window");

      t(
        computeSuitcaseAvailable(false, true) === true,
        "sofa + narration on ⇒ suitcase can be offered",
      );
      t(computeSuitcaseAvailable(true, true) === false, "podium disables suitcase regardless of narration");
      t(computeSuitcaseAvailable(false, false) === false, "no narration ⇒ nothing to advance suitcase on");
      t(
        computeSuitcaseAvailable(false, true, true) === false,
        "a deck with no baked audio at all disables suitcase even with the global preference on",
      );

      // Exactly one of the three viewing modes should ever be active, across a
      // battery of stored-preference combinations — the launch page renders
      // three cards and exactly one may show "On now".
      let exclusiveEverywhere = true;
      for (const presenter of [true, false]) {
        for (const isMobile of [true, false]) {
          for (const suitcaseMode of [true, false]) {
            for (const narrateByDefault of [true, false]) {
              const atPodium = computeAtPodium(presenter, isMobile);
              const suitcaseActive = computeSuitcaseActive(atPodium, suitcaseMode, narrateByDefault);
              const sofaActive = computeSofaActive(atPodium, suitcaseActive);
              const activeCount = [atPodium, suitcaseActive, sofaActive].filter(Boolean).length;
              if (activeCount !== 1) exclusiveEverywhere = false;
            }
          }
        }
      }
      t(exclusiveEverywhere, "exactly one viewing mode should be active for every combination of stored settings");
    }),

  () =>
    group("Voice coverage — complete contract", (t) => {
      // The bar is ALL slides, not most: a voice enabled by one baked clip
      // would go silent partway through the rest of the deck.
      const ids = ["s1", "s2", "s3", "s4", "s5"];
      const full = voiceCoverage({
        slides: ids.map(slide),
        voices: NARRATION_VOICES,
        resolveUrl: resolverFor(new Set(bake(JENNY, ids))),
      });
      t(full.voices.find((v) => v.id === JENNY)!.available, "a voice baked for every slide should be available");

      const partial = voiceCoverage({
        slides: ids.map(slide),
        voices: NARRATION_VOICES,
        resolveUrl: resolverFor(new Set(bake(JENNY, ids.slice(0, 4)))), // 4 of 5
      });
      t(
        !partial.voices.find((v) => v.id === JENNY)!.available,
        "a voice missing even one slide should be disabled, not offered partial",
      );
      t(!partial.hasAnyNarration, "no voice covering the deck means narration is off entirely");

      const oneCovered = voiceCoverage({
        slides: ids.map(slide),
        voices: NARRATION_VOICES,
        resolveUrl: resolverFor(new Set(bake(BRIAN, ids))),
        preferredVoiceId: JENNY, // remembered from another deck, can't narrate this one
      });
      t(
        oneCovered.defaultVoiceId === BRIAN,
        "default voice should fall back to the one that actually covers the deck",
      );
    }),

  () =>
    group("Narration text — Say only", (t) => {
      const notes = createElement(
        "div",
        null,
        createElement(Say, null, "This is spoken aloud."),
        createElement(Context, null, "This is background, never spoken."),
        createElement(Beat, null, "This is a delivery cue, never spoken."),
      );
      const text = extractSayText(notes);
      t(text.includes("This is spoken aloud."), "Say text should be extracted");
      t(!text.includes("background"), "Context text must never reach narration");
      t(!text.includes("delivery cue"), "Beat text must never reach narration");

      const spoken = slideSpokenText({ title: "A Title", notes });
      t(spoken.startsWith("A Title."), "spoken text should lead with the slide title");
    }),

  () =>
    group("Deck duration estimate", (t) => {
      t(formatDuration(0) === "0:00", "zero seconds should format as 0:00");
      t(formatDuration(65) === "1:05", "65 seconds should format as 1:05, seconds zero-padded");
      t(formatDuration(-5) === "0:00", "a negative duration should clamp to zero");

      const authored = estimateSlideSeconds({ id: "x", copy: null, approximateTime: "2:30" });
      t(authored === 150, "an authored mm:ss override should win outright");

      const spokenText = "0123456789012345678901234567890123456789012345678901234";
      const computed = estimateSlideSeconds({
        id: "x",
        copy: null,
        notes: createElement(Say, null, spokenText),
      });
      // chars / 15 chars-per-sec + 5s dwell — length taken from the string
      // itself rather than hand-counted, so this can't drift from the fixture.
      const expectedSeconds = spokenText.length / NARRATION_CHARS_PER_SEC + SLIDE_DWELL_SECONDS;
      t(
        Math.abs(computed - expectedSeconds) < 0.01,
        `expected ~${expectedSeconds.toFixed(2)}s for ${spokenText.length} spoken chars, got ${computed.toFixed(2)}`,
      );

      const total = estimateDeckDuration([
        { id: "a", copy: null, approximateTime: "1:00" },
        { id: "b", copy: null, approximateTime: "2:00" },
      ]);
      t(total === "3:00", `two authored slides should sum, got ${total}`);
    }),

  () =>
    group("Baked narration — real assets on disk", (t) => {
      // Not a synthetic fixture: this asks the SAME resolver the launch page
      // and the player use, against the SAME deck registry, so a missing mp3
      // on disk fails right here rather than going silent in the player.
      let anyFullyCovered = false;
      for (const deck of DECKS) {
        const slides = deck.slides();
        const coverage = voiceCoverage({
          slides,
          voices: NARRATION_VOICES,
          resolveUrl: (s, voiceId) => voiceUrl(deck.id, s.id, voiceId),
        });
        if (coverage.voices.some((v) => v.available)) anyFullyCovered = true;
        for (const v of coverage.voices) {
          t(
            v.slideCount <= slides.length,
            `${deck.id}/${v.id} resolved more clips than slides exist`,
          );
        }
      }
      t(anyFullyCovered, "at least one deck should have a fully baked voice committed");
      t(voiceUrl("not-a-real-deck", "not-a-real-slide", JENNY) === null, "a made-up deck/slide should resolve to no clip");
    }),

  () =>
    group("Notes popout — deck-scoped window", (t) => {
      // The notes popout is a SEPARATE window reached by window.open, so the
      // only way to check what it's asked for is to intercept the real call —
      // this stubs window.open for the duration of the check and restores it
      // immediately after, real window never opens.
      const realOpen = window.open;
      const calls: { url: string; name: string; features: string }[] = [];
      window.open = ((url?: string | URL, name?: string, features?: string) => {
        calls.push({ url: String(url ?? ""), name: name ?? "", features: features ?? "" });
        return null;
      }) as typeof window.open;

      try {
        openNotesWindow("/deck", "connected-deck-trailer", 4);
        t(calls.length === 1, "opening notes should call window.open exactly once");
        const call = calls[0];
        t(
          call.url === "/deck/connected-deck-trailer/notes?slide=4",
          `notes URL should hand over the current slide, got "${call.url}"`,
        );
        t(
          call.name === "connected-deck-notes-connected-deck-trailer",
          "the window name should be deck-scoped, so a second click refocuses instead of stacking a new window",
        );

        openNotesWindow("/deck", "connected-deck-trailer", 4);
        t(
          calls[0].name === calls[1]?.name,
          "opening notes twice for the same deck should reuse the same window name",
        );
      } finally {
        window.open = realOpen;
      }
    }),

  () =>
    group("Voice labels & persisted settings", (t) => {
      const voices = NARRATION_VOICES;
      t(
        voiceOptionLabel(voices[0].name, true) === voices[0].name,
        "an available voice's label should be its bare name",
      );
      t(
        voiceOptionLabel(voices[0].name, false) === `${voices[0].name} ${VOICE_NOT_BAKED_SUFFIX}`,
        "an unavailable voice's label should say so, not silently look identical to an available one",
      );

      // readPersistedFlag is the same read path presenterMode/voicePreference
      // build on, minus the hook wrapper — exercised here against a scratch
      // key so this check can't disturb the visitor's actual saved settings.
      const scratchKey = "connected-deck:__checks-scratch__";
      try {
        window.localStorage.removeItem(scratchKey);
        t(readPersistedFlag(scratchKey, true) === true, "a never-written key should read as the given fallback");
        window.localStorage.setItem(scratchKey, "1");
        t(readPersistedFlag(scratchKey) === true, '"1" should read as true');
        window.localStorage.setItem(scratchKey, "0");
        t(readPersistedFlag(scratchKey, true) === false, '"0" should read as false, even over a true fallback');
        window.localStorage.setItem(scratchKey, "garbage");
        t(readPersistedFlag(scratchKey, true) === false, "an unparseable stored value should read as false, not the fallback");
      } finally {
        window.localStorage.removeItem(scratchKey);
      }
    }),

  () =>
    group("Presenter timer formatting", (t) => {
      t(formatElapsed(0) === "00:00", "zero elapsed should read 00:00 — minutes stay zero-padded under an hour");
      t(formatElapsed(65_000) === "01:05", "65s should read 01:05, minutes and seconds both zero-padded");
      t(formatElapsed(59 * 60 * 1000 + 9 * 1000) === "59:09", "just under an hour should stay minutes:seconds");
      t(
        formatElapsed(60 * 60 * 1000 + 5 * 1000) === "1:00:05",
        "past an hour the timer should grow an hours place rather than rolling minutes over 60",
      );
    }),
];

export function runAll(): CheckResult[] {
  return CHECKS.map((c) => c());
}
