import { describe, expect, it } from "vitest";
import {
  calendarExport,
  defaultPreferences,
  emptyEvent,
  eventFromTemplate,
  formatMoney,
  guestExport,
  localDate,
  parseWorkspace,
} from "@/lib/planner";
const input = {
  name: "Garden dinner",
  type: "Dinner party",
  date: "2026-12-31",
  location: "Home",
  guests: 12,
  budget: 150,
  currency: "USD",
};
describe("Private workspace data", () => {
  it("migrates an existing workspace without losing records", () => {
    const event = emptyEvent(input);
    const restored = parseWorkspace({ name: "Ari", events: [event] });
    expect(restored.events).toEqual([event]);
    expect(restored.preferences).toEqual(defaultPreferences);
  });
  it("rejects invalid imports, duplicate IDs, impossible dates and unsafe amounts", () => {
    const event = emptyEvent(input);
    for (const events of [
      [{ ...event, tasks: "bad" }],
      [{ ...event, budget: -1 }],
      [{ ...event, date: "2026-02-30" }],
      [{ ...event, currency: "invalid" }],
      [event, event],
    ]) {
      expect(() => parseWorkspace({ name: "Planner", events })).toThrow();
    }
  });
  it("accepts missing optional fields from old records", () => {
    const event = emptyEvent(input);
    expect(
      parseWorkspace({
        name: "Ari",
        events: [{ ...event, guestsList: [{ id: "guest-1", name: "Alex", rsvp: "Pending" }] }],
      }).events[0]?.guestsList[0],
    ).toMatchObject({ email: "", group: "" });
  });
  it("creates independent editable template records without inventing prices or dates", () => {
    const one = eventFromTemplate("dinner", input),
      two = eventFromTemplate("dinner", input);
    expect(one.tasks).toHaveLength(4);
    expect(one.tasks.every((t) => !t.done && !t.due)).toBe(true);
    expect(one.budgetItems.every((b) => b.planned === 0 && b.actual === 0)).toBe(true);
    expect(one.tasks[0]?.id).not.toBe(two.tasks[0]?.id);
    expect(parseWorkspace({ name: "Planner", events: [one, two] }).events).toHaveLength(2);
  });
  it("formats money with currency precision and the selected locale", () => {
    expect(formatMoney(12.5, "USD", "en-US")).toBe("$12.50");
    expect(formatMoney(1250, "JPY", "en-US")).toBe("¥1,250");
    expect(formatMoney(12.5, "EUR", "de-DE")).toContain("12,50");
    expect(localDate(new Date(2026, 0, 2, 0, 1))).toBe("2026-01-02");
  });
});
describe("Portable exports", () => {
  it("exports escaped all-day calendar entries with exclusive end dates and open tasks", () => {
    const event = emptyEvent({ ...input, name: "Dinner, friends; family\nCelebrate" });
    event.tasks = [
      { id: "task-1", title: "Prepare", due: "2026-12-30", category: "Planning", done: false },
      { id: "task-2", title: "Done", due: "2026-12-30", category: "Planning", done: true },
    ];
    const output = calendarExport([event]);
    expect(output).toContain("DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101");
    expect(output).toContain("Dinner\\, friends\\; family\\nCelebrate");
    expect(output.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
  it("folds long Unicode calendar lines within the byte limit", () => {
    const output = calendarExport([emptyEvent({ ...input, name: "🎉".repeat(100) })]);
    expect(output.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(
      true,
    );
    expect(output.replace(/\r\n /g, "")).toContain("SUMMARY:" + "🎉".repeat(100));
  });
  it("quotes guest CSV and neutralizes spreadsheet formulas", () => {
    const event = emptyEvent(input);
    event.guestsList = [
      { id: "g1", name: '=HYPERLINK("bad")', email: "", group: "Friends, family", rsvp: "Pending" },
    ];
    expect(guestExport(event)).toContain('"\'=HYPERLINK(""bad"")"');
    expect(guestExport(event)).toContain('"Friends, family"');
  });
});
