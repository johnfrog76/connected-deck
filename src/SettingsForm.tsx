import {
  Body1,
  Label,
  Radio,
  RadioGroup,
  Subtitle2,
  Switch,
  makeStyles,
  tokens,
  useId,
} from "@fluentui/react-components";
import {
  NARRATION_VOICES,
  NO_NARRATION_TITLE,
  VOICE_PICKER_TITLE,
  voiceOptionLabel,
} from "./deck-engine/narrationConstants";
import { usePresenterMode } from "./presenterMode";
import { useVoicePreference } from "./voicePreference";
import { useViewport } from "./viewport";
import {
  VIEWING_MODES,
  computeAtPodium,
  computeAudiobookActive,
  computeAudiobookAvailable,
  computeViewingMode,
  type ViewingMode,
} from "./settingsRules";

// THE settings form. One component owns what the settings ARE, what they mean,
// how they gate each other, and what every row says — regardless of which
// surface it's rendered into.
//
// Two surfaces render it today: the launch page's side drawer (SettingsDrawer)
// and the in-deck bottom sheet behind the viewer's bar (DeckChromeViewer). They
// differ in PRESENTATION only — the sheet is tighter, drops section headings,
// and leaves out Podium, which is chosen before a deck opens — and that
// difference is a `variant` prop here rather than a second copy of the form
// somewhere else.
//
// Why this exists: the two surfaces WERE separate implementations, and they
// drifted exactly the way you'd expect. The drawer said "Narrated"/"Silent",
// the sheet said "Narration". The drawer explained why a disabled switch was
// disabled; the sheet just greyed it out, which reads as broken. Worst of all,
// each surface restated the gating rules itself, so one of them was wrong: the
// drawer's auto-advance switch checked Presenter but not Voice, and stayed live
// over a silent deck.
//
// The rule is stated ONCE, below, and every surface inherits it.

export type SettingsVariant = "drawer" | "sheet";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
  },
  // The sheet is tighter: it opens over a slide someone is mid-way through,
  // so it should take the smallest bite of the screen that still reads.
  drawerGap: { gap: tokens.spacingVerticalL },
  sheetGap: { gap: tokens.spacingVerticalM },
  setting: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase300,
  },
  group: {
    color: tokens.colorNeutralForeground2,
    display: "block",
    marginBottom: tokens.spacingVerticalS,
  },
  modeName: {
    display: "block",
    fontWeight: tokens.fontWeightSemibold,
  },
  modeLine: {
    display: "block",
    color: tokens.colorNeutralForeground3,
  },
});

/** One row: a switch that names the state you're IN, and a hint that leads
 *  with what's true right now. The hint is not optional — a disabled switch
 *  with no reason attached reads as broken rather than as dependent. */
function Setting({
  checked,
  onChange,
  disabled,
  label,
  hint,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  hint: string;
  ariaLabel?: string;
}) {
  const styles = useStyles();
  return (
    <div className={styles.setting}>
      <Switch
        checked={checked}
        onChange={(_, data) => onChange(data.checked)}
        disabled={disabled}
        label={label}
        aria-label={ariaLabel}
      />
      <Body1 as="p" className={styles.hint}>
        {hint}
      </Body1>
    </div>
  );
}

export interface SettingsFormProps {
  variant?: SettingsVariant;
  /**
   * Drive the LIVE playback instead of the stored preference.
   *
   * These are genuinely different things and the form serves both: in Settings
   * the Narration switch decides whether FUTURE decks open narrated, while
   * in-deck it mutes THIS playback right now — the same setting as the bar's
   * sound button. Muting the deck you're watching shouldn't silently rewrite
   * what every future deck does, so the in-deck sheet passes the player's
   * session state here and the row drives that instead. Everything else — the
   * label, the hint, the mode's gating — is identical either way, which is the
   * entire reason this is one component.
   *
   * Omit them (the drawer does) and the row falls back to the preference.
   */
  narrationValue?: boolean;
  onNarrationChange?: () => void;
  /** Nothing narrates this deck at all — the row goes dead, not just unchecked. */
  narrationDisabled?: boolean;
  /**
   * Voice choices WITH per-deck coverage, when a host has surveyed a specific
   * deck (voiceCoverage.ts). In-deck this disables voices that deck wasn't
   * baked in; in Settings, with no deck in scope, every voice is offered and
   * the choice is stored as the default. Omit to fall back to the full roster.
   */
  voices?: readonly { id: string; name: string; available: boolean }[];
  voiceId?: string;
  onVoiceChange?: (id: string) => void;
  /**
   * In-deck only: whether Audiobook mode is driving this viewing, and how to
   * choose between it and Sofa. The sheet shows the mode row only when the
   * host passes `onAudiobookChange` — a host that locks the player to one mode
   * leaves it out, and the row with it.
   */
  audiobookValue?: boolean;
  onAudiobookChange?: (next: boolean) => void;
}

export function SettingsForm({
  variant = "drawer",
  narrationValue,
  onNarrationChange,
  narrationDisabled = false,
  voices,
  voiceId,
  onVoiceChange,
  audiobookValue,
  onAudiobookChange,
}: SettingsFormProps) {
  const styles = useStyles();
  const { presenter, setPresenter } = usePresenterMode();
  const {
    narrateByDefault,
    setNarrateByDefault,
    audiobookMode,
    setAudiobookMode,
    defaultVoiceId,
    setDefaultVoiceId,
  } = useVoicePreference();
  const { isMobile } = useViewport();
  const modeLabelId = useId("deck-mode");

  // In-deck: the surveyed voices for THIS deck, driving the live player.
  // In Settings: the full roster, setting the stored default. Same rows.
  const voiceOptions =
    voices ?? NARRATION_VOICES.map((v) => ({ ...v, available: true }));
  const selectedVoice = voiceId ?? defaultVoiceId;
  const changeVoice = onVoiceChange ?? setDefaultVoiceId;

  const sheet = variant === "sheet";

  // Live session state when a host supplies it, the stored preference
  // otherwise. Everything downstream — including the mode's gating — reads
  // this one value, so the in-deck sheet gates on what's actually audible
  // rather than on what a future deck would do.
  const narrationOn = narrationValue ?? narrateByDefault;
  const setNarrationOn = onNarrationChange
    ? () => onNarrationChange()
    : (next: boolean) => setNarrateByDefault(next);

  // ---------------------------------------------------------- the rules ---
  // Stated once. Every `checked`, `disabled` and label below reads these, so
  // they cannot disagree with each other the way two hand-written surfaces did.
  //
  // In-deck the sheet is always Sofa's player or Audiobook's (Podium has its
  // own bar and no sheet), so the effective mode there is what the player
  // reports. In Settings, Podium is forced off on a phone (no second window to
  // put notes in), so this is the EFFECTIVE mode rather than the stored flag.
  const atPodium = sheet ? false : computeAtPodium(presenter, isMobile);
  const audiobookActive = sheet
    ? !!audiobookValue
    : computeAudiobookActive(atPodium, audiobookMode, narrationOn);
  const mode = computeViewingMode(atPodium, audiobookActive);
  const audiobookAvailable = computeAudiobookAvailable(false, narrationDisabled);

  const showModeRow = !sheet || !!onAudiobookChange;
  const modes: ViewingMode[] = sheet ? ["sofa", "audiobook"] : ["sofa", "audiobook", "podium"];

  const chooseMode = (next: ViewingMode) => {
    if (sheet) {
      // Audiobook advances on a clip's END, so choosing it here turns this
      // viewing's narration on too — the listener's explicit act, never a
      // dependent setting overriding its parent on its own.
      if (next === "audiobook" && !narrationOn) setNarrationOn(true);
      onAudiobookChange?.(next === "audiobook");
      return;
    }
    if (next === "podium") {
      setPresenter(true);
      return;
    }
    setPresenter(false);
    // setAudiobookMode(true) turns narration on with it (voicePreference.tsx).
    setAudiobookMode(next === "audiobook");
  };

  const modeHint = !audiobookAvailable
    ? "Audiobook needs narration — this deck has no baked audio to advance on."
    : !sheet && isMobile
      ? "Podium needs a wider window — notes pop out beside the deck."
      : sheet
        ? mode === "audiobook"
          ? "Reading aloud and turning the slides. Pick Sofa to page by hand."
          : "Paging by hand. Pick Audiobook to let the deck play itself."
        : "Which way a deck opens. It sticks in this browser.";

  return (
    <div className={`${styles.form} ${sheet ? styles.sheetGap : styles.drawerGap}`}>
      {/* The mode first: it decides which bar you get and whether the deck
          turns its own slides. Podium shows on a phone, disabled with its
          reason, rather than vanishing — someone who set Podium and opened a
          deck in a narrow window landed in Sofa, and an ABSENT option can't
          explain why. In-deck, Podium isn't offered at all: the mode a deck
          opens in is chosen before it opens. */}
      {showModeRow && (
        <div className={styles.setting}>
          {sheet ? (
            <Label id={modeLabelId}>Mode</Label>
          ) : (
            <Subtitle2 as="h3" id={modeLabelId} className={styles.group}>
              Mode
            </Subtitle2>
          )}
          <RadioGroup
            aria-labelledby={modeLabelId}
            value={mode}
            onChange={(_, data) => chooseMode(data.value as ViewingMode)}
          >
            {modes.map((m) => (
              <Radio
                key={m}
                value={m}
                disabled={
                  (m === "audiobook" && !audiobookAvailable) || (m === "podium" && isMobile)
                }
                label={{
                  children: (
                    <>
                      <span className={styles.modeName}>{VIEWING_MODES[m].name}</span>
                      <span className={styles.modeLine}>{VIEWING_MODES[m].line}</span>
                    </>
                  ),
                }}
              />
            ))}
          </RadioGroup>
          <Body1 as="p" className={styles.hint}>
            {modeHint}
          </Body1>
        </div>
      )}

      <div>
        {!sheet && (
          <Subtitle2 as="h3" className={styles.group}>
            Voice
          </Subtitle2>
        )}
        <div className={`${styles.form} ${sheet ? styles.sheetGap : styles.drawerGap}`}>
          <Setting
            checked={narrationOn}
            onChange={setNarrationOn}
            disabled={narrationDisabled}
            label={narrationOn ? "Narrated" : "Silent"}
            hint={
              narrationDisabled
                ? "This deck has no baked audio — nothing to read aloud."
                : sheet
                  ? narrationOn
                    ? mode === "audiobook"
                      ? "Reading this deck aloud. Flip to Silent and it goes back to paging."
                      : "Reading this deck aloud. Flip to watch in silence."
                    : "Silent. Flip this and it picks up from this slide."
                  : narrationOn
                    ? "Decks read each slide to you as it arrives. Sit back."
                    : "Decks open quiet. Flip this and they talk from the first slide."
            }
          />

          {/* Radios, not a dropdown: two or three voices fit without a menu,
              and a tap target beats a popover on a phone. Rendered in BOTH
              surfaces — in Settings it's the voice a deck opens in, which
              previously had nowhere to be chosen before opening one. */}
          <div className={styles.setting}>
            <RadioGroup
              aria-label={VOICE_PICKER_TITLE}
              value={selectedVoice}
              // Nothing narrates this deck ⇒ the whole group is dead, not just
              // its options: there is no valid choice left to make inside it.
              disabled={narrationDisabled}
              onChange={(_, data) => changeVoice(data.value)}
            >
              {voiceOptions.map((v) => (
                <Radio
                  key={v.id}
                  value={v.id}
                  disabled={!v.available}
                  label={voiceOptionLabel(v.name, v.available)}
                />
              ))}
            </RadioGroup>
            <Body1 as="p" className={styles.hint}>
              {narrationDisabled
                ? NO_NARRATION_TITLE
                : sheet
                  ? "Who's reading this deck."
                  : "Who reads a deck to you, unless a deck says otherwise."}
            </Body1>
          </div>
        </div>
      </div>
    </div>
  );
}
