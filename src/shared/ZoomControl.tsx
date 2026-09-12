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
  min?: number;
  max?: number;
  step?: number;
}

export function ZoomControl({ zoom, setZoom, resetTo = 1, min = 0.5, max = 3, step = 0.25 }: ZoomControlProps) {
  const styles = useStyles();
  const clamp = (z: number) => Math.min(max, Math.max(min, z));
  return (
    <div className={styles.root}>
      <button className={styles.button} title="Zoom out" onClick={() => setZoom((z) => clamp(z - step))}>−</button>
      <button className={styles.label} title="Reset zoom" onClick={() => setZoom(() => resetTo)}>
        {Math.round(zoom * 100)}%
      </button>
      <button className={styles.button} title="Zoom in" onClick={() => setZoom((z) => clamp(z + step))}>+</button>
    </div>
  );
}
