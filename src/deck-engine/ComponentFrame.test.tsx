import { render, screen } from "@testing-library/react";
import { ComponentFrame } from "./ComponentFrame";
import { ArtScaleContext } from "./artScale";
import { TOUCH_TARGET } from "./viewerBarLayout";
import { ViewportProvider } from "../viewport";

// The framed component's zoom control. On a phone the slide's art is drawn
// scaled into the band, so the control draws itself back at native size, and
// its buttons are the bar's touch target. On desktop nothing changes.

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

function mount(scale: number, props: { inverse?: boolean; transparent?: boolean } = {}) {
  const { container } = render(
    <ViewportProvider>
      <ArtScaleContext.Provider value={scale}>
        <ComponentFrame {...props}>
          <div>component</div>
        </ComponentFrame>
      </ArtScaleContext.Provider>
    </ViewportProvider>,
  );
  return {
    frame: container.firstElementChild as HTMLElement,
    zoomOut: screen.getByTitle("Zoom out") as HTMLButtonElement,
    label: screen.getByTitle("Reset zoom") as HTMLButtonElement,
    wrapper: document.querySelector<HTMLElement>("[data-native-size]"),
    backing: document.querySelector<HTMLElement>("[data-zoom-backing]"),
  };
}

it("on a phone, in art drawn at half size: touch-sized buttons, drawn back at native size from the corner", () => {
  installMatchMedia(true);
  const { zoomOut, label, wrapper, backing } = mount(0.5);
  expect(zoomOut.style.width).toBe(`${TOUCH_TARGET}px`);
  expect(zoomOut.style.height).toBe(`${TOUCH_TARGET}px`);
  expect(label.style.fontSize).toBe("0.9rem");
  expect(wrapper?.style.transform).toBe("scale(2)");
  expect(wrapper?.style.transformOrigin).toBe("top right");
  // The dark pill, drawn inside the native-size box so it keeps its size too.
  expect(backing).not.toBeNull();
  expect(wrapper?.contains(backing)).toBe(true);
  expect(backing?.style.backgroundColor).toBe("rgba(13, 14, 24, 0.88)");
});

it("on desktop, in unscaled art: the control is exactly as it was", () => {
  installMatchMedia(false);
  const { frame, zoomOut, label, wrapper, backing } = mount(1);
  expect(zoomOut.style.width).toBe("");
  expect(label.style.fontSize).toBe("");
  expect(wrapper).toBeNull();
  expect(backing).toBeNull();
  // The stage and its grid, as before.
  expect(frame.style.backgroundColor).toBe("rgb(13, 14, 24)");
  expect(frame.children).toHaveLength(3);
});

it("on desktop, inverse: the dark pill, at the control's desktop size", () => {
  installMatchMedia(false);
  const { zoomOut, backing } = mount(1, { inverse: true });
  expect(backing?.style.backgroundColor).toBe("rgba(13, 14, 24, 0.88)");
  expect(zoomOut.style.width).toBe("");
});

it("transparent: no stage colour and no grid, so the art underneath shows", () => {
  installMatchMedia(false);
  const { frame } = mount(1, { transparent: true });
  expect(frame.style.backgroundColor).toBe("transparent");
  // The content and the zoom control only: the grid layer is gone.
  expect(frame.children).toHaveLength(2);
});
