import { Routes, Route, useLocation, useParams } from "react-router-dom";
import { FluentProvider } from "@fluentui/react-components";
import { darkTheme } from "./theme";
import { LaunchPage } from "./LaunchPage";
import { PresentationDeck } from "./PresentationDeck";
import { PresenterNotes } from "./deck-engine/PresenterNotes";
import { PresenterModeProvider } from "./presenterMode";
import { VoicePreferenceProvider } from "./voicePreference";
import { ViewportProvider } from "./viewport";
import { BAKED_VOICES, voiceUrl, type VoiceId } from "./bakedVoices";

// The notes popout is a SEPARATE WINDOW with its own React tree, opened by URL
// — so it can't inherit anything from the deck window and must be handed the
// same narration facts independently. Getting these two out of sync is how a
// player and its notes window end up disagreeing about which voices exist.
function NotesWindow() {
  const { deckId } = useParams<{ deckId: string }>();
  return (
    <PresenterNotes
      voices={BAKED_VOICES}
      hasApi={false}
      resolveNarrationUrl={(slide, voice) =>
        voiceUrl(deckId, slide.id, voice as VoiceId)
      }
    />
  );
}

export default function App() {
  const location = useLocation();
  const isDeck = location.pathname.startsWith("/deck/");

  return (
    <FluentProvider theme={darkTheme} style={{ colorScheme: "dark", minHeight: "100vh" }}>
      <ViewportProvider>
        <PresenterModeProvider>
          <VoicePreferenceProvider>
            <div style={isDeck ? undefined : { minHeight: "100vh" }}>
              <Routes>
                <Route path="/deck/:deckId/notes" element={<NotesWindow />} />
                <Route path="/deck/:deckId" element={<PresentationDeck />} />
                <Route path="/" element={<LaunchPage />} />
              </Routes>
            </div>
          </VoicePreferenceProvider>
        </PresenterModeProvider>
      </ViewportProvider>
    </FluentProvider>
  );
}
