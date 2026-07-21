// POST /api/narrate — reads a slide's Say text aloud via Azure Speech neural
// TTS. Plain text in (SSML-wrapped server-side), mp3 audio out.
//
// Write-through cache: decks are effectively write-once, so re-synthesizing
// identical text on every replay just burns Azure quota. Cache key is
// (deck, slide, voice) -> a committed mp3 under public/voices/, which Vite
// serves statically in both dev and the production build — a cache hit never
// touches Azure. See README.md's "Presenter mode & narration" section.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VOICES_DIR = path.join(ROOT, "public", "voices");
const PORT = process.env.NARRATE_PORT || 5175;

// Loads .env by hand (no dependency) so the server still starts fine with no
// key configured — narration is opt-in, everything else in the app works
// without it. Existing process.env values always win.
async function loadDotEnv() {
  try {
    const content = await readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file — fine, narration just reports itself unconfigured below.
  }
}
await loadDotEnv();

const DEFAULT_VOICE = "en-US-JennyNeural";
// Curated voice shortlist — must match NARRATION_VOICES in PresenterNotes.tsx.
// Requests are validated against it so an unknown voice can't reach Azure or
// the filesystem.
const ALLOWED_VOICES = new Set(["en-US-JennyNeural", "en-US-BrianNeural"]);
// deck/slide become path segments and a filename, so constrain them to keys
// that can't escape the voices/ dir (no slashes, dots, traversal).
const SAFE_KEY = /^[A-Za-z0-9_-]+$/;

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function synthesize(text, voice) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    const err = new Error("AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not set (see .env.example)");
    err.status = 500;
    throw err;
  }
  const ssml = `<speak version="1.0" xml:lang="en-US"><voice name="${voice}">${escapeXml(text)}</voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
      "User-Agent": "connected-deck",
    },
    body: ssml,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`Azure Speech synthesis failed: ${res.status} ${detail}`.trim());
    err.status = 502;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

const app = express();
app.use(express.json());

// Lets the client disable narration controls up front instead of letting
// someone click a toggle that's guaranteed to fail — no Azure call, just a
// key-presence check.
app.get("/api/narrate/status", (_req, res) => {
  const configured = Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
  res.json({ configured });
});

app.post("/api/narrate", async (req, res) => {
  const { text, deck, slide, voice: voiceIn } = req.body ?? {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text must not be empty" });
  }
  const voice = voiceIn || DEFAULT_VOICE;
  if (!ALLOWED_VOICES.has(voice)) {
    return res.status(400).json({ error: `unknown voice: ${voice}` });
  }

  let cacheFile = null;
  if (deck && slide) {
    if (!SAFE_KEY.test(deck) || !SAFE_KEY.test(slide)) {
      return res.status(400).json({ error: "deck/slide must match [A-Za-z0-9_-]+" });
    }
    cacheFile = path.join(VOICES_DIR, deck, `${slide}-${voice}.mp3`);
    try {
      const cached = await readFile(cacheFile);
      res.type("audio/mpeg").send(cached);
      return;
    } catch {
      // Not cached yet — fall through to synthesis.
    }
  }

  try {
    const audio = await synthesize(text, voice);
    if (cacheFile) {
      // Write-through: best-effort. A write failure must not break playback.
      try {
        await mkdir(path.dirname(cacheFile), { recursive: true });
        await writeFile(cacheFile, audio);
      } catch (writeErr) {
        console.error("narrate: failed to write cache file:", writeErr);
      }
    }
    res.type("audio/mpeg").send(audio);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`narrate server listening on http://localhost:${PORT}`);
});
