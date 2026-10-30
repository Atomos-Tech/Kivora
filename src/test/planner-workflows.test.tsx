import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Kivora } from "@/components/planner/app";
import { defaultPreferences, emptyEvent, eventFromTemplate, parseWorkspace } from "@/lib/planner";
const key = "kivora.local.v1";
const input = {
  name: "Dinner with friends",
  type: "Dinner party",
  date: "2026-12-20",
  location: "Home",
  guests: 8,
  budget: 200,
  currency: "USD",
};
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const saved = () => JSON.parse(localStorage.getItem(key)!);
const seed = () => {
  const event = eventFromTemplate("dinner", input);
  localStorage.setItem(
    key,
    JSON.stringify({ name: "Ari", events: [event], preferences: defaultPreferences }),
  );
  return event;
};
describe("Planner workflows", () => {
  it("starts with a private empty workspace without sign-in", async () => {
    render(<Kivora />);
    expect(await screen.findByText("Every good plan starts somewhere.")).toBeInTheDocument();
    expect(saved().events).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText("Personal by default.")).toBeInTheDocument();
  });
  it("creates a template event and round-trips optional fields safely", async () => {
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: /GOOD FOOD, BETTER COMPANY/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Event name"), {
      target: { value: "My dinner" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create event" }));
    expect(saved().events[0].name).toBe("My dinner");
    expect(saved().events[0].tasks).toHaveLength(4);
    expect(() => parseWorkspace(saved())).not.toThrow();
    fireEvent.click(screen.getByRole("button", { name: "Guests" }));
    fireEvent.click(screen.getByRole("button", { name: "Add guest" }));
    fireEvent.change(screen.getByLabelText("Guest name"), { target: { value: "Alex" } });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(() => parseWorkspace(saved())).not.toThrow();
  });
  it("completes dashboard tasks across different events", async () => {
    const a = seed(),
      b = eventFromTemplate("birthday", { ...input, name: "Birthday", currency: "EUR" });
    b.tasks = [
      {
        id: "other-task",
        title: "Order the cake",
        due: "2020-01-01",
        done: false,
        category: "Food",
      },
    ];
    localStorage.setItem(
      key,
      JSON.stringify({ name: "Ari", events: [a, b], preferences: defaultPreferences }),
    );
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: "Complete Order the cake" }));
    expect(saved().events[1].tasks[0].done).toBe(true);
    expect(saved().events[0].tasks.every((t: { done: boolean }) => !t.done)).toBe(true);
    expect(screen.getByText(/other currencies kept separate/)).toBeInTheDocument();
  });
  it("restores event deep links, edits a task, and opens search results", async () => {
    const event = seed();
    window.history.replaceState(
      null,
      "",
      `/?view=My+Events&event=${event.id}&section=Timeline+%26+tasks`,
    );
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: `Edit ${event.tasks[0]!.title}` }));
    fireEvent.change(screen.getByLabelText("What needs doing?"), {
      target: { value: "Confirm the menu" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(saved().events[0].tasks[0].title).toBe("Confirm the menu");
    expect(saved().events[0].tasks[0].done).toBe(false);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.change(screen.getByLabelText("Search workspace records"), {
      target: { value: "Confirm the menu" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /Confirm the menu/ }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Confirm the menu")).toBeInTheDocument();
  });
  it("adds a copilot suggestion to its selected event even without an active event", async () => {
    const event = seed();
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: "Planning Copilot" }));
    fireEvent.change(screen.getByLabelText("Choose an event"), { target: { value: event.id } });
    fireEvent.click(screen.getByRole("button", { name: /Add Clarify the purpose/ }));
    expect(
      saved().events[0].tasks.some((t: { title: string }) =>
        t.title.includes("Clarify the purpose"),
      ),
    ).toBe(true);
    expect(screen.getByRole("button", { name: /Add Clarify the purpose/ })).toBeDisabled();
  });
  it("persists personalization and applies it after reload", async () => {
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    fireEvent.click(screen.getByRole("button", { name: "Ocean" }));
    fireEvent.change(screen.getByLabelText("Default event currency"), { target: { value: "JPY" } });
    expect(saved().preferences).toMatchObject({ theme: "dark", accent: "ocean", currency: "JPY" });
    cleanup();
    render(<Kivora />);
    await waitFor(() => expect(document.documentElement.dataset["theme"]).toBe("dark"));
    expect(screen.getByRole("button", { name: "Ocean" })).toHaveAttribute("aria-pressed", "true");
  });
  it("preserves unreadable stored data rather than overwriting it", async () => {
    localStorage.setItem(key, '{"events":"broken"}');
    render(<Kivora />);
    expect(await screen.findByRole("alert")).toHaveTextContent("has not been overwritten");
    expect(localStorage.getItem(key)).toBe('{"events":"broken"}');
  });
  it("warns when another tab changed storage instead of replacing its data", async () => {
    seed();
    render(<Kivora />);
    await screen.findByRole("button", { name: "Settings" });
    const other = JSON.stringify({
      name: "Other tab",
      events: [],
      preferences: defaultPreferences,
    });
    localStorage.setItem(key, other);
    fireEvent.click(
      screen.getByRole("button", { name: "Complete Choose a date and invite your people" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("another tab");
    expect(localStorage.getItem(key)).toBe(other);
  });
  it("restores a removed task with undo", async () => {
    const event = seed();
    window.history.replaceState(
      null,
      "",
      `/?view=My+Events&event=${event.id}&section=Timeline+%26+tasks`,
    );
    render(<Kivora />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Remove item" }))[0]!);
    expect(saved().events[0].tasks).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(saved().events[0].tasks).toHaveLength(4);
  });
});

describe("Backup recovery", () => {
  it("validates and confirms a backup before replacing the workspace", async () => {
    seed();
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: "Settings" }));
    const backup = {
      name: "Restored planner",
      events: [emptyEvent({ ...input, name: "Restored event" })],
      preferences: defaultPreferences,
    };
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(JSON.stringify(backup)) });
    fireEvent.change(screen.getByLabelText("Restore workspace backup"), {
      target: { files: [file] },
    });
    await screen.findByRole("dialog", { name: "Restore this workspace?" });
    expect(saved().name).toBe("Ari");
    fireEvent.click(screen.getByRole("button", { name: "Restore workspace" }));
    expect(saved().name).toBe("Restored planner");
    expect(saved().events[0].name).toBe("Restored event");
  });
  it("leaves existing data untouched after an invalid import", async () => {
    seed();
    render(<Kivora />);
    fireEvent.click(await screen.findByRole("button", { name: "Settings" }));
    const before = localStorage.getItem(key);
    const file = new File(["bad"], "backup.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve("bad") });
    fireEvent.change(screen.getByLabelText("Restore workspace backup"), {
      target: { files: [file] },
    });
    expect(await screen.findByRole("status")).toHaveTextContent("invalid");
    expect(localStorage.getItem(key)).toBe(before);
  });
});
