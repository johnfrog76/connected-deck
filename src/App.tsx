import { Routes, Route, useLocation } from "react-router-dom";
import { FluentProvider, Title1, Body1, tokens } from "@fluentui/react-components";
import { darkTheme } from "./theme";
import { PresentationDeck, DeckPickerCard } from "./PresentationDeck";
import { PresenterNotes } from "./deck-engine/PresenterNotes";

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: tokens.colorNeutralBackground1,
        padding: "48px 24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <Title1>Connected Deck</Title1>
          <Body1 style={{ display: "block", marginTop: "8px", color: tokens.colorNeutralForeground2 }}>
            A presentation engine that renders live, connected React components inside your slides —
            not static screenshots. Pick a deck below to present it.
          </Body1>
        </div>
        <DeckPickerCard />
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isDeck = location.pathname.startsWith("/deck/");

  return (
    <FluentProvider theme={darkTheme} style={{ colorScheme: "dark", minHeight: "100vh" }}>
      <div style={isDeck ? undefined : { minHeight: "100vh" }}>
        <Routes>
          <Route path="/deck/:deckId/notes" element={<PresenterNotes />} />
          <Route path="/deck/:deckId" element={<PresentationDeck />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </FluentProvider>
  );
}
