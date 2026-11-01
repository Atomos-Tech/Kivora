import { type EventPlan, newId } from "@/lib/planner";

/** Copy reusable planning structure without carrying guest or contact details forward. */
export function duplicateEvent(event: EventPlan): EventPlan {
  const copy = structuredClone(event);
  copy.id = newId();
  copy.name = `${copy.name} (copy)`;
  copy.date = "";
  copy.tasks = copy.tasks.map((task) => ({ ...task, id: newId(), done: false, due: "" }));
  copy.budgetItems = copy.budgetItems.map((item) => ({ ...item, id: newId(), actual: 0 }));
  copy.guestsList = [];
  copy.members = [];
  copy.vendors = copy.vendors.map((vendor) => ({
    ...vendor,
    id: newId(),
    contact: "",
    status: "Researching",
  }));
  copy.agenda = copy.agenda.map((item) => ({ ...item, id: newId(), done: false }));
  copy.notes = copy.notes.map((note) => ({ ...note, id: newId() }));
  return copy;
}
