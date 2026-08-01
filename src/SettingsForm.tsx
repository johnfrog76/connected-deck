import {
  Body1,
  Radio,
  RadioGroup,
  Subtitle2,
  Switch,
  makeStyles,
  tokens,
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

// THE settings form. One component owns what the settings ARE, what they mean,
// how they gate each other, and what every row says — regardless of which
// surface it's rendered into.
//
// Two surfaces render it today: the launch page's side drawer (SettingsDrawer)
// and the in-deck bottom sheet on a phone (DeckChromeMobile). They differ in
// PRESENTATION only — the sheet is tighter, drops section headings, and hides
// rows that make no sense mid-deck — and that difference is a `variant` prop
// here rather than a second copy of the form somewhere else.
//
// Why this exists: the two surfaces WERE separate implementations, and they
// drifted exactly the way you'd expect. The drawer said "Narrated"/"Silent",
// the sheet said "Narration". The drawer explained why a disabled switch was
// disabled; the sheet just greyed it out, which reads as broken. Worst of all,
// each surface restated the gating rules itself, so one of them was wrong: the
// drawer's Suitcase switch checked Presenter but not Voice, and stayed live
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
   * in-deck it mutes THIS playback right now. Muting the deck you're watching
   * shouldn't silently rewrite what every future deck does, so the in-deck
   * sheet passes the player's session state here and the row drives that
   * instead. Everything else — the label, the hint, the Suitcase gating — is
   * identical either way, which is the entire reason this is one component.
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
}

export function SettingsForm({
  variant = "drawer",
  narrationValue,
  onNarrationChange,
  narrationDisabled = false,
  voices,
  voiceId,
  onVoiceChange,
}: SettingsFormProps) {
  const styles = useStyles();
  const { presenter, setPresenter } = usePresenterMode();
  const {
    narrateByDefault,
    setNarrateByDefault,
    suitcaseMode,
    setSuitcaseMode,
    defaultVoiceId,
    setDefaultVoiceId,
  } = useVoicePreference();
  const { isMobile } = useViewport();

  // In-deck: the surveyed voices for THIS deck, driving the live player.
  // In Settings: the full roster, setting the stored default. Same rows.
  const voiceOptions =
    voices ?? NARRATION_VOICES.map((v) => ({ ...v, available: true }));
  const selectedVoice = voiceId ?? defaultVoiceId;
  const changeVoice = onVoiceChange ?? setDefaultVoiceId;

  const sheet = variant === "sheet";

  // Live session state when a host supplies it, the stored preference
  // otherwise. Everything downstream — including Suitcase Mode's gating —
  // reads this one value, so the in-deck sheet gates on what's actually
  // audible rather than on what a future deck would do.
  const narrationOn = narrationValue ?? narrateByDefault;
  const setNarrationOn = onNarrationChange
    ? () => onNarrationChange()
    : (next: boolean) => setNarrateByDefault(next);

  // ---------------------------------------------------------- the rules ---
  // Stated once. Every `checked`, `disabled` and label below reads these, so
  // they cannot disagree with each other the way two hand-written surfaces did.
  //
  // Presenter is forced off on a phone (no second window to put notes in), so
  // this is the EFFECTIVE mode rather than the stored flag — otherwise someone
  // with a saved Podium preference gets told "you're driving" on a bus.
  const atPodium = presenter && !isMobile;
  // Suitcase Mode has two parents and either one disables it: it advances when
  // a narration clip ENDS, so it needs Voice on to have an event at all, and it
  // needs Sofa because presenter mode drops in-player narration entirely.
  // Reads `narrationOn`, so in-deck it gates on what's actually audible.
  const suitcaseAvailable = !atPodium && narrationOn && !narrationDisabled;

  return (
    <div className={`${styles.form} ${sheet ? styles.sheetGap : styles.drawerGap}`}>
      {/* Presenter is a pre-deck choice — which way a deck OPENS — so in the
          sheet it's disabled rather than interactive. Shown, though, not
          hidden: someone who set Podium and opened a deck in a narrow window
          landed in Sofa, and an ABSENT control can't explain why. This is the
          one row whose job is answering "why am I not where I expected to be?"

          Reachable on a narrowed desktop window far more than on an actual
          phone — you can't resize a phone across the breakpoint, and a phone
          visitor never had a Podium expectation to be surprised out of. So the
          copy talks about window WIDTH, not device. */}
      <div>
        <Subtitle2 as="h3" className={styles.group} style={sheet ? { marginTop: 0 } : undefined}>
          Presenter
        </Subtitle2>
        <Setting
          checked={atPodium}
          onChange={setPresenter}
          disabled={isMobile || sheet}
          label={atPodium ? "Podium" : "Sofa"}
          ariaLabel="Presenter mode: off is Sofa, on is Podium"
          hint={
            isMobile
              ? "Presenter notes in second window are disabled for small screens."
              : sheet
                ? "Set before you open a deck."
                : presenter
                  ? "Notes pop out beside the deck, no Voice control in the way."
                  : "Watching mode — Voice controls, no notes."
          }
        />
      </div>

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
                    ? "Reading this deck aloud. Flip to watch in silence."
                    : "Silent. Flip this and it picks up from this slide."
                  : narrationOn
                    ? "Decks read themselves to you, audiobook style. Sit back."
                    : "Decks open quiet. Flip this and they talk from the first slide."
            }
          />

          <Setting
            checked={suitcaseAvailable && suitcaseMode}
            onChange={setSuitcaseMode}
            disabled={!suitcaseAvailable}
            label={suitcaseAvailable && suitcaseMode ? "Suitcase mode" : "Manual paging"}
            hint={
              atPodium
                ? "Not at the podium — you're driving. Switch to Sofa to let a deck play itself."
                : narrationDisabled
                  ? "Needs narration — this deck has no baked audio to advance on."
                  : !narrationOn
                    ? "Needs Voice — a deck can only play itself if it's reading itself. Turn Narrated on above."
                  : suitcaseMode
                    ? "Decks play themselves — narration ends, next slide starts. Just listen."
                    : "Bus, headphones, gloves on — no fumbling to page a 60-slide deck. Flip this on."
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
