import { DeckChromePresenter } from "./DeckChromePresenter";
import { DeckChromeViewer } from "./DeckChromeViewer";
import type { DeckChromeProps } from "./deckChromeShared";

// Picks a bar. That's all this does.
//
// The two bars are SEPARATE COMPONENTS rather than one file full of
// `presenter ? a : b`, because they do different jobs: the presenter's bar puts
// every control in reach of someone running a talk, the viewer's bar gives
// someone watching or listening one transport on the screen's centre and puts
// the rest behind a gear. A single component with forks throughout serves
// neither well, and makes both harder to lift into another project.
//
// The bar follows the MODE, not the width. DeckPlayer decides the mode, and it
// never picks Podium at the phone width, so the presenter's bar never has to
// fold; the viewer's bar is one bar at every width, sized for a thumb when
// `compact` says so.
//
// Taking just one bar: both read everything they show from props. Import
// DeckChromeViewer directly and hand it the same props if you only ever play
// to a viewer. One exception travels with it: its settings sheet renders
// SettingsForm, which reads the presenter-mode, voice-preference and viewport
// contexts, so mount it inside those providers.

export type { ChromeBar, NarrationControls, DeckChromeProps } from "./deckChromeShared";

export function DeckChrome(props: DeckChromeProps) {
  return props.bar === "presenter" ? (
    <DeckChromePresenter {...props} />
  ) : (
    <DeckChromeViewer {...props} />
  );
}
