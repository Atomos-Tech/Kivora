import { useIsMobile } from "@/hooks/use-mobile";
import { FormattingProvider } from "@/components/planner/formatting";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Plus,
  Printer,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EventLibrary, MonthCalendar, TemplateGallery } from "@/components/planner/workspace";
import {
  type AppData,
  type BudgetItem,
  type EventPlan,
  type Guest,
  type Member,
  type Note,
  type Preferences,
  type Task,
  type Vendor,
  downloadFile,
  emptyEvent,
  emptyWorkspace,
  eventDateValue,
  eventFromTemplate,
  guestExport,
  localDate,
  newId,
  parseWorkspace,
} from "@/lib/planner";

import {
  type Collection,
  type Section,
  type View,
  sections,
  modalTitle,
} from "@/lib/planner-navigation";
import { Dashboard } from "./dashboard";
import { EventView } from "./event-detail";
import { AppLoading, CreateForm, Modal } from "./forms";
import { CopilotView, InspirationHub, Notifications } from "./planning-tools";
import { SettingsView } from "./settings";
const nav: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Events", icon: CalendarDays },
  { label: "Templates", icon: Lightbulb },
  { label: "Calendar", icon: CalendarDays },
  { label: "Planning Copilot", icon: Sparkles },
  { label: "Inspiration Studio", icon: Heart },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];
const STORE_KEY = "kivora.local.v1";
export function Kivora() {
  const [data, setData] = useState<AppData>(emptyWorkspace);
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
  const [editing, setEditing] = useState<{ key: Collection; id: string } | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const isMobile = useIsMobile();
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileNav || !isMobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getButtons = () =>
      Array.from(
        navigationRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") || [],
      );
    getButtons()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const buttons = getButtons(),
        first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [mobileNav, isMobile]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [storageError, setStorageError] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [undo, setUndo] = useState<AppData | null>(null);
  const [restore, setRestore] = useState<AppData | null>(null);
  const lastSaved = useRef<string | null>(null);
  const [toast, setToast] = useState("");
  const [generated, setGenerated] = useState(false);
  const active = data.events.find((e) => e.id === activeId);
  const money = active?.currency || data.preferences.currency;
  const upcoming = useMemo(
    () => [...data.events].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")),
    [data.events],
  );
  const update = (fn: (current: AppData) => AppData) => {
    setUndo(null);
    setData(fn);
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      lastSaved.current = raw;
      if (raw) setData(parseWorkspace(JSON.parse(raw)));
    } catch {
      setStorageBlocked(true);
      setStorageError(
        "Your saved workspace could not be read. It has not been overwritten. Download the original data or restore a valid backup in Settings.",
      );
    }
    const params = new URLSearchParams(window.location.search);
    const nextView = params.get("view");
    if (nav.some((item) => item.label === nextView)) setView(nextView as View);
    setActiveId(params.get("event") || "");
    const nextSection = params.get("section");
    if (sections.includes(nextSection as Section)) setSection(nextSection as Section);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || storageBlocked) return;
    try {
      const existing = localStorage.getItem(STORE_KEY);
      if (existing !== lastSaved.current) {
        setStorageBlocked(true);
        setStorageError(
          "This workspace changed in another tab. Download your current work, then reload to use the latest saved version.",
        );
        return;
      }
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORE_KEY, serialized);
      lastSaved.current = serialized;
      setStorageError("");
    } catch {
      setStorageError(
        "Changes could not be saved on this device. Download a backup before leaving this page.",
      );
    }
  }, [data, loaded, storageBlocked]);
  useEffect(() => {
    const p = data.preferences;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset["theme"] = p.theme === "system" ? (media.matches ? "dark" : "light") : p.theme;
    };
    apply();
    root.dataset["accent"] = p.accent;
    root.dataset["density"] = p.density;
    root.dataset["locale"] = p.locale;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data.preferences]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (event.key === "Escape") setMobileNav(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
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
    update((d) => ({ ...d, events: d.events.map((e) => (e.id === active.id ? fn(e) : e)) }));
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
  const createTask = (eventId: string, title: string, due: string, category: string) => {
    update((d) => ({
      ...d,
      events: d.events.map((e) =>
        e.id === eventId && !e.tasks.some((t) => t.title === title)
          ? { ...e, tasks: [...e.tasks, { id: newId(), title, due, category, done: false }] }
          : e,
      ),
    }));
    setToast("Suggestion added to your event’s tasks.");
  };
  const toggleTask = (id: string) =>
    patchEvent((e) => ({
      ...e,
      tasks: e.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  const removeItem = (
    key: "tasks" | "budgetItems" | "guestsList" | "vendors" | "agenda" | "notes" | "members",
    id: string,
  ) => {
    patchEvent((e) => ({ ...e, [key]: e[key].filter((item) => item.id !== id) }));
    setUndo(data);
    setToast("Item removed. You can undo this change.");
  };
  const navigate = (next: View) => {
    setView(next);
    if (next === "My Events") setActiveId("");
    setMobileNav(false);
  };
  const exportBackup = () => {
    downloadFile(
      JSON.stringify({ ...data, version: 1, exportedAt: new Date().toISOString() }, null, 2),
      `kivora-backup-${localDate()}.json`,
      "application/json",
    );
    setToast("Backup downloaded to this device.");
  };
  const chooseTemplate = (id: string) => {
    setEditing(null);
    setTemplateId(id);
    setModal("event");
  };
  const changePreferences = (patch: Partial<Preferences>) =>
    update((d) => ({ ...d, preferences: { ...d.preferences, ...patch } }));
  const importBackup = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("File too large");
      setRestore(parseWorkspace(JSON.parse(await file.text())));
    } catch {
      setToast("This backup is invalid or exceeds 10 MB. Your current workspace has not changed.");
    }
  };
  const toggleAnyTask = (id: string) =>
    update((d) => ({
      ...d,
      events: d.events.map((e) => ({
        ...e,
        tasks: e.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      })),
    }));
  const duplicateEvent = () => {
    if (!active) return;
    const copy = structuredClone(active);
    copy.id = newId();
    copy.name = `${copy.name} (copy)`;
    copy.date = "";
    copy.tasks = copy.tasks.map((t) => ({ ...t, id: newId(), done: false, due: "" }));
    copy.budgetItems = copy.budgetItems.map((b) => ({ ...b, id: newId(), actual: 0 }));
    copy.guestsList = [];
    copy.members = [];
    copy.vendors = copy.vendors.map((v) => ({ ...v, id: newId(), status: "Researching" }));
    copy.agenda = copy.agenda.map((t) => ({ ...t, id: newId(), done: false }));
    copy.notes = copy.notes.map((n) => ({ ...n, id: newId() }));
    addEvent(copy);
    setToast("Event copied with fresh tasks. Guest and collaborator lists start empty.");
  };
  const deleteEvent = () => {
    if (!active || !window.confirm(`Delete “${active.name}” and its planning details?`)) return;
    update((d) => ({ ...d, events: d.events.filter((e) => e.id !== active.id) }));
    setUndo(data);
    setActiveId("");
    setToast("Event deleted. You can undo this change.");
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
    setUndo(data);
    setData((current) => ({ ...current, events: [] }));
    setActiveId("");
    setToast("Your events have been deleted.");
  };
  if (!loaded) return <AppLoading />;

  return (
    <FormattingProvider locale={data.preferences.locale}>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <aside
          ref={navigationRef}
          inert={isMobile && !mobileNav}
          aria-label="Workspace navigation"
          className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}
        >
          <button
            className="mobile-nav-close icon-button"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
          <div className="brand">
            <span className="brand-mark">k</span>
            <span>kivora</span>
          </div>
          <div className="workspace-label">YOUR WORKSPACE</div>
          <button
            className="workspace-user"
            onClick={() => navigate("Settings")}
            aria-label="Customize workspace"
          >
            <span className="avatar">{(data.name || "P").slice(0, 1).toUpperCase()}</span>
            <span className="user-copy">
              <b>{data.name || "Planner"}</b>
              <small>{data.preferences.workspace}</small>
            </span>
            <ChevronDown size={15} />
          </button>
          <div className="nav-label">PLANNING</div>
          <nav>
            {nav.map(({ label, icon: Icon }) => (
              <button
                className={`nav-item ${view === label ? "active" : ""}`}
                key={label}
                aria-current={view === label ? "page" : undefined}
                onClick={() => navigate(label)}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {label === "Notifications" &&
                  data.events.some((e) =>
                    e.tasks.some((t) => !t.done && t.due && t.due < localDate()),
                  ) && <i className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-events">
            <div className="nav-label">
              YOUR EVENTS{" "}
              <button
                aria-label="Create event"
                onClick={() => {
                  setEditing(null);
                  setModal("event");
                }}
              >
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
              {storageError ? "Changes need attention" : "Saved on this device"}
            </div>
            <div className="profile-row">
              <span className="avatar avatar-small">
                {(data.name || "P").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <b>{data.name || "Planner"}</b>
                <small>{data.preferences.workspace}</small>
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
        <main className="main-area" inert={isMobile && mobileNav}>
          <header className="topbar">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={mobileNav}
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
              <button
                className="search search-trigger"
                onClick={() => setSearchOpen(true)}
                aria-label="Search workspace"
              >
                <Search size={16} />
                <span>Search anything…</span>
                <kbd>⌘ / Ctrl K</kbd>
              </button>
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
          <div className="page-content" id="main-content" tabIndex={-1}>
            {storageError && (
              <div className="storage-alert" role="alert">
                <span>{storageError}</span>
                <button className="button button-light" onClick={exportBackup}>
                  Download current work
                </button>
                {storageBlocked && (
                  <button
                    className="button button-light"
                    onClick={() => {
                      try {
                        downloadFile(
                          localStorage.getItem(STORE_KEY) || "",
                          "kivora-original-data.json",
                          "application/json",
                        );
                      } catch {
                        setToast("Original data is unavailable in this browser.");
                      }
                    }}
                  >
                    Download original data
                  </button>
                )}
              </div>
            )}
            {view === "Templates" && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">LESS BLANK PAGE. MORE POSSIBILITY.</div>
                    <h1>
                      Make it your own<span className="period">.</span>
                    </h1>
                    <p className="lead">A head start for whatever brings your people together.</p>
                  </div>
                  <button
                    className="button button-light"
                    onClick={() => {
                      setEditing(null);
                      setModal("event");
                    }}
                  >
                    <Plus size={16} />
                    Start from scratch
                  </button>
                </div>
                <TemplateGallery onSelect={chooseTemplate} />
              </>
            )}

            {view === "Dashboard" && (
              <Dashboard
                data={data}
                events={upcoming}
                active={active}
                onCreate={() => setModal("event")}
                onEvent={openEvent}
                onToggle={toggleAnyTask}
                onTemplate={chooseTemplate}
                onNavigate={navigate}
                money={active?.currency || upcoming[0]?.currency || data.preferences.currency}
              />
            )}
            {view === "My Events" &&
              (active ? (
                <>
                  <div className="event-utility">
                    <button className="text-button" onClick={() => setActiveId("")}>
                      ← All events
                    </button>
                    <div>
                      <button className="button button-light" onClick={duplicateEvent}>
                        <Copy size={15} />
                        Duplicate
                      </button>
                      <button
                        className="button button-light"
                        onClick={() =>
                          downloadFile(
                            guestExport(active),
                            "kivora-guests.csv",
                            "text/csv;charset=utf-8",
                          )
                        }
                      >
                        <Download size={15} />
                        Guest CSV
                      </button>
                      <button className="button button-light" onClick={() => window.print()}>
                        <Printer size={15} />
                        Print
                      </button>
                      <button
                        className="icon-button danger-icon"
                        aria-label="Delete event"
                        onClick={deleteEvent}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                  <EventView
                    key={active.id}
                    event={active}
                    section={section}
                    setSection={setSection}
                    money={money}
                    onModal={(next) => {
                      setEditing(null);
                      setModal(next);
                    }}
                    onEdit={(key, id) => {
                      setEditing({ key, id });
                      const modals = {
                        tasks: "task",
                        budgetItems: "budget",
                        guestsList: "guest",
                        vendors: "vendor",
                        agenda: "agenda",
                        notes: "note",
                        members: "member",
                      } as const;
                      setModal(modals[key]);
                    }}
                    onToggle={toggleTask}
                    onRemove={removeItem}
                    onEventPatch={patchEvent}
                    onToast={setToast}
                    onCopilot={() => navigate("Planning Copilot")}
                    query=""
                  />
                </>
              ) : (
                <EventLibrary
                  events={data.events}
                  onOpen={openEvent}
                  onCreate={() => setModal("event")}
                  onTemplate={chooseTemplate}
                />
              ))}
            {view === "Calendar" && (
              <MonthCalendar
                events={upcoming}
                weekStart={data.preferences.weekStart}
                locale={data.preferences.locale}
                onEvent={(id, tasks) => openEvent(id, tasks ? "Timeline & tasks" : "Overview")}
              />
            )}
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
              <Notifications
                events={upcoming}
                onEvent={(id) => openEvent(id, "Timeline & tasks")}
              />
            )}
            {view === "Settings" && (
              <SettingsView
                data={data}
                onChange={(name) => void saveProfileName(name)}
                onExport={exportBackup}
                onReset={() => void clearOwnedEvents()}
                onPreferences={changePreferences}
                onImport={importBackup}
              />
            )}
          </div>
        </main>
        {searchOpen && (
          <Modal
            title="Find your next step"
            onClose={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          >
            <label className="command-input">
              <Search size={20} />
              <input
                autoFocus
                aria-label="Search workspace records"
                placeholder="Events, tasks, guests, vendors, ideas…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="command-results">
              {!query.trim() && (
                <>
                  <span className="eyebrow">QUICK ACTIONS</span>
                  {nav.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.label);
                        setSearchOpen(false);
                      }}
                    >
                      <item.icon size={17} />
                      <span>{item.label}</span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </>
              )}
              {query.trim() &&
                (() => {
                  const results = data.events
                    .flatMap((event) => [
                      { id: event.id, title: event.name, section: "Overview" as Section, event },
                      ...event.tasks.map((t) => ({
                        id: t.id,
                        title: t.title,
                        section: "Timeline & tasks" as Section,
                        event,
                      })),
                      ...event.guestsList.map((g) => ({
                        id: g.id,
                        title: g.name,
                        section: "Guests" as Section,
                        event,
                      })),
                      ...event.vendors.map((v) => ({
                        id: v.id,
                        title: v.name,
                        section: "Vendors" as Section,
                        event,
                      })),
                      ...event.notes.map((n) => ({
                        id: n.id,
                        title: n.title,
                        section: "Inspiration" as Section,
                        event,
                      })),
                      ...event.budgetItems.map((b) => ({
                        id: b.id,
                        title: b.title,
                        section: "Budget" as Section,
                        event,
                      })),
                    ])
                    .filter((r) =>
                      `${r.title} ${r.event.name} ${r.event.location}`
                        .toLowerCase()
                        .includes(query.toLowerCase().trim()),
                    );
                  return results.length ? (
                    <>
                      <span className="eyebrow">{results.length} RESULTS</span>
                      {results.slice(0, 30).map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            openEvent(result.event.id, result.section);
                            setSearchOpen(false);
                            setQuery("");
                          }}
                        >
                          <Search size={16} />
                          <span>
                            <b>{result.title}</b>
                            <small>
                              {result.event.name} · {result.section}
                            </small>
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="command-empty">
                      <Search size={28} />
                      <h3>No matches yet</h3>
                      <p>Try an event name, a person, or a planning detail.</p>
                    </div>
                  );
                })()}
            </div>
            <p className="fine-print">
              Use Tab to move through results, Enter to open, and Escape to close.
            </p>
          </Modal>
        )}
        {restore && (
          <Modal title="Restore this workspace?" onClose={() => setRestore(null)}>
            <p className="lead">
              This backup contains {restore.events.length} events for {restore.name}. Restoring
              replaces the current workspace and its preferences.
            </p>
            <p>Download your current backup first if you want to keep both versions.</p>
            <div className="modal-actions">
              <button className="button button-light" onClick={exportBackup}>
                Download current backup
              </button>
              <button
                className="button button-dark"
                onClick={() => {
                  try {
                    const serialized = JSON.stringify(restore);
                    localStorage.setItem(STORE_KEY, serialized);
                    lastSaved.current = serialized;
                    setUndo(data);
                    setData(restore);
                    setRestore(null);
                    setStorageBlocked(false);
                    setStorageError("");
                    setActiveId("");
                    setView("Dashboard");
                    setToast("Workspace restored successfully.");
                  } catch {
                    setToast("Restore could not be saved. Your current workspace has not changed.");
                  }
                }}
              >
                Restore workspace
              </button>
            </div>
          </Modal>
        )}
        {undo && (
          <div className="undo-bar">
            <span>Last change can be undone</span>
            <button
              onClick={() => {
                setData(undo);
                setUndo(null);
                setToast("Change undone.");
              }}
            >
              <Undo2 size={16} />
              Undo
            </button>
            <button aria-label="Dismiss undo" onClick={() => setUndo(null)}>
              <X size={16} />
            </button>
          </div>
        )}
        {modal && (
          <Modal
            title={modalTitle(modal)}
            onClose={() => {
              setModal(null);
              setTemplateId("");
            }}
          >
            <CreateForm
              type={modal}
              currency={modal === "event" ? data.preferences.currency : money}
              templateId={templateId}
              initialValues={
                editing && active
                  ? Object.fromEntries(
                      Object.entries(
                        active[editing.key].find((item) => item.id === editing.id) || {},
                      ).map(([key, value]) => [key, String(value)]),
                    )
                  : undefined
              }
              initialEvent={modal === "editEvent" ? active : undefined}
              onCancel={() => {
                setModal(null);
                setTemplateId("");
                setEditing(null);
              }}
              onSubmit={(value) => {
                if (modal === "event") {
                  addEvent(
                    eventFromTemplate(templateId, {
                      ...(value as Parameters<typeof emptyEvent>[0]),
                      date: eventDateValue(value["date"]),
                    }),
                  );
                  setTemplateId("");
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
                if (editing) {
                  patchEvent((e) => ({
                    ...e,
                    [editing.key]: e[editing.key].map((item) =>
                      item.id === editing.id ? { ...item, ...value, id: item.id } : item,
                    ),
                  }));
                  setEditing(null);
                  setModal(null);
                  setToast("Details updated.");
                  return;
                }
                const id = newId();
                if (modal === "task")
                  patchEvent((e) => ({
                    ...e,
                    tasks: [
                      ...e.tasks,
                      { id, ...(value as Omit<Task, "id" | "done">), done: false },
                    ],
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
    </FormattingProvider>
  );
}
