import type { CSSProperties, ReactNode } from "react";
import { tokens } from "@fluentui/react-components";
import { Say, Beat, Context } from "../deck-engine/PresenterNoteKit";
import type { Deck, Slide } from "./types";

const fs = {
  eyebrow: "0.75rem",
  body: "1rem",
  lead: "1.25rem",
  title: "2.5rem",
} as const;

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
        background: "linear-gradient(160deg, #ffffff 0%, #d4e8c0 55%, #7cb342 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 24px rgba(124,179,66,0.2))",
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
            borderLeft: "2px solid #4a7c3f",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Punchline({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "24px 0 0",
        fontSize: fs.body,
        fontWeight: 700,
        color: "#a8d86a",
        fontStyle: "italic",
      }}
    >
      {children}
    </p>
  );
}

const PICKLE_GRAD = "linear-gradient(135deg, #3d6b2e 0%, #6b9e3d 35%, #8bc34a 50%, #6b9e3d 65%, #4a7c3f 100%)";
const PICKLE_HIGHLIGHT = "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 45%)";
const BRINE_POOL =
  "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(74,124,63,0.45) 0%, rgba(40,80,45,0.2) 55%, transparent 75%)";

const fullPanelShell: CSSProperties = {
  flex: 1,
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  borderRadius: "12px",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(8,14,12,0.95) 0%, rgba(12,22,18,0.98) 45%, rgba(18,36,28,1) 100%)",
  border: "1px solid rgba(124,179,66,0.22)",
};

function PanelHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div
      style={{
        padding: "18px 28px 16px",
        borderBottom: "1px solid rgba(124,179,66,0.2)",
        background:
          "linear-gradient(90deg, rgba(74,124,63,0.12) 0%, rgba(124,179,66,0.08) 50%, rgba(74,124,63,0.12) 100%)",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#a8d86a",
          marginBottom: "6px",
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#d8e8c8", fontWeight: 700 }}>{title}</div>
    </div>
  );
}

function MasonJarCore({ fill, overflow = false }: { fill: number; overflow?: boolean }) {
  const pickleSlots = overflow
    ? [
        { left: "14%", bottom: "18%", rot: -10, h: 0.22 },
        { left: "34%", bottom: "24%", rot: 4, h: 0.24 },
        { left: "54%", bottom: "16%", rot: 12, h: 0.21 },
        { left: "72%", bottom: "22%", rot: -6, h: 0.23 },
        { left: "24%", bottom: "42%", rot: -18, h: 0.2 },
        { left: "48%", bottom: "46%", rot: 8, h: 0.22 },
        { left: "68%", bottom: "40%", rot: 15, h: 0.19 },
        { left: "38%", bottom: "62%", rot: -8, h: 0.18 },
        { left: "58%", bottom: "66%", rot: 6, h: 0.17 },
      ]
    : [
        { left: "22%", bottom: "20%", rot: -8, h: 0.24 },
        { left: "48%", bottom: "26%", rot: 6, h: 0.26 },
        { left: "68%", bottom: "18%", rot: 14, h: 0.22 },
      ];

  return (
    <div
      style={{
        position: "relative",
        width: "clamp(220px, 34vw, 340px)",
        height: "clamp(320px, 52vw, 520px)",
        animation: overflow ? "pk-jar-shake 3.5s ease-in-out infinite" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "46%",
          height: "11%",
          border: "4px solid rgba(200,220,240,0.4)",
          borderBottom: "none",
          borderRadius: "8px 8px 0 0",
          background: "linear-gradient(180deg, rgba(50,60,70,0.8), rgba(30,40,50,0.9))",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "9% 5% 0",
          border: "4px solid rgba(200,220,240,0.38)",
          borderRadius: "12px 12px 22px 22px",
          background: "rgba(14,22,28,0.55)",
          overflow: overflow ? "visible" : "hidden",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${fill * 100}%`,
            background:
              "linear-gradient(180deg, rgba(100,160,80,0.45) 0%, rgba(60,100,50,0.85) 55%, rgba(45,80,40,0.95) 100%)",
          }}
        />
        {pickleSlots.map((p, i) => {
          const bottomPct = parseFloat(p.bottom);
          const show = overflow || bottomPct / 100 <= fill + 0.08;
          if (!show) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: p.left,
                bottom: p.bottom,
                width: "clamp(28px, 4.5vw, 44px)",
                height: `${p.h * 100}%`,
                maxHeight: "28%",
                borderRadius: "999px",
                background: PICKLE_GRAD,
                transform: `rotate(${p.rot}deg)`,
                boxShadow: "inset -4px 0 8px rgba(0,0,0,0.2)",
                zIndex: overflow && bottomPct > 55 ? 4 : 2,
              }}
            />
          );
        })}
        {overflow && (
          <div
            style={{
              position: "absolute",
              top: "-6%",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(196,92,92,0.9)",
              color: "#fff",
              fontSize: "clamp(0.68rem, 1.1vw, 0.82rem)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontFamily: "monospace",
              zIndex: 5,
              boxShadow: "0 4px 16px rgba(196,92,92,0.45)",
            }}
          >
            OVERFLOW
          </div>
        )}
      </div>
    </div>
  );
}

function JarLimitVisual() {
  return (
    <div style={fullPanelShell}>
      <style>{`
        @keyframes pk-jar-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-1.2deg); }
          75% { transform: rotate(1.2deg); }
        }
      `}</style>
      <PanelHeader eyebrow="Finite capacity" title="Only so many pickles fit — then things break" />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "24px",
          minHeight: 0,
        }}
      >
        <MasonJarCore fill={0.92} overflow />
        <div style={{ width: "min(360px, 90%)", textAlign: "center" }}>
          <div
            style={{
              fontSize: "clamp(0.72rem, 1.1vw, 0.82rem)",
              fontFamily: "monospace",
              color: "#c45c5c",
              marginBottom: "8px",
              fontWeight: 700,
            }}
          >
            context window · 112% full
          </div>
          <div
            style={{
              height: "10px",
              borderRadius: "999px",
              background: "rgba(30,40,35,0.8)",
              overflow: "hidden",
              border: "1px solid rgba(196,92,92,0.35)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, #a8d86a 0%, #c45c5c 85%, #c45c5c 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PickleJuiceVisual() {
  return (
    <div style={fullPanelShell}>
      <style>{`
        @keyframes pk-pour {
          0%, 100% { opacity: 0.55; transform: scaleY(0.85); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes pk-vessel-fill {
          0%, 20% { height: 18%; }
          80%, 100% { height: 72%; }
        }
      `}</style>
      <PanelHeader eyebrow="Compound your learnings" title="Save the brine — don&apos;t start from vinegar every time" />
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "12px",
          padding: "24px 28px",
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ transform: "scale(0.78)", transformOrigin: "center top" }}>
            <MasonJarCore fill={0.38} />
          </div>
          <div style={{ fontSize: "clamp(0.82rem, 1.3vw, 0.95rem)", color: "#6e7fa0", textAlign: "center" }}>
            Session done
            <br />
            <span style={{ color: "#a8d86a" }}>juice remains</span>
          </div>
        </div>

        <div
          style={{
            width: "clamp(16px, 2vw, 24px)",
            height: "clamp(120px, 20vh, 180px)",
            background: "linear-gradient(180deg, rgba(168,216,106,0.15), rgba(124,179,66,0.85), rgba(74,124,63,0.95))",
            borderRadius: "999px",
            animation: "pk-pour 2.8s ease-in-out infinite",
            boxShadow: "0 0 20px rgba(124,179,66,0.35)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              position: "relative",
              width: "clamp(160px, 24vw, 220px)",
              height: "clamp(240px, 36vw, 320px)",
              border: "4px solid rgba(168,216,106,0.35)",
              borderRadius: "16px",
              background: "rgba(14,22,18,0.7)",
              overflow: "hidden",
              boxShadow: "0 0 40px rgba(124,179,66,0.15)",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "72%",
                background:
                  "linear-gradient(180deg, rgba(124,179,66,0.55) 0%, rgba(74,124,63,0.9) 100%)",
                animation: "pk-vessel-fill 4s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "10px",
                fontFamily: "monospace",
                fontSize: "clamp(0.72rem, 1.1vw, 0.82rem)",
                color: "#d8e8c8",
                zIndex: 1,
              }}
            >
              <div>.cursor/rules</div>
              <div>AGENTS.md</div>
              <div>project docs</div>
            </div>
          </div>
          <div style={{ fontSize: "clamp(0.82rem, 1.3vw, 0.95rem)", color: "#a8d86a", fontWeight: 700 }}>
            Preserved brine
          </div>
        </div>
      </div>
    </div>
  );
}

function BonusPicklesVisual() {
  const items = [
    { title: "Not everything pickled", sub: "Sometimes write the for loop", glyph: "🥒✕", tint: "#8891ab" },
    { title: "The crunch test", sub: "Run the tests before you serve", glyph: "🥒✓", tint: "#a8d86a" },
    { title: "Cross-contamination", sub: "One jar, one flavor profile", glyph: "🫙⚠", tint: "#c4a35a" },
    { title: "The pickle-back", sub: "Fresh session, new domain", glyph: "🥃🥒", tint: "#7cb342" },
    { title: "Pickle Rick", sub: "Hallucinated dimension", glyph: "🥒🌀", tint: "#8b5cf6" },
  ];

  return (
    <div style={fullPanelShell}>
      <PanelHeader eyebrow="Q&A ammo" title="Five more pickles if anyone asks" />
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: "1px",
          minHeight: 0,
          background: "rgba(124,179,66,0.12)",
        }}
      >
        {items.map((item) => (
          <div
            key={item.title}
            style={{
              background: "rgba(10,16,14,0.92)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "20px 16px",
              textAlign: "center",
              gridColumn: item.title === "Pickle Rick" ? "1 / -1" : undefined,
            }}
          >
            <div style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", lineHeight: 1 }}>{item.glyph}</div>
            <div style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", fontWeight: 800, color: item.tint }}>
              {item.title}
            </div>
            <div style={{ fontSize: "clamp(0.78rem, 1.2vw, 0.88rem)", color: "#6e7fa0", maxWidth: "220px" }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosingRecapVisual() {
  const principles = [
    { label: "Context", angle: -90 },
    { label: "Shape", angle: -30 },
    { label: "Brine time", angle: 30 },
    { label: "Don't over-pickle", angle: 90 },
    { label: "Respect the jar", angle: 150 },
    { label: "Save the juice", angle: 210 },
  ];

  return (
    <div style={fullPanelShell}>
      <style>{`
        @keyframes pk-orbit-pulse {
          0%, 100% { opacity: 0.75; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
        }
      `}</style>
      <PanelHeader eyebrow="The pickle principles" title="Same brine. Better plating." />
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          padding: "24px",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "clamp(260px, 40vw, 380px)",
            height: "clamp(260px, 40vw, 380px)",
            borderRadius: "50%",
            border: "1px dashed rgba(124,179,66,0.2)",
          }}
        />
        <div style={{ transform: "scale(0.72)", transformOrigin: "center" }}>
          <MasonJarCore fill={0.55} />
        </div>
        {principles.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const orbit = 42;
          return (
            <div
              key={p.label}
              style={{
                position: "absolute",
                left: `${50 + orbit * Math.cos(rad)}%`,
                top: `${50 + orbit * Math.sin(rad)}%`,
                transform: "translate(-50%, -50%)",
                padding: "10px 14px",
                borderRadius: "999px",
                background: "rgba(74,124,63,0.18)",
                border: "1px solid rgba(168,216,106,0.35)",
                color: "#c8e6a0",
                fontSize: "clamp(0.72rem, 1.1vw, 0.85rem)",
                fontWeight: 700,
                whiteSpace: "nowrap",
                animation: "pk-orbit-pulse 4s ease-in-out infinite",
                animationDelay: `${i * 0.35}s`,
              }}
            >
              {p.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PickleWholeVisual() {
  return (
    <div style={{ position: "relative", width: "clamp(52px, 8vw, 72px)", height: "clamp(120px, 18vw, 160px)" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "42% 42% 36% 36%",
          background: PICKLE_GRAD,
          boxShadow: "inset -8px 0 16px rgba(0,0,0,0.18), 0 8px 24px rgba(74,124,63,0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "8% 18% auto 18%",
          height: "55%",
          borderRadius: "inherit",
          background: PICKLE_HIGHLIGHT,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function PickleSpearVisual() {
  return (
    <div
      style={{
        width: "clamp(44px, 7vw, 60px)",
        height: "clamp(130px, 19vw, 170px)",
        background: PICKLE_GRAD,
        clipPath: "polygon(38% 0%, 72% 0%, 88% 100%, 12% 100%)",
        boxShadow: "0 8px 24px rgba(74,124,63,0.35)",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
      }}
    />
  );
}

function PickleChipVisual() {
  return (
    <div
      style={{
        position: "relative",
        width: "clamp(96px, 14vw, 132px)",
        height: "clamp(96px, 14vw, 132px)",
        borderRadius: "50%",
        background: PICKLE_GRAD,
        boxShadow: "inset 0 0 0 clamp(10px, 1.6vw, 14px) rgba(45,74,38,0.55), 0 8px 24px rgba(74,124,63,0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "18%",
          borderRadius: "50%",
          border: "2px dashed rgba(168,216,106,0.35)",
        }}
      />
    </div>
  );
}

function PickleRelishVisual() {
  const pieces = [
    { w: 18, h: 12, r: 4 },
    { w: 14, h: 10, r: 3 },
    { w: 16, h: 11, r: 4 },
    { w: 12, h: 9, r: 3 },
    { w: 15, h: 10, r: 3 },
    { w: 13, h: 8, r: 2 },
    { w: 17, h: 11, r: 4 },
    { w: 11, h: 8, r: 2 },
    { w: 14, h: 9, r: 3 },
    { w: 16, h: 10, r: 3 },
    { w: 12, h: 11, r: 3 },
    { w: 15, h: 9, r: 3 },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        justifyContent: "center",
        alignContent: "center",
        width: "clamp(120px, 18vw, 168px)",
        minHeight: "clamp(96px, 14vw, 132px)",
      }}
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            width: p.w,
            height: p.h,
            borderRadius: p.r,
            background: PICKLE_GRAD,
            opacity: 0.82 + (i % 3) * 0.06,
            transform: `rotate(${(i % 5) * 7 - 14}deg)`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        />
      ))}
    </div>
  );
}

function BrineBubbles() {
  const bubbles = [
    { left: "12%", size: 10 },
    { left: "28%", size: 6 },
    { left: "44%", size: 8 },
    { left: "62%", size: 5 },
    { left: "78%", size: 9 },
    { left: "88%", size: 4 },
  ];
  return (
    <>
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.left,
            bottom: `${8 + (i % 3) * 6}%`,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: "rgba(168,216,106,0.12)",
            border: "1px solid rgba(168,216,106,0.2)",
          }}
        />
      ))}
    </>
  );
}

function ShapeGrid() {
  const shapes: {
    label: string;
    sub: string;
    brine: string;
    Visual: () => JSX.Element;
  }[] = [
    { label: "Whole", sub: "Vibe coding", brine: "Immerse & explore", Visual: PickleWholeVisual },
    { label: "Spears", sub: "Ralph loops", brine: "Scoped & structured", Visual: PickleSpearVisual },
    { label: "Chips", sub: "Spec-kit", brine: "Uniform & stackable", Visual: PickleChipVisual },
    { label: "Relish", sub: "Micro-edits", brine: "Distributed & fine", Visual: PickleRelishVisual },
  ];

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(8,14,12,0.95) 0%, rgba(12,22,18,0.98) 45%, rgba(18,36,28,1) 100%)",
        border: "1px solid rgba(124,179,66,0.22)",
      }}
    >
      <div
        style={{
          padding: "20px 28px 18px",
          borderBottom: "1px solid rgba(124,179,66,0.2)",
          background:
            "linear-gradient(90deg, rgba(74,124,63,0.12) 0%, rgba(124,179,66,0.08) 50%, rgba(74,124,63,0.12) 100%)",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a8d86a",
            marginBottom: "6px",
          }}
        >
          The power of the brine
        </div>
        <div style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#d8e8c8", fontWeight: 700 }}>
          Same brine · different cut · same flavor profile
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          minHeight: 0,
          gap: "1px",
          background: "rgba(124,179,66,0.12)",
        }}
      >
        {shapes.map(({ label, sub, brine, Visual }) => (
          <div
            key={label}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              padding: "24px 20px",
              background: "rgba(10,16,14,0.92)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: BRINE_POOL,
                pointerEvents: "none",
              }}
            />
            <BrineBubbles />
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                width: "100%",
                minHeight: "clamp(120px, 18vh, 180px)",
              }}
            >
              <Visual />
            </div>
            <div style={{ position: "relative", textAlign: "center" }}>
              <div
                style={{
                  fontWeight: 800,
                  color: "#c8e6a0",
                  fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </div>
              <div style={{ color: "#a8d86a", fontSize: "clamp(0.8rem, 1.3vw, 0.95rem)", marginTop: "4px" }}>
                {sub}
              </div>
              <div
                style={{
                  color: "#6e7fa0",
                  fontSize: "clamp(0.72rem, 1.1vw, 0.82rem)",
                  marginTop: "6px",
                  fontStyle: "italic",
                }}
              >
                {brine}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PickleBrineStyles() {
  return (
    <style>{`
      @keyframes pk-quick-soak {
        0%, 100% {
          background: radial-gradient(circle, #dce878 0%, #dce878 84%, #8bc34a 84%, #6b9e3d 92%, #4a7c3f 100%);
        }
        50% {
          background: radial-gradient(circle, #dce878 0%, #dce878 78%, #8bc34a 78%, #6b9e3d 90%, #4a7c3f 100%);
        }
      }
      @keyframes pk-deep-soak {
        0%, 12% {
          background: radial-gradient(circle, #dce878 0%, #dce878 80%, #8bc34a 80%, #6b9e3d 90%, #4a7c3f 100%);
        }
        55%, 72% {
          background: radial-gradient(circle, #c8d868 0%, #b8c858 18%, #8bc34a 42%, #6b9e3d 68%, #4a7c3f 100%);
        }
        100% {
          background: radial-gradient(circle, #dce878 0%, #dce878 80%, #8bc34a 80%, #6b9e3d 90%, #4a7c3f 100%);
        }
      }
      @keyframes pk-brine-glow {
        0%, 100% { opacity: 0.35; transform: scale(1); }
        50% { opacity: 0.65; transform: scale(1.03); }
      }
      @keyframes pk-loop-pulse {
        0%, 100% { opacity: 0.45; }
        50% { opacity: 1; }
      }
    `}</style>
  );
}

function PickleCrossSection({
  variant,
  caption,
  sub,
  detail,
}: {
  variant: "quick" | "deep";
  caption: string;
  sub: string;
  detail: string;
}) {
  const isQuick = variant === "quick";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        padding: "28px 20px",
        minWidth: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: isQuick ? "#8891ab" : "#a8d86a",
        }}
      >
        {caption}
      </div>

      <div style={{ position: "relative", width: "clamp(140px, 18vw, 200px)", height: "clamp(140px, 18vw, 200px)" }}>
        <div
          style={{
            position: "absolute",
            inset: "-8%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,179,66,0.25) 0%, transparent 70%)",
            animation: isQuick ? "none" : "pk-brine-glow 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "4px solid #3d6b2e",
            boxShadow:
              "inset 0 0 0 3px rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.35), 0 0 40px rgba(74,124,63,0.2)",
            animation: `${isQuick ? "pk-quick-soak" : "pk-deep-soak"} ${isQuick ? "4s" : "9s"} ease-in-out infinite`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "10%",
            borderRadius: "50%",
            border: "1px dashed rgba(168,216,106,0.25)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
            fontWeight: 700,
            color: isQuick ? "#8891ab" : "#c8e6a0",
          }}
        >
          {sub}
        </div>
        <div
          style={{
            fontSize: "clamp(0.82rem, 1.3vw, 0.95rem)",
            color: "#6e7fa0",
            marginTop: "8px",
            lineHeight: 1.5,
            maxWidth: "220px",
          }}
        >
          {detail}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.72rem",
          fontFamily: "monospace",
          color: isQuick ? "#6e7fa0" : "#a8d86a",
        }}
      >
        {isQuick ? (
          <>surface <span style={{ opacity: 0.5 }}>· · ·</span> center</>
        ) : (
          <>
            <span style={{ animation: "pk-loop-pulse 9s ease-in-out infinite" }}>surface</span>
            <span style={{ opacity: 0.5 }}>→</span>
            <span style={{ animation: "pk-loop-pulse 9s ease-in-out infinite", animationDelay: "4.5s" }}>
              center
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function BrineSoakComparison() {
  const loopSteps = ["Prompt 1", "Review", "Prompt 2", "Deep flavor"];

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(8,14,12,0.95) 0%, rgba(12,22,18,0.98) 45%, rgba(18,36,28,1) 100%)",
        border: "1px solid rgba(124,179,66,0.22)",
      }}
    >
      <PickleBrineStyles />

      <div
        style={{
          padding: "18px 28px 16px",
          borderBottom: "1px solid rgba(124,179,66,0.2)",
          background:
            "linear-gradient(90deg, rgba(74,124,63,0.12) 0%, rgba(124,179,66,0.08) 50%, rgba(74,124,63,0.12) 100%)",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a8d86a",
            marginBottom: "6px",
          }}
        >
          Cross-section view
        </div>
        <div style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#d8e8c8", fontWeight: 700 }}>
          Flavor takes time — watch the brine soak inward
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 0,
          gap: "1px",
          background: "rgba(124,179,66,0.12)",
        }}
      >
        <div style={{ background: "rgba(10,16,14,0.92)", display: "flex", minHeight: 0 }}>
          <PickleCrossSection
            variant="quick"
            caption="Same-day brine"
            sub="Still crisp"
            detail="Green ring stays at the edge — edible, but shallow"
          />
        </div>
        <div
          style={{
            background: "rgba(10,16,14,0.92)",
            display: "flex",
            minHeight: 0,
            borderLeft: "1px solid rgba(168,216,106,0.08)",
          }}
        >
          <PickleCrossSection
            variant="deep"
            caption="Weeks in the brine"
            sub="Flavor soaks in"
            detail="Brine penetrates to the center — depth, complexity, fit"
          />
        </div>
      </div>

      <div
        style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid rgba(124,179,66,0.2)",
          background: "rgba(8,12,10,0.85)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          {loopSteps.map((step, i) => (
            <div
              key={step}
              style={{ display: "flex", alignItems: "center", flex: i < loopSteps.length - 1 ? 1 : undefined }}
            >
              <div
                style={{
                  minWidth: "72px",
                  textAlign: "center",
                  fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
                  color: i === loopSteps.length - 1 ? "#a8d86a" : "#6e7fa0",
                  fontWeight: i === loopSteps.length - 1 ? 700 : 500,
                  fontFamily: "monospace",
                }}
              >
                {step}
              </div>
              {i < loopSteps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    background: `linear-gradient(90deg, #4a7c3f, ${i === loopSteps.length - 2 ? "#a8d86a" : "#4a7c3f"})`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverPickleStyles() {
  return (
    <style>{`
      @keyframes pk-bot-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pk-bot-sag {
        0%, 100% { transform: translateY(4px) rotate(-2deg); }
        50% { transform: translateY(8px) rotate(-3deg); }
      }
      @keyframes pk-antenna-blink {
        0%, 100% { opacity: 1; box-shadow: 0 0 14px rgba(168,216,106,0.8); }
        50% { opacity: 0.55; box-shadow: 0 0 6px rgba(168,216,106,0.4); }
      }
      @keyframes pk-antenna-dim {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.15; }
      }
      @keyframes pk-mush-drip {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(0.92); }
      }
      @keyframes pk-crisp-sparkle {
        0%, 100% { filter: drop-shadow(0 0 8px rgba(168,216,106,0.35)); }
        50% { filter: drop-shadow(0 0 18px rgba(168,216,106,0.75)); }
      }
    `}</style>
  );
}

function CrispPickleProp() {
  return (
    <div
      style={{
        width: "clamp(36px, 5vw, 48px)",
        height: "clamp(78px, 10vw, 104px)",
        borderRadius: "42% 42% 36% 36%",
        background: PICKLE_GRAD,
        boxShadow: "inset -6px 0 12px rgba(0,0,0,0.18)",
        animation: "pk-crisp-sparkle 2.4s ease-in-out infinite",
      }}
    />
  );
}

function MushyPickleProp() {
  return (
    <div style={{ position: "relative", width: "clamp(72px, 10vw, 96px)", height: "clamp(36px, 5vw, 48px)" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "40px 40px 28px 28px",
          background: "linear-gradient(180deg, #8a7350 0%, #6b5a3a 100%)",
          animation: "pk-mush-drip 3s ease-in-out infinite",
          boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "18%",
          bottom: "-10px",
          width: "14px",
          height: "16px",
          borderRadius: "0 0 8px 8px",
          background: "#6b5a3a",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "22%",
          bottom: "-8px",
          width: "10px",
          height: "12px",
          borderRadius: "0 0 6px 6px",
          background: "#6b5a3a",
        }}
      />
    </div>
  );
}

function PickleConsumerRobot({ mood }: { mood: "happy" | "sad" }) {
  const happy = mood === "happy";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        padding: "28px 20px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: happy ? "pk-bot-bounce 2.2s ease-in-out infinite" : "pk-bot-sag 3.2s ease-in-out infinite",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: "4px",
              height: "18px",
              background: happy ? "#7cb342" : "#5a5a6a",
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              marginTop: "-2px",
              background: happy ? "#a8d86a" : "#6b5a3a",
              animation: happy ? "pk-antenna-blink 2s ease-in-out infinite" : "pk-antenna-dim 3s ease-in-out infinite",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "8px",
            width: "clamp(108px, 14vw, 140px)",
            height: "clamp(96px, 12vw, 120px)",
            borderRadius: "22px",
            background: happy
              ? "linear-gradient(180deg, #5a8f3a 0%, #3d6b2e 100%)"
              : "linear-gradient(180deg, #5a5a6a 0%, #3a3a44 100%)",
            border: `3px solid ${happy ? "#a8d86a" : "#6b5a3a"}`,
            boxShadow: happy ? "0 0 32px rgba(124,179,66,0.25)" : "0 8px 20px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <div style={{ fontSize: "clamp(2.4rem, 5vw, 3.2rem)", lineHeight: 1 }}>🤖</div>
          <div
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              letterSpacing: "0.2em",
              color: happy ? "#d8f0b8" : "#8a7350",
            }}
          >
            {happy ? "^‿^" : "×_×"}
          </div>
        </div>

        <div
          style={{
            marginTop: "10px",
            width: "clamp(120px, 16vw, 156px)",
            height: "clamp(72px, 10vw, 92px)",
            borderRadius: "18px",
            background: happy
              ? "linear-gradient(180deg, #4a7c3f 0%, #3d6b2e 100%)"
              : "linear-gradient(180deg, #4a4a54 0%, #35353d 100%)",
            border: `2px solid ${happy ? "rgba(168,216,106,0.35)" : "rgba(107,90,58,0.35)"}`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "12px",
            padding: "0 16px 14px",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "28px",
              borderRadius: "8px 8px 4px 4px",
              background: happy ? "#6b9e3d" : "#5a5a6a",
              transform: happy ? "rotate(18deg)" : "rotate(32deg) translateY(6px)",
            }}
          />
          {happy ? <CrispPickleProp /> : <MushyPickleProp />}
          <div
            style={{
              width: "14px",
              height: "28px",
              borderRadius: "8px 8px 4px 4px",
              background: happy ? "#6b9e3d" : "#5a5a6a",
              transform: happy ? "rotate(-18deg)" : "rotate(-28deg) translateY(8px)",
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
            fontWeight: 800,
            color: happy ? "#a8d86a" : "#8a7350",
          }}
        >
          {happy ? "Crisp prompt" : "Over-pickled"}
        </div>
        <div
          style={{
            fontSize: "clamp(0.82rem, 1.3vw, 0.95rem)",
            color: "#6e7fa0",
            marginTop: "8px",
            lineHeight: 1.5,
            maxWidth: "220px",
          }}
        >
          {happy ? "Agent knows what to do — crunch intact" : "Too much brine — nothing moves"}
        </div>
      </div>

      {!happy && (
        <div style={{ fontSize: "1.5rem", opacity: 0.7, marginTop: "-8px" }}>💧</div>
      )}
    </div>
  );
}

function OverPickleComparison() {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(8,14,12,0.95) 0%, rgba(12,22,18,0.98) 45%, rgba(18,36,28,1) 100%)",
        border: "1px solid rgba(124,179,66,0.22)",
      }}
    >
      <OverPickleStyles />

      <div
        style={{
          padding: "18px 28px 16px",
          borderBottom: "1px solid rgba(124,179,66,0.2)",
          background:
            "linear-gradient(90deg, rgba(74,124,63,0.12) 0%, rgba(124,179,66,0.08) 50%, rgba(74,124,63,0.12) 100%)",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a8d86a",
            marginBottom: "6px",
          }}
        >
          The crunch test
        </div>
        <div style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#d8e8c8", fontWeight: 700 }}>
          Same consumer · different pickle · very different experience
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 0,
          gap: "1px",
          background: "rgba(124,179,66,0.12)",
        }}
      >
        <div
          style={{
            background: "rgba(10,16,14,0.92)",
            display: "flex",
            minHeight: 0,
            boxShadow: "inset 0 0 60px rgba(124,179,66,0.06)",
          }}
        >
          <PickleConsumerRobot mood="happy" />
        </div>
        <div
          style={{
            background: "rgba(10,16,14,0.92)",
            display: "flex",
            minHeight: 0,
            borderLeft: "1px solid rgba(107,90,58,0.15)",
            boxShadow: "inset 0 0 60px rgba(107,90,58,0.08)",
          }}
        >
          <PickleConsumerRobot mood="sad" />
        </div>
      </div>
    </div>
  );
}

function ContextBurger() {
  const panel: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 28px",
    textAlign: "center",
    minWidth: 0,
  };

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "stretch",
        background:
          "radial-gradient(ellipse at 50% 80%, rgba(74,124,63,0.15) 0%, transparent 60%), linear-gradient(180deg, #0a0f14 0%, #0d1218 100%)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...panel,
          borderRight: "1px solid rgba(74,124,63,0.18)",
          background: "rgba(196,92,92,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            color: "#c45c5c",
            marginBottom: "16px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Lone pickle
        </div>
        <div style={{ fontSize: "clamp(5rem, 14vw, 9rem)", lineHeight: 1 }}>🥒</div>
        <div
          style={{
            fontSize: "clamp(1rem, 2vw, 1.35rem)",
            color: "#8891ab",
            marginTop: "20px",
            fontWeight: 600,
          }}
        >
          Not a meal
        </div>
        <div
          style={{
            fontSize: "clamp(0.85rem, 1.4vw, 1rem)",
            color: "#6e7fa0",
            marginTop: "12px",
            fontFamily: "monospace",
          }}
        >
          &quot;fix it&quot;
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8px",
          color: "#4a5568",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
        }}
      >
        →
      </div>

      <div
        style={{
          ...panel,
          borderLeft: "1px solid rgba(74,124,63,0.18)",
          background: "rgba(124,179,66,0.06)",
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            color: "#a8d86a",
            marginBottom: "16px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          In context
        </div>
        <div style={{ fontSize: "clamp(4rem, 12vw, 8rem)", lineHeight: 1 }}>🍔🥒</div>
        <div
          style={{
            fontSize: "clamp(1rem, 2vw, 1.35rem)",
            color: "#a8d86a",
            marginTop: "20px",
            fontWeight: 600,
          }}
        >
          A complete dish
        </div>
        <div
          style={{
            fontSize: "clamp(0.85rem, 1.4vw, 1rem)",
            color: "#6e7fa0",
            marginTop: "12px",
            maxWidth: "280px",
            lineHeight: 1.5,
          }}
        >
          React 19 · Zustand · don&apos;t touch auth
        </div>
      </div>
    </div>
  );
}

export const aiPicklesDeck: Deck = {
  id: "ai-pickles",
  title: "Everything I Know About AI Dev I Learned from Pickles",
  createSlides: (): Slide[] => [
    {
      id: "title",
      title: "Everything I Know About AI Software Development I Learned from Pickles",
      notes: (
        <>
          <Say>
            I&apos;ve spent years in software and decades eating pickles. Turns out, one explains the other.
          </Say>
          <Say>
            Pickles aren&apos;t the meal — they&apos;re an accent. AI isn&apos;t the team. It&apos;s the brine you work in.
          </Say>
          <Context>Lean into the absurdity early — the audience buys in when you acknowledge it&apos;s ridiculous.</Context>
          <Beat>~30 seconds · set the tone</Beat>
        </>
      ),
      copy: (
        <CopyPanel>
          <Eyebrow>~10 min · Humor with receipts</Eyebrow>
          <SlideTitle>{"Everything I Know About\nAI Software Development\nI Learned from Pickles"}</SlideTitle>
          <Lead>
            Six analogies. Zero pickle recipes. A surprising amount of transferable wisdom about context,
            iteration, and not serving mush.
          </Lead>
        </CopyPanel>
      ),
    },
    {
      id: "context",
      title: "Context Is Paramount",
      notes: (
        <>
          <Say>
            Some people love eating a lone pickle straight from the jar — and that&apos;s fine. But a lone pickle
            isn&apos;t a meal. On a plant-based burger? Perfect. In tuna salad? Also perfect.
          </Say>
          <Say>
            A lone prompt without context might get you something — but rarely a complete solution. &quot;Fix this
            bug&quot; versus &quot;fix this bug in our React app, we use Zustand, tests must pass, don&apos;t touch auth.&quot;
          </Say>
          <Say>Same model. Wildly different outcomes. Context isn&apos;t cheating — it&apos;s plating.</Say>
          <Beat>~1.5 min · this is the foundational slide</Beat>
        </>
      ),
      content: <ContextBurger />,
      copy: (
        <CopyPanel>
          <Eyebrow>Analogy 1</Eyebrow>
          <SlideTitle>Context Is Paramount</SlideTitle>
          <Lead>A lone pickle isn&apos;t a meal. Same pickle on the right plate? Completely different.</Lead>
          <Bullets
            items={[
              <>Context is the <strong style={{ color: "#a8d86a" }}>dish</strong>, not the pickle itself</>,
              <>Give the agent: structure, constraints, examples of &quot;good,&quot; what success looks like</>,
              <>Same model + better context = better outcomes — every time</>,
            ]}
          />
          <Punchline>Context isn&apos;t cheating. It&apos;s plating.</Punchline>
        </CopyPanel>
      ),
    },
    {
      id: "shape",
      title: "Shape Matters",
      notes: (
        <>
          <Say>
            Here&apos;s the secret: the brine is the constant. Same model, same core capability, same flavor
            profile. Whole pickle, spear, chip, relish — all brined the same way. The power is in the brine;
            the cut is how you deploy it.
          </Say>
          <Say>
            Wrong cut isn&apos;t wrong pickle — it&apos;s wrong context. Don&apos;t bring relish to a whole-pickle problem.
            Don&apos;t vibe-code your payment processor.
          </Say>
          <Context>Point at the visual — every cell is sitting in the same brine pool.</Context>
          <Beat>~1.5 min · audience will nod at the payment processor line</Beat>
        </>
      ),
      content: <ShapeGrid />,
      copy: (
        <CopyPanel>
          <Eyebrow>Analogy 2</Eyebrow>
          <SlideTitle>Shape Matters</SlideTitle>
          <Lead>The brine is the power. The cut is the workflow.</Lead>
          <Bullets
            items={[
              <><strong style={{ color: "#a8d86a" }}>Whole</strong> → vibe coding · immerse &amp; explore</>,
              <><strong style={{ color: "#a8d86a" }}>Spears</strong> → Ralph loops · scoped, structured tasks</>,
              <><strong style={{ color: "#a8d86a" }}>Chips</strong> → spec-kit · uniform slices for handoff</>,
              <><strong style={{ color: "#a8d86a" }}>Relish</strong> → micro-prompts · fine, distributed edits</>,
            ]}
          />
          <Punchline>Same brine. Pick your cut.</Punchline>
        </CopyPanel>
      ),
    },
    {
      id: "brine-time",
      title: "Brine Time",
      notes: (
        <>
          <Say>
            Quick vinegar pickles? You can eat them in a few days — and they&apos;re often still crisp. What you
            don&apos;t get is depth. The flavor sits on the surface. Extension guides say even quick-process pickles
            taste better if you let them stand for weeks.
          </Say>
          <Say>
            Mush usually comes from old cucumbers, over-fermenting, or overcooking — not from being fast. The
            lesson for AI: a one-shot prompt can produce something edible today, but iteration is what lets the
            brine soak in.
          </Say>
          <Context>Point at the cross-sections — left ring barely moves; right soaks to center on loop.</Context>
          <Beat>~1 min</Beat>
        </>
      ),
      content: <BrineSoakComparison />,
      copy: (
        <CopyPanel>
          <Eyebrow>Analogy 3</Eyebrow>
          <SlideTitle>Brine Time</SlideTitle>
          <Lead>Quick brine gets you a pickle fast — patience gets the flavor in deep.</Lead>
          <Bullets
            items={[
              <>Budget time for the <strong style={{ color: "#a8d86a" }}>loop</strong>, not just the first response</>,
              <>Refine spec → run → review → re-prompt</>,
              <>&quot;Just one-shot it&quot; is same-day pickles — crisp enough, shallow flavor</>,
            ]}
          />
          <Punchline>If the output feels thin, give it more brine time.</Punchline>
        </CopyPanel>
      ),
    },
    {
      id: "over-pickle",
      title: "Don't Over-Pickle",
      notes: (
        <>
          <Say>
            Leave cucumbers in brine too long and they go soft. More pickling does not mean better pickle.
          </Say>
          <Say>
            Forty-seven rules in AGENTS.md and the model follows none of them. Dumping the whole repo into
            context. Over-constraining until nothing can move. Crisp prompts beat bloated prompts.
          </Say>
          <Context>Left bot bounces with crisp pickle; right bot sags with mush — let the contrast land.</Context>
          <Beat>~1 min</Beat>
        </>
      ),
      content: <OverPickleComparison />,
      copy: (
        <CopyPanel>
          <Eyebrow>Analogy 4</Eyebrow>
          <SlideTitle>Don&apos;t Over-Pickle</SlideTitle>
          <Lead>More rules, more context, more constraints — until everything turns to mush.</Lead>
          <Bullets
            items={[
              <>Over-prompting: bloated AGENTS.md the model ignores</>,
              <>Over-contexting: entire repos in the window</>,
              <>The crunch test: can you still tell what the model is trying to do?</>,
            ]}
          />
          <Punchline>There&apos;s a difference between seasoned and soggy.</Punchline>
        </CopyPanel>
      ),
    },
    {
      id: "jar-limit",
      title: "The Jar Has a Limit",
      notes: (
        <>
          <Say>
            Only so many pickles fit in a jar. Shove in too many and you get broken glass and brine
            everywhere.
          </Say>
          <Say>
            Your context window is a Mason jar, not a swimming pool. Put the important pickles on top — system
            prompt, constraints, examples. Use file references and RAG strategically. When the jar&apos;s full,
            start a new jar.
          </Say>
          <Beat>~1 min</Beat>
        </>
      ),
      content: <JarLimitVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Analogy 5</Eyebrow>
          <SlideTitle>The Jar Has a Limit</SlideTitle>
          <Lead>Context windows are finite. Attention degrades as the jar fills.</Lead>
          <Bullets
            items={[
              <>Curate what goes in — quality over quantity</>,
              <>Important constraints belong <strong style={{ color: "#a8d86a" }}>on top</strong>, not buried</>,
              <>Full jar? New session — don&apos;t cram</>,
            ]}
          />
          <Punchline>Your context window is a Mason jar, not a swimming pool.</Punchline>
        </CopyPanel>
      ),
    },
    {
      id: "pickle-juice",
      title: "Save the Pickle Juice",
      notes: (
        <>
          <Say>
            Serious pickle people don&apos;t pour out the brine. That&apos;s liquid gold — marinade, dressings,
            emergency flavor rescue.
          </Say>
          <Say>
            Session learnings, failed attempts, &quot;here&apos;s what didn&apos;t work&quot; — that&apos;s pickle juice. Cursor rules,
            AGENTS.md, project docs — preserved brine for the next session. The brine outlasts any single
            pickle.
          </Say>
          <Beat>~1 min</Beat>
        </>
      ),
      content: <PickleJuiceVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Analogy 6</Eyebrow>
          <SlideTitle>Save the Pickle Juice</SlideTitle>
          <Lead>Don&apos;t throw away what you learned — compound it.</Lead>
          <Bullets
            items={[
              <>Document what failed <em>and</em> what finally worked</>,
              <>.cursor/rules · AGENTS.md · project docs = preserved brine</>,
              <>Reusable context compounds; one-shot sessions don&apos;t</>,
            ]}
          />
          <Punchline>Throw away the pickle juice and you&apos;ll pickle from scratch forever.</Punchline>
        </CopyPanel>
      ),
    },
    {
      id: "bonus",
      title: "Bonus Pickles (Q&A)",
      notes: (
        <>
          <Say>Rapid-fire if you have time, or save for questions.</Say>
          <Say>
            Not everything should be pickled — sometimes you just write the for loop. The crunch test — always
            bite before you serve; run the tests. The pickle-back — new problem domain? Clear context, fresh
            session.
          </Say>
          <Context>These land well in Q&A if you&apos;re running short on time on the main six.</Context>
          <Beat>~30 sec or Q&A</Beat>
        </>
      ),
      content: <BonusPicklesVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>Bonus · Q&amp;A ammo</Eyebrow>
          <SlideTitle>Bonus Pickles</SlideTitle>
          <Bullets
            items={[
              <><strong style={{ color: "#a8d86a" }}>Not everything should be pickled</strong> — not every task needs AI</>,
              <><strong style={{ color: "#a8d86a" }}>The crunch test</strong> — looks fine, fails every test? Mush.</>,
              <><strong style={{ color: "#a8d86a" }}>Cross-contamination</strong> — one jar, one flavor profile</>,
              <><strong style={{ color: "#a8d86a" }}>The pickle-back</strong> — fresh session between problem domains</>,
              <><strong style={{ color: "#a8d86a" }}>Pickle Rick</strong> — hallucinated solutions nobody asked for</>,
            ]}
          />
        </CopyPanel>
      ),
    },
    {
      id: "close",
      title: "Thank You",
      notes: (
        <>
          <Say>
            AI development isn&apos;t about finding magic prompts. It&apos;s about knowing when, where, and how to add
            the pickle.
          </Say>
          <Say>
            Any questions? Please don&apos;t ask about bread-and-butter versus kosher dill. That&apos;s a separate talk.
          </Say>
          <Beat>~30 sec · thank the room</Beat>
        </>
      ),
      content: <ClosingRecapVisual />,
      copy: (
        <CopyPanel>
          <Eyebrow>The Pickle Principles</Eyebrow>
          <SlideTitle>Same Brine. Better Plating.</SlideTitle>
          <Lead>Six ideas to take back to your next agent session:</Lead>
          <Bullets
            items={[
              <>Context is the dish</>,
              <>Shape matches the serving</>,
              <>Brine takes time</>,
              <>Don&apos;t over-pickle</>,
              <>Respect the jar</>,
              <>Save the juice</>,
            ]}
          />
          <Punchline>Thank you. Go pickle something worth eating.</Punchline>
        </CopyPanel>
      ),
    },
  ],
};
