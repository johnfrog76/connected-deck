import { webLightTheme, webDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";

/**
 * Theming, in two halves — same system as the sibling repos (juggling-engine,
 * bowling-engine), so a reader who has seen one has seen all three.
 *
 * 1. THE CHROME is Fluent: a stock web theme with only the brand tokens
 *    overridden. The brand teal is the family's, unchanged, so the three repos
 *    read as one family at the one place the chrome shows a colour.
 *
 * 2. THE ART is not. The plug's bakelite, brass and azure current live in
 *    LaunchArt.tsx as literals — that is the mark, and no theme reaches into it.
 *    The page-level tokens below are the family's night stage: the ground the
 *    launch page sits on, the panel and border every card shares.
 *
 * The deck player is unaffected on purpose: it runs stock webDarkTheme (see
 * DeckPlayer), so no brand follows a deck in.
 */
export const darkTheme: Theme = {
  ...webDarkTheme,
  colorBrandBackground: "#1a7f96",
  colorBrandBackgroundHover: "#2299b4",
  colorBrandBackgroundPressed: "#146678",
  colorBrandForeground1: "#62e6ff",
  colorBrandForeground2: "#3fd0ee",
};

export const lightTheme: Theme = {
  ...webLightTheme,
  colorBrandBackground: "#146678",
  colorBrandBackgroundHover: "#1a7f96",
  colorBrandBackgroundPressed: "#0e4d5b",
  colorBrandForeground1: "#146678",
  colorBrandForeground2: "#1a7f96",
};

/** The night stage — page ground, panel, border, and type. Family values verbatim. */
export const art = {
  /** Page ground. Dark blue-violet, so the lit art panels read as the bright thing. */
  bg: "#131022",
  /** Panel edges and rules. */
  border: "#282344",
  /** Panel fill, one step up from the page. */
  panel: "rgba(8,7,16,0.5)",
  /** Secondary type — hints, annotations. */
  muted: "#9a92b8",
  /** Primary type. */
  text: "#eae6f6",
  /** Headings, links, the family cyan. */
  accent: "#62e6ff",
  mono: "'Cascadia Code', 'Fira Code', 'Consolas', ui-monospace, monospace",
} as const;
