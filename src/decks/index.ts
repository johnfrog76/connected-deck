import type { Deck } from "./types";
import { gettingStartedDeck } from "./getting-started";
import { connectedDeckTrailerDeck } from "./connected-deck-trailer";

// The registry. A deck exists — has a route, shows on the launch page — as
// soon as it's imported and listed here; there is no other registration step.
//
// Two decks on purpose: the floor and the ceiling. `getting-started` is the
// minimum shape of a deck, small enough to read end to end and copy. The
// trailer is a full production deck — original CSS/SVG art, composed notes,
// baked narration — so the distance between "hello world" and "finished
// thing" is visible in the same repo, under the same contract.
export const DECKS: Deck[] = [gettingStartedDeck, connectedDeckTrailerDeck];
