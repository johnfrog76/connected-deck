// ── Cat Dev ──────────────────────────────────────────────────────────────────
// A recurring character from the deck library this engine came out of: the
// team's uncredited tenth engineer, who contributes mainly by sleeping on the
// warm hardware. It appears here because the trailer casts it as the occupant
// of Sofa Mode — the lean-back half of the two-mode story the deck tells.
//
// It's also a worked example of the only kind of dependency a slide really
// has: a plain component. No engine API, no registration, no data layer —
// import it, drop it in a slide's `content`, done. Yours would be a chart or
// a dashboard card; this one happens to be a cat.
//
// Two poses: the canonical sleeping loaf and an upright "alert" pose, both
// sharing a ground line (y≈86) so either drops into a composition without
// re-rigging it. ANIMATION CONTRACT: the host deck must declare the keyframes
// this figure references — `rs-breathe` and `rs-zz` (and `cd-eartwitch` if
// you pass `twitch`). Without them the figure renders correctly and simply
// holds still, which is a valid register rather than a bug.
export function CatDev({
  width = 150,
  accent = "#b58ea8",
  zz = true,
  perch = false,
  pose = "sleeping",
  twitch = false,
}: {
  /** number (px) or a CSS length like "100%" so hosts can scale relatively */
  width?: number | string;
  accent?: string;
  zz?: boolean;
  /** cushion on top of a monitor — the canonical Cat Dev workstation */
  perch?: boolean;
  /** "sleeping" (default) — curled loaf; "alert" — upright, ears perked, eyes open */
  pose?: "sleeping" | "alert";
  /**
   * One-shot ear twitch on the alert pose (the exact moment the monitoring
   * layer notices). The hosting deck must declare @keyframes cd-eartwitch;
   * without it the pose simply holds still, which is also a valid register.
   */
  twitch?: boolean;
}) {
  const furDeep = "#241d33";
  const ink = "#151022";
  return (
    <svg width={width} viewBox={perch ? "0 0 160 180" : "0 0 160 96"} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="cd-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3454" />
          <stop offset="0.55" stopColor="#2f2840" />
          <stop offset="1" stopColor={furDeep} />
        </linearGradient>
      </defs>
      {perch && (
        <g>
          {/* the cushion, dented by cat physics */}
          <path
            d="M 28 92 Q 26 84 36 83 L 124 83 Q 134 84 132 92 Q 133 100 122 100 L 38 100 Q 27 100 28 92 Z"
            fill="#5a3a54"
            stroke="#6e4a66"
            strokeWidth="1.5"
          />
          {[50, 80, 110].map((x) => (
            <circle key={x} cx={x} cy={92} r={1.8} fill={accent} opacity={0.7} />
          ))}
          {/* the monitor underneath — the log stays awake while the cat doesn't */}
          <rect x="36" y="100" width="88" height="58" rx="6" fill="#0d111c" stroke="#3a4a6e" strokeWidth="1.5" />
          <rect x="42" y="106" width="76" height="46" rx="3" fill="#0a0f0d" />
          {[
            [46, 110, 40],
            [46, 117, 52],
            [46, 124, 34],
            [46, 131, 58],
            [46, 138, 28],
          ].map(([x, y, w], i) => (
            <rect key={i} x={x} y={y} width={w} height="2.5" rx="1" fill="#79d68a" opacity="0.35" />
          ))}
          <rect x="46" y="145" width="5" height="3" rx="1" fill="#79d68a" opacity="0.8" style={{ animation: "rs-glowsip 2.4s ease-in-out infinite" }} />
          <rect x="72" y="158" width="16" height="10" fill="#1d2536" />
          <rect x="52" y="168" width="56" height="6" rx="3" fill="#1d2536" />
        </g>
      )}
      {/* the cat breathes; the furniture doesn't */}
      <g style={{ animation: "rs-breathe 3.8s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center bottom" }}>
        {zz && pose === "sleeping" &&
          [0, 1].map((i) => (
            <text
              key={i}
              x={134 + i * 9}
              y={26 - i * 11}
              fontSize={10 + i * 4}
              fill={accent}
              opacity={0.8}
              style={{ animation: "rs-zz 3.2s ease-out infinite", animationDelay: `${i * 0.8}s` }}
            >
              z
            </text>
          ))}
        {pose === "sleeping" ? (
          <g>
        {/* tail wrapped around the front */}
        <path d="M 32 80 Q 10 78 12 62 Q 14 50 26 52" fill="none" stroke="url(#cd-fur)" strokeWidth="10" strokeLinecap="round" />
        {/* curled body */}
        <ellipse cx="74" cy="60" rx="50" ry="28" fill="url(#cd-fur)" />
        {/* tabby stripes across the back */}
        <g stroke={furDeep} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.65">
          <path d="M 48 38 Q 52 48 48 58" />
          <path d="M 68 34 Q 72 44 68 54" />
          <path d="M 88 36 Q 92 46 88 56" />
        </g>
        {/* head, tucked low */}
        <circle cx="114" cy="54" r="22" fill="url(#cd-fur)" />
        {/* ears, inner in accent */}
        <path d="M 98 40 L 100 22 L 111 33 Z" fill="url(#cd-fur)" />
        <path d="M 119 32 L 129 20 L 133 36 Z" fill="url(#cd-fur)" />
        <path d="M 101.5 36 L 102.5 27 L 108 32.5 Z" fill={accent} opacity="0.5" />
        <path d="M 121.5 31 L 127 24.5 L 129 32.5 Z" fill={accent} opacity="0.5" />
        {/* closed eyes — it shipped yesterday, it's earned this */}
        <path d="M 101 52 Q 105 56 109 52" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 118 52 Q 122 56 126 52" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
        {/* muzzle, nose, philtrum */}
        <ellipse cx="113" cy="63" rx="10" ry="7" fill="#3d3454" />
        <path d="M 110.5 59.5 L 115.5 59.5 L 113 63 Z" fill={accent} />
        <path d="M 113 63 Q 113 66 109.5 67 M 113 63 Q 113 66 116.5 67" fill="none" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
        {/* whiskers */}
        <g stroke="#d9c9d4" strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
          <line x1="103" y1="61" x2="87" y2="58" />
          <line x1="103" y1="64" x2="87" y2="66" />
          <line x1="123" y1="61" x2="139" y2="58" />
          <line x1="123" y1="64" x2="139" y2="66" />
        </g>
        {/* front paw tucked under the chin, toes divoted */}
        <ellipse cx="97" cy="80" rx="12" ry="6" fill={furDeep} />
        <path d="M 93 78 L 93 82 M 99 78 L 99 82" stroke={ink} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          </g>
        ) : (
          // ── alert pose — same ground line (y≈86) as the loaf, so it drops
          // into any composition (including the perch) without re-rigging
          <g>
            {/* tail raised, not wrapped — the first tell that it noticed */}
            <path d="M 108 84 Q 138 80 142 58 Q 144 42 132 40" fill="none" stroke="url(#cd-fur)" strokeWidth="9" strokeLinecap="round" />
            {/* seated haunch + upright torso */}
            <ellipse cx="86" cy="66" rx="32" ry="21" fill="url(#cd-fur)" />
            <ellipse cx="74" cy="52" rx="23" ry="30" fill="url(#cd-fur)" />
            {/* tabby stripes riding the haunch */}
            <g stroke={furDeep} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.65">
              <path d="M 100 52 Q 104 60 100 70" />
              <path d="M 110 58 Q 113 64 110 72" />
            </g>
            {/* front legs planted */}
            <path d="M 64 70 L 62 84" stroke="url(#cd-fur)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 82 70 L 84 84" stroke="url(#cd-fur)" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="61" cy="86" rx="7" ry="4" fill={furDeep} />
            <ellipse cx="85" cy="86" rx="7" ry="4" fill={furDeep} />
            {/* head up, facing the room */}
            <circle cx="74" cy="22" r="18" fill="url(#cd-fur)" />
            {/* left ear steady */}
            <path d="M 61 12 L 60 0 L 72 7 Z" fill="url(#cd-fur)" />
            <path d="M 63.5 10 L 63 3.5 L 69 7 Z" fill={accent} opacity="0.5" />
            {/* right ear — the one that twitches when the physics demand it */}
            <g
              style={
                twitch
                  ? { animation: "cd-eartwitch 0.7s ease-in-out 0.5s 3", transformBox: "fill-box", transformOrigin: "20% 100%" }
                  : undefined
              }
            >
              <path d="M 77 7 L 87 0 L 90 13 Z" fill="url(#cd-fur)" />
              <path d="M 79.5 6.5 L 85.5 2 L 87.5 10 Z" fill={accent} opacity="0.5" />
            </g>
            {/* eyes open — round, fixed on the dark machine */}
            <ellipse cx="67" cy="21" rx="3.4" ry="4.2" fill="#d8e69a" />
            <ellipse cx="81" cy="21" rx="3.4" ry="4.2" fill="#d8e69a" />
            <ellipse cx="67" cy="21.5" rx="1.2" ry="3" fill={ink} />
            <ellipse cx="81" cy="21.5" rx="1.2" ry="3" fill={ink} />
            {/* muzzle, nose, philtrum */}
            <ellipse cx="74" cy="31" rx="9" ry="6" fill="#3d3454" />
            <path d="M 71.8 28.5 L 76.2 28.5 L 74 31.5 Z" fill={accent} />
            <path d="M 74 31.5 Q 74 34 71 35 M 74 31.5 Q 74 34 77 35" fill="none" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
            {/* whiskers */}
            <g stroke="#d9c9d4" strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
              <line x1="65" y1="29" x2="50" y2="26" />
              <line x1="65" y1="32" x2="50" y2="34" />
              <line x1="83" y1="29" x2="98" y2="26" />
              <line x1="83" y1="32" x2="98" y2="34" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
