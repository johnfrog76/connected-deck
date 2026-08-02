import { webLightTheme, webDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";

// Connected Deck's brand is taken from its own mark, not invented: the plug
// supplies bakelite + brass (which live in the ARTWORK, LaunchArt.tsx), and
// the azure current pulse supplies the interactive accent — so every brand
// token below is "the current". The previous indigo was borrowed clothing
// from the toolkit this repo was extracted from. The deck player is
// unaffected on purpose: it runs stock webDarkTheme (see DeckPlayer), so no
// brand follows a deck in.
export const darkTheme: Theme = {
  ...webDarkTheme,
  colorBrandBackground: "#0E7FC1", // current, deep enough for white text
  colorBrandBackgroundHover: "#1B96DB",
  colorBrandBackgroundPressed: "#0A659C",
  colorBrandForeground1: "#46C8F5", // the pulse itself — pops on dark
  colorBrandForeground2: "#2BA8DE",
};

export const lightTheme: Theme = {
  ...webLightTheme,
  colorBrandBackground: "#0F766E", // teal-700
  colorBrandBackgroundHover: "#0D9488", // teal-600
  colorBrandBackgroundPressed: "#115E59", // teal-800
  colorBrandForeground1: "#0F766E", // teal-700
  colorBrandForeground2: "#0D9488", // teal-600
};
