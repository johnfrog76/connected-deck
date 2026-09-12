import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { usePersistedFlag } from "./shared/usePersistedState";

// How this browser opens a deck by default: Sofa (audience) or Podium
// (presenter). Remembered because whether you come here to watch or to rehearse
// is a property of how you use the app, not a choice worth re-making per click.
//
// Only ever the DEFAULT — ?present= overrides it per navigation. See
// PresentationDeck.tsx.

const STORAGE_KEY = "connected-deck:presenter-mode";

interface PresenterModeValue {
  presenter: boolean;
  setPresenter: (next: boolean) => void;
}

// Default false = Sofa. Someone arriving at this app for the first time is an
// audience member; presenting is the deliberate opt-in.
const PresenterModeContext = createContext<PresenterModeValue>({
  presenter: false,
  setPresenter: () => {},
});

export function PresenterModeProvider({ children }: { children: ReactNode }) {
  // Default false = Sofa. The hook owns everything about how that's stored,
  // including the private-mode guard this file used to spell out twice.
  const { value: presenter, setValue: setPresenter } = usePersistedFlag(STORAGE_KEY);

  const value = useMemo(() => ({ presenter, setPresenter }), [presenter, setPresenter]);

  return (
    <PresenterModeContext.Provider value={value}>
      {children}
    </PresenterModeContext.Provider>
  );
}

export function usePresenterMode() {
  return useContext(PresenterModeContext);
}
