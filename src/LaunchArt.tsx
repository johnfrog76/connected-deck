import type { ReactNode } from "react";
import { CatDev } from "./decks/cat-dev";

// ── Launch-page art ──────────────────────────────────────────────────────────
// The landing page's CSS art: the plug mark and one living vignette per mode.
// Same rules as deck art — everything is CSS and SVG written in this file, no
// images, no animation library — and the same reason the trailer carries its
// palette as literals: this is art, not chrome. Fluent tokens style the page
// AROUND these scenes; nothing in here reads the theme.
//
// The palette is the trailer's (connected-deck-trailer.tsx), plus a bakelite
// register for the plug and the suitcase: the logo is a vintage two-prong lamp
// plug — brown bakelite body, brass prongs, cloth-covered cord — because
// "connected" is the product name and a plug is the least abstract way to say
// it. The suitcase is molded from the same material on purpose; the mark and
// the mode rhyme.

const P = {
  skyBg: "#090b16",
  loungeBg: "#211711",
  text: "#eef0f6",
  muted: "#98a0b6",
  order: "#8fa3c9", // structured blue-gray — podium's timing grid
  energy: "#46c8f5", // neon azure — live current, narration
  calm: "#f2ede2", // soft white — beams, low stakes
  signal: "#6fe89c", // go-live green — stickers, CTAs
  cloudViolet: "#8b7ab8",
  cloudPeach: "#e8a87c",
  sofa: "#7a4f3c",
  sofaDeep: "#57382b",
  cushion: "#96654c",
  lamp: "#f4c98a",
  ink: "#0d0f18",
  // bakelite + hardware — the Pinterest-board materials
  bakelite: "#6b4534",
  bakeliteMid: "#4a2f22",
  bakeliteDeep: "#2c1a12",
  brass: "#d9b36a",
  brassDeep: "#8a6f3d",
  cord: "#5d3f2d",
  cordBraid: "#8a6247",
} as const;

// One keyframes block for every launch-art mount. Deck stages declare their
// own (lp- names don't collide with tr-), and rs-breathe / rs-zz are re-stated
// here because CatDev's contract is that the HOST declares them.
export function LaunchKeyframes() {
  return (
    <style>{`
      @keyframes lp-settle    { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      @keyframes lp-glowslow  { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.95; } }
      @keyframes lp-twinkle   { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.9; } }
      @keyframes lp-beampulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
      @keyframes lp-ring      { 0% { transform: scale(0.45); opacity: 0.75; } 100% { transform: scale(2.1); opacity: 0; } }
      @keyframes lp-tickglow  { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
      @keyframes lp-note      { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 0.85; } 100% { transform: translateY(-26px); opacity: 0; } }
      /* current runs the cord tip-to-prongs, rests, runs again */
      @keyframes lp-cordpulse { 0% { stroke-dashoffset: 114; opacity: 0; } 6% { opacity: 1; } 52% { stroke-dashoffset: 0; opacity: 1; } 64% { opacity: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }
      @keyframes rs-breathe   { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
      @keyframes rs-zz        { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 0.8; } 100% { transform: translateY(-30px); opacity: 0; } }
      /* the art may move; nobody's vestibular system has to */
      @media (prefers-reduced-motion: reduce) {
        [data-launch-art] *, [data-launch-art] { animation: none !important; }
      }
    `}</style>
  );
}

// ── The mark: a vintage two-prong lamp plug ──────────────────────────────────
// Bakelite body, brass prongs, and the cord coiled underneath the way every
// listing photo on the reference board coils it — self-contained, so the logo
// never needs the layout's permission to trail a cord somewhere. A pulse of
// current runs the cord every few seconds and the prong tips spark when it
// lands: connected, live, the whole pitch in one loop.
const CORD_PATH =
  "M 30 62 C 16 66 8 78 20 86 C 32 94 52 90 54 78 C 56 68 44 62 36 68 C 30 73 32 82 42 82 C 58 82 64 70 74 62 C 80 57 84 56 90 56";

export function PlugLogo({ width = 84 }: { width?: number | string }) {
  return (
    <svg
      width={width}
      viewBox="0 0 148 104"
      style={{ display: "block", overflow: "visible", animation: "lp-settle 0.7s ease-out both" }}
      data-launch-art
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lp-bakelite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.bakelite} />
          <stop offset="0.55" stopColor={P.bakeliteMid} />
          <stop offset="1" stopColor={P.bakeliteDeep} />
        </linearGradient>
        <linearGradient id="lp-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.brassDeep} />
          <stop offset="0.45" stopColor={P.brass} />
          <stop offset="1" stopColor={P.brassDeep} />
        </linearGradient>
      </defs>

      {/* cord: rubber core, then the rayon braid as a dashed overlay, then the
          pulse of current. Same path three times — they can never disagree. */}
      <path d={CORD_PATH} fill="none" stroke={P.cord} strokeWidth="7" strokeLinecap="round" />
      <path
        d={CORD_PATH}
        fill="none"
        stroke={P.cordBraid}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="2.5 4.5"
        opacity="0.5"
      />
      <path
        d={CORD_PATH}
        pathLength={100}
        fill="none"
        stroke={P.energy}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="14 100"
        style={{ animation: "lp-cordpulse 5.5s linear 1.2s infinite" }}
      />

      {/* body: round-shouldered bakelite, one specular arc so it reads molded
          rather than flat */}
      <rect x="86" y="30" width="30" height="40" rx="11" fill="url(#lp-bakelite)" stroke={P.bakeliteDeep} strokeWidth="1.5" />
      <ellipse cx="116" cy="50" rx="5.5" ry="17" fill={P.bakeliteDeep} />
      <path d="M 92 36 Q 90 44 92 56" fill="none" stroke={P.cordBraid} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {/* prongs — flat brass blades, pointing at the wordmark */}
      <rect x="116" y="39" width="24" height="5" rx="1.5" fill="url(#lp-brass)" />
      <rect x="116" y="56" width="24" height="5" rx="1.5" fill="url(#lp-brass)" />

      {/* the spark when the pulse arrives */}
      {[41.5, 58.5].map((y, i) => (
        <circle
          key={y}
          cx="142"
          cy={y}
          r="2.4"
          fill={P.energy}
          style={{ animation: `lp-twinkle 5.5s ease-in-out ${3.6 + i * 0.25}s infinite` }}
        />
      ))}
    </svg>
  );
}

// ── Logotype — the lockup, not the illustration ──────────────────────────────
// Dropbox grammar, per the brand reference: ONE flat color carries both the
// glyph and the wordmark, sitting side by side on a shared baseline — no
// gradients, no second tone, no ornament. The color is the brand's azure
// current (theme.ts speaks the same hue in its brand tokens); the braided-cord
// plug below stays an ILLUSTRATION for art-sized appearances, never the mark.
//
// The glyph is the plug reduced to silhouette: rounded body, two blades,
// facing the wordmark. It survives 16px in a browser tab, which is the test a
// mark has to pass and an illustration never does.
const MARK_COLOR = P.energy;

export function Lockup() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "13px" }} data-launch-art>
      <svg width="50" viewBox="0 0 40 40" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
        <rect x="1" y="7" width="24" height="26" rx="8" fill={MARK_COLOR} />
        <rect x="25" y="13.5" width="14" height="4.6" rx="2.3" fill={MARK_COLOR} />
        <rect x="25" y="21.9" width="14" height="4.6" rx="2.3" fill={MARK_COLOR} />
      </svg>
      {/* a SPAN, not a heading: this is branding, the way a logo image would
          be. The page's real h1 is its content heading (LaunchPage's "How do
          you want to watch?"), so the wordmark stays out of the outline. */}
      <span
        style={{
          margin: 0,
          fontSize: "clamp(1.9rem, 5.4vw, 2.6rem)",
          lineHeight: 1.1,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: MARK_COLOR,
          whiteSpace: "nowrap",
        }}
      >
        ConnectedDeck
      </span>
    </div>
  );
}

// ── Hero backdrop — the vocal-cloud sky behind the masthead ──────────────────
// The Wasteland front door's register: near-black, a few star specks, vapor
// glows low in the mix. Sits behind the masthead text; pointer-events off so
// it's pure weather.
const HERO_STARS = [
  { left: "8%", top: "22%", delay: 0 },
  { left: "22%", top: "62%", delay: 1.4 },
  { left: "38%", top: "14%", delay: 2.6 },
  { left: "58%", top: "70%", delay: 0.8 },
  { left: "74%", top: "24%", delay: 2.0 },
  { left: "90%", top: "56%", delay: 3.2 },
] as const;

export function HeroBackdrop() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} data-launch-art aria-hidden="true">
      <div
        style={{
          position: "absolute",
          left: "-10%",
          top: "-40%",
          width: "60%",
          height: "120%",
          background: `radial-gradient(ellipse at 40% 50%, ${P.cloudViolet}4a 0%, transparent 65%)`,
          animation: "lp-glowslow 9s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-8%",
          bottom: "-50%",
          width: "55%",
          height: "130%",
          background: `radial-gradient(ellipse at 55% 45%, ${P.cloudPeach}3d 0%, transparent 65%)`,
          animation: "lp-glowslow 11s ease-in-out 3s infinite",
        }}
      />
      {/* a dawn note along the floor of the sky — the antidote to overcast */}
      <div
        style={{
          position: "absolute",
          left: "5%",
          bottom: "-55%",
          width: "90%",
          height: "80%",
          background: `radial-gradient(ellipse at 50% 100%, ${P.lamp}24 0%, transparent 70%)`,
        }}
      />
      {HERO_STARS.map((s) => (
        <div
          key={`${s.left}-${s.top}`}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: "2px",
            height: "2px",
            borderRadius: "50%",
            background: P.calm,
            animation: `lp-twinkle 5s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Each mode's accent, for the card HEADINGS (and anything else that wants to
// speak in a scene's voice from outside the scene): sofa is lamplight, podium
// is the timing grid's order-blue, suitcase is go-anywhere signal green. The
// scenes themselves stay caption-free — nothing sits on the art.
export const SCENE_TINTS = {
  sofa: P.lamp,
  podium: P.order,
  suitcase: P.signal,
} as const;

// ── Scene plumbing ───────────────────────────────────────────────────────────
// Every scene fills its card's art band: absolute inset 0, children placed in
// percentages, overflow clipped by the band. The band owns the aspect ratio.
function Scene({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }} data-launch-art>
      {children}
    </div>
  );
}

function GroundShadow({ left, top, w }: { left: string; top: string; w: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        aspectRatio: "6 / 1",
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
      }}
    />
  );
}

// ── Sofa Mode — the lean-back world ──────────────────────────────────────────
// The trailer's sectional, recut for a card: lamp-lit dusk, the sofa, and the
// one occupant Sofa Mode was designed around. The cat breathes; the furniture
// doesn't.
export function SofaScene() {
  return (
    <Scene bg={`linear-gradient(180deg, #1b1226 0%, #281811 55%, #33200f 100%)`}>
      {/* lamp glow — the light source is offscreen; its warmth isn't. Twice
          the alpha it launched with: this scene's whole job is COZY, and an
          under-lit lounge reads as a power cut. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "-30%",
          width: "80%",
          height: "90%",
          background: `radial-gradient(ellipse at 50% 40%, ${P.lamp}5c 0%, transparent 65%)`,
          animation: "lp-glowslow 7s ease-in-out infinite",
        }}
      />
      {/* the pool that light leaves on the seat */}
      <div
        style={{
          position: "absolute",
          left: "22%",
          top: "30%",
          width: "50%",
          height: "45%",
          background: `radial-gradient(ellipse at 50% 50%, ${P.lamp}26 0%, transparent 70%)`,
        }}
      />
      <GroundShadow left="8%" top="86%" w="80%" />

      {/* the sofa — back cushions, seat, arms, legs. Fills the frame now that
          nothing else needs the floor. */}
      <div style={{ position: "absolute", left: "11%", top: "33%", width: "76%", aspectRatio: "3.1 / 1" }}>
        {[0, 34, 68].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: 0,
              width: "31%",
              height: "56%",
              borderRadius: "12% 12% 4% 4%",
              background: `linear-gradient(180deg, ${P.cushion} 0%, ${P.sofa} 90%)`,
              border: `1px solid ${P.sofaDeep}`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "-2%",
            top: "48%",
            width: "104%",
            height: "34%",
            borderRadius: "10px",
            background: `linear-gradient(180deg, ${P.sofa} 0%, ${P.sofaDeep} 100%)`,
            border: `1px solid ${P.sofaDeep}`,
            boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
          }}
        />
        {["-7%", "99%"].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: x,
              top: "34%",
              width: "8%",
              height: "50%",
              borderRadius: "40% 40% 8% 8%",
              background: `linear-gradient(180deg, ${P.cushion} 0%, ${P.sofaDeep} 100%)`,
              border: `1px solid ${P.sofaDeep}`,
            }}
          />
        ))}
        {[6, 48, 90].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: "82%",
              width: "2.4%",
              height: "17%",
              background: "#3a2418",
              borderRadius: "0 0 3px 3px",
            }}
          />
        ))}
      </div>

      {/* resident engineer, off duty. Loaf bottom sits on the seat line. */}
      <div style={{ position: "absolute", left: "33%", top: "19%", width: "32%" }}>
        <CatDev width="100%" zz />
      </div>
    </Scene>
  );
}

// ── Podium Mode — the runway before the room fills ───────────────────────────
// Truss light, lectern, gooseneck mic, and the timing grid as edge-lights —
// podium's whole iconography from the trailer, condensed to one frame.
export function PodiumScene() {
  return (
    <Scene bg={`linear-gradient(180deg, #0b0e1e 0%, #141838 100%)`}>
      {/* violet haze — the pre-show air the beam has to cut through */}
      <div
        style={{
          position: "absolute",
          left: "-15%",
          top: "20%",
          width: "70%",
          height: "90%",
          background: `radial-gradient(ellipse at 40% 60%, ${P.cloudViolet}30 0%, transparent 65%)`,
        }}
      />
      {/* the cone through the haze */}
      <div
        style={{
          position: "absolute",
          left: "24%",
          top: 0,
          width: "52%",
          height: "78%",
          clipPath: "polygon(46% 0%, 54% 0%, 92% 100%, 8% 100%)",
          background: `linear-gradient(180deg, ${P.calm}70 0%, ${P.calm}1a 70%, transparent 100%)`,
          animation: "lp-beampulse 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "48.5%",
          top: "-1%",
          width: "3%",
          aspectRatio: "1 / 1.3",
          background: "#232837",
          border: `1px solid ${P.order}55`,
          borderRadius: "2px",
        }}
      />
      <GroundShadow left="26%" top="90%" w="48%" />

      {/* lectern + gooseneck mic, scaled to own the frame. The capsule pulses
          like something live. */}
      <div
        style={{
          position: "absolute",
          left: "34%",
          top: "46%",
          width: "32%",
          height: "46%",
          clipPath: "polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)",
          background: "linear-gradient(180deg, #2a3040 0%, #141824 100%)",
          borderTop: `2px solid ${P.order}66`,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path d="M 41 47 C 41 35 32 37 34 26" fill="none" stroke="#5a6480" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* the capsule reads LIVE — it's the brightest thing on the lectern */}
      <div
        style={{
          position: "absolute",
          left: "31%",
          top: "18.5%",
          width: "6.5%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 34%, #6a7590 0%, #2a3040 70%)`,
          border: `1.5px solid ${P.energy}`,
          boxShadow: `0 0 14px ${P.energy}88, inset 0 0 4px ${P.energy}44`,
          animation: "lp-glowslow 3.2s ease-in-out infinite",
        }}
      />
      {/* mic goes live — a ring leaves the capsule */}
      <div
        style={{
          position: "absolute",
          left: "29.8%",
          top: "16.2%",
          width: "9%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          border: `1.5px solid ${P.energy}aa`,
          animation: "lp-ring 3.2s ease-out infinite",
        }}
      />

      {/* the timing grid — discipline as edge-lights, running the full floor
          again now that no caption shares the baseline */}
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${8 + i * 10.5}%`,
            top: "90%",
            width: "1.2%",
            height: "7%",
            borderRadius: "2px",
            background: P.order,
            boxShadow: `0 0 12px ${P.order}cc`,
            animation: `lp-tickglow 4s ease-in-out ${i * 0.35}s infinite`,
          }}
        />
      ))}
    </Scene>
  );
}

// ── Suitcase Mode — a deck that plays itself ─────────────────────────────────
// A bakelite-brown case (same material as the plug — the mark and the mode
// rhyme), headphones parked on the lid, and narration rings leaving the case:
// the deck is in there, reading itself to someone whose phone is in a pocket.
export function SuitcaseScene() {
  return (
    <Scene bg={`linear-gradient(180deg, #151021 0%, #241610 100%)`}>
      {/* dusk glow low in the frame — bus-window light, golden-hour warm */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "35%",
          width: "80%",
          height: "75%",
          background: `radial-gradient(ellipse at 50% 80%, ${P.cloudPeach}42 0%, transparent 68%)`,
        }}
      />
      <GroundShadow left="14%" top="88%" w="68%" />

      {/* narration leaving the case */}
      {[0, 2].map((delay) => (
        <div
          key={delay}
          style={{
            position: "absolute",
            left: "32%",
            top: "30%",
            width: "34%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            border: `1.5px solid ${P.energy}99`,
            animation: `lp-ring 4s ease-out ${delay}s infinite`,
          }}
        />
      ))}
      {/* a couple of notes on their way out */}
      {[
        { left: "68%", top: "24%", delay: 0.8, glyph: "♪", color: P.energy },
        { left: "26%", top: "18%", delay: 2.6, glyph: "♩", color: P.calm },
      ].map((n) => (
        <span
          key={n.left}
          style={{
            position: "absolute",
            left: n.left,
            top: n.top,
            fontSize: "clamp(10px, 1.4vw, 16px)",
            color: n.color,
            opacity: 0,
            animation: `lp-note 3.8s ease-out ${n.delay}s infinite`,
          }}
        >
          {n.glyph}
        </span>
      ))}

      {/* handle first — behind the lid line */}
      <div
        style={{
          position: "absolute",
          left: "39%",
          top: "16%",
          width: "22%",
          height: "16%",
          border: `4px solid ${P.bakeliteDeep}`,
          borderBottom: "none",
          borderRadius: "10px 10px 0 0",
        }}
      />
      {/* the case — scaled to own the frame */}
      <div
        style={{
          position: "absolute",
          left: "24%",
          top: "30%",
          width: "54%",
          aspectRatio: "1.45 / 1",
          borderRadius: "9px",
          background: `linear-gradient(160deg, ${P.bakelite} 0%, ${P.bakeliteMid} 55%, ${P.bakeliteDeep} 100%)`,
          border: `1px solid ${P.bakeliteDeep}`,
          boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
        }}
      >
        {/* rim light along the lid — the dusk glow landing on something */}
        <div style={{ position: "absolute", left: "4%", top: 0, width: "92%", height: "2px", borderRadius: "2px", background: `${P.cloudPeach}66` }} />
        {/* lid seam */}
        <div style={{ position: "absolute", left: 0, top: "28%", width: "100%", height: "1.5px", background: "#00000055" }} />
        <div style={{ position: "absolute", left: 0, top: "28.6%", width: "100%", height: "1px", background: `${P.cordBraid}66` }} />
        {/* straps */}
        {["16%", "78%"].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              width: "6%",
              height: "100%",
              background: `${P.bakeliteDeep}88`,
            }}
          />
        ))}
        {/* brass latches riding the straps at the seam */}
        {["14.5%", "76.5%"].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: x,
              top: "24%",
              width: "9%",
              height: "10%",
              borderRadius: "2px",
              background: `linear-gradient(180deg, #f0d28a 0%, ${P.brassDeep} 100%)`,
              border: `1px solid ${P.brassDeep}`,
            }}
          />
        ))}
        {/* travel stickers — where this case has been */}
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: "48%",
            width: "16%",
            height: "13%",
            borderRadius: "3px",
            transform: "rotate(-10deg)",
            background: `${P.signal}33`,
            border: `1px solid ${P.signal}bb`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "52%",
            top: "62%",
            width: "13%",
            height: "13%",
            borderRadius: "50%",
            transform: "rotate(8deg)",
            background: `${P.cloudViolet}3d`,
            border: `1px solid ${P.cloudViolet}bb`,
          }}
        />
      </div>

      {/* headphones hooked over the handle, cups resting on the lid — the
          listener's half of the deal. Drawn after the case so they sit on it. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path d="M 45 16 A 9.5 12 0 0 1 64 16" fill="none" stroke="#3c4356" strokeWidth="2.6" strokeLinecap="round" />
        <rect x="41" y="14" width="7" height="12" rx="2.8" fill="#232837" stroke="#4a5268" strokeWidth="0.8" />
        <rect x="60.5" y="14" width="7" height="12" rx="2.8" fill="#232837" stroke="#4a5268" strokeWidth="0.8" />
      </svg>
    </Scene>
  );
}
