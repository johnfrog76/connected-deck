import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PresenterNotes } from "./PresenterNotes";
import {
  NARRATION_VOICES,
  NO_NARRATION_TITLE,
  VOICE_STORAGE_KEY,
} from "./narrationConstants";

// Where narration audio COMES FROM is the subtlest thing this component gets
// told, and the easiest to regress silently — both paths look identical until
// you actually press play:
//
//   AUTHOR (hasApi, the default) — every toggle synthesizes via POST
//     /api/narrate, and the server caches the result to disk keyed
//     (deck, slide, voice). That side effect is load-bearing: it's how voices
//     get baked WHILE you rehearse, so a deck you've run through is a deck
//     you've baked.
//   VISITOR (hasApi=false + resolver) — committed mp3s are the only audio, and
//     a fetch would be a doomed request to a server that by design isn't
//     running. This is how the app ships.
//
// These tests pin both paths through the real component, so a future change
// can't quietly cost the author their rehearse-is-bake loop or hand the
// visitor a fetch that can never succeed.

// The full deck canon is irrelevant here (and heavy); one fake deck exercises
// the routing + narration paths. Titles give sayText real content without
// depending on extractSayText's note-kit parsing.
jest.mock("../decks/index", () => ({
  DECKS: [
    {
      id: "fake-deck",
      slides: () => [
        { id: "s1", title: "The first slide", copy: null, notes: "plain notes" },
        { id: "s2", title: "The second slide", copy: null, notes: "more notes" },
      ],
    },
  ],
}));

// MarkdownViewer drags in react-markdown (ESM) — irrelevant to the narration
// contract under test.
jest.mock("../shared/MarkdownViewer", () => ({
  MarkdownViewer: () => null,
}));

const JENNY = NARRATION_VOICES[0].id;

// Every Audio constructed, by source URL — the assertion surface for "where
// did the audio come from".
const audioUrls: string[] = [];
class AudioStub {
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public src: string) {
    audioUrls.push(src);
  }
  play() {
    return Promise.resolve();
  }
  pause() {}
}

class BroadcastChannelStub {
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor(public name: string) {}
  postMessage() {}
  close() {}
}

const fetchMock = jest.fn(async () => ({
  ok: true,
  blob: async () => new Blob(["audio"]),
}));

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.BroadcastChannel = BroadcastChannelStub;
  g.Audio = AudioStub;
  g.fetch = fetchMock;
  // jsdom lacks object URLs; the api path turns its blob into one.
  const u = URL as unknown as Record<string, unknown>;
  u.createObjectURL ??= () => "blob:narrated";
  u.revokeObjectURL ??= () => {};
});

beforeEach(() => {
  audioUrls.length = 0;
  fetchMock.mockClear();
  localStorage.removeItem(VOICE_STORAGE_KEY);
});

function mountNotes(props?: Parameters<typeof PresenterNotes>[0]) {
  return render(
    <MemoryRouter initialEntries={["/deck/fake-deck/notes"]}>
      <Routes>
        <Route path="/deck/:deckId/notes" element={<PresenterNotes {...props} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PresenterNotes — narration source follows the host facts", () => {
  it("author (default props): toggling narration synthesizes via /api/narrate", async () => {
    // Mounted BARE — hasApi defaulting true IS the contract for an author with
    // the narrate server running, so this test fails if the default flips.
    mountNotes();

    fireEvent.click(screen.getByTitle("Play with narration"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/narrate");
    // (deck, slide, voice) is the server's bake/cache key — the rehearse-is-
    // bake side effect depends on all three arriving.
    const body = JSON.parse(String(init.body));
    expect(body.deck).toBe("fake-deck");
    expect(body.slide).toBe("s1");
    expect(body.voice).toBe(JENNY);
    // The audio that plays is the synthesized response, not a committed file.
    await waitFor(() => expect(audioUrls).toEqual(["blob:narrated"]));
  });

  it("visitor (static facts): plays the committed mp3, never fetches", async () => {
    mountNotes({
      hasApi: false,
      resolveNarrationUrl: (slide, voiceId) =>
        `/voices/fake-deck/${slide.id}-${voiceId}.mp3`,
    });

    fireEvent.click(screen.getByTitle("Play with narration"));

    await waitFor(() =>
      expect(audioUrls).toEqual([`/voices/fake-deck/s1-${JENNY}.mp3`]),
    );
    // The whole reason the static branch exists: /api/narrate isn't there.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("static host with nothing baked: the toggle is dead, no doomed fetch", () => {
    mountNotes({ hasApi: false, resolveNarrationUrl: () => null });

    // Both the toggle and the picker carry the no-narration title; the button
    // is the toggle.
    const toggle = screen
      .getAllByTitle(NO_NARRATION_TITLE)
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);

    fireEvent.click(toggle);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(audioUrls).toEqual([]);
  });
});
