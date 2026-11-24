import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * The scale a slide's art is drawn at. On a phone the renderer
 * draws the art into its authored 768-wide panel and scales that panel to fit
 * the band (SlideRenderer's ScaledContent), about 0.5 at 390px wide, so a
 * control inside the art would shrink with it: the code slide's 26px zoom
 * buttons landed near 13px. 1 everywhere the art is not scaled, which is every
 * desktop slide and the wall's posters (they scale their own stage, outside).
 */
export const ArtScaleContext = createContext(1);

/** The art's current scale: 1 unless a slide's art is drawn scaled. */
export function useArtScale(): number {
  return useContext(ArtScaleContext);
}

/**
 * Draws its children at native size inside scaled art, so a control keeps the
 * size it was designed at. `origin` is the corner it stays pinned to. Where the
 * art is not scaled it renders the children as they are.
 */
export function AtNativeSize({
  children,
  origin = "top right",
}: {
  children: ReactNode;
  origin?: string;
}) {
  const scale = useArtScale();
  if (scale === 1 || !(scale > 0)) return <>{children}</>;
  return (
    <div data-native-size="" style={{ transform: `scale(${1 / scale})`, transformOrigin: origin }}>
      {children}
    </div>
  );
}
