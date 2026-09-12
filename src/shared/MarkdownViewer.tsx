import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { ChevronUpRegular } from "@fluentui/react-icons";
import type { Components } from "react-markdown";
import { ZoomControl } from "./ZoomControl";

const useStyles = makeStyles({
  outer: {
    width: "100%",
  },
  toolbar: {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: tokens.spacingVerticalXS,
  },
  content: {
    maxWidth: "80ch",
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: "1.75",
    color: tokens.colorNeutralForeground1,
    "& > *:first-child": { marginTop: 0 },
    "& > *:last-child": { marginBottom: 0 },
  },
  backToTop: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: tokens.spacingVerticalXL,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  h1: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    marginTop: tokens.spacingVerticalXXL,
    marginBottom: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  h2: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginTop: tokens.spacingVerticalXXL,
    marginBottom: tokens.spacingVerticalM,
  },
  h3: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginTop: tokens.spacingVerticalXL,
    marginBottom: tokens.spacingVerticalM,
  },
  h4: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginTop: tokens.spacingVerticalXL,
    marginBottom: tokens.spacingVerticalM,
  },
  p: {
    marginTop: 0,
    marginBottom: tokens.spacingVerticalL,
  },
  ul: {
    paddingLeft: "1.75rem",
    marginTop: 0,
    marginBottom: tokens.spacingVerticalL,
  },
  ol: {
    paddingLeft: "1.75rem",
    marginTop: 0,
    marginBottom: tokens.spacingVerticalL,
  },
  li: {
    marginBottom: tokens.spacingVerticalS,
  },
  blockquote: {
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    paddingLeft: tokens.spacingHorizontalL,
    margin: 0,
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
    fontStyle: "italic",
  },
  inlineCode: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: "0.9em",
    backgroundColor: tokens.colorNeutralBackground3,
    padding: "2px 5px",
    borderRadius: tokens.borderRadiusSmall,
  },
  pre: {
    backgroundColor: tokens.colorNeutralBackground4,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    overflowX: "auto",
    margin: `0 0 ${tokens.spacingVerticalL} 0`,
  },
  blockCode: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: "1.6",
  },
  a: {
    color: tokens.colorBrandForeground1,
    textDecoration: "none",
    "&:hover": { textDecoration: "underline" },
  },
  tableWrapper: {
    overflowX: "auto",
    marginBottom: tokens.spacingVerticalL,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    "& tbody tr:nth-child(even)": {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  th: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    textAlign: "left" as const,
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  td: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    textAlign: "left" as const,
  },
  img: {
    maxWidth: "100%",
    borderRadius: tokens.borderRadiusMedium,
    display: "block",
  },
  hr: {
    border: "none",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    margin: `${tokens.spacingVerticalXL} 0`,
  },
});

interface Props {
  content: string;
  maxHeight?: string | number;
  style?: React.CSSProperties;
}

export function MarkdownViewer({ content, maxHeight, style }: Props) {
  const styles = useStyles();
  const [zoom, setZoom] = useState(1.25);
  const topRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (maxHeight !== undefined && contentRef.current) {
      contentRef.current.scrollTop = 0;
    } else {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const components: Components = {
    h1({ node: _n, ...props }) {
      return <h1 className={styles.h1} {...props} />;
    },
    h2({ node: _n, ...props }) {
      return <h2 className={styles.h2} {...props} />;
    },
    h3({ node: _n, ...props }) {
      return <h3 className={styles.h3} {...props} />;
    },
    h4({ node: _n, ...props }) {
      return <h4 className={styles.h4} {...props} />;
    },
    p({ node: _n, ...props }) {
      return <p className={styles.p} {...props} />;
    },
    ul({ node: _n, ...props }) {
      return <ul className={styles.ul} {...props} />;
    },
    ol({ node: _n, ...props }) {
      return <ol className={styles.ol} {...props} />;
    },
    li({ node: _n, ...props }) {
      return <li className={styles.li} {...props} />;
    },
    blockquote({ node: _n, ...props }) {
      return <blockquote className={styles.blockquote} {...props} />;
    },
    code({ node: _n, children: c, className }) {
      const isBlock = /language-/.test(className ?? "") || String(c).includes("\n");
      return isBlock ? (
        <code className={styles.blockCode}>{c}</code>
      ) : (
        <code className={styles.inlineCode}>{c}</code>
      );
    },
    pre({ node: _n, ...props }) {
      return <pre className={styles.pre} {...props} />;
    },
    a({ node: _n, href, children: c, ...props }) {
      return (
        <a href={href} className={styles.a} target="_blank" rel="noopener noreferrer" {...props}>
          {c}
        </a>
      );
    },
    table({ node: _n, children: c }) {
      return (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>{c}</table>
        </div>
      );
    },
    th({ node: _n, ...props }) {
      return <th className={styles.th} {...props} />;
    },
    td({ node: _n, ...props }) {
      return <td className={styles.td} {...props} />;
    },
    img({ node: _n, src, alt }) {
      return <img src={src} alt={alt} className={styles.img} />;
    },
    hr() {
      return <hr className={styles.hr} />;
    },
  };

  return (
    <div ref={topRef} className={styles.outer} style={style}>
      <div className={styles.toolbar}>
        <ZoomControl zoom={zoom} setZoom={setZoom} min={0.5} max={2} step={0.25} />
      </div>
      <div
        ref={contentRef}
        className={styles.content}
        style={{
          zoom,
          ...(maxHeight !== undefined ? { maxHeight, overflowY: "auto" } : {}),
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
      <div className={styles.backToTop}>
        <Button appearance="subtle" size="small" icon={<ChevronUpRegular />} onClick={scrollToTop}>
          Top
        </Button>
      </div>
    </div>
  );
}
