import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

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

function initialPresenter(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage throws in private mode / when disabled — fall back to Sofa.
    return false;
  }
}

export function PresenterModeProvider({ children }: { children: ReactNode }) {
  const [presenter, setPresenterState] = useState(initialPresenter);

  const setPresenter = useCallback((next: boolean) => {
    setPresenterState(next);
    try {
      window.localStorage?.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not persisting is survivable; the setting still holds for this session.
    }
  }, []);

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
