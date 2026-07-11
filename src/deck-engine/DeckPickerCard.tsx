import { useNavigate } from "react-router-dom";
import { Button, Badge, Subtitle2, tokens, makeStyles, Card } from "@fluentui/react-components";
import { ArrowRightRegular } from "@fluentui/react-icons";
import { DECKS } from "../decks/index";
import { PageCard } from "../shared/PageCard";

const usePickerStyles = makeStyles({
  list: {
    display: "flex",
    flexDirection: "column",
  },
  card: {
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
  },
  cardItem: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  title: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
});

export function DeckPicker() {
  const styles = usePickerStyles();
  const navigate = useNavigate();

  if (DECKS.length === 0) {
    return (
      <span style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
        No decks registered.
      </span>
    );
  }

  return (
    <div className={styles.list}>
      {DECKS.map((deck) => {
        const slideCount = deck.createSlides().length;
        return (
          <Card key={deck.id} size="small" appearance="outline" className={styles.card}>
            <div className={styles.cardItem}>
              <div className={styles.cardBody}>
                <div className={styles.meta}>
                  <div className={styles.titleRow}>
                    <Badge appearance="tint" color="brand" size="small">
                      deck
                    </Badge>
                    <span className={styles.title}>{deck.title}</span>
                  </div>
                  <span className={styles.subtitle}>
                    {slideCount} slides · /deck/{deck.id}
                  </span>
                </div>
              </div>
              <Badge appearance="tint" color="informative" size="small">
                {deck.id}
              </Badge>
              <Button
                icon={<ArrowRightRegular />}
                size="small"
                appearance="subtle"
                title="Present deck"
                onClick={() => navigate(`/deck/${deck.id}`)}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function DeckPickerCard() {
  return (
    <PageCard
      headerLeft={<Subtitle2>Decks</Subtitle2>}
      headerRight={
        <Badge color="informative" appearance="filled" size="large">
          {DECKS?.length ?? 0}
        </Badge>
      }
    >
      <DeckPicker />
    </PageCard>
  );
}
