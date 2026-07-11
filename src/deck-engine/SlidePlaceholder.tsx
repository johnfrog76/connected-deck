import { ComponentFrame } from "./ComponentFrame";

interface SlidePlaceholderProps {
  /** Short title for the intended visual, e.g. "Title hero" or "Billing timeline". */
  label: string;
  /** The visual direction / storyboard notes — what belongs in this frame. */
  sublabel?: string;
}

/**
 * Empty stand-in for a slide visual that hasn't been built yet. Wraps
 * ComponentFrame so it sits in the same design grid as a real component would
 * — drop this in while sketching a deck, then swap it for the genuine article.
 */
export function SlidePlaceholder({ label, sublabel }: SlidePlaceholderProps) {
  return (
    <ComponentFrame>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          borderRadius: "12px",
          border: `1px dashed #2a2f4a`,
          padding: "40px",
          position: "relative",
          overflow: "auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              border: `2px solid #2a2f4a`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0d0e18",
              fontSize: "15px",
              opacity: 0.45,
            }}
          >
            ▨
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#4a5270",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Visual · to build
          </span>
        </div>

        <span
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#7a86ac",
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
        >
          {label}
        </span>

        {sublabel && (
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              lineHeight: 1.65,
              color: "#5a6488",
              maxWidth: "560px",
              textAlign: "left",
            }}
          >
            {sublabel}
          </p>
        )}
      </div>
    </ComponentFrame>
  );
}
