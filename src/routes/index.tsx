import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Compass,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  Wallet,
  WandSparkles,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Kivora });

type View =
  | "Dashboard"
  | "My Events"
  | "Calendar"
  | "Planning Copilot"
  | "Inspiration Studio"
  | "Notifications"
  | "Settings";
type Section =
  | "Overview"
  | "Timeline & tasks"
  | "Budget"
  | "Guests"
  | "Vendors"
  | "Run sheet"
  | "Inspiration"
  | "Collaborators";

const nav: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Events", icon: CalendarDays },
  { label: "Calendar", icon: CalendarDays },
  { label: "Planning Copilot", icon: Sparkles },
  { label: "Inspiration Studio", icon: Heart },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];
const sections: Section[] = [
  "Overview",
  "Timeline & tasks",
  "Budget",
  "Guests",
  "Vendors",
  "Run sheet",
  "Inspiration",
  "Collaborators",
];
const STORE_KEY = "kivora.local.v1";
type Task = { id: string; title: string; due: string; done: boolean; category: string };
type BudgetItem = { id: string; title: string; category: string; planned: number; actual: number };
type Guest = {
  id: string;
  name: string;
  email: string;
  group: string;
  rsvp: "Pending" | "Attending" | "Declined";
};
type Vendor = {
  id: string;
  name: string;
  service: string;
  contact: string;
  quote: number;
  status: "Researching" | "Contacted" | "Shortlisted" | "Booked";
};
type Note = { id: string; title: string; text: string; kind: string };
type Member = { id: string; name: string; email: string; role: "Editor" | "Viewer" };
type EventPlan = {
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
type AppData = { name: string; events: EventPlan[] };
function readData(): AppData {
  try {
    const value = localStorage.getItem(STORE_KEY);
    if (value) return JSON.parse(value) as AppData;
  } catch {
    /* Ignore invalid local data. */
  }
  return { name: "Planner", events: [] };
}
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyEvent = (input: {
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
const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
const eventDateValue = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? "" : value;
};
const niceDate = (date: string) => {
  if (!eventDateValue(date)) return "Date to be decided";
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

function Kivora() {
  const [data, setData] = useState<AppData>({ name: "Planner", events: [] });
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("Dashboard");
  const [activeId, setActiveId] = useState("");
  const [section, setSection] = useState<Section>("Overview");
  const [modal, setModal] = useState<
    | "event"
    | "editEvent"
    | "task"
    | "budget"
    | "guest"
    | "vendor"
    | "note"
    | "member"
    | "agenda"
    | null
  >(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [generated, setGenerated] = useState(false);
  const active = data.events.find((e) => e.id === activeId) ?? data.events[0];
  const money = active?.currency || "INR";
  const upcoming = useMemo(
    () => [...data.events].sort((a, b) => a.date.localeCompare(b.date)),
    [data.events],
  );
  const update = (fn: (current: AppData) => AppData) => setData(fn);
  useEffect(() => {
    setData(readData());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!activeId && data.events[0]) setActiveId(data.events[0].id);
  }, [activeId, data.events]);
  useEffect(() => {
    if (!loaded) return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    if (view === "My Events" && active) {
      url.searchParams.set("event", active.id);
      url.searchParams.set("section", section);
    } else {
      url.searchParams.delete("event");
      url.searchParams.delete("section");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [active, loaded, section, view]);
  const patchEvent = (fn: (event: EventPlan) => EventPlan) => {
    if (!active) return;
    const next = fn(active);
    update((d) => ({ ...d, events: d.events.map((e) => (e.id === active.id ? next : e)) }));
  };
  const openEvent = (id: string, tab: Section = "Overview") => {
    setActiveId(id);
    setSection(tab);
    setView("My Events");
    setMobileNav(false);
  };
  const addEvent = (e: EventPlan) => {
    update((d) => ({ ...d, events: [...d.events, e] }));
    setActiveId(e.id);
    setView("My Events");
    setSection("Overview");
    setModal(null);
    setToast("Event saved on this device.");
  };
  const createTask = (title: string, due: string, category: string) =>
    patchEvent((e) => ({
      ...e,
      tasks: [...e.tasks, { id: newId(), title, due, category, done: false }],
    }));
  const toggleTask = (id: string) =>
    patchEvent((e) => ({
      ...e,
      tasks: e.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  const removeItem = (
    key: "tasks" | "budgetItems" | "guestsList" | "vendors" | "agenda" | "notes" | "members",
    id: string,
  ) => patchEvent((e) => ({ ...e, [key]: e[key].filter((item) => item.id !== id) }));
  const navigate = (next: View) => {
    setView(next);
    setMobileNav(false);
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kivora-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setToast("Backup downloaded to this device.");
  };

  const saveProfileName = (name: string) => {
    update((current) => ({ ...current, name }));
    setToast("Profile updated.");
  };

  const clearOwnedEvents = () => {
    if (
      !window.confirm(
        "Delete every event and local workspace record from this browser? This cannot be undone.",
      )
    )
      return;
    setData((current) => ({ ...current, events: [] }));
    setActiveId("");
    setToast("Your events have been deleted.");
  };
  if (!loaded) return <AppLoading message="Loading your planning space…" />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">k</span>
          <span>kivora</span>
        </div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <div className="workspace-user">
          <span className="avatar">{(data.name || "P").slice(0, 1).toUpperCase()}</span>
          <span className="user-copy">
            <b>{data.name || "Planner"}</b>
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">PLANNING</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${view === label ? "active" : ""}`}
              key={label}
              onClick={() => navigate(label)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Notifications" &&
                active &&
                active.tasks.some(
                  (t) => !t.done && t.due && t.due < new Date().toISOString().slice(0, 10),
                ) && <i className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-events">
          <div className="nav-label">
            YOUR EVENTS{" "}
            <button aria-label="Create event" onClick={() => setModal("event")}>
              <Plus size={15} />
            </button>
          </div>
          {upcoming.slice(0, 4).map((e) => (
            <button
              key={e.id}
              className={`event-nav ${active?.id === e.id && view === "My Events" ? "selected" : ""}`}
              onClick={() => openEvent(e.id)}
            >
              <span className="event-dot" />
              {e.name}
            </button>
          ))}
          {!data.events.length && <small className="muted">Your events will appear here</small>}
        </div>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="local-dot" />
            Saved on this device
          </div>
          <div className="profile-row">
            <span className="avatar avatar-small">
              {(data.name || "P").slice(0, 1).toUpperCase()}
            </span>
            <span>
              <b>{data.name || "Planner"}</b>
              <small>Personal workspace</small>
            </span>
            <button aria-label="Open settings" onClick={() => navigate("Settings")}>
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ArrowRight size={13} />
            <b>{view === "My Events" && active ? active.name : view}</b>
            {view === "My Events" && active && (
              <>
                <ArrowRight size={13} />
                <span>{section}</span>
              </>
            )}
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={15} />
              <input
                placeholder="Search your plans"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button
              aria-label="Notifications"
              className="icon-button"
              onClick={() => navigate("Notifications")}
            >
              <Bell size={18} />
            </button>
            <button
              className="avatar avatar-top"
              onClick={() => navigate("Settings")}
              aria-label="Profile settings"
            >
              {(data.name || "P").slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <div className="page-content">
          {view === "Dashboard" && (
            <Dashboard
              data={data}
              events={upcoming}
              active={active}
              onCreate={() => setModal("event")}
              onEvent={openEvent}
              onToggle={toggleTask}
              onNavigate={navigate}
              money={money}
            />
          )}
          {view === "My Events" &&
            (active ? (
              <EventView
                key={active.id}
                event={active}
                section={section}
                setSection={setSection}
                money={money}
                onModal={setModal}
                onToggle={toggleTask}
                onRemove={removeItem}
                onEventPatch={patchEvent}
                onToast={setToast}
                onCopilot={() => navigate("Planning Copilot")}
                query={query}
              />
            ) : (
              <EmptyEvents onCreate={() => setModal("event")} />
            ))}
          {view === "Calendar" && <CalendarView events={upcoming} onEvent={openEvent} />}
          {view === "Planning Copilot" && (
            <CopilotView
              event={active}
              events={upcoming}
              onChoose={openEvent}
              onCreateTask={createTask}
              generated={generated}
              onGenerated={() => setGenerated(true)}
              onCreateEvent={() => setModal("event")}
            />
          )}
          {view === "Inspiration Studio" && (
            <InspirationHub
              events={upcoming}
              onChoose={openEvent}
              onAdd={() => {
                if (active) {
                  setSection("Inspiration");
                  setView("My Events");
                  setModal("note");
                } else setModal("event");
              }}
            />
          )}
          {view === "Notifications" && (
            <Notifications events={upcoming} onEvent={(id) => openEvent(id, "Timeline & tasks")} />
          )}
          {view === "Settings" && (
            <SettingsView
              data={data}
              onChange={(name) => void saveProfileName(name)}
              onExport={exportBackup}
              onReset={() => void clearOwnedEvents()}
            />
          )}
        </div>
      </main>
      {modal && (
        <Modal title={modalTitle(modal)} onClose={() => setModal(null)}>
          <CreateForm
            type={modal}
            currency={money}
            initialEvent={modal === "editEvent" ? active : undefined}
            onCancel={() => setModal(null)}
            onSubmit={(value) => {
              if (modal === "event") {
                addEvent(
                  emptyEvent({
                    ...(value as Parameters<typeof emptyEvent>[0]),
                    date: eventDateValue(value["date"]),
                  }),
                );
                return;
              }
              if (modal === "editEvent") {
                if (!active) return;
                patchEvent((e) => ({
                  ...e,
                  name: String(value["name"]),
                  type: String(value["type"]),
                  date: eventDateValue(value["date"]),
                  location: String(value["location"]),
                  guests: Number(value["guests"]) || 0,
                  budget: Number(value["budget"]) || 0,
                  currency: String(value["currency"]),
                }));
                setModal(null);
                setToast("Event details updated.");
                return;
              }
              if (!active) return;
              const id = newId();
              if (modal === "task")
                patchEvent((e) => ({
                  ...e,
                  tasks: [...e.tasks, { id, ...(value as Omit<Task, "id" | "done">), done: false }],
                }));
              if (modal === "budget")
                patchEvent((e) => ({
                  ...e,
                  budgetItems: [...e.budgetItems, { id, ...(value as Omit<BudgetItem, "id">) }],
                }));
              if (modal === "guest")
                patchEvent((e) => ({
                  ...e,
                  guestsList: [
                    ...e.guestsList,
                    { id, ...(value as Omit<Guest, "id" | "rsvp">), rsvp: "Pending" },
                  ],
                }));
              if (modal === "vendor")
                patchEvent((e) => ({
                  ...e,
                  vendors: [
                    ...e.vendors,
                    { id, ...(value as Omit<Vendor, "id" | "status">), status: "Researching" },
                  ],
                }));
              if (modal === "note")
                patchEvent((e) => ({
                  ...e,
                  notes: [...e.notes, { id, ...(value as Omit<Note, "id">) }],
                }));
              if (modal === "agenda")
                patchEvent((e) => ({
                  ...e,
                  agenda: [
                    ...e.agenda,
                    { id, ...(value as Omit<Task, "id" | "done">), done: false },
                  ],
                }));
              if (modal === "member") {
                patchEvent((e) => ({
                  ...e,
                  members: [...e.members, { id, ...(value as Omit<Member, "id">) }],
                }));
                setToast("Added to this local planning workspace. No invitation was sent.");
              }
              setModal(null);
            }}
          />
        </Modal>
      )}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={17} />
          {toast}
          <button aria-label="Dismiss" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  data,
  events,
  active,
  onCreate,
  onEvent,
  onToggle,
  onNavigate,
  money,
}: {
  data: AppData;
  events: EventPlan[];
  active?: EventPlan | undefined;
  onCreate: () => void;
  onEvent: (id: string) => void;
  onToggle: (id: string) => void;
  onNavigate: (view: View) => void;
  money: string;
}) {
  const tasks = events.flatMap((e) => e.tasks.map((t) => ({ ...t, event: e })));
  const openTasks = tasks.filter((t) => !t.done);
  const planned = events.reduce(
    (sum, e) => sum + e.budgetItems.reduce((s, b) => s + b.planned, 0),
    0,
  );
  const spent = events.reduce((sum, e) => sum + e.budgetItems.reduce((s, b) => s + b.actual, 0), 0);
  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            {new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`)
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })
              .toUpperCase()}
          </div>
          <h1>
            Make room for
            <br className="mobile-only" /> the moment<span className="period">.</span>
          </h1>
          <p className="lead">A little clarity goes a long way. Here’s what’s taking shape.</p>
        </div>
        <button className="button button-dark" onClick={onCreate}>
          <Plus size={16} />
          Plan an event
        </button>
      </div>
      <section className="stat-grid">
        <Stat
          label="EVENTS IN MOTION"
          value={String(events.length).padStart(2, "0")}
          helper={
            events.length
              ? "Your celebrations, in one place"
              : "Start with something worth celebrating"
          }
          icon={<CalendarDays />}
        />
        <Stat
          label="OPEN TO-DOS"
          value={String(openTasks.length).padStart(2, "0")}
          helper={
            openTasks.length
              ? `${tasks.filter((t) => t.done).length} already taken care of`
              : "A clear slate feels good"
          }
          icon={<ClipboardList />}
        />
        <Stat
          label="GUESTS INVITED"
          value={String(events.reduce((n, e) => n + e.guestsList.length, 0)).padStart(2, "0")}
          helper="Across all your events"
          icon={<Users />}
        />
        <Stat
          label="PLANNED SPEND"
          value={formatMoney(planned, money)}
          helper={
            planned ? `Actual spend ${formatMoney(spent, money)}` : "Your budget, at a glance"
          }
          icon={<CircleDollarSign />}
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel events-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow small-eyebrow">IN THE MAKING</div>
              <h2>Your events</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("My Events")}>
              See all <ArrowRight size={14} />
            </button>
          </div>
          {events.length ? (
            <div className="event-cards">
              {events.slice(0, 3).map((e, i) => (
                <button
                  className={`event-card event-card-${i % 3}`}
                  key={e.id}
                  onClick={() => onEvent(e.id)}
                >
                  <div className="event-card-top">
                    <span>{e.type}</span>
                    <span>
                      {eventDateValue(e.date)
                        ? new Date(`${e.date}T12:00:00Z`).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })
                        : "DATE TBD"}
                    </span>
                  </div>
                  <div className="event-card-title">{e.name}</div>
                  <div className="event-card-bottom">
                    <span>{e.location || "Location to be decided"}</span>
                    <span className="arrow-circle">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                  <div className="event-card-progress">
                    <span
                      style={{
                        width: `${e.tasks.length ? Math.round((e.tasks.filter((t) => t.done).length / e.tasks.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-art">
                <Heart size={27} />
              </div>
              <h3>Every good plan starts somewhere.</h3>
              <p>Start with the date, the people, or just the feeling you want the day to have.</p>
              <button className="button button-dark" onClick={onCreate}>
                <Plus size={15} />
                Create your first event
              </button>
            </div>
          )}
        </section>
        <section className="panel next-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow small-eyebrow">A GENTLE NUDGE</div>
              <h2>Up next</h2>
            </div>
            <button
              className="round-action"
              onClick={() => onNavigate("Planning Copilot")}
              aria-label="Open planning copilot"
            >
              <WandSparkles size={17} />
            </button>
          </div>
          {openTasks.length ? (
            <div className="up-next-list">
              {openTasks.slice(0, 4).map((t) => (
                <div className="up-next" key={t.id}>
                  <button
                    className="checkbox"
                    aria-label={`Complete ${t.title}`}
                    onClick={() => onToggle(t.id)}
                  >
                    <span />
                  </button>
                  <div>
                    <b>{t.title}</b>
                    <small>
                      {t.event.name} · {t.due ? niceDate(t.due) : "No due date"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="up-next-empty">
              <div className="check-art">
                <Check size={20} />
              </div>
              <h3>Nothing pressing.</h3>
              <p>Take a breath. You’re right where you need to be.</p>
              <button className="text-button" onClick={() => onNavigate("Planning Copilot")}>
                Explore ideas <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div className="copilot-hint">
            <Sparkles size={17} />
            <span>
              <b>Need a little direction?</b>
              <small>Your planning copilot can help you find a starting point.</small>
            </span>
            <button
              onClick={() => onNavigate("Planning Copilot")}
              aria-label="Ask planning copilot"
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
      {active && (
        <div className="dashboard-footer">
          <span className="muted">Keep the important things close.</span>
          <button className="text-button" onClick={() => onEvent(active.id)}>
            Continue planning {active.name}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </>
  );
}
function Stat({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-helper">{helper}</div>
    </div>
  );
}

function EventView({
  event,
  section,
  setSection,
  money,
  onModal,
  onToggle,
  onRemove,
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
  onEventPatch: (fn: (event: EventPlan) => EventPlan) => void;
  onToast: (s: string) => void;
  onCopilot: () => void;
  query: string;
}) {
  const tasks = event.tasks.filter((t) =>
    `${t.title} ${t.category}`.toLowerCase().includes(query.toLowerCase()),
  );
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
      <div className="event-tabs" role="tablist">
        {sections.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={section === s}
            className={section === s ? "selected" : ""}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
      </div>
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
            "No tasks yet. Add one here or create a thoughtful starting plan with the Copilot.",
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
                  {t.done ? "Complete" : "To do"}
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
                ? `${formatMoney(Math.max(0, event.budget - totalPlanned), money)} left in your event budget`
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
                      min="0"
                      value={b.actual}
                      onChange={(ev) =>
                        onEventPatch((e) => ({
                          ...e,
                          budgetItems: e.budgetItems.map((x) =>
                            x.id === b.id ? { ...x, actual: Number(ev.target.value) } : x,
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
            event.guestsList,
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
          action=""
          onAdd={() => undefined}
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
                    <small>Event access</small>
                  </div>
                  <span className={`pill ${m.role === "Editor" ? "pill-gold" : "pill-neutral"}`}>
                    {m.role}
                  </span>
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

function CopilotView({
  event,
  events,
  onChoose,
  onCreateTask,
  generated,
  onGenerated,
  onCreateEvent,
}: {
  event?: EventPlan | undefined;
  events: EventPlan[];
  onChoose: (id: string, tab?: Section) => void;
  onCreateTask: (title: string, due: string, category: string) => void;
  generated: boolean;
  onGenerated: () => void;
  onCreateEvent: () => void;
}) {
  const [selected, setSelected] = useState(event?.id || "");
  const [interest, setInterest] = useState("");
  const chosen = events.find((e) => e.id === selected) || event;
  const suggestions = useMemo(() => {
    if (!chosen) return [];
    const daysLeft = chosen.date
      ? Math.max(
          1,
          Math.ceil((new Date(`${chosen.date}T12:00:00`).getTime() - Date.now()) / 86400000),
        )
      : 120;
    const early = daysLeft > 120;
    const eventType = chosen.type.toLowerCase();
    const list = eventType.includes("wedding")
      ? [
          "Set a comfortable total budget",
          "Start a guest list and agree on a first draft",
          "Research ceremony and reception venues",
          "Decide what matters most to you as a couple",
          "Collect quotes for food, photography, and music",
        ]
      : eventType.includes("birthday")
        ? [
            "Set a guest count and choose a date",
            "Pick a place that fits the kind of gathering you want",
            "Plan food and drinks around your guests",
            "Choose one personal detail to make it feel special",
            "Confirm setup, music, and day-of helpers",
          ]
        : [
            "Clarify the purpose and shape of the gathering",
            "Choose a date, location, and weather backup",
            "Estimate attendance and accessibility needs",
            "Coordinate volunteers and event-day roles",
            "Plan food, supplies, and cleanup",
          ];
    if (interest) list.unshift(`Make room for: ${interest}`);
    return early
      ? list
      : list
          .slice(0, 4)
          .map((item) => item.replace("Start a guest list", "Confirm the guest list"));
  }, [chosen, interest]);
  return (
    <>
      <div className="copilot-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />A THOUGHTFUL START, NOT A FINAL ANSWER
          </div>
          <h1>
            Let’s find your
            <br className="mobile-only" /> starting point<span className="period">.</span>
          </h1>
          <p className="lead">
            A few good questions can turn a big idea into a plan you can work with.
          </p>
        </div>
        <div className="copilot-orb">
          <Sparkles size={34} strokeWidth={1.2} />
        </div>
      </div>
      <div className="copilot-layout">
        <section className="panel copilot-form">
          <div className="panel-heading">
            <div>
              <div className="eyebrow small-eyebrow">YOUR PLANNING BRIEF</div>
              <h2>What are we celebrating?</h2>
            </div>
          </div>
          <label className="field-label">
            Choose an event
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                onGenerated();
              }}
            >
              <option value="">Choose an event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.type}
                </option>
              ))}
            </select>
          </label>
          {!events.length && (
            <div className="inline-empty">
              <button className="text-button" onClick={onCreateEvent}>
                Create an event first <ArrowRight size={14} />
              </button>
            </div>
          )}
          <label className="field-label">
            What matters most to you?
            <span className="field-hint">
              A feeling, a practical concern, or something you want people to remember
            </span>
            <textarea
              rows={3}
              placeholder="A relaxed garden dinner where everyone feels at home…"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            />
          </label>
          {chosen && (
            <div className="brief-facts">
              <span>
                <CalendarDays size={15} />
                {niceDate(chosen.date)}
              </span>
              <span>
                <Users size={15} />
                {chosen.guests || "Guest count TBD"}
              </span>
              <span>
                <Wallet size={15} />
                {chosen.budget ? formatMoney(chosen.budget, chosen.currency) : "Budget TBD"}
              </span>
            </div>
          )}
          <button
            className="button button-dark full-button"
            disabled={!chosen}
            onClick={onGenerated}
          >
            <Sparkles size={16} />
            {generated ? "Refresh planning ideas" : "Find my starting point"}
          </button>
          <p className="fine-print">
            Suggestions are generated from simple planning prompts in your browser. This is not
            connected to an AI model and should be reviewed for your situation.
          </p>
        </section>
        <section className="panel suggestions-panel">
          <div className="eyebrow small-eyebrow">A FIRST DRAFT, JUST FOR YOU</div>
          {generated && chosen ? (
            <>
              <h2>Somewhere to begin.</h2>
              <p className="suggestions-intro">
                A manageable starting list for <b>{chosen.name}</b>. Adjust dates, priorities, and
                estimates as you go.
              </p>
              <div className="suggestion-list">
                {suggestions.map((s, i) => (
                  <div className="suggestion" key={`${s}-${i}`}>
                    <span className="suggestion-num">0{i + 1}</span>
                    <span>{s}</span>
                    <button
                      aria-label={`Add ${s} to tasks`}
                      title="Add to timeline"
                      onClick={() => {
                        onChoose(chosen.id, "Timeline & tasks");
                        onCreateTask(s, "", "Copilot suggestion");
                      }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="assumption-box">
                <Lightbulb size={16} />
                <span>
                  Start with what you know. This draft does not include real vendor prices,
                  availability, or legal requirements.
                </span>
              </div>
              <button
                className="button button-light"
                onClick={() => onChoose(chosen.id, "Timeline & tasks")}
              >
                Review your timeline <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <div className="suggestions-empty">
              <div className="sparkle-art">
                <Sparkles size={24} />
              </div>
              <h3>Your next steps will feel clearer.</h3>
              <p>
                Choose an event, share what matters to you, and we’ll shape a starter list that you
                can make your own.
              </p>
              <div className="copilot-steps">
                <span>
                  <i>1</i> Choose the celebration
                </span>
                <span>
                  <i>2</i> Share what matters
                </span>
                <span>
                  <i>3</i> Shape your plan
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function CalendarView({ events, onEvent }: { events: EventPlan[]; onEvent: (id: string) => void }) {
  const items = events
    .flatMap((e) => [
      ...e.tasks
        .filter((t) => !t.done && t.due)
        .map((t) => ({ date: t.due, title: t.title, type: "Task", event: e })),
      ...(eventDateValue(e.date)
        ? [{ date: e.date, title: e.name, type: "Celebration", event: e }]
        : []),
    ])
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            SEE THE BIG PICTURE
          </div>
          <h1>
            Your calendar<span className="period">.</span>
          </h1>
          <p className="lead">A simple view of the dates that keep your plans moving.</p>
        </div>
      </div>
      <section className="panel calendar-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow small-eyebrow">UPCOMING DATES</div>
            <h2>{items.length} things on the horizon</h2>
          </div>
        </div>
        {items.length ? (
          <div className="calendar-list">
            {items.map((it, i) => (
              <button
                className="calendar-item"
                key={`${it.event.id}-${it.title}-${i}`}
                onClick={() => onEvent(it.event.id)}
              >
                <span className="calendar-date">
                  <b>
                    {new Date(`${it.date}T12:00:00`).toLocaleDateString(undefined, {
                      day: "2-digit",
                    })}
                  </b>
                  <small>
                    {new Date(`${it.date}T12:00:00`)
                      .toLocaleDateString(undefined, { month: "short" })
                      .toUpperCase()}
                  </small>
                </span>
                <span className="calendar-copy">
                  <b>{it.title}</b>
                  <small>
                    {it.event.name} · {it.type}
                  </small>
                </span>
                <span className="calendar-full-date">{niceDate(it.date)}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <CalendarDays size={27} />
            <h3>Your dates will find their place.</h3>
            <p>Add an event date or task deadline to see it here.</p>
          </div>
        )}
      </section>
    </>
  );
}
function InspirationHub({
  events,
  onChoose,
  onAdd,
}: {
  events: EventPlan[];
  onChoose: (id: string, tab: Section) => void;
  onAdd: () => void;
}) {
  const allNotes = events.flatMap((e) => e.notes.map((n) => ({ ...n, event: e })));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            COLLECT THE DETAILS
          </div>
          <h1>
            Inspiration studio<span className="period">.</span>
          </h1>
          <p className="lead">
            Hold on to the colors, words, and little things that make it feel like yours.
          </p>
        </div>
        <button className="button button-dark" onClick={onAdd}>
          <Plus size={16} />
          Save an idea
        </button>
      </div>
      <div className="inspo-feature">
        <div className="inspo-quote">
          “The best celebrations feel
          <br /> like the people in them.”<span>Make space for your own kind of magic.</span>
        </div>
        <div className="inspo-shapes">
          <span className="shape shape-1" />
          <span className="shape shape-2" />
          <span className="shape shape-3" />
          <span className="shape shape-4" />
        </div>
      </div>
      {allNotes.length ? (
        <div className="hub-note-grid">
          {allNotes.map((n) => (
            <button
              className="hub-note"
              key={n.id}
              onClick={() => onChoose(n.event.id, "Inspiration")}
            >
              <span>
                {n.kind} · {n.event.name}
              </span>
              <b>{n.title}</b>
              <small>{n.text}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="panel empty-inspo">
          <Heart size={23} />
          <h2>Collect what feels like you.</h2>
          <p>
            Save a mood, a detail, or an idea in an event’s Inspiration tab. Your notes stay here on
            this device.
          </p>
          <button className="button button-light" onClick={onAdd}>
            Start a collection <ArrowRight size={15} />
          </button>
        </div>
      )}
    </>
  );
}
function Notifications({
  events,
  onEvent,
}: {
  events: EventPlan[];
  onEvent: (id: string) => void;
}) {
  const due = events.flatMap((e) =>
    e.tasks
      .filter((t) => !t.done && t.due && t.due < new Date().toISOString().slice(0, 10))
      .map((t) => ({ e, t })),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />A QUIET CHECK-IN
          </div>
          <h1>
            Notifications<span className="period">.</span>
          </h1>
          <p className="lead">Helpful reminders from the plans you’ve saved here.</p>
        </div>
      </div>
      <section className="panel notification-panel">
        {due.length ? (
          due.map(({ e, t }) => (
            <button
              className="notification-row"
              key={`${e.id}-${t.id}`}
              onClick={() => onEvent(e.id)}
            >
              <span className="notification-icon">
                <Bell size={17} />
              </span>
              <span>
                <b>{t.title} is past its planned date</b>
                <small>
                  {e.name} · Due {niceDate(t.due)}
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))
        ) : (
          <div className="empty-state compact">
            <CheckCircle2 size={27} />
            <h3>All quiet for now.</h3>
            <p>
              Overdue open tasks will show up here. We won’t send notifications outside this
              browser.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
function SettingsView({
  data,
  onChange,
  onExport,
  onReset,
}: {
  data: AppData;
  onChange: (name: string) => void;
  onExport: () => void;
  onReset: () => void;
}) {
  const [name, setName] = useState(data.name);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            YOUR SPACE, YOUR WAY
          </div>
          <h1>
            Settings<span className="period">.</span>
          </h1>
          <p className="lead">A few details to make this workspace feel like yours.</p>
        </div>
      </div>
      <div className="settings-stack">
        <section className="panel settings-panel">
          <div className="settings-copy">
            <h2>Your profile</h2>
            <p>Your name is saved on this device.</p>
          </div>
          <form
            className="settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              onChange(name.trim() || "Planner");
            }}
          >
            <label className="field-label">
              Display name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </label>
            <button className="button button-dark">Save changes</button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="settings-copy">
            <h2>Your data</h2>
            <p>Your plans are stored on this device. Export a copy before deleting your events.</p>
          </div>
          <div className="settings-buttons">
            <button className="button button-light" onClick={onExport}>
              <ArrowDownToLine size={16} />
              Download backup
            </button>
            <span className="storage-count">
              {data.events.length} event{data.events.length === 1 ? "" : "s"} saved
            </span>
          </div>
        </section>
        <section className="panel settings-panel">
          <div className="settings-copy">
            <h2>Clear local workspace</h2>
            <p>Remove all event data saved on this browser.</p>
          </div>
          <button className="button button-danger" onClick={onReset}>
            Clear local workspace
          </button>
        </section>
        <div className="local-warning">
          <span className="local-dot" />
          Local mode is enabled. Secure sign-in, cross-device sync, and shared access need a
          configured backend.
        </div>
      </div>
    </>
  );
}
function EmptyEvents({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-events">
      <div className="empty-art">
        <CalendarDays size={28} />
      </div>
      <div className="eyebrow">
        <span className="eyebrow-line" />
        MADE FOR THE MOMENTS THAT MATTER
      </div>
      <h1>
        Every good plan
        <br />
        starts somewhere<span className="period">.</span>
      </h1>
      <p className="lead">
        A wedding, a birthday, a long-overdue get-together. Give it a name, and we’ll help you take
        the next step.
      </p>
      <button className="button button-dark" onClick={onCreate}>
        <Plus size={16} />
        Create your first event
      </button>
    </div>
  );
}

function AppLoading({ message }: { message: string }) {
  return (
    <main className="app-loading">
      <span className="brand-mark">k</span>
      <p>{message}</p>
    </main>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <div className="eyebrow small-eyebrow">A SMALL STEP FORWARD</div>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function modalTitle(type: string) {
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
function CreateForm({
  type,
  currency,
  initialEvent,
  onCancel,
  onSubmit,
}: {
  type:
    "event" | "editEvent" | "task" | "budget" | "guest" | "vendor" | "note" | "member" | "agenda";
  currency: string;
  initialEvent?: EventPlan | undefined;
  onCancel: () => void;
  onSubmit: (value: Record<string, string | number>) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    type: "Birthday",
    currency,
    category: "Planning",
    rsvp: "Pending",
    status: "Researching",
    role: "Editor",
    kind: "Mood",
    due: "",
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
  });
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const handle = (e: FormEvent) => {
    e.preventDefault();
    const numberKeys = ["guests", "budget", "planned", "actual", "quote"];
    const normalized: Record<string, string | number> = { ...form };
    numberKeys.forEach((key) => {
      if (key in normalized) normalized[key] = Number(normalized[key]) || 0;
    });
    if (type === "event" || type === "editEvent") {
      normalized["guests"] = Number(form["guests"]) || 0;
      normalized["budget"] = Number(form["budget"]) || 0;
    }
    if (type === "budget") normalized["actual"] = Number(form["actual"]) || 0;
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
        type={options.type || "text"}
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
      <select value={form[key] || choices[0]} onChange={(e) => set(key, e.target.value)}>
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
        <div className="form-grid">
          {input("name", "Event name", { required: true, placeholder: "Sam’s 30th birthday" })}
          {select("type", "What are we celebrating?", [
            "Birthday",
            "Wedding",
            "Anniversary",
            "Community gathering",
            "Family celebration",
            "Other",
          ])}
        </div>
        <div className="form-grid">
          {input("date", "Date", { type: "date", required: true })}
          {input("location", "Location", { placeholder: "City, venue, or still deciding" })}
        </div>
        <div className="form-grid">
          {input("guests", "Estimated guest count", { type: "number", min: "0" })}
          {input("budget", "Total event budget", { type: "number", min: "0" })}
          {select("currency", "Currency", ["USD", "INR", "GBP", "EUR", "CAD", "AUD"])}
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
