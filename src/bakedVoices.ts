// The committed-mp3 registry — what makes narration work with zero setup.
//
// The filename is the whole contract: <deckId>/<slideId>-<voiceId>.mp3. Vite
// resolves each match to a hashed asset URL at build time, so this map answers
// both "does this clip exist?" and "where is it?" It's also the resolver the
// coverage survey calls, which is what keeps the voices offered identical to
// the voices that actually play.
//
// The glob is relative to THIS file. Move it and a wrong path resolves to zero
// assets, which surfaces as "this deck wasn't baked" — indistinguishable from
// the legitimate pre-bake state, and so easy to mistake for correct.
const voiceUrls = import.meta.glob<string>("../public/voices/*/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
});

export { NARRATION_VOICES as BAKED_VOICES } from "./deck-engine/narrationConstants";

export type VoiceId = string;

// Keyed by the path tail so lookups don't depend on the build-relative prefix.
const urlByKey = new Map<string, string>();
for (const [path, url] of Object.entries(voiceUrls)) {
  const tail = path.split("/voices/")[1]; // "<deckId>/<slideId>-<voice>.mp3"
  if (tail) urlByKey.set(tail, url);
}

/** The clip's bundled URL, or null when it wasn't baked (callers stay silent). */
export function voiceUrl(
  deckId: string | undefined,
  slideId: string | undefined,
  voice: VoiceId,
): string | null {
  if (!deckId || !slideId) return null;
  return urlByKey.get(`${deckId}/${slideId}-${voice}.mp3`) ?? null;
}
