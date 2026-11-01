import { z } from "zod";
import { eventDateValue } from "@/lib/planner";

const text = z.string().trim().max(10000);
const requiredText = text.min(1);
const amount = z.number().finite().nonnegative();
const date = z.string().refine((value) => !value || !!eventDateValue(value));
const event = z.object({
  name: requiredText,
  type: requiredText,
  date,
  location: text,
  guests: amount.int(),
  budget: amount,
  currency: z.string().regex(/^[A-Z]{3}$/),
});
const task = z.object({ title: requiredText, due: date, category: text });
const agenda = z.object({
  title: requiredText,
  due: z.string().refine((value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value)),
  category: text,
});
const budget = z.object({ title: requiredText, category: text, planned: amount, actual: amount });
const guest = z.object({ name: requiredText, email: text, group: text });
const vendor = z.object({
  name: requiredText,
  service: requiredText,
  contact: text,
  quote: amount,
});
const note = z.object({ title: requiredText, kind: text, text: requiredText });
const member = z.object({ name: requiredText, role: z.enum(["Editor", "Viewer"]), email: text });

export const submissionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("event"), values: event }),
  z.object({ kind: z.literal("editEvent"), values: event }),
  z.object({ kind: z.literal("task"), values: task }),
  z.object({ kind: z.literal("agenda"), values: agenda }),
  z.object({ kind: z.literal("budget"), values: budget }),
  z.object({ kind: z.literal("guest"), values: guest }),
  z.object({ kind: z.literal("vendor"), values: vendor }),
  z.object({ kind: z.literal("note"), values: note }),
  z.object({ kind: z.literal("member"), values: member }),
]);
export type FormSubmission = z.infer<typeof submissionSchema>;
export type FormKind = FormSubmission["kind"];
export type RecordSubmission = Exclude<FormSubmission, { kind: "event" | "editEvent" }>;
