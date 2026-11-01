import { describe, expect, it } from "vitest";
import { saveEventRecord } from "@/lib/event-records";
import { submissionSchema, type RecordSubmission } from "@/lib/form-submission";
import { emptyEvent, parseWorkspace } from "@/lib/planner";

const baseEvent = () =>
  emptyEvent({
    name: "Gathering",
    type: "Dinner party",
    date: "2026-12-20",
    location: "Home",
    guests: 10,
    budget: 100,
    currency: "USD",
  });

describe("Typed form submissions", () => {
  it("rejects invalid amounts, dates, and incomplete records", () => {
    for (const input of [
      {
        kind: "event",
        values: {
          name: "",
          type: "Birthday",
          date: "2026-02-30",
          location: "",
          guests: -1,
          budget: 0,
          currency: "USD",
        },
      },
      {
        kind: "budget",
        values: { title: "Venue", category: "", planned: Number.POSITIVE_INFINITY, actual: 0 },
      },
      { kind: "agenda", values: { title: "Arrival", due: "25:70", category: "" } },
      { kind: "vendor", values: { name: "Flowers", service: "", contact: "", quote: 0 } },
    ])
      expect(submissionSchema.safeParse(input).success).toBe(false);
  });

  it("creates each local record with the fields required by workspace validation", () => {
    const submissions: RecordSubmission[] = [
      { kind: "task", values: { title: "Plan menu", due: "", category: "Food" } },
      { kind: "agenda", values: { title: "Guests arrive", due: "18:00", category: "Welcome" } },
      { kind: "budget", values: { title: "Food", category: "Catering", planned: 50, actual: 0 } },
      { kind: "guest", values: { name: "Alex", email: "", group: "Friends" } },
      { kind: "vendor", values: { name: "Florist", service: "Flowers", contact: "", quote: 30 } },
      { kind: "note", values: { title: "Colors", kind: "Mood", text: "Warm tones" } },
      { kind: "member", values: { name: "Sam", role: "Viewer", email: "" } },
    ];
    const event = submissions.reduce(
      (current, submission) => saveEventRecord(current, submission),
      baseEvent(),
    );
    expect(() => parseWorkspace({ name: "Planner", events: [event] })).not.toThrow();
    expect(event.tasks[0]).toMatchObject({ title: "Plan menu", done: false });
    expect(event.guestsList[0]).toMatchObject({ name: "Alex", rsvp: "Pending" });
    expect(event.vendors[0]).toMatchObject({ name: "Florist", status: "Researching" });
  });

  it("preserves task completion when editing task details", () => {
    const event = baseEvent();
    event.tasks = [{ id: "task-1", title: "Old", due: "", category: "", done: true }];
    const updated = saveEventRecord(
      event,
      { kind: "task", values: { title: "New", due: "2026-12-01", category: "Food" } },
      "task-1",
    );
    expect(updated.tasks).toEqual([
      { id: "task-1", title: "New", due: "2026-12-01", category: "Food", done: true },
    ]);
  });
});
