import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  button: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorSubtleBackground,
    color: tokens.colorNeutralForeground2,
    cursor: "pointer",
    borderRadius: tokens.borderRadiusMedium,
    width: "26px",
    height: "26px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s ease",
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
  label: {
    border: "none",
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground3,
    cursor: "pointer",
    fontSize: "0.68rem",
    fontFamily: "inherit",
    minWidth: "34px",
    letterSpacing: "0.02em",
  },
});

interface ZoomControlProps {
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  /** Reset target when the percentage is clicked. Defaults to 1. */
  resetTo?: number;
  /**
   * The buttons' side in px, 26 unless given: a host on a phone passes its
   * touch target, and the percentage grows to read beside it.
   */
  buttonSize?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function ZoomControl({
  zoom,
  setZoom,
  resetTo = 1,
  buttonSize,
  min = 0.5,
  max = 3,
  step = 0.25,
}: ZoomControlProps) {
  const styles = useStyles();
  const clamp = (z: number) => Math.min(max, Math.max(min, z));
  const sized = buttonSize
    ? { width: `${buttonSize}px`, height: `${buttonSize}px`, fontSize: "1.25rem" }
    : undefined;
  const labelSized = buttonSize ? { fontSize: "0.9rem", minWidth: "48px" } : undefined;
  return (
    <div className={styles.root}>
      <button
        className={styles.button}
        style={sized}
        title="Zoom out"
        onClick={() => setZoom((z) => clamp(z - step))}
      >
        −
      </button>
      <button
        className={styles.label}
        style={labelSized}
        title="Reset zoom"
        onClick={() => setZoom(() => resetTo)}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        className={styles.button}
        style={sized}
        title="Zoom in"
        onClick={() => setZoom((z) => clamp(z + step))}
      >
        +
      </button>
    </div>
  );
}
