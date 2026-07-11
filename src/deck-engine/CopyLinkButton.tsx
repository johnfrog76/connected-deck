import { useState, useRef, useEffect } from "react";

// GitHub mark as a pure inline SVG path (Octicons "mark-github", MIT-licensed)
// — no image asset, no external request, themeable via currentColor.
function GitHubMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

interface CopyLinkButtonProps {
  url: string;
  /** Fixed-position corner placement. Set to null to render inline instead. */
  corner?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | null;
  title?: string;
}

/**
 * A small, transparent GitHub-mark button that copies `url` to the clipboard
 * on click — built for a deck's closing slide ("here's the repo, paste this
 * in Teams"). Pure CSS/SVG, no image asset.
 */
export function CopyLinkButton({ url, corner = "bottom-right", title = "Copy repo link" }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (older browser, no HTTPS) — a silent no-op
      // here just leaves the button un-confirmed rather than throwing.
      return;
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1600);
  };

  const cornerStyle: React.CSSProperties =
    corner === null
      ? {}
      : {
          position: "absolute",
          ...(corner.includes("bottom") ? { bottom: "28px" } : { top: "28px" }),
          ...(corner.includes("right") ? { right: "36px" } : { left: "36px" }),
        };

  return (
    <div style={{ ...cornerStyle, display: "flex", alignItems: "center", gap: "8px" }}>
      {copied && (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          Copied!
        </span>
      )}
      <button
        onClick={handleClick}
        title={title}
        aria-label={title}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,0.28)",
          color: copied ? "#8fe0a0" : "rgba(0,0,0,0.82)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.15s ease, color 0.15s ease, transform 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.42)";
          e.currentTarget.style.transform = "scale(1.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.28)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <GitHubMark size={18} />
      </button>
    </div>
  );
}
