import { tokens } from "@fluentui/react-components";
import type { CSSProperties } from "react";

export function HairlineDivider({ style }: { style?: CSSProperties } = {}) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        margin: 0,
        flexShrink: 0,
        flexGrow: 0,
        width: "100%",
        ...style,
      }}
    />
  );
}
