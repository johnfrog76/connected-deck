import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { ArrowRightRegular, Clock12Regular, SettingsRegular } from "@fluentui/react-icons";
import { SettingsDrawer } from "./SettingsDrawer";
import { MEDIA } from "./media";
import { DECKS } from "./decks/index";
import { DeckState } from "./decks/types";
import { estimateDeckDuration } from "./deck-engine/deckDuration";
import { CopyLinkButton } from "./deck-engine/CopyLinkButton";
import { BAKED_VOICES, voiceUrl, type VoiceId } from "./bakedVoices";
import { usePresenterMode } from "./presenterMode";
import { useVoicePreference } from "./voicePreference";
import { useViewport } from "./viewport";
import {
  HeroBackdrop,
  LaunchKeyframes,
  Lockup,
  PodiumScene,
  SCENE_TINTS,
  SofaScene,
  SuitcaseScene,
} from "./LaunchArt";
import type { Deck } from "./decks/types";
import type { ReactNode } from "react";

const REPO_URL = "https://github.com/johnfrog76/connected-deck";

// The mode choice sits in the open rather than behind the gear on purpose:
// having viewing modes is the thing this app demonstrates, so it should be
// visible before you've clicked anything. It used to be a bare Switch; now
// each mode is a living scene you can tap, which says the same thing louder.
//
// The gear still holds everything (SettingsDrawer), and the modes appear in
// BOTH places deliberately, not as a duplicate: cards and drawer read the same
// presenterMode / voicePreference contexts, so they cannot disagree, and
// someone who goes looking for a settings panel shouldn't find the app's main
// choice missing from it.

const useStyles = makeStyles({
  // Mobile-first throughout this file: the BASE declaration is the phone, and
  // the desktop values cascade from a MEDIA.sm block below them. See media.ts
  // for why that order is the contract rather than a preference.
  page: {
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    [MEDIA.sm]: {
      padding: "48px 24px",
    },
  },
  wrap: {
    width: "100%",
    maxWidth: "960px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  // ── The masthead: a piece of the trailer's sky with the plug in it ────────
  // Always-dark art panel regardless of theme, so the text colors inside are
  // literals rather than tokens — same rule as deck art.
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    // Violet-night, not dead-black: the sky has weather in it now, and the
    // backdrop's glows (violet, peach, a dawn note) need a base with a hue to
    // build on rather than a void to drown in.
    background: "linear-gradient(180deg, #0a0c1c 0%, #121430 58%, #1b1533 100%)",
    padding: "24px 20px",
    [MEDIA.sm]: {
      padding: "36px 40px",
    },
  },
  heroRow: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalL,
  },
  // The plug rides above the title on a phone — side by side there'd be no
  // room left for the wordmark.
  heroLead: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: tokens.spacingVerticalM,
    flex: 1,
    minWidth: 0,
    [MEDIA.sm]: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacingHorizontalXL,
    },
  },
  // Body copy is 20px page-wide (fontSizeBase500) — the launch page is read
  // at arm's length like a landing page, not scanned like an app.
  heroTagline: {
    display: "block",
    marginTop: "12px",
    maxWidth: "56ch",
    fontSize: tokens.fontSizeBase500,
    color: "#98a0b6",
    lineHeight: tokens.lineHeightBase500,
  },
  heroReport: {
    display: "none",
    [MEDIA.sm]: {
      display: "block",
      position: "absolute",
      right: "20px",
      bottom: "12px",
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      fontSize: "0.62rem",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#46c8f5",
      opacity: 0.75,
    },
  },
  // ── The mode stage ────────────────────────────────────────────────────────
  stageHead: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  // The page's H1 — the lockup above is branding, not a heading, so the
  // content heading carries the outline and the scale.
  stageTitle: {
    margin: 0,
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  stageHint: {
    fontSize: tokens.fontSizeBase500,
    lineHeight: tokens.lineHeightBase500,
    color: tokens.colorNeutralForeground2,
    maxWidth: "62ch",
  },
  stageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
    [MEDIA.sm]: {
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: tokens.spacingHorizontalM,
    },
  },
  // A native button so the whole card — art and all — is one tap target.
  modeCard: {
    display: "flex",
    flexDirection: "column",
    padding: 0,
    margin: 0,
    textAlign: "left",
    font: "inherit",
    color: "inherit",
    cursor: "pointer",
    overflow: "hidden",
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.25s",
    ":hover": {
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
    ":focus-visible": {
      outline: `2px solid ${tokens.colorBrandForeground1}`,
      outlineOffset: "2px",
    },
  },
  modeCardActive: {
    ...shorthands.borderColor(tokens.colorBrandForeground2),
    boxShadow: `0 0 0 1px ${tokens.colorBrandForeground2}, 0 10px 32px rgba(70, 200, 245, 0.22)`,
    ":hover": {
      ...shorthands.borderColor(tokens.colorBrandForeground2),
    },
  },
  modeCardDisabled: {
    cursor: "default",
    ":hover": {
      ...shorthands.borderColor(tokens.colorNeutralStroke2),
    },
  },
  // Wider than tall on a phone so three stacked cards don't become a corridor;
  // 16:9 once they sit side by side.
  artBand: {
    position: "relative",
    width: "100%",
    aspectRatio: "2 / 1",
    overflow: "hidden",
    [MEDIA.sm]: {
      aspectRatio: "16 / 9",
    },
  },
  // Every scene stays in FULL color — the earlier 0.68-brightness dim on
  // inactive cards greyed two thirds of the page's art and made the whole
  // thing read overcast. Active is now said with ADDED light (the ring and
  // glow on the card) plus a whisper of desaturation here, nothing more.
  artDim: {
    position: "absolute",
    inset: 0,
    filter: "brightness(0.94) saturate(0.9)",
    transitionProperty: "filter",
    transitionDuration: "0.35s",
  },
  artLit: {
    filter: "none",
  },
  modeBody: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "12px 16px 14px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  modeName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  modeBlurb: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase200,
  },
  modeStatus: {
    marginTop: "6px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  modeStatusActive: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
  },
  // Same surface as the mode cards — one card material across the page, so
  // the deck list reads as part of the same system rather than a second one.
  card: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  // The Watch/Present button drops below the title on a phone and goes
  // full-width — a 44px-tall target across the card beats a small one wedged
  // beside wrapping text.
  cardTop: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: tokens.spacingVerticalS,
    [MEDIA.sm]: {
      flexDirection: "row",
      // Centered, not corner-pinned: the button floats mid-row beside the
      // text block instead of hiding top-right where the eye has to hunt.
      alignItems: "center",
      justifyContent: "space-between",
      gap: tokens.spacingHorizontalXXL,
    },
  },
  // 44px is the Apple HIG touch floor; Fluent's default button is shorter.
  // Only applied below sm — a mouse doesn't need it, and a room watching a
  // launch page doesn't want it.
  cardAction: {
    minHeight: "44px",
    [MEDIA.sm]: {
      minHeight: "unset",
    },
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  // Measured, not full-width: a summary that runs the whole card crowds the
  // action column and reads like terms and conditions. ~70ch is the cap.
  summary: {
    display: "block",
    marginTop: tokens.spacingVerticalXS,
    maxWidth: "70ch",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
  badges: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
    marginTop: tokens.spacingVerticalS,
  },
  // The open-source pitch, promoted from the footer: it's half the reason the
  // page exists, so it reads as the stage head's second paragraph rather than
  // as fine print nobody scrolls to.
  openSourceCopy: {
    margin: 0,
    marginTop: tokens.spacingVerticalM,
    maxWidth: "62ch",
    fontSize: tokens.fontSizeBase500,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase500,
  },
  // Basic legal footer, the Wasteland's grammar: year · name · rights —
  // centered, with the repo link as a quiet icon in the bottom-right corner.
  // The 1fr/auto/1fr grid keeps the legal line truly centered regardless of
  // what the right column holds (including CopyLinkButton's "Copied!" node).
  footer: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground3,
  },
  footerRepo: {
    gridColumn: "3",
    display: "flex",
    justifyContent: "flex-end",
  },
});

/**
 * Which voices can narrate this deck end to end, from the committed mp3s.
 * Same resolver the player uses, so the badge can't promise audio that
 * doesn't play.
 */
function bakedVoiceNames(deck: Deck): string[] {
  const slides = deck.slides();
  if (slides.length === 0) return [];
  return BAKED_VOICES.filter((voice) =>
    slides.every((slide) => voiceUrl(deck.id, slide.id, voice.id as VoiceId)),
  ).map((v) => v.name);
}

// ── One mode card: a live scene, a name, and the state you're in ─────────────
function ModeCard({
  scene,
  tint,
  name,
  blurb,
  status,
  active,
  disabled,
  onSelect,
}: {
  scene: ReactNode;
  /** The scene's own accent (SCENE_TINTS) — the heading speaks in its world's voice. */
  tint?: string;
  name: string;
  blurb: string;
  /** what's true right now — the visible answer to "which mode am I in?" */
  status: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const styles = useStyles();
  return (
    <button
      type="button"
      className={`${styles.modeCard} ${active ? styles.modeCardActive : ""} ${
        disabled ? styles.modeCardDisabled : ""
      }`}
      aria-pressed={active}
      disabled={disabled}
      onClick={onSelect}
    >
      <div className={styles.artBand}>
        <div className={`${styles.artDim} ${active ? styles.artLit : ""}`}>{scene}</div>
      </div>
      <div className={styles.modeBody}>
        <span className={styles.modeName} style={tint ? { color: tint } : undefined}>
          {name}
        </span>
        <span className={styles.modeBlurb}>{blurb}</span>
        <span className={`${styles.modeStatus} ${active ? styles.modeStatusActive : ""}`}>
          {status}
        </span>
      </div>
    </button>
  );
}

function DeckRow({ deck, presenter }: { deck: Deck; presenter: boolean }) {
  const styles = useStyles();
  const navigate = useNavigate();

  const slides = deck.slides();
  const duration = estimateDeckDuration(slides);
  const voices = bakedVoiceNames(deck);
  const state = deck.state ?? DeckState.Prod;

  return (
    <Card size="small" appearance="outline" className={styles.card}>
      <div className={styles.cardTop}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className={styles.title}>{deck.title}</span>
          <span className={styles.summary}>{deck.summary}</span>
          <div className={styles.badges}>
            <Badge appearance="tint" color="informative" size="small">
              {slides.length} slides
            </Badge>
            <Tooltip
              content={`Approximate time to get through this deck (~${duration})`}
              relationship="label"
            >
              <Badge
                appearance="tint"
                color="success"
                size="small"
                icon={<Clock12Regular />}
              >
                {duration}
              </Badge>
            </Tooltip>
            {/* Narration state, said plainly. "Not baked" is a real and
                expected state — it means this deck has no committed audio
                yet, not that the player can't narrate. */}
            <Tooltip
              content={
                voices.length
                  ? `Narrated by ${voices.join(" and ")} — plays from committed audio, no setup`
                  : "No committed audio for this deck — run the narrate server to bake your own"
              }
              relationship="label"
            >
              <Badge
                appearance="tint"
                color={voices.length ? "brand" : "subtle"}
                size="small"
              >
                {voices.length ? `voiced · ${voices.join(", ")}` : "not baked"}
              </Badge>
            </Tooltip>
            {state !== DeckState.Prod && (
              <Badge appearance="tint" color="warning" size="small">
                {state}
              </Badge>
            )}
          </div>
        </div>
        <Button
          className={styles.cardAction}
          icon={<ArrowRightRegular />}
          appearance="primary"
          // The mode is pinned into the URL rather than left to the setting, so
          // this link means the same thing wherever it ends up — copied to
          // someone else, bookmarked, or reopened after the switch has moved.
          onClick={() => navigate(`/deck/${deck.id}?present=${presenter ? 1 : 0}`)}
          title={presenter ? "Open at the podium" : "Open on the sofa"}
        >
          {presenter ? "Present" : "Watch"}
        </Button>
      </div>
    </Card>
  );
}

export function LaunchPage() {
  const styles = useStyles();
  const { presenter, setPresenter } = usePresenterMode();
  const { suitcaseMode, setSuitcaseMode, narrateByDefault } = useVoicePreference();
  const { isMobile } = useViewport();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Effective state, same rules as SettingsForm: podium needs a window wide
  // enough for the notes popout, suitcase needs sofa AND voice. The cards show
  // where you actually ARE, not just what's stored.
  const atPodium = presenter && !isMobile;
  const suitcaseActive = !atPodium && suitcaseMode && narrateByDefault;
  const sofaActive = !atPodium && !suitcaseActive;

  return (
    <div className={styles.page}>
      <LaunchKeyframes />
      <div className={styles.wrap}>
        <header className={styles.hero}>
          <HeroBackdrop />
          <div className={styles.heroRow}>
            <div className={styles.heroLead}>
              <div>
                <Lockup />
                <Body1 as="p" className={styles.heroTagline}>
                  A presentation engine that renders live, connected React components inside
                  your slides — not static screenshots. A slide is just a component, so it can
                  render a real chart, call a real API, or embed an actual piece of your
                  product&apos;s UI.
                </Body1>
              </div>
            </div>
            <Tooltip content="Settings" relationship="label">
              <Button
                appearance="subtle"
                icon={<SettingsRegular />}
                aria-label="Settings"
                onClick={() => setSettingsOpen(true)}
              />
            </Tooltip>
          </div>
          {/* field-report line in the sky's quiet corner — hidden on a phone,
              where the hero has no quiet corner to put it in */}
          <span className={styles.heroReport} aria-hidden="true">
            | plug in · {DECKS.length} decks on the shelf · narration baked
          </span>
        </header>

        <section role="group" aria-label="How do you want to watch?">
          <div className={styles.stageHead}>
            <h1 className={styles.stageTitle}>How do you want to watch?</h1>
            <span className={styles.stageHint}>
              Three ways to play a deck. Pick one — it sticks in this browser, and the gear
              holds the fine print.
            </span>
          </div>
          <div className={styles.stageGrid}>
            <ModeCard
              scene={<SofaScene />}
              tint={SCENE_TINTS.sofa}
              name="Sofa Mode"
              blurb="Read to me. Voice and mute live in the player — lean back and watch."
              status={sofaActive ? "● On now" : "Tap to switch"}
              active={sofaActive}
              onSelect={() => {
                // Order matters to nobody but the reader: sofa is the absence
                // of the other two, so clear them both.
                setSuitcaseMode(false);
                setPresenter(false);
              }}
            />
            <ModeCard
              scene={<PodiumScene />}
              tint={SCENE_TINTS.podium}
              name="Podium Mode"
              blurb="I&rsquo;m presenting. Notes, a timer, and the next slide in a second window."
              status={
                isMobile
                  ? "Needs a wider window — notes pop out beside the deck."
                  : atPodium
                    ? "● On now"
                    : "Tap to switch"
              }
              active={atPodium}
              disabled={isMobile}
              onSelect={() => setPresenter(true)}
            />
            <ModeCard
              scene={<SuitcaseScene />}
              tint={SCENE_TINTS.suitcase}
              name="Suitcase Mode (mobile)"
              blurb="Decks play themselves — narration ends, next slide starts. Headphones on."
              status={
                suitcaseActive
                  ? isMobile
                    ? "● On now"
                    : "● On — auto-advance kicks in at phone width"
                  : "Tap to switch — turns Voice on"
              }
              active={suitcaseActive}
              onSelect={() => {
                // Suitcase implies sofa and voice. Setting the parents it
                // needs is the user's explicit act here — the opposite of a
                // dependent setting overriding them on its own.
                setPresenter(false);
                setSuitcaseMode(true);
              }}
            />
          </div>
        </section>

        {/* The deck shelf gets its own section head: the open-source pitch is
            the INTRO to the decks — these two are what "your stories" look
            like once they're told — not fine print orbiting the mode picker. */}
        <section aria-label="Tell your stories">
          <div className={styles.stageHead}>
            <h2 className={styles.stageTitle}>Tell your stories</h2>
            <p className={styles.openSourceCopy}>
              Slides are just components, narration bakes to audio, and the whole thing
              ships as static files. It&apos;s open source — take it, wire up your own
              slides, and make something worth waiting for.
            </p>
          </div>
          <div className={styles.list}>
            {DECKS.map((deck) => (
              <DeckRow key={deck.id} deck={deck} presenter={presenter} />
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <Caption1 as="p" style={{ gridColumn: "2", margin: 0 }}>
            {new Date().getFullYear()} · ConnectedDeck · All rights reserved.
          </Caption1>
          <div className={styles.footerRepo}>
            <CopyLinkButton
              url={REPO_URL}
              corner={null}
              title="Copy the connected-deck repo link"
              inverse
            />
          </div>
        </footer>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
