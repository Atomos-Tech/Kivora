import { Check, Sparkles, X } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type EventPlan, currencies, templates } from "@/lib/planner";

export function AppLoading() {
  return (
    <main className="entry-screen" aria-label="Opening Kivora">
      <div className="entry-brand">
        <span className="brand-mark">k</span>
        <span>kivora</span>
      </div>
      <h1>
        Make room for the moment<span className="period">.</span>
      </h1>
      <p>Your celebrations, beautifully considered.</p>
    </main>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="modal" showCloseButton={false}>
        <div className="modal-heading">
          <div>
            <div className="eyebrow small-eyebrow">A SMALL STEP FORWARD</div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Manage your Kivora planning workspace.
            </DialogDescription>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function CreateForm({
  type,
  currency,
  initialEvent,
  templateId = "",
  initialValues,
  onCancel,
  onSubmit,
}: {
  type:
    "event" | "editEvent" | "task" | "budget" | "guest" | "vendor" | "note" | "member" | "agenda";
  currency: string;
  initialEvent?: EventPlan | undefined;
  templateId?: string;
  initialValues?: Record<string, string> | undefined;
  onCancel: () => void;
  onSubmit: (value: Record<string, string | number>) => void;
}) {
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const [form, setForm] = useState<Record<string, string>>({
    type: selectedTemplate?.type || "Birthday",
    ...(selectedTemplate
      ? { name: selectedTemplate.name, guests: String(selectedTemplate.guests) }
      : {}),
    currency,
    category: "Planning",
    rsvp: "Pending",
    status: "Researching",
    role: "Editor",
    kind: "Mood",
    due: "",
    name: selectedTemplate?.name || "",
    title: "",
    location: "",
    email: "",
    group: "",
    service: "",
    contact: "",
    text: "",
    actual: "0",
    planned: "0",
    quote: "0",
    ...(initialEvent
      ? {
          name: initialEvent.name,
          type: initialEvent.type,
          date: initialEvent.date,
          location: initialEvent.location,
          guests: String(initialEvent.guests),
          budget: String(initialEvent.budget),
          currency: initialEvent.currency,
        }
      : {}),
    ...initialValues,
  });
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Read submitted controls too: browser autofill and native date pickers can
    // update the DOM before React receives a change event.
    const submitted = { ...form, ...Object.fromEntries(new FormData(e.currentTarget).entries()) };
    const numberKeys = ["guests", "budget", "planned", "actual", "quote"];
    const normalized: Record<string, string | number> = Object.fromEntries(
      Object.entries(submitted).map(([key, value]) => [key, String(value).trim()]),
    );
    if (
      (type === "event" ||
        type === "editEvent" ||
        type === "guest" ||
        type === "vendor" ||
        type === "member") &&
      !String(normalized["name"] || "").trim()
    )
      return;
    if (
      ["task", "agenda", "note", "budget"].includes(type) &&
      !String(normalized["title"] || "").trim()
    )
      return;
    numberKeys.forEach((key) => {
      if (key in normalized) normalized[key] = Number(normalized[key]) || 0;
    });
    if (type === "event" || type === "editEvent") {
      normalized["guests"] = Number(submitted["guests"]) || 0;
      normalized["budget"] = Number(submitted["budget"]) || 0;
    }
    if (type === "budget") normalized["actual"] = Number(submitted["actual"]) || 0;
    delete normalized["id"];
    delete normalized["done"];
    onSubmit(normalized);
  };
  const input = (
    key: string,
    label: string,
    options: {
      type?: string;
      required?: boolean;
      placeholder?: string;
      min?: string;
      max?: string;
    } = {},
  ) => (
    <label className="field-label" key={key}>
      {label}
      <input
        name={key}
        type={options.type || "text"}
        onInput={(e) => set(key, e.currentTarget.value)}
        pattern={
          options.required && (!options.type || options.type === "text") ? ".*\\S.*" : undefined
        }
        step={options.type === "number" ? (key === "guests" ? "1" : "any") : undefined}
        maxLength={options.type === "text" || !options.type ? 500 : undefined}
        value={form[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        placeholder={options.placeholder}
        required={options.required}
        min={options.min}
        max={options.max}
      />
    </label>
  );
  const select = (key: string, label: string, choices: string[]) => (
    <label className="field-label" key={key}>
      {label}
      <select name={key} value={form[key] || choices[0]} onChange={(e) => set(key, e.target.value)}>
        {choices.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
  let fields: ReactNode;
  if (type === "event" || type === "editEvent")
    fields = (
      <>
        {selectedTemplate && (
          <div className="template-form-note">
            <Sparkles size={18} />
            <span>
              Includes {selectedTemplate.tasks.length} editable tasks and{" "}
              {selectedTemplate.categories.length} budget categories. Add your details to make it
              yours.
            </span>
          </div>
        )}
        <div className="form-grid">
          {input("name", "Event name", { required: true, placeholder: "Sam’s 30th birthday" })}
          {select("type", "What are we celebrating?", [
            "Birthday",
            "Dinner party",
            "Wedding",
            "Workshop",
            "Corporate event",
            "Anniversary",
            "Community gathering",
            "Family celebration",
            "Other",
          ])}
        </div>
        <div className="form-grid">
          {input("date", "Date (optional)", { type: "date" })}
          {input("location", "Location", { placeholder: "City, venue, or still deciding" })}
        </div>
        <div className="form-grid">
          {input("guests", "Estimated guest count", { type: "number", min: "0" })}
          {input("budget", "Total event budget", { type: "number", min: "0" })}
          {select("currency", "Currency", currencies)}
        </div>
      </>
    );
  else if (type === "task" || type === "agenda")
    fields = (
      <>
        <div className="form-grid">
          {input("title", type === "task" ? "What needs doing?" : "What happens?", {
            required: true,
            placeholder: type === "task" ? "Book a venue visit" : "Guest arrival",
          })}
          {input("due", type === "task" ? "Due date" : "Time", {
            type: type === "task" ? "date" : "time",
          })}
        </div>
        {input("category", type === "task" ? "Category" : "Who or what is involved?", {
          placeholder: type === "task" ? "Venue" : "Welcome table, family",
        })}
      </>
    );
  else if (type === "budget")
    fields = (
      <>
        <div className="form-grid">
          {input("title", "Budget item", { required: true, placeholder: "Dinner catering" })}
          {input("category", "Category", { placeholder: "Food & drink" })}
        </div>
        <div className="form-grid">
          {input("planned", `Planned (${currency})`, { type: "number", min: "0" })}
          {input("actual", `Actual (${currency})`, { type: "number", min: "0" })}
        </div>
      </>
    );
  else if (type === "guest")
    fields = (
      <>
        <div className="form-grid">
          {input("name", "Guest name", { required: true })}
          {input("email", "Email (optional)", { type: "email" })}
        </div>
        {input("group", "Group or household", { placeholder: "Family, friends, colleagues…" })}
      </>
    );
  else if (type === "vendor")
    fields = (
      <>
        <div className="form-grid">
          {input("name", "Vendor name", { required: true })}
          {input("service", "Service", { required: true, placeholder: "Photographer, florist…" })}
        </div>
        <div className="form-grid">
          {input("contact", "Contact details", { placeholder: "Email or phone" })}
          {input("quote", `Quote (${currency})`, { type: "number", min: "0" })}
        </div>
      </>
    );
  else if (type === "note")
    fields = (
      <>
        <div className="form-grid">
          {input("title", "Give this idea a name", {
            required: true,
            placeholder: "An evening under the lights",
          })}
          {select("kind", "What is it?", ["Mood", "Color", "Detail", "Link note", "Other"])}
        </div>
        <label className="field-label">
          The details
          <textarea
            name="text"
            rows={4}
            required
            value={form["text"] || ""}
            onChange={(e) => set("text", e.target.value)}
            placeholder="What should you remember about this idea?"
          />
        </label>
      </>
    );
  else
    fields = (
      <>
        <div className="form-grid">
          {input("name", "Name", { required: true })}
          {select("role", "Planning role", ["Editor", "Viewer"])}
        </div>
        {input("email", "Email address", { type: "email", placeholder: "Email address" })}
        <p className="fine-print">
          Invitations are not available in this screen. Adding an email here would not grant access.
        </p>
      </>
    );
  return (
    <form className="create-form" onSubmit={handle}>
      {fields}
      <div className="modal-actions">
        <button type="button" className="button button-light" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-dark">
          <Check size={15} />
          {type === "editEvent" ? "Save changes" : type === "event" ? "Create event" : "Save"}
        </button>
      </div>
    </form>
  );
}
