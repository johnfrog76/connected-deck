import { useEffect } from "react";
import {
  makeStyles,
  tokens,
  Button,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { SettingsForm } from "./SettingsForm";
import { MEDIA } from "./media";

// A container, and nothing else. What the settings ARE — their labels, their
// hints, and the rules about how they gate each other — lives in
// SettingsForm.tsx, which the in-deck bottom sheet renders too. That's the
// whole point: two surfaces, one form, no chance of them disagreeing.

const useStyles = makeStyles({
  // Mobile-first: full-width below sm, where a side panel would leave a
  // useless sliver of dimmed page beside it. Above sm the width is NOT set
  // here — OverlayDrawer's own size="small" owns it, and picking a number
  // would just be this file guessing at Fluent's.
  surface: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    width: "100vw",
    maxWidth: "100vw",
    [MEDIA.sm]: {
      width: "unset",
      maxWidth: "unset",
    },
  },
});

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const styles = useStyles();

  // Lock body scroll while the drawer's open — the real fix for the white
  // sliver at the drawer's right edge (Drawer is `position: fixed`, sized
  // against the viewport; body's own scrollbar gutter narrows body's content
  // box behind it, leaving a scrollbar-width gap with nothing painted in it).
  // Removing the scrollbar removes the gap it leaves, rather than papering
  // over it with a background color. Restores whatever overflow value was
  // already there, not a hardcoded "visible" — this shouldn't assume it's the
  // only thing that ever touches it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <OverlayDrawer
      open={open}
      className={styles.surface}
      position="end"
      // Clicking the scrim or pressing Escape closes — a settings panel should
      // never trap you, and there's nothing here to lose by dismissing.
      onOpenChange={(_, { open: next }) => {
        if (!next) onClose();
      }}
      size="small"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close settings"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          Settings
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <SettingsForm variant="drawer" />
      </DrawerBody>
    </OverlayDrawer>
  );
}
