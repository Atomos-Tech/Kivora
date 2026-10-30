export type View =
  | "Dashboard"
  | "My Events"
  | "Templates"
  | "Calendar"
  | "Planning Copilot"
  | "Inspiration Studio"
  | "Notifications"
  | "Settings";
export type Section =
  | "Overview"
  | "Timeline & tasks"
  | "Budget"
  | "Guests"
  | "Vendors"
  | "Run sheet"
  | "Inspiration"
  | "Collaborators";

export const sections: Section[] = [
  "Overview",
  "Timeline & tasks",
  "Budget",
  "Guests",
  "Vendors",
  "Run sheet",
  "Inspiration",
  "Collaborators",
];
export type Collection =
  "tasks" | "budgetItems" | "guestsList" | "vendors" | "agenda" | "notes" | "members";

export function modalTitle(type: string) {
  return (
    (
      {
        event: "A reason to gather",
        editEvent: "Event details",
        task: "Add a task",
        budget: "Add a budget item",
        guest: "Add someone to the list",
        vendor: "Add a vendor",
        note: "Save an idea",
        member: "Add a collaborator",
        agenda: "Add a moment to the day",
      } as Record<string, string>
    )[type] || "Add details"
  );
}
