import type { CSSProperties, ReactNode } from "react";
import type { Deck } from "./types";
import { DeckState } from "./types";
import { CopyLinkButton } from "../deck-engine/CopyLinkButton";
import { createMakeSlide } from "../deck-engine/makeSlide";
import { Say, Beat, Context } from "../deck-engine/PresenterNoteKit";
import { useViewport } from "../viewport";
import { CatDev } from "./cat-dev";

const CONNECTED_DECK_REPO_URL = "https://github.com/johnfrog76/connected-deck";

// ── Trailer — The Connected Deck Universe ────────────────────────────────────
//
// One material: the strand. A line of light, drawn as a wide low-opacity
// stroke (the glow) under a thin full-opacity core, both on the same `d`. No
// SVG filter touches a strand anywhere in this file — a knot of twenty
// blurred paths will not hold frame rate and some slides carry several knots.
//
// Every motion is one of the six domain physics: Flow (drift), Pressure (pull
// taut), Accumulation (gather into a knot), Decay (fray), Collision (snap),
// Growth (braid). The whole argument of the deck is the difference between
// even tension held on a grid (Presenter Mode, the Loom) and no tension at all
// (Sofa Mode, the Slack Net) — shown as the same material in two states.

// ── Palette ──────────────────────────────────────────────────────────────────
// Saturated on purpose: these hues should look wrong printed on paper and
// right on a dark screen. Named for what they MEAN, not what they look like.
const palette = {
  /** Decay — the near-black violet sky, and the colour a Fray thins into. */
  ink: "#0a0614",
  /** Pressure, Accumulation — electric cobalt. The Loom and its warp grid. */
  order: "#3d5cff",
  /** Flow — acid cyan. Voice Knots, the Tension Line at rest, every ring. */
  energy: "#19f2ff",
  /** Collision, Pressure — hot magenta. The 200ms before a snap, every shard. */
  risk: "#ff2e9a",
  /** Decay, Growth — warm cream. The Slack Net, the Cat's lamp, the cushion. */
  calm: "#ffe9b8",
  /** Growth — neon lime. The Braid, the slide-shaped gap, the give-away. */
  signal: "#b6ff2e",
} as const;

// The copy panel borrows the palette rather than inventing greys: body text is
// `calm` dimmed, so the right-hand narration stays in the deck's own world.
const COPY_MUTED = "rgba(255,233,184,0.62)";

const fs = { eyebrow: "0.75rem", lead: "1.25rem", title: "2.5rem" } as const;
const MONO = "'Cascadia Code', 'Fira Code', 'Consolas', monospace";

/** Stage user space. Every coordinate in this file is in these units. */
const W = 1200;
const H = 900;

/**
 * `slice` crops the stage's sides by a window-dependent amount (~60 units on a
 * 16:9 laptop). Discrete lights inside this band never land half-cropped.
 */
const SAFE_X: [number, number] = [110, W - 110];

/** Style objects that also carry CSS custom properties. */
type SVars = CSSProperties & Record<string, string | number | undefined>;

/** Percent of the stage, for HTML overlay elements sharing SVG coordinates. */
const px = (v: number) => `${(v / W) * 100}%`;
const py = (v: number) => `${(v / H) * 100}%`;

// Deterministic variation from an index — never Math.random(), so every
// capture, every reload and every machine draws the identical sky.
function rnd(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7 + 1.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Timing ───────────────────────────────────────────────────────────────────
// The tempo arc is the argument, so its numbers are named once here.
const EASE_SLOW = "cubic-bezier(0.45, 0, 0.55, 1)"; // Act I — ease-in-out
const EASE_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // Act II — ease-out-back
const EASE_QUAD = "cubic-bezier(0.45, 0, 0.55, 1)"; // Act IV — ease-in-out-quad
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * The only warning the deck ever gives: a strand turns magenta for exactly this
 * long before it snaps, every time, so the room learns to feel it coming.
 */
const SNAP_WARN_MS = 200;
/** Every Snap Shard in the deck runs one cycle this long, so 200ms is 200ms. */
const SNAP_CYCLE_MS = 2600;
/** Slide 16's convergence, ditto. */
const CONVERGE_CYCLE_MS = 5400;

/** A magenta pre-snap window of exactly SNAP_WARN_MS inside a looping cycle. */
function warnKeyframes(name: string, cycleMs: number, startMs: number): string {
  const a = ((startMs / cycleMs) * 100).toFixed(3);
  const b = (((startMs + SNAP_WARN_MS) / cycleMs) * 100).toFixed(3);
  const a2 = ((startMs / cycleMs) * 100 + 0.001).toFixed(3);
  const b2 = (((startMs + SNAP_WARN_MS) / cycleMs) * 100 + 0.001).toFixed(3);
  return `@keyframes ${name} { 0%, ${a}% { opacity: 0; } ${a2}%, ${b}% { opacity: 1; } ${b2}%, 100% { opacity: 0; } }`;
}

// ── Path builders ────────────────────────────────────────────────────────────

/** A sine laid out as quadratic half-periods — fixed geometry, moved by CSS. */
function sinePath(y: number, amp: number, period: number, x0 = -160, x1 = W + 260, phase = 0): string {
  const half = period / 2;
  let d = `M ${x0} ${y}`;
  let i = 0;
  for (let x = x0; x < x1; x += half) {
    const dir = (i + phase) % 2 === 0 ? -1 : 1;
    d += ` Q ${(x + half / 2).toFixed(1)} ${(y + dir * amp).toFixed(1)} ${(x + half).toFixed(1)} ${y}`;
    i += 1;
  }
  return d;
}

/** The same line under pressure: frequency tightened into a scribble. */
function scribblePath(y: number, amp: number, step: number, seed: number, x0 = -160, x1 = W + 260): string {
  let d = `M ${x0} ${y}`;
  let i = 0;
  let x = x0;
  while (x < x1) {
    x += step * (0.45 + rnd(i, seed + 2) * 1.3);
    const dir = i % 2 === 0 ? -1 : 1;
    const a = amp * (0.35 + rnd(i, seed) * 0.95);
    const axis = (rnd(i, seed + 6) - 0.5) * amp * 0.55;
    d += ` L ${x.toFixed(1)} ${(y + axis + dir * a).toFixed(1)}`;
    i += 1;
  }
  return d;
}

/** A loose ball of arcs — the strands a knot is wound from. */
function knotPaths(cx: number, cy: number, r: number, count: number, seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = rnd(i, seed) * Math.PI * 2;
    const b = a + 1.7 + rnd(i, seed + 9) * 2.6;
    const rr = r * (0.72 + rnd(i, seed + 17) * 0.38);
    const p0x = cx + Math.cos(a) * rr;
    const p0y = cy + Math.sin(a) * rr * 0.86;
    const p1x = cx + Math.cos(b) * rr;
    const p1y = cy + Math.sin(b) * rr * 0.86;
    const c1x = cx + Math.cos(a + 1.25) * rr * 1.42;
    const c1y = cy + Math.sin(a + 1.25) * rr * 1.18;
    const c2x = cx + Math.cos(b - 1.25) * rr * 1.42;
    const c2y = cy + Math.sin(b - 1.25) * rr * 1.18;
    out.push(
      `M ${p0x.toFixed(1)} ${p0y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p1x.toFixed(1)} ${p1y.toFixed(1)}`,
    );
  }
  return out;
}

// ── Keyframes (one block, mounted inside every Stage) ────────────────────────
function DeckKeyframes() {
  return (
    <style>{`
      /* Every name here is prefixed cdu- except the three the imported CatDev
         needs (rs-breathe, rs-zz, cd-eartwitch): a deck that stages the cat
         must declare the cat's keyframes, or it stands perfectly still. */

      /* Entrances animate FROM a hidden keyframe with the visible state as the
         base style, filled backwards — so a frozen poster shows the slide, not
         an empty stage. Things invisible at rest carry opacity:0 statically. */
      @keyframes cdu-fade      { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cdu-rise      { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }

      /* Accumulation: a knot breathes on a slow cycle. */
      @keyframes cdu-breathe   { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.055); } }
      /* Flow: the sky drifts sideways; the camera never moves, the strands do. */
      @keyframes cdu-flow      { from { transform: translateX(0); } to { transform: translateX(calc(-1 * var(--flow, 320px))); } }
      @keyframes cdu-drift     { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(var(--dx, 18px), var(--dy, -12px)); } }
      /* Pressure: a strand pulls out of a knot toward whoever is listening. */
      @keyframes cdu-pullout   { from { transform: scaleX(0.02); } to { transform: scaleX(1); } }
      /* The plucked string's harmonic, travelling the taut strand. */
      @keyframes cdu-travel    { 0% { transform: translateX(0); opacity: 0; } 12% { opacity: 1; } 80% { opacity: 0.9; } 100% { transform: translateX(var(--len, 200px)); opacity: 0; } }
      /* Draw-in by pathLength — never paired with non-scaling-stroke. */
      @keyframes cdu-draw      { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
      /* Collision: the freed segment tumbles end over end. */
      @keyframes cdu-tumble    { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 12% { opacity: 1; } 100% { transform: translate(var(--tx, 120px), var(--ty, 90px)) rotate(var(--rot, 220deg)); opacity: 0; } }
      /* One Snap Shard's life: stretch 600ms, hold 200ms, snap, tumble 800ms. */
      @keyframes cdu-taut      { 0% { transform: scaleX(0.66); } 23% { transform: scaleX(1); } 30.7% { transform: scaleX(1.02); } 31% { transform: scaleX(0.28); } 44% { opacity: 1; } 45%, 99% { opacity: 0; } 100% { opacity: 1; transform: scaleX(0.66); } }
      @keyframes cdu-shardgo   { 0%, 31% { transform: translate(0, 0) rotate(0deg); opacity: 0; } 31.5% { opacity: 1; } 62% { transform: translate(var(--tx, 120px), var(--ty, 90px)) rotate(var(--rot, 220deg)); opacity: 0.9; } 70%, 100% { transform: translate(var(--tx, 120px), var(--ty, 90px)) rotate(var(--rot, 220deg)); opacity: 0; } }
      /* Pressure held in order: the Loom descends, its warps land, it settles. */
      @keyframes cdu-descend   { from { transform: translateY(-420px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes cdu-lighton   { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      /* Decay: tension let go — the net sags into its resting curve. */
      @keyframes cdu-sag       { from { transform: scaleY(0.08); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
      /* Growth: the net widens by one more strand whenever someone arrives. */
      @keyframes cdu-widen     { from { transform: scaleX(0.04); opacity: 0; } to { transform: scaleX(1); opacity: 1; } }
      /* Collision: a hard bright node where two strands touch. */
      @keyframes cdu-spark     { 0%, 92%, 100% { opacity: 0; transform: scale(0.4); } 2% { opacity: 1; transform: scale(1.35); } 7% { opacity: 0; transform: scale(1.8); } }
      @keyframes cdu-grow      { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1); opacity: 1; } 92% { opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
      /* Decay: a strand's end splits into fibres and thins to ink. */
      @keyframes cdu-fray      { 0% { transform: translate(0, 0); opacity: 0.9; } 55% { opacity: 0.55; } 100% { transform: translate(var(--fx, 90px), var(--fy, -30px)); opacity: 0; } }
      /* A Panel's four strands arrive from four edges and snap shut. */
      @keyframes cdu-slam      { from { transform: translate(var(--sx, 0px), var(--sy, -260px)); opacity: 0; } to { transform: translate(0, 0); opacity: 1; } }
      @keyframes cdu-corner    { 0% { opacity: 0; transform: scale(0.3); } 30% { opacity: 1; transform: scale(1.5); } 100% { opacity: 0; transform: scale(0.6); } }
      /* Pressure: the line's amplitude climbs, then rings down to flat. */
      @keyframes cdu-ringdown  { 0% { transform: scaleY(1); } 60% { transform: scaleY(0.16); } 100% { transform: scaleY(0.05); } }
      @keyframes cdu-swell     { 0% { transform: scaleY(0.1); } 72% { transform: scaleY(1); } 100% { transform: scaleY(0.94); } }
      @keyframes cdu-hum       { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.5); } }
      /* The Montage's held frame: one dot at breath speed, and nothing else. */
      @keyframes cdu-breath    { 0%, 100% { opacity: 0.22; transform: scale(0.72); } 50% { opacity: 1; transform: scale(1.25); } }
      @keyframes cdu-twinkle   { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      /* Accumulation as pattern: eighty columns fall as one body. */
      @keyframes cdu-columns   { from { transform: translateY(0); } to { transform: translateY(var(--fall, 120px)); } }
      /* Gear teeth made of warp threads, turning a quarter at a time. */
      @keyframes cdu-quarter   { 0%, 8% { transform: rotate(0deg); } 42%, 58% { transform: rotate(90deg); } 92%, 100% { transform: rotate(180deg); } }
      @keyframes cdu-quarterrev{ 0%, 8% { transform: rotate(0deg); } 42%, 58% { transform: rotate(-90deg); } 92%, 100% { transform: rotate(-180deg); } }
      /* Flow at maximum: every strand streams at one point above the frame. */
      @keyframes cdu-stream    { 0% { transform: translate(0, 0); opacity: 0.85; } 20% { opacity: 1; } 62% { transform: translate(var(--sx, 0px), -560px); opacity: 0; } 100% { transform: translate(var(--sx, 0px), -560px); opacity: 0; } }
      @keyframes cdu-toblack   { 0%, 58% { opacity: 0; } 60%, 92% { opacity: 1; } 100% { opacity: 0; } }
      /* The register flip: cold grid out left, warm net in from the right. */
      @keyframes cdu-exitleft  { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-720px); opacity: 0; } }
      @keyframes cdu-enterright{ from { transform: translateX(660px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      /* A Panel turning its own page, slow, in the distance. */
      @keyframes cdu-page      { 0%, 62% { transform: scaleX(1); } 78% { transform: scaleX(0.06); } 100% { transform: scaleX(1); } }
      /* The laugh: a Panel's strands vibrating. No faces, no figures. */
      @keyframes cdu-laugh     { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-4px, 3px) rotate(-1.1deg); } 62% { transform: translate(5px, -3px) rotate(1.3deg); } }
      /* Growth: shards braid onto the grid, each tile brighter than its strands. */
      @keyframes cdu-tile      { 0% { opacity: 0; transform: scale(0.5); } 55% { opacity: 1; transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes cdu-slotin    { 0% { transform: translateY(-300px); opacity: 0; } 70% { opacity: 1; } 100% { transform: translateY(0); opacity: 0; } }
      /* Act III: the blink that restores the lights. A cut, not a tween. */
      @keyframes cdu-blink     { 0%, 74.9% { opacity: 0; } 75%, 78.4% { opacity: 1; } 78.5%, 100% { opacity: 0; } }
      /* The one-shot hatch of light at the centre of the smallest Loom. */
      @keyframes cdu-hatch     { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      /* Act II: a warp thread that has come loose still hangs by its top end. */
      @keyframes cdu-whip      { 0%, 100% { transform: rotate(var(--sw, 7deg)); } 50% { transform: rotate(calc(-1 * var(--sw, 7deg))); } }

      /* Act II: the Loom arrives with force — falls through the top edge,
         overshoots the landing, bounces once and sets. */
      @keyframes cdu-plunge    { 0% { transform: translateY(-680px); opacity: 0; animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45); } 7% { opacity: 1; } 60% { transform: translateY(44px); animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); } 80% { transform: translateY(-14px); } 100% { transform: translateY(0); } }
      /* An edge-light that flares as it lands, then settles to its held glow. */
      @keyframes cdu-glowon    { 0% { transform: scale(0); opacity: 0; } 35% { transform: scale(2.3); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      /* The pre-snap tremor: a nervous flicker that never fully goes dark. */
      @keyframes cdu-flicker   { 0%, 100% { opacity: 0.45; } 18% { opacity: 1; } 30% { opacity: 0.3; } 52% { opacity: 0.9; } 70% { opacity: 0.5; } }
      /* Ring-down residue: a line fades to a ghost of itself, not to nothing. */
      @keyframes cdu-ghost     { from { opacity: 1; } to { opacity: var(--ghost, 0.12); } }
      /* Act IV: a returning shard drifts in from the wings and sets down level. */
      @keyframes cdu-wing      { 0% { transform: translate(var(--wx, -600px), var(--wy, -80px)) rotate(var(--wr, -40deg)); opacity: 0; } 40% { opacity: 1; } 100% { transform: translate(0, 0) rotate(0deg); opacity: 1; } }
      /* A truss row drops the last few inches onto the stage. */
      @keyframes cdu-rowdrop   { from { transform: translateY(-46px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      /* The laugh, pushed: a Panel shaking hard about its own centre. */
      @keyframes cdu-guffaw    { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 20% { transform: translate(-9px, 5px) rotate(-1.5deg); } 45% { transform: translate(8px, -6px) rotate(1.3deg); } 70% { transform: translate(-6px, -3px) rotate(-0.8deg); } }
      /* Act II, looping: a Panel's strands slam shut, hold a breath, and fly
         open again the way they came — too fast to read. Shut is the resting
         state, so a frozen poster shows a closed frame. */
      @keyframes cdu-slamloop  { 0% { transform: translate(var(--sx, 0px), var(--sy, -260px)); opacity: 0; } 10% { opacity: 1; } 30% { transform: translate(0, 0); } 48% { transform: translate(0, 0); opacity: 1; } 72% { opacity: 0.5; } 86% { transform: translate(var(--sx, 0px), var(--sy, -260px)); opacity: 0; } 100% { transform: translate(var(--sx, 0px), var(--sy, -260px)); opacity: 0; } }
      @keyframes cdu-cornerloop{ 0%, 28% { opacity: 0; transform: scale(0.3); } 31% { opacity: 1; transform: scale(1.5); } 41%, 100% { opacity: 0; transform: scale(0.6); } }
      @keyframes cdu-bubbleloop{ 0%, 24% { opacity: 0; } 32%, 50% { opacity: 1; } 64%, 100% { opacity: 0; } }
      /* Every strand cut at once: the halves part, one up and one down, and
         the whole set is back a beat later. Whole is the resting state. */
      @keyframes cdu-cutup     { 0%, 26% { transform: translate(0, 0); opacity: 1; } 30% { transform: translate(0, -8px); opacity: 1; } 88% { transform: translate(var(--sx, 0px), -30px); opacity: 0.75; } 92% { transform: translate(var(--sx, 0px), -34px); opacity: 0; } 93% { transform: translate(0, 0); opacity: 0; } 100% { transform: translate(0, 0); opacity: 1; } }
      @keyframes cdu-cutdown   { 0%, 26% { transform: translate(0, 0); opacity: 1; } 30% { transform: translate(0, 8px); opacity: 1; } 88% { transform: translate(calc(-1 * var(--sx, 0px)), 30px); opacity: 0.75; } 92% { transform: translate(calc(-1 * var(--sx, 0px)), 34px); opacity: 0; } 93% { transform: translate(0, 0); opacity: 0; } 100% { transform: translate(0, 0); opacity: 1; } }
      @keyframes cdu-cutflash  { 0%, 25% { opacity: 0; } 27%, 31% { opacity: 1; } 38%, 100% { opacity: 0; } }
      /* The cat rides in with the net it is lying in. Percent of the overlay,
         which is the stage's own width, so it matches the net's 660 units. */
      @keyframes cdu-enterright-overlay { from { transform: translateX(55%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

      /* CatDev's own contract — declared by every deck that stages him. */
      @keyframes rs-breathe    { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
      @keyframes rs-zz         { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 0.8; } 100% { transform: translateY(-30px); opacity: 0; } }
      @keyframes cd-eartwitch  { 0%, 100% { transform: rotate(0deg); } 40% { transform: rotate(-13deg); } }

      ${warnKeyframes("cdu-warn", SNAP_CYCLE_MS, 600)}
      ${warnKeyframes("cdu-warn-converge", CONVERGE_CYCLE_MS, 1400)}
    `}</style>
  );
}

// ── Stage ────────────────────────────────────────────────────────────────────
// A near-black sky with the deck's one keyframe block, an SVG in stage user
// space, and an HTML overlay pinned to exactly the same coordinates.
//
// Framing: on a 16:9 screen `slice` shows x≈60..1140 of the stage, and every
// composition was judged in that window. A portrait phone's near-square art
// box would slice twice as deep (x≈116..1084) and cut knots, panels, the net
// and the give-away off both sides. So on compact the stage FITS that same
// judged window to the box width instead (`meet` on x 60..1140), and the
// spare height is filled by the strands' own overshoot (overflow visible) on
// the same ink ground — the phone sees the desktop composition, smaller.
const COMPACT_X0 = 60;
const COMPACT_VW = W - 2 * COMPACT_X0;

function Stage({ children, overlay, bg = palette.ink }: { children: ReactNode; overlay?: ReactNode; bg?: string }) {
  const { isMobile: compact } = useViewport();
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: bg }}>
      <DeckKeyframes />
      <svg
        viewBox={compact ? `${COMPACT_X0} 0 ${COMPACT_VW} ${H}` : `0 0 ${W} ${H}`}
        preserveAspectRatio={compact ? "xMidYMid meet" : "xMidYMid slice"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: compact ? "visible" : "hidden" }}
        aria-hidden
      >
        {children}
      </svg>
      {overlay != null && (
        // `slice` renders the viewBox at exactly the panel's height, centred —
        // so a box of the same ratio pinned to full height lands every HTML
        // element (the cat, slide 3's labels, the give-away button) on the
        // same coordinates the strands use. On compact the fitted window is
        // the box's width, so the full stage is that width scaled by W/COMPACT_VW.
        <div
          style={
            compact
              ? {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: `${(W / COMPACT_VW) * 100}%`,
                  aspectRatio: `${W} / ${H}`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }
              : {
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  height: "100%",
                  aspectRatio: `${W} / ${H}`,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }
          }
        >
          {overlay}
        </div>
      )}
    </div>
  );
}

// ── The material: a Strand ───────────────────────────────────────────────────
// A wide low-opacity stroke under a thin full-opacity core, same `d`. The glow
// is geometry, not a filter. Everything else in this file is made of these.
function Strand({
  d,
  color = palette.energy,
  w = 2.4,
  glow = 9,
  glowOpacity = 0.18,
  opacity = 1,
  anim,
  drawMs,
  drawDelayMs = 0,
  style,
}: {
  d: string;
  color?: string;
  w?: number;
  glow?: number;
  glowOpacity?: number;
  opacity?: number;
  anim?: string;
  drawMs?: number;
  drawDelayMs?: number;
  style?: SVars;
}) {
  // stroke-dasharray/offset are inherited, so one animation on the group draws
  // both strokes: two paths, one animation, no filter, no non-scaling-stroke.
  const drawStyle: SVars = drawMs
    ? {
        strokeDasharray: 1,
        strokeDashoffset: 0,
        animation: `${anim ? `${anim}, ` : ""}cdu-draw ${drawMs}ms linear ${drawDelayMs}ms backwards`,
      }
    : { animation: anim };
  return (
    <g style={{ ...drawStyle, ...style }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={glow}
        strokeOpacity={glowOpacity * opacity}
        strokeLinecap="round"
        pathLength={drawMs ? 1 : undefined}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeOpacity={opacity}
        strokeLinecap="round"
        pathLength={drawMs ? 1 : undefined}
      />
    </g>
  );
}

// ── Atom: Voice Knot ─────────────────────────────────────────────────────────
// A CloudVoice. An idea gathered up until it has enough strands to speak.
// Twenty paths is the cap; "thirty to sixty" is the look, not the path count.
function VoiceKnot({
  cx,
  cy,
  r,
  color = palette.energy,
  count = 13,
  seed = 1,
  breatheMs = 4000,
  delayMs = 0,
  opacity = 1,
  w = 2.2,
  glow = 8,
  coreColor,
  speak,
  anim,
}: {
  cx: number;
  cy: number;
  r: number;
  color?: string;
  count?: number;
  seed?: number;
  breatheMs?: number;
  delayMs?: number;
  opacity?: number;
  w?: number;
  glow?: number;
  coreColor?: string;
  /** One strand pulls taut out of the knot and a ring of light travels it. */
  speak?: { angle: number; len: number; delayMs?: number };
  anim?: string;
}) {
  const paths = knotPaths(cx, cy, r, Math.min(count, 20), seed);
  const sd = speak?.delayMs ?? 400;
  return (
    <g style={{ opacity, animation: anim }}>
      <g
        style={{
          animation: `cdu-breathe ${breatheMs}ms ${EASE_SLOW} ${delayMs}ms infinite`,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        {/* the lit core, under the winding — the voice inside the strands */}
        <circle cx={cx} cy={cy} r={r * 0.62} fill={color} opacity={0.11} />
        <circle cx={cx} cy={cy} r={r * 0.3} fill={coreColor ?? color} opacity={0.55} />
        {paths.map((d, i) => (
          <Strand key={i} d={d} color={color} w={w} glow={glow} opacity={0.5 + rnd(i, seed + 3) * 0.5} />
        ))}
      </g>
      {speak && (
        <g transform={`rotate(${speak.angle} ${cx} ${cy})`}>
          <Strand
            d={`M ${cx} ${cy} L ${cx + speak.len} ${cy}`}
            color={color}
            w={1.9}
            glow={7}
            anim={`cdu-pullout 500ms ${EASE_OUT} ${sd}ms backwards`}
            style={{ transformBox: "fill-box", transformOrigin: "left center" }}
          />
          {/* the plucked string's harmonic */}
          <g
            style={
              {
                opacity: 0,
                "--len": `${speak.len}px`,
                animation: `cdu-travel 900ms linear ${sd + 400}ms infinite both`,
              } as SVars
            }
          >
            <circle cx={cx} cy={cy} r={10} fill="none" stroke={color} strokeWidth={8} strokeOpacity={0.2} />
            <circle cx={cx} cy={cy} r={10} fill="none" stroke={color} strokeWidth={2.2} />
          </g>
        </g>
      )}
    </g>
  );
}

// ── Atom: Tension Line ───────────────────────────────────────────────────────
// The WaveLine. The deck's horizon and its pressure gauge: one strand anchored
// at both stage edges. Geometry is fixed; amplitude and travel are transforms,
// because CSS `d:` animation does not run on iOS Safari and SMIL keeps running
// through a paused or frozen frame.
function TensionLine({
  y = 740,
  amp = 24,
  period = 340,
  color = palette.energy,
  w = 2.8,
  glow = 11,
  opacity = 1,
  travelMs,
  anim,
  drawMs,
  drawDelayMs,
  scaleAnim,
}: {
  y?: number;
  amp?: number;
  period?: number;
  color?: string;
  w?: number;
  glow?: number;
  opacity?: number;
  /** Flow: the sine travels one period, seamlessly, forever. */
  travelMs?: number;
  anim?: string;
  drawMs?: number;
  drawDelayMs?: number;
  /** Pressure: amplitude animated by scaleY about the line's own axis. */
  scaleAnim?: string;
}) {
  const d = sinePath(y, amp, period);
  const inner = (
    <Strand
      d={d}
      color={color}
      w={w}
      glow={glow}
      opacity={opacity}
      drawMs={drawMs}
      drawDelayMs={drawDelayMs}
      anim={anim}
    />
  );
  const travelled = travelMs ? (
    <g style={{ "--flow": `${period * 2}px`, animation: `cdu-flow ${travelMs}ms linear infinite` } as SVars}>
      {inner}
    </g>
  ) : (
    inner
  );
  if (!scaleAnim) return travelled;
  return (
    <g style={{ animation: scaleAnim, transformBox: "fill-box", transformOrigin: "center" }}>{travelled}</g>
  );
}

/** The same line with its frequency tightened past sense — the scribble. */
function TensionScribble({
  y = 740,
  amp = 70,
  step = 46,
  seed = 5,
  color = palette.risk,
  opacity = 1,
  anim,
}: {
  y?: number;
  amp?: number;
  step?: number;
  seed?: number;
  color?: string;
  opacity?: number;
  anim?: string;
}) {
  return <Strand d={scribblePath(y, amp, step, seed)} color={color} w={2.4} glow={9} opacity={opacity} anim={anim} />;
}

// ── Atom: Snap Shard ─────────────────────────────────────────────────────────
// A SlideShard. A fragment of a slide released from a strand stretched past its
// limit: stretch, hold, magenta for 200ms, snap, tumble end over end.
function SnapShard({
  x,
  y,
  angle = 0,
  len = 150,
  tx = 130,
  ty = 120,
  rot = 260,
  color = palette.energy,
  delayMs = 0,
  seed = 1,
}: {
  x: number;
  y: number;
  angle?: number;
  len?: number;
  tx?: number;
  ty?: number;
  rot?: number;
  color?: string;
  delayMs?: number;
  seed?: number;
}) {
  const sw = 34 + rnd(seed, 2) * 14;
  const sh = sw * 0.5625;
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      {/* the strand stretched past its limit */}
      <Strand
        d={`M ${x} ${y} L ${x + len} ${y}`}
        color={color}
        w={2}
        glow={7}
        anim={`cdu-taut ${SNAP_CYCLE_MS}ms ${EASE_BACK} ${delayMs}ms infinite`}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }}
      />
      {/* the only warning the deck gives: exactly 200ms of magenta */}
      <g style={{ opacity: 0, animation: `cdu-warn ${SNAP_CYCLE_MS}ms linear ${delayMs}ms infinite both` }}>
        <path d={`M ${x} ${y} L ${x + len} ${y}`} fill="none" stroke={palette.risk} strokeWidth={10} strokeOpacity={0.26} strokeLinecap="round" />
        <path d={`M ${x} ${y} L ${x + len} ${y}`} fill="none" stroke={palette.risk} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* the freed segment, carrying a slide-shaped rectangle of the colour */}
      <g
        style={
          {
            opacity: 0,
            "--tx": `${tx}px`,
            "--ty": `${ty}px`,
            "--rot": `${rot}deg`,
            animation: `cdu-shardgo ${SNAP_CYCLE_MS}ms ${EASE_OUT} ${delayMs}ms infinite both`,
            transformBox: "fill-box",
            transformOrigin: "center",
          } as SVars
        }
      >
        <rect x={x + len - sw} y={y - sh / 2} width={sw} height={sh} fill="none" stroke={palette.risk} strokeWidth={7} strokeOpacity={0.2} />
        <rect x={x + len - sw} y={y - sh / 2} width={sw} height={sh} fill="none" stroke={palette.risk} strokeWidth={2} />
      </g>
    </g>
  );
}

/**
 * When each of a Loom's warp threads starts and finishes unspooling. Shared by
 * the Loom and by any slide whose other strands must react to a warp passing
 * (slide 4's caught strands). With no seed it is the contract's even 60ms
 * stagger; with one, Act II's warps come off the frame out of step.
 */
function warpSchedule({
  x,
  w: fw,
  warps,
  delayMs,
  descendMs,
  drawMs,
  staggerMs,
  unevenSeed,
}: {
  x: number;
  w: number;
  warps: number;
  delayMs: number;
  descendMs: number;
  drawMs: number;
  staggerMs: number;
  unevenSeed?: number;
}): { cx: number; startMs: number; drawMs: number; w: number; opacity: number }[] {
  const mid = x + fw / 2;
  return Array.from({ length: warps }, (_, i) => {
    const cx = x + ((i + 0.5) * fw) / warps;
    if (unevenSeed == null) {
      return { cx, startMs: delayMs + descendMs + i * staggerMs, drawMs, w: 1.7, opacity: 0.8 };
    }
    // depth-coded: the centre of the frame carries the load, the wings thin out
    const t = Math.min(1, Math.abs(cx - mid) / (fw / 2));
    return {
      cx,
      startMs: delayMs + descendMs + Math.max(0, Math.round(i * staggerMs + (rnd(i, unevenSeed) - 0.5) * staggerMs * 6)),
      drawMs: Math.round(drawMs * (0.55 + rnd(i, unevenSeed + 1) * 1.25)),
      w: 3.4 - t * 2.2,
      opacity: 1 - t * 0.6,
    };
  });
}

// ── Atom: Loom ───────────────────────────────────────────────────────────────
// The UFOConsole. Presenter Mode's machine: the thing that holds every strand
// at even tension. A taut frame descends, its warp threads unspool to the
// floor, and each landing becomes an edge-light in the timing grid.
function Loom({
  x,
  y,
  w: fw,
  h: fh,
  floorY,
  warps = 11,
  color = palette.order,
  descendMs = 700,
  descendEase = EASE_BACK,
  delayMs = 0,
  drawMs = 250,
  staggerMs = 60,
  lights = true,
  whip = false,
  stroke = 2.6,
  descendAnim,
  unevenSeed,
  flare = false,
  held = 0,
  lightBand,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  floorY: number;
  warps?: number;
  color?: string;
  descendMs?: number;
  descendEase?: string;
  delayMs?: number;
  drawMs?: number;
  staggerMs?: number;
  lights?: boolean;
  /** Act II: the frame holds but its warp threads whip loose one by one. */
  whip?: boolean;
  stroke?: number;
  /** Replaces the whole descent animation shorthand (slide 4's plunge). */
  descendAnim?: string;
  /** Act II: warps unspool out of step, weighted brighter toward the centre. */
  unevenSeed?: number;
  /** Edge-lights flare as they land instead of simply switching on. */
  flare?: boolean;
  /** Strands held level inside the frame — the frame of held threads. */
  held?: number;
  /** Only warps landing inside this x band get an edge-light: a frame that
   *  bleeds off the stage must not leave half a light kissing the crop. */
  lightBand?: [number, number];
}) {
  const sched = warpSchedule({ x, w: fw, warps, delayMs, descendMs, drawMs, staggerMs, unevenSeed });
  const cols = sched.map((s) => s.cx);
  return (
    <g style={{ animation: descendAnim ?? `cdu-descend ${descendMs}ms ${descendEase} ${delayMs}ms backwards` }}>
      {/* the taut frame */}
      <Strand d={`M ${x} ${y} L ${x + fw} ${y}`} color={color} w={stroke} glow={10} />
      <Strand d={`M ${x} ${y + fh} L ${x + fw} ${y + fh}`} color={color} w={stroke} glow={10} />
      <Strand d={`M ${x} ${y} L ${x} ${y + fh}`} color={color} w={stroke} glow={10} />
      <Strand d={`M ${x + fw} ${y} L ${x + fw} ${y + fh}`} color={color} w={stroke} glow={10} />
      {Array.from({ length: held }, (_, i) => (
        <Strand
          key={`h${i}`}
          d={`M ${x} ${(y + ((i + 1) * fh) / (held + 1)).toFixed(1)} L ${x + fw} ${(y + ((i + 1) * fh) / (held + 1)).toFixed(1)}`}
          color={color}
          w={1.5}
          glow={6}
          opacity={0.55}
        />
      ))}
      {/* warp threads unspooling straight down — they become the timing grid */}
      {cols.map((cxi, i) =>
        whip ? (
          <g
            key={i}
            style={
              {
                "--sw": `${(6 + rnd(i, 31) * 12).toFixed(1)}deg`,
                animation: `cdu-whip ${520 + i * 70}ms ${EASE_BACK} ${i * 80}ms infinite`,
                transformBox: "fill-box",
                transformOrigin: "top center",
              } as SVars
            }
          >
            <Strand
              d={`M ${cxi} ${y + fh} Q ${(cxi + (rnd(i, 33) - 0.5) * 90).toFixed(0)} ${((y + fh + floorY) / 2).toFixed(0)} ${(cxi + (rnd(i, 34) - 0.5) * 150).toFixed(0)} ${floorY}`}
              color={color}
              w={1.7}
              glow={6}
              opacity={0.75}
            />
          </g>
        ) : (
          <Strand
            key={i}
            d={`M ${cxi} ${y + fh} L ${cxi} ${floorY}`}
            color={color}
            w={sched[i].w}
            glow={6}
            opacity={sched[i].opacity}
            drawMs={sched[i].drawMs}
            drawDelayMs={sched[i].startMs}
          />
        ),
      )}
      {/* edge-lights: where a warp thread touched the floor, a stage begins */}
      {lights &&
        cols.map((cxi, i) =>
          lightBand && (cxi < lightBand[0] || cxi > lightBand[1]) ? null : (
          <g
            key={`l${i}`}
            style={{
              animation: flare
                ? `cdu-glowon 620ms ${EASE_OUT} ${sched[i].startMs + sched[i].drawMs}ms backwards`
                : `cdu-lighton 240ms ${EASE_OUT} ${sched[i].startMs + sched[i].drawMs}ms backwards`,
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          >
            <circle cx={cxi} cy={floorY} r={flare ? 17 : 11} fill={color} opacity={flare ? 0.26 : 0.2} />
            <circle cx={cxi} cy={floorY} r={flare ? 4.4 : 3.4} fill={flare ? palette.energy : color} />
          </g>
          ),
        )}
      {/* the floor the warps land on */}
      <Strand
        d={`M ${x - 90} ${floorY} L ${x + fw + 90} ${floorY}`}
        color={color}
        w={1.6}
        glow={7}
        opacity={0.5}
        drawMs={600}
        drawDelayMs={delayMs + descendMs}
      />
    </g>
  );
}

// ── Atom: Slack Net ──────────────────────────────────────────────────────────
// The Sectional. Sofa Mode's lounge: strands with their tension let go. It
// catches whatever falls into it without a sound, and widens by one more
// strand whenever someone new arrives.
function SlackNet({
  x0,
  x1,
  y,
  sag = 92,
  rows = 6,
  gap = 15,
  color = palette.calm,
  delayMs = 0,
  sagMs = 800,
  anim,
  open,
  extraRow,
}: {
  x0: number;
  x1: number;
  y: number;
  sag?: number;
  rows?: number;
  gap?: number;
  color?: string;
  delayMs?: number;
  sagMs?: number;
  anim?: string;
  /** The one stretch of net left open, lit and empty — slide 8's cushion. */
  open?: { from: number; to: number };
  /** Growth: one more strand arriving, to make room. */
  extraRow?: boolean;
}) {
  const cx = (x0 + x1) / 2;
  const rowPaths = Array.from({ length: rows }, (_, i) => ({
    d: `M ${x0} ${y + i * gap} Q ${cx} ${y + sag + i * gap * 1.5} ${x1} ${y + i * gap}`,
    i,
  }));
  return (
    <g style={{ animation: anim }}>
      {/* the two anchors the hammock hangs from */}
      <Strand d={`M ${x0} ${y - 58} L ${x0} ${y + 26}`} color={color} w={3} glow={10} opacity={0.75} />
      <Strand d={`M ${x1} ${y - 58} L ${x1} ${y + 26}`} color={color} w={3} glow={10} opacity={0.75} />
      <g
        style={{
          animation: `cdu-sag ${sagMs}ms ${EASE_OUT} ${delayMs}ms backwards`,
          transformBox: "fill-box",
          transformOrigin: "center top",
        }}
      >
        {rowPaths.map(({ d, i }) => (
          <Strand key={i} d={d} color={color} w={2.2} glow={8} opacity={0.85 - i * 0.07} />
        ))}
        {/* cross strands — enough to read as a net, not as a stack of lines */}
        {[0.2, 0.38, 0.56, 0.74, 0.9].map((t, i) => {
          // a quadratic with its control at the midpoint is linear in x, so a
          // cross strand is just the top row's point dropped to the last row's
          const u = 2 * (1 - t) * t;
          const xa = x0 + (x1 - x0) * t;
          const top = y + u * sag;
          const bot = y + (rows - 1) * gap + u * (sag + 0.5 * (rows - 1) * gap);
          return <Strand key={`c${i}`} d={`M ${xa.toFixed(1)} ${top.toFixed(1)} L ${xa.toFixed(1)} ${bot.toFixed(1)}`} color={color} w={1.5} glow={5} opacity={0.45} />;
        })}
      </g>
      {extraRow && (
        <g
          style={{
            animation: `cdu-widen 600ms ${EASE_QUAD} ${delayMs + sagMs}ms backwards`,
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        >
          <Strand
            d={`M ${x0} ${y + rows * gap} Q ${cx} ${y + sag + rows * gap * 1.5} ${x1} ${y + rows * gap}`}
            color={color}
            w={2.2}
            glow={8}
            opacity={0.6}
          />
        </g>
      )}
      {open && (
        // the open cushion — the same rectangle as slide 18's slide-shaped gap
        <g>
          <rect
            x={open.from}
            y={y + sag * 0.46}
            width={open.to - open.from}
            height={(open.to - open.from) * 0.5625}
            fill={palette.calm}
            opacity={0.07}
          />
          <rect
            x={open.from}
            y={y + sag * 0.46}
            width={open.to - open.from}
            height={(open.to - open.from) * 0.5625}
            fill="none"
            stroke={palette.signal}
            strokeWidth={2}
            strokeOpacity={0.85}
          />
        </g>
      )}
    </g>
  );
}

// ── Atom: Panel ──────────────────────────────────────────────────────────────
// A CulturePanel. A comic frame that holds a joke: four strands fly in from
// four edges and snap into a rectangle with a flash at each corner. Inside, a
// speech bubble fills with a line that never resolves.
function Panel({
  x,
  y,
  w: pw,
  h: ph,
  color = palette.risk,
  delayMs = 0,
  bubble = true,
  laugh = false,
  page = false,
  tailTo,
  opacity = 1,
  anim,
  solid = false,
  fillMs,
  hardLaugh = false,
  beats,
  slamLoopMs,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  delayMs?: number;
  bubble?: boolean;
  /** The laugh is the frame's strands vibrating. No faces, no figures. */
  laugh?: boolean;
  /** Sofa Mode: the panel turns its own page, slow, in the distance. */
  page?: boolean;
  /** The bubble's tail points at another panel. */
  tailTo?: { x: number; y: number };
  opacity?: number;
  anim?: string;
  /** An ink ground under the frame, so a Panel in front occludes one behind. */
  solid?: boolean;
  /** The bubble's blurred line fills in from the left over this long. */
  fillMs?: number;
  /** The laugh pushed: shakes harder, and leaves the frame's after-images. */
  hardLaugh?: boolean;
  /** The bubble holds short blurred bursts instead of a sentence — a laugh's rhythm. */
  beats?: number;
  /** Act II: slam shut and fly open again on this cycle, forever. `delayMs`
   *  becomes the phase (negative starts mid-cycle). Off: slam once and hold. */
  slamLoopMs?: number;
}) {
  const edges: { d: string; sx: number; sy: number }[] = [
    { d: `M ${x} ${y} L ${x + pw} ${y}`, sx: 0, sy: -240 },
    { d: `M ${x} ${y + ph} L ${x + pw} ${y + ph}`, sx: 0, sy: 240 },
    { d: `M ${x} ${y} L ${x} ${y + ph}`, sx: -260, sy: 0 },
    { d: `M ${x + pw} ${y} L ${x + pw} ${y + ph}`, sx: 260, sy: 0 },
  ];
  // a looping slam flies a quarter as far, so a frame caught mid-flight in a
  // still stays on the stage instead of kissing its edge
  const reach = slamLoopMs ? 0.28 : 1;
  const corners = [
    [x, y],
    [x + pw, y],
    [x, y + ph],
    [x + pw, y + ph],
  ];
  const bx = x + pw * 0.16;
  const by = y + ph * 0.2;
  const bw = pw * 0.68;
  const bh = ph * 0.42;
  const fillStyle = (lagMs: number): SVars | undefined =>
    fillMs
      ? {
          animation: `cdu-pullout ${fillMs}ms ${EASE_OUT} ${delayMs + 300 + lagMs}ms backwards`,
          transformBox: "fill-box",
          transformOrigin: "left center",
        }
      : undefined;
  // a comic tail: a wedge from the bubble's rim, on the side facing its target
  let tail: { a: string; b: string; tip: [number, number] } | null = null;
  if (tailTo) {
    const bcx = bx + bw / 2;
    const bcy = by + bh / 2;
    const dx = tailTo.x - bcx;
    const dy = tailTo.y - bcy;
    // leave through the flat part of whichever edge faces the target, and
    // spread the wedge's base along that edge so both ends sit on the rim
    const sx = Math.abs(dx) / (bw / 2 - bh * 0.4);
    const sy = Math.abs(dy) / (bh / 2);
    const k = 1 / Math.max(sx, sy);
    const rx = sy >= sx ? bcx + dx * k : bcx + Math.sign(dx) * (bw / 2);
    const ry = sy >= sx ? bcy + Math.sign(dy) * (bh / 2) : bcy + dy * k;
    const nx = sy >= sx ? bh * 0.13 : 0;
    const ny = sy >= sx ? 0 : bh * 0.13;
    tail = {
      a: `M ${(rx + nx).toFixed(1)} ${(ry + ny).toFixed(1)} Q ${((rx + tailTo.x) / 2 + nx * 0.9).toFixed(1)} ${((ry + tailTo.y) / 2 + ny * 0.9).toFixed(1)} ${tailTo.x} ${tailTo.y}`,
      b: `M ${(rx - nx).toFixed(1)} ${(ry - ny).toFixed(1)} L ${tailTo.x} ${tailTo.y}`,
      tip: [tailTo.x, tailTo.y],
    };
  }
  return (
    <g style={{ opacity, animation: anim }}>
      {/* the laugh's after-images: the frame where it just was, left behind */}
      {laugh && hardLaugh && (
        <g style={{ animation: `cdu-fade 160ms linear ${delayMs + 300}ms backwards` }}>
          {[
            { r: -2.6, tx: -16, ty: 9, o: 0.42 },
            { r: 2.1, tx: 15, ty: -10, o: 0.28 },
            { r: -1.2, tx: 26, ty: 14, o: 0.16 },
          ].map((g, gi) => (
            <g key={`g${gi}`} transform={`translate(${g.tx} ${g.ty}) rotate(${g.r} ${x + pw / 2} ${y + ph / 2})`}>
              {edges.map((e, i) => (
                <Strand key={i} d={e.d} color={color} w={1.6} glow={7} opacity={g.o} />
              ))}
            </g>
          ))}
          {/* vibration marks off both flanks — the frame is shaking, not tilted */}
          {[-1, 1].map((side) =>
            [0, 1].map((j) => {
              const ex = side < 0 ? x - 30 - j * 22 : x + pw + 30 + j * 22;
              const ey = y + ph * (side < 0 ? 0.62 : 0.38);
              const r = ph * (0.1 + j * 0.05);
              return (
                <Strand
                  key={`v${side}${j}`}
                  d={`M ${ex - side * r * 0.35} ${ey - r} Q ${ex + side * r * 0.35} ${ey} ${ex - side * r * 0.35} ${ey + r}`}
                  color={color}
                  w={2.2}
                  glow={8}
                  opacity={0.85 - j * 0.3}
                />
              );
            }),
          )}
        </g>
      )}
      <g
        style={
          laugh
            ? hardLaugh
              ? {
                  animation: `cdu-guffaw 240ms linear ${delayMs + 300}ms infinite`,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }
              : { animation: `cdu-laugh 320ms ${EASE_BACK} ${delayMs + 300}ms infinite` }
            : undefined
        }
      >
        {solid && (
          <rect
            x={x}
            y={y}
            width={pw}
            height={ph}
            fill={palette.ink}
            opacity={0.94}
            style={{ animation: `cdu-fade 200ms linear ${delayMs + 120}ms backwards` }}
          />
        )}
        {edges.map((e, i) => (
          <Strand
            key={i}
            d={e.d}
            color={color}
            w={2.4}
            glow={9}
            anim={
              slamLoopMs
                ? `cdu-slamloop ${slamLoopMs}ms ${EASE_BACK} ${delayMs}ms infinite both`
                : `cdu-slam 300ms ${EASE_BACK} ${delayMs}ms backwards`
            }
            style={{ "--sx": `${e.sx * reach}px`, "--sy": `${e.sy * reach}px` } as SVars}
          />
        ))}
        {/* 120ms of corner flash — the Panel's whole comic timing */}
        {corners.map(([ccx, ccy], i) => (
          <circle
            key={`f${i}`}
            cx={ccx}
            cy={ccy}
            r={9}
            fill={color}
            style={{
              opacity: 0,
              animation: slamLoopMs
                ? `cdu-cornerloop ${slamLoopMs}ms linear ${delayMs}ms infinite both`
                : `cdu-corner 120ms linear ${delayMs + 300}ms both`,
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
        ))}
        {bubble && (
          <g style={slamLoopMs ? { animation: `cdu-bubbleloop ${slamLoopMs}ms linear ${delayMs}ms infinite both` } : undefined}>
          <g style={page ? { animation: `cdu-page 5200ms ${EASE_QUAD} ${delayMs}ms infinite`, transformBox: "fill-box", transformOrigin: "left center" } : undefined}>
            <rect x={bx} y={by} width={bw} height={bh} rx={bh * 0.4} fill="none" stroke={color} strokeWidth={7} strokeOpacity={0.16} />
            <rect x={bx} y={by} width={bw} height={bh} rx={bh * 0.4} fill="none" stroke={color} strokeWidth={1.6} strokeOpacity={0.8} />
            {/* the line inside: a fat, low-opacity stroke that never resolves */}
            {beats ? (
              Array.from({ length: beats }, (_, i) => {
                const seg = (bw * 0.7) / beats;
                const sx = bx + bw * 0.15 + i * seg;
                const byi = by + bh * (0.5 + (i % 2 === 0 ? -0.08 : 0.08));
                return (
                  <path
                    key={`b${i}`}
                    d={`M ${(sx + seg * 0.36).toFixed(1)} ${byi.toFixed(1)} L ${(sx + seg * 0.56).toFixed(1)} ${byi.toFixed(1)}`}
                    stroke={color}
                    strokeWidth={bh * (0.2 + rnd(i, 61) * 0.08)}
                    strokeOpacity={0.3}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })
            ) : (
              <>
                <g style={fillStyle(0)}>
                  <path
                    d={`M ${bx + bw * 0.12} ${by + bh * 0.42} L ${bx + bw * 0.86} ${by + bh * 0.42}`}
                    stroke={color}
                    strokeWidth={bh * 0.34}
                    strokeOpacity={0.32}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
                <g style={fillStyle(fillMs ? fillMs * 0.55 : 0)}>
                  <path
                    d={`M ${bx + bw * 0.12} ${by + bh * 0.7} L ${bx + bw * 0.58} ${by + bh * 0.7}`}
                    stroke={color}
                    strokeWidth={bh * 0.24}
                    strokeOpacity={0.24}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              </>
            )}
            {tail && (
              <>
                <Strand d={tail.a} color={color} w={2} glow={8} opacity={0.9} />
                <Strand d={tail.b} color={color} w={2} glow={8} opacity={0.9} />
                <circle cx={tail.tip[0]} cy={tail.tip[1]} r={4} fill={color} />
              </>
            )}
          </g>
          </g>
        )}
      </g>
    </g>
  );
}

// ── Scene-dressing: Fray ─────────────────────────────────────────────────────
// An idea nobody pulled on any more: the strand's end splits into fibres that
// drift apart and thin to ink.
function Fray({
  x,
  y,
  dir = 1,
  fibres = 7,
  len = 90,
  color = palette.calm,
  seed = 1,
  delayMs = 0,
  spread = 70,
  durMs = 3000,
}: {
  x: number;
  y: number;
  dir?: number;
  fibres?: number;
  len?: number;
  color?: string;
  seed?: number;
  delayMs?: number;
  spread?: number;
  durMs?: number;
}) {
  return (
    <g>
      {Array.from({ length: fibres }, (_, i) => {
        const a = (i / (fibres - 1) - 0.5) * 1.15;
        const ex = x + dir * len * Math.cos(a);
        const ey = y + len * Math.sin(a) * 0.9;
        return (
          <g
            key={i}
            style={
              {
                "--fx": `${dir * spread * (0.5 + rnd(i, seed) * 0.9)}px`,
                "--fy": `${(rnd(i, seed + 4) - 0.5) * spread}px`,
                animation: `cdu-fray ${durMs}ms linear ${delayMs + i * 140}ms infinite`,
              } as SVars
            }
          >
            <Strand
              d={`M ${x} ${y} Q ${(x + ex) / 2} ${(y + ey) / 2 - 8} ${ex} ${ey}`}
              color={color}
              w={1.5}
              glow={5}
              opacity={0.7}
            />
          </g>
        );
      })}
    </g>
  );
}

// ── Scene-dressing: Spark Knot ───────────────────────────────────────────────
// The moment two ideas touch: where two strands cross under tension a hard
// bright node fires, and a new small Voice Knot begins to gather at that spot.
function SparkKnot({
  cx,
  cy,
  size = 90,
  cycleMs = 3200,
  delayMs = 0,
  seed = 2,
  crossings = true,
}: {
  cx: number;
  cy: number;
  size?: number;
  cycleMs?: number;
  delayMs?: number;
  seed?: number;
  crossings?: boolean;
}) {
  return (
    <g>
      {crossings && (
        <>
          <Strand d={`M ${cx - size} ${cy - size * 0.7} L ${cx + size} ${cy + size * 0.7}`} color={palette.energy} w={2} glow={7} opacity={0.7} />
          <Strand d={`M ${cx - size} ${cy + size * 0.7} L ${cx + size} ${cy - size * 0.7}`} color={palette.order} w={2} glow={7} opacity={0.7} />
        </>
      )}
      {/* the node: 150ms of hard light */}
      <g
        style={{
          opacity: 0,
          animation: `cdu-spark ${cycleMs}ms linear ${delayMs}ms infinite both`,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        <circle cx={cx} cy={cy} r={16} fill={palette.risk} opacity={0.35} />
        <circle cx={cx} cy={cy} r={5} fill={palette.risk} />
      </g>
      {/* and where they spark, something new forms */}
      <g
        style={{
          opacity: 0,
          animation: `cdu-grow ${cycleMs}ms ${EASE_OUT} ${delayMs + 160}ms infinite both`,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        <VoiceKnot cx={cx} cy={cy} r={size * 0.33} count={7} seed={seed + 40} color={palette.risk} w={1.6} glow={6} breatheMs={2400} />
      </g>
    </g>
  );
}

// ── Scene-dressing: Braid ────────────────────────────────────────────────────
// Strands twisted together into one thicker strand: a new deck. The result is
// brighter than any of them alone.
function Braid({
  y,
  x0,
  x1,
  amp = 15,
  period = 150,
  color = palette.signal,
  drawMs = 1800,
  staggerMs = 90,
  delayMs = 0,
  strands = 3,
  w: sw = 2.2,
}: {
  y: number;
  x0: number;
  x1: number;
  amp?: number;
  period?: number;
  color?: string;
  drawMs?: number;
  staggerMs?: number;
  delayMs?: number;
  strands?: number;
  w?: number;
}) {
  return (
    <g>
      {Array.from({ length: strands }, (_, i) => (
        <Strand
          key={i}
          d={sinePath(y + (i - (strands - 1) / 2) * 3, amp, period, x0, x1, i)}
          color={color}
          w={sw}
          glow={8}
          opacity={0.62 + i * 0.14}
          drawMs={drawMs}
          drawDelayMs={delayMs + i * staggerMs}
        />
      ))}
    </g>
  );
}

// ── The Cat ──────────────────────────────────────────────────────────────────
// CatDev, the audience proxy and the one figurative atom in the deck. HTML,
// laid into the SVG's own coordinates by the Stage overlay.
function Cat({
  cx,
  bottomY,
  width,
  pose = "sleeping",
  blinkMs,
  enterAnim,
}: {
  cx: number;
  bottomY: number;
  width: number;
  pose?: "sleeping" | "alert";
  /** Act III: one blink, on a cut, as the cue that restores the lights. */
  blinkMs?: number;
  /** An entrance on a full-overlay wrapper, so percentages are of the stage
   *  width and the cat's own centring transform is never overwritten. */
  enterAnim?: string;
}) {
  const height = (width / 160) * 96;
  const top = bottomY - height * (86 / 96);
  const cat = (
    <div style={{ position: "absolute", left: px(cx), top: py(top), width: px(width), transform: "translateX(-50%)" }}>
      <CatDev width="100%" pose={pose} zz={pose === "sleeping"} />
      {blinkMs != null && (
        // Lids sized a little over the eyes so the cat's own breathing cycle
        // cannot slide an eye out from under one mid-blink.
        <svg
          viewBox="0 0 160 96"
          style={{ position: "absolute", inset: 0, width: "100%", display: "block" }}
          aria-hidden
        >
          <g style={{ opacity: 0, animation: `cdu-blink ${blinkMs}ms linear 0ms infinite both` }}>
            <ellipse cx={67} cy={21} rx={5.4} ry={6.2} fill="#241d33" />
            <ellipse cx={81} cy={21} rx={5.4} ry={6.2} fill="#241d33" />
          </g>
        </svg>
      )}
    </div>
  );
  return enterAnim ? <div style={{ position: "absolute", inset: 0, animation: enterAnim }}>{cat}</div> : cat;
}

/** A pool of warm light — a gradient, not a filter. */
function LightPool({ cx, cy, r, color = palette.calm, opacity = 0.16 }: { cx: number; cy: number; r: number; color?: string; opacity?: number }) {
  const id = `cdu-pool-${Math.round(cx)}-${Math.round(cy)}`;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.7} fill={`url(#${id})`} />
    </>
  );
}

/** Sky dressing: loose strands drifting on Flow alone. Never pulls taut. */
function DriftField({
  count = 8,
  seed = 7,
  color = palette.energy,
  opacity = 0.45,
  yFrom = 60,
  yTo = 840,
  lanes,
}: {
  count?: number;
  seed?: number;
  color?: string;
  opacity?: number;
  yFrom?: number;
  yTo?: number;
  /** Move a strand's drift lane to this y, by index — to clear a fixed atom. */
  lanes?: Partial<Record<number, number>>;
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const y = lanes?.[i] ?? yFrom + ((yTo - yFrom) * (i + rnd(i, seed) * 0.6)) / count;
        const x = -120 + rnd(i, seed + 2) * 900;
        const len = 180 + rnd(i, seed + 3) * 320;
        const bow = (rnd(i, seed + 5) - 0.5) * 70;
        return (
          <g
            key={i}
            style={
              {
                "--dx": `${(rnd(i, seed + 6) - 0.3) * 46}px`,
                "--dy": `${(rnd(i, seed + 7) - 0.5) * 30}px`,
                animation: `cdu-drift ${6000 + i * 520}ms ${EASE_SLOW} ${i * 240}ms infinite alternate`,
              } as SVars
            }
          >
            <Strand
              d={`M ${x.toFixed(0)} ${y.toFixed(0)} Q ${(x + len / 2).toFixed(0)} ${(y + bow).toFixed(0)} ${(x + len).toFixed(0)} ${y.toFixed(0)}`}
              color={color}
              w={1.7}
              glow={6}
              opacity={opacity * (0.6 + rnd(i, seed + 8) * 0.6)}
            />
          </g>
        );
      })}
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE VISUALS
// ═════════════════════════════════════════════════════════════════════════════

// ── 1 · establishing-shot — Act I ────────────────────────────────────────────
// The universe opens: two knots gather at opposite corners and one strand
// already reaches between them. Flow and Accumulation only; nothing pulls taut.
function EstablishingShot() {
  return (
    <Stage>
      <LightPool cx={300} cy={240} r={420} color={palette.energy} opacity={0.1} />
      <DriftField count={9} seed={3} />
      {/* the strand that joins the two knots — behind the first, in front of
          the second, so the sky reads as having depth rather than layers */}
      <Strand
        d={`M 320 260 C 520 360 620 500 900 620`}
        color={palette.energy}
        w={1.8}
        glow={7}
        opacity={0.4}
      />
      <VoiceKnot cx={310} cy={250} r={106} seed={11} count={16} breatheMs={4200} speak={{ angle: 26, len: 250, delayMs: 900 }} />
      <VoiceKnot cx={905} cy={618} r={78} seed={23} count={12} color={palette.energy} breatheMs={4800} delayMs={600} opacity={0.92} />
      {/* the same connecting strand again, this time over the second knot */}
      <Strand d={`M 840 596 C 880 606 890 612 930 628`} color={palette.calm} w={2} glow={7} opacity={0.6} />
      <TensionLine y={800} amp={22} period={360} travelMs={14000} drawMs={1200} drawDelayMs={300} opacity={0.85} />
    </Stage>
  );
}

// ── 2 · atom-introduction — Act I ────────────────────────────────────────────
// The cast lineup, left to right in the order the Say names them. Each atom
// performs its signature motion once as it lands; the Tension Line threads
// under the whole line and lifts under each one.
function AtomLineupInner() {
  // the floor that every atom stands on — it bumps up under each of them, so
  // deleting any atom would leave a bump with nothing on it
  const bumps = "M -160 720 Q 60 720 130 720 Q 175 662 220 720 Q 300 720 340 720 Q 400 660 460 720 Q 520 720 560 720 Q 610 664 660 720 Q 720 720 760 720 Q 810 660 860 720 Q 960 720 1100 716 L 1360 714";
  return (
    <>
      <LightPool cx={600} cy={520} r={620} color={palette.order} opacity={0.07} />
      {/* Voice Knot */}
      <VoiceKnot cx={175} cy={560} r={62} seed={5} count={12} anim={`cdu-rise 700ms ${EASE_SLOW} 0ms backwards`} speak={{ angle: -20, len: 120, delayMs: 700 }} />
      {/* Loom, hovering, one warp thread hanging */}
      <g style={{ animation: `cdu-rise 700ms ${EASE_SLOW} 400ms backwards` }}>
        <Loom x={300} y={470} w={128} h={82} floorY={664} warps={4} delayMs={600} descendMs={600} drawMs={240} staggerMs={80} />
      </g>
      {/* Snap Shard, tumbling in place */}
      <g style={{ animation: `cdu-rise 700ms ${EASE_SLOW} 800ms backwards` }}>
        <SnapShard x={468} y={566} angle={-14} len={118} tx={96} ty={84} rot={300} delayMs={1000} seed={4} />
      </g>
      {/* Panel, snapping shut around a blurred bubble */}
      <g style={{ animation: `cdu-rise 700ms ${EASE_SLOW} 1200ms backwards` }}>
        <Panel x={640} y={486} w={172} h={126} delayMs={1400} />
      </g>
      {/* Slack Net, sagging cream, with the Cat asleep in it */}
      <g style={{ animation: `cdu-rise 700ms ${EASE_SLOW} 1600ms backwards` }}>
        <SlackNet x0={880} x1={1120} y={556} sag={70} rows={5} gap={13} delayMs={1800} />
      </g>
      <Strand d={bumps} color={palette.energy} w={2.6} glow={10} opacity={0.8} drawMs={1600} drawDelayMs={200} />
    </>
  );
}

function AtomLineupOverlay() {
  return <Cat cx={1010} bottomY={632} width={168} />;
}

// ── 3 · domain-physics — Act I ───────────────────────────────────────────────
// The sky becomes a diagram without stopping being a sky. Six sibling cards,
// one strand behaviour each, running on loop, in the order the Say walks them.
// The card is a container only: every behaviour keeps its own look and motion,
// scaled down just far enough to clear the card's border and no further.
// The only labels in the deck, set inside each card on one shared baseline.
type PhysicsKey = "flow" | "pressure" | "accumulation" | "decay" | "collision" | "growth";

/**
 * Each behaviour is drawn about its own origin. `box` is its full reach in
 * those units — strokes, glow, breathing, the ring's travel and the fray's
 * drift included — so the card can fit what the motion actually sweeps.
 */
const PHYSICS: { key: PhysicsKey; label: string; box: [number, number, number, number] }[] = [
  { key: "flow", label: "Flow", box: [-153, -13, 190, 13] },
  { key: "pressure", label: "Pressure", box: [-146, -10, 146, 12] },
  { key: "accumulation", label: "Accumulation", box: [-203, -83, 92, 83] },
  { key: "decay", label: "Decay", box: [-170, -50, 205, 58] },
  { key: "collision", label: "Collision", box: [-114, -81, 114, 81] },
  { key: "growth", label: "Growth", box: [-169, -17, 169, 17] },
];

/** A thin strand border's clearance inside every card, in stage units. */
const PH_PAD = 25;
/** The label band at the foot of each card: its centre sits this far up. */
const PH_LABEL_UP = 48;
/** Where the visual well ends above the card's foot, leaving the label room
 *  (more on a phone, where the fixed-size label is larger against the art). */
const phWellFoot = (compact: boolean) => (compact ? 92 : 78);
const CARD_FILL = "#120b22";

type PhysicsCard = { x: number; y: number; w: number; h: number; foot: number };

/** 3x2 on the stage; 2x3 on a portrait phone so each card keeps its size. */
function physicsCards(compact: boolean): PhysicsCard[] {
  const cols = compact ? 2 : 3;
  const rows = compact ? 3 : 2;
  const gap = compact ? 16 : 20;
  // the judged window is x 60..1140 at both scales; keep a clear margin in it
  const left = 90;
  const top = compact ? 14 : 40;
  const w = Math.floor((W - 2 * left - (cols - 1) * gap) / cols);
  const h = Math.floor((H - 2 * top - (rows - 1) * gap) / rows);
  return PHYSICS.map((_, i) => ({
    x: left + (i % cols) * (w + gap),
    y: top + Math.floor(i / cols) * (h + gap),
    w,
    h,
    foot: phWellFoot(compact),
  }));
}

/** Fit a behaviour's reach into its card's well: shrink only if it must. */
function physicsFit(card: PhysicsCard, box: [number, number, number, number]): string {
  const [bx0, by0, bx1, by1] = box;
  const wellW = card.w - 2 * PH_PAD;
  const wellH = card.h - PH_PAD - card.foot;
  const k = Math.min(1, wellW / (bx1 - bx0), wellH / (by1 - by0));
  const wcx = card.x + card.w / 2;
  const wcy = card.y + PH_PAD + wellH / 2;
  const tx = wcx - k * ((bx0 + bx1) / 2);
  const ty = wcy - k * ((by0 + by1) / 2);
  return `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(3)})`;
}

function PhysicsBehaviour({ k }: { k: PhysicsKey }) {
  switch (k) {
    case "flow": // a strand drifting end to end
      return (
        <>
          <Strand d={sinePath(0, 16, 130, -140, 150)} color={palette.energy} w={2.4} glow={9} />
          <g style={{ "--len": "280px", animation: "cdu-travel 2600ms linear 0ms infinite both", opacity: 0 } as SVars}>
            <circle cx={-140} cy={0} r={9} fill="none" stroke={palette.energy} strokeWidth={8} strokeOpacity={0.22} />
            <circle cx={-140} cy={0} r={9} fill="none" stroke={palette.energy} strokeWidth={2.2} />
          </g>
        </>
      );
    case "pressure": // a strand pulled taut between two anchors, humming
      return (
        <>
          <circle cx={-140} cy={0} r={6} fill={palette.order} />
          <circle cx={140} cy={0} r={6} fill={palette.order} />
          <g style={{ animation: `cdu-hum 700ms ${EASE_SLOW} infinite alternate`, transformBox: "fill-box", transformOrigin: "center" }}>
            <Strand d={`M -140 0 Q 0 9 140 0`} color={palette.order} w={2.6} glow={10} />
          </g>
        </>
      );
    case "accumulation": // strands winding into a knot
      return (
        <>
          <VoiceKnot cx={0} cy={0} r={74} seed={31} count={14} breatheMs={3800} />
          {[0, 1, 2].map((i) => (
            <Strand
              key={i}
              d={`M ${-200 + i * 18} ${-80 + i * 80} Q -100 ${-40 + i * 50} -60 ${(i - 1) * 24}`}
              color={palette.energy}
              w={1.7}
              glow={6}
              opacity={0.6}
              drawMs={1400}
              drawDelayMs={i * 300}
            />
          ))}
        </>
      );
    case "decay": // a Fray thinning to ink
      return (
        <>
          <Strand d={`M -165 0 L -10 0`} color={palette.calm} w={2.4} glow={9} opacity={0.8} />
          <Fray x={-10} y={0} fibres={7} len={80} seed={9} spread={110} durMs={3000} />
        </>
      );
    case "collision": // two strands crossing, a Spark Knot firing
      return <SparkKnot cx={0} cy={0} size={110} cycleMs={3200} seed={13} />;
    default: // a Braid winding thicker
      return <Braid y={0} x0={-165} x1={165} amp={17} period={110} strands={4} drawMs={1800} staggerMs={90} />;
  }
}

function PhysicsDiagramInner() {
  const { isMobile: compact } = useViewport();
  const cards = physicsCards(compact);
  return (
    <>
      <LightPool cx={600} cy={430} r={700} color={palette.order} opacity={0.06} />
      {PHYSICS.map((p, i) => {
        const c = cards[i];
        return (
          <g key={p.key}>
            {/* the card: a faint ground under a strand-stroked border */}
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill={CARD_FILL} />
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill="none" stroke={palette.order} strokeWidth={8} strokeOpacity={0.16} />
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill="none" stroke={palette.order} strokeWidth={1.6} strokeOpacity={0.85} />
            <g transform={physicsFit(c, p.box)}>
              <PhysicsBehaviour k={p.key} />
            </g>
          </g>
        );
      })}
    </>
  );
}

function PhysicsLabels() {
  const { isMobile: compact } = useViewport();
  const cards = physicsCards(compact);
  return (
    <>
      {PHYSICS.map((p, i) => {
        const c = cards[i];
        return (
          <div
            key={p.key}
            style={{
              position: "absolute",
              left: px(c.x + c.w / 2),
              top: py(c.y + c.h - PH_LABEL_UP),
              transform: "translate(-50%, -50%)",
              // sized in vw so the six names hold their weight on a big monitor;
              // on a phone they shrink with the art, and never break mid-word
              fontSize: compact ? "24px" : "clamp(13px, 1.5vw, 34px)",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: MONO,
              color: palette.order,
              textAlign: "center",
              whiteSpace: "nowrap",
              maxWidth: px(c.w - 2 * PH_PAD),
              lineHeight: 1.15,
            }}
          >
            {p.label}
          </div>
        );
      })}
    </>
  );
}

// ── 4 · first-tension — Act II ───────────────────────────────────────────────
// The Loom descends and where its warp threads touch the floor, a stage
// begins. Every drifting strand is caught on the way down and pulled straight.
// Cowbell: the Loom is wider than the stage — its frame runs off both edges —
// so the machine arrives over the whole sky rather than being placed in it.
const FT_LOOM = {
  x: -60,
  y: 150,
  w: 1320,
  h: 140,
  floorY: 772,
  warps: 15,
  delayMs: 0,
  descendMs: 560,
  drawMs: 300,
  staggerMs: 55,
  unevenSeed: 71,
};
/** Which drifting strands the warps catch: pinned between warp a and warp b. */
const FT_CAUGHT: { y: number; a: number; b: number; tail: -1 | 1; bow: number }[] = [
  { y: 352, a: 1, b: 7, tail: -1, bow: -46 },
  { y: 414, a: 5, b: 13, tail: 1, bow: 38 },
  { y: 502, a: 2, b: 10, tail: -1, bow: 52 },
  { y: 566, a: 6, b: 13, tail: 1, bow: -40 },
  { y: 622, a: 1, b: 6, tail: 1, bow: 44 },
  { y: 716, a: 4, b: 12, tail: -1, bow: -34 },
];
/** The one crossing that flickers magenta: caught strand 3 over warp 9. */
const FT_FLICKER = { strand: 3, warp: 9 };

function FirstTension() {
  const sched = warpSchedule(FT_LOOM);
  const warpTop = FT_LOOM.y + FT_LOOM.h;
  const warpSpan = FT_LOOM.floorY - warpTop;
  /** When a warp's unspooling tip passes height y on the way down. */
  const passMs = (col: number, y: number) =>
    Math.round(sched[col].startMs + sched[col].drawMs * ((y - warpTop) / warpSpan));
  const caught = FT_CAUGHT.map((c) => ({
    ...c,
    xa: sched[c.a].cx,
    xb: sched[c.b].cx,
    atMs: Math.max(passMs(c.a, c.y), passMs(c.b, c.y)),
  }));
  const fl = caught[FT_FLICKER.strand];
  const flx = sched[FT_FLICKER.warp].cx;
  const flMs = fl.atMs + 240;
  return (
    <Stage>
      {/* the sky darkens a stop */}
      <g style={{ animation: `cdu-fade 900ms ${EASE_SLOW} 0ms backwards` }}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#000" fillOpacity={0.4} />
      </g>
      <LightPool cx={600} cy={700} r={620} color={palette.order} opacity={0.16} />
      {/* the far sky, still loose: the strands the warps have not reached */}
      <DriftField count={4} seed={19} opacity={0.26} yFrom={14} yTo={140} />
      <Loom {...FT_LOOM} flare held={3} lightBand={SAFE_X} descendAnim={`cdu-plunge 900ms linear 0ms backwards`} />
      {/* strands caught by the descending warps and pulled straight */}
      {caught.map((c, i) => {
        const tx = c.tail < 0 ? c.xa : c.xb;
        const mid = (c.xa + c.xb) / 2;
        return (
          <g key={i}>
            {/* before the catch: loose and bowed, drifting */}
            <g style={{ opacity: 0, animation: `cdu-fade 140ms linear ${c.atMs}ms reverse both` }}>
              <Strand
                d={`M ${c.xa - 40} ${c.y + c.bow * 0.3} Q ${mid} ${c.y + c.bow * 2} ${c.xb + 40} ${c.y - c.bow * 0.3}`}
                color={palette.energy}
                w={1.7}
                glow={6}
                opacity={0.55}
              />
            </g>
            {/* after: pinned at two warps, straight, brighter for the tension */}
            <g style={{ animation: `cdu-fade 120ms linear ${c.atMs}ms backwards` }}>
              <Strand d={`M ${c.xa} ${c.y} L ${c.xb} ${c.y}`} color={palette.energy} w={2.2} glow={9} opacity={0.85} />
              {/* the slack that did not make it between the pins */}
              <Strand
                d={`M ${tx} ${c.y} Q ${tx + c.tail * 52} ${c.y + 10} ${tx + c.tail * 88} ${c.y + 46}`}
                color={palette.energy}
                w={1.5}
                glow={5}
                opacity={0.45}
              />
              <circle cx={c.xa} cy={c.y} r={4.2} fill={palette.energy} />
              <circle cx={c.xb} cy={c.y} r={4.2} fill={palette.energy} />
            </g>
          </g>
        );
      })}
      {/* the first magenta flicker, at one crossing — a standing tremor that
          never quite goes dark, and on the snap cycle its 200ms of full warning */}
      <g style={{ animation: `cdu-fade 200ms linear ${flMs}ms backwards` }}>
        <g style={{ animation: `cdu-flicker 820ms linear ${flMs}ms infinite` }}>
          <circle cx={flx} cy={fl.y} r={60} fill={palette.risk} opacity={0.18} />
          <circle cx={flx} cy={fl.y} r={21} fill={palette.risk} opacity={0.45} />
          <circle cx={flx} cy={fl.y} r={7} fill={palette.risk} />
        </g>
        <path d={`M ${flx - 72} ${fl.y} L ${flx + 72} ${fl.y}`} stroke={palette.risk} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        <path d={`M ${flx} ${fl.y - 40} L ${flx} ${fl.y + 40}`} stroke={palette.risk} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      </g>
      <g style={{ opacity: 0, animation: `cdu-warn ${SNAP_CYCLE_MS}ms linear ${flMs}ms infinite both` }}>
        <Strand d={`M ${flx - 110} ${fl.y} L ${flx + 110} ${fl.y}`} color={palette.risk} w={3.2} glow={14} opacity={1} glowOpacity={0.35} />
        <Strand d={`M ${flx} ${fl.y - 80} L ${flx} ${fl.y + 80}`} color={palette.risk} w={3.2} glow={14} opacity={1} glowOpacity={0.35} />
      </g>
      {/* the gauge climbs, its frequency tightening */}
      <TensionLine
        y={846}
        amp={36}
        period={230}
        travelMs={3600}
        scaleAnim={`cdu-swell 1200ms ${EASE_BACK} 600ms backwards`}
        color={palette.energy}
      />
    </Stage>
  );
}

// ── 5 · first-collapse — Act II ──────────────────────────────────────────────
// The loudest frame in the deck. Nothing on it is readable, on purpose: the
// magenta pre-snap warning firing everywhere at once.
/** Where a Snap Shard's stretched strand ends, and where its fragment lands. */
function shardReach(s: { x: number; y: number; angle: number; len: number; tx: number; ty: number }, seed: number) {
  const sw = 34 + rnd(seed, 2) * 14;
  const turn = (lx: number, ly: number): [number, number] => {
    const a = (s.angle * Math.PI) / 180;
    return [s.x + lx * Math.cos(a) - ly * Math.sin(a), s.y + lx * Math.sin(a) + ly * Math.cos(a)];
  };
  return { end: turn(s.len * 1.02, 0), land: turn(s.len - sw / 2 + s.tx, s.ty) };
}

/** The judged window, less a clear margin: a strand either resolves in here or is turned inward. */
const FC_FRAME = { x0: SAFE_X[0], x1: SAFE_X[1], y0: 40, y1: 860 };
const inFrame = ([px0, py0]: [number, number]) => px0 >= FC_FRAME.x0 && px0 <= FC_FRAME.x1 && py0 >= FC_FRAME.y0 && py0 <= FC_FRAME.y1;

/** One Panel slam: 300ms shut, a breath held, ~380ms flying open. Act II timing. */
const FC_SLAM_MS = 1000;

function FirstCollapse() {
  const shards = Array.from({ length: 15 }, (_, i) => {
    const s = {
      // spread across the sky on a jittered lattice, not a random clump
      x: 60 + (i % 5) * 230 + rnd(i, 41) * 120,
      y: 110 + Math.floor(i / 5) * 250 + rnd(i, 42) * 150,
      angle: -80 + rnd(i, 43) * 160,
      len: 150 + rnd(i, 44) * 150,
      tx: (rnd(i, 45) - 0.5) * 420,
      ty: (rnd(i, 46) - 0.35) * 420,
      rot: 180 + rnd(i, 47) * 400,
      delayMs: Math.round(rnd(i, 48) * SNAP_CYCLE_MS),
    };
    if (inFrame(shardReach(s, i).end)) return s;
    // a strand that would run past the frame edge is turned to pull inward
    // instead — reversed, or mirrored left-right — so every snap lands on-frame
    const turned = [
      { ...s, angle: s.angle + 180 },
      { ...s, angle: 180 - s.angle, ty: -s.ty, rot: -s.rot },
    ].find((t) => {
      const r = shardReach(t, i);
      return inFrame(r.end) && inFrame(r.land);
    });
    return turned ?? s;
  });
  return (
    <Stage>
      <LightPool cx={600} cy={450} r={700} color={palette.risk} opacity={0.13} />
      {/* the Loom holds its frame; its warp threads whip loose one by one */}
      <Loom x={260} y={70} w={680} h={120} floorY={420} warps={9} whip descendMs={300} delayMs={0} lights={false} color={palette.order} />
      {shards.map((s, i) => (
        <SnapShard key={i} {...s} seed={i} color={i % 3 === 0 ? palette.order : palette.energy} />
      ))}
      {/* Panels slam shut and fly open too fast to read — a quarter-cycle
          apart, so there is never a moment when all four sit still */}
      {[
        { x: 185, y: 200, w: 150, h: 108, r: -11 },
        { x: 790, y: 140, w: 170, h: 120, r: 8 },
        { x: 840, y: 570, w: 150, h: 108, r: -7 },
        { x: 200, y: 600, w: 160, h: 112, r: 13 },
      ].map((p, i) => (
        // nothing here is level: the frames land askew and fly open again
        <g key={i} transform={`rotate(${p.r} ${p.x + p.w / 2} ${p.y + p.h / 2})`}>
          <Panel x={p.x} y={p.y} w={p.w} h={p.h} slamLoopMs={FC_SLAM_MS} delayMs={-Math.round((i * FC_SLAM_MS) / 4)} opacity={0.9} />
        </g>
      ))}
      {/* Spark Knots fire wherever two shards cross */}
      {[
        { cx: 420, cy: 330, d: 0 },
        { cx: 690, cy: 430, d: 900 },
        { cx: 330, cy: 520, d: 1800 },
        { cx: 880, cy: 300, d: 2400 },
      ].map((s, i) => (
        <SparkKnot key={i} cx={s.cx} cy={s.cy} size={70} cycleMs={2600} delayMs={s.d} seed={50 + i} crossings={false} />
      ))}
      <TensionScribble y={782} amp={60} step={30} seed={17} color={palette.risk} anim={`cdu-fade 300ms linear 400ms backwards`} />
    </Stage>
  );
}

// ── 6 · held-stillness — Act III ─────────────────────────────────────────────
// Hard cut. Zero tension anywhere on screen. The Slack Net is the only atom
// with a shape; the Tension Line lies flat and unlit along the floor. Nothing
// moves for three seconds — then the Cat blinks once, and that is the cue.
const STILLNESS_CYCLE_MS = 4000; // blink lands at 75% = 3.0s, exactly the hold

function HeldStillnessInner() {
  return (
    <>
      <LightPool cx={600} cy={600} r={430} color={palette.calm} opacity={0.2} />
      <SlackNet x0={300} x1={900} y={600} sag={96} rows={6} gap={15} sagMs={1} delayMs={0} />
      {/* the gauge, flat and unlit along the floor */}
      <path d={`M -160 836 L ${W + 160} 836`} fill="none" stroke={palette.calm} strokeWidth={2} strokeOpacity={0.14} />
    </>
  );
}

function HeldStillnessOverlay() {
  return <Cat cx={600} bottomY={672} width={272} pose="alert" blinkMs={STILLNESS_CYCLE_MS} />;
}

// ── 7 · restoration — Act IV ─────────────────────────────────────────────────
// The same Loom as slide 4 with the opposite feeling. No magenta anywhere.
// Different in kind, not a recolour: the Loom hangs upstage like a fly truss,
// its warps land on the back edge of a real stage floor, the truss rows drop
// onto that floor back to front, and the shards from slide 5 drift in from the
// wings and stand in formation on the rows.
const RS_VPY = 21; // vanishing point height — the floor's side edges meet here
const RS_K = 758; // perspective constant: back edge (z=2) at y=400, front (z=1) at 779
const rsY = (z: number) => RS_VPY + RS_K / z;
const rsHalf = (z: number) => 640 / z; // back edge 280..920, front row off both edges
const RS_LOOM = { x: 280, y: 96, w: 640, h: 120, floorY: 400, warps: 12, delayMs: 0, descendMs: 800, drawMs: 320, staggerMs: 70 };
const RS_ROWS = [1.8, 1.6, 1.4, 1.2, 1];
const RS_ROW_MS = (r: number) => 1450 + r * 230;
/** The formation: row depth z and lane k (between warp k and warp k+1). A wedge. */
const RS_SHARDS: { z: number; k: number }[] = [
  { z: 1.8, k: 5 },
  { z: 1.6, k: 3 },
  { z: 1.6, k: 7 },
  { z: 1.4, k: 1 },
  { z: 1.4, k: 5 },
  { z: 1.4, k: 9 },
  { z: 1.2, k: 2 },
  { z: 1.2, k: 4 },
  { z: 1.2, k: 6 },
  { z: 1.2, k: 8 },
  { z: 1, k: 1 },
  { z: 1, k: 9 },
];

function Restoration() {
  const sched = warpSchedule(RS_LOOM);
  const floorAt = (u: number, z: number) => 600 + u * rsHalf(z);
  const back = rsY(2);
  const front = rsY(1);
  return (
    <Stage>
      <LightPool cx={600} cy={640} r={660} color={palette.order} opacity={0.15} />
      <LightPool cx={600} cy={360} r={380} color={palette.energy} opacity={0.06} />
      {/* the stage floor: a plane, not a rectangle */}
      <g style={{ animation: `cdu-fade 900ms ${EASE_QUAD} 900ms backwards` }}>
        <polygon
          points={`${floorAt(-1, 2)},${back} ${floorAt(1, 2)},${back} ${floorAt(1, 1)},${front} ${floorAt(-1, 1)},${front}`}
          fill={palette.order}
          opacity={0.07}
        />
      </g>
      {/* its two side edges, receding to the back */}
      {[-1, 1].map((u) => (
        <Strand
          key={`e${u}`}
          d={`M ${floorAt(u, 2)} ${back} L ${floorAt(u, 1)} ${front}`}
          color={palette.order}
          w={2.2}
          glow={9}
          opacity={0.7}
          drawMs={700}
          drawDelayMs={900}
        />
      ))}
      <Loom {...RS_LOOM} descendEase={EASE_QUAD} flare held={3} />
      {/* each warp, once landed, runs on down the floor toward the audience */}
      {sched.map((w, i) => {
        const u = (w.cx - 600) / rsHalf(2);
        return (
          <Strand
            key={`f${i}`}
            d={`M ${w.cx.toFixed(1)} ${back} L ${floorAt(u, 1).toFixed(1)} ${front}`}
            color={palette.order}
            w={1.4}
            glow={5}
            opacity={0.5}
            drawMs={520}
            drawDelayMs={w.startMs + w.drawMs}
          />
        );
      })}
      {/* the truss rows drop onto the floor, back to front, each landing with
          an edge-light flaring at both ends */}
      {RS_ROWS.map((z, r) => {
        const y = rsY(z);
        const hw = rsHalf(z);
        const near = 2 - z; // 0.2 at the back, 1 at the front
        return (
          <g key={`r${r}`}>
            <g style={{ animation: `cdu-rowdrop 520ms ${EASE_QUAD} ${RS_ROW_MS(r)}ms backwards` }}>
              <Strand d={`M ${600 - hw} ${y} L ${600 + hw} ${y}`} color={palette.order} w={1.2 + near * 1.6} glow={6 + near * 5} opacity={0.4 + near * 0.45} />
            </g>
            {[-1, 1].map((side) =>
              600 + side * hw < SAFE_X[0] || 600 + side * hw > SAFE_X[1] ? null : (
              <g
                key={side}
                style={{
                  animation: `cdu-glowon 640ms ${EASE_OUT} ${RS_ROW_MS(r) + 420}ms backwards`,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <circle cx={600 + side * hw} cy={y} r={30 / z} fill={palette.energy} opacity={0.18} />
                <circle cx={600 + side * hw} cy={y} r={11 / z} fill={palette.energy} opacity={0.45} />
                <circle cx={600 + side * hw} cy={y} r={4.6 / z} fill={palette.energy} />
              </g>
              ),
            )}
          </g>
        );
      })}
      {/* the freed fragments come back from the wings and stand on the rows */}
      {RS_SHARDS.map(({ z, k }, j) => {
        const u = (k + 1) / 6 - 1;
        const cx = floorAt(u, z);
        const y = rsY(z);
        const sw = 116 / z;
        const sh = sw * 0.5625;
        const fromLeft = u < 0 || (u === 0 && j % 2 === 0);
        const delay = 1500 + j * 95;
        return (
          <g key={`s${j}`}>
            <g
              style={
                {
                  "--wx": `${fromLeft ? -760 : 760}px`,
                  "--wy": `${-(90 + rnd(j, 51) * 120).toFixed(0)}px`,
                  "--wr": `${((fromLeft ? -1 : 1) * (30 + rnd(j, 52) * 40)).toFixed(0)}deg`,
                  animation: `cdu-wing 900ms ${EASE_QUAD} ${delay}ms backwards`,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                } as SVars
              }
            >
              <rect x={cx - sw / 2} y={y - sh - 2} width={sw} height={sh} fill={palette.energy} opacity={0.07} />
              <rect x={cx - sw / 2} y={y - sh - 2} width={sw} height={sh} fill="none" stroke={palette.energy} strokeWidth={8 / z} strokeOpacity={0.16} />
              <rect x={cx - sw / 2} y={y - sh - 2} width={sw} height={sh} fill="none" stroke={palette.energy} strokeWidth={2.2 / z} strokeOpacity={0.9} />
              {/* its reflection in the stage floor */}
              <rect x={cx - sw / 2} y={y + 3} width={sw} height={sh * 0.4} fill="none" stroke={palette.energy} strokeWidth={1.4 / z} strokeOpacity={0.14} />
            </g>
            {/* where it sets down, the row takes its weight and brightens */}
            <g style={{ animation: `cdu-fade 380ms ${EASE_QUAD} ${delay + 820}ms backwards` }}>
              <Strand d={`M ${cx - sw * 0.66} ${y} L ${cx + sw * 0.66} ${y}`} color={palette.energy} w={3 / z} glow={12 / z} opacity={0.95} glowOpacity={0.3} />
            </g>
          </g>
        );
      })}
      {/* the gauge rings down — scribble, to a flat line, to one slow sine —
          and each stage stays behind as a ghost, so the still shows the descent */}
      <g style={{ opacity: 0.08, "--ghost": 0.08, animation: `cdu-ghost 1600ms ${EASE_QUAD} 0ms both` } as SVars}>
        <TensionScribble y={848} amp={58} step={40} seed={21} color={palette.energy} opacity={0.85} />
      </g>
      <g style={{ animation: `cdu-fade 400ms ${EASE_QUAD} 700ms backwards` }}>
        <g style={{ opacity: 0.3, "--ghost": 0.3, animation: `cdu-ghost 1000ms ${EASE_QUAD} 1300ms both` } as SVars}>
          <Strand d={`M -160 848 L ${W + 260} 848`} color={palette.energy} w={2.4} glow={9} />
        </g>
      </g>
      <TensionLine y={848} amp={18} period={380} travelMs={13000} opacity={0.95} anim={`cdu-fade 900ms ${EASE_QUAD} 1500ms backwards`} />
    </Stage>
  );
}

// ── 8 · sofa-mode-reveal — Act IV ────────────────────────────────────────────
// Same sky as slide 7, so the contrast is only the tension. The grid leaves;
// the net arrives wider, in warm light, and widens again when a strand settles.
/** The net's slide-in, and the cat's: one entrance, so the cat is never without its net. */
const SOFA_ENTER = `cdu-enterright 800ms ${EASE_QUAD} 300ms backwards`;

function SofaModeInner() {
  return (
    <>
      <LightPool cx={660} cy={600} r={620} color={palette.calm} opacity={0.17} />
      {/* the cold grid slides off the left edge — gone at rest, so a frozen
          poster shows the lounge, not the grid standing in the net */}
      <g style={{ opacity: 0, animation: `cdu-exitleft 800ms ${EASE_QUAD} 0ms forwards` }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Strand key={i} d={`M ${90 + i * 70} 300 L ${90 + i * 70} 740`} color={palette.order} w={1.6} glow={6} opacity={0.55} />
        ))}
      </g>
      {/* strands drift past overhead at browsing speed, no tension at all */}
      {/* the third lane would run into the right Panel's corner; it drifts
          under both Panels instead */}
      <DriftField count={6} seed={19} color={palette.calm} opacity={0.4} yFrom={110} yTo={330} lanes={{ 2: 346 }} />
      {/* Panels turn their own pages in the distance, slow */}
      <Panel x={140} y={150} w={130} h={92} color={palette.calm} delayMs={900} page opacity={0.42} />
      <Panel x={960} y={190} w={124} h={88} color={palette.calm} delayMs={1400} page opacity={0.38} />
      {/* the net arrives from the right, wider than before, sagging as it
          comes — the cat rides in lying in it (SOFA_ENTER, shared with the overlay) */}
      <g style={{ animation: SOFA_ENTER }}>
        <SlackNet x0={200} x1={1010} y={580} sag={110} rows={6} gap={16} delayMs={300} sagMs={800} extraRow open={{ from: 700, to: 880 }} />
      </g>
      {/* one strand settling in — the reason the net widens by one more row */}
      <Strand
        d={`M 360 300 Q 520 500 612 686`}
        color={palette.calm}
        w={1.8}
        glow={7}
        opacity={0.55}
        drawMs={700}
        drawDelayMs={1200}
      />
    </>
  );
}

function SofaModeOverlay() {
  return <Cat cx={420} bottomY={676} width={226} enterAnim={`cdu-enterright-overlay 800ms ${EASE_QUAD} 300ms backwards`} />;
}

// ── 9 · remix-montage — Act IV ───────────────────────────────────────────────
// Seven Panels, seven one-second previews of the teases to come. Each exits a
// beat before its motif resolves — Act II's timing, on purpose.
/** Panel 7's cut: the halves are apart most of the cycle and whole for the rest. */
const MONTAGE_CUT_MS = 1300;

function RemixMontage() {
  const frames = [
    { x: 110, y: 180, w: 210, h: 150 },
    { x: 350, y: 120, w: 210, h: 150 },
    { x: 590, y: 200, w: 210, h: 150 },
    { x: 830, y: 130, w: 210, h: 150 },
    { x: 210, y: 480, w: 210, h: 150 },
    { x: 480, y: 530, w: 210, h: 150 },
    { x: 750, y: 470, w: 210, h: 150 },
  ];
  const motif = (i: number, x: number, y: number, w2: number, h2: number) => {
    const cx = x + w2 / 2;
    const cy = y + h2 / 2;
    switch (i) {
      case 0: // a single knot ringing
        return <VoiceKnot cx={cx} cy={cy} r={34} seed={61} count={9} w={1.6} glow={6} breatheMs={1800} speak={{ angle: 12, len: 66, delayMs: 300 }} />;
      case 1: // a bubble blurring
        return (
          <>
            <rect x={cx - 52} y={cy - 26} width={104} height={52} rx={20} fill="none" stroke={palette.risk} strokeWidth={1.6} strokeOpacity={0.8} />
            <path d={`M ${cx - 34} ${cy} L ${cx + 34} ${cy}`} stroke={palette.calm} strokeWidth={14} strokeOpacity={0.2} strokeLinecap="round" />
          </>
        );
      case 2: // the Tension Line swelling
        return (
          <g style={{ animation: `cdu-swell 900ms ${EASE_BACK} infinite alternate`, transformBox: "fill-box", transformOrigin: "center" }}>
            {/* four half-periods exactly, so the wave ends inside its own frame */}
            <Strand d={sinePath(cy, 24, 88, x + 17, x + 193)} color={palette.energy} w={2} glow={7} />
          </g>
        );
      case 3: // a slack line and a blinking dot
        return (
          <>
            <Strand d={`M ${x + 16} ${cy - 12} Q ${cx} ${cy + 26} ${x + w2 - 16} ${cy - 12}`} color={palette.calm} w={2} glow={7} />
            <circle cx={cx} cy={cy + 13} r={6} fill={palette.calm} style={{ animation: "cdu-breath 3000ms ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} />
          </>
        );
      case 4: // parallel columns
        return (
          <>
            {Array.from({ length: 11 }, (_, k) => (
              <Strand key={k} d={`M ${x + 16 + k * 18} ${y + 14} L ${x + 16 + k * 18} ${y + h2 - 14}`} color={palette.signal} w={1.3} glow={4} opacity={k === 5 ? 1 : 0.35} />
            ))}
          </>
        );
      case 5: // a loom inside a loom
        return (
          <>
            <rect x={cx - 62} y={cy - 44} width={124} height={88} fill="none" stroke={palette.order} strokeWidth={2} />
            <g style={{ animation: `cdu-quarter 2600ms ${EASE_BACK} infinite`, transformBox: "fill-box", transformOrigin: "center" }}>
              <rect x={cx - 36} y={cy - 26} width={72} height={52} fill="none" stroke={palette.order} strokeWidth={1.6} strokeOpacity={0.8} />
            </g>
          </>
        );
      default: {
        // every strand cut at once: one magenta slash, the halves part up and
        // down, and the set is whole again a beat later. Clipped to its own
        // Panel, so the halves never travel into the frames above.
        const cutY = cy;
        const anim = (name: string) => `${name} ${MONTAGE_CUT_MS}ms ${EASE_OUT} 0ms infinite both`;
        return (
          <>
            <defs>
              <clipPath id="cdu-montage-cut">
                <rect x={x + 4} y={y + 4} width={w2 - 8} height={h2 - 8} />
              </clipPath>
            </defs>
            <g clipPath="url(#cdu-montage-cut)">
              {Array.from({ length: 7 }, (_, k) => {
                const sx = x + 27 + k * 26;
                return (
                  <g key={k}>
                    <g style={{ "--sx": `${(k - 3) * 6}px`, animation: anim("cdu-cutup") } as SVars}>
                      <Strand d={`M ${sx} ${y + 16} L ${sx} ${cutY - 5}`} color={palette.risk} w={1.6} glow={6} />
                    </g>
                    <g style={{ "--sx": `${(k - 3) * 6}px`, animation: anim("cdu-cutdown") } as SVars}>
                      <Strand d={`M ${sx} ${cutY + 5} L ${sx} ${y + h2 - 14}`} color={palette.risk} w={1.6} glow={6} />
                    </g>
                  </g>
                );
              })}
              <g style={{ opacity: 0, animation: `cdu-cutflash ${MONTAGE_CUT_MS}ms linear 0ms infinite both` }}>
                <Strand d={`M ${x + 12} ${cutY + 6} L ${x + w2 - 12} ${cutY - 6}`} color={palette.calm} w={2.2} glow={10} glowOpacity={0.3} />
              </g>
            </g>
          </>
        );
      }
    }
  };
  return (
    <Stage>
      <LightPool cx={600} cy={430} r={700} color={palette.risk} opacity={0.08} />
      {frames.map((f, i) => (
        <g key={i} style={{ animation: `cdu-fade 300ms ${EASE_BACK} ${i * 260}ms backwards` }}>
          <Panel x={f.x} y={f.y} w={f.w} h={f.h} color={i % 2 ? palette.energy : palette.risk} delayMs={i * 260} bubble={false} />
          {motif(i, f.x, f.y, f.w, f.h)}
        </g>
      ))}
    </Stage>
  );
}

// ── 10 · tease-origin — Montage ──────────────────────────────────────────────
// Flow and Accumulation at their smallest. The answering strand is invisible
// until the ring reaches it; that is the whole tease.
function FirstVoice() {
  return (
    <Stage>
      <LightPool cx={240} cy={700} r={330} color={palette.energy} opacity={0.12} />
      <VoiceKnot cx={236} cy={694} r={54} seed={71} count={11} breatheMs={3600} speak={{ angle: -34, len: 330, delayMs: 300 }} />
      {/* the strand that was not visible until it lit */}
      <Strand
        d={`M 980 214 L 700 420`}
        color={palette.calm}
        w={2}
        glow={8}
        opacity={0.9}
        drawMs={500}
        drawDelayMs={1600}
      />
      {/* the answering ring rides that strand, so it travels along its angle */}
      <g transform={`rotate(${((Math.atan2(420 - 214, 700 - 980) * 180) / Math.PI).toFixed(2)} 980 214)`}>
        <g
          style={
            {
              opacity: 0,
              "--len": `${Math.hypot(700 - 980, 420 - 214).toFixed(0)}px`,
              animation: `cdu-travel 900ms linear 1700ms infinite both`,
            } as SVars
          }
        >
          <circle cx={980} cy={214} r={10} fill="none" stroke={palette.calm} strokeWidth={8} strokeOpacity={0.22} />
          <circle cx={980} cy={214} r={10} fill="none" stroke={palette.calm} strokeWidth={2.2} />
        </g>
      </g>
    </Stage>
  );
}

// ── 11 · tease-culture — Montage ─────────────────────────────────────────────
// Collision only: the corner flashes are the comic timing. The laugh is the
// second Panel's strands vibrating. No faces, no figures.
// A sequence, not a diptych: the first panel is set back — smaller, dimmer,
// upstage-left — and the second cuts in bigger, in front, over its corner, and
// its bubble's tail breaks out of its own frame to point at the first one's line.
const AJ_FIRST = { x: 110, y: 118, w: 420, h: 300 };
const AJ_SECOND = { x: 360, y: 300, w: 620, h: 440 };

function AlmostJoke() {
  // the first panel's bubble rim, lower right — where the tail lands
  const bx = AJ_FIRST.x + AJ_FIRST.w * 0.16;
  const by = AJ_FIRST.y + AJ_FIRST.h * 0.2;
  const bw = AJ_FIRST.w * 0.68;
  const bh = AJ_FIRST.h * 0.42;
  const cr = bh * 0.4;
  const tip = { x: Math.round(bx + bw - cr + cr * 0.78), y: Math.round(by + bh - cr + cr * 0.78) };
  return (
    <Stage>
      <LightPool cx={300} cy={300} r={480} color={palette.risk} opacity={0.11} />
      <LightPool cx={680} cy={560} r={560} color={palette.energy} opacity={0.08} />
      <Panel {...AJ_FIRST} color={palette.risk} delayMs={200} fillMs={1500} opacity={0.72} />
      <Panel {...AJ_SECOND} color={palette.energy} delayMs={1000} laugh hardLaugh solid beats={4} tailTo={tip} />
    </Stage>
  );
}

// ── 12 · tease-surf — Montage ────────────────────────────────────────────────
// The Tension Line's biggest amplitude in the deck. The Fray at the crest is
// the only Decay on the slide and it never completes.
function BeforeTheDrop() {
  return (
    <Stage>
      <LightPool cx={600} cy={620} r={760} color={palette.energy} opacity={0.11} />
      <g style={{ animation: `cdu-swell 1400ms ${EASE_BACK} 0ms backwards`, transformBox: "fill-box", transformOrigin: "center bottom" }}>
        <Strand d={`M -160 880 C 180 860 300 120 620 130 C 860 138 960 520 1360 560`} color={palette.energy} w={4} glow={16} />
        <Strand d={`M -160 900 C 200 890 320 250 620 258 C 880 266 980 600 1360 640`} color={palette.energy} w={2.4} glow={10} opacity={0.5} />
      </g>
      {/* foam of loose fibres at the crest */}
      <Fray x={620} y={132} dir={-1} fibres={9} len={110} seed={27} spread={150} durMs={2600} color={palette.calm} />
      <Fray x={660} y={140} dir={1} fibres={7} len={90} seed={33} spread={130} durMs={2600} color={palette.calm} delayMs={300} />
    </Stage>
  );
}

// ── 13 · tease-zen — Montage ─────────────────────────────────────────────────
// Decay as rest. Two full seconds of nothing moving — built as a real hold —
// then one dot, slower than anything in Act I, and still nothing else.
function AllTheWayDown() {
  return (
    <Stage>
      <LightPool cx={600} cy={470} r={400} color={palette.calm} opacity={0.16} />
      <Strand d={`M -140 430 Q 600 520 1340 430`} color={palette.calm} w={2.6} glow={11} opacity={0.9} />
      <circle
        cx={600}
        cy={474}
        r={11}
        fill={palette.calm}
        style={{
          // the hold is the composition: the pulse does not begin until 2s
          animation: `cdu-breath 5200ms ${EASE_SLOW} 2000ms infinite`,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      />
    </Stage>
  );
}

// ── 14 · tease-ascii — Montage ───────────────────────────────────────────────
// Accumulation as pattern. Eighty strands fall as one body (forty on a
// portrait phone); the glyph is made of strand crossings only.
function EightyColumns() {
  const { isMobile: compact } = useViewport();
  const cols = compact ? 40 : 80;
  const step = W / cols;
  const lit = Math.floor(cols * 0.42);
  return (
    <Stage>
      <LightPool cx={lit * step} cy={450} r={360} color={palette.signal} opacity={0.12} />
      {/* the whole weave drifts as one group — eighty separate animations
          would cost eighty main-thread tickers for one shared motion */}
      <g style={{ "--fall": "120px", animation: `cdu-columns 9000ms linear infinite alternate` } as SVars}>
        {Array.from({ length: cols }, (_, i) => {
          const x = i * step + step / 2;
          const isLit = i === lit;
          return (
            <path
              key={i}
              d={`M ${x.toFixed(1)} -180 L ${x.toFixed(1)} ${H + 180}`}
              stroke={isLit ? palette.signal : palette.energy}
              strokeWidth={isLit ? 2.6 : 1.3}
              strokeOpacity={isLit ? 1 : 0.2 + rnd(i, 51) * 0.3}
              fill="none"
            />
          );
        })}
        {/* the glyph: crossings where the weave meets the lit column */}
        {Array.from({ length: 9 }, (_, r) => {
          const y = 250 + r * 46;
          const axis = lit * step + step / 2;
          // left and right reaches are independent, so the crossings read as a
          // character being woven rather than as rungs on a ladder
          const l = (1 + Math.round(rnd(r, 55) * 5)) * step;
          const rt = (1 + Math.round(rnd(r, 57) * 5)) * step;
          return (
            <path
              key={`g${r}`}
              d={`M ${(axis - l).toFixed(1)} ${y} L ${(axis + rt).toFixed(1)} ${y}`}
              stroke={palette.signal}
              strokeWidth={r === 4 ? 3.4 : 2.2}
              strokeOpacity={0.9}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </g>
    </Stage>
  );
}

// ── 15 · tease-systems — Montage ─────────────────────────────────────────────
// Three nested Looms, each turning a quarter at a time in alternate directions
// like gear teeth made of warp threads. The hatch at the centre stays open.
function MachineOfMachines() {
  const rings = [
    { w: 640, h: 480, warps: 10, ms: 5200, rev: false },
    { w: 400, h: 300, warps: 8, ms: 4200, rev: true },
    { w: 210, h: 158, warps: 6, ms: 3400, rev: false },
  ];
  return (
    <Stage>
      <LightPool cx={600} cy={450} r={520} color={palette.order} opacity={0.1} />
      {rings.map((r, i) => (
        <g
          key={i}
          style={{
            animation: `${r.rev ? "cdu-quarterrev" : "cdu-quarter"} ${r.ms}ms ${EASE_BACK} ${i * 200}ms infinite`,
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        >
          <rect x={600 - r.w / 2} y={450 - r.h / 2} width={r.w} height={r.h} fill="none" stroke={palette.order} strokeWidth={9} strokeOpacity={0.14} />
          <rect x={600 - r.w / 2} y={450 - r.h / 2} width={r.w} height={r.h} fill="none" stroke={palette.order} strokeWidth={2.4} />
          {Array.from({ length: r.warps }, (_, k) => {
            const x = 600 - r.w / 2 + ((k + 0.5) * r.w) / r.warps;
            return (
              <path key={k} d={`M ${x.toFixed(1)} ${450 - r.h / 2} L ${x.toFixed(1)} ${450 + r.h / 2}`} stroke={palette.order} strokeWidth={1.4} strokeOpacity={0.45} fill="none" />
            );
          })}
        </g>
      ))}
      {/* a hatch of light opens at the centre of the smallest */}
      <g style={{ animation: `cdu-hatch 700ms ${EASE_OUT} 900ms backwards`, transformBox: "fill-box", transformOrigin: "center" }}>
        <rect x={548} y={421} width={104} height={58} fill={palette.signal} opacity={0.16} />
        <rect x={548} y={421} width={104} height={58} fill="none" stroke={palette.signal} strokeWidth={2.4} />
      </g>
    </Stage>
  );
}

// ── 16 · tease-api — Montage ─────────────────────────────────────────────────
// The whole material at once: every strand pulls taut, turns magenta for its
// 200ms, and streams upward toward a point that is never shown. Then black.
function CutToBlack() {
  const lines = Array.from({ length: 26 }, (_, i) => {
    const x = -60 + (i * (W + 120)) / 25;
    return { x, sx: (600 - x) * 0.72, delayMs: Math.round(rnd(i, 63) * 260) };
  });
  return (
    <Stage>
      <LightPool cx={600} cy={-40} r={640} color={palette.energy} opacity={0.16} />
      {lines.map((l, i) => (
        <g
          key={i}
          style={
            {
              "--sx": `${l.sx.toFixed(0)}px`,
              animation: `cdu-stream ${CONVERGE_CYCLE_MS}ms ${EASE_BACK} ${l.delayMs}ms infinite`,
            } as SVars
          }
        >
          <Strand d={`M ${l.x.toFixed(0)} ${H + 70} L ${(l.x + l.sx * 0.16).toFixed(0)} 120`} color={palette.energy} w={1.9} glow={7} opacity={0.75} />
          {/* the same 200ms of warning, one last time, on every strand at once */}
          <g style={{ opacity: 0, animation: `cdu-warn-converge ${CONVERGE_CYCLE_MS}ms linear ${l.delayMs}ms infinite both` }}>
            <path d={`M ${l.x.toFixed(0)} ${H + 70} L ${(l.x + l.sx * 0.16).toFixed(0)} 120`} stroke={palette.risk} strokeWidth={3} fill="none" />
          </g>
        </g>
      ))}
      {/* on the beat, cut to black */}
      <rect
        x={-200}
        y={-200}
        width={W + 400}
        height={H + 400}
        fill={palette.ink}
        style={{ opacity: 0, animation: `cdu-toblack ${CONVERGE_CYCLE_MS}ms steps(1, start) 0ms infinite both` }}
      />
    </Stage>
  );
}

// ── 17 · api-magic — Finale ──────────────────────────────────────────────────
// Both worlds in one frame. Shards stream down the warp threads from the knots
// above and braid into place tile by tile, each tile brighter than the strands
// that made it. One magenta shard slots in perfectly anyway.
function ApiMagicInner() {
  const tiles = Array.from({ length: 12 }, (_, i) => ({
    x: 130 + (i % 6) * 108,
    y: 560 + Math.floor(i / 6) * 92,
    delayMs: 600 + i * 180,
    magenta: i === 8,
  }));
  return (
    <>
      <LightPool cx={420} cy={640} r={560} color={palette.order} opacity={0.12} />
      <LightPool cx={955} cy={560} r={330} color={palette.calm} opacity={0.16} />
      {/* the knots the material comes from */}
      <VoiceKnot cx={210} cy={170} r={64} seed={81} count={11} breatheMs={4000} />
      <VoiceKnot cx={470} cy={130} r={52} seed={83} count={10} breatheMs={4400} delayMs={500} />
      {/* the Loom's warp threads, now a conveyor */}
      {Array.from({ length: 6 }, (_, i) => (
        <Strand key={i} d={`M ${174 + i * 108} 210 L ${174 + i * 108} 700`} color={palette.order} w={1.5} glow={6} opacity={0.45} />
      ))}
      {/* shards streaming down them */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={`s${i}`} style={{ opacity: 0, animation: `cdu-slotin 1400ms ${EASE_QUAD} ${400 + i * 240}ms infinite both` }}>
          <rect x={174 + i * 108 - 26} y={540} width={52} height={30} fill="none" stroke={palette.energy} strokeWidth={1.8} />
        </g>
      ))}
      {/* and braiding into place, tile by tile */}
      {tiles.map((t, i) => (
        <g
          key={`t${i}`}
          style={{
            animation: `cdu-tile 520ms ${EASE_QUAD} ${t.delayMs}ms backwards`,
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        >
          <rect x={t.x} y={t.y} width={88} height={62} fill={t.magenta ? palette.risk : palette.signal} opacity={0.12} />
          <rect x={t.x} y={t.y} width={88} height={62} fill="none" stroke={t.magenta ? palette.risk : palette.signal} strokeWidth={2} />
          <Braid y={t.y + 31} x0={t.x + 10} x1={t.x + 78} amp={7} period={34} strands={3} color={t.magenta ? palette.risk : palette.signal} drawMs={600} staggerMs={90} delayMs={t.delayMs} w={1.3} />
        </g>
      ))}
      {/* upstage right, watching from the wings */}
      <SlackNet x0={820} x1={1090} y={520} sag={62} rows={4} gap={13} sagMs={1} />
    </>
  );
}

function ApiMagicOverlay() {
  return <Cat cx={955} bottomY={594} width={176} />;
}

// ── 18 · universe-invitation — Finale ────────────────────────────────────────
// Growth. The constellation is every deck presented so far. The slide-shaped
// gap and the open net are the same rectangle at two scales; that rhyme is the
// argument, so both are drawn from the same numbers.
const GAP_W = 180;
/** How far the parted strands keep from the gap's lime rim. */
const GAP_CLEAR = 26;

/**
 * A constellation strand from a to b that parts around a rectangle: straight
 * when it already misses, otherwise bowed away from the rectangle's centre just
 * far enough to clear it. Null when no bow inside the sky clears it — dropped.
 */
function partAround(
  a: { x: number; y: number },
  b: { x: number; y: number },
  box: { x: number; y: number; w: number; h: number },
): string | null {
  const x0 = box.x - GAP_CLEAR;
  const x1 = box.x + box.w + GAP_CLEAR;
  const y0 = box.y - GAP_CLEAR;
  const y1 = box.y + box.h + GAP_CLEAR;
  const hits = (cx: number, cy: number) => {
    for (let k = 0; k <= 40; k += 1) {
      const t = k / 40;
      const qx = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x;
      const qy = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y;
      if (qx > x0 && qx < x1 && qy > y0 && qy < y1) return true;
      if (qy < 30 || qx < SAFE_X[0] - 50 || qx > SAFE_X[1] + 50) return true;
    }
    return false;
  };
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  if (!hits(mx, my)) return `M ${a.x.toFixed(0)} ${a.y.toFixed(0)} L ${b.x.toFixed(0)} ${b.y.toFixed(0)}`;
  // the normal to the strand, pointed away from the gap's centre
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let nx = -(b.y - a.y) / len;
  let ny = (b.x - a.x) / len;
  const bx = box.x + box.w / 2;
  const by = box.y + box.h / 2;
  if ((mx - bx) * nx + (my - by) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  for (let push = 20; push <= 420; push += 10) {
    const cx = mx + nx * push;
    const cy = my + ny * push;
    if (!hits(cx, cy)) return `M ${a.x.toFixed(0)} ${a.y.toFixed(0)} Q ${cx.toFixed(0)} ${cy.toFixed(0)} ${b.x.toFixed(0)} ${b.y.toFixed(0)}`;
  }
  return null;
}

function SlideShapedSpace() {
  const stars = Array.from({ length: 26 }, (_, i) => ({
    x: 60 + rnd(i, 91) * 1080,
    y: 70 + rnd(i, 92) * 420,
    r: 2 + rnd(i, 93) * 3.4,
    ms: 2600 + rnd(i, 94) * 2600,
  }));
  const gapX = 470;
  const gapY = 210;
  const gapH = GAP_W * 0.5625;
  // stars far enough from the gap that the strands can part around it
  const joined = stars.filter((s) => !(s.x > gapX - 70 && s.x < gapX + GAP_W + 70 && s.y > gapY - 60 && s.y < gapY + gapH + 60));
  const gap = { x: gapX, y: gapY, w: GAP_W, h: gapH };
  // the star nearest the gap's left rim, level with it, is where the Braid starts
  const nearest = joined
    .filter((s) => s.x < gapX && s.y > gapY + 12 && s.y < gapY + gapH - 12)
    .reduce((best, s) => (gapX - s.x < gapX - best.x ? s : best));
  return (
    <Stage>
      <LightPool cx={600} cy={260} r={720} color={palette.energy} opacity={0.08} />
      <LightPool cx={600} cy={720} r={520} color={palette.calm} opacity={0.13} />
      {/* faint strands joining knot to knot — the constellation. Any that
          would cross the gap bow around it instead, so the sky parts there */}
      {joined.map((s, i) => {
        const d = partAround(s, joined[(i + 3) % joined.length], gap);
        return d == null ? null : <Strand key={`j${i}`} d={d} color={palette.energy} w={1} glow={4} opacity={0.16} />;
      })}
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={palette.energy}
          style={{ animation: `cdu-twinkle ${s.ms.toFixed(0)}ms ${EASE_SLOW} ${(i * 90).toFixed(0)}ms infinite` }}
        />
      ))}
      {/* the patch of ink the strands part around — exactly slide-shaped */}
      <rect x={gapX} y={gapY} width={GAP_W} height={gapH} fill={palette.ink} />
      <rect x={gapX} y={gapY} width={GAP_W} height={gapH} fill="none" stroke={palette.signal} strokeWidth={8} strokeOpacity={0.16} />
      <rect x={gapX} y={gapY} width={GAP_W} height={gapH} fill="none" stroke={palette.signal} strokeWidth={2.4} />
      {/* a Braid winding from the nearest star all the way to the gap's rim —
          three whole half-turns, so it lands on the lime edge at its axis */}
      <Braid y={nearest.y} x0={nearest.x} x1={gapX - 0.5} amp={11} period={((gapX - nearest.x) * 2) / 3} drawMs={1800} staggerMs={90} delayMs={700} />
      {/* below it, the same rectangle again, at the net's scale */}
      <SlackNet x0={250} x1={960} y={640} sag={96} rows={5} gap={15} sagMs={800} delayMs={200} open={{ from: 515, to: 515 + GAP_W }} />
    </Stage>
  );
}

// ── 19 · closing-thesis — Finale ─────────────────────────────────────────────
// Full black. The Braid from slide 18 runs low across the stage, and its one
// loose strand reaches to the bottom-right corner, where the give-away sits at
// the strand's end as the thing the strand was reaching for.
const LINK_X = 1032;
const LINK_Y = 726;

function TakeTheEngineInner() {
  return (
    <>
      <LightPool cx={520} cy={640} r={560} color={palette.signal} opacity={0.07} />
      {/* one Tension Line pulse under the title, then nothing moves */}
      <TensionLine y={300} amp={18} period={300} color={palette.energy} opacity={0.7} drawMs={900} drawDelayMs={200} w={2.2} glow={9} />
      <Braid y={618} x0={-120} x1={940} amp={16} period={150} drawMs={1800} staggerMs={90} delayMs={500} />
      {/* the loose strand, reaching */}
      <Strand
        d={`M 900 618 C 960 618 990 672 ${LINK_X} ${LINK_Y - 17}`}
        color={palette.signal}
        w={2.4}
        glow={9}
        drawMs={800}
        drawDelayMs={2000}
      />
    </>
  );
}

function TakeTheEngineOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        left: px(LINK_X),
        top: py(LINK_Y),
        transform: "translate(-50%, -50%)",
        pointerEvents: "auto",
      }}
    >
      <CopyLinkButton url={CONNECTED_DECK_REPO_URL} corner={null} inverse title="Copy the ConnectedDeck repo link" />
    </div>
  );
}

// ── Copy-panel typography (right panel) ──────────────────────────────────────
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: MONO,
        fontSize: fs.eyebrow,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: palette.energy,
        margin: "0 0 16px 0",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ display: "inline-block", width: "22px", height: "2px", backgroundColor: palette.energy, borderRadius: "1px", flexShrink: 0 }} />
      {children}
    </p>
  );
}

function SlideTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: `clamp(1.45rem, 6vw, ${fs.title})`,
        fontWeight: 800,
        lineHeight: "1.22em",
        padding: "0 0 0.1em",
        margin: "0 0 18px 0",
        background: `linear-gradient(168deg, ${palette.calm} 0%, ${palette.energy} 52%, ${palette.order} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 18px rgba(25,242,255,0.22))",
        whiteSpace: "pre-line",
      }}
    >
      {children}
    </h2>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: fs.lead, lineHeight: 1.75, color: COPY_MUTED, margin: 0, whiteSpace: "pre-line" }}>{children}</p>;
}

function CopyPanel({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "40px 88px 40px 48px" }}>
      {children}
    </div>
  );
}

const makeSlide = createMakeSlide({ CopyPanel, Eyebrow, SlideTitle, Lead });

// ═════════════════════════════════════════════════════════════════════════════
// DECK
// ═════════════════════════════════════════════════════════════════════════════

export const connectedDeckTrailerDeck: Deck = {
  id: "connected-deck-trailer",
  state: DeckState.Prod,
  title: "Trailer — The Connected Deck Universe",
  summary:
    "A cinematic trailer for the presentation engine itself, told entirely in strands: lines of light that stretch, ring, snap and braid across a near-black sky. It introduces the engine's recurring cast as knots and tensions rather than pictures, and contrasts its two viewing modes, a taut stage where every thread is held to a grid and a slack net where they are allowed to rest. The mood is glossy and trailer-paced, swinging between tension, rupture and calm. It closes with an invitation to take the engine and build with it.",
  tags: ["meta", "craft", "trailer"],
  slides: () => [
    // ── ACT I · Baseline — slow ease-in-out, 800-1200ms ────────────────────
    makeSlide({
      id: "establishing-shot",
      title: "The Connected Deck Universe",
      eyebrow: "Slide 1 · Act I — Baseline",
      lead: "The universe opens above you - strands drifting, knots warming up.",
      content: <EstablishingShot />,
      notes: (
        <>
          <Beat>Slow open — let the first cloud finish a full pulse before speaking. 2s dwell.</Beat>
          <Say>Welcome to the Connected Deck Universe — where ideas travel as clouds, waves, and signals.</Say>
          <Context>
            The &ldquo;cloud&rdquo; the Beat means is the first Voice Knot&rsquo;s breath. Everything here is Flow and
            Accumulation only; nothing pulls taut yet. This slide sets the material: glow, core, the exact stroke
            widths every later slide reuses.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "atom-introduction",
      title: "Meet the Atoms",
      eyebrow: "Slide 2 · Act I — Baseline",
      lead: "Voice Knot, Loom, Snap Shard, Panel, Slack Net, Cat, Tension Line - the characters that carry your ideas.",
      content: (
        <Stage overlay={<AtomLineupOverlay />}>
          <AtomLineupInner />
        </Stage>
      ),
      notes: (
        <>
          <Beat>Medium tempo — name each atom left to right as the lineup settles.</Beat>
          <Say>These are the atoms of the universe — the characters that carry your ideas.</Say>
          <Say>
            The voices live in the clouds. The console runs the stage. The shards are slides — fragments from any
            deck. The panels hold the jokes. And the cat has the best seat in the house.
          </Say>
          <Context>
            The Say&rsquo;s cast maps to the atom vocabulary by name: clouds are Voice Knots, the console is the Loom,
            shards are Snap Shards, the cat is the Cat in the Slack Net. Each atom performs its signature motion once
            as it lands, staggered 400ms, so the lineup is a demo reel of the vocabulary.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "domain-physics",
      title: "Domain Physics",
      eyebrow: "Slide 3 · Act I — Baseline",
      lead: "Flow, pressure, accumulation, decay, collision, growth - every deck obeys the same physics.",
      content: (
        <Stage overlay={<PhysicsLabels />}>
          <PhysicsDiagramInner />
        </Stage>
      ),
      notes: (
        <>
          <Beat>Slow, explanatory — point at each labeled region as you name its force.</Beat>
          <Say>Every deck obeys the same physics — ideas move, collide, and grow.</Say>
          <Say>
            Clouds accumulate. Stale ones thin out and decay. When two fragments collide, they spark — and where they
            spark, something new forms.
          </Say>
          <Context>
            The only slide with labels, by the script&rsquo;s own instruction. The regions are the six physics in the
            order the Say walks them. The Spark Knot region grows a small new knot after the flash, because the second
            Say line promises it.
          </Context>
        </>
      ),
    }),
    // ── ACT II · Tension — ease-out-back, 300-600ms ────────────────────────
    makeSlide({
      id: "first-tension",
      title: "First Tension",
      eyebrow: "Slide 4 · Act II — Tension",
      lead: "The sky darkens a stop. Something descends - a frame of held threads, and where they touch the floor, a stage begins.",
      content: <FirstTension />,
      notes: (
        <>
          <Beat>Accelerate. Speak after the beam snaps on, while the edge-lights flicker alive.</Beat>
          <Say>A new mode arrives — Presenter Mode.</Say>
          <Say>Where the beam lands, a stage begins.</Say>
          <Context>
            The &ldquo;beam&rdquo; is the warp threads unspooling; the &ldquo;edge-lights&rdquo; are their landing
            points on the floor. Presenter Mode is introduced as Pressure held in order: strands straightened, not
            stopped. Act II timing begins here.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "first-collapse",
      title: "First Collapse",
      eyebrow: "Slide 5 · Act II — Tension",
      lead: "Too many strands, too much pull. They snap - and every fragment goes at once.",
      content: <FirstCollapse />,
      notes: (
        <>
          <Beat>Fast — clipped delivery, match the strobe.</Beat>
          <Say>Remix begins — fragments from every deck collide.</Say>
          <Context>
            Collision and Pressure at maximum. The strobe is the magenta pre-snap warning firing everywhere at once. It
            should feel one cut from falling apart; that is the setup for the stillness. Nothing here is readable on
            purpose.
          </Context>
        </>
      ),
    }),
    // ── ACT III · Breaking — one hard cut, then a 3s hold ──────────────────
    makeSlide({
      id: "held-stillness",
      title: "Held Stillness",
      eyebrow: "Slide 6 · Act III — Breaking",
      lead: "Hard cut to quiet. One pool of warm light. The cat looks at the chaos we just left - at us - and blinks once.",
      content: (
        <Stage overlay={<HeldStillnessOverlay />}>
          <HeldStillnessInner />
        </Stage>
      ),
      notes: (
        <>
          <Beat>Hold 3 full seconds before the line. Do not rush this.</Beat>
          <Say>And then… stillness.</Say>
          <Context>
            Act III. Zero tension anywhere on screen; the Slack Net is the only atom with a shape. The Cat&rsquo;s alert
            pose is a cut, not a tween. The blink is the cue for slide 7 and must be the last thing that happens here.
          </Context>
        </>
      ),
    }),
    // ── ACT IV · Restoration — ease-in-out-quad, 400-800ms ─────────────────
    makeSlide({
      id: "restoration",
      title: "Restoration",
      eyebrow: "Slide 7 · Act IV — Restoration",
      lead: "The blink cues the loom. Warp threads drop down the empty stage; the timing grid draws itself like edge-lights.",
      content: <Restoration />,
      notes: (
        <>
          <Beat>Warm. Let two truss rows land before speaking; finish as the grid completes.</Beat>
          <Say>Presenter Mode restores order — pacing, timing, narration.</Say>
          <Context>
            The &ldquo;truss rows&rdquo; are the warp threads landing in rows. Same Loom as slide 4 with the opposite
            feeling: Act IV easing, no magenta anywhere. Order is shown as Accumulation resolved, every strand held at
            the same tension.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "sofa-mode-reveal",
      title: "Sofa Mode",
      eyebrow: "Slide 8 · Act IV — Restoration",
      lead: "From the cold grid into warm light. The net widens, the cat sprawls, strands drift by at browsing speed.",
      content: (
        <Stage overlay={<SofaModeOverlay />}>
          <SofaModeInner />
        </Stage>
      ),
      notes: (
        <>
          <Beat>Slow, cozy — the register flip from stage to living room IS the argument.</Beat>
          <Say>Sofa Mode is your lounge — a place to browse, relax, and explore.</Say>
          <Say>
            Part comic book, part audiobook — the panels turn their own pages while a voice reads low overhead. And
            there&rsquo;s a cushion open, for you.
          </Say>
          <Context>
            The &ldquo;cushion&rdquo; is the open stretch of net; it rhymes with slide 18&rsquo;s gap and is the same
            rectangle. Decay and Growth at once: tension let go, the net widening. Same sky as slide 7, so the contrast
            is only the tension.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "remix-montage",
      title: "Remix Montage",
      eyebrow: "Slide 9 · Act IV — Restoration",
      lead: "Seven strands, seven pulls - a knot, a wave, a still line, a laugh - every one cut a beat before it resolves.",
      content: <RemixMontage />,
      notes: (
        <>
          <Beat>Trailer-style quick cuts — punchy, then hand off to the teases.</Beat>
          <Say>Seven fragments — the kinds of stories this engine was built to tell.</Say>
          <Say>No spoilers. Only vibes.</Say>
          <Context>
            The bridge into the Montage. Act II&rsquo;s timing family returns here on purpose. Every motif is a smaller,
            faster version of slides 10 to 16, so the room recognises them when they arrive.
          </Context>
        </>
      ),
    }),
    // ── MONTAGE — Act II's timing again, seven quick cuts ──────────────────
    makeSlide({
      id: "tease-origin",
      title: "The First Voice",
      eyebrow: "Slide 10 · Montage",
      lead: "One small knot alone in a huge dark sky. It rings - and something answers.",
      content: <FirstVoice />,
      notes: (
        <>
          <Beat>First tease — drop to a hush after the montage. Let the answering ring land.</Beat>
          <Say>Every universe starts with one voice hearing itself for the first time.</Say>
          <Context>
            Flow and Accumulation at their smallest. The answering strand is invisible until the ring reaches it; that
            is the whole tease.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "tease-culture",
      title: "The Joke You Almost See",
      eyebrow: "Slide 11 · Montage",
      lead: "A bubble fills - blurred. A frame mid-laugh. Cut on the laugh, never the line.",
      content: <AlmostJoke />,
      notes: (
        <>
          <Beat>Comic timing — let the second panel&rsquo;s cut-in get its beat before speaking.</Beat>
          <Say>The jokes are real. You had to be there. You can be.</Say>
          <Context>
            Collision only: the Panel&rsquo;s corner flashes are the comic timing. The laugh is the second Panel&rsquo;s
            strands vibrating; no faces, no figures.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "tease-surf",
      title: "Before the Drop",
      eyebrow: "Slide 12 · Montage",
      lead: "The line swells to full frame. Foam of loose fibres at the crest. Cut on the instant before the drop.",
      content: <BeforeTheDrop />,
      notes: (
        <>
          <Beat>Ride the swell — speak on the rise, not the peak.</Beat>
          <Say>Some ideas you don&rsquo;t explain. You ride them.</Say>
          <Context>
            Flow and Pressure. This is the Tension Line&rsquo;s biggest amplitude in the deck; the Fray at the crest is
            the only Decay on the slide and it never completes.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "tease-zen",
      title: "All the Way Down",
      eyebrow: "Slide 13 · Montage",
      lead: "One slack line. One warm light. One dot blinking at breath speed. Two full seconds of nothing moving - in a trailer, that is forever.",
      content: <AllTheWayDown />,
      notes: (
        <>
          <Beat>Match the frame: hold a real two-second silence before the Say.</Beat>
          <Say>One deck dares to slow all the way down.</Say>
          <Context>
            Decay as rest, the Montage&rsquo;s own held frame. The dot is the only motion, it is slower than anything in
            Act I, and it does not start until the two seconds are up. The hold is built as a hold.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "tease-ascii",
      title: "Eighty Columns Wide",
      eyebrow: "Slide 14 · Montage",
      lead: "Eighty strands hang parallel. One ignites. The weave keeps going past the edge of the frame - we never see where it ends.",
      content: <EightyColumns />,
      notes: (
        <>
          <Beat>Let the drift carry — the camera is moving, the voice is calm.</Beat>
          <Say>An entire art form, eighty columns wide.</Say>
          <Context>
            Accumulation as pattern. Forty columns on a portrait phone — same composition, half the density. The glyph
            is made of strand crossings only; no text glyph is drawn.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "tease-systems",
      title: "The Machine That Makes Them",
      eyebrow: "Slide 15 · Montage",
      lead: "A loom inside a loom inside a loom - a machine made of held threads, turning. A hatch of light opens at its centre.",
      content: <MachineOfMachines />,
      notes: (
        <>
          <Beat>Mechanical register — steady, factual, then cut the sentence off clean.</Beat>
          <Say>The machine that makes the machines that make the shows.</Say>
          <Context>
            Pressure and Accumulation, nested by composition only. Three Looms is the limit; the hatch is signal-lime
            and stays open for the cut.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "tease-api",
      title: "Cut to Black",
      eyebrow: "Slide 16 · Montage",
      lead: "Every strand in the sky pulls taut at once and streams upward, converging on something enormous just above the frame line.",
      content: <CutToBlack />,
      notes: (
        <>
          <Beat>Biggest energy of the seven — build through the line, smash-cut into the next slide.</Beat>
          <Say>Any slide. Any deck. One engine.</Say>
          <Context>
            Pressure and Flow, the whole material at once. The convergence point is never shown. The smash-cut into
            slide 17 is the biggest transition in the deck and the only one where the sky goes fully to ink.
          </Context>
        </>
      ),
    }),
    // ── FINALE — Act IV's timing family ────────────────────────────────────
    makeSlide({
      id: "api-magic",
      title: "API Magic",
      eyebrow: "Slide 17 · Finale",
      lead: "The threads become a conveyor - shards stream down from every knot and braid onto the grid, tile by tile. The cat doesn’t lift its head.",
      content: (
        <Stage overlay={<ApiMagicOverlay />}>
          <ApiMagicInner />
        </Stage>
      ),
      notes: (
        <>
          <Beat>Medium — this is the reveal of the trick behind the last seven slides.</Beat>
          <Say>Here is the trick. Every frame you just watched is a React component.</Say>
          <Say>No images, no video, no animation library — just CSS and SVG, in one file you can open and read.</Say>
          <Context>
            Growth and Accumulation as the reveal. The Say makes a factual claim about this deck: no raster, no video,
            no animation library, every frame drawn in this file. The one figure it stages, the cat, is a plain
            component imported from its own file, which is the point of that file. The magenta shard is the one
            callback to Act II and it lands without a snap.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "universe-invitation",
      title: "Your Slide-Shaped Space",
      eyebrow: "Slide 18 · Finale",
      lead: "Pull back until knots become stars. The strands part around one dark patch of sky - exactly slide-shaped. Below, one stretch of net sits open.",
      content: <SlideShapedSpace />,
      notes: (
        <>
          <Beat>Warm acceleration — the CTA setup. Point at the gap, then the cushion.</Beat>
          <Say>This universe expands when you create — your decks become new stars.</Say>
          <Say>Both empty spaces mean the same thing. One of them is yours.</Say>
          <Context>
            Growth. The constellation is every deck presented so far. The gap and the open net are the same rectangle at
            two scales — both drawn from one number — and that rhyme is the argument.
          </Context>
        </>
      ),
    }),
    makeSlide({
      id: "closing-thesis",
      title: "Take the Engine",
      eyebrow: "Slide 19 · Finale",
      lead: "Go get this. Take the engine. Build your universe.",
      content: (
        <Stage bg="#000000" overlay={<TakeTheEngineOverlay />}>
          <TakeTheEngineInner />
        </Stage>
      ),
      notes: (
        <>
          <Beat>Final hold. Speak, then let the end-card breathe until the room moves.</Beat>
          <Say>Go get this. Take the engine. Build your universe.</Say>
          <Say>The button copies the repo link — it&rsquo;s all open source.</Say>
          <Context>
            The button is inside the Stage at the end of the loose strand, never centred, never chrome. The last thing
            on screen is a link, not a logo.
          </Context>
        </>
      ),
    }),
  ],
};
