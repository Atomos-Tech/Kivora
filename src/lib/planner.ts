import { z } from "zod";

export type Task = { id: string; title: string; due: string; done: boolean; category: string };
export type BudgetItem = {
  id: string;
  title: string;
  category: string;
  planned: number;
  actual: number;
};
export type Guest = {
  id: string;
  name: string;
  email: string;
  group: string;
  rsvp: "Pending" | "Attending" | "Declined";
};
export type Vendor = {
  id: string;
  name: string;
  service: string;
  contact: string;
  quote: number;
  status: "Researching" | "Contacted" | "Shortlisted" | "Booked";
};
export type Note = { id: string; title: string; text: string; kind: string };
export type Member = { id: string; name: string; email: string; role: "Editor" | "Viewer" };
export type EventPlan = {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  guests: number;
  budget: number;
  currency: string;
  tasks: Task[];
  budgetItems: BudgetItem[];
  guestsList: Guest[];
  vendors: Vendor[];
  agenda: Task[];
  notes: Note[];
  members: Member[];
};
export type AppData = { name: string; events: EventPlan[]; preferences: Preferences };

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const emptyEvent = (input: {
  name: string;
  type: string;
  date: string;
  location: string;
  guests: number;
  budget: number;
  currency: string;
}): EventPlan => ({
  ...input,
  id: newId(),
  tasks: [],
  budgetItems: [],
  guestsList: [],
  vendors: [],
  agenda: [],
  notes: [],
  members: [],
});
export function formatMoney(value: number, currency: string, locale?: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value || 0);
}
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const eventDateValue = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? "" : value;
};
export const niceDate = (date: string, locale?: string) => {
  if (!eventDateValue(date)) return "Date to be decided";
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export type Preferences = {
  workspace: string;
  theme: "light" | "dark" | "system";
  accent: "plum" | "forest" | "ocean";
  density: "comfortable" | "compact";
  currency: string;
  locale: string;
  weekStart: "sunday" | "monday";
  showStats: boolean;
  showTemplates: boolean;
};
export const currencies = [
  "USD",
  "INR",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "CHF",
  "SGD",
  "AED",
  "BRL",
  "MXN",
  "ZAR",
  "NZD",
  "KRW",
  "SEK",
  "NOK",
  "DKK",
  "HKD",
  "SAR",
  "IDR",
  "THB",
  "NGN",
  "KES",
];
export const defaultPreferences: Preferences = {
  workspace: "Personal workspace",
  theme: "light",
  accent: "plum",
  density: "comfortable",
  currency: "USD",
  locale: "",
  weekStart: "monday",
  showStats: true,
  showTemplates: true,
};
export const emptyWorkspace: AppData = {
  name: "Planner",
  events: [],
  preferences: defaultPreferences,
};
const text = z.string().max(10000);
const id = z.string().min(1).max(200);
const amount = z.number().finite().nonnegative();
const date = z.string().refine((v) => v === "" || !!eventDateValue(v), "Invalid date");
const taskSchema = z.object({
  id,
  title: text,
  due: date,
  done: z.boolean(),
  category: text.default(""),
});
const currencySchema = z.string().refine(
  (v) =>
    /^[A-Z]{3}$/.test(v) &&
    (() => {
      try {
        new Intl.NumberFormat("en", { style: "currency", currency: v });
        return true;
      } catch {
        return false;
      }
    })(),
);
const eventSchema = z.object({
  id,
  name: text.min(1),
  type: text,
  date,
  location: text.default(""),
  guests: amount.int().default(0),
  budget: amount.default(0),
  currency: currencySchema,
  tasks: z.array(taskSchema).default([]),
  budgetItems: z
    .array(
      z.object({ id, title: text, category: text.default(""), planned: amount, actual: amount }),
    )
    .default([]),
  guestsList: z
    .array(
      z.object({
        id,
        name: text,
        email: text.default(""),
        group: text.default(""),
        rsvp: z.enum(["Pending", "Attending", "Declined"]),
      }),
    )
    .default([]),
  vendors: z
    .array(
      z.object({
        id,
        name: text,
        service: text.default(""),
        contact: text.default(""),
        quote: amount,
        status: z.enum(["Researching", "Contacted", "Shortlisted", "Booked"]),
      }),
    )
    .default([]),
  agenda: z
    .array(
      taskSchema.extend({
        due: z.string().refine((v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v)),
      }),
    )
    .default([]),
  notes: z.array(z.object({ id, title: text, text, kind: text.default("") })).default([]),
  members: z
    .array(
      z.object({ id, name: text, email: text.default(""), role: z.enum(["Editor", "Viewer"]) }),
    )
    .default([]),
});
const preferencesSchema = z.object({
  workspace: z.string().min(1).max(60).default(defaultPreferences.workspace),
  theme: z.enum(["light", "dark", "system"]).default("light"),
  accent: z.enum(["plum", "forest", "ocean"]).default("plum"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  currency: currencySchema.default("USD"),
  locale: z
    .string()
    .refine((v) => {
      try {
        if (v) new Intl.DateTimeFormat(v);
        return true;
      } catch {
        return false;
      }
    })
    .default(""),
  weekStart: z.enum(["sunday", "monday"]).default("monday"),
  showStats: z.boolean().default(true),
  showTemplates: z.boolean().default(true),
});
export function parseWorkspace(input: unknown): AppData {
  const result = z
    .object({
      name: z.string().max(60),
      events: z.array(eventSchema).max(1000),
      preferences: preferencesSchema.default(defaultPreferences),
    })
    .parse(input);
  const ids = new Set<string>();
  for (const event of result.events) {
    for (const record of [
      event,
      ...event.tasks,
      ...event.budgetItems,
      ...event.guestsList,
      ...event.vendors,
      ...event.agenda,
      ...event.notes,
      ...event.members,
    ]) {
      if (ids.has(record.id)) throw new Error("Duplicate record identifier");
      ids.add(record.id);
    }
  }
  return result;
}
export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const escapeICS = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
export function calendarExport(events: EventPlan[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kivora//Planner//EN",
    "CALSCALE:GREGORIAN",
  ];
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  for (const event of events) {
    const entries = [
      ...(event.date ? [{ id: event.id, title: event.name, date: event.date }] : []),
      ...event.tasks
        .filter((t) => !t.done && t.due)
        .map((t) => ({ id: t.id, title: `${t.title} · ${event.name}`, date: t.due })),
    ];
    for (const entry of entries) {
      const end = new Date(`${entry.date}T12:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${escapeICS(entry.id)}@kivora`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${entry.date.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
        `SUMMARY:${escapeICS(entry.title)}`,
        `LOCATION:${escapeICS(event.location)}`,
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  // Fold UTF-8 content at 75 octets, including the continuation space (RFC 5545).
  return (
    lines
      .map((line) => {
        let output = "",
          count = 0;
        for (const char of line) {
          const bytes = new TextEncoder().encode(char).length;
          if (count + bytes > 75) {
            output += "\r\n ";
            count = 1;
          }
          output += char;
          count += bytes;
        }
        return output;
      })
      .join("\r\n") + "\r\n"
  );
}
export function guestExport(event: EventPlan) {
  const cell = (value: string) =>
    `"${(/^[=+@\-\t\r\n]/.test(value.trimStart()) ? "'" : "") + value.replace(/"/g, '""')}"`;
  return (
    "\uFEFF" +
    [
      ["Name", "Email", "Group", "RSVP"],
      ...event.guestsList.map((g) => [g.name, g.email, g.group, g.rsvp]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
export const templates = [
  {
    id: "dinner",
    name: "A seat at the table",
    type: "Dinner party",
    tag: "GOOD FOOD, BETTER COMPANY",
    description: "An intimate dinner, thoughtfully put together.",
    guests: 12,
    className: "dinner",
    tasks: [
      "Choose a date and invite your people",
      "Plan a menu and check dietary needs",
      "Set the table and choose a playlist",
      "Shop for ingredients and drinks",
    ],
    categories: ["Food & drinks", "Table & flowers"],
  },
  {
    id: "birthday",
    name: "Another trip around the sun",
    type: "Birthday",
    tag: "MAKE THEIR DAY",
    description: "Big milestones. Little details. All the joy.",
    guests: 25,
    className: "birthday",
    tasks: [
      "Choose a theme and set your budget",
      "Book a venue or prepare your space",
      "Invite guests and track responses",
      "Order a cake and plan the surprises",
    ],
    categories: ["Venue", "Food & cake", "Decorations"],
  },
  {
    id: "wedding",
    name: "Your kind of forever",
    type: "Wedding",
    tag: "A DAY THAT FEELS LIKE YOU",
    description: "Bring the people and the plans together.",
    guests: 100,
    className: "wedding",
    tasks: [
      "Agree on a budget and guest count",
      "Research and shortlist venues",
      "Book key vendors and photography",
      "Send invitations and collect dietary needs",
      "Build your ceremony and reception run sheet",
    ],
    categories: ["Venue", "Catering", "Photography", "Flowers & styling"],
  },
  {
    id: "community",
    name: "Better, together",
    type: "Community gathering",
    tag: "BRING YOUR PEOPLE TOGETHER",
    description: "Meetups, reunions, and reasons to connect.",
    guests: 40,
    className: "community",
    tasks: [
      "Define the purpose and accessible venue needs",
      "Set a date and invite the community",
      "Plan activities and refreshments",
      "Confirm volunteer responsibilities",
    ],
    categories: ["Space", "Refreshments", "Activities"],
  },
];
export function eventFromTemplate(templateId: string, input: Parameters<typeof emptyEvent>[0]) {
  const event = emptyEvent(input);
  const template = templates.find((t) => t.id === templateId);
  if (!template) return event;
  event.tasks = template.tasks.map((title) => ({
    id: newId(),
    title,
    due: "",
    done: false,
    category: "Planning",
  }));
  event.budgetItems = template.categories.map((title) => ({
    id: newId(),
    title,
    category: title,
    planned: 0,
    actual: 0,
  }));
  return event;
}
