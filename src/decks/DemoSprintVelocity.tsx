import { useMemo } from "react";
import { Badge, Caption1, Subtitle2, tokens } from "@fluentui/react-components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import { PageCard } from "../shared/PageCard";
import {
  DEMO_ACTIVITY,
  DEMO_AS_OF,
  DEMO_CONTEXT,
  DEMO_REPO_NAME,
  DEMO_SPRINT_NAME,
} from "./assets/demo-sprint-snapshot";

const MINE_COLOR = "#818CF8"; // indigo-400
const TEAM_COLOR = "#F7C948"; // amber

const useStyles_tiles = {
  display: "flex",
  gap: "1.5rem",
  rowGap: "1rem",
  justifyContent: "center",
  flexWrap: "wrap" as const,
  marginTop: "0.5rem",
  marginBottom: "0.5rem",
};

function Tile({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        padding: "0.5rem 1rem",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        minWidth: "110px",
      }}
    >
      <span style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1, color }}>{value}</span>
      <Caption1>{label}</Caption1>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const mine = payload.find((p) => p.dataKey === "mine")?.value ?? 0;
  const team = payload.find((p) => p.dataKey === "team")?.value ?? 0;
  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: 4,
        padding: "6px 10px",
        fontSize: 12,
        color: "#fff",
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      {mine > 0 && <div>Mine: {mine} commit{mine !== 1 ? "s" : ""}</div>}
      {team > 0 && <div>Team: {team} merge{team !== 1 ? "s" : ""}</div>}
    </div>
  );
}

/**
 * A frozen, self-contained stand-in for a "connect this to your own store and
 * API" dashboard card. In the real app this component talks to RTK Query; here
 * it renders a fixed sample snapshot so the slide never drifts and the sample
 * repo needs no backend to run. Swap DEMO_ACTIVITY for a live query and this
 * is the same trick the flagship engineering-os deck uses on real dashboards.
 */
export function DemoSprintVelocity() {
  const chartData = useMemo(
    () =>
      DEMO_ACTIVITY.map((d) => ({
        label: new Date(d.date + "T00:00:00").toLocaleString("default", {
          weekday: "short",
          day: "numeric",
        }),
        mine: d.mine,
        team: d.team,
      })),
    [],
  );

  const totals = useMemo(() => {
    const mine = DEMO_ACTIVITY.reduce((sum, d) => sum + d.mine, 0);
    const team = DEMO_ACTIVITY.reduce((sum, d) => sum + d.team, 0);
    const mineChurn = DEMO_ACTIVITY.reduce((sum, d) => sum + d.churn, 0);
    const teamChurn = DEMO_ACTIVITY.reduce((sum, d) => sum + d.teamChurn, 0);
    const activeDays = DEMO_ACTIVITY.filter((d) => d.mine > 0).length;
    return { mine, team, mineChurn, teamChurn, activeDays };
  }, []);

  return (
    <PageCard
      headerLeft={
        <>
          <Subtitle2>Team</Subtitle2>
          <Badge appearance="tint" color="brand" size="small">
            demo
          </Badge>
        </>
      }
      headerRight={
        <Badge appearance="tint" color="subtle" size="small">
          Readonly
        </Badge>
      }
      footerLeft={
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Recorded as of {DEMO_AS_OF}
        </Caption1>
      }
    >
      <div style={useStyles_tiles}>
        <Tile value={DEMO_CONTEXT.daysRemaining} label="days left" />
        <Tile value={totals.mine} label="commits" />
        <Tile value={totals.team} label="merges" />
        <Tile value={`${totals.activeDays}/${DEMO_ACTIVITY.length}`} label="active days" />
        <Tile value={DEMO_CONTEXT.mergeVelocity} label="velocity" color="#F7C948" />
        <Tile value={DEMO_CONTEXT.upstreamMerges} label="upstream merges" color="#F1707B" />
        <Tile value={totals.mineChurn.toLocaleString()} label="my churn" />
        <Tile value={totals.teamChurn.toLocaleString()} label="team churn" />
        <Tile
          value={totals.teamChurn > 0 ? `${Math.round((totals.mineChurn / totals.teamChurn) * 100)}%` : "0"}
          label="my share"
        />
      </div>
      <div style={{ display: "flex", flexGrow: 1, marginTop: "0.25rem" }}>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="svMine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MINE_COLOR} stopOpacity={0.72} />
                <stop offset="100%" stopColor={MINE_COLOR} stopOpacity={0.28} />
              </linearGradient>
              <linearGradient id="svTeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAM_COLOR} stopOpacity={0.72} />
                <stop offset="100%" stopColor={TEAM_COLOR} stopOpacity={0.28} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={34} />
            <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
            <RTooltip content={<ChartTooltipContent />} cursor={{ fill: "transparent" }} />
            <Bar dataKey="mine" stackId="a" fill="url(#svMine)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="team" stackId="a" fill="url(#svTeam)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: "0.25rem" }}>
        {DEMO_REPO_NAME} · {DEMO_SPRINT_NAME}
      </Caption1>
    </PageCard>
  );
}
