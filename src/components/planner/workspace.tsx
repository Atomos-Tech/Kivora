import {
  type EventPlan,
  type Preferences,
  calendarExport,
  currencies,
  downloadFile,
  localDate,
  templates,
} from "@/lib/planner";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { usePlannerFormatting } from "@/hooks/use-planner-formatting";

export function TemplateGallery({
  onSelect,
  compact = false,
}: {
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <section className="template-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A LITTLE INSPIRATION</span>
          <h2>Start with a feeling.</h2>
          <p>Thoughtful starting points. Entirely yours to make.</p>
        </div>
        <span className="subtle-badge">
          <Sparkles size={14} /> Ready-to-use checklists
        </span>
      </div>
      <div className={`template-grid ${compact ? "template-compact" : ""}`}>
        {templates.map((template, i) => (
          <button
            className={`template-card ${template.className}`}
            key={template.id}
            onClick={() => onSelect(template.id)}
          >
            <div className="template-art" aria-hidden="true">
              <div className="art-orbit" />
              <div className="art-shape art-one" />
              <div className="art-shape art-two" />
              <div className="art-shape art-three" />
              <span className="art-number">0{i + 1}</span>
              <span className="art-caption">{template.type}</span>
            </div>
            <div className="template-copy">
              <span className="eyebrow">{template.tag}</span>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <span className="template-cta">
                Make it yours <ArrowRight size={16} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function EventLibrary({
  events,
  onOpen,
  onCreate,
  onTemplate,
}: {
  events: EventPlan[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onTemplate: (id: string) => void;
}) {
  const { formatMoney, niceDate } = usePlannerFormatting();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date");
  const today = localDate();
  const filtered = events
    .filter(
      (e) =>
        `${e.name} ${e.type} ${e.location}`.toLowerCase().includes(query.toLowerCase()) &&
        (filter === "all" ||
          (filter === "upcoming" ? !e.date || e.date >= today : e.date && e.date < today)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (a.date || "9999").localeCompare(b.date || "9999"),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE REASONS WE GATHER</div>
          <h1>
            Your events<span className="period">.</span>
          </h1>
          <p className="lead">Big occasions and just-because moments, all in one place.</p>
        </div>
        <button className="button button-dark" onClick={onCreate}>
          <Plus size={17} />
          Plan an event
        </button>
      </div>
      <div className="library-toolbar">
        <label className="filter-search">
          <Search size={17} />
          <input
            aria-label="Search events"
            placeholder="Find an event…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="segmented" aria-label="Filter events">
          {["all", "upcoming", "past"].map((value) => (
            <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <SlidersHorizontal size={15} />
          <select aria-label="Sort events" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">By date</option>
            <option value="name">By name</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="library-grid">
          {filtered.map((event, index) => {
            const done = event.tasks.filter((t) => t.done).length;
            const progress = event.tasks.length ? Math.round((done / event.tasks.length) * 100) : 0;
            return (
              <button
                className={`library-card library-color-${index % 4}`}
                key={event.id}
                onClick={() => onOpen(event.id)}
              >
                <div className="library-card-top">
                  <span className="pill">{event.type}</span>
                  <ArrowRight size={20} />
                </div>
                <h2>{event.name}</h2>
                <div className="library-detail">
                  <CalendarDays size={16} />
                  {niceDate(event.date)}
                </div>
                <div className="library-detail">
                  <MapPin size={16} />
                  {event.location || "Location to be decided"}
                </div>
                <div className="library-metrics">
                  <span>
                    <Users size={15} />
                    {event.guestsList.length} guests added
                  </span>
                  <span>{formatMoney(event.budget, event.currency)}</span>
                </div>
                <div className="progress-line">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <div className="library-progress">
                  <span>
                    {done} of {event.tasks.length} tasks complete
                  </span>
                  <b>{progress}%</b>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="panel library-empty">
          <CalendarDays size={32} />
          <h2>{events.length ? "No events match just yet." : "Something worth celebrating?"}</h2>
          <p>
            {events.length
              ? "Try another search or filter to find your plans."
              : "Choose a starting point below, or create an event from scratch."}
          </p>
          <button
            className="button button-dark"
            onClick={
              events.length
                ? () => {
                    setQuery("");
                    setFilter("all");
                  }
                : onCreate
            }
          >
            {events.length ? "Clear filters" : "Create an event"}
          </button>
        </div>
      )}
      <TemplateGallery onSelect={onTemplate} />
    </>
  );
}

export function WorkspaceSettings({
  preferences,
  onChange,
}: {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}) {
  const p = preferences;
  return (
    <>
      <section className="panel preference-panel">
        <div className="settings-copy">
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>Look & feel</h2>
          <p>Choose the palette and pace that feel right for you. Changes save automatically.</p>
        </div>
        <div className="preference-grid">
          <fieldset>
            <legend>Appearance</legend>
            <div className="choice-row">
              {(["light", "dark", "system"] as const).map((theme) => (
                <button
                  className={`theme-option theme-${theme}`}
                  key={theme}
                  aria-pressed={p.theme === theme}
                  onClick={() => onChange({ theme })}
                >
                  <span className="theme-preview">
                    <i />
                    <i />
                    <i />
                  </span>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  {p.theme === theme && <Check size={14} />}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Accent color</legend>
            <div className="choice-row">
              {(["plum", "forest", "ocean"] as const).map((accent) => (
                <button
                  className={`accent-choice accent-${accent}`}
                  key={accent}
                  aria-pressed={p.accent === accent}
                  onClick={() => onChange({ accent })}
                >
                  <span>{p.accent === accent && <Check size={14} />}</span>
                  {accent.charAt(0).toUpperCase() + accent.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field-label">
            Layout density
            <select
              value={p.density}
              onChange={(e) => onChange({ density: e.target.value as Preferences["density"] })}
            >
              <option value="comfortable">Comfortable — room to breathe</option>
              <option value="compact">Compact — more on screen</option>
            </select>
          </label>
          <label className="field-label">
            Workspace name
            <input
              maxLength={60}
              value={p.workspace}
              onChange={(e) => onChange({ workspace: e.target.value || "Personal workspace" })}
            />
          </label>
        </div>
      </section>
      <section className="panel preference-panel">
        <div className="settings-copy">
          <h2>Your region, your rhythm</h2>
          <p>Dates and amounts follow your preferred region. Each event keeps its own currency.</p>
        </div>
        <div className="preference-grid">
          <label className="field-label">
            Date & number format
            <select value={p.locale} onChange={(e) => onChange({ locale: e.target.value })}>
              <option value="">Use device region</option>
              {[
                ["en-US", "English · United States"],
                ["en-GB", "English · United Kingdom"],
                ["en-IN", "English · India"],
                ["fr-FR", "French · France"],
                ["de-DE", "German · Germany"],
                ["es-ES", "Spanish · Spain"],
                ["pt-BR", "Portuguese · Brazil"],
                ["ja-JP", "Japanese · Japan"],
                ["ar-AE", "Arabic · UAE"],
                ["zh-CN", "Chinese · China"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Default event currency
            <select value={p.currency} onChange={(e) => onChange({ currency: e.target.value })}>
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Week starts on
            <select
              value={p.weekStart}
              onChange={(e) => onChange({ weekStart: e.target.value as Preferences["weekStart"] })}
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </label>
        </div>
        <p className="fine-print">
          Interface language: English. Regional formats do not translate the interface.
        </p>
      </section>
      <section className="panel preference-panel">
        <div className="settings-copy">
          <h2>A dashboard that works for you</h2>
          <p>Keep the things you use most in view.</p>
        </div>
        <label className="toggle-row">
          <span>
            <b>Workspace overview</b>
            <small>Event, task, guest, and budget totals</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={p.showStats}
            onChange={(e) => onChange({ showStats: e.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>
            <b>Template inspiration</b>
            <small>Starting points for your next gathering</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={p.showTemplates}
            onChange={(e) => onChange({ showTemplates: e.target.checked })}
          />
        </label>
      </section>
    </>
  );
}

export function MonthCalendar({
  events,
  weekStart,
  locale,
  onEvent,
}: {
  events: EventPlan[];
  weekStart: Preferences["weekStart"];
  locale: string;
  onEvent: (id: string, tasks?: boolean) => void;
}) {
  const { niceDate } = usePlannerFormatting();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(localDate());
  const [mode, setMode] = useState("month");
  const entries = events
    .flatMap((event) => [
      ...(event.date
        ? [{ id: event.id, date: event.date, title: event.name, event, task: false }]
        : []),
      ...event.tasks
        .filter((t) => !t.done && t.due)
        .map((t) => ({ id: t.id, date: t.due, title: t.title, event, task: true })),
    ])
    .sort((a, b) => a.date.localeCompare(b.date));
  const offset = (month.getDay() + (weekStart === "monday" ? 6 : 0)) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
  const cells = Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
  const visible = entries.filter((e) =>
    mode === "agenda" ? e.date.slice(0, 7) === localDate(month).slice(0, 7) : e.date === selected,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SPACE FOR WHAT MATTERS</div>
          <h1>
            Your calendar<span className="period">.</span>
          </h1>
          <p className="lead">The celebrations and small steps that bring them to life.</p>
        </div>
        <button
          className="button button-light"
          disabled={!entries.length}
          onClick={() =>
            downloadFile(
              calendarExport(events),
              "kivora-calendar.ics",
              "text/calendar;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          Export calendar
        </button>
      </div>
      <section className="panel month-panel">
        <div className="calendar-toolbar">
          <div className="calendar-month-controls">
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft size={19} />
            </button>
            <h2>
              {month.toLocaleDateString(locale || undefined, { month: "long", year: "numeric" })}
            </h2>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight size={19} />
            </button>
          </div>
          <button
            className="button button-light"
            onClick={() => {
              setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
              setSelected(localDate());
            }}
          >
            Today
          </button>
          <div className="segmented">
            {["month", "agenda"].map((m) => (
              <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m === "month" ? "Month" : "Agenda"}
              </button>
            ))}
          </div>
        </div>
        {mode === "month" && (
          <div className="month-grid">
            {cells.slice(0, 7).map((date) => (
              <div key={localDate(date)} className="weekday">
                {date.toLocaleDateString(locale || undefined, { weekday: "short" })}
              </div>
            ))}
            {cells.map((date) => {
              const key = localDate(date);
              const daily = entries.filter((e) => e.date === key);
              return (
                <button
                  key={key}
                  className={`month-cell ${date.getMonth() !== month.getMonth() ? "outside" : ""} ${key === localDate() ? "today" : ""} ${key === selected ? "chosen" : ""}`}
                  aria-label={`${niceDate(key)}, ${daily.length} items`}
                  aria-pressed={selected === key}
                  onClick={() => setSelected(key)}
                >
                  <span className="day-number">{date.getDate()}</span>
                  {daily.slice(0, 2).map((entry) => (
                    <span
                      key={entry.id}
                      className={`calendar-chip ${entry.task ? "task-chip" : ""}`}
                    >
                      {entry.title}
                    </span>
                  ))}
                  {daily.length > 2 && <small>+{daily.length - 2} more</small>}
                  {daily.length > 0 && <i className="mobile-day-dot" />}
                </button>
              );
            })}
          </div>
        )}
        <div className="calendar-agenda">
          <h3>{mode === "agenda" ? "This month" : niceDate(selected)}</h3>
          {visible.length ? (
            visible.map((entry) => (
              <button
                key={entry.id}
                className="calendar-entry"
                onClick={() => onEvent(entry.event.id, entry.task)}
              >
                <span className={`agenda-type ${entry.task ? "task-type" : ""}`}>
                  {entry.task ? <Check size={18} /> : <CalendarDays size={18} />}
                </span>
                <span>
                  <b>{entry.title}</b>
                  <small>
                    {entry.event.name} · {entry.task ? "Task deadline" : "Celebration"}
                    {mode === "agenda" ? ` · ${niceDate(entry.date)}` : ""}
                  </small>
                </span>
                <ArrowRight size={17} />
              </button>
            ))
          ) : (
            <p className="muted">
              Nothing scheduled {mode === "agenda" ? "this month" : "for this day"}. A little
              breathing room.
            </p>
          )}
        </div>
      </section>
      <p className="fine-print">
        Calendar exports include all dated events and open tasks. Import the .ics file into your
        calendar app; future changes require a new export.
      </p>
    </>
  );
}
