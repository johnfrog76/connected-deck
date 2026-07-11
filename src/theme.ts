import { webLightTheme, webDarkTheme } from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";

export const darkTheme: Theme = {
  ...webDarkTheme,
  colorBrandBackground: "#4F46E5", // indigo-600
  colorBrandBackgroundHover: "#6366F1", // indigo-500
  colorBrandBackgroundPressed: "#4338CA", // indigo-700
  colorBrandForeground1: "#818CF8", // indigo-400 — pops on dark backgrounds
  colorBrandForeground2: "#6366F1", // indigo-500
};

export const lightTheme: Theme = {
  ...webLightTheme,
  colorBrandBackground: "#0F766E", // teal-700
  colorBrandBackgroundHover: "#0D9488", // teal-600
  colorBrandBackgroundPressed: "#115E59", // teal-800
  colorBrandForeground1: "#0F766E", // teal-700
  colorBrandForeground2: "#0D9488", // teal-600
};
