// The viewer's bar, as a layout rule.
//
// The bar is three columns, `1fr auto 1fr`: Exit in the left one, the transport
// in the middle one, settings, fullscreen and the sound in the right one. The
// two outer columns share what the transport leaves, equally, so the
// transport's centre is the bar's centre at every width — not the centre of
// the space between two groups of different widths, which is where a
// space-between row puts it.
//
// One caveat the rule carries, and the reason the sizes live here rather than
// in DeckChromeViewer's styles: `1fr` is `minmax(auto, 1fr)`, so a column never
// gets narrower than its content. While each outer group fits in its half, the
// halves are equal and the centre is exact; a group wider than its half would
// take more and push the transport off the axis. The sizes below are what keep
// the phone's groups inside their halves, and `resolveViewerBar` is the grid's
// own arithmetic over them, so a test can hold the rule at a width jsdom
// cannot lay out.

/** The bar's grid. */
export const VIEWER_BAR_COLUMNS = "1fr auto 1fr";

/** Left and right padding of the bar (the bottom rides the home-bar inset). */
export function viewerBarInset(compact: boolean): number {
  return compact ? 8 : 24;
}

/** The gap between the columns, and between the controls inside a group. */
export function viewerBarGap(compact: boolean): number {
  return compact ? 4 : 12;
}

/** The phone's touch floor (Apple's 44px), for every icon control on the bar. */
export const TOUCH_TARGET = 44;
/** The phone's paging arrows: the most-pressed controls, a little wider. */
export const TOUCH_ARROW_WIDTH = 48;
/** The play ring's diameter (AudiobookTransport's default). */
export const RING_SIZE = 48;
/** The slide counter's box, phone and desktop. */
export function counterWidth(compact: boolean): number {
  return compact ? 48 : 60;
}

/**
 * Where the transport's centre lands, by the grid's own rules: the fr tracks
 * share the free space equally unless a column's content is wider than its
 * share, in which case that column is sized to its content and the other takes
 * the rest (the CSS Grid "find the size of an fr" step, for two tracks).
 */
export function resolveViewerBar({
  width,
  compact,
  left,
  middle,
  right,
}: {
  width: number;
  compact: boolean;
  left: number;
  middle: number;
  right: number;
}): { centre: number; leftColumn: number; rightColumn: number } {
  const inset = viewerBarInset(compact);
  const gap = viewerBarGap(compact);
  const free = Math.max(0, width - 2 * inset - 2 * gap - middle);
  let leftColumn = free / 2;
  let rightColumn = free / 2;
  if (left > leftColumn && left >= right) {
    leftColumn = left;
    rightColumn = Math.max(right, free - left);
  } else if (right > rightColumn) {
    rightColumn = right;
    leftColumn = Math.max(left, free - right);
  }
  return { centre: inset + leftColumn + gap + middle / 2, leftColumn, rightColumn };
}
