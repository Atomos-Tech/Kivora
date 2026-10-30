import { usePlannerFormatting } from "@/hooks/use-planner-formatting";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { type EventPlan, type Guest, type Vendor, localDate } from "@/lib/planner";

import { type Collection, type Section, sections } from "@/lib/planner-navigation";
export function EventView({
  event,
  section,
  setSection,
  money,
  onModal,
  onToggle,
  onRemove,
  onEdit,
  onEventPatch,
  onToast,
  onCopilot,
  query,
}: {
  event: EventPlan;
  section: Section;
  setSection: (s: Section) => void;
  money: string;
  onModal: (
    m: "editEvent" | "task" | "budget" | "guest" | "vendor" | "note" | "member" | "agenda",
  ) => void;
  onToggle: (id: string) => void;
  onRemove: (
    key: "tasks" | "budgetItems" | "guestsList" | "vendors" | "agenda" | "notes" | "members",
    id: string,
  ) => void;
  onEdit: (key: Collection, id: string) => void;
  onEventPatch: (fn: (event: EventPlan) => EventPlan) => void;
  onToast: (s: string) => void;
  onCopilot: () => void;
  query: string;
}) {
  const { formatMoney, niceDate } = usePlannerFormatting();
  const [taskFilter, setTaskFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState(query);
  const [guestSearch, setGuestSearch] = useState("");
  const tasks = event.tasks
    .filter(
      (t) =>
        `${t.title} ${t.category}`.toLowerCase().includes(taskSearch.toLowerCase()) &&
        (taskFilter === "all" ||
          (taskFilter === "done"
            ? t.done
            : taskFilter === "overdue"
              ? !t.done && t.due && t.due < localDate()
              : !t.done)),
    )
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  const completed = event.tasks.filter((t) => t.done).length;
  const totalPlanned = event.budgetItems.reduce((s, x) => s + x.planned, 0);
  const totalActual = event.budgetItems.reduce((s, x) => s + x.actual, 0);
  const rsvp = event.guestsList.filter((g) => g.rsvp === "Attending").length;
  const nextTask = [...event.tasks]
    .filter((t) => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const changeRsvp = (id: string, rsvpStatus: Guest["rsvp"]) =>
    onEventPatch((e) => ({
      ...e,
      guestsList: e.guestsList.map((g) => (g.id === id ? { ...g, rsvp: rsvpStatus } : g)),
    }));
  const changeVendor = (id: string, status: Vendor["status"]) =>
    onEventPatch((e) => ({
      ...e,
      vendors: e.vendors.map((v) => (v.id === id ? { ...v, status } : v)),
    }));
  const renderRows = <T extends { id: string; title?: string }>(
    items: T[],
    key: "tasks" | "budgetItems" | "guestsList" | "vendors" | "agenda" | "notes" | "members",
    empty: string,
    row: (item: T) => ReactNode,
  ) =>
    items.length ? (
      <div className="list-rows">
        {items.map((item) => (
          <div className="list-row" key={item.id}>
            {row(item)}
            <button
              className="icon-button"
              aria-label={`Edit ${item.title || "item"}`}
              onClick={() => onEdit(key, item.id)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="delete-button"
              aria-label="Remove item"
              onClick={() => onRemove(key, item.id)}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="inline-empty">
        <span className="empty-mark">✳</span>
        <span>{empty}</span>
      </div>
    );
  return (
    <>
      <div className="event-hero">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            {event.type.toUpperCase()} · {niceDate(event.date).toUpperCase()}
          </div>
          <h1>
            {event.name}
            <span className="period">.</span>
          </h1>
          <p className="lead">
            {event.location || "The details are still taking shape."}
            {event.guests ? ` · ${event.guests} expected` : ""}
          </p>
        </div>
        <div className="event-actions">
          <button className="button button-light" onClick={() => onModal("editEvent")}>
            Edit details
          </button>
          <button className="button button-dark" onClick={onCopilot}>
            <Sparkles size={16} />
            Planning Copilot
          </button>
        </div>
      </div>
      <nav className="event-tabs" aria-label="Event sections">
        {sections.map((s) => (
          <button
            key={s}
            aria-current={section === s ? "page" : undefined}
            className={section === s ? "selected" : ""}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
      </nav>
      {section === "Overview" && (
        <div className="event-overview">
          <div className="event-summary-grid">
            <div className="summary-card">
              <span className="stat-label">PLANNING PROGRESS</span>
              <b>
                {event.tasks.length ? Math.round((completed / event.tasks.length) * 100) : 0}
                <small>%</small>
              </b>
              <div className="progress-line">
                <i
                  style={{
                    width: `${event.tasks.length ? (completed / event.tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="stat-helper">
                {completed} of {event.tasks.length} tasks complete
              </span>
            </div>
            <div className="summary-card">
              <span className="stat-label">BUDGET COMMITTED</span>
              <b>{formatMoney(totalPlanned, money)}</b>
              <span className="stat-helper">{formatMoney(totalActual, money)} actual spend</span>
            </div>
            <div className="summary-card">
              <span className="stat-label">GUESTS ATTENDING</span>
              <b>
                {rsvp}
                <small> / {event.guestsList.length}</small>
              </b>
              <span className="stat-helper">
                {event.guestsList.filter((g) => g.rsvp === "Pending").length} awaiting response
              </span>
            </div>
          </div>
          <div className="overview-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow small-eyebrow">THE NEXT THING</div>
                  <h2>On your mind</h2>
                </div>
                <button className="text-button" onClick={() => setSection("Timeline & tasks")}>
                  All tasks <ArrowRight size={14} />
                </button>
              </div>
              {nextTask ? (
                <div className="focus-task">
                  <span className="focus-icon">
                    <ClipboardList size={18} />
                  </span>
                  <div>
                    <b>{nextTask.title}</b>
                    <span>
                      {nextTask.category || "Planning"} ·{" "}
                      {nextTask.due ? niceDate(nextTask.due) : "No due date"}
                    </span>
                  </div>
                  <button className="button button-light" onClick={() => onToggle(nextTask.id)}>
                    Mark done
                  </button>
                </div>
              ) : (
                <div className="inline-empty">
                  No open tasks. Add a task or ask the Copilot for ideas.
                </div>
              )}
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow small-eyebrow">YOUR TEAM</div>
                  <h2>Planning together</h2>
                </div>
              </div>
              {event.members.length ? (
                event.members.slice(0, 3).map((m) => (
                  <div key={m.id} className="member-mini">
                    <span className="avatar avatar-small">{m.name.slice(0, 1).toUpperCase()}</span>
                    <b>{m.name}</b>
                    <span>{m.role}</span>
                  </div>
                ))
              ) : (
                <div className="muted-text">Your event is saved on this device.</div>
              )}
            </section>
          </div>
          <section className="panel overview-next">
            <div className="panel-heading">
              <div>
                <div className="eyebrow small-eyebrow">COMING TOGETHER</div>
                <h2>Next milestones</h2>
              </div>
              <button className="text-button" onClick={() => setSection("Timeline & tasks")}>
                Open timeline <ArrowRight size={14} />
              </button>
            </div>
            {event.tasks.length ? (
              event.tasks.slice(0, 3).map((t) => (
                <div className="milestone" key={t.id}>
                  <span className={`milestone-dot ${t.done ? "complete" : ""}`} /> <b>{t.title}</b>
                  <span>{t.due ? niceDate(t.due) : "Date to decide"}</span>
                </div>
              ))
            ) : (
              <div className="inline-empty">
                Your timeline will come together as you add a few tasks.
              </div>
            )}
          </section>
        </div>
      )}
      {section === "Timeline & tasks" && (
        <ContentSection
          eyebrow="ONE THING AT A TIME"
          title="Timeline & tasks"
          text="Keep the next step clear, and the rest will follow."
          action="Add a task"
          onAdd={() => onModal("task")}
        >
          <div className="library-toolbar">
            <label className="filter-search">
              <Search size={16} />
              <input
                aria-label="Search tasks"
                placeholder="Find a task…"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
            </label>
            <select
              className="filter-select"
              aria-label="Filter tasks"
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
            >
              <option value="all">All tasks</option>
              <option value="open">To do</option>
              <option value="done">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="task-progress">
            <span>{completed} complete</span>
            <div className="progress-line">
              <i
                style={{
                  width: `${event.tasks.length ? (completed / event.tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span>{event.tasks.length} total</span>
          </div>
          {renderRows(
            tasks,
            "tasks",
            event.tasks.length
              ? "No tasks match your filters."
              : "No tasks yet. Add one here or create a starting plan with the Copilot.",
            (t) => (
              <>
                <button
                  className={`checkbox ${t.done ? "checked" : ""}`}
                  aria-label={`${t.done ? "Reopen" : "Complete"} ${t.title}`}
                  onClick={() => onToggle(t.id)}
                >
                  {t.done && <Check size={13} />}
                </button>
                <div className="row-main">
                  <b className={t.done ? "struck" : ""}>{t.title}</b>
                  <small>
                    {t.category || "Planning"} · {t.due ? niceDate(t.due) : "No due date"}
                  </small>
                </div>
                <span className={`pill ${t.done ? "pill-green" : "pill-neutral"}`}>
                  {t.done ? "Complete" : t.due && t.due < localDate() ? "Overdue" : "To do"}
                </span>
              </>
            ),
          )}
        </ContentSection>
      )}
      {section === "Budget" && (
        <ContentSection
          eyebrow="SPEND WITH INTENTION"
          title="Budget"
          text="Keep the plan grounded in what feels comfortable."
          action="Add budget item"
          onAdd={() => onModal("budget")}
        >
          <div className="budget-total">
            <div>
              <span className="stat-label">PLANNED</span>
              <b>{formatMoney(totalPlanned, money)}</b>
            </div>
            <div>
              <span className="stat-label">ACTUAL</span>
              <b>{formatMoney(totalActual, money)}</b>
            </div>
            <div>
              <span className="stat-label">EVENT BUDGET</span>
              <b>{formatMoney(event.budget, money)}</b>
            </div>
            <div className="budget-bar">
              <i
                style={{
                  width: `${event.budget ? Math.min(100, (totalPlanned / event.budget) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="stat-helper">
              {event.budget
                ? `${formatMoney(Math.abs(event.budget - totalPlanned), money)} ${totalPlanned > event.budget ? "over your event budget" : "left in your event budget"}`
                : "Set a total budget when editing event details"}
            </span>
          </div>
          {renderRows(
            event.budgetItems,
            "budgetItems",
            "Add your first budget item. Planned and actual spend stay easy to compare.",
            (b) => (
              <>
                <div className="row-main">
                  <b>{b.title}</b>
                  <small>{b.category}</small>
                </div>
                <div className="money-columns">
                  <span>{formatMoney(b.planned, money)} planned</span>
                  <label className="actual-input">
                    Actual{" "}
                    <input
                      aria-label={`Actual spend for ${b.title}`}
                      type="number"
                      step="any"
                      min="0"
                      value={b.actual}
                      onChange={(ev) =>
                        onEventPatch((e) => ({
                          ...e,
                          budgetItems: e.budgetItems.map((x) =>
                            x.id === b.id
                              ? { ...x, actual: Math.max(0, Number(ev.target.value) || 0) }
                              : x,
                          ),
                        }))
                      }
                    />
                  </label>
                </div>
              </>
            ),
          )}
        </ContentSection>
      )}
      {section === "Guests" && (
        <ContentSection
          eyebrow="THE PEOPLE WHO MAKE IT"
          title="Guests & RSVPs"
          text={`${rsvp} attending · ${event.guestsList.filter((g) => g.rsvp === "Pending").length} pending · ${event.guestsList.filter((g) => g.rsvp === "Declined").length} declined`}
          action="Add guest"
          onAdd={() => onModal("guest")}
        >
          <label className="filter-search">
            <Search size={16} />
            <input
              aria-label="Search guests"
              placeholder="Search names, email, or groups…"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
            />
          </label>
          <div className="rsvp-totals">
            <span>
              <b>{event.guestsList.length}</b> added
            </span>
            <span>
              <b>{rsvp}</b> attending
            </span>
            <span>
              <b>{event.guestsList.filter((g) => g.rsvp === "Pending").length}</b> pending
            </span>
          </div>
          {renderRows(
            event.guestsList.filter((g) =>
              `${g.name} ${g.email} ${g.group}`.toLowerCase().includes(guestSearch.toLowerCase()),
            ),
            "guestsList",
            "Your guest list is waiting to take shape. Add a guest to keep names and RSVP status together.",
            (g) => (
              <>
                <span className="avatar avatar-small guest-avatar">
                  {g.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="row-main">
                  <b>{g.name}</b>
                  <small>
                    {g.email || "No email added"} · {g.group || "Guest"}
                  </small>
                </div>
                <select
                  aria-label={`RSVP status for ${g.name}`}
                  className={`select-status ${g.rsvp === "Attending" ? "status-green" : ""}`}
                  value={g.rsvp}
                  onChange={(ev) => changeRsvp(g.id, ev.target.value as Guest["rsvp"])}
                >
                  <option>Pending</option>
                  <option>Attending</option>
                  <option>Declined</option>
                </select>
              </>
            ),
          )}
          <p className="fine-print">
            RSVP changes are saved on this device. Sending invitations and public RSVP links are not
            enabled yet.
          </p>
        </ContentSection>
      )}
      {section === "Vendors" && (
        <ContentSection
          eyebrow="PEOPLE WHO BRING IT TO LIFE"
          title="Vendors"
          text="Track your research, quotes, and the details worth comparing."
          action="Add vendor"
          onAdd={() => onModal("vendor")}
        >
          <div className="vendor-summary">
            <span>{event.vendors.length} services tracked</span>
            <span>
              Quote total{" "}
              <b>
                {formatMoney(
                  event.vendors.reduce((s, v) => s + v.quote, 0),
                  money,
                )}
              </b>
            </span>
          </div>
          {renderRows(
            event.vendors,
            "vendors",
            "Start a vendor shortlist. Add real quotes as you collect them; Kivora does not supply verified listings.",
            (v) => (
              <>
                <span className="vendor-symbol">{v.service.slice(0, 1).toUpperCase()}</span>
                <div className="row-main">
                  <b>{v.name}</b>
                  <small>
                    {v.service} · {v.contact || "Contact details not added"}
                  </small>
                </div>
                <span className="vendor-quote">
                  {v.quote ? formatMoney(v.quote, money) : "Quote pending"}
                </span>
                <select
                  aria-label={`Status for ${v.name}`}
                  className="select-status"
                  value={v.status}
                  onChange={(ev) => changeVendor(v.id, ev.target.value as Vendor["status"])}
                >
                  <option>Researching</option>
                  <option>Contacted</option>
                  <option>Shortlisted</option>
                  <option>Booked</option>
                </select>
              </>
            ),
          )}
        </ContentSection>
      )}
      {section === "Run sheet" && (
        <ContentSection
          eyebrow="THE DAY, AT A GLANCE"
          title="Event-day run sheet"
          text="Give the day a rhythm, with enough room for the moments in between."
          action="Add agenda item"
          onAdd={() => onModal("agenda")}
        >
          <div className="run-sheet-note">
            <CalendarDays size={16} />
            {niceDate(event.date)} <span>·</span> {event.location || "Venue to be confirmed"}
          </div>
          {renderRows(
            [...event.agenda].sort((a, b) => a.due.localeCompare(b.due)),
            "agenda",
            "Add moments to make an easy-to-follow run sheet. Times are saved with the event.",
            (a) => (
              <>
                <button
                  className={`checkbox ${a.done ? "checked" : ""}`}
                  aria-label={`${a.done ? "Reopen" : "Complete"} ${a.title}`}
                  onClick={() =>
                    onEventPatch((e) => ({
                      ...e,
                      agenda: e.agenda.map((item) =>
                        item.id === a.id ? { ...item, done: !item.done } : item,
                      ),
                    }))
                  }
                >
                  {a.done && <Check size={13} />}
                </button>
                <span className="time-block">{a.due || "--:--"}</span>
                <div className="row-main">
                  <b>{a.title}</b>
                  <small>{a.category || "Event moment"}</small>
                </div>
                <span className={`pill ${a.done ? "pill-green" : "pill-neutral"}`}>
                  {a.done ? "Ready" : "Planned"}
                </span>
              </>
            ),
          )}
        </ContentSection>
      )}
      {section === "Inspiration" && (
        <ContentSection
          eyebrow="SAVE THE FEELING"
          title="Inspiration"
          text="A place for the details, references, and ideas you want to remember."
          action="Save an idea"
          onAdd={() => onModal("note")}
        >
          <div className="inspiration-grid">
            {event.notes.length ? (
              event.notes.map((n) => (
                <article className="note-card" key={n.id}>
                  <div className="note-kind">{n.kind}</div>
                  <h3>{n.title}</h3>
                  <p>{n.text}</p>
                  <button className="text-button" onClick={() => onEdit("notes", n.id)}>
                    <Pencil size={14} />
                    Edit idea
                  </button>
                  <button
                    className="delete-button"
                    aria-label={`Remove ${n.title}`}
                    onClick={() => onRemove("notes", n.id)}
                  >
                    <X size={15} />
                  </button>
                </article>
              ))
            ) : (
              <div className="inline-empty full-width">
                Save a color palette, mood, link description, or anything you want your celebration
                to feel like.
              </div>
            )}
          </div>
        </ContentSection>
      )}
      {section === "Collaborators" && (
        <ContentSection
          eyebrow="PLAN AS A TEAM"
          title="Collaborators"
          text="Keep your planning team and responsibilities organized."
          action="Add team contact"
          onAdd={() => onModal("member")}
        >
          <div className="permission-callout">
            <Users size={18} />
            <p>
              This local workspace stores collaborator details on this device only. It does not send
              invitations or provide shared access across accounts.
            </p>
          </div>
          {event.members.length ? (
            <div className="list-rows">
              {event.members.map((m) => (
                <div className="list-row" key={m.id}>
                  <span className="avatar avatar-small guest-avatar">
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="row-main">
                    <b>{m.name}</b>
                    <small>{m.email || "Local team contact"} · role label only</small>
                  </div>
                  <span className={`pill ${m.role === "Editor" ? "pill-gold" : "pill-neutral"}`}>
                    {m.role}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${m.name}`}
                    onClick={() => onEdit("members", m.id)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Remove ${m.name}`}
                    onClick={() => onRemove("members", m.id)}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="inline-empty">No collaborators added yet.</div>
          )}
        </ContentSection>
      )}
    </>
  );
}
function ContentSection({
  eyebrow,
  title,
  text,
  action,
  onAdd,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="content-section">
      <div className="section-title-row">
        <div>
          <div className="eyebrow small-eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        {action && (
          <button className="button button-dark" onClick={onAdd}>
            <Plus size={16} />
            {action}
          </button>
        )}
      </div>
      <div className="panel content-panel">{children}</div>
    </section>
  );
}
