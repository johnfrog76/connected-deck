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
import { ArrowRightRegular, Clock12Regular } from "@fluentui/react-icons";
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

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "48px 24px",
    display: "flex",
    justifyContent: "center",
  },
  wrap: {
    width: "100%",
    maxWidth: "780px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  modeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
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
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
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
  footerCta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
    width: "210px",
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

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div>
          <Title1>Connected Deck</Title1>
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
    </div>
  );
}
