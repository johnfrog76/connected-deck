import { useCallback, useState } from "react";

// One place that knows how a browser preference is stored.
//
// Every persisted setting in these apps had been hand-rolling the same three
// things: read at mount with a typeof-window guard, write on change, and
// (sometimes) catch the exception. "Sometimes" is why this exists — Safari in
// private mode and browsers with site data disabled THROW on localStorage
// access rather than returning null, and a module that forgot the try/catch
// takes the whole app down at import time on those browsers. Centralizing the
// access means a setting can't be written without that protection.
//
// Deliberately NOT a store, a context, or a sync layer. It's useState that
// happens to survive a reload: each caller still owns its own key, its own
// default, and any rules about how its value relates to another's (see
// voicePreference.tsx, where Suitcase Mode and narration are coupled). Putting
// those rules here would make one module the place every unrelated setting
// goes to argue.

/** Never throws. A browser that refuses storage reads as "nothing stored". */
function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Never throws. Failing to persist is survivable — the value still holds
 *  for this session, which is strictly better than crashing the render. */
function writeRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Private mode / storage disabled / quota. Session-only is fine.
  }
}

/**
 * A boolean setting remembered per browser, stored as "1" / "0".
 *
 * Returns the same shape as useState, plus a `toggle` for the common switch
 * case. Anything absent or unparseable reads as `fallback`, so a key that was
 * never written and a browser that refuses storage behave identically.
 */
export function usePersistedFlag(
  key: string,
  fallback = false,
): {
  value: boolean;
  setValue: (next: boolean) => void;
  toggle: () => void;
} {
  const [value, setLocal] = useState(() => {
    const raw = readRaw(key);
    return raw === null ? fallback : raw === "1";
  });

  const setValue = useCallback(
    (next: boolean) => {
      setLocal(next);
      writeRaw(key, next ? "1" : "0");
    },
    [key],
  );

  // Reads through the setter rather than closing over `value`, so a caller
  // can hand this to an onChange without it going stale between renders.
  const toggle = useCallback(() => {
    setLocal((cur) => {
      writeRaw(key, cur ? "0" : "1");
      return !cur;
    });
  }, [key]);

  return { value, setValue, toggle };
}

/**
 * A string setting remembered per browser (PresenterNotes' selected voice).
 *
 * `isValid` guards what comes back out: stored values outlive the code that
 * wrote them, so a voice id that has since been removed must not be handed to
 * a caller that assumes it still exists.
 */
export function usePersistedValue(
  key: string,
  fallback: string,
  isValid?: (stored: string) => boolean,
): {
  value: string;
  setValue: (next: string) => void;
} {
  const [value, setLocal] = useState(() => {
    const raw = readRaw(key);
    if (raw === null) return fallback;
    return !isValid || isValid(raw) ? raw : fallback;
  });

  const setValue = useCallback(
    (next: string) => {
      setLocal(next);
      writeRaw(key, next);
    },
    [key],
  );

  return { value, setValue };
}

/** Escape hatch for read-once-at-module-scope callers that aren't hooks.
 *  Same guarantees: never throws, absent reads as the fallback. */
export function readPersistedFlag(key: string, fallback = false): boolean {
  const raw = readRaw(key);
  return raw === null ? fallback : raw === "1";
}
