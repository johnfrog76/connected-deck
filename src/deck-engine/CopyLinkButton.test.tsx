import { render, screen } from "@testing-library/react";
import { CONNECTED_DECK_REPO_URL, CopyLinkButton, isDarkBehind } from "./CopyLinkButton";
import { ViewportProvider } from "../viewport";

// The closing slide's repository button: a link that opens the repository,
// whose contrast follows the stage unless the deck says otherwise.

function onStage(stage: Partial<CSSStyleDeclaration>, inverse?: boolean) {
  render(
    <div style={stage as React.CSSProperties}>
      <CopyLinkButton inverse={inverse} />
    </div>,
  );
  return screen.getByRole("link");
}

function installMatchMedia(phone: boolean) {
  // Every viewport query is a min-width; a phone matches none of them.
  (globalThis as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    matches: !phone,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

afterEach(() => {
  delete (globalThis as unknown as { matchMedia?: unknown }).matchMedia;
});

describe("CopyLinkButton", () => {
  it("is a link that opens the repository in a new tab, not a copy button", () => {
    render(<CopyLinkButton />);
    const a = screen.getByRole("link", { name: "Open the repo on GitHub" });
    expect(a.getAttribute("href")).toBe(CONNECTED_DECK_REPO_URL);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toContain("noopener");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens the url and carries the title a deck passes", () => {
    render(<CopyLinkButton url="https://example.com/repo" title="Open the example repo" />);
    const a = screen.getByRole("link", { name: "Open the example repo" });
    expect(a.getAttribute("href")).toBe("https://example.com/repo");
  });

  it("on a dark stage, draws the white mark", () => {
    expect(onStage({ backgroundColor: "#0b1316" }).dataset.contrast).toBe("dark");
  });

  it("on a light stage, draws the dark mark", () => {
    expect(onStage({ backgroundColor: "rgb(244, 242, 236)" }).dataset.contrast).toBe("light");
  });

  it("an explicit inverse puts the white mark on a light stage", () => {
    expect(onStage({ backgroundColor: "rgb(244, 242, 236)" }, true).dataset.contrast).toBe(
      "dark",
    );
  });

  it("an explicit inverse={false} keeps the dark mark on a dark stage", () => {
    expect(onStage({ backgroundColor: "#0b1316" }, false).dataset.contrast).toBe("light");
  });

  it("sits in a stage corner unless placed inline", () => {
    const { rerender } = render(<CopyLinkButton />);
    expect(screen.getByRole("link").style.position).toBe("absolute");
    rerender(<CopyLinkButton corner={null} />);
    expect(screen.getByRole("link").style.position).toBe("");
  });

  it("is touch-sized on a phone and 36px on desktop", () => {
    installMatchMedia(true);
    const { unmount } = render(
      <ViewportProvider>
        <CopyLinkButton />
      </ViewportProvider>,
    );
    expect(screen.getByRole("link").style.width).toBe("84px");
    unmount();
    installMatchMedia(false);
    render(
      <ViewportProvider>
        <CopyLinkButton />
      </ViewportProvider>,
    );
    expect(screen.getByRole("link").style.width).toBe("36px");
  });
});

describe("isDarkBehind", () => {
  function childOf(style: (el: HTMLDivElement) => void): HTMLElement {
    const ground = document.createElement("div");
    style(ground);
    const child = document.createElement("span");
    ground.appendChild(child);
    document.body.appendChild(ground);
    return child;
  }

  it("reads the first opaque background colour", () => {
    expect(isDarkBehind(childOf((el) => (el.style.backgroundColor = "#0b1316")))).toBe(true);
    expect(isDarkBehind(childOf((el) => (el.style.backgroundColor = "rgb(244, 242, 236)")))).toBe(
      false,
    );
  });

  it("looks past a translucent background to the ground under it", () => {
    const light = document.createElement("div");
    light.style.backgroundColor = "rgb(244, 242, 236)";
    const veil = document.createElement("div");
    veil.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
    const child = document.createElement("span");
    veil.appendChild(child);
    light.appendChild(veil);
    document.body.appendChild(light);
    expect(isDarkBehind(child)).toBe(false);
  });

  it("reads a gradient by the average of its stops", () => {
    // jsdom does not parse gradients into backgroundImage, so stand in for the
    // computed style the browser would report.
    const ground = document.createElement("div");
    const child = document.createElement("span");
    ground.appendChild(child);
    document.body.appendChild(ground);
    const real = window.getComputedStyle;
    const spy = jest.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
      const cs = real(el, pseudo);
      if (el !== ground) return cs;
      return {
        ...cs,
        backgroundColor: "rgba(0, 0, 0, 0)",
        backgroundImage: "linear-gradient(rgb(250, 248, 240), rgb(230, 226, 214))",
      } as CSSStyleDeclaration;
    });
    try {
      expect(isDarkBehind(child)).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("with nothing painted, reads as dark, the player's usual stage", () => {
    expect(isDarkBehind(childOf(() => {}))).toBe(true);
  });
});
