import { useState } from "react";
import { Button, Spinner, makeStyles, tokens } from "@fluentui/react-components";
import { CheckmarkCircleFilled, DismissCircleFilled, ArrowClockwiseRegular } from "@fluentui/react-icons";
import { art } from "./theme";
import { runAll, type CheckResult } from "./deckChecks";

/**
 * The repo's guarantees, run in front of you.
 *
 * This IS the open-source pitch, not decoration on it: anyone can clone this
 * repo, so "trust us" isn't worth much — showing the checks pass, live, on
 * the marketing page itself is worth more than the README saying so.
 *
 * NOT A BADGE AND NOT A MOCK. Pressing Run calls the same exported functions
 * the player, the notes popout, and this very launch page call, against the
 * real deck registry and the real baked mp3s on disk. If one of those
 * guarantees breaks and gets deployed, this panel goes red on its own.
 *
 * The repo's Jest suite is the real, CI-gated one — see `npm test`. This is a
 * second, smaller harness that exists to be watched rather than trusted.
 */

const PASS = "#3fbf7d";

const useStyles = makeStyles({
  panel: {
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${art.border}`,
    backgroundColor: art.panel,
    padding: "18px 18px 14px",
  },
  head: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  title: {
    fontFamily: art.mono,
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.24em",
    color: art.accent,
  },
  spacer: { flex: 1 },
  score: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    marginBottom: "18px",
  },
  scoreNum: { fontFamily: art.mono, fontSize: "2.4rem", fontWeight: 700, lineHeight: 1 },
  scoreWord: { fontFamily: art.mono, fontSize: "0.85rem", letterSpacing: "0.2em", color: art.muted },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingTop: "9px",
    paddingBottom: "9px",
    borderTop: `1px solid ${art.border}`,
    fontFamily: art.mono,
    fontSize: "0.88rem",
  },
  name: { flex: 1, minWidth: 0, color: art.text },
  count: { color: art.muted, fontSize: "0.82rem" },
  pill: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    paddingLeft: "9px",
    paddingRight: "9px",
    paddingTop: "3px",
    paddingBottom: "3px",
    borderRadius: "10px",
    minWidth: "38px",
    textAlign: "center",
  },
  detail: {
    fontFamily: art.mono,
    fontSize: "0.76rem",
    color: "#ff6b81",
    paddingLeft: "26px",
    paddingBottom: "8px",
  },
  idle: { fontSize: "0.88rem", color: art.muted, lineHeight: 1.6 },
});

export function Checks() {
  const s = useStyles();
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    // A frame's delay so the spinner paints before the pass blocks the main
    // thread — it only takes a few milliseconds, but without it the button
    // appears not to respond.
    requestAnimationFrame(() => {
      setTimeout(() => {
        setResults(runAll());
        setRunning(false);
      }, 0);
    });
  };

  const passed = results?.reduce((n, r) => n + r.passed, 0) ?? 0;
  const total = results?.reduce((n, r) => n + r.total, 0) ?? 0;
  const allGreen = results !== null && passed === total;

  return (
    <div className={s.panel}>
      <div className={s.head}>
        <span className={s.title}>DECK ENGINE CHECKS</span>
        <span className={s.spacer} />
        <Button
          appearance="primary"
          size="small"
          icon={running ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
          disabled={running}
          onClick={run}
        >
          {results ? "Run again" : "Run"}
        </Button>
      </div>

      {results === null ? (
        <div className={s.idle}>
          Every claim on this page is checkable, so check it. These run the same functions the
          player and the launch page run — including the voice-coverage rule against the real
          mp3s committed in this repo.
        </div>
      ) : (
        <>
          <div className={s.score}>
            <span className={s.scoreNum} style={{ color: allGreen ? PASS : "#ff6b81" }}>
              {passed}/{total}
            </span>
            <span className={s.scoreWord}>{allGreen ? "PASSED" : "FAILED"}</span>
          </div>

          {results.map((r) => {
            const ok = r.passed === r.total;
            return (
              <div key={r.name}>
                <div className={s.row}>
                  {ok ? (
                    <CheckmarkCircleFilled style={{ color: PASS, fontSize: 16 }} />
                  ) : (
                    <DismissCircleFilled style={{ color: "#ff6b81", fontSize: 16 }} />
                  )}
                  <span className={s.name}>{r.name}</span>
                  <span className={s.count}>
                    {r.passed}/{r.total}
                  </span>
                  <span
                    className={s.pill}
                    style={{
                      color: ok ? PASS : "#ff6b81",
                      background: ok ? `${PASS}1f` : "#ff6b811f",
                    }}
                  >
                    {ok ? "Pass" : "Fail"}
                  </span>
                </div>
                {!ok && r.detail && <div className={s.detail}>{r.detail}</div>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
