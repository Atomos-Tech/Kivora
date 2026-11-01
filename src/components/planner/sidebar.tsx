import { ChevronDown, Plus, Settings, X, type LucideIcon } from "lucide-react";
import { type RefObject } from "react";
import { type AppData, type EventPlan, localDate } from "@/lib/planner";
import { type View } from "@/lib/planner-navigation";

export function PlannerSidebar({
  navigationRef,
  isMobile,
  mobileNav,
  data,
  events,
  activeId,
  view,
  nav,
  storageError,
  onClose,
  onNavigate,
  onCreate,
  onOpen,
}: {
  navigationRef: RefObject<HTMLElement | null>;
  isMobile: boolean;
  mobileNav: boolean;
  data: AppData;
  events: EventPlan[];
  activeId: string;
  view: View;
  nav: { label: View; icon: LucideIcon }[];
  storageError: string;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  const avatar = (data.name || "P").slice(0, 1).toUpperCase();
  return (
    <aside
      ref={navigationRef}
      inert={isMobile && !mobileNav}
      aria-label="Workspace navigation"
      className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}
    >
      <button className="mobile-nav-close icon-button" aria-label="Close menu" onClick={onClose}>
        <X size={20} />
      </button>
      <div className="brand">
        <span className="brand-mark">k</span>
        <span>kivora</span>
      </div>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <button
        className="workspace-user"
        onClick={() => onNavigate("Settings")}
        aria-label="Customize workspace"
      >
        <span className="avatar">{avatar}</span>
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
            onClick={() => onNavigate(label)}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {label === "Notifications" &&
              data.events.some((event) =>
                event.tasks.some((task) => !task.done && task.due && task.due < localDate()),
              ) && <i className="nav-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-events">
        <div className="nav-label">
          YOUR EVENTS{" "}
          <button aria-label="Create event" onClick={onCreate}>
            <Plus size={15} />
          </button>
        </div>
        {events.slice(0, 4).map((event) => (
          <button
            key={event.id}
            className={`event-nav ${activeId === event.id && view === "My Events" ? "selected" : ""}`}
            onClick={() => onOpen(event.id)}
          >
            <span className="event-dot" />
            {event.name}
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
          <span className="avatar avatar-small">{avatar}</span>
          <span>
            <b>{data.name || "Planner"}</b>
            <small>{data.preferences.workspace}</small>
          </span>
          <button aria-label="Open settings" onClick={() => onNavigate("Settings")}>
            <Settings size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
