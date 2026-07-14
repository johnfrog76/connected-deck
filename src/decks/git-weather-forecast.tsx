import type { CSSProperties, ReactNode } from "react";
import { tokens } from "@fluentui/react-components";
import { ComponentFrame } from "../deck-engine/ComponentFrame";
import { CopyLinkButton } from "../deck-engine/CopyLinkButton";
import { DemoSprintVelocity } from "./DemoSprintVelocity";
import { Say, Beat } from "../deck-engine/PresenterNoteKit";
import type { Deck, Slide } from "./types";

const REPO_URL = "https://github.com/johnfrog76/connected-deck";

// ── Type scale — shared with the engineering-os deck (4px grid) ──────────────
const fs = {
  eyebrow: "0.75rem",
  body: "1rem",
  lead: "1.25rem",
  title: "2.5rem",
} as const;

// ── Presentation typography helpers (mirrors engineering-os) ─────────────────

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: fs.eyebrow,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: tokens.colorBrandForeground1,
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
          backgroundColor: tokens.colorBrandForeground1,
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
        margin: "0 0 20px 0",
        background: "linear-gradient(160deg, #ffffff 0%, #c8d8f8 60%, #9ab0d8 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 24px rgba(160,195,255,0.18))",
        whiteSpace: "pre-line",
      }}
    >
      {children}
    </h2>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: fs.lead,
        lineHeight: 1.75,
        color: "#7a8faa",
        textShadow: "0 0 30px rgba(120,150,200,0.12)",
        margin: "0 0 24px 0",
      }}
    >
      {children}
    </p>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: fs.body,
            lineHeight: 1.6,
            color: "#6e7fa0",
            paddingLeft: "14px",
            borderLeft: "2px solid #2d4a7a",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
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
        padding: "40px 88px 40px 48px",
      }}
    >
      {children}
    </div>
  );
}

// ── CSS-as-art keyframes ─────────────────────────────────────────────────────
// One <style> block, mounted inside each animated visual. Duplicate @keyframes
// names across mounts are harmless — the browser keeps the first definition.
function WeatherKeyframes() {
  return (
    <style>{`
      @keyframes wx-drift  { from { transform: translateX(-8%); } to { transform: translateX(8%); } }
      @keyframes wx-drift2 { from { transform: translateX(6%); }  to { transform: translateX(-10%); } }
      @keyframes wx-pulse  { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      @keyframes wx-flash  { 0%,92%,100% { opacity: 0; } 94%,97% { opacity: 1; } }
      @keyframes wx-flash2 { 0%,80%,100% { opacity: 0; } 84%,88% { opacity: 1; } }
      @keyframes wx-rain   { from { transform: translateY(-100%); } to { transform: translateY(400%); } }
      @keyframes wx-spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes wx-shimmer{ 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      @keyframes wx-heat   { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-2px) scaleY(1.015); } }
      @keyframes wx-fly    { from { transform: translateX(-6vw); } to { transform: translateX(70vw); } }
      @keyframes wx-sway   { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
      @keyframes wx-swirl  {
        0%   { transform: translateX(calc(var(--r) * -1)) scale(0.6); opacity: 0.3; }
        25%  { transform: translateX(0)                   scale(1.1); opacity: 1; }
        50%  { transform: translateX(var(--r))            scale(0.6); opacity: 0.3; }
        75%  { transform: translateX(0)                   scale(0.45); opacity: 0.15; }
        100% { transform: translateX(calc(var(--r) * -1)) scale(0.6); opacity: 0.3; }
      }
      @keyframes wx-fling  {
        0%   { transform: translate(0, 0) rotate(0deg) scale(0.5); opacity: 0; }
        12%  { opacity: 1; }
        100% { transform: translate(var(--fx), var(--fy)) rotate(var(--fr)) scale(1); opacity: 0; }
      }
      @keyframes wx-dust   { 0%,100% { transform: translateX(-50%) scale(1); opacity: 0.5; } 50% { transform: translateX(-50%) scale(1.25); opacity: 0.8; } }
      @keyframes wx-gustdraw {
        0%   { stroke-dashoffset: 1; }
        10%  { stroke-dashoffset: 1; }
        75%  { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes wx-approach {
        0%   { transform: translate(0, 0) scale(0.28); opacity: 0; }
        8%   { opacity: 1; }
        100% { transform: translate(-30vw, 4vh) scale(1.9); opacity: 1; }
      }
    `}</style>
  );
}

// ── Reusable CSS-art atoms ───────────────────────────────────────────────────

function Stage({ children, bg }: { children: ReactNode; bg: string }) {
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
      <WeatherKeyframes />
      {children}
    </div>
  );
}

function Sun({
  size,
  top,
  left,
  right,
  core = "#ffe27a",
  edge = "#ff8f3f",
}: {
  size: string;
  top?: string;
  left?: string;
  right?: string;
  core?: string;
  edge?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, ${core} 0%, ${edge} 45%, rgba(255,120,40,0.15) 70%, transparent 78%)`,
        filter: "blur(2px)",
        animation: "wx-pulse 6s ease-in-out infinite",
      }}
    />
  );
}

function Cloud({
  scale = 1,
  top,
  left,
  opacity = 0.85,
  tint = "#e8edf6",
  drift = "wx-drift",
  duration = "26s",
}: {
  scale?: number;
  top: string;
  left: string;
  opacity?: number;
  tint?: string;
  drift?: string;
  duration?: string;
}) {
  const puff = (w: number, h: number, x: number, y: number) => (
    <span
      style={{
        position: "absolute",
        left: `${x}px`,
        bottom: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: "50%",
        background: tint,
      }}
    />
  );
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "left bottom",
        animation: `${drift} ${duration} ease-in-out infinite alternate`,
        filter: "blur(1px)",
      }}
    >
      <div style={{ position: "relative", width: "260px", height: "90px" }}>
        {puff(120, 120, 70, 0)}
        {puff(90, 90, 20, 0)}
        {puff(90, 90, 150, 0)}
        <span
          style={{
            position: "absolute",
            left: "0",
            bottom: "0",
            width: "260px",
            height: "46px",
            borderRadius: "40px",
            background: tint,
          }}
        />
      </div>
    </div>
  );
}

function Bolt({
  left,
  top,
  scale = 1,
  anim = "wx-flash",
  duration = "4s",
  delay = "0s",
  color = "#fff3b0",
}: {
  left: string;
  top: string;
  scale?: number;
  anim?: string;
  duration?: string;
  delay?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: `scale(${scale})`,
        transformOrigin: "top center",
        animation: `${anim} ${duration} steps(1) infinite`,
        animationDelay: delay,
      }}
    >
      <div
        style={{
          clipPath: "polygon(50% 0%, 18% 55%, 42% 55%, 22% 100%, 78% 42%, 52% 42%, 74% 0%)",
          background: color,
          width: "70px",
          height: "150px",
          filter: `drop-shadow(0 0 18px ${color}) drop-shadow(0 0 40px ${color})`,
        }}
      />
    </div>
  );
}

function Rain({ count = 40, color = "rgba(150,180,230,0.5)" }: { count?: number; color?: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-10%",
            left: `${(i / count) * 100 + (i % 3)}%`,
            width: "2px",
            height: `${18 + (i % 4) * 6}px`,
            background: `linear-gradient(${color}, transparent)`,
            animation: `wx-rain ${0.7 + (i % 5) * 0.12}s linear infinite`,
            animationDelay: `${(i % 7) * 0.13}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Slide 1 — Title / the weather report ─────────────────────────────────────
function TitleVisual() {
  return (
    <Stage bg="linear-gradient(160deg, #0b1830 0%, #123a5c 55%, #1d5c7a 100%)">
      <Sun size="620px" top="-140px" right="-200px" />
      <Cloud top="14%" left="6%" scale={1.1} opacity={0.5} tint="#cfe0f2" />
      <Cloud top="6%" left="46%" scale={0.8} opacity={0.35} tint="#cfe0f2" duration="34s" />
      <div
        style={{
          position: "absolute",
          left: "44px",
          bottom: "44px",
          fontSize: "1.35rem",
          fontWeight: 600,
          color: "#dceaff",
          textShadow: "0 0 24px rgba(0,0,0,0.5)",
        }}
      >
        10-Day Forecast · Engineering Edition
      </div>
    </Stage>
  );
}

// ── Slide 2 — why weather ────────────────────────────────────────────────────
function WhyVisual() {
  const map = [
    { term: "Commits", to: "Wind", color: "#7ec8ff" },
    { term: "Churn", to: "Pressure", color: "#ffcf6b" },
    { term: "PRs", to: "Storm fronts", color: "#c79bff" },
  ];
  return (
    <Stage bg="linear-gradient(160deg, #0b1522 0%, #12293f 100%)">
      <Sun size="300px" top="-70px" left="-60px" core="#ffe27a" edge="#ff8f3f" />
      <Cloud top="30%" left="30%" scale={1.2} opacity={0.6} />
      <Bolt left="62%" top="24%" scale={0.9} duration="5s" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: "18px",
          padding: "48px",
        }}
      >
        {map.map((m) => (
          <div key={m.term} style={{ display: "flex", alignItems: "baseline", gap: "18px" }}>
            <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#e8f0ff" }}>{m.term}</span>
            <span style={{ fontSize: "1.4rem", color: "#5a6b86" }}>→</span>
            <span
              style={{
                fontSize: "2.6rem",
                fontWeight: 800,
                color: m.color,
                textShadow: `0 0 26px ${m.color}66`,
              }}
            >
              {m.to}
            </span>
          </div>
        ))}
      </div>
    </Stage>
  );
}

// ── Slide 3 — clear skies ────────────────────────────────────────────────────
function ClearSkiesVisual() {
  return (
    <Stage bg="linear-gradient(160deg, #2a6fa8 0%, #6fb3dd 60%, #a9d6ef 100%)">
      <Sun size="240px" top="60px" left="60px" />
      <Cloud top="60%" left="8%" scale={0.8} opacity={0.85} duration="40s" />
      <Cloud top="70%" left="58%" scale={0.6} opacity={0.7} duration="46s" />
      <div
        style={{
          position: "absolute",
          right: "50px",
          bottom: "44px",
          fontSize: "6rem",
          fontWeight: 800,
          color: "rgba(255,255,255,0.9)",
          textShadow: "0 0 40px rgba(255,255,255,0.4)",
        }}
      >
        Day 1
      </div>
    </Stage>
  );
}

// ── Slide 4 — the first cloud ────────────────────────────────────────────────
function FirstCloudVisual() {
  return (
    <Stage bg="linear-gradient(160deg, #3a6d97 0%, #6ea6cc 100%)">
      <Sun size="220px" top="50px" right="70px" />
      <Cloud top="34%" left="-6%" scale={1.7} opacity={0.55} tint="#dbe6f2" duration="30s" />
      <div
        style={{
          position: "absolute",
          left: "48px",
          bottom: "44px",
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "#eaf2fb",
          maxWidth: "60%",
        }}
      >
        Uncertainty rolls in from the left.
      </div>
    </Stage>
  );
}

// ── Slide 5 — pressure builds ────────────────────────────────────────────────

// A wind streak that always ends in a curl. It draws itself in left → right
// (so the curl coils last, like the tip whipping back), then stays and drifts
// forever with the rest of the wind.
function WindStreak({
  top,
  duration = 4.5,
  delay = 0,
  driftDuration = 4,
  color = "rgba(220,235,255,0.45)",
}: {
  top: string;
  duration?: number;
  delay?: number;
  driftDuration?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: "-4%",
        width: "104%",
        animation: `wx-drift ${driftDuration}s ease-in-out ${delay}s infinite alternate`,
      }}
    >
      <svg
        viewBox="0 0 1200 90"
        width="100%"
        style={{ overflow: "visible", display: "block" }}
      >
        <path
          d="M 0,54
             L 990,54
             C 1050,52 1090,42 1094,26
             C 1097,12 1076,7 1068,19
             C 1061,30 1072,41 1085,36"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          style={{
            strokeDashoffset: 1,
            animation: `wx-gustdraw ${duration}s ease-out ${delay}s forwards`,
          }}
        />
      </svg>
    </div>
  );
}

function PressureVisual() {
  return (
    <Stage bg="linear-gradient(160deg, #2c4763 0%, #46607d 100%)">
      <Cloud top="12%" left="4%" scale={1.6} opacity={0.7} tint="#c4cfdd" duration="24s" />
      <Cloud top="20%" left="54%" scale={1.3} opacity={0.6} tint="#c4cfdd" duration="28s" />
      {/* streaks draw in one by one, each ending in a curl, then keep
          drifting — the wind picking up over the course of the slide */}
      <WindStreak top="10%" />
      <WindStreak top="26%" delay={1.6} driftDuration={5} color="rgba(200,225,255,0.35)" />
      <WindStreak top="41%" delay={3.1} driftDuration={4.4} />
      <WindStreak top="57%" delay={4.7} driftDuration={5.6} color="rgba(200,225,255,0.35)" />
      <WindStreak top="72%" delay={6.2} driftDuration={4.8} />
      <div
        style={{
          position: "absolute",
          right: "50px",
          bottom: "40px",
          fontSize: "5rem",
          fontWeight: 800,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        Day 3
      </div>
    </Stage>
  );
}

// ── Slide 6 — lightning strike (first major PR) ──────────────────────────────
function LightningVisual() {
  return (
    <Stage bg="radial-gradient(circle at 50% 30%, #24344a 0%, #0c1421 70%)">
      <Cloud top="6%" left="20%" scale={1.8} opacity={0.85} tint="#3c4759" duration="26s" />
      <Bolt left="46%" top="18%" scale={1.6} duration="3.2s" />
      <div
        style={{
          position: "absolute",
          left: "48px",
          bottom: "44px",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#fff3b0",
          textShadow: "0 0 24px rgba(255,220,120,0.5)",
        }}
      >
        High energy. High risk.
      </div>
    </Stage>
  );
}

// ── Slide 7 — storm formation → a connected dashboard component ─────────────
// The storm front is the real thing: this is the same trick as any live
// dashboard card wired to your store/API, just fed a frozen sample snapshot
// so the slide never drifts.
function StormVelocityVisual() {
  return (
    <ComponentFrame initialZoom={1.35}>
      <div style={{ width: "640px" }}>
        <DemoSprintVelocity />
      </div>
    </ComponentFrame>
  );
}

// ── Interlude A — the instruments (deliberately boring radar console) ────────
// Intentional tonal break: muted, monospace, gridded. These are the real
// goStressCheck readouts with their real deficit-health thresholds.
const MONO = "'Cascadia Code', 'Fira Code', 'Consolas', monospace";

function Gauge({
  reading,
  label,
  sub,
  band,
}: {
  reading: string;
  label: string;
  sub: string;
  band: "good" | "warn" | "danger";
}) {
  const color = band === "danger" ? "#e06c6c" : band === "warn" ? "#d9a441" : "#5fae6e";
  return (
    <div
      style={{
        border: "1px solid #3a5078",
        borderLeft: `4px solid ${color}`,
        borderRadius: "6px",
        background: "#1a2640",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: `0 3px 16px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.02)`,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          color: "#93a8cc",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: "2rem",
          fontWeight: 700,
          color,
          lineHeight: 1,
          textShadow: `0 0 20px ${color}66`,
        }}
      >
        {reading}
      </span>
      <span style={{ fontFamily: MONO, fontSize: "0.72rem", color: "#7688a8" }}>{sub}</span>
    </div>
  );
}

function InstrumentsVisual() {
  return (
    // Opens zoomed in, presenter pulls back with ZoomControl.
    <ComponentFrame initialZoom={1.85}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0e18",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(90,110,150,0.06) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(90,110,150,0.06) 0 1px, transparent 1px 40px)",
          padding: "36px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: "0.75rem",
            color: "#5a6b86",
            letterSpacing: "0.1em",
          }}
        >
          goStressCheck · origin/main radar
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <Gauge
            reading="11"
            label="Upstream merges"
            sub="on origin/main since branch · danger ≥ 11"
            band="danger"
          />
          <Gauge
            reading="4,812"
            label="Surface area (churn)"
            sub="lines +/− on default branch"
            band="warn"
          />
          <Gauge
            reading="3"
            label="Merge velocity"
            sub="commits / last 3 days · danger ≤ 8"
            band="warn"
          />
          <Gauge reading="2/6" label="Cadence" sub="active days / elapsed workdays" band="danger" />
        </div>
        <div style={{ fontFamily: MONO, fontSize: "0.72rem", color: "#4c5a75", lineHeight: 1.6 }}>
          {"// none of these are the weather. they're the barometer —"}
          <br />
          {"// pressure readings that fall before the front arrives."}
        </div>
      </div>
    </ComponentFrame>
  );
}

// ── Interlude B — the algorithm (monospace, no motion) ───────────────────────
function AlgorithmVisual() {
  const lines = [
    "$ git fetch origin --quiet",
    "",
    "base   = git merge-base HEAD origin/main",
    "drift  = rev-list --count base..origin/main   # upstream merges",
    "surface= diff --shortstat HEAD~N..HEAD         # lines changed",
    "vel    = log --since=3.days --oneline | wc -l  # throughput",
    "",
    "storm  = deficit(drift,  warn=6,  danger=11)",
    "       | deficit(vel,    warn=6,  danger=8 )",
    "       | pressure(surface / files_touched)",
    "",
    "→ forecast printed BEFORE the merge, not after",
  ];
  return (
    // Wrapped in ComponentFrame so it opens zoomed way in (initialZoom) and the
    // presenter can pull back live with the ZoomControl for a reveal.
    <ComponentFrame initialZoom={2.6}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0e18",
          padding: "40px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
        }}
      >
        <pre
          style={{
            fontFamily: MONO,
            fontSize: "0.98rem",
            lineHeight: 1.75,
            color: "#8ea3c4",
            margin: 0,
            width: "100%",
          }}
        >
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                color: l.startsWith("$")
                  ? "#5fae6e"
                  : l.startsWith("→")
                    ? "#d9a441"
                    : l.includes("#")
                      ? "#8ea3c4"
                      : l.startsWith("storm") || l.includes("deficit") || l.includes("pressure")
                        ? "#c79bff"
                        : "#5a6b86",
              }}
            >
              {l || " "}
            </div>
          ))}
        </pre>
      </div>
    </ComponentFrame>
  );
}

// ── Interlude C — file temperature map (repo heatmap grid) ───────────────────
// Files tinted by touch-frequency. Deterministic pseudo-random layout so the
// map is stable across renders; hot files pulse slowly.
const FILE_TEMPS = [
  0, 1, 0, 2, 0, 0, 1, 0, 3, 0, 1, 0, 1, 0, 0, 1, 2, 0, 0, 3, 1, 0, 0, 1, 0, 2, 1, 0, 0, 1, 0, 0, 2,
  1, 3, 0, 0, 0, 3, 1, 0, 2, 1, 0, 0, 0, 1, 0,
];
const TEMP_COLORS = ["#22314d", "#2d5a8e", "#d9a441", "#e05656"];
const TEMP_LABELS = ["stable", "active", "hot", "volatile"];

function TemperatureMapVisual() {
  return (
    <Stage bg="#0a0e18">
      <div
        style={{
          position: "absolute",
          inset: "48px 48px 96px",
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "8px",
        }}
      >
        {FILE_TEMPS.map((t, i) => (
          <div
            key={i}
            style={{
              borderRadius: "4px",
              background: TEMP_COLORS[t],
              boxShadow: t >= 2 ? `0 0 18px ${TEMP_COLORS[t]}88` : "none",
              animation: t >= 2 ? "wx-pulse 3.5s ease-in-out infinite" : "none",
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: "48px",
          right: "48px",
          bottom: "40px",
          display: "flex",
          gap: "24px",
          fontFamily: MONO,
          fontSize: "0.75rem",
          color: "#7688a8",
        }}
      >
        {TEMP_LABELS.map((label, t) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: TEMP_COLORS[t],
                display: "inline-block",
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </Stage>
  );
}

// ── Interlude D — churn vectors (wind arrows over the repo) ──────────────────
function ChurnArrow({
  top,
  left,
  length,
  angle,
  color,
  delay = "0s",
}: {
  top: string;
  left: string;
  length: number;
  angle: number;
  color: string;
  delay?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        transform: `rotate(${angle}deg)`,
        animation: "wx-drift 5s ease-in-out infinite alternate",
        animationDelay: delay,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            width: `${length}px`,
            height: "3px",
            background: `linear-gradient(90deg, transparent, ${color})`,
            borderRadius: "2px",
          }}
        />
        <span
          style={{
            width: 0,
            height: 0,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
            borderLeft: `12px solid ${color}`,
            filter: `drop-shadow(0 0 8px ${color}aa)`,
          }}
        />
      </div>
    </div>
  );
}

function ChurnVectorsVisual() {
  return (
    <Stage bg="linear-gradient(160deg, #0b1522 0%, #12293f 100%)">
      {/* feature work — long, straight, forward */}
      <ChurnArrow top="16%" left="8%" length={220} angle={-4} color="#7ec8ff" />
      <ChurnArrow top="28%" left="14%" length={180} angle={-6} color="#7ec8ff" delay="0.8s" />
      <ChurnArrow top="40%" left="6%" length={240} angle={-3} color="#7ec8ff" delay="1.6s" />
      {/* refactor — curved/spiraling, rendered as tilted arcs */}
      <ChurnArrow top="58%" left="42%" length={140} angle={-40} color="#c79bff" delay="0.4s" />
      <ChurnArrow top="66%" left="52%" length={120} angle={-100} color="#c79bff" delay="1.2s" />
      <ChurnArrow top="60%" left="58%" length={110} angle={-170} color="#c79bff" delay="2s" />
      {/* bug churn — short, hammering the same spot */}
      <ChurnArrow top="24%" left="68%" length={60} angle={12} color="#e05656" />
      <ChurnArrow top="30%" left="70%" length={55} angle={-8} color="#e05656" delay="0.6s" />
      <ChurnArrow top="36%" left="67%" length={65} angle={4} color="#e05656" delay="1.3s" />
      <div
        style={{
          position: "absolute",
          left: "48px",
          bottom: "40px",
          display: "flex",
          gap: "28px",
          fontFamily: MONO,
          fontSize: "0.78rem",
        }}
      >
        <span style={{ color: "#7ec8ff" }}>— feature (flows forward)</span>
        <span style={{ color: "#c79bff" }}>— refactor (spirals)</span>
        <span style={{ color: "#e05656" }}>— bugs (same spot, again)</span>
      </div>
    </Stage>
  );
}

// ── Slide — radar sweep (git as forecasting engine) ──────────────────────────
const RADAR_BLIPS = [
  { top: "30%", left: "62%", size: 8, delay: "0s" },
  { top: "48%", left: "70%", size: 6, delay: "1.1s" },
  { top: "62%", left: "38%", size: 10, delay: "2.3s" },
  { top: "38%", left: "30%", size: 7, delay: "3.2s" },
  { top: "68%", left: "58%", size: 14, delay: "1.8s" }, // PR
  { top: "26%", left: "44%", size: 6, delay: "2.8s" },
];

function RadarVisual() {
  return (
    <Stage bg="#070b14">
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(78vh, 560px)",
          height: "min(78vh, 560px)",
        }}
      >
        {/* range rings */}
        {[100, 70, 40].map((pct) => (
          <div
            key={pct}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: `${pct}%`,
              height: `${pct}%`,
              borderRadius: "50%",
              border: "1px solid rgba(95,174,110,0.25)",
            }}
          />
        ))}
        {/* crosshairs */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "1px",
            background: "rgba(95,174,110,0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "1px",
            background: "rgba(95,174,110,0.15)",
          }}
        />
        {/* sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, rgba(95,174,110,0.5) 0deg, rgba(95,174,110,0.12) 40deg, transparent 70deg)",
            animation: "wx-spin 5s linear infinite",
          }}
        />
        {/* blips — commits small, PRs large */}
        {RADAR_BLIPS.map((b, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              width: `${b.size}px`,
              height: `${b.size}px`,
              borderRadius: "50%",
              background: "#8fe0a0",
              boxShadow: "0 0 14px rgba(120,230,150,0.8)",
              animation: "wx-pulse 5s ease-in-out infinite",
              animationDelay: b.delay,
            }}
          />
        ))}
        {/* storm cell — multi-repo cluster */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "18%",
            width: "70px",
            height: "56px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(224,86,86,0.65) 0%, transparent 70%)",
            filter: "blur(3px)",
            animation: "wx-pulse 4s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: "44px",
          bottom: "40px",
          fontFamily: MONO,
          fontSize: "0.78rem",
          color: "#5fae6e",
        }}
      >
        sweep: commits · large blips: PRs · red cell: multi-repo change
      </div>
    </Stage>
  );
}

// ── Slide 8 — the wall of work (churn spikes as bars struck by lightning) ─────
function WallOfWorkVisual() {
  const bars = [40, 72, 55, 90, 66, 100, 78, 58];
  return (
    <Stage bg="linear-gradient(180deg, #0c1320 0%, #1a2438 100%)">
      <Bolt left="30%" top="6%" scale={1.2} duration="3s" />
      <Bolt left="66%" top="4%" scale={1} anim="wx-flash2" duration="3.6s" delay="0.4s" />
      <Rain count={28} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "70%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "16px",
          padding: "0 48px 40px",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: "42px",
              height: `${h}%`,
              borderRadius: "6px 6px 0 0",
              background: "linear-gradient(180deg, #7ec8ff 0%, #3a6ea5 100%)",
              boxShadow: "0 0 22px rgba(120,180,255,0.35)",
              animation: "wx-heat 3s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </Stage>
  );
}

// ── Slide 9 — the eye of the storm ───────────────────────────────────────────
function EyeVisual() {
  return (
    <Stage bg="#0a1120">
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          borderRadius: "50%",
          background: "conic-gradient(from 0deg, #1a2740, #2b3d5c, #14203a, #33496e, #1a2740)",
          animation: "wx-spin 40s linear infinite",
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #6fb3dd 0%, #23486a 70%, transparent 100%)",
          boxShadow: "0 0 60px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#eaf2fb",
          fontWeight: 700,
          fontSize: "1.1rem",
        }}
      >
        “on track”
      </div>
    </Stage>
  );
}

// ── Slide 10 — backside wall (PR review flood) ───────────────────────────────
function BacksideVisual() {
  return (
    <Stage bg="linear-gradient(180deg, #131c2e 0%, #0a1120 100%)">
      <Cloud top="4%" left="30%" scale={1.9} opacity={0.9} tint="#333e50" duration="22s" />
      <Bolt left="20%" top="14%" scale={1.1} anim="wx-flash2" duration="3.4s" color="#c7d8ff" />
      <Bolt left="72%" top="10%" scale={1.3} duration="3s" color="#c7d8ff" />
      <Rain count={50} color="rgba(160,190,240,0.6)" />
      <div
        style={{
          position: "absolute",
          left: "48px",
          bottom: "40px",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#c7d8ff",
        }}
      >
        The backside is always worse.
      </div>
    </Stage>
  );
}

// ── Slide 11 — AI heats the system (temperature anomaly bar) ─────────────────
function HeatVisual() {
  return (
    <Stage bg="#0a0e18">
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "8%",
          transform: "translateX(-50%)",
          width: "160px",
          height: "84%",
          borderRadius: "80px",
          background: "linear-gradient(180deg, #ff3b3b 0%, #ff8f3f 30%, #ffe27a 55%, #7ec8ff 100%)",
          filter: "blur(1px)",
          boxShadow: "0 0 80px rgba(255,80,40,0.4)",
          animation: "wx-heat 4s ease-in-out infinite",
        }}
      />
      {/* heat shimmer */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "6%",
          transform: "translateX(-50%)",
          width: "260px",
          height: "88%",
          background:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, transparent 8px)",
          filter: "blur(6px)",
          animation: "wx-heat 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "40px",
          top: "10%",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#ff6b6b",
        }}
      >
        +hot
      </div>
      <div
        style={{
          position: "absolute",
          left: "40px",
          bottom: "10%",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#7ec8ff",
        }}
      >
        baseline
      </div>
    </Stage>
  );
}

// ── Slide 12 — extreme weather events (approaching data tornado) ─────────────

// One ellipse ring of the funnel. Widths taper toward the ground; each ring
// spins at its own rate so the funnel visibly churns instead of reading as a
// static cone.
function FunnelRing({
  top,
  width,
  height,
  duration,
  opacity = 0.75,
}: {
  top: number;
  width: number;
  height: number;
  duration: string;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: `${top}px`,
        left: "50%",
        transform: "translateX(-50%)",
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "50%",
        background:
          "conic-gradient(from 0deg, rgba(150,175,220,0.65) 0deg, rgba(90,110,150,0.15) 90deg, rgba(150,175,220,0.55) 180deg, rgba(90,110,150,0.1) 270deg, rgba(150,175,220,0.65) 360deg)",
        animation: `wx-spin ${duration} linear infinite`,
        filter: "blur(1.5px)",
        opacity,
      }}
    />
  );
}

// A binary digit caught in the vortex: orbits the funnel axis, bright and
// large on the front pass, dim and small behind.
function VortexDigit({
  char,
  top,
  radius,
  duration,
  delay = "0s",
  size = 18,
  color = "#9fe0ff",
}: {
  char: string;
  top: number;
  radius: number;
  duration: string;
  delay?: string;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={
        {
          position: "absolute",
          top: `${top}px`,
          left: "50%",
          "--r": `${radius}px`,
          animation: `wx-swirl ${duration} linear infinite`,
          animationDelay: delay,
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
          fontSize: `${size}px`,
          color,
          textShadow: `0 0 8px ${color}`,
          lineHeight: 1,
        } as CSSProperties
      }
    >
      {char}
    </div>
  );
}

// Git-shaped debris flung out of the funnel.
function FlungDebris({
  label,
  top,
  fx,
  fy,
  fr,
  delay = "0s",
  color = "#c7d8ff",
}: {
  label: string;
  top: number;
  fx: string;
  fy: string;
  fr: string;
  delay?: string;
  color?: string;
}) {
  return (
    <div
      style={
        {
          position: "absolute",
          top: `${top}px`,
          left: "50%",
          "--fx": fx,
          "--fy": fy,
          "--fr": fr,
          animation: "wx-fling 3.4s ease-out infinite",
          animationDelay: delay,
          fontFamily: "ui-monospace, monospace",
          fontSize: "13px",
          fontWeight: 600,
          color,
          whiteSpace: "nowrap",
          opacity: 0,
        } as CSSProperties
      }
    >
      {label}
    </div>
  );
}

function ExtremeVisual() {
  // Funnel rings: taper from a wide churning top to a tight tip near the dust.
  const rings = [
    { top: 0, width: 250, height: 56, duration: "5s" },
    { top: 40, width: 215, height: 48, duration: "4.4s" },
    { top: 78, width: 180, height: 42, duration: "3.8s" },
    { top: 114, width: 145, height: 36, duration: "3.2s" },
    { top: 148, width: 112, height: 30, duration: "2.7s" },
    { top: 180, width: 82, height: 25, duration: "2.2s" },
    { top: 210, width: 56, height: 20, duration: "1.8s" },
    { top: 238, width: 36, height: 16, duration: "1.4s" },
    { top: 264, width: 20, height: 12, duration: "1.1s" },
  ];
  return (
    <Stage bg="radial-gradient(circle at 50% 50%, #14203a 0%, #070b14 75%)">
      {/* tornado path: starts small in the far top-right, bears down on the
          viewer until it fills the frame. One-shot per slide mount. */}
      <div
        style={{
          position: "absolute",
          right: "4%",
          top: "6%",
          width: "300px",
          height: "340px",
          transformOrigin: "80% 20%",
          animation: "wx-approach 14s ease-in forwards",
          opacity: 0,
        }}
      >
      {/* tornado — swaying group of spinning rings with binary debris */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 0%",
          animation: "wx-sway 5s ease-in-out infinite",
        }}
      >
        {/* soft silhouette behind the rings to bind the funnel together */}
        <div
          style={{
            position: "absolute",
            inset: "0 25px",
            clipPath: "polygon(0% 0%, 100% 0%, 62% 55%, 55% 100%, 45% 100%, 38% 55%)",
            background:
              "linear-gradient(180deg, rgba(120,150,200,0.35) 0%, rgba(120,150,200,0.18) 60%, rgba(120,150,200,0.08) 100%)",
            filter: "blur(6px)",
          }}
        />
        {rings.map((r) => (
          <FunnelRing key={r.top} {...r} />
        ))}

        {/* the codebase, airborne: 1s and 0s riding the vortex */}
        <VortexDigit char="1" top={14} radius={150} duration="3.6s" size={22} />
        <VortexDigit char="0" top={34} radius={135} duration="3.1s" delay="-1.2s" size={20} color="#c79bff" />
        <VortexDigit char="0" top={64} radius={120} duration="2.8s" delay="-0.5s" size={19} />
        <VortexDigit char="1" top={92} radius={104} duration="2.5s" delay="-1.8s" size={17} color="#ffd27a" />
        <VortexDigit char="1" top={124} radius={88} duration="2.2s" delay="-0.9s" size={16} color="#c79bff" />
        <VortexDigit char="0" top={156} radius={70} duration="1.9s" delay="-1.4s" size={14} />
        <VortexDigit char="1" top={188} radius={54} duration="1.6s" delay="-0.3s" size={13} color="#ffd27a" />
        <VortexDigit char="0" top={218} radius={38} duration="1.3s" delay="-0.8s" size={12} />
        <VortexDigit char="1" top={246} radius={24} duration="1.1s" delay="-0.4s" size={11} color="#c79bff" />

        {/* refactor shrapnel */}
        <FlungDebris label="+12,408" top={50} fx="-150px" fy="-45px" fr="-30deg" color="#7de08a" />
        <FlungDebris label="−9,873" top={90} fx="140px" fy="-30px" fr="25deg" delay="1.1s" color="#e05656" />
        <FlungDebris label="renamed: 214 files" top={140} fx="-130px" fy="20px" fr="-15deg" delay="2.2s" />

        {/* dust cloud where the funnel meets the repo */}
        <div
          style={{
            position: "absolute",
            top: "268px",
            left: "50%",
            width: "170px",
            height: "44px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(140,160,200,0.45) 0%, rgba(140,160,200,0) 70%)",
            filter: "blur(4px)",
            animation: "wx-dust 2.4s ease-in-out infinite",
          }}
        />
      </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "44px",
          bottom: "40px",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#c7d8ff",
        }}
      >
        10k churn days. Multi-repo refactors. Normal now.
      </div>
    </Stage>
  );
}

// ── Slide 13 — in-house mild climate (grass + sun + picnic) ──────────────────
function MildVisual() {
  return (
    <Stage bg="linear-gradient(180deg, #8fd0ef 0%, #cceafb 55%, #cceafb 60%, #7cc46a 60%, #4a9b3d 100%)">
      <Sun size="200px" top="50px" right="90px" />
      <Cloud top="14%" left="8%" scale={0.9} opacity={0.9} tint="#ffffff" duration="50s" />
      <Cloud top="24%" left="48%" scale={0.7} opacity={0.8} tint="#ffffff" duration="56s" />
      {/* bird */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: 0,
          animation: "wx-fly 14s linear infinite",
          lineHeight: 0,
        }}
      >
        <Bird w={40} />
      </div>
      {/* picnic blanket */}
      <div
        style={{
          position: "absolute",
          right: "70px",
          bottom: "50px",
          width: "150px",
          height: "90px",
          transform: "perspective(300px) rotateX(52deg)",
          background: "repeating-conic-gradient(#e05656 0% 25%, #f4f0e6 0% 50%) 0 / 30px 30px",
          borderRadius: "6px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "44px",
          bottom: "44px",
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#1f3b16",
        }}
      >
        You can actually finish your sandwich.
      </div>
    </Stage>
  );
}

// ── Slide 14 — two climates, one industry (split) ────────────────────────────
function TwoClimatesVisual() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <WeatherKeyframes />
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {/* Stormy */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(180deg, #131c2e 0%, #0a1120 100%)",
          }}
        >
          <Bolt left="40%" top="10%" scale={1.1} duration="3s" />
          <Rain count={24} />
          <div
            style={{
              position: "absolute",
              bottom: "36px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "#c7d8ff",
            }}
          >
            Florida
          </div>
        </div>
        {/* Sunny */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(180deg, #8fd0ef 0%, #cceafb 60%, #4a9b3d 60%)",
          }}
        >
          <Sun size="180px" top="40px" left="40px" />
          <div
            style={{
              position: "absolute",
              bottom: "36px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "#1f3b16",
            }}
          >
            San Diego
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Slide 15 — the punchline (gradient shimmer text) ─────────────────────────
function PunchlineVisual() {
  return (
    <Stage bg="radial-gradient(circle at 50% 50%, #16233d 0%, #070b14 75%)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <span
          style={{
            fontSize: "4.2rem",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.1,
            backgroundImage:
              "linear-gradient(100deg, #6fb3dd 0%, #ffe27a 25%, #ff8f3f 50%, #c79bff 75%, #6fb3dd 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "wx-shimmer 6s linear infinite",
            filter: "drop-shadow(0 0 30px rgba(160,195,255,0.25))",
          }}
        >
          Git is your radar.
        </span>
      </div>
    </Stage>
  );
}

// ── Slide 18 — Thank You (a flock crossing a big gradient sky) ───────────────
const FLOCK = [
  { top: "18%", w: 58, dur: "13s", delay: "0s", opacity: 0.9 },
  { top: "26%", w: 40, dur: "16s", delay: "1.4s", opacity: 0.7 },
  { top: "12%", w: 30, dur: "19s", delay: "0.7s", opacity: 0.55 },
  { top: "34%", w: 68, dur: "11s", delay: "2.2s", opacity: 1 },
  { top: "22%", w: 34, dur: "17s", delay: "3.1s", opacity: 0.6 },
  { top: "40%", w: 46, dur: "14s", delay: "0.3s", opacity: 0.8 },
  { top: "30%", w: 26, dur: "21s", delay: "2.6s", opacity: 0.5 },
  { top: "16%", w: 50, dur: "12.5s", delay: "4s", opacity: 0.85 },
  { top: "46%", w: 32, dur: "18s", delay: "1.1s", opacity: 0.6 },
  { top: "38%", w: 26, dur: "20s", delay: "3.6s", opacity: 0.45 },
];

// A seagull as an inline SVG stroke — two smooth wing arcs meeting at the body.
// SVG guarantees it renders everywhere (no reliance on a Unicode glyph).
function Bird({ w }: { w: number }) {
  return (
    <svg width={w} height={w * 0.42} viewBox="0 0 100 42" fill="none" aria-hidden>
      <path
        d="M4 34 C 22 4, 38 4, 50 24 C 62 4, 78 4, 96 34"
        stroke="#241436"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThankYouVisual() {
  return (
    <Stage bg="linear-gradient(160deg, #f9b56b 0%, #f07f5a 40%, #b0577f 70%, #4a3d78 100%)">
      <Sun size="480px" top="-120px" right="-140px" core="#fff2c2" edge="#ff9a4a" />
      {/* the flock */}
      {FLOCK.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: b.top,
            left: 0,
            opacity: b.opacity,
            animation: `wx-fly ${b.dur} linear infinite`,
            animationDelay: b.delay,
            lineHeight: 0,
          }}
        >
          <Bird w={b.w} />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <span
          style={{
            fontSize: "8rem",
            fontWeight: 800,
            lineHeight: 1,
            textAlign: "center",
            color: "#fff",
            textShadow: "0 4px 30px rgba(0,0,0,0.35), 0 0 60px rgba(255,220,160,0.4)",
          }}
        >
          Thank You
        </span>
      </div>
      <CopyLinkButton url={REPO_URL} title="Copy repo link" />
    </Stage>
  );
}

// ── Deck definition ──────────────────────────────────────────────────────────
export const gitWeatherForecastDeck: Deck = {
  id: "git-weather-forecast",
  title: "Git as a 10-Day Forecast",
  createSlides: (): Slide[] => [
    {
      id: "title",
      notes: (
        <>
          <Beat>Open warm.</Beat>
          <Say>“We track weather because it changes fast. We track git because it changes faster.”</Say>
          <Say>This deck reads your team&apos;s development climate like a forecast.</Say>
          <Beat>The whole visual language is CSS-as-art — no images, all gradients and motion</Beat>
        </>
      ),
      content: <TitleVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Engineering Weather · Forecast</Eyebrow>
          <SlideTitle>{"Team Development:\nGit as a 10-Day Forecast"}</SlideTitle>
          <Lead>Friendly weather metaphors for engineering velocity.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "why-weather",
      notes: (
        <>
          <Beat>Set the metaphor mapping.</Beat>
          <Say>“Commits are wind. Churn is pressure. PRs are storm fronts.”</Say>
          <Say>Weather metaphors make team velocity intuitive — everyone already reads a forecast.</Say>
        </>
      ),
      content: <WhyVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Why Weather?</Eyebrow>
          <SlideTitle>Software Has Weather. Git Shows It.</SlideTitle>
          <Lead>The signals are already in the repo — we just need to read them like a radar.</Lead>
          <Bullets
            items={[
              "Commits are wind — direction and force",
              "Churn is pressure — it builds before it breaks",
              "PRs are storm fronts — where the energy discharges",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "day-1",
      notes: (
        <>
          <Beat>Every sprint starts with optimism.</Beat>
          <Say>The forecast looks great — until the first cold front hits.</Say>
        </>
      ),
      content: <ClearSkiesVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 1 · Clear Skies</Eyebrow>
          <SlideTitle>Calm Start, High Confidence</SlideTitle>
          <Lead>The board is groomed, the plan is clean, and nothing has drifted yet.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "day-2",
      notes: (
        <>
          <Beat>Clouds represent uncertainty.</Beat>
          <Say>Requirements always drift — even if the sprint plan doesn&apos;t.</Say>
        </>
      ),
      content: <FirstCloudVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 2 · The First Cloud</Eyebrow>
          <SlideTitle>Requirements Drift In</SlideTitle>
          <Lead>A single cloud on the horizon — the first “what if we also…”.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "day-3",
      notes: (
        <>
          <Beat>Churn is atmospheric pressure.</Beat>
          <Say>Small commits accumulate into a weather system.</Say>
        </>
      ),
      content: <PressureVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 3 · Pressure Builds</Eyebrow>
          <SlideTitle>Churn Begins</SlideTitle>
          <Lead>Wind streaks pick up. The commits are small, but the system is forming.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "day-4",
      notes: (
        <>
          <Beat>Lightning is a big PR</Beat>
          <Say>— high energy, high risk. This is when the sprint forecast changes.</Say>
        </>
      ),
      content: <LightningVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 4 · Lightning Strike</Eyebrow>
          <SlideTitle>First Major PR Hits</SlideTitle>
          <Lead>One strike lights up the whole sky — and rewrites the forecast.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "day-5-velocity",
      notes: (
        <>
          <Beat>This is the storm front made real.</Beat>
          <Say>Multiple engineers pushing hard shows up as churn and velocity.</Say>
          <Say>
            This is the live SprintVelocity card — commits, merges, churn, my-share, all read from
            git history.
          </Say>
          <Beat>
            Point at the churn tiles: that&apos;s the atmospheric pressure we&apos;ve been talking
            about, now measured
          </Beat>
          <Beat>Git becomes a radar map — the storm isn&apos;t a metaphor here, it&apos;s the data</Beat>
        </>
      ),
      content: <StormVelocityVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 5 · Storm Formation · Live Data</Eyebrow>
          <SlideTitle>Team Velocity Surges</SlideTitle>
          <Lead>
            The storm front is measurable. SprintVelocity reads the same git history and shows the
            pressure system directly.
          </Lead>
          <Bullets
            items={[
              "Commits and merges — the wind speed of the team",
              "Churn tiles — the atmospheric pressure, in lines changed",
              "Git becomes a radar map: the storm is the data",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "instruments",
      notes: (
        <>
          <Beat>Deliberately drop the temperature here</Beat>
          <Say>— the fun visuals stop; this is the barometer.</Say>
          <Say>
            These are the real goStressCheck readouts. The point: git already hands you leading
            indicators, we just rarely look until a weather event forces us to.
          </Say>
          <Beat>
            Upstream merges = drift from origin/main since you branched. It&apos;s your collision
            radar — rising drift means the merge you haven&apos;t done yet is getting worse.
          </Beat>
          <Beat>
            Surface area = churn (lines changed) over files touched. Wide-and-shallow is a breeze;
            narrow-and-deep is a pressure cell.
          </Beat>
          <Beat>
            Merge velocity and cadence are throughput and rhythm — falling velocity late in a
            sprint is a pressure drop.
          </Beat>
          <Beat>
            Land it: none of these are the storm. They&apos;re the barometer that falls before the
            front arrives.
          </Beat>
        </>
      ),
      content: <InstrumentsVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>The Instruments</Eyebrow>
          <SlideTitle>Git Is Already a Weather Station</SlideTitle>
          <Lead>
            Before any storm, the readings are already there. We just don&apos;t check the barometer
            until the window rattles.
          </Lead>
          <Bullets
            items={[
              "Upstream merges — drift from origin/main = collision radar",
              "Surface area — churn over files touched = blast radius",
              "Merge velocity + cadence — throughput and rhythm",
              "Leading indicators, not a post-mortem",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "algorithm",
      notes: (
        <>
          <Beat>The genuinely boring slide — own it.</Beat>
          <Say>No motion, just the arithmetic.</Say>
          <Say>
            goStressCheck fetches origin, finds the merge-base, and counts what&apos;s landed
            upstream since you branched. That drift, plus churn surface area and 3-day velocity,
            feed simple deficit thresholds.
          </Say>
          <Beat>
            The whole trick: it runs the forecast BEFORE the merge, not after the conflict. Cheap
            git plumbing — merge-base, rev-list --count, diff --shortstat.
          </Beat>
          <Beat>
            Pre-empt the question: no ML, no model. Just counting the right things early and
            coloring them against a threshold.
          </Beat>
        </>
      ),
      content: <AlgorithmVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>The Algorithm</Eyebrow>
          <SlideTitle>Cheap Plumbing, Early Warning</SlideTitle>
          <Lead>
            No model — just counting the right things before the merge. merge-base, rev-list, and a
            shortstat.
          </Lead>
          <Bullets
            items={[
              "drift = commits on origin/main since your merge-base",
              "surface = lines changed ÷ files touched",
              "storm = deficit thresholds over drift + velocity",
              "Forecast prints before the conflict, not after",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "temperature-map",
      notes: (
        <>
          <Beat>Still in instrument mode — one more reading: heat.</Beat>
          <Say>
            Some files are calm, some are warm, and a few are red-hot: every change to them
            triggers turbulence.
          </Say>
          <Beat>
            This is <code>git log --name-only</code> aggregated per file — touch frequency over
            the last N weeks. Cheap to compute, brutally honest.
          </Beat>
          <Beat>
            The hot files are almost never a surprise to the team — but they ARE a surprise to the
            roadmap. Estimation should price in file temperature.
          </Beat>
          <Beat>
            Practical move: before a sprint, glance at the map. Work landing in red files gets a
            risk multiplier; work in blue files doesn&apos;t.
          </Beat>
        </>
      ),
      content: <TemperatureMapVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>The Thermal Map</Eyebrow>
          <SlideTitle>Hot Files Behave Like Hot Air</SlideTitle>
          <Lead>
            Touch frequency per file is a temperature reading — and heat is where turbulence forms.
          </Lead>
          <Bullets
            items={[
              "Blue — stable, barely touched",
              "Yellow — steady churn, watch the trend",
              "Red — volatile: every change triggers turbulence",
              "One git log, aggregated per file — no tooling required",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "churn-vectors",
      notes: (
        <>
          <Beat>Churn has direction, not just magnitude.</Beat>
          <Say>Same line count, completely different weather.</Say>
          <Beat>Feature churn flows forward — long straight arrows, new files, additive diffs.</Beat>
          <Beat>
            Refactor churn spirals — it revisits the same modules from different angles. Looks
            alarming in raw numbers, usually healthy.
          </Beat>
          <Beat>
            Bug churn hammers the same spot over and over. Three short arrows into one file is the
            signature of a design problem, not bad luck.
          </Beat>
          <Beat>
            Diagnostic: when churn is high, ask WHICH pattern before reacting. The fix for each is
            different.
          </Beat>
        </>
      ),
      content: <ChurnVectorsVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Churn Vectors</Eyebrow>
          <SlideTitle>Churn Has Direction, Not Just Magnitude</SlideTitle>
          <Lead>
            The same lines-changed number can be a tailwind, a spiral, or a hailstorm — the vector
            tells you which.
          </Lead>
          <Bullets
            items={[
              "Feature churn flows forward — additive, new surface",
              "Refactor churn spirals — same modules, new angles",
              "Bug churn strikes the same spot, again and again",
              "Diagnose the pattern before reacting to the number",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "day-6",
      notes: (
        <>
          <Beat>This is where teams earn their reputation.</Beat>
          <Say>The repo is alive — commits flying, pipelines running.</Say>
        </>
      ),
      content: <WallOfWorkVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 6 · The Wall of Work</Eyebrow>
          <SlideTitle>High Churn, High Throughput</SlideTitle>
          <Lead>Churn spikes rise like bars in the storm — and lightning keeps striking them.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "day-7",
      notes: (
        <>
          <Beat>The eye is deceptive</Beat>
          <Say>
            — it feels calm, but the storm continues. This is when someone says “we&apos;re
            actually on track.”
          </Say>
        </>
      ),
      content: <EyeVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 7 · The Eye of the Storm</Eyebrow>
          <SlideTitle>Temporary Calm — Not Safety</SlideTitle>
          <Lead>The center is clear and quiet. The wall is still spinning around you.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "day-8",
      notes: (
        <>
          <Beat>The backside of the storm is always worse.</Beat>
          <Say>PR reviews stack, comments fly, pipelines break.</Say>
        </>
      ),
      content: <BacksideVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Day 8 · Backside Wall</Eyebrow>
          <SlideTitle>PR Review Flood</SlideTitle>
          <Lead>Lightning from the opposite direction — the review queue is the second front.</Lead>
        </CopyPanel>
      ),
    },
    {
      id: "climate-ai",
      notes: (
        <>
          <Beat>AI isn&apos;t a storm — it&apos;s heat.</Beat>
          <Say>Heat increases volatility. Volatility creates storms.</Say>
          <Say>Suddenly a tiny commit becomes a tropical storm.</Say>
        </>
      ),
      content: <HeatVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Climate Shift</Eyebrow>
          <SlideTitle>AI Raises the Temperature of Development</SlideTitle>
          <Lead>
            It doesn&apos;t add a storm to the map — it warms the whole system so storms form faster.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "extreme",
      notes: (
        <>
          <Beat>AI-heated climates produce extreme events.</Beat>
          <Say>
            10k+ churn days, multi-repo refactors, pipeline storms. Exciting — sometimes too
            exciting.
          </Say>
        </>
      ),
      content: <ExtremeVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Extreme Weather Events</Eyebrow>
          <SlideTitle>Large Weather Events Become Normal</SlideTitle>
          <Lead>
            The data tornado is headed straight for you — the extremes stop being exceptional.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "mild",
      notes: (
        <>
          <Beat>In-house teams often operate in mild climates.</Beat>
          <Say>Long planning cycles. Granular changes. Very stable forecasts.</Say>
        </>
      ),
      content: <MildVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>In-House Mild Climate</Eyebrow>
          <SlideTitle>Quarterly KPIs = Calm, Predictable Weather</SlideTitle>
          <Lead>
            Long cycles, granular changes, stable forecasts — a different climate, not a worse one.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "two-climates",
      notes: (
        <>
          <Beat>Both are great places to live. Just pack different clothes.</Beat>
          <Say>
            Some teams live in Florida — storms every afternoon. Some live in San Diego — 72° and
            sunny forever.
          </Say>
        </>
      ),
      content: <TwoClimatesVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Two Climates, One Industry</Eyebrow>
          <SlideTitle>Stormy vs. Sunny — Both Valid, Both Fun</SlideTitle>
          <Lead>
            The job isn&apos;t to make it sunny. It&apos;s to know which climate you&apos;re in and dress for it.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "radar",
      notes: (
        <>
          <Beat>Pull it all together before the close.</Beat>
          <Say>
            Every reading so far — drift, surface area, heat, vectors — feeds one picture: the
            radar.
          </Say>
          <Beat>It shows pressure before the storm. Drift before the merge. Heat before the churn spike.</Beat>
          <Beat>
            This is the difference between forecasting and reacting: the reactive team learns
            about the storm from the merge conflict; the forecasting team saw the cell forming
            three days out.
          </Beat>
          <Beat>Small blips are commits, big blips are PRs, the red cell is a multi-repo change forming.</Beat>
        </>
      ),
      content: <RadarVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>The Forecasting Engine</Eyebrow>
          <SlideTitle>Git Predicts Storms Before They Form</SlideTitle>
          <Lead>
            Every instrument feeds the same sweep — pressure before the storm, drift before the
            merge, heat before the spike.
          </Lead>
          <Bullets
            items={[
              "Reactive teams learn about storms from merge conflicts",
              "Forecasting teams saw the cell forming days earlier",
              "Same data, same repo — the difference is looking",
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "punchline",
      notes: (
        <>
          <Beat>Land the close slowly.</Beat>
          <Say>“Leadership isn&apos;t about controlling the weather.”</Say>
          <Say>“It&apos;s about forecasting the climate your team operates in. Git is your radar.”</Say>
          <Beat>Pause before Q&amp;A</Beat>
        </>
      ),
      content: <PunchlineVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>The Punchline</Eyebrow>
          <SlideTitle>{"If You Can Read the Climate,\nYou Can Lead the Team"}</SlideTitle>
          <Lead>
            Leadership isn&apos;t controlling the weather — it&apos;s forecasting the climate. Git is
            your radar.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "thank-you",
      notes: (
        <>
          <Beat>The warm close.</Beat>
          <Say>Let the flock cross while you thank the room — dwell here.</Say>
          <Say>Skies clear at sunset, birds heading home. Open it up for questions.</Say>
        </>
      ),
      content: <ThankYouVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Fair Weather Ahead</Eyebrow>
          <SlideTitle>Thank You</SlideTitle>
          <Lead>Read the climate, lead the team — and enjoy the clear skies between storms.</Lead>
        </CopyPanel>
      ),
    },
  ],
};
