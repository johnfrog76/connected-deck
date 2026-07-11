// Synthetic sample data for the "connected component" slide in the sample
// deck. None of this is real telemetry — it exists purely to demonstrate that
// a slide can render a live, data-driven dashboard component instead of a
// static screenshot.

export interface DailyActivity {
  date: string;
  mine: number;
  team: number;
  churn: number;
  teamChurn: number;
}

export const DEMO_REPO_NAME = "sample-repo";
export const DEMO_SPRINT_NAME = "Sprint 5";
export const DEMO_AS_OF = "2026-07-07";

export const DEMO_CONTEXT = {
  daysRemaining: 3,
  mergeVelocity: 3,
  upstreamMerges: 11,
};

export const DEMO_ACTIVITY: DailyActivity[] = [
  { date: "2026-06-24", mine: 15, team: 51, churn: 2010, teamChurn: 10757 },
  { date: "2026-06-25", mine: 6, team: 51, churn: 1518, teamChurn: 17879 },
  { date: "2026-06-26", mine: 3, team: 77, churn: 92, teamChurn: 16031 },
  { date: "2026-06-27", mine: 0, team: 0, churn: 0, teamChurn: 0 },
  { date: "2026-06-28", mine: 0, team: 0, churn: 0, teamChurn: 0 },
  { date: "2026-06-29", mine: 10, team: 54, churn: 691, teamChurn: 9782 },
  { date: "2026-06-30", mine: 11, team: 57, churn: 2232, teamChurn: 10477 },
  { date: "2026-07-01", mine: 2, team: 60, churn: 0, teamChurn: 12124 },
  { date: "2026-07-02", mine: 0, team: 48, churn: 0, teamChurn: 14064 },
  { date: "2026-07-03", mine: 0, team: 48, churn: 0, teamChurn: 6797 },
  { date: "2026-07-04", mine: 0, team: 0, churn: 0, teamChurn: 0 },
  { date: "2026-07-05", mine: 0, team: 0, churn: 0, teamChurn: 0 },
  { date: "2026-07-06", mine: 0, team: 28, churn: 0, teamChurn: 7999 },
  { date: "2026-07-07", mine: 0, team: 34, churn: 0, teamChurn: 3417 },
];
