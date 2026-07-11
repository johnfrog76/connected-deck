import type { ReactNode } from "react";
import { Card, Spinner, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { HairlineDivider } from "./HairlineDivider";

const useStyles = makeStyles({
  cardBase: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
  },
  cardScrollable: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    justifyContent: "stretch",
    alignItems: "stretch",
    "@media (min-width: 900px)": {
      maxHeight: "600px",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: tokens.spacingHorizontalS,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap" as const,
  },
  scrollArea: {
    display: "flex",
    flexDirection: "column" as const,
    overflowY: "auto",
    minHeight: 0,
    "& > *": { flexShrink: 0 },
    "&::-webkit-scrollbar": { width: "6px" },
    "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke2,
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.colorNeutralStroke1,
    },
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
  },
  emptyState: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingVerticalM}`,
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: tokens.spacingVerticalS,
  },
  loadingBody: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacingVerticalXL,
  },
});

interface PageCardProps {
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
  toast?: ReactNode;
  footer?: ReactNode;
  footerLeft?: ReactNode;
  footerCenter?: ReactNode;
  footerRight?: ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  emptyContent?: ReactNode;
  className?: string;
}

export function PageCard({
  headerLeft,
  headerRight,
  children,
  toast,
  footer,
  footerLeft,
  footerCenter,
  footerRight,
  scrollable = false,
  loading = false,
  loadingLabel = "Loading...",
  emptyContent,
  className,
}: PageCardProps) {
  const styles = useStyles();
  const hasHeader = headerLeft != null || headerRight != null;
  const hasFooterSlots = footerLeft != null || footerCenter != null || footerRight != null;

  let body: ReactNode;
  if (loading) {
    body = (
      <div className={styles.loadingBody}>
        <Spinner size="tiny" label={loadingLabel} />
      </div>
    );
  } else if (emptyContent != null) {
    body = <div className={styles.emptyState}>{emptyContent}</div>;
  } else if (scrollable) {
    body = <div className={styles.scrollArea}>{children}</div>;
  } else {
    body = children;
  }

  return (
    <Card
      className={mergeClasses(scrollable ? styles.cardScrollable : styles.cardBase, className)}
      appearance="outline"
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>{headerLeft}</div>
          {headerRight != null && <div className={styles.headerRight}>{headerRight}</div>}
        </div>
      )}
      {hasHeader && <HairlineDivider />}
      {body}
      {toast != null && !loading && toast}
      {hasFooterSlots && !loading && (
        <div className={styles.footer}>
          <div>{footerLeft}</div>
          <div>{footerCenter}</div>
          <div>{footerRight}</div>
        </div>
      )}
      {!hasFooterSlots && footer != null && !loading && (
        <div className={styles.footer}>{footer}</div>
      )}
    </Card>
  );
}
