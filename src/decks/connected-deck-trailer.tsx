import type { CSSProperties, ReactNode } from "react";
import type { Deck, Slide } from "./types";
import { DeckState } from "./types";
import { CopyLinkButton } from "../deck-engine/CopyLinkButton";
import { createMakeSlide } from "../deck-engine/makeSlide";
import { Say, Beat, Context } from "../deck-engine/PresenterNoteKit";
import { CatDev } from "./cat-dev";

const CONNECTED_DECK_REPO_URL = "https://github.com/johnfrog76/connected-deck";

// ── Trailer — The Connected Deck Universe ────────────────────────────────────
// The deck that sells the machine itself: Sofa Mode and Presenter Mode as two
// worlds under one vocal-cloud sky.
//
// Scene language, four registers reused throughout: the vocal-cloud sky
// (internally lit vapor on near-black), the film set at night (haze, beams,
// rim light), podium mode (empty runway, truss, timing grid as edge-lights),
// and the sectional (cats on couches — the lean-back world).
//
// Structure: Act I-IV trailer scenes (1-9), then a run of teaser frames, then
// api-magic → invitation → closing. Everything on screen is CSS and SVG
// written in this file; there are no images and no animation library.

const palette = {
  skyBg: "#090b16", // near-black night sky — the universe's default backdrop
  loungeBg: "#211711", // warm dusk living room — Sofa Mode's world
  text: "#eef0f6",
  muted: "#98a0b6",
  order: "#8fa3c9", // structured blue-gray — presenter mode, timing grid
  energy: "#46c8f5", // neon azure — live voices, signals
  risk: "#ff4fa3", // hot magenta — collisions, chaos, remix strobe
  calm: "#f2ede2", // soft cloud white — sofa mode, low stakes
  signal: "#6fe89c", // UFO green — beams, CTAs, go-live
  // vocal-cloud tints — the internally lit vapor of the research board
  cloudViolet: "#8b7ab8",
  cloudPeach: "#e8a87c",
  cloudRose: "#d98ba8",
  // sectional materials — warm lamp-lit fabric
  sofa: "#7a4f3c",
  sofaDeep: "#57382b",
  cushion: "#96654c",
  lamp: "#f4c98a",
  ink: "#0d0f18",
} as const;

const fs = {
  eyebrow: "0.8rem",
  lead: "1.3rem",
  title: "2.55rem",
} as const;

const mono = "'Cascadia Code', 'Fira Code', 'Consolas', monospace";

// ── Copy-panel typography (right panel) ──────────────────────────────────────
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: fs.eyebrow,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: palette.energy,
        margin: "0 0 16px 0",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "22px",
          height: "2px",
          backgroundColor: palette.energy,
          borderRadius: "1px",
          flexShrink: 0,
        }}
      />
      {children}
    </p>
  );
}

function SlideTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: fs.title,
        fontWeight: 800,
        lineHeight: "1.25em",
        // descender room for background-clip text (g/j/y would clip otherwise)
        padding: "0 0 0.12em",
        margin: "0 0 10px 0",
        background: "linear-gradient(160deg, #f6f4ee 0%, #9fd4ef 52%, #a795cf 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 24px rgba(70,200,245,0.16))",
        whiteSpace: "pre-line",
      }}
    >
      {children}
    </h2>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: fs.lead, lineHeight: 1.7, color: palette.muted, margin: 0 }}>{children}</p>
  );
}

function CopyPanel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        padding: "40px 72px 40px 44px",
      }}
    >
      {children}
    </div>
  );
}

// Small monospace caption that sits directly on the art.
function ArtLabel({
  top,
  left,
  color = palette.muted,
  children,
}: {
  top: string;
  left: string;
  color?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        transform: "translateX(-50%)",
        fontFamily: mono,
        fontSize: "0.72vw",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
        textShadow: "0 2px 12px rgba(0,0,0,0.65)",
        zIndex: 8,
      }}
    >
      {children}
    </div>
  );
}

// ── Keyframes (mounted once per Stage; duplicate names across mounts are fine)
// rs-breathe / rs-zz re-declared so the imported CatDev breathes without
// mounting the remote-standup deck's own keyframes block.
function TrailerKeyframes() {
  return (
    <style>{`
      @keyframes tr-fadein    { from { opacity: 0; } to { opacity: 1; } }
      @keyframes tr-settle    { 0% { transform: translateY(18px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      @keyframes tr-pop       { 0% { transform: scale(0.3); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes tr-cloudbob  { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes tr-cloudpulse{ 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
      @keyframes tr-throb     { 0%, 84%, 100% { opacity: 0.5; } 8%, 22% { opacity: 1; } }
      @keyframes tr-ring      { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
      @keyframes tr-flow      { to { stroke-dashoffset: -256; } }
      @keyframes tr-draw      { to { stroke-dashoffset: 0; } }
      @keyframes tr-descend   { 0% { transform: translateY(-46vh); } 100% { transform: translateY(0); } }
      @keyframes tr-hover     { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
      @keyframes tr-beamon    { 0% { transform: scaleY(0); opacity: 0; } 60% { opacity: 0.9; } 100% { transform: scaleY(1); opacity: 0.75; } }
      @keyframes tr-beampulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.85; } }
      @keyframes tr-scatter   { 0% { transform: translate(0, 0) rotate(0deg); } 100% { transform: translate(var(--fx), var(--fy)) rotate(var(--frot)); } }
      @keyframes tr-snapin    { 0% { transform: translate(var(--fx), var(--fy)) rotate(var(--frot)); opacity: 0; } 70% { opacity: 1; } 100% { transform: translate(0, 0) rotate(0deg); opacity: 1; } }
      @keyframes tr-strobe    { 0%, 100% { opacity: 0; } 50% { opacity: 0.85; } }
      @keyframes tr-jitter    { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-3px, 2px); } 55% { transform: translate(3px, -2px); } 80% { transform: translate(-2px, -2px); } }
      @keyframes tr-cut       { 0%, 16%, 100% { opacity: 0; } 3%, 12% { opacity: 1; } }
      @keyframes tr-flash     { 0%, 70%, 100% { opacity: 0; } 8%, 60% { opacity: 1; } }
      @keyframes tr-tick      { 0% { opacity: 0; } 100% { opacity: 1; } }
      @keyframes tr-glow      { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.95; } }
      @keyframes tr-twinkle   { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.85; } }
      @keyframes tr-carousel  { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      @keyframes tr-cursor    { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      @keyframes tr-streamup  { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { transform: translateY(-46vh); opacity: 0; } }
      @keyframes tr-streamdown{ 0% { transform: translateY(-38vh); opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { transform: translateY(0); opacity: 0; } }
      @keyframes tr-spin      { to { transform: rotate(360deg); } }
      @keyframes tr-swell     { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-14px) scaleY(1.35); } }
      @keyframes tr-asciidrift{ 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
      @keyframes rs-breathe   { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
      @keyframes rs-zz        { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 0.8; } 100% { transform: translateY(-30px); opacity: 0; } }
    `}</style>
  );
}

// ── Stage ────────────────────────────────────────────────────────────────────
function Stage({ children, bg = palette.skyBg }: { children: ReactNode; bg?: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: bg,
      }}
    >
      <TrailerKeyframes />
      {children}
    </div>
  );
}

// Film-set haze: the darkness is a material. One static gradient layer.
function Haze({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background:
          "radial-gradient(ellipse at 30% 20%, rgba(139,122,184,0.10) 0%, transparent 55%)," +
          "radial-gradient(ellipse at 75% 70%, rgba(70,200,245,0.06) 0%, transparent 60%)," +
          "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 70%)",
        pointerEvents: "none",
      }}
    />
  );
}

// ── Atom: CloudVoice — internally lit vapor, never a cartoon puff ────────────
// Wrapper is static (left/top only); lobes and core carry the animation so no
// static transform is ever overridden.
function CloudVoice({
  left,
  top,
  w,
  tint,
  delay = 0,
  speaking = false,
  opacity = 1,
}: {
  left: string;
  top: string;
  w: string;
  tint: string;
  delay?: number;
  speaking?: boolean;
  opacity?: number;
}) {
  const lobes: { l: string; t: string; s: string; o: number }[] = [
    { l: "0%", t: "22%", s: "62%", o: 0.75 },
    { l: "30%", t: "0%", s: "70%", o: 0.9 },
    { l: "48%", t: "30%", s: "55%", o: 0.7 },
  ];
  return (
    <div style={{ position: "absolute", left, top, width: w, aspectRatio: "16 / 9", opacity }}>
      <div style={{ position: "absolute", inset: 0, animation: `tr-cloudbob 9s ease-in-out ${delay}s infinite` }}>
        {lobes.map((lb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: lb.l,
              top: lb.t,
              width: lb.s,
              aspectRatio: "1 / 0.8",
              borderRadius: "50%",
              background: `radial-gradient(circle at 42% 38%, ${tint}cc 0%, ${tint}55 45%, transparent 72%)`,
              filter: "blur(6px)",
              opacity: lb.o,
            }}
          />
        ))}
        {/* the lit core — the voice inside the vapor */}
        <div
          style={{
            position: "absolute",
            left: "34%",
            top: "22%",
            width: "36%",
            aspectRatio: "1 / 0.9",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${palette.calm}cc 0%, ${tint}88 40%, transparent 70%)`,
            filter: "blur(8px)",
            animation: `tr-cloudpulse ${speaking ? 2.4 : 6}s ease-in-out ${delay}s infinite`,
          }}
        />
        {speaking && (
          <div
            style={{
              position: "absolute",
              left: "38%",
              top: "26%",
              width: "28%",
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              border: `1.5px solid ${tint}aa`,
              animation: `tr-ring 3.2s ease-out ${delay + 0.6}s infinite`,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Atom: WaveLine — cognition as surf; amplitude is tension ─────────────────
const WAVE_CALM =
  "M -60 640 C 120 600 280 680 440 640 C 600 600 760 680 920 640 C 1080 600 1240 680 1400 640 C 1500 612 1580 660 1680 640";
const WAVE_JAGGED =
  "M -60 640 L 120 560 L 260 700 L 400 550 L 540 710 L 680 545 L 820 705 L 960 555 L 1100 700 L 1240 560 L 1380 695 L 1520 570 L 1680 660";

function WaveLine({
  d = WAVE_CALM,
  color = palette.energy,
  opacity = 0.8,
  speed = 7,
  width = 2.5,
}: {
  d?: string;
  color?: string;
  opacity?: number;
  speed?: number;
  width?: number;
}) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray="12 16"
        opacity={opacity}
        style={{ animation: `tr-flow ${speed}s linear infinite` }}
      />
    </svg>
  );
}

// ── Atom: UFOConsole — presenter-mode machine; beam is a film light ──────────
function UFOConsole({
  left,
  top,
  w,
  descend = false,
  beam = false,
  beamH = "52%",
  settled = false,
}: {
  left: string;
  top: string;
  w: string;
  /** play the one-shot arrival from above the frame */
  descend?: boolean;
  beam?: boolean;
  /** beam length as a % of stage height */
  beamH?: string;
  /** softened spotlight register — slower pulse, calmer light */
  settled?: boolean;
}) {
  return (
    <div style={{ position: "absolute", left, top, width: w, aspectRatio: "2 / 1", zIndex: 6 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: descend ? "tr-descend 2.2s cubic-bezier(0.2, 0.7, 0.3, 1) 0.3s both" : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, animation: "tr-hover 5s ease-in-out infinite" }}>
          {/* beam first — under the hull */}
          {beam && (
            <div
              style={{
                position: "absolute",
                left: "14%",
                top: "78%",
                width: "72%",
                height: beamH,
                clipPath: "polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)",
                background: `linear-gradient(180deg, ${palette.signal}88 0%, ${palette.signal}22 70%, transparent 100%)`,
                transformOrigin: "top center",
                animation: `tr-beamon 1.6s ease-out ${descend ? 2.6 : 0.4}s both, tr-beampulse ${settled ? 7 : 3.5}s ease-in-out ${descend ? 4.2 : 2}s infinite`,
              }}
            />
          )}
          {/* glass dome */}
          <div
            style={{
              position: "absolute",
              left: "30%",
              top: "6%",
              width: "40%",
              height: "52%",
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background: `linear-gradient(180deg, ${palette.energy}66 0%, ${palette.energy}18 80%)`,
              border: `1px solid ${palette.energy}55`,
              borderBottom: "none",
            }}
          />
          {/* hull */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "44%",
              width: "100%",
              height: "34%",
              borderRadius: "50%",
              background: `linear-gradient(180deg, #4a5570 0%, #232a3e 60%, #12141f 100%)`,
              border: `1px solid ${palette.order}44`,
              boxShadow: `0 14px 40px rgba(0,0,0,0.55), 0 0 34px ${palette.energy}22`,
            }}
          />
          {/* cockpit strip — the timing console */}
          {[26, 38, 50, 62, 74].map((x, i) => (
            <div
              key={x}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: "56%",
                width: "3.5%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                background: i % 2 === 0 ? palette.signal : palette.energy,
                animation: `tr-glow ${settled ? 4.5 : 2}s ease-in-out ${i * 0.35}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Atom: SlideShard — a fragment of any slide from any deck ─────────────────
function SlideShard({
  left,
  top,
  w = "5%",
  tint = palette.energy,
  anim,
  delay = 0,
  vars,
  z = 4,
}: {
  left: string;
  top: string;
  w?: string;
  tint?: string;
  /** e.g. "tr-scatter 1.6s ease-in 0.4s both" — pair with vars for fling paths */
  anim?: string;
  delay?: number;
  vars?: { fx: string; fy: string; frot: string };
  z?: number;
}) {
  return (
    <div
      style={
        {
          position: "absolute",
          left,
          top,
          width: w,
          aspectRatio: "16 / 10",
          background: "linear-gradient(170deg, #1b2030 0%, #10131f 100%)",
          border: `1px solid ${tint}88`,
          borderRadius: "3px",
          boxShadow: `0 6px 18px rgba(0,0,0,0.5), 0 0 12px ${tint}22`,
          zIndex: z,
          ...(vars
            ? { "--fx": vars.fx, "--fy": vars.fy, "--frot": vars.frot }
            : {}),
          animation: anim ?? `tr-settle 1s ease-out ${delay}s both`,
        } as CSSProperties
      }
    >
      <div style={{ position: "absolute", left: "12%", top: "24%", width: "44%", height: "2px", background: `${palette.calm}66` }} />
      <div style={{ position: "absolute", left: "12%", top: "48%", width: "62%", height: "2px", background: `${palette.calm}33` }} />
    </div>
  );
}

// ── Atom: CulturePanel — comic frame; holds the joke, hides the punchline ────
function CulturePanel({
  left,
  top,
  w,
  h,
  tint = palette.calm,
  anim,
  children,
  z = 5,
}: {
  left: string;
  top: string;
  w: string;
  h: string;
  tint?: string;
  anim?: string;
  children?: ReactNode;
  z?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        background: "linear-gradient(165deg, #171b28 0%, #0e1119 100%)",
        border: `3px solid ${tint}`,
        borderRadius: "4px",
        boxShadow: `7px 7px 0 rgba(0,0,0,0.45)`,
        // halftone texture — comic paper grain
        backgroundImage: `radial-gradient(circle, ${tint}14 1px, transparent 1.5px)`,
        backgroundSize: "9px 9px",
        zIndex: z,
        animation: anim ?? "tr-pop 0.7s ease-out both",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// A speech bubble whose words never resolve — the no-spoiler mechanic.
function BlurredBubble({ left, top, w }: { left: string; top: string; w: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        aspectRatio: "2.4 / 1",
        background: palette.calm,
        borderRadius: "45% 45% 45% 8%",
        filter: "blur(5px)",
        opacity: 0.85,
      }}
    >
      {[26, 44, 62].map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "16%",
            top: `${t}%`,
            width: `${58 - i * 12}%`,
            height: "9%",
            borderRadius: "3px",
            background: "#5a5648",
          }}
        />
      ))}
    </div>
  );
}

// ── Atom: SectionalLounge — the lean-back stage ──────────────────────────────
function SectionalLounge({
  left,
  top,
  w,
  silhouette = false,
}: {
  left: string;
  top: string;
  w: string;
  /** darker register for sky-world slides where the sofa is a cameo */
  silhouette?: boolean;
}) {
  const fabric = silhouette ? "#2c2029" : palette.sofa;
  const deep = silhouette ? "#1d1520" : palette.sofaDeep;
  const cushion = silhouette ? "#372833" : palette.cushion;
  return (
    <div style={{ position: "absolute", left, top, width: w, aspectRatio: "3.1 / 1", zIndex: 5 }}>
      {/* back cushions */}
      {[0, 34, 68].map((x, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: 0,
            width: "31%",
            height: "56%",
            borderRadius: "12% 12% 4% 4%",
            background: `linear-gradient(180deg, ${cushion} 0%, ${fabric} 90%)`,
            border: `1px solid ${deep}`,
          }}
        />
      ))}
      {/* seat */}
      <div
        style={{
          position: "absolute",
          left: "-2%",
          top: "48%",
          width: "104%",
          height: "34%",
          borderRadius: "10px",
          background: `linear-gradient(180deg, ${fabric} 0%, ${deep} 100%)`,
          border: `1px solid ${deep}`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
        }}
      />
      {/* chaise — the sectional's long leg, forward */}
      <div
        style={{
          position: "absolute",
          left: "72%",
          top: "62%",
          width: "30%",
          height: "34%",
          borderRadius: "10px",
          background: `linear-gradient(180deg, ${fabric} 0%, ${deep} 100%)`,
          border: `1px solid ${deep}`,
        }}
      />
      {/* arms */}
      {["-6%", "98%"].map((x, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: "34%",
            width: "8%",
            height: "50%",
            borderRadius: "40% 40% 8% 8%",
            background: `linear-gradient(180deg, ${cushion} 0%, ${deep} 100%)`,
            border: `1px solid ${deep}`,
          }}
        />
      ))}
      {/* legs */}
      {[6, 46, 88].map((x, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: "82%",
            width: "2.2%",
            height: "16%",
            background: silhouette ? "#161019" : "#3a2418",
            borderRadius: "0 0 3px 3px",
          }}
        />
      ))}
    </div>
  );
}

// The TV remote — within paw's reach, per the research board.
function Remote({
  left,
  top,
  w = "3.4%",
  tilt = 0,
}: {
  left: string;
  top: string;
  w?: string;
  /** static degrees — lay the remote down on a cushion (no animation here, so safe) */
  tilt?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        aspectRatio: "1 / 2.4",
        borderRadius: "6px",
        background: "linear-gradient(180deg, #2a2f3d 0%, #171b26 100%)",
        border: "1px solid #3c4356",
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        zIndex: 6,
      }}
    >
      {[22, 42, 62].map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "26%",
            top: `${t}%`,
            width: "48%",
            height: "10%",
            borderRadius: "3px",
            background: i === 0 ? palette.signal : "#4a5268",
            opacity: i === 0 ? 0.9 : 0.7,
          }}
        />
      ))}
    </div>
  );
}

// ── Atom: TimingGrid — runway edge-lights; discipline made visible ───────────
function TimingGrid({
  top = "84%",
  count = 16,
  delayBase = 0,
  color = palette.order,
}: {
  top?: string;
  count?: number;
  delayBase?: number;
  color?: string;
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "8%",
          top,
          width: "84%",
          height: "1.5px",
          background: `${color}44`,
          animation: `tr-fadein 1s ease-out ${delayBase}s both`,
        }}
      />
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${8 + (i * 84) / (count - 1)}%`,
            top: `calc(${top} - 7px)`,
            width: "3px",
            height: "14px",
            borderRadius: "2px",
            background: color,
            boxShadow: `0 0 10px ${color}88`,
            animation: `tr-tick 0.3s ease-out ${delayBase + i * 0.12}s both, tr-glow 4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </>
  );
}

// ── Atom: TrussLight — pre-show rig; a cone through the haze ─────────────────
function TrussLight({
  left,
  delay = 0,
  tint = palette.calm,
  h = "58%",
}: {
  left: string;
  delay?: number;
  tint?: string;
  h?: string;
}) {
  return (
    <div style={{ position: "absolute", left, top: "4%", width: "10%", height: h }}>
      {/* fixture */}
      <div
        style={{
          position: "absolute",
          left: "42%",
          top: 0,
          width: "16%",
          aspectRatio: "1 / 1.4",
          background: "#232837",
          border: `1px solid ${palette.order}55`,
          borderRadius: "3px",
          animation: `tr-fadein 0.4s ease-out ${delay}s both`,
        }}
      />
      {/* cone */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "10%",
          width: "100%",
          height: "90%",
          clipPath: "polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(180deg, ${tint}55 0%, ${tint}11 75%, transparent 100%)`,
          transformOrigin: "top center",
          animation: `tr-beamon 0.9s ease-out ${delay + 0.15}s both`,
        }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE VISUALS — Act I-IV
// ═════════════════════════════════════════════════════════════════════════════

// 1 — the vocal-cloud sky wakes up
function EstablishingVisual() {
  return (
    <Stage>
      <Haze />
      <CloudVoice left="6%" top="10%" w="30%" tint={palette.cloudPeach} speaking />
      <CloudVoice left="62%" top="26%" w="26%" tint={palette.cloudViolet} delay={1.4} />
      <CloudVoice left="34%" top="48%" w="20%" tint={palette.cloudRose} delay={2.6} opacity={0.7} />
      <WaveLine />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "38%",
          transform: "translateX(-50%)",
          fontFamily: mono,
          fontSize: "1.05vw",
          letterSpacing: "0.55em",
          color: `${palette.calm}cc`,
          textShadow: `0 0 30px ${palette.cloudViolet}`,
          whiteSpace: "nowrap",
          animation: "tr-fadein 3s ease-out 1.2s both",
        }}
      >
        THE CONNECTED DECK
      </div>
      <ArtLabel top="88%" left="50%">
        ideas travel as clouds, waves, and signals
      </ArtLabel>
    </Stage>
  );
}

// 2 — cast lineup: six atoms, rim-lit
function AtomLineupVisual() {
  return (
    <Stage>
      <Haze opacity={0.4} />
      <CloudVoice left="30%" top="4%" w="42%" tint={palette.cloudViolet} opacity={0.55} />
      <WaveLine opacity={0.4} />
      {/* CloudVoice — credited member of the cast */}
      <CloudVoice left="6%" top="26%" w="15%" tint={palette.cloudPeach} speaking />
      <ArtLabel top="58%" left="14%" color={palette.cloudPeach}>
        cloudvoice
      </ArtLabel>
      {/* UFOConsole */}
      <UFOConsole left="26%" top="30%" w="12%" />
      <ArtLabel top="58%" left="32%" color={palette.energy}>
        ufoconsole
      </ArtLabel>
      {/* SlideShard */}
      <SlideShard left="44%" top="34%" w="6.5%" delay={0.5} />
      <ArtLabel top="58%" left="47.5%" color={palette.order}>
        slideshard
      </ArtLabel>
      {/* CulturePanel — open, waiting for its joke */}
      <CulturePanel left="56%" top="33%" w="10%" h="7.5%" anim="tr-pop 0.7s ease-out 0.9s both" />
      <ArtLabel top="58%" left="61.5%" color={palette.calm}>
        culturepanel
      </ArtLabel>
      {/* SectionalCat on a corner of lounge */}
      <SectionalLounge left="72%" top="40%" w="20%" silhouette />
      <div style={{ position: "absolute", left: "78%", top: "38.8%", width: "8%", zIndex: 6 }}>
        <CatDev width="100%" zz={false} />
      </div>
      <ArtLabel top="58%" left="82%" color={palette.cloudRose}>
        sectionalcat
      </ArtLabel>
      <ArtLabel top="74%" left="50%" color={palette.energy}>
        waveline — the thread beneath them all
      </ArtLabel>
    </Stage>
  );
}

// 3 — domain physics, diagrammed on the sky itself
function DomainPhysicsVisual() {
  return (
    <Stage>
      <Haze opacity={0.35} />
      {/* accumulation — clouds stacking */}
      <CloudVoice left="4%" top="4%" w="17%" tint={palette.cloudViolet} opacity={0.9} />
      <CloudVoice left="10%" top="13%" w="15%" tint={palette.cloudViolet} delay={1} opacity={0.65} />
      <CloudVoice left="6%" top="22%" w="13%" tint={palette.cloudViolet} delay={2} opacity={0.4} />
      <ArtLabel top="42%" left="15%" color={palette.order}>
        accumulation
      </ArtLabel>
      {/* decay — one thinning to nothing */}
      <CloudVoice left="41%" top="10%" w="14%" tint={palette.cloudRose} opacity={0.28} />
      <ArtLabel top="34%" left="48%" color={palette.order}>
        decay
      </ArtLabel>
      {/* collision → growth */}
      <SlideShard
        left="66%"
        top="18%"
        w="4.5%"
        anim="tr-snapin 2.4s ease-in-out infinite"
        vars={{ fx: "-70px", fy: "-40px", frot: "-14deg" }}
      />
      <SlideShard
        left="72%"
        top="18%"
        w="4.5%"
        tint={palette.risk}
        anim="tr-snapin 2.4s ease-in-out infinite"
        vars={{ fx: "70px", fy: "-40px", frot: "14deg" }}
      />
      <div
        style={{
          position: "absolute",
          left: "69%",
          top: "17%",
          width: "4%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          border: `1.5px solid ${palette.risk}aa`,
          animation: "tr-ring 2.4s ease-out infinite",
        }}
      />
      <CloudVoice left="65%" top="26%" w="11%" tint={palette.cloudPeach} delay={0.8} opacity={0.7} />
      <ArtLabel top="46%" left="71%" color={palette.order}>
        collision → growth
      </ArtLabel>
      {/* pressure — the waveline swells */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <g style={{ animation: "tr-swell 6s ease-in-out infinite", transformOrigin: "50% 71%" }}>
          <path
            d={WAVE_CALM}
            fill="none"
            stroke={palette.energy}
            strokeWidth="2.5"
            strokeDasharray="12 16"
            opacity="0.8"
            style={{ animation: "tr-flow 7s linear infinite" }}
          />
        </g>
      </svg>
      <ArtLabel top="80%" left="50%" color={palette.order}>
        flow · pressure — amplitude is tension
      </ArtLabel>
    </Stage>
  );
}

// 4 — first tension: the console descends, the beam is a film light
function FirstTensionVisual() {
  return (
    <Stage>
      <Haze opacity={0.7} />
      <CloudVoice left="4%" top="8%" w="20%" tint={palette.cloudViolet} opacity={0.35} />
      <CloudVoice left="74%" top="16%" w="18%" tint={palette.cloudRose} opacity={0.25} delay={1.5} />
      <WaveLine opacity={0.25} />
      <UFOConsole left="38%" top="12%" w="24%" descend beam beamH="380%" />
      {/* where the beam lands: the first runway edge-lights flicker alive */}
      {[44, 48, 52, 56].map((x, i) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: "85%",
            width: "3px",
            height: "13px",
            borderRadius: "2px",
            background: palette.signal,
            boxShadow: `0 0 12px ${palette.signal}99`,
            animation: `tr-throb 2.8s ease-in-out ${3 + i * 0.4}s infinite, tr-fadein 0.5s ease-out ${3 + i * 0.3}s both`,
          }}
        />
      ))}
      <ArtLabel top="90%" left="50%" color={palette.signal}>
        a stage, arriving
      </ArtLabel>
    </Stage>
  );
}

// 5 — first collapse: shards tear loose, magenta strobe, panels jitter
function CollapseVisual() {
  const flings: { x: string; y: string; fx: number; fy: number; rot: number; d: number; tint?: string }[] = [
    { x: "46%", y: "40%", fx: -320, fy: -180, rot: -35, d: 0 },
    { x: "50%", y: "42%", fx: 300, fy: -220, rot: 40, d: 0.15, tint: palette.risk },
    { x: "48%", y: "46%", fx: -260, fy: 200, rot: -28, d: 0.3 },
    { x: "52%", y: "44%", fx: 340, fy: 160, rot: 30, d: 0.45 },
    { x: "44%", y: "44%", fx: -160, fy: -300, rot: -50, d: 0.6, tint: palette.risk },
    { x: "54%", y: "40%", fx: 180, fy: 280, rot: 45, d: 0.75 },
  ];
  return (
    <Stage>
      <Haze opacity={0.6} />
      {/* strobe layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, ${palette.risk}26 0%, transparent 60%)`,
          animation: "tr-strobe 0.9s ease-in-out infinite",
        }}
      />
      {flings.map((f, i) => (
        <SlideShard
          key={i}
          left={f.x}
          top={f.y}
          w="5%"
          tint={f.tint}
          anim={`tr-scatter 1.8s cubic-bezier(0.2, 0.6, 0.6, 1) ${f.d}s both`}
          vars={{ fx: `${f.fx}px`, fy: `${f.fy}px`, frot: `${f.rot}deg` }}
        />
      ))}
      {/* panels popping too fast to read */}
      <CulturePanel left="12%" top="16%" w="12%" h="8.5%" tint={palette.risk} anim="tr-cut 2.4s linear 0.2s infinite">
        <BlurredBubble left="14%" top="14%" w="58%" />
      </CulturePanel>
      <CulturePanel left="72%" top="60%" w="12%" h="8.5%" anim="tr-cut 2.4s linear 1s infinite">
        <BlurredBubble left="14%" top="14%" w="58%" />
      </CulturePanel>
      <CulturePanel left="70%" top="14%" w="10%" h="7%" tint={palette.cloudRose} anim="tr-cut 2.4s linear 1.7s infinite" />
      {/* the waveline loses its shape */}
      <WaveLine d={WAVE_JAGGED} color={palette.risk} opacity={0.7} speed={2.5} />
      <ArtLabel top="88%" left="50%" color={palette.risk}>
        remix, unsupervised
      </ArtLabel>
    </Stage>
  );
}

// 6 — held stillness: one pool of lamp light, the cat, nothing else
function StillnessVisual() {
  return (
    <Stage bg="#070808">
      {/* the single practical lamp — a pool of warmth in black */}
      <div
        style={{
          position: "absolute",
          left: "26%",
          top: "18%",
          width: "48%",
          height: "70%",
          background: `radial-gradient(ellipse at 50% 60%, ${palette.lamp}30 0%, ${palette.lamp}10 45%, transparent 72%)`,
        }}
      />
      <SectionalLounge left="30%" top="52%" w="36%" />
      <div style={{ position: "absolute", left: "41%", top: "50.5%", width: "13%", zIndex: 6 }}>
        <CatDev width="100%" pose="alert" zz={false} />
      </div>
      <ArtLabel top="86%" left="48%" color={`${palette.calm}77`}>
        . . .
      </ArtLabel>
    </Stage>
  );
}

// 7 — restoration: the empty runway wakes up, row by row
function RestorationVisual() {
  return (
    <Stage>
      <Haze opacity={0.55} />
      {/* truss bar */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "5%",
          width: "80%",
          height: "5px",
          background: "#1c2130",
          border: `1px solid ${palette.order}33`,
          borderRadius: "3px",
        }}
      />
      <TrussLight left="12%" delay={0.4} />
      <TrussLight left="30%" delay={0.9} tint={palette.energy} />
      <TrussLight left="48%" delay={1.4} />
      <TrussLight left="66%" delay={1.9} tint={palette.energy} />
      <TrussLight left="80%" delay={2.4} />
      <TimingGrid delayBase={2.8} />
      <UFOConsole left="41%" top="16%" w="18%" beam beamH="300%" settled />
      {/* the scattered shards, back in formation at the wings */}
      {[
        { x: "10%", y: "62%" },
        { x: "16%", y: "68%" },
        { x: "12%", y: "74%" },
        { x: "84%", y: "62%" },
        { x: "78%", y: "68%" },
        { x: "82%", y: "74%" },
      ].map((p, i) => (
        <SlideShard key={i} left={p.x} top={p.y} w="4.5%" delay={3.2 + i * 0.2} tint={palette.order} />
      ))}
      <ArtLabel top="90%" left="50%" color={palette.order}>
        presenter mode — pacing, timing, narration
      </ArtLabel>
    </Stage>
  );
}

// 8 — sofa mode: the other world, warm and unhurried
function SofaModeVisual() {
  return (
    <Stage bg={palette.loungeBg}>
      {/* living-room lamp wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 30% 30%, ${palette.lamp}26 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, ${palette.sofaDeep}66 0%, transparent 60%)`,
        }}
      />
      {/* a CloudVoice reading low overhead — the audiobook half */}
      <CloudVoice left="58%" top="4%" w="24%" tint={palette.cloudPeach} speaking opacity={0.8} />
      {/* the browsing carousel — slides drifting past at lazy speed.
          One animating wrapper, doubled content (poster-wall lesson). */}
      <div style={{ position: "absolute", left: 0, top: "26%", width: "100%", height: "16%", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "200%",
            height: "100%",
            display: "flex",
            gap: "4%",
            alignItems: "center",
            paddingLeft: "2%",
            animation: "tr-carousel 36s linear infinite",
          }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const tints = [palette.energy, palette.cloudViolet, palette.cloudRose, palette.order];
            return (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: "9%",
                  aspectRatio: "16 / 10",
                  background: "linear-gradient(170deg, #241b2e 0%, #150f1d 100%)",
                  border: `1.5px solid ${tints[i % 4]}77`,
                  borderRadius: "4px",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ position: "relative", left: "12%", top: "22%", width: "46%", height: "2.5px", background: `${palette.calm}55` }} />
                <div style={{ position: "relative", left: "12%", top: "40%", width: "64%", height: "2.5px", background: `${palette.calm}2e` }} />
              </div>
            );
          })}
        </div>
      </div>
      <SectionalLounge left="14%" top="56%" w="58%" />
      {/* the cat, full sprawl, zz on — seated on the left cushion, not levitating */}
      <div style={{ position: "absolute", left: "22%", top: "57.5%", width: "15%", zIndex: 6 }}>
        <CatDev width="100%" />
      </div>
      <Remote left="60%" top="70%" tilt={75} />
      <ArtLabel top="90%" left="43%" color={palette.lamp}>
        sofa mode — one cushion open
      </ArtLabel>
    </Stage>
  );
}

// 9 — remix montage: seven cuts, none readable
function MontageVisual() {
  // seven micro-motifs, one per greatest hit — each exits before it resolves
  const cuts: { x: string; y: string; w: string; h: string; tint: string; d: number; motif: ReactNode }[] = [
    {
      x: "8%", y: "12%", w: "22%", h: "15%", tint: palette.cloudPeach, d: 0,
      motif: (
        <div style={{ position: "absolute", left: "36%", top: "24%", width: "28%", aspectRatio: "1", borderRadius: "50%", background: `radial-gradient(circle, ${palette.calm}bb, ${palette.cloudPeach}44 60%, transparent 75%)`, filter: "blur(4px)" }} />
      ),
    },
    {
      x: "38%", y: "8%", w: "24%", h: "16%", tint: palette.calm, d: 1,
      motif: <BlurredBubble left="18%" top="22%" w="58%" />,
    },
    {
      x: "70%", y: "12%", w: "22%", h: "15%", tint: palette.energy, d: 2,
      motif: (
        <svg viewBox="0 0 100 60" style={{ position: "absolute", inset: "10%", width: "80%", height: "80%" }}>
          <path d="M 0 50 Q 30 46 50 24 Q 62 10 60 2" fill="none" stroke={palette.energy} strokeWidth="3" opacity="0.9" />
        </svg>
      ),
    },
    {
      x: "10%", y: "48%", w: "22%", h: "15%", tint: palette.signal, d: 3,
      motif: (
        <div style={{ position: "absolute", left: "20%", top: "40%", fontFamily: mono, fontSize: "0.9vw", color: palette.signal }}>
          &gt;&nbsp;
          <span style={{ display: "inline-block", width: "0.55vw", height: "1.1vw", background: palette.signal, verticalAlign: "text-bottom", animation: "tr-cursor 1.2s steps(1) infinite" }} />
        </div>
      ),
    },
    {
      x: "40%", y: "44%", w: "22%", h: "16%", tint: palette.cloudViolet, d: 4,
      motif: (
        <div style={{ position: "absolute", left: "14%", top: "16%", fontFamily: mono, fontSize: "0.85vw", lineHeight: 1.5, color: `${palette.cloudViolet}bb`, letterSpacing: "0.2em" }}>
          {"@#%*\n*%@#\n#@*%"}
        </div>
      ),
    },
    {
      x: "70%", y: "48%", w: "20%", h: "14%", tint: palette.order, d: 5,
      motif: (
        <div style={{ position: "absolute", left: "30%", top: "22%", width: "40%", aspectRatio: "1", animation: "tr-spin 8s linear infinite" }}>
          {[0, 90, 180, 270].map((r) => (
            <div key={r} style={{ position: "absolute", left: "50%", top: "50%", width: "44%", height: "18%", marginLeft: "-22%", marginTop: "-9%", borderRadius: "2px", border: `1.5px solid ${palette.order}aa`, background: "#141826", transform: `rotate(${r}deg) translateX(80%)` }} />
          ))}
        </div>
      ),
    },
    {
      x: "40%", y: "70%", w: "22%", h: "14%", tint: palette.risk, d: 6,
      motif: (
        <div style={{ position: "absolute", left: "20%", bottom: "10%", width: "60%", height: "70%", clipPath: "polygon(42% 100%, 58% 100%, 88% 0%, 12% 0%)", background: `linear-gradient(0deg, ${palette.risk}66, transparent 90%)` }} />
      ),
    },
  ];
  return (
    <Stage>
      <Haze opacity={0.4} />
      <WaveLine opacity={0.5} speed={3.5} />
      {cuts.map((c, i) => (
        <CulturePanel key={i} left={c.x} top={c.y} w={c.w} h={c.h} tint={c.tint} anim={`tr-cut 7s linear ${c.d}s infinite`}>
          {c.motif}
        </CulturePanel>
      ))}
      <ArtLabel top="93%" left="50%">
        seven decks · zero spoilers
      </ArtLabel>
    </Stage>
  );
}

// 17 — api magic: the beam becomes a conveyor; both worlds in one frame
function ApiMagicVisual() {
  return (
    <Stage>
      <Haze opacity={0.5} />
      <CloudVoice left="2%" top="4%" w="18%" tint={palette.cloudViolet} opacity={0.6} />
      <CloudVoice left="40%" top="2%" w="16%" tint={palette.cloudPeach} opacity={0.6} delay={1.2} />
      <CloudVoice left="76%" top="6%" w="16%" tint={palette.cloudRose} opacity={0.6} delay={2.4} />
      <UFOConsole left="34%" top="14%" w="17%" beam beamH="310%" settled />
      {/* shards streaming down the beam — any deck, any slide */}
      {[0, 1, 2].map((i) => (
        <SlideShard
          key={i}
          left={`${40.5 + i * 1.6}%`}
          top={`${58 - i * 4}%`}
          w="4%"
          tint={i === 1 ? palette.risk : palette.energy}
          anim={`tr-streamdown 3.6s linear ${i * 1.2}s infinite`}
        />
      ))}
      {/* snapping onto the grid, tile by tile */}
      <TimingGrid top="78%" count={10} color={palette.order} />
      {[0, 1, 2, 3].map((i) => (
        <SlideShard
          key={i}
          left={`${30 + i * 9}%`}
          top="80.5%"
          w="5%"
          tint={i === 2 ? palette.risk : palette.order}
          anim={`tr-snapin 1.4s ease-out ${1 + i * 0.9}s both`}
          vars={{ fx: "0px", fy: "-60px", frot: i % 2 ? "8deg" : "-8deg" }}
        />
      ))}
      {/* the sectional watches from the wings — cat does not lift its head */}
      <SectionalLounge left="74%" top="62%" w="24%" silhouette />
      <div style={{ position: "absolute", left: "80%", top: "60%", width: "9%", zIndex: 6 }}>
        <CatDev width="100%" zz={false} />
      </div>
      <ArtLabel top="92%" left="46%" color={palette.energy}>
        any slide · any deck · one engine
      </ArtLabel>
    </Stage>
  );
}

// 18 — invitation: decks become stars; two empty spaces, same meaning
function InvitationVisual() {
  const tints = [palette.energy, palette.cloudViolet, palette.cloudRose, palette.order];
  return (
    <Stage>
      <Haze opacity={0.4} />
      {/* the constellation — every deck ever presented, as faint frames */}
      {Array.from({ length: 18 }, (_, i) => {
        const t = i / 17;
        const x = 8 + t * 80;
        const y = 12 + Math.sin(t * Math.PI * 2.2 + 0.6) * 9 + (i % 3) * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: "2.6%",
              aspectRatio: "16 / 10",
              background: "#141828",
              border: `1px solid ${tints[i % 4]}88`,
              borderRadius: "2px",
              boxShadow: `0 0 12px ${tints[i % 4]}33`,
              animation: `tr-twinkle ${4 + (i % 3)}s ease-in-out ${i * 0.3}s infinite, tr-fadein 1s ease-out ${0.2 + i * 0.12}s both`,
            }}
          />
        );
      })}
      {/* clouds parting around one dark, slide-shaped gap */}
      <CloudVoice left="26%" top="34%" w="18%" tint={palette.cloudViolet} opacity={0.5} />
      <CloudVoice left="56%" top="36%" w="18%" tint={palette.cloudPeach} opacity={0.5} delay={1.6} />
      <div
        style={{
          position: "absolute",
          left: "44%",
          top: "38%",
          width: "12%",
          aspectRatio: "16 / 10",
          border: `1.5px dashed ${palette.signal}aa`,
          borderRadius: "4px",
          background: "rgba(7,9,14,0.6)",
          boxShadow: `0 0 40px ${palette.signal}22 inset`,
          animation: "tr-glow 5s ease-in-out infinite",
        }}
      />
      <ArtLabel top="52%" left="50%" color={palette.signal}>
        yours
      </ArtLabel>
      {/* below, the sectional glows warm with one open cushion */}
      <SectionalLounge left="38%" top="74%" w="24%" />
      <div style={{ position: "absolute", left: "40.5%", top: "73.5%", width: "8%", zIndex: 6 }}>
        <CatDev width="100%" />
      </div>
      <div
        style={{
          position: "absolute",
          left: "52%",
          top: "76%",
          width: "7%",
          height: "8%",
          borderRadius: "8px",
          border: `1.5px dashed ${palette.lamp}88`,
          animation: "tr-glow 5s ease-in-out 1s infinite",
        }}
      />
      <ArtLabel top="90%" left="50%" color={palette.lamp}>
        both empty spaces mean the same thing
      </ArtLabel>
    </Stage>
  );
}

// 19 — closing: end-card black, one pulse, the link
function ClosingVisual() {
  return (
    <Stage bg="#060709">
      <WaveLine color={palette.signal} opacity={0.7} speed={9} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: "translateX(-50%)",
          fontFamily: mono,
          fontSize: "1.5vw",
          letterSpacing: "0.5em",
          color: palette.signal,
          textShadow: `0 0 34px ${palette.signal}66`,
          whiteSpace: "nowrap",
          animation: "tr-fadein 2.5s ease-out 0.5s both",
        }}
      >
        TAKE THE ENGINE
      </div>
      {/* deck convention: repo button lives in the composition area */}
      <CopyLinkButton url={CONNECTED_DECK_REPO_URL} inverse />
    </Stage>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// THE TEASES — seven frames, each also a slot
//
// Built from the same atoms as the rest of the trailer (clouds, shards, panels,
// the WaveLine), so they stand on their own. They're also the deck's most
// reusable idea: each is a finished visual you can lift out and replace with
// something of your own, and the Say line above it still lands.
//
// Keep the Says when you swap a frame — they're written as the trailer's voice,
// not as descriptions of any particular picture.
// ═════════════════════════════════════════════════════════════════════════════

// Tease 1 — a lone cloud hears its own echo
function TeaseOriginVisual() {
  return (
    <Stage>
      <Haze opacity={0.6} />
      <CloudVoice left="18%" top="34%" w="16%" tint={palette.cloudPeach} speaking />
      {/* the answering pulse, from the darkness — we never see what echoed */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "72%",
            top: "42%",
            width: "6%",
            aspectRatio: "1",
            borderRadius: "50%",
            border: `2px solid ${palette.cloudPeach}aa`,
            animation: `tr-ring 3.2s ease-out ${1.9 + i * 1.1}s infinite`,
          }}
        />
      ))}
      <ArtLabel top="80%" left="50%">
        the first voice, answered
      </ArtLabel>
    </Stage>
  );
}

// Tease 2 — the joke you almost see
function TeaseCultureVisual() {
  return (
    <Stage>
      <Haze opacity={0.45} />
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "14%",
          width: "44%",
          height: "58%",
          background: `radial-gradient(ellipse at 30% 40%, ${palette.lamp}22 0%, transparent 65%)`,
        }}
      />
      <CulturePanel left="12%" top="26%" w="32%" h="23%" tint={palette.calm}>
        <BlurredBubble left="14%" top="14%" w="52%" />
      </CulturePanel>
      {/* second panel: a face mid-laugh — cut on the laugh */}
      <CulturePanel left="50%" top="32%" w="28%" h="20%" tint={palette.cloudRose} anim="tr-flash 5s linear 1.2s infinite">
        <svg viewBox="0 0 100 70" style={{ position: "absolute", inset: "12%", width: "76%", height: "76%" }}>
          <path d="M 26 26 Q 32 20 38 26" fill="none" stroke={palette.calm} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 62 26 Q 68 20 74 26" fill="none" stroke={palette.calm} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 34 44 Q 50 62 66 44 Q 50 52 34 44 Z" fill={palette.calm} />
        </svg>
      </CulturePanel>
      <ArtLabel top="76%" left="46%">
        cut on the laugh, never the line
      </ArtLabel>
    </Stage>
  );
}

// Tease 3 — the wave, cut before the drop
function TeaseSurfVisual() {
  return (
    <Stage>
      <Haze opacity={0.45} />
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <g style={{ animation: "tr-swell 7s ease-in-out infinite", transformOrigin: "50% 78%" }}>
          <path
            d="M -60 700 C 300 690 560 660 760 520 C 900 420 960 300 950 210"
            fill="none"
            stroke={palette.energy}
            strokeWidth="4"
            strokeDasharray="14 12"
            opacity="0.9"
            style={{ animation: "tr-flow 5s linear infinite" }}
          />
          <path
            d="M -60 760 C 340 750 620 720 830 590 C 980 495 1050 380 1045 290"
            fill="none"
            stroke={palette.energy}
            strokeWidth="2"
            strokeDasharray="8 14"
            opacity="0.45"
            style={{ animation: "tr-flow 6.5s linear infinite" }}
          />
        </g>
      </svg>
      {/* glyph foam at the crest */}
      {["{", "}", "=>", "<>", ";"].map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${57 + i * 2.4}%`,
            top: `${24 - i * 2.2}%`,
            fontFamily: mono,
            fontSize: "0.85vw",
            color: `${palette.calm}bb`,
            animation: `tr-twinkle 2.6s ease-in-out ${i * 0.4}s infinite`,
          }}
        >
          {g}
        </div>
      ))}
      <ArtLabel top="84%" left="50%" color={palette.energy}>
        the instant before the drop
      </ArtLabel>
    </Stage>
  );
}

// Tease 4 — two full seconds of stillness
function TeaseZenVisual() {
  return (
    <Stage bg="#070808">
      <div
        style={{
          position: "absolute",
          left: "32%",
          top: "6%",
          width: "36%",
          height: "62%",
          clipPath: "polygon(46% 0%, 54% 0%, 82% 100%, 18% 100%)",
          background: `linear-gradient(180deg, ${palette.lamp}44 0%, ${palette.lamp}14 75%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "36%",
          top: "52%",
          width: "28%",
          aspectRatio: "16 / 9",
          background: "linear-gradient(175deg, #141812 0%, #0b0d0a 100%)",
          border: `1px solid ${palette.signal}66`,
          borderRadius: "5px",
          boxShadow: `0 18px 44px rgba(0,0,0,0.6), 0 0 30px ${palette.signal}18`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 30% 20%, ${palette.signal}10 0%, transparent 60%)`,
          }}
        />
        <div style={{ position: "absolute", left: "8%", top: "14%", fontFamily: mono, fontSize: "0.8vw", color: palette.signal }}>
          &gt;&nbsp;
          <span
            style={{
              display: "inline-block",
              width: "0.5vw",
              height: "1vw",
              background: palette.signal,
              verticalAlign: "text-bottom",
              animation: "tr-cursor 2s steps(1) infinite",
            }}
          />
        </div>
      </div>
      <ArtLabel top="84%" left="50%" color={`${palette.calm}88`}>
        nothing moves. that is the point.
      </ArtLabel>
    </Stage>
  );
}

// Tease 5 — the mural runs past the edge
function TeaseAsciiVisual() {
  const GLYPHS = ["#", "@", "%", "*", "+", "=", "~", "/", "\\", "|", "-", "_"];
  return (
    <Stage>
      <Haze opacity={0.5} />
      {/* one drifting layer, doubled content — never per-glyph animation.
          Container runs past the right frame edge: deliberate bleed, the
          mural never ends on screen. */}
      <div style={{ position: "absolute", left: "22%", top: 0, width: "82%", height: "100%", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: "200%", animation: "tr-asciidrift 40s linear infinite" }}>
          {[0, 1].map((half) => (
            <div key={half} style={{ display: "flex", gap: "7%", height: "50%", paddingTop: "1%" }}>
              {Array.from({ length: 8 }, (_, c) => (
                <div
                  key={c}
                  style={{
                    fontFamily: mono,
                    fontSize: "1.1vw",
                    lineHeight: 2,
                    letterSpacing: "0.2em",
                    color: `${palette.cloudViolet}66`,
                    whiteSpace: "pre-line",
                  }}
                >
                  {[...GLYPHS.slice(c % GLYPHS.length), ...GLYPHS, ...GLYPHS.slice(0, c)].join("\n")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* the one ignited glyph — deliberate bleed: mural exits frame right */}
      <div
        style={{
          position: "absolute",
          left: "46%",
          top: "40%",
          fontFamily: mono,
          fontSize: "2.2vw",
          color: palette.signal,
          textShadow: `0 0 30px ${palette.signal}aa`,
          animation: "tr-glow 3.5s ease-in-out infinite",
        }}
      >
        @
      </div>
      <ArtLabel top="88%" left="46%" color={palette.cloudViolet}>
        we never see where it ends
      </ArtLabel>
    </Stage>
  );
}

// Tease 6 — the machine of slides, hatch opening
function TeaseSystemsVisual() {
  return (
    <Stage>
      <Haze opacity={0.5} />
      <div style={{ position: "absolute", left: "35%", top: "20%", width: "30%", aspectRatio: "1", animation: "tr-spin 26s linear infinite" }}>
        {Array.from({ length: 12 }, (_, i) => i * 30).map((r) => (
          <div
            key={r}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "24%",
              height: "10%",
              marginLeft: "-12%",
              marginTop: "-5%",
              borderRadius: "3px",
              border: `1.5px solid ${palette.order}aa`,
              background: "linear-gradient(170deg, #1b2030 0%, #10131f 100%)",
              boxShadow: `0 0 12px ${palette.order}33`,
              transform: `rotate(${r}deg) translateX(135%)`,
            }}
          />
        ))}
      </div>
      {/* the hatch of light at its center */}
      <div
        style={{
          position: "absolute",
          left: "46%",
          top: "31.5%",
          width: "8%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.calm}ee 0%, ${palette.energy}66 55%, transparent 75%)`,
          filter: "blur(3px)",
          animation: "tr-glow 4s ease-in-out infinite",
        }}
      />
      <ArtLabel top="82%" left="50%" color={palette.order}>
        hard cut before the first glimpse inside
      </ArtLabel>
    </Stage>
  );
}

// Tease 7 — every cloud opens at once; smash cut on the silhouette
function TeaseApiVisual() {
  return (
    <Stage>
      <Haze opacity={0.55} />
      <CloudVoice left="2%" top="56%" w="18%" tint={palette.cloudViolet} opacity={0.7} />
      <CloudVoice left="30%" top="64%" w="16%" tint={palette.cloudPeach} opacity={0.7} delay={1} />
      <CloudVoice left="58%" top="60%" w="16%" tint={palette.cloudRose} opacity={0.7} delay={2} />
      <CloudVoice left="80%" top="54%" w="16%" tint={palette.cloudViolet} opacity={0.7} delay={3} />
      {/* beams converging up toward something above the frame line */}
      {[
        { l: "8%", r: "-14deg" },
        { l: "36%", r: "-5deg" },
        { l: "62%", r: "5deg" },
        { l: "84%", r: "13deg" },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.l,
            top: "-6%",
            width: "5%",
            height: "68%",
            background: `linear-gradient(0deg, ${palette.signal}44 0%, ${palette.signal}0e 80%, transparent 100%)`,
            transform: `rotate(${b.r})`,
            transformOrigin: "bottom center",
          }}
        />
      ))}
      {/* shards streaming up the beams */}
      {[0, 1, 2, 3].map((i) => (
        <SlideShard
          key={i}
          left={`${10 + i * 24}%`}
          top="56%"
          w="3.6%"
          tint={palette.signal}
          anim={`tr-streamup 3.2s linear ${i * 0.8}s infinite`}
        />
      ))}
      {/* the silhouette, barely entering the frame — deliberate top bleed */}
      <div
        style={{
          position: "absolute",
          left: "24%",
          top: "-9%",
          width: "52%",
          height: "14%",
          borderRadius: "0 0 48% 48%",
          background: "#04050a",
          boxShadow: `0 8px 60px ${palette.signal}22`,
        }}
      />
      <ArtLabel top="86%" left="50%" color={palette.signal}>
        something enormous, cut to black
      </ArtLabel>
    </Stage>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// THE DECK
// ═════════════════════════════════════════════════════════════════════════════

const makeSlide = createMakeSlide({ CopyPanel, Eyebrow, SlideTitle, Lead });

// The seven teases. Each is a finished CSS-art frame that also works as a SLOT:
// swap in a frame of your own and the Say line above it still lands. That's the
// pattern worth stealing from this deck — write the narration first, then build
// (or replace) the visual under it.
const HIT_TEASES: Slide[] = [
  makeSlide({
    id: "tease-origin",
    title: "The First\nVoice",
    eyebrow: "Greatest Hits · Tease 1 of 7",
    lead: "One small cloud alone in a huge dark sky. It pulses — and something answers.",
    content: <TeaseOriginVisual />,
    notes: (
      <>
        <Beat>First tease — drop to a hush after the montage. Let the answering ring land.</Beat>
        <Say>Every universe starts with one voice hearing itself for the first time.</Say>
        <Context>
          Swap in your own opening frame here if you want — the Say line stays.
        </Context>
      </>
    ),
  }),
  makeSlide({
    id: "tease-culture",
    title: "The Joke You\nAlmost See",
    eyebrow: "Greatest Hits · Tease 2 of 7",
    lead: "A speech bubble fills — blurred. A face mid-laugh. Cut on the laugh, never the line.",
    content: <TeaseCultureVisual />,
    notes: (
      <>
        <Beat>Comic timing — let the second panel&apos;s cut-in get its beat before speaking.</Beat>
        <Say>The jokes are real. You had to be there. You can be.</Say>
        <Context>Slot: swap in your own comic-panel frame; keep the Say.</Context>
      </>
    ),
  }),
  makeSlide({
    id: "tease-surf",
    title: "Before\nthe Drop",
    eyebrow: "Greatest Hits · Tease 3 of 7",
    lead: "The WaveLine swells to full frame. Glyph foam at the crest. Cut on the instant before the drop.",
    content: <TeaseSurfVisual />,
    notes: (
      <>
        <Beat>Ride the swell — speak on the rise, not the peak.</Beat>
        <Say>Some ideas you don&apos;t explain. You ride them.</Say>
        <Context>Slot: swap in your own wave/cognition frame; keep the Say.</Context>
      </>
    ),
  }),
  makeSlide({
    id: "tease-zen",
    title: "All the Way\nDown",
    eyebrow: "Greatest Hits · Tease 4 of 7",
    lead: "One lamp. One console. One cursor blinking at breath speed. Two full seconds of nothing moving — in a trailer, that is forever.",
    content: <TeaseZenVisual />,
    notes: (
      <>
        <Beat>Match the frame: hold a real two-second silence before the Say.</Beat>
        <Say>One deck dares to slow all the way down.</Say>
        <Context>Slot: swap in your own stillness frame; keep the Say.</Context>
      </>
    ),
  }),
  makeSlide({
    id: "tease-ascii",
    title: "Eighty Columns\nWide",
    eyebrow: "Greatest Hits · Tease 5 of 7",
    lead: "Characters rain slowly. One glyph ignites. The mural keeps going past the edge of the frame — we never see where it ends.",
    content: <TeaseAsciiVisual />,
    notes: (
      <>
        <Beat>Let the drift carry — the camera is moving, the voice is calm.</Beat>
        <Say>An entire art form, eighty columns wide.</Say>
        <Context>Slot: swap in your own glyph-art frame; keep the Say.</Context>
      </>
    ),
  }),
  makeSlide({
    id: "tease-systems",
    title: "The Machine\nThat Makes Them",
    eyebrow: "Greatest Hits · Tease 6 of 7",
    lead: "Slides mesh like gear teeth — a machine made of slides, turning. A hatch of light opens at its center.",
    content: <TeaseSystemsVisual />,
    notes: (
      <>
        <Beat>Mechanical register — steady, factual, then cut the sentence off clean.</Beat>
        <Say>The machine that makes the machines that make the shows.</Say>
        <Context>Slot: swap in your own engine/system frame; keep the Say.</Context>
      </>
    ),
  }),
  makeSlide({
    id: "tease-api",
    title: "Cut to\nBlack",
    eyebrow: "Greatest Hits · Tease 7 of 7",
    lead: "Every cloud opens at once. Slides stream upward in beams, converging on something enormous just above the frame line.",
    content: <TeaseApiVisual />,
    notes: (
      <>
        <Beat>Biggest energy of the seven — build through the line, smash-cut into the next slide.</Beat>
        <Say>Any slide. Any deck. One engine.</Say>
        <Context>Slot: swap in your own connective-tissue frame; keep the Say.</Context>
      </>
    ),
  }),
];

// The full trailer sequence, with the tease section passed in rather than
// hardcoded. Everything else is fixed; only those seven frames vary.
//
// Why a parameter instead of a constant: it's the cheapest way to cut a second
// version of a deck. Call this with a different seven and you get the same
// trailer telling a different middle — no forking the file, no duplicated Acts.
export function buildTrailerSlides(hits: Slide[]): Slide[] {
  return [
    // ── ACT I — THE SKY ─────────────────────────────────────────────────────
    makeSlide({
      id: "establishing-shot",
      title: "The Connected\nDeck Universe",
      eyebrow: "Act I · The Sky",
      lead: "The universe opens above you — clouds drifting, voices warming up.",
      content: <EstablishingVisual />,
      notes: (
        <>
          <Beat>Slow open — let the first cloud finish a full pulse before speaking. 2s dwell.</Beat>
          <Say>
            Welcome to the Connected Deck Universe — where ideas travel as clouds, waves, and
            signals.
          </Say>
          <Context>
            Scene language: the vocal-clouds board. Internally lit vapor on near-black, type
            floating between clouds. Tone: cinematic, calm.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "atom-introduction",
      title: "Meet the\nAtoms",
      eyebrow: "Act I · The Cast",
      lead: "CloudVoice, UFOConsole, SlideShard, CulturePanel, SectionalCat, WaveLine — the characters that carry your ideas.",
      content: <AtomLineupVisual />,
      notes: (
        <>
          <Beat>Medium tempo — name each atom left to right as the lineup settles.</Beat>
          <Say>These are the atoms of the universe — the characters that carry your ideas.</Say>
          <Say>
            The voices live in the clouds. The console runs the stage. The shards are slides —
            fragments from any deck. The panels hold the jokes. And the cat has the best seat in the
            house.
          </Say>
          <Context>
            Cast-lineup frame, rim-lit film-set style. The SectionalCat is CatDev — the canon&apos;s
            recurring tenth engineer, cameo by import.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "domain-physics",
      title: "Domain\nPhysics",
      eyebrow: "Act I · The Rules",
      lead: "Flow, pressure, accumulation, decay, collision, growth — every deck obeys the same physics.",
      content: <DomainPhysicsVisual />,
      notes: (
        <>
          <Beat>Slow, explanatory — point at each labeled region as you name its force.</Beat>
          <Say>Every deck obeys the same physics — ideas move, collide, and grow.</Say>
          <Say>
            Clouds accumulate. Stale ones thin out and decay. When two fragments collide, they
            spark — and where they spark, something new forms.
          </Say>
          <Context>
            The sky becomes a diagram without stopping being a sky. Labels in order-blue, never
            stamped on the objects.
          </Context>
        </>
      ),
    }),
    // ── ACT II — TENSION ────────────────────────────────────────────────────
    makeSlide({
      id: "first-tension",
      title: "First\nTension",
      eyebrow: "Act II · The Signal",
      lead: "The sky darkens a stop. A signal appears — the UFOConsole descends, and its beam is a film light.",
      content: <FirstTensionVisual />,
      notes: (
        <>
          <Beat>Accelerate. Speak after the beam snaps on, while the edge-lights flicker alive.</Beat>
          <Say>A new mode arrives — Presenter Mode.</Say>
          <Say>Where the beam lands, a stage begins.</Say>
          <Context>
            Film-set board: a hard cone through haze, dust in the beam. The runway is born from the
            light — the first hint of podium mode.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "first-collapse",
      title: "First\nCollapse",
      eyebrow: "Act II · The Scatter",
      lead: "SlideShards tear loose and scatter. Panels pop too fast to read. The loudest frame in the deck.",
      content: <CollapseVisual />,
      notes: (
        <>
          <Beat>Fast — clipped delivery, match the strobe.</Beat>
          <Say>Remix begins — fragments from every deck collide.</Say>
          <Context>
            Risk-magenta strobe on every collision; the WaveLine spikes into a scribble. It should
            feel one cut from falling apart — that&apos;s the setup for the stillness.
          </Context>
        </>
      ),
    }),
    // ── ACT III — STILLNESS ─────────────────────────────────────────────────
    makeSlide({
      id: "held-stillness",
      title: "Held\nStillness",
      eyebrow: "Act III · The Blink",
      lead: "Hard cut to quiet. One pool of lamp light. The cat looks at the chaos we just left — at us — and blinks once.",
      content: <StillnessVisual />,
      notes: (
        <>
          <Beat>Hold 3 full seconds before the line. Do not rush this.</Beat>
          <Say>And then… stillness.</Say>
          <Context>
            The tension reset. Every shard, panel, and wave is gone — just the sectional corner,
            the cat upright, judging, comfortable. CatDev alert pose.
          </Context>
        </>
      ),
    }),
    // ── ACT IV — RESTORATION ────────────────────────────────────────────────
    makeSlide({
      id: "restoration",
      title: "Restoration",
      eyebrow: "Act IV · The Rig Wakes",
      lead: "The cat's blink cues the lights. Truss rows snap on down the empty runway; the timing grid draws itself like edge-lights.",
      content: <RestorationVisual />,
      notes: (
        <>
          <Beat>Warm. Let two truss rows land before speaking; finish as the grid completes.</Beat>
          <Say>Presenter Mode restores order — pacing, timing, narration.</Say>
          <Context>
            Podium-mode board: pre-show energy, house dark, rig armed. The console settles from
            siren to spotlight; scattered shards hold formation in the wings.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "sofa-mode-reveal",
      title: "Sofa\nMode",
      eyebrow: "Act IV · The Other World",
      lead: "Camera swings from the cold stage into warm lamp light. The sectional expands, the cat sprawls, slides drift by at browsing speed.",
      content: <SofaModeVisual />,
      notes: (
        <>
          <Beat>Slow, cozy — the register flip from stage to living room IS the argument.</Beat>
          <Say>Sofa Mode is your lounge — a place to browse, relax, and explore.</Say>
          <Say>
            Part comic book, part audiobook — the panels turn their own pages while a voice reads
            low overhead. And there&apos;s a cushion open, for you.
          </Say>
          <Context>
            The cat-couch board, whole: sprawl, remote in paw&apos;s reach, &ldquo;couch is
            full&rdquo; energy. Contrast against presenter mode, same sky over both.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "remix-montage",
      title: "Remix\nMontage",
      eyebrow: "Act IV · The Cuts",
      lead: "Seven panels flash by — a glyph, a wave, a cursor, a laugh — every one exiting a beat before it's readable.",
      content: <MontageVisual />,
      notes: (
        <>
          <Beat>Trailer-style quick cuts — punchy, then hand off to the teases.</Beat>
          <Say>Seven fragments — the kinds of stories this engine was built to tell.</Say>
          <Say>No spoilers. Only vibes.</Say>
          <Context>
            Each micro-motif previews one of the seven teases that follow. Punchlines almost land;
            bubbles blur before the words resolve.
          </Context>
        </>
      ),
    }),
    // ── THE GREATEST HITS (teases or borrowed frames, per caller) ───────────
    ...hits,
    // ── FINALE ──────────────────────────────────────────────────────────────
    makeSlide({
      id: "api-magic",
      title: "API\nMagic",
      eyebrow: "Finale · The Engine",
      lead: "The beam becomes a conveyor — shards stream down from every cloud and snap onto the grid, tile by tile. The cat doesn't lift its head.",
      content: <ApiMagicVisual />,
      notes: (
        <>
          <Beat>Medium — this is the reveal of the trick behind the last seven slides.</Beat>
          <Say>Here is the trick. Every frame you just watched is a React component.</Say>
          <Say>
            No images, no video, no animation library — just CSS and SVG, in one file you can
            open and read.
          </Say>
          <Context>
            Both worlds in one frame — runway grid building downstage, sectional watching from the
            wings. One magenta shard slots in perfectly anyway.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "universe-invitation",
      title: "Your Slide-Shaped\nSpace",
      eyebrow: "Finale · The Invitation",
      lead: "Pull back until decks become stars. The clouds part around one dark patch of sky — exactly slide-shaped. Below, one cushion sits open.",
      content: <InvitationVisual />,
      notes: (
        <>
          <Beat>Warm acceleration — the CTA setup. Point at the gap, then the cushion.</Beat>
          <Say>This universe expands when you create — your decks become new stars.</Say>
          <Say>Both empty spaces mean the same thing. One of them is yours.</Say>
          <Context>
            The constellation is every deck presented so far; the slide-shaped gap and the open
            cushion rhyme deliberately with the sofa-mode reveal.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "closing-thesis",
      title: "Take the\nEngine",
      eyebrow: "Finale · End Card",
      lead: "Full black. One WaveLine pulse under the words. The last thing on screen is a link, not a logo.",
      content: <ClosingVisual />,
      notes: (
        <>
          <Beat>Final hold. Speak, then let the end-card breathe until the room moves.</Beat>
          <Say>Go get this. Take the engine. Build your universe.</Say>
          <Say>The button copies the repo link — it&apos;s all open source.</Say>
          <Context>
            Deck convention: close with the give-away. CopyLinkButton bottom-right inside the
            Stage.
          </Context>
        </>
      ),
    }),
  ];
}

// The ceiling deck: what this engine looks like when someone actually finishes
// something with it. Every visual here is CSS and SVG written by hand in this
// one file — no images, no animation library, no external assets. That's the
// argument, and it's why the trailer ships as an example rather than a demo
// video: you can read the source of everything you just watched.
//
// It is also the deck that explains the app to a first-time visitor, which is
// why it opens by name on the launch page: Sofa Mode and Presenter Mode are
// characters in it before they're a switch you flip.
export const connectedDeckTrailerDeck: Deck = {
  id: "connected-deck-trailer",
  state: DeckState.Prod,
  title: "Trailer — The Connected Deck Universe",
  summary:
    "A cinematic trailer for the presentation engine itself, built entirely from hand-written CSS and SVG: talking clouds, a hovering console, drifting slide fragments, comic panels, and a couch-bound cat. It contrasts the engine's two viewing modes — a structured live-presentation stage and a relaxed lean-back lounge — at movie-trailer pace, swinging between tension, chaos, and calm. It closes with an invitation to take the engine and build your own.",
  tags: ["meta", "craft", "trailer"],
  slides: () => buildTrailerSlides(HIT_TEASES),
};
