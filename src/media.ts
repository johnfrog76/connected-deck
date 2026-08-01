// The mobile-first breakpoint scheme (design/wasteland-mobile-wbs.md).
//
// THE CONTRACT (John's): the BASE declarations are the phone (0–575px) —
// mobile styles need no query at all. The desktop styles, which look good
// and stay textually unchanged, cascade from a min-width block below them:
//
//   masthead: {
//     ...mobile styles...          // base: 0–575px
//     [MEDIA.sm]: { ...desktop styles... }   // 576px and up
//   }
//
// Deterministic in Griffel even though it's an atomic compiler: media-query
// rules are inserted in a bucket that sorts AFTER base rules, so a queried
// override reliably beats a bare declaration. The hazard Griffel does have
// is BETWEEN media queries — two queries styling the same property win by
// insertion order, not cascade. When a property needs one value in the
// 576–767 band and another at 768+, pair the bounded `smOnly` with `md`
// ("in other words min-width and max-width") so the two queries never
// overlap.
export const BREAKPOINTS = {
  /** Landscape phones, foldables, small tablet grids start here. */
  sm: 576,
  /** True portrait iPads, tablets, small laptops take over here. */
  md: 768,
} as const;

export const MEDIA = {
  /** 576px and up — where desktop styles usually live. */
  sm: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  /** 768px and up — the "go overboard" tier. */
  md: `@media (min-width: ${BREAKPOINTS.md}px)`,
  /**
   * 576–767px only. Use paired with `md` when the two queried tiers need
   * DIFFERENT values for one property — exclusive ranges sidestep Griffel's
   * between-query insertion-order luck. (.98 guards the fractional-width gap
   * integer bounds would leave on zoomed/hidpi browsers.)
   */
  smOnly: `@media (min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 0.02}px)`,
} as const;
