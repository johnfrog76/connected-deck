import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  Switch,
  Title1,
  Tooltip,
  makeStyles,
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
import type { Deck } from "./decks/types";

const REPO_URL = "https://github.com/johnfrog76/connected-deck";

// The mode switch sits in the open rather than behind a gear icon on purpose:
// having two viewing modes is the thing this app demonstrates, so it should be
// visible before you've clicked anything, not discovered later.
//
// The gear is for everything else (SettingsDrawer). Sofa/Podium appears in
// BOTH places and that's deliberate, not a duplicate: both read the one
// presenterMode context, so they can't disagree, and someone who goes looking
// for a settings panel shouldn't find the app's main choice missing from it.

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
    maxWidth: "780px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  // Title and gear on one line. The gear is the only chrome on this page, so
  // it sits with the title rather than floating in a bar of its own.
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  // Stacks on a phone: label above switch, so neither gets squeezed to a
  // couple of characters. Side by side once there's room.
  modeRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    [MEDIA.sm]: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: tokens.spacingHorizontalL,
    },
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  modeCopy: { display: "flex", flexDirection: "column", gap: "2px" },
  modeLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  modeHint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  list: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM },
  card: { padding: tokens.spacingVerticalM },
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
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: tokens.spacingHorizontalM,
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
  summary: {
    display: "block",
    marginTop: tokens.spacingVerticalXS,
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
  footer: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  footerCopy: {
    flex: 1,
    minWidth: "260px",
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase300,
  },
  // Fixed width, and the label sits to the LEFT of the button. CopyLinkButton
  // mounts a "Copied!" node beside itself on click; letting this group resize
  // would squeeze the flex:1 paragraph and reflow the whole row mid-click.
  // The fixed width is a DESKTOP fix (see the note above): it stops the
  // "Copied!" node from reflowing the paragraph beside it. On a phone there is
  // no paragraph beside it — the footer has already stacked — so the fixed
  // width only serves to strand the button off-centre.
  footerCta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
    width: "100%",
    [MEDIA.sm]: {
      justifyContent: "flex-end",
      width: "210px",
    },
  },
  footerCtaLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div>
          <div className={styles.titleRow}>
            <Title1>Connected Deck</Title1>
            <Tooltip content="Settings" relationship="label">
              <Button
                appearance="subtle"
                icon={<SettingsRegular />}
                aria-label="Settings"
                onClick={() => setSettingsOpen(true)}
              />
            </Tooltip>
          </div>
          <Body1
            style={{
              display: "block",
              marginTop: "8px",
              color: tokens.colorNeutralForeground2,
            }}
          >
            A presentation engine that renders live, connected React components inside your
            slides — not static screenshots. A slide is just a component, so it can render a
            real chart, call a real API, or embed an actual piece of your product&apos;s UI.
          </Body1>
        </div>

        <div className={styles.modeRow}>
          <div className={styles.modeCopy}>
            <span className={styles.modeLabel}>How do you want to watch?</span>
            <span className={styles.modeHint}>
              Sofa: read to me. Podium: I&apos;m presenting.
            </span>
          </div>
          <Switch
            checked={presenter}
            onChange={(_, data) => setPresenter(data.checked)}
            label={presenter ? "Podium" : "Sofa"}
            aria-label="Presenter mode: off is Sofa, on is Podium"
          />
        </div>

        <div className={styles.list}>
          {DECKS.map((deck) => (
            <DeckRow key={deck.id} deck={deck} presenter={presenter} />
          ))}
        </div>

        <footer className={styles.footer}>
          <Body1 as="p" className={styles.footerCopy}>
            Slides are just components, narration bakes to audio, and the whole thing ships
            as static files. It&apos;s open source — take it, wire up your own slides, and
            make something worth waiting for.
          </Body1>
          <div className={styles.footerCta}>
            <Caption1 as="span" className={styles.footerCtaLabel}>
              Copy the repo link
            </Caption1>
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
