import { type EventPlan, newId } from "@/lib/planner";
import { type RecordSubmission } from "@/lib/form-submission";

function upsert<T extends { id: string }>(
  items: T[],
  created: T,
  patch: Partial<T>,
  editingId?: string,
) {
  return editingId
    ? items.map((item) => (item.id === editingId ? { ...item, ...patch } : item))
    : [...items, created];
}

export function saveEventRecord(
  event: EventPlan,
  submission: RecordSubmission,
  editingId?: string,
): EventPlan {
  const id = editingId ?? newId();
  switch (submission.kind) {
    case "task":
      return {
        ...event,
        tasks: upsert(
          event.tasks,
          { id, ...submission.values, done: false },
          submission.values,
          editingId,
        ),
      };
    case "agenda":
      return {
        ...event,
        agenda: upsert(
          event.agenda,
          { id, ...submission.values, done: false },
          submission.values,
          editingId,
        ),
      };
    case "budget":
      return {
        ...event,
        budgetItems: upsert(
          event.budgetItems,
          { id, ...submission.values },
          submission.values,
          editingId,
        ),
      };
    case "guest":
      return {
        ...event,
        guestsList: upsert(
          event.guestsList,
          { id, ...submission.values, rsvp: "Pending" },
          submission.values,
          editingId,
        ),
      };
    case "vendor":
      return {
        ...event,
        vendors: upsert(
          event.vendors,
          { id, ...submission.values, status: "Researching" },
          submission.values,
          editingId,
        ),
      };
    case "note":
      return {
        ...event,
        notes: upsert(event.notes, { id, ...submission.values }, submission.values, editingId),
      };
    case "member":
      return {
        ...event,
        members: upsert(event.members, { id, ...submission.values }, submission.values, editingId),
      };
  }
}
