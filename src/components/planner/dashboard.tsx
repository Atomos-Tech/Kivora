import { usePlannerFormatting } from "@/hooks/use-planner-formatting";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  Heart,
  Plus,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import { type ReactNode } from "react";

import { TemplateGallery } from "@/components/planner/workspace";
import { type AppData, type EventPlan, eventDateValue } from "@/lib/planner";

import { type View } from "@/lib/planner-navigation";
export function Dashboard({
  data,
  events,
  active,
  onCreate,
  onEvent,
  onToggle,
  onNavigate,
  onTemplate,
  money,
}: {
  data: AppData;
  events: EventPlan[];
  active?: EventPlan | undefined;
  onCreate: () => void;
  onEvent: (id: string) => void;
  onToggle: (id: string) => void;
  onNavigate: (view: View) => void;
  onTemplate: (id: string) => void;
  money: string;
}) {
  const { formatMoney, niceDate } = usePlannerFormatting();
  const tasks = events.flatMap((e) => e.tasks.map((t) => ({ ...t, event: e })));
  const openTasks = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  const currencyEvents = events.filter((e) => e.currency === money);
  const multipleCurrencies = new Set(events.map((e) => e.currency)).size > 1;
  const planned = currencyEvents.reduce(
    (sum, e) => sum + e.budgetItems.reduce((s, b) => s + b.planned, 0),
    0,
  );
  const spent = currencyEvents.reduce(
    (sum, e) => sum + e.budgetItems.reduce((s, b) => s + b.actual, 0),
    0,
  );
  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            {new Date()
              .toLocaleDateString(data.preferences.locale || undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </div>
          <h1>
            Make room for
            <br className="mobile-only" /> the moment<span className="period">.</span>
          </h1>
          <p className="lead">
            {data.name !== "Planner" ? `${data.name}, a` : "A"} little clarity goes a long way.
            Here’s what’s taking shape.
          </p>
        </div>
        <button className="button button-dark" onClick={onCreate}>
          <Plus size={16} />
          Plan an event
        </button>
      </div>
      {data.preferences.showStats && (
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
            label="PEOPLE ON THE LIST"
            value={String(events.reduce((n, e) => n + e.guestsList.length, 0)).padStart(2, "0")}
            helper="Across all your events"
            icon={<Users />}
          />
          <Stat
            label={multipleCurrencies ? `PLANNED SPEND · ${money}` : "PLANNED SPEND"}
            value={formatMoney(planned, money)}
            helper={
              multipleCurrencies
                ? `${money} events only · other currencies kept separate`
                : planned
                  ? `Actual spend ${formatMoney(spent, money)}`
                  : "Your budget, at a glance"
            }
            icon={<CircleDollarSign />}
          />
        </section>
      )}
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
                        ? new Date(`${e.date}T12:00:00Z`).toLocaleDateString(
                            data.preferences.locale || undefined,
                            {
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            },
                          )
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
      {data.preferences.showTemplates && <TemplateGallery compact onSelect={onTemplate} />}
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
