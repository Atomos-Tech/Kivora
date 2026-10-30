import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Kivora } from "@/components/planner/app";
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  document.documentElement.lang = "en";
  document.title = "Kivora";
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const check = async () => {
  // jsdom has no layout engine; contrast is reviewed in the actual browser.
  const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual(
    [],
  );
};
it("has accessible dashboard landmarks and controls", async () => {
  render(<Kivora />);
  await screen.findByText("Every good plan starts somewhere.");
  await check();
});
it("gives the creation dialog an accessible name and labeled controls", async () => {
  render(<Kivora />);
  fireEvent.click(await screen.findByRole("button", { name: "Plan an event" }));
  await screen.findByRole("dialog", { name: "A reason to gather" });
  await check();
});
it("keeps settings and privacy controls accessible", async () => {
  render(<Kivora />);
  fireEvent.click(await screen.findByRole("button", { name: "Settings" }));
  await check();
});
