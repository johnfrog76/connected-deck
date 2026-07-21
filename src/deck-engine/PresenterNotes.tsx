import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FluentProvider, tokens, Button, Dropdown, Option } from "@fluentui/react-components";
import {
  Play20Filled,
  Pause20Filled,
  ArrowReset20Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Speaker220Filled,
  SpeakerMute20Regular,
} from "@fluentui/react-icons";
import { darkTheme } from "../theme";
import { DECKS } from "../decks/index";
import { MarkdownViewer } from "../shared/MarkdownViewer";
import { ZoomControl } from "../shared/ZoomControl";
import { NoteLegend } from "./PresenterNoteKit";
import { SlideRenderer } from "./SlideRenderer";
import { slideSpokenText } from "./sayText";

const DECK_BG = "#07080f";
const BORDER = "#1e2030";

// Narration voice shortlist. `id` is the Azure neural voice sent to
// /api/narrate; `name` is the short label shown in the picker. Must stay a
// subset of server/index.js's ALLOWED_VOICES.
const NARRATION_VOICES = [
  { id: "en-US-JennyNeural", name: "Jenny" },
  { id: "en-US-BrianNeural", name: "Brian" },
] as const;
const DEFAULT_VOICE_ID = "en-US-JennyNeural";
const VOICE_STORAGE_KEY = "connected-deck-narration-voice";

// Persisted voice preference: a presenter who picks Brian keeps Brian across
// reloads and decks. Falls back to the default only when nothing valid is
// stored (first run, or a stored voice that's since been removed).
function loadStoredVoice(): string {
  try {
    const stored = localStorage.getItem(VOICE_STORAGE_KEY);
    if (stored && NARRATION_VOICES.some((v) => v.id === stored)) return stored;
  } catch {
    // localStorage can throw (private mode / disabled) — fall through to default.
  }
  return DEFAULT_VOICE_ID;
}

// Virtual full-slide canvas the next-slide card scales down from, so the same
// SlideRenderer (content + copy, 60/40 split) that drives the main deck
// window renders here too — the presenter sees the real upcoming slide, not
// just its text panel.
const CARD_SLIDE_W = 1920;
const CARD_SLIDE_H = 1080;
const CARD_W = 360;
const CARD_SCALE = CARD_W / CARD_SLIDE_W;
const CARD_H = CARD_SLIDE_H * CARD_SCALE;

interface SlideState {
  index: number;
  total: number;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function PresenterTimer() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    tickRef.current = () => {
      if (startRef.current !== null) {
        setElapsedMs(Date.now() - startRef.current);
      }
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  });

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsedMs;
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handlePlayPause = () => setRunning((r) => !r);
  const handleReset = () => {
    setRunning(false);
    setElapsedMs(0);
    startRef.current = null;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "16px",
          minWidth: "72px",
          textAlign: "right",
          color: running ? "#fff" : tokens.colorNeutralForeground3,
        }}
      >
        {formatElapsed(elapsedMs)}
      </span>
      <Button
        appearance="subtle"
        size="small"
        icon={running ? <Pause20Filled /> : <Play20Filled />}
        onClick={handlePlayPause}
        title={running ? "Pause" : "Play"}
      />
      <Button
        appearance="subtle"
        size="small"
        icon={<ArrowReset20Filled />}
        onClick={handleReset}
        title="Reset"
      />
    </div>
  );
}

export function PresenterNotes() {
  const { deckId } = useParams<{ deckId: string }>();

  const deck = DECKS.find((d) => d.id === deckId);
  const slides = useMemo(() => deck?.createSlides() ?? [], [deck]);

  // Opened-at slide is handed over via ?slide=N (DeckChrome), so opening notes
  // late follows the deck instead of cold-starting at slide 1. Falls back to 0
  // if absent/invalid; total stays 0 until the deck's first slide-change (the
  // `total || slides.length` fallback below covers the counter meanwhile).
  const [searchParams] = useSearchParams();
  const initialIndex = useMemo(() => {
    const raw = Number(searchParams.get("slide"));
    return Number.isInteger(raw) && raw >= 0 ? raw : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [slideState, setSlideState] = useState<SlideState>({ index: initialIndex, total: 0 });
  // JSX (Say/Context/Beat) notes don't go through MarkdownViewer, so they need
  // their own scale control — presenter screens and room lighting vary.
  const [notesZoom, setNotesZoom] = useState(1.25);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Narration playback (see README.md's "Presenter mode & narration"). "On"
  // is a mode, not a one-shot play: while on, every slide arrival auto-fetches
  // and plays that slide's Say text. Nav is never blocked — clicking next
  // mid-sentence just cuts the old audio and starts the new slide's.
  const [narrationOn, setNarrationOn] = useState(false);
  const [narrating, setNarrating] = useState(false); // true while audio is actually playing
  const [voice, setVoice] = useState<string>(loadStoredVoice);
  const voiceName = NARRATION_VOICES.find((v) => v.id === voice)?.name ?? "Jenny";

  // Gates the narration controls themselves — null while unchecked (disabled,
  // same as false, so there's no flash of enabled-then-disabled), false once
  // either the key isn't configured or a real request has failed. There's no
  // point offering a toggle/voice picker that's guaranteed to silently do
  // nothing on click.
  const [narrationAvailable, setNarrationAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/narrate/status")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setNarrationAvailable(Boolean(data?.configured));
      })
      .catch(() => {
        if (!cancelled) setNarrationAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVoiceChange = useCallback((next: string) => {
    setVoice(next);
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, next);
    } catch {
      // Preference just won't persist if storage is unavailable — not fatal.
    }
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Guards against the overlapping-playback race: paging quickly stacks up one
  // /api/narrate request per slide visited, and without cancellation their
  // responses land out of order and play over each other. abortRef cancels the
  // previous in-flight request; requestSeqRef ignores any stale response that
  // still resolves after a newer request has superseded it.
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const stopAudio = useCallback(() => {
    // Bump the sequence so any in-flight response resolving after this is
    // treated as stale and never plays (covers non-abortable races too).
    requestSeqRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    setNarrating(false);
  }, []);

  const playNarration = useCallback(
    async (text: string, slideId: string | undefined, voiceId: string) => {
      stopAudio(); // cancel any in-flight request and stop current audio first
      if (!text) return;
      const controller = new AbortController();
      abortRef.current = controller;
      const seq = requestSeqRef.current;
      setNarrating(true);
      try {
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // deck + slide + voice let the server cache this audio as a
          // committed asset keyed by (deck, slide, voice) — repeat plays
          // become a disk hit, and each voice caches independently.
          body: JSON.stringify({ text, deck: deckId, slide: slideId, voice: voiceId }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`narrate failed: ${res.status}`);
        const blob = await res.blob();
        // A newer request (slide change or toggle-off) superseded this one
        // while it was in flight — drop the stale response instead of
        // playing audio for a slide we've already left.
        if (seq !== requestSeqRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setNarrating(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setNarrating(false);
        };
        await audio.play();
      } catch (err) {
        // AbortError (superseded request) is expected — only react if this is
        // still the current request, so an aborted stale one doesn't stomp
        // the newer request's state.
        if (seq !== requestSeqRef.current) return;
        setNarrating(false);
        const aborted = err instanceof DOMException && err.name === "AbortError";
        if (!aborted) {
          // A real failure (server unreachable, key removed mid-session,
          // Azure error) — stop offering a toggle that's guaranteed to fail
          // again on the next click.
          setNarrationAvailable(false);
          setNarrationOn(false);
        }
      }
    },
    [stopAudio, deckId],
  );

  useEffect(() => stopAudio, [stopAudio]);

  useEffect(() => {
    if (!deckId) return;
    const channel = new BroadcastChannel(`connected-deck-${deckId}`);
    channelRef.current = channel;
    channel.onmessage = (e) => {
      if (e.data?.type === "slide-change") {
        setSlideState({ index: e.data.index as number, total: e.data.total as number });
      } else if (e.data?.type === "deck-closed") {
        // Main deck exited — this popped-out notes window is now orphaned
        // (scoped to a deck that no longer exists), so close it with the deck.
        window.close();
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [deckId]);

  const { index } = slideState;
  const total = slideState.total || slides.length;
  const currentSlide = slides[index];
  const nextSlide = slides[index + 1];

  // Only decks that have migrated to Say/Context/Beat notes need the legend —
  // plain markdown-string notes have no categories to explain.
  const usesNoteKit = useMemo(
    () => slides.some((s) => s.notes != null && typeof s.notes !== "string"),
    [slides],
  );

  // Drives the main deck window (paging) from here, so the presenter can stay
  // on this screen — posts "goto" over the same channel DeckController listens on.
  const goto = useCallback((i: number) => {
    channelRef.current?.postMessage({ type: "goto", index: i });
  }, []);
  const goPrev = useCallback(() => goto(Math.max(0, index - 1)), [goto, index]);
  const goNext = useCallback(() => goto(Math.min(total - 1, index + 1)), [goto, index, total]);

  // Title read first, then the Say lines — Context/Beat stay presenter-only,
  // never spoken.
  const sayText = useMemo(() => slideSpokenText(currentSlide ?? {}), [currentSlide]);

  const toggleNarration = useCallback(() => {
    setNarrationOn((on) => !on);
  }, []);

  // Fires on toggle-on (plays the slide you're already looking at) and on
  // every slide change while the mode stays on (the "continues reading, one
  // slide to the next" behavior) — same effect handles both since both are
  // just "narrationOn or index changed, sync audio to match."
  useEffect(() => {
    if (narrationOn) {
      playNarration(sayText, currentSlide?.id, voice);
    } else {
      stopAudio();
    }
    // Re-runs on slide change and on voice change — switching voice mid-slide
    // cuts the current audio and re-narrates the same slide in the new voice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrationOn, index, voice]);

  return (
    <FluentProvider theme={darkTheme} style={{ colorScheme: "dark" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: DECK_BG,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#fff",
        }}
      >
        {/* Progress header */}
        <div
          style={{
            flexShrink: 0,
            padding: "12px 24px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              appearance="subtle"
              size="small"
              icon={<ChevronLeft20Regular />}
              onClick={goPrev}
              disabled={index === 0}
              title="Previous slide"
            />
            <span style={{ fontFamily: "monospace", fontSize: "13px", color: tokens.colorNeutralForeground3 }}>
              Slide {index + 1} of {total}
            </span>
            <Button
              appearance="subtle"
              size="small"
              icon={<ChevronRight20Regular />}
              onClick={goNext}
              disabled={index >= total - 1}
              title="Next slide"
            />
          </div>
          {/* Voice controls group — narration toggle + voice picker, centered
              between the slide nav and the timer. */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Button
              appearance={narrationOn ? "primary" : "subtle"}
              size="small"
              disabled={narrationAvailable !== true}
              icon={narrating ? <SpeakerMute20Regular /> : <Speaker220Filled />}
              onClick={toggleNarration}
              title={
                narrationAvailable === true
                  ? narrationOn
                    ? "Stop narration"
                    : "Play with narration"
                  : "Narration unavailable — set AZURE_SPEECH_KEY / AZURE_SPEECH_REGION in .env and restart npm run dev (see .env.example)"
              }
            />
            {/* Voice picker — sits next to the narration control. Value shows
                just the first name to fit the tight row; choice persists in
                localStorage (loadStoredVoice). */}
            <Dropdown
              size="small"
              disabled={narrationAvailable !== true}
              value={voiceName}
              selectedOptions={[voice]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) handleVoiceChange(data.optionValue);
              }}
              style={{ minWidth: "84px" }}
              title={
                narrationAvailable === true
                  ? "Narration voice"
                  : "Narration unavailable — set AZURE_SPEECH_KEY / AZURE_SPEECH_REGION in .env and restart npm run dev"
              }
            >
              {NARRATION_VOICES.map((v) => (
                <Option key={v.id} value={v.id} text={v.name}>
                  {v.name}
                </Option>
              ))}
            </Dropdown>
          </div>
          <PresenterTimer />
        </div>

        {/* Notes body */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {currentSlide?.title && (
            <h1
              style={{
                margin: "0 0 20px",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#fff",
              }}
            >
              {currentSlide.title}
            </h1>
          )}
          {usesNoteKit && typeof currentSlide?.notes !== "string" && (
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
              <ZoomControl zoom={notesZoom} setZoom={setNotesZoom} min={0.5} max={2} step={0.25} />
            </div>
          )}
          <div style={{ padding: "0 0 126px" }}>
            {currentSlide?.notes ? (
              typeof currentSlide.notes === "string" ? (
                <MarkdownViewer content={currentSlide.notes} maxHeight="100%" />
              ) : (
                <div style={{ maxWidth: "80ch", zoom: notesZoom }}>{currentSlide.notes}</div>
              )
            ) : (
              <span style={{ color: tokens.colorNeutralForeground3, fontStyle: "italic" }}>
                No notes
              </span>
            )}
          </div>
        </div>

        {/* Note-kit legend — pinned above the next-slide divider, bottom-left */}
        {usesNoteKit && (
          <div style={{ flexShrink: 0, padding: "0 24px 16px" }}>
            <NoteLegend />
          </div>
        )}

        {/* Next-slide preview — a scaled-down real render of the upcoming slide */}
        {nextSlide && (
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${BORDER}`,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: tokens.colorNeutralForeground3,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Next →
            </div>
            <div
              style={{
                width: `${CARD_W}px`,
                height: `${CARD_H}px`,
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "10px",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: `${CARD_SLIDE_W}px`,
                  height: `${CARD_SLIDE_H}px`,
                  transform: `scale(${CARD_SCALE})`,
                  transformOrigin: "top left",
                  display: "flex",
                  backgroundColor: DECK_BG,
                }}
              >
                <SlideRenderer slide={nextSlide} slideIndex={index + 1} isFullscreen={false} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                width: "16px",
                height: "16px",
                color: tokens.colorNeutralForeground4,
                fontSize: "12px",
                lineHeight: 1,
                cursor: "se-resize",
                userSelect: "none",
              }}
              title="Resize window"
            >
              ⋰
            </div>
          </div>
        )}
      </div>
    </FluentProvider>
  );
}
