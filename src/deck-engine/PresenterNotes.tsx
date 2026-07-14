import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FluentProvider, tokens, Button } from "@fluentui/react-components";
import {
  Play20Filled,
  Pause20Filled,
  ArrowReset20Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
} from "@fluentui/react-icons";
import { darkTheme } from "../theme";
import { DECKS } from "../decks/index";
import { MarkdownViewer } from "../shared/MarkdownViewer";
import { NoteLegend } from "./PresenterNoteKit";
import { SlideRenderer } from "./SlideRenderer";

const DECK_BG = "#07080f";
const BORDER = "#1e2030";

// Virtual full-slide canvas the next-slide card scales down from, so the same
// SlideRenderer (content + copy, 60/40 split) that drives the main deck
// window renders here too — the presenter sees the real upcoming slide, not
// just its text panel.
const CARD_SLIDE_W = 1280;
const CARD_SLIDE_H = 720;
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

  const [slideState, setSlideState] = useState<SlideState>({ index: 0, total: 0 });
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!deckId) return;
    const channel = new BroadcastChannel(`connected-deck-${deckId}`);
    channelRef.current = channel;
    channel.onmessage = (e) => {
      if (e.data?.type === "slide-change") {
        setSlideState({ index: e.data.index as number, total: e.data.total as number });
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
          <PresenterTimer />
        </div>

        {/* Notes body */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {usesNoteKit && (
            <div style={{ marginBottom: "24px" }}>
              <NoteLegend />
            </div>
          )}
          <div style={{ padding: "0 0 126px" }}>
            {currentSlide?.notes ? (
              typeof currentSlide.notes === "string" ? (
                <MarkdownViewer content={currentSlide.notes} maxHeight="100%" />
              ) : (
                <div style={{ maxWidth: "80ch" }}>{currentSlide.notes}</div>
              )
            ) : (
              <span style={{ color: tokens.colorNeutralForeground3, fontStyle: "italic" }}>
                No notes
              </span>
            )}
          </div>
        </div>

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
          </div>
        )}
      </div>
    </FluentProvider>
  );
}
