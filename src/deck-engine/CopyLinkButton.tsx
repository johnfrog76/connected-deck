import { useLayoutEffect, useRef, useState } from "react";
import { useViewport } from "../viewport";

// The repository button a deck's closing slide carries: a GitHub mark on a
// round disc that opens the repository in a new tab.
//
// Contrast is read off the stage behind it, not declared per deck: the first
// ancestor that paints an opaque background colour or a gradient decides dark
// or light, and with nothing painted anywhere it reads as dark, the player's
// usual stage. A deck that passes `inverse` still decides for itself.
//
// On a phone the stage is drawn at about half size, which would shrink a 36px
// disc to about 20px, under the touch-target floor, so the disc grows to 84px
// there.

/** This repository: the default target, the engine a deck is played by. */
export const CONNECTED_DECK_REPO_URL = "https://github.com/johnfrog76/connected-deck";

// GitHub mark as a pure inline SVG path (Octicons "mark-github", MIT-licensed)
// — no image asset, no external request, themeable via currentColor.
function GitHubMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

// The disc the mark sits on, in both looks: a dark mark for light or warm
// grounds, a white mark on a light translucent disc for dark ones.
export const GITHUB_MARK_DISC = {
  default: {
    background: "rgba(0,0,0,0.28)",
    backgroundHover: "rgba(0,0,0,0.42)",
    color: "rgba(0,0,0,0.82)",
  },
  inverse: {
    background: "rgba(255,255,255,0.14)",
    backgroundHover: "rgba(255,255,255,0.26)",
    color: "rgba(255,255,255,0.92)",
  },
} as const;

function parseColor(value: string): { r: number; g: number; b: number; a: number } | null {
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i.exec(
    value,
  );
  if (rgb) {
    const a =
      rgb[4] === undefined
        ? 1
        : rgb[4].endsWith("%")
          ? parseFloat(rgb[4]) / 100
          : parseFloat(rgb[4]);
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a };
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value.trim());
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }
  return null;
}

function luminance(c: { r: number; g: number; b: number }): number {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

/**
 * Is the ground behind `el` dark? Walks up to the first ancestor that paints
 * something: an opaque background colour decides alone; a gradient decides by
 * the average of its colour stops. Nothing painted anywhere reads as dark.
 */
export function isDarkBehind(el: Element | null): boolean {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    const cs = getComputedStyle(node);
    const bg = parseColor(cs.backgroundColor || "");
    if (bg && bg.a >= 0.5) return luminance(bg) < 0.5;
    const img = cs.backgroundImage;
    if (img && img !== "none") {
      const stops = [...img.matchAll(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi)]
        .map((m) => parseColor(m[0]))
        .filter((c): c is NonNullable<typeof c> => c !== null && c.a >= 0.5);
      if (stops.length > 0) {
        const avg = stops.reduce((sum, c) => sum + luminance(c), 0) / stops.length;
        return avg < 0.5;
      }
    }
  }
  return true;
}

interface CopyLinkButtonProps {
  /** The repository to open. Defaults to this one, Connected Deck. */
  url?: string;
  /** Absolute corner placement on the stage. Set to null to render inline instead. */
  corner?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | null;
  title?: string;
  /**
   * White mark on a light translucent disc, for a dark ground (true), or a
   * dark mark for a light one (false). Leave it out and the button reads the
   * stage behind it.
   */
  inverse?: boolean;
}

/**
 * A GitHub-mark button that opens `url` in a new tab, built for a deck's
 * closing slide. Pure CSS/SVG, no image asset. It reads its contrast off the
 * stage unless `inverse` says otherwise.
 */
export function CopyLinkButton({
  url = CONNECTED_DECK_REPO_URL,
  corner = "bottom-right",
  title = "Open the repo on GitHub",
  inverse,
}: CopyLinkButtonProps) {
  const compact = useViewport().isMobile;
  const px = compact ? 84 : 36;
  const mark = compact ? 42 : 18;

  const ref = useRef<HTMLAnchorElement>(null);
  // Dark until measured: the flash a light stage would see is one frame, and
  // the alternative, a dark mark flashing on the far more common dark stage,
  // is the one a viewer would notice.
  const [darkBehind, setDarkBehind] = useState(true);
  useLayoutEffect(() => {
    if (inverse === undefined) setDarkBehind(isDarkBehind(ref.current));
  }, [inverse]);
  const dark = inverse ?? darkBehind;
  const disc = dark ? GITHUB_MARK_DISC.inverse : GITHUB_MARK_DISC.default;

  const cornerStyle: React.CSSProperties =
    corner === null
      ? {}
      : {
          position: "absolute",
          ...(corner.includes("bottom") ? { bottom: "28px" } : { top: "28px" }),
          ...(corner.includes("right") ? { right: "36px" } : { left: "36px" }),
        };

  return (
    <a
      ref={ref}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={title}
      data-contrast={dark ? "dark" : "light"}
      style={{
        ...cornerStyle,
        width: `${px}px`,
        height: `${px}px`,
        flexShrink: 0,
        borderRadius: "50%",
        background: disc.background,
        color: disc.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        transition: "background 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = disc.backgroundHover;
        e.currentTarget.style.transform = "scale(1.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = disc.background;
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <GitHubMark size={mark} />
    </a>
  );
}
