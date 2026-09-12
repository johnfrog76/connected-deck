/* eslint-disable no-console */
// Bake a deck's narration audio to disk, without clicking through the deck.
//
// Usage (needs the narrate server running, and a key in .env):
//   npm run dev:server                       # in another terminal
//   npm run bake -- connected-deck-trailer
//   npm run bake -- my-deck --voice=jenny
//
// For each slide this computes the canonical spoken text — the exact
// title-then-Say string the player would speak — and POSTs it to
// /api/narrate, whose write-through cache writes
// public/voices/<deck>/<slide>-<voice>.mp3. Slides already cached are served
// from disk with no Azure call, so re-running costs nothing.
//
// Composition lives in sayText.ts and synthesis lives in server/index.js; this
// script is deliberately just the loop and the coverage assertion, so there is
// no third place for "what gets spoken" to drift.
//
// Exits non-zero unless every slide has an mp3 in every requested voice. That
// strictness is the point: a voice is only offered to a viewer when it covers
// the whole deck (see voiceCoverage.ts), so a partial bake is a failure here
// rather than a surprise later.

import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Slide } from "../src/decks/types";
import { slideSpokenText } from "../src/deck-engine/sayText";

const VOICE_NAMES: Record<string, string[]> = {
  jenny: ["en-US-JennyNeural"],
  brian: ["en-US-BrianNeural"],
  both: ["en-US-JennyNeural", "en-US-BrianNeural"],
};

interface DeckLike {
  id: string;
  slides: () => Slide[];
}

function parseArgs(argv: string[]) {
  const args = argv.filter((a) => a !== "--");
  const deckId = args.find((a) => !a.startsWith("--"));
  const voiceArg = args.find((a) => a.startsWith("--voice="))?.slice("--voice=".length) ?? "both";
  const port = Number(args.find((a) => a.startsWith("--port="))?.slice("--port=".length) ?? 5175);
  return { deckId, voiceArg, port };
}

const { deckId, voiceArg, port } = parseArgs(process.argv.slice(2));

if (!deckId) {
  console.error("usage: npm run bake -- <deckId> [--voice=jenny|brian|both] [--port=5175]");
  process.exit(2);
}

const voices = VOICE_NAMES[voiceArg];
if (!voices) {
  console.error(`unknown --voice=${voiceArg} (expected jenny | brian | both)`);
  process.exit(2);
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const deckSrc = join(repoRoot, "src", "decks", `${deckId}.tsx`);
if (!existsSync(deckSrc)) {
  console.error(`no deck source at ${deckSrc} — the deck id must match its filename`);
  process.exit(2);
}

// Import the one deck module rather than the registry, so an unrelated deck's
// import graph can't be dragged into every bake.
const mod: Record<string, unknown> = await import(`../src/decks/${deckId}.tsx`);
const deck = Object.values(mod).find(
  (v): v is DeckLike =>
    typeof v === "object" &&
    v !== null &&
    (v as DeckLike).id === deckId &&
    typeof (v as DeckLike).slides === "function",
);
if (!deck) {
  console.error(`${deckId}.tsx exports no deck with id "${deckId}" and a slides() function`);
  process.exit(2);
}

const slides = deck.slides();
console.log(
  `${deckId}: ${slides.length} slides × ${voices.length} voice(s) → http://localhost:${port}/api/narrate`,
);

let failures = 0;

for (const voice of voices) {
  let cached = 0;
  let synthesized = 0;
  for (const slide of slides) {
    const text = slideSpokenText(slide);
    if (!text) {
      // A slide with nothing to say can never be covered, so it fails the bake
      // instead of being quietly skipped — give it a title or a Say line.
      console.error(`  FAIL ${slide.id} [${voice}]: no title or Say text to speak`);
      failures++;
      continue;
    }
    const file = join(repoRoot, "public", "voices", deckId, `${slide.id}-${voice}.mp3`);
    const before = existsSync(file) ? statSync(file).mtimeMs : null;
    let res: Response;
    try {
      res = await fetch(`http://localhost:${port}/api/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, deck: deckId, slide: slide.id, voice }),
      });
    } catch {
      console.error(
        `  FAIL ${slide.id} [${voice}]: narrate server not reachable on port ${port} — run 'npm run dev:server'`,
      );
      failures++;
      continue;
    }
    if (!res.ok) {
      console.error(`  FAIL ${slide.id} [${voice}]: ${res.status} ${(await res.text()).slice(0, 200)}`);
      failures++;
      continue;
    }
    await res.arrayBuffer(); // drain; the artifact we want is the cache file
    if (!existsSync(file)) {
      console.error(`  FAIL ${slide.id} [${voice}]: synthesis ok but no file at ${file}`);
      failures++;
      continue;
    }
    if (before !== null && statSync(file).mtimeMs === before) cached++;
    else synthesized++;
  }
  console.log(
    `${voice}: ${cached + synthesized}/${slides.length} baked (${cached} cached, ${synthesized} synthesized)`,
  );
}

if (failures > 0) {
  console.error(`bake incomplete — ${failures} failure(s)`);
  process.exit(1);
}
console.log("bake complete — every slide has audio in every requested voice");
